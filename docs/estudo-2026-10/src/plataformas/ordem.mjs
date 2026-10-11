// Tarefa 4: ordem e intervalo de postagem do mesmo roteiro entre redes.
// Saída: out/plataformas/ordem.txt
import { writeFileSync } from "node:fs";
import { carregar, avaliar, OUT, fmt } from "../lib.mjs";
import { P3, SIGLA, mulberry32 } from "./feat.mjs";

const L = carregar().filter((r) => P3.includes(r.plataforma)), out = [], f2 = fmt.f2, pct = fmt.pct;
const por = new Map();
for (const r of L) (por.get(r.script_id) ?? por.set(r.script_id, []).get(r.script_id)).push(r);
const dia = (s) => Date.parse(s) / 864e5;
for (const rs of por.values()) {
  const d0 = Math.min(...rs.map((r) => dia(r.data)));
  for (const r of rs) { r._lag = dia(r.data) - d0; r._multi = rs.length >= 2; r._primeira = rs.length >= 2 && r._lag === 0 && rs.some((x) => x._lag > 0 || dia(x.data) > d0); }
}
const multi = [...por.values()].filter((rs) => rs.length >= 2);
const escalonados = multi.filter((rs) => new Set(rs.map((r) => r.data)).size > 1);
out.push(`## Ordem de postagem`, `- roteiros em 2+ redes (IG/TT/YT): ${multi.length}; todas no mesmo dia: ${multi.length - escalonados.length} (${pct(1 - escalonados.length / multi.length)}); em dias diferentes: ${escalonados.length}`);
const primeiro = {}, lags = [];
for (const rs of escalonados) {
  const d0 = Math.min(...rs.map((r) => dia(r.data)));
  const ps = rs.filter((r) => dia(r.data) === d0).map((r) => SIGLA[r.plataforma]).sort().join("+");
  primeiro[ps] = (primeiro[ps] ?? 0) + 1;
  lags.push(Math.max(...rs.map((r) => r._lag)));
}
lags.sort((a, b) => a - b);
out.push(`- quem saiu primeiro (só os escalonados): ${Object.entries(primeiro).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
out.push(`- maior intervalo entre a 1ª e a última rede: mediana ${lags[Math.floor(lags.length / 2)]} dia(s); 1 dia ${lags.filter((x) => x === 1).length}, 2 a 7 dias ${lags.filter((x) => x >= 2 && x <= 7).length}, mais de 7 ${lags.filter((x) => x > 7).length}`);
const cli = {};
for (const rs of escalonados) cli[rs[0].cliente] = (cli[rs[0].cliente] ?? 0) + 1;
out.push(`- clientes com postagem escalonada: ${Object.entries(cli).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}/${multi.filter((m) => m[0].cliente === k).length}`).join("; ")}`);

// Efeito: o vídeo que saiu DEPOIS de outra rede (lag >= 1) contra o que saiu no mesmo dia, dentro do cliente.
out.push(`\n## O vídeo que sai depois (1+ dia após outra rede) rende diferente?`);
out.push("| rede | n depois | % topo depois vs mesmo dia | OR MH [IC] | Δ pq dentro do cliente [IC bootstrap] | clientes com n>=3 |", "|---|---|---|---|---|---|");
const rnd = mulberry32(11);
for (const p of P3) {
  const base = L.filter((r) => r.plataforma === p && r._multi);
  const a = avaliar("depois", (r) => r._lag >= 1, { linhas: base, plats: [p] });
  const g = new Map();
  for (const r of base) (g.get(r.cliente) ?? g.set(r.cliente, { s: [], m: [] }).get(r.cliente))[r._lag >= 1 ? "s" : "m"].push(r.pq);
  const est = (G) => { let num = 0, den = 0; for (const { s, m } of G) if (s.length && m.length) { const w = (s.length * m.length) / (s.length + m.length); num += w * (s.reduce((x, y) => x + y, 0) / s.length - m.reduce((x, y) => x + y, 0) / m.length); den += w; } return den ? num / den : NaN; };
  const G = [...g.values()];
  const bs = [];
  for (let b = 0; b < 2000; b++) bs.push(est(G.map(({ s, m }) => ({ s: s.map(() => s[Math.floor(rnd() * s.length)]), m: m.map(() => m[Math.floor(rnd() * m.length)]) }))));
  bs.sort((x, y) => x - y);
  const k = G.filter(({ s, m }) => s.length >= 3 && m.length >= 3).length;
  out.push(`| ${p} | ${a.todas.n} | ${pct(a.todas.p)} vs ${pct(a.todas.p_sem)} | ${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}] | ${(100 * est(G)).toFixed(1)} [${(100 * bs[50]).toFixed(1)} a ${(100 * bs[1949]).toFixed(1)}] | ${k} |`);
}
// Seleção: a 1ª rede foi melhor quando as outras vieram depois? (indício de "testar e depois replicar")
out.push(`\n## Seleção: o vídeo da rede que saiu primeiro (com as outras depois) já era melhor?`);
for (const p of P3) {
  const base = L.filter((r) => r.plataforma === p && r._multi && r._lag === 0);
  const a = avaliar("primeira de uma série escalonada", (r) => r._primeira, { linhas: base, plats: [p] });
  out.push(`- ${p}: n=${a.todas.n}, % topo ${pct(a.todas.p)} vs ${pct(a.todas.p_sem)} (mesmo dia em todas), OR MH ${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}]`);
}
writeFileSync(OUT + "plataformas/ordem.txt", out.join("\n"));
console.log(out.join("\n"));
