// Confere o gabarito dos lotes cegos contra os dados: o lado "vencedor" tem pq maior na mesma rede?
// Também grava data/cego/mapa.json (par_id -> script_id de A e B) para cruzar pistas com características.
import { readFileSync, writeFileSync } from "node:fs";
import { carregar } from "../lib.mjs";
const L = carregar();
const seg = JSON.parse(readFileSync("data/segmentos.json", "utf8"));
const porHook = new Map();
for (const s of seg) (porHook.get(s.hook) ?? porHook.set(s.hook, []).get(s.hook)).push(s.script_id);
const gab = JSON.parse(readFileSync("data/gabarito_pares.json", "utf8"));
const lotes = [1, 2, 3].flatMap((i) => JSON.parse(readFileSync(`data/cego/lote${i}.json`, "utf8")));
const pq = new Map(L.map((r) => [`${r.script_id}|${r.plataforma}`, r.pq]));
let ok = 0, errado = 0, ambiguo = 0;
const excluir = [];
const mapa = {};
for (const c of lotes) {
  const idA = (porHook.get(c.A.hook) ?? []).find((id) => pq.has(`${id}|${c.plataforma}`));
  const idB = (porHook.get(c.B.hook) ?? []).find((id) => pq.has(`${id}|${c.plataforma}`));
  if (!idA || !idB) { ambiguo++; continue; }
  mapa[c.par_id] = { A: idA, B: idB, cliente: c.cliente, plataforma: c.plataforma };
  const pA = pq.get(`${idA}|${c.plataforma}`), pB = pq.get(`${idB}|${c.plataforma}`);
  const venc = pA > pB ? "A" : "B";
  if (venc === gab[c.par_id] && Math.max(pA, pB) >= 0.75 && Math.min(pA, pB) <= 0.35) ok++; else { errado++; excluir.push(c.par_id); }
}
writeFileSync("data/cego/mapa.json", JSON.stringify(mapa));
writeFileSync("data/cego/excluir.json", JSON.stringify(excluir));
console.log({ pares: lotes.length, gabarito_confere: ok, nao_confere: errado, sem_mapa: ambiguo });
