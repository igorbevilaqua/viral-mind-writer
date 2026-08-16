import { beforeEach, describe, expect, test, vi } from "vitest";

// Schema do classificador + o que a gravação faz com a direção do vocabulário (pendência 10).
// A heurística de negação saiu: "prefira X, e nunca Y" gravava o OPOSTO do ensinado, em silêncio.

// actions.ts arrasta o pipeline no import e os SDKs são instanciados no topo dos módulos
// (anthropic.ts:3). Chave falsa antes dos imports basta: nenhum destes testes chama modelo.
const { banco, fakeAppDb, criarMensagem } = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  process.env.OPENAI_API_KEY ??= "test";
  process.env.XAI_API_KEY ??= "test";

  const banco = {
    prefs: {} as Record<string, string[]>,
    upsert: null as Record<string, unknown> | null,
  };
  const fakeAppDb = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: banco.prefs, error: null }) }) }),
      upsert: async (u: Record<string, unknown>) => {
        banco.upsert = u;
        return { error: null };
      },
    }),
  };
  return { banco, fakeAppDb, criarMensagem: vi.fn() };
});

vi.mock("@/lib/db", () => ({ appDb: fakeAppDb, viralData: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/hub", () => ({ registrarAtividade: vi.fn(), currentUserId: async () => null }));
// importOriginal: outros módulos do pipeline importam WRITER_MODEL/recordUsage do mesmo arquivo.
vi.mock("@/lib/anthropic", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  anthropic: { messages: { create: criarMensagem } },
}));

import {
  classificarEnsinamento,
  DIRECOES,
  ENSINAMENTO_TOOL,
  type Direcao,
} from "@/lib/pipeline/classify-teaching";
import { DESTINATARIOS } from "@/lib/pipeline/destinatarios";
import { gravarEnsinamento } from "@/lib/actions";

describe("schema do classificador", () => {
  test("enum de destinatarios espelha DESTINATARIOS", () => {
    expect(ENSINAMENTO_TOOL.input_schema.properties.destinatarios.items.enum)
      .toEqual([...DESTINATARIOS]);
  });
  test("casa tem exatamente as quatro casas", () => {
    expect(ENSINAMENTO_TOOL.input_schema.properties.casa.enum)
      .toEqual(["licao", "vocabulario", "frase_banida", "playbook"]);
  });
  test("direcao é enum fechado em evitar|preferir", () => {
    expect(ENSINAMENTO_TOOL.input_schema.properties.direcao.enum).toEqual(["evitar", "preferir"]);
    expect([...DIRECOES]).toEqual(["evitar", "preferir"]);
  });
});

// ── sanitização: saída de LLM é fronteira de confiança ───────────────────────

const resposta = (input: Record<string, unknown>) => ({
  content: [{ type: "tool_use", name: "registrar_ensinamento", input }],
});

const CRU = {
  regra: "prefira 'assinante', e nunca diga 'cliente'",
  casa: "vocabulario",
  destinatarios: ["roteirista"],
  dimensao: "geral",
};

describe("classificarEnsinamento — direcao/termo", () => {
  test("direção fora do enum é descartada (não vira gravação errada)", async () => {
    criarMensagem.mockResolvedValue(resposta({ ...CRU, direcao: "banir", termo: "assinante" }));
    const e = await classificarEnsinamento({ texto: "x" });
    expect(e.direcao).toBeUndefined();
    expect(e.termo).toBe("assinante");
  });

  test("direção válida passa", async () => {
    criarMensagem.mockResolvedValue(resposta({ ...CRU, direcao: "preferir", termo: "assinante" }));
    const e = await classificarEnsinamento({ texto: "x" });
    expect(e.direcao).toBe("preferir");
  });

  test("fora de vocabulario, direcao e termo são zerados (o modelo preenche por inércia)", async () => {
    criarMensagem.mockResolvedValue(
      resposta({ ...CRU, casa: "licao", direcao: "evitar", termo: "assinante" })
    );
    const e = await classificarEnsinamento({ texto: "x" });
    expect(e.direcao).toBeUndefined();
    expect(e.termo).toBeUndefined();
  });
});

// ── gravação: o caso que motivou a pendência 10 ──────────────────────────────

const BASE = {
  regra: "prefira 'assinante', e nunca diga 'cliente'",
  casa: "vocabulario" as const,
  destinatarios: ["roteirista" as const],
  dimensao: "geral",
  textoCru: "aqui a gente fala assinante, nunca cliente",
  escopo: "cliente" as const,
  sessionId: "sess-1",
  clientId: "cli-1",
};

beforeEach(() => {
  banco.prefs = {};
  banco.upsert = null;
});

describe("gravarEnsinamento — vocabulário", () => {
  test("'prefira X, e nunca Y' com direcao=preferir grava em vocabulario_usar", async () => {
    const r = await gravarEnsinamento({ ...BASE, direcao: "preferir", termo: "assinante" });

    expect(r.ok).toBe(true);
    // a heurística de negação mandava esta regra inteira para vocabulario_evitar
    expect(banco.upsert).toMatchObject({ vocabulario_usar: ["assinante"] });
    expect(banco.upsert).not.toHaveProperty("vocabulario_evitar");
  });

  test("direcao=evitar grava o termo, não a prosa da regra", async () => {
    const r = await gravarEnsinamento({ ...BASE, direcao: "evitar", termo: "cliente" });

    expect(r.ok).toBe(true);
    expect(banco.upsert).toMatchObject({ vocabulario_evitar: ["cliente"] });
  });

  test("sem direção não adivinha: recusa gravar", async () => {
    const r = await gravarEnsinamento({ ...BASE, termo: "assinante" });

    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/direção/i);
    expect(banco.upsert).toBeNull();
  });

  test("direção inválida vinda do cliente também recusa", async () => {
    const r = await gravarEnsinamento({
      ...BASE,
      direcao: "banir" as unknown as Direcao,
      termo: "assinante",
    });

    expect(r.ok).toBe(false);
    expect(banco.upsert).toBeNull();
  });

  test("termo ausente cai na regra (nada se perde) e não duplica o que já está lá", async () => {
    banco.prefs = { vocabulario_usar: [BASE.regra] };
    const r = await gravarEnsinamento({ ...BASE, direcao: "preferir" });

    expect(r.ok).toBe(true);
    expect(banco.upsert).toBeNull();
  });
});
