// tests/modo-roteiro.test.ts
import { expect, test, vi } from "vitest";
vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
});
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {}, crmDb: null }));
import { formatarMix } from "@/lib/pipeline/modo-roteiro";

test("mix em porcentagem, do maior para o menor, sem modo zerado", () => {
  expect(formatarMix({ historia: 81, mecanismo: 11, demonstracao: 4, panorama: 3, conselho: 0 }))
    .toBe("história 82%, mecanismo 11%, demonstração 4%, panorama 3% (99 roteiros)");
});

test("sem roteiro rotulado, nada", () => {
  expect(formatarMix({})).toBe("");
});
