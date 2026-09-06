import { describe, expect, test } from "vitest";
import { anexarSecao, celulasFortes, secaoDados, TITULO_2B, type CelulaMatriz } from "@/lib/playbook-proposta";
import { estruturaTemaBlock } from "@/lib/pipeline/agents";
import type { GenerationContext } from "@/lib/pipeline/types";

// Células reais do relatório §3 + duas que NÃO passam (n<15; lift sem IC acima de 1).
const celulas: CelulaMatriz[] = [
  { estrutura: "C2", tema: "BRASIL", n: 18, k: 10, p_bruto: 10 / 18, p_encolhido: 0.43 },
  { estrutura: "A2", tema: "INOVAÇÃO", n: 25, k: 11, p_bruto: 0.44, p_encolhido: 0.4 },
  { estrutura: "B1", tema: "ECONOMIA", n: 16, k: 7, p_bruto: 7 / 16, p_encolhido: 0.36 }, // lb≈0.98 → fora
  { estrutura: "F3", tema: "CIÊNCIA E INOVAÇÃO", n: 14, k: 9, p_bruto: 9 / 14, p_encolhido: 0.5 }, // n<15 → fora
];

describe("celulasFortes (corte n≥15, Wilson inferior > base)", () => {
  test("só as células com evidência sobram, ordenadas por p encolhido", () => {
    expect(celulasFortes(celulas).map((c) => `${c.estrutura}×${c.tema}`)).toEqual(["C2×BRASIL", "A2×INOVAÇÃO"]);
  });
  test("nada passa → lista vazia (STOP do plano)", () => {
    expect(celulasFortes(celulas.slice(2))).toEqual([]);
  });
});

describe("secaoDados", () => {
  const secao = secaoDados(celulasFortes(celulas));
  test("título fixo da PARTE 2-B (chave da idempotência do script)", () => {
    expect(secao).toContain(`## ${TITULO_2B}`);
  });
  test("uma linha de tabela por célula, com nome da estrutura, n, % e lift com IC", () => {
    expect(secao).toContain("| BRASIL | C2 Estratégia Oculta | 18 | 56% (encolhido 43%) | 2,22× [1,35–3,02] |");
    expect(secao).toContain("| INOVAÇÃO | A2 Herói Improvável | 25 |");
    expect(secao).not.toContain("ECONOMIA");
  });
  test("anexa ao playbook com separação limpa", () => {
    expect(anexarSecao("# Playbook\n\ntexto\n\n\n", secao)).toBe(`# Playbook\n\ntexto\n\n${secao}\n`);
  });
});

describe("estruturaTemaBlock", () => {
  const ctx = (insights: unknown[]) => ({ insights }) as unknown as GenerationContext;
  const payload = (tema: string) => ({
    titulo: "x",
    base_top: 0.25,
    temas: [{ tema, n: 206, estruturas: [{ code: "A2", nome: "Herói Improvável", n: 25, top_n: 11, p_bruto: 0.44, p_encolhido: 0.4, lift: 1.76, lift_lb: 1.08 }] }],
  });
  test("uma linha por tema, no formato do prompt", () => {
    const out = estruturaTemaBlock(ctx([{ insight_type: "estrutura_tema_lift", scope: "global", payload: payload("INOVAÇÃO") }]));
    expect(out.split("\n")[0]).toBe("ESTRUTURAS COM MELHOR RESULTADO POR TEMA (lift medido no corpus; n entre parênteses)");
    expect(out).toContain("- INOVAÇÃO: A2. Herói Improvável — lift 1,76× (IC inferior 1,08; n=25)");
  });
  test("cliente tem precedência sobre global", () => {
    const out = estruturaTemaBlock(
      ctx([
        { insight_type: "estrutura_tema_lift", scope: "global", payload: payload("GLOBAL") },
        { insight_type: "estrutura_tema_lift", scope: "client:abc", payload: payload("DO CLIENTE") },
      ])
    );
    expect(out).toContain("DO CLIENTE");
    expect(out).not.toContain("GLOBAL");
  });
  test("sem insight (ou sem células) → string vazia", () => {
    expect(estruturaTemaBlock(ctx([]))).toBe("");
    expect(estruturaTemaBlock(ctx([{ insight_type: "estrutura_tema_lift", scope: "global", payload: { temas: [] } }]))).toBe("");
  });
});
