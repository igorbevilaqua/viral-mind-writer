import { describe, expect, it, vi } from "vitest";
// só a parte pura: o banco nunca é tocado aqui
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {} }));
import { faixaDaChance, rankearReferencias, resumir } from "@/lib/preditor/avaliador";
import type { Rotulo } from "@/lib/preditor";

const r = (video_id: string, script_id: string, pq: number | null, cliente_id = "c", data = "2026-06-01", plataforma = "Instagram"): Rotulo => ({ video_id, script_id, cliente_id, plataforma, data, pq });

describe("avaliador de pauta", () => {
  it("faixa nunca passa de '40% ou mais'", () => {
    expect([0.1, 0.15, 0.249, 0.25, 0.39, 0.4, 0.9].map(faixaDaChance)).toEqual([
      "abaixo de 15%", "15 a 25%", "15 a 25%", "25 a 40%", "25 a 40%", "40% ou mais", "40% ou mais",
    ]);
  });

  it("com menos de 5 vídeos parecidos não mostra faixa", () => {
    const base = { vizHoje: [], clienteId: "c", hoje: "2026-10-23", corte: "2026-09-23", modos: new Map(), chance: 0.3 };
    const viz = [{ script_id: "A", cliente_id: "x", sim: 0.6, topo: 0.5, pq: 0.6, data: "2026-06-01" }];
    const quatro = [r("1", "A", 0.8), r("2", "A", 0.2), r("3", "A", 0.5), r("4", "A", 0.9)];
    expect(resumir({ ...base, vizCorte: viz, rotulos: quatro })).toMatchObject({ n: 4, topo: 2, faixa: null });
    expect(resumir({ ...base, vizCorte: viz, rotulos: [...quatro, r("5", "A", 0.1)] })).toMatchObject({ n: 5, faixa: "25 a 40%" });
    // vizinho abaixo do corte de parecido não conta
    expect(resumir({ ...base, vizCorte: [{ ...viz[0], sim: 0.5 }], rotulos: quatro }).n).toBe(0);
  });

  it("referência: só topo, uma por roteiro, do maior pq", () => {
    const vs = [r("a1", "A", 0.8), r("a2", "A", 0.95), r("b1", "B", 0.9), r("c1", "C", 0.5), r("d1", "D", 0.76), r("e1", "E", 0.99)];
    const sim = new Map([["A", 0.6], ["B", 0.7], ["D", 0.65], ["E", 0.56]]);
    expect(rankearReferencias(vs, sim).map((x) => x.video_id)).toEqual(["e1", "a2", "b1"]);
  });
});
