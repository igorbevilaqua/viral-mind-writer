import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));

import { normalizarLinkDeVideo, platformVideoId } from "@/lib/video-url";
import { corteDoVideo, mensagemDeFalha } from "@/lib/transcribe";

// Links reais que morreram na transcrição (sessões de ago a out de 2026), e variantes que o app copia.
describe("normalizarLinkDeVideo", () => {
  test.each([
    ["https://www.instagram.com/reel/Dc9dFZUpX1T/?stkn=YThndWJzbnU4bXA2", "https://www.instagram.com/reel/Dc9dFZUpX1T/"],
    ["https://www.instagram.com/reels/DcjA--kOwyq/", "https://www.instagram.com/reel/DcjA--kOwyq/"],
    ["https://www.instagram.com/p/DbWlQSZyorO/?igsh=abc", "https://www.instagram.com/p/DbWlQSZyorO/"],
    ["https://instagram.com/fulano.de.tal/reel/DeFkVtjJmjo/?exln=bnF", "https://www.instagram.com/reel/DeFkVtjJmjo/"],
    ["instagram.com/reel/Db3w0wNhjab", "https://www.instagram.com/reel/Db3w0wNhjab/"],
    [
      "Sessões / #2a620e Modelado de: https://www.instagram.com/reel/Db3w0wNhjab/?utm_source=ig_web_copy_link Erro: x",
      "https://www.instagram.com/reel/Db3w0wNhjab/",
    ],
    ["https://www.tiktok.com/@perfil/video/7123456789012345678?is_from_webapp=1", "https://www.tiktok.com/@perfil/video/7123456789012345678"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ?si=xyz", "https://youtube.com/shorts/dQw4w9WgXcQ?si=xyz"],
  ])("%s", (bruto, esperado) => {
    expect(normalizarLinkDeVideo(bruto)).toBe(esperado);
  });

  test("perfil continua sem id de vídeo (vira mensagem de perfil, não chamada paga)", () => {
    const u = normalizarLinkDeVideo("https://www.instagram.com/psicoanalicarla/reels/");
    expect(platformVideoId(u)).toBeNull();
  });

  test("id lido também com o perfil na frente", () => {
    expect(platformVideoId("https://www.instagram.com/fulano/p/DbWlQSZyorO/")).toBe("DbWlQSZyorO");
  });
});

describe("corteDoVideo", () => {
  const MB = 1024 * 1024;

  test("vídeo curto e leve vai inteiro, sem aviso", () => {
    expect(corteDoVideo(10 * MB, 155)).toEqual({ bytes: 10 * MB, cortado: false, segundos: 155, aviso: null });
  });

  test("passa de 3 minutos: corta em 180 s e avisa", () => {
    const c = corteDoVideo(20 * MB, 400);
    expect(c.cortado).toBe(true);
    expect(c.segundos).toBe(180);
    expect(c.aviso).toBe("[TRANSCRIÇÃO PARCIAL: só os primeiros ~180 s de 400 s do vídeo]");
  });

  test("arquivo pesado: o teto de 24 MB manda, mesmo abaixo de 3 minutos", () => {
    const c = corteDoVideo(48 * MB, 160);
    expect(c.bytes).toBe(24 * MB);
    expect(c.segundos).toBe(80);
  });

  test("sem duração conhecida: corta pelo tamanho e avisa sem inventar segundos", () => {
    const c = corteDoVideo(30 * MB, undefined);
    expect(c.cortado).toBe(true);
    expect(c.aviso).toBe("[TRANSCRIÇÃO PARCIAL: só o começo do vídeo]");
  });
});

describe("mensagemDeFalha", () => {
  test("crédito acabando em qualquer fonte vira pedido de recarga", () => {
    expect(
      mensagemDeFalha([
        { fonte: "Supadata", motivo: "Supadata respondeu 502 sem JSON" },
        { fonte: "ScrapeCreators", motivo: "a conta ScrapeCreators está sem créditos" },
      ])
    ).toMatch(/sem créditos. Avise o admin/);
  });

  test("YouTube sozinho mantém o motivo dele", () => {
    const motivo = "este vídeo não tem legendas disponíveis";
    expect(mensagemDeFalha([{ fonte: "YouTube", motivo }])).toBe(motivo);
  });
});
