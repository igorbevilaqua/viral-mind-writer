import { describe, expect, it } from "vitest";
import { houveEdicaoHumana, marcarOrigemEdicao } from "@/lib/learning-loop";

// Peça 3, §7.2 + §16.1: correção factual de máquina NUNCA pode alimentar o Professor.
// A correção preserva `roteiro_original` (precisa ser revertível), então o portão do
// aprendizado não pode decidir por esse campo — decide por `edicao_humana`.

describe("marcarOrigemEdicao", () => {
  const sala = "O mercado cresceu 45 bilhões em 2024.";

  it("correção factual NÃO marca edicao_humana", () => {
    const trace = marcarOrigemEdicao({}, sala, "correcao_factual");
    expect(trace.edicao_humana).toBeUndefined();
  });

  it("correção factual marca correcao_factual", () => {
    expect(marcarOrigemEdicao({}, sala, "correcao_factual").correcao_factual).toBe(true);
  });

  it("correção factual preserva roteiro_original", () => {
    expect(marcarOrigemEdicao({}, sala, "correcao_factual").roteiro_original).toBe(sala);
  });

  it("nunca sobrescreve o roteiro_original já gravado (sempre o texto da sala)", () => {
    const trace = marcarOrigemEdicao({ roteiro_original: sala, edicao_humana: true }, "versão editada", "correcao_factual");
    expect(trace.roteiro_original).toBe(sala);
    expect(trace.edicao_humana).toBe(true); // correção posterior não apaga a edição humana
    expect(trace.correcao_factual).toBe(true);
  });

  it("edição humana continua marcando edicao_humana e preservando o original", () => {
    const trace = marcarOrigemEdicao({}, sala, "humano");
    expect(trace.edicao_humana).toBe(true);
    expect(trace.roteiro_original).toBe(sala);
    expect(trace.correcao_factual).toBeUndefined();
  });
});

describe("houveEdicaoHumana (portão do Professor)", () => {
  it("é FALSE para trace só de correção factual — a lição envenenada morre aqui", () => {
    const trace = marcarOrigemEdicao({}, "O mercado cresceu 45 bilhões.", "correcao_factual");
    expect(trace.roteiro_original).toBeTruthy(); // o campo que o portão antigo lia está lá
    expect(houveEdicaoHumana(trace)).toBe(false);
  });

  it("é TRUE para o trace legado (roteiro_original + edicao_humana)", () => {
    expect(houveEdicaoHumana({ roteiro_original: "texto da sala", edicao_humana: true })).toBe(true);
  });

  it("é FALSE para roteiro nunca editado", () => {
    expect(houveEdicaoHumana({})).toBe(false);
  });

  it("é TRUE quando houve edição humana E correção factual", () => {
    expect(houveEdicaoHumana({ roteiro_original: "sala", edicao_humana: true, correcao_factual: true })).toBe(true);
  });
});
