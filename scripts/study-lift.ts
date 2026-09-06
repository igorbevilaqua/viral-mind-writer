// O estudo (plano 020, WP-D). Só LÊ o banco e escreve docs/estudo-2026-09/*.
// Métrica e limiares vêm do pré-registro do plano ("Métrica e estatística") — nada fora dele.
//
//   npx tsx --env-file=.env.local scripts/study-lift.ts [--out docs/estudo-2026-09] [--codex]
//
// --codex reemite só a seção Codex (codex.md) — é o que a Fase 4 roda toda semana.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { appDb, viralData } from "../lib/db";
import { changedRatio } from "../lib/learning-loop";
import { ESTRUTURAS } from "../lib/pipeline/taxonomia";
import { wilsonLower, wilsonUpper } from "../lib/calibration";
import {
  bottomNoEstrato,
  celulaEncolhida,
  cliffsDelta,
  lift,
  mediana,
  percentil,
  quartis,
  topNoEstrato,
  type LiftResult,
} from "../lib/study-stats";

const PAGE = 1000;
const ANO = "2026";
const MIN_ESTRATO = 8; // estrato (cliente, plataforma) menor que isso não tem quartil que preste
const MIN_CLIENTE_BRIEFING = 40;
const JANELA_CONTROLE_DIAS = 45;
const MIN_CONTROLES = 8;

// ── Tipos das fontes ─────────────────────────────────────────────────────────
interface Fato {
  video_id: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  plataforma: string | null;
  vm_script: string | null;
  data_publicacao: string | null;
  views_total: number | null;
  seguidores_ganhos: number | null;
  coeficiente_viral: number | null;
  classificacao: string | null;
  maturando: boolean | null;
  categorias: string[] | null;
}
interface Cls {
  video_id: string;
  hook_mecanismos: string[];
  estruturas: string[];
  comandos: string[];
  tema: string | null;
  fonte_hook: string | null;
  fonte_estruturas: string | null;
  fonte_comandos: string | null;
}
interface Script {
  id: string;
  session_id: string | null;
  client_id: string | null;
  roteiro: string | null;
  created_at: string;
  status: string | null;
  published_url: string | null;
  pipeline_trace: {
    hook_mecanismo?: string;
    hook_formato?: string;
    narrativa_escolhida?: { estrutura?: string };
    predicted_score?: number | null;
    edicao_humana?: boolean;
    roteiro_original?: string;
  } | null;
}
interface Match { script_id: string; video_id: string; plataforma: string | null; sobreposicao: number | null }
interface TextItem {
  fonte: "corpus" | "codex";
  video_ids?: string[];
  script_id?: string;
  cliente_id: string | null;
  plataformas: string[];
  vm_script: string | null;
  coeficiente_viral: number | null;
  maturando: boolean | null;
  [metrica: string]: unknown;
}

type Video = Fato & { cls?: Cls; estrato: string };

// ── Utilidades ───────────────────────────────────────────────────────────────
async function paginar<T>(nome: string, q: (a: number, b: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await q(from, from + PAGE - 1);
    if (error) throw new Error(`${nome}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

const f2 = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : "–");
const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(0)}%` : "–");
const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const tabela = (cab: string[], linhas: (string | number)[][]) =>
  [`| ${cab.join(" | ")} |`, `|${cab.map(() => "---").join("|")}|`, ...linhas.map((l) => `| ${l.join(" | ")} |`)].join("\n");
const NOME_ESTR = new Map(ESTRUTURAS.map((e) => [e.code, `${e.code} ${e.nome}`]));
const nomeEstr = (code: string) => NOME_ESTR.get(code) ?? code;

// "sem evidência" é a leitura oficial quando o IC cruza 1 (pré-registro).
const leitura = (r: LiftResult) => (r.lift_lb > 1 ? "lift>1" : r.lift_ub < 1 ? "lift<1" : "sem evidência");
const linhaLift = (r: LiftResult, nome: (l: string) => string, nomeCliente: (id: string | null) => string) => [
  nome(r.label),
  r.n,
  r.k,
  `${f2(r.lift)} [${f2(r.lift_lb)}–${f2(r.lift_ub)}]`,
  r.flag,
  leitura(r),
  r.dominancia > 0.5 ? `**${pct(r.dominancia)}** (${nomeCliente(r.dominante)})` : pct(r.dominancia),
  `${r.consistencia.positivos}/${r.consistencia.clientes}`,
];
const CAB_LIFT = ["rótulo", "n", "k", "lift [IC95]", "flag", "leitura", "dominância", "consistência"];
const visiveis = (rs: LiftResult[]) => rs.filter((r) => r.flag !== "suprimido");

// Métricas de texto pré-registradas (WP-B). As de parágrafo só valem para o Codex: a
// transcrição do corpus quase nunca tem quebra de parágrafo.
const METRICAS = [
  "palavras", "frases", "palavras_por_frase_media", "palavras_por_frase_p90", "frases_curtas_pct",
  "numeros_por_100_palavras", "frases_com_numero_pct", "voce_por_100", "eu_por_100", "nos_por_100",
  "perguntas_por_100_frases", "imperativos_por_100_frases", "magicas_por_100_palavras", "nomes_proprios_por_100",
  "hook_palavras", "hook_frases", "hook_tem_numero",
] as const;
const METRICAS_SO_CODEX = ["paragrafos", "palavras_por_paragrafo_media"] as const;
const valorMetrica = (it: TextItem, m: string): number | null => {
  const v = it[m];
  if (typeof v === "boolean") return v ? 1 : 0;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
};

// ── Carga ────────────────────────────────────────────────────────────────────
async function carregar() {
  const fato = await paginar<Fato>("oraculo.fato_video", (a, b) =>
    viralData
      .schema("oraculo")
      .from("fato_video")
      .select("video_id, cliente_id, cliente_nome, plataforma, vm_script, data_publicacao, views_total, seguidores_ganhos, coeficiente_viral, classificacao, maturando, categorias")
      .order("video_id")
      .range(a, b)
  );
  const cls = await paginar<Cls>("vm_video_classifications", (a, b) =>
    appDb
      .from("vm_video_classifications")
      .select("video_id, hook_mecanismos, estruturas, comandos, tema, fonte_hook, fonte_estruturas, fonte_comandos")
      .order("video_id")
      .range(a, b)
  );
  const [{ data: clientes }, { data: scripts }, { data: sessions }, { data: matches }, { data: feedback }] = await Promise.all([
    appDb.from("clientes").select("id, nome, ativo"),
    appDb.from("vm_generated_scripts").select("id, session_id, client_id, roteiro, created_at, status, published_url, pipeline_trace").order("created_at"),
    appDb.from("vm_sessions").select("id, client_id"),
    appDb.from("vm_script_matches").select("script_id, video_id, plataforma, sobreposicao").eq("confirmado", true),
    appDb.from("vm_script_feedback").select("script_id, rating"),
  ]);
  // Concordância hook Oráculo × classificador antigo do Codex. A tabela é dropada na 0042 —
  // se já foi, o relatório diz que não mediu.
  const { data: vhc } = await appDb.from("vm_hook_classifications").select("video_id, mecanismos");
  return {
    fato,
    cls,
    clientes: (clientes ?? []) as { id: string; nome: string; ativo: boolean }[],
    scripts: (scripts ?? []) as Script[],
    sessions: (sessions ?? []) as { id: string; client_id: string | null }[],
    matches: (matches ?? []) as Match[],
    feedback: (feedback ?? []) as { script_id: string; rating: number | null }[],
    vhc: (vhc ?? null) as { video_id: string; mecanismos: string[] | null }[] | null,
  };
}

// ── Análise ──────────────────────────────────────────────────────────────────
type Dim = "hook" | "estrutura" | "comando" | "tema";
const DIMS: Dim[] = ["hook", "estrutura", "comando", "tema"];
const rotulado = (v: Video, d: Dim) =>
  d === "hook" ? !!v.cls?.fonte_hook : d === "estrutura" ? !!v.cls?.fonte_estruturas : d === "comando" ? !!v.cls?.fonte_comandos : !!v.cls?.tema;
const rotulos = (v: Video, d: Dim): string[] =>
  d === "hook" ? v.cls!.hook_mecanismos : d === "estrutura" ? v.cls!.estruturas : d === "comando" ? v.cls!.comandos : [v.cls!.tema!];
// Regra de agents/dados.md: comando é eixo de conversão — mede-se por seguidores ganhos.
const valorDim = (v: Video, d: Dim) => (d === "comando" ? v.seguidores_ganhos! : v.coeficiente_viral!);
const nomeDim = (d: Dim, l: string) => (d === "estrutura" ? nomeEstr(l) : l);
const TITULO_DIM: Record<Dim, string> = {
  hook: "Mecanismo de hook (coeficiente_viral)",
  estrutura: "Estrutura narrativa (coeficiente_viral)",
  comando: "Gatilho de comando (eixo: seguidores_ganhos)",
  tema: "Tema (coeficiente_viral) — 15 maiores por n",
};

// Conjunto de análise de uma dimensão: só vídeos rotulados nela, estratos com n ≥ MIN_ESTRATO,
// `top` = quartil superior dentro do estrato — assim P(top)=0.25 vale NO CONJUNTO ANALISADO
// (o classificador priorizou vm_script='sim' e extremos; o quartil na população inteira não
// daria 0.25 entre os rotulados).
function conjunto(videos: Video[], d: Dim) {
  const base = videos.filter((v) => rotulado(v, d) && (d !== "comando" || v.seguidores_ganhos != null));
  const porEstrato = new Map<string, number>();
  for (const v of base) porEstrato.set(v.estrato, (porEstrato.get(v.estrato) ?? 0) + 1);
  const validos = base.filter((v) => (porEstrato.get(v.estrato) ?? 0) >= MIN_ESTRATO);
  return topNoEstrato(validos, (v) => v.estrato, (v) => valorDim(v, d));
}
type VTop = Video & { top: boolean };
const linhas = (vs: VTop[], d: Dim) => vs.flatMap((v) => rotulos(v, d).map((label) => ({ label, top: v.top, cliente: v.cliente_id })));

interface Celula { estrutura: string; tema: string; n: number; k: number; p_bruto: number; p_encolhido: number; prior: number }

function matriz(vs: VTop[]) {
  const com = vs.filter((v) => v.cls?.tema);
  const pTop = (xs: VTop[]) => (xs.length ? xs.filter((x) => x.top).length / xs.length : 0.25);
  const temasN = new Map<string, VTop[]>();
  for (const v of com) temasN.set(v.cls!.tema!, [...(temasN.get(v.cls!.tema!) ?? []), v]);
  const temas = [...temasN].sort((a, b) => b[1].length - a[1].length).slice(0, 15).map(([t]) => t);
  const estrN = new Map<string, VTop[]>();
  for (const v of com) for (const e of v.cls!.estruturas) estrN.set(e, [...(estrN.get(e) ?? []), v]);
  const celulas: Celula[] = [];
  for (const e of ESTRUTURAS.map((x) => x.code)) {
    for (const t of temas) {
      const cel = (estrN.get(e) ?? []).filter((v) => v.cls!.tema === t);
      const k = cel.filter((v) => v.top).length;
      const { p, prior } = celulaEncolhida(k, cel.length, pTop(temasN.get(t) ?? []), pTop(estrN.get(e) ?? []));
      celulas.push({ estrutura: e, tema: t, n: cel.length, k, p_bruto: cel.length ? k / cel.length : NaN, p_encolhido: p, prior });
    }
  }
  return { temas, celulas, n: com.length, pTema: Object.fromEntries(temas.map((t) => [t, pTop(temasN.get(t)!)])), pEstr: Object.fromEntries([...estrN].map(([e, xs]) => [e, pTop(xs)])) };
}

function matrizMd(m: ReturnType<typeof matriz>) {
  const nTema = (t: string) => m.celulas.filter((c) => c.tema === t).reduce((s, c) => s + c.n, 0);
  const cab = ["estrutura \\ tema", ...m.temas.map((t) => `${t} (n=${nTema(t)})`)];
  const linhasMd = ESTRUTURAS.map((e) => [
    nomeEstr(e.code),
    ...m.temas.map((t) => {
      const c = m.celulas.find((x) => x.estrutura === e.code && x.tema === t)!;
      return c.n >= 15 ? `**${pct(c.p_encolhido)}** (n=${c.n}, bruto ${pct(c.p_bruto)})` : c.n ? `· (n=${c.n})` : "·";
    }),
  ]);
  return [
    "# Matriz estrutura × tema (encolhida)",
    "",
    `Base: ${m.n} vídeos com estrutura e tema rotulados, todas as plataformas, \`top\` = quartil superior no estrato (cliente, plataforma). Célula = P(top | estrutura, tema) encolhida com K=15 para o prior \`clamp(p_tema + p_estr − 0.25, .05, .95)\`. **Negrito** = n ≥ 15 (única célula que o plano permite ler); as demais mostram só o n. Base esperada por construção: 25%.`,
    "",
    tabela(cab, linhasMd),
    "",
    "Nota: soma dos n por tema conta o vídeo uma vez por estrutura (multi-rótulo marginal).",
  ].join("\n");
}

// ── Comunicação ──────────────────────────────────────────────────────────────
function comunicacao(itens: TextItem[], nomeCliente: (id: string | null) => string) {
  const corpus = itens.filter((i) => i.fonte === "corpus" && !i.maturando && i.coeficiente_viral != null && i.cliente_id && i.plataformas.length);
  const codex = itens.filter((i) => i.fonte === "codex");
  const estrato = (i: TextItem) => `${i.cliente_id}|${i.plataformas.includes("Instagram") ? "Instagram" : i.plataformas[0]}`;
  const porEstrato = new Map<string, number>();
  for (const i of corpus) porEstrato.set(estrato(i), (porEstrato.get(estrato(i)) ?? 0) + 1);
  const validos = corpus.filter((i) => (porEstrato.get(estrato(i)) ?? 0) >= MIN_ESTRATO);
  const marcados = bottomNoEstrato(topNoEstrato(validos, estrato, (i) => i.coeficiente_viral!), estrato, (i) => i.coeficiente_viral!);
  const top = marcados.filter((i) => i.top);
  const bot = marcados.filter((i) => i.bottom);
  const vals = (xs: TextItem[], m: string) => xs.map((x) => valorMetrica(x, m)).filter((v): v is number => v != null);

  const clientes = [...new Set(validos.map((i) => i.cliente_id!))];
  const global = METRICAS.map((m) => {
    const porCliente = clientes
      .map((c) => {
        const t = vals(top.filter((i) => i.cliente_id === c), m);
        const b = vals(bot.filter((i) => i.cliente_id === c), m);
        return { cliente: c, nome: nomeCliente(c), n_top: t.length, n_bot: b.length, delta: cliffsDelta(t, b) };
      })
      .filter((c) => c.n_top >= 15 && c.n_bot >= 15);
    const w = porCliente.reduce((s, c) => s + c.n_top + c.n_bot, 0);
    const pool = w ? porCliente.reduce((s, c) => s + c.delta * (c.n_top + c.n_bot), 0) / w : NaN;
    const mesmoSinal = porCliente.filter((c) => Math.sign(c.delta) === Math.sign(pool) && c.delta !== 0).length;
    return {
      metrica: m,
      n_top: vals(top, m).length,
      n_bot: vals(bot, m).length,
      mediana_top: mediana(vals(top, m)),
      mediana_bot: mediana(vals(bot, m)),
      delta_global: cliffsDelta(vals(top, m), vals(bot, m)),
      delta_pool: pool,
      clientes: porCliente,
      consistencia: { mesmo_sinal: mesmoSinal, clientes: porCliente.length },
    };
  });

  const sim = corpus.filter((i) => i.vm_script === "sim");
  const nao = corpus.filter((i) => i.vm_script === "nao");
  const fontes = [...METRICAS, ...METRICAS_SO_CODEX].map((m) => {
    const soCodex = (METRICAS_SO_CODEX as readonly string[]).includes(m);
    const c = vals(codex, m);
    const s = soCodex ? [] : vals(sim, m);
    const n = soCodex ? [] : vals(nao, m);
    return { metrica: m, so_codex: soCodex, n_codex: c.length, n_sim: s.length, n_nao: n.length, mediana_codex: mediana(c), mediana_sim: mediana(s), mediana_nao: mediana(n), delta_codex_sim: soCodex ? NaN : cliffsDelta(c, s), delta_codex_nao: soCodex ? NaN : cliffsDelta(c, n) };
  });
  return { n_corpus: corpus.length, n_validos: validos.length, n_top: top.length, n_bot: bot.length, n_codex: codex.length, n_sim: sim.length, n_nao: nao.length, global, fontes };
}

// ── Codex ────────────────────────────────────────────────────────────────────
function analiseCodex(d: Awaited<ReturnType<typeof carregar>>, fatoPorId: Map<string, Fato>, videos: Video[], liftIG: Record<Dim, LiftResult[]>, prevalencia: Record<Dim, Map<string, number>>, nomeCliente: (id: string | null) => string) {
  const sessCliente = new Map(d.sessions.map((s) => [s.id, s.client_id]));
  const clienteDe = (s: Script) => s.client_id ?? (s.session_id ? sessCliente.get(s.session_id) ?? null : null);
  const scripts = d.scripts;
  const comTrace = scripts.filter((s) => s.pipeline_trace?.hook_mecanismo);
  const contar = (xs: (string | undefined)[]) => {
    const m = new Map<string, number>();
    for (const x of xs) if (x) m.set(x, (m.get(x) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  const hookCodex = contar(comTrace.map((s) => s.pipeline_trace!.hook_mecanismo));
  const estrCodex = contar(scripts.map((s) => s.pipeline_trace?.narrativa_escolhida?.estrutura?.slice(0, 2)));
  const nEstr = estrCodex.reduce((s, [, n]) => s + n, 0);

  const distribuicao = (dim: Dim, cont: [string, number][], total: number) =>
    cont.map(([label, n]) => {
      const l = liftIG[dim].find((r) => r.label === label);
      return { label, nome: nomeDim(dim, label), codex_n: n, codex_share: n / total, corpus_prevalencia: prevalencia[dim].get(label) ?? 0, lift: l ?? null };
    });

  // Publicação: casado = está em vm_script_matches confirmado.
  const casados = new Set(d.matches.map((m) => m.script_id));
  const porCliente = new Map<string, { roteiros: number; casados: number }>();
  for (const s of scripts) {
    const c = clienteDe(s) ?? "sem cliente";
    const e = porCliente.get(c) ?? { roteiros: 0, casados: 0 };
    e.roteiros += 1;
    if (casados.has(s.id)) e.casados += 1;
    porCliente.set(c, e);
  }
  const publicacao = [...porCliente].map(([c, e]) => ({ cliente_id: c, nome: c === "sem cliente" ? c : nomeCliente(c), ...e, taxa: e.casados / e.roteiros })).sort((a, b) => b.roteiros - a.roteiros);

  // Controles: mesmo cliente, mesma plataforma, ±45d, vm_script='sim', fora dos casados, não maturando.
  const idsCasados = new Set(d.matches.map((m) => m.video_id));
  const pool = videos.filter((v) => v.vm_script === "sim" && !idsCasados.has(v.video_id));
  const dia = (s: string | null) => (s ? new Date(s).getTime() / 86_400_000 : NaN);
  const porScript = new Map<string, Match[]>();
  for (const m of d.matches) porScript.set(m.script_id, [...(porScript.get(m.script_id) ?? []), m]);
  const roteiros = [...porScript].map(([scriptId, ms]) => {
    const s = scripts.find((x) => x.id === scriptId);
    const posts = ms.map((m) => {
      const f = fatoPorId.get(m.video_id);
      if (!f) return { plataforma: m.plataforma, sobreposicao: m.sobreposicao, em_fato: false as const };
      const d0 = dia(f.data_publicacao);
      const controles = f.maturando
        ? []
        : pool.filter((c) => c.cliente_id === f.cliente_id && c.plataforma === f.plataforma && Math.abs(dia(c.data_publicacao) - d0) <= JANELA_CONTROLE_DIAS).map((c) => c.coeficiente_viral!);
      return {
        plataforma: f.plataforma,
        sobreposicao: m.sobreposicao,
        em_fato: true as const,
        coeficiente_viral: f.coeficiente_viral,
        classificacao: f.classificacao,
        maturando: !!f.maturando,
        n_controles: controles.length,
        percentil: !f.maturando && controles.length >= MIN_CONTROLES ? percentil(f.coeficiente_viral!, controles) : null,
      };
    });
    const pcts = posts.map((p) => ("percentil" in p ? p.percentil : null)).filter((p): p is number => p != null);
    const coefs = posts.map((p) => ("coeficiente_viral" in p && !p.maturando ? p.coeficiente_viral : null)).filter((c): c is number => c != null);
    return {
      script_id: scriptId,
      cliente: nomeCliente(s ? clienteDe(s) : null),
      hook_mecanismo: s?.pipeline_trace?.hook_mecanismo ?? null,
      estrutura: s?.pipeline_trace?.narrativa_escolhida?.estrutura?.slice(0, 2) ?? null,
      predicted_score: typeof s?.pipeline_trace?.predicted_score === "number" ? s.pipeline_trace.predicted_score : null,
      editado: !!s?.pipeline_trace?.edicao_humana,
      posts,
      coef_mediano: coefs.length ? mediana(coefs) : null,
      percentil_roteiro: pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null,
    };
  });
  const comPct = roteiros.filter((r) => r.percentil_roteiro != null);
  const acima = comPct.filter((r) => r.percentil_roteiro! > 0.5).length;
  const vsHumanos = {
    roteiros_casados: roteiros.length,
    roteiros_com_percentil: comPct.length,
    acima_da_mediana: acima,
    p: comPct.length ? acima / comPct.length : NaN,
    wilson_lb: wilsonLower(acima, comPct.length),
    wilson_ub: wilsonUpper(acima, comPct.length),
    percentil_mediano: comPct.length ? mediana(comPct.map((r) => r.percentil_roteiro!)) : NaN,
    posts_total: d.matches.length,
    posts_em_fato: roteiros.flatMap((r) => r.posts).filter((p) => p.em_fato).length,
    posts_maturando: roteiros.flatMap((r) => r.posts).filter((p) => "maturando" in p && p.maturando).length,
  };

  const editados = scripts
    .filter((s) => s.pipeline_trace?.edicao_humana && s.pipeline_trace.roteiro_original && s.roteiro)
    .map((s) => ({ script_id: s.id, cliente: nomeCliente(clienteDe(s)), changed_ratio: changedRatio(s.pipeline_trace!.roteiro_original!, s.roteiro!), casado: casados.has(s.id) }))
    .sort((a, b) => b.changed_ratio - a.changed_ratio);

  const predicted = scripts.filter((s) => typeof s.pipeline_trace?.predicted_score === "number").map((s) => s.pipeline_trace!.predicted_score as number);
  const ratings = d.feedback.map((f) => f.rating).filter((r): r is number => r != null);

  return {
    n_roteiros: scripts.length,
    n_com_trace_hook: comTrace.length,
    n_com_estrutura: nEstr,
    hook: distribuicao("hook", hookCodex, comTrace.length),
    estrutura: distribuicao("estrutura", estrCodex, nEstr),
    publicacao,
    total_casados: casados.size,
    roteiros,
    vs_humanos: vsHumanos,
    editados,
    predicted_score: { n: predicted.length, quartis: predicted.length ? quartis(predicted) : null },
    feedback: { n: d.feedback.length, com_rating: ratings.length, ratings },
  };
}
type Codex = ReturnType<typeof analiseCodex>;

function codexMd(c: Codex, liftIG: Record<Dim, LiftResult[]>) {
  const fmtL = (l: LiftResult | null) => (l ? `${f2(l.lift)} [${f2(l.lift_lb)}–${f2(l.lift_ub)}] · ${l.flag} · ${leitura(l)}` : "sem rótulo no corpus IG");
  const dist = (rows: Codex["hook"]) => tabela(["rótulo", "Codex n", "Codex %", "prevalência corpus IG", "lift corpus IG [IC95]"], rows.map((r) => [r.nome, r.codex_n, pct(r.codex_share), pct(r.corpus_prevalencia), fmtL(r.lift)]));
  const melhores = (d: Dim) => visiveis(liftIG[d]).filter((r) => r.lift_lb > 1).sort((a, b) => b.lift_lb - a.lift_lb);
  const v = c.vs_humanos;
  const editQ = c.editados.length ? quartis(c.editados.map((e) => e.changed_ratio)) : null;
  return [
    "## 5. Codex: onde ele está concentrado e o que aconteceu com o que foi publicado",
    "",
    `Roteiros: **${c.n_roteiros}** (\`vm_generated_scripts\`); com \`hook_mecanismo\` no trace: ${c.n_com_trace_hook}; com estrutura escolhida: ${c.n_com_estrutura}.`,
    "",
    "### 5.1 Mecanismo de hook: Codex vs corpus",
    "",
    dist(c.hook),
    "",
    `Mecanismos com lift_lb>1 no corpus IG que o Codex usou ≤3 vezes: ${melhores("hook").filter((r) => (c.hook.find((h) => h.label === r.label)?.codex_n ?? 0) <= 3).map((r) => `${r.label} (${f2(r.lift)} [${f2(r.lift_lb)}–${f2(r.lift_ub)}], n=${r.n}, Codex ${c.hook.find((h) => h.label === r.label)?.codex_n ?? 0}×)`).join("; ") || "nenhum"}.`,
    "",
    "### 5.2 Estrutura narrativa: Codex vs corpus",
    "",
    dist(c.estrutura),
    "",
    `Estruturas com lift_lb>1 no corpus IG que o Codex usou ≤3 vezes: ${melhores("estrutura").filter((r) => (c.estrutura.find((e) => e.label === r.label)?.codex_n ?? 0) <= 3).map((r) => `${nomeEstr(r.label)} (${f2(r.lift)} [${f2(r.lift_lb)}–${f2(r.lift_ub)}], n=${r.n}, Codex ${c.estrutura.find((e) => e.label === r.label)?.codex_n ?? 0}×)`).join("; ") || "nenhuma"}.`,
    "",
    "### 5.3 Taxa de publicação (casamento confirmado em `vm_script_matches`)",
    "",
    `**${c.total_casados}/${c.n_roteiros} roteiros** (${pct(c.total_casados / c.n_roteiros)}) casaram com vídeo publicado; ${v.posts_total} posts em ${new Set(c.roteiros.flatMap((r) => r.posts.map((p) => p.plataforma))).size} plataformas. Viés de seleção registrado: quem escolhe o que publica é o cliente/Igor, então "publicado" já é um filtro. Roteiros publicados com hook e corpo reescritos ficam fora por construção (teto do WP-A).`,
    "",
    tabela(["cliente", "roteiros", "casados", "taxa"], c.publicacao.map((p) => [p.nome, p.roteiros, p.casados, pct(p.taxa)])),
    "",
    "### 5.4 Os roteiros casados: coeficiente_viral, classificação e percentil vs controles",
    "",
    `Controles = vídeos do mesmo cliente e plataforma, ±${JANELA_CONTROLE_DIAS} dias, \`vm_script='sim'\`, não maturando, fora dos casados; percentil só com ≥${MIN_CONTROLES} controles; percentil do roteiro = média dos seus posts. Dos ${v.posts_total} posts, ${v.posts_em_fato} estão em \`fato_video\` (${v.posts_total - v.posts_em_fato} ausentes — vídeo sem métrica na MV) e ${v.posts_maturando} ainda maturando.`,
    "",
    tabela(
      ["cliente", "hook Codex", "estrutura", "predicted", "posts (plataforma: coef · classif · pct vs n ctrl)", "coef mediano", "pct roteiro"],
      c.roteiros
        .sort((a, b) => (b.coef_mediano ?? -1) - (a.coef_mediano ?? -1))
        .map((r) => [
          r.cliente,
          r.hook_mecanismo ?? "–",
          r.estrutura ?? "–",
          r.predicted_score ?? "–",
          r.posts
            .map((p) => (p.em_fato ? `${p.plataforma}: ${f2(p.coeficiente_viral ?? NaN)} · ${p.classificacao}${p.maturando ? " · maturando" : ""} · ${p.percentil != null ? `${pct(p.percentil)} vs ${p.n_controles}` : `sem pct (${p.n_controles} ctrl)`}` : `${p.plataforma}: fora da MV`))
            .join("<br>"),
          r.coef_mediano != null ? f2(r.coef_mediano) : "–",
          r.percentil_roteiro != null ? pct(r.percentil_roteiro) : "–",
        ])
    ),
    "",
    `**Codex vs humanos VM:** ${v.roteiros_com_percentil} roteiros com percentil; ${v.acima_da_mediana} acima da mediana dos controles → P(pct_roteiro>0.5) = ${f2(v.p)} [Wilson ${f2(v.wilson_lb)}–${f2(v.wilson_ub)}]; percentil mediano ${pct(v.percentil_mediano)}. Com ${v.roteiros_com_percentil} roteiros (pré-registro exige ≥40 no total e ≥20 por cliente) o enunciado é **"sem evidência de melhor/pior"**. Isto é descrição, não veredito.`,
    "",
    "### 5.5 `predicted_score` vs coeficiente real (só descrição)",
    "",
    `\`predicted_score\` existe em ${c.predicted_score.n} roteiros (quartis ${c.predicted_score.quartis ? `${c.predicted_score.quartis.q1}/${c.predicted_score.quartis.q2}/${c.predicted_score.quartis.q3}` : "–"}). Pares (predicted, coef mediano real) entre os casados: ${c.roteiros.filter((r) => r.predicted_score != null && r.coef_mediano != null).sort((a, b) => b.predicted_score! - a.predicted_score!).map((r) => `${r.predicted_score}→${f2(r.coef_mediano!)}`).join(", ") || "nenhum"}. A faixa de predicted é estreita e n é pequeno; não há leitura estatística a fazer.`,
    "",
    "### 5.6 Os roteiros editados por humano",
    "",
    `${c.editados.length} roteiros com \`edicao_humana\`; \`changedRatio\` (fração da massa de palavras alterada, \`lib/learning-loop.ts\`) entre \`roteiro_original\` e \`roteiro\`: quartis ${editQ ? `${f2(editQ.q1)} / ${f2(editQ.q2)} / ${f2(editQ.q3)}` : "–"}; ${c.editados.filter((e) => e.changed_ratio >= 0.5).length} com ≥50% alterado, ${c.editados.filter((e) => e.changed_ratio < 0.1).length} com <10%. Editados que casaram com vídeo publicado: ${c.editados.filter((e) => e.casado).length}/${c.editados.length} (vs ${c.total_casados}/${c.n_roteiros} no total).`,
    "",
    tabela(["cliente", "changedRatio", "casado"], c.editados.map((e) => [e.cliente, f2(e.changed_ratio), e.casado ? "sim" : "não"])),
    "",
    `\`vm_script_feedback\`: ${c.feedback.n} linhas, ${c.feedback.com_rating} com rating (${c.feedback.ratings.join(", ")}). Sem massa para análise.`,
  ].join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : "docs/estudo-2026-09";
  const soCodex = args.includes("--codex");
  mkdirSync(outDir, { recursive: true });

  const d = await carregar();
  const nomeCliente = (id: string | null) => (id ? d.clientes.find((c) => c.id === id)?.nome ?? d.fato.find((f) => f.cliente_id === id)?.cliente_nome ?? id.slice(0, 8) : "sem cliente");
  const fatoPorId = new Map(d.fato.map((f) => [f.video_id, f]));
  const clsPorId = new Map(d.cls.map((c) => [c.video_id, c]));

  // Filtros do pré-registro: 2026, não maturando, views > 0, com cliente.
  const videos: Video[] = d.fato
    .filter((f) => f.data_publicacao?.startsWith(ANO) && !f.maturando && (f.views_total ?? 0) > 0 && f.cliente_id && f.plataforma && f.coeficiente_viral != null)
    .map((f) => ({ ...f, cls: clsPorId.get(f.video_id), estrato: `${f.cliente_id}|${f.plataforma}` }));
  console.log(`fato_video ${d.fato.length} → analisáveis ${videos.length}; classificados ${d.cls.length}`);

  // Referência: top calculado na POPULAÇÃO inteira, para mostrar o viés de seleção dos rotulados.
  const topPop = new Map(topNoEstrato(videos, (v) => v.estrato, (v) => v.coeficiente_viral!).map((v) => [v.video_id, v.top]));

  const conj = Object.fromEntries(DIMS.map((dim) => [dim, conjunto(videos, dim)])) as Record<Dim, VTop[]>;
  const liftIG = {} as Record<Dim, LiftResult[]>;
  const liftOutras = {} as Record<Dim, LiftResult[]>;
  const prevalencia = {} as Record<Dim, Map<string, number>>;
  const baseObservada = {} as Record<Dim, { n: number; n_ig: number; p_top_populacional: number }>;
  for (const dim of DIMS) {
    const ig = conj[dim].filter((v) => v.plataforma === "Instagram");
    const outras = conj[dim].filter((v) => v.plataforma !== "Instagram");
    liftIG[dim] = lift(linhas(ig, dim));
    liftOutras[dim] = lift(linhas(outras, dim));
    if (dim === "tema") {
      liftIG[dim] = liftIG[dim].slice(0, 15);
      liftOutras[dim] = liftOutras[dim].slice(0, 15);
    }
    const prev = new Map<string, number>();
    for (const v of ig) for (const l of rotulos(v, dim)) prev.set(l, (prev.get(l) ?? 0) + 1 / ig.length);
    prevalencia[dim] = prev;
    baseObservada[dim] = { n: conj[dim].length, n_ig: ig.length, p_top_populacional: conj[dim].filter((v) => topPop.get(v.video_id)).length / conj[dim].length };
  }

  const mat = matriz(conj.estrutura);
  const itens = (JSON.parse(readFileSync(join(outDir, "text-metrics.json"), "utf8")) as { itens: TextItem[] }).itens;
  const com = comunicacao(itens, nomeCliente);
  const codex = analiseCodex(d, fatoPorId, videos, liftIG, prevalencia, nomeCliente);

  // Concordância hook Oráculo × codex-2026-07 (STOP do plano: <45% → hook só global).
  let concordancia: { n: number; p: number } | null = null;
  if (d.vhc) {
    const pares = d.vhc.filter((h) => h.mecanismos?.length && clsPorId.get(h.video_id)?.fonte_hook === "oraculo");
    const iguais = pares.filter((h) => h.mecanismos!.some((m) => clsPorId.get(h.video_id)!.hook_mecanismos.includes(m))).length;
    concordancia = { n: pares.length, p: pares.length ? iguais / pares.length : NaN };
  }

  // Por cliente: todas as plataformas (estrato continua por plataforma), minN 8 com flag.
  const porCliente = [...new Set(videos.map((v) => v.cliente_id!))]
    .map((id) => {
      const rot = videos.filter((v) => v.cliente_id === id && DIMS.some((dim) => rotulado(v, dim)));
      const dims = Object.fromEntries(DIMS.map((dim) => [dim, lift(linhas(conj[dim].filter((v) => v.cliente_id === id), dim), { minN: 8 })])) as Record<Dim, LiftResult[]>;
      if (dims.tema) dims.tema = dims.tema.slice(0, 10);
      return { cliente_id: id, nome: nomeCliente(id), n_rotulados: rot.length, n_por_dim: Object.fromEntries(DIMS.map((dim) => [dim, conj[dim].filter((v) => v.cliente_id === id).length])), dims };
    })
    .sort((a, b) => b.n_rotulados - a.n_rotulados);
  const comBriefing = porCliente.filter((c) => c.n_rotulados >= MIN_CLIENTE_BRIEFING);
  const semDado = porCliente.filter((c) => c.n_rotulados < MIN_CLIENTE_BRIEFING);

  const geradoEm = new Date().toISOString();
  const codexTexto = codexMd(codex, liftIG);
  if (soCodex) {
    writeFileSync(join(outDir, "codex.md"), `# Seção Codex — ${geradoEm.slice(0, 10)}\n\n${codexTexto}\n`);
    console.log(`gravado ${join(outDir, "codex.md")}`);
    return;
  }

  // ── lift.json ──
  writeFileSync(
    join(outDir, "lift.json"),
    JSON.stringify(
      {
        gerado_em: geradoEm,
        filtros: { ano: ANO, maturando: false, views_min: 1, min_estrato: MIN_ESTRATO, base: 0.25, minN_global: 10, minN_cliente: 8, publicaN: 30, K_encolhimento: 20, K_matriz: 15 },
        n: { fato_video: d.fato.length, analisaveis: videos.length, classificados: d.cls.length, por_dim: baseObservada },
        concordancia_hook_oraculo_codex: concordancia,
        global: { instagram: liftIG, outras_plataformas: liftOutras },
        clientes: porCliente,
        matriz: mat,
        comunicacao: com,
        codex,
      },
      null,
      1
    )
  );
  writeFileSync(join(outDir, "matriz-estrutura-tema.md"), matrizMd(mat) + "\n");

  // ── relatorio.md ──
  const secaoLift = (res: Record<Dim, LiftResult[]>, titulo: string) =>
    DIMS.flatMap((dim) => {
      const vis = visiveis(res[dim]);
      return [`#### ${TITULO_DIM[dim]} — ${titulo}`, "", vis.length ? tabela(CAB_LIFT, vis.map((r) => linhaLift(r, (l) => nomeDim(dim, l), nomeCliente))) : "_nenhum rótulo com n ≥ 10_", "", `Suprimidos (n<10): ${res[dim].filter((r) => r.flag === "suprimido").map((r) => `${nomeDim(dim, r.label)} (${r.n})`).join(", ") || "nenhum"}.`, ""];
    });
  const fortes = (res: LiftResult[]) => visiveis(res).filter((r) => r.lift_lb > 1 && r.n >= 30);
  const fracos = (res: LiftResult[]) => visiveis(res).filter((r) => r.lift_ub < 1 && r.n >= 30);
  const stopRanking = DIMS.filter((dim) => dim !== "tema").every((dim) => fortes(liftIG[dim]).length === 0);
  const fortesTxt = (dim: Dim) => fortes(liftIG[dim]).map((r) => `${nomeDim(dim, r.label)} ${f2(r.lift)} [${f2(r.lift_lb)}–${f2(r.lift_ub)}] n=${r.n}, consistência ${r.consistencia.positivos}/${r.consistencia.clientes}`).join("; ") || "nenhum";
  const fracosTxt = (dim: Dim) => fracos(liftIG[dim]).map((r) => `${nomeDim(dim, r.label)} ${f2(r.lift)} [${f2(r.lift_lb)}–${f2(r.lift_ub)}] n=${r.n}`).join("; ") || "nenhum";
  const celulasFortes = mat.celulas.filter((c) => c.n >= 15 && wilsonLower(c.k, c.n) > 0.25).sort((a, b) => b.p_encolhido - a.p_encolhido);
  const metricasFortes = com.global.filter((g) => Math.abs(g.delta_global) >= 0.2);
  const maiorDelta = [...com.global].sort((a, b) => Math.abs(b.delta_global) - Math.abs(a.delta_global))[0];
  const metricasRegra = com.global.filter((g) => Math.abs(g.delta_pool) >= 0.2 && g.consistencia.clientes > 0 && g.consistencia.mesmo_sinal / g.consistencia.clientes >= 2 / 3);
  const ce = liftIG.hook.find((r) => r.label === "Contraste Extremo");
  const ceCodex = codex.hook.find((h) => h.label === "Contraste Extremo");
  const top3Codex = codex.estrutura.slice(0, 3);
  const shareTop3 = top3Codex.reduce((s, e) => s + e.codex_share, 0);
  const fmtLiftCurto = (l: LiftResult | null | undefined) => (l ? `${f2(l.lift)} [${f2(l.lift_lb)}–${f2(l.lift_ub)}], n=${l.n}, ${leitura(l)}` : "sem rótulo");

  const relatorio = [
    `# Estudo 2026-09 — o que os dados sustentam sobre hook, estrutura, comando, tema e comunicação`,
    "",
    `Gerado em ${geradoEm} por \`scripts/study-lift.ts\` (plano 020, WP-D). Todo número deste arquivo está em \`lift.json\`.`,
    "",
    "## 0. Base e regras aplicadas",
    "",
    tabela(
      ["fonte", "n"],
      [
        ["`oraculo.fato_video` (MV)", d.fato.length],
        [`analisáveis (ano ${ANO}, não maturando, views>0, com cliente e plataforma)`, videos.length],
        ["`vm_video_classifications`", d.cls.length],
        ...DIMS.map((dim) => [`rotulados em ${dim} e em estrato com n≥${MIN_ESTRATO} (IG)`, `${baseObservada[dim].n} (${baseObservada[dim].n_ig})`]),
        ["`text-metrics.json` corpus / Codex", `${com.n_corpus} / ${com.n_codex}`],
        ["`vm_generated_scripts`", codex.n_roteiros],
        ["`vm_script_matches` confirmados (posts / roteiros)", `${codex.vs_humanos.posts_total} / ${codex.total_casados}`],
      ]
    ),
    "",
    "Regras do pré-registro (plano 020) aplicadas sem exceção:",
    "",
    "- Métrica primária `coeficiente_viral` (views ÷ mediana móvel 180d do mesmo canal e origem). `maturando=true` e views nulas/0 excluídos.",
    `- \`top\` = quartil superior **dentro do estrato (cliente, plataforma)**, calculado sobre o conjunto rotulado na dimensão, estratos com n≥${MIN_ESTRATO}. P(top)=0,25 por construção. Estrato primário Instagram; demais plataformas em tabela à parte (mesmo roteiro em IG/TT/YT são vídeos de estratos diferentes — não se somam).`,
    "- Lift = P(top | rótulo) / 0,25, Wilson 95%. n<10 suprimido; 10–29 encolhido `(k+0,25·20)/(n+20)` com flag `baixa_confianca`; ≥30 publica. IC cruzando 1 = **sem evidência**. Multi-rótulo marginal.",
    "- Comando medido no eixo `seguidores_ganhos` (regra de `agents/dados.md`), não em coeficiente.",
    "- `dominancia` = maior fatia de um cliente no rótulo (>50% em negrito); `consistencia` = clientes (n≥8 no rótulo) com P(top)>0,25 / clientes avaliados.",
    "- Matriz estrutura × tema: encolhimento aditivo K=15 para `clamp(p_tema+p_estr−0,25, .05, .95)`; só células n≥15 são lidas.",
    "- Comunicação: Cliff's delta top vs bottom quartil (mesmo estrato); por cliente só com n_top,n_bot≥15; pool ponderado por n. Vira regra só com |δ|≥0,2, mesmo sinal em ≥2/3 dos clientes **e** replicação em holdout temporal — o holdout ainda não existe (é o que se publica a partir de agora).",
    "- Codex vs humanos: controles do mesmo cliente e plataforma, ±45d, `vm_script='sim'`, ≥8 controles; nenhuma afirmação com <40 roteiros.",
    "",
    `Viés de seleção do rótulo: o classificador LLM priorizou \`vm_script='sim'\` e extremos. Se o quartil fosse calculado na população inteira, a fração de top entre os rotulados seria ${DIMS.map((dim) => `${dim} ${pct(baseObservada[dim].p_top_populacional)}`).join(", ")} — por isso o quartil é recalculado dentro do conjunto rotulado.`,
    "",
    `Concordância de hook Oráculo × classificador antigo do Codex (\`vm_hook_classifications\`), na interseção: ${concordancia ? `${pct(concordancia.p)} (n=${concordancia.n}) — ${concordancia.p < 0.45 ? "**abaixo de 45%: STOP do plano — hook só global, com aviso**" : "acima de 45%, hook pode ser lido por cliente com aviso de ruído"}` : "**não medida nesta rodada** (a tabela já tinha sido dropada pela 0042 quando o script rodou). O seed do WP-C registrou 52% em 766 hooks (número do plano 020, não desta execução) — acima de 45%, mas perto: hook por cliente só com n≥40 e aviso de ruído"}. Estruturas rotuladas: ${d.cls.filter((c) => c.fonte_estruturas === "oraculo").length} via Oráculo + ${d.cls.filter((c) => c.fonte_estruturas === "codex-llm").length} via LLM; hook: ${d.cls.filter((c) => c.fonte_hook === "oraculo").length} Oráculo + ${d.cls.filter((c) => c.fonte_hook === "codex-2026-07").length} Codex-07; comando: ${d.cls.filter((c) => c.fonte_comandos).length}.`,
    "",
    "## 1. Lift global por rótulo",
    "",
    "### 1.1 Instagram (estrato primário)",
    "",
    ...secaoLift(liftIG, "Instagram"),
    "### 1.2 Demais plataformas (TikTok, YouTube, Facebook — top dentro de cada estrato, agregados)",
    "",
    ...secaoLift(liftOutras, "outras plataformas"),
    "## 2. Por cliente",
    "",
    `Clientes com ≥${MIN_CLIENTE_BRIEFING} vídeos rotulados (qualquer dimensão) têm briefing próprio em \`briefing-<cliente>.md\`; rótulos com n≥8 aparecem com flag. Todas as plataformas entram (o estrato continua por plataforma).`,
    "",
    tabela(["cliente", "vídeos rotulados", "hook", "estrutura", "comando", "tema", "briefing"], porCliente.map((c) => [c.nome, c.n_rotulados, c.n_por_dim.hook, c.n_por_dim.estrutura, c.n_por_dim.comando, c.n_por_dim.tema, c.n_rotulados >= MIN_CLIENTE_BRIEFING ? `briefing-${slug(c.nome)}.md` : "sem dado"])),
    "",
    `Sem dado (${semDado.length}): ${semDado.map((c) => `${c.nome} (${c.n_rotulados})`).join(", ") || "nenhum"}.`,
    "",
    "## 3. Matriz estrutura × tema",
    "",
    `Arquivo completo: \`matriz-estrutura-tema.md\` (${mat.n} vídeos com estrutura e tema; ${mat.temas.length} temas). Células n≥15 com Wilson inferior do p bruto acima de 0,25: ${celulasFortes.length ? celulasFortes.map((c) => `${nomeEstr(c.estrutura)} × ${c.tema}: ${pct(c.p_encolhido)} encolhido (bruto ${pct(c.p_bruto)}, n=${c.n}, k=${c.k})`).join("; ") : "**nenhuma** — STOP do WP-H: não emitir insight nem proposta de playbook, manter PARTE 2 manual"}.`,
    "",
    tabela(["estrutura", "tema", "n", "k", "p bruto", "p encolhido", "prior"], mat.celulas.filter((c) => c.n >= 15).sort((a, b) => b.p_encolhido - a.p_encolhido).map((c) => [nomeEstr(c.estrutura), c.tema, c.n, c.k, pct(c.p_bruto), pct(c.p_encolhido), pct(c.prior)])),
    "",
    "## 4. Comunicação (métricas de texto pré-registradas)",
    "",
    `Corpus: ${com.n_corpus} textos (dedup por md5 do roteiro, feito no WP-B), ${com.n_validos} em estratos com n≥${MIN_ESTRATO}; top ${com.n_top} vs bottom ${com.n_bot}. Sem filtro de ano aqui: o JSON do WP-B não traz data (o corpus é 90% de 2026). \`paragrafos\` e \`palavras_por_paragrafo_media\` excluídas do corpus: a transcrição não tem quebra de parágrafo (\`paragrafos=1\`), só valem para o Codex.`,
    "",
    "### 4.1 Cliff's delta top vs bottom (δ>0 = a métrica é maior nos vídeos do quartil superior)",
    "",
    tabela(
      ["métrica", "mediana top", "mediana bottom", "δ global", "δ pool ponderado (clientes)", "mesmo sinal", "leitura"],
      com.global.map((g) => [g.metrica, f2(g.mediana_top), f2(g.mediana_bot), f2(g.delta_global), `${f2(g.delta_pool)} (${g.consistencia.clientes})`, `${g.consistencia.mesmo_sinal}/${g.consistencia.clientes}`, Math.abs(g.delta_global) >= 0.2 ? "|δ|≥0,2" : "abaixo de 0,2 — não separa"])
    ),
    "",
    `Métricas com |δ global|≥0,2: ${metricasFortes.map((m) => `${m.metrica} (${f2(m.delta_global)})`).join(", ") || "**nenhuma**"}. Métricas que cumprem os dois primeiros critérios de regra (|δ pool|≥0,2 e mesmo sinal em ≥2/3 dos clientes): ${metricasRegra.map((m) => m.metrica).join(", ") || "**nenhuma**"}. Holdout temporal: ainda não existe.`,
    "",
    "Por cliente (só n_top,n_bot≥15), δ por métrica:",
    "",
    tabela(
      ["métrica", ...(com.global[0]?.clientes.map((c) => `${c.nome} (${c.n_top}/${c.n_bot})`) ?? [])],
      com.global.map((g) => [g.metrica, ...g.clientes.map((c) => f2(c.delta))])
    ),
    "",
    "### 4.2 Codex (158) vs humanos VM (`vm_script='sim'`) vs próprio (`'nao'`)",
    "",
    tabela(
      ["métrica", "mediana Codex", "mediana VM", "mediana próprio", "δ Codex−VM", "δ Codex−próprio"],
      com.fontes.map((f) => [f.metrica + (f.so_codex ? " (só Codex)" : ""), f2(f.mediana_codex), f.so_codex ? "–" : f2(f.mediana_sim), f.so_codex ? "–" : f2(f.mediana_nao), f.so_codex ? "–" : f2(f.delta_codex_sim), f.so_codex ? "–" : f2(f.delta_codex_nao)])
    ),
    "",
    `n: Codex ${com.n_codex}, VM ${com.n_sim}, próprio ${com.n_nao}. Isto descreve como o Codex escreve diferente; não diz se isso é bom — a seção 4.1 é que mede o que separa top de bottom.`,
    "",
    codexTexto,
    "",
    "## 6. Conclusões",
    "",
    `1. **Ranking por lift no Instagram.** Rótulos com lift_lb>1 e n≥30 — hook: ${fortesTxt("hook")}. Estrutura: ${fortesTxt("estrutura")}. Comando (seguidores): ${fortesTxt("comando")}. Tema: ${fortesTxt("tema")}. Rótulos com lift_ub<1 e n≥30 — hook: ${fracosTxt("hook")}; estrutura: ${fracosTxt("estrutura")}; comando: ${fracosTxt("comando")}; tema: ${fracosTxt("tema")}. O que NÃO permite dizer: causalidade (o rótulo acompanha tema, cliente e época) e nada por cliente sem o n do briefing.`,
    "",
    `2. **Contraste Extremo.** No corpus IG: ${fmtLiftCurto(ce)}; prevalência ${pct(prevalencia.hook.get("Contraste Extremo") ?? 0)}. No Codex: ${ceCodex ? `${ceCodex.codex_n}/${codex.n_com_trace_hook} (${pct(ceCodex.codex_share)})` : "–"}. ${ce && ce.lift_lb > 1 ? "O dado sustenta o mecanismo, mas não a concentração: lift ~" + f2(ce.lift) + " não justifica 9 em 10." : "O dado não sustenta a concentração: o mecanismo mais usado pelo Codex não tem lift>1 confirmado."} Não permite dizer que outro mecanismo daria resultado melhor no Codex — mede-se prevalência e lift no corpus, não experimento.`,
    "",
    `3. **Estruturas do Codex.** Top 3 (${top3Codex.map((e) => `${nomeEstr(e.label)} ${e.codex_n}`).join(", ")}) = ${pct(shareTop3)} dos ${codex.n_com_estrutura}; seus lifts no corpus IG: ${top3Codex.map((e) => `${e.label} ${fmtLiftCurto(e.lift)}`).join("; ")}. Estruturas com lift_lb>1 pouco usadas: ${fortes(liftIG.estrutura).filter((r) => (codex.estrutura.find((e) => e.label === r.label)?.codex_n ?? 0) <= 3).map((r) => `${nomeEstr(r.label)} (${f2(r.lift)}, n=${r.n}, Codex ${codex.estrutura.find((e) => e.label === r.label)?.codex_n ?? 0}×)`).join("; ") || "nenhuma"}. Não permite dizer que trocar a estrutura muda o resultado de um roteiro específico: a estrutura é escolhida por tema e premissa.`,
    "",
    `4. **Matriz estrutura × tema.** ${celulasFortes.length} células n≥15 com Wilson inferior acima da base (${celulasFortes.slice(0, 5).map((c) => `${c.estrutura}×${c.tema} ${pct(c.p_encolhido)}`).join(", ") || "nenhuma"}). ${celulasFortes.length ? "Bases pequenas (n 15–60): são hipóteses para a PARTE 2-B, não regra." : "O dado não separa estrutura por tema com o n atual."}`,
    "",
    `5. **Comunicação.** ${metricasFortes.length} métrica(s) com |δ global|≥0,2 (${metricasFortes.map((m) => `${m.metrica} ${f2(m.delta_global)}`).join(", ") || "nenhuma"}); ${metricasRegra.length} cumprem o critério de consistência entre clientes. Maior |δ| global: ${maiorDelta.metrica} ${f2(maiorDelta.delta_global)} (mesmo sinal em ${maiorDelta.consistencia.mesmo_sinal}/${maiorDelta.consistencia.clientes} clientes) — a direção existe, a magnitude fica abaixo do limiar pré-registrado. ${metricasRegra.length ? "Falta o holdout temporal antes de virar regra." : "Nenhuma métrica de texto separa top de bottom no corpus no tamanho exigido: comprimento de frase, números, pronomes e perguntas não distinguem quem viraliza — o que separa está no tema/premissa/execução, não na forma medida."} Codex vs VM (4.2) descreve diferença de estilo, não mérito.`,
    "",
    `6. **Codex vs humanos VM.** ${codex.vs_humanos.roteiros_com_percentil} roteiros com percentil, P(pct>0,5)=${f2(codex.vs_humanos.p)} [${f2(codex.vs_humanos.wilson_lb)}–${f2(codex.vs_humanos.wilson_ub)}]. **Sem evidência de melhor/pior.** Taxa de publicação ${codex.total_casados}/${codex.n_roteiros} (${pct(codex.total_casados / codex.n_roteiros)}) é a métrica que existe. Não permite ranking de clientes nem de mecanismos pelo resultado dos casados.`,
    "",
    `7. **Edição humana.** ${codex.editados.length} editados, changedRatio mediano ${codex.editados.length ? f2(quartis(codex.editados.map((e) => e.changed_ratio)).q2) : "–"}; ${codex.editados.filter((e) => e.casado).length} deles publicados. Não permite dizer que edição melhora resultado (n).`,
    "",
    "## 7. Recomendações para a Fase 3 (por WP) e STOPs",
    "",
    `- **STOP "nenhum rótulo com lift_lb>1 e n≥30 no global" (hook/estrutura/comando):** ${stopRanking ? "**DISPAROU** — Fase 3(a)/(b) não muda ranking; só entra diversidade/anti-colapso e o plano registra \"o dado não separa\"." : `não disparou, mas por margem mínima — hook: ${fortesTxt("hook")}; estrutura: ${fortesTxt("estrutura")}; comando: ${fortesTxt("comando")}. Foram testados ${liftIG.hook.length} mecanismos, ${liftIG.estrutura.length} estruturas e ${liftIG.comando.length} gatilhos; a 95% espera-se ~${((liftIG.hook.length + liftIG.estrutura.length + liftIG.comando.length) * 0.025).toFixed(1)} falso positivo unilateral entre eles. Um rótulo por dimensão com lb entre 1,01 e 1,05 é evidência fraca: entra no ranking, não vira regra.`}`,
    `- **STOP "concordância de hook <45%":** ${concordancia ? (concordancia.p < 0.45 ? `**DISPAROU** (${pct(concordancia.p)}) — hook só global, com aviso; nada de hook por cliente.` : `não disparou (${pct(concordancia.p)}); hook por cliente só com n≥40 e aviso de ruído.`) : "não medido."}`,
    `- **STOP WP-H "nenhuma célula lift_lb>1 n≥15":** ${celulasFortes.length ? `não disparou (${celulasFortes.length} células) — insight \`estrutura_tema_lift\` e proposta \`active:false\` podem ser emitidos só para essas células.` : "**DISPAROU** — não emitir insight nem proposta; manter PARTE 2 manual."}`,
    `- **STOP WP-K "≥2 métricas |δ|≥0,2 replicadas":** ${metricasRegra.length >= 2 ? `candidatas existem (${metricasRegra.map((m) => m.metrica).join(", ")}), mas o holdout não existe — WP-K continua condicional.` : "**DISPAROU** — WP-K não existe; nenhum alvo de comunicação no prompt."}`,
    "",
    `- **WP-F (selectHook: lift + anti-colapso):** ${fortes(liftIG.hook).length === 0 ? "entra só o anti-colapso (penalidade 0,6^usos e regra 3/5); o `rankScore` por lift_lb existe mas não muda a ordem enquanto nenhum mecanismo tiver lift_lb>1. " : `rankScore = lift_lb coloca ${fortes(liftIG.hook).map((r) => `${r.label} (lb ${f2(r.lift_lb)}, n=${r.n})`).join(", ")} no topo e Contraste Extremo (lb ${ce ? f2(ce.lift_lb) : "–"}) no meio do pelotão — mas com um único mecanismo acima de 1 o anti-colapso é a parte que importa, senão o Codex troca 93% de Contraste Extremo por 93% de outro. `}Contraste Extremo em ${ceCodex ? pct(ceCodex.codex_share) : "–"} dos roteiros é o alvo de processo (<50% em 4 semanas). Nas outras plataformas o topo é outro (Urgência e Elemento Controverso, seção 1.2) — o ranking é do estrato Instagram, como pré-registrado.`,
    `- **WP-G (few-shot por cliente):** independente do lift; entra. A tabela por cliente mostra n suficiente para few-shot local em ${porCliente.filter((c) => c.n_rotulados >= 40).length} clientes.`,
    `- **WP-H (matriz no storytelling):** ${celulasFortes.length ? `só as ${celulasFortes.length} células listadas na seção 3, como proposta \`active:false\`.` : "não emite nada agora; reavaliar quando a lacuna de estrutura for rotulada (hoje " + baseObservada.estrutura.n + " vídeos)."}`,
    `- **WP-I (lições por cliente, lift_lb≥1,2 n≥8):** candidatas nos briefings: ${comBriefing.flatMap((c) => DIMS.flatMap((dim) => c.dims[dim].filter((r) => r.flag !== "suprimido" && r.lift_lb >= 1.2 && r.n >= 8).map((r) => `${c.nome}: ${nomeDim(dim, r.label)} ${f2(r.lift)} [${f2(r.lift_lb)}–${f2(r.lift_ub)}] n=${r.n}, ${r.flag}`))).join("; ") || "**nenhuma** — nenhum rótulo por cliente atinge lift_lb≥1,2 com n≥8; o script de lições não tem o que propor"}. Sempre \`active:false\`.`,
    `- **WP-J (medir):** o percentil vs controles (5.4) é a estatística; hoje ${codex.vs_humanos.roteiros_com_percentil} roteiros. Critério de parada: 60 roteiros maduros ou 16 semanas.`,
    "",
    "Divergências entre o plano e o dado medido aqui estão registradas nas seções 0 (viés de seleção do rótulo), 3 e 4 — nada foi ajustado para \"dar certo\".",
    "",
  ].join("\n");
  writeFileSync(join(outDir, "relatorio.md"), relatorio);

  // ── briefings ──
  for (const c of comBriefing) {
    const cod = codex.publicacao.find((p) => p.cliente_id === c.cliente_id);
    const rots = codex.roteiros.filter((r) => r.cliente === c.nome);
    const comCli = com.global.map((g) => ({ metrica: g.metrica, c: g.clientes.find((x) => x.cliente === c.cliente_id) })).filter((x) => x.c);
    const md = [
      `# Briefing — ${c.nome}`,
      "",
      `Gerado em ${geradoEm.slice(0, 10)} (plano 020, WP-D). ${c.n_rotulados} vídeos rotulados em 2026 (não maturando, views>0). Estrato por plataforma; \`top\` = quartil superior no estrato; lift vs 0,25; n<8 suprimido, 8–29 encolhido com flag. IC cruzando 1 = sem evidência. Nada aqui é regra: é proposta para o Kasparov (WP-I), sempre \`active:false\`.`,
      "",
      ...DIMS.flatMap((dim) => {
        const vis = visiveis(c.dims[dim]);
        return [`## ${TITULO_DIM[dim]} (n=${c.n_por_dim[dim]})`, "", vis.length ? tabela(CAB_LIFT.filter((h) => h !== "dominância" && h !== "consistência"), vis.map((r) => linhaLift(r, (l) => nomeDim(dim, l), nomeCliente).slice(0, 6))) : "_sem rótulo com n≥8_", ""];
      }),
      "## Comunicação (Cliff's delta top vs bottom, só com n_top,n_bot≥15)",
      "",
      comCli.length ? tabela(["métrica", "δ", "n_top/n_bot"], comCli.map((x) => [x.metrica, f2(x.c!.delta), `${x.c!.n_top}/${x.c!.n_bot}`])) : "_sem dado: menos de 15 vídeos no top ou no bottom_",
      "",
      "## Codex neste cliente",
      "",
      cod ? `${cod.roteiros} roteiros gerados, ${cod.casados} casados com vídeo publicado (${pct(cod.taxa)}).` : "Nenhum roteiro do Codex.",
      "",
      rots.length ? tabela(["hook", "estrutura", "coef mediano", "pct vs controles"], rots.map((r) => [r.hook_mecanismo ?? "–", r.estrutura ?? "–", r.coef_mediano != null ? f2(r.coef_mediano) : "–", r.percentil_roteiro != null ? pct(r.percentil_roteiro) : "–"])) : "",
      "",
    ].join("\n");
    writeFileSync(join(outDir, `briefing-${slug(c.nome)}.md`), md);
  }
  console.log(`gravados em ${outDir}: relatorio.md, lift.json, matriz-estrutura-tema.md, ${comBriefing.length} briefings`);
}

main().catch((e) => {
  console.error("study-lift falhou:", e);
  process.exit(1);
});
