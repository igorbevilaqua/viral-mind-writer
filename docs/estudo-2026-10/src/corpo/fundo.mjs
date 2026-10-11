// Aprofundamento de uma característica: controle estrito (cliente x rede x tamanho x roteirista), macro nicho,
// consistência entre clientes, outros desfechos e exemplos reais do trecho.
import { carregar, avaliar, porGrupo, fmt, resumo, linhasCtl, exemplos, frases, faixaTam } from "./h.mjs";

let _strict = null;
export function linhasStrict() {
  if (_strict) return _strict;
  _strict = carregar().map((r) => ({ ...r, estrato: `${r.estrato}|${faixaTam(r.g.palavras_total)}|${r.s?.roteirista ?? "-"}` }));
  return _strict;
}

// trecho: a frase do texto que casa com a regex (sem acento na busca, original na saída)
const sa = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export const trecho = (texto, re) => {
  if (!re) return (texto ?? "").slice(0, 300);
  for (const p of (texto ?? "").split("\n")) for (const s of frases(p)) if (re.test(sa(s))) return s.slice(0, 300);
  return (texto ?? "").slice(0, 200);
};

export function aprofundar(nome, pred, { re = null, campo = (r) => r.g.corpo, desfechos = [["ret_final", ["Instagram"]]], nEx = 3, contra = true } = {}) {
  const L = carregar();
  const a = avaliar(nome, pred);
  const s = avaliar(nome, pred, { linhas: linhasStrict() });
  const macro = porGrupo(nome, pred, (r) => r.macro, { minN: 20 });
  const cli = porGrupo(nome, pred, (r) => r.cliente, { minN: 15 });
  const plats = {};
  for (const p of ["Instagram", "TikTok", "YouTube"]) { const x = avaliar(nome, pred, { plats: [p], linhas: linhasCtl() }); plats[p] = { lift: x.todas?.lift, n: x.todas?.n, or: x.mh.or, lo: x.mh.lo, hi: x.mh.hi, d: x.descoberta?.lift, v: x.validacao?.lift }; }
  const outros = desfechos.map(([d, ps]) => ({ d, a: avaliar(nome, pred, { desfecho: d, plats: ps, linhas: linhasCtl() }) }));
  const ex = exemplos(pred, (r) => trecho(campo(r), re), { n: nEx });
  const fraco = contra ? exemplos(pred, (r) => trecho(campo(r), re), { n: 1, pior: true }) : [];

  const l = [];
  l.push(`\n### ${nome}`);
  l.push(`coef: n=${a.todas.n} vídeos / ${a.todas.roteiros} roteiros / ${a.todas.clientes} clientes | ${fmt.pct(a.todas.p)} vs ${fmt.pct(a.todas.p_sem)} | lift ${fmt.f2(a.todas.lift)} [${fmt.f2(a.todas.lb)}-${fmt.f2(a.todas.ub)}] | OR MH ${fmt.f2(a.mh.or)} [${fmt.f2(a.mh.lo)}-${fmt.f2(a.mh.hi)}] | OR estrito (cli x rede x tam x roteirista) ${fmt.f2(s.mh.or)} [${fmt.f2(s.mh.lo)}-${fmt.f2(s.mh.hi)}] | desc/val ${fmt.f2(a.descoberta?.lift)}/${fmt.f2(a.validacao?.lift)} | ${a.leitura}`);
  l.push(`por rede (ctl tam): ` + Object.entries(plats).map(([p, x]) => `${p} lift ${fmt.f2(x.lift)} n=${x.n} OR ${fmt.f2(x.or)} [${fmt.f2(x.lo)}-${fmt.f2(x.hi)}] d/v ${fmt.f2(x.d)}/${fmt.f2(x.v)}`).join(" | "));
  l.push(`macro: ` + macro.map((m) => `${m.grupo.slice(0, 14)} ${fmt.f2(m.lift)} (n=${m.n}) OR ${fmt.f2(m.mh.or)}`).join(" | "));
  const up = cli.filter((c) => c.lift > 1).length;
  l.push(`clientes com n>=15: ${cli.length}, lift>1 em ${up} | ` + cli.map((c) => `${c.grupo.split(" ")[0]} ${fmt.f2(c.lift)}(${c.n})`).join(" "));
  for (const { d, a: x } of outros) l.push(`${d} (${x.todas ? "ctl tam" : ""}): n=${x.todas?.n} lift ${fmt.f2(x.todas?.lift)} [${fmt.f2(x.todas?.lb)}-${fmt.f2(x.todas?.ub)}] OR ${fmt.f2(x.mh.or)} [${fmt.f2(x.mh.lo)}-${fmt.f2(x.mh.hi)}] d/v ${fmt.f2(x.descoberta?.lift)}/${fmt.f2(x.validacao?.lift)} | ${x.leitura}`);
  for (const e of ex) l.push(`  + ${e.cliente} | ${e.plataforma} | coef ${fmt.f2(e.coef)} | "${e.texto}"`);
  for (const e of fraco) l.push(`  - ${e.cliente} | ${e.plataforma} | coef ${fmt.f2(e.coef)} | "${e.texto}"`);
  console.log(l.join("\n"));
  return {
    nome, coef: resumo(a), estrito: { or: s.mh.or, lo: s.mh.lo, hi: s.mh.hi, leitura: s.leitura }, plats,
    macro: macro.map((m) => ({ grupo: m.grupo, n: m.n, lift: m.lift, or: m.mh.or, lo: m.mh.lo, hi: m.mh.hi })),
    clientes: { n: cli.length, lift_maior_1: up, lista: cli.map((c) => ({ c: c.grupo, n: c.n, lift: c.lift })) },
    outros: outros.map(({ d, a: x }) => ({ desfecho: d, ...resumo(x, ["Instagram", "TikTok"]) })),
    exemplos: ex, contraexemplo: fraco,
  };
}
