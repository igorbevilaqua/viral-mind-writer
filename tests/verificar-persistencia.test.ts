import { beforeEach, describe, expect, it, vi } from "vitest";

// Peça 3, §8 + §9 + §11: onde a verificação roda e o que ela grava.
// O registro vai para `vm_generated_scripts.verificacao` (um por roteiro, sobrescrito) — e
// SÓ quando houve verificação. Falha não pode virar "verificado, 0 problemas".

// actions.ts arrasta o pipeline no import e os SDKs são instanciados no topo dos módulos
// (anthropic.ts:3). Chave falsa antes dos imports basta: nenhum destes testes chama modelo.
const { banco, fakeAppDb, verificarRoteiro } = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  process.env.OPENAI_API_KEY ??= "test";
  process.env.XAI_API_KEY ??= "test";

  const banco = {
    dossie: "DOSSIÊ: a Vale lucrou 45 bilhões em 2024.",
    escrito: null as Record<string, unknown> | null,
    erroUpdate: null as { message: string } | null,
  };
  const fakeAppDb = {
    from: (tabela: string) => ({
      select: () => ({
        eq: () => ({
          single: async () =>
            tabela === "vm_generated_scripts"
              ? { data: { hook: "h", roteiro: "r", comando: "c", session_id: "sess-1" }, error: null }
              : { data: { artifacts: { dossie: banco.dossie } }, error: null },
        }),
      }),
      update: (u: Record<string, unknown>) => {
        if (!banco.erroUpdate) banco.escrito = u;
        return { eq: async () => ({ error: banco.erroUpdate }) };
      },
    }),
  };
  return { banco, fakeAppDb, verificarRoteiro: vi.fn() };
});

vi.mock("@/lib/db", () => ({ appDb: fakeAppDb, viralData: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/hub", () => ({ registrarAtividade: vi.fn(), currentUserId: async () => null }));
vi.mock("@/lib/pipeline/verificar", () => ({ verificarRoteiro }));

import { verificarScript } from "@/lib/actions";

const SCRIPT = "11111111-2222-3333-4444-555555555555";

const REGISTRO = {
  at: "2026-08-16T12:00:00.000Z",
  regime: "delta" as const,
  dossie_presente: true,
  total_alegacoes: 3,
  rastreadas: 2,
  verificadas: 1,
  excedentes: 0,
  itens: [
    {
      alegacao: "A Vale lucrou 45 bilhões em 2024",
      trecho_literal: "45 bilhões",
      veredicto: "impreciso" as const,
      fonte: { url: "https://exemplo.com/a", veiculo: "Valor", ano: "2024" },
      correcao: "39 bilhões",
      explicacao: "a fonte diz 39",
    },
  ],
};

beforeEach(() => {
  banco.escrito = null;
  banco.erroUpdate = null;
  verificarRoteiro.mockReset();
  verificarRoteiro.mockResolvedValue(REGISTRO);
});

describe("verificarScript (§9: uma coluna, sobrescrita)", () => {
  it("grava o registro em vm_generated_scripts.verificacao e devolve ok", async () => {
    const r = await verificarScript(SCRIPT, "delta");

    expect(r).toEqual({ ok: true, registro: REGISTRO });
    expect(banco.escrito).toEqual({ verificacao: REGISTRO });
  });

  it("passa o roteiro salvo, o dossiê da sessão e o regime pedido", async () => {
    await verificarScript(SCRIPT, "completa");

    expect(verificarRoteiro).toHaveBeenCalledWith(
      expect.objectContaining({
        roteiro: { hook: "h", roteiro: "r", comando: "c" },
        dossie: banco.dossie,
        regime: "completa",
      })
    );
  });
});

describe("§11: nunca dizer 'verificado' sobre o que não verificou", () => {
  it("extração que falha não grava nada e devolve o erro, sem lançar", async () => {
    verificarRoteiro.mockRejectedValue(new Error("verificador: extração de alegações sem saída estruturada"));

    const r = await verificarScript(SCRIPT, "delta");

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.erro).toMatch(/extração/);
    // a coluna fica como estava: a tela dirá "não verificado", nunca "verificado, 0 problemas"
    expect(banco.escrito).toBeNull();
  });

  it("update que falha (coluna 0029 ainda não aplicada) devolve erro, não sucesso", async () => {
    banco.erroUpdate = { message: "column vm_generated_scripts.verificacao does not exist" };

    const r = await verificarScript(SCRIPT, "delta");

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.erro).toMatch(/não gravada/);
  });
});
