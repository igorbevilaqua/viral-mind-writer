// Tarefa 5: ajuste cliente x rede. Para cada conta: acerto, coef, crescimento do canal por rede e o perfil do conteúdo
// (o mesmo roteiro vai para as três redes, então o conteúdo é um só; o que muda é a resposta da rede).
// Saída: out/plataformas/clientes.txt
import { writeFileSync } from "node:fs";
import { carregar, OUT, fmt } from "../lib.mjs";
import { P3, SIGLA, FEATS } from "./feat.mjs";

const L = carregar().filter((r) => P3.includes(r.plataforma)), pct = fmt.pct, f2 = fmt.f2;
const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
const FOCO = ["Izabela Anholett", "Lincoln Fracari", "Marcio Grazino", "Leonardo Nogueira", "Dilson Peres", "Marcos Pelozato", "Rafael Rodrigues", "Fernando Pereira", "Franklin Tomich", "Renato Mendes", "Cadu Neiva", "Rodrigo Waughan", "Thiago Franco", "Manoel Victor", "João Paulo Albuquerque", "Pedro Elero"];
const roteiros = new Map(); // um registro por roteiro (texto e rótulos são do roteiro)
for (const r of L) if (!roteiros.has(r.script_id)) roteiros.set(r.script_id, r);
const R = [...roteiros.values()];
const F = Object.fromEntries(FEATS.map(([id, , , pred]) => [id, pred]));
// características que o pareado e o perfil apontaram como "de rede" (sinal: + favorece a rede indicada)
const MARCAS = [
  ["payoff_qualquer=orgulho", "IG/TT"], ["antagonista=gigante", "IG/TT"], ["funcao_subhook=eleva_aposta", "IG/TT"], ["promessa_hook=novidade", "IG/TT"], ["recorte=brasil_x_estrangeiro", "IG/TT"],
  ["terr=Estudantes brasileiros que inventaram soluções premiadas", "IG/TT"], ["hook_nome", "TT"], ["hook_mega", "TT"], ["hook_eua", "TT"],
  ["hook_moeda", "YT"], ["recorte=estrangeiro", "YT"], ["tipo_conclusao=virada_final", "YT"], ["funcao_subhook=volta_tempo", "YT"], ["payoff=queda", "YT"], ["protagonista=empresa", "YT"],
  ["antagonista=problema", "contra TT"], ["terr=Segredos de marcas globais como Starbucks e Red Bull", "contra TT"], ["rot_lt300", "contra TT"], ["hook_china", "todas"], ["protagonista=espectador", "contra todas"], ["funcao_subhook=puxa_espectador", "contra todas"],
];
const casa = Object.fromEntries(MARCAS.map(([id]) => [id, R.filter(F[id]).length / R.length]));
const out = [`## Métricas por conta e rede (vídeos analisáveis sem repost)`,
  "| conta | rede | n | % acerto da casa (coef>3 e 10 mil+ views) | % com 10 mil+ views | % coef>3 | % coef>=1,5 | coef mediano | views medianas | p90/p50 das views | views medianas: 1º tri -> último tri | % acerto da casa descoberta -> validação |", "|---|---|---|---|---|---|---|---|---|---|---|---|"];
for (const c of FOCO) for (const p of P3) {
  const v = L.filter((r) => r.cliente === c && r.plataforma === p);
  if (v.length < 10) continue;
  const tris = [...new Set(v.map((r) => r.tri))].sort();
  const vt = (t) => med(v.filter((r) => r.tri === t).map((r) => r.views));
  const ac = (per) => { const x = v.filter((r) => r.periodo === per); return x.length >= 5 ? pct(x.filter((r) => r.acerto).length / x.length) : "-"; };
  const sh = (f) => pct(v.filter(f).length / v.length);
  const vs = v.map((r) => r.views).sort((a, b) => a - b);
  out.push(`| ${c} | ${SIGLA[p]} | ${v.length} | ${sh((r) => r.acerto)} | ${sh((r) => r.views >= 10000)} | ${sh((r) => r.coef > 3)} | ${sh((r) => r.coef >= 1.5)} | ${f2(med(v.map((r) => r.coef)))} | ${med(v.map((r) => r.views))} | ${f2(vs[Math.floor(0.9 * (vs.length - 1))] / med(vs))} | ${tris[0]} ${vt(tris[0])} -> ${tris.at(-1)} ${vt(tris.at(-1))} | ${ac("descoberta")} -> ${ac("validacao")} |`);
}
out.push(`\n## Perfil do conteúdo (por roteiro) contra a casa: % de roteiros com cada marca (casa entre parênteses)`);
out.push(`| marca (rede que favorece) | casa | ${FOCO.join(" | ")} |`, `|---|---|${FOCO.map(() => "---").join("|")}|`);
for (const [id, rede] of MARCAS) {
  const cel = FOCO.map((c) => { const rs = R.filter((r) => r.cliente === c); const x = rs.filter(F[id]).length / rs.length; const destaque = x >= 1.5 * casa[id] && x - casa[id] >= 0.05 ? "▲" : x <= 0.5 * casa[id] ? "▽" : ""; return `${pct(x)}${destaque}`; });
  out.push(`| ${id} (${rede}) | ${pct(casa[id])} | ${cel.join(" | ")} |`);
}
const pal = (c) => med(R.filter((r) => r.cliente === c).map((r) => r.g?.palavras_total));
const dur = (c) => med(L.filter((r) => r.cliente === c).map((r) => r.duracao));
out.push(`| palavras (mediana) | ${med(R.map((r) => r.g?.palavras_total))} | ${FOCO.map(pal).join(" | ")} |`);
out.push(`| duração s (mediana) | ${Math.round(med(L.map((r) => r.duracao)))} | ${FOCO.map((c) => Math.round(dur(c))).join(" | ")} |`);
// payoff e protagonista dominantes de cada conta
out.push(`\n## Payoff, protagonista, recorte e território dominantes`);
const top = (rs, k, n = 3) => { const m = {}; for (const r of rs) { const v = k(r); if (v != null) m[v] = (m[v] ?? 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([v, x]) => `${v} ${pct(x / rs.length)}`).join(", "); };
for (const c of FOCO) {
  const rs = R.filter((r) => r.cliente === c);
  out.push(`- **${c}** (${rs.length} roteiros): payoff ${top(rs, (r) => r.llm?.payoff)}; protagonista ${top(rs, (r) => r.llm?.protagonista, 2)}; recorte ${top(rs, (r) => r.llm?.recorte, 2)}; promessa ${top(rs, (r) => r.llm?.promessa_hook, 2)}; território ${top(rs, (r) => r.cluster?.nome30, 3)}`);
}
writeFileSync(OUT + "plataformas/clientes.txt", out.join("\n"));
console.log(out.join("\n"));
