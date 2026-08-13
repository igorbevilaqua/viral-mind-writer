import { describe, expect, it } from "vitest";
import { rankear, type CandidatoRankeavel, type TimingClasse } from "@/lib/modelagens/rank";
import fixture from "./fixtures/modelagens-fase0.json";

// Alimentado pelas 371 respostas reais da Fase 0 (plano 014 §3b) — sem rede, sem crédito.
// Os números que este teste trava saíram de dado real, não de exemplo inventado.

interface LinhaFase0 {
  plataforma: string;
  id: string;
  url: string;
  autor: string | null;
  seguidores: number | null;
  caption: string;
  duracao: number | null;
  publicado: string | null;
  views: number;
  likes?: number;
  shares?: number;
}

const AGORA = new Date("2026-08-13T12:00:00Z"); // data da coleta da fixture

// YouTube fica de fora: a fixture guarda os 137 itens sem autor/data/duração de
// propósito — é o achado que tirou a plataforma do v1, e sem esses campos não há ratio,
// decay nem cap por autor para calcular.
const linhas = (fixture as unknown as { itens: LinhaFase0[] }).itens.filter(
  (l) => l.plataforma !== "youtube"
);

function candidato(l: LinhaFase0, extra: Partial<CandidatoRankeavel> = {}): CandidatoRankeavel {
  return {
    plataforma: l.plataforma as "tiktok" | "instagram",
    plataform_id: l.id,
    url: l.url,
    autor_handle: l.autor ?? "",
    autor_seguidores: l.seguidores,
    caption: l.caption,
    duracao_seg: l.duracao ?? 0,
    data_publicacao: l.publicado ?? "",
    views: l.views,
    likes: l.likes ?? 0,
    shares: l.shares ?? 0,
    comments: 0,
    som_id: null,
    ...extra,
  };
}

const TODOS = linhas.map((l) => candidato(l));
const acha = (id: string) => linhas.find((l) => l.id === id)!;

// Pares reais da Fase 0, escolhidos por serem o caso difícil de cada armadilha.
const PERENE_ANTIGO = "7443565638989139256"; // investor.hub.br  — 620d, 110k views, 5,5x
const BREAKING_RECENTE = "7666956598174289159"; // emilitony     —  18d, 749k views, 7,6x
const PERENE_1024D = "7293537393439788294"; // acervomapsarquivo — 1024d, 3,9M views, 36,4x
const BREAKING_RATIO_ALTO = "7662343007525473557"; // iamgustavo_g — 30d, 134,7x
const TOP_RATIO = "7625872492116135189"; // larissasantos.leiloes — 1.556 seguidores, 316k views

const classificado = (ids: Record<string, TimingClasse>) =>
  TODOS.map((c) => ({ ...c, timing_classe: ids[c.plataform_id] ?? "trending" }));

describe("rankear — regressão principal do plano", () => {
  // A asserção que trava o plano inteiro: idade sozinha não penaliza, dependência de
  // contexto penaliza. Aqui o breaking tem 6,8x MAIS views e ratio maior — e ainda perde.
  it("perene de 620 dias supera breaking de 18 dias com mais views", () => {
    const r = rankear(
      classificado({ [PERENE_ANTIGO]: "perene", [BREAKING_RECENTE]: "breaking" }),
      { agora: AGORA }
    );
    const perene = r.findIndex((x) => x.candidato.plataform_id === PERENE_ANTIGO);
    const breaking = r.findIndex((x) => x.candidato.plataform_id === BREAKING_RECENTE);

    expect(perene).toBeGreaterThanOrEqual(0);
    expect(breaking).toBeGreaterThanOrEqual(0);
    expect(acha(BREAKING_RECENTE).views).toBeGreaterThan(acha(PERENE_ANTIGO).views);
    expect(perene).toBeLessThan(breaking);
  });

  it("perene de 1.024 dias supera breaking com ratio 3,7x maior", () => {
    const r = rankear(
      classificado({ [PERENE_1024D]: "perene", [BREAKING_RATIO_ALTO]: "breaking" }),
      { agora: AGORA }
    );
    const perene = r.find((x) => x.candidato.plataform_id === PERENE_1024D)!;
    const breaking = r.find((x) => x.candidato.plataform_id === BREAKING_RATIO_ALTO)!;

    expect(breaking.ratio).toBeGreaterThan(perene.ratio); // 134,7x contra 36,4x
    expect(perene.score).toBeGreaterThan(breaking.score); // e mesmo assim o perene ganha
  });

  it("sem classificação idade não pesa: decay neutro no primeiro passe", () => {
    // Só os ~40 finalistas são classificados; antes disso o decay não pode chutar.
    expect(rankear(TODOS, { agora: AGORA }).every((r) => r.decay === 1)).toBe(true);
  });
});

describe("rankear — ratio, não views", () => {
  it("o 1º colocado é o outlier de ratio, não o de views", () => {
    const r = rankear(TODOS, { agora: AGORA });
    // @larissasantos.leiloes: 1.556 seguidores fazendo 316k views (202,9x). Ordenado por
    // views ele cairia por volta da 20ª posição — o mérito está inteiro no vídeo.
    expect(r[0].candidato.plataform_id).toBe(TOP_RATIO);
    expect(r[0].ratio).toBeCloseTo(202.9, 0);

    const maisViews = [...r].sort((a, b) => b.candidato.views - a.candidato.views)[0];
    expect(maisViews.candidato.plataform_id).not.toBe(TOP_RATIO);
  });

  it("autor com 0 seguidores não produz Infinity", () => {
    const semSeguidores = candidato(acha(TOP_RATIO), {
      plataform_id: "zerado",
      autor_handle: "conta.nova",
      autor_seguidores: 0,
      views: 500_000,
    });
    const r = rankear([...TODOS, semSeguidores], { agora: AGORA });
    const alvo = r.find((x) => x.candidato.plataform_id === "zerado")!;

    expect(Number.isFinite(alvo.ratio)).toBe(true);
    expect(alvo.ratio).toBe(500); // clamp em 1.000 seguidores
    expect(r.every((x) => Number.isFinite(x.score))).toBe(true);
  });

  it("percentil é calculado dentro da plataforma, não global", () => {
    // View de TikTok e de IG não são a mesma moeda (armadilha #1): cada plataforma
    // presente tem que ter o seu próprio topo, senão o ranking vira monocultura.
    const r = rankear(TODOS, { agora: AGORA });
    for (const p of new Set(r.map((x) => x.candidato.plataforma)))
      expect(r.filter((x) => x.candidato.plataforma === p).some((x) => x.percentil === 1)).toBe(true);
  });
});

describe("rankear — cortes", () => {
  it("nenhum autor aparece mais de 2x", () => {
    const r = rankear(TODOS, { agora: AGORA });
    const porAutor = new Map<string, number>();
    for (const x of r) porAutor.set(x.candidato.autor_handle, (porAutor.get(x.candidato.autor_handle) ?? 0) + 1);

    expect(Math.max(...porAutor.values())).toBeLessThanOrEqual(2);
    // @mayra.ribeiro03 tem 3 vídeos aprovados na fixture — é o caso que o cap existe para
    // conter, e sem ele o teste acima passaria por acidente.
    expect(porAutor.get("mayra.ribeiro03")).toBe(2);
  });

  it("vídeo cujo plataform_id está no corpus é descartado", () => {
    const r = rankear(TODOS, { agora: AGORA, no_corpus: new Set([TOP_RATIO]) });
    expect(r.some((x) => x.candidato.plataform_id === TOP_RATIO)).toBe(false);
  });

  it("vídeo já usado por ESTE cliente é descartado; por outro cliente, não", () => {
    const eu = "11111111-1111-1111-1111-111111111111";
    const outro = "22222222-2222-2222-2222-222222222222";
    const comUso = TODOS.map((c) => (c.plataform_id === TOP_RATIO ? { ...c, usado_em: [outro] } : c));

    expect(rankear(comUso, { agora: AGORA, cliente_id: eu }).some((x) => x.candidato.plataform_id === TOP_RATIO)).toBe(true);
    expect(rankear(comUso, { agora: AGORA, cliente_id: outro }).some((x) => x.candidato.plataform_id === TOP_RATIO)).toBe(false);
  });

  it("corta por aplicabilidade, nunca por idioma", () => {
    // O eixo é "um brasileiro modelaria isso?", não "está em português?".
    const marcado = TODOS.map((c) =>
      c.plataform_id === TOP_RATIO ? { ...c, aplicabilidade_br: "local_estrangeiro" as const } : c
    );
    const r = rankear(marcado, { agora: AGORA });
    expect(r.some((x) => x.candidato.plataform_id === TOP_RATIO)).toBe(false);

    // ...mas conteúdo estrangeiro classificado como universal continua no páreo.
    const universal = TODOS.map((c) =>
      c.plataform_id === TOP_RATIO ? { ...c, aplicabilidade_br: "universal" as const } : c
    );
    expect(rankear(universal, { agora: AGORA })[0].candidato.plataform_id).toBe(TOP_RATIO);
  });

  it("respeita piso de views por plataforma e o teto de duração", () => {
    const r = rankear(TODOS, { agora: AGORA, piso_views: { instagram: 1 } });
    expect(r.every((x) => x.candidato.duracao_seg <= 180)).toBe(true);
    expect(r.every((x) => x.ratio >= 3)).toBe(true);
    expect(r.filter((x) => x.candidato.plataforma === "instagram").length).toBeGreaterThan(
      rankear(TODOS, { agora: AGORA }).filter((x) => x.candidato.plataforma === "instagram").length
    );
  });
});

describe("rankear — janela sazonal", () => {
  it("cíclico dentro da própria janela é impulsionado; fora dela, não", () => {
    const base = TODOS.map((c) =>
      c.plataform_id === TOP_RATIO ? { ...c, timing_classe: "ciclico" as const } : c
    );
    const dentro = base.map((c) =>
      c.plataform_id === TOP_RATIO ? { ...c, janela_sazonal: "agosto" } : c
    );
    const pega = (cs: CandidatoRankeavel[]) =>
      rankear(cs, { agora: AGORA }).find((x) => x.candidato.plataform_id === TOP_RATIO)!.decay;

    expect(pega(dentro)).toBeCloseTo(pega(base) * 1.5, 5); // AGORA está em agosto
  });
});
