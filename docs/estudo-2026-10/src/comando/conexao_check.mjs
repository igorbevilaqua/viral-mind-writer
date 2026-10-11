// Checagem do achado "CTA temático converte menos": por cliente, controlando a forma do CTA, e exemplos.
import { mantelHaenszel, DESFECHOS, lift, fmt, exemplos } from "../lib.mjs";
import { RC } from "./conexao.mjs";
const y = DESFECHOS.seguidores;
const R = RC.filter((r) => ["Instagram", "TikTok"].includes(r.plataforma) && y(r) != null);
const tem = (r) => r._ovTemaFora >= 2, hook1 = (r) => r._ovHook >= 1;
const est = (f) => R.map((r) => ({ ...r, estrato: `${r.estrato}|${f(r)}` }));
for (const [nome, p] of [["temático forte", tem], ["repete hook", hook1]]) {
  const m0 = mantelHaenszel(R, p, y);
  const m1 = mantelHaenszel(est((r) => r.ft.freq), p, y);
  const m2 = mantelHaenszel(est((r) => r.ft.cond), p, y);
  const m3 = mantelHaenszel(est((r) => r.ft.faixa), p, y);
  const m4 = mantelHaenszel(est((r) => r.ft.v_comenta), p, y);
  const m5 = mantelHaenszel(est((r) => r.tri), p, y);
  const f = (m) => `${fmt.f2(m.or)} [${fmt.f2(m.lo)}-${fmt.f2(m.hi)}]`;
  console.log(`${nome}: OR ${f(m0)} | ctrl freq ${f(m1)} | ctrl condicional ${f(m2)} | ctrl tamanho ${f(m3)} | ctrl comenta ${f(m4)} | estrato x trimestre ${f(m5)}`);
  const por = new Map();
  for (const r of R) { const k = `${r.cliente}|${r.plataforma[0]}`; (por.get(k) ?? por.set(k, []).get(k)).push(r); }
  const lin = [];
  for (const [k, g] of por) { const c = g.filter(p), s = g.filter((r) => !p(r)); if (c.length >= 5 && s.length >= 5) lin.push(`${k} ${c.length}/${g.length}: ${fmt.pct(c.filter(y).length / c.length)} vs ${fmt.pct(s.filter(y).length / s.length)}`); }
  console.log("  " + lin.join(" | "));
}
console.log("\nco-ocorrência: temático forte & freq", R.filter((r) => tem(r) && r.ft.freq).length, "| temático forte & cond", R.filter((r) => tem(r) && r.ft.cond).length, "de", R.filter(tem).length);
for (const pior of [false, true]) {
  console.log(`\n${pior ? "PIORES" : "MELHORES"} temáticos fortes (seguidores):`);
  const S = R.filter(tem).sort((a, b) => (pior ? a.p_seg - b.p_seg : b.p_seg - a.p_seg)).slice(0, 4);
  for (const r of S) console.log(`  [${r.cliente} ${r.plataforma} p_seg=${r.p_seg}] HOOK: ${(r.hook_video ?? r.g?.hook ?? "").slice(0, 90)} || CTA: ${r.falado_tx.slice(0, 220)}`);
}
