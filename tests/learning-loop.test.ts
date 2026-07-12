import { describe, expect, it } from "vitest";
import { attributeLessons, changedRatio, computeCalibration, isSubstantiveEdit } from "@/lib/learning-loop";

// WP-E: funções puras do ciclo de autoaprimoramento (plano 012, onda 3)

describe("isSubstantiveEdit / changedRatio", () => {
  const base = Array.from({ length: 50 }, (_, i) => `palavra${i}`).join(" ");

  it("texto idêntico → 0, não substantivo", () => {
    expect(changedRatio(base, base)).toBe(0);
    expect(isSubstantiveEdit(base, base)).toBe(false);
  });

  it("mudança pequena (1 palavra em 50) → abaixo do limiar de 10%", () => {
    const editada = base.replace("palavra7", "trocada7");
    expect(isSubstantiveEdit(base, editada)).toBe(false);
  });

  it("reescrita de metade do texto → substantivo", () => {
    const metade = base.split(" ").slice(0, 25).join(" ");
    const editada = `${metade} ${Array.from({ length: 25 }, (_, i) => `novotexto${i}`).join(" ")}`;
    expect(isSubstantiveEdit(base, editada)).toBe(true);
  });

  it("corte de metade do texto → substantivo (mede pela versão maior)", () => {
    const editada = base.split(" ").slice(0, 25).join(" ");
    expect(changedRatio(base, editada)).toBeGreaterThan(0.4);
  });

  it("strings vazias → não substantivo", () => {
    expect(isSubstantiveEdit("", "")).toBe(false);
  });

  it("reordenação pura conta como igual (limitação deliberada do multiset)", () => {
    expect(changedRatio("um dois tres", "tres um dois")).toBe(0);
  });
});

describe("computeCalibration", () => {
  it("n < 5 → insuficiente, sem métricas", () => {
    const c = computeCalibration([
      { predicted: 80, ratio: 2 },
      { predicted: 20, ratio: 0.3 },
    ]);
    expect(c.n).toBe(2);
    expect(c.insuficiente).toBe(true);
    expect(c.correlacao_direcional).toBeNull();
    expect(c.vies).toBeNull();
  });

  it("ignora linhas sem predicted ou ratio", () => {
    const c = computeCalibration([
      { predicted: null, ratio: 1.2 },
      { predicted: 70, ratio: null },
      { predicted: 70, ratio: 1.2 },
    ]);
    expect(c.n).toBe(1);
  });

  it("correlação direcional: só previsões fora da zona 40-60 contam", () => {
    const c = computeCalibration([
      { predicted: 80, ratio: 1.5 }, // acerto (previu alto, foi alto)
      { predicted: 90, ratio: 0.5 }, // erro
      { predicted: 20, ratio: 0.4 }, // acerto (previu baixo, foi baixo)
      { predicted: 30, ratio: 1.2 }, // erro
      { predicted: 50, ratio: 1.0 }, // zona neutra — fora do direcional
    ]);
    expect(c.n).toBe(5);
    expect(c.correlacao_direcional).toBe(50);
    expect(c.insuficiente).toBeUndefined();
    expect(c.resumo).toContain("50%");
  });

  it("viés positivo quando superestima (previsto 90, real 0.2x)", () => {
    const rows = Array.from({ length: 5 }, () => ({ predicted: 90, ratio: 0.2 }));
    // 0.9 - min(0.2/2, 1) = 0.9 - 0.1 = 0.8
    expect(computeCalibration(rows).vies).toBe(0.8);
  });

  it("ratio normalizado satura em 2x (não pune previsão certa de megaviral)", () => {
    const rows = Array.from({ length: 5 }, () => ({ predicted: 100, ratio: 8 }));
    expect(computeCalibration(rows).vies).toBe(0); // 1.0 - min(8/2, 1) = 0
  });
});

describe("attributeLessons", () => {
  it("mediana por lição e flag needs_review para flop consistente", () => {
    const out = attributeLessons([
      { ratio: 0.5, lessonIds: ["a", "b"] },
      { ratio: 0.7, lessonIds: ["a"] },
      { ratio: 2.0, lessonIds: ["b"] },
      { ratio: null, lessonIds: ["a"] }, // sem média do cliente = sem sinal
    ]);
    const a = out.find((x) => x.lessonId === "a")!;
    expect(a.usos).toBe(2);
    expect(a.ratio_mediano).toBe(0.6);
    expect(a.needs_review).toBe(true);
    const b = out.find((x) => x.lessonId === "b")!;
    expect(b.ratio_mediano).toBe(1.25);
    expect(b.needs_review).toBe(false);
  });

  it("1 uso só nunca marca, mesmo flopando", () => {
    const out = attributeLessons([{ ratio: 0.1, lessonIds: ["a"] }]);
    expect(out[0].needs_review).toBe(false);
  });

  it("mediana resiste a outlier: 2 flops + 1 viral não salva a lição", () => {
    const out = attributeLessons([
      { ratio: 0.3, lessonIds: ["a"] },
      { ratio: 0.5, lessonIds: ["a"] },
      { ratio: 9.0, lessonIds: ["a"] },
    ]);
    expect(out[0].ratio_mediano).toBe(0.5);
    expect(out[0].needs_review).toBe(true);
  });

  it("sem outcomes com ratio → vazio", () => {
    expect(attributeLessons([{ ratio: undefined, lessonIds: ["a"] }])).toEqual([]);
  });
});
