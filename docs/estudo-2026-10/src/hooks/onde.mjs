// Onde vale: cada achado principal por macro nicho e por cliente (porGrupo). Saída: out/hooks/onde.json + console.
import { writeFileSync } from "node:fs";
import { porGrupo, OUT, fmt } from "../lib.mjs";
import { HOOK } from "./feat.mjs";
import { FORMULAS } from "./formulas.mjs";
import { SUBF } from "./sub_combo.mjs";

const F = Object.fromEntries(HOOK.map(([id, , , fn]) => [id, fn]));
const FO = Object.fromEntries(FORMULAS.map(([id, , fn]) => [id, fn]));
const SF = Object.fromEntries(SUBF.map(([id, , fn]) => [id, fn]));
const f2 = fmt.f2;
const ITENS = [
  ["A/O + nome próprio na abertura", (r) => F.ab_artigo_nome(r.g.hook)],
  ["abre com Esse/Essa", (r) => F.ab_demonstrativo(r.g.hook)],
  ["hook sem nome próprio", (r) => F.sem_nome_proprio(r.g.hook)],
  ["acabou de", (r) => F.acabou_de(r.g.hook)],
  ["[Nome] acabou de", (r) => FO.acabou_nome(r.g.hook)],
  ["conflito nomeado (guerra/humilhou/venceu)", (r) => FO.conflito_nomeado(r.g.hook)],
  ["país/lugar estrangeiro", (r) => F.pais_est(r.g.hook)],
  ["China", (r) => F.china(r.g.hook)],
  ["região do Brasil", (r) => F.regiao_br(r.g.hook)],
  ["pessoa famosa", (r) => F.figura(r.g.hook)],
  ["autoridade proibiu/cancelou", (r) => FO.autoridade_proibiu(r.g.hook)],
  ["problema", (r) => F.problema(r.g.hook)],
  ["IA no hook", (r) => F.ia(r.g.hook)],
  ["você/te no hook", (r) => F.voce(r.g.hook) || F.te(r.g.hook)],
  ["empresa/marca (genérico)", (r) => F.empresa_marca(r.g.hook)],
  ["nunca", (r) => F.nunca(r.g.hook)],
  ["sub: Isso porque", (r) => SF.isso_porque(r.g.subhook)],
];
const marca = (g) => (g.mh.lo > 1 ? "+" : g.mh.hi < 1 ? "-" : "");
const out = {};
for (const [nome, pred] of ITENS) {
  const mac = porGrupo(nome, pred, (r) => r.macro, { minN: 15 });
  const cli = porGrupo(nome, pred, (r) => r.cliente, { minN: 12 });
  out[nome] = { macro: mac.map((g) => ({ grupo: g.grupo, n: g.n, roteiros: g.roteiros, lift: g.lift, or: g.mh.or, lo: g.mh.lo, hi: g.mh.hi })), cliente: cli.map((g) => ({ grupo: g.grupo, n: g.n, roteiros: g.roteiros, lift: g.lift, or: g.mh.or, lo: g.mh.lo, hi: g.mh.hi })) };
  console.log(`\n# ${nome}`);
  console.log("  macro: " + mac.map((g) => `${g.grupo.split(",")[0]} ${f2(g.lift)}${marca(g)} (OR ${f2(g.mh.or)}, n=${g.n}, rot=${g.roteiros})`).join(" | "));
  const pos = cli.filter((g) => g.lift >= 1).length, neg = cli.length - pos;
  console.log(`  clientes com lift>=1: ${pos}/${cli.length}`);
  console.log("  " + cli.map((g) => `${g.grupo} ${f2(g.lift)}${marca(g)}(${g.roteiros})`).join(", "));
}
writeFileSync(`${OUT}hooks/onde.json`, JSON.stringify(out, null, 1));
