// O número que a tela de configuração mostra é dinheiro, e dinheiro errado em tela viva é pior
// que dinheiro nenhum: ninguém confere uma conta que o sistema apresenta com confiança.
// O que se testa aqui é só o determinístico — a aritmética, o alcance da tabela de preços e o
// fato de que trocar um seletor move o total. Se as medianas estão bem calibradas é outra
// pergunta, e ela se responde medindo de novo, não com assert.
import { describe, expect, test } from "vitest";
import {
  FUNCOES_LLM,
  MODELOS,
  PRECO_POR_MTOK,
  TOKENS_POR_ROTEIRO,
  custoDaFuncao,
  custoDoRoteiro,
  emDolar,
  opcoesDe,
} from "@/lib/llm-catalogo";

const PADROES = Object.fromEntries(FUNCOES_LLM.map((f) => [f.slug, f.padrao as string]));

describe("custoDaFuncao", () => {
  test("multiplica as quatro colunas e divide por um milhão", () => {
    // comando no sonnet-5: 2328 de entrada a US$ 2/MTok + 66 de saída a US$ 10/MTok
    expect(custoDaFuncao("comando", "claude-sonnet-5")).toBeCloseTo((2328 * 2 + 66 * 10) / 1e6, 10);
  });

  // O cache é metade do custo da escrita: 22k de escrita de cache e 15k de leitura por roteiro.
  // Somar só entrada e saída subestimaria a função mais cara do pipeline.
  test("cobra escrita e leitura de cache, cada uma pelo seu preço", () => {
    const t = TOKENS_POR_ROTEIRO.escrita;
    const p = PRECO_POR_MTOK["claude-opus-5-5"];
    expect(custoDaFuncao("escrita", "claude-opus-5-5")).toBeCloseTo(
      (t.entrada * p.entrada + t.saida * p.saida + t.cacheEscrita * p.cacheEscrita + t.cacheLeitura * p.cacheLeitura) / 1e6,
      10
    );
  });

  test("função que não entra num roteiro custa zero, não NaN", () => {
    expect(custoDaFuncao("kasparov", "claude-sonnet-5")).toBe(0);
  });

  test("modelo sem preço na tabela (Grok) custa zero, não NaN", () => {
    expect(custoDaFuncao("pesquisa", "grok-4.3")).toBe(0);
  });
});

describe("custoDoRoteiro", () => {
  test("o padrão de hoje fica na casa do dólar, não do centavo nem da dezena", () => {
    const total = custoDoRoteiro(PADROES);
    expect(total).toBeGreaterThan(0.3);
    expect(total).toBeLessThan(3);
  });

  // É esta a feature: o seletor mexe no número. Se as duas contas derem igual, ou o mapa não
  // está sendo lido, ou a tabela de preços não distingue os modelos.
  test("trocar quem escreve pelo modelo mais caro aumenta o total", () => {
    const caro = custoDoRoteiro({ ...PADROES, escrita: "claude-fable-5-1" });
    const barato = custoDoRoteiro({ ...PADROES, escrita: "claude-haiku-4-5" });
    expect(caro).toBeGreaterThan(barato * 2);
  });

  test("mapa vazio cai nos padrões do catálogo em vez de zerar", () => {
    expect(custoDoRoteiro({})).toBeCloseTo(custoDoRoteiro(PADROES), 10);
  });
});

// A armadilha real: alguém adiciona um modelo em MODELOS, a tela passa a oferecê-lo, e a conta
// o trata como grátis em silêncio. O teste quebra no dia em que o preço faltar.
test("todo modelo que a tela oferece tem preço", () => {
  for (const f of FUNCOES_LLM)
    for (const m of opcoesDe(f.slug))
      if (m.provedor === "anthropic") expect(PRECO_POR_MTOK[m.id], `${m.id} sem preço`).toBeDefined();
});

test("todo slug com tokens medidos é uma função que existe", () => {
  for (const slug of Object.keys(TOKENS_POR_ROTEIRO))
    expect(FUNCOES_LLM.some((f) => f.slug === slug), `${slug} não é função`).toBe(true);
});

test("nenhum preço sobrando: a tabela só fala de modelo do catálogo", () => {
  for (const id of Object.keys(PRECO_POR_MTOK))
    expect(MODELOS.some((m) => m.id === id), `${id} não está em MODELOS`).toBe(true);
});

describe("emDolar", () => {
  test("duas casas e vírgula decimal", () => {
    expect(emDolar(0.8047)).toBe("US$ 0,80");
    expect(emDolar(1.5)).toBe("US$ 1,50");
  });
});
