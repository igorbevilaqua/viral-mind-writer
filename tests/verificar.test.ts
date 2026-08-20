import { describe, expect, test, vi } from "vitest";

// `classificar` é a única peça daqui que fala com modelo — o `trackedCreate` entra mockado
// (padrão do classify-teaching.test.ts). O resto do arquivo é função pura.
const resposta = { atual: {} as unknown };
vi.mock("@/lib/anthropic", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  trackedCreate: async () => ({
    content: [{ type: "tool_use", name: "registrar_verificacao", input: resposta.atual }],
  }),
}));

import { ALEGACOES_TOOL, VERIFICACAO_TOOL, VEREDICTOS, classificar, sanitizarVeredicto } from "@/lib/pipeline/verificar";

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
      // `impreciso` nunca é marcado por tier — o veredicto dele não depende de procedência
      fonte_fraca: null,
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

// ── A hierarquia de fontes como PORTÃO, não como prosa no prompt ─────────────
// O furo real da sessão #d69fc7: o dossiê citou `bestcolleges.com` e aquilo sustentou um
// `confirmado`, porque `tierDe` nunca via a URL do veredicto.

describe("hierarquia de fontes MARCA o confirmado, não o destrói", () => {
  const alegacao = "O PIB cresceu 45 bilhões em 2024";
  const conf = (url: string, veredicto = "confirmado") =>
    sanitizarVeredicto({ alegacao, veredicto, fonte: { url, veiculo: "V", ano: "2024" }, explicacao: "a fonte diz isso" }, alegacao);

  test("fonte dentro da hierarquia confirma limpo, sem marca (os três tiers)", () => {
    for (const url of ["https://sec.gov/x", "https://reuters.com/x", "https://wikipedia.org/x"]) {
      expect(conf(url).veredicto).toBe("confirmado");
      expect(conf(url).fonte_fraca).toBeNull();
    }
  });

  test("subdomínio conta (a regra é sufixo, como manda o JSON)", () => {
    expect(conf("https://data.sec.gov/x").fonte_fraca).toBeNull();
    expect(conf("https://www.reuters.com/x").fonte_fraca).toBeNull();
    // a fronteira de ponto não deixa `notsec.gov` passar por `sec.gov` — marca, mas não recusa
    expect(conf("https://notsec.gov/x").veredicto).toBe("confirmado");
    expect(conf("https://notsec.gov/x").fonte_fraca).toBe("notsec.gov");
  });

  // ── A REGRESSÃO QUE A RODADA REAL PEGOU (v3 da #d69fc7) ────────────────────
  // O JSON não é exaustivo: recusar por ausência dele reprovava a fonte PRIMÁRIA do fato.
  test("fonte oficial fora do JSON continua confirmando — só sai marcada", () => {
    // blog.google sobre um anúncio do próprio Google: a fonte mais forte que existe pra isso
    const v = conf("https://blog.google/innovation-and-ai/products/gemini-app/student-offer-google-ai/");
    expect(v.veredicto).toBe("confirmado");
    expect(v.veredicto).not.toBe("nao_verificavel");
    expect(v.fonte_fraca).toBe("blog.google");
    // e a explicação do verificador NÃO é reescrita por cima
    expect(v.explicacao).toBe("a fonte diz isso");
  });

  test("blog aleatório também confirma, mas marcado — deixa de passar como confirmação limpa", () => {
    const v = conf("https://bestcolleges.com/news/google-free-ai");
    expect(v.veredicto).toBe("confirmado");
    expect(v.fonte_fraca).toBe("bestcolleges.com");
    // a fonte fica no item: o usuário clica e julga por conta
    expect(v.fonte?.url).toBe("https://bestcolleges.com/news/google-free-ai");
  });

  test("confirmado sem fonte NENHUMA continua rebaixado — ausência não é procedência fraca", () => {
    expect(sanitizarVeredicto({ alegacao, veredicto: "confirmado", fonte: null }, alegacao).veredicto).toBe(
      "nao_verificavel"
    );
  });

  test("falso e impreciso NÃO são marcados por tier — o veredicto deles não depende disso", () => {
    expect(conf("https://blogueiro.qualquer/x", "falso").veredicto).toBe("falso");
    expect(conf("https://blogueiro.qualquer/x", "falso").fonte_fraca).toBeNull();
    expect(conf("https://blogueiro.qualquer/x", "impreciso").fonte_fraca).toBeNull();
  });
});

// ── Casamento alegação↔veredicto: só por texto ───────────────────────────────

describe("classificar não cola veredicto na alegação errada", () => {
  const A = "A Vale lucrou 45 bilhões em 2024";
  const B = "A Petrobras produziu 3 milhões de barris em 2023";
  const itens = [A, B].map((alegacao) => ({ alegacao, busca: { texto: "t", fontes: ["https://reuters.com/x"] } }));
  const bom = (alegacao: string) => ({
    alegacao,
    trecho_literal: alegacao,
    veredicto: "confirmado",
    fonte: { url: "https://reuters.com/x", veiculo: "Reuters", ano: "2024" },
    explicacao: "confere",
  });

  test("fora de ordem: casa por texto, cada veredicto na SUA alegação", async () => {
    resposta.atual = { itens: [bom(B), bom(A)] };
    const out = await classificar(itens);
    expect(out.map((o) => o.alegacao)).toEqual([A, B]);
    expect(out.map((o) => o.veredicto)).toEqual(["confirmado", "confirmado"]);
  });

  test("contagem igual mas alegações PARAFRASEADAS: cai em nao_verificavel, não cola por posição", async () => {
    // Este é o caminho que o fallback posicional (`crus[i]`) tornava inseguro: dois
    // `confirmado` escritos sobre outra coisa entravam como se fossem destas alegações.
    resposta.atual = { itens: [bom("parafraseou a primeira"), bom("parafraseou a segunda")] };
    const out = await classificar(itens);
    expect(out.map((o) => o.veredicto)).toEqual(["nao_verificavel", "nao_verificavel"]);
    expect(out.map((o) => o.alegacao)).toEqual([A, B]);
    expect(out.every((o) => o.fonte === null)).toBe(true);
  });

  test("o modelo pulou uma: a que sobrou não herda o veredicto da outra", async () => {
    resposta.atual = { itens: [bom(A)] };
    const out = await classificar(itens);
    expect(out[0].veredicto).toBe("confirmado");
    expect(out[1].veredicto).toBe("nao_verificavel");
    expect(out[1].alegacao).toBe(B);
  });
});
