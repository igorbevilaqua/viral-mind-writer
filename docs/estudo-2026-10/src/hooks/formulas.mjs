// Fórmulas de hook (estruturas concretas por regex), medidas e ranqueadas. Saída: out/hooks/formulas.json + console.
import { writeFileSync } from "node:fs";
import { carregar, avaliar, exemplos, OUT, fmt, norm, palavras } from "../lib.mjs";
import { HOOK, PESSOA, PAIS_EST, REGIAO_BR, FIGURA, BIGTECH, MARCA_CHINA, MARCA_CONSUMO, MARCA_BR } from "./feat.mjs";

const L = carregar();
const LX = L.filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
const F = Object.fromEntries(HOOK.map(([id, , , fn]) => [id, fn]));
const N = (t) => norm(t);
const B = (s) => new RegExp(`\\b(${s})\\b`);
const rxPessoa = B(PESSOA), rxEst = B(PAIS_EST), rxReg = B(REGIAO_BR), rxFig = B(FIGURA);
const rxMarca = B([BIGTECH, MARCA_CHINA, MARCA_CONSUMO, MARCA_BR].join("|"));
const temBR = (t) => /\b(brasil|brasileir\w*)\b/.test(N(t)) || rxReg.test(N(t));
const CONFLITO = /\b(guerra|guerras|briga|contra|humilh\w+|derrot\w+|venceu|venceram|atac\w+|ameac\w+|rival|rivais|desafiou|enfrentou|declarou|declararam|peitou|bateu de frente)\b/;
const PROIBE = /\b(proibiu|proibiram|proibid\w*|baniu|baniram|banid\w*|bloqueou|bloquearam|cancelou|cancelaram|multou|multaram|processou|processaram|vetou|censurou|expulsou|prendeu|taxou|taxar)\b/;

// [id, modelo (como o roteirista escreve), fn(hook cru)]
export const FORMULAS = [
  ["acabou_nome", "[Nome conhecido] acabou de [verbo forte]", (t) => F.acabou_de(t) && F.nome_proprio_qualquer(t)],
  ["est_x_br", "[País ou marca estrangeira] + [ação] + [Brasil / região do Brasil]", (t) => rxEst.test(N(t)) && temBR(t)],
  ["conflito_nomeado", "[Nome A] declarou guerra / humilhou / venceu [Nome B]", (t) => CONFLITO.test(N(t)) && F.nome_proprio_qualquer(t)],
  ["o_que_aconteceu", "O que aconteceu com a [marca que todo mundo conhece]? / Você lembra da [marca]? ... E o motivo...", (t) => /^(o que aconteceu com|voce lembra d|lembra d|cade|onde foi parar|por onde anda|o que houve com)/.test(N(t))],
  ["e_o_motivo", "[Fato surpreendente]. E o motivo (é / não é o que você pensa)...", (t) => /\b(e o motivo|o motivo (e|foi|disso|nao|por tras)|e a razao|e o porque|o porque)\b/.test(N(t))],
  ["autoridade_proibiu", "[Governo / Justiça / país / empresa] proibiu / baniu / cancelou [algo] (por causa de [detalhe])", (t) => PROIBE.test(N(t))],
  ["problema_resolvido", "[Quem] resolveu / tem / criou um problema [para quem]", (t) => /\bproblemas?\b/.test(N(t))],
  ["famoso_acao", "[Pessoa famosa: Musk, Silvio Santos, Zuckerberg] + [ação no passado ou acabou de]", (t) => rxFig.test(N(t)) && (F.verbo_passado(t) || F.acabou_de(t))],
  ["marca_acao", "[Marca grande: BYD, Apple, Casas Bahia] + [ação no passado ou acabou de]", (t) => rxMarca.test(N(t)) && (F.verbo_passado(t) || F.acabou_de(t))],
  ["lugar_br_feito", "[Gente / empresa de um lugar do Brasil: Nordeste, interior da Bahia, cidadezinha do RS] + [feito]", (t) => rxReg.test(N(t)) && (F.verbo_passado(t) || F.acabou_de(t) || F.gerundio_esta(t))],
  ["pessoa_comum_lugar", "Esse/Um [pessoa comum] + [de um lugar do Brasil] + [feito]", (t) => new RegExp(`^(esse|essa|esses|essas|um|uma|dois|duas|tres) (${PESSOA})\\b`).test(N(t)) && rxReg.test(N(t))],
  ["esse_pessoa_anonima", "Esse/Essa [tipo de pessoa] + [feito] (sem nome nem lugar)", (t) => new RegExp(`^(esse|essa|esses|essas|este|esta) (${PESSOA})\\b`).test(N(t)) && !rxReg.test(N(t)) && !rxEst.test(N(t)) && !rxFig.test(N(t))],
  ["essa_coisa", "Essa empresa / Essa IA / Essa marca / Esse app + [faz algo]", (t) => /^(esse|essa|esses|essas|este|esta) (empresa|empresas|marca|marcas|ia|ias|inteligencia|startup|app|aplicativo|tecnologia|ferramenta|plataforma|robo|robos|maquina|produto|loja|rede)\b/.test(N(t))],
  ["capaz_de", "[Isso / Essa IA] é capaz de / consegue [proeza]", (t) => /\b(e capaz de|sao capazes de|capaz de|consegue|conseguem)\b/.test(N(t)) && !F.acabou_de(t)],
  ["enquanto", "Enquanto [o grande faz X], [o pequeno fez Y]", (t) => /^enquanto\b/.test(N(t))],
  ["ninguem_percebeu", "[Algo grande acontecendo] e quase ninguém está percebendo / ficou sabendo", (t) => /\b(e|mas|so que) (quase )?(ninguem|pouca gente|poucos|pouquissima gente) (esta|ta|tao|estao|ficou|ficaram|percebeu|percebe|sabe|sabem|viu|fala|falam|comenta|conhece|consegue|conseguiu|notou|reparou|entende)\b/.test(N(t))],
  ["existe_um", "Existe um / Tem uma [coisa] que...", (t) => /^(existe|existem|tem um|tem uma)\b/.test(N(t))],
  ["voce_abre", "Você / Se você [situação do espectador]...", (t) => /^(voce|voces|se voce|se voces)\b/.test(N(t))],
  ["pergunta_abre", "Por que / O que / Como [X]? (abre perguntando)", (t) => /^(por que|porque|o que|como|qual|quem|quanto)\b/.test(N(t)) && /\?/.test(t ?? "") && !/^(o que aconteceu com)/.test(N(t))],
  ["volta_tempo_abre", "Em [ano] / Antigamente / Nos anos 90 / Há X anos...", (t) => /^(em (18|19|20)\d\d|antigamente|nos anos|na decada|ha \d+|ha (mais de )?(cem|mil|dez|vinte|trinta|cinquenta|anos)|durante (anos|decadas|seculos)|por (anos|decadas))\b/.test(N(t))],
  ["superlativo_abre", "Uma das / O maior / A maior [X] do mundo...", (t) => /^(uma das|um dos|o maior|a maior|os maiores|as maiores|o mais|a mais)\b/.test(N(t))],
  ["imperativo_abre", "Esquece / Presta atenção / Olha / Pare / Cuidado...", (t) => /^(esquece|esqueca|presta atencao|preste atencao|olha|olhe|pare|para de|cuidado|nunca mais|imagina|imagine|repara)\b/.test(N(t))],
  ["numero_resultado", "[Nome] + [verbo de dinheiro ou resultado] + [número com unidade]", (t) => F.nome_proprio_qualquer(t) && /\d/.test(t ?? "") && /\b(faturou|faturam|fatura|lucrou|vendeu|vende|vendeu|gastou|gasta|pagou|paga|investiu|arrecadou|economizou|perdeu|ganhou|comprou|fechou|demitiu|contratou)\b/.test(N(t))],
];

if (process.argv[1].endsWith("formulas.mjs")) { // só roda a análise quando chamado direto (outros scripts importam FORMULAS)
const res = [];
for (const [id, modelo, fn] of FORMULAS) {
  const pred = (r) => fn(r.g?.hook);
  const coef = avaliar(id, pred), acerto = avaliar(id, pred, { desfecho: "acerto" });
  const rh = avaliar(id, pred, { desfecho: "ret_hook", plats: ["Instagram"], minN: 20 });
  const hv = avaliar(id, (r) => r.hook_video && fn(r.hook_video), { linhas: L.filter((r) => r.hook_video) });
  const top = exemplos(pred, (r) => r.g.hook, { n: 3, linhas: LX });
  const fraco = exemplos(pred, (r) => r.g.hook, { n: 1, pior: true, linhas: LX });
  const pal = LX.filter(pred).map((r) => palavras(r.g.hook)).sort((a, b) => a - b);
  res.push({ id, modelo, coef, acerto, rh, hv, top, fraco, pal_med: pal[Math.floor(pal.length / 2)] });
}
res.sort((a, b) => (b.coef.mh.or ?? 0) - (a.coef.mh.or ?? 0));
const f2 = fmt.f2, sig = (a) => ({ "ajuda (replica)": "AJUDA", "atrapalha (replica)": "ATRAPALHA", "sinal sem replicação": "sinal", "sem evidência": "neutro", "amostra pequena": "peq" })[a.leitura];
for (const x of res) {
  const c = x.coef, t = c.todas;
  console.log(`\n${x.id} | ${x.modelo}\n  rot=${t.roteiros} cli=${t.clientes} n=${t.n} topo ${fmt.pct(t.p)} vs ${fmt.pct(t.p_sem)} | lift ${f2(t.lift)} [${f2(t.lb)}-${f2(t.ub)}] OR ${f2(c.mh.or)} [${f2(c.mh.lo)}-${f2(c.mh.hi)}] d/v ${f2(c.descoberta?.lift)}/${f2(c.validacao?.lift)} IG/TT/YT ${f2(c.Instagram?.lift)}/${f2(c.TikTok?.lift)}/${f2(c.YouTube?.lift)} => ${sig(c)} | acerto ${f2(x.acerto.mh.or)} ${sig(x.acerto)} | ret_hook ${f2(x.rh.mh.or)} (n=${x.rh.todas?.n}) ${sig(x.rh)} | falado ${f2(x.hv.mh.or)} ${sig(x.hv)} | pal.med ${x.pal_med}`);
  for (const e of x.top.slice(0, 2)) console.log(`   + [${e.cliente} | ${e.plataforma} | ${f2(e.coef)}] ${e.texto.replace(/\s+/g, " ").slice(0, 210)}`);
  for (const e of x.fraco) console.log(`   - [${e.cliente} | ${e.plataforma} | ${f2(e.coef)}] ${e.texto.replace(/\s+/g, " ").slice(0, 160)}`);
}
const slim = (a) => ({ lift: a.todas?.lift, lb: a.todas?.lb, ub: a.todas?.ub, n: a.todas?.n, roteiros: a.todas?.roteiros, clientes: a.todas?.clientes, p: a.todas?.p, p_sem: a.todas?.p_sem, or: a.mh.or, or_lo: a.mh.lo, or_hi: a.mh.hi, desc: a.descoberta?.lift, val: a.validacao?.lift, IG: a.Instagram?.lift, TT: a.TikTok?.lift, YT: a.YouTube?.lift, leitura: a.leitura });
writeFileSync(`${OUT}hooks/formulas.json`, JSON.stringify(res.map((x) => ({ id: x.id, modelo: x.modelo, coef: slim(x.coef), acerto: slim(x.acerto), ret_hook: slim(x.rh), falado: slim(x.hv), palavras_mediana: x.pal_med, top: x.top, fraco: x.fraco })), null, 1));
}
