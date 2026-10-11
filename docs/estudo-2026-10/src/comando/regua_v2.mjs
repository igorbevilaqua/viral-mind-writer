// Reproduz a régua do v2 (lift mediano = mediana de seguidores/mil do vídeo ÷ mediana do canal; vídeos com 5 mil+ views)
// nos mesmos padrões, com o campo do v2 (comando_video, LLM) e com a transcrição. Para separar "régua" de "texto".
import { writeFileSync } from "node:fs";
import { OUT, fmt } from "../lib.mjs";
import { L } from "./feat.mjs";
const R = L.filter((r) => ["Instagram", "TikTok"].includes(r.plataforma) && r.seg_por_mil != null && r.views >= 5000);
const med = (a) => { const b = [...a].sort((x, y) => x - y); const n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : null; };
const mc = new Map();
for (const r of R) (mc.get(r.canal_id) ?? mc.set(r.canal_id, []).get(r.canal_id)).push(r.seg_por_mil);
const medCanal = new Map([...mc].map(([k, v]) => [k, med(v)]));
for (const r of R) { const m = medCanal.get(r.canal_id); r._ratio = m > 0 ? r.seg_por_mil / m : null; }
const P = [["cond_prom_esp", "1,49"], ["mais_como_esse", "1,39"], ["exclusiv", "1,34"], ["prom_esp", "1,24"], ["pergunta", "1,16"], ["freq", "1,12"], ["cond_so", "1,09"], ["urg", "1,03"], ["apres", "0,77"], ["nao_perder", "0,69"], ["engaj", "0,68"], ["generico", "0,65"]];
let md = `# Régua do v2 (lift mediano contra a mediana do canal; ${R.length} vídeos IG+TT com 5 mil+ views e seguidores registrados)\n\n| padrão | v2 | LLM (campo do v2): lift mediano (n) | transcrição: lift mediano (n) |\n|---|---|---|---|\n`;
for (const [k, v2] of P) {
  const a = R.filter((r) => r._ratio != null && !r.ff.vazio && r.ff[k]), b = R.filter((r) => r._ratio != null && r.falado_tx && r.ft[k]);
  md += `| ${k} | ${v2} | ${fmt.f2(med(a.map((r) => r._ratio)))} (${a.length}) | ${fmt.f2(med(b.map((r) => r._ratio)))} (${b.length}) |\n`;
}
md += `\nreferência: mediana de todos = ${fmt.f2(med(R.filter((r) => r._ratio != null).map((r) => r._ratio)))}\n`;
writeFileSync(OUT + "comando/regua_v2.md", md);
console.log(md);
