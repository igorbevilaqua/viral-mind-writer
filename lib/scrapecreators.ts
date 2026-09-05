// Cliente da API ScrapeCreators. Uma conta, uma chave, três consumidores: caça de modelagens
// (lib/modelagens/buscar.ts), leitura de carrossel (lib/carrossel.ts) e plano B da transcrição
// de reel (lib/transcribe.ts).
//
// Existe como módulo próprio porque a transcrição tinha o SEU fetch, com o seu tratamento de
// erro — e por isso ficou de fora quando o `sc` aprendeu a explicar o 402. O usuário Felipe
// recebeu "Looks like you're out of credits :(" em inglês numa tela em português. Com um
// cliente só, o próximo endpoint que entrar não repete o erro.

/**
 * Erro upstream costuma vir em HTML (página 502/504, challenge do Cloudflare, redirect pra
 * landing page). `res.json()` direto estoura "Unexpected token '<', "<!DOCTYPE "..." e é ESSE
 * texto que chega ao usuário na tela — em vez do status do serviço e do que fazer a respeito.
 *
 * Genérico de propósito: Supadata e YouTube também passam por aqui.
 */
export async function jsonOuErro(res: Response, quem: string) {
  const body = await res.text();
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(
      `${quem} respondeu ${res.status} sem JSON (${body.slice(0, 120).replace(/\s+/g, " ").trim()}) — ` +
        `provável instabilidade do serviço; tente de novo ou cole a transcrição manualmente`
    );
  }
}

const BASE = "https://api.scrapecreators.com";
const ALERTA_CREDITOS = 2000;

// A resposta traz o saldo; sem guardar isso os créditos acabam em silêncio no meio de uma
// sugestão e a caça simplesmente para de trazer resultado, sem erro visível.
let ultimoSaldo: number | null = null;

/** Saldo visto na última resposta desta execução, ou null se nenhuma chamada respondeu ainda. */
export const creditosVistos = () => ultimoSaldo;

export async function sc<T>(
  path: string,
  params: Record<string, string | number>,
  sinal?: AbortSignal
): Promise<T> {
  const chave = process.env.SCRAPECREATORS_API_KEY;
  if (!chave) throw new Error("SCRAPECREATORS_API_KEY não configurada");

  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url, { headers: { "x-api-key": chave }, signal: sinal });
  if (!res.ok) {
    // 402 tem um significado só nesta API, e é o único fato acionável quando acontece: a CONTA
    // acabou, então nada que passa por aqui funciona — nem busca, nem carrossel, nem reel. Dito
    // em português porque a alternativa é o inglês do serviço aparecendo na tela do usuário,
    // que foi exatamente o que aconteceu antes desta função existir.
    if (res.status === 402)
      throw new Error(
        "a conta ScrapeCreators está sem créditos: nenhuma busca, transcrição ou carrossel funciona até recarregar em scrapecreators.com"
      );
    const corpo = await jsonOuErro(res, "ScrapeCreators");
    throw new Error(corpo.message ?? corpo.error ?? `ScrapeCreators respondeu ${res.status} em ${path}`);
  }

  const data = (await res.json()) as T & { credits_remaining?: number };
  if (typeof data.credits_remaining === "number") {
    ultimoSaldo = data.credits_remaining;
    if (data.credits_remaining < ALERTA_CREDITOS)
      console.warn(`[scrapecreators] créditos baixos: ${data.credits_remaining}`);
  }
  return data;
}
