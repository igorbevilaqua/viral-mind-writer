// Subhook: aberturas (2 primeiras palavras), fórmulas de subhook, e combinações hook x subhook
// (efeito do subhook DENTRO de cada tipo de hook: avaliar com linhas = só os vídeos daquele hook).
import { writeFileSync } from "node:fs";
import { carregar, avaliar, exemplos, OUT, fmt, norm, tokens, palavras } from "../lib.mjs";
import { HOOK, SUB, REGIAO_BR } from "./feat.mjs";
import { FORMULAS } from "./formulas.mjs";
import { tab } from "./tab.mjs";

const L = carregar();
const LX = L.filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
const F = Object.fromEntries([...HOOK, ...SUB].map(([id, , , fn]) => [id, fn]));
const FO = Object.fromEntries(FORMULAS.map(([id, , fn]) => [id, fn]));
const f2 = fmt.f2, N = (t) => norm(t);
const sig = (a) => ({ "ajuda (replica)": "AJUDA", "atrapalha (replica)": "ATRAPALHA", "sinal sem replicação": "sinal", "sem evidência": "neutro", "amostra pequena": "peq" })[a.leitura];

const MAIN = process.argv[1].endsWith("sub_combo.mjs"); // outros scripts importam SUBF sem rodar a análise
if (MAIN) {
  console.log("## aberturas do subhook (2 primeiras palavras)");
  tab((r) => tokens(r.g.subhook).slice(0, 2).join(" "), { min: 12, top: 45 });
}

// Fórmulas de subhook (o que o 2º parágrafo faz), mais concretas que a bateria
const rxReg = new RegExp(`\\b(${REGIAO_BR})\\b`);
export const SUBF = [
  ["isso_porque", "Isso porque [explica a causa do hook]", (s) => /^(isso porque|isso acontece porque|isso aconteceu porque|e isso porque|tudo porque|e tudo porque)\b/.test(N(s))],
  ["isso_x", "Isso [é / significa / mudou / fez] ... (retoma o hook com 'isso')", (s) => /^isso\b/.test(N(s)) && !/^isso porque/.test(N(s))],
  ["essa_e_a", "Essa é a [nome] / Esse é o [nome] (apresenta o sujeito pelo nome)", (s) => /^(essa e|esse e|essas sao|esses sao|este e|esta e)\b/.test(N(s))],
  ["nome_dele", "O nome dele é / Ele se chama [nome] (dá nome ao personagem do hook)", (s) => /^(o nome dele|o nome dela|o nome do|o nome da|ele se chama|ela se chama|seu nome e|o nome e)\b/.test(N(s))],
  ["to_falando", "Eu tô falando do/da [nome] (dá nome com muleta)", (s) => /^(eu to falando|eu estou falando|to falando|estou falando|estamos falando)\b/.test(N(s))],
  ["so_que_mas", "Só que / Mas [vira o jogo]", (s) => /^(so que|mas|porem)\b/.test(N(s))],
  ["e_continua", "E [continua a frase do hook]", (s) => /^e\b/.test(N(s)) && !/^e o mais|^e isso porque/.test(N(s))],
  ["volta_tempo", "Tudo começou / Em 19xx / Nos anos 80 / Há X anos (volta no tempo)", (s) => /^(tudo comecou|tudo comeca|a historia comeca|em (18|19|20)\d\d|nos anos|na decada|ha \d+|ha (mais de )?(cem|mil|dez|vinte|trinta|quarenta|cinquenta|anos|decadas)|quando|antigamente|no inicio|no comeco|la em)\b/.test(N(s))],
  ["para_entender", "Para entender / Deixa eu te explicar / Vamos entender (anuncia a explicação)", (s) => /^(para entender|pra entender|vamos entender|deixa eu te explicar|deixa eu explicar|eu te explico|eu explico|vou te explicar|te explico|entenda)\b/.test(N(s))],
  ["lugar_abre", "No/Na [lugar] ... (abre situando o lugar)", (s) => /^(no|na|nos|nas) [a-z]/.test(N(s)) && !/^nos anos/.test(N(s))],
  ["eleva_numero", "Eleva a aposta: número grande ou dinheiro no 2º parágrafo", (s) => /\b(milhoes|milhao|bilhoes|bilhao|trilhoes|reais|dolares|r\$|%)\b|\d/.test(N(s))],
  ["coletivo_eles", "Eles / Elas (o sujeito coletivo age)", (s) => /\b(eles|elas)\b/.test(N(s))],
  ["biografia", "Biografia de empresa: fundada em / a história da / começou como", (s) => /\b(fundada|fundado|fundou|a historia d|comecou como|nasceu em|nasceu como)\b/.test(N(s))],
  ["voce_sub", "Você / Se você (puxa o espectador)", (s) => /^(voce|voces|se voce|vc)\b/.test(N(s))],
  ["pergunta_sub", "Pergunta no subhook", (s) => /\?/.test(s ?? "")],
];

if (MAIN) {
const res = { formulas_sub: [], combos: [] };
console.log("\n## fórmulas de subhook (coef, acerto, ret_sub IG, ret_sub com trimestre)");
const LQ = L.map((r) => ({ ...r, estrato: `${r.estrato}|${r.tri}` }));
for (const [id, modelo, fn] of SUBF) {
  const pred = (r) => fn(r.g?.subhook);
  const c = avaliar(id, pred), a = avaliar(id, pred, { desfecho: "acerto" });
  const rs = avaliar(id, pred, { desfecho: "ret_sub", plats: ["Instagram"], minN: 15 }), rq = avaliar(id, pred, { desfecho: "ret_sub", plats: ["Instagram"], minN: 15, linhas: LQ });
  const top = exemplos(pred, (r) => `H: ${r.g.hook} || S: ${r.g.subhook}`, { n: 2, linhas: LX });
  const fraco = exemplos(pred, (r) => `H: ${r.g.hook} || S: ${r.g.subhook}`, { n: 1, pior: true, linhas: LX });
  const t = c.todas;
  console.log(`${id} | rot=${t.roteiros} n=${t.n} OR ${f2(c.mh.or)} [${f2(c.mh.lo)}-${f2(c.mh.hi)}] lift ${f2(t.lift)} d/v ${f2(c.descoberta?.lift)}/${f2(c.validacao?.lift)} IG/TT/YT ${f2(c.Instagram?.lift)}/${f2(c.TikTok?.lift)}/${f2(c.YouTube?.lift)} ${sig(c)} | acerto ${f2(a.mh.or)} ${sig(a)} | ret_sub ${f2(rs.mh.or)} [${f2(rs.mh.lo)}-${f2(rs.mh.hi)}] n=${rs.todas?.n} ${sig(rs)} | c/tri ${f2(rq.mh.or)} [${f2(rq.mh.lo)}-${f2(rq.mh.hi)}]`);
  for (const e of top) console.log(`   + [${e.cliente} | ${e.plataforma} | ${f2(e.coef)}] ${e.texto.replace(/\s+/g, " ").slice(0, 260)}`);
  for (const e of fraco) console.log(`   - [${e.cliente} | ${e.plataforma} | ${f2(e.coef)}] ${e.texto.replace(/\s+/g, " ").slice(0, 200)}`);
  res.formulas_sub.push({ id, modelo, coef: { or: c.mh.or, lo: c.mh.lo, hi: c.mh.hi, lift: t.lift, n: t.n, roteiros: t.roteiros, desc: c.descoberta?.lift, val: c.validacao?.lift, IG: c.Instagram?.lift, TT: c.TikTok?.lift, YT: c.YouTube?.lift, leitura: c.leitura }, acerto: { or: a.mh.or, leitura: a.leitura }, ret_sub: { or: rs.mh.or, lo: rs.mh.lo, hi: rs.mh.hi, n: rs.todas?.n, or_tri: rq.mh.or, lo_tri: rq.mh.lo, hi_tri: rq.mh.hi }, top, fraco });
}

// Combinações: dentro de cada tipo de hook, qual subhook ajuda?
const HTIPOS = [
  ["hook com nome próprio", (r) => F.nome_proprio_qualquer(r.g.hook)],
  ["hook sem nome próprio", (r) => F.sem_nome_proprio(r.g.hook)],
  ["hook Esse/Essa + pessoa", (r) => F.ab_demonst_pessoa(r.g.hook)],
  ["hook Esse/Essa + coisa", (r) => F.ab_demonst_objeto(r.g.hook)],
  ["hook A/O + nome", (r) => F.ab_artigo_nome(r.g.hook)],
  ["hook acabou de", (r) => F.acabou_de(r.g.hook)],
  ["hook com consequência (verbo de ação no passado)", (r) => F.verbo_passado(r.g.hook)],
  ["hook com número", (r) => F.num_digito(r.g.hook)],
  ["hook em 1 frase", (r) => F.frases_1(r.g.hook)],
  ["hook em 2+ frases", (r) => !F.frases_1(r.g.hook)],
];
const STIPOS = [
  ["sub Isso porque", (r) => SUBF[0][2](r.g.subhook)],
  ["sub Isso...", (r) => SUBF[1][2](r.g.subhook)],
  ["sub dá nome (Essa é a / O nome dele é / Ele se chama)", (r) => SUBF[2][2](r.g.subhook) || SUBF[3][2](r.g.subhook)],
  ["sub com nome próprio", (r) => F.sf_nome(r.g.subhook)],
  ["sub com nome E data", (r) => F.sf_nome(r.g.subhook) && F.sf_data(r.g.subhook)],
  ["sub volta no tempo (abre)", (r) => SUBF[7][2](r.g.subhook)],
  ["sub com ano/data", (r) => F.sf_data(r.g.subhook)],
  ["sub Só que/Mas", (r) => SUBF[5][2](r.g.subhook)],
  ["sub E...", (r) => SUBF[6][2](r.g.subhook)],
  ["sub eleva com número/dinheiro", (r) => SUBF[10][2](r.g.subhook)],
  ["sub explica porquê (porque / o motivo)", (r) => F.sf_porque(r.g.subhook)],
  ["sub biografia (fundada / a história)", (r) => SUBF[12][2](r.g.subhook)],
  ["sub <= 15 palavras", (r) => palavras(r.g.subhook) <= 15],
  ["sub 31+ palavras", (r) => palavras(r.g.subhook) >= 31],
];
console.log("\n## combinações: efeito do subhook DENTRO de cada tipo de hook (OR MH, lift, n vídeos)");
for (const [hn, hp] of HTIPOS) {
  const base = LX.filter(hp);
  const celulas = [];
  for (const [sn, sp] of STIPOS) {
    const a = avaliar(`${hn} + ${sn}`, sp, { linhas: base, minN: 25 });
    if (!a.todas || a.todas.n < 25) continue;
    celulas.push(`${sn}: ${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}] n=${a.todas.n} ${sig(a)}`);
    res.combos.push({ hook: hn, sub: sn, or: a.mh.or, lo: a.mh.lo, hi: a.mh.hi, lift: a.todas.lift, n: a.todas.n, roteiros: a.todas.roteiros, desc: a.descoberta?.lift, val: a.validacao?.lift, leitura: a.leitura });
  }
  console.log(`\n# ${hn} (n=${base.length}, roteiros=${new Set(base.map((r) => r.script_id)).size})\n  ` + celulas.join("\n  "));
}
writeFileSync(`${OUT}hooks/subhook.json`, JSON.stringify(res, null, 1));
}
