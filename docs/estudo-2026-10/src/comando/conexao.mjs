// 4. Conexão do comando com o roteiro: o CTA repete palavras do hook/título/assunto? CTA temático x CTA fixo do cliente.
import { writeFileSync } from "node:fs";
import { OUT, tokens, fmt } from "../lib.mjs";
import { L } from "./feat.mjs";
import { medir, linhaSeg, cabSeg, linhaOutros, cabOutros } from "./medir.mjs";

const STOP = new Set(("a o e de da do das dos em no na nos nas um uma para pra pro por com sem que se ou mas como mais muito eu tu voce vc ele ela eles elas nos me te lhe meu minha seu sua esse essa este esta isso isto aqui ai ja entao agora so " +
  "sou ser esta estao tem ter vai quer quiser gosta fazer faz ficar segue siga seguir perfil canal pagina proximo proxima video videos conteudo conteudos todo todos toda todas dia dias nao perder nome chamo assim cada ao aos as os pelo pela qual quem porque sobre ate " +
  "entender saber conhecer aprender receber continuar mostro trago revelo analiso ensino explico conto mundo maiores melhores grandes coisas forma").split(" "));
const stems = (s, nomes) => new Set(tokens(s).filter((w) => w.length > 3 && !STOP.has(w) && !nomes.has(w)).map((w) => w.slice(0, 5)));
const inter = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n; };
const jac = (a, b) => { const i = inter(a, b); return i / Math.max(1, a.size + b.size - i); };

// vocabulário fixo de CTA por cliente x rede (radicais em >= 20% dos CTAs dele)
const R = L.filter((r) => r.falado_tx);
for (const r of R) r._cta = stems(r.falado_tx, new Set(tokens(r.cliente)));
const porEstrato = new Map();
for (const r of R) (porEstrato.get(r.estrato) ?? porEstrato.set(r.estrato, []).get(r.estrato)).push(r);
for (const g of porEstrato.values()) {
  const freq = new Map();
  for (const r of g) for (const s of r._cta) freq.set(s, (freq.get(s) ?? 0) + 1);
  const fixo = new Set([...freq].filter(([, c]) => c >= 0.2 * g.length).map(([s]) => s));
  for (const r of g) {
    const nomes = new Set(tokens(r.cliente));
    const tema = new Set([...stems(r.g?.hook, nomes), ...stems(r.hook_video, nomes), ...stems(r.s?.titulo, nomes), ...stems(r.titulo_video, nomes), ...stems(r.assunto, nomes)]);
    const hook = new Set([...stems(r.g?.hook, nomes), ...stems(r.hook_video, nomes)]);
    r._ovHook = inter(r._cta, hook);
    r._ovTitulo = inter(r._cta, new Set([...stems(r.s?.titulo, nomes), ...stems(r.titulo_video, nomes)]));
    r._ovTemaFora = [...r._cta].filter((s) => tema.has(s) && !fixo.has(s)).length; // palavra do tema que não é do vocabulário fixo do cliente
    // repetição: fração dos outros CTAs do cliente x rede quase iguais a este (Jaccard >= 0,6)
    const outros = g.filter((x) => x !== r && x.script_id !== r.script_id);
    r._rep = outros.length ? outros.filter((x) => jac(x._cta, r._cta) >= 0.6).length / outros.length : 0;
    r._jacMed = outros.length ? outros.reduce((s, x) => s + jac(x._cta, r._cta), 0) / outros.length : 0;
  }
}
const C = [
  ["CTA repete 1+ palavra do hook", (r) => r._ovHook >= 1],
  ["CTA repete 2+ palavras do hook", (r) => r._ovHook >= 2],
  ["CTA repete 1+ palavra do título", (r) => r._ovTitulo >= 1],
  ["CTA temático (1+ palavra do tema fora do vocabulário fixo do cliente)", (r) => r._ovTemaFora >= 1],
  ["CTA temático forte (2+ palavras do tema fora do vocabulário fixo)", (r) => r._ovTemaFora >= 2],
  ["CTA sem nenhuma palavra do tema", (r) => r._ovTemaFora === 0 && r._ovHook === 0 && r._ovTitulo === 0],
  ["CTA fixo (quase igual a 30%+ dos CTAs do cliente na rede)", (r) => r._rep >= 0.3],
  ["CTA repetido (quase igual a 10%+ dos CTAs do cliente)", (r) => r._rep >= 0.1],
  ["CTA único (quase igual a menos de 2% dos CTAs do cliente)", (r) => r._rep < 0.02],
];
const os = C.map(([n, p]) => medir(n, (r) => r._cta && p(r)));
let md = `# Conexão do comando com o roteiro (texto: transcrição)\n\n${cabSeg}\n${os.map(linhaSeg).join("\n")}\n\n${cabOutros}\n${os.map(linhaOutros).join("\n")}\n`;
// variação do CTA por cliente (Instagram): similaridade média entre CTAs e fração temática
md += "\n## Variação do CTA por cliente (Instagram e TikTok, transcrição)\n\n| cliente | rede | vídeos | similaridade média entre CTAs (0 a 1) | % CTAs fixos (iguais a 30%+) | % CTAs temáticos |\n|---|---|---|---|---|---|\n";
const lin = [];
for (const [k, g] of porEstrato) {
  if (g.length < 40 || !["Instagram", "TikTok"].includes(g[0].plataforma)) continue;
  const m = (f) => g.reduce((s, r) => s + f(r), 0) / g.length;
  lin.push([g[0].cliente, g[0].plataforma, g.length, m((r) => r._jacMed), m((r) => (r._rep >= 0.3 ? 1 : 0)), m((r) => (r._ovTemaFora >= 1 ? 1 : 0))]);
}
for (const l of lin.sort((a, b) => b[3] - a[3])) md += `| ${l[0]} | ${l[1]} | ${l[2]} | ${fmt.f2(l[3])} | ${fmt.pct(l[4])} | ${fmt.pct(l[5])} |\n`;
writeFileSync(OUT + "comando/conexao.md", md);
if (process.argv[1]?.endsWith("conexao.mjs") && !process.argv.includes("--quieto")) console.log(md);
export { R as RC };
