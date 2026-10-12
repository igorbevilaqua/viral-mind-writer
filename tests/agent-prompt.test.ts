import { expect, test, vi } from "vitest";
import { agentPrompt } from "../lib/pipeline/agents";

test("depois da primeira leitura, os prompts sobrevivem à pasta sumir (deploy no meio da geração)", () => {
  expect(agentPrompt("hook")).toContain("Agente de Hooks");
  vi.spyOn(process, "cwd").mockReturnValue("/pasta/que/o/deploy/apagou");
  expect(agentPrompt("roteirista").length).toBeGreaterThan(100);
  vi.restoreAllMocks();
});
