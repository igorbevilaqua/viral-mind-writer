// Consulta rápida de exemplos já calculados: node src/clientes/ex.mjs "Cliente" regra1,regra2 [TERR]
import { readFileSync } from "node:fs";
const J = JSON.parse(readFileSync(new URL("../../out/clientes/clientes.json", import.meta.url), "utf8"));
const [cli, regras = "", terr] = process.argv.slice(2);
const c = J.clientes.find((x) => x.cliente === cli);
const f = (e) => `  ${e.plataforma.slice(0, 2)} ${e.p_seg != null ? "p" + Math.round(e.p_seg * 100) : "coef " + e.coef.toFixed(2)} | ${e.texto.slice(0, 260)}`;
for (const k of regras.split(",").filter(Boolean)) {
  const b = c.bateria[k], e = c.exemplos[k];
  console.log(`## ${k} | ${b?.leitura} | ${Math.round(b?.p * 100)}% x ${Math.round(b?.p_sem * 100)}% n=${b?.n} rot=${b?.roteiros} uso=${Math.round(b?.uso * 100)}%`);
  if (e) { console.log(" TOPO"); e.topo.forEach((x) => console.log(f(x))); console.log(" FRACO"); e.fraco.forEach((x) => console.log(f(x))); }
}
if (terr) for (const [t, e] of Object.entries(c.exemplos_territorio)) { console.log(`## TERR ${t}`); e.topo.forEach((x) => console.log(f(x))); e.fraco.forEach((x) => console.log(" fraco" + f(x))); }
