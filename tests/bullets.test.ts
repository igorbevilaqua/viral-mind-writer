import { describe, expect, test } from "vitest";
import { selecionarBullets, validarTermo, SCORE_MINIMO, TETO_BULLETS } from "@/lib/bullets";

const b = (termo: string, score: number) => ({ termo, score });

describe("selecionarBullets", () => {
  test("corta abaixo do score mínimo (palavra de uma pessoa só não entra no prompt)", () => {
    const out = selecionarBullets([b("Perturbador", SCORE_MINIMO), b("Solitário", 1), b("Morno", 0), b("Ruim", -3)]);
    expect(out).toEqual(["Perturbador"]);
  });

  test("respeita o teto de 15, pelos maiores scores", () => {
    const muitos = Array.from({ length: 40 }, (_, i) => b(`t${i}`, i + 2));
    const out = selecionarBullets(muitos);
    expect(out).toHaveLength(TETO_BULLETS);
    expect(out[0]).toBe("t39"); // maior score primeiro
    expect(out).not.toContain("t0");
  });

  test("veto do cliente derruba o bullet, mesmo com caixa diferente ou dentro de expressão", () => {
    const out = selecionarBullets([b("Desesperado", 9), b("Totalmente desesperado", 8), b("Manipulado", 7)], {
      vetados: ["Desesperado"],
    });
    expect(out).toEqual(["Manipulado"]);
  });

  test("frase banida derruba o bullet que a casa", () => {
    const out = selecionarBullets([b("Chocante", 9), b("Manipulado", 8)], {
      bannedPhrases: [{ pattern: "chocante", label: "clichê de IA" }],
    });
    expect(out).toEqual(["Manipulado"]);
  });

  test("padrão de regex inválido é ignorado em vez de esvaziar a paleta", () => {
    const out = selecionarBullets([b("Manipulado", 8)], { bannedPhrases: [{ pattern: "(((", label: null }] });
    expect(out).toEqual(["Manipulado"]);
  });
});

describe("validarTermo", () => {
  test("aceita palavra e expressão de até 3 palavras", () => {
    expect(validarTermo("Perturbador")).toBeNull();
    expect(validarTermo("  Fome  desesperada ")).toBeNull();
  });

  test("recusa curto, longo demais e frase", () => {
    expect(validarTermo("a")).toBeTruthy();
    expect(validarTermo("x".repeat(41))).toBeTruthy();
    expect(validarTermo("isso aqui é uma frase")).toBeTruthy();
  });
});
