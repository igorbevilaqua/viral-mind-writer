import OpenAI from "openai";

// xAI expõe API compatível com OpenAI — reusa o SDK já instalado (embeddings).
// Instanciado sob demanda (não no import) para o build não exigir a chave.
export function grokClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://api.x.ai/v1",
    apiKey: process.env.GROK_API_KEY,
  });
}

export const RESEARCH_MODEL = process.env.VM_RESEARCH_MODEL ?? "grok-4.3";

/**
 * Separa falha de INFRA (crédito esgotado, cota, chave recusada) de falha de conteúdo.
 * Mora aqui porque é o único módulo que TODO chamador do Grok importa — classificar uma vez
 * na raiz é menos código que uma guarda em cada `catch`, e é o que fecha o furo real: um 429
 * de crédito virava dossiê vazio (roteiro escrito da memória do modelo, sem fonte para nada)
 * e alegação "não verificável" com a mesma cara de "procurei e não achei fonte".
 *
 * Devolve a frase que o usuário lê, ou `null` quando é falha transitória (500, timeout) —
 * essa continua fail-soft, como sempre foi.
 */
export function falhaDeInfra(e: unknown): string | null {
  const status = (e as { status?: unknown } | null)?.status;
  const msg = String((e as { message?: unknown } | null)?.message ?? "");
  if (status === 401 || status === 403) return "a chave da API de pesquisa foi recusada";
  // 402/429 é o caminho do crédito na x.ai; o regex pega o mesmo erro vindo com outro status.
  if (status === 402 || status === 429 || /insufficient|credit|quota|billing|saldo/i.test(msg))
    return "o crédito ou a cota da API de pesquisa acabou";
  return null;
}
