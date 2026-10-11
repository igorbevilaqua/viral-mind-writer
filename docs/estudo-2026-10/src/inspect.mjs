import { readFileSync } from "node:fs";
const S = JSON.parse(readFileSync("data/scripts.json","utf8"));
const V = JSON.parse(readFileSync("data/videos.json","utf8"));
const byS = new Map(); for (const v of V) { if(!byS.has(v.script_id)) byS.set(v.script_id, []); byS.get(v.script_id).push(v); }
const paras = t => (t??"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
const hist = {}; const first = {}; const labels = {};
let hookMatch=0, n=0, lastSegue=0, lastEuSou=0, empty=0;
const norm = s => (s??"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
for (const s of S) {
  const p = paras(s.texto); if (!p.length) { empty++; continue; }
  n++; const k = Math.min(p.length, 30); hist[k]=(hist[k]||0)+1;
  for (const line of p) { const m = line.match(/^([A-ZÇÃÉÍÓÚÂÊÔ ]{3,20}|hook|subhook|cta|headline|t[ií]tulo|conclus[aã]o|comando)\s*[:\-]/i); if (m) labels[m[1].toUpperCase()] = (labels[m[1].toUpperCase()]||0)+1; }
  const w = norm(p[0]).split(" ").slice(0,2).join(" "); first[w]=(first[w]||0)+1;
  const hv = (byS.get(s.script_id)??[]).find(v=>v.hook_video)?.hook_video;
  if (hv) { const a = new Set(norm(hv).split(" ")), b = norm(p[0]).split(" "); const ov = b.filter(x=>a.has(x)).length/Math.max(1,a.size); if (ov>0.6) hookMatch++; }
  const last = norm(p.slice(-2).join(" ")); if (/segue|siga|inscrev/.test(last)) lastSegue++; if (/eu sou|meu nome|sou o |sou a /.test(last)) lastEuSou++;
}
console.log({n, empty, hookMatch, lastSegue, lastEuSou});
console.log("paragrafos:", JSON.stringify(hist));
console.log("labels:", JSON.stringify(Object.entries(labels).sort((a,b)=>b[1]-a[1]).slice(0,30)));
console.log("primeiras 2 palavras:", JSON.stringify(Object.entries(first).sort((a,b)=>b[1]-a[1]).slice(0,40)));
