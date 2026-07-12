import { describe, expect, test } from "vitest";
import { maturityGate, MATURITY_DAYS } from "@/lib/etl-gate";

const NOW = Date.parse("2026-07-11T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

describe("maturityGate", () => {
  test("publicado há <14 dias: em observação, verdict neutro, score 0 mesmo com ratio ruim", () => {
    const g = maturityGate(0.3, daysAgo(5), NOW);
    expect(g).toEqual({ maduro: false, em_observacao: true, verdict: "neutro", score: 0 });
  });

  test("exatamente 14 dias: maduro", () => {
    const g = maturityGate(1.0, daysAgo(MATURITY_DAYS), NOW);
    expect(g.maduro).toBe(true);
    expect(g.em_observacao).toBe(false);
  });

  test("maduro com ratio < 0.8: anti-padrão (evitar), score = ratio", () => {
    const g = maturityGate(0.5, daysAgo(30), NOW);
    expect(g).toEqual({ maduro: true, em_observacao: false, verdict: "evitar", score: 0.5 });
  });

  test("maduro com ratio > 1.2: repetir", () => {
    expect(maturityGate(1.5, daysAgo(30), NOW).verdict).toBe("repetir");
  });

  test("limiares são exclusivos: 0.8 e 1.2 exatos são neutros", () => {
    expect(maturityGate(0.8, daysAgo(30), NOW).verdict).toBe("neutro");
    expect(maturityGate(1.2, daysAgo(30), NOW).verdict).toBe("neutro");
  });

  test("maduro sem ratio (sem média do cliente): neutro, score 0", () => {
    const g = maturityGate(null, daysAgo(30), NOW);
    expect(g.verdict).toBe("neutro");
    expect(g.score).toBe(0);
    expect(g.maduro).toBe(true);
  });

  test("sem published_at (roteiro antigo): idade desconhecida = em observação", () => {
    const g = maturityGate(2.0, null, NOW);
    expect(g.em_observacao).toBe(true);
    expect(g.verdict).toBe("neutro");
    expect(g.score).toBe(0);
  });

  test("published_at inválido: em observação", () => {
    expect(maturityGate(1.0, "não-é-data", NOW).em_observacao).toBe(true);
  });
});
