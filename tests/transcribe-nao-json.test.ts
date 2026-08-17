import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));

beforeAll(() => {
  process.env.SUPADATA_API_KEY ??= "test";
  process.env.SCRAPECREATORS_API_KEY ??= "test";
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

  test("as duas fontes falhando: o erro final é o da segunda, com status", async () => {
    vi.stubGlobal("fetch", async () => new Response(HTML_502, { status: 502 }));
    await expect(fetchTranscript(REEL)).rejects.toThrow(/ScrapeCreators respondeu 502 sem JSON/);
  });
});
