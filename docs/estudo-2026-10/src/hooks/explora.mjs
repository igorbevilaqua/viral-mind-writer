import { carregar, DESFECHOS, norm, palavras, frases } from "../lib.mjs";
const L = carregar();
const P = ["Instagram", "TikTok", "YouTube"];
const B = L.filter((r) => P.includes(r.plataforma));
const roteiros = new Map(); for (const r of B) roteiros.set(r.script_id, r);
console.log("videos IG/TT/YT", B.length, "roteiros", roteiros.size);
console.log("sem hook escrito", [...roteiros.values()].filter((r) => !r.g?.hook).length, "sem subhook", [...roteiros.values()].filter((r) => !r.g?.subhook).length);
console.log("com hook_video", B.filter((r) => r.hook_video).length);
for (const d of Object.keys(DESFECHOS)) {
  const c = {}; for (const r of B) { const y = DESFECHOS[d](r); if (y != null) c[r.plataforma] = (c[r.plataforma] ?? 0) + 1; }
  console.log(d, JSON.stringify(c));
}
const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const rs = [...roteiros.values()];
console.log("med palavras hook", med(rs.map((r) => palavras(r.g?.hook))), "frases hook", med(rs.map((r) => frases(r.g?.hook).length)), "sub", med(rs.map((r) => palavras(r.g?.subhook))));
const hf = {}; for (const r of rs) { const k = Math.min(6, frases(r.g?.hook).length); hf[k] = (hf[k] ?? 0) + 1; } console.log("hist frases hook", JSON.stringify(hf));
const hw = {}; for (const r of rs) { const k = Math.min(60, Math.floor(palavras(r.g?.hook) / 5) * 5); hw[k] = (hw[k] ?? 0) + 1; } console.log("hist palavras hook (bins 5)", JSON.stringify(hw));
// clientes
const cl = {}; for (const r of rs) cl[r.cliente] = (cl[r.cliente] ?? 0) + 1;
console.log("roteiros por cliente", JSON.stringify(Object.entries(cl).sort((a, b) => b[1] - a[1])));
console.log("macro", JSON.stringify(Object.entries(rs.reduce((m, r) => (m[r.macro] = (m[r.macro] ?? 0) + 1, m), {}))));
// amostra
for (const r of rs.sort(() => Math.random() - 0.5).slice(0, 6)) console.log("\n[" + r.cliente + "|" + r.plataforma + "|coef " + r.coef?.toFixed(2) + "]\nH: " + r.g.hook + "\nS: " + r.g.subhook + "\nHV: " + r.hook_video);
