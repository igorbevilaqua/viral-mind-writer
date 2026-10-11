// 1. Tabela do playbook v2 refeita nos roteiros VM. Três textos: transcrição (o que foi dito), escrito (CRM), LLM (comando_video, o campo que o v2 usou).
import { writeFileSync } from "node:fs";
import { OUT } from "../lib.mjs";
import { medir, linhaSeg, cabSeg, linhaOutros, cabOutros } from "./medir.mjs";

const V2 = [
  ["Condicional mais promessa específica", "cond_prom_esp", "1,49 (205)"],
  ["\"Mais conteúdo como esse\"", "mais_como_esse", "1,39 (192)"],
  ["Linguagem de exclusividade", "exclusiv", "1,34 (50)"],
  ["Promessa específica (qualquer forma)", "prom_esp", "1,24 (356)"],
  ["Pergunta no comando", "pergunta", "1,16 (170)"],
  ["Promessa de frequência", "freq", "1,12 (170)"],
  ["Condicional sozinho", "cond_so", "1,09 (649)"],
  ["Urgência (agora, já segue)", "urg", "1,03 (482)"],
  ["Apresentação com nome", "apres", "0,77 (515)"],
  ["\"Para não perder o próximo vídeo\"", "nao_perder", "0,69 (357)"],
  ["Pedido de engajamento", "engaj", "0,68 (118)"],
  ["Genérico puro", "generico", "0,65 (183)"],
];
const FAIXAS = [["1 a 8", "1-8", "1,00 (105)"], ["9 a 15", "9-15", "1,05 (292)"], ["16 a 25", "16-25", "1,17 (364)"], ["26 a 40", "26-40", "0,93 (477)"], ["41 ou mais", "41+", "0,92 (123)"]];
const TEXTOS = { ft: "transcrição (o que foi dito)", fe: "escrito no CRM", ff: "comando_video (LLM, o campo do v2)" };

let md = "# Tabela do v2 refeita nos roteiros VM (desfecho: quartil superior de seguidores por mil views no estrato cliente x rede)\n";
const resumo = [];
for (const [campo, rot] of Object.entries(TEXTOS)) {
  md += `\n## Texto: ${rot}\n\n${cabSeg.replace("| característica |", "| característica | v2 lift (n) |").replace("|---|", "|---|---|")}\n`;
  for (const [nome, k, v2] of [...V2, ...FAIXAS.map(([n, f, v]) => [`tamanho ${n} palavras`, "faixa:" + f, v])]) {
    const pred = k.startsWith("faixa:") ? (r) => r[campo].faixa === k.slice(6) : (r) => !r[campo].vazio && r[campo][k];
    const o = medir(nome, pred, { outros: campo === "ft" });
    md += linhaSeg(o).replace(`| ${nome} |`, `| ${nome} | ${v2} |`) + "\n";
    if (campo === "ft") resumo.push(o);
  }
}
md += `\n## Checagens no texto da transcrição: o mesmo comando em comentários, compartilhamento e viralização\n\n${cabOutros}\n${resumo.map(linhaOutros).join("\n")}\n`;
writeFileSync(OUT + "comando/v2.md", md);
console.log(md);
