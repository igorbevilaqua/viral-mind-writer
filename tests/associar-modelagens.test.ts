import { describe, expect, it, vi } from "vitest";

// suggest.ts importa lib/db e os clients de LLM no topo — mock vazio basta: aqui só roda a
// associação, que é pura.
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));
import { associarModelagens, type ThemeSuggestion } from "@/lib/pipeline/suggest";
import type { ModelagemSugerida } from "@/lib/modelagens/cacar";

const sugestao = (tema: string, extra: Partial<ThemeSuggestion> = {}): ThemeSuggestion => ({
  tema,
  premissa: "p",
  angulo_narrativo: "a",
  forma_abordagem: "f",
  estrutura_sugerida: "e",
  gancho_potencial: "g",
  por_que_para_este_cliente: "pq",
  informacoes_de_apoio: ["x", "y", "z"],
  ...extra,
});

const modelagem = (autor: string): ModelagemSugerida => ({
  plataforma: "tiktok",
  plataform_id: `id-${autor}`,
  url: `https://www.tiktok.com/@${autor}/video/1`,
  autor,
  autor_seguidores: 2759,
  views: 562_000,
  ratio: 203.7,
  timing_classe: "perene",
  caption: "legenda",
});

const MODELAGENS = [modelagem("oviedo.adv"), modelagem("larissasantos.leiloes")];

describe("associarModelagens", () => {
  it("resolve o índice do modelo e põe os números pelo código, não pelo LLM", () => {
    const s = [sugestao("Empresas que faliram", { modelagem_indice: 1 })];
    associarModelagens(s, MODELAGENS, []);
    expect(s[0].modelagem_sugerida).toEqual({
      url: "https://www.tiktok.com/@oviedo.adv/video/1",
      plataforma: "tiktok",
      autor: "oviedo.adv",
      views: 562_000,
      ratio: 203.7,
      timing_classe: "perene",
    });
    // O campo de trabalho não vaza para o cliente.
    expect("modelagem_indice" in s[0]).toBe(false);
  });

  it("índice fora da faixa, zero ou ausente não inventa vídeo", () => {
    const s = [
      sugestao("a", { modelagem_indice: 99 }),
      sugestao("b", { modelagem_indice: 0 }),
      sugestao("c", { modelagem_indice: null }),
      sugestao("d"),
    ];
    associarModelagens(s, MODELAGENS, []);
    expect(s.map((x) => x.modelagem_sugerida)).toEqual([null, null, null, null]);
  });

  it("não repete o mesmo vídeo em dois cards", () => {
    const s = [sugestao("a", { modelagem_indice: 2 }), sugestao("b", { modelagem_indice: 2 })];
    associarModelagens(s, MODELAGENS, []);
    expect(s[0].modelagem_sugerida?.autor).toBe("larissasantos.leiloes");
    expect(s[1].modelagem_sugerida).toBeNull();
  });

  it("preenche a URL do hit interno pelo título (e null quando a RPC não trouxe)", () => {
    const s = [
      sugestao("a", { reaproveitado_de: { cliente_origem: "Lerry", titulo: "Como comprar imóvel de leilão", views: 316_000 } }),
      sugestao("b", { reaproveitado_de: { cliente_origem: "Cadu", titulo: "Título que não está nos hits", views: 90_000 } }),
    ];
    associarModelagens(s, [], [
      // Espaçamento e caixa diferentes: o modelo copia o título, não o serializa.
      { titulo: "  como comprar   IMÓVEL de leilão ", link_video: "https://insta.gram/reel/abc" },
      { titulo: "outro", link_video: null },
    ]);
    expect(s[0].reaproveitado_de?.url).toBe("https://insta.gram/reel/abc");
    expect(s[1].reaproveitado_de?.url).toBeNull();
  });

  it("sem modelagem nenhuma, todas saem com null e nada quebra", () => {
    const s = [sugestao("a", { modelagem_indice: 1 })];
    associarModelagens(s, [], []);
    expect(s[0].modelagem_sugerida).toBeNull();
  });
});
