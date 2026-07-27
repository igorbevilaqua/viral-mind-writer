import { describe, expect, it } from "vitest";
import { aggregatePreferences, wilsonLower, pairFromCandidates, axisValue } from "@/lib/calibration";

describe("wilsonLower", () => {
  it("amostra pequena tem confiança baixa mesmo com 100% de vitória", () => {
    expect(wilsonLower(2, 2)).toBeLessThan(0.5); // 2/2 → LB baixo
    expect(wilsonLower(90, 100)).toBeGreaterThan(0.8); // volume alto → LB alto
  });
  it("n=0 → 0", () => expect(wilsonLower(0, 0)).toBe(0));
});

describe("aggregatePreferences", () => {
  const v = (winnerValue: string, loserValue: string, clientId: string | null = null) =>
    ({ clientId, axis: "comprimento" as const, winnerValue, loserValue });

  it("só emite preferência acima do mínimo de amostra e confiança", () => {
    // 3 votos: 'curto' vence sempre, mas n<minN → nada
    const poucos = aggregatePreferences([v("curto", "longo"), v("curto", "longo"), v("curto", "longo")], 8);
    expect(poucos).toEqual([]);
  });

  it("volume suficiente com sinal claro → preferência confiante", () => {
    const votos = Array.from({ length: 20 }, () => v("curto", "longo"));
    const out = aggregatePreferences(votos, 8);
    const curto = out.find((p) => p.valor === "curto" && p.scope === "global")!;
    expect(curto.winrate).toBe(1);
    expect(curto.confianca).toBeGreaterThan(0.8);
  });

  it("expande para escopo do cliente + global", () => {
    const votos = Array.from({ length: 12 }, () => v("curto", "longo", "c1"));
    const out = aggregatePreferences(votos, 8);
    expect(out.some((p) => p.scope === "client:c1" && p.valor === "curto")).toBe(true);
    expect(out.some((p) => p.scope === "global" && p.valor === "curto")).toBe(true);
  });
});

describe("pairFromCandidates", () => {
  it("monta par escolhido vs vice de mecanismo diferente", () => {
    const pair = pairFromCandidates(
      [
        { hook: "hook A", mecanismo: "Contraste Extremo" },
        { hook: "hook B", mecanismo: "Contraste Extremo" }, // mesmo mecanismo → pulado
        { hook: "hook C", mecanismo: "Revelação Secreta" },
      ],
      "c1"
    )!;
    expect(pair.option_a.mecanismo).toBe("Contraste Extremo");
    expect(pair.option_b.mecanismo).toBe("Revelação Secreta");
    expect(pair.axis).toBe("mecanismo");
    expect(pair.source).toBe("generation");
  });

  it("sem dois mecanismos distintos → null", () => {
    expect(
      pairFromCandidates([{ hook: "a", mecanismo: "Contraste Extremo" }, { hook: "b", mecanismo: "Contraste Extremo" }], null)
    ).toBeNull();
  });

  it("axisValue lê mecanismo e atributos", () => {
    expect(axisValue({ texto: "x", mecanismo: "Urgência" }, "mecanismo")).toBe("Urgência");
    expect(axisValue({ texto: "x", atributos: { comprimento: "curto" } }, "comprimento")).toBe("curto");
  });
});
