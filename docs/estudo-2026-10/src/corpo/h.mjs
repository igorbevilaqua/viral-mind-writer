// Helpers do subestudo corpo/conclusão. A régua é a da lib; aqui só o que é específico.
import { carregar, avaliar, porGrupo, tabela, norm, tokens, palavras, frases, fmt, exemplos, minerar, DESFECHOS, mantelHaenszel } from "../lib.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

export const OUTC = new URL("../../out/corpo/", import.meta.url).pathname;
mkdirSync(OUTC, { recursive: true });
export const salvar = (nome, obj) => writeFileSync(OUTC + nome, JSON.stringify(obj, null, 1));

// ponytail: TikTok tem duracao em ms em ~64% dos vídeos (unidade mista na base). >1000 vira segundos.
export const dur = (r) => (r.duracao == null ? null : r.duracao > 1000 ? r.duracao / 1000 : r.duracao);

// Parágrafos falados do roteiro escrito, na ordem (corpo já inclui sub2 e conclusao2).
export const paras = (r) => {
  const g = r.g;
  return [g.hook, g.subhook, ...(g.corpo ? g.corpo.split("\n") : []), g.conclusao, ...(g.bloco_final ? g.bloco_final.split("\n") : [])].filter((x) => x && x.trim());
};
export const corpoParas = (r) => (r.g.corpo ? r.g.corpo.split("\n").filter(Boolean) : []);

// Faixa de tamanho do roteiro (palavras faladas totais), usada como controle.
export const faixaTam = (w) => (w < 300 ? "a<300" : w < 350 ? "b300" : w < 400 ? "c350" : w < 450 ? "d400" : w < 500 ? "e450" : "f500+");

// Linhas com estrato estendido: cliente x plataforma x faixa de tamanho. O MH passa a controlar o tamanho.
let _ctl = null;
export function linhasCtl() {
  if (_ctl) return _ctl;
  _ctl = carregar().map((r) => ({ ...r, estrato: `${r.estrato}|${faixaTam(r.g.palavras_total)}` }));
  return _ctl;
}

// Avalia nas três redes, com e sem controle de tamanho. Devolve { a, actl }.
export function av2(nome, pred, opts = {}) {
  const a = avaliar(nome, pred, opts);
  const actl = avaliar(nome + " [ctl tam]", pred, { ...opts, linhas: opts.linhas ? opts.linhas : linhasCtl() });
  return { a, actl };
}

// Resumo compacto de um avaliar, para JSON.
export const resumo = (a, plats = ["Instagram", "TikTok", "YouTube"]) => ({
  nome: a.nome, desfecho: a.desfecho, leitura: a.leitura,
  n: a.todas?.n, roteiros: a.todas?.roteiros, clientes: a.todas?.clientes,
  p: r3(a.todas?.p), p_sem: r3(a.todas?.p_sem), lift: r2(a.todas?.lift), ic: [r2(a.todas?.lb), r2(a.todas?.ub)],
  or_mh: r2(a.mh?.or), or_ic: [r2(a.mh?.lo), r2(a.mh?.hi)],
  desc: r2(a.descoberta?.lift), val: r2(a.validacao?.lift), n_desc: a.descoberta?.n, n_val: a.validacao?.n,
  plat: Object.fromEntries(plats.filter((p) => a[p]).map((p) => [p, { n: a[p].n, lift: r2(a[p].lift), lb: r2(a[p].lb), ub: r2(a[p].ub) }])),
});
export const r2 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);
export const r3 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000);

// Tabela por plataforma: uma linha por característica, MH dentro da própria rede.
export function tabPlat(lista, plat, opts = {}) {
  const avs = lista.map(([nome, pred]) => avaliar(nome, pred, { ...opts, plats: [plat] }));
  return { avs, txt: tabela(avs, [plat]) };
}

export const unicos = (L) => { const v = new Set(); return L.filter((r) => (v.has(r.script_id) ? false : (v.add(r.script_id), true))); };
export const mediana = (a) => { const b = a.filter((x) => x != null && Number.isFinite(x)).sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
export const quantil = (a, q) => { const b = a.filter((x) => x != null && Number.isFinite(x)).sort((x, y) => x - y); return b.length ? b[Math.floor(q * (b.length - 1))] : null; };

export { carregar, avaliar, porGrupo, tabela, norm, tokens, palavras, frases, fmt, exemplos, minerar, DESFECHOS, mantelHaenszel };
