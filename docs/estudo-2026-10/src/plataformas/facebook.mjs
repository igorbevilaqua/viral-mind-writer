// Tarefa 6: Facebook (amostra pequena, quase toda Izabela Anholett e Renato Torres, espelhada do Instagram).
// Saída: out/plataformas/facebook.txt
import { writeFileSync } from "node:fs";
import { carregar, avaliar, OUT, fmt } from "../lib.mjs";
import { FEATS, pares, pareado } from "./feat.mjs";

const L = carregar(), FB = L.filter((r) => r.plataforma === "Facebook"), out = [], f2 = fmt.f2, pct = fmt.pct;
const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const cont = {};
for (const r of FB) cont[r.cliente] = (cont[r.cliente] ?? 0) + 1;
out.push(`## Facebook: ${FB.length} vídeos, ${new Set(FB.map((r) => r.script_id)).size} roteiros`, `- por conta: ${Object.entries(cont).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
out.push(`- acerto da casa: ${pct(FB.filter((r) => r.acerto).length / FB.length)}; coef mediano ${f2(med(FB.map((r) => r.coef)))}; views medianas ${med(FB.map((r) => r.views))}`);
const corr = (x, y) => { const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n; let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sx += (x[i] - mx) ** 2; sy += (y[i] - my) ** 2; } return sxy / Math.sqrt(sx * sy); };
for (const p of ["Instagram", "TikTok", "YouTube"]) {
  const prs = pares("Facebook", p);
  const mesmoDia = prs.filter((x) => x.a.data === x.b.data).length;
  out.push(`- FB x ${p}: ${prs.length} roteiros nas duas, correlação do percentil ${f2(corr(prs.map((x) => x.a.pq), prs.map((x) => x.b.pq)))}, mesmo dia ${pct(mesmoDia / prs.length)}`);
  for (const c of ["Izabela Anholett", "Renato Torres"]) { const s = prs.filter((x) => x.cliente === c); if (s.length >= 30) out.push(`  - só ${c}: n=${s.length}, correlação ${f2(corr(s.map((x) => x.a.pq), s.map((x) => x.b.pq)))}`); }
}
// o que se destaca no FB (n>=30)
out.push(`\n## Características no Facebook (avaliar com plats=[Facebook], n>=30; com 270 vídeos, só efeitos grandes aparecem)`);
const res = [];
for (const [id, , nome, pred] of FEATS) {
  const a = avaliar(nome, pred, { plats: ["Facebook"] });
  if ((a.todas?.n ?? 0) >= 30 && (a.todas.lb > 1 || a.todas.ub < 1 || a.mh.lo > 1 || a.mh.hi < 1)) res.push(`- ${nome}: n=${a.todas.n}, ${pct(a.todas.p)} topo vs ${pct(a.todas.p_sem)}, lift ${f2(a.todas.lift)} [${f2(a.todas.lb)}-${f2(a.todas.ub)}], OR MH ${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}], desc/valid ${f2(a.descoberta?.lift)}/${f2(a.validacao?.lift)}, ${a.leitura}`);
}
out.push(...(res.length ? res : ["- nada com IC fora de 1"]));
// pareado IG x FB
const prs = pares("Instagram", "Facebook");
const pr = pareado(prs, FEATS, { nboot: 2000 }).filter((r) => r.foraDeZero);
out.push(`\n## Pareado IG x FB (${prs.length} roteiros; positivo = melhor no IG)`);
out.push(...(pr.length ? pr.map((r) => `- ${r.nome}: Δ ${(100 * r.cli).toFixed(1)} pp [${(100 * r.lo).toFixed(1)} a ${(100 * r.hi).toFixed(1)}], n=${r.n1}, clientes ${r.mesmoSinal}/${r.kCli}${r.deRede ? " (de rede)" : ""}`) : ["- nada com IC fora de zero"]));
writeFileSync(OUT + "plataformas/facebook.txt", out.join("\n"));
console.log(out.join("\n"));
