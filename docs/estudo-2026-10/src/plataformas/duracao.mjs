// Tarefa 3: duração por rede. (1) O mesmo roteiro sai com durações diferentes? (2) Faixas de duração x coef por rede.
// Saída: out/plataformas/duracao.txt
import { readFileSync, writeFileSync } from "node:fs";
import { carregar, avaliar, OUT, fmt } from "../lib.mjs";
import { P3, SIGLA, pares } from "./feat.mjs";

const L = carregar(), f2 = fmt.f2, pct = fmt.pct, out = [];
const q = (a, p) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(p * (b.length - 1))]; };

out.push("## 1. A mesma história tem durações diferentes por rede?");
for (const [A, B] of [["Instagram", "TikTok"], ["Instagram", "YouTube"], ["TikTok", "YouTube"]]) {
  const dd = pares(A, B).filter((p) => p.a.duracao != null && p.b.duracao != null).map((p) => p.a.duracao - p.b.duracao);
  out.push(`- ${SIGLA[A]} menos ${SIGLA[B]}: ${dd.length} pares, mediana ${f2(q(dd, 0.5))} s, p5 ${f2(q(dd, 0.05))} s, p95 ${f2(q(dd, 0.95))} s, diferença de até 2 s em ${pct(dd.filter((x) => Math.abs(x) <= 2).length / dd.length)}, mais de 10 s em ${dd.filter((x) => Math.abs(x) > 10).length}`);
}
for (const p of P3) { const d = L.filter((r) => r.plataforma === p && r.duracao != null).map((r) => r.duracao); out.push(`- ${p}: n=${d.length}, mediana ${q(d, 0.5).toFixed(0)} s (p25 ${q(d, 0.25).toFixed(0)}, p75 ${q(d, 0.75).toFixed(0)}), acima de 180 s: ${d.filter((x) => x > 180).length}`); }

out.push("\n## 2. Faixas de duração x topo do coef (quartil superior no estrato cliente x rede x trimestre)");
const FAIXAS = [[0, 75], [75, 90], [90, 105], [105, 120], [120, 135], [135, 150], [150, 165], [165, 180], [180, 999]];
const rot = ([a, b]) => (a === 0 ? `< ${b} s` : b === 999 ? `>= ${a} s` : `${a} a ${b - 1} s`);
out.push(`| faixa | ${P3.map((p) => `${p}: n · % topo · lift [IC] · OR MH [IC]`).join(" | ")} |`, `|---|${P3.map(() => "---").join("|")}|`);
const melhor = {};
for (const fx of FAIXAS) {
  const cel = P3.map((p) => {
    const a = avaliar(rot(fx), (r) => r.duracao != null && r.duracao >= fx[0] && r.duracao < fx[1], { plats: [p] });
    const t = a.todas;
    if (!t?.n) return "-";
    if (t.n >= 40 && (!melhor[p] || a.mh.or > melhor[p].or)) melhor[p] = { faixa: rot(fx), or: a.mh.or, lo: a.mh.lo, lift: t.lift };
    return `${t.n} · ${pct(t.p)} · ${f2(t.lift)} [${f2(t.lb)}-${f2(t.ub)}] · ${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}]`;
  });
  out.push(`| ${rot(fx)} | ${cel.join(" | ")} |`);
}
out.push("\nMelhor faixa (n>=40) por OR MH: " + P3.map((p) => `${p} ${melhor[p].faixa} (OR ${f2(melhor[p].or)}, IC inf ${f2(melhor[p].lo)})`).join("; "));

// Faixas largas, para o ponto ótimo com mais n
out.push("\n## 3. Faixas largas");
const LARGAS = [[0, 90], [90, 120], [120, 150], [150, 180], [180, 999]];
out.push(`| faixa | ${P3.join(" | ")} |`, `|---|${P3.map(() => "---").join("|")}|`);
for (const fx of LARGAS) out.push(`| ${rot(fx)} | ${P3.map((p) => { const a = avaliar("", (r) => r.duracao != null && r.duracao >= fx[0] && r.duracao < fx[1], { plats: [p] }); return `n=${a.todas.n} · ${pct(a.todas.p)} · OR ${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}] · d/v ${f2(a.descoberta?.lift)}/${f2(a.validacao?.lift)}`; }).join(" | ")} |`);

// Pareado: a mesma duração rende mais em qual rede?
const par = JSON.parse(readFileSync(OUT + "plataformas/pareado.json", "utf8"));
out.push("\n## 4. Pareado (mesmo roteiro, mesma duração): Δ dentro do cliente em pontos de percentil, positivo = melhor na 1ª rede");
for (const [k, res] of Object.entries(par)) out.push(`- ${k}: ` + res.filter((r) => r.grupo === "duracao" || r.grupo === "tamanho").map((r) => `${r.nome} ${(100 * r.cli).toFixed(1)} [${(100 * r.lo).toFixed(1)} a ${(100 * r.hi).toFixed(1)}] (n=${r.n1})`).join("; "));
writeFileSync(OUT + "plataformas/duracao.txt", out.join("\n"));
console.log(out.join("\n"));
