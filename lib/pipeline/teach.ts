import { anthropic, ANALYST_MODEL } from "../anthropic";
import { appDb } from "../db";
import { agentPrompt, toolInput, toolArray } from "./agents";

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

export const DIMENSOES: Dimensao[] = ["hook", "storytelling", "tema", "ritmo", "comando", "geral"];

// Chamada compartilhada do Professor (mesmo tool schema/system): o que varia
// entre "ensinar viral" e "aprender com edição" é só o conteúdo do usuário.
// minItems: viral rende 4-8; uma correção pontual rende 1-3 — forçar 4 faria o
// Professor inventar aprendizados que o pedido não sustenta.
async function runProfessor(userContent: string, minItems = 4): Promise<ExtractedLearning[]> {
  const tool = {
    ...APRENDIZADOS_TOOL,
    input_schema: {
      ...APRENDIZADOS_TOOL.input_schema,
      properties: {
        aprendizados: { ...APRENDIZADOS_TOOL.input_schema.properties.aprendizados, minItems },
      },
    },
  };
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
    max_tokens: 8000, // thinking divide o teto — 3000 truncava o tool_use
    tools: [tool],
    tool_choice: { type: "tool", name: "registrar_aprendizados" },
    system: [
      {
        type: "text",
        text: `${agentPrompt("professor")}\n\n${playbookBlock}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("professor: sem aprendizados estruturados");

  const aprendizados = toolArray<ExtractedLearning>(toolInput(toolUse), "aprendizados").filter(
    (l) => l?.titulo && l?.descricao && DIMENSOES.includes(l.dimensao)
  );
  if (!aprendizados.length) {
    console.error(
      `professor vazio — stop_reason=${res.stop_reason} input=${JSON.stringify(toolUse.input).slice(0, 500)}`
    );
    throw new Error("professor: nenhum aprendizado válido");
  }
  return aprendizados;
}

export async function extractLearnings(input: {
  transcript: string;
  sourceUrl?: string;
  contextNote?: string;
  clientNome?: string;
}): Promise<ExtractedLearning[]> {
  return runProfessor(
    `${input.clientNome ? `CLIENTE (nicho de destino dos aprendizados): ${input.clientNome}\n` : ""}${
      input.sourceUrl ? `FONTE: ${input.sourceUrl}\n` : ""
    }${input.contextNote ? `NOTA DE CONTEXTO DO USUÁRIO: ${input.contextNote}\n` : ""}
TRANSCRIÇÃO DO VÍDEO VIRAL:
${input.transcript.slice(0, 30_000)}

Extraia os aprendizados.`
  );
}

/**
 * Plano 019, Fase 3. Substitui `extractFromEdit`, que mandava dois roteiros de 15k chars e
 * pedia "extraia só das DIFERENÇAS" — estava pagando um modelo para fazer um diff.
 *
 * Aqui o diff já foi feito de graça (lib/edit-diff.ts) e o que chega é um punhado de pares
 * curtos que JÁ SE REPETIRAM N vezes. Mais barato e mais preciso: o modelo não precisa achar
 * a mudança, só nomear a regra por trás dela.
 *
 * `minItems = 1` porque um cluster é uma regra, não oito: forçar 4 faria o Professor inventar
 * o que a evidência não sustenta — o mesmo motivo já registrado em `runProfessor`.
 *
 * O que NÃO chega aqui: mudança factual. Ela é descartada em `observacoesDaEdicao`, antes de
 * virar observação. Correção de dado não é regra de escrita.
 */
export async function extractFromCluster(input: {
  tipo: string;
  n: number;
  exemplos: { antes: string; depois: string }[];
  termo?: { de: string; para: string } | null;
  clientNome?: string;
}): Promise<ExtractedLearning[]> {
  const pares = input.exemplos
    .slice(0, 8)
    .map(
      (e, i) =>
        `--- exemplo ${i + 1} ---\nA SALA ESCREVEU: ${e.antes.slice(0, 800)}\nO HUMANO DEIXOU: ${e.depois.slice(0, 800)}`
    )
    .join("\n\n");

  return runProfessor(
    `${input.clientNome ? `CLIENTE (nicho de destino dos aprendizados): ${input.clientNome}\n` : ""}Um roteirista humano fez a MESMA correção ${input.n} vezes, em roteiros diferentes produzidos pela sala.
Repetição é o que separa decisão editorial de ajuste circunstancial: isto não é o gosto de um vídeo, é um padrão que a sala erra sempre.
Tipo de mudança detectado: ${input.tipo}.${
      input.termo ? `\nTroca recorrente: "${input.termo.de}" vira "${input.termo.para}".` : ""
    }

${pares}

Nomeie a REGRA por trás dessa correção repetida — o que a sala deve passar a fazer para não errar de novo. Descreva o padrão, nunca o caso: a regra vale para roteiros que estes exemplos nem mencionam. Se os exemplos não sustentarem nenhuma regra generalizável, registre um aprendizado só, dizendo isso.`,
    1
  );
}

// Correção na sala (caixa "AJUSTAR O ROTEIRO"): o usuário PEDIU uma mudança e às
// vezes explica a motivação. O PEDIDO é o sinal supervisionado — mais forte quando
// vem com o "porquê". antes→depois entram só como evidência da aplicação.
export async function extractFromCorrection(input: {
  pedido: string;
  antes: string;
  depois: string;
  clientNome?: string;
}): Promise<ExtractedLearning[]> {
  return runProfessor(
    `${input.clientNome ? `CLIENTE (destino do aprendizado): ${input.clientNome}\n` : ""}Um roteirista humano PEDIU uma CORREÇÃO num roteiro que a sala gerou. O PEDIDO é uma decisão editorial deliberada — o sinal mais forte. Extraia o que a sala deve aprender pra NÃO repetir o problema em roteiros futuros, generalizando o princípio quando fizer sentido.

Regras:
- Priorize a MOTIVAÇÃO do pedido quando ela aparecer (o "porquê") — é o aprendizado mais valioso.
- Se for regra específica deste cliente (ex.: "nunca fale mal de juízes"), registre como regra do cliente, não como princípio global.
- Classifique na dimensão certa (hook, comando, storytelling, tema, ritmo, geral).
- Extraia SÓ o que o pedido sustenta. 1 aprendizado sólido vale mais que vários inventados. NÃO invente.
- Use o antes→depois apenas como evidência de como a correção foi aplicada.

PEDIDO DO USUÁRIO:
${input.pedido}

=== ROTEIRO ANTES ===
${input.antes.slice(0, 12_000)}

=== ROTEIRO DEPOIS (já corrigido) ===
${input.depois.slice(0, 12_000)}`,
    1
  );
}

// Observação ao finalizar a sessão (campo "notes"): não há par antes→depois, só o
// comentário do humano sobre o roteiro. É contexto/motivação puro — o sinal que o
// produto mais valoriza. O roteiro entra como referência do que a observação comenta.
export async function extractFromNotes(input: {
  nota: string;
  roteiro: string;
  clientNome?: string;
}): Promise<ExtractedLearning[]> {
  return runProfessor(
    `${input.clientNome ? `CLIENTE (destino do aprendizado): ${input.clientNome}\n` : ""}Ao finalizar uma sessão, um roteirista humano deixou uma OBSERVAÇÃO sobre o roteiro que a sala gerou. É feedback deliberado — extraia o que a sala deve aprender pra melhorar roteiros futuros.

Regras:
- A observação é o sinal. Capture a MOTIVAÇÃO/"porquê" quando aparecer — é o mais valioso.
- Se for regra específica deste cliente (ex.: "nunca fale mal de juízes"), registre como regra do cliente, não como princípio global.
- Classifique na dimensão certa (hook, comando, storytelling, tema, ritmo, geral).
- Extraia SÓ o que a observação sustenta. 1 aprendizado sólido vale mais que vários inventados. NÃO invente.
- O roteiro abaixo é só referência do que a observação comenta.

OBSERVAÇÃO DO ROTEIRISTA:
${input.nota}

=== ROTEIRO (referência) ===
${input.roteiro.slice(0, 12_000)}`,
    1
  );
}
