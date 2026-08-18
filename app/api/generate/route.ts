import { runPipeline } from "@/lib/pipeline";
import { UUID_RE } from "@/lib/generation";
import { sseResponse } from "@/lib/sse";
import { barrarNaRota } from "@/lib/autorizacao";
import type { PipelineEvent } from "@/lib/pipeline/types";

export const maxDuration = 300; // gerações levam 60-180s; requer Vercel Pro
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { sessionId, narrativeIndex, feedback } = body ?? {};
  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId))
    return new Response("sessionId (uuid) obrigatório", { status: 400 });

  // AQUI, na fronteira: dentro do start() do stream o contexto da request já respondeu e
  // cookies() estoura (lib/hub.ts:41). O pipeline nunca autoriza — ele já roda autorizado.
  const barrado = await barrarNaRota({ sessao: sessionId });
  if (barrado) return barrado;

  // O heartbeat que nasceu aqui (fases silenciosas estouram o idle-timeout do proxy Hostinger)
  // mora agora em lib/sse.ts e vale para todas as rotas de stream.
  return sseResponse<PipelineEvent>((emit) =>
    runPipeline(sessionId, emit, {
      narrativeIndex: typeof narrativeIndex === "number" ? narrativeIndex : undefined,
      feedback: typeof feedback === "string" && feedback.trim() ? feedback.trim() : undefined,
    })
  );
}
