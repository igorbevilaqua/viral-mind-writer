import { describe, expect, it, vi } from "vitest";
// só as funções puras: o banco nunca é tocado aqui
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));
import { auc, calibracao, mesMaduro, parAPar } from "@/lib/preditor/medir";

describe("medição mensal do preditor", () => {
  it("par a par conta só dentro do grupo, empate vale meio", () => {
    const r = parAPar([
      // grupo a: topo 0,6 contra 0,4 (acerto) e 0,6 (empate) -> 1,5 de 2
      { grupo: "a", y: 1, p: 0.6 }, { grupo: "a", y: 0, p: 0.4 }, { grupo: "a", y: 0, p: 0.6 },
      // grupo b: topo 0,2 contra 0,9 (erro) -> 0 de 1
      { grupo: "b", y: 1, p: 0.2 }, { grupo: "b", y: 0, p: 0.9 },
      // grupo c: sem topo, não entra (e o 0,99 dele não pesa contra ninguém)
      { grupo: "c", y: 0, p: 0.99 },
    ]);
    expect(r.acc).toBeCloseTo(1.5 / 3, 10);
    expect(r.pares).toBe(3);
    expect(r.grupos).toBe(2);
    expect(r.lo!).toBeLessThanOrEqual(r.acc!);
    expect(r.hi!).toBeGreaterThanOrEqual(r.acc!);
  });

  it("AUC perfeita e invertida", () => {
    const l = [0.1, 0.2, 0.3, 0.4].map((p, i) => ({ grupo: "g", y: i >= 2 ? 1 : 0, p }));
    expect(auc(l)).toBe(1);
    expect(auc(l.map((x) => ({ ...x, p: -x.p })))).toBe(0);
  });

  it("calibração pelas faixas da tela", () => {
    const c = calibracao([
      { grupo: "g", y: 0, p: 0.1 }, { grupo: "g", y: 1, p: 0.14 },
      { grupo: "g", y: 0, p: 0.15 }, { grupo: "g", y: 0, p: 0.2 },
      { grupo: "g", y: 1, p: 0.45 },
    ]);
    expect(c.map((x) => [x.faixa, x.n, x.observado])).toEqual([["<15%", 2, 0.5], ["15-25%", 2, 0], ["25-40%", 0, null], ["40%+", 1, 1]]);
    expect(c[0].previsto).toBeCloseTo(0.12, 10);
  });

  it("mês maduro: o último que terminou 30+ dias antes", () => {
    expect(mesMaduro("2026-10-23")).toBe("2026-08");
    expect(mesMaduro("2026-10-30")).toBe("2026-09");
    expect(mesMaduro("2026-11-05")).toBe("2026-09");
    expect(mesMaduro("2027-01-31")).toBe("2026-12");
  });
});
