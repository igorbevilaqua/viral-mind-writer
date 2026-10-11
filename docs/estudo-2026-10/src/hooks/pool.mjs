// Pool de exemplos por fórmula (top 7 e 1 fraco), para escolher exemplos variados na entrega.
import { carregar, exemplos, fmt, norm } from "../lib.mjs";
import { FORMULAS } from "./formulas.mjs";
const LX = carregar().filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
const FO = Object.fromEntries(FORMULAS.map(([id, , fn]) => [id, fn]));
const extra = {
  idade: (t) => /\b(de apenas \d+ anos|de \d+ anos|\d+ anos de idade)\b/.test(norm(t)),
  ta: (t) => /\b(ta|tao)\b/.test(norm(t)),
  por_que_yt: (t) => /^(por que|porque)\b/.test(norm(t)),
  e_o_motivo_estrito: (t) => /\be o motivo\b/.test(norm(t)),
};
const ids = process.argv.slice(2);
const plat = ids.find((x) => x.startsWith("plat="))?.slice(5);
for (const id of ids.filter((x) => !x.startsWith("plat="))) {
  const fn = FO[id] ?? extra[id];
  const pred = (r) => fn(r.g.hook);
  console.log(`\n# ${id}${plat ? " (" + plat + ")" : ""}`);
  for (const e of exemplos(pred, (r) => r.g.hook, { n: 7, linhas: LX, plataforma: plat ?? null })) console.log(`  + [${e.cliente}|${e.plataforma}|${fmt.f2(e.coef)}] ${e.texto.replace(/\s+/g, " ").slice(0, 190)}`);
  for (const e of exemplos(pred, (r) => r.g.hook, { n: 1, pior: true, linhas: LX, plataforma: plat ?? null })) console.log(`  - [${e.cliente}|${e.plataforma}|${fmt.f2(e.coef)}] ${e.texto.replace(/\s+/g, " ").slice(0, 190)}`);
}
