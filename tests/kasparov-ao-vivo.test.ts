import { afterEach, describe, expect, test, vi } from "vitest";

// Vídeo de fora não está no corpus nem no pool: sem uma terceira fonte, todo link novo caía
// no "sem dado" e o debate virava opinião pura. O que estes testes travam é o limite dela:
// número medido só vira ratio quando os DOIS lados vieram, e resposta capenga do Instagram
// (200 com {error}, ou play_count ausente) volta a ser "sem dado" em vez de virar chute.
vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  process.env.SCRAPECREATORS_API_KEY ??= "test";
});
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} })); // banco fora: força o caminho ao vivo
afterEach(() => vi.unstubAllGlobals());

import { acervoPorUrl } from "@/lib/pipeline/kasparov-video";

const REEL = "https://www.instagram.com/reel/DWICMEWiR1O/";

const respondeCom = (corpo: unknown) => {
  const fetchMock = vi.fn(async () => Response.json(corpo));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const postCom = (views: number | undefined, seguidores: number | undefined) => ({
  success: true,
  credits_remaining: 500,
  data: {
    xdt_shortcode_media: {
      video_play_count: views,
      owner: { username: "tuliomminto", edge_followed_by: seguidores == null ? undefined : { count: seguidores } },
    },
  },
});

describe("acervoPorUrl: leitura ao vivo", () => {
  test("views e seguidores presentes viram ratio, marcado como ao vivo", async () => {
    respondeCom(postCom(316_000, 1556));
    expect(await acervoPorUrl(REEL)).toMatchObject({
      url: REEL,
      views: 316_000,
      seguidores: 1556,
      fonte: "ao_vivo",
      titulo: "@tuliomminto",
    });
  });

  test("sem play_count não há ratio: volta sem dado em vez de chutar", async () => {
    respondeCom(postCom(undefined, 1556));
    expect(await acervoPorUrl(REEL)).toBeNull();
  });

  test("200 com {error} (post privado/apagado) volta sem dado", async () => {
    respondeCom({ success: true, error: "not_found", message: "Post not found" });
    expect(await acervoPorUrl(REEL)).toBeNull();
  });

  test("link que não é do Instagram não gasta crédito", async () => {
    const fetchMock = respondeCom(postCom(1, 1));
    expect(await acervoPorUrl("https://www.tiktok.com/@x/video/7300000000000000000")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
