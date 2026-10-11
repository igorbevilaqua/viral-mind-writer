// Análise do payoff e dos campos de estrutura rotulados por LLM (data/rotulos_llm.json), com a régua comum.
// uso: node src/payoff/analise.mjs   (grava out/payoff/tabelas.md e out/payoff/resultados.json; imprime o essencial)
import { writeFileSync } from "node:fs";
import { carregar, avaliar, porGrupo, exemplos, tabela, lift, mantelHaenszel, DESFECHOS, fmt, OUT } from "../lib.mjs";
import { PAYOFF, ENUMS } from "./taxonomia.mjs";

const L = carregar().filter((r) => r.llm && !r.llm.recusa);
const P3 = ["Instagram", "TikTok", "YouTube"];
const { f2, pct } = fmt;
const md = [], res = {};
const out = (s = "") => { md.push(s); };
const curto = (a) => a?.todas ? `${f2(a.todas.lift)} [${f2(a.todas.lb)}-${f2(a.todas.ub)}] OR ${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}] d/v ${f2(a.descoberta?.lift)}/${f2(a.validacao?.lift)} n=${a.todas.n} rot=${a.todas.roteiros} · ${a.leitura}` : "-";
const resumo = (a) => a?.todas ? { n: a.todas.n, roteiros: a.todas.roteiros, clientes: a.todas.clientes, p: a.todas.p, p_sem: a.todas.p_sem, lift: a.todas.lift, lb: a.todas.lb, ub: a.todas.ub, or: a.mh.or, or_lo: a.mh.lo, or_hi: a.mh.hi, lift_desc: a.descoberta?.lift, lift_val: a.validacao?.lift, leitura: a.leitura, ...Object.fromEntries(["Instagram", "TikTok", "YouTube", "Facebook"].filter((p) => a[p]).map((p) => [p, { lift: a[p].lift, lb: a[p].lb, ub: a[p].ub, n: a[p].n }])) } : null;
const PAY = ENUMS.payoff;
const isP = (k) => (r) => r.llm.payoff === k;

// ---------- 0. distribuição ----------
const porRoteiro = new Map(L.map((r) => [r.script_id, r]));
const roteiros = [...porRoteiro.values()];
const macros = [...new Set(roteiros.map((r) => r.macro))];
out("# Payoff: tabelas de apoio\n");
out(`Base: ${L.length} vídeos analisáveis rotulados, ${roteiros.length} roteiros.\n`);
out("## 0. Distribuição dos payoffs (roteiros)\n");
out(`| payoff | roteiros | % | ${macros.join(" | ")} |`); out(`|---|---|---|${macros.map(() => "---").join("|")}|`);
res.distribuicao = {};
for (const k of PAY) {
  const n = roteiros.filter((r) => r.llm.payoff === k).length;
  const porM = Object.fromEntries(macros.map((m) => { const t = roteiros.filter((r) => r.macro === m); return [m, t.filter((r) => r.llm.payoff === k).length / t.length]; }));
  res.distribuicao[k] = { roteiros: n, pct: n / roteiros.length, por_macro: porM };
  out(`| ${k} | ${n} | ${pct(n / roteiros.length)} | ${macros.map((m) => pct(porM[m])).join(" | ")} |`);
}
const com2 = roteiros.filter((r) => r.llm.payoff2).length;
out(`\npayoff2 preenchido em ${pct(com2 / roteiros.length)} dos roteiros.`);

// ---------- 1. ranking geral (coef) ----------
out("\n## 1. Payoff principal x coeficiente viral (topo do estrato cliente x rede x trimestre)\n");
const A = PAY.map((k) => avaliar(`payoff=${k}`, isP(k), { linhas: L }));
A.sort((a, b) => (b.todas?.lift ?? 0) - (a.todas?.lift ?? 0));
out(tabela(A));
res.coef = Object.fromEntries(A.map((a) => [a.nome.split("=")[1], resumo(a)]));
out("\n### 1b. payoff presente como principal OU secundário\n");
const A2 = PAY.map((k) => avaliar(`payoff ou payoff2=${k}`, (r) => r.llm.payoff === k || r.llm.payoff2 === k, { linhas: L }));
A2.sort((a, b) => (b.todas?.lift ?? 0) - (a.todas?.lift ?? 0));
out(tabela(A2));
res.coef_presente = Object.fromEntries(A2.map((a) => [a.nome.split("=")[1], resumo(a)]));
out("\n### 1d. Por rede, com OR de Mantel-Haenszel (controla cliente) dentro de cada rede\n");
out("| payoff | Instagram | TikTok | YouTube |"); out("|---|---|---|---|");
res.por_rede = {};
for (const k of PAY) {
  res.por_rede[k] = {};
  const cel = P3.map((p) => {
    const sub = L.filter((r) => r.plataforma === p), l = lift(sub, isP(k), DESFECHOS.coef), m = mantelHaenszel(sub, isP(k), DESFECHOS.coef);
    res.por_rede[k][p] = { lift: l?.lift, lb: l?.lb, ub: l?.ub, n: l?.n, or: m.or, or_lo: m.lo, or_hi: m.hi };
    return `${f2(l?.lift)} [${f2(l?.lb)}-${f2(l?.ub)}] OR ${f2(m.or)} [${f2(m.lo)}-${f2(m.hi)}] n=${l?.n}`;
  });
  out(`| ${k} | ${cel.join(" | ")} |`);
}
out("\n### 1c. Facebook (só para registro, n pequeno)\n");
res.facebook = {};
for (const k of PAY) { const l = lift(L.filter((r) => r.plataforma === "Facebook"), isP(k), DESFECHOS.coef); res.facebook[k] = l; out(`- ${k}: ${f2(l?.lift)} (n=${l?.n})`); }

// ---------- 2. outros desfechos ----------
out("\n## 2. Payoff x compartilhamento, comentários, salvamentos, seguidores\n");
const D2 = { compart: ["Instagram", "TikTok"], comentarios: P3, salvamentos: ["TikTok"], seguidores: ["Instagram"], acerto: P3 };
res.desfechos = {};
out(`| payoff | ${Object.keys(D2).map((d) => `${d} (${D2[d].map((p) => p[0]).join("")})`).join(" | ")} |`); out(`|---|${Object.keys(D2).map(() => "---").join("|")}|`);
for (const k of PAY) {
  const cel = [];
  res.desfechos[k] = {};
  for (const [d, plats] of Object.entries(D2)) {
    const a = avaliar(k, isP(k), { linhas: L, desfecho: d, plats });
    res.desfechos[k][d] = resumo(a);
    cel.push(a.todas ? `${f2(a.todas.lift)} [${f2(a.todas.lb)}-${f2(a.todas.ub)}] n=${a.todas.n} ${a.leitura === "ajuda (replica)" ? "▲" : a.leitura === "atrapalha (replica)" ? "▼" : a.leitura === "sinal sem replicação" ? "~" : ""}` : "-");
  }
  out(`| ${k} | ${cel.join(" | ")} |`);
}
out("\n▲ ajuda e replica · ▼ atrapalha e replica · ~ sinal sem replicação");

// ---------- 3. macro nicho ----------
out("\n## 3. Payoff x macro nicho (lift no topo do coef, n vídeos)\n");
res.macro = {};
out(`| payoff | ${macros.join(" | ")} |`); out(`|---|${macros.map(() => "---").join("|")}|`);
for (const k of PAY) {
  const g = porGrupo(k, isP(k), (r) => r.macro, { linhas: L, minN: 15 });
  res.macro[k] = Object.fromEntries(g.map((x) => [x.grupo, { lift: x.lift, lb: x.lb, ub: x.ub, n: x.n, roteiros: x.roteiros, or: x.mh.or, or_lo: x.mh.lo, or_hi: x.mh.hi }]));
  out(`| ${k} | ${macros.map((m) => { const x = res.macro[k][m]; return x ? `${f2(x.lift)} [${f2(x.lb)}-${f2(x.ub)}] n=${x.n}` : "-"; }).join(" | ")} |`);
}

// ---------- 4. cliente ----------
out("\n## 4. Payoff x cliente (payoffs com n>=15 vídeos no cliente; melhor e pior lift)\n");
res.cliente = {};
for (const k of PAY) for (const x of porGrupo(k, isP(k), (r) => r.cliente, { linhas: L, minN: 15 })) (res.cliente[x.grupo] ??= []).push({ payoff: k, lift: x.lift, lb: x.lb, ub: x.ub, n: x.n, roteiros: x.roteiros, or: x.mh.or });
for (const [c, xs] of Object.entries(res.cliente).sort()) {
  xs.sort((a, b) => b.lift - a.lift);
  const f = (x) => `${x.payoff} ${f2(x.lift)}${x.lb > 1 ? "*" : x.ub < 1 ? "†" : ""} (${x.n})`;
  out(`- **${c}**: melhor ${xs.slice(0, 3).map(f).join(", ")} · pior ${xs.slice(-2).reverse().map(f).join(", ")}`);
}
out("\n\\* IC95 do lift acima de 1 · † IC95 abaixo de 1");

// ---------- 5. outros campos ----------
out("\n## 5. Campos de estrutura x coeficiente viral\n");
res.campos = {};
for (const campo of ["promessa_hook", "funcao_subhook", "tipo_conclusao", "protagonista", "antagonista", "recorte"]) {
  const As = ENUMS[campo].map((v) => avaliar(`${campo}=${v}`, (r) => r.llm[campo] === v, { linhas: L })).filter((a) => a.todas?.n);
  As.sort((a, b) => b.todas.lift - a.todas.lift);
  res.campos[campo] = Object.fromEntries(As.map((a) => [a.nome.split("=")[1], resumo(a)]));
  out(`\n### ${campo}\n`); out(tabela(As));
}
{
  const a = avaliar("utilidade_pratica=true", (r) => r.llm.utilidade_pratica === true, { linhas: L });
  res.campos.utilidade_pratica = { true: resumo(a) };
  out("\n### utilidade_pratica\n"); out(tabela([a]));
}

// ---------- 6. cada parte contra a métrica que deveria mover ----------
out("\n## 6. Cada parte contra a métrica dela (Instagram, onde há retenção)\n");
res.metrica_da_parte = {};
const parte = [["promessa_hook", "ret_hook"], ["funcao_subhook", "ret_sub"], ["tipo_conclusao", "ret_final"], ["tipo_conclusao", "compart"], ["tipo_conclusao", "comentarios"], ["tipo_conclusao", "seguidores"]];
for (const [campo, d] of parte) {
  const plats = d === "compart" ? ["Instagram", "TikTok"] : d === "comentarios" ? P3 : ["Instagram"];
  const As = ENUMS[campo].map((v) => avaliar(`${campo}=${v}`, (r) => r.llm[campo] === v, { linhas: L, desfecho: d, plats })).filter((a) => a.todas?.n >= 30);
  As.sort((a, b) => b.todas.lift - a.todas.lift);
  res.metrica_da_parte[`${campo}|${d}`] = Object.fromEntries(As.map((a) => [a.nome.split("=")[1], resumo(a)]));
  out(`\n### ${campo} x ${d} (${plats.join(", ")})\n`); out(tabela(As, plats));
}
for (const d of ["salvamentos", "compart"]) {
  const plats = d === "salvamentos" ? ["TikTok"] : ["Instagram", "TikTok"];
  const a = avaliar(`utilidade_pratica x ${d}`, (r) => r.llm.utilidade_pratica === true, { linhas: L, desfecho: d, plats });
  res.metrica_da_parte[`utilidade_pratica|${d}`] = resumo(a);
  out(`\n${tabela([a], plats)}`);
}

// ---------- 7. combinações payoff x abertura x fechamento ----------
out("\n## 7. Combinações: dentro de cada payoff, a abertura e o fechamento que mais levam ao topo\n");
res.combos = {};
for (const k of PAY) {
  const base = L.filter(isP(k));
  if (base.length < 60) continue;
  const melhor = (campo) => ENUMS[campo].map((v) => {
    const a = avaliar(`${k}+${campo}=${v}`, (r) => r.llm.payoff === k && r.llm[campo] === v, { linhas: L, minN: 25 });
    const dentro = lift(base, (r) => r.llm[campo] === v, DESFECHOS.coef); // contra o próprio payoff
    return { v, a, dentro };
  }).filter((x) => x.a.todas?.n >= 25).sort((x, y) => y.a.todas.lift - x.a.todas.lift);
  const ph = melhor("promessa_hook"), tc = melhor("tipo_conclusao");
  res.combos[k] = {
    promessa_hook: ph.map((x) => ({ valor: x.v, ...resumo(x.a), lift_dentro_do_payoff: x.dentro?.lift })),
    tipo_conclusao: tc.map((x) => ({ valor: x.v, ...resumo(x.a), lift_dentro_do_payoff: x.dentro?.lift })),
  };
  out(`\n### ${k} (${base.length} vídeos)`);
  out(`- abre: ${ph.map((x) => `${x.v} ${f2(x.a.todas.lift)} (n=${x.a.todas.n}, dentro ${f2(x.dentro?.lift)}, ${x.a.leitura})`).join(" · ")}`);
  out(`- fecha: ${tc.map((x) => `${x.v} ${f2(x.a.todas.lift)} (n=${x.a.todas.n}, dentro ${f2(x.dentro?.lift)}, ${x.a.leitura})`).join(" · ")}`);
}
out("\n### Trios payoff + promessa + conclusão com n>=30 vídeos (top 15 e bottom 8 por lift)\n");
const trios = new Map();
for (const r of L) { const t = `${r.llm.payoff}|${r.llm.promessa_hook}|${r.llm.tipo_conclusao}`; trios.set(t, (trios.get(t) ?? 0) + 1); }
const AT = [...trios].filter(([, n]) => n >= 30).map(([t]) => { const [p, h, c] = t.split("|"); return avaliar(t, (r) => r.llm.payoff === p && r.llm.promessa_hook === h && r.llm.tipo_conclusao === c, { linhas: L }); });
AT.sort((a, b) => b.todas.lift - a.todas.lift);
out(tabela([...AT.slice(0, 15), ...AT.slice(-8)]));
res.trios = AT.map((a) => ({ trio: a.nome, ...resumo(a) }));

// ---------- 8. testes dirigidos (o que os playbooks afirmam) ----------
out("\n## 8. Testes dirigidos\n");
const HERO = ["orgulho", "inspiracao", "superacao"];
const T = [
  ["herói (orgulho/inspiração/superação) COM gigante nomeado como antagonista", (r) => HERO.includes(r.llm.payoff) && r.llm.antagonista === "gigante"],
  ["herói SEM antagonista", (r) => HERO.includes(r.llm.payoff) && r.llm.antagonista === "nenhum"],
  ["superação COM virada (payoff2=virada ou fecho virada_final)", (r) => r.llm.payoff === "superacao" && (r.llm.payoff2 === "virada" || r.llm.tipo_conclusao === "virada_final")],
  ["superação SEM virada", (r) => r.llm.payoff === "superacao" && r.llm.payoff2 !== "virada" && r.llm.tipo_conclusao !== "virada_final"],
  ["dois payoffs (payoff2 preenchido)", (r) => !!r.llm.payoff2],
  ["herói esquecido (revolta + orgulho)", (r) => [r.llm.payoff, r.llm.payoff2].includes("revolta") && [r.llm.payoff, r.llm.payoff2].includes("orgulho")],
  ["recorte Brasil x estrangeiro", (r) => r.llm.recorte === "brasil_x_estrangeiro"],
  ["recorte só estrangeiro", (r) => r.llm.recorte === "estrangeiro"],
  ["recorte só Brasil", (r) => r.llm.recorte === "brasil"],
  ["China no texto (hook ou título) e payoff futuro", (r) => /china|chines/i.test(`${r.g?.hook} ${r.s?.titulo}`) && r.llm.payoff === "futuro"],
  ["China no texto (hook ou título) e payoff disputa", (r) => /china|chines/i.test(`${r.g?.hook} ${r.s?.titulo}`) && r.llm.payoff === "disputa"],
  ["protagonista espectador", (r) => r.llm.protagonista === "espectador"],
];
const AD = T.map(([n, p]) => avaliar(n, p, { linhas: L }));
out(tabela(AD));
res.testes = Object.fromEntries(AD.map((a) => [a.nome, resumo(a)]));
for (const [n, p, d, plats] of [["queda (erro caro)", isP("queda"), "salvamentos", ["TikTok"]], ["queda (erro caro)", isP("queda"), "compart", ["Instagram", "TikTok"]], ["bastidor", isP("bastidor"), "salvamentos", ["TikTok"]], ["sacada", isP("sacada"), "salvamentos", ["TikTok"]], ["revolta", isP("revolta"), "compart", ["Instagram", "TikTok"]], ["revolta ou payoff2 revolta", (r) => r.llm.payoff === "revolta" || r.llm.payoff2 === "revolta", "compart", ["Instagram", "TikTok"]]]) {
  const a = avaliar(`${n} x ${d}`, p, { linhas: L, desfecho: d, plats });
  res.testes[`${n} x ${d}`] = resumo(a);
  out(`- ${n} x ${d}: ${curto(a)}`);
}

// ---------- 9. checagem com os sentimentos do Gemini ----------
out("\n## 9. Checagem: sentimentos do Gemini por payoff (lift da etiqueta dentro do payoff)\n");
const S = L.filter((r) => Array.isArray(r.sentimentos) && r.sentimentos.length);
const sents = [...new Set(S.flatMap((r) => r.sentimentos))].filter((s) => S.filter((r) => r.sentimentos.includes(s)).length >= 40);
res.sentimentos = {};
for (const k of PAY) {
  const sub = S.filter(isP(k));
  if (sub.length < 20) continue;
  const ls = sents.map((s) => ({ s, share: sub.filter((r) => r.sentimentos.includes(s)).length / sub.length, lift: (sub.filter((r) => r.sentimentos.includes(s)).length / sub.length) / (S.filter((r) => r.sentimentos.includes(s)).length / S.length) })).sort((a, b) => b.lift - a.lift);
  res.sentimentos[k] = { n: sub.length, top: ls.slice(0, 4) };
  out(`- ${k} (n=${sub.length}): ${ls.slice(0, 4).map((x) => `${x.s} ${pct(x.share)} (x${f2(x.lift)})`).join(", ")}`);
}
out("\n### Sentimento do Gemini x coef (para comparar com o payoff)\n");
const AS = sents.map((s) => avaliar(`gemini=${s}`, (r) => Array.isArray(r.sentimentos) && r.sentimentos.includes(s), { linhas: S }));
AS.sort((a, b) => b.todas.lift - a.todas.lift);
out(tabela(AS));
res.sentimentos_coef = Object.fromEntries(AS.map((a) => [a.nome, resumo(a)]));

// ---------- 10. exemplos ----------
res.exemplos = {};
const txt = (r) => ({ titulo: r.s?.titulo, hook: r.g?.hook, conclusao: r.g?.conclusao, promessa_hook: r.llm.promessa_hook, tipo_conclusao: r.llm.tipo_conclusao, payoff2: r.llm.payoff2, sinal: r.llm.sinal });
for (const k of PAY) {
  res.exemplos[k] = { topo: exemplos(isP(k), txt, { linhas: L, n: 6 }), fraco: exemplos(isP(k), txt, { linhas: L, n: 2, pior: true }) };
}

writeFileSync(`${OUT}payoff/tabelas.md`, md.join("\n"));
writeFileSync(`${OUT}payoff/resultados.json`, JSON.stringify(res, null, 1));
console.log(md.join("\n").slice(0, 2000));
console.log(`\n... gravado out/payoff/tabelas.md (${md.length} linhas) e resultados.json`);
