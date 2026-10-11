// hook_video (falado) x g.hook (escrito): o falado inclui o subhook?
import { carregar, tokens, palavras } from "../lib.mjs";
const L = carregar().filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma) && r.hook_video);
const ov = (a, b) => { const A = new Set(tokens(a)); const B = tokens(b); return B.length ? B.filter((x) => A.has(x)).length / B.length : 0; };
const c = { igual: 0, inclui_sub: 0, mais_curto: 0, outro: 0 }; const rz = [];
for (const r of L) {
  const h = palavras(r.g.hook), v = palavras(r.hook_video);
  rz.push(v / Math.max(1, h));
  const cobreHook = ov(r.hook_video, r.g.hook), cobreSub = ov(r.hook_video, r.g.subhook);
  if (cobreHook > 0.7 && cobreSub > 0.6 && v > h * 1.3) c.inclui_sub++;
  else if (cobreHook > 0.7 && v <= h * 1.3 && v >= h * 0.7) c.igual++;
  else if (v < h * 0.7) c.mais_curto++;
  else c.outro++;
}
rz.sort((a, b) => a - b);
const q = (p) => rz[Math.floor(rz.length * p)].toFixed(2);
console.log(L.length, JSON.stringify(c), "razão palavras falado/escrito p25/p50/p75", q(0.25), q(0.5), q(0.75));
for (const p of ["Instagram", "TikTok", "YouTube"]) {
  const x = L.filter((r) => r.plataforma === p).map((r) => palavras(r.hook_video)).sort((a, b) => a - b);
  console.log(p, "palavras hook_video p50", x[Math.floor(x.length / 2)]);
}
