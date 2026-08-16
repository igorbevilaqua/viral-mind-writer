import { appDb } from "../db";
import { bindUsageLog } from "../anthropic";
import { guardEmit, STALE_GENERATION_MS } from "../generation";
import { loadContext } from "./context";
import { analyzeModelagem, ensureTranscript, type ModelagemResult } from "./modelagem";
import { compreensaoBlock } from "./modelagem-brief";
import { research, proposeNarratives, rankNarratives, designHook, writeComando } from "./agents";
import { pairFromCandidates } from "../calibration";
import { generateDraft, parseSections, semEcoDaAbertura, stripLeadingHook, stripTrailingComando } from "./draft";
import { critiqueAndRewrite } from "./critique";
import { extractFromCorrection } from "./teach";
import { humanize } from "./humanize";
import { derivePremissa } from "./premissa";
import { blockCount, dedash, deepDedash } from "./slop-lint";
import { APP_VERSION, GIT_SHA } from "../version";
import { registrarAtividade } from "../hub";
import type { PipelineEvent, SessionArtifacts } from "./types";

// Piso de serviço à premissa para uma candidata ser elegível a vencer. Abaixo disso a narrativa
// pode ser boa de views e ainda assim defender mal a tese — e o roteiro sai sem fio condutor.
// ponytail: número redondo escolhido a dedo. Se o Dados calibrar mal essa escala (todas as
// candidatas em 80+, ou todas abaixo), o passo seguinte é medir e ajustar, não somar pesos.
const SERVICO_PREMISSA_MIN = 50;

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
  // user_id da sessão (vm_sessions.user_id): preenchido após loadContext, usado na telemetria do hub
  let hubUser: string | null = null;
  // ponto único de todos os emits: guardado → desconexão do cliente não mata o pipeline,
  // e o emit({type:"error"}) do catch nunca relança. Cada troca de fase vira um evento no hub.
  const rawEmit = guardEmit(emit);
  emit = (e) => {
    if (e.type === "phase") {
      currentPhase = e.phase;
      void registrarAtividade(e.phase, { sessaoId: sessionId, userId: hubUser, payload: { etapa: e.phase } });
    }
    rawEmit(e);
  };
  try {
    // Lock otimista: só assume a sessão se ninguém está gerando — ou se a geração
    // anterior está stale (>10min, ou sem timestamp = pré-migration 0010).
    // Via RPC (migration 0016): PostgREST 13 rejeita or= em PATCH com 42703.
    const staleBefore = new Date(Date.now() - STALE_GENERATION_MS).toISOString();
    const { data: locked, error: lockErr } = await appDb.rpc("vm_acquire_generation_lock", {
      p_session_id: sessionId,
      p_stale_before: staleBefore,
    });
    if (lockErr) throw new Error(`falha ao iniciar geração: ${lockErr.message}`);
    if (!locked) {
      // não passa pelo catch: setar status=error aqui clobberaria a geração em andamento
      emit({ type: "error", message: "Geração já em andamento para esta sessão — acompanhe ou aguarde alguns minutos." });
      return;
    }

    const ctx = await loadContext(sessionId);
    hubUser = ctx.userId;
    // liga o usageLog à sessão → cada chamada de LLM emite um evento 'llm' no hub
    if (ctx.usageLog) bindUsageLog(ctx.usageLog, { sessaoId: sessionId, userId: ctx.userId });

    // ── Modelagem ∥ pesquisa: independentes — os briefs só são consumidos do
    // proposeNarratives em diante, então a análise roda em paralelo com o Grok.
    // Modelagem roda com transcrição colada OU só com o link (busca a transcrição ao conjurar).
    const modelagens = ctx.attachments.filter(
      (a) => a.is_modelagem && (a.raw_content || (a.kind === "video_link" && a.url))
    );
    // Sem tema digitado + modelagem de vídeo = MESMO assunto do vídeo, ângulo novo:
    // a modelagem propõe 3 ângulos que viram as narrativas candidatas, e a pesquisa
    // checa o que o vídeo alegou em vez de aceitar a palavra dele.
    const adaptation = !ctx.prompt.trim() && modelagens.length > 0;

    // A fase entra ANTES da busca da transcrição: ela pode levar segundos e falhar, e sem
    // emitir nada aqui a tela fica muda até o erro aparecer do nada (debug.phase="init").
    if (modelagens.length) emit({ type: "phase", phase: "modelagem" });

    // Sem tema, TUDO depende da transcrição — garanta antes de pagar qualquer LLM,
    // e antes de disparar modelagem e pesquisa (que a consomem em paralelo).
    if (adaptation) {
      const { text, erro } = await ensureTranscript(modelagens[0]);
      if (!text) {
        throw new Error(
          `Não consegui obter a transcrição do vídeo${erro ? `: ${erro}` : ""}. ` +
            `Cole a transcrição no campo do vídeo, ou digite um tema, e conjure de novo.`
        );
      }
    }

    let modelagemP: Promise<ModelagemResult[]> = Promise.resolve([]);
    if (modelagens.length) {
      // usage/duração agora vêm do trackedCreate dentro de analyzeModelagem (tokens inclusive)
      modelagemP = Promise.all(modelagens.map((a) => analyzeModelagem(a, ctx)));
      // Rejeição antes do await (Grok leva 30-90s) seria unhandled e derrubaria o
      // processo em Node moderno; este handler marca como tratada — o await relança.
      modelagemP.catch(() => {});
    }

    // ── PREMISSA: 3 fontes, 1 slot. Nenhuma narrativa nasce sem ela. ──
    // Resolvida ANTES da pesquisa de propósito: é a premissa que diz ao pesquisador o que
    // procurar. Pesquisar o tema solto e só depois inventar a tese era a inversão que deixava
    // o dossiê genérico e o roteirista sem fio condutor.
    // Precedência: digitada pelo usuário > extraída da modelagem (com confirmação) > derivada.
    let premissa = ctx.premissa;
    if (premissa) {
      // Digitada: adotada VERBATIM. O nó de derivação nem roda — sem modelo no caminho, não
      // existe deriva possível. É a única garantia dura do sistema.
      ctx.premissaOrigem ??= "digitada";
    } else if (adaptation && !ctx.artifacts?.candidatas?.length) {
      // Modelagem SEM tema: a tese é a DO ORIGINAL (compreensao.argumento_central) e o usuário
      // confirma antes de escrever. O run termina aqui; confirmarPremissa dispara o run 2, que
      // reusa artifacts. Duas execuções normais no lugar de uma suspensa.
      // Só na primeira geração: sessão legada com candidatas já feitas não fica travada.
      // Com tema digitado NÃO entra aqui: ali o assunto é outro, a tese do vídeo modelado seria
      // ruído (a autópsia nem extrai `compreensao`), e a premissa vem do tema. Isso também
      // preserva o paralelismo modelagem ∥ pesquisa, que um await aqui mataria.
      const extraida = (await modelagemP)[0]?.analysis.compreensao?.argumento_central?.trim();
      if (extraida) {
        const sugerida = dedash(extraida);
        await appDb
          .from("vm_sessions")
          .update({
            status: "aguardando_premissa",
            artifacts: { ...(ctx.artifacts ?? {}), premissa_sugerida: sugerida },
          })
          .eq("id", sessionId);
        await registrarAtividade("premissa_pendente", { sessaoId: sessionId, userId: hubUser });
        emit({ type: "premissa_pendente", sugerida });
        return;
      }
    }

    if (!premissa) {
      // Nem digitada nem extraível: o sistema produz a tese a partir do tema. É o caminho que
      // fecha a regra "nenhum roteiro sem premissa" sem transformar o formulário em pedágio.
      emit({ type: "phase", phase: "premissa" });
      const derivada = await derivePremissa(ctx);
      premissa = derivada.premissa;
      ctx.premissaOrigem = "derivada";
      ctx.premissaProvas = derivada.o_que_provaria;
      ctx.premissaContraintuitivo = derivada.angulo_contraintuitivo;
      await appDb
        .from("vm_sessions")
        .update({ premissa, premissa_origem: "derivada" })
        .eq("id", sessionId);
    }
    // Congelada: daqui pra frente todo agente lê ctx.premissa via premissaBlock(), a mesma string.
    ctx.premissa = premissa;

    // ── Pesquisa + narrativas + ranking (só na primeira geração da sessão) ──
    let artifacts: SessionArtifacts | null = ctx.artifacts;
    if (!artifacts?.candidatas?.length) {
      // Sem tema, a ordem importa: a autópsia primeiro, porque é ela que diz ao pesquisador
      // QUAL tese testar e QUAIS alegações checar. Pesquisa cega enriquece no escuro e
      // deixa os ângulos sem lastro factual — que é justamente o que a casa desclassifica.
      // Com tema, os dois são independentes e seguem em paralelo (o Grok leva 30-90s).
      let resultados: ModelagemResult[];
      let dossie: string;
      let compreensao = "";
      if (adaptation) {
        resultados = await modelagemP;
        compreensao = compreensaoBlock(resultados[0]?.analysis ?? {});
        emit({ type: "phase", phase: "pesquisa" });
        dossie = await research(ctx, {
          transcricao: modelagens[0].raw_content!,
          compreensao: resultados[0]?.analysis.compreensao,
        });
      } else {
        emit({ type: "phase", phase: "pesquisa" });
        const dossieP = research(ctx);
        [resultados, dossie] = await Promise.all([modelagemP, dossieP]);
      }
      ctx.modelagemBriefs = resultados.map((r) => r.brief).filter(Boolean);

      emit({ type: "phase", phase: "narrativas" });
      // Nos dois modos quem propõe ângulo é o storytelling, com o dossiê como lastro.
      // Sem tema ele recebe a compreensão do vídeo e a ordem de NÃO repetir o ângulo dele.
      const candidatas = await proposeNarratives(ctx, dossie, compreensao || undefined);
      const rank = await rankNarratives(ctx, dossie, candidatas);
      const valid = rank.ranking.filter((r) => candidatas[r.indice]);
      // Dois eixos, hierarquia clara: servir a premissa é RESTRIÇÃO, viralizar é o critério.
      // Candidata que sustenta mal a tese está fora por viral que seja — era exatamente esse o
      // furo de antes, quando o único eixo era `score` de views. Entre as que servem, ganha a
      // mais viral. Se nenhuma passa do piso, ganha a que menos mal serve, nunca a mais viral.
      // `?? 100` mantém rankings pré-Etapa C (sem o campo) elegíveis.
      const servem = valid.filter((r) => (r.servico_a_premissa ?? 100) >= SERVICO_PREMISSA_MIN);
      const pool = servem.length ? servem : valid;
      const vencedora = pool.length
        ? [...pool].sort((a, b) =>
            servem.length ? b.score - a.score : (b.servico_a_premissa ?? 0) - (a.servico_a_premissa ?? 0)
          )[0].indice
        : 0;

      artifacts = {
        dossie,
        candidatas,
        ranking: rank.ranking,
        escolhida: vencedora,
        orientacao_roteiro: rank.orientacao_roteiro,
        orientacao_hook: rank.orientacao_hook,
        premissa_provas: ctx.premissaProvas,
        premissa_contraintuitivo: ctx.premissaContraintuitivo,
      };
    } else {
      // Regeneração: a premissa vem de vm_sessions (coluna), mas provas/contraintuitivo ficaram
      // nos artifacts — restaura pra o hook e a pesquisa não perderem a pauta.
      ctx.premissaProvas ??= ctx.artifacts?.premissa_provas;
      ctx.premissaContraintuitivo ??= ctx.artifacts?.premissa_contraintuitivo;
    }

    // Regeneração (artifacts cacheados) pula a pesquisa mas o roteirista ainda usa os briefs.
    const modelagens_ = await modelagemP;
    ctx.modelagemBriefs = modelagens_.map((r) => r.brief).filter(Boolean);
    ctx.modelagemHooks = modelagens_.map((r) => r.analysis?.esqueleto?.hook).filter(Boolean);

    if (artifacts) {
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
    }

    // Reescrita orientada: feedback do usuário + versão anterior como base
    let revision: { anterior: string; feedback: string } | undefined;
    if (opts.feedback) {
      const { data: prev } = await appDb
        .from("vm_generated_scripts")
        .select("hook, roteiro, comando")
        .eq("session_id", sessionId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prev) {
        revision = {
          // hook vem da coluna (não está mais dentro do roteiro) — a reescrita precisa dele
          anterior: `${prev.hook ? `${prev.hook}\n\n` : ""}${prev.roteiro}${prev.comando ? `\n\nCOMANDO: ${prev.comando}` : ""}`,
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
    const { revised, critica } = await critiqueAndRewrite(ctx, assembled);

    emit({ type: "phase", phase: "humanizacao" });
    const { text: final, violations } = await humanize(ctx, revised);

    emit({ type: "phase", phase: "salvando" });
    const sections = parseSections(final);
    // o comando fica só na seção COMANDO — remove a repetição do fim do roteiro
    if (sections.comando && sections.roteiro) {
      sections.roteiro = stripTrailingComando(sections.roteiro, sections.comando);
    }
    // e o hook fica só na coluna `hook` — o roteiro salvo é o desenvolvimento
    if (sections.roteiro) sections.roteiro = stripLeadingHook(sections.roteiro, sections.hook);
    // variação que só reescreve a abertura do corpo nem chega a ser oferecida: guardada ela é
    // inofensiva, mas no dia em que alguém troca o hook por ela (swapHook) o vídeo diz a mesma
    // coisa duas vezes seguidas. Aconteceu em produção.
    sections.hookVariants = semEcoDaAbertura(sections.hookVariants, sections.roteiro);

    const narrativa = artifacts ? (artifacts.candidatas[artifacts.escolhida] ?? null) : null;
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
            narrativa_escolhida: { indice: artifacts?.escolhida ?? null, titulo: narrativa?.titulo, estrutura: narrativa?.estrutura },
            hook_racional: hookRes.racional,
            // Fase 3: mecanismo do hook (taxonomia canônica) → o flywheel atribui ratio × mecanismo
            hook_mecanismo: hookRes.mecanismo,
            hook_formato: hookRes.formato,
            hook_mecanismos_variantes: hookRes.mecanismosVariantes,
            // 015 §4.1: o rastro de proveniência. Custo zero de LLM — é serialização do que os
            // agentes já montaram em memória e descartavam. Conteúdo estático entra por
            // REFERÊNCIA (lição = {id,titulo}, playbook = slug+version); dossiê e transcrição
            // não entram. Sem essa regra o trace sai da casa dos KB.
            proveniencia: {
              blocos: ctx.blocos ?? {},
              critica,
              hooks_descartados: hookRes.descartados,
              bob: [], // preenchido pós-save pelas edições do Bob
              licoes_excedidas: ctx.licoesExcedidas ?? {},
            },
            few_shot_origens: ctx.fewShot.map((f) => f.origem),
            modelagem_briefs: ctx.modelagemBriefs,
            // telemetria de custo por fase: tokens (input/output/cache) + duração + modelo
            usage: ctx.usageLog ?? {},
            // WP-E.1: previsto×real — score da vencedora + fingerprint do conhecimento usado;
            // o ETL maduro (vm_outcomes) fecha o ciclo lendo estes dois campos
            predicted_score: artifacts?.ranking.find((r) => r.indice === artifacts!.escolhida)?.score ?? null,
            fingerprint: {
              lesson_ids: ctx.lessonIds ?? [],
              playbook_slugs_versions: ctx.playbookVersions ?? [],
              insight_run_id: ctx.insightRunId ?? null,
            },
          },
        })
        .select("id")
        .single());
      if (error?.code !== "23505") break;
    }
    if (error || !saved) throw new Error(`falha ao salvar roteiro: ${error?.message ?? "sem retorno"}`);

    // limpa erro de tentativas anteriores → a página não abre com a caixa vermelha stale
    await appDb.from("vm_sessions").update({ status: "done", error_message: null }).eq("id", sessionId);

    // Harvest de calibração (grátis): o par "escolhido vs vice de outro mecanismo" entra
    // na fila para o time confirmar/corrigir a decisão do agente. Best-effort — nunca derruba.
    try {
      const par = pairFromCandidates(hookRes.candidatos, ctx.clientId);
      if (par) await appDb.from("vm_calibration_pairs").insert(par);
    } catch (e) {
      console.error("harvest de calibração falhou, seguindo", e);
    }

    await registrarAtividade("roteiro_gerado", { sessaoId: sessionId, userId: hubUser, payload: { script_id: saved.id } });
    emit({ type: "done", scriptId: saved.id });

    // Correção da sala → aprendizado. O PEDIDO do usuário (caixa "AJUSTAR O ROTEIRO")
    // é sinal supervisionado; o Professor destila em lições active:false pra curadoria
    // no /ensinar (mesma máquina da edição/viral). client_id escopa regras de cliente.
    // APÓS o done e em try isolado: não atrasa a entrega nem derruba a geração já emitida.
    if (opts.feedback && revision) {
      try {
        const depois = `${sections.hook ? `${sections.hook}\n\n` : ""}${sections.roteiro}${sections.comando ? `\n\nCOMANDO: ${sections.comando}` : ""}`;
        const learnings = await extractFromCorrection({
          pedido: opts.feedback,
          antes: revision.anterior,
          depois,
          clientNome: ctx.clientPrefs?.nome,
        });
        if (learnings.length) {
          const { data: lesson } = await appDb
            .from("vm_lessons")
            .insert({
              client_id: ctx.clientId,
              source_kind: "correcao",
              source_title: "Correção na sala (pedido do usuário)",
              transcript: depois,
              context_note: opts.feedback,
            })
            .select("id")
            .single();
          if (lesson) {
            await appDb.from("vm_lesson_learnings").insert(
              learnings.map((l) => ({ ...l, evidencia: l.evidencia ?? null, origem: "correcao", active: false, lesson_id: lesson.id }))
            );
          }
        }
      } catch (e) {
        console.error("aprendizado da correção falhou — roteiro entregue mesmo assim", e);
      }
    }
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
    await registrarAtividade("erro", { sessaoId: sessionId, userId: hubUser, payload: { error_message: message, etapa: currentPhase } });
    emit({ type: "error", message });
  }
}
