// 2b. Aprofunda os dispositivos de corpo com sinal + tabela completa de ret_final (IG) para todos.
import { avaliar, tabela, salvar, linhasCtl, resumo } from "./h.mjs";
import { f } from "./feat.mjs";
import { DISPOSITIVOS } from "./ritmo.mjs";
import { aprofundar } from "./fundo.mjs";

// ret_final IG, controlando tamanho
const rf = DISPOSITIVOS.map(([n, p]) => avaliar(n, p, { desfecho: "ret_final", plats: ["Instagram"], linhas: linhasCtl(), minN: 25 }));
console.log("## ret_final (IG), MH por cliente x faixa de tamanho");
console.log(tabela(rf, ["Instagram"]));

const c = (re) => (r) => re.test(f(r).corpo_sem);
const D = [
  ["ou seja", c(/\bou seja\b/), /\bou seja\b/],
  ["o detalhe é que", c(/\b(o detalhe e que|detalhe:|o detalhe:)/), /\b(o detalhe e que|detalhe:|o detalhe:)/],
  ["pra você ter ideia", c(/\b(so )?(pra|para) (voce|vc) ter (uma )?(ideia|nocao)\b/), /\b(pra|para) (voce|vc) ter (uma )?(ideia|nocao)\b/],
  ["entenda", c(/\bentenda\b/), /\bentenda\b/],
  ["lista primeiro... terceiro", c(/\bprimeir[oa]\b[\s\S]*\bterceir[oa]\b|\bem primeiro lugar\b/), /\b(primeir[oa]|terceir[oa])\b/],
  ["foi aí que / foi quando", c(/\bfoi (ai|entao|quando) que\b|\bfoi quando\b/), /\bfoi (ai|entao|quando) que\b|\bfoi quando\b/],
  ["nomes próprios >=6,8 por 100", (r) => f(r).nomes100 >= 6.8, null],
  ["exatamente 1 ano citado", (r) => f(r).anos === 1, /\b(1[5-9]|20)\d\d\b/],
  ["pergunta no corpo", (r) => f(r).perguntas_corpo >= 1, /\?/],
  ["'anos/meses depois'", c(/\b(anos|meses|dias|decadas|semanas) depois\b/), /\b(anos|meses|dias|decadas|semanas) depois\b/],
  ["'até que'", c(/\bate que\b/), /\bate que\b/],
  ["'você' >=0,6 por 100 no corpo", (r) => f(r).voce100 >= 0.6, /\bvoces?\b/],
  ["citação entre aspas", (r) => f(r).aspas >= 1, /["“]/],
  ["frases curtas (<=6 palavras) >=13%", (r) => f(r).frac_curtas >= 0.13, null],
  ["viradas <=0,4 por 100", (r) => f(r).viradas100 <= 0.4, null],
];
const out = { ret_final: rf.map((a) => resumo(a, ["Instagram"])), fundo: [] };
for (const [n, p, re] of D) out.fundo.push(aprofundar(n, p, { re, desfechos: [["ret_final", ["Instagram"]], ["acerto", ["Instagram", "TikTok", "YouTube"]], ["comentarios", ["Instagram", "TikTok", "YouTube"]]] }));
salvar("ritmo2.json", out);
