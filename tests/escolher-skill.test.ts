// tests/escolher-skill.test.ts
import { describe, expect, test, vi } from "vitest";

const capturado = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  return { params: null as null | { system: string; messages: { content: string }[] } };
});
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {}, crmDb: null }));
vi.mock("@/lib/llm-config", () => ({ modeloDe: async () => "claude-sonnet-5" }));
vi.mock("@/lib/pipeline/modo-roteiro", async (orig) => ({
  ...(await orig<object>()),
  mixDoCliente: async () => ({ historia: 8, mecanismo: 2 }),
}));
vi.mock("@/lib/anthropic", async (orig) => ({
  ...(await orig<object>()),
  trackedCreate: async (_log: unknown, _fase: string, params: never) => {
    capturado.params = params;
    return { content: [{ type: "tool_use", name: "registrar_skill", input: { skill: "historia", motivo: "a virada do fundador prova a tese", alternativa: "mecanismo" } }] };
  },
}));

import { escolherSkill, lerEscolha } from "@/lib/pipeline/escolher-skill";
import type { GenerationContext } from "@/lib/pipeline/types";

const ctx = { prompt: "a Havaianas", premissa: "a Havaianas virou marca global porque mudou de público", clientId: "c1", clientPrefs: { nome: "Cliente" }, usageLog: {} } as unknown as GenerationContext;

describe("escolha da skill", () => {
  test("lê a escolha e descarta modo que não é skill", () => {
    expect(lerEscolha({ skill: "panorama", motivo: "m", alternativa: null })).toEqual({ skill: "panorama", motivo: "m", alternativa: null });
    expect(lerEscolha({ skill: "conselho", motivo: "m" })).toBeNull();
    expect(lerEscolha({ skill: "historia", motivo: "m", alternativa: "publi" })?.alternativa).toBeNull();
  });

  test("manda as quatro definições, a premissa e o mix só como desempate", async () => {
    const e = await escolherSkill(ctx);
    expect(e).toEqual({ skill: "historia", motivo: "a virada do fundador prova a tese", alternativa: "mecanismo" });
    expect(capturado.params!.system).toContain("QUANDO USAR CADA SKILL");
    expect(capturado.params!.system).toContain("(panorama)");
    expect(capturado.params!.messages[0].content).toContain("a Havaianas virou marca global");
    expect(capturado.params!.messages[0].content).toContain("só desempata");
  });
});
