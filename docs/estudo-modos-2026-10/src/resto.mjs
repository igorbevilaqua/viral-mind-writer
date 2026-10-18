// Junta os rótulos já salvos, valida e monta lotes "resto_NN.md" só com os roteiros que faltam.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
const D = new URL("../../out/modos/", import.meta.url).pathname;
const OK = { modo: ["historia","mecanismo","demonstracao","panorama","conselho","publi","misto"], ancora: ["noticia","passado","atemporal"], registro: ["analitico","emotivo"], confianca: ["alta","media","baixa"] };
const blocos = new Map();
for (const f of readdirSync(D + "lotes").filter((f) => f.endsWith(".md")))
  for (const b of readFileSync(D + "lotes/" + f, "utf8").split(/\n---\n/)) { const m = b.match(/### ([0-9a-f-]{36})/); if (m) blocos.set(m[1], b.trim()); }
const rot = new Map(); let invalidos = 0;
for (const f of readdirSync(D + "rotulos").filter((f) => f.endsWith(".jsonl")))
  for (const l of readFileSync(D + "rotulos/" + f, "utf8").split("\n")) {
    if (!l.trim()) continue;
    let r; try { r = JSON.parse(l); } catch { invalidos++; continue; }
    if (!blocos.has(r.script_id) || Object.entries(OK).some(([k, vs]) => !vs.includes(r[k]))) { invalidos++; continue; }
    rot.set(r.script_id, r);
  }
const falta = [...blocos.keys()].filter((id) => !rot.has(id));
const N = Math.ceil(falta.length / 6);
for (let i = 0; i * N < falta.length; i++) writeFileSync(D + `lotes/resto_${i + 1}.md`, falta.slice(i * N, (i + 1) * N).map((id) => blocos.get(id)).join("\n\n---\n\n") + "\n");
console.log(`rotulados válidos ${rot.size} | inválidos descartados ${invalidos} | faltam ${falta.length} em ${Math.ceil(falta.length / N)} lotes de ${N}`);
