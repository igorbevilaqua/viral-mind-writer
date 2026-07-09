import { appDb } from "../db";
import { loadContext } from "./context";
import { analyzeModelagem } from "./modelagem";
import { research, proposeNarratives, rankNarratives, designHook, writeComando } from "./agents";
import { generateDraft, parseSections } from "./draft";
import { critiqueAndRewrite } from "./critique";
import { humanize } from "./humanize";
import { blockCount } from "./slop-lint";
import { APP_VERSION, GIT_SHA } from "../version";
import type { PipelineEvent, SessionArtifacts } from "./types";

// Sala de agentes (DAG com 1 negociação):
// pesquisa (Grok) → storytelling propõe narrativas → dados rankeia → vencedora
// → roteirista escreve o corpo → hook ∥ comando → revisão → humanização.
// Artefatos (dossiê/candidatas/ranking) são cacheados em vm_sessions.artifacts:
// regenerar ou trocar a narrativa (narrativeIndex) não re-paga pesquisa+storytelling.
export async function runPipeline(
  sessionId: string,
  emit: (e: PipelineEvent) => void,
  opts: { narrativeIndex?: number; feedback?: string } = {}
): Promise<void> {
  // registra a última fase emitida → o catch sabe onde o pipeline morreu (pra debug de print)
  let currentPhase = "init";
  const rawEmit = emit;
  emit = (e) => {
    if (e.type === "phase") currentPhase = e.phase;
    rawEmit(e);
  };
  try {
    await appDb.from("vm_sessions").update({ status: "generating" }).eq("id", sessionId);

    const ctx = await loadContext(sessionId);

    const modelagens = ctx.attachments.filter((a) => a.is_modelagem && a.raw_content);
    if (modelagens.length) {
      emit({ type: "phase", phase: "modelagem" });
      ctx.modelagemBriefs = (
        await Promise.all(modelagens.map((a) => analyzeModelagem(a, ctx.prompt)))
      ).filter(Boolean);
    }

    // ── Pesquisa + narrativas + ranking (só na primeira geração da sessão) ──
    let artifacts: SessionArtifacts | null = ctx.artifacts;
    if (!artifacts?.candidatas?.length) {
      emit({ type: "phase", phase: "pesquisa" });
      const dossie = await research(ctx);

      emit({ type: "phase", phase: "narrativas" });
      const candidatas = await proposeNarratives(ctx, dossie);
      const rank = await rankNarratives(ctx, dossie, candidatas);
      const valid = rank.ranking.filter((r) => candidatas[r.indice]);
      const vencedora = valid.length ? [...valid].sort((a, b) => b.score - a.score)[0].indice : 0;

      artifacts = {
        dossie,
        candidatas,
        ranking: rank.ranking,
        escolhida: vencedora,
        orientacao_roteiro: rank.orientacao_roteiro,
        orientacao_hook: rank.orientacao_hook,
      };
    }

    // Override do usuário: troca a narrativa vencedora e reescreve a partir daqui
    if (opts.narrativeIndex != null && artifacts.candidatas[opts.narrativeIndex]) {
      artifacts.escolhida = opts.narrativeIndex;
    }
    ctx.artifacts = artifacts;
    await appDb.from("vm_sessions").update({ artifacts }).eq("id", sessionId);
    emit({ type: "narrativas", candidatas: artifacts.candidatas, ranking: artifacts.ranking, escolhida: artifacts.escolhida });

    // Reescrita orientada: feedback do usuário + versão anterior como base
    let revision: { anterior: string; feedback: string } | undefined;
    if (opts.feedback) {
      const { data: prev } = await appDb
        .from("vm_generated_scripts")
        .select("roteiro, comando")
        .eq("session_id", sessionId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prev) {
        revision = {
          anterior: `${prev.roteiro}${prev.comando ? `\n\nCOMANDO: ${prev.comando}` : ""}`,
          feedback: opts.feedback,
        };
      }
    }

    // ── Roteirista-chefe escreve o corpo (streaming) ──
    emit({ type: "phase", phase: "roteiro" });
    const { headline, corpo, fontes } = await generateDraft(ctx, (t) => emit({ type: "token", text: t }), revision);

    // ── Hook e comando em paralelo, ambos vendo o roteiro pronto ──
    emit({ type: "phase", phase: "hook_comando" });
    const [hookRes, comando] = await Promise.all([designHook(ctx, corpo), writeComando(ctx, corpo)]);

    const assembled = [
      `## HEADLINE\n${headline ?? ""}`,
      `## HOOK\n${hookRes.hook}`,
      `## ROTEIRO\n${hookRes.hook}\n\n${corpo}`,
      `## VARIACOES_DE_HOOK\n${hookRes.variantes.map((v, i) => `${i + 1}. ${v}`).join("\n")}`,
      `## COMANDO\n${comando}`,
      `## FONTES\n${fontes ?? ""}`,
    ].join("\n\n");

    emit({ type: "phase", phase: "revisao" });
    const revised = await critiqueAndRewrite(ctx, assembled);

    emit({ type: "phase", phase: "humanizacao" });
    const { text: final, violations } = await humanize(ctx, revised);

    emit({ type: "phase", phase: "salvando" });
    const sections = parseSections(final);

    const { count } = await appDb
      .from("vm_generated_scripts")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);

    const narrativa = artifacts.candidatas[artifacts.escolhida];
    const { data: saved, error } = await appDb
      .from("vm_generated_scripts")
      .insert({
        session_id: sessionId,
        client_id: ctx.clientId,
        version: (count ?? 0) + 1,
        headline: sections.headline,
        hook: sections.hook,
        hook_variants: sections.hookVariants,
        roteiro: sections.roteiro,
        comando: sections.comando,
        fontes: sections.fontes,
        slop_lint_violations: blockCount(violations),
        pipeline_trace: {
          assembled,
          revised,
          final,
          violations,
          narrativa_escolhida: { indice: artifacts.escolhida, titulo: narrativa?.titulo, estrutura: narrativa?.estrutura },
          hook_racional: hookRes.racional,
          few_shot_origens: ctx.fewShot.map((f) => f.origem),
          modelagem_briefs: ctx.modelagemBriefs,
        },
      })
      .select("id")
      .single();
    if (error) throw new Error(`falha ao salvar roteiro: ${error.message}`);

    await appDb.from("vm_sessions").update({ status: "done" }).eq("id", sessionId);
    emit({ type: "done", scriptId: saved.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const debug = {
      phase: currentPhase,
      version: APP_VERSION,
      git: GIT_SHA,
      at: new Date().toISOString(),
      opts,
      // diagnóstico específico anexado pelo agente que falhou (ex.: storytelling → stop_reason)
      ...(e && typeof e === "object" && "debug" in e ? { detail: (e as { debug: unknown }).debug } : {}),
    };
    await appDb.from("vm_sessions").update({ status: "error", error_message: message }).eq("id", sessionId);
    // best-effort: se a coluna debug ainda não existir (migração não aplicada), não derruba o erro acima
    await appDb.from("vm_sessions").update({ debug }).eq("id", sessionId);
    emit({ type: "error", message });
  }
}
