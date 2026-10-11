// Vocabulário do comando falado: n-gramas mais frequentes (por roteiro). Para calibrar as regex.
// uso: node src/comando/vocab.mjs [n] [top] [campo: falado|escrito]
import { carregar, tokens, ngramas } from "../lib.mjs";
const L = carregar();
const [n = 3, top = 60, campo = "falado"] = process.argv.slice(2);
const txt = (r) => (campo === "falado" ? r.comando_video : r.g?.bloco_final);
const cont = new Map(), vistos = new Set();
for (const r of L) {
  if (vistos.has(r.script_id + r.plataforma) || !txt(r)) continue;
  vistos.add(r.script_id + r.plataforma);
  for (const g of new Set(ngramas(tokens(txt(r)), Number(n)))) cont.set(g, (cont.get(g) ?? 0) + 1);
}
console.log([...cont].sort((a, b) => b[1] - a[1]).slice(0, Number(top)).map(([g, c]) => `${g}:${c}`).join(" | "));
