// tests/contexto-skill.test.ts
import { expect, test, vi } from "vitest";

// context.ts cria os clients do Supabase no import; o teste é da função pura.
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {}, crmDb: null }));

import { skillDaSessao } from "@/lib/pipeline/context";

test("coluna inválida ou vazia vira caminho único", () => {
  expect(skillDaSessao({ skill: null, skill_origem: null })).toEqual({ skill: null, skillOrigem: null });
  expect(skillDaSessao({ skill: "conselho", skill_origem: "escolhida" })).toEqual({ skill: null, skillOrigem: null });
});

test("skill válida passa com a origem", () => {
  expect(skillDaSessao({ skill: "historia", skill_origem: "sugerida" })).toEqual({ skill: "historia", skillOrigem: "sugerida" });
});
