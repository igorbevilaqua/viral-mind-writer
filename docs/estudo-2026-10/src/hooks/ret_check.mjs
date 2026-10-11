// Retenção (IG): o percentil p_ret_* é por cliente x plataforma, sem trimestre. Refaço o MH com o trimestre no estrato
// para ver se o efeito não é tendência de época (o roteiro mudou de forma e a edição melhorou ao mesmo tempo).
import { carregar, avaliar, fmt, palavras, frases } from "../lib.mjs";
import { HOOK, SUB } from "./feat.mjs";
const L = carregar();
const LQ = L.map((r) => ({ ...r, estrato: `${r.estrato}|${r.tri}` }));
const F = Object.fromEntries([...HOOK, ...SUB].map(([id, , , fn]) => [id, fn]));
const f2 = fmt.f2;
const T = [
  ["hook <=12 palavras", (r) => palavras(r.g.hook) <= 12],
  ["hook 28+ palavras", (r) => palavras(r.g.hook) >= 28],
  ["hook 1 frase", (r) => frases(r.g.hook).length === 1],
  ["hook 2 frases", (r) => frases(r.g.hook).length === 2],
  ["hook 2+ frases", (r) => frases(r.g.hook).length >= 2],
  ["h+s 61+", (r) => palavras(r.g.hook) + palavras(r.g.subhook) >= 61],
  ["exclamação no hook", (r) => F.exclamacao(r.g.hook)],
  ["ab_artigo_nome", (r) => F.ab_artigo_nome(r.g.hook)],
  ["ab_demonstrativo", (r) => F.ab_demonstrativo(r.g.hook)],
  ["acabou_de", (r) => F.acabou_de(r.g.hook)],
  ["ninguem", (r) => F.ninguem(r.g.hook)],
  ["figura", (r) => F.figura(r.g.hook)],
  ["china", (r) => F.china(r.g.hook)],
  ["eua", (r) => F.eua(r.g.hook)],
  ["ia", (r) => F.ia(r.g.hook)],
  ["sem_nome_proprio", (r) => F.sem_nome_proprio(r.g.hook)],
  ["sub: isso porque", (r) => F.sb_isso_porque(r.g.subhook)],
  ["sub: 23-30 palavras", (r) => palavras(r.g.subhook) >= 23 && palavras(r.g.subhook) <= 30],
];
console.log("característica | desfecho | OR cliente×plat | OR cliente×plat×tri | lift desc/val (n)");
for (const d of ["ret_hook", "ret_sub"]) for (const [nome, pred] of T) {
  const a = avaliar(nome, pred, { desfecho: d, plats: ["Instagram"], minN: 15 });
  const q = avaliar(nome, pred, { desfecho: d, plats: ["Instagram"], minN: 15, linhas: LQ });
  console.log(`${nome} | ${d} | ${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}] | ${f2(q.mh.or)} [${f2(q.mh.lo)}-${f2(q.mh.hi)}] | ${f2(a.descoberta?.lift)} (${a.descoberta?.n}) / ${f2(a.validacao?.lift)} (${a.validacao?.n})`);
}
