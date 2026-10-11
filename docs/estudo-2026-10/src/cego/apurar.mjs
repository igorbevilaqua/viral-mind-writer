// Apura as apostas cegas contra o gabarito: acerto geral, por confiança, por parte decisiva e por pista.
// Entrada: out/cego/respostas_lote*.json = [{ par_id, escolha: "A"|"B", confianca: 1-3, parte_decisiva, pistas: [codigo], nota }]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { wilson } from "../lib.mjs";
const gab = JSON.parse(readFileSync("data/gabarito_pares.json", "utf8"));
const EXCLUIR = new Set(JSON.parse(readFileSync("data/cego/excluir.json", "utf8")));
// metadados vêm do mapa dos lotes cegos (o data/pares.json foi regravado depois do sorteio)
const pares = new Map(Object.entries(JSON.parse(readFileSync("data/cego/mapa.json", "utf8"))).map(([k, v]) => [k, v]));
const resp = readdirSync("out/cego").filter((f) => /^respostas_lote\d+\.json$/.test(f)).flatMap((f) => JSON.parse(readFileSync("out/cego/" + f, "utf8")))
  .filter((r) => pares.has(r.par_id) && !EXCLUIR.has(r.par_id));
const ok = (r) => r.escolha === gab[r.par_id];
const resumo = (rs) => { const k = rs.filter(ok).length, n = rs.length; const [lo, hi] = wilson(k, n); return { n, acerto: n ? k / n : null, lo, hi }; };
const out = { geral: resumo(resp), por_confianca: {}, por_parte: {}, por_pista: [], por_plataforma: {}, por_cliente: {} };
for (const c of [1, 2, 3]) out.por_confianca[c] = resumo(resp.filter((r) => r.confianca === c));
for (const p of [...new Set(resp.map((r) => r.parte_decisiva))]) out.por_parte[p] = resumo(resp.filter((r) => r.parte_decisiva === p));
for (const pl of [...new Set(resp.map((r) => pares.get(r.par_id)?.plataforma))]) out.por_plataforma[pl] = resumo(resp.filter((r) => pares.get(r.par_id)?.plataforma === pl));
for (const cl of [...new Set(resp.map((r) => pares.get(r.par_id)?.cliente))]) out.por_cliente[cl] = resumo(resp.filter((r) => pares.get(r.par_id)?.cliente === cl));
const pistas = new Map();
for (const r of resp) for (const p of r.pistas ?? []) (pistas.get(p) ?? pistas.set(p, []).get(p)).push(r);
for (const [p, rs] of pistas) out.por_pista.push({ pista: p, ...resumo(rs) });
out.por_pista.sort((a, b) => b.n - a.n);
mkdirSync("out/cego", { recursive: true });
writeFileSync("out/cego/apuracao.json", JSON.stringify(out, null, 1));
const f = (x) => (x == null ? "-" : `${Math.round(x * 100)}%`);
console.log(`geral: ${f(out.geral.acerto)} [${f(out.geral.lo)} a ${f(out.geral.hi)}] n=${out.geral.n}`);
for (const [c, v] of Object.entries(out.por_confianca)) console.log(`confiança ${c}: ${f(v.acerto)} n=${v.n}`);
for (const [c, v] of Object.entries(out.por_parte)) console.log(`parte ${c}: ${f(v.acerto)} n=${v.n}`);
for (const [c, v] of Object.entries(out.por_plataforma)) console.log(`plataforma ${c}: ${f(v.acerto)} n=${v.n}`);
console.log("pistas (n>=8):"); for (const p of out.por_pista.filter((x) => x.n >= 8)) console.log(`  ${p.pista}: ${f(p.acerto)} [${f(p.lo)} a ${f(p.hi)}] n=${p.n}`);
