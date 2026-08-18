import { suggestThemes, type SuggestEvent } from "@/lib/pipeline/suggest";
import { UUID_RE } from "@/lib/generation";
import { sseResponse } from "@/lib/sse";

// 300 como o /api/generate: a caça de modelagens e a pesquisa do Grok correm em paralelo, mas a
// síntese ainda vem depois delas, e 120s cortava a sugestão no meio (o cliente via "erro de rede").
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const clientId = body?.clientId;
  if (typeof clientId !== "string" || !UUID_RE.test(clientId))
    return new Response("clientId (uuid) obrigatório", { status: 400 });

  return sseResponse<SuggestEvent>((emit) => suggestThemes(clientId, emit));
}
