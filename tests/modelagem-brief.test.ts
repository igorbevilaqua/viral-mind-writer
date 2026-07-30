import { describe, expect, test } from "vitest";
import { composeBrief, compreensaoBlock } from "@/lib/pipeline/modelagem-brief";
import type { ModelagemAnalysis } from "@/lib/pipeline/types";

// Regressão da queixa "o roteiro sai como cópia do vídeo modelado": o brief que chega
// ao roteirista não pode carregar NADA do conteúdo do vídeo original — só a mecânica.
// Os campos que contêm conteúdo (evidencia literal, ângulos com hook pronto) estão
// plantados de propósito com marcadores que não podem aparecer na saída.
const CONTEUDO_PLANTADO = [
  "Nubank",
  "R$ 4.7 bilhões",
  "David Vélez",
  "2026",
  "o banco que quebrou a bolsa americana",
  "ninguém te contou que seu cartão financia isso",
];

const analysis: ModelagemAnalysis = {
  compreensao: {
    tema: "o lucro do Nubank em 2026",
    argumento_central: "David Vélez construiu um banco que lucra R$ 4.7 bilhões cobrando do lojista, não de você",
    promessa_da_abertura: "o banco que quebrou a bolsa americana",
    recompensa: "a sensação de ter enxergado quem paga a conta de um benefício que parecia de graça",
    motor_comentario: "acusa um hábito que quase todo espectador tem, e ele quer se defender",
    motor_compartilhamento: "serve de prova numa discussão que a pessoa já teve",
    alegacoes: ["o lucro foi de R$ 4.7 bilhões em 2026", "é o maior banco digital do mundo"],
  },
  diagnostico: {
    gargalo: "comando",
    onde_superamos: "o original não pede nada ao espectador; a nossa versão fecha com pedido de compartilhamento",
    por_camada: [
      { camada: "tema", evidencia: "o Nubank lucrou R$ 4.7 bilhões em 2026", leitura: "tema de dinheiro, apelo amplo" },
      {
        camada: "hook",
        evidencia: "o banco que quebrou a bolsa americana",
        leitura: "contraste extremo prende no primeiro segundo",
      },
      { camada: "narrativa", evidencia: "David Vélez começou numa garagem", leitura: "arco de ascensão sustenta o meio" },
      {
        camada: "comando",
        evidencia: "ninguém te contou que seu cartão financia isso",
        leitura: "termina sem pedir ação nenhuma",
      },
    ],
  },
  esqueleto: {
    estrutura_narrativa: "B1. Davi e Golias",
    hook: { tipo: "Contraste Extremo", mecanismo: "dissonância", funcao: "opor duas escalas incompatíveis em uma frase" },
    beats: [
      { ordem: 1, funcao: "setup", mecanismo_de_atencao: "estabelece o desequilíbrio de forças", emocao: "curiosidade" },
      { ordem: 2, funcao: "tensão", mecanismo_de_atencao: "revela o custo escondido", emocao: "indignação" },
      { ordem: 3, funcao: "payoff", mecanismo_de_atencao: "fecha o loop da abertura", emocao: "satisfação" },
    ],
    loops_abertos: [{ o_que_fica_pendente: "como o lado fraco venceu", fecha_em_qual_beat: 3 }],
    escalada: "de consequência individual para consequência coletiva",
    comando: { tipo: "compartilhamento", gatilho: "utilidade para terceiros", posicao: "final" },
  },
  nao_transferivel: ["autoridade do criador no nicho de finanças", "janela de notícia do balanço trimestral"],
  timing: { classe: "trending", contribuicao_pct: 40 },
};

describe("composeBrief", () => {
  const brief = composeBrief(analysis, "Views: 2100000 | Retenção hook: 88%");

  test("não vaza nenhum conteúdo do vídeo original", () => {
    for (const trecho of CONTEUDO_PLANTADO) {
      expect(brief).not.toContain(trecho);
    }
  });

  test("carrega a arquitetura transferível", () => {
    expect(brief).toContain("B1. Davi e Golias");
    expect(brief).toContain("Contraste Extremo");
    expect(brief).toContain("revela o custo escondido");
    expect(brief).toContain("NÃO REPLICAR");
    expect(brief).toContain("GARGALO DO ORIGINAL: comando");
    expect(brief).toContain("Views: 2100000");
  });

  test("leva a recompensa como alvo, mas não o tema nem a tese do original", () => {
    expect(brief).toContain("RECOMPENSA A ENTREGAR");
    expect(brief).toContain("enxergado quem paga a conta");
    expect(brief).toContain("O que faz compartilhar:");
    // o que a sala usa mas o roteirista não pode ver
    expect(brief).not.toContain("o lucro do Nubank");
    expect(brief).not.toContain("cobrando do lojista");
    expect(brief).not.toContain("maior banco digital do mundo");
  });

  test("respeita o teto de tamanho", () => {
    const gordo: ModelagemAnalysis = {
      ...analysis,
      esqueleto: {
        ...analysis.esqueleto,
        beats: Array.from({ length: 60 }, (_, i) => ({
          ordem: i + 1,
          funcao: "tensão",
          mecanismo_de_atencao: "mecanismo bem descrito e longo o suficiente para estourar o teto do brief",
          emocao: "curiosidade",
        })),
      },
    };
    expect(composeBrief(gordo).length).toBeLessThanOrEqual(1401); // BRIEF_MAX + reticência
  });

  test("análise sem esqueleto utilizável devolve vazio (a geração segue sem modelagem)", () => {
    expect(composeBrief({})).toBe("");
    expect(composeBrief({ esqueleto: { estrutura_narrativa: "B1. Davi e Golias" } })).toBe("");
  });
});

describe("compreensaoBlock", () => {
  test("entrega à sala o que o roteirista não pode ver", () => {
    const bloco = compreensaoBlock(analysis);
    expect(bloco).toContain("o lucro do Nubank");
    expect(bloco).toContain("cobrando do lojista");
    expect(bloco).toContain("ataque por outro"); // ordem explícita de não repetir o ângulo
    expect(bloco).toContain("RECOMPENSA");
  });

  test("sem compreensão (modo com tema) devolve vazio", () => {
    expect(compreensaoBlock({ ...analysis, compreensao: undefined })).toBe("");
  });
});
