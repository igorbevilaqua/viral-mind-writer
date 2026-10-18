// Amostra cega para descobrir os modos: por cliente, roteiros de topo e de baixo (sem mostrar o desempenho).
import { writeFileSync } from "node:fs";
import { carregar, ler, OUT } from "../lib.mjs";
const L = carregar();
const porScript = new Map();
for (const r of L) (porScript.get(r.script_id) ?? porScript.set(r.script_id, { cliente: r.cliente, macro: r.macro, ps: [] }).get(r.script_id)).ps.push(r.pq);
const scripts = new Map(ler("scripts.json").map((s) => [s.script_id, s]));
const porCliente = new Map();
for (const [id, v] of porScript) {
  const s = scripts.get(id);
  if (!s?.texto || s.texto.split(/\s+/).length < 150) continue;
  v.media = v.ps.reduce((a, b) => a + b, 0) / v.ps.length;
  (porCliente.get(v.cliente) ?? porCliente.set(v.cliente, []).get(v.cliente)).push({ id, ...v, s });
}
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const amostra = [];
for (const [c, xs] of porCliente) {
  if (xs.length < 10) continue;
  xs.sort((a, b) => b.media - a.media);
  const q = Math.floor(xs.length / 4);
  const pick = (arr, n) => arr.map((x) => [rnd(), x]).sort((a, b) => a[0] - b[0]).slice(0, n).map((p) => p[1]);
  amostra.push(...pick(xs.slice(0, q), 3), ...pick(xs.slice(-q), 2), ...pick(xs.slice(q, -q), 1));
}
amostra.sort(() => rnd() - 0.5);
const md = amostra.map((x) => `### ${x.id}\ncliente: ${x.cliente} (${x.macro})\ntitulo: ${x.s.titulo ?? ""}\n\n${x.s.texto.trim()}\n`).join("\n---\n\n");
writeFileSync(OUT + "modos/amostra_descoberta.md", md);
console.log("clientes", porCliente.size, "| amostra", amostra.length, "| palavras", md.split(/\s+/).length);
