// Características concretas do bloco final (apresentação + comando).
// Dois textos por vídeo:
//   falado  = comando_video (o CTA extraído do vídeo daquela rede; às vezes vem só a última frase)
//   escrito = bloco_final do CRM + o CTA da rede quando o roteiro tem cta_por_plataforma
// Uso: import { L, F } from "./feat.mjs"; cada linha ganha r.ff (falado) e r.fe (escrito).
import { existsSync, readFileSync } from "node:fs";
import { carregar, norm, tokens, palavras, mantelHaenszel, lift, DESFECHOS } from "../lib.mjs";

const PLAT_KEY = { Instagram: ["instagram", "ig"], TikTok: ["tiktok", "tt"], YouTube: ["youtube", "yt"], Facebook: ["facebook", "fb"] };
export const ctaDaRede = (r) => {
  const c = r.g?.cta_por_plataforma;
  if (!c) return "";
  for (const k of PLAT_KEY[r.plataforma] ?? []) if (c[k]) return c[k];
  return (c.geral ?? "").replace(/^\d+\s*[:.)-]\s*/, "");
};
export const falado = (r) => r.comando_video ?? "";
export const escrito = (r) => [r.g?.bloco_final, ctaDaRede(r)].filter(Boolean).join("\n");

// ---------- regex (sobre texto normalizado: minúsculo, sem acento, sem pontuação) ----------
export const RX = {
  cond: /\b(e )?se (voce|vc|tu)\b|\bse (quer|quiser|gosta|curte|curtiu|gostou|ama|acredita|valoriza|faz parte)\b|\bcaso (voce|queira)\b/,
  // construção de promessa: verbo de entrega na 1a pessoa ou verbo do que o espectador ganha
  prom: /\b(te |lhe )?(mostro|revelo|ensino|trago|explico|conto|apresento|analiso|compartilho|destrincho|desvendo|traduzo|descomplico|entrego|resumo|ajudo|decifro|investigo|comparo|exponho)\b|\baqui (voce|tu|eu|a gente)\b|\b(entender|saber|conhecer|aprender|descobrir|receber|acompanhar|ficar por dentro|ficar sabendo|se manter|dominar|enxergar|investir|lucrar|economizar|proteger|ganhar|transformar|construir|vender|crescer|evoluir|ficar atualizad[oa]|se atualizar|liderar|aproveitar|pagar menos|multiplicar|decolar|faturar|conquistar)\b/,
  mais_como_esse: /\b(conteudos?|videos?|historias?|analises?|casos?|materias?|curiosidades?|informacoes?) (como|igual a|iguais a|parecid[oa]s? com) (esse|este|esses|estes|essa|esta|essas|estas)\b|\bmais (conteudos?|videos?|historias?) (assim|desse tipo|desse estilo|nesse estilo)\b/,
  exclusiv: /\bantes (da maioria|de todo mundo|de todos|que todo mundo|dos outros|da concorrencia|do mercado|de (virar|virarem|chegar|chegarem|acontecer|acontecerem|explodir|explodirem|bombar|viralizar|todo mundo|todos|a maioria|sair|sairem|ser|serem|se tornar|se tornarem|ganhar|ganharem|aparecer|aparecerem)|que (vire|virem|chegue|cheguem|aconteca|acontecam|todo mundo|a maioria|seja|sejam|se torne|se tornem|apareca|aparecam|exploda|explodam))\b|\bsair na frente\b|\b(estar|ficar|sempre|um passo) a frente\b|\bna frente (da|de|dos|das)\b|\bminoria\b|\bpoucos (sabem|conhecem|tem acesso|enxergam|entendem)\b|\bprimeir[oa]s? a saber\b|\bprimeira mao\b|\bque ninguem (te )?(conta|fala|mostra|explica|percebe|ve)\b|\bque (a midia|os jornais|a imprensa) nao\b/,
  freq: /\btodos? (os |o )?(santos? )?dias?\b|\bdiariamente\b|\btoda (semana|segunda|terca|quarta|quinta|sexta)\b|\btodas as semanas\b|\bsemanalmente\b|\bdia (apos|a) dia\b/,
  urg: /\bagora\b|\bja (me )?(segue|siga|seguir|segui)\b|\bnao perca tempo\b|\bcorre\b|\bimediatamente\b/,
  nao_perder: /\bnao (perder|perca|perde)\b/,
  proximo: /\bproxim[oa]s? (video|conteudo|historia|episodio|post|parte|capitulo)/,
  // verbos de pedido
  v_segue: /\b(segue|siga|seguir|seguindo|segui|me sigam|follow)\b/,
  v_comenta: /\b(comenta|comente|comentem|comentar|comentarios?|me conta|me diz|me fala|me responde|responde aqui|escreve aqui|deixa (aqui|ai|nos comentarios|sua opiniao|seu comentario))\b/,
  v_salva: /\b(salva|salve|salvar|salvem)\b/,
  v_compart: /\b(compartilha|compartilhe|compartilhar|compartilhem)\b|\b(manda|envia|mande|envie|encaminha|encaminhe)\b.{0,40}\b(amig[oa]s?|alguem|quem|aquele|aquela|pessoa|familia|grupo|socio|chefe|colega|parceir[oa])\b|\bmarca (aquele|aquela|alguem|um amigo|uma amiga|quem|o amigo|a amiga|seu|sua)\b/,
  v_link_bio: /\blink (na|da|no|do) (bio|perfil|descricao)\b|\b(clica|clique|entra|acessa) no link\b|\blink fixado\b/,
  v_inscreve: /\binscrev|\bsininho\b/,
  v_curte: /\b(curte|curta|curtir|curtam)\b|\b(deixa|da|de) (o |seu |um )?(like|joinha)\b/,
  // pergunta de opinião (convida comentário) vs pergunta retórica sobre seguir
  perg_seguir: /(vai|vai continuar|quer|sabe o que|o que voce tem que fazer).{0,80}(segu|perfil)/,
  // apresentação (texto normalizado)
  apres: /\b(eu sou|meu nome e|me chamo|aqui quem fala)\b|(^| )sou (o|a) [a-z]/,
  // credenciais
  c_especialista: /\bespecialista\b/,
  c_cargo: /\b(ceo|fundador|fundadora|founder|cofundador|cofundadora|socio|socia|diretor|diretora|presidente|dono|dona|head|vice presidente|executivo|executiva|conselheiro|conselheira)\b/,
  c_profissao: /\b(advogad[oa]|medic[oa]|economista|engenheir[oa]|professor|professora|educador|educadora|investidor|investidora|jornalista|contador|contadora|consultor|consultora|mentor|mentora|analista|cientista|pesquisador|pesquisadora|historiador|empresari[oa]|empreendedor|empreendedora|piloto|estrategista|tributarista|gestor|gestora|trader|palestrante|criador|criadora)\b/,
  c_feito: /\b(construi|fundei|criei|vendi|faturei|ajudei|atendi|investi|treinei|formei|levei|escalei|ja vendi|ja faturei|ja ajudei|ja atendi|ja criei|ja construi)\b/,
  c_numero: /\b\d+|\b(dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta|cinquenta|cem|mil|milhoes|bilhoes) (anos|empresas|negocios|clientes|alunos|milhoes|bilhoes|mil|paises|livros|startups|lojas|marcas)\b/,
  c_anos: /\b(\d+|um|dois|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta|quarenta) anos (de|no|na|atuando|trabalhando|como|em)\b|\bha (mais de )?(\d+|\w+) anos\b|\bmais de (\d+|\w+) anos\b/,
  c_serial: /\bempreendedor serial\b/,
  c_instituicao: /\b(da|do|na|no) (exame|xp|globo|forbes|harvard|usp|google|itau|btg|bradesco|ambev|ifood|nubank|petrobras|vale|amazon|microsoft|meta|apple|fgv|insper|mit|stanford)\b/,
};

// objeto da promessa (sobre o quê)
export const OBJ = {
  historias: /\bhistori/,
  estrategias: /\bestrategi/,
  bastidores: /\bbastidor|\bpor tras\b|\bsegredo|\bcomo funciona|\bo que ninguem|\bnos bastidores|\bescondid/,
  tecnologia_ia: /\btecnolog|\binteligencia artificial|\b(ia|ias)\b|\binova|\bfuturo\b|\binvenc|\bcriacoes|\brobo|\bstartup/,
  novidades: /\bnovidade|\bnoticia|\batualizad|\bbem informad|\binformad|\bacontecendo/,
  impostos: /\bimpost|\btribut|\bbrecha|\breceita federal|\bfisco\b/,
  dinheiro: /\bdinheiro|\binvest|\bpatrimoni|\bbolso\b|\blucr|\bmercado financeiro|\bfinanc|\briqueza|\bmilion|\bbilion|\brenda\b|\beconomi[az]|\bjuros|\bbolsa\b/,
  negocios: /\bnegocio|\bempresa|\bmarcas?\b|\bempreendedor|\bempresari|\bmarketing|\bvend[aei]|\bgigantes\b|\bcases?\b/,
  mundo_geo: /\bgeopolit|\bpaises\b|\bchina\b|\bchines|\beua\b|\bestados unidos|\bpotencia|\bguerra/,
  carreira: /\bcarreira|\bprofissional|\bemprego|\bsalario|\blideranca|\blider\b/,
  mentalidade: /\blico(es)?\b|\bensinamento|\bmentalidade|\bcabeca d|\bpensa|\bdecis|\bcomportamento|\bpsicolog/,
  beneficio_pessoal: /\b(seu|sua|seus|suas) (proprio |propria )?(dinheiro|negocio|negocios|empresa|carreira|bolso|patrimonio|vida|futuro|familia|saude|resultados?|vendas|lucro|investimentos?|renda|imposto|impostos|filhos|tempo|produtividade)\b|\b(pra|para) (voce|vc|o seu|a sua) (investir|ganhar|lucrar|economizar|crescer|decolar|vender|proteger|pagar|faturar|nao cair|evitar|multiplicar|enriquecer|aplicar|usar|se proteger)\b/,
};

const STOP = new Set(("a o e de da do das dos em no na nos nas um uma uns umas para pra pro por com sem que se ou mas como mais menos muito muita muitos muitas " +
  "eu tu voce vc voces ele ela eles elas nos me te lhe meu minha meus minhas seu sua seus suas nosso nossa teu tua esse essa esses essas este esta estes estas isso isto aquele aquela aqui ai la ja entao agora so tambem ainda sempre " +
  "e sou ser estar esta estao foi era sao tem ter tenho vai vou quer quiser querem gosta gostou curte fazer faz faco ficar fica fique deixa " +
  "segue siga seguir seguindo perfil canal pagina conta proximo proxima video videos conteudo conteudos dica dicas novidade novidades tipo dia dias todo todos toda todas " +
  "perder perca nome chamo assim igual iguais desse deste nesse neste cada ao aos as os pelo pela pelos pelas onde quando qual quais quem porque pq sobre ate").split(" "));

// palavras de conteúdo depois do primeiro verbo de promessa (sem nome do cliente, sem palavra de ação)
export function conteudoApos(t, nomeToks) {
  const m = t.match(RX.prom);
  if (!m) return 0;
  const resto = t.slice(m.index + m[0].length);
  return resto.split(" ").filter((w) => w.length > 2 && !STOP.has(w) && !nomeToks.has(w)).length;
}
export function conteudoTotal(t, nomeToks) {
  return t.split(" ").filter((w) => w.length > 2 && !STOP.has(w) && !nomeToks.has(w)).length;
}

const NOMES_EXTRA = { "Café com Ferri": ["rafael", "ferri", "cafe"], "Rodrigo Waughan": ["vaughan", "volgan", "lemos", "waughan"], "Izabela Anholett": ["isabela", "izabela", "anholett", "anholet"], "Lincoln Fracari": ["fracasso", "fracari"] };
const nomeToksDe = (cliente) => new Set([...tokens(cliente), ...(NOMES_EXTRA[cliente] ?? [])]);

// posição da apresentação em relação à promessa (no texto normalizado)
const apresRx = new Map();
const apresDe = (cliente, nt) => apresRx.get(cliente) ?? apresRx.set(cliente, new RegExp(`${RX.apres.source}|\\b(sou|aqui e) (o |a )?(${[...nt].filter((w) => w.length > 2).join("|")})\\b`)).get(cliente);
function posicaoApres(t, rx) {
  const a = t.search(rx), p = t.search(RX.prom), c = t.search(RX.cond);
  if (a < 0) return "sem";
  const q = [p, c].filter((x) => x >= 0);
  if (!q.length) return "sem_promessa";
  return a < Math.min(...q) ? "antes" : "depois";
}

export function features(raw, cliente) {
  const t = norm(raw);
  const nt = nomeToksDe(cliente);
  const f = { vazio: !t };
  for (const [k, rx] of Object.entries(RX)) f[k] = rx.test(t);
  for (const [k, rx] of Object.entries(OBJ)) f["o_" + k] = rx.test(t);
  f.pergunta = /\?/.test(raw ?? "");
  f.palavras = palavras(raw);
  f.cont_apos = conteudoApos(t, nt);
  f.cont_total = conteudoTotal(t, nt);
  f.prom_esp = f.prom && f.cont_apos >= 3;
  f.cond_prom_esp = f.cond && f.prom_esp;
  f.cond_so = f.cond && !f.prom_esp;
  f.generico = !f.vazio && !f.prom && !f.cond && f.cont_total <= 2;
  f.engaj = f.v_comenta || f.v_compart || f.v_salva || f.v_curte;
  f.comenta_palavra = /\b(comenta|comente|comentar|digita|escreve)\b\s*["“”']?\s*[A-ZÀ-Ú]{3,}/.test(raw ?? "") || /\b(comenta|comente)\b \w+ (que|e) (eu )?(te )?(mando|envio|passo|mandamos|enviamos)/.test(t);
  const arx = apresDe(cliente, nt);
  f.apres = arx.test(t) || /\b[Ss]ou (o |a )?\p{Lu}/u.test(raw ?? "");
  f.pos_apres = posicaoApres(t, arx);
  f.credencial = f.c_especialista || f.c_cargo || f.c_profissao || f.c_feito || f.c_numero || f.c_anos || f.c_instituicao;
  f.faixa = !f.palavras ? "0" : f.palavras <= 8 ? "1-8" : f.palavras <= 15 ? "9-15" : f.palavras <= 25 ? "16-25" : f.palavras <= 40 ? "26-40" : "41+";
  return f;
}

// ---------- bloco final de verdade: o fim da transcrição do vídeo ----------
// comando_video (LLM) corta a apresentação em ~30% dos casos; a transcrição (videos.roteiro) tem tudo.
// Regra: nos últimos 90 tokens, o bloco começa na primeira deixa de CTA (apresentação, "se você quer ... segue",
// "eu te mostro", "segue", ou pergunta de comentário nos últimos 70 tokens).
const TX_PATH = new URL("../../out/comando/transcricao_fim.json", import.meta.url).pathname;
export const TX = existsSync(TX_PATH) ? JSON.parse(readFileSync(TX_PATH, "utf8")) : {};
const INICIO = [
  /^(eu sou|meu nome e|o meu nome e|me chamo|eu me chamo|aqui quem fala)\b/,
  /^(e |entao |mas )?se (voce|vc) (quer|quiser|gosta|curte|curtiu|gostou|ama|e apaixonad|valoriza|acredita|faz parte|tambem quer|tambem gosta|deseja)\b/,
  /^(e )?(aqui |todos os dias |todo dia )?(eu )?te (mostro|ensino|trago|revelo|conto|explico)\b/,
  /^(entao |e |agora )?(ja )?me (segue|siga)\b/,
  /^(entao |e |agora )?(ja )?(segue|siga|sigam) (ja |aqui |ai |la )?(o |a )?(meu|minha|nosso|nossa|esse|este|essa|perfil|canal|pagina|aqui|agora|ai|la|pra|para)\b/,
  /^(agora )?(me conta|comenta|me diz|deixa nos comentarios|deixa aqui nos comentarios)\b/,
];
export function blocoDaTranscricao(tail, cliente) {
  if (!tail) return "";
  const raw = tail.replace(/\s+/g, " ").trim().split(" ");
  const nt = [...nomeToksDe(cliente)].filter((w) => w.length > 2);
  const sou = new RegExp(`^(sou|aqui e) (o |a )?(${nt.join("|")})\\b`);
  const toks = raw.map((w) => norm(w));
  for (let i = Math.max(0, raw.length - 90); i < raw.length; i++) {
    if (!toks[i]) continue;
    const s = toks.slice(i, i + 50).filter(Boolean).join(" ");
    if (!(INICIO.some((rx) => rx.test(s)) || sou.test(s))) continue;
    if (/^(e |entao |mas )?se /.test(s) && !/\b(segu|siga|perfil|inscrev|canal)/.test(s)) continue;
    if (/^(agora )?(me conta|comenta|me diz|deixa)/.test(s) && raw.length - i > 70) continue;
    return raw.slice(i).join(" ");
  }
  return "";
}

// ---------- anexa às linhas ----------
export const L = carregar();
for (const r of L) {
  r.ff = features(falado(r), r.cliente);
  r.fe = features(escrito(r), r.cliente);
  r.falado_tx = blocoDaTranscricao(TX[r.video_id], r.cliente);
  r.ft = features(r.falado_tx, r.cliente);
  r.temCmd = !r.ff.vazio;
}

// ---------- variantes de controle ----------
// 1) MH estratificado também pelo quartil de viralização (seguidores por mil anda com viralizar no IG)
export const mhCtrlViral = (linhas, pred, desfecho) =>
  mantelHaenszel(linhas.map((r) => ({ ...r, estrato: `${r.estrato}|${Math.min(3, Math.floor((r.pq ?? 0) * 4))}` })), pred, DESFECHOS[desfecho]);
// 2) seguidores com percentil por cliente x plataforma x trimestre (tira deriva de conversão no tempo)
{
  const g = new Map();
  for (const r of L) if (r.seg_por_mil != null) { const k = `${r.estrato}|${r.tri}`; (g.get(k) ?? g.set(k, []).get(k)).push(r); }
  for (const grupo of g.values()) {
    if (grupo.length < 8) continue;
    grupo.sort((a, b) => a.seg_por_mil - b.seg_por_mil);
    for (let i = 0; i < grupo.length; ) { let j = i; while (j + 1 < grupo.length && grupo[j + 1].seg_por_mil === grupo[i].seg_por_mil) j++; const p = (i + j) / 2 / (grupo.length - 1); for (let t = i; t <= j; t++) grupo[t].p_seg_tri = p; i = j + 1; }
  }
}
export const segTri = (r) => (r.p_seg == null ? null : (r.p_seg_tri ?? r.p_seg) >= 0.75 ? 1 : 0);
export const mhSegTri = (linhas, pred) => mantelHaenszel(linhas, pred, segTri);
export { lift };

// self-check
if (process.argv[1]?.endsWith("feat.mjs")) {
  const ok = (c, m) => { if (!c) { console.error("FALHOU:", m); process.exitCode = 1; } };
  const a = features("Eu sou Marcio Grazino, e se você quer conhecer histórias de pessoas que resolveram problemas reais, segue o meu perfil agora.", "Marcio Grazino");
  ok(a.cond && a.prom_esp && a.apres && a.urg && a.o_historias && a.pos_apres === "antes" && !a.generico, "caso 1");
  const b = features("Então me segue para não perder o próximo vídeo.", "Izabela Anholett");
  ok(b.generico && b.nao_perder && !b.prom && !b.apres && b.faixa === "9-15", "caso 2");
  const c = features("Comenta “EXAME” que eu te envio o link", "Izabela Anholett");
  ok(c.comenta_palavra && c.v_comenta, "caso 3");
  const d = features("Se você quiser conhecer mais histórias como essa, segue meu perfil. Pois é, sou Rodrigo, empreendedor serial.", "Rodrigo Waughan");
  ok(d.pos_apres === "depois" && d.c_serial, "caso 4");
  ok(features("manda esse vídeo para aquele amigo que precisa ouvir isso", "x").v_compart, "caso 5");
  console.log("self-check ok | linhas", L.length);
}
