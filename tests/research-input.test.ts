import { describe, expect, test } from "vitest";
import { agentPrompt, montarEntradaPesquisa } from "@/lib/pipeline/agents";
import type { GenerationContext } from "@/lib/pipeline/types";

const ctx = (over: Partial<GenerationContext> = {}) =>
  ({ prompt: "reforma tributária", attachments: [], insights: [], ...over }) as unknown as GenerationContext;

const adapt = { transcricao: "o vídeo modelado fala disso", compreensao: undefined };

const vezes = (s: string, agulha: string) => s.split(agulha).length - 1;

describe("entrada do pesquisador — paridade entre os dois modos", () => {
  // §1.2: hierarquia e escala humana estavam trancadas no ramo de modelagem sem tema, e
  // 100% das gerações com tema digitado nunca as viram.
  test("hierarquia de fontes aparece exatamente uma vez com tema digitado", () => {
    const e = montarEntradaPesquisa(ctx());
    expect(vezes(e, "HIERARQUIA DE FONTES")).toBe(1);
  });

  // A regressão óbvia: o checagemBlock já tinha a linha, então promover sem remover duplica.
  test("hierarquia de fontes aparece exatamente uma vez em modelagem sem tema", () => {
    const e = montarEntradaPesquisa(ctx({ modoModelagem: true }), adapt);
    expect(vezes(e, "HIERARQUIA DE FONTES")).toBe(1);
  });

  test("os domínios vêm do JSON, não congelados em prosa", () => {
    const e = montarEntradaPesquisa(ctx());
    expect(e).toContain("ibge.gov.br");
    expect(e).toContain("reuters.com");
  });

  // §12: escala humana é prosa pura, então mora na persona — e SÓ nela. Duas cópias divergem.
  test("escala humana mora na persona, e saiu da entrada nos dois modos", () => {
    expect(agentPrompt("pesquisador")).toContain("ESCALA HUMANA BRASILEIRA");
    expect(montarEntradaPesquisa(ctx())).not.toContain("ESCALA HUMANA BRASILEIRA");
    expect(montarEntradaPesquisa(ctx({ modoModelagem: true }), adapt)).not.toContain("ESCALA HUMANA BRASILEIRA");
  });

  // Refactor puro não pode ter comido nada do que a entrada já montava.
  test("o resto da entrada segue de pé", () => {
    const e = montarEntradaPesquisa(ctx({ premissa: "imposto sobe" }));
    expect(e).toContain("TEMA DO VÍDEO: reforma tributária");
    expect(e).toContain("PREMISSA DO VÍDEO");
    expect(e).toContain("Monte o dossiê.");

    const m = montarEntradaPesquisa(ctx({ modoModelagem: true }), adapt);
    expect(m).toContain("NÃO HÁ TEMA DIGITADO");
    expect(m).toContain("o vídeo modelado fala disso");
    expect(m).not.toContain("TEMA DO VÍDEO: reforma tributária");
  });
});
