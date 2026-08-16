import { ANALYST_MODEL, trackedCreate, type UsageLog } from "../anthropic";
import { appDb, viralData } from "../db";
import { platformVideoId } from "../video-url";
import { fetchTranscript } from "../transcribe";
import { clientInsightBlock, scriptResultBlock, taughtBlock, toolInput } from "./agents";
import { clientPrefsBlock, playbookIndex } from "./draft";
import { composeBrief } from "./modelagem-brief";
import { HOOK_MECHANISMS } from "./hook-mechanisms";
import type { Attachment, GenerationContext, ModelagemAnalysis } from "./types";

// A modelagem extrai o MECANISMO do sucesso, nunca o conteúdo: o esqueleto é a parte
// que viaja para outro tema/rosto/semana. Campos que descreviam o que o vídeo DIZ
// (beats.resumo, argumentos, hook.texto) saíram de propósito — eram a origem da cópia.
function modelagemTool(comTema: boolean) {
  const props: Record<string, unknown> = {
    compreensao: {
      type: "object",
      description:
        "Do que o vídeo trata e por que a audiência se sentiu recompensada. Esta metade PODE citar conteúdo — ela existe para a sala entender o material, e não chega ao roteirista.",
      properties: {
        tema: { type: "string", description: "o assunto do vídeo em 1 frase concreta" },
        argumento_central: {
          type: "string",
          description: "a tese que o vídeo defende, em 1-2 frases. O que ele quer que o espectador passe a acreditar.",
        },
        promessa_da_abertura: { type: "string", description: "o que a abertura promete que o vídeo vai entregar" },
        recompensa: {
          type: "string",
          description:
            "O PRÊMIO que o espectador leva embora depois de assistir: o que ele entendeu, sentiu ou ganhou. Descreva o TIPO de recompensa em termos transferíveis (ex: 'a sensação de ter enxergado um golpe em que todo mundo cai'), não o conteúdo específico — este campo vai para o roteirista como alvo a bater.",
        },
        motor_comentario: {
          type: "string",
          description: "o que o vídeo faz que provoca comentário (discordância, identificação, pergunta deixada no ar)",
        },
        motor_compartilhamento: {
          type: "string",
          description: "por que alguém mandaria isso para outra pessoa (utilidade, prova de tese, indignação, status)",
        },
        alegacoes: {
          type: "array",
          items: { type: "string" },
          description:
            "Cada afirmação factual verificável do vídeo (número, data, causalidade, superlativo), uma por item, como o vídeo a enuncia. Vira a lista de checagem da pesquisa.",
        },
      },
      required: [
        "tema",
        "argumento_central",
        "promessa_da_abertura",
        "recompensa",
        "motor_comentario",
        "motor_compartilhamento",
        "alegacoes",
      ],
    },
    diagnostico: {
      type: "object",
      properties: {
        gargalo: { type: "string", enum: ["tema", "hook", "narrativa", "comando"] },
        onde_superamos: { type: "string", description: "1 frase: como uma versão nossa explora esse gargalo" },
        por_camada: {
          type: "array",
          minItems: 4,
          maxItems: 4,
          items: {
            type: "object",
            properties: {
              camada: { type: "string", enum: ["tema", "hook", "narrativa", "comando"] },
              evidencia: { type: "string", description: "frase LITERAL da transcrição que sustenta a leitura" },
              leitura: { type: "string", description: "por que funciona ou falha, em 1 frase" },
            },
            required: ["camada", "evidencia", "leitura"],
          },
        },
      },
      required: ["gargalo", "onde_superamos", "por_camada"],
    },
    esqueleto: {
      type: "object",
      description: "A arquitetura transferível. LIVRE DE CONTEÚDO: sem tema, nome, número, marca ou frase do original.",
      properties: {
        estrutura_narrativa: {
          type: "string",
          description: "Código + nome EXATOS do playbook, ex 'A1. Jornada do Herói'. Nenhuma casa bem → a mais próxima + ressalva curta.",
        },
        // O que o hook precisa extrair do original é o FATOR que gerou a curiosidade — a
        // lacuna aberta na cabeça do espectador — e não o rótulo do mecanismo. O rótulo diz
        // qual gaveta; o fator é o que se replica sobre outro assunto.
        hook: {
          type: "object",
          properties: {
            tipo: {
              type: "string",
              enum: HOOK_MECHANISMS as unknown as string[],
              description: "o MGC dominante da abertura, na taxonomia canônica do PLAYBOOK DE HOOKS",
            },
            fator_de_curiosidade: {
              type: "string",
              description:
                "a lacuna EXATA que a abertura abriu: a pergunta que o espectador precisou responder e não conseguiu sozinho. Em forma genérica, SEM o tema, nome, marca ou número do original.",
            },
            mecanismo: { type: "string", description: "o gatilho em ação: curiosidade, dissonância, relevância pessoal..." },
            funcao: { type: "string", description: "o que a abertura PRECISA fazer, em termos de efeito — não o que ela diz" },
          },
          required: ["tipo", "fator_de_curiosidade", "mecanismo", "funcao"],
        },
        beats: {
          type: "array",
          minItems: 3,
          items: {
            type: "object",
            properties: {
              ordem: { type: "number" },
              funcao: { type: "string", description: "setup|tensão|virada|prova|payoff" },
              mecanismo_de_atencao: { type: "string", description: "o que segura o espectador NESTE beat" },
              emocao: { type: "string" },
              seg: { type: "number", description: "duração estimada em segundos" },
            },
            required: ["ordem", "funcao", "mecanismo_de_atencao", "emocao"],
          },
        },
        loops_abertos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              o_que_fica_pendente: { type: "string", description: "a pergunta não respondida, em forma genérica" },
              fecha_em_qual_beat: { type: "number" },
            },
            required: ["o_que_fica_pendente", "fecha_em_qual_beat"],
          },
        },
        escalada: { type: "string", description: "como os stakes sobem do início ao fim" },
        comando: {
          type: "object",
          properties: { tipo: { type: "string" }, gatilho: { type: "string" }, posicao: { type: "string" } },
        },
      },
      required: ["estrutura_narrativa", "hook", "beats", "escalada"],
    },
    nao_transferivel: {
      type: "array",
      items: { type: "string" },
      description:
        "O que do sucesso NÃO viaja para outro tema/rosto/semana: trend do momento, celebridade, rosto já conhecido, janela de notícia, autoridade pessoal do criador.",
    },
    timing: {
      type: "object",
      properties: {
        classe: { type: "string", enum: ["breaking", "trending", "ciclico", "perene"] },
        contribuicao_pct: { type: "number", description: "0-100: quanto do resultado veio da janela temporal" },
      },
      required: ["classe", "contribuicao_pct"],
    },
  };

  // Com tema digitado, a compreensão do assunto do vídeo é ruído: o roteiro é sobre
  // OUTRA coisa e só a mecânica transfere. Sem tema, ela é o insumo da pesquisa dirigida
  // e da proposta de ângulos — e paga o próprio custo.
  if (comTema) delete props.compreensao;

  return {
    name: "registrar_modelagem",
    description: "Registra a autópsia de um vídeo viral: o que ele entregou à audiência e a mecânica que fez isso funcionar.",
    input_schema: {
      type: "object" as const,
      properties: props,
      required: comTema
        ? ["diagnostico", "esqueleto", "nao_transferivel", "timing"]
        : ["compreensao", "diagnostico", "esqueleto", "nao_transferivel", "timing"],
    },
  };
}

type ClassJson = Record<string, { classificacoes?: { tipo: string; confianca: string }[] }> | null;

// Se o vídeo de referência existe no corpus (match por id de plataforma, mesmo padrão do ETL),
// ancora a análise nas métricas reais e nas classificações já feitas — em vez de especular.
// Qualquer falha aqui só remove o bloco: modelagem nunca derruba a geração.
async function lookupCorpus(url: string | null): Promise<{ promptBlock: string; resumoMetricas: string }> {
  const none = { promptBlock: "", resumoMetricas: "" };
  if (!url) return none;
  try {
    const pid = platformVideoId(url);
    if (!pid) return none;
    const { data: vid } = await viralData
      .from("videos")
      .select("id, analise")
      .or(`link_video.ilike.%${pid}%,plataform_id.eq.${pid}`)
      .limit(1)
      .maybeSingle();
    if (!vid) return none;

    const { data: st } = await viralData
      .from("vm_video_stats")
      .select("views_total, retencao_hook, retencao_final, seguidores_ganhos")
      .eq("video_id", vid.id)
      .maybeSingle();

    // formato duplo do jsonb: {analise:{...}} ou {...} direto (normalização das migrations 0005/0013)
    const raw = vid.analise as { analise?: ClassJson } & NonNullable<ClassJson>;
    const an: ClassJson = (raw?.analise ?? raw) as ClassJson;
    const cls = ["storytelling", "hook", "comando"]
      .map((k) => {
        const tipos = an?.[k]?.classificacoes?.filter((c) => c.confianca === "alta").map((c) => c.tipo) ?? [];
        return tipos.length ? `${k}=${tipos.join(",")}` : "";
      })
      .filter(Boolean)
      .join("; ");
    const met = st
      ? [
          st.views_total != null && `Views: ${st.views_total}`,
          st.retencao_hook != null && `Retenção hook: ${st.retencao_hook}%`,
          st.retencao_final != null && `Retenção final: ${st.retencao_final}%`,
          st.seguidores_ganhos != null && `Seguidores ganhos: ${st.seguidores_ganhos}`,
        ]
          .filter(Boolean)
          .join(" | ")
      : "";
    if (!met && !cls) return none;

    return {
      resumoMetricas: met,
      promptBlock:
        `\n\n# DADOS REAIS DESTE VÍDEO (existe no nosso corpus — ancore a análise NELES, não especule)\n` +
        `${met ? `${met}\n` : ""}${cls ? `Classificações já feitas (confiança alta): ${cls}\n` : ""}` +
        `Onde existe métrica medida, ela MANDA: não dê nota nem opinião sobre uma camada que já tem número. ` +
        `Retenção de hook alta = o mecanismo do hook comprovadamente funciona: preserve-o no esqueleto. ` +
        `Retenção final baixa = o gargalo provavelmente é narrativa. ` +
        `Se sua leitura divergir da classificação existente, justifique.`,
    };
  } catch (e) {
    console.error("modelagem: lookup no corpus falhou (seguindo sem métricas)", url, e);
    return none;
  }
}

// O que a casa já sabe sobre ESTE cliente: vetos primeiro (eliminam ângulo antes de nascer),
// depois o que performou. Sem cliente na sessão, o bloco inteiro some.
function clienteBlock(ctx: GenerationContext): string {
  const prefs = clientPrefsBlock(ctx);
  const performou = clientInsightBlock(ctx, ["tema", "storytelling", "hook"], 5);
  const publicados = scriptResultBlock(ctx, "estrutura");
  const ensinado = taughtBlock(ctx, "modelagem");
  const parts = [
    prefs,
    performou && `# O QUE JÁ PERFORMOU PARA ESTE CLIENTE (dados reais, pré-rankeados)\n${performou}`,
    publicados && `# ROTEIROS DESTA SALA JÁ PUBLICADOS (performance medida — 'EVITE' é anti-padrão confirmado)\n${publicados}`,
    ensinado &&
      `# APRENDIZADOS ENSINADOS PELO TIME (curadoria humana — em conflito com heurística, isto prevalece)\n${ensinado}`,
  ].filter(Boolean);
  return parts.length ? `\n\n${parts.join("\n\n")}` : "";
}

export interface ModelagemResult {
  brief: string;
  analysis: ModelagemAnalysis;
}

// Só o link foi colado (sem transcrição manual): busca a transcrição agora, ao conjurar —
// não mais ao colar o link. Idempotente (mutação no attachment). Sem tema, o pipeline chama
// isto ANTES de tudo — modelagem e pesquisa precisam da transcrição ao mesmo tempo.
// Devolve o motivo da falha em vez de só engolir: com tema a modelagem é opcional e o motivo
// vira log, mas sem tema a geração morre aqui e o usuário precisa saber o que fazer
// (configurar chave? colar a transcrição? o link não é suportado?).
export async function ensureTranscript(attachment: Attachment): Promise<{ text: string; erro: string | null }> {
  if (attachment.raw_content?.trim() || attachment.kind !== "video_link" || !attachment.url)
    return { text: attachment.raw_content?.trim() ?? "", erro: null };
  const { text, erro } = await transcricaoDeUrl(attachment.url);
  if (text) attachment.raw_content = text;
  return { text, erro };
}

// A mesma busca, sem anexo para mutar: é ela que o Kasparov usa. O cache aqui é o da
// autópsia (por URL, abaixo) — quem acerta o cache nem chega a transcrever.
export async function transcricaoDeUrl(url: string): Promise<{ text: string; erro: string | null }> {
  try {
    const { title, text } = await fetchTranscript(url);
    return { text: (title ? `${title}\n\n${text}` : text).trim(), erro: null };
  } catch (e) {
    console.error("modelagem: transcrição do link falhou", url, e);
    return { text: "", erro: e instanceof Error ? e.message : String(e) };
  }
}

// ── As duas chaves de cache da autópsia ──────────────────────────────────────────────────
// Convivem de propósito, e nenhuma cobre o caso da outra:
//   • `attachment_id` — a chave histórica. É a única gravada nas autópsias já pagas, e a
//     única possível para anexo SEM url (roteiro de referência colado).
//   • `video_url` — a chave nova. É a única possível para vídeo debatido com o Kasparov, que
//     não nasce de sessão e portanto não tem anexo (018 §7.2).
// O lookup consulta as duas num `or`: registro velho continua resolvendo pelo anexo, vídeo
// avulso resolve pela URL. A migration 0031 faz o backfill de `video_url` a partir de
// `vm_attachments.url` — é ela que torna as autópsias já pagas reusáveis TAMBÉM por URL.
// Match por id de plataforma (ilike), mesma tática do lookupCorpus: a mesma /reel/ colada com
// utm, com ou sem www, é o mesmo vídeo.
export function filtroDeAutopsia(url: string | null, attachmentId?: string | null): string | null {
  const partes: string[] = [];
  if (attachmentId) partes.push(`attachment_id.eq.${attachmentId}`);
  const u = url?.trim();
  if (u) {
    const pid = platformVideoId(u);
    // aspas: a URL crua pode ter vírgula, que é o separador do filtro do PostgREST
    partes.push(pid ? `video_url.ilike.%${pid}%` : `video_url.eq."${u.replaceAll('"', "")}"`);
  }
  return partes.length ? partes.join(",") : null;
}

// Só `video_link` tem URL de vídeo — para os outros tipos, a chave continua sendo o anexo.
export function chavesDoAnexo(a: Attachment): { url: string | null; attachmentId: string } {
  return { url: a.kind === "video_link" ? a.url : null, attachmentId: a.id };
}

export interface AutopsiaOpts {
  transcript?: string; // já em mãos (o anexo da sessão traz a dele)
  tema?: string; // tema novo digitado; vazio = a sala publica sobre o MESMO assunto
  taxonomia?: string; // playbooks de hook/estrutura já renderizados
  cliente?: string; // o que a casa sabe do cliente
  usageLog?: UsageLog;
  attachmentId?: string | null; // chave histórica, quando a autópsia nasce de um anexo
}

// O núcleo da autópsia, livre de Attachment e de GenerationContext: o que ele precisa é uma
// URL (ou uma transcrição) e blocos de prompt já prontos. `analyzeModelagem` é um envelope
// fino sobre isto — o pipeline de geração não mudou de comportamento.
export async function autopsiaDeUrl(url: string | null, opts: AutopsiaOpts = {}): Promise<ModelagemResult> {
  const vazio: ModelagemResult = { brief: "", analysis: {} };

  // Cache ANTES da transcrição: sem isso cada debate sobre o mesmo vídeo pagaria os dois.
  // Análises no formato antigo (sem `esqueleto`) re-analisam uma vez no formato novo.
  const filtro = filtroDeAutopsia(url, opts.attachmentId);
  if (filtro) {
    const { data: cached } = await appDb
      .from("vm_modelagem_analyses")
      .select("replication_brief, analysis")
      .or(filtro)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached?.replication_brief && (cached.analysis as { esqueleto?: unknown } | null)?.esqueleto)
      return { brief: cached.replication_brief, analysis: cached.analysis as ModelagemAnalysis };
  }

  const transcript = opts.transcript?.trim() || (url ? (await transcricaoDeUrl(url)).text : "");
  if (!transcript) return vazio;

  const tema = opts.tema?.trim() ?? "";
  const comTema = Boolean(tema);
  const corpus = await lookupCorpus(url);
  const taxonomia = opts.taxonomia ?? "";

  const missao = comTema
    ? `Um roteirista vai usar essa arquitetura para escrever sobre outro tema: "${tema}". Extraia o que TRANSFERE para lá.`
    : `Não há tema novo: a sala vai publicar sobre o MESMO assunto deste vídeo, defendendo a MESMA TESE, ` +
      `numa versão melhor executada. Não é para fugir do ângulo dele — é para vencê-lo no próprio ângulo. ` +
      `Por isso o campo argumento_central é o mais importante da sua análise: é ele que vira a PREMISSA do nosso ` +
      `roteiro, e o usuário vai confirmá-lo antes de qualquer linha ser escrita. Enuncie a tese com precisão, ` +
      `em 1-2 frases afirmativas (nunca pela negação, "não é X, é Y" é vício proibido na casa). ` +
      `Em compreensao, entenda o material a fundo — do que trata, que tese defende, e principalmente qual ` +
      `RECOMPENSA o espectador levou embora (é ela que faz alguém compartilhar, não a informação em si): a nossa ` +
      `versão precisa provocar o MESMO sentimento, e se possível mais forte. ` +
      `Liste também cada alegação factual, porque um pesquisador vai checar uma a uma antes de qualquer coisa entrar ` +
      `no nosso roteiro — nós não herdamos a palavra dele, nós confirmamos ou descartamos. ` +
      `Em esqueleto, a mecânica pura, incluindo a curva emocional beat a beat. ` +
      `Em diagnostico.gargalo, seja preciso: é a camada onde o original era mais fraco, e é exatamente ali que ` +
      `a nossa versão tem que ganhar dele.`;

  const res = await trackedCreate(opts.usageLog, "modelagem", {
    model: ANALYST_MODEL,
    // análise estruturada via tool forçada; o sonnet-5 pensa por padrão no mesmo teto.
    // 8000 dá folga para o tool_use não truncar.
    max_tokens: 8000,
    tools: [modelagemTool(comTema)],
    tool_choice: { type: "tool", name: "registrar_modelagem" },
    messages: [
      {
        role: "user",
        content:
          `Você é um analista forense de vídeos virais. Desconstrua o vídeo abaixo para descobrir POR QUE ele funcionou — ` +
          `o mecanismo, não o conteúdo.\n\n` +
          `PROIBIÇÃO CENTRAL: é PROIBIDO citar no esqueleto qualquer tema, nome, número, marca ou frase do original. ` +
          `Se um campo só puder ser preenchido citando o conteúdo, você não extraiu o mecanismo — extraia de novo. ` +
          `(A única exceção é o campo evidencia do diagnóstico, que existe justamente para citar a frase literal.)\n\n` +
          `Separe o que TRANSFERE do que era circunstância: trend, celebridade, rosto conhecido ou janela de notícia ` +
          `não se replicam e vão em nao_transferivel.\n\n${missao}` +
          `${taxonomia}${opts.cliente ?? ""}${corpus.promptBlock}\n\nTRANSCRIÇÃO:\n${transcript}`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("modelagem: modelo não retornou análise estruturada");
  const analysis = toolInput(toolUse) as ModelagemAnalysis;
  const composed = composeBrief(analysis, corpus.resumoMetricas);
  if (!composed) {
    console.error(
      `modelagem vazia — stop_reason=${res.stop_reason} input=${JSON.stringify(toolUse.input).slice(0, 500)}`
    );
    // preserva "modelagem falhou nunca derruba a geração": não insere cache, retorna vazio
    return vazio;
  }

  // Grava as duas chaves quando as duas existem: a autópsia paga numa sessão fica reusável
  // no debate avulso, e vice-versa.
  await appDb.from("vm_modelagem_analyses").insert({
    attachment_id: opts.attachmentId ?? null,
    video_url: url,
    analysis,
    replication_brief: composed,
  });

  return { brief: composed, analysis };
}

export async function analyzeModelagem(attachment: Attachment, ctx: GenerationContext): Promise<ModelagemResult> {
  // A transcrição vem ANTES do cache aqui de propósito, ao contrário do núcleo: o pipeline
  // depende do efeito colateral (`attachment.raw_content` alimenta a pesquisa no modo
  // adaptação, index.ts). Envelope não muda comportamento — nem esse.
  const { text: transcript } = await ensureTranscript(attachment);
  if (!transcript) return { brief: "", analysis: {} };

  const storyIndex = playbookIndex(ctx.playbooks.storytelling);
  const { url, attachmentId } = chavesDoAnexo(attachment);
  return autopsiaDeUrl(url, {
    transcript,
    tema: ctx.prompt,
    attachmentId,
    usageLog: ctx.usageLog,
    cliente: clienteBlock(ctx),
    taxonomia:
      (ctx.playbooks.hook
        ? `\n\n# PLAYBOOK DE HOOKS (classifique o hook com este vocabulário)\n${ctx.playbooks.hook}`
        : "") +
      (storyIndex
        ? `\n\n# ESTRUTURAS NARRATIVAS DO PLAYBOOK (classifique em estrutura_narrativa com código + nome EXATOS)\n${storyIndex}`
        : ""),
  });
}
