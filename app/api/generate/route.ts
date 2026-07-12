import { runPipeline } from "@/lib/pipeline";
import { UUID_RE } from "@/lib/generation";

export const maxDuration = 300; // gerações levam 60-180s; requer Vercel Pro
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { sessionId, narrativeIndex, feedback } = body ?? {};
  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId))
    return new Response("sessionId (uuid) obrigatório", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      // heartbeat: fases silenciosas (Grok fica 30-90s mudo) estouram o idle-timeout do proxy Hostinger
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          /* stream fechado — o guard do runPipeline cuida dos emits */
        }
      }, 15_000);
      try {
        await runPipeline(sessionId, emit, {
          narrativeIndex: typeof narrativeIndex === "number" ? narrativeIndex : undefined,
          feedback: typeof feedback === "string" && feedback.trim() ? feedback.trim() : undefined,
        });
      } finally {
        clearInterval(ping);
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
