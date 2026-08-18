import { afterEach, describe, expect, it, vi } from "vitest";
import { sseResponse } from "@/lib/sse";

// O "erro de rede" ao Sugerir tema: o proxy corta a conexão quando ela fica ociosa, e as fases
// silenciosas do ideador (Grok 30-90s, síntese com thinking) são exatamente isso. O heartbeat
// existia só no /api/generate. Este teste é o que impede a próxima rota de stream de nascer sem.

afterEach(() => vi.useRealTimers());

const texto = (res: Response) => new Response(res.body).text();

describe("resposta SSE", () => {
  it("serializa cada evento no formato que o cliente parseia", async () => {
    const res = sseResponse<{ type: string; n?: number }>(async (emit) => {
      emit({ type: "phase", n: 1 });
      emit({ type: "done" });
    });
    expect(await texto(res)).toBe('data: {"type":"phase","n":1}\n\ndata: {"type":"done"}\n\n');
  });

  it("declara o content-type de stream e desliga transformação no caminho", () => {
    const res = sseResponse(async () => {});
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    // sem `no-transform` um proxy pode bufferizar o stream inteiro e entregar tudo no fim
    expect(res.headers.get("Cache-Control")).toContain("no-transform");
  });

  it("manda heartbeat durante a fase silenciosa, que é o que evita a conexão ser cortada", async () => {
    vi.useFakeTimers();
    let liberar!: () => void;
    const trabalho = new Promise<void>((r) => (liberar = r));
    const res = sseResponse(() => trabalho);
    const reader = res.body!.getReader();

    await vi.advanceTimersByTimeAsync(16_000);
    const { value } = await reader.read();
    expect(new TextDecoder().decode(value)).toBe(": ping\n\n");

    liberar();
    await reader.cancel();
  });

  it("erro que ninguém tratou vira evento, não stream mudo (a tela girava para sempre)", async () => {
    const res = sseResponse(async () => {
      throw new Error("o Grok caiu");
    });
    const t = await texto(res);
    expect(t).toContain('"type":"error"');
    expect(t).toContain("o Grok caiu");
  });
});
