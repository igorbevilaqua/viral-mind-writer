// tests/delta-vazamento.test.ts
// Sonda de vazamento do filtro de delta (017 §4.2, §14.3), contra dossiês REAIS de produção
// (sessões do BMW/Toyota hidrogênio e do Circus/robô-cozinha, projeto qclvrddrqulgfzccndnl).
//
// O filtro de delta é o ponto que decide o que NÃO é verificado: um falso `rastreada` é invenção
// passando batida com selo verde. Este arquivo é a prova de que ela não passa. Na primeira medição
// 5 destas 10 alegações inventadas eram marcadas como rastreadas.
//
// Alegação inventada = o dossiê NÃO a sustenta, mas ela reusa material dele (número, nome ou os
// dois). É esse reuso que enganava o filtro.
import { describe, expect, test } from "vitest";
import { ehRastreada, extrairAncoras } from "@/lib/pipeline/delta";

// Trechos literais dos dossiês gravados em `vm_sessions.artifacts.dossie`.
const DOSSIE_BMW = `**FATOS E NÚMEROS**
- Em 5 de setembro de 2024, BMW e Toyota anunciaram o fortalecimento da parceria para desenvolver sistema de célula de combustível de terceira geração para veículos elétricos a hidrogênio (FCEV) de passageiros; BMW planeja lançar o primeiro modelo de produção em série em 2028.
- O BMW iX5 Hydrogen com tanques achatados de nova geração promete autonomia de até 750 km (ciclo WLTP) e reabastecimento em menos de 5 minutos; o UOL reportou em 22 de abril de 2026 que a parceria superou 700 km de alcance em carros elétricos a hidrogênio.
**ACONTECIMENTOS RECENTES**
- Abril de 2026: BMW revelou detalhes dos tanques "Hydrogen Flat Storage" (formato achatado com malha de fibra de carbono) para o iX5 Hydrogen, solucionando perda de espaço interno e elevando a autonomia para 750 km.
**PERSONAGENS**
- Toyota Motor Corporation (Koji Sato), fornece a tecnologia de célula de combustível de terceira geração.
- Joint venture de desenvolvimento, foca em redução de custos (estimativa de 50 % menor no stack) e aumento de 20 % no alcance por kg de hidrogênio.`;

const DOSSIE_CIRCUS = `**FATOS E NÚMEROS**
- CA-1 Series 4 produz ~800 refeições por dia com menos de 1 hora de interação humana diária e opera 24/7 em apenas 7 m² (redução de 90% do espaço). Fonte: site oficial Circus Group.
- Lançado em supermercados REWE (Düsseldorf-Heerdt, out/2025); produz até 120 refeições/hora sem chef ou equipe de cozinha.
**TENSÕES**
- Comentários destacam substituição de "até 20 empregos de uma vez".
**PERSONAGENS**
- Circus SE / Circus Group (Munique): desenvolvedora do CA-1 Series 4.
- REWE Region West: parceiro de lançamento.`;

describe("nenhuma alegação inventada é marcada como rastreada", () => {
  // Cada caso nomeia o mecanismo que fazia o vazamento, para quem afrouxar o filtro depois saber
  // qual regressão está reabrindo.
  const inventadas: [mecanismo: string, alegacao: string, dossie: string][] = [
    // Número por extenso não gera âncora de quantidade: sobrava só o nome, que está no dossiê
    // porque o dossiê é SOBRE ele.
    ["âncora única (número por extenso)", "a Toyota já vendeu mais de um milhão de carros a hidrogênio", DOSSIE_BMW],
    ["âncora única (fração por extenso)", "metade dos postos da Alemanha já vende hidrogênio, segundo a BMW", DOSSIE_BMW],
    // Superlativo e status atual não têm âncora própria — o nome da empresa carregava tudo.
    ["superlativo sem âncora", "a BMW é a maior fabricante de carros a hidrogênio do mundo", DOSSIE_BMW],
    ["status atual sem âncora", "a Circus é hoje a única fornecedora de cozinhas autônomas da Europa", DOSSIE_CIRCUS],
    // O sujeito inventado abre a alegação, e a maiúscula posicional não é âncora: sobrava o número,
    // que está no dossiê porque o dossiê fala de OUTRA empresa.
    ["sujeito inventado na 1ª posição", "Hyundai já entrega 750 km de autonomia em célula de combustível", DOSSIE_BMW],
    ["sujeito inventado na 1ª posição", "McDonald's opera 800 refeições por dia sem cozinheiro", DOSSIE_CIRCUS],
    // Números certos, relação errada: as âncoras existem, mas em linhas diferentes do dossiê.
    ["causalidade inventada (recombinação)", "o robô da Circus foi criado porque 20 empregos já tinham sido cortados na REWE", DOSSIE_CIRCUS],
    ["número colado no ator errado", "a Toyota corta o custo do sistema em 90%", DOSSIE_CIRCUS],
    ["escopo inventado", "o CA-1 Series 4 já opera em todos os supermercados REWE da Alemanha", DOSSIE_CIRCUS],
    ["estatística inventada", "1 em cada 4 alemães já andou num carro a hidrogênio", DOSSIE_BMW],
  ];

  for (const [mecanismo, alegacao, dossie] of inventadas) {
    test(`${mecanismo}: "${alegacao.slice(0, 60)}…"`, () => {
      expect(ehRastreada(alegacao, dossie)).toBe(false);
    });
  }

  test("as 10 juntas: zero falso positivo", () => {
    expect(inventadas.filter(([, a, d]) => ehRastreada(a, d))).toEqual([]);
  });
});

describe("alegação verdadeira continua rastreada (o filtro não virou 'verifica tudo')", () => {
  test("quantidade e nome na MESMA linha do dossiê", () => {
    expect(ehRastreada("são até 750 km de autonomia, segundo a BMW", DOSSIE_BMW)).toBe(true);
    expect(ehRastreada("o CA-1 Series 4 produz 800 refeições por dia", DOSSIE_CIRCUS)).toBe(true);
  });

  test("caso real: o conserto do `mil` recupera um falso delta", () => {
    // Alegação e dossiê reais (roteiro ff1d5327, rodada delta). A âncora antiga era "9,1 mil" —
    // `mil` casava o prefixo de "milhões" — então o dossiê que diz exatamente isto não casava.
    const dossie = "- Em junho de 2026, 9,1 milhões de CNPJs estavam inadimplentes, com R$ 232,9 bilhões em dívidas em atraso, recorde da série histórica da Serasa Experian iniciada em 2016 (O Globo, 17/08/2026).";
    expect(ehRastreada("a Serasa registrou 9,1 milhões de CNPJs inadimplentes", dossie)).toBe(true);
  });
});

describe("colisão de magnitude: `mil` não pode casar o prefixo de `milhões`", () => {
  // Este é o teste que documenta o bug de fator 1000 para quem vier depois. A alternância em regex
  // é ordenada e sem fronteira de palavra: com `mil` na frente, "2 milhões" virava a âncora
  // "2 mil" e um erro de três ordens de grandeza saía marcado como rastreado.
  test("2 milhões NÃO é rastreável a um dossiê que diz 2 mil", () => {
    expect(ehRastreada("morreram 2 milhões de pessoas na Europa", "morreram 2 mil pessoas na Europa")).toBe(false);
  });

  test("500 milhões NÃO é rastreável a um dossiê que diz 500 mil", () => {
    expect(ehRastreada("o Instagram tem 500 milhões de usuarios", "o Instagram tem 500 mil usuarios")).toBe(false);
  });

  test("a âncora preserva a magnitude escrita", () => {
    expect(extrairAncoras("movimentou 45 milhões")).toContain("45 milhões");
    expect(extrairAncoras("movimentou 45 mil")).toContain("45 mil");
    expect(extrairAncoras("movimentou 45 bilhões")).toContain("45 bilhões");
    // sem acento também: `norm` preserva acento, então "milhoes" precisa da própria âncora
    expect(extrairAncoras("movimentou 45 milhoes")).toContain("45 milhoes");
  });

  test("`mil` não come palavra que só começa igual", () => {
    // "milhas" não é magnitude: a âncora é o número pelado, nunca "750 mil".
    expect(extrairAncoras("roda 750 milhas")).toEqual(["750"]);
  });

  test("magnitude legítima continua casando consigo mesma", () => {
    expect(ehRastreada("a Vale lucrou 45 milhões", "a Vale lucrou 45 milhões em 2024")).toBe(true);
  });
});
