import { describe, it, expect } from "vitest";
import { licoesPara } from "../lib/pipeline/agents";
import type { GenerationContext } from "../lib/pipeline/types";

// Monta um ctx só com o que licoesPara lê.
const ctx = (payloads: Record<string, unknown>[]) =>
  ({ insights: payloads.map((p) => ({ insight_type: "taught", scope: "global", payload: p })) }) as unknown as GenerationContext;

const licao = (id: string, grupo: string | null, titulo = id) => ({
  id,
  titulo,
  descricao: `desc ${id}`,
  destinatarios: ["roteirista"],
  grupo,
});

describe("licoesPara", () => {
  it("não gasta as 3 vagas com variações da mesma queixa", () => {
    const c = ctx([
      licao("a1", "hook-emocional"),
      licao("a2", "hook-emocional"),
      licao("a3", "hook-emocional"),
      licao("b1", "fluidez-ritmo"),
      licao("c1", "cta-impacto"),
    ]);
    const usadas = licoesPara(c, "roteirista");
    expect(usadas.map((u) => u.id)).toEqual(["a1", "b1", "c1"]);
    // 5 candidatas, 3 usadas: o corte inteiro (dedup + teto) aparece no trace
    expect(c.licoesExcedidas).toEqual({ roteirista: 2 });
  });

  it("lição sem grupo conta como grupo próprio e não some", () => {
    const usadas = licoesPara(ctx([licao("a", null), licao("b", null), licao("c", null)]), "roteirista");
    expect(usadas.map((u) => u.id)).toEqual(["a", "b", "c"]);
  });

  it("ignora quem não é destinatário", () => {
    const c = ctx([{ ...licao("a", "g1"), destinatarios: ["comando"] }, licao("b", "g2")]);
    expect(licoesPara(c, "roteirista").map((u) => u.id)).toEqual(["b"]);
  });
});
