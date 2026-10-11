// (1) OR MH por plataforma dos achados (o que é só de uma rede); (2) afirmações do playbook ainda não testadas; (3) sub2 como apoio.
import { writeFileSync } from "node:fs";
import { carregar, avaliar, OUT, fmt, norm } from "../lib.mjs";
import { HOOK, SUB } from "./feat.mjs";
import { FORMULAS } from "./formulas.mjs";
import { SUBF } from "./sub_combo.mjs";
const F = Object.fromEntries([...HOOK, ...SUB].map(([id, , , fn]) => [id, fn]));
const FO = Object.fromEntries(FORMULAS.map(([id, , fn]) => [id, fn]));
const SF = Object.fromEntries(SUBF.map(([id, , fn]) => [id, fn]));
const f2 = fmt.f2, N = (t) => norm(t);
const P = ["Instagram", "TikTok", "YouTube"];
const cel = (a) => (a.todas?.n >= 20 ? `${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}] n=${a.todas.n}${a.mh.lo > 1 ? " +" : a.mh.hi < 1 ? " -" : ""}` : "-");
const out = { plataforma: [], playbook: [], sub2: [] };

console.log("## (1) OR MH por plataforma (coef)\nitem | Instagram | TikTok | YouTube");
const PLAT = [
  ["A/O + nome", (r) => F.ab_artigo_nome(r.g.hook)], ["Esse/Essa", (r) => F.ab_demonstrativo(r.g.hook)], ["sem nome próprio", (r) => F.sem_nome_proprio(r.g.hook)],
  ["acabou de", (r) => F.acabou_de(r.g.hook)], ["conflito nomeado", (r) => FO.conflito_nomeado(r.g.hook)], ["autoridade proibiu", (r) => FO.autoridade_proibiu(r.g.hook)],
  ["estrangeiro", (r) => F.pais_est(r.g.hook)], ["China", (r) => F.china(r.g.hook)], ["EUA", (r) => F.eua(r.g.hook)], ["região BR", (r) => F.regiao_br(r.g.hook)], ["O Brasil abre", (r) => F.ab_brasil(r.g.hook)],
  ["famoso", (r) => F.figura(r.g.hook)], ["IA", (r) => F.ia(r.g.hook)], ["você", (r) => F.voce(r.g.hook)], ["Você/Se você abre", (r) => FO.voce_abre(r.g.hook)],
  ["pergunta abre (Por que/O que/Como)", (r) => FO.pergunta_abre(r.g.hook)], ["Por que abre", (r) => F.ab_por_que(r.g.hook)], ["termina em pergunta", (r) => F.termina_pergunta(r.g.hook)],
  ["ninguém", (r) => F.ninguem(r.g.hook)], ["agora/hoje", (r) => F.agora(r.g.hook) || F.hoje(r.g.hook)], ["moeda (R$/dólares)", (r) => F.moeda(r.g.hook)], ["Uma das/Um dos abre", (r) => F.ab_uma_das(r.g.hook)],
  ["Existe um abre", (r) => FO.existe_um(r.g.hook)], ["Em/antigamente abre", (r) => FO.volta_tempo_abre(r.g.hook)], ["hook 35+ palavras", (r) => F.pal_35mais(r.g.hook)], ["exclamação", (r) => F.exclamacao(r.g.hook)],
  ["sub Isso porque", (r) => SF.isso_porque(r.g.subhook)], ["sub lugar abre", (r) => SF.lugar_abre(r.g.subhook)], ["sub eles", (r) => SF.coletivo_eles(r.g.subhook)], ["sub <=15 palavras", (r) => F.sb_pal_ate12(r.g.subhook) || F.sb_pal_13_22(r.g.subhook) && (r.g.subhook ?? "").split(/\s+/).length <= 15],
];
for (const [nome, pred] of PLAT) {
  const cs = P.map((p) => avaliar(nome, pred, { plats: [p], minN: 20 }));
  console.log(`${nome} | ${cs.map(cel).join(" | ")}`);
  out.plataforma.push({ item: nome, ...Object.fromEntries(P.map((p, i) => [p, { or: cs[i].mh.or, lo: cs[i].mh.lo, hi: cs[i].mh.hi, n: cs[i].todas?.n, lift: cs[i].todas?.lift }])) });
}

console.log("\n## (2) afirmações do playbook (coef | acerto | ret_hook IG)");
const PB = [
  ["palavra mágica: segredo", (t) => /\bsegredo/.test(N(t))], ["palavra mágica: descobriu", (t) => /\bdescobri\w*/.test(N(t))], ["palavra mágica: revelou", (t) => /\brevel\w*/.test(N(t))],
  ["palavra mágica: escondido/oculto", (t) => /\b(escondid\w*|escond\w*|ocult\w*)\b/.test(N(t))], ["palavra mágica: perturbador", (t) => /\bperturbador\w*/.test(N(t))],
  ["urgência explícita: urgente/última hora/alerta/atenção", (t) => /\b(urgente|ultima hora|alerta|atencao|cuidado)\b/.test(N(t))],
  ["negatividade: erro/perder/golpe/armadilha/risco/perigo", (t) => /\b(erro|erros|perder|perde|perdeu|golpe|golpes|armadilha|risco|riscos|perigo|perigoso|perigosa|prejuizo)\b/.test(N(t))],
  ["desafio de crença: mentira/mito/enganado/não é o que", (t) => /\b(mentira|mito|enganad\w*|engana|nao e o que|ao contrario|na verdade)\b/.test(N(t))],
  ["autoridade: cientistas/especialistas/Harvard/estudo", (t) => /\b(cientistas?|especialistas?|harvard|estudo|pesquisa|pesquisadores?|universidade)\b/.test(N(t))],
  ["genérico: você sabia/já pensou/nesse vídeo/hoje vou", (t) => /^(voce sabia|sabia que|ja pensou|nesse video|neste video|hoje vou|hoje eu vou|ola|e ai|presta atencao)/.test(N(t))],
  ["tema em vez de impacto: 'a história de'/'essa é a história'", (t) => /\b(a historia d|essa e a historia|conheca a historia)\b/.test(N(t))],
  ["palavra difícil: alguma palavra com 13+ letras", (t) => (N(t).split(" ").some((w) => w.length >= 13))],
  ["bilhão (singular)", (t) => /\bbilhao\b/.test(N(t))], ["bilhões (plural)", (t) => /\bbilhoes\b/.test(N(t))],
  ["milhão (singular)", (t) => /\bmilhao\b/.test(N(t))], ["milhões (plural)", (t) => /\bmilhoes\b/.test(N(t))],
  ["mulher/mãe/menina no hook", (t) => /\b(mulher|mulheres|mae|maes|menina|meninas|garota|garotas|senhora|idosa|estudantes? (baiana|nordestina)|filha)\b/.test(N(t))],
  ["criança/adolescente/jovem de X anos", (t) => /\b(crianca|criancas|adolescente|adolescentes|menino|menina|garoto|garota|jovem de \d+|de apenas \d+ anos|\d+ anos de idade)\b/.test(N(t))],
  ["'de apenas X anos' / idade no hook", (t) => /\b(de apenas \d+ anos|de \d+ anos|\d+ anos de idade)\b/.test(N(t))],
  ["dois-pontos (revela após ':')", (t) => /:/.test(t ?? "")],
  ["tá/tão (coloquial)", (t) => /\b(ta|tao)\b/.test(N(t))],
];
for (const [nome, fn] of PB) {
  const pred = (r) => fn(r.g.hook);
  const c = avaliar(nome, pred), a = avaliar(nome, pred, { desfecho: "acerto" }), rh = avaliar(nome, pred, { desfecho: "ret_hook", plats: ["Instagram"], minN: 15 });
  console.log(`${nome} | rot=${c.todas.roteiros} OR ${f2(c.mh.or)} [${f2(c.mh.lo)}-${f2(c.mh.hi)}] lift ${f2(c.todas.lift)} d/v ${f2(c.descoberta?.lift)}/${f2(c.validacao?.lift)} IG/TT/YT ${f2(c.Instagram?.lift)}/${f2(c.TikTok?.lift)}/${f2(c.YouTube?.lift)} ${c.leitura} | acerto ${f2(a.mh.or)} ${a.leitura} | ret_hook ${f2(rh.mh.or)} [${f2(rh.mh.lo)}-${f2(rh.mh.hi)}] n=${rh.todas?.n} ${rh.leitura}`);
  out.playbook.push({ item: nome, roteiros: c.todas.roteiros, n: c.todas.n, or: c.mh.or, lo: c.mh.lo, hi: c.mh.hi, lift: c.todas.lift, desc: c.descoberta?.lift, val: c.validacao?.lift, leitura: c.leitura, acerto_or: a.mh.or, acerto: a.leitura, ret_hook_or: rh.mh.or, ret_hook_lo: rh.mh.lo, ret_hook_hi: rh.mh.hi, ret_hook: rh.leitura });
}

console.log("\n## (3) sub2 (3º parágrafo) como apoio: as mesmas fórmulas de subhook");
for (const [id, modelo, fn] of SUBF) {
  const pred = (r) => fn(r.g?.sub2);
  const c = avaliar(id, pred);
  if (!c.todas || c.todas.n < 30) continue;
  console.log(`sub2 ${id} | rot=${c.todas.roteiros} OR ${f2(c.mh.or)} [${f2(c.mh.lo)}-${f2(c.mh.hi)}] d/v ${f2(c.descoberta?.lift)}/${f2(c.validacao?.lift)} ${c.leitura}`);
  out.sub2.push({ id, modelo, roteiros: c.todas.roteiros, or: c.mh.or, lo: c.mh.lo, hi: c.mh.hi, leitura: c.leitura });
}
writeFileSync(`${OUT}hooks/extra.json`, JSON.stringify(out, null, 1));
