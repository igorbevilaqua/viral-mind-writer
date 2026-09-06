import { describe, expect, it, vi } from "vitest";

// Plano 020, WP-I: `proporLicoes` é o único caminho pelo qual máquina (curador mensal,
// scripts/propose-lessons-from-study.ts) grava lição. O que este teste trava é a regra da
// 2.0: nasce `active:false` (cai na fila do Kasparov) e com `destinatarios` derivados da
// dimensão — array vazio não chega a agente nenhum (lição da 0027).
const { banco, fakeAppDb } = vi.hoisted(() => {
  // os SDKs são instanciados no topo dos módulos (anthropic.ts:3); chave falsa basta.
  process.env.ANTHROPIC_API_KEY ??= "test";
  const banco = { lessons: [] as Record<string, unknown>[], learnings: [] as Record<string, unknown>[] };
  const fakeAppDb = {
    from: (tabela: string) => ({
      insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => {
        if (tabela === "vm_lessons") {
          banco.lessons.push(rows as Record<string, unknown>);
          return { select: () => ({ single: async () => ({ data: { id: "lesson-1" }, error: null }) }) };
        }
        banco.learnings.push(...(rows as Record<string, unknown>[]));
        return Promise.resolve({ error: null });
      },
    }),
  };
  return { banco, fakeAppDb };
});

vi.mock("@/lib/db", () => ({ appDb: fakeAppDb, viralData: {} }));

import { proporLicoes } from "@/lib/curator";

describe("proporLicoes", () => {
  it("grava vm_lessons(curador) e learnings active:false com destinatarios", async () => {
    const r = await proporLicoes({
      clientId: "cli-1",
      sourceTitle: "Estudo 2026-09 (plano 020)",
      transcript: "GEOPOLÍTICA 1.85 [1.28–2.45] n=41",
      licoes: [
        { dimensao: "tema", titulo: "GEOPOLÍTICA funciona", descricao: "41% no top quartil vs 25% (n=41)", evidencia: "linha" },
        { dimensao: "hook", titulo: "Urgência funciona", descricao: "45% vs 25% (n=40)" },
      ],
    });
    expect(r).toEqual({ lessonId: "lesson-1", proposed: 2 });
    expect(banco.lessons).toEqual([
      expect.objectContaining({ client_id: "cli-1", source_kind: "curador", source_title: "Estudo 2026-09 (plano 020)" }),
    ]);
    expect(banco.learnings).toHaveLength(2);
    for (const l of banco.learnings) {
      expect(l.active).toBe(false);
      expect(l.origem).toBe("curador");
      expect(l.lesson_id).toBe("lesson-1");
      expect((l.destinatarios as string[]).length).toBeGreaterThan(0);
    }
    expect(banco.learnings[0].destinatarios).toEqual(["storytelling", "modelagem", "premissa", "dados"]);
    expect(banco.learnings[1].destinatarios).toEqual(["hook", "dados"]);
  });

  it("lista vazia não toca no banco", async () => {
    const antes = banco.lessons.length;
    const r = await proporLicoes({ clientId: null, sourceTitle: "x", transcript: null, licoes: [] });
    expect(r).toEqual({ lessonId: null, proposed: 0 });
    expect(banco.lessons).toHaveLength(antes);
  });
});
