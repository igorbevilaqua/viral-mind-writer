// Tabula uma chave (ex.: 2 primeiras palavras) com % topo e OR MH contra o resto. Uso: node tab.mjs <modo>
import { carregar, DESFECHOS, mantelHaenszel, tokens, fmt } from "../lib.mjs";
const L = carregar().filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
const y = DESFECHOS.coef;
export function tab(key, { min = 15, linhas = L, top = 40 } = {}) {
  const g = new Map();
  for (const r of linhas) { const k = key(r); if (k == null) continue; (g.get(k) ?? g.set(k, []).get(k)).push(r); }
  const base = linhas.reduce((s, r) => s + y(r), 0) / linhas.length;
  const res = [];
  for (const [k, rs] of g) {
    const rot = new Set(rs.map((r) => r.script_id)).size;
    if (rot < min) continue;
    const p = rs.reduce((s, r) => s + y(r), 0) / rs.length;
    const mh = mantelHaenszel(linhas, (r) => key(r) === k, y);
    res.push({ k, rot, n: rs.length, p, lift: p / base, or: mh.or, lo: mh.lo, hi: mh.hi });
  }
  res.sort((a, b) => b.rot - a.rot);
  for (const x of res.slice(0, top)) console.log(`${x.k.padEnd(28)} rot=${String(x.rot).padStart(4)} n=${String(x.n).padStart(4)} top=${fmt.pct(x.p)} lift=${fmt.f2(x.lift)} OR=${fmt.f2(x.or)} [${fmt.f2(x.lo)}-${fmt.f2(x.hi)}]`);
}
const modo = process.argv[2];
if (modo === "ini2") tab((r) => tokens(r.g.hook).slice(0, 2).join(" "), { min: 12, top: 60 });
if (modo === "ini1") tab((r) => tokens(r.g.hook)[0], { min: 15, top: 40 });
if (modo === "esse") tab((r) => { const t = tokens(r.g.hook); return /^(esse|essa|esses|essas|este|esta)$/.test(t[0]) ? t.slice(0, 2).join(" ") : null; }, { min: 8, top: 50 });
if (modo === "sub1") tab((r) => tokens(r.g.subhook).slice(0, 2).join(" "), { min: 12, top: 60 });
