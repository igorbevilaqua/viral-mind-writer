import { describe, expect, test } from "vitest";
import { slopLint, blockCount, dedash } from "@/lib/pipeline/slop-lint";
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

  test("blockCount conta apenas violações severity 'block'", () => {
    const phrases: BannedPhrase[] = [
      { pattern: "com certeza", label: "frase proibida: com certeza", severity: "block" },
    ];
    const violations = slopLint("Isso, com certeza, vai funcionar — de verdade.", phrases);
    expect(violations).toHaveLength(2);
    expect(blockCount(violations)).toBe(2);
  });
});
