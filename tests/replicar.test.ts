import { describe, expect, test } from "vitest";
import {
  anexoReplicar,
  comandoDoOriginal,
  exigirEsqueletoDoOriginal,
  narrativaDoOriginal,
  resolverModo,
} from "@/lib/pipeline/replicar";
import type { Attachment, ModelagemAnalysis } from "@/lib/pipeline/types";

const analysis: ModelagemAnalysis = {
  compreensao: {
    tema: "o lucro dos bancos digitais",
    argumento_central: "quem paga o cartão sem anuidade é o lojista",
    promessa_da_abertura: "o banco que quebrou a bolsa",
    recompensa: "a sensação de ter enxergado quem paga a conta",
    motor_comentario: "acusa um hábito de todo mundo",
    motor_compartilhamento: "vira prova numa discussão",
  },
  diagnostico: { gargalo: "comando", onde_superamos: "o original não pede nada ao espectador" },
  esqueleto: {
    estrutura_narrativa: "A1. Jornada do Herói",
    hook: { tipo: "Curiosidade", fator_de_curiosidade: "quem paga por algo que parece de graça", mecanismo: "dissonância" },
    beats: [
      { ordem: 2, funcao: "tensão", mecanismo_de_atencao: "revela o custo escondido", emocao: "desconforto", seg: 20 },
      { ordem: 1, funcao: "setup", mecanismo_de_atencao: "abre com o benefício óbvio", emocao: "familiaridade", seg: 8 },
      { ordem: 3, funcao: "payoff", mecanismo_de_atencao: "fecha a conta", emocao: "clareza", seg: 12 },
    ],
    escalada: "do bolso do espectador ao mercado inteiro",
    comando: { tipo: "seguir", gatilho: "curiosidade pelo próximo", posicao: "fim" },
  },
};

describe("resolverModo — null é lido como modelar", () => {
  test("só a string exata 'replicar' liga o modo novo", () => {
    expect(resolverModo(null)).toBe("modelar");
    expect(resolverModo(undefined)).toBe("modelar");
    expect(resolverModo("")).toBe("modelar");
    expect(resolverModo("modelar")).toBe("modelar");
    // valor inesperado degrada para o modo ANTIGO, nunca para o novo
    expect(resolverModo("Replicar")).toBe("modelar");
    expect(resolverModo("qualquer coisa")).toBe("modelar");
    expect(resolverModo("replicar")).toBe("replicar");
  });

  test("anexoReplicar só enxerga anexo que também é referência estrutural", () => {
    const a = (over: Partial<Attachment>): Attachment =>
      ({ id: "x", kind: "video_link", is_modelagem: false, url: null, raw_content: null, ...over }) as Attachment;
    // modo replicar sem is_modelagem não conta: a flag continua sendo o portão dos dois modos
    expect(anexoReplicar([a({ modo: "replicar" })])).toBeNull();
    expect(anexoReplicar([a({ is_modelagem: true })])).toBeNull();
    expect(anexoReplicar([a({ is_modelagem: true, modo: "modelar" })])).toBeNull();
    const alvo = a({ id: "alvo", is_modelagem: true, modo: "replicar" });
    expect(anexoReplicar([a({ is_modelagem: true }), alvo])?.id).toBe("alvo");
  });
});

describe("narrativaDoOriginal — a vencedora montada em código", () => {
  test("mapeia esqueleto → narrativa no formato que os agentes downstream consomem", () => {
    const n = narrativaDoOriginal(analysis);
    // a estrutura precisa vir com código + nome: é ela que faz extractPlaybookSection achar o trecho
    expect(n.estrutura).toBe("A1. Jornada do Herói");
    expect(n.titulo).toContain("o lucro dos bancos digitais");
    expect(n.mecanismo_emocional).toBe("a sensação de ter enxergado quem paga a conta");
    expect(n.gancho_potencial).toBe("quem paga por algo que parece de graça");
    expect(n.conflito).toBe("do bolso do espectador ao mercado inteiro");
    expect(n.porque_funciona).toContain("o original não pede nada");
    // nenhum campo obrigatório do tipo pode sair indefinido — formatNarrativa imprime todos
    for (const v of Object.values(n)) expect(v).toBeDefined();
  });

  test("beats fora de ordem são reordenados por `ordem`, com duração preservada", () => {
    const n = narrativaDoOriginal(analysis);
    expect(n.beats).toHaveLength(3);
    expect(n.beats[0]).toContain("setup");
    expect(n.beats[1]).toContain("tensão");
    expect(n.beats[2]).toContain("payoff");
    // a proporção de duração é parte da estrutura, então ela viaja no texto do beat
    expect(n.beats[0]).toContain("~8s");
    expect(n.beats[2]).toContain("~12s");
  });

  test("beat sem ordem vai para o fim, na posição em que chegou", () => {
    const n = narrativaDoOriginal({
      esqueleto: {
        beats: [
          { funcao: "coda", mecanismo_de_atencao: "fecha", emocao: "alívio" } as never,
          { ordem: 1, funcao: "setup", mecanismo_de_atencao: "abre", emocao: "curiosidade" },
        ],
      },
    });
    expect(n.beats[0]).toContain("setup");
    expect(n.beats[1]).toContain("coda");
  });

  test("análise magra não produz campo indefinido nem lista vazia", () => {
    const n = narrativaDoOriginal({});
    expect(n.beats.length).toBeGreaterThan(0);
    expect(n.estrutura).toBeTruthy();
    expect(n.titulo).toBeTruthy();
    expect(typeof n.gancho_potencial).toBe("string");
  });

  test("sem beats a replicação aborta explicitamente, em vez de fingir estrutura", () => {
    expect(() => exigirEsqueletoDoOriginal({})).toThrow(/Replicar/);
    expect(() => exigirEsqueletoDoOriginal({ esqueleto: { estrutura_narrativa: "A1" } })).toThrow();
    expect(() => exigirEsqueletoDoOriginal(analysis)).not.toThrow();
  });
});

describe("comandoDoOriginal — adaptar ou criar, decidido em código", () => {
  test("original com CTA → adaptar, com o que ele fazia descrito", () => {
    const c = comandoDoOriginal(analysis);
    expect(c.adaptar).toBe(true);
    expect(c.descricao).toContain("seguir");
    expect(c.descricao).toContain("via curiosidade pelo próximo");
  });

  test("'nenhum' e campo ausente são a MESMA decisão: criar", () => {
    expect(comandoDoOriginal({ esqueleto: { comando: { tipo: "nenhum" } } }).adaptar).toBe(false);
    expect(comandoDoOriginal({ esqueleto: { comando: { tipo: "" } } }).adaptar).toBe(false);
    expect(comandoDoOriginal({ esqueleto: {} }).adaptar).toBe(false);
    expect(comandoDoOriginal(null).adaptar).toBe(false);
  });
});
