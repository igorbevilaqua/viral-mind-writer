import { describe, expect, test } from "vitest";
import { textMetrics, PALAVRAS_MAGICAS } from "@/lib/text-metrics";

// WP-B (plano 020): lista fechada de métricas de comunicação — contagens conferidas à mão.

// 3 parágrafos, 8 frases, 40 palavras, 2 números, 1 pergunta, 1 imperativo ("Pare").
const TEXTO = [
  "Você sabia que 37,5% das empresas fecham em cinco anos? Eu vi isso de perto. Ninguém fala disso.",
  "Pare de culpar o mercado. O problema é outro. Vou te mostrar.",
  "Meu primeiro negócio custou R$ 3.400 por mês. Aprendi rápido.",
].join("\n\n");

describe("textMetrics", () => {
  test("contagens exatas do texto de referência", () => {
    const m = textMetrics(TEXTO);
    expect(m.paragrafos).toBe(3);
    expect(m.frases).toBe(8);
    expect(m.palavras).toBe(40);
    expect(m.palavras_por_frase_media).toBe(5);
    expect(m.palavras_por_frase_p90).toBe(10);
    expect(m.frases_curtas_pct).toBe(75); // 6 das 8 têm ≤6 palavras
    expect(m.palavras_por_paragrafo_media).toBeCloseTo(13.33, 2);
    expect(m.numeros_por_100_palavras).toBe(5); // 37,5% e R$ 3.400
    expect(m.frases_com_numero_pct).toBe(25);
    expect(m.perguntas_por_100_frases).toBe(12.5);
    expect(m.imperativos_por_100_frases).toBe(12.5);
    expect(m.voce_por_100).toBe(5); // "Você", "te"
    expect(m.eu_por_100).toBe(5); // "Eu", "Meu"
    expect(m.nos_por_100).toBe(0);
    expect(m.magicas_por_100_palavras).toBe(2.5); // "Ninguém"
    expect(m.nomes_proprios_por_100).toBe(0);
  });

  test("'R$ 3.400 por mês.' é 1 frase e 1 número", () => {
    const m = textMetrics("R$ 3.400 por mês.");
    expect(m.frases).toBe(1);
    expect(m.palavras).toBe(4);
    expect(m.numeros_por_100_palavras).toBe(25);
    expect(m.frases_com_numero_pct).toBe(100);
  });

  test("'2 milhões' e '1.2k' contam um número cada", () => {
    const m = textMetrics("Foram 2 milhões de views e 1.2k comentários.");
    expect(m.numeros_por_100_palavras).toBe(25); // 2 números em 8 palavras
  });

  test("'a gente' conta em nos_por_100; nome próprio fora do início da frase conta", () => {
    const m = textMetrics("Hoje a gente vai falar do Pelozato. Nós fomos lá.");
    expect(m.nos_por_100).toBe(20); // "a gente" + "Nós" em 10 palavras
    expect(m.nomes_proprios_por_100).toBe(10); // só "Pelozato"; "Hoje"/"Nós" abrem frase
  });

  test("hook de 2 frases com número", () => {
    const m = textMetrics(TEXTO, "Ninguém te contou isso. Custa R$ 3.400.");
    expect(m.hook_frases).toBe(2);
    expect(m.hook_palavras).toBe(7);
    expect(m.hook_tem_numero).toBe(true);
  });

  test("sem hook → campos de hook null", () => {
    const m = textMetrics(TEXTO);
    expect(m.hook_palavras).toBeNull();
    expect(m.hook_frases).toBeNull();
    expect(m.hook_tem_numero).toBeNull();
    expect(textMetrics(TEXTO, "   ").hook_frases).toBeNull();
  });

  test("texto vazio não divide por zero", () => {
    const m = textMetrics("");
    for (const [k, v] of Object.entries(m)) {
      if (k.startsWith("hook_")) expect(v).toBeNull();
      else expect(v).toBe(0);
    }
  });

  test("PALAVRAS_MAGICAS segue igual à semente do analyze-hooks", () => {
    expect(PALAVRAS_MAGICAS).toContain("segredo");
    expect(PALAVRAS_MAGICAS).toHaveLength(18);
  });
});
