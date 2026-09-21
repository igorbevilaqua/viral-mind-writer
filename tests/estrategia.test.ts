import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));
import { formatarEstrategia } from "@/lib/pipeline/estrategia";

const payload = {
  plano: {
    plano_resumo: "Parar de explicar a lei e começar a mostrar o prejuízo de ignorá-la.",
    decisoes: ["Abrir todo vídeo por um caso real", "Cortar pauta de atualidade jurídica"],
    testes: [{ texto: "Vídeo de caso real", criterio: "média acima de 40 mil views", hipotese: 0 }],
    hipoteses: [
      { texto: "Caso real retém mais que explicação", evidencia_n: 7, aposta: false },
      { texto: "Vídeo curto converte melhor", evidencia_n: 0, aposta: true },
    ],
    satelites: ["holding familiar", "sucessão"],
    formacao: [{ tipos: ["autoridade"] }],
    kpi_meta: { views: 500000 },
  },
  ajustes: [{ semana: "2026-09-14", decisao: "ajustar", sinal: "queda de alcance", ajuste: "voltar a postar 5x na semana" }],
};

describe("formatarEstrategia", () => {
  it("sem plano valendo devolve vazio", () => {
    expect(formatarEstrategia(null)).toBe("");
    expect(formatarEstrategia({ plano: null, ajustes: [] })).toBe("");
    expect(formatarEstrategia({ plano: {}, ajustes: [] })).toBe("");
  });

  it("traz frase, apostas, teste com critério e territórios", () => {
    const b = formatarEstrategia(payload);
    expect(b).toContain("Parar de explicar a lei");
    expect(b).toContain("1. Abrir todo vídeo por um caso real");
    expect(b).toContain("dá certo se: média acima de 40 mil views");
    expect(b).toContain("holding familiar, sucessão");
  });

  it("só hipótese com evidência entra, e o ajuste vem antes da aposta", () => {
    const b = formatarEstrategia(payload);
    expect(b).toContain("7 vídeos sustentam");
    expect(b).not.toContain("Vídeo curto converte melhor");
    expect(b.indexOf("voltar a postar 5x")).toBeLessThan(b.indexOf("AS APOSTAS DO CICLO"));
  });

  it("não gasta token com mix nem meta de KPI", () => {
    const b = formatarEstrategia(payload);
    expect(b).not.toContain("500000");
    expect(b).not.toContain("autoridade");
  });
});
