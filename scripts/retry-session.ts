import { runPipeline } from "../lib/pipeline";

const sessionId = process.argv[2];
if (!sessionId) throw new Error("uso: tsx scripts/retry-session.ts <sessionId>");

void (async () => {
  await runPipeline(sessionId, (e) => {
    const ev = e as { type: string; phase?: string; message?: string; scriptId?: string };
    if (ev.type === "token") return; // não polui o log com o streaming do roteiro
    console.log(`[${ev.type}]`, ev.phase ?? ev.message ?? ev.scriptId ?? "");
  });
})();
