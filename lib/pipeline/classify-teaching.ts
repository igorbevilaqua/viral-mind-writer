import { anthropic, ANALYST_MODEL } from "../anthropic";
import { agentPrompt, toolInput } from "./agents";
import { DESTINATARIOS, type Destinatario } from "./destinatarios";

// Classificador de ensino: pega o que o usuário ensinou em palavras cruas no meio da sessão e
// devolve UM registro estruturado. Não grava nada — a escrita passa por confirmação humana
// (Task 9). O texto cru do usuário é preservado pelo call site, não por aqui.

export const CASAS = ["licao", "vocabulario", "frase_banida", "playbook"] as const;
export type Casa = (typeof CASAS)[number];

export const DIMENSOES_CHECK = ["hook", "storytelling", "tema", "ritmo", "comando", "geral"] as const;

// O que fazer com o `termo` — o que a heurística de negação em `gravarEnsinamento` chutava.
export const DIRECOES = ["evitar", "preferir"] as const;
export type Direcao = (typeof DIRECOES)[number];

export interface Ensinamento {
  regra: string;
  casa: Casa;
  destinatarios: Destinatario[];
  dimensao: string;
  evidencia?: string;
  padrao?: string;
  motivo?: string;
  /** só quando casa=vocabulario */
  direcao?: Direcao;
  /** a palavra/expressão em si, sem a prosa da regra; só quando casa=vocabulario */
  termo?: string;
}

// Sem anotação de tipo do SDK de propósito: o teste de contrato lê
// `.input_schema.properties.destinatarios.items.enum`, e `Anthropic.Tool` apaga esse formato
// (input_schema vira índice aberto). A inferência do literal é o que mantém o acesso tipado.
export const ENSINAMENTO_TOOL = {
  name: "registrar_ensinamento",
  description: "Registra o ensinamento do usuário como uma regra estruturada.",
  input_schema: {
    type: "object" as const,
    properties: {
      regra: { type: "string", description: "imperativa, replicável em outro roteiro" },
      casa: { type: "string", enum: [...CASAS] },
      destinatarios: {
        type: "array",
        minItems: 1,
        items: { type: "string", enum: [...DESTINATARIOS] },
        description: "quem precisa saber disto para agir diferente",
      },
      dimensao: { type: "string", enum: [...DIMENSOES_CHECK], description: "só rótulo de filtro" },
      evidencia: { type: "string", description: "trecho literal ancorado, quando houver" },
      padrao: { type: "string", description: "regex JS, só quando casa=frase_banida" },
      motivo: { type: "string", description: "por que a frase é ruim, só quando casa=frase_banida" },
      direcao: {
        type: "string",
        enum: [...DIRECOES],
        description: "o que fazer com o termo, só quando casa=vocabulario",
      },
      termo: {
        type: "string",
        description: "a palavra/expressão em si, sem a prosa da regra, só quando casa=vocabulario",
      },
    },
    required: ["regra", "casa", "destinatarios", "dimensao"],
  },
};

export async function classificarEnsinamento(input: {
  texto: string;
  trecho?: string;
  referenciaId?: string;
  clienteNome?: string;
}): Promise<Ensinamento> {
  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 2000,
    tools: [ENSINAMENTO_TOOL],
    tool_choice: { type: "tool", name: "registrar_ensinamento" },
    system: [{ type: "text", text: agentPrompt("classificador-ensino"), cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `${input.clienteNome ? `CLIENTE: ${input.clienteNome}\n` : ""}${
          input.trecho ? `TRECHO ANCORADO PELO USUÁRIO:\n${input.trecho}\n\n` : ""
        }${input.referenciaId ? `REFERÊNCIA CULPADA: ${input.referenciaId}\n` : ""}
O QUE O USUÁRIO ENSINOU (palavras dele):
${input.texto}

Classifique.`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("classificador-ensino: sem saída estruturada");
  const raw = toolInput(toolUse) as Partial<Ensinamento>;

  // Saída de LLM é fronteira de confiança: enum fora do contrato vira lição que nunca chega a
  // ninguém (destinatário inválido) ou escrita na tabela errada (casa inválida).
  const casa = raw.casa;
  const destinatarios = (raw.destinatarios ?? []).filter((d) => DESTINATARIOS.includes(d));
  // Direção fora do enum não pode virar gravação: `evitar` e `preferir` são listas opostas.
  const direcao = raw.direcao && DIRECOES.includes(raw.direcao) ? raw.direcao : undefined;
  if (!raw.regra || !casa || !CASAS.includes(casa) || !destinatarios.length) {
    console.error(`classificador-ensino inválido — ${JSON.stringify(raw).slice(0, 500)}`);
    throw new Error("classificador-ensino: ensinamento inválido");
  }

  return {
    regra: raw.regra,
    casa,
    destinatarios,
    dimensao: raw.dimensao ?? "geral",
    evidencia: raw.evidencia,
    // padrao/motivo só existem em frase_banida — LLM às vezes preenche por inércia.
    padrao: casa === "frase_banida" ? raw.padrao : undefined,
    motivo: casa === "frase_banida" ? raw.motivo : undefined,
    // idem para direcao/termo, que só existem em vocabulario.
    direcao: casa === "vocabulario" ? direcao : undefined,
    termo: casa === "vocabulario" ? raw.termo : undefined,
  };
}
