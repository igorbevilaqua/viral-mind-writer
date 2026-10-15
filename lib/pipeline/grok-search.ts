import { grokClient } from "../grok";
import { modeloDe } from "../llm-config";
import { recordUsage, type UsageLog } from "../anthropic";

// Busca web com fonte estruturada. Mora em módulo próprio, e não dentro do bob.ts onde nasceu,
// porque passou a ter dois consumidores: o Bob (pedido factual na edição) e o passo 3 da
// verificação (017 §5). Casa própria também apaga um problema de carga — `bob.ts` importa
// `context.ts` → `lib/db.ts`, que instancia o Supabase no topo do módulo e lança sem env;
// quem só quer buscar não deveria pagar esse grafo.

// As fontes da web voltam como annotations url_citation no output — não confiáveis
// só no texto. Lê as citations de verdade e usa o regex do texto como reforço.
function citationUrls(res: unknown): string[] {
  const urls: string[] = [];
  const output = (res as { output?: unknown[] })?.output;
  if (!Array.isArray(output)) return urls;
  for (const item of output) {
    const content = (item as { content?: unknown[] })?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      const anns = (c as { annotations?: unknown[] })?.annotations;
      if (!Array.isArray(anns)) continue;
      for (const a of anns) {
        const ann = a as { type?: string; url?: string };
        if (ann.type === "url_citation" && ann.url) urls.push(ann.url);
      }
    }
  }
  return urls;
}

// É o único ponto do sistema que devolve fonte ESTRUTURADA (`annotations.url_citation`) em vez
// de prosa com links raspados por regex — sem ela, o passo 3 da verificação seria infra nova.
export async function grokPesquisa(
  query: string,
  log?: UsageLog,
  fase = "busca"
): Promise<{ texto: string; fontes: string[] }> {
  const t0 = Date.now();
  const modelo = await modeloDe("busca");
  const res = await grokClient().responses.create({
    model: modelo,
    instructions:
      "Você é um pesquisador factual. Responda EXATAMENTE o que foi pedido com dados concretos (números, datas) e a URL da fonte de cada dado. Direto e conciso — sem opinião, sem enrolação.",
    input: query,
    tools: [{ type: "web_search" }] as never,
  });
  recordUsage(log, fase, modelo, Date.now() - t0, res.usage);
  const texto = res.output_text ?? "";
  const fontes = [...new Set([...citationUrls(res), ...(texto.match(/https?:\/\/[^\s)\]]+/g) ?? [])])];
  return { texto, fontes };
}
