// Exemplos reais (topo e piores) por característica. Uso: node ex.mjs hook|sub id1 id2 ... [--n 3] [--pior 1]
import { exemplos, fmt, carregar } from "../lib.mjs";
const LX = carregar().filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
import { HOOK, SUB } from "./feat.mjs";
const args = process.argv.slice(2);
const parte = args[0];
const n = Number(args[args.indexOf("--n") + 1]) || 3, np = args.includes("--pior") ? Number(args[args.indexOf("--pior") + 1]) : 1;
const ids = args.slice(1).filter((x, i, a) => !x.startsWith("--") && !(a[i - 1] ?? "").startsWith("--"));
const F = Object.fromEntries([...HOOK, ...SUB].map(([id, , , fn]) => [id, fn]));
const campo = parte === "sub" ? (r) => r.g.subhook : (r) => r.g.hook;
const corta = (t, k = 230) => (t ?? "").replace(/\s+/g, " ").slice(0, k);
const lin = (e) => `   [${e.cliente} | ${e.plataforma} | coef ${fmt.f2(e.coef)}] ${corta(e.texto)}`;
for (const id of ids) {
  const pred = (r) => F[id](campo(r));
  console.log(`\n# ${id}`);
  const cm = parte === "sub" ? (r) => `H: ${corta(r.g.hook, 120)} || S: ${corta(r.g.subhook, 200)}` : campo;
  for (const e of exemplos(pred, cm, { n, linhas: LX })) console.log(lin(e));
  if (np) for (const e of exemplos(pred, cm, { n: np, pior: true, linhas: LX })) console.log(" -" + lin(e).slice(2));
}
