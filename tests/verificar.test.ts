import { describe, expect, test } from "vitest";
import { ALEGACOES_TOOL, VERIFICACAO_TOOL, VEREDICTOS, sanitizarVeredicto } from "@/lib/pipeline/verificar";

// Contrato, nunca julgamento. Não há teste de acerto do verificador: julgamento factual não se
// testa com `assert`, e o portão dele é a fonte citada, visível na tabela (017 §12).

describe("schema do verificador", () => {
  test("as tools têm os nomes do spec", () => {
    expect(ALEGACOES_TOOL.name).toBe("registrar_alegacoes");
    expect(VERIFICACAO_TOOL.name).toBe("registrar_verificacao");
  });

  test("enum de veredicto fechado exatamente nos quatro valores", () => {
    expect(VERIFICACAO_TOOL.input_schema.properties.itens.items.properties.veredicto.enum).toEqual([
      "confirmado",
      "impreciso",
      "falso",
      "nao_verificavel",
    ]);
    expect([...VEREDICTOS]).toEqual(["confirmado", "impreciso", "falso", "nao_verificavel"]);
  });

  test("trecho_literal se descreve como texto EXATO e substituível", () => {
    const d = VERIFICACAO_TOOL.input_schema.properties.itens.items.properties.trecho_literal.description;
    expect(d).toMatch(/EXATO/);
    expect(d).toMatch(/substitu/i);
  });
});

describe("degradação segura da saída do modelo", () => {
  const alegacao = "O PIB cresceu 45 bilhões em 2024";

  test("veredicto fora do enum vira nao_verificavel, nunca confirmado", () => {
    for (const lixo of ["verificado", "CONFIRMADO ✅", "true", "", null, undefined, 7, {}]) {
      const v = sanitizarVeredicto({ alegacao, veredicto: lixo }, alegacao);
      expect(v.veredicto).toBe("nao_verificavel");
      expect(v.veredicto).not.toBe("confirmado");
    }
  });

  test("veredicto válido passa intacto, com fonte", () => {
    const v = sanitizarVeredicto(
      {
        alegacao,
        trecho_literal: "45 bilhões",
        veredicto: "impreciso",
        fonte: { url: "https://x.com/a", veiculo: "IBGE", ano: "2024" },
        correcao: "4,5 bilhões",
        explicacao: "ordem de grandeza errada",
      },
      alegacao
    );
    expect(v).toEqual({
      alegacao,
      trecho_literal: "45 bilhões",
      veredicto: "impreciso",
      fonte: { url: "https://x.com/a", veiculo: "IBGE", ano: "2024" },
      correcao: "4,5 bilhões",
      explicacao: "ordem de grandeza errada",
    });
  });

  test("confirmado sem fonte não é confirmado — veredicto sem fonte não é veredicto (§3.1)", () => {
    const v = sanitizarVeredicto({ alegacao, veredicto: "confirmado", fonte: null }, alegacao);
    expect(v.veredicto).toBe("nao_verificavel");
  });

  test("fonte malformada (sem url) não sustenta um confirmado", () => {
    const v = sanitizarVeredicto({ alegacao, veredicto: "confirmado", fonte: { veiculo: "Reuters" } }, alegacao);
    expect(v.veredicto).toBe("nao_verificavel");
    expect(v.fonte).toBeNull();
  });

  test("falso e impreciso sobrevivem sem fonte — o aviso não pode sumir", () => {
    expect(sanitizarVeredicto({ alegacao, veredicto: "falso" }, alegacao).veredicto).toBe("falso");
    expect(sanitizarVeredicto({ alegacao, veredicto: "impreciso" }, alegacao).veredicto).toBe("impreciso");
  });

  test("correcao só sobrevive em impreciso", () => {
    expect(sanitizarVeredicto({ alegacao, veredicto: "falso", correcao: "outro dado" }, alegacao).correcao).toBeNull();
    expect(sanitizarVeredicto({ alegacao, veredicto: "impreciso", correcao: "4,5 bi" }, alegacao).correcao).toBe("4,5 bi");
  });

  test("sem trecho_literal cai para a alegação, que é texto do roteiro", () => {
    expect(sanitizarVeredicto({ alegacao, veredicto: "falso" }, alegacao).trecho_literal).toBe(alegacao);
  });
});
