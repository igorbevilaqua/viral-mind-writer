import { ANALYST_MODEL, trackedCreate } from "../anthropic";
import { appDb, viralData } from "../db";
import { platformVideoId } from "../video-url";
import { fetchTranscript } from "../transcribe";
import { clientInsightBlock, scriptResultBlock, taughtBlock, toolInput } from "./agents";
import { clientPrefsBlock, playbookIndex } from "./draft";
import { composeBrief } from "./modelagem-brief";
import type { Attachment, GenerationContext, ModelagemAnalysis } from "./types";

// A modelagem extrai o MECANISMO do sucesso, nunca o conteúdo: o esqueleto é a parte
// que viaja para outro tema/rosto/semana. Campos que descreviam o que o vídeo DIZ
// (beats.resumo, argumentos, hook.texto) saíram de propósito — eram a origem da cópia.
function modelagemTool(comTema: boolean) {
  const props: Record<string, unknown> = {
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
        hook: {
          type: "object",
          properties: {
            tipo: { type: "string", description: "nome EXATO de um tipo/MGC do PLAYBOOK DE HOOKS" },
            mecanismo: { type: "string", description: "o gatilho em ação: curiosidade, dissonância, relevância pessoal..." },
            funcao: { type: "string", description: "o que a abertura PRECISA fazer, em termos de efeito — não o que ela diz" },
          },
          required: ["tipo", "mecanismo", "funcao"],
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

  // Ângulos só quando NÃO há tema digitado: nesse modo eles são as narrativas candidatas.
  // Com tema, quem propõe narrativas é o agente storytelling — pedir ângulos aqui seria
  // pagar ~600 tokens de saída que ninguém consome.
  if (!comTema) {
    props.angulos = {
      type: "array",
      minItems: 3,
      maxItems: 3,
      description: "3 ângulos NOVOS sobre o MESMO tema do vídeo, cada um capaz de superar o original.",
      items: {
        type: "object",
        properties: {
          conceito: { type: "string", description: "o ângulo em 1 frase" },
          pergunta_nova: { type: "string", description: "a pergunta que ESTE ângulo faz e o original não fez" },
          emocao_dominante: { type: "string", description: "uma só, OBRIGATORIAMENTE diferente da dos outros dois ângulos" },
          amplificador_br: { type: "string", description: "o gancho cultural brasileiro ativado" },
          hook_pronto: { type: "string", description: "8-15 palavras em português BR natural, pronto para gravar" },
          arco: { type: "string", description: "hook → setup → escalada → payoff, em 3-4 frases" },
          porque_supera: { type: "string", description: "que mecanismo de atenção este ângulo aciona que o original não acionou" },
          compativel_com_cliente: {
            type: "string",
            description: "por que este ângulo cabe (ou não) nas restrições e no histórico do cliente. Sem dados do cliente, diga isso.",
          },
        },
        required: [
          "conceito",
          "pergunta_nova",
          "emocao_dominante",
          "amplificador_br",
          "hook_pronto",
          "arco",
          "porque_supera",
          "compativel_com_cliente",
        ],
      },
    };
  }

  return {
    name: "registrar_modelagem",
    description: "Registra o mecanismo transferível de um vídeo viral e os ângulos capazes de superá-lo.",
    input_schema: {
      type: "object" as const,
      properties: props,
      required: comTema
        ? ["diagnostico", "esqueleto", "nao_transferivel", "timing"]
        : ["diagnostico", "esqueleto", "nao_transferivel", "timing", "angulos"],
    },
  };
}

type ClassJson = Record<string, { classificacoes?: { tipo: string; confianca: string }[] }> | null;

// Se o vídeo de referência existe no corpus (match por id de plataforma, mesmo padrão do ETL),
// ancora a análise nas métricas reais e nas classificações já feitas — em vez de especular.
// Qualquer falha aqui só remove o bloco: modelagem nunca derruba a geração.
async function lookupCorpus(attachment: Attachment): Promise<{ promptBlock: string; resumoMetricas: string }> {
  const none = { promptBlock: "", resumoMetricas: "" };
  if (attachment.kind !== "video_link" || !attachment.url) return none;
  try {
    const pid = platformVideoId(attachment.url);
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
    console.error("modelagem: lookup no corpus falhou (seguindo sem métricas)", attachment.url, e);
    return none;
  }
}

// O que a casa já sabe sobre ESTE cliente: vetos primeiro (eliminam ângulo antes de nascer),
// depois o que performou. Sem cliente na sessão, o bloco inteiro some.
function clienteBlock(ctx: GenerationContext): string {
  const prefs = clientPrefsBlock(ctx);
  const performou = clientInsightBlock(ctx, ["tema", "storytelling", "hook"], 5);
  const publicados = scriptResultBlock(ctx, "estrutura");
  const ensinado = taughtBlock(ctx, ["storytelling", "tema"]);
  const parts = [
    prefs,
    performou && `# O QUE JÁ PERFORMOU PARA ESTE CLIENTE (dados reais, pré-rankeados)\n${performou}`,
    publicados && `# ROTEIROS DESTA SALA JÁ PUBLICADOS (performance medida — 'EVITE' é anti-padrão confirmado)\n${publicados}`,
    ensinado &&
      `# APRENDIZADOS ENSINADOS PELO TIME (curadoria humana — em conflito com heurística, isto prevalece)\n${ensinado}`,
  ].filter(Boolean);
  return parts.length ? `\n\n${parts.join("\n\n")}` : "";
}

export async function analyzeModelagem(attachment: Attachment, ctx: GenerationContext): Promise<string> {
  // Só o link foi colado (sem transcrição manual): busca a transcrição agora, ao conjurar —
  // não mais ao colar o link. Falha aqui só remove a modelagem, nunca derruba a geração.
  if (!attachment.raw_content?.trim() && attachment.kind === "video_link" && attachment.url) {
    try {
      const { title, text } = await fetchTranscript(attachment.url);
      attachment.raw_content = title ? `${title}\n\n${text}` : text; // visível ao roteirista adiante
    } catch (e) {
      console.error("modelagem: transcrição do link falhou (seguindo sem modelagem)", attachment.url, e);
    }
  }
  const transcript = attachment.raw_content?.trim();
  if (!transcript) return "";

  // Anexo já analisado (ex: "Gerar nova versão") → reusa em vez de pagar outra chamada.
  // Análises no formato antigo (sem `esqueleto`) re-analisam uma vez no formato novo.
  const { data: cached } = await appDb
    .from("vm_modelagem_analyses")
    .select("replication_brief, analysis")
    .eq("attachment_id", attachment.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cached?.replication_brief && (cached.analysis as { esqueleto?: unknown } | null)?.esqueleto)
    return cached.replication_brief;

  const comTema = Boolean(ctx.prompt.trim());
  const corpus = await lookupCorpus(attachment);
  const storyIndex = playbookIndex(ctx.playbooks.storytelling);
  const taxonomia =
    (ctx.playbooks.hook ? `\n\n# PLAYBOOK DE HOOKS (classifique o hook com este vocabulário)\n${ctx.playbooks.hook}` : "") +
    (storyIndex
      ? `\n\n# ESTRUTURAS NARRATIVAS DO PLAYBOOK (classifique em estrutura_narrativa com código + nome EXATOS)\n${storyIndex}`
      : "");

  const missao = comTema
    ? `Um roteirista vai usar essa arquitetura para escrever sobre outro tema: "${ctx.prompt}". Extraia o que TRANSFERE para lá.`
    : `Não há tema novo: vamos escrever sobre o MESMO tema deste vídeo, por um ângulo diferente e melhor. ` +
      `Além do esqueleto, proponha 3 ângulos NOVOS sobre esse mesmo tema — cada um fazendo uma pergunta que o original não fez, ` +
      `com emoções dominantes obrigatoriamente diferentes entre si, e priorizando ângulos que funcionem a qualquer momento (perenes).`;

  const res = await trackedCreate(ctx.usageLog, "modelagem", {
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
          `${taxonomia}${clienteBlock(ctx)}${corpus.promptBlock}\n\nTRANSCRIÇÃO:\n${transcript}`,
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
    return "";
  }

  await appDb.from("vm_modelagem_analyses").insert({
    attachment_id: attachment.id,
    analysis,
    replication_brief: composed,
  });

  return composed;
}
