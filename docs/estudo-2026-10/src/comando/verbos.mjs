// 2. Verbo e pedido: cada pedido no desfecho que ele pede e em seguidores. Texto: transcrição (ft); escrito (fe) como checagem.
import { writeFileSync } from "node:fs";
import { OUT, avaliar, tabela } from "../lib.mjs";
import { L } from "./feat.mjs";
import { medir, linhaSeg, cabSeg, linhaOutros, cabOutros } from "./medir.mjs";

const t = (r) => r.ft;
const opiniao = (f) => f.v_comenta && !f.comenta_palavra;
const P = [
  ["pede para seguir (segue/siga)", (r) => t(r).v_segue],
  ["NÃO pede para seguir", (r) => !t(r).vazio && !t(r).v_segue],
  ["comenta (qualquer)", (r) => t(r).v_comenta],
  ["comenta palavra-chave (\"comenta X que eu te mando\")", (r) => t(r).comenta_palavra],
  ["pergunta de opinião / me conta", (r) => opiniao(t(r))],
  ["compartilha / manda para alguém", (r) => t(r).v_compart],
  ["salva", (r) => t(r).v_salva],
  ["link na bio", (r) => t(r).v_link_bio],
  ["curte", (r) => t(r).v_curte],
  ["dois pedidos ou mais (segue + outro)", (r) => t(r).v_segue && t(r).engaj],
];
let md = "# Verbo e pedido (texto: transcrição)\n\n## Seguidores (IG+TT)\n\n" + cabSeg + "\n";
const os = P.map(([n, p]) => medir(n, p));
md += os.map(linhaSeg).join("\n") + "\n\n## Checagens\n\n" + cabOutros + "\n" + os.map(linhaOutros).join("\n") + "\n";

// no desfecho que o pedido pede, por plataforma
const alvo = [
  ["comenta (qualquer)", (r) => t(r).v_comenta, "comentarios", ["Instagram", "TikTok", "YouTube"]],
  ["comenta palavra-chave", (r) => t(r).comenta_palavra, "comentarios", ["Instagram", "TikTok", "YouTube"]],
  ["pergunta de opinião / me conta", (r) => opiniao(t(r)), "comentarios", ["Instagram", "TikTok", "YouTube"]],
  ["compartilha / manda para alguém", (r) => t(r).v_compart, "compart", ["Instagram", "TikTok"]],
  ["salva", (r) => t(r).v_salva, "salvamentos", ["Instagram", "TikTok"]],
  ["escrito: comenta (qualquer)", (r) => r.fe.v_comenta, "comentarios", ["Instagram", "TikTok", "YouTube"]],
  ["escrito: compartilha / manda", (r) => r.fe.v_compart, "compart", ["Instagram", "TikTok"]],
];
for (const [n, p, d, plats] of alvo) md += `\n### ${n} -> ${d}\n\n` + tabela([avaliar(n, p, { desfecho: d, plats })], plats) + "\n";
// contagem por plataforma
md += "\n## Contagem por plataforma (vídeos com o pedido na transcrição)\n\n| pedido | IG | TT | YT | FB |\n|---|---|---|---|---|\n";
for (const [n, p] of P) md += `| ${n} | ${["Instagram", "TikTok", "YouTube", "Facebook"].map((pl) => L.filter((r) => r.plataforma === pl && p(r)).length).join(" | ")} |\n`;
writeFileSync(OUT + "comando/verbos.md", md);
console.log(md);
