// Exemplos reais de topo (por seguidores) para cada fórmula, um por cliente, e o contraexemplo fraco.
import { writeFileSync } from "node:fs";
import { OUT, norm, fmt } from "../lib.mjs";
import { RC } from "./conexao.mjs";
const t = (r) => norm(r.falado_tx);
const P1 = /\b(eu )?(te )?(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho|destrincho|desvendo|traduzo)\b/;
const pede = (r) => r.ft.v_comenta || r.ft.v_compart || r.ft.v_salva || r.ft.v_curte;
const tema = (r) => r._ovTemaFora >= 2 || r._ovHook >= 1;
export const FORM = {
  "F1 todo dia + eu te mostro + território": (r) => r.ft.freq && P1.test(t(r)) && !tema(r) && !pede(r),
  "F2 promessa do território (condicional)": (r) => r.ft.cond && r.ft.prom && !tema(r) && !pede(r),
  "F2-contra promessa amarrada ao assunto": (r) => tema(r) && r.ft.prom && !pede(r),
  "F3 me segue aqui": (r) => /\bsegue aqui\b/.test(t(r)) && !pede(r),
  "F4-contra pedido de comentário + seguir": (r) => r.ft.v_comenta && r.ft.v_segue,
  "F5 manda para alguém": (r) => r.ft.v_compart,
  "F6 credencial com número ou feito": (r) => r.ft.apres && (r.ft.c_numero || r.ft.c_feito || r.ft.c_anos),
  "F7 antes de todo mundo / da maioria": (r) => /\bantes (de todo mundo|da maioria|que todo mundo|de todos)\b/.test(t(r)),
  "contra se você gosta/gostou": (r) => /\bse (voce|vc) (gosta|curte|curtiu|gostou)\b/.test(t(r)),
};
const R = RC.filter((r) => ["Instagram", "TikTok"].includes(r.plataforma) && r.p_seg != null && r.falado_tx);
let md = "# Exemplos reais por fórmula (ordenados por percentil de seguidores no cliente x rede; 1 por cliente)\n";
const out = {};
for (const [n, p] of Object.entries(FORM)) {
  const S = R.filter(p);
  const desc = n.includes("contra") ? false : true;
  S.sort((a, b) => (desc ? b.p_seg - a.p_seg : a.p_seg - b.p_seg));
  const vistos = new Set(), ex = [];
  for (const r of S) { if (vistos.has(r.cliente)) continue; vistos.add(r.cliente); ex.push(r); if (ex.length >= 4) break; }
  const fraco = desc ? [...S].sort((a, b) => a.p_seg - b.p_seg)[0] : null;
  const fmtR = (r) => `${r.cliente} | ${r.plataforma} | seguidores p${Math.round(r.p_seg * 100)} (${fmt.f2(r.seg_por_mil)}/mil) | coef ${fmt.f2(r.coef)}: "${r.falado_tx.slice(0, 280)}"`;
  md += `\n## ${n} (${S.length} vídeos, ${fmt.pct(S.filter((r) => r.p_seg >= 0.75).length / Math.max(1, S.length))} no topo)\n` + ex.map((r) => `- ${fmtR(r)}`).join("\n") + (fraco ? `\n- FRACO: ${fmtR(fraco)}` : "") + "\n";
  out[n] = { n: S.length, exemplos: ex.map((r) => ({ cliente: r.cliente, plataforma: r.plataforma, p_seg: r.p_seg, seg_por_mil: r.seg_por_mil, coef: r.coef, texto: r.falado_tx, link: r.link })), fraco: fraco && { cliente: fraco.cliente, plataforma: fraco.plataforma, p_seg: fraco.p_seg, texto: fraco.falado_tx } };
}
// contexto de "todo mundo"
const cx = {};
for (const r of R) { const m = t(r).match(/(\S+ ){0,2}todo mundo/); if (m) cx[m[0]] = (cx[m[0]] ?? 0) + 1; }
md += `\ncontextos de "todo mundo": ${Object.entries(cx).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}:${v}`).join(" | ")}\n`;
writeFileSync(OUT + "comando/exemplos.md", md);
writeFileSync(OUT + "comando/exemplos.json", JSON.stringify(out, null, 1));
console.log(md);
