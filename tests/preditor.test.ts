import { describe, expect, it, vi } from "vitest";
// só as funções puras: o banco nunca é tocado aqui
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));
import { featuresDoTexto, prever, rotularVideos, vizinhosDe, type Features, type Rotulo } from "@/lib/preditor";
import { marcasDoHook } from "@/lib/preditor/hook";

// Vídeos reais do teste do estudo (data/preditor_features_openai.json). `p` é a nota do modelo
// offline (prever de docs/preditor-2026-10/src/modelo.mjs com modelo_openai.json), com o hk
// do arquivo. Aqui o hk sai do catálogo portado, a partir do texto do hook.
const CASOS: { p: number; f: Omit<Features, "hk"> & { hook: string } }[] = [
  {
    p: 0.146772228723891,
    f: { knn20: 0.11666666666666667, sim_media: 0.6869414822464532, n_casa: 5, casa_taxa: 0.13, n_cli: 0, cli_taxa: 0.26, rep_acerto: 0, rep_acerto_90: 0, rep_fraco: 0, fora_fraco: 1, fora_acerto: 0, cli90: 0.26, cli_tend: 0, terr_c30: 0.16288659793814433, terr_c60: 0.14626865671641792, modo: "historia", ancora: "passado", hook: "Em 2015, um indiano comprou acidentalmente o Google por 12 dólares." },
  },
  {
    p: 0.2506408811964736,
    f: { knn20: 0.3166666666666667, sim_media: 0.5101149465620874, n_casa: 0, casa_taxa: 0.26, n_cli: 0, cli_taxa: 0.26, rep_acerto: 0, rep_acerto_90: 0, rep_fraco: 0, fora_fraco: 0, fora_acerto: 0, cli90: 0.26, cli_tend: 0, terr_c30: 0.28852459016393445, terr_c60: 0.16, modo: "historia", ancora: "passado", hook: "Ela recusou o homem mais famoso do mundo e faturou 10 milhões de dólares." },
  },
  {
    p: 0.5019419389010019,
    f: { knn20: 0.35, sim_media: 0.7579871778203398, n_casa: 16, casa_taxa: 0.32380952380952377, n_cli: 0, cli_taxa: 0.26, rep_acerto: 0, rep_acerto_90: 0, rep_fraco: 0, fora_fraco: 1, fora_acerto: 1, cli90: 0.21724137931034482, cli_tend: 0.21739130434782608, terr_c30: 0.2155844155844156, terr_c60: 0.24835164835164836, modo: "mecanismo", ancora: "atemporal", hook: "Nem a Coca-Cola conseguiu derrubar esse refrigerante no Nordeste. Mas bastou ele tentar atravessar uma divisa pro problema começar." },
  },
];

describe("preditor v0 (sombra)", () => {
  it("dá a mesma nota do modelo offline", () => {
    for (const { p, f } of CASOS) expect(prever({ ...f, hk: marcasDoHook(f.hook) })).toBeCloseTo(p, 9);
  });

  it("agrupa documentos por roteiro e só conta vídeo maduro", () => {
    const r = (video_id: string, script_id: string, plataforma: string, data: string, pq: number | null): Rotulo => ({ video_id, script_id, cliente_id: "c", plataforma, data, pq });
    const rotulos = [
      r("v1", "S1", "Instagram", "2026-05-01", 0.9),
      r("v2", "S1", "TikTok", "2026-05-02", 0.5),
      r("v4", "S1", "YouTube", "2026-05-03", null), // sem medida: só liga o documento ao roteiro
      r("v3", "S2", "Instagram", "2026-10-10", 0.2), // depois do corte
    ];
    const docs = [{ video_id: "v4", similarity: 0.8 }, { video_id: "v2", similarity: 0.78 }, { video_id: "v3", similarity: 0.7 }];
    expect(vizinhosDe(docs, rotulos, "2026-09-23")).toEqual([{ script_id: "S1", cliente_id: "c", sim: 0.8, topo: 0.5, pq: 0.7, data: "2026-05-02" }]);
  });

  it("tema e repetição seguem features.mjs", () => {
    const viz = [
      { script_id: "A", cliente_id: "c", sim: 0.8, topo: 1, pq: 0.9, data: "2026-05-01" },
      { script_id: "B", cliente_id: "x", sim: 0.7, topo: 0, pq: 0.2, data: "2026-09-01" },
      { script_id: "C", cliente_id: "c", sim: 0.6, topo: 0, pq: 0.5, data: "2026-09-01" },
    ];
    const f = featuresDoTexto(viz, "c", "2026-10-23");
    expect(f.knn20).toBeCloseTo(1 / 3);
    expect(f.sim_media).toBeCloseTo(0.7);
    expect([f.n_casa, f.n_cli]).toEqual([2, 1]);
    expect(f.casa_taxa).toBeCloseTo((1 + 5 * 0.26) / 7);
    expect(f.cli_taxa).toBeCloseTo((1 + 3 * 0.26) / 4);
    expect([f.rep_acerto, f.rep_acerto_90, f.rep_fraco, f.fora_fraco, f.fora_acerto]).toEqual([1, 1, 0, 1, 0]);
  });

  it("rótulo: percentil no trimestre, e estrato pequeno fica sem", () => {
    const fato = Array.from({ length: 9 }, (_, i) => ({ video_id: `v${i}`, cliente_id: "c", plataforma: "Instagram", data_publicacao: "2026-08-0" + (i + 1), coeficiente_viral: i, views_total: 100, maturando: false }));
    fato.push({ video_id: "z", cliente_id: "c", plataforma: "TikTok", data_publicacao: "2026-08-01", coeficiente_viral: 3, views_total: 100, maturando: false });
    const videos = fato.map((f) => ({ id: f.video_id, crm_script_id: "S", is_repost: false }));
    const out = new Map(rotularVideos(fato, videos).map((r) => [r.video_id, r.pq]));
    expect(out.get("v0")).toBe(0);
    expect(out.get("v8")).toBe(1);
    expect(out.get("v4")).toBe(0.5);
    expect(out.get("z")).toBeNull(); // TikTok com 1 vídeo: sem quartil
  });
});
