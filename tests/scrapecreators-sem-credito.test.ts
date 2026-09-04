import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));

beforeAll(() => {
  process.env.SCRAPECREATORS_API_KEY ??= "test";
});
afterEach(() => vi.unstubAllGlobals());

import { sc } from "@/lib/modelagens/buscar";

const responde = (status: number, body: unknown) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));

// O bug: um carrossel morreu na tela com "ScrapeCreators respondeu 402 em /v1/instagram/post"
// e a sugestão de colar o texto à mão. O motivo real era a conta sem crédito — nada que passa
// pelo `sc` funcionava, e a tela não dizia isso em lugar nenhum.
describe("sc: erro do ScrapeCreators", () => {
  test("402 diz que a conta está sem crédito, não o número do status", async () => {
    responde(402, { success: false, message: "Looks like you're out of credits :(" });
    await expect(sc("/v1/instagram/post", { url: "x" })).rejects.toThrow(/sem créditos/);
  });

  test("outros status herdam a mensagem do próprio serviço", async () => {
    responde(400, { message: "page must be less than 12" });
    await expect(sc("/v1/instagram/search", { query: "x" })).rejects.toThrow(/page must be less than 12/);
  });

  test("erro sem JSON não vaza o erro do parser", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<!DOCTYPE html>502", { status: 502 })));
    await expect(sc("/v1/instagram/post", { url: "x" })).rejects.toThrow(/ScrapeCreators respondeu 502 sem JSON/);
  });
});
