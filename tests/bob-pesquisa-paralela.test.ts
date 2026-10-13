// O modelo pediu duas pesquisas na mesma resposta e o Bob respondia só a primeira: a rodada
// seguinte dava 400 ("tool_use ids were found without tool_result blocks").
import { expect, test, vi } from "vitest";

const { criar } = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  return { criar: vi.fn() };
});

vi.mock("@/lib/anthropic", () => ({ anthropic: { messages: { create: criar } } }));
vi.mock("@/lib/pipeline/grok-search", () => ({
  grokPesquisa: vi.fn(async (q: string) => ({ texto: `dado de ${q}`, fontes: [`https://${q}.com`] })),
}));
vi.mock("@/lib/pipeline/context", () => ({ loadContext: vi.fn(async () => ({ modelo: "claude-opus-5-5" })) }));
vi.mock("@/lib/pipeline/draft", () => ({ buildStaticSystemBlock: () => "", buildDynamicSystemBlock: () => "" }));
vi.mock("@/lib/pipeline/agents", () => ({
  agentPrompt: () => "",
  hookMechanismBlock: () => "",
  hookPreferenceBlock: () => "",
}));

import { bobAssist } from "@/lib/pipeline/bob";

test("duas pesquisas na mesma resposta: cada tool_use ganha o seu tool_result", async () => {
  criar
    .mockResolvedValueOnce({
      content: [
        { type: "tool_use", id: "t1", name: "pesquisar_web", input: { query: "a" } },
        { type: "tool_use", id: "t2", name: "pesquisar_web", input: { query: "b" } },
      ],
    })
    .mockResolvedValueOnce({ content: [{ type: "text", text: "texto final" }] });

  const r = await bobAssist("s", {
    modo: "completar",
    roteiro: "x".repeat(200),
    antes: "x".repeat(200),
    depois: "",
    instrucao: "coloque os números",
  });

  const ultima = criar.mock.calls[1][0].messages.at(-1);
  expect(ultima.content.map((b: { tool_use_id: string }) => b.tool_use_id)).toEqual(["t1", "t2"]);
  expect(r.texto).toBe("texto final");
  expect(r.fonte).toBe("https://a.com\nhttps://b.com");
});

const pedido = { modo: "completar" as const, roteiro: "x".repeat(200), antes: "x".repeat(200), depois: "", instrucao: "dado" };
const umaPesquisa = { content: [{ type: "tool_use", id: "t1", name: "pesquisar_web", input: { query: "a" } }] };

test("fontes: só as que a pesquisa cita no texto, não toda página que o Grok abriu", async () => {
  const { grokPesquisa } = await import("@/lib/pipeline/grok-search");
  vi.mocked(grokPesquisa).mockResolvedValueOnce({
    texto: "São 9h por dia (https://citada.com).",
    fontes: ["https://citada.com", "https://so-aberta-1.com", "https://so-aberta-2.com"],
  });
  criar.mockResolvedValueOnce(umaPesquisa).mockResolvedValueOnce({ content: [{ type: "text", text: "ok" }] });
  expect((await bobAssist("s", pedido)).fonte).toBe("https://citada.com");
});

test("resposta sem texto vira erro na tela, não sugestão vazia", async () => {
  criar
    .mockResolvedValueOnce(umaPesquisa)
    .mockResolvedValueOnce({ stop_reason: "max_tokens", content: [{ type: "thinking", thinking: "" }] });
  await expect(bobAssist("s", pedido)).rejects.toThrow("max_tokens");
});
