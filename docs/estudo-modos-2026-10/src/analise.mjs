// Desempenho por modo de roteiro. uso: node src/modos/analise.mjs [rotulos.jsonl]  (padrão: out/modos/rotulos_modo.jsonl)
// Saída: out/modos/analise.md (tabelas) e um resumo curto no console.
import { readFileSync, writeFileSync } from "node:fs";
import { carregar, avaliar, porGrupo, tabela, lift, mantelHaenszel, DESFECHOS, OUT, fmt } from "../lib.mjs";
const arq = process.argv[2] ?? OUT + "modos/rotulos_modo.jsonl";
const rot = new Map(readFileSync(arq, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l)).map((r) => [r.script_id, r]));
const L = carregar().filter((r) => rot.has(r.script_id)).map((r) => ({ ...r, m: rot.get(r.script_id) }));
const out = [];
const p = (s = "") => out.push(s);
const roteiros = new Map(L.map((r) => [r.script_id, r]));
const MODOS = ["historia", "mecanismo", "demonstracao", "panorama", "conselho", "publi", "misto"];
const conta = (xs, f) => xs.reduce((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {});

p(`# Desempenho por modo\n\nRótulos: ${arq.split("/").pop()} | roteiros com vídeo analisável: ${roteiros.size} | vídeos: ${L.length}\n`);
const dist = conta([...roteiros.values()], (r) => r.m.modo);
p("## Distribuição (roteiros)\n");
p("| modo | roteiros | % |\n|---|---|---|");
for (const m of MODOS) if (dist[m]) p(`| ${m} | ${dist[m]} | ${fmt.pct(dist[m] / roteiros.size)} |`);

// 1. modo, âncora, registro contra cada desfecho
const DES = ["coef", "acerto", "ret_hook", "ret_final", "compart", "seguidores", "salvamentos", "comentarios"];
const grupos = [
  ...MODOS.map((m) => [`modo ${m}`, (r) => r.m.modo === m]),
  ...["noticia", "passado", "atemporal"].map((a) => [`ancora ${a}`, (r) => r.m.ancora === a]),
  ["registro emotivo", (r) => r.m.registro === "emotivo"],
];
for (const d of DES) {
  p(`\n## Desfecho: ${d}\n`);
  p(tabela(grupos.map(([n, f]) => avaliar(n, f, { linhas: L, desfecho: d }))));
}

// 2. combinações modo x registro e modo x âncora (desfecho coef)
p("\n## Combinações (coef)\n");
const combos = [];
for (const m of MODOS) {
  for (const g of ["analitico", "emotivo"]) combos.push([`${m} + ${g}`, (r) => r.m.modo === m && r.m.registro === g]);
  for (const a of ["noticia", "passado", "atemporal"]) combos.push([`${m} + ${a}`, (r) => r.m.modo === m && r.m.ancora === a]);
}
p(tabela(combos.map(([n, f]) => avaliar(n, f, { linhas: L })).filter((a) => (a.todas?.n ?? 0) >= 60)));

// 3. o modo explica além do payoff? MH com estrato cliente x rede x payoff
p("\n## Modo controlando payoff (OR MH, estrato cliente x rede x payoff, coef)\n");
const LP = L.filter((r) => r.llm?.payoff && ["Instagram", "TikTok", "YouTube"].includes(r.plataforma)).map((r) => ({ ...r, estrato: `${r.estrato}|${r.llm.payoff}` }));
p("| modo | OR só cliente x rede | OR + payoff |\n|---|---|---|");
for (const m of MODOS) {
  const f = (r) => r.m.modo === m;
  const a = mantelHaenszel(L.filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma)), f, DESFECHOS.coef), b = mantelHaenszel(LP, f, DESFECHOS.coef);
  p(`| ${m} | ${fmt.f2(a.or)} [${fmt.f2(a.lo)} a ${fmt.f2(a.hi)}] | ${fmt.f2(b.or)} [${fmt.f2(b.lo)} a ${fmt.f2(b.hi)}] |`);
}
p("\n### Payoff dentro de cada modo (lift coef, n vídeos >= 40)\n");
for (const m of MODOS.slice(0, 5)) {
  const Lm = L.filter((r) => r.m.modo === m && r.llm?.payoff);
  const pays = Object.entries(conta(Lm, (r) => r.llm.payoff)).filter(([, n]) => n >= 40).map(([k]) => k);
  const res = pays.map((k) => ({ k, l: lift(Lm.filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma)), (r) => r.llm.payoff === k, DESFECHOS.coef) })).sort((a, b) => b.l.lift - a.l.lift);
  p(`- **${m}**: ${res.map(({ k, l }) => `${k} ${fmt.f2(l.lift)} [${fmt.f2(l.lb)} a ${fmt.f2(l.ub)}] (n=${l.n})`).join("; ")}`);
}

// 4. por cliente: mix de modos e lift de cada modo dentro do cliente
p("\n## Por cliente (coef): fatia de cada modo e lift dentro do cliente\n");
const clientes = [...new Set(L.map((r) => r.cliente))].sort();
p(`| cliente | roteiros | ${MODOS.slice(0, 5).join(" | ")} |\n|---|---|${MODOS.slice(0, 5).map(() => "---").join("|")}|`);
for (const c of clientes) {
  const Lc = L.filter((r) => r.cliente === c);
  const rc = [...new Set(Lc.map((r) => r.script_id))].map((id) => roteiros.get(id));
  const cel = (m) => {
    const n = rc.filter((r) => r.m.modo === m).length;
    if (!n) return "-";
    const l = lift(Lc.filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma)), (r) => r.m.modo === m, DESFECHOS.coef);
    return `${fmt.pct(n / rc.length)}${l && l.n >= 15 ? ` · ${fmt.f2(l.lift)}${l.lb > 1 ? "+" : l.ub < 1 ? "−" : ""}` : ""}`;
  };
  p(`| ${c} | ${rc.length} | ${MODOS.slice(0, 5).map(cel).join(" | ")} |`);
}
p("\nCélula: fatia dos roteiros do cliente · lift no coef dentro do cliente (só com n>=15 vídeos; + ou − quando o IC95 não cruza 1).");

// 5. tamanho dentro de cada modo
p("\n## Tamanho dentro de cada modo (lift coef)\n");
const faixas = [["< 350", (w) => w < 350], ["350 a 449", (w) => w >= 350 && w < 450], ["450+", (w) => w >= 450]];
for (const m of MODOS.slice(0, 5)) {
  const Lm = L.filter((r) => r.m.modo === m && r.g?.palavras_total);
  const ws = [...new Set(Lm.map((r) => r.script_id))].map((id) => roteiros.get(id).g.palavras_total).sort((a, b) => a - b);
  p(`- **${m}** (mediana ${ws[Math.floor(ws.length / 2)]} palavras): ${faixas.map(([n, f]) => { const a = avaliar(n, (r) => f(r.g.palavras_total), { linhas: Lm }); return `${n}: ${fmt.f2(a.todas?.lift)} [${fmt.f2(a.todas?.lb)} a ${fmt.f2(a.todas?.ub)}] n=${a.todas?.n ?? 0}`; }).join("; ")}`);
}

// 6. mix ao longo do tempo
p("\n## Mix de modos por trimestre (roteiros)\n");
const tris = [...new Set([...roteiros.values()].map((r) => r.tri))].sort();
p(`| trimestre | n | ${MODOS.slice(0, 5).join(" | ")} |\n|---|---|${MODOS.slice(0, 5).map(() => "---").join("|")}|`);
for (const t of tris) { const xs = [...roteiros.values()].filter((r) => r.tri === t); const d = conta(xs, (r) => r.m.modo); p(`| ${t} | ${xs.length} | ${MODOS.slice(0, 5).map((m) => fmt.pct((d[m] ?? 0) / xs.length)).join(" | ")} |`); }

writeFileSync(OUT + "modos/analise.md", out.join("\n"));
console.log(`roteiros ${roteiros.size} | vídeos ${L.length} | escrito out/modos/analise.md (${out.length} linhas)`);
