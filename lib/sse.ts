import { guardEmit } from "./generation";

// ── Uma resposta SSE, montada num lugar só ───────────────────────────────────────────────────
// As cinco rotas de stream da casa (generate, suggest-themes, bob, verificar, kasparov) repetiam
// este mesmo bloco à mão. O HEARTBEAT, que é o que impede o proxy da Hostinger de cortar uma
// conexão durante uma fase silenciosa, existia em UMA delas — e foi por isso que "Sugerir tema"
// morreu com "erro de rede" no meio da pesquisa do Grok, que fica 30-90s sem emitir nada.
// Boilerplate copiado diverge; a correção mora aqui e vale para todas de uma vez.

// 15s: o mesmo intervalo que o /api/generate já usava em produção sem nenhum corte reportado.
// ponytail: número herdado, não medido. Se um proxy novo cortar antes, o ajuste é este valor.
const PING_MS = 15_000;

export function sseResponse<T>(trabalho: (emit: (e: T) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // guard: desconexão do cliente não derruba o trabalho em andamento (ele segue até gravar).
      const emit = guardEmit((e: T) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`)));
      // Comentário SSE: o cliente ignora, o proxy vê tráfego e não declara a conexão ociosa.
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          /* stream já fechado — o guard cuida do resto */
        }
      }, PING_MS);
      try {
        await trabalho(emit);
      } catch (e) {
        // Rede de segurança: as rotas tratam o próprio erro e este catch nunca dispara nelas.
        // Quando dispara, é erro que ninguém tratou — e fechar o stream calado deixaria a tela
        // girando para sempre, que é pior que a mensagem feia.
        emit({ type: "error", message: e instanceof Error ? e.message : String(e) } as T);
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
