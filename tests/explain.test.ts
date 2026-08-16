// tests/explain.test.ts
// Só o determinístico: o portão do JULGAMENTO do agente é a confirmação humana na tela,
// não um assert. O que se testa aqui é o contrato (enum fechado), o atalho que evita a
// chamada em roteiro antigo, e a montagem da entrada por etapa.
import { describe, expect, test } from "vitest";
import { CAUSAS, EXPLICACAO_TOOL, explicar, montarEntrada } from "@/lib/pipeline/explain";

const traceCompleto = {
  assembled: "a",
  revised: "b",
  final: "c",
  violations: [
    { label: "muleta", match: "nesse vídeo", severity: "warn" as const },
    { label: "outra", match: "de forma inequívoca", severity: "block" as const },
  ],
  roteiro_original: "texto da sala",
  edicao_humana: true, // par que updateScript sempre gravou junto — é o caso de edição humana
  proveniencia: {
    blocos: {
      roteirista: { premissa: "p", licoes: [{ id: "L1", titulo: "abra pelo número" }] },
      hook: { licoes: [{ id: "L2", titulo: "hook sem contexto" }] },
      comando: { licoes: [] },
      revisao: { checklist_ref: { slug: "checklist", version: 3 }, licoes: [{ id: "L3", titulo: "corta advérbio" }] },
    },
    critica: "o segundo bloco explica demais",
    hooks_descartados: [],
    bob: [{ trecho: "x", instrucao: "encurta", pesquisou: false, at: "2026-08-16" }],
    licoes_excedidas: {},
  },
};

describe("contrato da tool", () => {
  test("causa tem exatamente os oito valores do §4.3", () => {
    expect(EXPLICACAO_TOOL.input_schema.properties.causa.enum).toEqual([
      "licao",
      "playbook",
      "vocabulario",
      "premissa",
      "narrativa",
      "violacao",
      "instrucao_sua",
      "nao_determinado",
    ]);
  });

  test("o enum da tool e a constante CAUSAS não podem divergir", () => {
    expect(EXPLICACAO_TOOL.input_schema.properties.causa.enum).toEqual([...CAUSAS]);
  });

  test("a tool é forçada pelo nome registrar_explicacao", () => {
    expect(EXPLICACAO_TOOL.name).toBe("registrar_explicacao");
  });
});

describe("roteiro anterior à 2.0", () => {
  test("trace sem proveniencia não monta entrada (sinal de não chamar o modelo)", () => {
    expect(montarEntrada("qualquer trecho", "revisao", { assembled: "a", revised: "b" })).toBeNull();
    expect(montarEntrada("qualquer trecho", "roteirista", null)).toBeNull();
  });

  test("explicar devolve nao_determinado sem tocar no modelo", async () => {
    // Se houvesse chamada de LLM aqui isto não resolveria em milissegundos nem sem rede.
    const r = await explicar({ trecho: "o mercado surtou", etapa: "revisao", trace: { revised: "o mercado surtou" } });
    expect(r).toEqual({
      etapa: "revisao",
      causa: "nao_determinado",
      referencia: null,
      explicacao: "Sei que o revisor reescreveu este trecho, mas este roteiro é anterior ao registro de proveniência.",
    });
  });

  test("a mensagem nomeia a etapa que de fato produziu o trecho", async () => {
    const r = await explicar({ trecho: "x", etapa: "humanizacao", trace: {} });
    expect(r.explicacao).toContain("o humanizador");
    expect(r.causa).toBe("nao_determinado");
  });
});

describe("montagem da entrada por etapa", () => {
  test("roteirista vê os blocos da escrita, nunca a crítica nem as violações", () => {
    const e = montarEntrada("trecho", "roteirista", traceCompleto)!;
    expect(e.blocos_da_escrita).toEqual({
      roteirista: traceCompleto.proveniencia.blocos.roteirista,
      hook: traceCompleto.proveniencia.blocos.hook,
      comando: traceCompleto.proveniencia.blocos.comando,
    });
    expect(e.critica).toBeUndefined();
    expect(e.violacoes_no_trecho).toBeUndefined();
  });

  test("revisao vê a crítica do revisor e o bloco dele", () => {
    const e = montarEntrada("trecho", "revisao", traceCompleto)!;
    expect(e.critica).toBe("o segundo bloco explica demais");
    expect(e.bloco_da_revisao).toEqual(traceCompleto.proveniencia.blocos.revisao);
    expect(e.blocos_da_escrita).toBeUndefined();
  });

  test("humanizacao vê só as violações que casam com o trecho", () => {
    const e = montarEntrada("Nesse VÍDEO eu vou te mostrar o resto.", "humanizacao", traceCompleto)!;
    expect(e.violacoes_no_trecho).toEqual([traceCompleto.violations[0]]);
  });

  test("trecho sem violação casada não recebe violação alheia", () => {
    const e = montarEntrada("uma frase limpa qualquer", "humanizacao", traceCompleto)!;
    expect(e.violacoes_no_trecho).toEqual([]);
  });

  test("pos_save vê o log do Bob e a flag de edição humana", () => {
    const e = montarEntrada("trecho", "pos_save", traceCompleto)!;
    expect(e.edicoes_do_bob).toEqual(traceCompleto.proveniencia.bob);
    expect(e.houve_edicao_humana).toBe(true);
  });

  test("sem edição humana a flag é falsa", () => {
    const semEdicao = { ...traceCompleto, roteiro_original: undefined, edicao_humana: undefined };
    expect(montarEntrada("trecho", "pos_save", semEdicao)!.houve_edicao_humana).toBe(false);
  });

  // Correção da verificação (peça 3) também grava `roteiro_original`. Ler esse campo faria o
  // explicador afirmar ao usuário que ELE editou o trecho — inventar causa é o que este agente
  // existe para não fazer. Os dois sinais são distintos.
  test("correção factual não é reportada como edição humana", () => {
    const soCorrecao = {
      ...traceCompleto,
      roteiro_original: "texto da sala",
      edicao_humana: undefined,
      correcao_factual: true,
    };
    const e = montarEntrada("trecho", "pos_save", soCorrecao)!;
    expect(e.houve_edicao_humana).toBe(false);
    expect(e.houve_correcao_factual).toBe(true);
  });
});

describe("ids citáveis", () => {
  test("saem das lições do bloco daquela etapa", () => {
    expect(montarEntrada("t", "roteirista", traceCompleto)!.ids_citaveis).toEqual(["L1", "L2"]);
    expect(montarEntrada("t", "revisao", traceCompleto)!.ids_citaveis).toEqual(["L3", "checklist"]);
  });
});
