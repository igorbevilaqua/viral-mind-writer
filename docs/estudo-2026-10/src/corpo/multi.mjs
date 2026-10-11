// Uma característica contra todos os desfechos relevantes, numa linha. Usado por estilo e conclusão.
import { avaliar, fmt, resumo, linhasCtl } from "./h.mjs";
import { linhasStrict } from "./fundo.mjs";

export const DESF = [
  ["coef", ["Instagram", "TikTok", "YouTube"]],
  ["acerto", ["Instagram", "TikTok", "YouTube"]],
  ["ret_final", ["Instagram"]],
  ["compart", ["Instagram", "TikTok"]],
  ["salvamentos", ["TikTok"]],
  ["comentarios", ["Instagram", "TikTok", "YouTube"]],
];
const curta = (a) => (a.todas && a.todas.n ? `${fmt.f2(a.todas.lift)} OR ${fmt.f2(a.mh.or)} [${fmt.f2(a.mh.lo)}-${fmt.f2(a.mh.hi)}] ${fmt.f2(a.descoberta?.lift)}/${fmt.f2(a.validacao?.lift)}${a.leitura.includes("replica)") ? (a.leitura.startsWith("ajuda") ? " ✓+" : " ✓-") : ""}` : "-");

export const CABM = "| característica | vídeos / roteiros | % topo vs sem | coef lift [IC] | OR ctl tam | OR estrito | IG / TT / YT | acerto | ret_final IG | compart IG+TT | salv TT | coment | leitura coef |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|";

// ctl = MH por cliente x rede x faixa de tamanho (todos os desfechos). estrito = + roteirista (só coef).
export function multi(nome, pred) {
  const a = avaliar(nome, pred, { linhas: linhasCtl() });
  const crude = avaliar(nome, pred);
  const s = avaliar(nome, pred, { linhas: linhasStrict() });
  const o = {};
  for (const [d, ps] of DESF.slice(1)) o[d] = avaliar(nome, pred, { desfecho: d, plats: ps, linhas: linhasCtl(), minN: 25 });
  const t = crude.todas;
  const pl = ["Instagram", "TikTok", "YouTube"].map((p) => fmt.f2(crude[p]?.lift)).join(" / ");
  const txt = `| ${nome} | ${t.n} / ${t.roteiros} | ${fmt.pct(t.p)} vs ${fmt.pct(t.p_sem)} | ${fmt.f2(t.lift)} [${fmt.f2(t.lb)}-${fmt.f2(t.ub)}] | ${fmt.f2(a.mh.or)} [${fmt.f2(a.mh.lo)}-${fmt.f2(a.mh.hi)}] | ${fmt.f2(s.mh.or)} [${fmt.f2(s.mh.lo)}-${fmt.f2(s.mh.hi)}] | ${pl} | ${curta(o.acerto)} | ${curta(o.ret_final)} | ${curta(o.compart)} | ${curta(o.salvamentos)} | ${curta(o.comentarios)} | ${crude.leitura} / ctl: ${a.leitura} |`;
  return {
    txt,
    json: { nome, coef: resumo(crude), coef_ctl: resumo(a), estrito: { or: s.mh.or, lo: s.mh.lo, hi: s.mh.hi, leitura: s.leitura }, ...Object.fromEntries(Object.entries(o).map(([d, x]) => [d, resumo(x, ["Instagram", "TikTok", "YouTube"])])) },
  };
}
