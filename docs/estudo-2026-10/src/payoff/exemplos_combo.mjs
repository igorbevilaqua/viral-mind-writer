// Exemplos reais de topo (e um fraco) para cada combinação payoff + abertura + fechamento usada no relatório.
import { writeFileSync } from "node:fs";
import { carregar, exemplos, OUT } from "../lib.mjs";
const L = carregar().filter((r) => r.llm && !r.llm.recusa);
const C = [
  ["disputa", ["novidade"], ["sintese", "pergunta"]], ["orgulho", ["quem_qual", "porque_como"], ["consequencia", "licao"]],
  ["inspiracao", ["comparacao"], ["licao"]], ["futuro", ["novidade"], ["futuro"]], ["queda", ["tese", "desfecho"], ["sintese", "licao"]],
  ["alerta", ["porque_como"], ["consequencia"]], ["vantagem", ["novidade", "porque_como"], ["instrucao", "licao"]], ["virada", ["porque_como", "desfecho", "tese"], ["virada_final"]],
  ["superacao", ["desfecho"], ["sintese"]], ["revolta", ["tese", "quem_qual"], ["pergunta", "sintese"]], ["nostalgia", ["porque_como"], ["licao", "sintese"]],
  ["curiosidade", ["quem_qual"], ["pergunta"]], ["bastidor", ["numero", "quem_qual", "porque_como"], ["licao"]], ["sacada", ["numero", "porque_como"], ["virada_final", "licao"]],
];
const RUIM = { superacao: ["porque_como", ["licao"]], vantagem: ["ensinar", ["instrucao", "licao", "consequencia"]], alerta: ["numero", null], futuro: ["porque_como", null], bastidor: ["porque_como", ["pergunta"]], disputa: [null, ["licao", "consequencia"]] };
const txt = (r) => `${r.s?.titulo} || H: ${r.g?.hook} || C: ${r.g?.conclusao} [${r.llm.promessa_hook}/${r.llm.tipo_conclusao}; ant=${r.llm.antagonista}]`;
const limpa = (s) => (s ?? "").replace(/[—–]/g, ",").replace(/\s+/g, " ");
const out = {};
for (const [p, abre, fecha] of C) {
  const pred = (r) => r.llm.payoff === p && abre.includes(r.llm.promessa_hook) && fecha.includes(r.llm.tipo_conclusao);
  out[p] = { abre, fecha, topo: exemplos(pred, txt, { linhas: L, n: 3 }).map((e) => ({ ...e, texto: limpa(e.texto) })) };
  if (RUIM[p]) { const [a, f] = RUIM[p]; const pr = (r) => r.llm.payoff === p && (!a || r.llm.promessa_hook === a) && (!f || f.includes(r.llm.tipo_conclusao)); out[p].fraco = exemplos(pr, txt, { linhas: L, n: 1, pior: true }).map((e) => ({ ...e, texto: limpa(e.texto) })); }
}
writeFileSync(`${OUT}payoff/exemplos_combo.json`, JSON.stringify(out, null, 1));
for (const [p, o] of Object.entries(out)) {
  console.log(`\n=== ${p} (${o.abre}/${o.fecha})`);
  for (const e of o.topo) console.log(`* ${e.cliente} | ${e.plataforma} | coef ${e.coef?.toFixed(1)} | ${e.texto.slice(0, 420)}`);
  for (const e of o.fraco ?? []) console.log(`  FRACO ${e.cliente} | ${e.plataforma} | coef ${e.coef?.toFixed(2)} | ${e.texto.slice(0, 300)}`);
}
