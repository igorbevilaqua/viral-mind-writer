import { describe, expect, test } from "vitest";
import { slopLint, blockCount, dedash, type LintViolation } from "@/lib/pipeline/slop-lint";
import type { BannedPhrase } from "@/lib/pipeline/types";

describe("slopLint", () => {
  test("pattern simples casa e gera violação com o severity cadastrado", () => {
    const phrases: BannedPhrase[] = [
      { pattern: "com certeza", label: "frase proibida: com certeza", severity: "block" },
    ];
    const result = slopLint("Isso, com certeza, vai funcionar.", phrases);
    expect(result).toEqual([
      { label: "frase proibida: com certeza", match: "com certeza", severity: "block" },
    ]);
  });

  test("regex inválida cadastrada é pulada sem lançar erro", () => {
    const phrases: BannedPhrase[] = [
      { pattern: "(unclosed", label: "regex invalida", severity: "block" },
    ];
    expect(() => slopLint("texto qualquer sem match", phrases)).not.toThrow();
    expect(slopLint("texto qualquer sem match", phrases)).toEqual([]);
  });

  test("travessão '—' gera violação block", () => {
    const result = slopLint("Isso é ótimo — de verdade.", []);
    expect(result).toEqual([
      { label: "travessão proibido (1x)", match: "—", severity: "block" },
    ]);
  });

  test("en dash ' – ' também gera violação block", () => {
    const result = slopLint("Isso é ótimo – de verdade.", []);
    expect(result).toEqual([
      { label: "travessão proibido (1x)", match: "—", severity: "block" },
    ]);
  });

  test("duas frases consecutivas começando com 'E ' geram warn", () => {
    const result = slopLint("Ele foi embora. E ninguem soube o motivo. E todos ficaram tristes.", []);
    expect(result).toEqual([
      {
        label: "frases consecutivas começando com 'E'",
        match: ". E ninguem soube o motivo. E ",
        severity: "warn",
      },
    ]);
  });

  test("texto limpo não gera violações", () => {
    expect(slopLint("Um texto limpo, sem problemas nenhum por aqui.", [])).toEqual([]);
  });

  test("travessão de fala de personagem é permitido (início de linha e após ':')", () => {
    expect(slopLint("João disse: —Nunca mais volte aqui.", [])).toEqual([]);
    expect(slopLint("—Nunca mais volte aqui.", [])).toEqual([]);
  });

  test("dedash troca travessão de slop por vírgula e preserva fala", () => {
    expect(dedash("Isso é ótimo — de verdade.")).toBe("Isso é ótimo, de verdade.");
    expect(dedash("A taxa – que subiu – de novo.")).toBe("A taxa, que subiu, de novo.");
    expect(dedash("João disse: —Nunca mais volte.")).toBe("João disse: —Nunca mais volte.");
    expect(slopLint(dedash("Dread — a antecipação — ansiosa."), [])).toEqual([]);
  });

  // Eixo da elipse: as três figuras que omitem material que um falante teria que pronunciar.
  // Os casos "escapou" abaixo são texto REAL de vm_generated_scripts que foi entregue com
  // slop_lint_violations = 0 — a banlist por string não pegava a figura.
  describe("antítese", () => {
    const label = (v: LintViolation[]) => v.map((x) => x.label).join(" | ");

    test("escapou em produção: plural + ponto + pronome interposto", () => {
      const v = slopLint("Os xingamentos de Milei contra Lula não são um ataque de raiva. Aquilo é um plano.", []);
      expect(label(v)).toContain("antítese");
      expect(blockCount(v)).toBe(1);
    });

    test("escapou em produção: fuga pela pontuação (ponto no lugar da vírgula)", () => {
      const v = slopLint("E quem paga essa conta não é presidente nenhum. É a gente.", []);
      expect(blockCount(v)).toBe(1);
    });

    test("a forma canônica com vírgula", () => {
      expect(blockCount(slopLint("Isso não é um presidente descontrolado, é estratégia.", []))).toBe(1);
      expect(blockCount(slopLint("A assimetria não é sorte nem tamanho, é o timing.", []))).toBe(1);
    });

    test("variantes 'e sim' / 'se trata' também casam", () => {
      expect(blockCount(slopLint("Não se trata de dinheiro, e sim de liberdade.", []))).toBe(1);
      expect(blockCount(slopLint("Aquilo não significa recuo; significa preparo.", []))).toBe(1);
    });

    test("negação SEM assertiva pareada é legítima e não acusa", () => {
      expect(slopLint("O maior parceiro comercial da Argentina não são os Estados Unidos.", [])).toEqual([]);
      expect(slopLint("Ele não está xingando por raiva, meu amigo.", [])).toEqual([]);
      expect(slopLint("Essa relação não é explicada na mídia tradicional.", [])).toEqual([]);
    });
  });

  describe("pergunta elíptica", () => {
    test("pivô nominal é acusado", () => {
      for (const q of ["O desfecho disso?", "Resultado?", "O problema?", "E o Google?", "O nome dela?"]) {
        expect(blockCount(slopLint(q, []))).toBe(1);
      }
    });

    test("pergunta real (interrogativo + verbo) passa", () => {
      for (const q of ["Como é que isso é possível?", "O que você acha?", "Onde elas caçam?", "Qual é o seu?"]) {
        expect(slopLint(q, [])).toEqual([]);
      }
    });

    test("abertura que endereça o espectador passa — é o registro que queremos", () => {
      expect(slopLint("Sabe o que aconteceu?", [])).toEqual([]);
      expect(slopLint("E adivinha o resultado?", [])).toEqual([]);
    });

    // Falso positivo pego no corpus real: sujeito explícito implica verbo, é pergunta de verdade.
    test("pergunta com sujeito explícito passa", () => {
      expect(slopLint("Você consegue entender a revolta?", [])).toEqual([]);
      expect(slopLint("Ele fez isso de novo?", [])).toEqual([]);
    });
  });

  describe("enumeração paratática", () => {
    test("itens justapostos sem conectivo são acusados", () => {
      const v = slopLint("Esse é o Rio de Janeiro, carros na rua, garotos jogando bola, bandidos circulando.", []);
      expect(blockCount(v)).toBe(1);
      expect(v[0].label).toContain("paratática");
    });

    test("a mesma ideia com conectivo e verbo passa — é o conectivo que salva, não o tamanho", () => {
      expect(
        slopLint(
          "Esse é o Rio de Janeiro, cidade em que de um lado você vê carros na rua, de outro garoto jogando bola, mas se der bobeira, bandidos estão circulando a todo momento.",
          []
        )
      ).toEqual([]);
    });

    test("duas vírgulas não bastam pra acusar", () => {
      expect(slopLint("O banco cobra 3% ao mês, todo mês, sem avisar ninguém.", [])).toEqual([]);
    });

    test("linha de fonte com data e URL nunca é acusada (mutilaria a citação)", () => {
      expect(slopLint("Folha de S.Paulo, 12/03/2026, dados do IBGE, https://folha.com/x", [])).toEqual([]);
    });

    // Falsos positivos pegos rodando `npm run style-report` sobre o corpus real: lista de
    // nomes próprios e de palavras soltas é enumeração legítima, não parataxe defeituosa.
    test("lista de nomes próprios é legítima", () => {
      expect(slopLint("Argentina, El Salvador, Equador, Colômbia, Peru, Chile, Bolívia.", [])).toEqual([]);
      expect(slopLint("Hoje são 13 mercados rodando pelo mundo: Nova York, Dubai, Barcelona, Osaka.", [])).toEqual([]);
    });

    test("lista de palavras soltas (1 palavra por item) é legítima", () => {
      expect(
        slopLint("Presidente, vice, ministros, secretários, senadores e deputados param de receber.", [])
      ).toEqual([]);
    });
  });

  test("blockCount conta apenas violações severity 'block'", () => {
    const phrases: BannedPhrase[] = [
      { pattern: "com certeza", label: "frase proibida: com certeza", severity: "block" },
    ];
    const violations = slopLint("Isso, com certeza, vai funcionar — de verdade.", phrases);
    expect(violations).toHaveLength(2);
    expect(blockCount(violations)).toBe(2);
  });
});
