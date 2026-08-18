import { beforeEach, describe, expect, it, vi } from "vitest";

// 018 §7.2 / decisão 18: a autópsia foi destravada do par Attachment + GenerationContext e
// passou a ter chave de cache por URL. O que estes testes travam é a CONVIVÊNCIA das duas
// chaves — porque nenhuma cobre o caso da outra:
//   • as autópsias já pagas só têm `attachment_id` gravado (e 3 das 13 nem têm URL: são
//     roteiros de referência colados, anexo sem url);
//   • o vídeo debatido com o Kasparov não nasce de sessão, logo não tem `attachment_id`.
// Um lookup que só olhasse URL invalidaria o que já foi pago; um que só olhasse anexo não
// serviria ao Kasparov.
//
// Sem rede e sem modelo: `trackedCreate` e `fetchTranscript` explodem de propósito — cache
// hit não pode pagar nem transcrição nem LLM, e o teste falha alto se pagar.
const { banco, fakeAppDb } = vi.hoisted(() => {
  // os SDKs são instanciados no topo dos módulos (anthropic.ts:3); chave falsa basta.
  process.env.ANTHROPIC_API_KEY ??= "test";

  const banco = {
    linha: null as Record<string, unknown> | null,
    filtro: "" as string,
    inserido: null as Record<string, unknown> | null,
  };
  const fakeAppDb = {
    from: () => ({
      select: () => ({
        or: (filtro: string) => {
          banco.filtro = filtro;
          return {
            order: () => ({
              limit: () => ({ maybeSingle: async () => ({ data: banco.linha, error: null }) }),
            }),
          };
        },
      }),
      insert: async (linha: Record<string, unknown>) => {
        banco.inserido = linha;
        return { error: null };
      },
    }),
  };
  return { banco, fakeAppDb };
});

vi.mock("@/lib/db", () => ({ appDb: fakeAppDb, viralData: {} }));
vi.mock("@/lib/transcribe", () => ({
  fetchTranscript: () => {
    throw new Error("transcrição paga num caminho que já tinha cache");
  },
}));
// importOriginal: o módulo importa ANALYST_MODEL do mesmo arquivo.
vi.mock("@/lib/anthropic", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  trackedCreate: () => {
    throw new Error("MODELO CHAMADO");
  },
}));

import { analyzeModelagem, autopsiaDeUrl, chavesDoAnexo, filtroDeAutopsia } from "@/lib/pipeline/modelagem";
import type { Attachment, GenerationContext } from "@/lib/pipeline/types";

// Formato real de uma linha já gravada (select em vm_modelagem_analyses, 2026-08-16):
// analysis é um objeto jsonb com `esqueleto`, e o brief é texto. A `compreensao` está aqui
// porque uma autópsia paga SEM tema digitado sempre a tem — e é ela que a geração sem tema usa
// como premissa (ver o teste da tese abaixo).
const ANALISE_PAGA = {
  replication_brief: "BRIEF JÁ PAGO",
  analysis: {
    esqueleto: { estrutura_narrativa: "A1. Jornada do Herói" },
    compreensao: { argumento_central: "a tese que o vídeo defende" },
  },
};

const ANEXO: Attachment = {
  id: "3d4ca1dc-11f4-4752-94f4-29c1c0781575",
  kind: "video_link",
  is_modelagem: true,
  url: "https://www.instagram.com/reel/DWICMEWiR1O/",
  raw_content: "transcrição colada, nenhuma rede necessária",
};

const CTX = {
  prompt: "",
  playbooks: {},
  insights: [],
  fewShot: [],
  clientPrefs: null,
  artifacts: null,
  attachments: [],
} as unknown as GenerationContext;

beforeEach(() => {
  banco.linha = null;
  banco.filtro = "";
  banco.inserido = null;
});

describe("as autópsias já pagas continuam válidas", () => {
  it("registro legado (só attachment_id, sem video_url) resolve pelo anexo", async () => {
    banco.linha = { ...ANALISE_PAGA, attachment_id: ANEXO.id, video_url: null };

    const r = await analyzeModelagem(ANEXO, CTX);

    expect(r.brief).toBe("BRIEF JÁ PAGO");
    expect(banco.filtro).toContain(`attachment_id.eq.${ANEXO.id}`);
    expect(banco.inserido).toBeNull(); // não regravou nada
  });

  it("anexo SEM url (roteiro de referência colado) consulta só a chave velha", () => {
    const colado: Attachment = { ...ANEXO, kind: "reference_script", url: null };
    const { url, attachmentId } = chavesDoAnexo(colado);
    // sem cláusula de video_url: esse caso nunca teve URL e continua resolvendo igual
    expect(filtroDeAutopsia(url, attachmentId)).toBe(`attachment_id.eq.${colado.id}`);
  });

  it("o envelope de sessão produz a mesma chave de antes para o mesmo anexo", () => {
    const { url, attachmentId } = chavesDoAnexo(ANEXO);
    expect(attachmentId).toBe(ANEXO.id);
    expect(filtroDeAutopsia(url, attachmentId)).toContain(`attachment_id.eq.${ANEXO.id}`);
  });

  it("análise em formato antigo (sem esqueleto) não é servida como cache", async () => {
    banco.linha = { replication_brief: "brief velho", analysis: { compreensao: {} }, attachment_id: ANEXO.id };

    await expect(analyzeModelagem(ANEXO, CTX)).rejects.toThrow("MODELO CHAMADO");
  });

  // Cache do MESMO vídeo, exigência diferente por chamador (0034): sem tema digitado a premissa
  // sai de `compreensao.argumento_central`, e servir ali uma autópsia paga COM tema — que apaga
  // `compreensao` de propósito — deixaria a sessão sem tese e sem alegações para checar.
  it("sem tema, análise sem a tese não é servida como cache (mas serve ao debate avulso)", async () => {
    banco.linha = {
      replication_brief: "BRIEF SEM TESE",
      analysis: { esqueleto: { estrutura_narrativa: "A1. Jornada do Herói" } },
      attachment_id: ANEXO.id,
    };

    await expect(analyzeModelagem(ANEXO, CTX)).rejects.toThrow("MODELO CHAMADO");
    // o Kasparov só quer o esqueleto: para ele a mesma linha continua valendo
    expect((await autopsiaDeUrl(ANEXO.url!)).brief).toBe("BRIEF SEM TESE");
  });
});

describe("chave por URL, para o vídeo sem anexo", () => {
  it("resolve o cache sem attachment_id, sem transcrever e sem chamar o modelo", async () => {
    banco.linha = { ...ANALISE_PAGA, attachment_id: null, video_url: ANEXO.url };

    const r = await autopsiaDeUrl(ANEXO.url!);

    expect(r.brief).toBe("BRIEF JÁ PAGO");
    expect(banco.filtro).not.toContain("attachment_id");
    expect(banco.filtro).toContain("DWICMEWiR1O");
  });

  it("casa o mesmo vídeo colado noutra forma de URL (id de plataforma, como o lookupCorpus)", () => {
    const comLixo = "https://instagram.com/reels/DWICMEWiR1O/?igsh=abc&utm_source=x";
    expect(filtroDeAutopsia(comLixo)).toBe(filtroDeAutopsia(ANEXO.url));
  });

  it("URL sem id de plataforma (link curto) ainda vira chave, por igualdade", () => {
    const curto = "https://vt.tiktok.com/ZS4Wf8VRn/";
    expect(filtroDeAutopsia(curto)).toBe(`video_url.eq."${curto}"`);
  });

  it("sem URL e sem anexo não há chave — não consulta cache", () => {
    expect(filtroDeAutopsia(null, null)).toBeNull();
  });

  it("grava as DUAS chaves quando a autópsia nasce de um anexo", async () => {
    // cache vazio + modelo estourando: o que importa aqui é só o filtro consultado
    const { url, attachmentId } = chavesDoAnexo(ANEXO);
    expect(filtroDeAutopsia(url, attachmentId)).toBe(
      `attachment_id.eq.${ANEXO.id},video_url.ilike.%DWICMEWiR1O%`
    );
  });
});
