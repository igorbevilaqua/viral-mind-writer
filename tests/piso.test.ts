import { describe, expect, test } from "vitest";
import { aberturasRepetidas, medirPiso, metonimias, siglasSemAposto } from "@/lib/pipeline/piso";

// Casos reais das reclamações de 10/10 (sessões do Felipe) e do estudo de outubro.
describe("metonímia de jornal", () => {
  test("capital no lugar do país é pega", () => {
    expect(metonimias("A luz da sua sala passa por um fio que responde a Pequim.")).toHaveLength(1);
    expect(metonimias("A State Grid, outra estatal de Pequim, controla a CPFL.")).toHaveLength(1);
    expect(metonimias("Aí Washington percebeu, e percebeu tarde.")).toHaveLength(1);
  });
  test("Pequim agindo depois de advérbio também é pega", () => {
    expect(metonimias("E quando Washington finalmente percebeu, a resposta foi pânico.")).toHaveLength(1);
    expect(metonimias("Enquanto isso, Pequim foi assinando um por um.")).toHaveLength(1);
  });
  test("capital como lugar passa", () => {
    expect(metonimias("Os moradores de Pequim não tocam neles.")).toEqual([]);
    expect(metonimias("O Washington Post perdeu 40% das visitas.")).toEqual([]);
    expect(metonimias("Um garoto de Brasília estava em aula.")).toEqual([]);
    expect(metonimias("Na última visita do Lula a Pequim saíram mais 27 bilhões.")).toEqual([]);
    expect(metonimias("O acordo foi assinado em Washington.")).toEqual([]);
  });
});

describe("sigla sem explicação", () => {
  test("CPFL solta é pega; com aposto passa", () => {
    expect(siglasSemAposto("A State Grid controla a CPFL desde 2017.")).toEqual(["CPFL"]);
    expect(siglasSemAposto("Ela comprou a CPFL, uma das maiores distribuidoras de luz do país.")).toEqual([]);
    expect(siglasSemAposto("No mesmo mês, o Cade, que é o órgão federal que autoriza compra de empresa, liberou.")).toEqual([]);
    expect(siglasSemAposto("A estatal CMPort ficou com 90% do terminal.")).toEqual([]);
  });
  test("caixa alta de ênfase não é sigla", () => {
    expect(siglasSemAposto("Isso muda TUDO. E AGORA a conta chegou, MUITO MAIS cara.")).toEqual([]);
    expect(siglasSemAposto("Custou US$ 30 milhões.")).toEqual([]);
  });
  test("sigla do dia a dia e segunda menção não contam", () => {
    expect(siglasSemAposto("O STF julgou o caso do INSS.")).toEqual([]);
    expect(siglasSemAposto("A CPFL, distribuidora de luz, cresceu. Depois a CPFL vendeu.")).toEqual([]);
  });
});

describe("medirPiso", () => {
  const hook = "A China comprou o Brasil debaixo do nariz dos Estados Unidos. E quando Washington percebeu, a resposta foi pânico.";
  const corpo =
    "Em 2025, o Brasil recebeu 6,1 bilhões de dólares da China. Isso é 45% a mais.\n\n" +
    "O setor elétrico levou 1,79 bilhão, quase 30% de tudo. A mineração chegou a 1,76 bilhão.\n\n" +
    "Ou seja, a luz da sua casa passa por mão chinesa. Ou seja, o país foi vendido.";
  const r = medirPiso(hook, corpo);

  test("aponta o que o time reclamou", () => {
    expect(r.metonimias).toHaveLength(1);
    expect(r.numeros_por_100).toBeGreaterThan(1.8);
    expect(r.numeros_exatos.length).toBeGreaterThan(1);
    expect(r.ou_seja).toBe(2);
    expect(r.violacoes.some((v) => /capital no lugar do país/.test(v))).toBe(true);
    expect(r.violacoes.some((v) => /Ou seja/.test(v))).toBe(true);
  });

  test("ano não é número exato", () => {
    expect(medirPiso(null, "Em 2025 ele voltou.").numeros_exatos).toEqual([]);
  });

  test("hook repetido na abertura do corpo", () => {
    expect(medirPiso(hook, `${hook}\n\nDepois veio o resto.`).hook_duplicado).toBe(true);
    expect(r.hook_duplicado).toBe(false);
  });
});

describe("fórmula repetida entre roteiros", () => {
  test("abertura acima do dobro da casa é apontada; a que a casa também usa, não", () => {
    const textos = Array.from({ length: 10 }, (_, i) =>
      i < 6 ? `Ele fez algo ${i}. Ou seja, ninguém viu ${i}. Só que parou.` : `Ele fez outra ${i}. Depois parou ${i}.`
    );
    const rep = aberturasRepetidas(textos);
    expect(rep.find((r) => r.abertura === "ou seja")?.fracao).toBe(0.6);
    expect(rep.find((r) => r.abertura === "só que")).toBeUndefined(); // 60% < 2 x 51%
  });
  test("amostra pequena não acusa", () => {
    expect(aberturasRepetidas(["Só que a. Só que b."])).toEqual([]);
  });
});
