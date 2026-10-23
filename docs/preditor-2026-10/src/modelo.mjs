// Preditor 2026-10: regressão logística (L2, IRLS) em JS puro + validação temporal em janela móvel.
// Treina até o mês M-1, testa no mês M, para os 3 últimos meses maduros. Grava out/preditor/resultado.json
// e, com o modelo final (treino até o último mês maduro), modelo.json.
//   node src/preditor/modelo.mjs            (GAP=30, o oficial)
//   FEATS=data/preditor_features_gap7.json node src/preditor/modelo.mjs   (sensibilidade)
//   EMB=openai node src/preditor/modelo.mjs   (embedding da public.documents; só vídeos cujo roteiro tem documento)
//   SO_DOC=1 node src/preditor/modelo.mjs     (Gemini nos mesmos vídeos da rodada OpenAI, para comparar)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { DATA, OUT, wilson } from "../lib.mjs";
import { MODOS, ANCORAS, BASE, EMB, LIMIARES, PERCENTIS } from "./features.mjs";
import { HOOK } from "../hooks/feat.mjs";

const ARQ = process.env.FEATS ?? DATA + `preditor_features${EMB === "openai" ? "_openai" : ""}.json`;
const SO_DOC = EMB === "openai" || !!process.env.SO_DOC; // a documents parou em 14/09: setembro fica pela metade e outubro some
const SUF = EMB === "openai" ? "_openai" : process.env.SO_DOC ? "_gemini_cobertos" : "";
const { T_CLI: TC, T_OUT: TO } = LIMIARES, vg = (x) => x.toFixed(2).replace(".", ",");
const MESES_TESTE = ["2026-07", "2026-08", "2026-09"];
const LAMBDAS = [1, 10, 30, 100, 300, 1000, 3000]; // escolhido por mês: treina até M-2, mede par a par em M-1
const TODAS = JSON.parse(readFileSync(ARQ, "utf8")).filter((f) => !SO_DOC || f.tem_doc);
const F = TODAS.filter((f) => f.mes <= MESES_TESTE.at(-1));
const OUTUBRO = TODAS.filter((f) => f.mes === "2026-10"); // parcial: só os já maduros, fora do estudo de hooks

// ---------- features ----------
export const DEF = {
  knn20: "taxa de topo dos 20 roteiros anteriores mais parecidos da casa (qualquer cliente, sem limiar)",
  sim_media: "similaridade média dos 10 roteiros anteriores mais parecidos da casa",
  casa_taxa: `taxa de topo (encolhida para 26%, m=5) dos até 20 vizinhos acima do limiar: >= ${vg(TC)} no mesmo cliente, >= ${vg(TO)} em outro`,
  log_n_casa: "log(1 + nº de vizinhos acima do limiar na casa)",
  cli_taxa: `taxa de topo (encolhida, m=3) dos até 10 roteiros anteriores do próprio cliente com cosseno >= ${vg(TC)}`,
  log_n_cli: `log(1 + nº de roteiros anteriores do cliente com cosseno >= ${vg(TC)})`,
  rep_acerto: `1 se um roteiro anterior do cliente com cosseno >= ${vg(TC)} foi topo (pq médio >= 0,69)`,
  rep_acerto_90: "1 se esse acerto foi publicado 90 dias ou mais antes",
  rep_fraco: `1 se um roteiro anterior do cliente com cosseno >= ${vg(TC)} foi fraco (pq médio <= 0,30)`,
  fora_fraco: `1 se um roteiro anterior de OUTRO cliente com cosseno >= ${vg(TO)} foi fraco`,
  fora_acerto: `1 se um roteiro anterior de OUTRO cliente com cosseno >= ${vg(TO)} foi topo`,
  terr_c30: "taxa de topo histórica do território k=30 (encolhida, m=10)",
  terr_c60: "taxa de topo histórica do território k=60 (encolhida, m=10)",
  cli90: "taxa de topo do cliente na rede nos 90 dias anteriores ao corte (encolhida, m=10)",
  cli_tend: "taxa dos 45 dias mais recentes menos a dos 45 anteriores (cliente x rede)",
  hook_placar: "placar do hook do estudo de hooks (+1 por elemento bom, -1 por ruim)",
  ...Object.fromEntries(MODOS.map((m) => [`modo_${m}`, `1 se o modo do roteiro (vm_roteiro_modo) é ${m}`])),
  ...Object.fromEntries(ANCORAS.map((a) => [`ancora_${a}`, `1 se a âncora do roteiro é ${a}`])),
  ...Object.fromEntries(HOOK.map(([id, , desc]) => [`hk_${id}`, `hook (1º parágrafo do roteiro do CRM): ${desc}`])),
};
const valor = (f, k) => {
  if (k === "log_n_casa") return Math.log1p(f.n_casa);
  if (k === "log_n_cli") return Math.log1p(f.n_cli);
  if (k.startsWith("modo_")) return f.modo === k.slice(5) ? 1 : 0;
  if (k.startsWith("ancora_")) return f.ancora === k.slice(7) ? 1 : 0;
  if (k.startsWith("hk_")) return f.hk.includes(k.slice(3)) ? 1 : 0;
  return f[k];
};
const TEMA = ["knn20", "sim_media", "casa_taxa", "log_n_casa", "cli_taxa", "log_n_cli", "terr_c30", "terr_c60"];
const REP = ["rep_acerto", "rep_acerto_90", "rep_fraco", "fora_fraco", "fora_acerto"];
const CLI = ["cli90", "cli_tend"];
const FORMATO = [...MODOS.map((m) => `modo_${m}`), ...ANCORAS.map((a) => `ancora_${a}`)];
export const CONJUNTOS = {
  completo: [...TEMA, ...REP, ...CLI, ...FORMATO, "hook_placar"],
  sem_hook: [...TEMA, ...REP, ...CLI, ...FORMATO],
  tema_rep: [...TEMA, ...REP],
  tema_rep_hook: [...TEMA, ...REP, "hook_placar"],
  // sem o placar (escolhido olhando também jul-set): o catálogo inteiro de hooks, pesos aprendidos só no treino
  sem_hook_mais_catalogo: [...TEMA, ...REP, ...CLI, ...FORMATO, ...HOOK.map(([id]) => `hk_${id}`)],
  tema_mais_catalogo: [...TEMA, ...REP, ...HOOK.map(([id]) => `hk_${id}`)],
};

// ---------- regressão logística ----------
const sig = (z) => 1 / (1 + Math.exp(-z));
function resolver(A, b) { // Gauss com pivô parcial; A pequeno (≤ 30)
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j]; x[r] = s / M[r][r]; }
  return x;
}
export function treinar(linhas, feats, lambda = 1) {
  const media = feats.map((k) => linhas.reduce((s, f) => s + valor(f, k), 0) / linhas.length);
  const dp = feats.map((k, j) => Math.sqrt(linhas.reduce((s, f) => s + (valor(f, k) - media[j]) ** 2, 0) / linhas.length) || 1);
  const X = linhas.map((f) => [1, ...feats.map((k, j) => (valor(f, k) - media[j]) / dp[j])]);
  const Y = linhas.map((f) => f.y), d = feats.length + 1;
  let w = new Array(d).fill(0);
  for (let it = 0; it < 25; it++) {
    const H = Array.from({ length: d }, () => new Array(d).fill(0)), g = new Array(d).fill(0);
    for (let i = 0; i < X.length; i++) {
      const x = X[i], p = sig(x.reduce((s, v, j) => s + v * w[j], 0)), q = p * (1 - p);
      for (let a = 0; a < d; a++) { g[a] += (Y[i] - p) * x[a]; for (let b = a; b < d; b++) H[a][b] += q * x[a] * x[b]; }
    }
    for (let a = 1; a < d; a++) { g[a] -= lambda * w[a]; H[a][a] += lambda; }
    for (let a = 0; a < d; a++) for (let b = 0; b < a; b++) H[a][b] = H[b][a];
    const passo = resolver(H, g);
    w = w.map((v, j) => v + passo[j]);
    if (Math.max(...passo.map(Math.abs)) < 1e-8) break;
  }
  return { feats, media, dp, intercepto: w[0], pesos: w.slice(1) };
}
// parte do texto do preditor linear: numa sessão do Codex cliente, rede, mês e modo são os mesmos
// para todos os candidatos, então só esta parte muda a ordem entre eles
export const TEXTO = new Set([...TEMA, ...REP, ...HOOK.map(([id]) => `hk_${id}`)]);
export const parteTexto = (m, f) => m.feats.reduce((s, k, j) => s + (TEXTO.has(k) ? m.pesos[j] * (valor(f, k) - m.media[j]) / m.dp[j] : 0), 0);
export const prever = (m, f) => sig(m.intercepto + m.feats.reduce((s, k, j) => s + m.pesos[j] * (valor(f, k) - m.media[j]) / m.dp[j], 0));

// ---------- métricas ----------
// Acurácia par a par dentro de cliente x rede x mês: entre pares com desfechos diferentes, % em que o topo tem nota maior.
function pares(linhas, nota) {
  const G = new Map();
  for (const f of linhas) { const k = `${f.cliente_id}|${f.plataforma}|${f.mes}`; (G.get(k) ?? G.set(k, []).get(k)).push(f); }
  const grupos = [];
  for (const g of G.values()) {
    const pos = g.filter((f) => f.y === 1).map(nota), neg = g.filter((f) => f.y === 0).map(nota);
    if (!pos.length || !neg.length) continue;
    let c = 0; for (const a of pos) for (const b of neg) c += a > b ? 1 : a === b ? 0.5 : 0;
    grupos.push([c, pos.length * neg.length]);
  }
  const acc = (gs) => gs.reduce((s, g) => s + g[0], 0) / gs.reduce((s, g) => s + g[1], 0);
  // IC 95% por bootstrap de grupos (o par não é independente; o grupo é a unidade)
  let semente = 7; const rnd = () => ((semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648);
  const boot = [];
  for (let b = 0; b < 1000; b++) boot.push(acc(grupos.map(() => grupos[Math.floor(rnd() * grupos.length)])));
  boot.sort((a, b) => a - b);
  return { acc: acc(grupos), lo: boot[25], hi: boot[974], pares: grupos.reduce((s, g) => s + g[1], 0), grupos: grupos.length };
}
function auc(linhas, nota) {
  const s = linhas.map((f) => [nota(f), f.y]).sort((a, b) => a[0] - b[0]);
  let rank = 0, somaPos = 0, nPos = 0;
  for (let i = 0; i < s.length; ) { let j = i; while (j + 1 < s.length && s[j + 1][0] === s[i][0]) j++; const r = (i + j) / 2 + 1; for (let t = i; t <= j; t++) if (s[t][1]) { somaPos += r; nPos++; } i = j + 1; rank = j; }
  const nNeg = s.length - nPos;
  return (somaPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}
const brier = (linhas, p) => linhas.reduce((s, f) => s + (p(f) - f.y) ** 2, 0) / linhas.length;
const FAIXAS = [[0, 0.15], [0.15, 0.22], [0.22, 0.30], [0.30, 0.40], [0.40, 1.01]];
const calibracao = (linhas, p) => FAIXAS.map(([a, b]) => {
  const sel = linhas.filter((f) => p(f) >= a && p(f) < b), k = sel.reduce((s, f) => s + f.y, 0), [lo, hi] = wilson(k, sel.length);
  return { faixa: `${Math.round(a * 100)}-${Math.round(Math.min(b, 1) * 100)}%`, n: sel.length, previsto: sel.length ? sel.reduce((s, f) => s + p(f), 0) / sel.length : null, observado: sel.length ? k / sel.length : null, lo, hi };
});
const medir = (linhas, p) => ({ n: linhas.length, topo: linhas.reduce((s, f) => s + f.y, 0) / linhas.length, pares: pares(linhas, p), auc: auc(linhas, p), brier: brier(linhas, p) });

// self-check: nota perfeita dá 100% par a par; a logística recupera o sinal de um efeito sintético
{
  const fake = Array.from({ length: 400 }, (_, i) => ({ cliente_id: "c", plataforma: "p", mes: "m", y: i % 4 === 0 ? 1 : 0, x: (i % 4 === 0 ? 1 : 0) + ((i * 7919) % 13) / 13 }));
  console.assert(pares(fake, (f) => f.y).acc === 1, "par a par perfeito");
  const m = treinar(fake, ["x"], 1);
  console.assert(m.pesos[0] > 0 && auc(fake, (f) => prever(m, f)) > 0.8, "logística recupera o sinal");
}

// ---------- validação temporal ----------
function escolherLambda(tr, feats) {
  const ult = tr.reduce((m, f) => (f.mes > m ? f.mes : m), ""), a = tr.filter((f) => f.mes < ult), b = tr.filter((f) => f.mes === ult);
  let best = 1, bs = -1;
  for (const l of LAMBDAS) { const m = treinar(a, feats, l), s = pares(b, (f) => prever(m, f)).acc; if (s > bs) { bs = s; best = l; } }
  return best;
}
// ponytail: sem recalibração (Platt num mês só ficou instável e chegou a inverter a ordem); refazer na Task D com mais meses
const res = { arquivo: ARQ.split("/").pop(), lambdas: LAMBDAS, meses: MESES_TESTE, modelos: {}, baselines: {} };
const teste = F.filter((f) => MESES_TESTE.includes(f.mes));
const notas = {}, modelosMes = {}; // conjunto -> Map(video_id -> p) / mês -> modelo
for (const [nome, feats] of Object.entries(CONJUNTOS)) {
  const p = new Map(), porMes = {}; modelosMes[nome] = {};
  for (const M of MESES_TESTE) {
    const tr = F.filter((f) => f.mes < M), te = F.filter((f) => f.mes === M);
    const lambda = escolherLambda(tr, feats);
    const m = treinar(tr, feats, lambda); modelosMes[nome][M] = m;
    for (const f of te) p.set(f.video_id, prever(m, f));
    porMes[M] = { treino: tr.length, lambda, ...medir(te, (f) => p.get(f.video_id)) };
  }
  notas[nome] = p;
  res.modelos[nome] = { feats, porMes, juntos: medir(teste, (f) => p.get(f.video_id)), calibracao: calibracao(teste, (f) => p.get(f.video_id)) };
}
for (const [nome, k] of [["taxa recente do cliente (cli90)", "cli90"], ["só kNN da casa (knn20)", "knn20"], ["só kNN com limiar (casa_taxa)", "casa_taxa"], ["só território k=60", "terr_c60"], ["só placar do hook", "hook_placar"]]) {
  const p = (f) => f[k];
  res.baselines[nome] = { porMes: Object.fromEntries(MESES_TESTE.map((M) => [M, medir(teste.filter((f) => f.mes === M), p)])), juntos: medir(teste, p), calibracao: k === "hook_placar" ? null : calibracao(teste, p) };
}

// ---------- modelo final: treino em tudo até o último mês maduro ----------
const ESCOLHIDO = process.env.CONJUNTO ?? "sem_hook_mais_catalogo"; // o melhor com validação limpa (ver RELATORIO)
const lambdaFinal = escolherLambda(F, CONJUNTOS[ESCOLHIDO]);
const final = treinar(F, CONJUNTOS[ESCOLHIDO], lambdaFinal);
// checagem extra fora da amostra: outubro parcial (vídeos já maduros), que o estudo de hooks não viu
res.outubro = OUTUBRO.length < 100 ? { aviso: `só ${OUTUBRO.length} vídeos de outubro com embedding` } : Object.fromEntries(Object.entries(CONJUNTOS).map(([n, fs]) => { const m = treinar(F, fs, escolherLambda(F, fs)); return [n, medir(OUTUBRO, (f) => prever(m, f))]; }));
res.final = { conjunto: ESCOLHIDO, n: F.length, lambda: lambdaFinal, pesos: final.feats.map((k, j) => ({ feature: k, por_dp: final.pesos[j], or_por_dp: Math.exp(final.pesos[j]), media: final.media[j], dp: final.dp[j] })).sort((a, b) => Math.abs(b.por_dp) - Math.abs(a.por_dp)) };

// ordenar candidatos de uma sessão: a parte do texto do v0 (cada mês com o modelo treinado até M-1)
{
  const pt = new Map(); for (const M of MESES_TESTE) for (const f of teste.filter((f) => f.mes === M)) pt.set(f.video_id, parteTexto(modelosMes[ESCOLHIDO][M], f));
  res.so_texto = { definicao: "nota = só a parte de tema + repetição + catálogo de hook do preditor linear do v0 (sem cliente, tendência, modo e âncora)", porMes: Object.fromEntries(MESES_TESTE.map((M) => [M, medir(teste.filter((f) => f.mes === M), (f) => pt.get(f.video_id))])), juntos: medir(teste, (f) => pt.get(f.video_id)) };
}
res.embedding = { emb: EMB, so_roteiros_com_documento: SO_DOC, limiares: LIMIARES, percentis: PERCENTIS, n_teste_por_mes: Object.fromEntries(MESES_TESTE.map((M) => [M, teste.filter((f) => f.mes === M).length])) };
res.porRede = Object.fromEntries(["Instagram", "TikTok", "YouTube"].map((pl) => [pl, medir(teste.filter((f) => f.plataforma === pl), (f) => notas[ESCOLHIDO].get(f.video_id))]));
// exemplos: maiores e menores notas no teste (um por roteiro), com o modelo escolhido
const pEsc = notas[ESCOLHIDO], vistos = new Set();
const ordenado = [...teste].sort((a, b) => pEsc.get(b.video_id) - pEsc.get(a.video_id));
const pega = (lista) => { const out = []; for (const f of lista) { if (vistos.has(f.script_id)) continue; vistos.add(f.script_id); out.push({ p: pEsc.get(f.video_id), cliente: f.cliente, plataforma: f.plataforma, data: f.data, titulo: f.titulo, hook: f.hook?.slice(0, 160), topo: f.y, pq: f.pq, coef: f.coef, link: f.link }); if (out.length === 5) break; } return out; };
res.exemplos = { altos: pega(ordenado), baixos: pega([...ordenado].reverse()) };

mkdirSync(OUT + "preditor", { recursive: true });
writeFileSync(OUT + `preditor/resultado${process.env.FEATS ? "_" + res.arquivo.replace(".json", "") : SUF}.json`, JSON.stringify(res, null, 1));
if (!process.env.FEATS && !process.env.SO_DOC) writeFileSync(OUT + `preditor/modelo${SUF}.json`, JSON.stringify({
  versao: `preditor-v0-2026-10${SUF}`,
  desfecho: "probabilidade de o vídeo cair no quartil de cima do coeficiente viral no estrato cliente x rede x trimestre (régua de docs/estudo-2026-10/src/lib.mjs, base 26%)",
  treino: { ate_mes: MESES_TESTE.at(-1), desde: "2026-02", n: F.length, lambda: lambdaFinal, regra_vazamento: "vizinho só conta se publicado >= 30 dias antes do vídeo-alvo" },
  embedding: EMB === "openai"
    ? "OpenAI text-embedding-3-small (1536), o da public.documents e do embed() de lib/pipeline/context.ts; roteiro do corpus = média renormalizada dos vetores dos vídeos dele; cosseno"
    : "gemini-embedding-001 do CRM (script_embeddings), 768 primeiras dimensões renormalizadas; cosseno",
  ...(EMB === "openai" ? { como_calibrou: "mesmo_cliente = p97 do cosseno entre roteiros do mesmo cliente; outro_cliente = p99,5 entre clientes (o critério do estudo de embeddings, que deu 0,80/0,76 no Gemini)", percentis: PERCENTIS, texto_do_corpus: "Título + Assunto + roteiro (public.documents.content)" } : {}),
  limiares: { mesmo_cliente: TC, outro_cliente: TO, topo_pq: 0.69, fraco_pq: 0.30, k_casa: 20, k_cliente: 10, k_sim: 10, gap_dias: 30, base: BASE },
  formula: "p = 1 / (1 + exp(-(intercepto + soma(peso_i * (x_i - media_i) / dp_i))))",
  aviso_calibracao: "calibrado entre 15% e 40% (92% dos vídeos); acima de 40% superestima (previsto 47%, observado 33% em jul-set). Mostrar no máximo '40% ou mais'.",
  intercepto: final.intercepto,
  parte_texto: "para ordenar candidatos da mesma sessão basta somar peso*(x-media)/dp das features de tema, repetição e hk_* (as de cliente, modo e âncora são constantes na sessão)",
  features: final.feats.map((k, j) => ({ nome: k, texto: TEXTO.has(k), definicao: DEF[k], media: final.media[j], dp: final.dp[j], peso: final.pesos[j] })),
}, null, 1));

// ---------- resumo no terminal ----------
const pc = (x) => (x == null ? "-" : (x * 100).toFixed(2) + "%"), f3 = (x) => x.toFixed(3);
const linha = (nome, r) => `${nome.padEnd(34)} par a par ${pc(r.pares.acc)} [${pc(r.pares.lo)}-${pc(r.pares.hi)}] (${r.pares.pares} pares, ${r.pares.grupos} grupos) | AUC ${f3(r.auc)} | Brier ${f3(r.brier)} | n ${r.n}`;
console.log(`arquivo ${res.arquivo} | teste ${teste.length} vídeos, topo ${pc(teste.reduce((s, f) => s + f.y, 0) / teste.length)}`);
for (const [n, r] of Object.entries(res.modelos)) { console.log(linha(n, r.juntos)); for (const M of MESES_TESTE) console.log("   " + linha(M, r.porMes[M])); }
for (const [n, r] of Object.entries(res.baselines)) console.log(linha(n, r.juntos));
console.log(linha("SÓ A PARTE DO TEXTO do " + ESCOLHIDO, res.so_texto.juntos)); for (const M of MESES_TESTE) console.log("   " + linha(M, res.so_texto.porMes[M]));
if (!res.outubro.aviso) for (const [n, r] of Object.entries(res.outubro)) console.log(linha("outubro " + n, r));
console.log("calibração", ESCOLHIDO, res.modelos[ESCOLHIDO].calibracao.map((c) => `${c.faixa}: n=${c.n} prev ${pc(c.previsto)} obs ${pc(c.observado)}`).join(" | "));
console.log("pesos (por DP):", res.final.pesos.map((p) => `${p.feature} ${p.por_dp.toFixed(3)}`).join(", "));
