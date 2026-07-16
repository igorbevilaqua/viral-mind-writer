import { anthropic, ANALYST_MODEL } from "../anthropic";
import { appDb, viralData } from "../db";
import { platformVideoId } from "../video-url";
import { toolInput } from "./agents";
import { playbookIndex } from "./draft";
import type { Attachment, GenerationContext } from "./types";

const ANALISE_TOOL = {
  name: "registrar_analise",
  description: "Registra a desconstrução estrutural de um vídeo viral e o brief de replicação.",
  input_schema: {
    type: "object" as const,
    properties: {
      analysis: {
        type: "object",
        properties: {
          estrutura_narrativa: {
            type: "string",
            description:
              "Código + nome EXATOS da estrutura do playbook que este vídeo usa, ex 'A1. Jornada do Herói'. Se nenhuma casa bem, a mais próxima + ressalva curta.",
          },
          hook: {
            type: "object",
            properties: {
              texto: { type: "string" },
              tipo: { type: "string", description: "nome EXATO de um tipo/MGC do PLAYBOOK DE HOOKS" },
              mecanismo: { type: "string", description: "princípio do playbook em ação: curiosidade, relevância, impacto..." },
              duracao_estimada_s: { type: "number" },
            },
            required: ["texto", "tipo", "mecanismo"],
          },
          beats: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ordem: { type: "number" },
                funcao: { type: "string", description: "setup|tensão|virada|prova|payoff" },
                resumo: { type: "string" },
                emocao: { type: "string" },
                duracao_estimada_s: { type: "number" },
              },
              required: ["ordem", "funcao", "resumo", "emocao"],
            },
          },
          arco_emocional: { type: "array", items: { type: "string" } },
          argumentos: { type: "array", items: { type: "string" } },
          pacing: {
            type: "object",
            properties: {
              onde_acelera: { type: "string" },
              onde_respira: { type: "string" },
            },
          },
          cta: {
            type: "object",
            properties: { texto: { type: "string" }, tipo: { type: "string" }, posicao: { type: "string" } },
          },
          elementos_virais: { type: "array", items: { type: "string" } },
        },
        required: ["estrutura_narrativa", "hook", "beats", "arco_emocional", "argumentos", "elementos_virais"],
      },
      replication_brief: {
        type: "string",
        description:
          "Brief em prosa, imperativo, dizendo como replicar a ARQUITETURA (nunca o texto) adaptada ao novo tema.",
      },
    },
    required: ["analysis", "replication_brief"],
  },
};

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
        `Retenção de hook alta = o mecanismo do hook comprovadamente funciona: preserve-o no brief. ` +
        `Retenção final baixa = aponte onde o arco perde gás e corrija na replicação. ` +
        `Se sua classificação divergir da existente, justifique.`,
    };
  } catch (e) {
    console.error("modelagem: lookup no corpus falhou (seguindo sem métricas)", attachment.url, e);
    return none;
  }
}

export async function analyzeModelagem(attachment: Attachment, ctx: GenerationContext): Promise<string> {
  const transcript = attachment.raw_content?.trim();
  if (!transcript) return "";

  // Anexo já analisado (ex: "Gerar nova versão") → reusa em vez de pagar outra chamada.
  // Briefs antigos (sem estrutura_narrativa no analysis) re-analisam uma vez no formato novo.
  const { data: cached } = await appDb
    .from("vm_modelagem_analyses")
    .select("replication_brief, analysis")
    .eq("attachment_id", attachment.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cached?.replication_brief && (cached.analysis as { estrutura_narrativa?: string } | null)?.estrutura_narrativa)
    return cached.replication_brief;

  const corpus = await lookupCorpus(attachment);
  const storyIndex = playbookIndex(ctx.playbooks.storytelling);
  const taxonomia =
    (ctx.playbooks.hook ? `\n\n# PLAYBOOK DE HOOKS (classifique o hook com este vocabulário)\n${ctx.playbooks.hook}` : "") +
    (storyIndex
      ? `\n\n# ESTRUTURAS NARRATIVAS DO PLAYBOOK (classifique em estrutura_narrativa com código + nome EXATOS)\n${storyIndex}`
      : "");

  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    // análise estruturada rica (desconstrução + brief) via tool forçada; o sonnet-5 pensa
    // por padrão no mesmo teto. 4000 arriscava truncar o tool_use; 8000 dá folga.
    max_tokens: 8000,
    tools: [ANALISE_TOOL],
    tool_choice: { type: "tool", name: "registrar_analise" },
    messages: [
      {
        role: "user",
        content: `Você é um analista de vídeos virais. Desconstrua o vídeo abaixo: estrutura em beats, arco emocional, argumentos, pacing, hook e CTA, e os elementos que o fizeram viralizar. Classifique hook e estrutura usando EXATAMENTE o vocabulário dos playbooks fornecidos. Depois escreva o replication_brief: instruções para um roteirista replicar essa ARQUITETURA (jamais o texto literal) adaptada ao tema: "${ctx.prompt}".${taxonomia}${corpus.promptBlock}\n\nTRANSCRIÇÃO:\n${transcript}`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("modelagem: modelo não retornou análise estruturada");
  const input = toolInput(toolUse);
  const brief = typeof input.replication_brief === "string" ? input.replication_brief.trim() : "";
  if (!brief) {
    console.error(
      `modelagem vazia — stop_reason=${res.stop_reason} input=${JSON.stringify(toolUse.input).slice(0, 500)}`
    );
    // preserva "modelagem falhou nunca derruba a geração": não insere cache, retorna vazio
    return "";
  }

  // Header de classificação viaja junto no brief (string) — narrativas, draft e crítico o veem sem mudança de tipo.
  const a = input.analysis as { estrutura_narrativa?: string; hook?: { tipo?: string; mecanismo?: string } } | undefined;
  const header = [
    a?.estrutura_narrativa && `ESTRUTURA-BASE: ${a.estrutura_narrativa}`,
    a?.hook?.tipo && `HOOK: ${a.hook.tipo}${a.hook.mecanismo ? ` (${a.hook.mecanismo})` : ""}`,
    corpus.resumoMetricas && `MÉTRICAS REAIS: ${corpus.resumoMetricas}`,
  ]
    .filter(Boolean)
    .join(" | ");
  const composed = header ? `${header}\n\n${brief}` : brief;

  await appDb.from("vm_modelagem_analyses").insert({
    attachment_id: attachment.id,
    analysis: input.analysis ?? null,
    replication_brief: composed,
  });

  return composed;
}
