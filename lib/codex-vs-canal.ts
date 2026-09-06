// Fase 4 do plano 020 (WP-J): o Codex melhorou depois do corte? Função pura — o ETL grava o
// resultado como insight global `codex_vs_canal` e `study-lift --codex` imprime o mesmo objeto,
// então relatório e prompt nunca divergem. Sem banco, sem LLM.
//
// Unidade = roteiro (mediana dos seus posts maduros), como pré-registrado. `maturando=true`
// fica fora de qualquer coeficiente. Veredito é regra fixa, nunca inventa número.

export const CORTE_FASE4 = "2026-09-06"; // ajustar para a data do deploy do WP-F
/** Mesmo limiar da `classificacao='acerto'` da MV (coef ≥ 1.5), aplicado à unidade roteiro. */
export const ACERTO_MIN = 1.5;
/** Critério de parada do pré-registro: 60 roteiros maduros; abaixo de 30 nem se compara. */
export const N_PARADA = 60;
export const N_MINIMO = 30;
export const ULTIMOS_N = 30;

export interface RoteiroCvc {
  id: string;
  created_at: string;
  hook_mecanismo: string | null;
  estrutura: string | null; // narrativa_escolhida.estrutura ("C1. O Iconoclasta")
  fewshot_escopo: string | null; // proveniencia.blocos.few_shot.escopo
}
export interface MatchCvc {
  script_id: string;
  video_id: string;
}
export interface FatoCvc {
  video_id: string;
  coeficiente_viral: number | null;
  maturando: boolean | null;
}

export interface Resumo {
  n_roteiros: number; // roteiros casados com ≥1 post maduro (é o n do critério de parada)
  n_videos: number; // posts maduros desses roteiros
  coef_mediano: number | null;
  pct_acerto: number | null; // fração de roteiros com coef_mediano ≥ ACERTO_MIN
}
export interface Processo {
  n: number;
  top_mecanismo: string | null;
  share_top_mecanismo: number | null;
  estruturas_distintas: number;
  fewshot_cliente_pct: number | null;
}
export interface CodexVsCanal {
  titulo: string;
  descricao: string;
  corte: string;
  semanas: (Resumo & { semana: string })[];
  pre: Resumo & Processo;
  pos: Resumo & Processo;
  processo: { ultimos_30: Processo };
  veredito: string;
}

const r2 = (x: number) => Math.round(x * 100) / 100;
const mediana = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Segunda-feira ISO (UTC) da data — `created_at` é timestamptz, o dia em UTC basta para agrupar. */
export function semanaIso(iso: string): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function resumo(coefs: (number | null)[], nVideos: number): Resumo {
  const cs = coefs.filter((c): c is number => c != null);
  return {
    n_roteiros: cs.length,
    n_videos: nVideos,
    coef_mediano: cs.length ? r2(mediana(cs)) : null,
    pct_acerto: cs.length ? r2(cs.filter((c) => c >= ACERTO_MIN).length / cs.length) : null,
  };
}

export function processo(rs: RoteiroCvc[]): Processo {
  const cont = new Map<string, number>();
  for (const r of rs) if (r.hook_mecanismo) cont.set(r.hook_mecanismo, (cont.get(r.hook_mecanismo) ?? 0) + 1);
  const top = [...cont].sort((a, b) => b[1] - a[1])[0];
  const comHook = [...cont.values()].reduce((a, b) => a + b, 0);
  const comEscopo = rs.filter((r) => r.fewshot_escopo);
  return {
    n: rs.length,
    top_mecanismo: top?.[0] ?? null,
    share_top_mecanismo: top ? r2(top[1] / comHook) : null,
    // 2 primeiros chars = código da estrutura ("C1"); o resto é título e variações do LLM.
    estruturas_distintas: new Set(rs.map((r) => r.estrutura?.slice(0, 2)).filter(Boolean)).size,
    fewshot_cliente_pct: comEscopo.length ? r2(comEscopo.filter((r) => r.fewshot_escopo === "cliente").length / comEscopo.length) : null,
  };
}

export function veredito(pre: Resumo, pos: Resumo): string {
  if (pos.n_roteiros < N_MINIMO || pre.coef_mediano == null || pos.coef_mediano == null)
    return `sem dado suficiente (n=${pos.n_roteiros} de ${N_PARADA})`;
  const razao = pos.coef_mediano / pre.coef_mediano;
  if (razao >= 1.15 && (pos.pct_acerto ?? 0) >= (pre.pct_acerto ?? 0)) return "melhorou";
  if (razao <= 0.87) return "piorou";
  return "sem mudança detectável";
}

const pct = (x: number | null) => (x == null ? "–" : `${Math.round(x * 100)}%`);
const fmtResumo = (r: Resumo) => (r.n_roteiros ? `n=${r.n_roteiros} coef ${r.coef_mediano} acerto ${pct(r.pct_acerto)}` : "n=0");

export function codexVsCanal(roteiros: RoteiroCvc[], matches: MatchCvc[], fatos: FatoCvc[], corte = CORTE_FASE4): CodexVsCanal {
  const fatoPorVideo = new Map(fatos.map((f) => [f.video_id, f]));
  // coef do roteiro = mediana dos posts maduros que estão na MV; sem post maduro → null
  const porRoteiro = new Map<string, number[]>();
  for (const m of matches) {
    const f = fatoPorVideo.get(m.video_id);
    if (!f || f.maturando || f.coeficiente_viral == null) continue;
    porRoteiro.set(m.script_id, [...(porRoteiro.get(m.script_id) ?? []), f.coeficiente_viral]);
  }
  const casados = roteiros.filter((r) => porRoteiro.has(r.id));
  const agrupar = (rs: RoteiroCvc[]): Resumo => {
    const posts = rs.map((r) => porRoteiro.get(r.id)!);
    return resumo(posts.map(mediana), posts.reduce((s, p) => s + p.length, 0));
  };

  const porSemana = new Map<string, RoteiroCvc[]>();
  for (const r of casados) porSemana.set(semanaIso(r.created_at), [...(porSemana.get(semanaIso(r.created_at)) ?? []), r]);
  const semanas = [...porSemana]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semana, rs]) => ({ semana, ...agrupar(rs) }));

  // pré/pós pelo created_at do ROTEIRO vs corte (prefixo ISO compara como string)
  const antes = (r: RoteiroCvc) => r.created_at.slice(0, 10) < corte;
  const pre = { ...agrupar(casados.filter(antes)), ...processo(roteiros.filter(antes)) };
  const pos = { ...agrupar(casados.filter((r) => !antes(r))), ...processo(roteiros.filter((r) => !antes(r))) };
  const ultimos = [...roteiros].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, ULTIMOS_N);
  const v = veredito(pre, pos);

  return {
    // titulo/descricao primeiro: formatInsightsForDados imprime globais como JSON cortado em
    // 160 chars — é o que o agente Dados vai ler.
    titulo: `Codex vs canal (corte ${corte})`,
    descricao: `pré ${fmtResumo(pre)} · pós ${fmtResumo(pos)} · ${v}`,
    corte,
    semanas,
    pre,
    pos,
    processo: { ultimos_30: processo(ultimos) },
    veredito: v,
  };
}
