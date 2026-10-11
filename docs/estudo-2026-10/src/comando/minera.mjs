// 7. Mineração de n-gramas do bloco final contra seguidores (e comentários/compart). Descobre antes de 01/07, confirma depois.
// uso: node src/comando/minera.mjs [texto: ft|fe|ff] [desfecho] [minRoteiros]
import { writeFileSync } from "node:fs";
import { OUT, minerar, fmt } from "../lib.mjs";
import { L } from "./feat.mjs";
const [campo = "ft", desfecho = "seguidores", minR = 30] = process.argv.slice(2);
const texto = { ft: (r) => r.falado_tx, fe: (r) => [r.g?.bloco_final].join(" "), ff: (r) => r.comando_video }[campo];
const plats = desfecho === "seguidores" || desfecho === "compart" ? ["Instagram", "TikTok"] : ["Instagram", "TikTok", "YouTube"];
// só roteiros com o desfecho medido contam para o mínimo de roteiros
const linhas = L.filter((r) => plats.includes(r.plataforma) && (desfecho !== "seguidores" || r.p_seg != null) && (desfecho !== "compart" || r.p_comp != null));
const res = minerar(texto, { linhas, ns: [1, 2, 3, 4], minRoteiros: Number(minR), desfecho, plats });
const f = fmt.f2;
const out = res.filter((x) => x.replica).slice(0, 40);
let md = `# Mineração: ${campo} x ${desfecho} (min ${minR} roteiros). Candidatos com OR na descoberta fora de 1; "replica" = mesmo sinal na validação\n\n| n-grama | roteiros | lift [IC] | OR desc | OR valid [IC] | OR total [IC] |\n|---|---|---|---|---|---|\n`;
for (const x of out) md += `| ${x.gram} | ${x.roteiros} | ${f(x.lift)} [${f(x.lb)}-${f(x.ub)}] | ${f(x.or_desc)} | ${f(x.or_val)} [${f(x.or_val_lo)}-${f(x.or_val_hi)}] | ${f(x.or_total)} [${f(x.or_lo)}-${f(x.or_hi)}] |\n`;
md += `\nnão replicaram: ${res.filter((x) => !x.replica).slice(0, 25).map((x) => `${x.gram} (desc ${f(x.or_desc)}, val ${f(x.or_val)})`).join("; ")}\n`;
writeFileSync(OUT + `comando/minera_${campo}_${desfecho}.md`, md);
console.log(md);
