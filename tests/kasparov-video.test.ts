import { describe, expect, it, vi } from "vitest";

// 018 §7 — o debate sobre vídeo. O que estes testes travam é o que o Kasparov PODE dizer:
//   • vídeo no acervo abre pelo RATIO (views sozinhas medem a audiência herdada, não o vídeo);
//   • vídeo fora do acervo sai com o aviso de que é opinião, EXPLÍCITO, dentro do bloco que
//     vai ao modelo — não num comentário de código (§6, §11);
//   • vídeo que não deu para ler não vira debate nenhum (§11: "nunca opina sobre vídeo que
//     não leu"), e a recusa diz QUAL vídeo e POR QUÊ.
// Nada de SDK aqui: as três dependências de rede (transcrição, acervo, autópsia) entram
// injetadas. O mock de @/lib/db existe só porque o módulo importa a autópsia real como
// default das deps, e modelagem.ts instancia os clientes no topo.
vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
});
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));

import {
  blocoDeVideo,
  linhaDeRatio,
  ratioDoVideo,
  type DepsDeVideo,
  type VideoNoAcervo,
} from "@/lib/pipeline/kasparov-video";
import type { ModelagemResult } from "@/lib/pipeline/modelagem";

const URL_VIDEO = "https://www.instagram.com/reel/DWICMEWiR1O/";

const NO_ACERVO: VideoNoAcervo = {
  url: URL_VIDEO,
  titulo: "A ESTRATÉGIA QUE SALVOU R$6,4 BILHÕES",
  views: 316_000,
  seguidores: 1556,
  ratio: ratioDoVideo(316_000, 1556),
  fonte: "corpus",
};

// Formato real de vm_modelagem_analyses.analysis (select em 2026-08-16).
const AUTOPSIA: ModelagemResult = {
  brief: "ESTRUTURA-BASE: A1. Loop Aberto | HOOK: contradicao",
  analysis: {
    compreensao: {
      tema: "juros do rotativo",
      argumento_central: "o banco lucra com o atraso",
      promessa_da_abertura: "vou te mostrar quanto você paga de verdade",
      recompensa: "a sensação de ter enxergado um golpe em que todo mundo cai",
      motor_comentario: "quem discorda vem contar o próprio caso",
      motor_compartilhamento: "prova de tese para mandar a quem paga rotativo",
    },
    diagnostico: {
      gargalo: "comando",
      por_camada: [
        { camada: "hook", evidencia: "você paga 400% ao ano e acha que é 4%", leitura: "abre pela contradição numérica" },
        { camada: "comando", evidencia: "segue lá", leitura: "genérico, não converte" },
      ],
    },
    esqueleto: {
      estrutura_narrativa: "A1. Loop Aberto",
      hook: { tipo: "contradicao", mecanismo: "número que desmente a crença", fator_de_curiosidade: "quanto eu pago de verdade?" },
      comando: { tipo: "seguir", posicao: "fim" },
    },
  },
};

const deps = (over: Partial<DepsDeVideo> = {}): DepsDeVideo => ({
  transcricao: async () => ({ text: "olha o extrato de março. o banco cobra 3% ao mês.", erro: null }),
  acervo: async () => null,
  autopsia: async () => AUTOPSIA,
  ...over,
});

describe("abertura por acervo (§7)", () => {
  it("a linha do ratio é a do spec, literal", () => {
    expect(linhaDeRatio(NO_ACERVO)).toBe("316k views com 1.556 seguidores — 203×");
  });

  it("vídeo no acervo: o bloco manda ABRIR pelo ratio, não pelas views", async () => {
    const r = await blocoDeVideo(URL_VIDEO, deps({ acervo: async () => NO_ACERVO }));

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.acervo).toEqual(NO_ACERVO);
    expect(r.bloco).toContain("316k views com 1.556 seguidores — 203×");
    expect(r.bloco).toContain("ABRA POR AQUI");
    // o aviso de "sem dado" é do outro caso — aqui há lastro, e ele não pode aparecer
    expect(r.bloco).not.toContain("SEM DADO");
  });

  it("conta minúscula não vira ratio infinito (mesmo piso do rank.ts)", () => {
    expect(ratioDoVideo(100_000, 400)).toBe(ratioDoVideo(100_000, 1000));
  });

  it("vídeo fora do acervo: o aviso de opinião sai NO BLOCO, com todas as letras", async () => {
    const r = await blocoDeVideo(URL_VIDEO, deps());

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.acervo).toBeNull();
    expect(r.bloco).toContain("SEM DADO DE DESEMPENHO");
    expect(r.bloco).toContain("os dados mostram"); // …proibido, e a proibição é dita ao modelo
    expect(r.bloco).toMatch(/DIGA ISSO NA RESPOSTA/);
    expect(r.bloco).not.toContain("×"); // nenhum ratio inventado
  });

  it("acervo indisponível cai no caminho sem dado, nunca derruba o debate", async () => {
    const r = await blocoDeVideo(
      URL_VIDEO,
      deps({
        acervo: async () => {
          throw new Error("supabase fora do ar");
        },
      })
    );

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.bloco).toContain("SEM DADO DE DESEMPENHO");
  });
});

describe("as três camadas que faltam (§7.1)", () => {
  it("pede só contrastes, linguagem e apelo emocional — o resto vem da autópsia", async () => {
    const r = await blocoDeVideo(URL_VIDEO, deps());
    if (!r.ok) throw new Error("bloco falhou");

    for (const camada of ["CONTRASTES", "LINGUAGEM", "APELO EMOCIONAL"]) expect(r.bloco).toContain(camada);
    // exatamente três itens na lista do que falta: a autópsia já julga tema, hook,
    // storytelling e comando, e duplicar o julgamento cria uma segunda definição de
    // "bom hook" no sistema.
    const faltam = r.bloco.split("AS TRÊS CAMADAS QUE FALTAM")[1] ?? "";
    expect(faltam.match(/^\d\. /gm)).toHaveLength(3);
  });

  it("reusa a leitura e a evidência literal da autópsia em vez de mandar reanalisar", async () => {
    const r = await blocoDeVideo(URL_VIDEO, deps());
    if (!r.ok) throw new Error("bloco falhou");

    expect(r.bloco).toContain("abre pela contradição numérica");
    expect(r.bloco).toContain("você paga 400% ao ano e acha que é 4%");
    expect(r.bloco).toContain("A1. Loop Aberto");
    expect(r.bloco).toContain("Gargalo apontado pela casa: comando");
  });

  it("autópsia falha: segue a conversa dizendo que está sem a análise estruturada (§11)", async () => {
    const r = await blocoDeVideo(
      URL_VIDEO,
      deps({
        autopsia: async () => {
          throw new Error("modelo não retornou análise estruturada");
        },
      })
    );

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.bloco).toContain("SEM ANÁLISE ESTRUTURADA");
    expect(r.bloco).toContain("AS TRÊS CAMADAS QUE FALTAM"); // a transcrição ainda dá conta destas
    expect(r.bloco).toContain("olha o extrato de março");
  });
});

describe("vídeo que não deu para ler (§11)", () => {
  it("falha dizendo qual vídeo e por quê, e não monta bloco nenhum", async () => {
    const r = await blocoDeVideo(
      URL_VIDEO,
      deps({ transcricao: async () => ({ text: "", erro: "Supadata respondeu 402" }) })
    );

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erro).toContain(URL_VIDEO);
    expect(r.erro).toContain("Supadata respondeu 402");
    expect(r.erro).toContain("cola a transcrição");
  });

  it("sem transcrição não paga autópsia e não opina — nem com ratio na mão", async () => {
    const autopsia = vi.fn(async () => AUTOPSIA);
    const r = await blocoDeVideo(
      URL_VIDEO,
      deps({ acervo: async () => NO_ACERVO, transcricao: async () => ({ text: "", erro: null }), autopsia })
    );

    expect(r.ok).toBe(false);
    expect(autopsia).not.toHaveBeenCalled();
    if (r.ok) return;
    expect(r.erro).toContain(URL_VIDEO);
    expect(r.erro).toContain("203×"); // o ratio é dado real: some da opinião, não da recusa
  });

  it("motivo desconhecido ainda diz o que fazer", async () => {
    const r = await blocoDeVideo(URL_VIDEO, deps({ transcricao: async () => ({ text: "", erro: null }) }));
    if (r.ok) throw new Error("deveria ter falhado");
    expect(r.erro).toContain(URL_VIDEO);
    expect(r.erro).toContain("cola a transcrição");
  });
});
