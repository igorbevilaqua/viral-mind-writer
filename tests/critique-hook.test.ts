import { describe, it, expect } from "vitest";
import { preservarHook } from "../lib/pipeline/critique";

const assembled = `## HEADLINE
Headline original

## HOOK
A Rolls-Royce anunciou que agora é oficialmente proibido produzir carros.

## ROTEIRO
A Rolls-Royce anunciou que agora é oficialmente proibido produzir carros.

BYD e Geely cortam preço todo ano.

Em 2025 ela entregou 5.664 carros.

## VARIACOES_DE_HOOK
1. Variação A
2. Variação B

## COMANDO
Comando original`;

const revised = `## HEADLINE
Headline revisada

## HOOK
Todo ano um Rolls-Royce fica mais caro, mas não é o motor.

## ROTEIRO
Todo ano um Rolls-Royce fica mais caro, mas não é o motor.

BYD e Geely cortam preço todo ano, porque escala barateia.

Em 2025 ela entregou 5.664 carros no mundo inteiro.

## VARIACOES_DE_HOOK
1. Variação nova
2. Outra nova

## COMANDO
Comando revisado`;

describe("preservarHook", () => {
  it("devolve o hook original nas três seções e mantém a revisão do corpo", () => {
    const { texto, mexeu } = preservarHook(assembled, revised);
    expect(mexeu).toBe(true);
    // hook original volta em ## HOOK e na abertura de ## ROTEIRO
    expect(texto.match(/oficialmente proibido produzir carros/g)).toHaveLength(2);
    expect(texto).not.toContain("mas não é o motor");
    // variações voltam
    expect(texto).toContain("1. Variação A");
    expect(texto).not.toContain("Variação nova");
    // o que o revisor melhorou no corpo e no comando fica
    expect(texto).toContain("porque escala barateia");
    expect(texto).toContain("no mundo inteiro");
    expect(texto).toContain("Comando revisado");
    expect(texto).toContain("Headline revisada");
  });

  it("não marca mexeu quando o revisor respeitou o hook", () => {
    const { mexeu } = preservarHook(assembled, assembled);
    expect(mexeu).toBe(false);
  });

  it("sem seção HOOK no montado, devolve o revisado intacto", () => {
    const { texto, mexeu } = preservarHook("## ROTEIRO\nsem hook", revised);
    expect(texto).toBe(revised);
    expect(mexeu).toBe(false);
  });
});
