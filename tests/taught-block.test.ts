import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { taughtBlock } from "@/lib/pipeline/agents";
import { DESTINATARIOS } from "@/lib/pipeline/destinatarios";
import type { GenerationContext } from "@/lib/pipeline/types";

const ctx = (licoes: { titulo: string; destinatarios: string[] }[]) =>
  ({
    insights: licoes.map((l) => ({
      insight_type: "taught",
      scope: "global",
      payload: { titulo: l.titulo, descricao: "d", destinatarios: l.destinatarios },
    })),
  }) as unknown as GenerationContext;

describe("taughtBlock por destinatário", () => {
  test("entrega só ao destinatário listado", () => {
    const c = ctx([
      { titulo: "A", destinatarios: ["hook"] },
      { titulo: "B", destinatarios: ["roteirista"] },
    ]);
    expect(taughtBlock(c, "hook")).toContain("A");
    expect(taughtBlock(c, "hook")).not.toContain("B");
  });

  test("lição com dois destinatários chega aos dois", () => {
    const c = ctx([{ titulo: "A", destinatarios: ["hook", "revisao"] }]);
    expect(taughtBlock(c, "hook")).toContain("A");
    expect(taughtBlock(c, "revisao")).toContain("A");
  });

  test("sem lição para o agente devolve string vazia", () => {
    expect(taughtBlock(ctx([{ titulo: "A", destinatarios: ["hook"] }]), "comando")).toBe("");
  });

  test("respeita o teto por destinatário (3, igual a hoje)", () => {
    const muitas = Array.from({ length: 12 }, (_, i) => ({ titulo: `L${i}`, destinatarios: ["hook"] }));
    expect(taughtBlock(ctx(muitas), "hook").split("\n")).toHaveLength(3);
  });

  test("excedente é registrado, nunca cortado em silêncio", () => {
    const c = ctx(Array.from({ length: 12 }, (_, i) => ({ titulo: `L${i}`, destinatarios: ["hook"] })));
    taughtBlock(c, "hook");
    expect(c.licoesExcedidas?.hook).toBe(9);
  });

  test("dentro do teto não registra excedente", () => {
    const c = ctx([{ titulo: "A", destinatarios: ["hook"] }]);
    taughtBlock(c, "hook");
    expect(c.licoesExcedidas).toBeUndefined();
  });

  test("lição sem destinatários não chega a ninguém", () => {
    const c = ctx([{ titulo: "A", destinatarios: [] }]);
    expect(taughtBlock(c, "hook")).toBe("");
    expect(taughtBlock(c, "roteirista")).toBe("");
  });

  // Invariante que impede a falha silenciosa de voltar por uma porta nova: destinatário que o
  // classificador pode emitir sem consumidor real grava a lição e não produz efeito nenhum.
  test("todo destinatário válido tem call site real", () => {
    const fontes = [
      "lib/pipeline/agents.ts",
      "lib/pipeline/draft.ts",
      "lib/pipeline/premissa.ts",
      "lib/pipeline/modelagem.ts",
      "lib/pipeline/critique.ts",
    ]
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    for (const a of DESTINATARIOS) {
      if (a === "dados") continue; // dados consome via formatInsightsForDados, não taughtBlock
      expect(fontes, `destinatário "${a}" não tem call site de taughtBlock`).toMatch(
        new RegExp(`taughtBlock\\([^)]*["']${a}["']`)
      );
    }
  });
});
