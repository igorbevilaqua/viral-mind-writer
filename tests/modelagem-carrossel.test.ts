import { beforeEach, describe, expect, it, vi } from "vitest";

// A modelagem passou a receber DOIS formatos: vídeo (transcrição do áudio) e carrossel (texto dos
// slides). A tool é a mesma de propósito — hook, sequência e fechamento existem nos dois, e duas
// tools criariam duas definições da casa de "bom hook". O que estes testes travam é o que muda:
// o vocabulário do prompt e o mapa de onde cada peça mora no carrossel. Sem isso o analista lê
// "SLIDE 1" como transcrição malformatada e procura duração de beat num material sem tempo.
const { prompts, fakeAppDb } = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  const prompts: string[] = [];
  // sem cache (maybeSingle devolve null) para a autópsia rodar de verdade, e insert que aceita
  const fakeAppDb = {
    from: () => ({
      select: () => ({
        or: () => ({ order: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
      }),
      insert: async () => ({ error: null }),
    }),
  };
  return { prompts, fakeAppDb };
});

vi.mock("@/lib/db", () => ({ appDb: fakeAppDb, viralData: {} }));
vi.mock("@/lib/anthropic", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  trackedCreate: async (_log: unknown, _fase: string, params: { messages: { content: string }[] }) => {
    prompts.push(params.messages[0].content);
    return {
      stop_reason: "tool_use",
      content: [
        {
          type: "tool_use",
          name: "registrar_modelagem",
          input: {
            esqueleto: {
              estrutura_narrativa: "A1. Loop Aberto",
              hook: { tipo: "contradicao", fator_de_curiosidade: "x", mecanismo: "y", funcao: "z" },
              beats: [
                { ordem: 1, funcao: "setup", mecanismo_de_atencao: "a", emocao: "b" },
                { ordem: 2, funcao: "tensão", mecanismo_de_atencao: "a", emocao: "b" },
                { ordem: 3, funcao: "payoff", mecanismo_de_atencao: "a", emocao: "b" },
              ],
              escalada: "sobe",
            },
            diagnostico: { gargalo: "hook", onde_superamos: "w", por_camada: [] },
          },
        },
      ],
    };
  },
}));

import { autopsiaDeUrl } from "@/lib/pipeline/modelagem";

const SLIDES = `[CARROSSEL DO INSTAGRAM — 3 slides lidos]

SLIDE 1: O ERRO DE 90% DOS CRIADORES
SLIDE 2: eles postam todo dia
SLIDE 3: salve este post`;

const prompt = () => prompts.at(-1)!;

beforeEach(() => {
  prompts.length = 0;
});

describe("autópsia de carrossel", () => {
  it("marca o material como carrossel e manda o mapa de onde cada peça mora", async () => {
    await autopsiaDeUrl("https://www.instagram.com/p/DAbCdEfGhIj/", { transcript: SLIDES });

    expect(prompt()).toContain("SLIDES DO CARROSSEL:");
    expect(prompt()).not.toContain("TRANSCRIÇÃO:");
    expect(prompt()).toContain("ESTE MATERIAL É UM CARROSSEL");
    // o mapa é o que impede o analista de procurar duração num material sem tempo
    expect(prompt()).toContain("O campo seg não se aplica a carrossel");
    expect(prompt()).toContain("hook: o slide 1 inteiro");
    expect(prompt()).toContain('leia "leitor"');
    // a legenda não pode ser confundida com slide
    expect(prompt()).toContain("marcada como LEGENDA DO POST");
    expect(prompt()).toContain("Ela é moldura, não é o roteiro");
  });

  it("vídeo segue exatamente como era: sem mapa de carrossel, e o rótulo é transcrição", async () => {
    await autopsiaDeUrl("https://www.instagram.com/reel/DWICMEWiR1O/", {
      transcript: "e a Marvel foi ao tribunal provar que o Wolverine não é humano",
    });

    expect(prompt()).toContain("TRANSCRIÇÃO:");
    expect(prompt()).not.toContain("CARROSSEL");
    expect(prompt()).toContain("Desconstrua o vídeo abaixo");
  });

  it("sem tema, a missão fala do material certo (o usuário vai confirmar a tese dele)", async () => {
    await autopsiaDeUrl(null, { transcript: SLIDES });
    expect(prompt()).toContain("MESMO assunto deste carrossel");
  });
});
