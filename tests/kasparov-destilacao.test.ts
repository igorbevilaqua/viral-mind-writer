import { readFileSync } from "node:fs";
import { describe, expect, test, vi, beforeEach } from "vitest";

// 018 §5 — a destilação é onde a peça 4 pode envenenar a peça 1. Três invariantes:
//   §12.2 nenhuma porta nova de gravação;
//   §12.3 origem preservada (nunca `/sessions/undefined`);
//   §12.4 desfecho vazio é válido — e é o COMUM.

const { rpc, tabela, streamFake, texto } = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  process.env.OPENAI_API_KEY ??= "test";
  process.env.XAI_API_KEY ??= "test";
  const texto = { atual: "" };
  const rpc = vi.fn<(fn: string, args: Record<string, string>) => Promise<{ data: string; error: null }>>(
    async () => ({ data: "learning-1", error: null })
  );
  const tabela = vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
    insert: async () => ({ error: null }),
    upsert: async () => ({ error: null }),
  }));
  // A destilação passa pelo mesmo `trackedStream` do turno — o helper que só aceita UMA
  // fala. Trocar o helper (e não o SDK) é o que mantém o teste sem rede.
  const streamFake = vi.fn<(log: unknown, fase: string, p: { system: string; turno: string }) => Promise<string>>(
    async () => texto.atual
  );
  return { rpc, tabela, streamFake, texto };
});

vi.mock("@/lib/db", () => ({ appDb: { rpc, from: tabela }, viralData: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// adm passa por tudo (lib/autorizacao.ts): estes testes cobrem a lógica da action, não a autorização.
vi.mock("@/lib/hub", () => ({ registrarAtividade: vi.fn(), currentUserId: async () => null, writerScope: async () => ({ isAdmin: true, userId: "adm-1" }) }));
vi.mock("@/lib/anthropic", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  trackedStream: streamFake,
}));

import { gravarEnsinamento, type EnsinamentoConfirmado } from "@/lib/actions";
import { origemDoDebate, proporDestilacao, separarProposta } from "@/lib/pipeline/kasparov";
import type { GenerationContext } from "@/lib/pipeline/types";

const ctx = () =>
  ({ clientPrefs: null, modoModelagem: false, playbooks: {}, playbookVersions: [], insights: [] }) as unknown as GenerationContext;

const debate = (resposta: string) => {
  texto.atual = resposta;
  return proporDestilacao({ ctx: ctx(), estado: { assunto: "o hook do roteiro aberto" }, mensagem: "é, faz sentido", resposta: "acho que sim" });
};

const LICAO: EnsinamentoConfirmado = {
  regra: "abra pela consequência e segure o porquê",
  casa: "licao",
  destinatarios: ["hook"],
  dimensao: "hook",
  textoCru: "abre pela consequência, segura o porquê",
  escopo: "global",
  sessionId: "",
  clientId: null,
};

beforeEach(() => {
  rpc.mockClear();
  tabela.mockClear();
  streamFake.mockClear();
});

// ── §12.2 ────────────────────────────────────────────────────────────────────

describe("nenhuma porta nova de gravação (018 §12.2)", () => {
  const src = readFileSync("lib/pipeline/kasparov.ts", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  test("o módulo do Kasparov não toca em nenhuma das quatro casas", () => {
    for (const casa of ["vm_lessons", "vm_lesson_learnings", "vm_banned_phrases", "vm_client_preferences"])
      expect(src, `o Kasparov abriu uma porta nova em ${casa}`).not.toContain(casa);
    expect(src).not.toContain("appDb");
  });

  test("o módulo não grava: a única porta é gravarEnsinamento, depois da confirmação", () => {
    expect(src).not.toContain("gravarEnsinamento");
    // context_note guarda o texto CRU. Se o módulo soubesse escrever nele, a síntese do
    // Kasparov chegaria lá sem passar pelo usuário — o defeito do §5.1.
    expect(src).not.toContain("textoCru");
    expect(src).not.toContain("context_note");
  });
});

// ── §5.1: a síntese é proposta, não fala do usuário ──────────────────────────

describe("a síntese vai à tela como PROPOSTA (018 §5.1)", () => {
  test("a proposta carrega as palavras do Kasparov e a origem, e não tem campo de texto cru", async () => {
    const p = await debate("REGRA: hook que entrega a conclusão antes da tensão perde quem já concorda");
    expect(p).not.toBeNull();
    expect(p?.sintese).toBe("hook que entrega a conclusão antes da tensão perde quem já concorda");
    expect(p?.origem).toBe("kasparov");
    // O campo que vira context_note chama-se `textoCru` e só existe depois da confirmação:
    // sem ele na proposta não há espalhamento (`{...proposta}`) que grave a síntese direto.
    expect(Object.keys(p ?? {})).not.toContain("textoCru");
    expect(rpc).not.toHaveBeenCalled();
  });

  test("a destilação recebe o último par e o estado do sistema — nunca a conversa (§4)", async () => {
    await debate("NADA NOVO");
    const params = streamFake.mock.calls[0][2];
    expect(params.turno).toBe("VOCÊ ACABOU DE RESPONDER:\nacho que sim\n\nO USUÁRIO RESPONDEU:\né, faz sentido");
    expect(params.system).toContain("# ESTADO DO SISTEMA");
  });

  test("a síntese é uma linha só — não é depósito da conversa", async () => {
    const p = await debate("REGRA: linha 1\nlinha 2\nlinha 3");
    expect(p?.sintese).toBe("linha 1");
  });
});

// ── §12.4 ────────────────────────────────────────────────────────────────────

describe("desfecho vazio é válido, e é o comum (018 §3, §12.4)", () => {
  test("debate sem acordo não produz proposta nem gravação", async () => {
    expect(await debate("NADA NOVO")).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
    expect(tabela).not.toHaveBeenCalled();
  });

  test("resposta sem marcador não vira lição por acidente", () => {
    expect(separarProposta("Concordamos, mas isso já está no playbook.")).toBeNull();
    expect(separarProposta("")).toBeNull();
    expect(separarProposta("REGRA:")).toBeNull();
    expect(separarProposta("REGRA:   ")).toBeNull();
  });

  test("o marcador é aceito com folga de espaço e caixa", () => {
    expect(separarProposta("  regra: abra pela consequência  ")).toBe("abra pela consequência");
  });
});

// ── §12.3 ────────────────────────────────────────────────────────────────────

describe("origem preservada (018 §5.3, §12.3)", () => {
  const urlGravada = () => rpc.mock.calls[0][1].p_session_url;

  test("debate fora de sessão grava a origem do debate, nunca /sessions/", async () => {
    const r = await gravarEnsinamento({ ...LICAO, sourceUrl: origemDoDebate("thread-7") });
    expect(r.ok).toBe(true);
    expect(urlGravada()).toBe("/kasparov/thread-7");
    expect(urlGravada()).not.toMatch(/\/sessions\/(undefined|null)?$/);
  });

  test("debate sobre um vídeo pode gravar a URL do vídeo", async () => {
    await gravarEnsinamento({ ...LICAO, sourceUrl: "https://www.youtube.com/watch?v=abc" });
    expect(urlGravada()).toBe("https://www.youtube.com/watch?v=abc");
  });

  test("sem sessão e sem origem, nada é gravado — procedência falsa é pior que erro", async () => {
    const r = await gravarEnsinamento(LICAO);
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/proced|origem|sess/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  test("a peça 1 não muda: ensino de sessão continua gravando /sessions/<id>", async () => {
    await gravarEnsinamento({ ...LICAO, sessionId: "sess-1" });
    expect(urlGravada()).toBe("/sessions/sess-1");
  });

  test("origemDoDebate sem thread não inventa rota", () => {
    expect(origemDoDebate("")).toBe("");
    expect(origemDoDebate("  ")).toBe("");
  });
});
