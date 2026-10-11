// 6. Por plataforma: o mesmo comando no IG, no TT e no YT (seguidores, comentários, compartilhamento, coef).
import { writeFileSync } from "node:fs";
import { OUT, norm, avaliar, fmt } from "../lib.mjs";
import { L } from "./feat.mjs";
import { RC } from "./conexao.mjs";
const t = (r) => norm(r.falado_tx);
const P1 = /\b(eu )?(te )?(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho|destrincho|desvendo|traduzo)\b/;
const pede = (r) => r.ft.v_comenta || r.ft.v_compart || r.ft.v_salva || r.ft.v_curte;
const tema = (r) => r._ovTemaFora >= 2 || r._ovHook >= 1;
const F = [
  ["promessa do território (sem palavra do assunto)", (r) => !tema(r) && r.ft.prom],
  ["promessa amarrada ao assunto do vídeo", (r) => tema(r) && r.ft.prom],
  ["todo dia / todos os dias", (r) => r.ft.freq],
  ["eu te mostro / trago / revelo", (r) => P1.test(t(r))],
  ["\"se você quer\"", (r) => r.ft.cond],
  ["\"me segue aqui\"", (r) => /\bsegue aqui\b/.test(t(r))],
  ["apresentação \"Eu sou\"", (r) => r.ft.apres],
  ["credencial", (r) => r.ft.apres && r.ft.credencial],
  ["\"para não perder o próximo vídeo\"", (r) => r.ft.nao_perder],
  ["pede comentário", (r) => r.ft.v_comenta],
  ["pede compartilhamento / mandar para alguém", (r) => r.ft.v_compart],
  ["bloco com 41+ palavras", (r) => r.ft.palavras > 40],
];
const D = [["seguidores", ["Instagram", "TikTok"]], ["comentarios", ["Instagram", "TikTok", "YouTube"]], ["compart", ["Instagram", "TikTok"]], ["coef", ["Instagram", "TikTok", "YouTube"]]];
const c = (x) => (x?.n >= 10 ? `${fmt.f2(x.lift)} (${x.n})` : x?.n ? `(${x.n})` : "-");
let md = "# Por plataforma: lift no quartil superior (n vídeos). Células com n<10 só mostram o n.\n\n| característica | seg IG | seg TT | coment IG | coment TT | coment YT | compart IG | compart TT | coef IG | coef TT | coef YT |\n|---|---|---|---|---|---|---|---|---|---|---|\n";
for (const [n, p] of F) {
  const pr = (r) => !!r.falado_tx && p(r);
  const a = Object.fromEntries(D.map(([d, plats]) => [d, avaliar(n, pr, { linhas: RC, desfecho: d, plats })]));
  md += `| ${n} | ${c(a.seguidores.Instagram)} | ${c(a.seguidores.TikTok)} | ${c(a.comentarios.Instagram)} | ${c(a.comentarios.TikTok)} | ${c(a.comentarios.YouTube)} | ${c(a.compart.Instagram)} | ${c(a.compart.TikTok)} | ${c(a.coef.Instagram)} | ${c(a.coef.TikTok)} | ${c(a.coef.YouTube)} |\n`;
}
// experimento natural: 23 roteiros com CTA diferente por rede
const S = L.filter((r) => r.g?.cta_por_plataforma);
md += `\n## Roteiros com CTA diferente por rede (${new Set(S.map((r) => r.script_id)).size} roteiros, ${S.length} vídeos)\n\n| cliente | rede | CTA da rede (escrito) | percentil comentários | percentil seguidores | coef |\n|---|---|---|---|---|---|\n`;
for (const r of S.sort((a, b) => a.script_id.localeCompare(b.script_id) || a.plataforma.localeCompare(b.plataforma)))
  md += `| ${r.cliente} | ${r.plataforma} | ${(r.g.cta_por_plataforma[r.plataforma.toLowerCase()] ?? r.g.cta_por_plataforma.geral ?? "").slice(0, 90)} | ${fmt.f2(r.p_coment)} | ${fmt.f2(r.p_seg)} | ${fmt.f2(r.coef)} |\n`;
const lb = (p, rx) => S.filter((r) => r.plataforma === p && rx.test(norm(r.falado_tx || r.comando_video)));
md += `\nResumo: IG com "comenta" ${lb("Instagram", /comenta/).length} vídeos, percentil médio de comentários ${fmt.f2(avg(lb("Instagram", /comenta/).map((r) => r.p_coment)))}; TT com "link na bio" ${lb("TikTok", /link/).length} vídeos, percentil médio de comentários ${fmt.f2(avg(lb("TikTok", /link/).map((r) => r.p_coment)))}.\n`;
function avg(a) { const b = a.filter((x) => x != null); return b.length ? b.reduce((s, x) => s + x, 0) / b.length : null; }
writeFileSync(OUT + "comando/plataforma.md", md);
console.log(md);
