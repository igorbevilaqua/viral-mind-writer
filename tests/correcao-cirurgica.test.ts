import { beforeEach, describe, expect, it, vi } from "vitest";

// Peça 3, §7.1 + §11 + §12.3/§12.4: a correção cirúrgica da verificação.
// Zero LLM — quando a verificação já achou o dado certo, os dois lados são conhecidos.

// actions.ts arrasta o pipeline no import e os SDKs são instanciados no topo dos módulos
// (anthropic.ts:3). Chave falsa antes dos imports basta: nenhum destes testes chama modelo.
const { banco, fakeAppDb, registrarAtividade } = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  process.env.OPENAI_API_KEY ??= "test";
  process.env.XAI_API_KEY ??= "test";

  const banco = {
    roteiro: "",
    trace: {} as Record<string, unknown>,
    escrito: null as Record<string, unknown> | null,
    // null por padrão: com registro, `aplicarCorrecao` faz um SEGUNDO update (a marca) que
    // sobrescreveria `banco.escrito` e cegaria os testes do roteiro acima.
    verificacao: null as Record<string, unknown> | null,
  };
  const lido = async () => ({
    data: { roteiro: banco.roteiro, session_id: "sess-1", pipeline_trace: banco.trace, verificacao: banco.verificacao },
    error: null,
  });
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
import { aplicarCorrecaoLiteral, instrucaoReescritaFalso, podeReescrever } from "@/lib/learning-loop";

const ROTEIRO =
  "O mercado cresceu 45 bilhões em 2024. Ninguém esperava 45 bilhões. Foi o maior salto da década.";

beforeEach(() => {
  banco.roteiro = ROTEIRO;
  banco.trace = {};
  banco.escrito = null;
  banco.verificacao = null;
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

// ── `falso` → reescrita do Bob: §11 sobre o texto NOVO ───────────────────────
// O risco aceito é o Bob errar de novo. O que não pode acontecer é o item sair de trás
// parecendo resolvido/verificado quando ninguém checou o texto que entrou.

describe("reescrita do Bob (veredicto `falso`)", () => {
  const item = { veredicto: "falso", trecho_literal: "45 bilhões" };

  it("marca `reescrito`, NUNCA `aplicada`, e não toca o veredicto", async () => {
    banco.verificacao = { itens: [{ ...item, explicacao: "não houve esse crescimento" }] };
    const r = await aplicarCorrecao("script-1", "45 bilhões", "cresceu bem menos que se dizia", "reescrita");

    expect(r.aplicada).toBe(true);
    const itens = (banco.escrito?.verificacao as { itens: Record<string, unknown>[] }).itens;
    expect(itens[0].reescrito).toBe(true);
    // o §11 inteiro está nestas duas linhas: texto novo não vira "aplicada" nem "confirmado"
    expect(itens[0].aplicada).toBeUndefined();
    expect(itens[0].veredicto).toBe("falso");
  });

  it("o caminho do `impreciso` segue marcando `aplicada` (o default não mudou)", async () => {
    banco.verificacao = { itens: [{ veredicto: "impreciso", trecho_literal: "45 bilhões" }] };
    await aplicarCorrecao("script-1", "45 bilhões", "4,5 bilhões");
    const itens = (banco.escrito?.verificacao as { itens: Record<string, unknown>[] }).itens;
    expect(itens[0].aplicada).toBe(true);
    expect(itens[0].reescrito).toBeUndefined();
  });

  it("podeReescrever só abre para `falso` com o trecho literal no roteiro atual", () => {
    expect(podeReescrever(item, ROTEIRO)).toBe(true);
    // `impreciso` tem `correcao` pronta — não é caso de Bob
    expect(podeReescrever({ ...item, veredicto: "impreciso" }, ROTEIRO)).toBe(false);
    // paráfrase do verificador: não há o que substituir depois
    expect(podeReescrever({ ...item, trecho_literal: "o mercado teve alta de 45 bi" }, ROTEIRO)).toBe(false);
    // trecho vazio casaria em tudo
    expect(podeReescrever({ ...item, trecho_literal: "" }, ROTEIRO)).toBe(false);
  });

  it("a instrução leva a evidência ao Bob e proíbe repetir a afirmação falsa", () => {
    const instrucao = instrucaoReescritaFalso({
      explicacao: "não existe programa de 240 dólares para estudante brasileiro",
      fonte: { url: "https://blog.google/x", veiculo: "Google", ano: "2026" },
    });
    // sem estes três, o Bob reescreve no escuro e inventa de novo
    expect(instrucao).toContain("não existe programa de 240 dólares");
    expect(instrucao).toContain("https://blog.google/x");
    expect(instrucao).toMatch(/NUNCA repita a afirmação falsa/);
    // e o hedge tem que estar barrado por escrito, senão volta amaciado
    expect(instrucao).toMatch(/hedge|pode ser que/i);
  });

  it("sem fonte no item a instrução ainda sai válida (não vira 'undefined')", () => {
    const instrucao = instrucaoReescritaFalso({ explicacao: "", fonte: null });
    expect(instrucao).not.toContain("undefined");
    expect(instrucao).toMatch(/não se sustenta nas fontes/);
  });
});
