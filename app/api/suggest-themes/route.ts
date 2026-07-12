import { suggestThemes } from "@/lib/pipeline/suggest";
import { guardEmit, UUID_RE } from "@/lib/generation";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const clientId = body?.clientId;
  if (typeof clientId !== "string" || !UUID_RE.test(clientId))
    return new Response("clientId (uuid) obrigatório", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // guard: desconexão do cliente não derruba a sugestão em andamento
      const emit = guardEmit((e: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`)));
      try {
        await suggestThemes(clientId, emit);
      } finally {
        try {
          controller.close();
        } catch {
          /* cliente já desconectou */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
