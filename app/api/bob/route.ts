import { bobAssist, type BobModo } from "@/lib/pipeline/bob";
import { guardEmit, UUID_RE } from "@/lib/generation";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// Bob inline com progresso: transmite as fases reais (pensando/pesquisando/escrevendo)
// e devolve o texto + fontes no evento final. Sem custo de token extra — só avisos.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const sessionId = b?.sessionId;
  const modo: BobModo = b?.modo === "reescrever" ? "reescrever" : "completar";
  const instrucao = typeof b?.instrucao === "string" ? b.instrucao.trim() : "";

  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId))
    return new Response("sessionId (uuid) obrigatório", { status: 400 });
  if (!instrucao) return new Response("instrucao obrigatória", { status: 400 });
  if (modo === "reescrever" && !String(b?.trecho ?? "").trim())
    return new Response("trecho obrigatório para reescrever", { status: 400 });

  const input = {
    modo,
    roteiro: String(b?.roteiro ?? ""),
    antes: String(b?.antes ?? ""),
    depois: String(b?.depois ?? ""),
    trecho: b?.trecho ? String(b.trecho) : undefined,
    instrucao,
    evitar: b?.evitar ? String(b.evitar) : undefined,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = guardEmit((e: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`)));
      try {
        const r = await bobAssist(sessionId, input, (p) => emit({ type: "phase", ...p }));
        emit({ type: "done", ...r });
      } catch (e) {
        emit({ type: "error", message: e instanceof Error ? e.message : String(e) });
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
