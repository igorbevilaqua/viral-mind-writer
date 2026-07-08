import { anthropic, ANALYST_MODEL } from "../anthropic";
import { appDb } from "../db";
import { agentPrompt } from "./agents";

// Agente Professor: extrai aprendizados generalizáveis de um viral (menu Ensinar).
// Os aprovados pelo usuário são destilados na sala via loadContext (taught_*).

export type Dimensao = "hook" | "storytelling" | "tema" | "ritmo" | "comando" | "geral";

export interface ExtractedLearning {
  dimensao: Dimensao;
  titulo: string;
  descricao: string;
  evidencia?: string;
}

const APRENDIZADOS_TOOL = {
  name: "registrar_aprendizados",
  description: "Registra os aprendizados extraídos do vídeo/roteiro viral.",
  input_schema: {
    type: "object" as const,
    properties: {
      aprendizados: {
        type: "array",
        minItems: 4,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            dimensao: { type: "string", enum: ["hook", "storytelling", "tema", "ritmo", "comando", "geral"] },
            titulo: { type: "string", description: "curto, imperativo" },
            descricao: { type: "string", description: "1-3 frases explicando o mecanismo" },
            evidencia: { type: "string", description: "trecho literal da transcrição que sustenta" },
          },
          required: ["dimensao", "titulo", "descricao"],
        },
      },
    },
    required: ["aprendizados"],
  },
};

const DIMENSOES: Dimensao[] = ["hook", "storytelling", "tema", "ritmo", "comando", "geral"];

export async function extractLearnings(input: {
  transcript: string;
  sourceUrl?: string;
  contextNote?: string;
  clientNome?: string;
}): Promise<ExtractedLearning[]> {
  const { data: playbooks } = await appDb
    .from("vm_playbooks")
    .select("slug, content")
    .eq("active", true)
    .in("slug", ["hook", "storytelling", "comando"]);
  const playbookBlock = (playbooks ?? [])
    .map((p) => `# PLAYBOOK DE ${p.slug.toUpperCase()}\n${p.content}`)
    .join("\n\n");

  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 3000,
    tools: [APRENDIZADOS_TOOL],
    tool_choice: { type: "tool", name: "registrar_aprendizados" },
    system: [
      {
        type: "text",
        text: `${agentPrompt("professor")}\n\n${playbookBlock}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `${input.clientNome ? `CLIENTE (nicho de destino dos aprendizados): ${input.clientNome}\n` : ""}${
          input.sourceUrl ? `FONTE: ${input.sourceUrl}\n` : ""
        }${input.contextNote ? `NOTA DE CONTEXTO DO USUÁRIO: ${input.contextNote}\n` : ""}
TRANSCRIÇÃO DO VÍDEO VIRAL:
${input.transcript.slice(0, 30_000)}

Extraia os aprendizados.`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("professor: sem aprendizados estruturados");

  // O modelo às vezes dupla-serializa o campo — normaliza os 3 formatos (mesmo padrão do etl.ts).
  let a: unknown = (toolUse.input as Record<string, unknown>).aprendizados ?? toolUse.input;
  if (typeof a === "string") {
    try {
      a = JSON.parse(a);
    } catch {
      throw new Error("professor: aprendizados ilegíveis");
    }
  }
  if (a && !Array.isArray(a) && typeof a === "object" && Array.isArray((a as { aprendizados?: unknown }).aprendizados)) {
    a = (a as { aprendizados: unknown }).aprendizados;
  }
  if (!Array.isArray(a)) throw new Error("professor: aprendizados fora do formato");
  return (a as ExtractedLearning[]).filter(
    (l) => l?.titulo && l?.descricao && DIMENSOES.includes(l.dimensao)
  );
}
