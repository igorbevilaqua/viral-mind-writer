// 3. REGRAS DE ESTILO do guia e do checklist, testadas contra o dado (texto falado: hook até a conclusão).
import { salvar, exemplos, palavras } from "./h.mjs";
import { f } from "./feat.mjs";
import { multi, CABM } from "./multi.mjs";
import { trecho } from "./fundo.mjs";
import { paras } from "./h.mjs";

const maxp = (r) => Math.max(...paras(r).map(palavras));
export const REGRAS = [
  ["antítese 'não é X, é Y': nenhuma", (r) => f(r).antitese === 0],
  ["antítese: 1", (r) => f(r).antitese === 1],
  ["antítese: 2+", (r) => f(r).antitese >= 2],
  ["pergunta elíptica ('O resultado?'): 1+", (r) => f(r).elipticas >= 1],
  ["pergunta curta (<=4 palavras): 1+", (r) => f(r).curtasQ >= 1],
  ["perguntas no texto: 0", (r) => f(r).perguntas === 0],
  ["perguntas no texto: 1", (r) => f(r).perguntas === 1],
  ["perguntas no texto: 2+", (r) => f(r).perguntas >= 2],
  ["perguntas no texto: 3+", (r) => f(r).perguntas >= 3],
  ["tricolon 'X, Y e Z.' fechando parágrafo: 0", (r) => f(r).tricolon === 0],
  ["tricolon: 1", (r) => f(r).tricolon === 1],
  ["tricolon: 2+", (r) => f(r).tricolon >= 2],
  ["frases seguidas começando com 'E': 1+", (r) => f(r).e_seguidas >= 1],
  ["parágrafos do corpo abrindo com 'E' >=15%", (r) => f(r).frac_para_e >= 0.15],
  ["metáfora de LLM (jornada, mergulho...)", (r) => f(r).metafora_llm >= 1],
  ["corrida de frases longas (>=12) <=3", (r) => f(r).max_run_longas <= 3],
  ["corrida de frases longas 4-6", (r) => f(r).max_run_longas >= 4 && f(r).max_run_longas <= 6],
  ["corrida de frases longas 7-9", (r) => f(r).max_run_longas >= 7 && f(r).max_run_longas <= 9],
  ["corrida de frases longas 10+", (r) => f(r).max_run_longas >= 10],
  ["todo parágrafo <=35 palavras", (r) => maxp(r) <= 35],
  ["algum parágrafo >45 palavras", (r) => maxp(r) > 45],
];

if (process.argv[1]?.endsWith("estilo.mjs")) {
  const out = {};
  console.log(CABM);
  for (const [n, p] of REGRAS) { const m = multi(n, p); console.log(m.txt); out[n] = m.json; }
  // exemplos para as construções (topo e fundo)
  const sa = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const falado = (r) => [r.g.hook, r.g.subhook, r.g.corpo, r.g.conclusao].join("\n");
  const ex = {
    antitese: [(r) => f(r).antitese >= 1, /\bnao (e|sao|foi|era|esta|estao)\b [^.!?]{1,60}[,.;:]\s*(e sim |mas sim |mas |e )?(e|sao|foi|era|esta|estao)\b/],
    eliptica: [(r) => f(r).elipticas >= 1, /^(e )?((o|a|os|as) )?[a-z]+( [a-z]+)?\?$/],
    tricolon: [(r) => f(r).tricolon >= 1, null],
  };
  out.exemplos = {};
  for (const [k, [p, re]] of Object.entries(ex)) {
    const top = exemplos(p, (r) => trecho(falado(r), re), { n: 3 });
    const pior = exemplos(p, (r) => trecho(falado(r), re), { n: 2, pior: true });
    out.exemplos[k] = { top, pior };
    console.log(`\n${k}:`); for (const e of top) console.log(`  + ${e.cliente} | ${e.plataforma} | ${e.coef.toFixed(2)} | ${e.texto}`); for (const e of pior) console.log(`  - ${e.cliente} | ${e.plataforma} | ${e.coef.toFixed(2)} | ${e.texto}`);
  }
  salvar("estilo.json", out);
}
