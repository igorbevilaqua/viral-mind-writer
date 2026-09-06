import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));

import { decidirCasamentos, MATCH_AUTO, MATCH_PENDENTE, type MatchRow } from "@/lib/script-matches";

// Plano 020, WP-A: a parte pura do casamento Codex → vídeo publicado.

const linha = (over: Partial<MatchRow>): MatchRow => ({
  script_id: "s1",
  video_id: "v1",
  plataforma: "TikTok",
  score: 0.9,
  link_video: "https://tt/1",
  data_publicacao: "2026-08-01",
  hook_codex: "h",
  hook_video: "h",
  ...over,
});

describe("decidirCasamentos", () => {
  it("vídeo em dois roteiros fica só no de maior score", () => {
    const out = decidirCasamentos([
      linha({ script_id: "v1-do-roteiro-1", score: 0.85 }),
      linha({ script_id: "v1-do-roteiro-2", score: 0.95 }),
    ]);
    expect(out.map((c) => c.script_id)).toEqual(["v1-do-roteiro-2"]);
  });

  it("Instagram vira principal mesmo com score menor", () => {
    const out = decidirCasamentos([
      linha({ video_id: "tt", plataforma: "TikTok", score: 0.95 }),
      linha({ video_id: "ig", plataforma: "Instagram", score: 0.85 }),
    ]);
    expect(out.find((c) => c.principal)?.video_id).toBe("ig");
    expect(out.filter((c) => c.principal)).toHaveLength(1);
  });

  it("sem Instagram, o maior score é o principal", () => {
    const out = decidirCasamentos([
      linha({ video_id: "yt", plataforma: "YouTube", score: 0.82 }),
      linha({ video_id: "tt", plataforma: "TikTok", score: 0.95 }),
    ]);
    expect(out.find((c) => c.principal)?.video_id).toBe("tt");
  });

  it("principal sai dos automáticos: IG pendente não leva o published_url", () => {
    const out = decidirCasamentos([
      linha({ video_id: "tt", plataforma: "TikTok", score: 0.95 }),
      linha({ video_id: "ig", plataforma: "Instagram", score: 0.5 }),
    ]);
    expect(out.find((c) => c.principal)?.video_id).toBe("tt");
  });

  it("0.79 é pendente, 0.80 é automático", () => {
    expect(MATCH_AUTO).toBe(0.8);
    const out = decidirCasamentos([
      linha({ video_id: "a", score: 0.79 }),
      linha({ video_id: "b", score: 0.8 }),
    ]);
    expect(out.find((c) => c.video_id === "a")?.auto).toBe(false);
    expect(out.find((c) => c.video_id === "b")?.auto).toBe(true);
  });

  it("abaixo de 0.4 é descartado", () => {
    expect(MATCH_PENDENTE).toBe(0.4);
    expect(decidirCasamentos([linha({ score: 0.39 })])).toEqual([]);
    expect(decidirCasamentos([linha({ score: 0.4 })])).toHaveLength(1);
  });
});
