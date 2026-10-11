// 5. Por cliente: melhor e pior CTA real (seguidores), o que separa dentro do cliente, n-gramas do topo.
import { writeFileSync } from "node:fs";
import { OUT, norm, tokens, ngramas, DESFECHOS, fmt } from "../lib.mjs";
import { RC } from "./conexao.mjs";
const y = DESFECHOS.seguidores;
const t = (r) => norm(r.falado_tx);
const P1 = /\b(eu )?(te )?(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho|destrincho|desvendo|traduzo)\b/;
const pede = (r) => r.ft.v_comenta || r.ft.v_compart || r.ft.v_salva || r.ft.v_curte;
const tema = (r) => r._ovTemaFora >= 2 || r._ovHook >= 1;
export const FEATS = {
  "promessa do território (sem palavra do assunto)": (r) => !tema(r) && r.ft.prom,
  "promessa amarrada ao assunto do vídeo": (r) => tema(r) && r.ft.prom,
  "todo dia / todos os dias": (r) => r.ft.freq,
  "eu te mostro / revelo / trago": (r) => P1.test(t(r)),
  "se você quer": (r) => r.ft.cond,
  "me segue aqui": (r) => /\bsegue aqui\b/.test(t(r)),
  "segue o meu perfil": (r) => /\bsegue (o )?meu perfil\b/.test(t(r)),
  "para não perder o próximo": (r) => r.ft.nao_perder,
  "mais conteúdos como esse": (r) => r.ft.mais_como_esse,
  "agora": (r) => /\bagora\b/.test(t(r)),
  "credencial na apresentação": (r) => r.ft.apres && r.ft.credencial,
  "sem apresentação": (r) => !r.ft.apres,
  "pedido extra (comenta, compartilha, salva)": pede,
  "antes de todo mundo / da maioria / à frente": (r) => r.ft.exclusiv,
  "histórias": (r) => r.ft.o_historias,
  "estratégias": (r) => r.ft.o_estrategias,
};
const R = RC.filter((r) => ["Instagram", "TikTok"].includes(r.plataforma) && y(r) != null && r.falado_tx);
const por = new Map();
for (const r of R) (por.get(r.estrato) ?? por.set(r.estrato, []).get(r.estrato)).push(r);
const out = [];
let md = "# Por cliente: o que converte em seguidor dentro de cada um (transcrição; topo = quartil superior de seguidores por mil views no cliente x rede)\n";
for (const g of [...por.values()].sort((a, b) => b.length - a.length)) {
  if (g.length < 30) continue;
  const c = g[0].cliente, p = g[0].plataforma;
  const base = g.filter(y).length / g.length;
  const contr = [];
  for (const [n, f] of Object.entries(FEATS)) {
    const com = g.filter(f), sem = g.filter((r) => !f(r));
    if (com.length < 6 || sem.length < 6) continue;
    const a = com.filter(y).length / com.length, b = sem.filter(y).length / sem.length;
    contr.push({ n, com: com.length, a, b, d: a - b });
  }
  contr.sort((x, z) => z.d - x.d);
  // n-gramas que mais aparecem no topo do cliente (suporte >= 6 roteiros)
  const grams = new Map();
  for (const r of g) for (const k of new Set([2, 3, 4].flatMap((n) => ngramas(tokens(r.falado_tx), n)))) { const e = grams.get(k) ?? grams.set(k, { n: 0, top: 0 }).get(k); e.n++; e.top += y(r); }
  const gtop = [...grams].filter(([, e]) => e.n >= 6 && e.n <= g.length * 0.8).map(([k, e]) => ({ k, n: e.n, taxa: e.top / e.n })).sort((x, z) => z.taxa - x.taxa || z.n - x.n);
  const ord = [...g].sort((a, b) => b.p_seg - a.p_seg);
  const uniq = (arr) => { const v = new Set(); return arr.filter((r) => !v.has(r.script_id) && v.add(r.script_id)); };
  const top = uniq(ord).slice(0, 3), pior = uniq([...ord].reverse()).slice(0, 2);
  const lin = (r) => `p_seg ${fmt.f2(r.p_seg)}, ${fmt.f2(r.seg_por_mil)} seg/mil, coef ${fmt.f2(r.coef)}: "${r.falado_tx.slice(0, 260)}"`;
  md += `\n## ${c} | ${p} (n=${g.length}, base topo ${fmt.pct(base)})\n`;
  md += `- ajuda: ${contr.filter((x) => x.d > 0).slice(0, 3).map((x) => `${x.n} (${x.com} vídeos, topo ${fmt.pct(x.a)} vs ${fmt.pct(x.b)})`).join("; ") || "nada"}\n`;
  md += `- atrapalha: ${contr.filter((x) => x.d < 0).slice(-3).reverse().map((x) => `${x.n} (${x.com} vídeos, topo ${fmt.pct(x.a)} vs ${fmt.pct(x.b)})`).join("; ") || "nada"}\n`;
  md += `- n-gramas do topo: ${gtop.slice(0, 4).map((x) => `"${x.k}" (${x.n}, ${fmt.pct(x.taxa)} no topo)`).join("; ")}\n`;
  md += top.map((r) => `- MELHOR: ${lin(r)}`).join("\n") + "\n" + pior.map((r) => `- PIOR: ${lin(r)}`).join("\n") + "\n";
  out.push({ cliente: c, plataforma: p, n: g.length, ajuda: contr.filter((x) => x.d > 0).slice(0, 3), atrapalha: contr.filter((x) => x.d < 0).slice(-3), top: top.map((r) => ({ texto: r.falado_tx, p_seg: r.p_seg, seg_por_mil: r.seg_por_mil, coef: r.coef, link: r.link })), pior: pior.map((r) => ({ texto: r.falado_tx, p_seg: r.p_seg, seg_por_mil: r.seg_por_mil })) });
}
writeFileSync(OUT + "comando/clientes.md", md);
writeFileSync(OUT + "comando/clientes.json", JSON.stringify(out, null, 1));
console.log(md);
