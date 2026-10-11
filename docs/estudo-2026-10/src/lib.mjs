// Estudo 2026-10: biblioteca comum dos subagentes. Uma régua só para todo mundo.
//
// Unidade de medida: o VÍDEO (um roteiro postado em 3 redes vira 3 vídeos, cada um no seu estrato).
// Característica do texto: do ROTEIRO escrito no CRM (segmentos.json) ou do que foi falado no vídeo
// (hook_video / comando_video, que mudam por plataforma).
//
// Desfecho principal: top = percentil >= 0,75 do coeficiente viral dentro do estrato
// cliente x plataforma x trimestre (fallback cliente x plataforma quando o trimestre tem < 8).
// O trimestre tira o "momento da conta" (conta crescendo põe tudo acima da mediana móvel).
//
// Uso:  import { carregar, avaliar, tabela, ... } from "./lib.mjs";
import { readFileSync, existsSync } from "node:fs";

export const DATA = new URL("../data/", import.meta.url).pathname;
export const OUT = new URL("../out/", import.meta.url).pathname;
export const ler = (f) => JSON.parse(readFileSync(DATA + f, "utf8"));
export const PLATS = ["Instagram", "TikTok", "YouTube", "Facebook"];
export const CORTE_VALIDACAO = "2026-07-01"; // descoberta: antes; validação: a partir desta data

// Agrupamento grosso para juntar clientes parecidos (o nicho fino está em v.nichos).
export const MACRO_NICHO = {
  "Tecnologia, IA e inovação": ["Izabela Anholett", "Rafael Rodrigues", "Marcio Grazino", "Leonardo Cirino", "Thiago Bisewski", "Leonardo Nogueira", "João Felipe Marques", "Leonardo Martins"],
  "Negócios, marcas e cases": ["Rodrigo Waughan", "Thiago Franco", "Manoel Victor", "Pedro Elero", "João Paulo Albuquerque", "Renato Mendes", "Marcelo Germano", "Renato Torres", "Drielle Castelani", "Franklin Tomich", "Cadu Neiva", "Thainá Iansen", "Marcos Pelozato"],
  "Dinheiro, economia e geopolítica": ["Fernando Pereira", "Túlio Lichenstein", "Ricardo Schumacher", "Dilson Peres", "Lerry Granville", "Café com Ferri", "Lincoln Fracari"],
  "Entretenimento": ["Patrick Diorio"],
};
const MACRO_POR_CLIENTE = Object.fromEntries(Object.entries(MACRO_NICHO).flatMap(([m, cs]) => cs.map((c) => [c, m])));

const trimestre = (d) => { const [y, m] = d.split("-").map(Number); const q = Math.min(3, Math.floor((m - 1) / 3) + 1); return `${y}Q${q}`; }; // out/2026 entra no Q3

function percentilEm(grupo, campo, destino) {
  grupo.sort((a, b) => a[campo] - b[campo]);
  for (let i = 0; i < grupo.length; ) {
    let j = i;
    while (j + 1 < grupo.length && grupo[j + 1][campo] === grupo[i][campo]) j++;
    const p = (i + j) / 2 / (grupo.length - 1);
    for (let t = i; t <= j; t++) grupo[t][destino] = p;
    i = j + 1;
  }
}

let cache = null;
// Linhas = vídeos analisáveis (não maturando, views>0, com coeficiente), sem repost.
// Cada linha ganha: .s (roteiro do CRM), .g (segmentos), .nichos, .macro, .periodo, .pq (percentil ajustado).
export function carregar({ incluirRepost = false } = {}) {
  if (cache) return cache;
  const scripts = new Map(ler("scripts.json").map((s) => [s.script_id, s]));
  const seg = new Map(ler("segmentos.json").map((s) => [s.script_id, s]));
  const nichosRaw = ler("nichos.json");
  const nichos = {};
  for (const r of nichosRaw.sort((a, b) => (b.peso ?? 0) - (a.peso ?? 0))) (nichos[r.cliente_id] ??= []).push(r.nicho);
  const extras = {};
  for (const f of ["rotulos_llm.json", "clusters.json"]) if (existsSync(DATA + f)) extras[f] = new Map(ler(f).map((r) => [r.script_id, r]));

  const rows = ler("videos.json")
    .filter((v) => v.analisavel && (incluirRepost || !v.is_repost) && v.script_id)
    .map((v) => ({
      ...v,
      // a base mistura milissegundos e segundos na duração (1.189 dos vídeos de TikTok vêm em ms)
      duracao: v.duracao != null && v.duracao > 1000 ? v.duracao / 1000 : v.duracao,
      s: scripts.get(v.script_id),
      g: seg.get(v.script_id),
      nichos: nichos[v.cliente_id] ?? [],
      macro: MACRO_POR_CLIENTE[v.cliente] ?? "Outros",
      periodo: v.data < CORTE_VALIDACAO ? "descoberta" : "validacao",
      tri: trimestre(v.data),
      llm: extras["rotulos_llm.json"]?.get(v.script_id) ?? null,
      cluster: extras["clusters.json"]?.get(v.script_id) ?? null,
    }));

  // percentil ajustado por trimestre
  const g1 = new Map(), g2 = new Map();
  for (const r of rows) {
    const k1 = `${r.cliente_id}|${r.plataforma}|${r.tri}`, k2 = `${r.cliente_id}|${r.plataforma}`;
    (g1.get(k1) ?? g1.set(k1, []).get(k1)).push(r);
    (g2.get(k2) ?? g2.set(k2, []).get(k2)).push(r);
  }
  for (const g of g2.values()) if (g.length >= 8) percentilEm(g.map((r) => r), "coef", "_p2");
  for (const g of g1.values()) if (g.length >= 8) percentilEm(g, "coef", "pq");
  for (const r of rows) {
    if (r.pq == null) r.pq = r._p2 ?? null;
    r.estrato = `${r.cliente_id}|${r.plataforma}`;
  }
  cache = rows.filter((r) => r.pq != null);
  return cache;
}

// ---------- desfechos ----------
// Cada desfecho devolve 1 (topo), 0 (resto) ou null (sem dado). Todos são "quartil superior no estrato".
export const DESFECHOS = {
  coef: (r) => (r.pq == null ? null : r.pq >= 0.75 ? 1 : 0), // viralização relativa (principal)
  acerto: (r) => (r.coef == null ? null : r.coef >= 1.5 ? 1 : 0), // KPI absoluto da casa (coef >= 1,5)
  ret_hook: (r) => (r.p_ret_hook == null ? null : r.p_ret_hook >= 0.75 ? 1 : 0), // passou dos 3s (só IG tem volume)
  ret_sub: (r) => (r.p_ret_sub_cond == null ? null : r.p_ret_sub_cond >= 0.75 ? 1 : 0), // de quem passou do hook, quantos ficaram no subhook
  ret_final: (r) => (r.p_ret_final_cond == null ? null : r.p_ret_final_cond >= 0.75 ? 1 : 0), // de quem passou do subhook, quantos chegaram ao fim
  seguidores: (r) => (r.p_seg == null ? null : r.p_seg >= 0.75 ? 1 : 0), // seguidores por mil views (conversão do comando)
  compart: (r) => (r.p_comp == null ? null : r.p_comp >= 0.75 ? 1 : 0), // compartilhamentos por mil views
  salvamentos: (r) => (r.p_salv == null ? null : r.p_salv >= 0.75 ? 1 : 0),
  comentarios: (r) => (r.p_coment == null ? null : r.p_coment >= 0.75 ? 1 : 0),
};

// ---------- estatística ----------
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 1];
  const p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), h = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - h) / d), Math.min(1, (c + h) / d)];
}

// Odds ratio de Mantel-Haenszel com IC de Robins-Breslow-Greenland. Controla cliente x plataforma.
export function mantelHaenszel(linhas, pred, y) {
  const est = new Map();
  for (const r of linhas) {
    const t = y(r);
    if (t == null) continue;
    const f = pred(r) ? 1 : 0;
    const e = est.get(r.estrato) ?? est.set(r.estrato, { a: 0, b: 0, c: 0, d: 0 }).get(r.estrato);
    if (f && t) e.a++; else if (f) e.b++; else if (t) e.c++; else e.d++;
  }
  let R = 0, S = 0, PR = 0, PSQR = 0, QS = 0;
  for (const { a, b, c, d } of est.values()) {
    const n = a + b + c + d;
    if (n < 2 || a + b === 0 || c + d === 0) continue;
    const r = (a * d) / n, s = (b * c) / n, P = (a + d) / n, Q = (b + c) / n;
    R += r; S += s; PR += P * r; PSQR += P * s + Q * r; QS += Q * s;
  }
  if (!R || !S) return { or: null, lo: null, hi: null };
  const or = R / S;
  const v = PR / (2 * R * R) + PSQR / (2 * R * S) + QS / (2 * S * S);
  const se = Math.sqrt(v);
  return { or, lo: Math.exp(Math.log(or) - 1.96 * se), hi: Math.exp(Math.log(or) + 1.96 * se) };
}

// Lift = P(topo | tem a característica) / P(topo | população). Com Wilson e MH.
export function lift(linhas, pred, y) {
  const pop = linhas.filter((r) => y(r) != null);
  if (!pop.length) return null;
  const base = pop.reduce((s, r) => s + y(r), 0) / pop.length;
  const sel = pop.filter(pred);
  const n = sel.length, k = sel.reduce((s, r) => s + y(r), 0);
  const fora = pop.length - n, kFora = pop.reduce((s, r) => s + y(r), 0) - k;
  const [lo, hi] = wilson(k, n);
  return {
    n, k, p: n ? k / n : null, base, p_sem: fora ? kFora / fora : null,
    lift: n ? k / n / base : null, lb: lo / base, ub: hi / base,
    roteiros: new Set(sel.map((r) => r.script_id)).size,
    clientes: new Set(sel.map((r) => r.cliente)).size,
  };
}

// Avalia uma característica em cada plataforma, no conjunto, na descoberta e na validação.
// leitura: "regra" só se lb>1 (ou ub<1) no conjunto, n>=minN, MH com IC fora de 1 e mesmo sinal nas duas metades.
export function avaliar(nome, pred, { linhas = carregar(), desfecho = "coef", plats = ["Instagram", "TikTok", "YouTube"], minN = 30 } = {}) {
  const y = DESFECHOS[desfecho];
  const base = linhas.filter((r) => plats.includes(r.plataforma));
  const out = { nome, desfecho };
  out.todas = lift(base, pred, y);
  out.mh = mantelHaenszel(base, pred, y);
  out.descoberta = lift(base.filter((r) => r.periodo === "descoberta"), pred, y);
  out.validacao = lift(base.filter((r) => r.periodo === "validacao"), pred, y);
  for (const p of plats) out[p] = lift(base.filter((r) => r.plataforma === p), pred, y);
  const t = out.todas, d = out.descoberta, v = out.validacao;
  const sinal = (x) => (x?.lift == null ? 0 : x.lift > 1 ? 1 : x.lift < 1 ? -1 : 0);
  if (!t || t.n < minN) out.leitura = "amostra pequena";
  else if (t.lb > 1 && out.mh.lo > 1 && sinal(d) === 1 && sinal(v) === 1) out.leitura = "ajuda (replica)";
  else if (t.ub < 1 && out.mh.hi < 1 && sinal(d) === -1 && sinal(v) === -1) out.leitura = "atrapalha (replica)";
  else if (t.lb > 1 || t.ub < 1) out.leitura = "sinal sem replicação";
  else out.leitura = "sem evidência";
  return out;
}

// Quebra por grupo (cliente, macro nicho, nicho, roteirista...). Devolve só grupos com n>=minN na característica.
export function porGrupo(nome, pred, chave, { linhas = carregar(), desfecho = "coef", minN = 15, plats = ["Instagram", "TikTok", "YouTube"] } = {}) {
  const y = DESFECHOS[desfecho];
  const grupos = new Map();
  for (const r of linhas) if (plats.includes(r.plataforma)) { const k = chave(r); (grupos.get(k) ?? grupos.set(k, []).get(k)).push(r); }
  const res = [];
  for (const [k, g] of grupos) {
    const l = lift(g, pred, y);
    if (l && l.n >= minN) res.push({ grupo: k, ...l, mh: mantelHaenszel(g, pred, y) });
  }
  return res.sort((a, b) => b.lift - a.lift);
}

// Exemplos reais: os roteiros de melhor desempenho que têm a característica (um por roteiro).
export function exemplos(pred, campo = (r) => r.g?.hook, { linhas = carregar(), n = 3, pior = false, plataforma = null } = {}) {
  const sel = linhas.filter((r) => pred(r) && (!plataforma || r.plataforma === plataforma));
  sel.sort((a, b) => (pior ? a.pq - b.pq || a.coef - b.coef : b.pq - a.pq || b.coef - a.coef));
  const vistos = new Set(), out = [];
  for (const r of sel) {
    if (vistos.has(r.script_id)) continue;
    vistos.add(r.script_id);
    out.push({ texto: campo(r), cliente: r.cliente, plataforma: r.plataforma, coef: r.coef, views: r.views, link: r.link });
    if (out.length >= n) break;
  }
  return out;
}

// ---------- texto ----------
export const norm = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%$ ]/g, " ").replace(/\s+/g, " ").trim();
export const tokens = (s) => norm(s).split(" ").filter(Boolean);
export const palavras = (s) => ((s ?? "").match(/[\p{L}\p{N}]+(?:[.,][\p{N}]+)?/gu) ?? []).length;
export const frases = (s) => (s ?? "").split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"“0-9])/u).map((x) => x.trim()).filter(Boolean);
export function ngramas(toks, n) { const out = []; for (let i = 0; i + n <= toks.length; i++) out.push(toks.slice(i, i + n).join(" ")); return out; }

// Mineração de n-gramas: descobre na metade "descoberta", confirma na "validacao".
// Devolve candidatos com n>=minRoteiros na descoberta e MH OR com IC acima (ou abaixo) de 1 lá; a validação decide.
export function minerar(texto, { linhas = carregar(), ns = [1, 2, 3], minRoteiros = 40, desfecho = "coef", plats = ["Instagram", "TikTok", "YouTube"], inicio = false } = {}) {
  const y = DESFECHOS[desfecho];
  const base = linhas.filter((r) => plats.includes(r.plataforma));
  const grams = new Map(); // gram -> Set(script_id)
  const porScript = new Map();
  for (const r of base) {
    if (porScript.has(r.script_id)) continue;
    const toks = tokens(texto(r));
    const set = new Set();
    for (const n of ns) for (const g of (inicio ? [toks.slice(0, n).join(" ")] : ngramas(toks, n))) if (g) set.add(g);
    porScript.set(r.script_id, set);
    for (const g of set) (grams.get(g) ?? grams.set(g, new Set()).get(g)).add(r.script_id);
  }
  const desc = base.filter((r) => r.periodo === "descoberta"), val = base.filter((r) => r.periodo === "validacao");
  const res = [];
  for (const [g, ids] of grams) {
    if (ids.size < minRoteiros) continue;
    const pred = (r) => porScript.get(r.script_id)?.has(g);
    const mhD = mantelHaenszel(desc, pred, y);
    if (mhD.or == null || (mhD.lo <= 1 && mhD.hi >= 1)) continue;
    const mhV = mantelHaenszel(val, pred, y), mhT = mantelHaenszel(base, pred, y);
    const t = lift(base, pred, y);
    res.push({ gram: g, roteiros: ids.size, n: t.n, lift: t.lift, lb: t.lb, ub: t.ub, or_desc: mhD.or, or_val: mhV.or, or_val_lo: mhV.lo, or_val_hi: mhV.hi, or_total: mhT.or, or_lo: mhT.lo, or_hi: mhT.hi, replica: mhV.or != null && (mhD.or > 1) === (mhV.or > 1) });
  }
  return res.sort((a, b) => (b.replica - a.replica) || Math.abs(Math.log(b.or_total ?? 1)) - Math.abs(Math.log(a.or_total ?? 1)));
}

// ---------- saída ----------
const f2 = (x) => (x == null || !Number.isFinite(x) ? "-" : x.toFixed(2).replace(".", ","));
const pct = (x) => (x == null ? "-" : `${Math.round(x * 100)}%`);
export const fmt = { f2, pct };
export function linhaAval(a, plats = ["Instagram", "TikTok", "YouTube"]) {
  const t = a.todas;
  const cel = (x) => (x ? `${f2(x.lift)} (n=${x.n})` : "-");
  return `| ${a.nome} | ${t?.n ?? 0} | ${pct(t?.p)} vs ${pct(t?.p_sem)} | ${f2(t?.lift)} [${f2(t?.lb)} a ${f2(t?.ub)}] | ${f2(a.mh.or)} [${f2(a.mh.lo)} a ${f2(a.mh.hi)}] | ${f2(a.descoberta?.lift)} / ${f2(a.validacao?.lift)} | ${plats.map((p) => cel(a[p])).join(" | ")} | ${a.leitura} |`;
}
export function tabela(avals, plats = ["Instagram", "TikTok", "YouTube"]) {
  return [
    `| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | ${plats.join(" | ")} | leitura |`,
    `|---|---|---|---|---|---|${plats.map(() => "---").join("|")}|---|`,
    ...avals.map((a) => linhaAval(a, plats)),
  ].join("\n");
}

// self-check: Wilson e MH em casos conhecidos
if (process.argv[1] && process.argv[1].endsWith("lib.mjs")) {
  const [lo, hi] = wilson(25, 100);
  console.assert(Math.abs(lo - 0.1754) < 0.002 && Math.abs(hi - 0.3426) < 0.002, "wilson");
  const fake = [];
  for (let i = 0; i < 400; i++) fake.push({ estrato: Math.floor(i / 100), f: i % 2, t: i % 2 ? (i % 8 < 4 ? 1 : 0) : (i % 16 < 2 ? 1 : 0) });
  const mh = mantelHaenszel(fake, (r) => r.f, (r) => r.t);
  console.assert(mh.or > 1 && mh.lo > 1, "mh positivo");
  const rows = carregar();
  console.log("ok: linhas analisáveis", rows.length, "| por plataforma", JSON.stringify(Object.fromEntries(PLATS.map((p) => [p, rows.filter((r) => r.plataforma === p).length]))));
  console.log("base topo (deve ser ~0,25):", f2(rows.filter((r) => DESFECHOS.coef(r)).length / rows.length));
  console.log(tabela([avaliar("hook com número", (r) => /\d/.test(r.g?.hook ?? ""))]));
}
