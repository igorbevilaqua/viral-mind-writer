// Modo dos roteiros do Codex (1ª versão de cada sessão) contra a casa: geral, mesmos clientes, desde 01/07, e só notícia.
import { readFileSync } from "node:fs";
import { ler, OUT } from "../lib.mjs";
const jl = (f) => readFileSync(OUT + "modos/" + f, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
const OK = ["historia", "mecanismo", "demonstracao", "panorama", "conselho", "publi", "misto"];
const meta = new Map(JSON.parse(readFileSync(OUT + "modos/codex_meta.json", "utf8")).map((m) => [m.id, m]));
const codex = jl("rotulos_codex.jsonl").filter((r) => meta.has(r.script_id) && OK.includes(r.modo)).map((r) => ({ ...r, cliente: meta.get(r.script_id).cliente }));
const scripts = new Map(ler("scripts.json").map((s) => [s.script_id, s]));
const datas = new Map(); for (const v of ler("videos.json")) if (v.script_id && (!datas.has(v.script_id) || v.data < datas.get(v.script_id))) datas.set(v.script_id, v.data);
const casa = jl("rotulos_modo.jsonl").filter((r) => scripts.has(r.script_id)).map((r) => ({ ...r, cliente: scripts.get(r.script_id).cliente, data: datas.get(r.script_id) ?? "" }));
const clientesCodex = new Set(codex.map((r) => r.cliente));
const dist = (xs, f = (r) => r.modo, vals = OK.slice(0, 6)) => vals.map((v) => `${v} ${Math.round((100 * xs.filter((r) => f(r) === v).length) / (xs.length || 1))}%`).join(" | ");
const linhas = [
  ["Codex (150, 1ª versão)", codex],
  ["casa, tudo", casa],
  ["casa, mesmos clientes, desde 01/07", casa.filter((r) => clientesCodex.has(r.cliente) && r.data >= "2026-07-01")],
];
for (const [n, xs] of linhas) console.log(`${n} (n=${xs.length}): ${dist(xs)}\n   âncora: ${dist(xs, (r) => r.ancora, ["noticia", "passado", "atemporal"])} | emotivo ${Math.round((100 * xs.filter((r) => r.registro === "emotivo").length) / xs.length)}%`);
for (const [n, xs] of linhas) { const ns = xs.filter((r) => r.ancora === "noticia"); console.log(`só notícia, ${n} (n=${ns.length}): ${dist(ns)}`); }
// ponderado: o que a casa faria com o mesmo mix de clientes do Codex
const porCliente = new Map(); for (const r of casa.filter((r) => r.data >= "2026-07-01")) (porCliente.get(r.cliente) ?? porCliente.set(r.cliente, []).get(r.cliente)).push(r);
const esperado = Object.fromEntries(OK.map((m) => [m, 0])); let peso = 0;
for (const r of codex) { const xs = porCliente.get(r.cliente); if (!xs?.length) continue; peso++; for (const m of OK) esperado[m] += xs.filter((x) => x.modo === m).length / xs.length; }
console.log(`casa reponderada pelo mix de clientes do Codex (${peso} roteiros com cliente na casa): ${OK.slice(0, 6).map((m) => `${m} ${Math.round((100 * esperado[m]) / peso)}%`).join(" | ")}`);
const porC = {}; for (const r of codex) (porC[r.cliente] ??= []).push(r.modo);
console.log("Codex por cliente:", Object.entries(porC).sort((a, b) => b[1].length - a[1].length).map(([c, ms]) => `${c} ${ms.length} (mec ${ms.filter((m) => m === "mecanismo").length})`).join("; "));
// observado x esperado só nos roteiros do Codex cujo cliente tem base na casa (soma de Bernoullis: var = soma p(1-p))
for (const m of ["historia", "mecanismo", "demonstracao", "panorama"]) {
  let obs = 0, exp = 0, v = 0;
  for (const r of codex) { const xs = porCliente.get(r.cliente); if (!xs?.length) continue; const p = xs.filter((x) => x.modo === m).length / xs.length; obs += r.modo === m ? 1 : 0; exp += p; v += p * (1 - p); }
  console.log(`${m}: Codex ${obs} | esperado ${exp.toFixed(1)} | z ${((obs - exp) / Math.sqrt(v)).toFixed(1)}`);
}
