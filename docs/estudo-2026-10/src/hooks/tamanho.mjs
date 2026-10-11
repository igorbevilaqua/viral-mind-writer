// Tamanho do hook e do subhook por plataforma: bins de palavras e frases contra coef (e retenção no IG).
import { writeFileSync } from "node:fs";
import { carregar, avaliar, OUT, fmt, palavras, frases } from "../lib.mjs";
const L = carregar();
const f2 = fmt.f2;
const P = ["Instagram", "TikTok", "YouTube"];
const bins = (nome, val, cortes) => cortes.map(([lo, hi]) => [`${nome} ${hi == null ? lo + "+" : lo + "-" + hi}`, (r) => { const v = val(r); return v != null && v >= lo && (hi == null || v <= hi); }]);
const pf = (r) => palavras(frases(r.g.hook)[0] ?? "");
const BLOCOS = {
  "palavras do hook (escrito)": bins("hook", (r) => palavras(r.g.hook), [[0, 12], [13, 17], [18, 22], [23, 27], [28, 34], [35, null]]),
  "frases do hook": bins("frases", (r) => frases(r.g.hook).length, [[1, 1], [2, 2], [3, null]]),
  "palavras da 1a frase": bins("1a frase", pf, [[0, 10], [11, 15], [16, 20], [21, 25], [26, null]]),
  "palavras hook + subhook": bins("h+s", (r) => palavras(r.g.hook) + palavras(r.g.subhook), [[0, 30], [31, 40], [41, 50], [51, 60], [61, null]]),
  "palavras do subhook": bins("sub", (r) => palavras(r.g.subhook), [[0, 8], [9, 15], [16, 22], [23, 30], [31, 40], [41, null]]),
  "palavras do hook FALADO": bins("falado", (r) => (r.hook_video ? palavras(r.hook_video) : null), [[0, 15], [16, 20], [21, 25], [26, 30], [31, 40], [41, null]]),
};
const out = ["# Tamanho de hook e subhook por plataforma", "", "Célula: lift (OR MH) n vídeos. Negrito quando o IC do OR exclui 1.", ""];
const cel = (a) => { const t = a.todas; if (!t || t.n < 15) return "-"; const s = `${f2(t.lift)} (${f2(a.mh.or)}) ${t.n}`; return a.mh.lo > 1 || a.mh.hi < 1 ? `**${s}**` : s; };
for (const [bloco, bs] of Object.entries(BLOCOS)) {
  out.push(`## ${bloco}`, "", "| faixa | IG coef | TT coef | YT coef | todas coef | todas acerto | IG ret_hook | IG ret_sub |", "|---|---|---|---|---|---|---|---|");
  console.log(`\n## ${bloco}`);
  for (const [nome, pred] of bs) {
    const cs = P.map((p) => avaliar(nome, pred, { plats: [p], minN: 15 }));
    const all = avaliar(nome, pred), ac = avaliar(nome, pred, { desfecho: "acerto" });
    const rh = avaliar(nome, pred, { desfecho: "ret_hook", plats: ["Instagram"], minN: 15 }), rs = avaliar(nome, pred, { desfecho: "ret_sub", plats: ["Instagram"], minN: 15 });
    const row = `| ${nome} | ${cs.map(cel).join(" | ")} | ${cel(all)} ${all.leitura === "ajuda (replica)" || all.leitura === "atrapalha (replica)" ? "(" + all.leitura + ")" : ""} | ${cel(ac)} | ${cel(rh)} | ${cel(rs)} |`;
    out.push(row); console.log(row);
  }
  out.push("");
}
writeFileSync(`${OUT}hooks/tamanho.md`, out.join("\n"));
