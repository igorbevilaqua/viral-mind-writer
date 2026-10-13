// Opus 5.5 / Sonnet 5.5 / Fable 5.1 dão 400 com tool_choice `tool`/`any`. O client adapta para
// `auto` + pedido no system; os outros modelos passam intactos.
import { expect, test, vi } from "vitest";

vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
});

import { adaptarToolChoice } from "@/lib/anthropic";

const base = {
  max_tokens: 100,
  messages: [{ role: "user" as const, content: "oi" }],
  tools: [{ name: "r", input_schema: { type: "object" as const } }],
  tool_choice: { type: "tool" as const, name: "r" },
};

test("opus-5-5 com tool forçada vira auto e o pedido entra no fim do system", () => {
  const p = adaptarToolChoice({ ...base, model: "claude-opus-5-5", system: "persona" });
  expect(p.tool_choice).toEqual({ type: "auto" });
  expect(p.system).toEqual([
    { type: "text", text: "persona" },
    { type: "text", text: "Responda chamando a ferramenta r. Não responda em texto." },
  ]);
});

test("modelo que aceita tool forçada passa intacto", () => {
  const p = { ...base, model: "claude-sonnet-5", system: "persona" };
  expect(adaptarToolChoice(p)).toBe(p);
});

test("auto já em auto não ganha pedido", () => {
  const p = { ...base, model: "claude-opus-5-5", tool_choice: { type: "auto" as const } };
  expect(adaptarToolChoice(p)).toBe(p);
});
