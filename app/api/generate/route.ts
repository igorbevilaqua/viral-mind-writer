import { runPipeline } from "@/lib/pipeline";

export const maxDuration = 300; // gerações levam 40-90s; requer Vercel Pro
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { sessionId } = await req.json();
  if (!sessionId) return new Response("sessionId obrigatório", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      await runPipeline(sessionId, emit);
      controller.close();
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
