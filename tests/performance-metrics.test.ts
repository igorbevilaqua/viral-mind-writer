import { describe, expect, test } from "vitest";
import { agregarDiarias, mesmoVideo, parseSeguidores, totalAcumulado } from "@/lib/performance-metrics";

// Resolução published_url → vídeo do corpus. A busca no banco é ilike '%id%' sobre a URL
// crua; quem decide se casou é isto aqui, comparando id de plataforma com id de plataforma.
describe("mesmoVideo", () => {
  test("mesmo reel, URLs diferentes (barra final, www, query) casam", () => {
    const pid = "DbQseyDuCSC";
    expect(mesmoVideo("https://www.instagram.com/reel/DbQseyDuCSC", pid)).toBe(true);
    expect(mesmoVideo("https://instagram.com/reel/DbQseyDuCSC/", pid)).toBe(true);
    expect(mesmoVideo("https://www.instagram.com/p/DbQseyDuCSC/?igsh=abc", pid)).toBe(true);
  });

  test("shortcode do corpus contendo o nosso como prefixo NÃO casa (o ilike casaria)", () => {
    expect(mesmoVideo("https://www.instagram.com/reel/DbQseyDuCSCxyz", "DbQseyDuCSC")).toBe(false);
  });

  test("YouTube e TikTok casam por id de plataforma", () => {
    expect(mesmoVideo("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ")).toBe(true);
    expect(mesmoVideo("https://www.tiktok.com/@x/video/7123456789012345678", "7123456789012345678")).toBe(true);
  });

  test("id igual em plataformas diferentes não é o mesmo vídeo", () => {
    expect(mesmoVideo("https://www.youtube.com/shorts/dQw4w9WgXcQ", "DbQseyDuCSC")).toBe(false);
  });

  test("link do corpus sem id de vídeo (perfil) ou nulo nunca casa", () => {
    expect(mesmoVideo("https://www.instagram.com/algumperfil/", "DbQseyDuCSC")).toBe(false);
    expect(mesmoVideo(null, "DbQseyDuCSC")).toBe(false);
    expect(mesmoVideo("", "DbQseyDuCSC")).toBe(false);
  });
});

describe("totalAcumulado", () => {
  // O erro que este teste existe para impedir: no vídeo real DbQseyDuCSC, max = 199.577
  // e sum = 4.181.095 — somar snapshot acumulado infla ~20x.
  test("snapshot acumulado: pico, nunca soma", () => {
    expect(totalAcumulado([100, 4200, 199577, 199577])).toBe(199577);
  });

  test("contador que regride (recoleta parcial) não derruba o total", () => {
    expect(totalAcumulado([5000, 4800, 4900])).toBe(5000);
  });

  test("nulos são ignorados; lista sem número nenhum vira null (ausência ≠ zero)", () => {
    expect(totalAcumulado([null, 300, undefined])).toBe(300);
    expect(totalAcumulado([])).toBeNull();
    expect(totalAcumulado([null, undefined])).toBeNull();
  });
});

describe("agregarDiarias", () => {
  const dias = [
    { views_no_dia: 1000, fb_views_no_dia: 10, compartilhamentos_no_dia: 3 },
    { views_no_dia: 23364, fb_views_no_dia: 90, compartilhamentos_no_dia: 41 },
    { views_no_dia: 23364, fb_views_no_dia: 90, compartilhamentos_no_dia: 41 },
  ];

  test("views = pico do contador + pico do espelho no Facebook (fórmula da MV 0013)", () => {
    expect(agregarDiarias(dias, "Instagram").views).toBe(23364 + 90);
  });

  test("compartilhamentos também são pico, não soma", () => {
    expect(agregarDiarias(dias, "Instagram").compartilhamentos).toBe(41);
    expect(agregarDiarias(dias, "TikTok").compartilhamentos).toBe(41);
  });

  test("YouTube não tem coleta de compartilhamento: null, nunca 0", () => {
    const yt = agregarDiarias([{ views_no_dia: 900, compartilhamentos_no_dia: 0 }], "YouTube");
    expect(yt.compartilhamentos).toBeNull();
    expect(yt.views).toBe(900);
  });

  test("plataforma desconhecida mantém o valor coletado; zero real segue zero", () => {
    expect(agregarDiarias([{ views_no_dia: 10, compartilhamentos_no_dia: 0 }], null).compartilhamentos).toBe(0);
  });

  test("vídeo ainda sem coleta diária: 0 views, compartilhamento null", () => {
    expect(agregarDiarias([], "Instagram")).toEqual({ views: 0, compartilhamentos: null });
  });
});

describe("parseSeguidores", () => {
  test("limpa a sujeira do campo text do corpus", () => {
    expect(parseSeguidores("+1.234")).toBe(1234);
    expect(parseSeguidores(87)).toBe(87);
    expect(parseSeguidores("-12")).toBe(-12);
  });

  test("sem número vira null (não 0)", () => {
    expect(parseSeguidores(null)).toBeNull();
    expect(parseSeguidores("—")).toBeNull();
    expect(parseSeguidores("-")).toBeNull();
  });
});
