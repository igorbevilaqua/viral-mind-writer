import { describe, expect, test } from "vitest";
import { codexVsCanal, processo, semanaIso, veredito, type FatoCvc, type MatchCvc, type RoteiroCvc } from "@/lib/codex-vs-canal";

// WP-J (plano 020): o veredito é regra pré-registrada — estes testes fixam a regra.

const CORTE = "2026-09-06";
const rot = (id: string, created_at: string, extra: Partial<RoteiroCvc> = {}): RoteiroCvc => ({
  id,
  created_at,
  hook_mecanismo: "Contraste Extremo",
  estrutura: "C1. O Iconoclasta",
  fewshot_escopo: null,
  ...extra,
});
const fato = (video_id: string, coeficiente_viral: number | null, maturando = false): FatoCvc => ({ video_id, coeficiente_viral, maturando });

// n roteiros, cada um com 1 post de coeficiente `coef` (ou função do índice), a partir de `dia`
function lote(prefix: string, n: number, dia: string, coef: (i: number) => number) {
  const roteiros: RoteiroCvc[] = [];
  const matches: MatchCvc[] = [];
  const fatos: FatoCvc[] = [];
  for (let i = 0; i < n; i++) {
    roteiros.push(rot(`${prefix}${i}`, `${dia}T12:00:00Z`));
    matches.push({ script_id: `${prefix}${i}`, video_id: `v${prefix}${i}` });
    fatos.push(fato(`v${prefix}${i}`, coef(i)));
  }
  return { roteiros, matches, fatos };
}
const juntar = (...ls: ReturnType<typeof lote>[]) => ({
  roteiros: ls.flatMap((l) => l.roteiros),
  matches: ls.flatMap((l) => l.matches),
  fatos: ls.flatMap((l) => l.fatos),
});

describe("semanaIso", () => {
  test("segunda-feira ISO em UTC", () => {
    expect(semanaIso("2026-09-06T12:00:00Z")).toBe("2026-08-31"); // domingo → segunda anterior
    expect(semanaIso("2026-08-31T00:00:00Z")).toBe("2026-08-31"); // segunda é ela mesma
    expect(semanaIso("2026-09-01T23:59:00Z")).toBe("2026-08-31");
    expect(semanaIso("2026-09-07T00:00:00Z")).toBe("2026-09-07");
  });
});

describe("veredito (regra fixa)", () => {
  const r = (n_roteiros: number, coef_mediano: number | null, pct_acerto: number | null) => ({ n_roteiros, n_videos: n_roteiros, coef_mediano, pct_acerto });
  test("n_pos < 30: sem dado suficiente, com o n e a meta", () => {
    expect(veredito(r(14, 5.85, 0.64), r(12, 20, 0.9))).toBe("sem dado suficiente (n=12 de 60)");
    expect(veredito(r(14, 5.85, 0.64), r(0, null, null))).toBe("sem dado suficiente (n=0 de 60)");
  });
  test("≥1.15× e acerto não caiu: melhorou", () => {
    expect(veredito(r(14, 2, 0.5), r(30, 2.3, 0.5))).toBe("melhorou");
  });
  test("≥1.15× mas acerto caiu: sem mudança detectável", () => {
    expect(veredito(r(14, 2, 0.6), r(30, 2.4, 0.5))).toBe("sem mudança detectável");
  });
  test("≤0.87×: piorou", () => {
    expect(veredito(r(14, 2, 0.5), r(30, 1.74, 0.9))).toBe("piorou");
  });
  test("entre 0.87× e 1.15×: sem mudança detectável", () => {
    expect(veredito(r(14, 2, 0.5), r(30, 2.1, 0.5))).toBe("sem mudança detectável");
    expect(veredito(r(14, 2, 0.5), r(30, 1.8, 0.5))).toBe("sem mudança detectável");
  });
  test("sem pré: sem dado suficiente", () => {
    expect(veredito(r(0, null, null), r(40, 2, 0.5))).toBe("sem dado suficiente (n=40 de 60)");
  });
});

describe("codexVsCanal", () => {
  test("pré/pós pelo created_at do roteiro vs corte; mediana por roteiro; acerto ≥ 1.5", () => {
    const pre = lote("p", 4, "2026-08-20", (i) => [1, 1, 2, 3][i]); // mediana 1.5, acerto 2/4
    const pos = lote("q", 30, "2026-09-10", () => 3); // ≥1.15× e acerto 100%
    const out = codexVsCanal(...Object.values(juntar(pre, pos)) as [RoteiroCvc[], MatchCvc[], FatoCvc[]], CORTE);
    expect(out.corte).toBe(CORTE);
    expect(out.pre).toMatchObject({ n_roteiros: 4, n_videos: 4, coef_mediano: 1.5, pct_acerto: 0.5 });
    expect(out.pos).toMatchObject({ n_roteiros: 30, n_videos: 30, coef_mediano: 3, pct_acerto: 1 });
    expect(out.veredito).toBe("melhorou");
    expect(out.descricao).toContain("melhorou");
    expect(out.titulo).toContain(CORTE);
  });

  test("roteiro criado no dia do corte é pós", () => {
    const r = lote("c", 1, CORTE, () => 2);
    const out = codexVsCanal(r.roteiros, r.matches, r.fatos, CORTE);
    expect(out.pos.n_roteiros).toBe(1);
    expect(out.pre.n_roteiros).toBe(0);
  });

  test("maturando fica fora do coeficiente (e do n), vídeo fora da MV também", () => {
    const roteiros = [rot("a", "2026-08-20T10:00:00Z"), rot("b", "2026-08-21T10:00:00Z")];
    const matches: MatchCvc[] = [
      { script_id: "a", video_id: "v1" },
      { script_id: "a", video_id: "v2" }, // maturando
      { script_id: "a", video_id: "v3" }, // fora da MV
      { script_id: "b", video_id: "v4" }, // só maturando → roteiro b não conta
    ];
    const fatos = [fato("v1", 2), fato("v2", 900, true), fato("v4", 50, true)];
    const out = codexVsCanal(roteiros, matches, fatos, CORTE);
    expect(out.pre).toMatchObject({ n_roteiros: 1, n_videos: 1, coef_mediano: 2, pct_acerto: 1 });
    // processo conta todos os gerados, casados ou não
    expect(out.pre.n).toBe(2);
    expect(out.veredito).toBe("sem dado suficiente (n=0 de 60)");
  });

  test("um roteiro com vários posts entra uma vez, pela mediana dos posts", () => {
    const roteiros = [rot("a", "2026-08-20T10:00:00Z")];
    const matches = [
      { script_id: "a", video_id: "v1" },
      { script_id: "a", video_id: "v2" },
      { script_id: "a", video_id: "v3" },
    ];
    const out = codexVsCanal(roteiros, matches, [fato("v1", 1), fato("v2", 100), fato("v3", 4)], CORTE);
    expect(out.pre).toMatchObject({ n_roteiros: 1, n_videos: 3, coef_mediano: 4 });
  });

  test("semanas: segunda ISO, ordenadas, só roteiros casados com post maduro", () => {
    const roteiros = [
      rot("a", "2026-08-19T10:00:00Z"), // semana 2026-08-17
      rot("b", "2026-08-30T10:00:00Z"), // domingo → semana 2026-08-24
      rot("c", "2026-08-31T10:00:00Z"), // segunda → semana 2026-08-31
      rot("d", "2026-08-31T10:00:00Z"), // sem casamento: fora das semanas
    ];
    const matches = [
      { script_id: "a", video_id: "va" },
      { script_id: "b", video_id: "vb" },
      { script_id: "c", video_id: "vc" },
    ];
    const out = codexVsCanal(roteiros, matches, [fato("va", 1), fato("vb", 2), fato("vc", 3)], CORTE);
    expect(out.semanas).toEqual([
      { semana: "2026-08-17", n_roteiros: 1, n_videos: 1, coef_mediano: 1, pct_acerto: 0 },
      { semana: "2026-08-24", n_roteiros: 1, n_videos: 1, coef_mediano: 2, pct_acerto: 1 },
      { semana: "2026-08-31", n_roteiros: 1, n_videos: 1, coef_mediano: 3, pct_acerto: 1 },
    ]);
  });

  test("processo.ultimos_30: os 30 mais recentes, independe de casamento", () => {
    const antigos = Array.from({ length: 20 }, (_, i) => rot(`old${i}`, `2026-07-${String(i + 1).padStart(2, "0")}T10:00:00Z`, { hook_mecanismo: "Urgência" }));
    const recentes = Array.from({ length: 30 }, (_, i) =>
      rot(`new${i}`, `2026-08-${String(i + 1).padStart(2, "0")}T10:00:00Z`, {
        hook_mecanismo: i < 18 ? "Contraste Extremo" : i < 27 ? "Revelação Secreta" : null,
        estrutura: ["C1. O Iconoclasta", "C1. Iconoclasta (variante)", "A3. Herói Esquecido", "B1. Davi e Golias", null][i % 5],
        fewshot_escopo: i < 10 ? "cliente" : i < 20 ? "global" : null,
      })
    );
    const out = codexVsCanal([...antigos, ...recentes], [], [], CORTE);
    const p = out.processo.ultimos_30;
    expect(p.n).toBe(30);
    expect(p.top_mecanismo).toBe("Contraste Extremo");
    expect(p.share_top_mecanismo).toBe(0.67); // 18 de 27 com mecanismo
    expect(p.estruturas_distintas).toBe(3); // C1, A3, B1 — pelos 2 primeiros chars
    expect(p.fewshot_cliente_pct).toBe(0.5); // 10 de 20 com escopo registrado
  });

  test("processo vazio não inventa número", () => {
    expect(processo([])).toEqual({ n: 0, top_mecanismo: null, share_top_mecanismo: null, estruturas_distintas: 0, fewshot_cliente_pct: null });
  });
});
