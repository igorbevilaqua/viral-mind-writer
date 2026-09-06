import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));

import { decidirCasamentos, MATCH_AUTO, MATCH_PENDENTE, sobreposicao, type MatchRow } from "@/lib/script-matches";

// Plano 020, WP-A: a parte pura do casamento Codex → vídeo publicado.

const TEXTO = "a casas bahia sobreviveu a hiperinflacao plano collor e pandemia agora fechou lojas de uma vez e pouca gente entende";
// Um único 5-grama em comum com TEXTO ("a casas bahia sobreviveu a"): 1/13 ≈ 0,077 — zona cinza.
const PARECIDO = "ontem a casas bahia sobreviveu a crise e depois tudo mudou no varejo brasileiro";
const OUTRO = "a coca cola zero ta virando uma empresa a parte e a culpa disso e do mounjaro e do ozempic";

const linha = (over: Partial<MatchRow>): MatchRow => ({
  script_id: "s1",
  video_id: "v1",
  plataforma: "TikTok",
  score: 0.9,
  link_video: "https://tt/1",
  data_publicacao: "2026-08-01",
  hook_codex: "",
  hook_video: "",
  roteiro_codex: TEXTO,
  roteiro_video: TEXTO,
  ...over,
});

describe("sobreposicao", () => {
  it("texto idêntico dá 1, texto sem nada em comum dá 0", () => {
    expect(sobreposicao(TEXTO, TEXTO)).toBe(1);
    expect(sobreposicao(TEXTO, OUTRO)).toBe(0);
  });
  it("ignora acento, caixa e pontuação", () => {
    expect(sobreposicao("A Casas Bahia sobreviveu à hiperinflação!", "a casas bahia sobreviveu a hiperinflacao")).toBe(1);
  });
  it("texto curto demais para um 5-grama dá 0, sem dividir por zero", () => {
    expect(sobreposicao("só três palavras", TEXTO)).toBe(0);
    expect(sobreposicao(null, TEXTO)).toBe(0);
  });
});

describe("decidirCasamentos", () => {
  it("ts_rank alto com texto diferente é descartado — o ts_rank só gera candidatos", () => {
    expect(MATCH_PENDENTE).toBe(0.02);
    expect(decidirCasamentos([linha({ score: 0.98, roteiro_video: OUTRO })])).toEqual([]);
  });

  it("sobreposição alta é automático; parcial vira pendente", () => {
    expect(MATCH_AUTO).toBe(0.08);
    const out = decidirCasamentos([
      linha({ video_id: "igual", roteiro_video: TEXTO }),
      linha({ video_id: "parecido", roteiro_video: PARECIDO }),
    ]);
    expect(out.find((c) => c.video_id === "igual")?.auto).toBe(true);
    const parcial = out.find((c) => c.video_id === "parecido")!;
    expect(parcial.auto).toBe(false);
    expect(parcial.sobreposicao).toBeGreaterThanOrEqual(MATCH_PENDENTE);
    expect(parcial.sobreposicao).toBeLessThan(MATCH_AUTO);
  });

  it("vídeo em dois roteiros fica só no de maior sobreposição", () => {
    const out = decidirCasamentos([
      linha({ script_id: "versao-1", roteiro_codex: PARECIDO }),
      linha({ script_id: "versao-2", roteiro_codex: TEXTO }),
    ]);
    expect(out.map((c) => c.script_id)).toEqual(["versao-2"]);
  });

  it("Instagram vira principal mesmo com sobreposição menor", () => {
    const out = decidirCasamentos([
      linha({ video_id: "tt", plataforma: "TikTok", roteiro_video: TEXTO }),
      linha({ video_id: "ig", plataforma: "Instagram", roteiro_video: `${TEXTO} e mais um trecho novo no fim do video` }),
    ]);
    expect(out.find((c) => c.principal)?.video_id).toBe("ig");
    expect(out.filter((c) => c.principal)).toHaveLength(1);
  });

  it("principal sai dos automáticos: IG pendente não leva o published_url", () => {
    const out = decidirCasamentos([
      linha({ video_id: "tt", plataforma: "TikTok", roteiro_video: TEXTO }),
      linha({ video_id: "ig", plataforma: "Instagram", roteiro_video: PARECIDO }),
    ]);
    expect(out.find((c) => c.principal)?.video_id).toBe("tt");
  });
});
