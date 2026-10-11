// 4b. Fórmulas de conclusão: aprofundamento com exemplos (texto da conclusão; para retomada, hook + conclusão).
import { salvar } from "./h.mjs";
import { f } from "./feat.mjs";
import { aprofundar } from "./fundo.mjs";
import { multi, CABM } from "./multi.mjs";

const k = (re) => (r) => re.test(f(r).conc_sem);
const conc = (r) => r.g.conclusao;
const hookConc = (r) => `HOOK: ${r.g.hook} || CONCLUSÃO: ${r.g.conclusao}`;
const D = [
  ["conclusão abre com 'Enquanto' (contraste)", k(/^(e )?enquanto\b/), conc],
  ["conclusão retoma >=20% das palavras do hook", (r) => f(r).conc_overlap_hook >= 0.2, hookConc],
  ["conclusão com 'era ... hoje/agora' (antes x agora)", k(/\b(era|eram|tinha|vendia|valia)\b[\s\S]*\b(hoje|agora)\b|\b(hoje|agora)\b[\s\S]*\b(era|eram)\b/), conc],
  ["conclusão com 'hoje' (estado atual)", k(/\bhoje\b/), conc],
  ["conclusão com 'nem X, nem Y' / 'nem'", k(/\bnem\b/), conc],
  ["conclusão <=15 palavras", (r) => f(r).conc_palavras <= 15, conc],
  ["conclusão com 'pode ser / pode' (hedge)", k(/\bpode ser\b|\btalvez\b/), conc],
  ["conclusão com 'a lição / lição'", k(/\blic(ao|oes)\b/), conc],
  ["conclusão com 'a diferença (está/é)'", k(/\b(a|essa|toda a) diferenca\b/), conc],
  ["conclusão aforismo 'Quem X, Y'", k(/(^|[.!?]\s+|\b(e|mas|porque) )quem [^,.?!]{2,60}, [^.?!]{2,90}/), conc],
  ["conclusão pede opinião / 'você acha'", k(/\b(o que voce acha|voce (acha|concorda|faria|teria|compraria|usaria|aceitaria|trocaria|confiaria|pagaria|deixaria)|e voce\?|e pra voce|qual (seria|e) a sua|comenta)\b/), conc],
  ["conclusão com pergunta", (r) => /\?/.test(f(r).conc_raw), conc],
  ["conclusão com 'Brasil/país/governo'", k(/\b(brasil|brasileir\w*|pais|governo)\b/), conc],
  ["conclusão com opinião do narrador ('eu')", k(/\beu\b/), conc],
  ["conclusão com número novo", (r) => f(r).conc_numero_novo, conc],
  ["conclusão fica no personagem ('ele/ela/dele/dela')", k(/\b(ele|ela|dele|dela|eles|elas)\b/), conc],
  ["conclusão com escala global ('mundo inteiro/do mundo/planeta')", k(/\b(mundo inteiro|do mundo|no mundo|planeta)\b/), conc],
  ["conclusão com 'mas sim' / 'e sim'", k(/\b(mas|e) sim\b/), conc],
  ["conclusão com 'você precisa / presta atenção'", k(/\b(precisa|precisamos|presta atencao|preste atencao|fique atento|atencao)\b/), conc],
];

const out = { tabela: [], fundo: [] };
console.log(CABM);
for (const [n, p] of D) { const m = multi(n, p); console.log(m.txt); out.tabela.push(m.json); }
for (const [n, p, campo] of D) out.fundo.push(aprofundar(n, p, { campo, re: null, desfechos: [["compart", ["Instagram", "TikTok"]], ["comentarios", ["Instagram", "TikTok", "YouTube"]], ["ret_final", ["Instagram"]], ["salvamentos", ["TikTok"]]] }));
salvar("conclusao2.json", out);
