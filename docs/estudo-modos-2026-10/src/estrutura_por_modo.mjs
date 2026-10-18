// Estrutura narrativa (rótulo do estudo de setembro, 1ª estrutura do vídeo) por modo: fatia e lift no coef dentro do modo.
import { readFileSync } from "node:fs";
import { carregar, lift, DESFECHOS, OUT, fmt } from "../lib.mjs";
const rot = new Map(readFileSync(OUT + "modos/rotulos_modo.jsonl", "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).map((r) => [r.script_id, r]));
const L = carregar().filter((r) => rot.has(r.script_id) && ["Instagram", "TikTok", "YouTube"].includes(r.plataforma)).map((r) => ({ ...r, m: rot.get(r.script_id).modo, e: (r.cls_estrutura ?? [])[0] ?? null }));
for (const m of ["historia", "mecanismo", "demonstracao", "panorama"]) {
  const Lm = L.filter((r) => r.m === m && r.e);
  const ids = new Set(Lm.map((r) => r.script_id)).size;
  const cont = {}; for (const r of Lm) cont[r.e] = (cont[r.e] ?? 0) + 1;
  const linhas = Object.entries(cont).sort((a, b) => b[1] - a[1]).filter(([, n]) => n >= 25).map(([e, n]) => { const l = lift(Lm, (r) => r.e === e, DESFECHOS.coef); return `${e} ${fmt.pct(n / Lm.length)} lift ${fmt.f2(l.lift)} [${fmt.f2(l.lb)}-${fmt.f2(l.ub)}]`; });
  console.log(`${m} (${ids} roteiros com estrutura): ${linhas.join("; ")}`);
}
