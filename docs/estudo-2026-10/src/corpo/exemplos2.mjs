// Exemplos finais para o relatório: trecho certo de cada achado, topo e fundo.
// Para achados de retenção, ordena por percentil de ret_final_cond no Instagram.
import { carregar, salvar, frases, fmt } from "./h.mjs";
import { f } from "./feat.mjs";
const L = carregar();
const sa = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const limpa = (s) => (s ?? "").replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim(); // sem travessão na saída
const B = "(?<![\\p{L}\\p{N}])", E = "(?![\\p{L}\\p{N}])";
const ANT = new RegExp(`${B}não (?:é|são|foi|era|está|estão|eram|seria)${E} [^.!?;\\n]{1,60}?[,.;:]\\s*(?:e sim |mas sim |mas |e )?(?:é|são|foi|era|está|estão|eram|seria)${E}[^.!?\\n]{0,80}`, "iu");

// trecho: frase (ou frase + seguinte) do texto que casa com re (re testada sem acento, ou re bruta com {raw:true})
function trecho(texto, re, { raw = false, mais = 0 } = {}) {
  for (const p of (texto ?? "").split("\n")) {
    if (raw) { const m = p.match(re); if (m) return limpa(m[0]); continue; }
    const fs = frases(p);
    for (let i = 0; i < fs.length; i++) if (re.test(sa(fs[i]))) return limpa(fs.slice(i, i + 1 + mais).join(" "));
  }
  return null;
}
function ex(pred, campo, { n = 3, pior = false, ret = false } = {}) {
  let sel = L.filter((r) => pred(r) && (!ret || (r.plataforma === "Instagram" && r.p_ret_final_cond != null)));
  const k = ret ? (r) => r.p_ret_final_cond : (r) => r.pq;
  sel.sort((a, b) => (pior ? k(a) - k(b) || a.coef - b.coef : k(b) - k(a) || b.coef - a.coef));
  const vistos = new Set(), out = [];
  for (const r of sel) {
    if (vistos.has(r.script_id)) continue;
    const t = campo(r);
    if (!t) continue;
    vistos.add(r.script_id);
    out.push({ texto: t, cliente: r.cliente, plataforma: r.plataforma, coef: +r.coef.toFixed(2), ...(ret ? { ret_final_cond: r.ret_final_cond != null ? +(+r.ret_final_cond).toFixed(1) : null } : {}) });
    if (out.length >= n) break;
  }
  return out;
}
const c = (re) => (r) => re.test(f(r).corpo_sem);
const k = (re) => (r) => re.test(f(r).conc_sem);
const corpo = (r) => r.g.corpo, conc = (r) => limpa(r.g.conclusao), falado = (r) => [r.g.hook, r.g.subhook, r.g.corpo, r.g.conclusao].join("\n");
const ORD = /(?:^|[.!?\n]\s*)(e )?(primeiro|segundo|terceiro|primeira|segunda|terceira)\s*[:,…]|\bem (primeiro|segundo|terceiro) lugar\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]) (e|foi|era)\b/g;
const BIO = /\b(nasceu (em|no|na)|que nasceu|cresceu (em|no|na)|trabalhava (como|em|numa|num)|no inicio|desde (pequeno|crianca|cedo|jovem)|ele percebeu|ela percebeu|percebeu que|foi nesse (momento|cenario|contexto|periodo)|foi ai que|foi quando|foi entao que|tudo comecou)\b/;
const BIOg = new RegExp(BIO.source, "g");
const parasE = (r) => { const ps = corpo(r).split("\n"); for (let i = 1; i < ps.length; i++) if (/^E\s/.test(ps[i])) return limpa(ps[i - 1].slice(-140) + " / " + ps[i].slice(0, 160)); return null; };

const X = {
  // corpo, coef
  ou_seja: ex((r) => (r.g.corpo ?? "").split("\n").some((p) => frases(p).some((s) => /^ou seja\b/.test(sa(s)))), (r) => trecho(corpo(r), /^ou seja\b/), { n: 4 }),
  ou_seja_pior: ex((r) => (r.g.corpo ?? "").split("\n").some((p) => frases(p).some((s) => /^ou seja\b/.test(sa(s)))), (r) => trecho(corpo(r), /^ou seja\b/), { n: 2, pior: true }),
  pra_voce_ter_ideia: ex(c(/\b(pra|para) (voce|vc) ter (uma )?(ideia|nocao)\b/), (r) => trecho(corpo(r), /\b(pra|para) (voce|vc) ter (uma )?(ideia|nocao)\b/), { n: 3 }),
  detalhe: ex(c(/\b(o detalhe e que|detalhe:|o detalhe:)/), (r) => trecho(corpo(r), /\bdetalhe\b/), { n: 3 }),
  enumeracao: ex((r) => (f(r).corpo_sem.match(ORD) ?? []).length >= 2, (r) => trecho(corpo(r), /^(e )?(primeiro|segundo|terceiro|primeira|segunda|terceira)\b|\bem (primeiro|segundo|terceiro) lugar|\b(o|a) (primeir|segund|terceir)/, { mais: 1 }), { n: 3 }),
  pergunta_corpo: ex((r) => /\?/.test(r.g.corpo ?? ""), (r) => trecho(corpo(r), /\?/), { n: 3 }),
  um_ano: ex((r) => f(r).anos === 1, (r) => trecho(corpo(r), /\b(1[5-9]|20)\d\d\b/), { n: 3 }),
  nomes: ex((r) => f(r).nomes100 >= 6.8, (r) => { for (const p of corpo(r).split("\n")) for (const s of frases(p)) if ((s.split(/\s+/).slice(1).filter((x) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}]+/u.test(x)).length) >= 3) return limpa(s); return null; }, { n: 3 }),
  // corpo, negativos
  biografia: ex((r) => (f(r).corpo_sem.match(BIOg) ?? []).length >= 2, (r) => { const out = []; for (const p of corpo(r).split("\n")) for (const s of frases(p)) if (BIO.test(sa(s)) && out.length < 2) out.push(limpa(s)); return out.join(" / ") || null; }, { n: 3, pior: true }),
  foi_ai_que: ex(c(/\bfoi (ai|entao|quando) que\b|\bfoi quando\b/), (r) => trecho(corpo(r), /\bfoi (ai|entao|quando) que\b|\bfoi quando\b/), { n: 3, pior: true }),
  // corpo, retenção final (IG)
  anos_depois_ret: ex(c(/\b(anos|meses|dias|decadas|semanas) depois\b/), (r) => trecho(corpo(r), /\b(anos|meses|dias|decadas|semanas) depois\b/), { n: 3, ret: true }),
  ate_que_ret: ex(c(/\bate que\b/), (r) => trecho(corpo(r), /\bate que\b/), { n: 3, ret: true }),
  voce_corpo_ret_pior: ex((r) => f(r).voce100 >= 0.6, (r) => trecho(corpo(r), /\bvoce\b/), { n: 3, ret: true, pior: true }),
  // estilo
  antitese2_ret_pior: ex((r) => f(r).antitese >= 2, (r) => trecho(falado(r), ANT, { raw: true }), { n: 3, ret: true, pior: true }),
  antitese_coef_top: ex((r) => f(r).antitese >= 1, (r) => trecho(falado(r), ANT, { raw: true }), { n: 3 }),
  eliptica_compart: ex((r) => f(r).elipticas >= 1, (r) => trecho(falado(r), /^(e )?((o|a|os|as) )?[a-z]+( [a-z]+)?\?$/, { mais: 1 }), { n: 3, pior: true }),
  paragrafo_E: ex((r) => f(r).frac_para_e >= 0.15, parasE, { n: 3 }),
  // conclusão
  c_enquanto: ex(k(/^(e )?enquanto\b/), conc, { n: 3 }),
  c_retomada: ex((r) => f(r).conc_overlap_hook >= 0.2, (r) => `HOOK: ${limpa(r.g.hook)} || CONCLUSÃO: ${conc(r)}`, { n: 3 }),
  c_nem_sempre: ex(k(/\bnem sempre\b/), conc, { n: 3 }),
  c_era_hoje: ex(k(/\b(era|eram|tinha|vendia|valia)\b[\s\S]*\b(hoje|agora)\b|\b(hoje|agora)\b[\s\S]*\b(era|eram)\b/), conc, { n: 3 }),
  c_mundo: ex(k(/\b(mundo inteiro|do mundo|no mundo|planeta)\b/), conc, { n: 3 }),
  c_pode_ser_pior: ex(k(/\bpode ser\b|\btalvez\b/), conc, { n: 2, pior: true }),
  c_diferenca_pior: ex(k(/\b(a|essa|toda a) diferenca\b/), conc, { n: 2, pior: true }),
  c_voce_precisa_pior: ex(k(/\b(precisa|precisamos|presta atencao|preste atencao|fique atento|atencao)\b/), conc, { n: 2, pior: true }),
  c_curta_pior: ex((r) => f(r).conc_palavras <= 15, conc, { n: 2, pior: true }),
  c_licao_pior: ex(k(/\blic(ao|oes)\b/), conc, { n: 2, pior: true }),
  c_quem_ret_pior: ex(k(/(^|[.!?]\s+|\b(e|mas|porque) )quem [^,.?!]{2,60}, [^.?!]{2,90}/), conc, { n: 2, ret: true, pior: true }),
  c_personagem_ret: ex(k(/\b(ele|ela|dele|dela)\b/), conc, { n: 3, ret: true }),
};
// comentários: ordena por percentil de comentários
function exCom(pred, campo, n = 3) {
  const sel = L.filter((r) => pred(r) && r.p_coment != null).sort((a, b) => b.p_coment - a.p_coment || b.coment_por_mil - a.coment_por_mil);
  const vistos = new Set(), out = [];
  for (const r of sel) { if (vistos.has(r.script_id)) continue; vistos.add(r.script_id); out.push({ texto: campo(r), cliente: r.cliente, plataforma: r.plataforma, coef: +r.coef.toFixed(2), coment_por_mil: r.coment_por_mil != null ? +(+r.coment_por_mil).toFixed(1) : null }); if (out.length >= n) break; }
  return out;
}
X.c_opiniao_coment = exCom(k(/\b(o que voce acha|voce (acha|concorda|faria|teria|compraria|usaria|aceitaria|trocaria|confiaria|pagaria|deixaria)|e voce\?|e pra voce|qual (seria|e) a sua)\b/), conc);
X.c_brasil_coment = exCom(k(/\b(brasil|brasileir\w*|pais|governo)\b/), conc);
X.c_eu_coment = exCom(k(/\beu\b/), conc);
salvar("exemplos.json", X);
for (const [kx, v] of Object.entries(X)) { console.log(`\n## ${kx}`); for (const e of v) console.log(`  ${e.cliente} | ${e.plataforma} | coef ${fmt.f2(e.coef)}${e.ret_final_cond != null ? ` | ret_final_cond ${e.ret_final_cond}` : ""}${e.coment_por_mil != null ? ` | coment/mil ${e.coment_por_mil}` : ""} | ${e.texto?.slice(0, 330)}`); }
