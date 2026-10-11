// Exemplos reais por território (títulos e hooks de topo e de fundo) para o relatório.
import { carregar, exemplos, ler } from "../lib.mjs";

const L = carregar();
const cl = new Map(ler("clusters.json").map((c) => [c.script_id, c]));
const alvo = (process.argv[2] ?? "60:0,60:49,60:13,60:30,60:9,60:22,60:58,60:15,60:40,30:25,60:29").split(",");
const corta = (s, n = 170) => (s ?? "").replace(/\s+/g, " ").slice(0, n);
for (const a of alvo) {
  const [k, c] = a.split(":").map(Number);
  const pred = (r) => cl.get(r.script_id)?.[`c${k}`] === c;
  const nome = [...cl.values()].find((x) => x[`c${k}`] === c)[`nome${k}`];
  console.log(`\n== k${k}:${c} ${nome}`);
  const campo = (r) => `${r.s?.titulo} || ${corta(r.g?.hook)}`;
  for (const e of exemplos(pred, campo, { linhas: L, n: 3 })) console.log(`  TOPO ${e.cliente} ${e.plataforma} coef ${e.coef}: ${e.texto}`);
  for (const e of exemplos(pred, campo, { linhas: L, n: 2, pior: true })) console.log(`  FUNDO ${e.cliente} ${e.plataforma} coef ${e.coef}: ${e.texto}`);
}
