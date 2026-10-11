// Teto do comando: o MESMO texto de CTA (palavra por palavra) em vídeos diferentes do mesmo cliente x rede.
// Se o texto do CTA decidisse a conversão, vídeos com o mesmo CTA teriam percentis parecidos.
import { writeFileSync } from "node:fs";
import { OUT, norm, fmt } from "../lib.mjs";
import { L } from "./feat.mjs";
const linhas = [];
for (const [rotulo, txt] of [["escrito (bloco final do CRM)", (r) => norm(r.g?.bloco_final)], ["falado (transcrição)", (r) => norm(r.falado_tx)]]) {
  const R = L.filter((r) => ["Instagram", "TikTok"].includes(r.plataforma) && r.p_seg != null && txt(r).split(" ").length >= 8);
  const g = new Map();
  for (const r of R) { const k = r.estrato + "|" + txt(r); (g.get(k) ?? g.set(k, []).get(k)).push(r); }
  const grupos = [...g.values()].filter((x) => x.length >= 3);
  const v = (a) => { const m = a.reduce((s, x) => s + x, 0) / a.length; return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1); };
  const vDentro = grupos.reduce((s, x) => s + v(x.map((r) => r.p_seg)) * (x.length - 1), 0) / grupos.reduce((s, x) => s + x.length - 1, 0);
  const vTotal = v(R.map((r) => r.p_seg));
  const ambos = grupos.filter((x) => x.some((r) => r.p_seg >= 0.75) && x.some((r) => r.p_seg < 0.5)).length;
  const nv = grupos.reduce((s, x) => s + x.length, 0);
  linhas.push(`| ${rotulo} | ${grupos.length} | ${nv} | ${fmt.f2(vDentro)} | ${fmt.f2(vTotal)} | ${fmt.pct(1 - vDentro / vTotal)} | ${fmt.pct(ambos / grupos.length)} |`);
  if (rotulo.startsWith("escrito")) {
    const ex = grupos.filter((x) => x.length >= 4).sort((a, b) => b.length - a.length).slice(0, 4);
    for (const x of ex) linhas.push(`|   exemplo: ${x[0].cliente} ${x[0].plataforma}, ${x.length} vídeos com o texto "${x[0].g.bloco_final.slice(0, 110)}..." | percentis de seguidores: ${x.map((r) => fmt.f2(r.p_seg)).sort().join(", ")} | | | | | |`);
  }
}
const md = `# O mesmo CTA em vídeos diferentes (IG+TT, seguidores)\n\n| texto | grupos com o mesmo CTA (3+ vídeos) | vídeos | variância do percentil dentro do grupo | variância total | parte explicada pelo texto do CTA | grupos com o MESMO CTA no topo e na metade de baixo |\n|---|---|---|---|---|---|---|\n${linhas.join("\n")}\n`;
writeFileSync(OUT + "comando/mesmo_cta.md", md);
console.log(md);
