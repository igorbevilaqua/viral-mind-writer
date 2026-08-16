// Os detectores das Tasks 3 e 4 só viram efeito aqui: sem este bloco eles gravam no trace e
// não mudam uma vírgula do roteiro — a falha silenciosa que o pacote 2.0 inteiro combate.
import { describe, expect, test } from "vitest";
import { blocoSinaisRevisor, TETO_ECOS } from "@/lib/pipeline/draft";

const eco = (valor: string, frases: string[]) => ({ valor, frases });

describe("bloco de sinais entregue ao revisor", () => {
  test("sem sinal nenhum, o bloco não existe", () => {
    expect(blocoSinaisRevisor([], false)).toBe("");
  });

  test("lista as frases do eco, não só o número", () => {
    const b = blocoSinaisRevisor(
      [eco("60%", ["mais de 60% de quem compra tem entre 18 e 24 anos.", "60% dizem que gostariam de ter vivido numa época menos conectada."])],
      false
    );
    expect(b).toContain("60%");
    expect(b).toContain("mais de 60% de quem compra");
    expect(b).toContain("60% dizem que gostariam");
  });

  // A regra não é "não repita", é "repetição tem que se pagar" (016 §6.1). Instruir corte
  // destruiria o refrão do 400% e o contraste do 37,5% — dois dos quatro casos reais.
  test("a instrução termina em MANTENHA, nunca em corte", () => {
    const b = blocoSinaisRevisor([eco("400%", ["a", "b"])], false);
    expect(b).toContain("MANTENHA");
    expect(b).not.toMatch(/corte (todas|sempre)|nunca repita|não repita/i);
  });

  test("o eco de hook × abertura entra quando sinalizado", () => {
    expect(blocoSinaisRevisor([], true)).toMatch(/abertura do corpo/i);
    expect(blocoSinaisRevisor([], false)).not.toMatch(/abertura do corpo/i);
  });

  test("respeita o teto e diz quantos ficaram de fora", () => {
    const muitos = Array.from({ length: TETO_ECOS + 3 }, (_, i) => eco(`${i}%`, ["x", "y"]));
    const b = blocoSinaisRevisor(muitos, false);
    // uma linha "- \"N%\" aparece em" por eco listado
    expect(b.match(/aparece em \d+ frases/g)).toHaveLength(TETO_ECOS);
    expect(b).toContain("3"); // o excedente é dito, nunca cortado em silêncio
  });
});
