// Tarefa 1: o mesmo roteiro em duas redes. d = pq(A) - pq(B). Que características empurram d?
// Saída: out/plataformas/pareado.txt e pareado.json
import { writeFileSync } from "node:fs";
import { OUT } from "../lib.mjs";
import { FEATS, pares, pareado, SIGLA } from "./feat.mjs";

const PARES = [["Instagram", "TikTok"], ["Instagram", "YouTube"], ["TikTok", "YouTube"]];
const pp = (x) => (Number.isFinite(x) ? (x >= 0 ? "+" : "") + (100 * x).toFixed(1) : "-");
const linhas = [], json = {};
for (const [A, B] of PARES) {
  const prs = pares(A, B);
  const md = prs.reduce((s, p) => s + p.d, 0) / prs.length;
  const nome = `${SIGLA[A]}-${SIGLA[B]}`;
  linhas.push(`\n## ${nome}: ${prs.length} roteiros, ${new Set(prs.map((p) => p.cliente)).size} clientes, média de d = ${pp(md)} pp (positivo = melhor no ${SIGLA[A]})`);
  const res = pareado(prs, FEATS);
  json[nome] = res;
  res.sort((x, y) => Math.abs(y.cli) - Math.abs(x.cli));
  linhas.push("| característica | n com / sem | Δ bruto pp [IC] | Δ dentro do cliente pp [IC] | clientes (mesmo sinal / com n>=3) | desc / valid | marca |", "|---|---|---|---|---|---|---|");
  for (const r of res) {
    const marca = r.deRede ? (r.replica ? "DE REDE (replica)" : "de rede (sem replicação)") : r.foraDeZero ? "IC fora de zero, poucos clientes" : "";
    if (!marca && Math.abs(r.cli) < 0.04) continue;
    linhas.push(`| ${r.nome} | ${r.n1} / ${r.n0} | ${pp(r.raw)} [${pp(r.raw_lo)} a ${pp(r.raw_hi)}] | ${pp(r.cli)} [${pp(r.lo)} a ${pp(r.hi)}] | ${r.mesmoSinal}/${r.kCli} | ${pp(r.desc)} / ${pp(r.val)} | ${marca} |`);
  }
}
writeFileSync(OUT + "plataformas/pareado.txt", linhas.join("\n"));
writeFileSync(OUT + "plataformas/pareado.json", JSON.stringify(json));
// console: só o que passou no critério
for (const [nome, res] of Object.entries(json)) {
  console.log(`\n${nome}: ${res.filter((r) => r.deRede).length} de rede (${res.filter((r) => r.deRede && r.replica).length} replicam) de ${res.length}`);
  for (const r of res.filter((r) => r.deRede).sort((a, b) => b.cli - a.cli)) console.log(`  ${pp(r.cli)} [${pp(r.lo)} a ${pp(r.hi)}] ${r.nome} n=${r.n1} cli=${r.mesmoSinal}/${r.kCli} d/v=${pp(r.desc)}/${pp(r.val)}${r.replica ? " R" : ""}`);
}
