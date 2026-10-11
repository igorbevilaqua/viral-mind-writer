// 1b. Robustez do tamanho: controle por modelagem e roteirista, consistência por cliente, ritmo de fala,
// faixa recomendada por rede e macro. 2c. Molde de biografia (clichês de origem) como característica composta.
import { carregar, avaliar, porGrupo, fmt, salvar, resumo, dur, unicos, mediana, linhasCtl } from "./h.mjs";
import { linhasStrict, aprofundar } from "./fundo.mjs";
import { f } from "./feat.mjs";
const L = carregar();
const W = (r) => r.g.palavras_total;
const out = {};

// controle por modelagem (o roteiro modelado é mais longo?)
const comMod = L.map((r) => ({ ...r, estrato: `${r.estrato}|${r.s?.modelagem ? "mod" : "nao"}` }));
const U = unicos(L);
console.log("% modelado por faixa:", ["<300", "300-400", "400-450", "450-500", "500+"].map((n, i) => { const lo = [0, 300, 400, 450, 500][i], hi = [300, 400, 450, 500, 1e9][i]; const u = U.filter((r) => W(r) >= lo && W(r) < hi); return `${n} ${fmt.pct(u.filter((r) => r.s?.modelagem).length / u.length)} (${u.length})`; }).join(" | "));
const faixas = [["450-500", (r) => W(r) >= 450 && W(r) < 500], ["420-500", (r) => W(r) >= 420 && W(r) < 500], ["<300", (r) => W(r) < 300], ["500+", (r) => W(r) >= 500]];
out.robustez = {};
for (const [n, p] of faixas) {
  const a = avaliar(n, p), m = avaliar(n, p, { linhas: comMod }), s = avaliar(n, p, { linhas: L.map((r) => ({ ...r, estrato: `${r.estrato}|${r.s?.roteirista ?? "-"}` })) });
  const cli = porGrupo(n, p, (r) => r.cliente, { minN: 15 });
  out.robustez[n] = { base: resumo(a), ctl_modelagem: { or: m.mh.or, lo: m.mh.lo, hi: m.mh.hi }, ctl_roteirista: { or: s.mh.or, lo: s.mh.lo, hi: s.mh.hi }, clientes: cli.length, lift_maior_1: cli.filter((c) => c.lift > 1).length };
  console.log(`${n}: lift ${fmt.f2(a.todas.lift)} OR ${fmt.f2(a.mh.or)} | ctl modelagem OR ${fmt.f2(m.mh.or)} [${fmt.f2(m.mh.lo)}-${fmt.f2(m.mh.hi)}] | ctl roteirista OR ${fmt.f2(s.mh.or)} [${fmt.f2(s.mh.lo)}-${fmt.f2(s.mh.hi)}] | clientes n>=15: ${cli.length}, lift>1: ${cli.filter((c) => c.lift > 1).length} | ${cli.map((c) => `${c.grupo.split(" ")[0]} ${fmt.f2(c.lift)}(${c.n})`).join(" ")}`);
}

// ritmo de fala (palavras por segundo) por cliente, para traduzir palavras em segundos
const pace = {};
for (const r of L) { const d = dur(r); if (d && d > 20 && W(r) > 100) (pace[r.cliente] ??= []).push(W(r) / d); }
const paceMed = Object.entries(pace).map(([c, v]) => [c, mediana(v), v.length]).sort((a, b) => a[1] - b[1]);
console.log("\npalavras/segundo por cliente (mediana):", paceMed.map(([c, m, n]) => `${c.split(" ")[0]} ${m.toFixed(2)}(${n})`).join(" "));
const geral = mediana(L.filter((r) => dur(r) > 20).map((r) => W(r) / dur(r)));
console.log("geral:", geral.toFixed(2), "| 450 palavras =", Math.round(450 / geral), "s | 500 =", Math.round(500 / geral), "s | 430 =", Math.round(430 / geral), "s");
out.pace = { geral, por_cliente: paceMed };

// TikTok: duração conta com palavras fixas? (duração 150-180 controlando faixa de palavras)
for (const p of ["Instagram", "TikTok", "YouTube"]) {
  const a = avaliar("dur 150-180", (r) => dur(r) >= 150 && dur(r) < 180, { plats: [p], linhas: linhasCtl() });
  const b = avaliar("dur <100", (r) => dur(r) < 100, { plats: [p], linhas: linhasCtl() });
  console.log(`${p}: dur 150-180s ctl palavras: lift ${fmt.f2(a.todas.lift)} OR ${fmt.f2(a.mh.or)} [${fmt.f2(a.mh.lo)}-${fmt.f2(a.mh.hi)}] d/v ${fmt.f2(a.descoberta.lift)}/${fmt.f2(a.validacao.lift)} n=${a.todas.n} | dur <100s: lift ${fmt.f2(b.todas.lift)} OR ${fmt.f2(b.mh.or)} [${fmt.f2(b.mh.lo)}-${fmt.f2(b.mh.hi)}] n=${b.todas.n}`);
  out[`dur_ctl_${p}`] = { d150_180: resumo(a, [p]), d_lt100: resumo(b, [p]) };
}

// molde de biografia: marcadores de história de origem contada em ordem
const BIO = /\b(nasceu (em|no|na)|que nasceu|cresceu (em|no|na)|trabalhava (como|em|numa|num)|no inicio|desde (pequeno|crianca|cedo|jovem)|ele percebeu|ela percebeu|percebeu que|foi nesse (momento|cenario|contexto|periodo)|foi ai que|foi quando|foi entao que|tudo comecou)\b/g;
const nb = (r) => (f(r).corpo_sem.match(BIO) ?? []).length;
console.log("\nroteiros com marcadores de biografia: 0:", U.filter((r) => nb(r) === 0).length, "1:", U.filter((r) => nb(r) === 1).length, "2:", U.filter((r) => nb(r) === 2).length, "3+:", U.filter((r) => nb(r) >= 3).length);
out.bio = [];
for (const [n, p] of [["biografia: 1 marcador", (r) => nb(r) === 1], ["biografia: 2+ marcadores", (r) => nb(r) >= 2], ["biografia: 3+ marcadores", (r) => nb(r) >= 3]]) {
  out.bio.push(aprofundar(n, p, { re: /\b(nasceu|cresceu|trabalhava|no inicio|desde|percebeu|foi nesse|foi ai que|foi quando|foi entao|tudo comecou)\b/, desfechos: [["ret_final", ["Instagram"]], ["compart", ["Instagram", "TikTok"]], ["comentarios", ["Instagram", "TikTok", "YouTube"]]] }));
}
salvar("tamanho2.json", out);
