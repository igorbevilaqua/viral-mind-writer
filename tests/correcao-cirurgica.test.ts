import { beforeEach, describe, expect, it, vi } from "vitest";

// Peça 3, §7.1 + §11 + §12.3/§12.4: a correção cirúrgica da verificação.
// Zero LLM — quando a verificação já achou o dado certo, os dois lados são conhecidos.

// actions.ts arrasta o pipeline no import e os SDKs são instanciados no topo dos módulos
// (anthropic.ts:3). Chave falsa antes dos imports basta: nenhum destes testes chama modelo.
const { banco, fakeAppDb, registrarAtividade } = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  process.env.OPENAI_API_KEY ??= "test";
  process.env.XAI_API_KEY ??= "test";

  const banco = { roteiro: "", trace: {} as Record<string, unknown>, escrito: null as Record<string, unknown> | null };
  const lido = async () => ({ data: { roteiro: banco.roteiro, session_id: "sess-1", pipeline_trace: banco.trace }, error: null });
  const fakeAppDb = {
    from: () => ({
      select: () => ({ eq: () => ({ single: lido }) }),
      update: (u: Record<string, unknown>) => {
        banco.escrito = u;
        return { eq: () => ({ select: () => ({ single: async () => ({ data: { session_id: "sess-1" }, error: null }) }) }) };
      },
    }),
    rpc: async () => ({ error: null }),
  };
  return { banco, fakeAppDb, registrarAtividade: vi.fn() };
});

vi.mock("@/lib/db", () => ({ appDb: fakeAppDb, viralData: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// adm passa por tudo (lib/autorizacao.ts): estes testes cobrem a lógica da action, não a autorização.
vi.mock("@/lib/hub", () => ({ registrarAtividade, currentUserId: async () => null, writerScope: async () => ({ isAdmin: true, userId: "adm-1" }) }));

import { aplicarCorrecao } from "@/lib/actions";
import { aplicarCorrecaoLiteral } from "@/lib/learning-loop";

const ROTEIRO =
  "O mercado cresceu 45 bilhões em 2024. Ninguém esperava 45 bilhões. Foi o maior salto da década.";

beforeEach(() => {
  banco.roteiro = ROTEIRO;
  banco.trace = {};
  banco.escrito = null;
  registrarAtividade.mockClear();
});

// ── §12.3: a substituição ────────────────────────────────────────────────────

describe("aplicarCorrecaoLiteral", () => {
  it("troca TODAS as ocorrências do trecho (substituição global é benigna aqui)", () => {
    const out = aplicarCorrecaoLiteral(ROTEIRO, "45 bilhões", "4,5 bilhões");
    expect(out).toContain("cresceu 4,5 bilhões em 2024");
    expect(out).toContain("esperava 4,5 bilhões");
    expect(out).not.toContain("45 bilhões");
  });

  it("trecho ausente: devolve null e NÃO lança", () => {
    expect(() => aplicarCorrecaoLiteral(ROTEIRO, "50 bilhões", "4,5 bilhões")).not.toThrow();
    expect(aplicarCorrecaoLiteral(ROTEIRO, "50 bilhões", "4,5 bilhões")).toBeNull();
  });

  it("paráfrase do modelo não casa — é o descasamento do §11", () => {
    expect(aplicarCorrecaoLiteral(ROTEIRO, "o mercado teve alta de 45 bi", "4,5 bilhões")).toBeNull();
  });

  it("trecho vazio devolve null (split('') estilhaçaria o roteiro em caracteres)", () => {
    expect(aplicarCorrecaoLiteral(ROTEIRO, "", "x")).toBeNull();
  });

  it("o texto em volta do trecho fica intacto", () => {
    const out = aplicarCorrecaoLiteral(ROTEIRO, "45 bilhões", "4,5 bilhões")!;
    expect(out).toContain("O mercado cresceu ");
    expect(out).toContain(" em 2024. Ninguém esperava ");
    expect(out).toContain(". Foi o maior salto da década.");
    expect(out.length).toBe(ROTEIRO.length + 2); // só os dois caracteres da vírgula decimal
  });
});

// ── §12.4: o teste mais importante da peça ───────────────────────────────────

describe("aplicarCorrecao (server action)", () => {
  it("escreve o roteiro corrigido", async () => {
    const r = await aplicarCorrecao("script-1", "45 bilhões", "4,5 bilhões");
    expect(r.aplicada).toBe(true);
    expect(banco.escrito?.roteiro).toContain("cresceu 4,5 bilhões");
    expect(banco.escrito?.roteiro).not.toContain("45 bilhões");
  });

  it("NÃO marca edicao_humana — a lição envenenada do §7.2 morre aqui", async () => {
    await aplicarCorrecao("script-1", "45 bilhões", "4,5 bilhões");
    const trace = banco.escrito?.pipeline_trace as Record<string, unknown>;
    expect(trace.correcao_factual).toBe(true);
    expect(trace.edicao_humana).toBeUndefined();
    expect(trace.roteiro_original).toBe(ROTEIRO); // revertível, mesmo sem ser edição humana
  });

  it("trecho ausente: não escreve, não lança, e REGISTRA o descasamento", async () => {
    const r = await aplicarCorrecao("script-1", "50 bilhões", "4,5 bilhões");
    expect(r.aplicada).toBe(false);
    expect(r.motivo).toBeTruthy();
    expect(banco.escrito).toBeNull();
    expect(registrarAtividade).toHaveBeenCalled();
  });

  // ── §11: o roteiro mudou entre a verificação e o clique ────────────────────

  it("relê antes de aplicar: a edição feita no meio sobrevive", async () => {
    banco.roteiro = "O usuário reescreveu a abertura. O mercado cresceu 45 bilhões em 2024.";
    await aplicarCorrecao("script-1", "45 bilhões", "4,5 bilhões");
    expect(banco.escrito?.roteiro).toContain("O usuário reescreveu a abertura.");
    expect(banco.escrito?.roteiro).toContain("cresceu 4,5 bilhões");
  });

  it("o trecho sumiu na edição do meio: aborta com aviso em vez de escrever o texto velho", async () => {
    banco.roteiro = "O usuário já corrigiu na mão: o mercado cresceu 4,5 bilhões em 2024.";
    const r = await aplicarCorrecao("script-1", "45 bilhões", "4,5 bilhões");
    expect(r.aplicada).toBe(false);
    expect(banco.escrito).toBeNull();
  });
});
