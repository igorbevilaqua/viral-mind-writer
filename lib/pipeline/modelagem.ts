import { anthropic, ANALYST_MODEL } from "../anthropic";
import { appDb } from "../db";
import type { Attachment } from "./types";

const ANALISE_TOOL = {
  name: "registrar_analise",
  description: "Registra a desconstrução estrutural de um vídeo viral e o brief de replicação.",
  input_schema: {
    type: "object" as const,
    properties: {
      analysis: {
        type: "object",
        properties: {
          hook: {
            type: "object",
            properties: {
              texto: { type: "string" },
              tipo: { type: "string" },
              mecanismo: { type: "string", description: "curiosity gap, choque, pergunta, contraste..." },
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
        required: ["hook", "beats", "arco_emocional", "argumentos", "elementos_virais"],
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

export async function analyzeModelagem(attachment: Attachment, novoTema: string): Promise<string> {
  const transcript = attachment.raw_content?.trim();
  if (!transcript) return "";

  // Anexo já analisado (ex: "Gerar nova versão") → reusa em vez de pagar outra chamada
  const { data: cached } = await appDb
    .from("vm_modelagem_analyses")
    .select("replication_brief")
    .eq("attachment_id", attachment.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cached?.replication_brief) return cached.replication_brief;

  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 4000,
    tools: [ANALISE_TOOL],
    tool_choice: { type: "tool", name: "registrar_analise" },
    messages: [
      {
        role: "user",
        content: `Você é um analista de vídeos virais. Desconstrua o vídeo abaixo: estrutura em beats, arco emocional, argumentos, pacing, hook e CTA, e os elementos que o fizeram viralizar. Depois escreva o replication_brief: instruções para um roteirista replicar essa ARQUITETURA (jamais o texto literal) adaptada ao tema: "${novoTema}".\n\nTRANSCRIÇÃO:\n${transcript}`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("modelagem: modelo não retornou análise estruturada");
  const input = toolUse.input as { analysis: unknown; replication_brief: string };

  await appDb.from("vm_modelagem_analyses").insert({
    attachment_id: attachment.id,
    analysis: input.analysis,
    replication_brief: input.replication_brief,
  });

  return input.replication_brief;
}
