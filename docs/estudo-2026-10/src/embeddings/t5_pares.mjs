// Tarefa 5: pares (vencedor, perdedor) do mesmo cliente, mesma rede, mesmo território, para leitura contrastiva.
// Grava data/pares.json.
import { writeFileSync } from "node:fs";
import { carregar, DATA, OUT, fmt } from "../lib.mjs";
import { E3072, N, POS, truncar, matrizSim, infoRoteiros, dias, rng } from "./base.mjs";

const VENC = 0.8, PERD = 0.3, MAX_DIAS = 150, MAX_CLI = 25, PISO = 0.78, PCTL = 0.97;
const L = carregar();
const info = infoRoteiros(L);
const S = matrizSim(truncar(E3072, 3072, 768), 768);

// limiar por cliente: os 3% mais similares entre pares de roteiros do próprio cliente (com piso)
const porCli = new Map();
for (const x of info) (porCli.get(x.cliente) ?? porCli.set(x.cliente, []).get(x.cliente)).push(x.i);
const limiar = new Map();
for (const [c, idx] of porCli) {
  const v = [];
  for (let a = 0; a < idx.length; a++) for (let b = a + 1; b < idx.length; b++) v.push(S[idx[a] * N + idx[b]]);
  v.sort((x, y) => x - y);
  limiar.set(c, Math.max(PISO, v.length ? v[Math.floor(PCTL * (v.length - 1))] : 1));
}

const pqMedio = new Map(info.map((x) => [x.id, x.pqMedio]));
function candidatos(plats) {
  const out = [];
  const grupos = new Map();
  for (const r of L) if (plats.includes(r.plataforma) && r.g) (grupos.get(`${r.cliente}|${r.plataforma}`) ?? grupos.set(`${r.cliente}|${r.plataforma}`, []).get(`${r.cliente}|${r.plataforma}`)).push(r);
  for (const g of grupos.values()) {
    const W = g.filter((r) => r.pq >= VENC), P = g.filter((r) => r.pq <= PERD);
    for (const w of W) for (const p of P) {
      if (w.script_id === p.script_id || Math.abs(dias(w.data, p.data)) > MAX_DIAS) continue;
      const s = S[POS.get(w.script_id) * N + POS.get(p.script_id)];
      if (s >= limiar.get(w.cliente)) out.push({ w, p, s });
    }
  }
  return out.sort((a, b) => b.s - a.s || (b.w.pq - b.p.pq) - (a.w.pq - a.p.pq));
}

const usados = new Set(), porCliente = new Map(), pares = [];
function escolher(cands) {
  for (const c of cands) {
    const k = c.w.cliente;
    if ((porCliente.get(k) ?? 0) >= MAX_CLI || usados.has(c.w.script_id) || usados.has(c.p.script_id)) continue;
    usados.add(c.w.script_id); usados.add(c.p.script_id);
    porCliente.set(k, (porCliente.get(k) ?? 0) + 1);
    pares.push(c);
  }
}
escolher(candidatos(["Instagram", "TikTok"]));
const antesYT = pares.length;
// YouTube só se faltar: completa até ~260 em rodadas, primeiro quem tem menos pares (espalha clientes)
const ALVO = 260;
const yt = candidatos(["YouTube"]);
for (let mudou = true; mudou && pares.length < ALVO; ) {
  mudou = false;
  const ordem = [...new Set(yt.map((c) => c.w.cliente))].sort((a, b) => (porCliente.get(a) ?? 0) - (porCliente.get(b) ?? 0));
  for (const cli of ordem) {
    if (pares.length >= ALVO) break;
    const antes = pares.length;
    // o melhor candidato ainda livre deste cliente (escolher respeita o teto de 25 e o não reuso)
    escolher(yt.filter((c) => c.w.cliente === cli && !usados.has(c.w.script_id) && !usados.has(c.p.script_id)).slice(0, 1));
    if (pares.length > antes) mudou = true;
  }
}

const lado = (r) => ({
  script_id: r.script_id, titulo: r.s?.titulo ?? null, hook: r.g?.hook ?? null, subhook: r.g?.subhook ?? null, sub2: r.g?.sub2 ?? null,
  conclusao2: r.g?.conclusao2 ?? null, conclusao: r.g?.conclusao ?? null, bloco_final: r.g?.bloco_final ?? null, comando_video: r.comando_video ?? null,
  coef: r.coef, pq: +r.pq.toFixed(3), views: r.views, duracao: r.duracao == null ? null : Math.round(r.duracao), palavras_total: r.g?.palavras_total ?? null,
  data: r.data, link: r.link ?? null, macro: r.macro, pq_medio_redes: pqMedio.get(r.script_id) == null ? null : +pqMedio.get(r.script_id).toFixed(3),
});
pares.sort((a, b) => a.w.cliente.localeCompare(b.w.cliente) || b.s - a.s);
const saida = pares.map((c, i) => ({ par_id: `P${String(i + 1).padStart(3, "0")}`, cliente: c.w.cliente, plataforma: c.w.plataforma, similaridade: +c.s.toFixed(3), vencedor: lado(c.w), perdedor: lado(c.p) }));
writeFileSync(DATA + "pares.json", JSON.stringify(saida));

// estatística
const f2 = fmt.f2;
const sims = saida.map((p) => p.similaridade).sort((a, b) => a - b);
const gaps = pares.map((c) => Math.abs(dias(c.w.data, c.p.data))).sort((a, b) => a - b);
const plat = {}; for (const p of saida) plat[p.plataforma] = (plat[p.plataforma] ?? 0) + 1;
const consist = saida.filter((p) => p.vencedor.pq_medio_redes != null && p.perdedor.pq_medio_redes != null && p.vencedor.pq_medio_redes > p.perdedor.pq_medio_redes).length;
const stats = {
  pares: saida.length, pares_ig_tt: antesYT, clientes: porCliente.size, por_plataforma: plat,
  por_cliente: Object.fromEntries([...porCliente].sort((a, b) => b[1] - a[1])),
  limiar_por_cliente: Object.fromEntries([...limiar].map(([c, t]) => [c, +t.toFixed(3)])),
  similaridade: { min: sims[0], mediana: sims[Math.floor(sims.length / 2)], max: sims[sims.length - 1] },
  distancia_dias: { mediana: gaps[Math.floor(gaps.length / 2)], p90: gaps[Math.floor(0.9 * (gaps.length - 1))] },
  pq_medio: { vencedor: saida.reduce((s, p) => s + p.vencedor.pq, 0) / saida.length, perdedor: saida.reduce((s, p) => s + p.perdedor.pq, 0) / saida.length },
  vencedor_melhor_na_media_das_redes: consist,
  clientes_sem_par: [...porCli.keys()].filter((c) => !porCliente.has(c)),
};
writeFileSync(OUT + "embeddings/pares_stats.json", JSON.stringify(stats, null, 1));
console.log(JSON.stringify(stats, null, 1));
const r = rng(5);
console.log("\nconferência a olho (5 pares sorteados):");
for (let t = 0; t < 5; t++) {
  const p = saida[Math.floor(r() * saida.length)];
  console.log(`\n${p.par_id} ${p.cliente} ${p.plataforma} sim ${p.similaridade}\n  V (pq ${f2(p.vencedor.pq)}, coef ${p.vencedor.coef}): ${p.vencedor.titulo} | ${p.vencedor.hook?.slice(0, 140)}\n  P (pq ${f2(p.perdedor.pq)}, coef ${p.perdedor.coef}): ${p.perdedor.titulo} | ${p.perdedor.hook?.slice(0, 140)}`);
}
