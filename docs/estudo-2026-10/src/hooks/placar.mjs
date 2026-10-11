// Placar do hook: os elementos que replicaram se somam? (+1 por elemento bom, -1 por elemento ruim). Dose-resposta.
import { writeFileSync } from "node:fs";
import { carregar, DESFECHOS, mantelHaenszel, wilson, OUT, fmt, norm } from "../lib.mjs";
import { HOOK } from "./feat.mjs";
import { FORMULAS } from "./formulas.mjs";
const L = carregar().filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
const F = Object.fromEntries(HOOK.map(([id, , , fn]) => [id, fn]));
const FO = Object.fromEntries(FORMULAS.map(([id, , fn]) => [id, fn]));
const N = norm, f2 = fmt.f2, pct = fmt.pct;
export const BONS = [
  ["sujeito com nome na abertura (A China, O Google, Elon Musk)", (t) => F.ab_artigo_nome(t) || F.ab_nome_sem_artigo(t)],
  ["acabou de", (t) => F.acabou_de(t)],
  ["conflito nomeado ou proibição", (t) => FO.conflito_nomeado(t) || FO.autoridade_proibiu(t)],
  ["lugar: estrangeiro ou região do Brasil", (t) => F.pais_est(t) || F.regiao_br(t)],
  ["pessoa famosa", (t) => F.figura(t)],
  ["idade do personagem (de 14 anos)", (t) => /\b(de apenas \d+ anos|de \d+ anos|\d+ anos de idade)\b/.test(N(t))],
  ["tá/tão (fala de gente)", (t) => /\b(ta|tao)\b/.test(N(t))],
];
export const RUINS = [
  ["abre com Esse/Essa", (t) => F.ab_demonstrativo(t)],
  ["você/te", (t) => F.voce(t) || F.te(t)],
  ["IA", (t) => F.ia(t)],
  ["'empresa'/'marca' genérico", (t) => F.empresa_marca(t)],
  ["nunca", (t) => F.nunca(t)],
  ["pode/podem (possibilidade)", (t) => /\b(pode|podem|poderia|poderiam)\b/.test(N(t))],
  ["palavra de 13+ letras (sem -mente)", (t) => N(t).split(" ").some((w) => w.length >= 13 && !w.endsWith("mente"))],
  ["ano no hook / abre com Em [ano] ou Antigamente", (t) => F.num_ano(t) || FO.volta_tempo_abre(t)],
  ["bilionário / um bilhão", (t) => F.bilionario(t) || /\bbilhao\b/.test(N(t))],
];
export const placar = (t) => BONS.filter(([, f]) => f(t)).length - RUINS.filter(([, f]) => f(t)).length;

if (process.argv[1].endsWith("placar.mjs")) {
  const y = DESFECHOS.coef;
  const linhas = [];
  for (const per of ["todos", "descoberta", "validacao"]) {
    const base = per === "todos" ? L : L.filter((r) => r.periodo === per);
    const b0 = base.reduce((s, r) => s + y(r), 0) / base.length;
    const faixas = [["<= -2", (s) => s <= -2], ["-1", (s) => s === -1], ["0", (s) => s === 0], ["+1", (s) => s === 1], ["+2", (s) => s === 2], [">= +3", (s) => s >= 3]];
    for (const [nome, cond] of faixas) {
      const sel = base.filter((r) => cond(placar(r.g.hook)));
      const k = sel.reduce((s, r) => s + y(r), 0), [lo, hi] = wilson(k, sel.length);
      const mh = mantelHaenszel(base, (r) => cond(placar(r.g.hook)), y);
      const ac = sel.filter((r) => DESFECHOS.acerto(r)).length / sel.length;
      linhas.push({ periodo: per, faixa: nome, n: sel.length, roteiros: new Set(sel.map((r) => r.script_id)).size, topo: k / sel.length, lo, hi, lift: k / sel.length / b0, or: mh.or, or_lo: mh.lo, or_hi: mh.hi, acerto: ac });
      console.log(`${per} | placar ${nome} | rot=${new Set(sel.map((r) => r.script_id)).size} n=${sel.length} | topo ${pct(k / sel.length)} [${pct(lo)}-${pct(hi)}] lift ${f2(k / sel.length / b0)} | OR vs resto ${f2(mh.or)} [${f2(mh.lo)}-${f2(mh.hi)}] | taxa de acerto ${pct(ac)}`);
    }
  }
  // quantos elementos de cada a casa já usa
  const rot = new Map(); for (const r of L) rot.set(r.script_id, r);
  const R = [...rot.values()];
  console.log("\nuso no acervo (roteiros):", BONS.map(([n, f]) => `${n}: ${pct(R.filter((r) => f(r.g.hook)).length / R.length)}`).join(" | "));
  console.log("ruins:", RUINS.map(([n, f]) => `${n}: ${pct(R.filter((r) => f(r.g.hook)).length / R.length)}`).join(" | "));
  writeFileSync(`${OUT}hooks/placar.json`, JSON.stringify(linhas, null, 1));
}
