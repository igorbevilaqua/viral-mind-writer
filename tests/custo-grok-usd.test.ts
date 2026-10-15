import { describe, expect, it } from "vitest";
import { recordUsage, type UsageLog } from "../lib/anthropic";

// A xAI devolve o custo exato em ticks (1 US$ = 1e10). É o único número que inclui as buscas
// na web, então ele precisa somar por fase e não pode aparecer nas fases que não o têm.
describe("recordUsage com custo da xAI", () => {
  it("converte ticks em US$ e soma as chamadas da mesma fase", () => {
    const log: UsageLog = {};
    recordUsage(log, "busca", "grok-4.3", 10, { input_tokens: 100, output_tokens: 5, cost_in_usd_ticks: 250_000_000 });
    recordUsage(log, "busca", "grok-4.3", 10, { input_tokens: 100, output_tokens: 5, cost_in_usd_ticks: 150_000_000 });
    expect(log.busca.usd).toBeCloseTo(0.04);
    expect(log.busca.chamadas).toBe(2);
    expect(log.busca.input_tokens).toBe(200);
  });

  it("fase sem custo (Anthropic) não ganha o campo usd", () => {
    const log: UsageLog = {};
    recordUsage(log, "roteiro", "claude-opus-5-5", 10, { input_tokens: 100, output_tokens: 5 });
    expect(log.roteiro).not.toHaveProperty("usd");
  });
});
