// Os tetos do piso (plano 024) dentro de cada modo: marcadores de origem e números por 100 palavras.
import { readFileSync } from "node:fs";
import { carregar, avaliar, OUT, fmt } from "../lib.mjs";
const rot = new Map(readFileSync(OUT + "modos/rotulos_modo.jsonl", "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).map((r) => [r.script_id, r]));
const ORIGEM = /\b(?:nasceu|trabalhava como|no início|percebeu que|foi aí que|foi quando|tudo começou|começou como|ainda jovem|desde criança)\b/gi;
const NUM = /\d+(?:[.,]\d+)*/g;
const L = carregar().filter((r) => rot.has(r.script_id) && r.s?.texto).map((r) => {
  const t = r.s.texto; const w = t.split(/\s+/).length;
  return { ...r, m: rot.get(r.script_id).modo, origem: (t.match(ORIGEM) ?? []).length, n100: ((t.match(NUM) ?? []).length * 100) / w };
});
for (const m of ["historia", "mecanismo", "demonstracao", "panorama"]) {
  const Lm = L.filter((r) => r.m === m);
  const a = avaliar("origem>=2", (r) => r.origem >= 2, { linhas: Lm });
  const b = avaliar("num>1.8", (r) => r.n100 > 1.8, { linhas: Lm });
  const c = avaliar("num>2.5", (r) => r.n100 > 2.5, { linhas: Lm });
  const f = (x) => `${fmt.f2(x.todas?.lift)} [${fmt.f2(x.todas?.lb)}-${fmt.f2(x.todas?.ub)}] n=${x.todas?.n} ${x.leitura}`;
  console.log(`${m}: origem>=2 ${f(a)} | num>1,8 ${f(b)} | num>2,5 ${f(c)}`);
}
