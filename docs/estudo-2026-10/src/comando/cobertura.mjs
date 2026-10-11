// Cobertura dos campos do bloco final e dos desfechos, por plataforma.
import { carregar, palavras } from "../lib.mjs";
const L = carregar();
const P = ["Instagram", "TikTok", "YouTube", "Facebook"];
for (const p of P) {
  const R = L.filter((r) => r.plataforma === p);
  const c = (f) => R.filter(f).length;
  console.log(p, JSON.stringify({
    n: R.length, roteiros: new Set(R.map((r) => r.script_id)).size,
    comando_video: c((r) => (r.comando_video ?? "").trim().length > 0),
    bloco_final: c((r) => (r.g?.bloco_final ?? "").trim().length > 0),
    apresentacao: c((r) => (r.g?.apresentacao ?? "").trim().length > 0),
    p_seg: c((r) => r.p_seg != null), seg_com_cmd: c((r) => r.p_seg != null && (r.comando_video ?? "").trim()),
    p_coment: c((r) => r.p_coment != null), p_comp: c((r) => r.p_comp != null),
    seg_zero: c((r) => r.seguidores === 0), seg_null: c((r) => r.seguidores == null),
    cta_plat: c((r) => r.g?.cta_por_plataforma),
  }));
}
const q = (a) => { a.sort((x, y) => x - y); return [0.1, 0.5, 0.9].map((f) => a[Math.floor(a.length * f)]).join("/"); };
console.log("palavras comando_video p10/p50/p90", q(L.filter((r) => r.comando_video).map((r) => palavras(r.comando_video))));
console.log("palavras bloco_final p10/p50/p90", q(L.filter((r) => r.g?.bloco_final).map((r) => palavras(r.g.bloco_final))));
const cl = {};
for (const r of L) if (r.p_seg != null) { const k = r.cliente + "|" + r.plataforma[0]; cl[k] = (cl[k] || 0) + 1; }
console.log(Object.entries(cl).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ":" + v).join("; "));
