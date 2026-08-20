// tests/delta.test.ts
import { describe, expect, test } from "vitest";
import { ehRastreada, extrairAncoras } from "@/lib/pipeline/delta";

describe("extrairAncoras", () => {
  test("quantidade com magnitude é extraída", () => {
    expect(extrairAncoras("O mercado movimentou 45 bilhões no ano.")).toContain("45 bilhões");
  });
  test("percentual é extraído", () => {
    expect(extrairAncoras("A taxa subiu para 37,5% em seguida.")).toContain("37,5%");
  });
  test("data é extraída", () => {
    expect(extrairAncoras("A lei entrou em vigor em 12/03/2024.")).toContain("12/03/2024");
    expect(extrairAncoras("A lei entrou em vigor em 2023.")).toContain("2023");
  });
  test("nome próprio fora de início de frase é extraído", () => {
    expect(extrairAncoras("O relatório do Banco Central saiu.")).toContain("Banco Central");
  });
  test("palavra comum não vira âncora", () => {
    expect(extrairAncoras("o mercado reagiu mal ao relatório")).toEqual([]);
  });
  test("palavra em início de frase não vira âncora", () => {
    expect(extrairAncoras("Mercado reagiu mal. Empresas caíram.")).toEqual([]);
  });
});

const dossie = `
  O Banco Central divulgou que o setor movimentou 45 bilhões em 2023.
  A inadimplência ficou em 37,5% segundo a Serasa.
`;

describe("ehRastreada", () => {
  test("todas as âncoras no dossiê → rastreada", () => {
    expect(ehRastreada("Segundo o Banco Central, foram 45 bilhões.", dossie)).toBe(true);
  });
  test("uma âncora ausente → delta", () => {
    expect(ehRastreada("Segundo o Banco Central, foram 90 bilhões.", dossie)).toBe(false);
  });
  test("alegação sem âncora nenhuma → delta", () => {
    expect(ehRastreada("o setor cresceu muito e ninguém esperava", dossie)).toBe(false);
  });
  test("dossiê vazio → tudo delta", () => {
    expect(ehRastreada("Segundo o Banco Central, foram 45 bilhões.", "")).toBe(false);
  });
  test("dossiê ausente → tudo delta, sem lançar", () => {
    expect(() => ehRastreada("Foram 45 bilhões.", undefined as unknown as string)).not.toThrow();
    expect(ehRastreada("Foram 45 bilhões.", undefined as unknown as string)).toBe(false);
  });
  // Toda alegação daqui para baixo carrega as DUAS classes de âncora (quantidade + nome próprio):
  // é o que `ehRastreada` passou a exigir, e sem isso estes casos passariam a testar o portão de
  // classes em vez do que vieram testar — o casamento normalizado de `normQ`.
  // `norm` preserva acentos de propósito (peça 1); o que ele colapsa é pontuação, espaço e caixa.
  test("ignora pontuação, espaço e caixa na comparação", () => {
    expect(ehRastreada("a inadimplência da Serasa foi de 37,5%!", "...a Serasa: ficou em 37,5%, disse.")).toBe(true);
    expect(ehRastreada("o dado da SERASA é de 37,5%.", dossie)).toBe(true);
  });
  test("número não casa como substring de outro número", () => {
    expect(ehRastreada("o caso do Serasa é de 2023.", "o processo 120233 do Serasa foi arquivado")).toBe(false);
  });

  // A colisão mais cara possível: `norm` apaga a vírgula, então sem tratamento "37,5%" e
  // "1,5 bilhão" viram os tokens "375" e "15 bilhão" — e uma alegação inventada passaria como
  // rastreada contra um dossiê que fala de outro número inteiramente.
  test("decimal não colide com o inteiro sem separador", () => {
    expect(ehRastreada("a taxa da Serasa é de 37,5%.", "o lote da Serasa tinha 375 unidades")).toBe(false);
    expect(ehRastreada("a Vale gastou 1,5 bilhão.", "a Vale arrecadou 15 bilhões no periodo")).toBe(false);
  });

  test("o decimal ainda casa consigo mesmo", () => {
    expect(ehRastreada("a taxa da Serasa é de 37,5%.", "a taxa da Serasa ficou em 37,5% em marco")).toBe(true);
  });

  // O portão de duas classes: âncora de uma classe só não rastreia, porque com uma âncora a barra
  // é trivial — e era por aí que passava metade das alegações inventadas (tests/delta-vazamento).
  test("só quantidade, sem nome próprio → delta", () => {
    expect(ehRastreada("foram 45 bilhões no ano", dossie)).toBe(false);
  });
  test("só nome próprio, sem quantidade → delta", () => {
    expect(ehRastreada("o relatório do Banco Central saiu ontem", dossie)).toBe(false);
  });
  // As duas classes existem no dossiê, mas em linhas diferentes: o dossiê não AFIRMA a junção.
  test("âncoras em linhas diferentes do dossiê → delta", () => {
    expect(ehRastreada("a Serasa apurou 45 bilhões", dossie)).toBe(false);
  });
});
