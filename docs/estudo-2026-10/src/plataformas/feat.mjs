// Características concretas do roteiro (texto escrito, rótulos LLM, território) e do vídeo (duração, fim falado).
// Cada característica: [id, grupo, descrição, (r) => bool]. r = linha de carregar().
import { readFileSync, existsSync } from "node:fs";
import { carregar, norm, OUT } from "../lib.mjs";

export const P3 = ["Instagram", "TikTok", "YouTube"];
export const SIGLA = { Instagram: "IG", TikTok: "TT", YouTube: "YT", Facebook: "FB" };

// Fim da transcrição de cada vídeo (lido pelo subagente de comando). Fallback: comando_video.
const ARQ_FIM = OUT + "comando/transcricao_fim.json";
const FIM = existsSync(ARQ_FIM) ? JSON.parse(readFileSync(ARQ_FIM, "utf8")) : {};
const memoFim = new Map();
export const fim = (r) => {
  let v = memoFim.get(r.video_id);
  if (v == null) { v = norm((FIM[r.video_id] ?? r.comando_video ?? "").slice(-400)); memoFim.set(r.video_id, v); }
  return v;
};

// ponytail: listas copiadas de src/hooks/feat.mjs (cortadas), para não depender de arquivo de outro subagente.
const BIGTECH = "apple|iphone|google|amazon|microsoft|facebook|instagram|whatsapp|meta|nvidia|openai|chatgpt|samsung|tesla|spacex|netflix|youtube|tiktok|intel|sony|uber|spotify";
const MARCA_CHINA = "byd|shein|shopee|temu|aliexpress|alibaba|huawei|xiaomi|geely|great wall|gwm|chery|deepseek|tencent|bytedance";
const MARCA_CONSUMO = "coca cola|pepsi|mcdonald s|mcdonalds|burger king|nike|adidas|disney|starbucks|nestle|red bull|heineken|ambev|zara|ferrari|porsche|bmw|mercedes|volkswagen|ford|chevrolet|fiat|toyota|honda|lamborghini|rolex|louis vuitton|gucci|chanel|lego|ikea|walmart|carrefour|kfc|havaianas|boticario|natura|cacau show|nokia|nintendo|playstation|barbie";
const MARCA_BR = "petrobras|itau|bradesco|nubank|santander|magalu|magazine luiza|casas bahia|havan|globo|mercado livre|ifood|embraer|jbs|renner|americanas|correios|pix";
const FIGURA = "elon musk|musk|trump|lula|bolsonaro|neymar|messi|cristiano ronaldo|zuckerberg|bezos|bill gates|jensen huang|sam altman|steve jobs|warren buffett|silvio santos|xi jinping|putin|milei|biden|anitta|luciano hang|abilio diniz|lemann|eike batista|mrbeast|mr beast|jack ma";
const RX_MEGA = new RegExp(`\\b(${[BIGTECH, MARCA_CHINA, MARCA_CONSUMO, MARCA_BR, FIGURA].join("|")})\\b`);
const RX_MOEDA = /r\$|us\$|\breais\b|\bdolar(es)?\b|\beuros?\b/;
const RX_DINHEIRO = /r\$|us\$|\breais\b|\bdolar(es)?\b|\beuros?\b|\bmilh(ao|oes)\b|\bbilh(ao|oes)\b|\btrilh(ao|oes)\b/;
const NAO_PROPRIO = new Set(["Eu", "Você", "Voce", "Vocês", "O", "A", "Os", "As", "E", "Mas", "Só", "Se", "Isso", "Esse", "Essa", "Um", "Uma", "Ele", "Ela", "Eles", "Elas", "Hoje", "Agora", "Não", "Sim", "É", "Em", "No", "Na", "De", "Do", "Da"]);
// Nome próprio no meio da frase (palavra com maiúscula que não abre frase) ou mega-marca/figura em qualquer posição.
export function temNomeProprio(t) {
  for (const fr of (t ?? "").split(/(?<=[.!?…:])\s+/)) {
    const w = fr.split(/\s+/).map((x) => x.replace(/^["“'(]+|[.,;:!?…"”')]+$/g, ""));
    for (let i = 1; i < w.length; i++) if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(w[i]) && !NAO_PROPRIO.has(w[i])) return true;
  }
  return RX_MEGA.test(norm(t));
}

const H = (r) => norm(r.g?.hook);
const pal = (r) => r.g?.palavras_total ?? 0;
const ph = (r) => r.g?.palavras_hook ?? 0;
const dur = (r) => r.duracao;

export const FEATS = [
  // tamanho
  ["rot_lt300", "tamanho", "roteiro < 300 palavras", (r) => pal(r) < 300],
  ["rot_300_449", "tamanho", "roteiro 300 a 449 palavras", (r) => pal(r) >= 300 && pal(r) < 450],
  ["rot_ge450", "tamanho", "roteiro >= 450 palavras", (r) => pal(r) >= 450],
  ["rot_ge550", "tamanho", "roteiro >= 550 palavras", (r) => pal(r) >= 550],
  ["hook_le15", "tamanho", "hook <= 15 palavras", (r) => ph(r) <= 15],
  ["hook_ge30", "tamanho", "hook >= 30 palavras", (r) => ph(r) >= 30],
  // duração do vídeo (o mesmo arquivo vai para as 3 redes; nos pares a duração é a mesma)
  ["dur_lt90", "duracao", "vídeo < 90 s", (r) => dur(r) != null && dur(r) < 90],
  ["dur_90_119", "duracao", "vídeo 90 a 119 s", (r) => dur(r) >= 90 && dur(r) < 120],
  ["dur_120_149", "duracao", "vídeo 120 a 149 s", (r) => dur(r) >= 120 && dur(r) < 150],
  ["dur_ge150", "duracao", "vídeo >= 150 s", (r) => dur(r) >= 150],
  // hook concreto
  ["hook_numero", "hook", "hook com número (dígito)", (r) => /\d/.test(r.g?.hook ?? "")],
  ["hook_dinheiro", "hook", "hook com dinheiro ou cifra (R$, reais, dólares, milhões, bilhões)", (r) => RX_DINHEIRO.test(H(r))],
  ["hook_moeda", "hook", "hook com moeda (R$, reais, dólares, euros)", (r) => RX_MOEDA.test(H(r))],
  ["hook_cifra_sem_moeda", "hook", "hook com milhões/bilhões sem moeda (pessoas, unidades)", (r) => /\bmilh(ao|oes)\b|\bbilh(ao|oes)\b|\btrilh(ao|oes)\b/.test(H(r)) && !RX_MOEDA.test(H(r))],
  ["hook_nome", "hook", "hook com nome próprio", (r) => temNomeProprio(r.g?.hook)],
  ["hook_mega", "hook", "hook com mega-marca ou figura (Apple, BYD, Coca-Cola, Musk, Trump...)", (r) => RX_MEGA.test(H(r))],
  ["hook_voce", "hook", "hook com 'você'", (r) => /\b(voce|voces)\b/.test(H(r))],
  ["hook_pergunta", "hook", "hook com pergunta (?)", (r) => /\?/.test(r.g?.hook ?? "")],
  ["hook_china", "hook", "hook cita China/chinês", (r) => /\bchin(a|es|esa|eses|esas)\b/.test(H(r))],
  ["hook_brasil", "hook", "hook cita Brasil/brasileiro", (r) => /\bbrasil/.test(H(r))],
  ["hook_eua", "hook", "hook cita EUA/americano/Trump", (r) => /\beua\b|estados unidos|\bamerican(o|a|os|as)\b|\btrump\b/.test(H(r))],
  // produção
  ["modelagem", "producao", "roteiro modelado (fontes citam Modelagem)", (r) => !!r.s?.modelagem],
  ["eusou_escrito", "fim", "'Eu sou' escrito no bloco final", (r) => !!r.g?.apresentacao],
  ["eusou_falado", "fim", "'Eu sou'/'meu nome é' falado no fim do vídeo", (r) => /\b(eu sou|meu nome e)\b/.test(fim(r))],
  ["cta_segue", "fim", "comando falado pede para seguir", (r) => /\b(me segue|segue (o|a|meu|minha|ai|aqui|esse|essa)|me siga|siga (o|a|meu)|ja segue|seguir (o|meu)|me seguir)\b/.test(fim(r))],
  ["cta_comenta", "fim", "comando falado pede comentário", (r) => /\bcoment(a|e|ar)\b/.test(fim(r))],
  ["cta_compart", "fim", "comando falado pede compartilhar/mandar para alguém", (r) => /\b(compartilha|compartilhe)\b(?! com voce)|\b(manda|envia|mande|envie) (esse|este|o) (video|conteudo)|\b(manda|envia|mande|envie) (pra|para|pro) (alguem|quem|aquele|aquela|um amigo|uma amiga|os amigos|a pessoa)|\bmarca (alguem|um amigo|uma amiga|aquele|aquela|quem)/.test(fim(r))],
  ["cta_nenhum", "fim", "fim falado sem pedido (sem segue/comenta/compartilha/salva/inscreve)", (r) => !/\b(segue|siga|seguir|coment(a|e|ar)|compartilh|salv(a|e)|inscrev)/.test(fim(r))],
];

// Rótulos LLM e território (uma característica por valor)
const VALORES = {
  payoff: ["bastidor", "futuro", "alerta", "sacada", "superacao", "inspiracao", "vantagem", "queda", "virada", "orgulho", "curiosidade", "revolta", "disputa", "nostalgia"],
  promessa_hook: ["porque_como", "novidade", "alerta", "tese", "desfecho", "quem_qual", "numero", "comparacao", "ensinar"],
  funcao_subhook: ["contexto_personagem", "explica", "volta_tempo", "eleva_aposta", "contradiz", "puxa_espectador"],
  tipo_conclusao: ["licao", "sintese", "consequencia", "pergunta", "virada_final", "futuro", "instrucao", "sem_fechamento"],
  protagonista: ["empresa", "famoso", "tecnologia", "anonimo", "pais", "grupo", "espectador"],
  antagonista: ["nenhum", "problema", "sistema", "rival", "governo", "gigante"],
  recorte: ["brasil", "estrangeiro", "brasil_x_estrangeiro"],
};
for (const [campo, vs] of Object.entries(VALORES)) for (const v of vs) FEATS.push([`${campo}=${v}`, campo, `${campo} = ${v}`, (r) => r.llm?.[campo] === v]);
FEATS.push(["payoff_qualquer=orgulho", "payoff", "payoff ou payoff2 = orgulho", (r) => r.llm?.payoff === "orgulho" || r.llm?.payoff2 === "orgulho"]);
FEATS.push(["payoff_qualquer=revolta", "payoff", "payoff ou payoff2 = revolta", (r) => r.llm?.payoff === "revolta" || r.llm?.payoff2 === "revolta"]);
FEATS.push(["payoff_qualquer=curiosidade", "payoff", "payoff ou payoff2 = curiosidade", (r) => r.llm?.payoff === "curiosidade" || r.llm?.payoff2 === "curiosidade"]);
FEATS.push(["utilidade_pratica", "utilidade", "utilidade prática = sim", (r) => r.llm?.utilidade_pratica === true]);
export const TERRITORIOS = [...new Set(carregar().map((r) => r.cluster?.nome30).filter(Boolean))].sort();
for (const t of TERRITORIOS) FEATS.push([`terr=${t}`, "territorio", `território: ${t}`, (r) => r.cluster?.nome30 === t]);

// ---------- estatística pareada ----------
// PRNG com semente (bootstrap reprodutível)
export function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Pares do mesmo roteiro em duas redes: { script_id, cliente, periodo, d = pqA - pqB, a, b }
export function pares(A, B, linhas = carregar()) {
  const por = new Map();
  for (const r of linhas) if (r.plataforma === A || r.plataforma === B) (por.get(r.script_id) ?? por.set(r.script_id, {}).get(r.script_id))[r.plataforma] = r;
  const out = [];
  for (const [sid, o] of por) if (o[A] && o[B]) out.push({ script_id: sid, cliente: o[A].cliente, periodo: o[A].periodo, d: o[A].pq - o[B].pq, a: o[A], b: o[B] });
  return out;
}

// Diferença de médias de d (com vs sem), bruta e dentro do cliente (ponderada por n1*n0/(n1+n0)).
// Bootstrap estratificado por cliente: reamostra roteiros dentro de cada cliente (nboot vezes).
// f: Uint8Array (1 = tem a característica), d: Float64Array, cli: Int32Array (índice do cliente).
function deltas(f, d, cli, nc, w) {
  const s1 = new Float64Array(nc), s0 = new Float64Array(nc), n1 = new Float64Array(nc), n0 = new Float64Array(nc);
  let S1 = 0, S0 = 0, N1 = 0, N0 = 0;
  for (let i = 0; i < d.length; i++) {
    const k = w ? w[i] : 1;
    if (!k) continue;
    const c = cli[i];
    if (f[i]) { s1[c] += k * d[i]; n1[c] += k; S1 += k * d[i]; N1 += k; } else { s0[c] += k * d[i]; n0[c] += k; S0 += k * d[i]; N0 += k; }
  }
  let num = 0, den = 0;
  for (let c = 0; c < nc; c++) if (n1[c] && n0[c]) { const wc = (n1[c] * n0[c]) / (n1[c] + n0[c]); num += wc * (s1[c] / n1[c] - s0[c] / n0[c]); den += wc; }
  return { raw: N1 && N0 ? S1 / N1 - S0 / N0 : NaN, cli: den ? num / den : NaN, porCli: [s1, s0, n1, n0] };
}

export function pareado(prs, feats, { nboot = 2000, seed = 7, minCli = 3 } = {}) {
  const clientes = [...new Set(prs.map((p) => p.cliente))];
  const ci = new Map(clientes.map((c, i) => [c, i]));
  const nc = clientes.length, N = prs.length;
  const d = Float64Array.from(prs.map((p) => p.d));
  const cli = Int32Array.from(prs.map((p) => ci.get(p.cliente)));
  const desc = Uint8Array.from(prs.map((p) => p.periodo === "descoberta"));
  const idxCli = clientes.map(() => []);
  prs.forEach((p, i) => idxCli[cli[i]].push(i));
  // pesos de bootstrap: contagem de vezes que cada roteiro foi sorteado, dentro do cliente
  const rnd = mulberry32(seed);
  const W = [];
  for (let b = 0; b < nboot; b++) {
    const w = new Uint16Array(N);
    for (const ids of idxCli) for (let k = 0; k < ids.length; k++) w[ids[Math.floor(rnd() * ids.length)]]++;
    W.push(w);
  }
  const wD = Uint16Array.from(desc), wV = Uint16Array.from(desc, (x) => 1 - x);
  const res = [];
  for (const [id, grupo, nome, pred] of feats) {
    const f = Uint8Array.from(prs.map((p) => (pred(p.a) && pred(p.b) ? 1 : pred(p.a) || pred(p.b) ? 2 : 0)));
    // característica de roteiro: vale se está nos dois vídeos; mista (2) = só um lado (raro: CTA/duração diferentes) -> fica fora
    const keep = Uint16Array.from(f, (x) => (x === 2 ? 0 : 1));
    const fb = Uint8Array.from(f, (x) => (x === 1 ? 1 : 0));
    const n1 = fb.reduce((s, x, i) => s + (keep[i] ? x : 0), 0), n0 = keep.reduce((s, x) => s + x, 0) - n1;
    if (n1 < 20 || n0 < 20) continue;
    const pt = deltas(fb, d, cli, nc, keep);
    const [s1, s0, c1, c0] = pt.porCli;
    let kCli = 0, mesmoSinal = 0;
    for (let c = 0; c < nc; c++) if (c1[c] >= minCli && c0[c] >= minCli) { kCli++; if (Math.sign(s1[c] / c1[c] - s0[c] / c0[c]) === Math.sign(pt.cli)) mesmoSinal++; }
    const bs = [], bsr = [];
    for (const w of W) { const ww = Uint16Array.from(w, (x, i) => x * keep[i]); const r = deltas(fb, d, cli, nc, ww); bs.push(r.cli); bsr.push(r.raw); }
    const q = (a, p) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
    const dD = deltas(fb, d, cli, nc, Uint16Array.from(wD, (x, i) => x * keep[i])).cli;
    const dV = deltas(fb, d, cli, nc, Uint16Array.from(wV, (x, i) => x * keep[i])).cli;
    const roteiros = n1;
    const r = { id, grupo, nome, n1: roteiros, n0, raw: pt.raw, raw_lo: q(bsr, 0.025), raw_hi: q(bsr, 0.975), cli: pt.cli, lo: q(bs, 0.025), hi: q(bs, 0.975), kCli, mesmoSinal, desc: dD, val: dV };
    r.foraDeZero = r.lo > 0 || r.hi < 0;
    r.deRede = r.foraDeZero && kCli >= 3;
    r.replica = Number.isFinite(dD) && Number.isFinite(dV) && Math.sign(dD) === Math.sign(pt.cli) && Math.sign(dV) === Math.sign(pt.cli);
    res.push(r);
  }
  return res;
}

// self-check: com d = 0,2 para quem tem a característica e 0 para o resto, o efeito dentro do cliente tem que dar 0,2.
if (process.argv[1]?.endsWith("feat.mjs")) {
  const fake = [];
  for (let i = 0; i < 400; i++) { const f = i % 2; const a = { f, cliente: `c${Math.floor(i / 100)}` }; fake.push({ script_id: String(i), cliente: a.cliente, periodo: i % 3 ? "descoberta" : "validacao", d: f ? 0.2 : 0, a, b: a }); }
  const [r] = pareado(fake, [["f", "t", "teste", (x) => x.f === 1]], { nboot: 200 });
  console.assert(Math.abs(r.cli - 0.2) < 1e-9 && r.lo > 0.19 && r.kCli === 4 && r.deRede, "pareado");
  console.log("ok pareado", r.cli.toFixed(3), r.lo.toFixed(3), r.hi.toFixed(3), "| características:", FEATS.length);
}
