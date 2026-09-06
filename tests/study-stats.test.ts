import { describe, expect, test } from "vitest";
import { wilsonLower, wilsonUpper } from "@/lib/calibration";
import { bottomNoEstrato, celulaEncolhida, cliffsDelta, consistencia, dominanciaDe, lift, percentil, quartis, topNoEstrato } from "@/lib/study-stats";

// WP-D (plano 020): a estatística do estudo é pré-registrada — estes testes fixam o que ela faz.

const linhas = (label: string, k: number, n: number, cliente = "c1") =>
  Array.from({ length: n }, (_, i) => ({ label, top: i < k, cliente }));

describe("lift", () => {
  test("base conhecida: 20 de 40 no top = lift 2", () => {
    const [r] = lift(linhas("A", 20, 40));
    expect(r.n).toBe(40);
    expect(r.k).toBe(20);
    expect(r.p).toBe(0.5);
    expect(r.lift).toBe(2);
    expect(r.flag).toBe("ok");
  });

  test("lift_lb < lift < lift_ub, com e sem encolhimento", () => {
    for (const r of lift([...linhas("A", 20, 40), ...linhas("B", 12, 12), ...linhas("C", 0, 15)])) {
      expect(r.lift_lb).toBeLessThan(r.lift);
      expect(r.lift).toBeLessThan(r.lift_ub);
    }
  });

  test("n<10 suprimido; 10–29 encolhido com flag", () => {
    const res = lift([...linhas("S", 5, 9), ...linhas("E", 10, 10)]);
    expect(res.find((r) => r.label === "S")!.flag).toBe("suprimido");
    const e = res.find((r) => r.label === "E")!;
    expect(e.flag).toBe("baixa_confianca");
    // (10 + 0.25·20) / (10 + 20) = 0.5 → lift 2, não 4
    expect(e.p).toBe(0.5);
    expect(e.lift).toBe(2);
  });

  test("minN por opção (8 por cliente)", () => {
    expect(lift(linhas("A", 4, 8), { minN: 8 })[0].flag).toBe("baixa_confianca");
  });

  test("dominância e consistência", () => {
    const rows = [...linhas("A", 8, 10, "c1"), ...linhas("A", 1, 10, "c2"), ...linhas("A", 3, 3, "c3")];
    const [r] = lift(rows);
    expect(r.dominancia).toBeCloseTo(10 / 23, 3);
    expect(r.dominante).toBe("c1");
    expect(r.consistencia).toEqual({ positivos: 1, clientes: 2 }); // c3 tem n<8, não conta
    expect(dominanciaDe([null, null]).dominancia).toBe(0);
    expect(consistencia([], 0.25)).toEqual({ positivos: 0, clientes: 0 });
  });
});

describe("wilson", () => {
  test("upper ≥ lower, limitado a [0,1]", () => {
    expect(wilsonUpper(10, 10)).toBe(1);
    expect(wilsonLower(0, 10)).toBe(0);
    expect(wilsonUpper(5, 20)).toBeGreaterThan(wilsonLower(5, 20));
    expect(wilsonUpper(0, 0)).toBe(1);
  });
});

describe("cliffsDelta", () => {
  test("idênticas = 0, disjuntas = ±1", () => {
    expect(cliffsDelta([1, 2, 3], [1, 2, 3])).toBe(0);
    expect(cliffsDelta([4, 5, 6], [1, 2, 3])).toBe(1);
    expect(cliffsDelta([1, 2, 3], [4, 5, 6])).toBe(-1);
    expect(cliffsDelta([], [1])).toBe(0);
  });
});

describe("celulaEncolhida", () => {
  test("n=0 devolve o prior; prior clampado", () => {
    const c = celulaEncolhida(0, 0, 0.3, 0.35);
    expect(c.prior).toBeCloseTo(0.4, 6);
    expect(c.p).toBeCloseTo(0.4, 6);
    expect(celulaEncolhida(0, 0, 0.05, 0.05).prior).toBe(0.05);
    expect(celulaEncolhida(0, 0, 0.9, 0.9).prior).toBe(0.95);
  });

  test("n grande domina o prior", () => {
    expect(celulaEncolhida(60, 60, 0.2, 0.2).p).toBeGreaterThan(0.75);
  });
});

describe("topNoEstrato / quartis / percentil", () => {
  test("marca 25% em cada estrato", () => {
    const rows = [
      ...Array.from({ length: 8 }, (_, i) => ({ e: "a", v: i })),
      ...Array.from({ length: 12 }, (_, i) => ({ e: "b", v: 100 - i })),
    ];
    const out = topNoEstrato(rows, (r) => r.e, (r) => r.v);
    expect(out.filter((r) => r.e === "a" && r.top).map((r) => r.v).sort()).toEqual([6, 7]);
    expect(out.filter((r) => r.e === "b" && r.top)).toHaveLength(3);
    expect(out.filter((r) => r.e === "b" && r.top).every((r) => r.v >= 98)).toBe(true);
  });

  test("bottomNoEstrato preserva o top já marcado", () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({ e: "a", v: i }));
    const out = bottomNoEstrato(topNoEstrato(rows, (r) => r.e, (r) => r.v), (r) => r.e, (r) => r.v);
    expect(out.filter((r) => r.top).map((r) => r.v)).toEqual([6, 7]);
    expect(out.filter((r) => r.bottom).map((r) => r.v)).toEqual([0, 1]);
  });

  test("quartis e percentil", () => {
    expect(quartis([1, 2, 3, 4, 5, 6, 7, 8])).toEqual({ q1: 3, q2: 5, q3: 7 });
    expect(percentil(5, [1, 2, 3, 4])).toBe(1);
    expect(percentil(2.5, [1, 2, 3, 4])).toBe(0.5);
    expect(percentil(3, [3, 3])).toBe(0.5);
  });
});
