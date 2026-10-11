// Lição por cliente: as regras globais do estudo medidas DENTRO de cada cliente (27 com 40+ vídeos analisáveis).
// Reusa as definições dos outros subagentes (hooks, corpo, comando, payoff, embeddings). Régua: lift e MH da lib.
// Saída: out/clientes/clientes.json (+ rascunho dos .md com --md; os .md finais são revisados à mão, não rode --md depois).
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { carregar, lift, mantelHaenszel, DESFECHOS, OUT, fmt, ler, norm } from "../lib.mjs";
import { HOOK } from "../hooks/feat.mjs";
import { FORMULAS } from "../hooks/formulas.mjs";
import { placar } from "../hooks/placar.mjs";
import { CONC } from "../corpo/conclusao.mjs";
import { DISPOSITIVOS } from "../corpo/ritmo.mjs";
import { f } from "../corpo/feat.mjs";
import { escrito } from "../comando/feat.mjs"; // ao importar, anexa r.ft / r.falado_tx (fim da transcrição) às linhas da lib

const DIR = OUT + "clientes/";
mkdirSync(DIR, { recursive: true });
const P3 = ["Instagram", "TikTok", "YouTube"], SIG = { Instagram: "IG", TikTok: "TT", YouTube: "YT", Facebook: "FB" };
const L = carregar();
const H = Object.fromEntries(HOOK.map(([id, , , fn]) => [id, fn]));
const FO = Object.fromEntries(FORMULAS.map(([id, , fn]) => [id, fn]));
const CC = Object.fromEntries(CONC.map(([n, p]) => [n, p]));
const DP = Object.fromEntries(DISPOSITIVOS.map(([n, p]) => [n, p]));
const { f2, pct } = fmt;
const W = (r) => r.g.palavras_total;
const abreNome = (t) => H.ab_artigo_nome(t) || H.ab_nome_sem_artigo(t);
// ponytail: regex copiadas de src/corpo/tamanho2.mjs e conc2.mjs (esses arquivos rodam a análise inteira ao serem importados)
const BIO = /\b(nasceu (em|no|na)|que nasceu|cresceu (em|no|na)|trabalhava (como|em|numa|num)|no inicio|desde (pequeno|crianca|cedo|jovem)|ele percebeu|ela percebeu|percebeu que|foi nesse (momento|cenario|contexto|periodo)|foi ai que|foi quando|foi entao que|tudo comecou)\b/g;
const nBio = (r) => (f(r).corpo_sem.match(BIO) ?? []).length;
const PROIBIDA = [/\bpode ser\b|\btalvez\b/, /\blic(ao|oes)\b/, /\b(a|essa|toda a) diferenca\b/, /\b(precisa|precisamos|presta atencao|preste atencao|fique atento|atencao)\b/];
const concProibida = (r) => PROIBIDA.some((re) => re.test(f(r).conc_sem));
const concBoa = (r) => CC["abre: 'Enquanto'"](r) || CC["retomada: >=20% das palavras do hook voltam"](r);
const pay = (r) => r.llm?.payoff;
const regua = (r) => r.llm?.recorte === "brasil_x_estrangeiro" || ["gigante", "rival"].includes(r.llm?.antagonista);
const cta = (r) => r.falado_tx || escrito(r);

// trecho: a frase do texto que casa com a regex (sobre o texto sem acento)
const sa = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const trecho = (texto, re) => (texto ?? "").split(/\n+|(?<=[.!?…])\s+/).find((s) => { re.lastIndex = 0; return re.test(sa(s)); }) ?? "";
// tira a numeração de cena do CRM ("1: Será que...") e corta no limite
const corta = (s, n = 230) => { s = (s ?? "").replace(/^\s*\d+\s*[:.)-]\s+/, "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "..." : s; };

// [id, parte, rótulo, direção global (+1 ajuda / -1 atrapalha), predicado, extras]
// bom/ruim: contraparte usada para buscar exemplos (topo que faz o certo / fraco que faz o errado).
const FEATS = [
  ["placar_pos", "hook", "placar do hook >= +1", +1, (r) => placar(r.g.hook) >= 1, { ruim: (r) => placar(r.g.hook) <= -1 }],
  ["placar_neg", "hook", "placar do hook <= -1", -1, (r) => placar(r.g.hook) <= -1, { bom: (r) => placar(r.g.hook) >= 2 }],
  ["abre_nome", "hook", "abre com A/O + nome (ou o nome direto)", +1, (r) => abreNome(r.g.hook), { ruim: (r) => H.ab_demonstrativo(r.g.hook) || H.sem_nome_proprio(r.g.hook) }],
  ["acabou_de", "hook", "\"acabou de\" no hook", +1, (r) => H.acabou_de(r.g.hook), { ruim: (r) => H.num_ano(r.g.hook) || FO.volta_tempo_abre(r.g.hook) }],
  ["conflito", "hook", "conflito nomeado no hook", +1, (r) => FO.conflito_nomeado(r.g.hook), {}],
  ["estrangeiro", "hook", "lugar estrangeiro no hook (China, EUA...)", +1, (r) => H.pais_est(r.g.hook), { ruim: (r) => H.sem_nome_proprio(r.g.hook) }],
  ["sem_nome", "hook", "hook sem nenhum nome próprio", -1, (r) => H.sem_nome_proprio(r.g.hook), { bom: (r) => abreNome(r.g.hook) }],
  ["esse_essa", "hook", "abre com Esse/Essa", -1, (r) => H.ab_demonstrativo(r.g.hook), { bom: (r) => abreNome(r.g.hook) }],
  ["voce", "hook", "\"você\" no hook", -1, (r) => H.voce(r.g.hook), { bom: (r) => !H.voce(r.g.hook) && abreNome(r.g.hook) }],
  ["ia_sem_sujeito", "hook", "IA no hook sem sujeito nomeado na abertura", -1, (r) => H.ia(r.g.hook) && !abreNome(r.g.hook), { bom: (r) => H.ia(r.g.hook) && abreNome(r.g.hook) }],
  ["so_estrangeiro", "tema", "história só estrangeira, sem ponte com o Brasil", -1, (r) => r.llm?.recorte === "estrangeiro", { bom: (r) => r.llm?.recorte === "brasil_x_estrangeiro" }],
  ["sub_puxa", "subhook", "subhook que puxa o espectador (\"imagina você\")", -1, (r) => r.llm?.funcao_subhook === "puxa_espectador", { campo: "sub", bom: (r) => r.llm?.funcao_subhook === "eleva_aposta" }],
  ["tam_450_500", "corpo", "450 a 500 palavras faladas", +1, (r) => W(r) >= 450 && W(r) < 500, { campo: "tam", ruim: (r) => W(r) < 300 }],
  ["tam_lt300", "corpo", "menos de 300 palavras", -1, (r) => W(r) < 300, { campo: "tam", bom: (r) => W(r) >= 420 && W(r) < 500 }],
  ["bio2", "corpo", "2+ marcadores de origem contada em ordem", -1, (r) => nBio(r) >= 2, { campo: "bio", bom: (r) => nBio(r) === 0 && /\b(anos depois|meses depois|ate que)\b/.test(f(r).corpo_sem) }],
  ["ou_seja", "corpo", "\"Ou seja\" no corpo", +1, DP["ponte: 'ou seja'"], { campo: "ouseja" }],
  ["conc_proibida", "conclusao", "conclusão proibida (pode ser/talvez, a lição, a diferença, você precisa)", -1, concProibida, { campo: "conc", bom: concBoa }],
  ["conc_boa", "conclusao", "conclusão em contraste \"Enquanto\" ou eco do hook", +1, concBoa, { campo: "conc", ruim: concProibida }],
  ["disputa", "payoff", "payoff disputa com lado", +1, (r) => pay(r) === "disputa", { ruim: (r) => ["superacao", "vantagem"].includes(pay(r)) }],
  ["orgulho_regua", "payoff", "payoff orgulho com régua de fora", +1, (r) => pay(r) === "orgulho" && regua(r), { ruim: (r) => pay(r) === "orgulho" && !regua(r) }],
  ["superacao", "payoff", "payoff superação", -1, (r) => pay(r) === "superacao", { bom: (r) => pay(r) === "disputa" || (["inspiracao", "orgulho"].includes(pay(r)) && regua(r)) }],
  ["vantagem", "payoff", "payoff vantagem (dica para o espectador)", -1, (r) => pay(r) === "vantagem", {}],
  ["modelagem", "pauta", "roteiro modelado", +1, (r) => !!r.s?.modelagem, { campo: "mod" }],
  ["pede_comentario", "comando", "pede comentário no bloco final (desfecho: seguidores)", -1, (r) => !!r.ft?.v_comenta, { campo: "cta", desf: "seguidores", bom: (r) => !r.ft?.v_comenta && !!r.ft?.prom }],
];
const META = Object.fromEntries(FEATS.map(([id, parte, rot, dir, pred, x]) => [id, { id, parte, rot, dir, pred, ...x }]));

const linhasDe = (rows, m) => (m.desf === "seguidores" ? rows.filter((r) => ["Instagram", "TikTok"].includes(r.plataforma) && r.falado_tx && DESFECHOS.seguidores(r) != null) : rows.filter((r) => P3.includes(r.plataforma)));
const MIN_N = 12, MIN_ROT = 6, MIN_PP = 0.03, MIN_PLAT = 8;
function medir(rows, m) {
  const y = DESFECHOS[m.desf ?? "coef"], base = linhasDe(rows, m).filter((r) => y(r) != null);
  const l = lift(base, m.pred, y);
  if (!l) return null;
  const mh = mantelHaenszel(base, m.pred, y);
  const nSem = base.length - l.n;
  const plat = {};
  for (const p of P3) {
    const b = base.filter((r) => r.plataforma === p), lp = b.length ? lift(b, m.pred, y) : null;
    if (lp && lp.n >= MIN_PLAT && b.length - lp.n >= MIN_PLAT) plat[p] = { n: lp.n, p: lp.p, p_sem: lp.p_sem, lift: lp.lift };
  }
  const rot = new Set(base.map((r) => r.script_id)), rotCom = new Set(base.filter(m.pred).map((r) => r.script_id));
  let leitura;
  if (l.n < MIN_N || l.roteiros < MIN_ROT || nSem < MIN_N) leitura = "sem dado";
  else if (Math.abs(l.p - l.p_sem) < MIN_PP) leitura = "neutro";
  else leitura = Math.sign(l.p - l.p_sem) === m.dir ? "vale" : "inverte";
  const sig = mh.or != null && (mh.lo > 1 || mh.hi < 1);
  return { n: l.n, roteiros: l.roteiros, n_sem: nSem, p: l.p, p_sem: l.p_sem, lift: l.lift, lb: l.lb, ub: l.ub, or: mh.or, or_lo: mh.lo, or_hi: mh.hi, sig, uso: rotCom.size / (rot.size || 1), plat, leitura };
}

// exemplos do próprio cliente
const hk = (r) => corta(r.g.hook, 260);
const campoTxt = {
  hook: hk,
  sub: (r) => `${hk(r)} / subhook: «${corta(r.g.subhook, 160)}»`,
  conc: (r) => `${hk(r)} / conclusão: «${corta(r.g.conclusao, 180)}»`,
  tam: (r) => `${hk(r)} [${W(r)} palavras]`,
  bio: (r) => { const t = trecho(r.g.corpo, BIO); return t ? `${hk(r)} / corpo: «${corta(t, 150)}»` : hk(r); },
  ouseja: (r) => { const t = trecho(r.g.corpo, /\bou seja\b/); return t ? `${hk(r)} / corpo: «${corta(t, 150)}»` : hk(r); },
  mod: (r) => `${hk(r)}${r.s?.modelagem ? " [modelado]" : " [não modelado]"}`,
  cta: (r) => `«${corta(cta(r), 200)}»`,
};
function ex(rows, pred, campo, { n = 2, pior = false, desf = "coef" } = {}) {
  const linhas = desf === "seguidores" ? rows.filter((r) => ["Instagram", "TikTok"].includes(r.plataforma) && r.falado_tx && r.p_seg != null) : rows.filter((r) => P3.includes(r.plataforma));
  if (desf === "seguidores") {
    const sel = linhas.filter(pred).sort((a, b) => (pior ? a.p_seg - b.p_seg : b.p_seg - a.p_seg));
    const v = new Set(), out = [];
    for (const r of sel) { if (v.has(r.script_id)) continue; v.add(r.script_id); out.push({ texto: campoTxt[campo](r), plataforma: r.plataforma, coef: r.coef, p_seg: r.p_seg, seg_por_mil: r.seg_por_mil }); if (out.length >= n) break; }
    return out;
  }
  // topo: quartil de cima do cliente (pq >= 0,75), do maior coef para o menor; fraco: quartil de baixo, do menor coef
  const sel = linhas.filter(pred);
  const q = pior ? sel.filter((r) => r.pq <= 0.25).sort((a, b) => a.coef - b.coef) : sel.filter((r) => r.pq >= 0.75).sort((a, b) => (b.coef >= 1.5) - (a.coef >= 1.5) || b.coef - a.coef);
  const lista = q.length ? q : sel.sort((a, b) => (pior ? a.pq - b.pq : b.pq - a.pq));
  const v = new Set(), out = [], fn = campoTxt[campo] ?? campoTxt.hook;
  for (const r of lista) { if (v.has(r.script_id)) continue; v.add(r.script_id); out.push({ texto: fn(r), plataforma: r.plataforma, coef: r.coef, pq: r.pq }); if (out.length >= n) break; }
  return out;
}

// territórios e payoff
const TERR = JSON.parse(readFileSync(OUT + "embeddings/territorios.json", "utf8"))["60"];
const terrGlobal = Object.fromEntries(TERR.map((t) => [t.nome, { p: t.p, or: t.or, leitura: t.leitura, escopo: t.escopo, roteiros: t.roteiros }]));
function grupos(rows, chave, minRot = 8) {
  const y = DESFECHOS.coef, g = new Map();
  for (const r of rows) if (P3.includes(r.plataforma) && y(r) != null) { const k = chave(r); if (k == null) continue; (g.get(k) ?? g.set(k, []).get(k)).push(r); }
  const base = rows.filter((r) => P3.includes(r.plataforma) && y(r) != null);
  const b = base.filter(y).length / base.length;
  const totRot = new Set(base.map((r) => r.script_id)).size;
  return [...g].map(([k, v]) => ({ nome: k, roteiros: new Set(v.map((r) => r.script_id)).size, n: v.length, p: v.filter(y).length / v.length, base: b, uso: new Set(v.map((r) => r.script_id)).size / totRot }))
    .map((x) => ({ ...x, medido: x.roteiros >= minRot })).sort((a, b) => b.p - a.p);
}

// preferências: a chave viral_data_cliente_id veio nula nas 26 linhas; client_id coincide com o cliente_id dos vídeos
const PREF = new Map(ler("preferencias.json").map((p) => [p.client_id, p]));
// comando: seção 8 de out/comando/achados.md (uma linha por cliente) + exemplos de out/comando/clientes.json
const CMD = new Map();
{
  const md = readFileSync(OUT + "comando/achados.md", "utf8");
  const s8 = md.slice(md.indexOf("## 8. Uma linha por cliente"), md.indexOf("## 9."));
  for (const l of s8.split("\n").filter((x) => /^\| [A-ZÁÉÍÓÚ]/.test(x) && !x.startsWith("| Cliente"))) {
    const c = l.split(" | ").map((x) => x.replace(/^\| | \|$/g, "").trim());
    CMD.set(c[0].replace(/ \(.*$/, ""), { onde: c[0].match(/\((.*)\)/)?.[1], formula: c[1], exemplo: c[2], evitar: c[3] });
  }
  const semDado = {
    "Lincoln Fracari": "Sem dado de seguidores. CTA atual: \"eu te mostro a filosofia chinesa... já segue esse perfil pra receber mais vídeos como esse\"; trocar o fecho por \"me segue aqui\" e prometer a série com \"todo dia\".",
    "Cadu Neiva": "Sem dado de seguidores. Pede comentário em 25% dos vídeos e promete \"mais dicas\": separar o vídeo de comentário e trocar \"dicas\" pelo território.",
    "Renato Mendes": "Sem dado de seguidores. Credencial \"empreendedor, investidor e conselheiro\": trocar por credencial concreta (ele já usou \"ex-sócio da Netshoes\").",
    "Renato Torres": "Sem dado de seguidores. Já usa a fórmula da série: \"todos os dias eu posto vídeos como esse para te mostrar as estratégias...\".",
    "Leonardo Cirino": "Sem dado de seguidores. Promoções com \"comenta EXAME\" no Instagram: separar do vídeo de seguidor.",
    "Túlio Lichenstein": "Sem dado de seguidores. Já usa credencial com número: \"tenho 26 anos de mercado financeiro. Se você quer entender...\".",
    "João Felipe Marques": "Sem dado de seguidores. Já no padrão nome + promessa do território; testar \"todo dia\" e \"me segue aqui\".",
    "Thiago Bisewski": "Sem dado de seguidores. Já no padrão nome + promessa do território; testar \"todo dia\" e \"me segue aqui\".",
    "Thainá Iansen": "Sem dado de seguidores. Já no padrão nome + promessa do território; testar \"todo dia\" e \"me segue aqui\".",
    "Café com Ferri": "Sem dado de seguidores. Já no padrão nome + promessa do território; testar \"todo dia\" e \"me segue aqui\".",
  };
  for (const [c, t] of Object.entries(semDado)) if (!CMD.has(c)) CMD.set(c, { onde: null, formula: t, exemplo: "", evitar: "" });
}
const CMDEX = JSON.parse(readFileSync(OUT + "comando/clientes.json", "utf8"));
// ponytail: predicados copiados de src/comando/clientes.mjs (aquele arquivo reescreve as saídas do comando ao ser importado)
const P1 = /\b(eu )?(te )?(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho|destrincho|desvendo|traduzo)\b/;
const tx = (r) => norm(r.falado_tx);
const CMDF = {
  "todo dia / todos os dias": (r) => r.ft.freq,
  "eu te mostro / revelo / trago": (r) => P1.test(tx(r)),
  "se você quer": (r) => r.ft.cond,
  "me segue aqui": (r) => /\bsegue aqui\b/.test(tx(r)),
  "segue o meu perfil": (r) => /\bsegue (o )?meu perfil\b/.test(tx(r)),
  "para não perder o próximo": (r) => r.ft.nao_perder,
  "mais conteúdos como esse": (r) => r.ft.mais_como_esse,
  "agora": (r) => /\bagora\b/.test(tx(r)),
  "credencial na apresentação": (r) => r.ft.apres && r.ft.credencial,
  "sem apresentação": (r) => !r.ft.apres,
  "pedido extra (comenta, compartilha, salva)": (r) => r.ft.v_comenta || r.ft.v_compart || r.ft.v_salva || r.ft.v_curte,
  "antes de todo mundo / da maioria / à frente": (r) => r.ft.exclusiv,
  "histórias": (r) => r.ft.o_historias,
  "estratégias": (r) => r.ft.o_estrategias,
};
function cmdExemplos(rows, cmdEx) {
  const g = [...cmdEx].sort((a, z) => z.n - a.n)[0];
  if (!g) return null;
  const lin = rows.filter((r) => r.plataforma === g.plataforma && r.falado_tx && r.p_seg != null);
  const aj = g.ajuda.find((x) => CMDF[x.n]), at = [...g.atrapalha].reverse().find((x) => CMDF[x.n]);
  const pega = (pred, pior, n) => { const v = new Set(), o = []; for (const r of lin.filter(pred).sort((a, z) => (pior ? a.p_seg - z.p_seg : z.p_seg - a.p_seg))) { if (v.has(r.script_id)) continue; v.add(r.script_id); o.push({ texto: corta(r.falado_tx, 260), plataforma: r.plataforma, p_seg: r.p_seg, seg_por_mil: r.seg_por_mil, coef: r.coef }); if (o.length >= n) break; } return o; };
  return { plataforma: g.plataforma, n: g.n, ajuda: aj ?? null, atrapalha: at ?? null, topo: aj ? pega(CMDF[aj.n], false, 2) : [], fraco: at ? pega(CMDF[at.n], true, 1) : aj ? pega((r) => !CMDF[aj.n](r), true, 1) : [] };
}

// ---------- por cliente ----------
const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
const porCliente = new Map();
for (const r of L) (porCliente.get(r.cliente) ?? porCliente.set(r.cliente, []).get(r.cliente)).push(r);
const CLIENTES = [...porCliente].filter(([, v]) => v.length >= 40).sort((a, b) => b[1].length - a[1].length);

// referência global com a mesma régua (lift e MH por cliente x rede, todas as contas)
const GLOBAL = {};
for (const m of Object.values(META)) {
  const y = DESFECHOS[m.desf ?? "coef"], base = linhasDe(L, m).filter((r) => y(r) != null);
  const l = lift(base, m.pred, y), mh = mantelHaenszel(base, m.pred, y);
  GLOBAL[m.id] = { roteiros: l.roteiros, n: l.n, p: l.p, p_sem: l.p_sem, lift: l.lift, or: mh.or, or_lo: mh.lo, or_hi: mh.hi };
}

const saida = [];
for (const [nome, rows] of CLIENTES) {
  const r0 = rows[0];
  const plat = {};
  for (const p of ["Instagram", "TikTok", "YouTube", "Facebook"]) {
    const v = rows.filter((r) => r.plataforma === p);
    if (!v.length) continue;
    plat[p] = { n: v.length, roteiros: new Set(v.map((r) => r.script_id)).size, acerto: v.filter((r) => r.coef >= 1.5).length / v.length, coef_med: med(v.map((r) => r.coef)), views_med: med(v.map((r) => r.views)) };
  }
  const bat = {};
  for (const m of Object.values(META)) bat[m.id] = medir(rows, m);
  const terr = grupos(rows, (r) => r.cluster?.nome60).map((t) => ({ ...t, global: terrGlobal[t.nome] ?? null }));
  const pays = grupos(rows, (r) => r.llm?.payoff);
  const pref = PREF.get(r0.cliente_id) ?? null;
  const cmdEx = CMDEX.filter((c) => c.cliente === nome);
  // exemplos de cada regra (para as recomendações)
  const exs = {};
  for (const m of Object.values(META)) {
    const b = bat[m.id];
    if (!b || b.leitura === "sem dado" || b.leitura === "neutro") continue;
    const campo = m.campo ?? "hook", desf = m.desf ?? "coef";
    // "vale": topo que faz o certo, fraco que faz o errado. "inverte": o contrário (o que rende para ELE).
    const certo = (m.dir > 0) === (b.leitura === "vale") ? m.pred : (r) => !m.pred(r);
    const errado = (r) => !certo(r);
    const bomExtra = b.leitura === "vale" ? (m.dir > 0 ? null : m.bom) : null;
    const ruimExtra = b.leitura === "vale" ? (m.dir > 0 ? m.ruim : null) : null;
    let topo = ex(rows, bomExtra ? (r) => certo(r) && bomExtra(r) : certo, campo, { desf, n: 6 });
    if (topo.length < 4) topo = [...topo, ...ex(rows, certo, campo, { desf, n: 6 }).filter((e) => !topo.some((t) => t.texto === e.texto))];
    let fraco = ex(rows, ruimExtra ? (r) => errado(r) && ruimExtra(r) : errado, campo, { n: 3, pior: true, desf });
    if (fraco.length < 2) fraco = [...fraco, ...ex(rows, errado, campo, { n: 3, pior: true, desf }).filter((e) => !fraco.some((t) => t.texto === e.texto))];
    exs[m.id] = { topo, fraco };
  }
  const terrEx = {};
  for (const t of terr.filter((t) => t.medido)) {
    terrEx[t.nome] = { topo: ex(rows, (r) => r.cluster?.nome60 === t.nome, "hook", { n: 4 }), fraco: ex(rows, (r) => r.cluster?.nome60 === t.nome, "hook", { n: 2, pior: true }) };
  }
  saida.push({
    cliente: nome, cliente_id: r0.cliente_id, macro: r0.macro, nichos: r0.nichos.slice(0, 3),
    videos: rows.length, roteiros: new Set(rows.map((r) => r.script_id)).size, plataformas: plat,
    bateria: bat, territorios: terr, payoffs: pays, comando: CMD.get(nome) ?? null,
    comando_formula_exemplos: cmdExemplos(rows, cmdEx),
    comando_exemplos: cmdEx.map((c) => ({ plataforma: c.plataforma, n: c.n, ajuda: c.ajuda, atrapalha: c.atrapalha, top: c.top.slice(0, 2), pior: c.pior.slice(0, 1) })),
    preferencias: pref ? { proibicoes: pref.proibicoes, tom: pref.tom_de_voz, temas: pref.temas_preferidos, vocabulario_evitar: pref.vocabulario_evitar } : null,
    exemplos: exs, exemplos_territorio: terrEx,
  });
}
writeFileSync(DIR + "clientes.json", JSON.stringify({ metodo: { topo: "quartil superior do coef no estrato cliente x rede x trimestre (seguidores: quartil de seguidores por mil views no cliente x rede)", leitura: `vale = mesma direção da regra global; inverte = direção contrária; neutro = diferença com x sem < ${MIN_PP * 100} pontos; sem dado = < ${MIN_N} vídeos ou < ${MIN_ROT} roteiros com a característica, ou < ${MIN_N} vídeos sem`, sig: "MH por rede dentro do cliente com IC95 fora de 1", redes: "IG, TT e YT (pede_comentario: IG e TT com transcrição e seguidores)" }, global: GLOBAL, clientes: saida }, null, 1));

// ---------- console: matriz compacta para revisão ----------
console.log("GLOBAL (mesma régua):", Object.entries(GLOBAL).map(([k, g]) => `${k} rot=${g.roteiros} OR ${f2(g.or)} [${f2(g.or_lo)}-${f2(g.or_hi)}]`).join(" | "));
const ab = { vale: "V", inverte: "X", neutro: "~", "sem dado": "." };
console.log("\ncliente".padEnd(25), Object.keys(META).map((k) => k.slice(0, 6)).join(" "));
for (const c of saida) console.log(c.cliente.padEnd(24), Object.keys(META).map((k) => { const b = c.bateria[k]; return (ab[b?.leitura ?? "sem dado"] + (b?.sig ? "*" : " ") + (b && b.leitura !== "sem dado" ? f2(b.lift) : "    ")).padEnd(6); }).join(" "));


// leitura de rede por conta: out/plataformas/achados.md, seção E (E2 e E3)
const NOTA_REDE = {
  "Marcos Pelozato": "O YouTube paga o que a conta faz: queda de gigante (29% dos roteiros, casa 6%), dinheiro no hook (34%, casa 15%) e empresa como protagonista. No TikTok a mediana é de 884 views: a régua de 10 mil views do acerto da casa fica fora de alcance.",
  "Dilson Peres": "Rende mais no YouTube porque o hook dele traz dinheiro (moeda em 32% dos hooks, casa 15%) e bastidor de empresa, que é o que o YouTube paga (moeda no hook: YT OR 1,49; IG 0,75; TT 0,72).",
  "Izabela Anholett": "O YouTube decolou de maio a julho (mediana de 1,3 mil para 69 mil views) e o acerto lá caiu para 22% em setembro. Além da decolagem, história só estrangeira (71% dos roteiros dela) e roteiro curto são punidos no IG e no TikTok e não no YouTube.",
  "Rafael Rodrigues": "Orgulho (56% dos roteiros) e estudante inventor (61%) são munição de IG e TikTok; no YouTube o mesmo roteiro cai de 7 a 16 pontos de percentil, e o acerto lá caiu de 31% para 11% na validação.",
  "Marcio Grazino": "Orgulho e estudante inventor rendem no IG e no TikTok e caem no YouTube (10 pontos abaixo do IG); no TikTok são poucos vídeos enormes (p90/p50 de 41).",
  "Cadu Neiva": "Orgulho em 74% dos roteiros: rende no IG e no TikTok, não no YouTube, que além disso não tem audiência (mediana de 1,1 mil views).",
  "Leonardo Nogueira": "Mega-marca no hook (46% dos hooks, casa 27%) é o que o TikTok paga; o canal de YouTube não tem distribuição (mediana de 1,2 mil views, nenhum pico).",
  "Lincoln Fracari": "A ponte Brasil x estrangeiro (46% dos roteiros, casa 21%) rende no TikTok. 58 dos 135 vídeos do Instagram saíram depois do TikTok ou do YouTube, e Instagram atrasado tem acerto da casa de 21% contra 29%.",
  "Rodrigo Waughan": "Contas pequenas nas três redes (views medianas de 500 a 3 mil). O conteúdo (história estrangeira pura, promessa \"por que/como\") é o que IG e TikTok punem, e no YouTube falta audiência.",
  "Thiago Franco": "O TikTok parou de distribuir no 3º trimestre (mediana de 759 para 6 views): lá o problema é distribuição, não roteiro.",
  "Renato Mendes": "Canal de YouTube sem distribuição (mediana de 956 views, nenhum pico); IG e TikTok rendem igual.",
  "Franklin Tomich": "Canal de YouTube sem distribuição (mediana de 1,4 mil views); o Instagram é a conta que funciona.",
  "Renato Torres": "Facebook tem volume (55 vídeos) e anda independente do Instagram (correlação do mesmo roteiro 0,06).",
};
const DICAS_PREF = [
  [/futebol/i, "a regra global do futebol pelo dinheiro do clube não vale para ele (tema proibido)"],
  [/pol[ií]tic|governo|STF|militante|elei/i, "fora: territórios de política e governo (eleição, dívida pública) e revolta contra o governo"],
  [/cr[ií]tic|falar mal|negativ|ofen|pessimis|pol[êe]mic|atacar/i, "conflito nomeado e payoff disputa batem com a proibição: briga como disputa de mercado com placar, sem ataque nem tom negativo", true],
  [/alarmist/i, "alerta só com dado e saída, nunca alarmismo"],
  [/ingl[êe]s/i, "sem palavra em inglês no hook"],
  [/m[úu]ltiplos CTA/i, "a regra global \"um vídeo, um pedido\" coincide com a proibição"],
  [/fofoca|artista/i, "pessoa famosa no hook só se for de negócios (Elon Musk, Silvio Santos), nunca artista"],
  [/faturamento/i, "\"Pra você ter ideia\" + número: use escala que não seja faturamento"],
  [/geopol/i, "lugar estrangeiro no hook como fato, sem opinião geopolítica"],
  [/plano de sa[úu]de/i, "nada de revolta contra planos de saúde"],
  [/religi/i, "nenhuma regra global toca religião"],
];

// ---------- rascunho dos .md (só com --md; depois da revisão manual, não rode de novo) ----------
if (process.argv.includes("--md")) {
  const kebab = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const FEM = new Set(["Izabela Anholett", "Drielle Castelani", "Thainá Iansen"]);
  const exTxt = (e) => `"${corta(e.texto, 330)}" (${SIG[e.plataforma]}, ${e.p_seg != null ? `seguidores p${Math.round(e.p_seg * 100)}` : `coef ${f2(e.coef)}`})`;
  // [título faça/pare, como fazer]: frases dos achados globais
  const INSTR = {
    placar_pos: ["Faça hook com placar positivo", "Conte o placar antes de entregar (+1: nome na abertura, \"acabou de\", conflito nomeado, lugar, famoso, idade, \"tá\"; -1: Esse/Essa, você, IA, \"empresa/marca\", nunca, pode, ano, palavra de 13+ letras, bilionário) e mire +2."],
    placar_neg: ["Pare de entregar hook com placar negativo", "Abaixo de zero volta para reescrita: saem Esse/Essa, você, IA sem dono, \"empresa/marca\", \"pode\", ano e palavra de 13+ letras; entram nome, lugar ou \"acabou de\"."],
    abre_nome: ["Abra o hook pelo nome de quem age", "Primeira palavra: artigo + nome (A China, O Google, O Silvio Santos), nunca a categoria (\"Essa empresa\")."],
    acabou_de: ["Use \"[Nome] acabou de [verbo forte]\" quando o fato é recente", "A novidade vai no verbo, nunca na data (\"em 2026\", \"este ano\")."],
    conflito: ["Nomeie os dois lados da briga no hook", "Verbo de embate (declarou guerra, humilhou, venceu, contra) com o nome de cada lado; \"mas\" e \"enquanto\" sozinhos não fazem conflito."],
    estrangeiro: ["Ponha o ator estrangeiro no hook", "Se a história tem China, EUA ou marca de fora, ela entra na primeira frase, não no corpo."],
    sem_nome: ["Pare de entregar hook sem nome próprio", "Todo hook leva quem age ou onde acontece; se o nome ficou no subhook, ele sobe para o hook."],
    esse_essa: ["Pare de abrir com \"Esse/Essa\"", "Empresa com nome é chamada pelo nome; personagem anônimo leva idade e lugar na mesma frase."],
    voce: ["Tire o \"você\" do hook", "Troque pelo nome de quem age; o \"você\" fica para o fim do vídeo."],
    ia_sem_sujeito: ["Pare de abrir com a IA sem dono", "Abra com quem fez (A Samsung, O Google, A China) e diga \"IA\" só no subhook."],
    so_estrangeiro: ["Faça a ponte com o Brasil em toda pauta de fora", "No hook ou no fechamento, diga o que aquilo muda aqui (o carro da garagem, o preço, a empresa daqui)."],
    sub_puxa: ["Pare de puxar o espectador no subhook", "O segundo parágrafo soma um dado que eleva a aposta; nada de \"imagina você\" ou \"aquela loja que você conhece\"."],
    tam_450_500: ["Escreva 450 a 500 palavras", "Cerca de 150 a 165 segundos; o que falta entra como mais um fato de escala (\"Pra você ter ideia, ...\"), não como repetição."],
    tam_lt300: ["Pare de entregar roteiro com menos de 300 palavras", "Complete com mais um fato e um contraste na conclusão; o alvo é 420 a 500."],
    bio2: ["Pare de contar a origem em ordem", "Nada de \"nasceu em\", \"trabalhava como\", \"percebeu que\", \"foi aí que\": comece pelo conflito, pule o tempo com \"Anos depois,\" e vire com \"Até que\"."],
    ou_seja: ["Traduza o fato com \"Ou seja,\"", "Depois do fato mais forte do corpo, a frase seguinte abre com \"Ou seja,\" e diz o que aquilo muda para o bolso, o país ou o mercado."],
    conc_proibida: ["Pare com a conclusão de sermão", "Fora da conclusão: \"pode ser\", \"talvez\", \"a lição é\", \"a diferença está em\", \"você precisa\"."],
    conc_boa: ["Feche com contraste ou com o eco do hook", "\"Enquanto todo mundo [faz o óbvio], [personagem] [fez o contrário]\" ou a palavra-chave do hook de volta na última frase."],
    disputa: ["Transforme a pauta em briga com lado", "Dois atores com nome no hook, um placar (\"perdeu o trono\") e um lado no fechamento."],
    orgulho_regua: ["Orgulho sempre com régua de fora", "No hook, quem o Brasil (ou a região) superou: um país, uma multinacional, uma universidade famosa."],
    superacao: ["Pare de vender superação", "\"Cresceu pobre e hoje fatura bilhões\" rende abaixo; transforme em briga com quem tentou derrubar (com nome) e feche no desfecho, não na moral."],
    vantagem: ["Pare de usar dica prática como payoff de alcance", "Dica é para salvamento; para alcance, embrulhe a dica num caso com personagem e abra pelo caso."],
    modelagem: ["Modele mais", "Parta de um vídeo que já funcionou (link do Instagram) e copie a forma: ordem das revelações, ritmo, onde cai a virada."],
  };
  const GRUPO = { placar_pos: "placar", placar_neg: "placar", abre_nome: "abertura", sem_nome: "abertura", esse_essa: "abertura", tam_450_500: "tam", tam_lt300: "tam", conc_proibida: "conc", conc_boa: "conc", disputa: "payoff", orgulho_regua: "payoff", superacao: "payoff", vantagem: "payoff" };
  const curto = { placar_pos: "placar do hook >= +1", placar_neg: "placar do hook <= -1", abre_nome: "abrir pelo nome", acabou_de: "\"acabou de\"", conflito: "conflito nomeado", estrangeiro: "lugar estrangeiro no hook", sem_nome: "hook sem nome (ruim)", esse_essa: "Esse/Essa (ruim)", voce: "\"você\" no hook (ruim)", ia_sem_sujeito: "IA sem dono (ruim)", so_estrangeiro: "pauta só estrangeira (ruim)", sub_puxa: "subhook que puxa o espectador (ruim)", tam_450_500: "450 a 500 palavras", tam_lt300: "menos de 300 palavras (ruim)", bio2: "origem contada em ordem (ruim)", ou_seja: "\"Ou seja\"", conc_proibida: "conclusão de sermão (ruim)", conc_boa: "conclusão em contraste ou eco do hook", disputa: "payoff disputa", orgulho_regua: "orgulho com régua", superacao: "superação (ruim)", vantagem: "dica prática (ruim)", modelagem: "modelagem", pede_comentario: "pedir comentário no CTA (ruim)" };
  for (const c of saida) {
    const ela = FEM.has(c.cliente), ele = ela ? "ela" : "ele", dele = ela ? "dela" : "dele";
    const b = c.bateria, out = [];
    const base = c.territorios[0]?.base ?? 0.25;
    const lista = (lei) => Object.values(META).filter((m) => b[m.id]?.leitura === lei).map((m) => `${curto[m.id]}${b[m.id].sig ? "\\*" : ""}`);
    out.push(`# ${c.cliente}`, "");
    out.push(`Lição por cliente (estudo 2026-10). Nicho: ${c.nichos.join(" / ")} (${c.macro}). ${c.roteiros} roteiros, ${c.videos} vídeos analisáveis. Topo = quartil de cima do coeficiente viral dentro de cliente x rede x trimestre (base ${pct(base)}). Com uma conta só, os números são direção, não lei.`, "");
    out.push("## Síntese", "", `- **Funciona para ${ele}:** (escrever)`, `- **Regra global que vale:** ${lista("vale").join("; ") || "nada mediu com volume"}.`, `- **Onde foge:** ${lista("inverte").join("; ") || "em nada que deu para medir"}.`, "");
    out.push("## 1. Panorama", "", "| rede | vídeos | taxa de acerto (coef >= 1,5) | coef mediano | views medianas |", "|---|---|---|---|---|");
    for (const [p, v] of Object.entries(c.plataformas)) out.push(`| ${p} | ${v.n} | ${pct(v.acerto)} | ${f2(v.coef_med)} | ${Math.round(v.views_med).toLocaleString("pt-BR")} |`);
    out.push("", `## 2. Regras globais dentro ${ela ? "dela" : "dele"}`, "", "**vale** = mesma direção da regra global; **inverte** = direção contrária; **neutro** = com e sem a menos de 3 pontos; exige 12+ vídeos e 6+ roteiros com a característica. \\* = diferença significativa dentro do cliente (OR por rede, IC95 fora de 1). (+)/(-) = direção da regra na casa.", "");
    out.push("| regra global | vídeos (roteiros) | topo com x sem | lift | IG / TT / YT | leitura |", "|---|---|---|---|---|---|");
    const sem = [];
    for (const m of Object.values(META)) {
      const x = b[m.id];
      if (!x || x.leitura === "sem dado") { sem.push(m.rot); continue; }
      const pl = P3.map((p) => (x.plat[p] ? f2(x.plat[p].lift) : "-")).join(" / ");
      out.push(`| ${m.rot} (${m.dir > 0 ? "+" : "-"}) | ${x.n} (${x.roteiros}) | ${pct(x.p)} x ${pct(x.p_sem)} | ${f2(x.lift)}${x.sig ? "\\*" : ""} | ${pl} | ${x.leitura} |`);
    }
    if (sem.length) out.push("", `Sem dado (amostra pequena): ${sem.join("; ")}.`);
    const tm = c.territorios.filter((t) => t.medido);
    const gl = (t) => (t.global ? `; casa ${pct(t.global.p)}` : "");
    const bons = tm.filter((t) => t.p >= base + 0.05).slice(0, 3), ruins = tm.filter((t) => t.p <= base - 0.05).reverse().slice(0, 3);
    const maisUsados = [...tm].sort((a, z) => z.uso - a.uso).slice(0, 2);
    out.push("", "## 3. Territórios (8+ roteiros)", "");
    out.push(`- Funcionam: ${bons.map((t) => `${t.nome} (${pct(t.p)} de topo, ${t.roteiros} roteiros${gl(t)})`).join("; ") || "nenhum se destaca"}.`);
    out.push(`- Falham: ${ruins.map((t) => `${t.nome} (${pct(t.p)}, ${t.roteiros} roteiros${gl(t)})`).join("; ") || "nenhum se destaca"}.`);
    out.push(`- Onde mais produz: ${maisUsados.map((t) => `${t.nome} (${pct(t.uso)} dos roteiros, ${pct(t.p)} de topo)`).join("; ") || "nenhum território com 8+ roteiros"}.`);
    const pu = [...c.payoffs].sort((a, z) => z.uso - a.uso), pm = c.payoffs.filter((p) => p.medido);
    out.push("", "## 4. Payoff", "", `- Mais usa: ${pu.slice(0, 3).map((p) => `${p.nome} (${pct(p.uso)} dos roteiros, ${pct(p.p)} de topo)`).join("; ")}.`);
    out.push(`- Rende (8+ roteiros): ${pm.filter((p) => p.p >= base + 0.04).slice(0, 2).map((p) => `${p.nome} ${pct(p.p)}`).join("; ") || "nenhum acima da base"}. Não rende: ${pm.filter((p) => p.p <= base - 0.04).reverse().slice(0, 2).map((p) => `${p.nome} ${pct(p.p)}`).join("; ") || "nenhum abaixo da base"}.`);
    out.push("", "## 5. Comando", "");
    if (c.comando?.onde) out.push(`- Fórmula que converte (${c.comando.onde}): ${c.comando.formula}. Exemplo de topo: ${c.comando.exemplo}`, `- Evitar: ${c.comando.evitar}.`);
    else out.push(`- ${c.comando?.formula ?? "sem linha no estudo de comando."}`);
    const redes = P3.filter((p) => c.plataformas[p]?.n >= 20).sort((a, z) => c.plataformas[z].acerto - c.plataformas[a].acerto);
    const rd = (p) => `${p} (acerto ${pct(c.plataformas[p].acerto)}, coef mediano ${f2(c.plataformas[p].coef_med)})`;
    out.push("", "## 6. Rede", "", redes.length > 1 ? `- Rende mais no ${rd(redes[0])}; menos no ${rd(redes[redes.length - 1])}.` : `- Só uma rede com volume: ${redes.map(rd).join("")}.`, `- Por quê: ${NOTA_REDE[c.cliente] ?? "(escrever)"}`);
    // recomendações (rascunho automático: território + até 2 regras de hook + 1 de outra parte + comando; exemplos sem repetir)
    const recs = [], vistos = new Set();
    const escolhe = (lista, n) => { const o = []; for (const e of lista ?? []) { if (vistos.has(e.texto) || o.length >= n) continue; vistos.add(e.texto); o.push(e); } return o; };
    const tBom = bons.find((t) => t.p >= base + 0.07), tRuim = [...ruins].sort((a, z) => z.uso - a.uso).find((t) => t.p <= base - 0.08);
    if (tBom || tRuim) {
      const eb = c.exemplos_territorio[(tBom ?? bons[0])?.nome] ?? null, er = tRuim ? c.exemplos_territorio[tRuim.nome] : null;
      recs.push(`**Pauta: ${tBom ? `faça mais "${tBom.nome}"` : ""}${tBom && tRuim ? "; " : ""}${tRuim ? `diminua "${tRuim.nome}"` : ""}.** ${tBom ? `${pct(tBom.p)} de topo em ${tBom.roteiros} roteiros, contra ${pct(base)} da conta${gl(tBom)}. ` : ""}${tRuim ? `"${tRuim.nome}": ${pct(tRuim.p)} de topo em ${tRuim.roteiros} roteiros (${pct(tRuim.uso)} da produção). ` : ""}${!tBom && bons[0] ? `Melhor território ${dele}: "${bons[0].nome}" (${pct(bons[0].p)} em ${bons[0].roteiros} roteiros). ` : ""}Topo: ${escolhe(eb?.topo, 2).map(exTxt).join("; ") || "-"}. Fraco: ${escolhe(er?.fraco ?? eb?.fraco, 1).map(exTxt).join("; ") || "-"}.`);
    }
    const HOOKS = new Set(["placar_pos", "placar_neg", "abre_nome", "acabou_de", "conflito", "estrangeiro", "sem_nome", "esse_essa", "voce", "ia_sem_sujeito"]);
    const cands = [];
    for (const m of Object.values(META)) {
      const x = b[m.id];
      if (!x || x.leitura !== "vale" || !c.exemplos[m.id] || !INSTR[m.id]) continue;
      const room = Math.max(0.15, m.dir < 0 ? x.uso : 1 - x.uso);
      cands.push({ m, x, score: Math.abs(x.p - x.p_sem) * Math.sqrt(Math.min(x.n, x.n_sem)) * room * (x.sig ? 1.5 : 1) });
    }
    cands.sort((a, z) => z.score - a.score);
    const ordem = [...cands.filter((k) => HOOKS.has(k.m.id)).slice(0, 1), ...cands.filter((k) => !HOOKS.has(k.m.id)).slice(0, 1), ...cands];
    const usados = new Set();
    let nHook = 0;
    for (const { m, x } of ordem) {
      const g = GRUPO[m.id] ?? m.id;
      if (usados.has(m.id) || usados.has(g) || recs.length >= 4 || (HOOKS.has(m.id) && nHook >= 2)) continue;
      usados.add(m.id); usados.add(g); if (HOOKS.has(m.id)) nHook++;
      const e = c.exemplos[m.id];
      const uso = m.dir < 0 ? `está em ${pct(x.uso)} dos roteiros ${dele}` : `só ${pct(x.uso)} dos roteiros ${dele} usam`;
      recs.push(`**${INSTR[m.id][0]}.** ${INSTR[m.id][1]} Número ${dele}: ${m.rot}, ${pct(x.p)} de topo com x ${pct(x.p_sem)} sem (${x.n} vídeos, ${x.roteiros} roteiros${x.sig ? ", significativo" : ""}); ${uso}. Topo: ${escolhe(e.topo, 2).map(exTxt).join("; ")}. Fraco: ${escolhe(e.fraco, 1).map(exTxt).join("; ")}.`);
    }
    const cf = c.comando_formula_exemplos;
    if (c.comando?.onde && cf?.topo.length) recs.push(`**Comando: ${corta(c.comando.formula, 300)}.** ${cf.ajuda ? `No ${SIG[cf.plataforma]}, "${cf.ajuda.n}": ${pct(cf.ajuda.a)} de topo em seguidores com x ${pct(cf.ajuda.b)} sem (${cf.ajuda.com} vídeos)${cf.atrapalha ? `; "${cf.atrapalha.n}": ${pct(cf.atrapalha.a)} com x ${pct(cf.atrapalha.b)} sem (${cf.atrapalha.com} vídeos)` : ""}. ` : ""}Topo: ${cf.topo.map(exTxt).join("; ")}. Fraco: ${cf.fraco.map(exTxt).join("; ") || "-"}.`);
    out.push("", "## 7. Recomendações", "", ...recs.map((r, i) => `${i + 1}. ${r}`));
    const pr = c.preferencias;
    out.push("", "## 8. Preferências do cliente", "", pr ? `- Proibições: ${pr.proibicoes.join("; ") || "nenhuma cadastrada"}.${pr.tom ? ` Tom: ${pr.tom}.` : ""}` : "- Sem preferências cadastradas na base.", `- Conflito com regra global: ${pr ? DICAS_PREF.filter(([re, , semGoverno]) => pr.proibicoes.some((x) => re.test(x) && !(semGoverno && /governo|pol[ií]tic/i.test(x)))).map(([, t]) => t).join("; ") || "nenhum" : "sem cadastro para checar"}.`);
    writeFileSync(DIR + kebab(c.cliente) + ".md", out.join("\n").replace(/^(## .*)\n\n/gm, "$1\n").replace(/\n{3,}/g, "\n\n") + "\n");
  }
  console.log("rascunhos .md escritos em", DIR);
}
