import { ANALYST_MODEL, trackedCreate, type UsageLog } from "../anthropic";
import { agentPrompt, fontesBlock, toolArray, toolInput } from "./agents";

// Verificação factual (017): as duas chamadas Anthropic do pipeline de 5 passos.
// Passo 1 extrai as alegações do roteiro FINAL; passo 4 julga o delta com a evidência de busca
// já em mãos. Os passos 2 (filtro de delta, `delta.ts`), 3 (busca) e 5 (ação) não moram aqui.

export const VEREDICTOS = ["confirmado", "impreciso", "falso", "nao_verificavel"] as const;
export type TipoVeredicto = (typeof VEREDICTOS)[number];

export interface Fonte {
  url: string;
  veiculo: string;
  ano: string;
}

export interface Veredicto {
  alegacao: string;
  trecho_literal: string;
  veredicto: TipoVeredicto;
  fonte: Fonte | null;
  correcao: string | null;
  explicacao: string;
}

export interface ItemBusca {
  alegacao: string;
  busca: { texto: string; fontes: string[] };
}

// Teto de saída com folga: o sonnet-5 pensa por padrão dentro do mesmo teto, e thinking que
// come o orçamento trunca o `tool_use` — o mesmo motivo do 8000 em `modelagem.ts:325-327`.
const MAX_TOKENS = 8000;

// Sem anotação `Anthropic.Tool` de propósito nas duas: o teste de contrato lê
// `.input_schema.properties.<x>...enum`, e `Anthropic.Tool` apaga esse formato (input_schema vira
// índice aberto). A inferência do literal é o que mantém o acesso tipado. (Mesmo caso de
// `classify-teaching.ts:24-26`.)
export const ALEGACOES_TOOL = {
  name: "registrar_alegacoes",
  description: "Registra as alegações factuais verificáveis encontradas no roteiro final.",
  input_schema: {
    type: "object" as const,
    properties: {
      alegacoes: {
        type: "array",
        items: { type: "string" },
        description:
          "uma alegação por item, COPIADA LITERALMENTE do roteiro (texto EXATO, caractere a caractere, nunca paráfrase nem resumo) e autocontida o bastante para ser checada sozinha",
      },
    },
    required: ["alegacoes"],
  },
};

export const VERIFICACAO_TOOL = {
  name: "registrar_verificacao",
  description: "Registra o veredicto de cada alegação verificada, um registro por alegação.",
  input_schema: {
    type: "object" as const,
    properties: {
      itens: {
        type: "array",
        items: {
          type: "object" as const,
          properties: {
            alegacao: { type: "string", description: "a alegação como ela aparece no roteiro, copiada" },
            trecho_literal: {
              type: "string",
              description:
                "o texto EXATO do roteiro que carrega o problema, copiado caractere a caractere — ele é substituído LITERALMENTE no roteiro por uma máquina, então paráfrase, resumo ou reescrita fazem a correção não aplicar",
            },
            veredicto: { type: "string", enum: [...VEREDICTOS] },
            fonte: {
              type: "object" as const,
              properties: {
                url: { type: "string" },
                veiculo: { type: "string" },
                ano: { type: "string" },
              },
              required: ["url", "veiculo", "ano"],
              description: "a fonte que sustenta o veredicto; omita só em nao_verificavel",
            },
            correcao: {
              type: "string",
              description:
                "o dado certo, pronto para entrar no lugar do trecho_literal. Só quando veredicto=impreciso E o dado certo é conhecido",
            },
            explicacao: { type: "string", description: "uma frase: o que está errado, ou o que a fonte confirma" },
          },
          required: ["alegacao", "trecho_literal", "veredicto", "explicacao"],
        },
      },
    },
    required: ["itens"],
  },
};

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

function lerFonte(v: unknown): Fonte | null {
  const f = v as Partial<Fonte> | null | undefined;
  const url = str(f?.url);
  // Sem URL não é fonte: é uma citação de memória, exatamente o que o prompt proíbe.
  return url ? { url, veiculo: str(f?.veiculo), ano: str(f?.ano) } : null;
}

/**
 * Fronteira de confiança da saída do modelo. A peça não pode mentir "verificado" (§3.1, §11):
 * qualquer coisa que não seja um veredicto do enum sustentado por fonte cai para
 * `nao_verificavel` — a degradação segura, nunca para `confirmado`.
 */
export function sanitizarVeredicto(raw: unknown, alegacaoOriginal: string): Veredicto {
  const r = (raw ?? {}) as Record<string, unknown>;
  const alegacao = str(r.alegacao) || alegacaoOriginal;
  // Sem trecho_literal a correção cirúrgica não roda, mas o veredicto ainda vale como aviso —
  // a alegação já é texto do roteiro (a tool de extração exige cópia literal).
  const trecho_literal = str(r.trecho_literal) || alegacao;
  const fonte = lerFonte(r.fonte);

  const v = str(r.veredicto) as TipoVeredicto;
  const valido = (VEREDICTOS as readonly string[]).includes(v);
  if (!valido) console.error(`verificador: veredicto fora do enum (${JSON.stringify(r.veredicto)}) — ${alegacao.slice(0, 120)}`);
  // `confirmado` sem fonte não confirma nada. `falso` e `impreciso` sobrevivem sem fonte:
  // rebaixá-los apagaria o aviso, que é o oposto da direção segura.
  const veredicto: TipoVeredicto = !valido || (v === "confirmado" && !fonte) ? "nao_verificavel" : v;

  return {
    alegacao,
    trecho_literal,
    veredicto,
    fonte,
    // correcao só existe em impreciso (§7) — o modelo às vezes preenche por inércia.
    correcao: veredicto === "impreciso" ? str(r.correcao) || null : null,
    explicacao: str(r.explicacao) || (valido ? "" : "veredicto inválido do verificador; tratado como não verificável"),
  };
}

/**
 * Passo 1 (§5): extrai as alegações factuais do roteiro FINAL — o que saiu de roteirista, revisor
 * e humanizador, não o insumo. Falha aqui derruba a verificação inteira: o selo dirá "não
 * verificado", nunca "verificado, 0 problemas" (§11).
 */
export async function extrairAlegacoes(
  roteiro: { hook: string; roteiro: string; comando: string },
  log?: UsageLog
): Promise<string[]> {
  const res = await trackedCreate(log, "verificacao_alegacoes", {
    model: ANALYST_MODEL,
    max_tokens: MAX_TOKENS,
    tools: [ALEGACOES_TOOL],
    tool_choice: { type: "tool", name: "registrar_alegacoes" },
    system: [{ type: "text", text: agentPrompt("verificador"), cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Este é o roteiro FINAL, como vai ao ar. Nesta chamada você NÃO classifica nada — você só levanta o que há de verificável nele.

Liste cada fato verificável: nomes, cargos, números, datas, eventos, relações de causa e efeito, citações, superlativos e status atual. Opinião, promessa, chamada para ação e figura de linguagem NÃO são alegações factuais — deixe fora.

Cada alegação tem que ser COPIADA LITERALMENTE do roteiro, caractere a caractere. O texto que você devolver vai ser casado com o roteiro por uma máquina; paráfrase quebra o casamento. Copie o pedaço mínimo que ainda se sustenta sozinho — se o número só faz sentido com o sujeito, traga a frase inteira.

HOOK:
${roteiro.hook}

ROTEIRO:
${roteiro.roteiro}

COMANDO:
${roteiro.comando}

Registre pela tool.`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("verificador: extração de alegações sem saída estruturada");
  return toolArray<string>(toolInput(toolUse), "alegacoes")
    .map((a) => (typeof a === "string" ? a.trim() : ""))
    .filter(Boolean);
}

/**
 * Passo 4 (§5): julga o delta em lote, com a evidência de busca já em mãos.
 * O agente **não recebe o roteiro** (§6.2) — recebe alegação e evidência. Julgamento de fato não
 * precisa de contexto narrativo, e mandar o roteiro convida o modelo a opinar sobre qualidade,
 * que o próprio prompt dele proíbe.
 */
export async function classificar(itens: ItemBusca[], log?: UsageLog): Promise<Veredicto[]> {
  if (!itens.length) return [];

  const dossieDeBusca = itens
    .map(
      (it, i) => `### ALEGAÇÃO ${i + 1}
${it.alegacao}

RESULTADO DA BUSCA WEB:
${it.busca.texto.trim() || "(a busca não retornou nada)"}
FONTES: ${it.busca.fontes.length ? it.busca.fontes.join(", ") : "(nenhuma)"}`
    )
    .join("\n\n");

  const res = await trackedCreate(log, "verificacao_classificacao", {
    model: ANALYST_MODEL,
    max_tokens: MAX_TOKENS,
    tools: [VERIFICACAO_TOOL],
    tool_choice: { type: "tool", name: "registrar_verificacao" },
    system: [
      { type: "text", text: agentPrompt("verificador"), cache_control: { type: "ephemeral" } },
      { type: "text", text: fontesBlock() },
    ],
    messages: [
      {
        role: "user",
        content: `A busca web já foi feita para cada alegação abaixo e o resultado está junto dela — é sobre essa evidência que você julga. Não invente fonte que não esteja aí: busca vazia, contraditória ou que não fala da alegação = \`nao_verificavel\`, nunca \`confirmado\`.

Você recebe as alegações soltas, sem o roteiro em volta, de propósito. Não comente estilo, qualidade, ordem ou escolha editorial: você verifica fato.

Um registro por alegação, TODAS as ${itens.length}, na mesma ordem, com a alegação copiada exatamente como está aqui.

${dossieDeBusca}

Registre pela tool.`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("verificador: classificação sem saída estruturada");
  const crus = toolArray<Record<string, unknown>>(toolInput(toolUse), "itens");

  // Nenhum corte silencioso: a saída tem uma linha por alegação DE ENTRADA. O modelo casa por
  // texto (a alegação é copiada literalmente); quando ele pula uma, ela volta como
  // `nao_verificavel` em vez de sumir da tabela.
  const porAlegacao = new Map(crus.map((c) => [str(c?.alegacao), c]));
  return itens.map((it, i) => {
    const cru = porAlegacao.get(it.alegacao.trim()) ?? (crus.length === itens.length ? crus[i] : undefined);
    if (!cru) console.error(`verificador: sem veredicto para "${it.alegacao.slice(0, 120)}"`);
    return sanitizarVeredicto(
      cru ?? { alegacao: it.alegacao, explicacao: "o verificador não devolveu veredicto para esta alegação" },
      it.alegacao
    );
  });
}
