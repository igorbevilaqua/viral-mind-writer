// Tarefa 2: perfil de cada rede. avaliar(..., { plats: [rede] }) para cada característica.
// "todas": lift com IC > 1 nas três OU OR MH com IC > 1 nas três. "só aqui": IC > 1 na rede (lift ou MH) e nas outras duas não.
// Saída: out/plataformas/perfil.txt e perfil.json
import { readFileSync, writeFileSync } from "node:fs";
import { avaliar, OUT, fmt } from "../lib.mjs";
import { FEATS, P3, SIGLA } from "./feat.mjs";

const par = JSON.parse(readFileSync(OUT + "plataformas/pareado.json", "utf8"));
const delta = (id, A, B) => { // Δ pareado (dentro do cliente) a favor de A contra B
  const k = `${SIGLA[A]}-${SIGLA[B]}`, k2 = `${SIGLA[B]}-${SIGLA[A]}`;
  const r = (par[k] ?? par[k2])?.find((x) => x.id === id);
  if (!r) return null;
  return par[k] ? r : { ...r, cli: -r.cli, lo: -r.hi, hi: -r.lo };
};
const f2 = fmt.f2, pp = (x) => (Number.isFinite(x) ? (x >= 0 ? "+" : "") + (100 * x).toFixed(1) : "-");
const res = [];
for (const [id, grupo, nome, pred] of FEATS) {
  const o = { id, grupo, nome };
  for (const p of P3) {
    const a = avaliar(nome, pred, { plats: [p] });
    o[p] = { n: a.todas?.n, roteiros: a.todas?.roteiros, clientes: a.todas?.clientes, p: a.todas?.p, lift: a.todas?.lift, lb: a.todas?.lb, ub: a.todas?.ub, or: a.mh.or, lo: a.mh.lo, hi: a.mh.hi, desc: a.descoberta?.lift, val: a.validacao?.lift, leitura: a.leitura };
  }
  const pos = (x) => x && x.n >= 30 && ((x.lb > 1) || (x.lo > 1));
  const neg = (x) => x && x.n >= 30 && ((x.ub < 1) || (x.hi < 1));
  const nada = (x) => x && !(x.lb > 1) && !(x.lo > 1);
  o.todas = P3.every((p) => pos(o[p]));
  o.todasLift = P3.every((p) => o[p].lb > 1);
  o.todasMH = P3.every((p) => o[p].lo > 1);
  o.atrapalhaTodas = P3.every((p) => neg(o[p]));
  o.soAqui = P3.filter((p) => pos(o[p]) && P3.filter((q) => q !== p).every((q) => nada(o[q])));
  o.soAquiNeg = P3.filter((p) => neg(o[p]) && P3.filter((q) => q !== p).every((q) => !neg(o[q])));
  // confirmação pareada: a rede ganha das outras duas no mesmo roteiro
  o.par = {};
  for (const p of P3) o.par[p] = P3.filter((q) => q !== p).map((q) => delta(id, p, q)).map((r) => (r ? { cli: r.cli, lo: r.lo, hi: r.hi, kCli: r.kCli } : null));
  res.push(o);
}
writeFileSync(OUT + "plataformas/perfil.json", JSON.stringify(res));

const cel = (x) => `${f2(x.lift)} [${f2(x.lb)}-${f2(x.ub)}] OR ${f2(x.or)} [${f2(x.lo)}-${f2(x.hi)}] n=${x.n} d/v ${f2(x.desc)}/${f2(x.val)}`;
const L = [];
const bloco = (titulo, sel) => {
  L.push(`\n## ${titulo} (${sel.length})`, "| característica | Instagram | TikTok | YouTube |", "|---|---|---|---|");
  for (const o of sel) L.push(`| ${o.nome} | ${P3.map((p) => cel(o[p])).join(" | ")} |`);
};
bloco("Funciona nas três redes", res.filter((o) => o.todas));
bloco("Atrapalha nas três redes", res.filter((o) => o.atrapalhaTodas));
const quase = res.filter((o) => !o.todas && P3.every((p) => o[p].or > 1) && P3.filter((p) => o[p].lo > 1 || o[p].lb > 1).length >= 2);
bloco("Quase todas: OR > 1 nas três e IC > 1 em duas", quase);
for (const p of P3) {
  const sel = res.filter((o) => o.soAqui.includes(p)).sort((a, b) => b[p].or - a[p].or);
  L.push(`\n## Só no ${p}: ajuda aqui, sem efeito nas outras (${sel.length})`, "| característica | Instagram | TikTok | YouTube | Δ pareado contra as outras (pp, dentro do cliente) |", "|---|---|---|---|---|");
  for (const o of sel) L.push(`| ${o.nome} | ${P3.map((q) => cel(o[q])).join(" | ")} | ${o.par[p].map((r) => (r ? `${pp(r.cli)} [${pp(r.lo)} a ${pp(r.hi)}]` : "-")).join(" ; ")} |`);
  const neg = res.filter((o) => o.soAquiNeg.includes(p)).sort((a, b) => a[p].or - b[p].or);
  L.push(`\n## Só no ${p}: atrapalha aqui e não nas outras (${neg.length})`, "| característica | Instagram | TikTok | YouTube | Δ pareado contra as outras |", "|---|---|---|---|---|");
  for (const o of neg) L.push(`| ${o.nome} | ${P3.map((q) => cel(o[q])).join(" | ")} | ${o.par[p].map((r) => (r ? `${pp(r.cli)} [${pp(r.lo)} a ${pp(r.hi)}]` : "-")).join(" ; ")} |`);
}
writeFileSync(OUT + "plataformas/perfil.txt", L.join("\n"));
// console curto
const curto = (o, p) => `${o.nome}: ${P3.map((q) => `${SIGLA[q]} ${f2(o[q].or)}${o[q].lo > 1 || o[q].lb > 1 ? "*" : ""}`).join(" ")}`;
console.log("TODAS:", res.filter((o) => o.todas).map((o) => curto(o)).join("\n  "));
console.log("ATRAPALHA TODAS:", res.filter((o) => o.atrapalhaTodas).map((o) => curto(o)).join("\n  "));
console.log("QUASE:", quase.map((o) => curto(o)).join("\n  "));
for (const p of P3) {
  console.log(`\nSÓ ${p}+:`, res.filter((o) => o.soAqui.includes(p)).sort((a, b) => b[p].or - a[p].or).map((o) => `${curto(o)} | par ${o.par[p].map((r) => (r ? pp(r.cli) + (r.lo > 0 ? "*" : "") : "-")).join(",")}`).join("\n  "));
  console.log(`SÓ ${p}-:`, res.filter((o) => o.soAquiNeg.includes(p)).map((o) => `${curto(o)} | par ${o.par[p].map((r) => (r ? pp(r.cli) + (r.hi < 0 ? "*" : "") : "-")).join(",")}`).join("\n  "));
}
