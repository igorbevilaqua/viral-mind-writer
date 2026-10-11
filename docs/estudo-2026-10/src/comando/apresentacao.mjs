// 3. Apresentação "Eu sou...": existe, posição, credencial. Texto principal: transcrição (ft); escrito (fe) como checagem.
import { writeFileSync } from "node:fs";
import { OUT, porGrupo, fmt } from "../lib.mjs";
import { L } from "./feat.mjs";
import { medir, linhaSeg, cabSeg, linhaOutros, cabOutros } from "./medir.mjs";

const grupos = (k) => [
  [`[${k}] com apresentação`, (r) => r[k].apres],
  [`[${k}] sem apresentação`, (r) => !r[k].vazio && !r[k].apres],
  [`[${k}] apresentação ANTES da promessa`, (r) => r[k].pos_apres === "antes"],
  [`[${k}] apresentação DEPOIS da promessa`, (r) => r[k].pos_apres === "depois"],
  [`[${k}] apresentação sem promessa nenhuma`, (r) => r[k].pos_apres === "sem_promessa"],
  [`[${k}] nome sem credencial`, (r) => r[k].apres && !r[k].credencial],
  [`[${k}] qualquer credencial`, (r) => r[k].apres && r[k].credencial],
  [`[${k}] "especialista em"`, (r) => r[k].apres && r[k].c_especialista],
  [`[${k}] cargo (CEO, fundador, sócio, diretor)`, (r) => r[k].apres && r[k].c_cargo],
  [`[${k}] profissão (empreendedor, investidor, advogado...)`, (r) => r[k].apres && r[k].c_profissao],
  [`[${k}] feito ("construí", "já vendi", "ajudei")`, (r) => r[k].apres && r[k].c_feito],
  [`[${k}] número na credencial`, (r) => r[k].apres && r[k].c_numero],
  [`[${k}] anos de mercado`, (r) => r[k].apres && r[k].c_anos],
  [`[${k}] instituição (da Exame, da XP...)`, (r) => r[k].apres && r[k].c_instituicao],
];
let md = "# Apresentação \"Eu sou\"\n";
for (const k of ["ft", "fe"]) {
  const os = grupos(k).map(([n, p]) => medir(n, p));
  md += `\n## Texto: ${k === "ft" ? "transcrição" : "escrito"}\n\n${cabSeg}\n${os.map(linhaSeg).join("\n")}\n\n${cabOutros}\n${os.map(linhaOutros).join("\n")}\n`;
}
// credencial por cliente (escrito), só clientes com variação
md += "\n## Credencial por cliente (escrito, seguidores)\n\n| cliente | n com credencial | lift | OR MH |\n|---|---|---|---|\n";
for (const g of porGrupo("credencial", (r) => r.fe.apres && r.fe.credencial, (r) => r.cliente, { desfecho: "seguidores", plats: ["Instagram", "TikTok"], minN: 8 }))
  md += `| ${g.grupo} | ${g.n} | ${fmt.f2(g.lift)} | ${fmt.f2(g.mh.or)} |\n`;
writeFileSync(OUT + "comando/apresentacao.md", md);
console.log(md);
