import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { aplicarEdicoes, preservarHook } from "../lib/pipeline/critique";

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

// O humanizador também reescreve o documento inteiro. Sem o mesmo trinco depois dele, a cópia do
// hook no topo do ROTEIRO sai reescrita e o vídeo abre repetindo o hook (09/10).
describe("o trinco do hook vale depois da humanização", () => {
  it("index.ts passa a saída do humanizador por preservarHook", () => {
    const index = readFileSync("lib/pipeline/index.ts", "utf8");
    expect(index).toMatch(/preservarHook\(\s*revised,\s*humanizado\s*\)/);
  });
});

describe("preservarHook não apaga corpo", () => {
  it("se o modelo apagou a cópia do hook, o hook volta na frente e o 1º parágrafo fica", () => {
    const montado = "## HOOK\nO Lula assinou a medida provisória das bets na sexta.\n\n## ROTEIRO\nO Lula assinou a medida provisória das bets na sexta.\n\nOs sites saem do ar em outubro.\n\nMais corpo.\n";
    const semCopia = "## HOOK\nO Lula assinou a medida provisória das bets na sexta.\n\n## ROTEIRO\nOs sites saem do ar em outubro.\n\nMais corpo.\n";
    const { texto } = preservarHook(montado, semCopia);
    expect(texto).toContain("O Lula assinou a medida provisória das bets na sexta.\n\nOs sites saem do ar em outubro.\n\nMais corpo.");
  });
});

describe("aplicarEdicoes (plano 024, 2.7)", () => {
  const doc = "## HOOK\nA China comprou o Brasil.\n\n## ROTEIRO\nA China comprou o Brasil.\n\nO fio responde a Pequim. E segue.\n\nOutro parágrafo.\n\n## COMANDO\nSegue.\n";
  it("aplica o trecho exato e deixa o resto intacto", () => {
    const r = aplicarEdicoes(doc, [{ trecho: "O fio responde a Pequim.", substituto: "O fio responde à China.", motivo: "clareza" }]);
    expect(r.aplicadas).toBe(1);
    expect(r.texto).toContain("O fio responde à China. E segue.");
    expect(r.texto).toContain("Outro parágrafo.");
  });
  it("recusa trecho que não casa e trecho do hook", () => {
    const r = aplicarEdicoes(doc, [
      { trecho: "O fio responde a pequim", substituto: "x", motivo: "parafraseou" },
      { trecho: "A China comprou o Brasil.", substituto: "Outro hook.", motivo: "hook" },
    ]);
    expect(r.aplicadas).toBe(0);
    expect(r.descartadas).toHaveLength(2);
    expect(r.texto).toBe(doc);
  });
  it("substituto vazio corta", () => {
    const r = aplicarEdicoes(doc, [{ trecho: "Outro parágrafo.", substituto: "", motivo: "corte" }]);
    expect(r.texto).not.toContain("Outro parágrafo.");
    expect(r.texto).not.toMatch(/\n{3,}/);
  });
});
