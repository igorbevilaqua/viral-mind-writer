import { describe, expect, test, vi } from "vitest";

const chamadas = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  return [] as { fase: string; system: string; user: string }[];
});
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {}, crmDb: null }));
vi.mock("@/lib/llm-config", () => ({ modeloDe: async () => "claude-sonnet-5" }));
vi.mock("@/lib/anthropic", async (orig) => ({
  ...(await orig<object>()),
  trackedCreate: async (_log: unknown, fase: string, p: { system: unknown; messages: { content: string }[] }) => {
    const system = Array.isArray(p.system) ? p.system.map((b: { text: string }) => b.text).join("\n") : String(p.system);
    chamadas.push({ fase, system, user: p.messages[0].content });
    if (fase === "comando") return { content: [{ type: "text", text: "Segue o perfil." }] };
    return { content: [] }; // sem tool_use: as funções lançam depois de chamar, e o que importa é o que foi enviado
  },
}));

import { montarEntradaPesquisa, proposeNarratives, rankNarratives, designHook, writeComando } from "@/lib/pipeline/agents";
import { buildDynamicSystemBlock, buildReviewDynamicBlock, tamanhoDoRoteiro } from "@/lib/pipeline/draft";
import { secaoDaSkill } from "@/lib/pipeline/skills";
import type { GenerationContext } from "@/lib/pipeline/types";

const ctx = (skill: GenerationContext["skill"]) =>
  ({
    skill, prompt: "tema", premissa: "uma tese qualquer que se sustenta", attachments: [], insights: [], playbooks: {}, bannedPhrases: [],
    fewShot: [], modelagemBriefs: [], modelagemHooks: [], artifacts: { dossie: "d", candidatas: [{ titulo: "t", estrutura: "A2. Herói Improvável", personagem: "p", conflito: "c", mecanismo_emocional: "m", beats: ["b"], gancho_potencial: "g" }], ranking: [], escolhida: 0, orientacao_roteiro: "", orientacao_hook: "" },
    clientPrefs: null, estrategia: "", usageLog: {}, modelo: "claude-opus-5-5", playbookVersions: [],
  }) as unknown as GenerationContext;

const trecho = (s: Parameters<typeof secaoDaSkill>[0], secao: Parameters<typeof secaoDaSkill>[1]) => secaoDaSkill(s, secao).slice(0, 50);

// O que cada fase envia, nas quatro chamadas que só se veem pelo mock.
async function enviadoPor(c: GenerationContext) {
  chamadas.length = 0;
  await proposeNarratives(c, "dossie").catch(() => {});
  await rankNarratives(c, "dossie", c.artifacts!.candidatas).catch(() => {});
  await designHook(c, null, []).catch(() => {});
  await writeComando(c, "corpo");
  return (fase: string) => chamadas.find((x) => x.fase === fase)!;
}

describe("cada agente recebe a sua seção da skill, e só com skill na sessão", () => {
  test("pesquisa", () => {
    expect(montarEntradaPesquisa(ctx("panorama"))).toContain(trecho("panorama", "pesquisa"));
    expect(montarEntradaPesquisa(ctx(null))).not.toContain("SKILL DO ROTEIRO");
  });

  test("roteiro e revisão", () => {
    expect(buildDynamicSystemBlock(ctx("historia"))).toContain(trecho("historia", "roteiro"));
    expect(buildReviewDynamicBlock(ctx("historia"))).toContain(trecho("historia", "revisao"));
    expect(buildDynamicSystemBlock(ctx(null))).not.toContain("SKILL DO ROTEIRO");
  });

  test("tamanho vem da skill; sem skill, a faixa de antes", () => {
    expect(tamanhoDoRoteiro(ctx("demonstracao"))).toContain("SKILL DO ROTEIRO");
    expect(tamanhoDoRoteiro(ctx(null))).toContain("420 e 500");
  });

  test("narrativas, ranking, hook e comando", async () => {
    const de = await enviadoPor(ctx("mecanismo"));
    expect(de("narrativas").system).toContain(trecho("mecanismo", "narrativas"));
    expect(de("ranking").system).toContain(trecho("mecanismo", "dados"));
    expect(de("hook").system).toContain(trecho("mecanismo", "hook"));
    expect(de("comando").system).toContain(trecho("mecanismo", "comando"));
  });

  // Produção roda com skill null até a Task 3: nenhuma fase pode receber o bloco. O cabeçalho
  // com dois pontos é o do skillBlock: os prompts da camada comum citam "SKILL DO ROTEIRO" sem ele.
  test("sem skill, nenhuma fase recebe bloco de skill", async () => {
    const de = await enviadoPor(ctx(null));
    for (const fase of ["narrativas", "ranking", "hook", "comando"]) {
      expect(de(fase).system + de(fase).user).not.toContain("# SKILL DO ROTEIRO:");
    }
    expect(buildReviewDynamicBlock(ctx(null))).not.toContain("# SKILL DO ROTEIRO:");
  });
});
