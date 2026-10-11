// 1. TAMANHO: palavras, duração, parágrafos, palavras por parágrafo. Por rede e por macro nicho.
import { carregar, avaliar, porGrupo, tabela, fmt, salvar, resumo, dur, paras, unicos, mediana, quantil, palavras } from "./h.mjs";
const L = carregar();
const P3 = ["Instagram", "TikTok", "YouTube"];
const W = (r) => r.g.palavras_total;
const out = {};

// distribuição (roteiros únicos por rede)
console.log("## distribuição de palavras (roteiros únicos por rede)");
for (const p of [...P3, "Facebook"]) {
  const u = unicos(L.filter((r) => r.plataforma === p)).map(W);
  console.log(p, "n", u.length, "p10", quantil(u, 0.1), "p25", quantil(u, 0.25), "med", mediana(u), "p75", quantil(u, 0.75), "p90", quantil(u, 0.9), "| >430:", fmt.pct(u.filter((w) => w > 430).length / u.length), "| <150:", u.filter((w) => w < 150).length);
}

const FX = [["<250", (w) => w < 250], ["250-300", (w) => w >= 250 && w < 300], ["300-350", (w) => w >= 300 && w < 350], ["350-400", (w) => w >= 350 && w < 400], ["400-450", (w) => w >= 400 && w < 450], ["450-500", (w) => w >= 450 && w < 500], ["500-600", (w) => w >= 500 && w < 600], ["600+", (w) => w >= 600]];

for (const desf of ["coef", "acerto"]) {
  console.log(`\n## palavras totais x ${desf} (3 redes juntas, MH por cliente x rede)`);
  const avs = FX.map(([n, f]) => avaliar(`palavras ${n}`, (r) => f(W(r)), { desfecho: desf }));
  console.log(tabela(avs));
  out[`palavras_${desf}`] = avs.map((a) => resumo(a));
}
for (const p of [...P3, "Facebook"]) {
  console.log(`\n## palavras x coef: ${p} (MH dentro da rede)`);
  const avs = FX.map(([n, f]) => avaliar(`palavras ${n}`, (r) => f(W(r)), { plats: [p], minN: 20 }));
  console.log(tabela(avs, [p]));
  out[`palavras_coef_${p}`] = avs.map((a) => resumo(a, [p]));
}

// regra do checklist: 150 a 430
console.log("\n## checklist 150-430");
const ck = [avaliar("palavras > 430 (fora do checklist)", (r) => W(r) > 430), avaliar("palavras 150-430 (dentro)", (r) => W(r) >= 150 && W(r) <= 430), avaliar("palavras > 430, IG+TT+YT+FB", (r) => W(r) > 430, { plats: [...P3, "Facebook"] })];
console.log(tabela(ck));
out.checklist = ck.map((a) => resumo(a));

// cortes de limiar: onde está o degrau
console.log("\n## limiar: palavras >= X (lift, OR MH) por rede");
const lim = [];
for (const x of [300, 350, 380, 400, 420, 450, 480, 500, 550]) {
  const row = { x };
  for (const p of P3) { const a = avaliar(`>=${x}`, (r) => W(r) >= x, { plats: [p] }); row[p] = `${fmt.f2(a.todas.lift)} OR ${fmt.f2(a.mh.or)} [${fmt.f2(a.mh.lo)}-${fmt.f2(a.mh.hi)}] n=${a.todas.n}`; }
  lim.push(row); console.log(JSON.stringify(row));
}
out.limiar = lim;

// macro nicho x faixa (3 redes juntas e por rede)
console.log("\n## macro nicho x faixa de palavras (coef). célula: %topo lift (n) OR_MH");
const FX2 = [["<300", (w) => w < 300], ["300-400", (w) => w >= 300 && w < 400], ["400-450", (w) => w >= 400 && w < 450], ["450-500", (w) => w >= 450 && w < 500], ["500+", (w) => w >= 500]];
const macros = ["Tecnologia, IA e inovação", "Negócios, marcas e cases", "Dinheiro, economia e geopolítica", "Entretenimento"];
out.macro = {};
for (const m of macros) {
  for (const p of ["todas", ...P3]) {
    const Lm = L.filter((r) => r.macro === m && (p === "todas" || r.plataforma === p));
    const cells = FX2.map(([n, f]) => { const a = avaliar(n, (r) => f(W(r)), { linhas: Lm, plats: p === "todas" ? P3 : [p], minN: 15 }); return { faixa: n, n: a.todas?.n, p: a.todas?.p, lift: a.todas?.lift, lb: a.todas?.lb, ub: a.todas?.ub, or: a.mh.or, lo: a.mh.lo, hi: a.mh.hi, desc: a.descoberta?.lift, val: a.validacao?.lift }; });
    out.macro[`${m}|${p}`] = cells;
    console.log(`${m.slice(0, 22).padEnd(22)} ${p.padEnd(9)} ` + cells.map((c) => `${c.faixa}: ${fmt.pct(c.p)} ${fmt.f2(c.lift)} (${c.n}) OR ${fmt.f2(c.or)} d/v ${fmt.f2(c.desc)}/${fmt.f2(c.val)}`).join(" | "));
  }
}

// duração do vídeo (segundos; TikTok normalizado)
console.log("\n## duração do vídeo x coef (por rede)");
const FD = [["<60s", (d) => d < 60], ["60-75", (d) => d >= 60 && d < 75], ["75-90", (d) => d >= 75 && d < 90], ["90-105", (d) => d >= 90 && d < 105], ["105-120", (d) => d >= 105 && d < 120], ["120-135", (d) => d >= 120 && d < 135], ["135-150", (d) => d >= 135 && d < 150], ["150-165", (d) => d >= 150 && d < 165], ["165-180", (d) => d >= 165 && d < 180], ["180+", (d) => d >= 180]];
for (const p of P3) {
  const avs = FD.map(([n, f]) => avaliar(`dur ${n}`, (r) => dur(r) != null && f(dur(r)), { plats: [p], minN: 20 }));
  console.log(`\n${p}`); console.log(tabela(avs, [p]));
  out[`dur_coef_${p}`] = avs.map((a) => resumo(a, [p]));
}

// retenção final (IG) x tamanho: o efeito mecânico
console.log("\n## ret_final (IG) e ret_hook x palavras e duração");
const rf = [...FX.map(([n, f]) => avaliar(`palavras ${n}`, (r) => f(W(r)), { desfecho: "ret_final", plats: ["Instagram"], minN: 20 })), ...FD.map(([n, f]) => avaliar(`dur ${n}`, (r) => dur(r) != null && f(dur(r)), { desfecho: "ret_final", plats: ["Instagram"], minN: 20 }))];
console.log(tabela(rf, ["Instagram"]));
out.ret_final_tam = rf.map((a) => resumo(a, ["Instagram"]));

// parágrafos
const np = (r) => paras(r).length;
const ppp = (r) => { const ps = paras(r); return ps.reduce((s, x) => s + palavras(x), 0) / ps.length; };
const maxp = (r) => Math.max(...paras(r).map(palavras));
const frac35 = (r) => { const ps = paras(r); return ps.filter((x) => palavras(x) > 35).length / ps.length; };
console.log("\n## distribuição: parágrafos, palavras/parágrafo, maior parágrafo, % parágrafos >35 (roteiros únicos)");
const U = unicos(L);
for (const [n, f] of [["n paragrafos", np], ["palavras/paragrafo", ppp], ["maior paragrafo", maxp], ["% paras >35", frac35]]) { const v = U.map(f); console.log(n, "p10", fmt.f2(quantil(v, 0.1)), "p25", fmt.f2(quantil(v, 0.25)), "med", fmt.f2(mediana(v)), "p75", fmt.f2(quantil(v, 0.75)), "p90", fmt.f2(quantil(v, 0.9))); }
console.log("roteiros com algum parágrafo >35 palavras:", fmt.pct(U.filter((r) => maxp(r) > 35).length / U.length));

const FP = [["<=9 paras", (r) => np(r) <= 9], ["10-12", (r) => np(r) >= 10 && np(r) <= 12], ["13-15", (r) => np(r) >= 13 && np(r) <= 15], ["16-18", (r) => np(r) >= 16 && np(r) <= 18], ["19-22", (r) => np(r) >= 19 && np(r) <= 22], ["23+", (r) => np(r) >= 23]];
const FW = [["<=20 pal/para", (r) => ppp(r) <= 20], ["20-25", (r) => ppp(r) > 20 && ppp(r) <= 25], ["25-30", (r) => ppp(r) > 25 && ppp(r) <= 30], ["30-35", (r) => ppp(r) > 30 && ppp(r) <= 35], ["35-45", (r) => ppp(r) > 35 && ppp(r) <= 45], [">45", (r) => ppp(r) > 45]];
const FM = [["maior para <=35", (r) => maxp(r) <= 35], ["maior 36-45", (r) => maxp(r) > 35 && maxp(r) <= 45], ["maior 46-60", (r) => maxp(r) > 45 && maxp(r) <= 60], ["maior >60", (r) => maxp(r) > 60], ["0% paras >35", (r) => frac35(r) === 0], ["1-20% paras >35", (r) => frac35(r) > 0 && frac35(r) <= 0.2], [">20% paras >35", (r) => frac35(r) > 0.2]];
for (const [tit, lista] of [["n parágrafos", FP], ["palavras por parágrafo (média)", FW], ["maior parágrafo / fração >35", FM]]) {
  console.log(`\n## ${tit} x coef`);
  const avs = lista.map(([n, f]) => avaliar(n, f));
  console.log(tabela(avs));
  out[tit] = avs.map((a) => resumo(a));
}
// parágrafos controlando tamanho total
import { linhasCtl } from "./h.mjs";
console.log("\n## mesmas, com MH controlando faixa de tamanho total");
const avc = [...FP, ...FW, ...FM].map(([n, f]) => avaliar(n + " [ctl]", f, { linhas: linhasCtl() }));
console.log(tabela(avc));
out.paragrafos_ctl = avc.map((a) => resumo(a));
// parágrafos na retenção final
console.log("\n## palavras por parágrafo x ret_final (IG)");
const avr = [...FW, ...FM].map(([n, f]) => avaliar(n, f, { desfecho: "ret_final", plats: ["Instagram"], minN: 20 }));
console.log(tabela(avr, ["Instagram"]));
out.paragrafos_ret_final = avr.map((a) => resumo(a, ["Instagram"]));

salvar("tamanho.json", out);
