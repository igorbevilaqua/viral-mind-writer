import { appDb } from "../db";
import { bindUsageLog } from "../anthropic";
import { guardEmit, STALE_GENERATION_MS } from "../generation";
import { loadContext } from "./context";
import {
  analyzeModelagem,
  ensureTranscript,
  fontesComProcedencia,
  LINK_MODELAVEL,
  type ModelagemResult,
} from "./modelagem";
import { compreensaoBlock } from "./modelagem-brief";
import { anexoModelagem, anexoReplicar, comandoDoOriginal, exigirEsqueletoDoOriginal, narrativaDoOriginal } from "./replicar";
import { registrarBloco, research, proposeNarratives, rankNarratives, designHook, writeComando } from "./agents";
import { pairFromCandidates } from "../calibration";
import { blocoSinaisRevisor, generateDraft, hookEcoaAbertura, parseSections, semEcoDaAbertura, stripLeadingHook, stripTrailingComando, TETO_ECOS, TETO_RITMO } from "./draft";
import { critiqueAndRewrite } from "./critique";
import { extrairEstudos } from "./estudos";
import { extractFromCorrection } from "./teach";
import { humanize } from "./humanize";
import { derivePremissa, origemDaPremissa, teseAceitavel } from "./premissa";
import { verificarRoteiro, type Regime, type RegistroVerificacao } from "./verificar";
import { blockCount, dedash, deepDedash, ecosNumericos, paragrafosLongos, sequenciasLongas } from "./slop-lint";
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
  // Base do dump de diagnóstico gravado em vm_sessions.debug (jsonb, migration 0008).
  const debugBase = { version: APP_VERSION, git: GIT_SHA, opts };
  // A fase corrente é persistida a cada TROCA — ~10 UPDATEs pequenos por geração, de propósito:
  // é o que faz a aba que só acompanha (reload, segunda janela) ver em que fase a sala está em
  // vez de um spinner mudo. Reusa a coluna `debug` para não pedir migration nova. O objeto é
  // reescrito inteiro em cada escrita e o catch reescreve por último, então o dump de erro nunca
  // é comido por uma fase. Best-effort: falhar aqui não pode derrubar a geração.
  const gravarFase = (phase: string) => {
    appDb
      .from("vm_sessions")
      .update({ debug: { ...debugBase, phase, at: new Date().toISOString() } })
      .eq("id", sessionId)
      .then(
        ({ error }) => error && console.error("fase não persistida em vm_sessions.debug", error.message),
        (err) => console.error("fase não persistida em vm_sessions.debug", err)
      );
  };
  // ponto único de todos os emits: guardado → desconexão do cliente não mata o pipeline,
  // e o emit({type:"error"}) do catch nunca relança. Cada troca de fase vira um evento no hub.
  const rawEmit = guardEmit(emit);
  emit = (e) => {
    if (e.type === "phase") {
      // Progresso dentro da fase repete o mesmo `phase` (017 §8) — só a TROCA vira evento
      // no hub, senão uma verificação de 20 alegações vira 20 linhas de atividade.
      if (e.phase !== currentPhase) {
        void registrarAtividade(e.phase, { sessaoId: sessionId, userId: hubUser, payload: { etapa: e.phase } });
        gravarFase(e.phase);
      }
      currentPhase = e.phase;
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
      // não passa pelo catch: setar status=error aqui clobberaria a geração em andamento.
      // E não é `error`: outra conexão está gerando, o que é o sistema funcionando. A tela
      // usa este evento para levar a aba ao modo acompanhamento (session-view: watching).
      emit({ type: "em_andamento" });
      return;
    }

    const ctx = await loadContext(sessionId);
    hubUser = ctx.userId;
    // liga o usageLog à sessão → cada chamada de LLM emite um evento 'llm' no hub
    if (ctx.usageLog) bindUsageLog(ctx.usageLog, { sessaoId: sessionId, userId: ctx.userId });

    // ── Modelagem: a análise é disparada cedo, mas com modelagem marcada a PREMISSA sai dela, e
    // por isso ela é aguardada antes da pesquisa (a tese diz ao pesquisador o que checar).
    // Modelagem roda com transcrição colada OU só com o link (busca a transcrição ao conjurar).
    // Link modelável: vídeo (transcreve o áudio) ou carrossel (lê o texto dos slides).
    let modelagens = ctx.attachments.filter(
      (a) => a.is_modelagem && (a.raw_content || (LINK_MODELAVEL.includes(a.kind) && a.url))
    );

    // ── UM material dita a linha central (Regra 4) ────────────────────────────────────────
    // Relação 1:1 com o material, agora nos DOIS modos: Modelar e Replicar ditam premissa e
    // arquitetura, e um segundo material injetaria uma tese e uma arquitetura concorrentes.
    // Replicar vence quando existe (é o mais restritivo). O excedente não vira lixo silencioso:
    // perde só a condição de modelagem e segue como material de referência comum — e o descarte
    // vai ao rastro.
    const principal = anexoModelagem(modelagens);
    const ignoradas = modelagens.filter((a) => a !== principal);
    for (const a of ignoradas) a.is_modelagem = false;
    modelagens = principal ? [principal] : [];
    const replicando = anexoReplicar(modelagens);

    // Modelagem marcada = a premissa vem do vídeo (Regra 2), com ou sem texto digitado: a tese é
    // a do original, a pesquisa checa o que ele alegou em vez de aceitar a palavra dele, e o
    // texto digitado é direção de ângulo dentro dessa mesma tese — nunca assunto novo.
    // Antes disso, texto digitado desligava tudo isto e a autópsia nem extraía a tese.
    const modelando = modelagens.length > 0;

    // Nenhum descarte em silêncio: o rastro diz qual material ditou a linha, em que modo, e
    // quais foram rebaixados a material de referência comum.
    if (principal)
      registrarBloco(ctx, "modelagem", {
        attachment_id: principal.id,
        modo: replicando ? "replicar" : "modelar",
        rebaixadas_a_referencia: ignoradas.map((a) => a.id),
      });

    // A fase entra ANTES da busca da transcrição: ela pode levar segundos e falhar, e sem
    // emitir nada aqui a tela fica muda até o erro aparecer do nada (debug.phase="init").
    if (modelando) emit({ type: "phase", phase: "modelagem" });

    // Com modelagem, TUDO depende da transcrição — garanta antes de pagar qualquer LLM,
    // e antes de disparar modelagem e pesquisa (que a consomem em paralelo).
    if (modelando) {
      const { text, erro } = await ensureTranscript(modelagens[0], ctx.usageLog);
      if (!text) {
        // A mensagem diz qual material falhou: "transcrição do vídeo" para um carrossel mandaria
        // o usuário procurar um áudio que não existe.
        const oQue = modelagens[0].kind === "carousel_link" ? "ler o carrossel" : "obter a transcrição do vídeo";
        throw new Error(
          `Não consegui ${oQue}${erro ? `: ${erro}` : ""}. ` +
            // Digitar um tema não salva mais a geração em nenhum dos modos: com o material
            // marcado, o assunto e a tese são os DELE. As saídas são colar o conteúdo ou
            // desmarcar o material — e a mensagem não pode mandar para o caminho errado.
            `Cole o conteúdo no campo do material e conjure de novo` +
            (replicando ? `.` : `, ou desmarque o material como Modelar para a sala escrever pelo tema digitado.`)
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
    // Precedência: já resolvida (digitada sem modelagem, ou confirmada da modelagem no run
    // anterior) > extraída da modelagem (com confirmação) > derivada do tema.
    let premissa = ctx.premissa;
    // A tese do vídeo só é buscada quando ela pode ser usada. Premissa já na coluna vence — é ela
    // que `confirmarPremissa` grava, e é por isso que o run 2 não volta a pausar (um "ignore
    // ctx.premissa quando há modelagem" aqui poria a sessão em laço eterno de confirmação).
    // E só na primeira geração: sessão legada com candidatas já feitas não fica travada na pausa.
    const tirarTeseDoVideo = modelando && !premissa && !ctx.artifacts?.candidatas?.length;
    let teseExtraida = "";
    if (tirarTeseDoVideo) {
      const analise = (await modelagemP)[0]?.analysis;
      // Replicar sem esqueleto não tem o que replicar: aborta com o caminho de saída em vez de
      // seguir e escrever um roteiro que finge ter obedecido uma estrutura que ninguém leu.
      if (replicando) exigirEsqueletoDoOriginal(analise);
      teseExtraida = analise?.compreensao?.argumento_central?.trim() ?? "";
    }

    switch (origemDaPremissa({ digitada: premissa, temModelagem: tirarTeseDoVideo, teseExtraida })) {
      case "digitada":
        // Adotada VERBATIM. O nó de derivação nem roda — sem modelo no caminho, não existe deriva
        // possível. `??=` preserva a origem já gravada (`modelagem`, no run 2).
        ctx.premissaOrigem ??= "digitada";
        break;
      case "modelagem": {
        // A tese é a DO ORIGINAL (compreensao.argumento_central) e o humano confirma antes de
        // qualquer linha ser escrita. O run termina aqui; confirmarPremissa dispara o run 2, que
        // reusa artifacts. Duas execuções normais no lugar de uma suspensa.
        const sugerida = dedash(teseExtraida);
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
      case "sem_tese":
        // Regra 1: com modelagem, a autópsia É o trabalho — falhar aqui derruba a geração, com o
        // caminho de saída. Antes, este ramo simplesmente não existia: o fluxo escorregava para a
        // derivação sem tema e sem material, e o modelo inventava um placeholder de premissa.
        // A mensagem NÃO culpa a transcrição: quando o fluxo chega aqui, a autópsia rodou e
        // compôs brief (senão ela mesma teria falhado antes, com o motivo). O que faltou foi a
        // tese dentro de uma análise que veio incompleta, e a ação certa é tentar de novo.
        throw new Error(
          "A autópsia do material não trouxe a tese do vídeo, e é dela que a premissa desta sessão sai. " +
            "Conjure de novo. Se repetir, cole a transcrição no campo do material ou desmarque o material como modelagem."
        );
      case "derivada": {
        // Nem resolvida nem extraível: o sistema produz a tese a partir do tema. É o caminho que
        // fecha a regra "nenhum roteiro sem premissa" sem transformar o formulário em pedágio.
        // Sem insumo nenhum, `derivePremissa` recusa em vez de inventar.
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
        break;
      }
    }
    // Guarda de sanidade, a última linha antes de congelar: placeholder ou rótulo curto não é
    // tese, e uma premissa dessas atravessaria o pipeline inteiro sob o cabeçalho "INEGOCIÁVEL".
    if (!teseAceitavel(premissa))
      throw new Error(
        `A premissa desta sessão não é uma tese ("${premissa.slice(0, 80)}"). ` +
          `Escreva 1 ou 2 frases afirmativas — no campo da premissa, ou na caixa de premissa da sessão — e conjure de novo.`
      );
    // Congelada: daqui pra frente todo agente lê ctx.premissa via premissaBlock(), a mesma string.
    ctx.premissa = premissa;

    // ── Pesquisa + narrativas + ranking (só na primeira geração da sessão) ──
    let artifacts: SessionArtifacts | null = ctx.artifacts;
    if (!artifacts?.candidatas?.length) {
      // Com modelagem, a ordem importa: a autópsia primeiro, porque é ela que diz ao pesquisador
      // QUAL tese testar e QUAIS alegações checar. Pesquisa cega enriquece no escuro e
      // deixa os ângulos sem lastro factual — que é justamente o que a casa desclassifica.
      // O paralelismo modelagem ∥ pesquisa sobrevive só onde não há modelagem, e é o preço
      // consciente da Regra 2: a tese vem antes, mesmo quando há texto digitado.
      let resultados: ModelagemResult[];
      let dossie: string;
      let compreensao = "";
      if (modelando) {
        resultados = await modelagemP;
        if (replicando) exigirEsqueletoDoOriginal(resultados[0]?.analysis);
        compreensao = compreensaoBlock(resultados[0]?.analysis ?? {});
        emit({ type: "phase", phase: "pesquisa" });
        dossie = await research(ctx, {
          transcricao: modelagens[0].raw_content!,
          compreensao: resultados[0]?.analysis.compreensao,
          // Replicar: a checagem das alegações do original continua obrigatória, e a munição
          // nova ganha teto (no máximo 2 dados que somem à tese).
          replicar: Boolean(replicando),
        });
      } else {
        emit({ type: "phase", phase: "pesquisa" });
        const dossieP = research(ctx);
        [resultados, dossie] = await Promise.all([modelagemP, dossieP]);
      }
      ctx.modelagemBriefs = resultados.map((r) => r.brief).filter(Boolean);

      if (replicando) {
        // ── Storytelling e Dados PULADOS, de propósito ──────────────────────────────────
        // Não há narrativa a propor nem a rankear: a narrativa é a do original. Além de
        // economizar as duas chamadas caras (16k + 6k), isto remove o ponto exato onde a sala
        // reinterpretava e perdia a estrutura. A vencedora é montada em código (replicar.ts) no
        // mesmo formato que roteirista, hook e revisor já consomem.
        const narrativa = narrativaDoOriginal(resultados[0]!.analysis);
        artifacts = {
          dossie,
          candidatas: [narrativa],
          ranking: [], // ninguém rankeou: ranking vazio é a verdade, nota inventada não seria
          escolhida: 0,
          orientacao_roteiro:
            "MODO REPLICAR: a ordem, a função e a proporção de duração dos beats do original são inegociáveis. " +
            "O ganho vem frase a frase (palavra mais simples, palavra mais forte, contraste onde havia só afirmação), " +
            "nunca de estrutura nova.",
          orientacao_hook: "",
          premissa_provas: ctx.premissaProvas,
          premissa_contraintuitivo: ctx.premissaContraintuitivo,
        };
        // Nenhum corte silencioso: o rastro diz o que foi pulado, por quê, e o que ficou de fora.
        registrarBloco(ctx, "replicar", {
          modo: "replicar",
          attachment_id: replicando.id,
          storytelling_pulado: true,
          dados_pulado: true,
          motivo: "a narrativa é a do original — não há o que propor nem rankear",
          estrutura_do_original: narrativa.estrutura,
          beats_do_original: narrativa.beats.length,
        });
      } else {
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
      }
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
    // Replicar: a decisão adaptar-o-CTA-do-original × criar-um é tomada AQUI, em código, e chega
    // ao agente comando como instrução única (nunca como pergunta).
    if (replicando) ctx.replicarComando = comandoDoOriginal(modelagens_[0]?.analysis);

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
      // Uma candidata só não é negociação: em Replicar a narrativa é a do original e não há
      // escolha a mostrar nem a trocar. Os cards ficam de fora (a tela aplica o mesmo critério).
      if (artifacts.candidatas.length > 1)
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

    // hook escolhido x abertura do corpo, ANTES da montagem: logo abaixo o hook é colado na frente
    // do corpo de propósito, e depois disso os dois lados deixam de ser distinguíveis.
    const ecoHookAbertura = hookEcoaAbertura(hookRes.hook, corpo);

    const assembled = [
      `## HEADLINE\n${headline ?? ""}`,
      `## HOOK\n${hookRes.hook}`,
      `## ROTEIRO\n${hookRes.hook}\n\n${corpo}`,
      `## VARIACOES_DE_HOOK\n${hookRes.variantes.map((v, i) => `${i + 1}. ${v}`).join("\n")}`,
      `## COMANDO\n${comando}`,
      `## FONTES\n${fontes ?? ""}`,
    ].join("\n\n");

    // Detectores determinísticos sobre o roteiro montado, antes da revisão (016 §4.2): o que
    // ADICIONA texto entrou no dossiê, o que REMOVE é julgado aqui. Custo zero de LLM.
    const ecos = ecosNumericos(assembled);
    // Ritmo e parágrafo: sinal para o revisor aqui, e teto determinístico no humanizador depois.
    const paragrafos = paragrafosLongos(assembled);
    const sequencias = sequenciasLongas(assembled);
    const sinais = blocoSinaisRevisor(ecos, ecoHookAbertura, paragrafos, sequencias);
    // Portão de forma e procedência sobre a seção ESTUDOS do dossiê. Determinístico, sem LLM,
    // e sem abrir a URL — confirmar que a página existe e diz aquilo é a peça 3.
    const estudos = extrairEstudos(artifacts?.dossie ?? "");

    emit({ type: "phase", phase: "revisao" });
    const { revised, critica } = await critiqueAndRewrite(ctx, assembled, sinais);

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
          fontes: fontesComProcedencia(sections.fontes, modelagens),
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
              // 016 §10.1: é este registro que torna a taxa de falso positivo do eco MEDIDA
              // e não estimada — e é ela que decide se o detector aperta ou afrouxa depois.
              // Guarda o sinal e o que sobrou do teto; o `revised` ao lado diz o que o
              // revisor fez com ele.
              ecos_numericos: ecos,
              ecos_excedidos: Math.max(0, ecos.length - TETO_ECOS),
              eco_hook_abertura: ecoHookAbertura,
              // Ritmo e parágrafo, mesmo contrato do eco: o que o REVISOR viu (sobre o
              // `assembled`) e o que sobrou no texto ENTREGUE. Com os dois, "corrigiu ou não"
              // é medido e não estimado, e a régua pode ser reapertada em cima de dado.
              ritmo: {
                paragrafos_longos: paragrafos,
                sequencias_longas: sequencias,
                paragrafos_excedidos: Math.max(0, paragrafos.length - TETO_RITMO),
                sequencias_excedidas: Math.max(0, sequencias.length - TETO_RITMO),
              },
              ritmo_final: {
                paragrafos_longos: paragrafosLongos(final),
                sequencias_longas: sequenciasLongas(final),
              },
              // 016 §7: os estudos descartados vão com o TEXTO, não só o contador — é o sinal
              // de que o Grok está inventando referência, e ele some se só o número for salvo.
              estudos: estudos.aceitos,
              estudos_descartados: estudos.descartados,
            },
            few_shot_origens: ctx.fewShot.map((f) => f.origem),
            // o critério que escolheu esses exemplos (decisão humana; padrão views)
            few_shot_criterio: ctx.fewShotCriterio,
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

    // ── Verificação factual (017 §8) ──
    // Fase própria, DEPOIS do save e DEPOIS do `done`: o roteiro está no banco e já foi
    // entregue ao usuário. O try/catch é o que sustenta o fail-soft — sem ele, o catch geral
    // lá embaixo marcaria a sessão como `error` e apagaria da tela uma geração que deu certo.
    // Regime `delta`: só o que não é rastreável ao dossiê é buscado (§4.1). A varredura
    // completa é o botão da tela, em `app/api/verificar`.
    try {
      emit({ type: "phase", phase: "verificacao" });
      await verificarScriptSalvo(saved.id, "delta", (p) => emit({ type: "phase", phase: "verificacao", ...p }));
    } catch (e) {
      console.error("verificação falhou — roteiro entregue e salvo mesmo assim", e);
    }

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
      ...debugBase,
      phase: currentPhase,
      at: new Date().toISOString(),
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

/**
 * Verificação factual de um roteiro JÁ SALVO (017 §8, §9): lê o roteiro e o dossiê da sessão,
 * verifica e grava em `vm_generated_scripts.verificacao` — um `update` por id, sobrescrevendo.
 * É um registro por roteiro, sem histórico (§9).
 *
 * Um caminho só para as três portas: a fase do pipeline, a server action `verificarScript` e a
 * rota de varredura completa. Lê do banco mesmo quando o chamador acabou de escrever (o
 * `artifacts` já está em `vm_sessions` antes do insert do roteiro, index.ts:236), porque duas
 * leituras baratas valem menos que duas versões desta função divergindo.
 *
 * **Lança em qualquer falha, de propósito** (§11): sem registro gravado a tela diz "não
 * verificado". Gravar um registro vazio depois de uma extração que falhou seria dizer
 * "verificado, 0 problemas" sobre o que ninguém verificou.
 */
export async function verificarScriptSalvo(
  scriptId: string,
  regime: Regime,
  onProgresso?: (e: { etapa: string; feito?: number; total?: number }) => void
): Promise<{ registro: RegistroVerificacao; sessionId: string }> {
  const { data: script, error } = await appDb
    .from("vm_generated_scripts")
    .select("hook, roteiro, comando, session_id")
    .eq("id", scriptId)
    .single();
  if (error || !script) throw new Error(error?.message ?? "roteiro não encontrado");

  // Sessão sem dossiê (6 de 44) → dossiê vazio → tudo cai no delta, que é o certo: roteiro sem
  // pesquisa é roteiro inteiramente por conta do modelo (§4.2).
  const { data: sess } = await appDb.from("vm_sessions").select("artifacts").eq("id", script.session_id).single();
  const dossie = ((sess?.artifacts ?? null) as SessionArtifacts | null)?.dossie ?? "";

  const registro = await verificarRoteiro({
    roteiro: { hook: script.hook ?? "", roteiro: script.roteiro ?? "", comando: script.comando ?? "" },
    dossie,
    regime,
    onProgresso,
  });

  const { error: upErr } = await appDb.from("vm_generated_scripts").update({ verificacao: registro }).eq("id", scriptId);
  // A 0029 ainda não aplicada cai aqui (PGRST204). Lança em vez de engolir: verificação que
  // não foi gravada não pode passar por gravada, e o operador precisa ver o motivo.
  if (upErr) throw new Error(`verificação feita, mas não gravada: ${upErr.message}`);

  return { registro, sessionId: script.session_id };
}
