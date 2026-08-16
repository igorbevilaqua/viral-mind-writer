import { verificarScriptSalvo } from "@/lib/pipeline";
import { guardEmit, UUID_RE } from "@/lib/generation";

// 120 como o Bob, e é o mesmo motivo de as buscas serem paralelas (verificar.ts): N buscas
// sequenciais não caberiam aqui. Fora da geração, então o teto de 300 do /api/generate não vale.
export const maxDuration = 120;
export const dynamic = "force-dynamic";

// Varredura completa (017 §4.3, §8): a mesma verificação da geração, acionada pelo botão da
// tela e sem o filtro de delta — toda alegação é buscada. É a única forma de auditar o próprio
// dossiê pelo produto, e a operação cara da peça.
// Molde do Bob (app/api/bob/route.ts): valida payload → guardEmit → phase/done/error em SSE.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const scriptId = b?.scriptId;
  // O padrão é `completa`: quem chama esta rota é o botão de varredura completa. `delta` fica
  // disponível para reexecutar a rodada barata sem esperar uma nova geração.
  const regime = b?.regime === "delta" ? "delta" : "completa";

  if (typeof scriptId !== "string" || !UUID_RE.test(scriptId))
    return new Response("scriptId (uuid) obrigatório", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = guardEmit((e: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`)));
      try {
        // O progresso É o heartbeat desta rota: N buscas em silêncio estouram o idle-timeout do
        // proxy da Hostinger, que é por que o /api/generate manda `: ping` a cada 15s.
        const { registro } = await verificarScriptSalvo(scriptId, regime, (p) => emit({ type: "phase", ...p }));
        emit({ type: "done", registro });
      } catch (e) {
        // Nada foi gravado (§11): a tela continua dizendo "não verificado", nunca "0 problemas".
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
