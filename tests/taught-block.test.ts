import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { taughtBlock } from "@/lib/pipeline/agents";
import { comDestinatarios, DESTINATARIOS, DIMENSAO_DESTINATARIOS } from "@/lib/pipeline/destinatarios";
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

  // O outro lado do teste acima: "sem destinatários não chega a ninguém" era o comportamento
  // correto batendo num bug de escrita. Os quatro inserts de máquina não carimbavam a coluna,
  // então TODA lição derivada de edição, correção ou curador caía naquele caso.
  test("comDestinatarios carimba a partir da dimensão", () => {
    expect(comDestinatarios([{ dimensao: "hook" }])[0].destinatarios).toEqual(["hook", "dados"]);
  });

  test("quem já traz destinatários não é sobrescrito", () => {
    expect(comDestinatarios([{ dimensao: "hook", destinatarios: ["comando"] }])[0].destinatarios).toEqual(["comando"]);
  });

  test("dimensão fora do mapa devolve vazio em vez de destino errado", () => {
    expect(comDestinatarios([{ dimensao: "inventada" }])[0].destinatarios).toEqual([]);
  });

  test("lição carimbada chega ao prompt — o bug, de ponta a ponta", () => {
    const [l] = comDestinatarios([{ dimensao: "ritmo", titulo: "A" }]);
    const c = ctx([{ titulo: "A", destinatarios: l.destinatarios }]);
    expect(taughtBlock(c, "roteirista")).toContain("A"); // antes: "" para todo agente
  });

  // O `case` da migration 0037 replica DIMENSAO_DESTINATARIOS. A 0027 já avisava que as duas
  // cópias desandam quando alguém mexe num lado só — aqui isso vira teste.
  test("o backfill em SQL cobre exatamente as dimensões do mapa", () => {
    const sql = readFileSync("supabase/migrations/0037_backfill_destinatarios_orfaos.sql", "utf8");
    for (const [dim, destinos] of Object.entries(DIMENSAO_DESTINATARIOS)) {
      expect(sql, `dimensão "${dim}" fora do backfill`).toContain(`when '${dim}'`);
      expect(sql, `destinos de "${dim}" divergem do mapa`).toContain(`'{${destinos.join(",")}}'`);
    }
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
      // licoesPara é o roteamento cru; taughtBlock é o formatador em cima dele. Qualquer um
      // dos dois é consumidor real — o que não pode existir é destinatário sem nenhum.
      expect(fontes, `destinatário "${a}" não tem call site de roteamento`).toMatch(
        new RegExp(`(taughtBlock|licoesPara)\\([^)]*["']${a}["']`)
      );
    }
  });
});
