// Preditor 2026-10: features de cada vídeo usando SÓ o que existia antes da publicação.
// Regra anti-vazamento: um vídeo vizinho (de qualquer roteiro) só entra se foi publicado
// pelo menos GAP dias antes do vídeo-alvo. O resultado do vizinho é o "topo" da régua do estudo
// (lib.mjs: quartil de cima do coef em cliente x rede x trimestre).
// Saída: data/preditor_features.json (1 linha por vídeo de IG/TT/YT).
// EMB=openai troca o embedding do roteiro pelo da public.documents (text-embedding-3-small, 1536,
// o que a produção tem; baixar antes com export_documents.ts) e recalibra os limiares; saída _openai.
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { carregar, ler, DATA, DESFECHOS } from "../lib.mjs";
import { E3072, IDS as IDS_GEM, truncar, dot, dias } from "../embeddings/base.mjs";
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
const modo = new Map(ler("modo.json").map((m) => [m.crm_script_id, m]));
const scripts = new Map(ler("scripts.json").map((s) => [s.script_id, s]));

// ---- embedding do roteiro: Gemini do CRM (768) ou OpenAI da public.documents (1536) ----
export const EMB = process.env.EMB ?? "gemini";
// documents é por vídeo: o roteiro recebe a média (renormalizada) dos vetores dos vídeos dele.
// ponytail: média simples; os vídeos do mesmo roteiro têm cosseno mediano 0,95 entre si
const docs = existsSync(DATA + "docs_ids.json") ? ler("docs_ids.json") : [];
const docBuf = docs.length ? readFileSync(DATA + "docs_emb.f32") : null;
const DOCE = docBuf ? new Float32Array(docBuf.buffer, docBuf.byteOffset, docBuf.length / 4) : null;
const docPorVideo = new Map(docs.map((d, k) => [d.video_id, k]));
const docsDoRoteiro = (id) => (scripts.get(id)?.video_ids ?? []).map((v) => docPorVideo.get(v)).filter((k) => k != null);
export const TEM_DOC = new Set(IDS_GEM.filter((id) => docsDoRoteiro(id).length));
let IDS = IDS_GEM, D = 768, E;
if (EMB === "openai") {
  IDS = IDS_GEM.filter((id) => TEM_DOC.has(id)); D = 1536; E = new Float32Array(IDS.length * D);
  IDS.forEach((id, i) => {
    const ks = docsDoRoteiro(id);
    for (const k of ks) for (let d = 0; d < D; d++) E[i * D + d] += DOCE[k * D + d];
    const n = Math.hypot(...E.subarray(i * D, (i + 1) * D)); for (let d = 0; d < D; d++) E[i * D + d] /= n;
  });
} else E = truncar(E3072, 3072, 768);
const N = IDS.length, POS = new Map(IDS.map((id, i) => [id, i]));

// limiares do estudo de embeddings: p97 dos pares do mesmo cliente e p99,5 dos pares entre clientes.
// Gemini: 0,80 / 0,76 (t0_similaridade.mjs). OpenAI: recalculados aqui, do mesmo jeito.
function percentis() {
  const cli = IDS.map((id) => scripts.get(id)?.cliente), dentro = [], entre = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) (cli[i] === cli[j] ? dentro : entre).push(dot(E, i, E, j, D));
  const q = (v, p) => Float32Array.from(v).sort()[Math.floor(p * (v.length - 1))];
  return { dentro_p50: q(dentro, 0.5), dentro_p97: q(dentro, 0.97), entre_p50: q(entre, 0.5), entre_p995: q(entre, 0.995) };
}
export const PERCENTIS = EMB === "openai" || process.env.PERCENTIS ? percentis() : null;
const r2 = (x) => Math.round(x * 100) / 100;
export const LIMIARES = EMB === "openai" ? { T_CLI: r2(PERCENTIS.dentro_p97), T_OUT: r2(PERCENTIS.entre_p995) } : { T_CLI, T_OUT };
const { T_CLI: TC, T_OUT: TO } = LIMIARES;

// territórios: clusters.json do estudo; roteiro novo vai para o centróide mais próximo (k=30 e k=60)
const clusters = new Map(ler("clusters.json").map((c) => [c.script_id, c]));
function centroides(campo) {
  const C = new Map();
  for (const [id, c] of clusters) {
    const i = POS.get(id); if (i == null) continue;
    const v = C.get(c[campo]) ?? C.set(c[campo], new Float64Array(D)).get(c[campo]);
    for (let k = 0; k < D; k++) v[k] += E[i * D + k];
  }
  return [...C].map(([c, v]) => { const n = Math.hypot(...v); return [c, Float32Array.from(v, (x) => x / n)]; });
}
const CENT = { c30: centroides("c30"), c60: centroides("c60") };
// OpenAI: todo roteiro vai para o centróide mais próximo, como um roteiro novo na produção
// (os rótulos do clusters.json saíram do k-means no Gemini)
function territorio(id, campo) {
  const c = clusters.get(id); if (c && EMB !== "openai") return c[campo];
  const i = POS.get(id); if (i == null) return null;
  let best = null, bs = -2;
  for (const [cl, v] of CENT[campo]) { const s = dot(E, i, v, 0, D); if (s > bs) { bs = s; best = cl; } }
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
  const f = { tem_emb: i != null, tem_doc: TEM_DOC.has(r.script_id), video_id: r.video_id, script_id: r.script_id, cliente_id: r.cliente_id, cliente: r.cliente, plataforma: r.plataforma, data: r.data, mes: r.data.slice(0, 7), y: y(r), pq: r.pq, coef: r.coef };
  // ---- tema (kNN) ----
  const viz = []; // [sim, j, resultado]
  if (i != null) for (let j = 0; j < N; j++) {
    if (j === i) continue;
    const res = conhecido(j, corte); if (!res) continue;
    viz.push([dot(E, i, E, j, D), j, res]);
  }
  viz.sort((a, b) => b[0] - a[0]);
  const top = viz.slice(0, K_CASA);
  f.knn20 = top.length ? top.reduce((s, v) => s + v[2].topo, 0) / top.length : BASE;
  f.sim_media = viz.length ? viz.slice(0, K_SIM).reduce((s, v) => s + v[0], 0) / Math.min(K_SIM, viz.length) : 0;
  const mesmo = (v) => clienteDe[v[1]] === r.cliente_id;
  const casa = viz.filter((v) => v[0] >= (mesmo(v) ? TC : TO)).slice(0, K_CASA);
  const cli = viz.filter((v) => mesmo(v) && v[0] >= TC).slice(0, K_CLI);
  f.n_casa = casa.length;
  f.casa_taxa = encolher(casa.reduce((s, v) => s + v[2].topo, 0), casa.length, 5);
  f.n_cli = cli.length;
  f.cli_taxa = encolher(cli.reduce((s, v) => s + v[2].topo, 0), cli.length, 3);
  // ---- repetição (achado 4 de embeddings) ----
  const hit = cli.find((v) => v[2].pq >= TOPO_PQ), flop = cli.find((v) => v[2].pq <= FRACO_PQ);
  f.rep_acerto = hit ? 1 : 0;
  f.rep_acerto_90 = hit && dias(hit[2].data, r.data) >= 90 ? 1 : 0;
  f.rep_fraco = flop ? 1 : 0;
  const fora = viz.filter((v) => !mesmo(v) && v[0] >= TO);
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
  writeFileSync(DATA + `preditor_features${EMB === "openai" ? "_openai" : ""}${GAP === 30 ? "" : "_gap" + GAP}.json`, JSON.stringify(out));
  console.log("embedding", EMB, "| roteiros no corpus", N, "| limiares", LIMIARES, PERCENTIS ?? "");
  // checagem anti-vazamento: nenhum vizinho pode ser o próprio roteiro nem ter data depois do corte
  console.assert(out.every((f) => f.casa_taxa >= 0 && f.casa_taxa <= 1), "taxa fora de [0,1]");
  console.log("linhas", out.length, "| com embedding", out.filter((f) => f.tem_emb).length, "| com modo", out.filter((f) => f.modo).length, "| sem vizinho na casa", out.filter((f) => !f.n_casa).length);
}
