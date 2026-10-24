import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));

beforeAll(() => {
  process.env.SUPADATA_API_KEY ??= "test";
  process.env.SCRAPECREATORS_API_KEY ??= "test";
  delete process.env.OPENAI_API_KEY; // plano C (Whisper) fora destes testes
});
afterEach(() => vi.unstubAllGlobals());

import { fetchTranscript, jsonOuErro } from "@/lib/transcribe";

const HTML_502 = "<!DOCTYPE html>\n<html><body>502 Bad Gateway</body></html>";
const REEL = "https://www.instagram.com/reels/Db3w0wNhjab/";

describe("jsonOuErro", () => {
  test("resposta HTML: erro cita o serviço e o status, não o parser", async () => {
    await expect(jsonOuErro(new Response(HTML_502, { status: 502 }), "Supadata")).rejects.toThrow(
      /Supadata respondeu 502 sem JSON/
    );
  });

  test("JSON de erro passa: quem chama decide a mensagem pelo corpo", async () => {
    const res = new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    expect(await jsonOuErro(res, "Supadata")).toEqual({ message: "Unauthorized" });
  });
});

describe("fetchTranscript: Instagram", () => {
  test("Supadata devolvendo HTML cai no ScrapeCreators em vez de morrer", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const u = String(input);
      if (u.includes("supadata")) return new Response(HTML_502, { status: 502 });
      if (u.includes("scrapecreators"))
        return Response.json({ success: true, credits_remaining: 22, transcripts: [{ text: "e a Marvel que" }] });
      throw new Error(`fetch inesperado: ${u}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchTranscript(REEL)).toEqual({ title: undefined, text: "e a Marvel que" });
    expect(fetchMock.mock.calls.map(([u]) => String(u)).some((u) => u.includes("scrapecreators"))).toBe(true);
  });

  // A tela recebe uma frase acionável. O que cada fonte respondeu vai no `debug`, para o admin.
  test("as fontes falhando: frase para a tela, status de cada fonte no debug", async () => {
    vi.stubGlobal("fetch", async () => new Response(HTML_502, { status: 502 }));
    type ErroComDebug = Error & { debug?: { falhas: { motivo: string }[] } };
    const erro = (await fetchTranscript(REEL).then(
      () => new Error("não lançou"),
      (e: ErroComDebug) => e
    )) as ErroComDebug;
    expect(erro.message).toMatch(/nenhum serviço de transcrição conseguiu ler/);
    expect(erro.debug?.falhas.map((f) => f.motivo).join(" ")).toMatch(/ScrapeCreators respondeu 502 sem JSON/);
  });

  // O bug relatado: o usuário viu "Looks like you're out of credits :(" — o inglês do
  // serviço — numa tela em português, porque este caminho tinha o próprio fetch e não passava
  // pelo `sc`, que já traduzia o 402.
  test("conta sem crédito: a mensagem é a nossa, em português, e não o inglês do serviço", async () => {
    vi.stubGlobal("fetch", async (input: string | URL | Request) =>
      String(input).includes("supadata")
        ? new Response(HTML_502, { status: 502 })
        : Response.json(
            { success: false, message: "Looks like you're out of credits :( You'll need to buy more." },
            { status: 402 }
          )
    );
    const erro = await fetchTranscript(REEL).catch((e: Error) => e.message);
    expect(erro).toMatch(/sem créditos/);
    expect(erro).not.toMatch(/out of credits/);
  });
});
