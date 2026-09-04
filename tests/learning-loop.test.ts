import { describe, expect, it } from "vitest";
import { attributeLessons, changedRatio, computeCalibration, marcarOrigemEdicao, rankHookMechanisms, hookMechanismOutcomes, textoPreHumano } from "@/lib/learning-loop";

// WP-E: funções puras do ciclo de autoaprimoramento (plano 012, onda 3)

// `isSubstantiveEdit` saiu no plano 019, Fase 4 (o portão de 10% descartava a troca de
// palavra). `changedRatio` continua, agora como distância de pareamento do edit-diff.
describe("changedRatio", () => {
  const base = Array.from({ length: 50 }, (_, i) => `palavra${i}`).join(" ");

  it("texto idêntico → 0", () => {
    expect(changedRatio(base, base)).toBe(0);
  });

  it("corte de metade do texto mede pela versão maior", () => {
    const editada = base.split(" ").slice(0, 25).join(" ");
    expect(changedRatio(base, editada)).toBeGreaterThan(0.4);
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

describe("rankHookMechanisms", () => {
  const mk = (mecs: string[], cli: string | null) => ({ mecanismos: mecs, clienteId: cli });

  it("rankeia por frequência e computa share por escopo", () => {
    const rows = [
      ...Array.from({ length: 6 }, () => mk(["Contraste Extremo"], "c1")),
      ...Array.from({ length: 4 }, () => mk(["Revelação Secreta"], "c1")),
    ];
    const out = rankHookMechanisms(rows, 8, 6);
    const global = out.find((o) => o.scope === "global")!;
    expect(global.total).toBe(10);
    expect(global.ranking[0]).toEqual({ mecanismo: "Contraste Extremo", n: 6, share: 0.6 });
    expect(global.ranking[1].mecanismo).toBe("Revelação Secreta");
    // cliente c1 tem o mesmo perfil
    expect(out.find((o) => o.scope === "client:c1")).toBeTruthy();
  });

  it("escopo abaixo de minSample não emite ranking", () => {
    const out = rankHookMechanisms([mk(["Urgência"], "c9"), mk(["Urgência"], "c9")], 8, 6);
    expect(out.find((o) => o.scope === "client:c9")).toBeUndefined();
    expect(out.find((o) => o.scope === "global")).toBeUndefined(); // 2 < 8
  });

  it("mecanismos repetidos no mesmo hook contam uma vez", () => {
    const rows = Array.from({ length: 8 }, () => mk(["Contraste Extremo", "Contraste Extremo"], null));
    const global = rankHookMechanisms(rows, 8, 6).find((o) => o.scope === "global")!;
    expect(global.ranking[0].n).toBe(8);
  });
});

describe("hookMechanismOutcomes", () => {
  it("classifica mecanismo por ratio mediano da sala", () => {
    const out = hookMechanismOutcomes(
      [
        { ratio: 1.5, mecanismo: "Contraste Extremo" },
        { ratio: 1.3, mecanismo: "Contraste Extremo" },
        { ratio: 1.4, mecanismo: "Contraste Extremo" },
        { ratio: 0.5, mecanismo: "Urgência" },
        { ratio: 0.6, mecanismo: "Urgência" },
        { ratio: 0.7, mecanismo: "Urgência" },
      ],
      3
    );
    const ce = out.find((o) => o.mecanismo === "Contraste Extremo")!;
    const urg = out.find((o) => o.mecanismo === "Urgência")!;
    expect(ce.verdict).toBe("promover"); // mediana 1.4 > 1.2
    expect(urg.verdict).toBe("derrubar"); // mediana 0.6 < 0.8
    expect(out[0].mecanismo).toBe("Contraste Extremo"); // ordenado por ratio desc
  });

  it("ignora mecanismos abaixo do mínimo de amostra e ratios/mecanismo inválidos", () => {
    const out = hookMechanismOutcomes(
      [
        { ratio: 2, mecanismo: "Superlativo" }, // só 1 → abaixo do mínimo
        { ratio: null, mecanismo: "Revelação Secreta" },
        { ratio: 1, mecanismo: null },
      ],
      3
    );
    expect(out).toEqual([]);
  });
});
