import { describe, expect, test } from "vitest";
import { checagemSection, parseSections, semEcoDaAbertura, stripLeadingHook, stripTrailingComando } from "@/lib/pipeline/draft";

// o hook abre o ROTEIRO no documento montado, mas é salvo só na coluna `hook`
describe("stripLeadingHook", () => {
  const hook = "Existe um documento do Palmeiras que deveria ser estudado em faculdade.";

  test("corta o 1º bloco quando ele é o hook", () => {
    expect(stripLeadingHook(`${hook}\n\nE ele foi publicado no meio de uma polêmica.`, hook)).toBe(
      "E ele foi publicado no meio de uma polêmica."
    );
  });

  test("aceita diferença só de pontuação/aspas (a revisão mexe nisso)", () => {
    expect(stripLeadingHook(`"${hook}"\n\nCorpo aqui.`, hook)).toBe("Corpo aqui.");
  });

  test("hook divergente de verdade não corta nada do corpo", () => {
    const roteiro = "Em 2019 o clube mudou de estratégia e ninguém percebeu.\n\nCorpo aqui.";
    expect(stripLeadingHook(roteiro, hook)).toBe(roteiro);
  });

  test("bloco único fica intacto (cortar esvaziaria o roteiro)", () => {
    expect(stripLeadingHook(hook, hook)).toBe(hook);
  });

  test("sem hook, devolve o roteiro", () => {
    expect(stripLeadingHook("Corpo.\n\nMais corpo.", null)).toBe("Corpo.\n\nMais corpo.");
  });
});

// Caso real (roteiro ecdbcba1, 14/08/2026): a variação 1 era a abertura do corpo reescrita.
// Ninguém percebeu até alguém trocar o hook por ela, e o vídeo passou a dizer a mesma coisa
// duas vezes seguidas.
describe("semEcoDaAbertura", () => {
  const abertura =
    "O homem mais poderoso do mundo estaria morto agora se Israel tivesse ficado quieto. " +
    "E para você entender como Trump chegou tão perto de ser assassinado, precisa voltar seis anos no tempo.";
  const roteiro = `${abertura}\n\nJaneiro de 2020. Trump ordena o ataque que mata o general Qassem Soleimani.`;

  const eco = "O homem mais poderoso do planeta estaria morto se um único aviso não tivesse chegado a tempo. E esse aviso não veio da inteligência americana.";
  const original = "Israel descobriu um plano para matar Donald Trump e a própria CIA se recusou a acreditar. O que aconteceu depois quase acendeu a Terceira Guerra Mundial.";
  const aviao = "O avião que pousou na Turquia era diferente do que decolou dos Estados Unidos. Se essa troca secreta não tivesse acontecido, o mundo poderia estar em guerra agora.";
  const cia = "A CIA analisou o alerta sobre o assassinato de Trump e mandou arquivar. Esse erro quase custou a vida do presidente e a paz do mundo inteiro.";

  test("descarta a variação que reescreve a abertura e mantém as outras", () => {
    expect(semEcoDaAbertura([eco, aviao, cia], roteiro)).toEqual([aviao, cia]);
  });

  test("não descarta hook que só compartilha o tema com a abertura", () => {
    // "Israel" aparece nos dois e ainda assim são ideias diferentes: o corte é por frase de
    // abertura, não por vocabulário do texto inteiro.
    expect(semEcoDaAbertura([original], roteiro)).toEqual([original]);
  });

  test("não mexe quando não há roteiro, variação ou quando a frase é curta demais", () => {
    expect(semEcoDaAbertura([eco], null)).toEqual([eco]);
    expect(semEcoDaAbertura([eco], "")).toEqual([eco]);
    expect(semEcoDaAbertura(null, roteiro)).toEqual([]);
    // Duas frases curtas dividem metade das palavras por acaso; exige 4 em comum.
    expect(semEcoDaAbertura(["Trump quase morreu."], "Trump quase morreu ontem.\n\nCorpo.")).toEqual([
      "Trump quase morreu.",
    ]);
  });
});

describe("stripTrailingComando", () => {
  const comando = "Segue esse perfil pra entender esses dominós antes deles caírem no seu bolso.";
  test("remove o comando repetido no fim do roteiro", () => {
    const roteiro = `Aí caiu o primeiro dominó.\n\n${comando}`;
    expect(stripTrailingComando(roteiro, comando)).toBe("Aí caiu o primeiro dominó.");
  });
  test("preserva o roteiro quando não há duplicação", () => {
    const roteiro = "Aí caiu o primeiro dominó.\n\nE o mercado reagiu.";
    expect(stripTrailingComando(roteiro, comando)).toBe(roteiro);
  });
  test("comando curto demais não dispara falso positivo", () => {
    const roteiro = "Olha isso.\n\nComenta aí.";
    expect(stripTrailingComando(roteiro, "Comenta aí.")).toBe(roteiro);
  });
  test("bloco final curto legítimo contido no comando é preservado", () => {
    // "seu bolso" está contido no comando, mas é curto demais (< 12 após normalizar)
    const roteiro = "Aí caiu o primeiro dominó.\n\nseu bolso";
    expect(stripTrailingComando(roteiro, comando)).toBe(roteiro);
  });
  test("remove no máximo 1 bloco mesmo com vários finais contidos no comando", () => {
    const roteiro = `Aí caiu o primeiro dominó.\n\nSegue esse perfil pra entender\n\n${comando}`;
    expect(stripTrailingComando(roteiro, comando)).toBe(
      "Aí caiu o primeiro dominó.\n\nSegue esse perfil pra entender"
    );
  });
});

describe("parseSections", () => {
  test("doc completo com 6 headers extrai e trima todos os campos, incluindo 3 variações sem prefixo numérico", () => {
    const doc = `## HEADLINE
Titulo Bombastico

## HOOK
Voce nao vai acreditar

## ROTEIRO
Este e o corpo do roteiro.
Com varias linhas.

## VARIACOES_DE_HOOK
1. Primeira variacao
2. Segunda variacao
3. Terceira variacao

## COMANDO
Compartilhe agora

## FONTES
https://exemplo.com
`;

    expect(parseSections(doc)).toEqual({
      headline: "Titulo Bombastico",
      hook: "Voce nao vai acreditar",
      roteiro: "Este e o corpo do roteiro.\nCom varias linhas.",
      hookVariants: ["Primeira variacao", "Segunda variacao", "Terceira variacao"],
      comando: "Compartilhe agora",
      fontes: "https://exemplo.com",
    });
  });

  test("sem '## ROTEIRO': roteiro cai no fallback do texto inteiro trimado", () => {
    const doc = `## HEADLINE
Titulo

## HOOK
Hook aqui
`;

    const result = parseSections(doc);
    expect(result.roteiro).toBe(doc.trim());
    expect(result.headline).toBe("Titulo");
    expect(result.hook).toBe("Hook aqui");
  });

  test("header acentuado '## VARIAÇÕES_DE_HOOK' também é aceito", () => {
    const doc = `## ROTEIRO
Corpo aqui

## VARIAÇÕES_DE_HOOK
1. Var A
2. Var B
`;

    expect(parseSections(doc).hookVariants).toEqual(["Var A", "Var B"]);
  });

  test("sem seção de variações: hookVariants é []", () => {
    const doc = `## ROTEIRO
Corpo sem variacoes
`;

    expect(parseSections(doc).hookVariants).toEqual([]);
  });
});

describe("checagemSection", () => {
  const dossie = `## CHECAGEM
- [confirmado] o lucro foi de R$ 4.7 bi — https://ri.exemplo.com (2026-02-10)
- [nao_verificavel] "maior banco digital do mundo" — sem fonte primária

## FATOS E NÚMEROS
- outra coisa qualquer`;

  test("extrai a seção inteira e para no próximo heading", () => {
    const s = checagemSection(dossie);
    expect(s).toContain("[confirmado]");
    expect(s).toContain("[nao_verificavel]");
    expect(s).not.toContain("FATOS E NÚMEROS");
    expect(s).not.toContain("outra coisa qualquer");
  });

  test("dossiê sem checagem (modo com tema) devolve vazio", () => {
    expect(checagemSection("## FATOS E NÚMEROS\n- nada aqui")).toBe("");
    expect(checagemSection(undefined)).toBe("");
  });

  test("trunca checagem degenerada", () => {
    const gordo = `## CHECAGEM\n${"- [confirmado] linha comprida o suficiente\n".repeat(500)}`;
    expect(checagemSection(gordo).length).toBeLessThanOrEqual(4001);
  });
});
