import { describe, expect, test } from "vitest";
import { composeBrief, compreensaoBlock } from "@/lib/pipeline/modelagem-brief";
import type { ModelagemAnalysis } from "@/lib/pipeline/types";

// Regressão anti-cópia. A fronteira MUDOU (Etapa D): a missão da modelagem passou a ser extrair
// a TESE do original e escrever uma versão melhor dela, então a tese e o assunto atravessam de
// propósito. O que continua barrado é o TEXTO: frase literal da transcrição (`por_camada.evidencia`),
// as alegações como o vídeo as enuncia (existem para a pesquisa CHECAR) e a promessa da abertura
// (é o hook dele quase literal — o nosso nasce da premissa).
// Fronteira nova: ideia atravessa, redação não.
const TEXTO_LITERAL_PROIBIDO = [
  // frases literais plantadas em por_camada[].evidencia
  "David Vélez começou numa garagem",
  "ninguém te contou que seu cartão financia isso",
  "o Nubank lucrou R$ 4.7 bilhões em 2026",
  // promessa da abertura = hook do original
  "o banco que quebrou a bolsa americana",
  // alegações como o vídeo as enuncia
  "é o maior banco digital do mundo",
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

  test("não vaza NENHUMA frase literal do vídeo original", () => {
    for (const trecho of TEXTO_LITERAL_PROIBIDO) {
      expect(brief).not.toContain(trecho);
    }
  });

  test("carrega a arquitetura transferível", () => {
    expect(brief).toContain("B1. Davi e Golias");
    expect(brief).toContain("Contraste Extremo");
    expect(brief).toContain("revela o custo escondido");
    expect(brief).toContain("NÃO REPLICAR");
    expect(brief).toContain("ONDE O ORIGINAL ERA MAIS FRACO (é aqui que a nossa versão ganha dele): comando");
    expect(brief).toContain("Views: 2100000");
  });

  test("a TESE do original atravessa — é a premissa que a nossa versão sustenta", () => {
    expect(brief).toContain("TESE DO ORIGINAL");
    expect(brief).toContain("cobrando do lojista"); // o argumento central, agora permitido
    expect(brief).toContain("ASSUNTO: o lucro do Nubank em 2026");
  });

  test("leva a recompensa e os motores como alvo emocional a igualar ou superar", () => {
    expect(brief).toContain("RECOMPENSA A ENTREGAR");
    expect(brief).toContain("iguale ou supere");
    expect(brief).toContain("enxergado quem paga a conta");
    expect(brief).toContain("O que faz compartilhar");
  });

  test("a curva emocional beat a beat atravessa (replicar o sentimento, não só a estrutura)", () => {
    expect(brief).toContain("indignação");
    expect(brief).toContain("satisfação");
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
    expect(composeBrief(gordo).length).toBeLessThanOrEqual(2801); // BRIEF_MAX + reticência
  });

  test("análise sem esqueleto utilizável devolve vazio (a geração segue sem modelagem)", () => {
    expect(composeBrief({})).toBe("");
    expect(composeBrief({ esqueleto: { estrutura_narrativa: "B1. Davi e Golias" } })).toBe("");
  });
});

describe("compreensaoBlock", () => {
  test("manda DEFENDER a tese do original, não fugir dela", () => {
    const bloco = compreensaoBlock(analysis);
    expect(bloco).toContain("o lucro do Nubank");
    expect(bloco).toContain("cobrando do lojista");
    expect(bloco).toContain("É ESTA QUE VAMOS DEFENDER, MELHOR");
    expect(bloco).toContain("Não troque a tese por outra");
    expect(bloco).toContain("RECOMPENSA");
    // a instrução antiga (fugir do ângulo do original) foi revertida de propósito
    expect(bloco).not.toContain("ataque por outro");
  });

  test("sem compreensão (modo com tema) devolve vazio", () => {
    expect(compreensaoBlock({ ...analysis, compreensao: undefined })).toBe("");
  });
});
