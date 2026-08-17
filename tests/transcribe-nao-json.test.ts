import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));

import { jsonOuErro } from "@/lib/transcribe";

describe("jsonOuErro", () => {
  test("resposta HTML: erro cita o serviço e o status, não o parser", async () => {
    const res = new Response("<!DOCTYPE html>\n<html><body>502 Bad Gateway</body></html>", { status: 502 });
    await expect(jsonOuErro(res, "Supadata")).rejects.toThrow(/Supadata respondeu 502 sem JSON/);
  });

  test("JSON de erro passa: quem chama decide a mensagem pelo corpo", async () => {
    const res = new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    expect(await jsonOuErro(res, "Supadata")).toEqual({ message: "Unauthorized" });
  });
});
