// Diagnóstico do desfecho seguidores: com o que ele anda junto (views, duração, retenção, não seguidores, tempo).
import { carregar, DESFECHOS, lift } from "../lib.mjs";
const L = carregar();
const spear = (xs, ys) => {
  const rk = (a) => { const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = Array(a.length); idx.forEach(([, i], k) => (r[i] = k)); return r; };
  const x = rk(xs), y = rk(ys), n = x.length, mx = (n - 1) / 2;
  let sxy = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - mx); sx += (x[i] - mx) ** 2; sy += (y[i] - mx) ** 2; }
  return sxy / Math.sqrt(sx * sy);
};
for (const p of ["Instagram", "TikTok"]) {
  const R = L.filter((r) => r.plataforma === p && r.p_seg != null);
  const par = (f) => { const S = R.filter((r) => f(r) != null && Number.isFinite(f(r))); return `${spear(S.map((r) => r.p_seg), S.map(f)).toFixed(2)} (n=${S.length})`; };
  console.log(p, "spearman p_seg x", JSON.stringify({
    pq: par((r) => r.pq), coef: par((r) => r.coef), views: par((r) => r.views), duracao: par((r) => r.duracao),
    ret_final: par((r) => r.ret_final), ret_final_cond: par((r) => r.ret_final_cond), nao_seg: par((r) => r.nao_seguidores),
    data: par((r) => Date.parse(r.data)), p_coment: par((r) => r.p_coment), p_comp: par((r) => r.p_comp),
  }));
  // top seguidores por quartil de coef
  for (const [a, b] of [[0, 0.25], [0.25, 0.5], [0.5, 0.75], [0.75, 1.01]]) {
    const S = R.filter((r) => r.pq >= a && r.pq < b);
    console.log(`  pq ${a}-${b}: n=${S.length} top_seg=${(S.filter((r) => DESFECHOS.seguidores(r)).length / S.length).toFixed(2)}`);
  }
  // por trimestre
  const tri = {};
  for (const r of R) { const t = (tri[r.tri] ??= [0, 0]); t[0]++; t[1] += DESFECHOS.seguidores(r); }
  console.log("  por trimestre:", Object.entries(tri).sort().map(([k, [n, s]]) => `${k} n=${n} top=${(s / n).toFixed(2)}`).join(" | "));
}
