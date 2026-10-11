// Amostra para ler e montar a taxonomia: metade topo, metade baixo, espalhada por cliente.
// uso: node src/payoff/amostra.mjs [seed] [porLado]
import { carregar } from "../lib.mjs";
const seed = Number(process.argv[2] ?? 1), porLado = Number(process.argv[3] ?? 30);
const L = carregar();
const porScript = new Map();
for (const r of L) { const e = porScript.get(r.script_id) ?? porScript.set(r.script_id, { r, pqs: [] }).get(r.script_id); e.pqs.push(r.pq); }
const media = [...porScript.values()].filter((e) => e.pqs.length >= 2).map((e) => ({ ...e, m: e.pqs.reduce((a, b) => a + b, 0) / e.pqs.length }));
let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pegar = (lista) => {
  lista.sort(() => rnd() - 0.5);
  const porCli = {}, out = [];
  for (const e of lista) { if ((porCli[e.r.cliente] ?? 0) >= 2) continue; porCli[e.r.cliente] = (porCli[e.r.cliente] ?? 0) + 1; out.push(e); if (out.length >= porLado) break; }
  return out;
};
const cut = (t, n) => (t ?? "").replace(/\s+/g, " ").slice(0, n);
for (const [nome, lista] of [["TOPO", media.filter((e) => e.m >= 0.8)], ["BAIXO", media.filter((e) => e.m <= 0.25)]]) {
  for (const e of pegar(lista)) {
    const { r } = e;
    console.log(`\n## ${nome} m=${e.m.toFixed(2)} | ${r.cliente} | ${r.macro}\nT: ${cut(r.s?.titulo, 120)}\nH: ${cut(r.g?.hook, 260)}\nC2: ${cut(r.g?.conclusao2, 200)}\nC: ${cut(r.g?.conclusao, 260)}\nA: ${cut(r.assunto, 200)}`);
  }
}
