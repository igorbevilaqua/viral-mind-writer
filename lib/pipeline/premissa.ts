import { ANALYST_MODEL, trackedCreate } from "../anthropic";
import { agentPrompt, clientInsightBlock, taughtBlock, toolInput } from "./agents";
import { clientPrefsBlock } from "./draft";
import { dedash } from "./slop-lint";
import type { GenerationContext } from "./types";

// A PREMISSA é o argumento que o vídeo defende — 1-2 frases, afirmativa, falsificável.
// Não é o tema (assunto), não é o ângulo (recorte), não é o gancho (isca): é a tese.
//
// Três fontes, um slot só (resolvido em runPipeline, decidido por `origemDaPremissa` abaixo):
//   1. digitada pelo usuário → adotada VERBATIM, este módulo nem roda. É a garantia mais
//      forte que existe: sem modelo no caminho, não há deriva possível. Só existe em sessão SEM
//      modelagem: com material marcado, a tese é a do vídeo e não há dois donos dela.
//   2. extraída da modelagem (compreensao.argumento_central) → confirmada pelo usuário. Depois
//      de confirmada ela está na coluna e vence como qualquer premissa já resolvida.
//   3. derivada do tema → `derivePremissa` abaixo.
//
// Depois de resolvida ela é congelada em vm_sessions.premissa e TODO estágio recebe a mesma
// string literal via `premissaBlock`. Ninguém re-deriva, ninguém parafraseia.

// Placeholders que um modelo forçado por `tool_choice` produz quando não tem o que dizer — foi
// assim que a string literal `<UNKNOWN>` virou o fio condutor de um roteiro inteiro em produção.
const PLACEHOLDER =
  /^(?:<[^>]*>|n\.?\s*\/?\s*a\.?|n[aã]o (?:se )?aplic\w*|unknown|desconhecid\w*|indefinid\w*|sem premissa|null|undefined|[-–—.?]+)$/i;

// A outra forma de premissa fabricada, encontrada em produção na sessão d5ebc218: a tese vem
// legítima e então o modelo continua escrevendo a serialização crua da tool, e o campo termina
// em `</premissa>\n<parameter name="angulo_contraintuitivo">…`. Passa em tudo o que o
// PLACEHOLDER testa — é longa, tem dezenas de palavras — e foi para o roteirista sob
// "INEGOCIÁVEL" com a marcação dentro. Diferente do PLACEHOLDER, aqui a busca é no meio do
// texto, não ancorada: o vazamento vem DEPOIS da tese boa.
const VAZAMENTO_DE_TOOL = /<\/|<(?:parameter|premissa|invoke|function|antml)\b/i;

/**
 * A guarda de sanidade da premissa: a ÚLTIMA linha antes de congelar a tese, nunca a primeira.
 * A correção principal é não fabricar premissa (não derivar sem insumo, não seguir com autópsia
 * sem tese); isto aqui é o cinto, e existe porque a próxima fabricação vai ter outro formato.
 *
 * Pura de propósito — as asserções vivem em tests/premissa-origem.test.ts.
 */
export function teseAceitavel(texto: string | null | undefined): boolean {
  const t = (texto ?? "").trim();
  if (PLACEHOLDER.test(t)) return false;
  if (VAZAMENTO_DE_TOOL.test(t)) return false;
  // Uma tese é uma afirmação de 1-2 frases. Abaixo disso é rótulo, sigla ou recusa — não tese.
  return t.length >= 15 && t.split(/\s+/).length >= 3;
}

export type OrigemPremissa = "digitada" | "modelagem" | "derivada" | "sem_tese";

/**
 * Quem manda na premissa, em uma decisão pura (Regra 2): já resolvida (digitada sem modelagem,
 * ou confirmada da modelagem num run anterior) > extraída da modelagem > derivada do tema.
 *
 * `temModelagem` aqui significa "esta execução tem que tirar a tese do vídeo" — falso quando a
 * premissa já está na coluna, e é isso que impede o run 2 de voltar a pausar para sempre.
 *
 * Autópsia sem tese utilizável é `sem_tese`: FALHA declarada, nunca uma degradação silenciosa
 * para a derivação (era o `if` sem `else` que fabricava premissa).
 */
export function origemDaPremissa(e: {
  digitada?: string | null;
  temModelagem: boolean;
  teseExtraida?: string | null;
}): OrigemPremissa {
  if ((e.digitada ?? "").trim()) return "digitada";
  if (!e.temModelagem) return "derivada";
  return teseAceitavel(e.teseExtraida) ? "modelagem" : "sem_tese";
}

const PREMISSA_TOOL = {
  name: "registrar_premissa",
  description: "Registra a premissa (tese central) que o vídeo vai defender.",
  input_schema: {
    type: "object" as const,
    properties: {
      premissa: {
        type: "string",
        description:
          "A tese que o vídeo defende, em 1 ou 2 frases AFIRMATIVAS. O que o espectador precisa " +
          "passar a acreditar ao final. Não é o assunto ('a briga entre Milei e Lula'), é a " +
          "afirmação sobre o assunto ('cada ataque público do Milei é uma peça de uma " +
          "negociação comercial que já estava em curso'). Precisa ser contestável: se ninguém " +
          "pode discordar, não é premissa, é descrição.",
      },
      angulo_contraintuitivo: {
        type: ["string", "null"],
        description:
          "O que o senso comum acredita e esta premissa contraria, em 1 frase. null se a premissa " +
          "confirma o senso comum. Quando existe, é a matéria-prima natural do hook.",
      },
      o_que_provaria: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: { type: "string" },
        description:
          "Que tipo de evidência sustentaria esta premissa (número, cronologia, declaração, " +
          "comparação). Vira a pauta de busca do pesquisador — ele procura ISTO, não o tema solto.",
      },
    },
    required: ["premissa", "angulo_contraintuitivo", "o_que_provaria"],
  },
};

export interface PremissaDerivada {
  premissa: string;
  angulo_contraintuitivo: string | null;
  o_que_provaria: string[];
}

// Nó 0 do pipeline: roda ANTES da pesquisa, porque é a premissa que diz ao pesquisador o que
// procurar. Só entra em cena quando o usuário não digitou e não há modelagem de onde extrair.
export async function derivePremissa(ctx: GenerationContext): Promise<PremissaDerivada> {
  const temaContexto = [
    clientInsightBlock(ctx, ["tema", "geral"], 6),
    taughtBlock(ctx, "premissa"),
    clientPrefsBlock(ctx),
  ]
    .filter(Boolean)
    .join("\n\n");

  // Materiais do usuário (notícia, documento, roteiro de referência) são a matéria-prima mais
  // direta da tese: se ele colou uma notícia, a premissa provavelmente está lá dentro. O anexo de
  // modelagem fica FORA — a tese dele sai da autópsia, não de uma segunda leitura.
  const materiais = ctx.attachments
    .filter((a) => !a.is_modelagem && a.raw_content)
    .map((a) => `## ${a.kind}${a.url ? ` (${a.url})` : ""}\n${a.raw_content!.slice(0, 3000)}`)
    .join("\n\n");

  // Regra 1, e a trava mora AQUI (não em quem chama): sem tema e sem material não há o que
  // derivar, e pedir ao modelo — forçado por tool_choice — que preencha o campo assim mesmo é
  // fabricar premissa. Era exatamente esse o caminho que gravava `<UNKNOWN>` em vm_sessions.
  if (!ctx.prompt.trim() && !materiais)
    throw new Error(
      "Não há tema nem material de onde derivar a premissa desta sessão. " +
        "Digite o tema (ou a premissa) e conjure de novo."
    );

  const res = await trackedCreate(ctx.usageLog, "premissa", {
    model: ANALYST_MODEL,
    // Resposta curtíssima (1-2 frases + listas), mas o sonnet-5 divide o teto com o thinking —
    // e aqui pensar é o trabalho todo. 4000 dá folga sem desperdício.
    max_tokens: 4000,
    tools: [PREMISSA_TOOL],
    tool_choice: { type: "tool", name: "registrar_premissa" },
    system: `${agentPrompt("premissa")}${temaContexto ? `\n\n${temaContexto}` : ""}`,
    messages: [
      {
        role: "user",
        content:
          `O usuário não declarou a premissa: ele deu só o tema/brief abaixo. Extraia dele a tese ` +
          `mais forte e mais defensável que um vídeo curto pode sustentar, e registre.\n\n` +
          `TEMA/BRIEF:\n${ctx.prompt}` +
          `${materiais ? `\n\nMATERIAIS FORNECIDOS PELO USUÁRIO:\n${materiais}` : ""}`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("premissa: modelo não retornou tese estruturada");
  const input = toolInput(toolUse);
  const premissa = String(input.premissa ?? "").trim();
  if (!premissa) throw new Error("premissa: tese vazia — nenhum roteiro é gerado sem premissa");
  return {
    premissa: dedash(premissa),
    angulo_contraintuitivo: input.angulo_contraintuitivo ? dedash(String(input.angulo_contraintuitivo)) : null,
    o_que_provaria: Array.isArray(input.o_que_provaria)
      ? input.o_que_provaria.filter((s): s is string => typeof s === "string").map(dedash).slice(0, 4)
      : [],
  };
}

// `premissaBlock` (o bloco literal enviado a todos os agentes) mora em agents.ts, junto dos
// outros formatadores de bloco: é o módulo mais baixo no grafo de imports, então draft.ts e este
// arquivo podem ambos consumi-lo sem fechar ciclo.
