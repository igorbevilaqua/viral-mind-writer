// Tarefa 6 (bônus): territórios que crescem ou caem ao longo do tempo (volume e desempenho por período).
import { writeFileSync } from "node:fs";
import { carregar, mantelHaenszel, DESFECHOS, ler, OUT, fmt } from "../lib.mjs";

const L = carregar().filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
const cl = new Map(ler("clusters.json").map((c) => [c.script_id, c]));
const y = DESFECHOS.coef, f2 = fmt.f2;
const res = [];
for (const k of [30, 60]) {
  const nomes = new Map([...cl.values()].map((c) => [c[`c${k}`], c[`nome${k}`]]));
  for (const [c, nome] of nomes) {
    const pred = (r) => cl.get(r.script_id)?.[`c${k}`] === c;
    const per = {};
    for (const p of ["descoberta", "validacao"]) {
      const b = L.filter((r) => r.periodo === p), sel = b.filter(pred);
      const rot = new Set(sel.map((r) => r.script_id)).size, tot = new Set(b.map((r) => r.script_id)).size;
      per[p] = { n: sel.length, rot, share: rot / tot, topo: sel.length ? sel.filter((r) => y(r)).length / sel.length : null, mh: mantelHaenszel(b, pred, y) };
    }
    const d = per.descoberta, v = per.validacao;
    res.push({ k, c, nome, n_desc: d.n, n_val: v.n, share_desc: d.share, share_val: v.share, topo_desc: d.topo, topo_val: v.topo, or_desc: d.mh.or, or_desc_lo: d.mh.lo, or_desc_hi: d.mh.hi, or_val: v.mh.or, or_val_lo: v.mh.lo, or_val_hi: v.mh.hi });
  }
}
writeFileSync(OUT + "embeddings/saturacao.json", JSON.stringify(res, null, 1));
const ok = res.filter((t) => t.n_desc >= 40 && t.n_val >= 40 && t.or_desc && t.or_val);
const delta = (t) => Math.log(t.or_val) - Math.log(t.or_desc);
for (const [titulo, lista] of [["caem (OR validação << descoberta)", [...ok].sort((a, b) => delta(a) - delta(b)).slice(0, 6)], ["sobem", [...ok].sort((a, b) => delta(b) - delta(a)).slice(0, 6)]]) {
  console.log(`\n${titulo}:`);
  for (const t of lista) console.log(`  k${t.k}:${t.c} ${t.nome} | volume ${Math.round(100 * t.share_desc)}% -> ${Math.round(100 * t.share_val)}% dos roteiros | topo ${Math.round(100 * t.topo_desc)}% -> ${Math.round(100 * t.topo_val)}% | OR ${f2(t.or_desc)} [${f2(t.or_desc_lo)}-${f2(t.or_desc_hi)}] -> ${f2(t.or_val)} [${f2(t.or_val_lo)}-${f2(t.or_val_hi)}] | n ${t.n_desc}/${t.n_val}`);
}
