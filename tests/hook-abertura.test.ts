import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { hookEcoaAbertura } from "@/lib/pipeline/draft";

const ABERTURA =
  "O homem mais poderoso do mundo estaria morto agora se Israel tivesse errado o alvo.\n\n" +
  "Segundo bloco do corpo, que a comparacao nem olha.";

describe("hook x abertura do corpo", () => {
  test("hook que reescreve a abertura é sinalizado", () => {
    const hook = "O homem mais poderoso do planeta estaria morto se um aviso não tivesse chegado.";
    expect(hookEcoaAbertura(hook, ABERTURA)).toBe(true);
  });

  test("hook distinto não é sinalizado", () => {
    const hook = "Três minutos antes do ataque, um telefone tocou em Teerã.";
    expect(hookEcoaAbertura(hook, ABERTURA)).toBe(false);
  });

  // §7: stripLeadingHook é fuzzy e pode não cortar. Quando não corta, o "primeiro bloco" É o
  // hook e a comparação daria eco de 100% por construção — falso positivo garantido.
  test("hook idêntico à abertura é pulado, não sinalizado", () => {
    const abertura = ABERTURA.split(/\n\s*\n/)[0];
    expect(hookEcoaAbertura(abertura, ABERTURA)).toBe(false);
    expect(hookEcoaAbertura(abertura.toUpperCase().replace(/\.$/, "!"), ABERTURA)).toBe(false);
  });

  test("sem hook ou sem corpo não sinaliza", () => {
    expect(hookEcoaAbertura("", ABERTURA)).toBe(false);
    expect(hookEcoaAbertura("qualquer hook", "")).toBe(false);
  });

  // Invariante da peça 1: detector sem call site é lição que ninguém recebe. O par principal
  // (hook escolhido x primeiro bloco do corpo) tem que ser comparado de verdade no pipeline.
  test("o par principal tem call site real", () => {
    const draft = readFileSync("lib/pipeline/draft.ts", "utf8");
    const index = readFileSync("lib/pipeline/index.ts", "utf8");
    expect(draft).toMatch(/export function ecoa\(/); // Task 5 consome
    expect(draft, "hookEcoaAbertura não usa ecoa").toMatch(/ecoa\(hook,/);
    expect(index, "index.ts não compara o hook escolhido com a abertura").toMatch(
      /hookEcoaAbertura\(\s*hookRes\.hook/
    );
  });
});
