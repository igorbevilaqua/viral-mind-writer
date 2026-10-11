// Confusão: o efeito da característica sobrevive quando o tema entra no estrato do MH?
// Truque: refaz r.estrato = cliente|plataforma|<tema>, e avalia de novo (o lib estratifica por r.estrato).
import { carregar, avaliar, fmt } from "../lib.mjs";
import { HOOK, SUB } from "./feat.mjs";
const L = carregar();
const F = Object.fromEntries([...HOOK, ...SUB].map(([id, , , fn]) => [id, fn]));
const h = (id) => (r) => F[id](r.g?.hook);
const s = (id) => (r) => F[id](r.g?.subhook);
const f2 = fmt.f2;

// temas que podem confundir
const TEMA = {
  china_est: (r) => (F.pais_est(r.g.hook) ? "est" : "-"),
  ia: (r) => (F.ia(r.g.hook) ? "ia" : "-"),
  nome: (r) => (F.nome_proprio_qualquer(r.g.hook) ? "nome" : "-"),
  tudo: (r) => [F.pais_est(r.g.hook), F.ia(r.g.hook), F.nome_proprio_qualquer(r.g.hook), F.regiao_br(r.g.hook)].map(Number).join(""),
  roteirista: (r) => r.s?.roteirista ?? "?",
  tri: (r) => r.tri,
};
const comEstrato = (k) => L.map((r) => ({ ...r, estrato: `${r.estrato}|${TEMA[k](r)}` }));
const cache = {};
const linhasCom = (k) => (cache[k] ??= comEstrato(k));

const testes = [
  ["ab_artigo_nome", h("ab_artigo_nome"), ["china_est", "ia", "nome", "tudo", "roteirista"]],
  ["ab_demonstrativo", h("ab_demonstrativo"), ["china_est", "ia", "nome", "tudo", "roteirista"]],
  ["ab_demonst_objeto", h("ab_demonst_objeto"), ["ia", "tudo"]],
  ["acabou_de", h("acabou_de"), ["china_est", "ia", "nome", "tudo", "roteirista"]],
  ["voce", h("voce"), ["china_est", "ia", "nome", "tudo", "roteirista"]],
  ["ia", h("ia"), ["china_est", "nome", "roteirista"]],
  ["empresa_marca", h("empresa_marca"), ["china_est", "ia", "nome", "tudo"]],
  ["sem_nome_proprio", h("sem_nome_proprio"), ["china_est", "ia", "roteirista"]],
  ["china", h("china"), ["ia", "nome", "roteirista"]],
  ["regiao_br", h("regiao_br"), ["china_est", "ia", "nome", "roteirista"]],
  ["br_x_est", h("br_x_est"), ["china_est", "ia", "nome", "roteirista"]],
  ["figura", h("figura"), ["china_est", "ia", "nome", "roteirista"]],
  ["guerra", h("guerra"), ["china_est", "ia", "nome", "tudo", "roteirista"]],
  ["e_o_motivo", h("e_o_motivo"), ["china_est", "ia", "nome", "tudo"]],
  ["problema", h("problema"), ["china_est", "ia", "nome", "tudo"]],
  ["v_ser_capaz", h("v_ser_capaz"), ["ia", "nome", "tudo"]],
  ["nunca", h("nunca"), ["china_est", "ia", "nome", "tudo"]],
  ["sb_isso_porque", s("sb_isso_porque"), ["china_est", "ia", "nome", "tudo", "roteirista"]],
  ["sf_historia", s("sf_historia"), ["china_est", "ia", "nome", "tudo"]],
];
console.log("característica | MH base | " + "controle extra: OR [IC]".padEnd(10));
for (const [id, pred, ks] of testes) {
  const base = avaliar(id, pred);
  const extra = ks.map((k) => { const a = avaliar(id, pred, { linhas: linhasCom(k) }); return `${k}: ${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}]`; });
  console.log(`${id} | ${f2(base.mh.or)} [${f2(base.mh.lo)}-${f2(base.mh.hi)}] | ${extra.join(" ; ")}`);
}
