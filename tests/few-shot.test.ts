import { describe, expect, it } from "vitest";
import {
  candidatosDeDocumentos,
  rankFewShot,
  resumirComparacao,
  taxaCompartilhamento,
  type CandidatoFewShot,
} from "@/lib/pipeline/few-shot";

const c = (roteiro: string, views: number, compartilhamentos: number | null = null): CandidatoFewShot => ({
  roteiro,
  views,
  compartilhamentos,
});

describe("rankFewShot — critério views (o de hoje)", () => {
  it("ordena por views desc, corta em 5 e anota o critério na origem", () => {
    const pool = Array.from({ length: 20 }, (_, i) => c(`roteiro ${i}`, (i + 1) * 100_000));
    const out = rankFewShot(pool, "views");
    expect(out).toHaveLength(5);
    expect(out.map((o) => o.roteiro)).toEqual(["roteiro 19", "roteiro 18", "roteiro 17", "roteiro 16", "roteiro 15"]);
    expect(out[0].origem).toBe("roteiro publicado (corpus) — 2.0M views, entrou por views");
  });

  it("ninguém com views → mantém a ordem de similaridade", () => {
    const out = rankFewShot([c("a", 0), c("b", 0)], "views");
    expect(out.map((o) => o.roteiro)).toEqual(["a", "b"]);
    expect(out[0].origem).toBe("roteiro publicado (corpus) — sem dado de performance, ordem por similaridade");
  });
});

describe("rankFewShot — critério taxa de compartilhamento", () => {
  it("ranqueia por taxa, não por compartilhamento absoluto nem por views", () => {
    const out = rankFewShot(
      [
        c("gigante", 1_000_000, 5_000), // 0,5%
        c("médio", 100_000, 3_000), // 3,0%
        c("pequeno", 10_000, 500), // 5,0%
      ],
      "taxa_compartilhamento"
    );
    expect(out.map((o) => o.roteiro)).toEqual(["pequeno", "médio", "gigante"]);
    expect(out[0].origem).toBe(
      "roteiro publicado (corpus) — 5.00% de compartilhamento em 10k views, entrou por taxa de compartilhamento"
    );
    expect(out[0].criterio).toBe("taxa_compartilhamento");
  });

  it("cobertura parcial: quem tem dado ranqueia por taxa, o resto completa por views (fallback explícito)", () => {
    const out = rankFewShot(
      [
        c("com taxa baixa", 200_000, 1_000), // 0,5%
        c("com taxa alta", 50_000, 2_500), // 5,0%
        c("sem dado grande", 900_000),
        c("sem dado médio", 400_000),
        c("sem dado pequeno", 1_000),
      ],
      "taxa_compartilhamento"
    );
    expect(out.map((o) => o.roteiro)).toEqual([
      "com taxa alta",
      "com taxa baixa",
      "sem dado grande",
      "sem dado médio",
      "sem dado pequeno",
    ]);
    expect(out.slice(0, 2).every((o) => o.criterio === "taxa_compartilhamento")).toBe(true);
    expect(out.slice(2).every((o) => o.criterio === "views")).toBe(true);
    expect(out[2].origem).toBe("roteiro publicado (corpus) — 900k views, sem dado de compartilhamento, entrou por views");
  });

  it("YouTube (sem coleta de compartilhamento) NÃO é ranqueado como taxa zero", () => {
    const youtube = c("youtube com 3M views", 3_000_000, null);
    const outro = c("outro com taxa mínima", 10_000, 1); // 0,01% — perderia de qualquer zero
    const out = rankFewShot([outro, youtube], "taxa_compartilhamento");
    // se null virasse 0, o YouTube cairia para o fim; ele entra pelo fallback de views, acima
    // de nada — o que se cobra aqui é que ele não seja tratado como "compartilhou zero".
    expect(out.find((o) => o.roteiro === youtube.roteiro)?.taxa).toBeNull();
    expect(out.find((o) => o.roteiro === youtube.roteiro)?.criterio).toBe("views");
    expect(out[0].roteiro).toBe(outro.roteiro);
  });

  it("ninguém com dado de compartilhamento → o conjunto inteiro é o de hoje", () => {
    const pool = [c("a", 300), c("b", 200), c("c", 100)];
    expect(rankFewShot(pool, "taxa_compartilhamento").map((o) => o.roteiro)).toEqual(
      rankFewShot(pool, "views").map((o) => o.roteiro)
    );
  });

  it("teto de 5 vale nos dois critérios", () => {
    const pool = Array.from({ length: 12 }, (_, i) => c(`r${i}`, (i + 1) * 1000, i * 10));
    expect(rankFewShot(pool, "views")).toHaveLength(5);
    expect(rankFewShot(pool, "taxa_compartilhamento")).toHaveLength(5);
    expect(rankFewShot(pool, "taxa_compartilhamento", 2)).toHaveLength(2);
  });
});

describe("taxaCompartilhamento", () => {
  it("sem compartilhamento ou sem views → null, nunca 0", () => {
    expect(taxaCompartilhamento(c("x", 1000, null))).toBeNull();
    expect(taxaCompartilhamento(c("x", 0, 50))).toBeNull();
    expect(taxaCompartilhamento(c("x", 1000, 0))).toBe(0);
  });
});

describe("candidatosDeDocumentos", () => {
  it("junta linhas do RPC com as métricas por video_id e descarta linha sem content", () => {
    const out = candidatosDeDocumentos(
      [
        { content: "a", video_id: "v1", metadata: { views: 5000 } },
        { content: null, video_id: "v2", metadata: { views: 9 } },
        { content: "c", video_id: null, metadata: {} },
      ],
      new Map([["v1", { views: 4000, compartilhamentos: 100 }]])
    );
    expect(out).toEqual([
      { roteiro: "a", views: 5000, compartilhamentos: 100 },
      { roteiro: "c", views: 0, compartilhamentos: null },
    ]);
  });
});

describe("resumirComparacao — o que vai à mesa do humano", () => {
  const pool = [
    c("mais views, pouco compartilhada", 1_000_000, 1_000),
    c("menos views, muito compartilhada", 50_000, 4_000),
    c("sem dado", 300_000),
  ];

  it("devolve os dois conjuntos e quantos dos 5 mudariam", () => {
    const cmp = resumirComparacao("tema real", pool, 2)!;
    expect(cmp.tema).toBe("tema real");
    expect(cmp.views.map((e) => e.trecho)).toEqual(["mais views, pouco compartilhada", "sem dado"]);
    expect(cmp.taxa.map((e) => e.trecho)).toEqual(["menos views, muito compartilhada", "mais views, pouco compartilhada"]);
    expect(cmp.mudam).toBe(1);
    expect(cmp.taxa[0].fallback).toBe(false);
    expect(cmp.views[1].taxa).toBeNull();
  });

  it("nada a decidir (sem cobertura, ou conjuntos iguais) → null, sem botão no escuro", () => {
    expect(resumirComparacao("tema", [c("a", 100), c("b", 50)])).toBeNull();
    expect(resumirComparacao("tema", [c("a", 100, 10)], 5)).toBeNull();
  });
});
