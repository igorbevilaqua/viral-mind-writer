import { describe, expect, it } from "vitest";
import { attributeLessons, changedRatio, computeCalibration, marcarOrigemEdicao, rankByLift, hookMechanismOutcomes, textoPreHumano } from "@/lib/learning-loop";

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

describe("rankByLift", () => {
  const mk = (labels: string[], top: boolean, cli: string | null = null) => ({ labels, clienteId: cli, top });
  // 100 vídeos, 25 no top (P(top)=0.25 por construção do estrato). "Prevalente" está em TODOS
  // (lift 1.0 exato); "Raro" está em 12 (i<12), 10 deles no top (i<10; os outros 15 tops vêm de 12..26).
  const rows = Array.from({ length: 100 }, (_, i) => mk(i < 12 ? ["Prevalente", "Raro"] : ["Prevalente"], i < 10 || (i >= 12 && i < 27)));

  it("rótulo 100% prevalente com lift 1.0 fica abaixo do raro com lift alto", () => {
    const global = rankByLift(rows).find((o) => o.scope === "global")!;
    expect(global.total).toBe(100);
    expect(global.ranking[0].label).toBe("Raro");
    expect(global.ranking[0]).toMatchObject({ n: 12, top_n: 10 });
    expect(global.ranking[0].lift).toBeGreaterThan(3);
    expect(global.ranking[1]).toMatchObject({ label: "Prevalente", n: 100, top_n: 25, lift: 1 });
    // share diria o contrário: Prevalente em 100% dos vencedores
  });

  it("n < 10 fica fora, mesmo com 100% no top", () => {
    const extra = Array.from({ length: 9 }, () => mk(["Pouquinho"], true));
    const global = rankByLift([...rows, ...extra]).find((o) => o.scope === "global")!;
    expect(global.ranking.find((r) => r.label === "Pouquinho")).toBeUndefined();
  });

  it("IC cruzando 1 → lift_lb < 1 (lift pontual 1.2 não é evidência com n=20)", () => {
    const list = Array.from({ length: 40 }, (_, i) => mk(i < 20 ? ["Fraco"] : [], i < 6 || (i >= 20 && i < 24)));
    const fraco = rankByLift(list).find((o) => o.scope === "global")!.ranking.find((r) => r.label === "Fraco")!;
    expect(fraco.lift).toBe(1.2); // 6/20 = 0.3 → 1.2×
    expect(fraco.lift_lb).toBeLessThan(1);
    expect(fraco.lift_lb).toBeLessThan(fraco.lift);
  });

  it("escopo abaixo do mínimo não emite; cliente exige mais amostra que global", () => {
    const c1 = Array.from({ length: 35 }, (_, i) => mk(["X"], i < 9, "c1"));
    const out = rankByLift(c1, 30, 6, 0.25, 40);
    expect(out.find((o) => o.scope === "global")).toBeTruthy(); // 35 ≥ 30
    expect(out.find((o) => o.scope === "client:c1")).toBeUndefined(); // 35 < 40
    expect(rankByLift(c1.slice(0, 10))).toEqual([]);
  });

  it("rótulo repetido no mesmo vídeo conta uma vez", () => {
    const list = Array.from({ length: 40 }, (_, i) => mk(["A", "A"], i < 10));
    expect(rankByLift(list)[0].ranking[0]).toMatchObject({ label: "A", n: 40, top_n: 10 });
  });
});

describe("hookMechanismOutcomes", () => {
  const rep = (mec: string, ratios: number[]) => ratios.map((ratio) => ({ ratio, mecanismo: mec }));

  it("promove só quando mais da metade repete com Wilson acima de 0.5; derruba no espelho", () => {
    const out = hookMechanismOutcomes([
      ...rep("Contraste Extremo", [1.5, 1.3, 1.4, 1.6, 1.3, 1.5, 1.4, 1.3, 1.7, 1.5]), // 10/10 > 1.2
      ...rep("Urgência", [0.5, 0.6, 0.7, 0.4, 0.5, 0.6, 0.3, 0.7, 0.5, 0.6]), // 10/10 < 0.8
    ]);
    expect(out.find((o) => o.mecanismo === "Contraste Extremo")!.verdict).toBe("promover");
    expect(out.find((o) => o.mecanismo === "Urgência")!.verdict).toBe("derrubar");
    expect(out[0].mecanismo).toBe("Contraste Extremo"); // ordenado por ratio mediano desc
  });

  it("mediana boa mas IC cruzando 0.5 → neutro (7 de 10 repetem)", () => {
    const out = hookMechanismOutcomes(rep("Superlativo", [1.5, 1.4, 1.3, 1.6, 1.5, 1.4, 1.3, 1.0, 0.9, 1.1]));
    expect(out[0].ratio_mediano).toBeGreaterThan(1.2);
    expect(out[0].verdict).toBe("neutro");
  });

  it("abaixo de 10 por mecanismo não opina; ratios/mecanismo inválidos saem", () => {
    const out = hookMechanismOutcomes([
      ...rep("Superlativo", [2, 2, 2, 2, 2, 2, 2, 2, 2]), // 9 → abaixo do mínimo
      { ratio: null, mecanismo: "Revelação Secreta" },
      { ratio: 1, mecanismo: null },
    ]);
    expect(out).toEqual([]);
  });
});
