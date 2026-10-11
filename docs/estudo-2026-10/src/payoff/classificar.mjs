// Classifica payoff e campos de estrutura dos 2.809 roteiros com Claude (Sonnet 5.5).
// uso: node --env-file=".../.env.local" src/payoff/classificar.mjs <rodada> [--n 40] [--modo low|off] [--lote 18] [--conc 5] [--ids arquivo.json]
//   rodada: nome livre; grava out/payoff/rot_<rodada>.jsonl (retomável) e soma o custo em out/payoff/custo.json
//   modo low: pensamento adaptativo em esforço baixo; off: sem pensamento (between_tools)
// Ao terminar uma rodada que cobre todos os roteiros, escreve data/rotulos_llm.json.
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, appendFileSync, existsSync, writeFileSync } from "node:fs";
import { ler, DATA, OUT } from "../lib.mjs";
import { SYSTEM, SCHEMA, ENUMS } from "./taxonomia.mjs";

const args = process.argv.slice(2);
const rodada = args[0];
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const N = Number(opt("n", 0)), MODO = opt("modo", "low"), LOTE = Number(opt("lote", 18)), CONC = Number(opt("conc", 5));
const MODELO = "claude-sonnet-5-5";
const PRECO = { in: 2, cw: 2.5, cr: 0.2, out: 10 }; // US$ por milhão (Sonnet 5.5: entrada, escrita de cache 5 min, leitura de cache, saída)
const TETO = 9.5; // ponytail: teto duro do estudo é US$ 10; paramos antes com folga
if (!rodada) throw new Error("informe a rodada");

const ARQ = `${OUT}payoff/rot_${rodada}.jsonl`, CUSTO = `${OUT}payoff/custo.json`;

// ---------- entrada ----------
const scripts = ler("scripts.json"), seg = new Map(ler("segmentos.json").map((s) => [s.script_id, s]));
const assunto = new Map();
for (const v of ler("videos.json")) if (v.assunto && !assunto.has(v.script_id)) assunto.set(v.script_id, v.assunto);
const corta = (t, n) => { t = (t ?? "").replace(/\s+/g, " ").trim(); if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, c.lastIndexOf(" ") > n * 0.7 ? c.lastIndexOf(" ") : n) + "…"; };
const bloco = (s, i) => {
  const g = seg.get(s.script_id) ?? {};
  return `[${i}]\nT: ${corta(s.titulo, 120)}\nH: ${corta(g.hook, 320)}\nS: ${corta(g.subhook, 320)}\nC2: ${corta(g.conclusao2, 300)}\nC: ${corta(g.conclusao, 380)}\nA: ${corta(assunto.get(s.script_id), 260) || "(sem resumo)"}`;
};

// ordem fixa e embaralhada (clientes misturados em cada lote)
let semente = 20261007; const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
let fila = scripts.map((s) => [rnd(), s]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const idsArq = opt("ids", null);
if (idsArq) { const want = new Set(JSON.parse(readFileSync(idsArq, "utf8"))); fila = fila.filter((s) => want.has(s.script_id)); }
if (N) fila = fila.slice(0, N);
const feitos = new Set(existsSync(ARQ) ? readFileSync(ARQ, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).script_id) : []);
const pendentes = fila.filter((s) => !feitos.has(s.script_id));
console.log(`rodada ${rodada}: ${fila.length} roteiros, ${feitos.size} já feitos, ${pendentes.length} pendentes, modo ${MODO}`);

// ---------- custo ----------
const custos = existsSync(CUSTO) ? JSON.parse(readFileSync(CUSTO, "utf8")) : { modelo: MODELO, precos_usd_por_milhao: PRECO, rodadas: {} };
const meu = (custos.rodadas[rodada] ??= { modo: MODO, chamadas: 0, input_tokens: 0, cache_write_tokens: 0, cache_read_tokens: 0, output_tokens: 0, recusas: 0, fallbacks: 0, custo_usd: 0 });
const custoDe = (u) => (u.input_tokens * PRECO.in + u.cache_write_tokens * PRECO.cw + u.cache_read_tokens * PRECO.cr + u.output_tokens * PRECO.out) / 1e6;
const totalUsd = () => Object.values(custos.rodadas).reduce((s, r) => s + r.custo_usd, 0);
const salvarCusto = () => { custos.total_usd = +totalUsd().toFixed(4); writeFileSync(CUSTO, JSON.stringify(custos, null, 2)); };

// ---------- chamada ----------
const client = new Anthropic({ maxRetries: 6 }); // o SDK já espera e repete 429/5xx/conexão com backoff
const valido = (it) => it && ENUMS.payoff.includes(it.payoff) && (it.payoff2 === null || ENUMS.payoff.includes(it.payoff2))
  && ["promessa_hook", "funcao_subhook", "tipo_conclusao", "protagonista", "antagonista", "recorte"].every((k) => ENUMS[k].includes(it[k])) && typeof it.utilidade_pratica === "boolean";

async function chamar(lote) {
  const resp = await client.beta.messages.create({
    model: MODELO,
    max_tokens: 12000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // recusa por cyber/frontier_llm é refeita no servidor; as outras categorias voltam como refusal
    ...(MODO === "off" ? { thinking: { type: "between_tools" } } : {}),
    output_config: { effort: MODO === "off" ? "high" : "low", format: { type: "json_schema", schema: SCHEMA } },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: `Classifique os ${lote.length} roteiros abaixo.\n\n${lote.map((s, i) => bloco(s, i + 1)).join("\n\n")}` }],
  });
  const u = resp.usage;
  meu.chamadas++;
  meu.input_tokens += u.input_tokens ?? 0; meu.cache_write_tokens += u.cache_creation_input_tokens ?? 0;
  meu.cache_read_tokens += u.cache_read_input_tokens ?? 0; meu.output_tokens += u.output_tokens ?? 0;
  if ((u.iterations ?? []).some((e) => e.type === "fallback_message")) meu.fallbacks++;
  meu.custo_usd = +custoDe(meu).toFixed(4);
  salvarCusto();
  return resp;
}

let falhas = 0;
async function processar(lote, tentativa = 0) {
  if (totalUsd() >= TETO) throw new Error(`teto de US$ ${TETO} atingido`);
  let resp;
  try { resp = await chamar(lote); }
  catch (e) {
    if (e instanceof Anthropic.BadRequestError || e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw e; // erro de parâmetro: parar tudo
    if (tentativa < 3) { await new Promise((r) => setTimeout(r, 15000 * (tentativa + 1))); return processar(lote, tentativa + 1); }
    falhas += lote.length; console.error("lote abandonado:", e.message); return;
  }
  if (resp.stop_reason === "refusal") {
    meu.recusas++; salvarCusto();
    console.error(`recusa (${resp.stop_details?.category ?? "?"}) num lote de ${lote.length}`);
    if (lote.length > 1) { const m = Math.ceil(lote.length / 2); await processar(lote.slice(0, m)); await processar(lote.slice(m)); }
    else { appendFileSync(ARQ, JSON.stringify({ script_id: lote[0].script_id, recusa: true }) + "\n"); }
    return;
  }
  let itens = [];
  try { itens = JSON.parse(resp.content.find((b) => b.type === "text")?.text ?? "{}").itens ?? []; } catch { /* trata abaixo como faltante */ }
  const porI = new Map(itens.map((it) => [it.i, it]));
  const faltam = [];
  lote.forEach((s, k) => {
    const it = porI.get(k + 1);
    if (it && it.payoff2 === it.payoff) it.payoff2 = null;
    if (!valido(it)) return faltam.push(s);
    const { i, ...campos } = it;
    appendFileSync(ARQ, JSON.stringify({ script_id: s.script_id, ...campos }) + "\n");
  });
  if (faltam.length) {
    console.error(`${faltam.length} itens inválidos/faltando (stop=${resp.stop_reason}); repetindo`);
    if (tentativa < 3) return processar(faltam, tentativa + 1);
    falhas += faltam.length;
  }
}

const lotes = [];
for (let i = 0; i < pendentes.length; i += LOTE) lotes.push(pendentes.slice(i, i + LOTE));
const t0 = Date.now();
if (lotes.length) await processar(lotes.shift()); // primeiro sozinho: escreve o cache do system prompt
let feitosLotes = 1;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (lotes.length) { await processar(lotes.shift()); if (++feitosLotes % 10 === 0) console.log(`  ${feitosLotes} lotes, US$ ${totalUsd().toFixed(3)}, ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
}));
console.log(`fim: ${meu.chamadas} chamadas, rodada US$ ${meu.custo_usd.toFixed(4)}, total do estudo US$ ${totalUsd().toFixed(4)}, falhas ${falhas}`);
console.log(`tokens: in ${meu.input_tokens}, cache_w ${meu.cache_write_tokens}, cache_r ${meu.cache_read_tokens}, out ${meu.output_tokens}`);

// ---------- montagem do arquivo comum ----------
const linhas = readFileSync(ARQ, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const ultimo = new Map(linhas.map((l) => [l.script_id, l]));
if (ultimo.size >= scripts.length) {
  const out = scripts.map((s) => ({ script_id: s.script_id, ...(ultimo.get(s.script_id) ?? { recusa: true }) }));
  writeFileSync(`${DATA}rotulos_llm.json`, JSON.stringify(out));
  console.log(`data/rotulos_llm.json escrito: ${out.length} roteiros (${out.filter((r) => r.recusa).length} recusados)`);
}
