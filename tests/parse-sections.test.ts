import { describe, expect, test } from "vitest";
import { parseSections } from "@/lib/pipeline/draft";

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
