// Lotes para rotular modo: todo roteiro com vídeo analisável, ~150 por lote, ordem embaralhada.
import { writeFileSync, mkdirSync } from "node:fs";
import { carregar, ler, OUT } from "../lib.mjs";
const ids = new Set(carregar().map((r) => r.script_id));
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const xs = ler("scripts.json").filter((s) => ids.has(s.script_id) && s.texto?.trim()).map((s) => [rnd(), s]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
const N = Math.ceil(xs.length / 20);
mkdirSync(OUT + "modos/lotes", { recursive: true });
for (let i = 0; i * N < xs.length; i++) {
  const lote = xs.slice(i * N, (i + 1) * N);
  writeFileSync(OUT + `modos/lotes/lote_${String(i + 1).padStart(2, "0")}.md`, lote.map((s) => `### ${s.script_id}\ncliente: ${s.cliente}\ntitulo: ${s.titulo ?? ""}\n\n${s.texto.trim()}\n`).join("\n---\n\n"));
}
console.log("roteiros", xs.length, "| lotes", Math.ceil(xs.length / N), "x", N);
