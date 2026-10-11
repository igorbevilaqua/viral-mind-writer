// Gera as tabelas compactas do achados.md a partir de resultados.json (evita copiar número à mão).
import { readFileSync } from "node:fs";
import { OUT } from "../lib.mjs";
import { PAYOFF } from "./taxonomia.mjs";
const R = JSON.parse(readFileSync(`${OUT}payoff/resultados.json`, "utf8"));
const f = (x) => (x == null || !Number.isFinite(x) ? "-" : x.toFixed(2).replace(".", ","));
const marca = (lb, ub) => (lb > 1 ? " ▲" : ub < 1 ? " ▼" : "");
const ordem = Object.entries(R.coef).sort((a, b) => b[1].lift - a[1].lift).map(([k]) => k);
console.log("| payoff | roteiros (% da casa) | geral: lift [IC95] · OR MH · desc/val | Instagram | TikTok | YouTube | Negócios | Dinheiro | Tecnologia |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const k of ordem) {
  const a = R.coef[k], d = R.distribuicao[k], pr = R.por_rede[k], m = R.macro[k];
  const rede = (p) => `${f(pr[p].lift)}${marca(pr[p].or_lo, pr[p].or_hi)} (${pr[p].n})`;
  const mac = (g) => { const x = m[g]; return x ? `${f(x.lift)}${x.or_lo > 1 ? " ▲" : x.or_hi < 1 ? " ▼" : ""} (${x.n})` : "-"; };
  console.log(`| **${PAYOFF[k].nome}** | ${d.roteiros} (${Math.round(d.pct * 100)}%) | ${f(a.lift)} [${f(a.lb)} a ${f(a.ub)}] · ${f(a.or)} [${f(a.or_lo)} a ${f(a.or_hi)}] · ${f(a.lift_desc)}/${f(a.lift_val)} · ${a.leitura} | ${rede("Instagram")} | ${rede("TikTok")} | ${rede("YouTube")} | ${mac("Negócios, marcas e cases")} | ${mac("Dinheiro, economia e geopolítica")} | ${mac("Tecnologia, IA e inovação")} |`);
}
console.log("\n| payoff | compartilhamento (IG+TT) | comentários (IG+TT+YT) | salvamentos (TT) | seguidores por mil (IG) |");
console.log("|---|---|---|---|---|");
for (const k of ordem) {
  const d = R.desfechos[k];
  const c = (x) => { const v = d[x]; if (!v) return "-"; const s = v.leitura === "ajuda (replica)" ? " ▲" : v.leitura === "atrapalha (replica)" ? " ▼" : v.or_lo > 1 ? " (+)" : v.or_hi < 1 ? " (-)" : ""; return `${f(v.lift)} · OR ${f(v.or)}${s} (n=${v.n})`; };
  console.log(`| ${PAYOFF[k].nome} | ${c("compart")} | ${c("comentarios")} | ${c("salvamentos")} | ${c("seguidores")} |`);
}
