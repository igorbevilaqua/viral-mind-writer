// tests/skills.test.ts
import { describe, expect, test } from "vitest";
import { ehSkill, SKILLS } from "@/lib/skills-catalogo";
import { quandoDasSkills, secaoDaSkill, SECOES, skillBlock, textoDaSkill } from "@/lib/pipeline/skills";

describe("skills por modo (plano 025)", () => {
  test.each(SKILLS)("%s tem as 8 seções, todas com texto", (s) => {
    for (const secao of SECOES) expect(secaoDaSkill(s, secao).length, `${s}/${secao}`).toBeGreaterThan(80);
  });

  test.each(SKILLS)("%s não tem travessão (regra do produto)", (s) => {
    expect(textoDaSkill(s)).not.toMatch(/[—–]/);
  });

  test("sem skill na sessão, nenhum bloco", () => {
    expect(skillBlock({ skill: null }, "roteiro")).toBe("");
  });

  test("o bloco traz o resumo medido e só a seção pedida", () => {
    const b = skillBlock({ skill: "historia" }, "hook");
    expect(b).toContain("SKILL DO ROTEIRO: HISTÓRIA");
    expect(b).toContain("retenção final");
    expect(b).toContain(secaoDaSkill("historia", "hook").slice(0, 40));
    expect(b).not.toContain(secaoDaSkill("historia", "roteiro").slice(0, 40));
  });

  test("ehSkill aceita só as quatro", () => {
    expect(ehSkill("panorama")).toBe(true);
    expect(ehSkill("conselho")).toBe(false);
    expect(ehSkill(null)).toBe(false);
  });

  test("o quando das quatro vai junto para a escolha automática", () => {
    const q = quandoDasSkills();
    for (const s of SKILLS) expect(q).toContain(`(${s})`);
  });
});
