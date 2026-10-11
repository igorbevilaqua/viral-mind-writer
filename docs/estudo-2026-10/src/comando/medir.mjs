// Helpers de medição do bloco final: uma linha por característica com seguidores (principal) e as checagens.
import { avaliar, fmt } from "../lib.mjs";
import { L, mhCtrlViral, mhSegTri } from "./feat.mjs";
const { f2 } = fmt;
export const IGTT = ["Instagram", "TikTok"], TODAS = ["Instagram", "TikTok", "YouTube"];

// mede uma característica: seguidores (IG+TT) com controles; comentários, compartilhamento e coef como checagem
export function medir(nome, pred, { linhas = L, outros = true } = {}) {
  const seg = avaliar(nome, pred, { linhas, desfecho: "seguidores", plats: IGTT });
  const baseSeg = linhas.filter((r) => IGTT.includes(r.plataforma));
  const o = {
    nome, seg,
    ctrlViral: mhCtrlViral(baseSeg, pred, "seguidores"),
    ctrlTri: mhSegTri(baseSeg, pred),
  };
  if (outros) {
    o.coment = avaliar(nome, pred, { linhas, desfecho: "comentarios", plats: TODAS });
    o.comp = avaliar(nome, pred, { linhas, desfecho: "compart", plats: IGTT });
    o.coef = avaliar(nome, pred, { linhas, desfecho: "coef", plats: TODAS });
  }
  return o;
}
const ic = (m) => (m?.or == null ? "-" : `${f2(m.or)} [${f2(m.lo)}-${f2(m.hi)}]`);
const lf = (x) => (x?.n ? `${f2(x.lift)} (${x.n})` : "-");
export function linhaSeg(o) {
  const a = o.seg, t = a.todas;
  return `| ${o.nome} | ${t?.n ?? 0} / ${t?.roteiros ?? 0} | ${f2(t?.lift)} [${f2(t?.lb)}-${f2(t?.ub)}] | ${ic(a.mh)} | ${f2(a.descoberta?.lift)} / ${f2(a.validacao?.lift)} | ${lf(a.Instagram)} | ${lf(a.TikTok)} | ${ic(o.ctrlViral)} | ${ic(o.ctrlTri)} | ${a.leitura} |`;
}
export const cabSeg = `| característica | n vídeos / roteiros | lift seguidores [IC95] | OR MH [IC95] | desc / valid | IG lift (n) | TT lift (n) | OR ctrl viral | OR ctrl trimestre | leitura |\n|---|---|---|---|---|---|---|---|---|---|`;
export function linhaOutros(o) {
  const c = (a) => `${f2(a.todas?.lift)} / OR ${f2(a.mh?.or)} (${a.leitura})`;
  return `| ${o.nome} | ${c(o.coment)} | ${c(o.comp)} | ${c(o.coef)} |`;
}
export const cabOutros = `| característica | comentários lift / OR (leitura) | compartilhamento | coef (viralização) |\n|---|---|---|---|`;
