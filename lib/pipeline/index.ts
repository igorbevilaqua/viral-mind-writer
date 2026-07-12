import { appDb } from "../db";
import { ANALYST_MODEL, recordUsage } from "../anthropic";
import { guardEmit, STALE_GENERATION_MS } from "../generation";
import { loadContext } from "./context";
import { analyzeModelagem } from "./modelagem";
import { research, proposeNarratives, rankNarratives, designHook, writeComando } from "./agents";
import { generateDraft, parseSections, stripTrailingComando } from "./draft";
import { critiqueAndRewrite } from "./critique";
import { humanize } from "./humanize";
import { blockCount, deepDedash } from "./slop-lint";
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
  // ponto único de todos os emits: guardado → desconexão do cliente não mata o pipeline,
  // e o emit({type:"error"}) do catch nunca relança.
  const rawEmit = guardEmit(emit);
  emit = (e) => {
    if (e.type === "phase") currentPhase = e.phase;
    rawEmit(e);
  };
  try {
    // Lock otimista: só assume a sessão se ninguém está gerando — ou se a geração
    // anterior está stale (>10min, ou sem timestamp = pré-migration 0010).
    const staleBefore = new Date(Date.now() - STALE_GENERATION_MS).toISOString();
    const { data: locked, error: lockErr } = await appDb
      .from("vm_sessions")
      .update({ status: "generating", generation_started_at: new Date().toISOString() })
      .eq("id", sessionId)
      .or(`status.neq.generating,generation_started_at.is.null,generation_started_at.lt.${staleBefore}`)
      .select("id");
    if (lockErr) throw new Error(`falha ao iniciar geração: ${lockErr.message}`);
    if (!locked?.length) {
      // não passa pelo catch: setar status=error aqui clobberaria a geração em andamento
      emit({ type: "error", message: "Geração já em andamento para esta sessão — acompanhe ou aguarde alguns minutos." });
      return;
    }

    const ctx = await loadContext(sessionId);

    // ── Modelagem ∥ pesquisa: independentes — os briefs só são consumidos do
    // proposeNarratives em diante, então a análise roda em paralelo com o Grok.
    const modelagens = ctx.attachments.filter((a) => a.is_modelagem && a.raw_content);
    let modelagemP: Promise<string[]> = Promise.resolve([]);
    if (modelagens.length) {
      emit({ type: "phase", phase: "modelagem" });
      const t0 = Date.now();
      modelagemP = Promise.all(modelagens.map((a) => analyzeModelagem(a, ctx.prompt))).then((briefs) => {
        // ponytail: só duração/modelo — tokens da modelagem exigiriam tocar modelagem.ts (fora do escopo do WP-D)
        recordUsage(ctx.usageLog, "modelagem", ANALYST_MODEL, Date.now() - t0);
        return briefs.filter(Boolean);
      });
    }

    // ── Pesquisa + narrativas + ranking (só na primeira geração da sessão) ──
    let artifacts: SessionArtifacts | null = ctx.artifacts;
    if (!artifacts?.candidatas?.length) {
      emit({ type: "phase", phase: "pesquisa" });
      const dossie = await research(ctx);
      ctx.modelagemBriefs = await modelagemP;

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

    // Regeneração (artifacts cacheados) pula a pesquisa mas o roteirista ainda usa os briefs.
    ctx.modelagemBriefs = await modelagemP;

    // Override do usuário: troca a narrativa vencedora e reescreve a partir daqui
    if (opts.narrativeIndex != null && artifacts.candidatas[opts.narrativeIndex]) {
      artifacts.escolhida = opts.narrativeIndex;
    }
    // Zero travessão nos cards (narrativas/dossiê/orientações): saída intermediária
    // que não passa pelo humanizador. dedash é a garantia determinística.
    artifacts = deepDedash(artifacts);
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
    // o comando fica só na seção COMANDO — remove a repetição do fim do roteiro
    if (sections.comando && sections.roteiro) {
      sections.roteiro = stripTrailingComando(sections.roteiro, sections.comando);
    }

    const narrativa = artifacts.candidatas[artifacts.escolhida];
    // unique (session_id, version): conflito com escrita concorrente → recalcula a version e tenta de novo
    let saved: { id: string } | null = null;
    let error: { code?: string; message: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: last } = await appDb
        .from("vm_generated_scripts")
        .select("version")
        .eq("session_id", sessionId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      ({ data: saved, error } = await appDb
        .from("vm_generated_scripts")
        .insert({
          session_id: sessionId,
          client_id: ctx.clientId,
          version: (last?.version ?? 0) + 1,
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
            // telemetria de custo por fase: tokens (input/output/cache) + duração + modelo
            usage: ctx.usageLog ?? {},
          },
        })
        .select("id")
        .single());
      if (error?.code !== "23505") break;
    }
    if (error || !saved) throw new Error(`falha ao salvar roteiro: ${error?.message ?? "sem retorno"}`);

    // limpa erro de tentativas anteriores → a página não abre com a caixa vermelha stale
    await appDb.from("vm_sessions").update({ status: "done", error_message: null }).eq("id", sessionId);
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
