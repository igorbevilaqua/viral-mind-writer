// tests/camada-comum.test.ts
import { expect, test } from "vitest";
import { agentPrompt } from "@/lib/pipeline/agents";

test.each(["roteirista", "hook", "storytelling", "dados", "pesquisador", "revisao", "comando"])(
  "%s sabe que a SKILL DO ROTEIRO decide o que é do modo",
  (agente) => expect(agentPrompt(agente)).toContain("SKILL DO ROTEIRO")
);

test("a camada comum do roteirista tem a regra de precisão que resolve as contradições de impacto", () => {
  const p = agentPrompt("roteirista");
  expect(p).toContain("Impacto com lastro");
  expect(p).toContain("O material do usuário entra");
});

test("o tamanho e o orçamento de números deixaram de ser regra única", () => {
  const p = agentPrompt("roteirista");
  expect(p).toContain("o da seção roteiro da SKILL DO ROTEIRO");
  expect(p).not.toMatch(/Tamanho-alvo: o roteiro inteiro falado/);
});
