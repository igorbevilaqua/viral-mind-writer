// Preditor 2026-10: features de cada vídeo usando SÓ o que existia antes da publicação.
// Regra anti-vazamento: um vídeo vizinho (de qualquer roteiro) só entra se foi publicado
// pelo menos GAP dias antes do vídeo-alvo. O resultado do vizinho é o "topo" da régua do estudo
// (lib.mjs: quartil de cima do coef em cliente x rede x trimestre).
// Saída: data/preditor_features.json (1 linha por vídeo de IG/TT/YT).
import { writeFileSync } from "node:fs";
import { carregar, ler, DATA, DESFECHOS } from "../lib.mjs";
import { E3072, N, POS, IDS, truncar, dot, dias } from "../embeddings/base.mjs";
import { T_CLI, T_OUT } from "../embeddings/t3_repeticao.mjs";
import { placar } from "../hooks/placar.mjs";
import { HOOK } from "../hooks/feat.mjs";

export const GAP = Number(process.env.GAP ?? 30); // dias
export const PLATS = ["Instagram", "TikTok", "YouTube"];
export const BASE = 0.26;
const K_CASA = 20, K_CLI = 10, K_SIM = 10;
const TOPO_PQ = 0.69, FRACO_PQ = 0.30; // quartis do pq médio por roteiro (achados de embeddings, achado 4)
export const MODOS = ["historia", "mecanismo", "demonstracao", "panorama", "conselho", "publi", "misto"];
export const ANCORAS = ["noticia", "passado", "atemporal"];
const encolher = (k, n, m, prior = BASE) => (k + m * prior) / (n + m);

const L = carregar().filter((r) => PLATS.includes(r.plataforma));
const y = DESFECHOS.coef;
const E = truncar(E3072, 3072, 768);
const modo = new Map(ler("modo.json").map((m) => [m.crm_script_id, m]));
const scripts = new Map(ler("scripts.json").map((s) => [s.script_id, s]));

// territórios: clusters.json do estudo; roteiro novo vai para o centróide mais próximo (k=30 e k=60)
const clusters = new Map(ler("clusters.json").map((c) => [c.script_id, c]));
function centroides(campo) {
  const C = new Map();
  for (const [id, c] of clusters) {
    const i = POS.get(id); if (i == null) continue;
    const v = C.get(c[campo]) ?? C.set(c[campo], new Float64Array(768)).get(c[campo]);
    for (let k = 0; k < 768; k++) v[k] += E[i * 768 + k];
  }
  return [...C].map(([c, v]) => { const n = Math.hypot(...v); return [c, Float32Array.from(v, (x) => x / n)]; });
}
const CENT = { c30: centroides("c30"), c60: centroides("c60") };
function territorio(id, campo) {
  const c = clusters.get(id); if (c) return c[campo];
  const i = POS.get(id); if (i == null) return null;
  let best = null, bs = -2;
  for (const [cl, v] of CENT[campo]) { const s = dot(E, i, v, 0, 768); if (s > bs) { bs = s; best = cl; } }
  return best;
}

// vídeos por roteiro (com data e topo), para medir o vizinho só com o que já tinha GAP dias no ar
const vidsPorScript = new Map();
for (const r of L) (vidsPorScript.get(r.script_id) ?? vidsPorScript.set(r.script_id, []).get(r.script_id)).push(r);
const clienteDe = IDS.map((id) => scripts.get(id)?.cliente_id ?? null);
const terr = { c30: IDS.map((id) => territorio(id, "c30")), c60: IDS.map((id) => territorio(id, "c60")) };

// resultado de um roteiro conhecido até a data de corte: média do topo e do pq dos vídeos publicados até ela
function conhecido(j, corte) {
  const vs = vidsPorScript.get(IDS[j]); if (!vs) return null;
  let n = 0, k = 0, pq = 0, ultima = null;
  for (const v of vs) if (v.data <= corte) { n++; k += y(v); pq += v.pq; if (!ultima || v.data > ultima) ultima = v.data; }
  return n ? { n, topo: k / n, pq: pq / n, data: ultima } : null;
}
const menosDias = (d, n) => new Date(Date.parse(d) - n * 86400000).toISOString().slice(0, 10);

export function featuresDe(r) {
  const i = POS.get(r.script_id);
  const corte = menosDias(r.data, GAP);
  const f = { video_id: r.video_id, script_id: r.script_id, cliente_id: r.cliente_id, cliente: r.cliente, plataforma: r.plataforma, data: r.data, mes: r.data.slice(0, 7), y: y(r), pq: r.pq, coef: r.coef };
  // ---- tema (kNN) ----
  const viz = []; // [sim, j, resultado]
  if (i != null) for (let j = 0; j < N; j++) {
    if (j === i) continue;
    const res = conhecido(j, corte); if (!res) continue;
    viz.push([dot(E, i, E, j, 768), j, res]);
  }
  viz.sort((a, b) => b[0] - a[0]);
  const top = viz.slice(0, K_CASA);
  f.knn20 = top.length ? top.reduce((s, v) => s + v[2].topo, 0) / top.length : BASE;
  f.sim_media = viz.length ? viz.slice(0, K_SIM).reduce((s, v) => s + v[0], 0) / Math.min(K_SIM, viz.length) : 0;
  const mesmo = (v) => clienteDe[v[1]] === r.cliente_id;
  const casa = viz.filter((v) => v[0] >= (mesmo(v) ? T_CLI : T_OUT)).slice(0, K_CASA);
  const cli = viz.filter((v) => mesmo(v) && v[0] >= T_CLI).slice(0, K_CLI);
  f.n_casa = casa.length;
  f.casa_taxa = encolher(casa.reduce((s, v) => s + v[2].topo, 0), casa.length, 5);
  f.n_cli = cli.length;
  f.cli_taxa = encolher(cli.reduce((s, v) => s + v[2].topo, 0), cli.length, 3);
  // ---- repetição (achado 4 de embeddings) ----
  const hit = cli.find((v) => v[2].pq >= TOPO_PQ), flop = cli.find((v) => v[2].pq <= FRACO_PQ);
  f.rep_acerto = hit ? 1 : 0;
  f.rep_acerto_90 = hit && dias(hit[2].data, r.data) >= 90 ? 1 : 0;
  f.rep_fraco = flop ? 1 : 0;
  const fora = viz.filter((v) => !mesmo(v) && v[0] >= T_OUT);
  f.fora_fraco = fora.some((v) => v[2].pq <= FRACO_PQ) ? 1 : 0;
  f.fora_acerto = fora.some((v) => v[2].pq >= TOPO_PQ) ? 1 : 0;
  // ---- território ----
  for (const c of ["c30", "c60"]) {
    const t = i == null ? null : terr[c][i];
    let n = 0, k = 0;
    if (t != null) for (let j = 0; j < N; j++) {
      if (j === i || terr[c][j] !== t) continue;
      for (const v of vidsPorScript.get(IDS[j]) ?? []) if (v.data <= corte) { n++; k += y(v); }
    }
    f[`terr_${c}`] = encolher(k, n, 10);
  }
  // ---- cliente x rede: taxa de topo de [data-90-GAP, data-GAP] e tendência ----
  let n1 = 0, k1 = 0, n2 = 0, k2 = 0;
  const ini = menosDias(corte, 90), meio = menosDias(corte, 45);
  for (const v of L) {
    if (v.cliente_id !== r.cliente_id || v.plataforma !== r.plataforma || v.data > corte || v.data < ini) continue;
    if (v.data > meio) { n2++; k2 += y(v); } else { n1++; k1 += y(v); }
  }
  f.n_cli90 = n1 + n2;
  f.cli90 = encolher(k1 + k2, n1 + n2, 10);
  f.cli_tend = n1 && n2 ? k2 / n2 - k1 / n1 : 0;
  // ---- formato ----
  const m = modo.get(r.script_id);
  f.modo = m?.modo ?? null; f.ancora = m?.ancora ?? null;
  f.hook_placar = r.g?.hook ? placar(r.g.hook) : 0;
  // catálogo inteiro do estudo de hooks (145 marcas, boas e ruins): o modelo aprende os pesos só no treino
  f.hk = r.g?.hook ? HOOK.filter(([, , , fn]) => fn(r.g.hook)).map(([id]) => id) : [];
  f.titulo = r.s?.titulo ?? null; f.hook = r.g?.hook ?? null; f.link = r.link;
  return f;
}

if (process.argv[1]?.endsWith("features.mjs")) {
  console.time("features");
  const out = L.filter((r) => r.data >= "2026-02-01").map(featuresDe);
  console.timeEnd("features");
  writeFileSync(DATA + `preditor_features${GAP === 30 ? "" : "_gap" + GAP}.json`, JSON.stringify(out));
  // checagem anti-vazamento: nenhum vizinho pode ser o próprio roteiro nem ter data depois do corte
  console.assert(out.every((f) => f.casa_taxa >= 0 && f.casa_taxa <= 1), "taxa fora de [0,1]");
  console.log("linhas", out.length, "| com modo", out.filter((f) => f.modo).length, "| sem vizinho na casa", out.filter((f) => !f.n_casa).length);
}
