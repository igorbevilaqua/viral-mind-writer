import { expect, test } from "vitest";
import { colunasDaSkill } from "@/lib/skills-catalogo";

test("skill válida é gravada como escolhida; vazia ou fora das quatro vira automática", () => {
  expect(colunasDaSkill("panorama")).toEqual({ skill: "panorama", skill_origem: "escolhida" });
  expect(colunasDaSkill("")).toEqual({ skill: null, skill_origem: null });
  expect(colunasDaSkill("conselho")).toEqual({ skill: null, skill_origem: null });
  expect(colunasDaSkill(undefined)).toEqual({ skill: null, skill_origem: null });
});
