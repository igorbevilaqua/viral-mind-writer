// Confere rótulos a olho: imprime texto + rótulos de k roteiros de uma rodada; e concordância entre duas rodadas.
// uso: node src/payoff/conferir.mjs <rodadaA> [rodadaB] [k] [inicio]
import { readFileSync } from "node:fs";
import { ler, OUT } from "../lib.mjs";
const [a, b, k = 15, ini = 0] = process.argv.slice(2);
const carga = (r) => new Map(readFileSync(`${OUT}payoff/rot_${r}.jsonl`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).map((x) => [x.script_id, x]));
const A = carga(a), B = b && b !== "-" ? carga(b) : null;
const S = new Map(ler("scripts.json").map((s) => [s.script_id, s])), G = new Map(ler("segmentos.json").map((s) => [s.script_id, s]));
const cut = (t, n) => (t ?? "").replace(/\s+/g, " ").slice(0, n);
const campos = ["payoff", "payoff2", "promessa_hook", "funcao_subhook", "tipo_conclusao", "protagonista", "antagonista", "recorte", "utilidade_pratica"];
let i = 0;
for (const [id, x] of A) {
  if (i++ < Number(ini)) continue; if (i > Number(ini) + Number(k)) break;
  const s = S.get(id), g = G.get(id);
  console.log(`\n### ${s.cliente} | ${cut(s.titulo, 90)}\nH: ${cut(g.hook, 230)}\nS: ${cut(g.subhook, 200)}\nC2: ${cut(g.conclusao2, 180)}\nC: ${cut(g.conclusao, 240)}`);
  console.log(`=> ${campos.map((c) => `${c}=${x[c]}`).join(" ")}\n   sinal: ${x.sinal}`);
  if (B?.get(id)) { const y = B.get(id); const dif = campos.filter((c) => x[c] !== y[c]).map((c) => `${c}:${y[c]}`); if (dif.length) console.log(`   [${b}] ${dif.join(" ")}`); }
}
if (B) {
  const comuns = [...A.keys()].filter((id) => B.has(id));
  console.log(`\nconcordância ${a} x ${b} (${comuns.length} roteiros):`);
  for (const c of campos) console.log(`  ${c}: ${Math.round((100 * comuns.filter((id) => A.get(id)[c] === B.get(id)[c]).length) / comuns.length)}%`);
  console.log(`  payoff igual ao payoff ou payoff2 do outro: ${Math.round((100 * comuns.filter((id) => [B.get(id).payoff, B.get(id).payoff2].includes(A.get(id).payoff)).length) / comuns.length)}%`);
}
