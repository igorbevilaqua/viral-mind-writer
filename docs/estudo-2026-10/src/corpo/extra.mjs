// Refinamentos: tipo de uso do "ou seja"; tabela de tamanho por cliente.
import { carregar, avaliar, porGrupo, fmt, unicos, mediana, linhasCtl, salvar, frases } from "./h.mjs";
import { linhasStrict } from "./fundo.mjs";
const L = carregar();
const sa = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const sents = (r) => (r.g.corpo ?? "").split("\n").flatMap((p) => frases(p)).map(sa);
const T = [
  ["'Ou seja,' abrindo frase", (r) => sents(r).some((s) => /^ou seja\b/.test(s))],
  ["'ou seja' no meio da frase", (r) => sents(r).some((s) => /.\bou seja\b/.test(s)) && !sents(r).some((s) => /^ou seja\b/.test(s))],
  ["'Ou seja' + número na mesma frase", (r) => sents(r).some((s) => /\bou seja\b/.test(s) && /\d/.test(s))],
  ["'Pra você ter ideia' + número na mesma frase", (r) => sents(r).some((s) => /\b(pra|para) (voce|vc) ter (uma )?(ideia|nocao)\b/.test(s) && /\d|mil|milh|bilh/.test(s))],
];
const out = { ou_seja: {} };
for (const [n, p] of T) {
  const a = avaliar(n, p), c = avaliar(n, p, { linhas: linhasCtl() }), s = avaliar(n, p, { linhas: linhasStrict() });
  out.ou_seja[n] = { n: a.todas.n, rot: a.todas.roteiros, lift: a.todas.lift, lb: a.todas.lb, ub: a.todas.ub, or_ctl: c.mh.or, lo: c.mh.lo, hi: c.mh.hi, or_estrito: s.mh.or, slo: s.mh.lo, shi: s.mh.hi, d: a.descoberta.lift, v: a.validacao.lift, leitura: c.leitura };
  console.log(`${n}: n=${a.todas.n} rot=${a.todas.roteiros} lift ${fmt.f2(a.todas.lift)} [${fmt.f2(a.todas.lb)}-${fmt.f2(a.todas.ub)}] OR ctl ${fmt.f2(c.mh.or)} [${fmt.f2(c.mh.lo)}-${fmt.f2(c.mh.hi)}] estrito ${fmt.f2(s.mh.or)} [${fmt.f2(s.mh.lo)}-${fmt.f2(s.mh.hi)}] d/v ${fmt.f2(a.descoberta.lift)}/${fmt.f2(a.validacao.lift)} | ${c.leitura}`);
}
// tamanho por cliente: mediana de palavras, % na faixa 420-500, % abaixo de 350, lift das faixas
const W = (r) => r.g.palavras_total;
const cl = [...new Set(L.map((r) => r.cliente))];
const linhas = [];
const fx = (lo, hi) => (r) => W(r) >= lo && W(r) < hi;
const g420 = porGrupo("420-500", fx(420, 500), (r) => r.cliente, { minN: 1 }), g350 = porGrupo("<350", fx(0, 350), (r) => r.cliente, { minN: 1 });
for (const c of cl) {
  const u = unicos(L.filter((r) => r.cliente === c));
  if (u.length < 40) continue;
  const a = g420.find((x) => x.grupo === c), b = g350.find((x) => x.grupo === c);
  linhas.push({ cliente: c, roteiros: u.length, mediana: mediana(u.map(W)), pct_420_500: u.filter(fx(420, 500)).length / u.length, pct_lt350: u.filter(fx(0, 350)).length / u.length, lift_420_500: a?.lift, n_420_500: a?.n, lift_lt350: b?.lift, n_lt350: b?.n });
}
linhas.sort((x, y) => x.mediana - y.mediana);
console.log("\n| cliente | roteiros | mediana palavras | % 420-500 | % <350 | lift 420-500 (n) | lift <350 (n) |\n|---|---|---|---|---|---|---|");
for (const x of linhas) console.log(`| ${x.cliente} | ${x.roteiros} | ${x.mediana} | ${fmt.pct(x.pct_420_500)} | ${fmt.pct(x.pct_lt350)} | ${fmt.f2(x.lift_420_500)} (${x.n_420_500 ?? 0}) | ${fmt.f2(x.lift_lt350)} (${x.n_lt350 ?? 0}) |`);
out.tamanho_cliente = linhas;
salvar("extra.json", out);
