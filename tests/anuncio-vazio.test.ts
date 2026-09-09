import { describe, expect, test } from "vitest";
import { anunciosVazios, blockCount, slopLint, LABEL_ANUNCIO } from "@/lib/pipeline/slop-lint";

const pega = (frase: string) => anunciosVazios(frase).length > 0;

// Todos os casos abaixo saíram de roteiros reais da sala (vm_generated_scripts, 80 últimos):
// 22 dos 80 traziam a figura MESMO com a lição ativa chegando ao roteirista e ao revisor.
describe("anúncio vazio — o que acusa", () => {
  test.each([
    "Agora vem a parte que piora tudo.",
    "Agora vem a parte que mais assusta.",
    "E agora vem a parte mais cruel dessa conta.",
    "Aí vem a parte mais simbólica.",
    "Agora vem a lógica que resolve esse paradoxo.",
    "Só que o detalhe mais grave vem agora.",
    "E aqui entra a consequência final desse dominó.",
    "Agora repara numa coisa.",
    "Agora presta atenção no número que deveria estar em todo jornal.",
    "Agora guarda os dois números que derrubam a peça seguinte.",
    "Guarda esse resultado, porque agora entra a peça que conecta tudo.",
    "E tem mais.",
    "Mas calma que a situação piora.",
  ])("acusa: %s", (frase) => expect(pega(frase)).toBe(true));
});

describe("anúncio vazio — o que passa", () => {
  // A régua é o FATO NA MESMA FRASE: número, nome próprio ou o conteúdo depois dos dois-pontos.
  test.each([
    "Agora presta atenção, porque nesse mesmo período o governo reduziu impostos em mais de 2,5% do PIB.",
    "E tem mais: mais de 6 mil empresas entraram em recuperação judicial, outro recorde.",
    "Agora vem um detalhe que deixa a conta ainda melhor: o funcionário também sai ganhando.",
    "Repare num detalhe: nenhum deles tem disfunção pra tratar.",
    "Agora olha pro Brasil.",
  ])("passa (carrega o fato): %s", (frase) => expect(pega(frase)).toBe(false));

  // A exceção pedida pelo time: antecipação que é FALA INTEIRA, específica e com voz. A
  // adjacência curta do detector é o que a separa do enfeite de quatro palavras.
  test.each([
    "Mas agora presta atenção que eu vou te falar a pior parte.",
    "Até aqui você entendeu, mas sabe o que torna essa história muito pior?",
  ])("passa (antecipação que se paga): %s", (frase) => expect(pega(frase)).toBe(false));

  // Falsos positivos que a primeira versão do detector produzia — indicativo não é imperativo,
  // e "da próxima vez" é fecho de roteiro, não promessa de conteúdo.
  test.each([
    "Só que quando você olha os números por trás do anúncio, a história muda de figura.",
    "Acontece que a borra da sua xícara ainda guarda muita coisa.",
    "Aqui a história pesou a favor da chinesa.",
    "Na próxima vez que você olhar pro telhado da sua casa, lembra dessa história.",
    "Quem não faz descobre o problema quando a cobrança retroativa chega.",
  ])("passa (não é anúncio): %s", (frase) => expect(pega(frase)).toBe(false));
});

test("entra no slopLint como block, com o label que libera o [CORTAR]", () => {
  const v = slopLint("O fundo perdeu cinco de cada seis reais. Agora vem a parte que piora tudo. O Congresso abriu exceção.", []);
  expect(blockCount(v)).toBe(1);
  expect(v[0].label).toBe(LABEL_ANUNCIO);
  expect(v[0].match).toBe("Agora vem a parte que piora tudo.");
});
