// Exemplos reais: o MESMO roteiro, com a característica, indo bem na rede favorecida e mal na outra.
// Saída: out/plataformas/exemplos.txt e exemplos.json
import { writeFileSync } from "node:fs";
import { carregar, OUT, fmt } from "../lib.mjs";
import { FEATS, P3, SIGLA } from "./feat.mjs";

const L = carregar().filter((r) => P3.includes(r.plataforma));
const por = new Map();
for (const r of L) (por.get(r.script_id) ?? por.set(r.script_id, {}).get(r.script_id))[r.plataforma] = r;
const F = Object.fromEntries(FEATS.map(([id, , , pred]) => [id, pred]));
// [id, rede favorecida, redes contra (vazio = todas as outras), "todas" = alto nas três]
const CASOS = [
  ["hook_china", "todas"], ["terr=Carros chineses BYD e Geely dominando o Brasil", "todas"], ["payoff=disputa", "todas"],
  ["cta_compart", "Instagram"], ["funcao_subhook=eleva_aposta", "Instagram", ["YouTube"]], ["rot_lt300", "Instagram", ["TikTok"]],
  ["terr=Pré-MBA: ChatGPT, novas IAs e empregos", "TikTok", ["Instagram"]],
  ["hook_nome", "TikTok"], ["hook_mega", "TikTok", ["Instagram"]], ["hook_eua", "TikTok"],
  ["dur_lt90", "Instagram", ["TikTok"]], ["antagonista=problema", "Instagram", ["TikTok"]], ["terr=Segredos de marcas globais como Starbucks e Red Bull", "Instagram", ["TikTok"]],
  ["hook_moeda", "YouTube"], ["payoff=queda", "YouTube", ["TikTok"]], ["dur_120_149", "YouTube", ["Instagram"]], ["recorte=estrangeiro", "YouTube"], ["tipo_conclusao=virada_final", "YouTube"],
  ["payoff_qualquer=orgulho", "Instagram", ["YouTube"]], ["payoff_qualquer=orgulho", "TikTok", ["YouTube"]], ["terr=Estudantes brasileiros que inventaram soluções premiadas", "Instagram", ["YouTube"]], ["antagonista=gigante", "TikTok", ["YouTube"]],
];
const corta = (s, n = 230) => { s = (s ?? "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "..." : s; };
const out = [], js = [];
for (const [id, P, contra] of CASOS) {
  const cand = [];
  for (const o of por.values()) {
    const any = Object.values(o)[0];
    if (!F[id](any)) continue;
    if (P === "todas") { if (P3.every((p) => o[p])) cand.push({ o, s: Math.min(...P3.map((p) => o[p].pq)) }); continue; }
    const outras = (contra ?? P3.filter((p) => p !== P)).filter((p) => o[p]);
    if (!o[P] || !outras.length || o[P].pq < 0.85) continue;
    cand.push({ o, s: o[P].pq - Math.max(...outras.map((p) => o[p].pq)) });
  }
  cand.sort((a, b) => b.s - a.s);
  out.push(`\n### ${id} (${P}${contra ? " contra " + contra.join("/") : ""}): ${cand.length} roteiros candidatos`);
  for (const { o } of cand.slice(0, 3)) {
    const r = Object.values(o)[0];
    const redes = P3.filter((p) => o[p]).map((p) => `${SIGLA[p]} coef ${fmt.f2(o[p].coef)} p${Math.round(100 * o[p].pq)}`).join(" · ");
    out.push(`- ${r.cliente} | ${redes} | título: ${corta(r.s?.titulo, 90)} | hook: "${corta(r.g?.hook)}" | duração ${Math.round(r.duracao ?? 0)} s, ${r.g?.palavras_total} palavras`);
    js.push({ id, rede: P, cliente: r.cliente, redes: Object.fromEntries(P3.filter((p) => o[p]).map((p) => [p, { coef: o[p].coef, pq: o[p].pq, link: o[p].link }])), hook: r.g?.hook, titulo: r.s?.titulo });
  }
}
writeFileSync(OUT + "plataformas/exemplos.txt", out.join("\n"));
writeFileSync(OUT + "plataformas/exemplos.json", JSON.stringify(js));
console.log(out.join("\n"));
