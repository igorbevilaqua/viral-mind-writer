// Robustez: tira um cliente de cada vez (leave-one-client-out) e refaz o OR MH. Se um cliente sozinho carrega o achado, aparece aqui.
import { carregar, mantelHaenszel, DESFECHOS, fmt } from "../lib.mjs";
import { HOOK } from "./feat.mjs";
import { FORMULAS } from "./formulas.mjs";
import { SUBF } from "./sub_combo.mjs";
const L = carregar().filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
const F = Object.fromEntries(HOOK.map(([id, , , fn]) => [id, fn]));
const FO = Object.fromEntries(FORMULAS.map(([id, , fn]) => [id, fn]));
const SF = Object.fromEntries(SUBF.map(([id, , fn]) => [id, fn]));
const y = DESFECHOS.coef, f2 = fmt.f2;
const ITENS = [
  ["A/O + nome", (r) => F.ab_artigo_nome(r.g.hook)], ["Esse/Essa", (r) => F.ab_demonstrativo(r.g.hook)], ["sem nome próprio", (r) => F.sem_nome_proprio(r.g.hook)],
  ["acabou de", (r) => F.acabou_de(r.g.hook)], ["conflito nomeado", (r) => FO.conflito_nomeado(r.g.hook)], ["autoridade proibiu", (r) => FO.autoridade_proibiu(r.g.hook)],
  ["problema", (r) => F.problema(r.g.hook)], ["estrangeiro", (r) => F.pais_est(r.g.hook)], ["China", (r) => F.china(r.g.hook)], ["região BR", (r) => F.regiao_br(r.g.hook)],
  ["famoso", (r) => F.figura(r.g.hook)], ["IA", (r) => F.ia(r.g.hook)], ["você", (r) => F.voce(r.g.hook)], ["empresa/marca", (r) => F.empresa_marca(r.g.hook)],
  ["nunca", (r) => F.nunca(r.g.hook)], ["Em/antigamente abre", (r) => FO.volta_tempo_abre(r.g.hook)], ["Essa empresa/IA abre", (r) => FO.essa_coisa(r.g.hook)],
  ["Esse [pessoa] anônima", (r) => FO.esse_pessoa_anonima(r.g.hook)], ["e o motivo", (r) => F.e_o_motivo(r.g.hook)],
  ["sub Isso porque", (r) => SF.isso_porque(r.g.subhook)], ["sub Essa...", (r) => /^essa\b/i.test((r.g.subhook ?? "").trim())], ["sub biografia", (r) => SF.biografia(r.g.subhook)], ["sub lugar abre", (r) => SF.lugar_abre(r.g.subhook)], ["sub eles", (r) => SF.coletivo_eles(r.g.subhook)],
];
const clientes = [...new Set(L.map((r) => r.cliente))];
console.log("item | OR todos | OR mín (sem quem) | OR máx (sem quem) | vira de lado?");
for (const [nome, pred] of ITENS) {
  const tot = mantelHaenszel(L, pred, y);
  let mn = { or: Infinity }, mx = { or: -Infinity };
  for (const c of clientes) {
    const m = mantelHaenszel(L.filter((r) => r.cliente !== c), pred, y);
    if (m.or == null) continue;
    if (m.or < mn.or) mn = { ...m, c }; if (m.or > mx.or) mx = { ...m, c };
  }
  const vira = (tot.or > 1 && (mn.lo ?? 0) <= 1) || (tot.or < 1 && (mx.hi ?? 9) >= 1) ? "IC encosta em 1 sem " + (tot.or > 1 ? mn.c : mx.c) : "não";
  console.log(`${nome} | ${f2(tot.or)} [${f2(tot.lo)}-${f2(tot.hi)}] | ${f2(mn.or)} [${f2(mn.lo)}-${f2(mn.hi)}] sem ${mn.c} | ${f2(mx.or)} [${f2(mx.lo)}-${f2(mx.hi)}] sem ${mx.c} | ${vira}`);
}
