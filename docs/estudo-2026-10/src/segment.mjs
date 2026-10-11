// Segmenta cada roteiro escrito (CRM) em partes, sem LLM. Saída: data/segmentos.json
// hook = 1º parágrafo falado; subhook = 2º; conclusão = parágrafo(s) antes do bloco final
// (apresentação + comando); corpo = o meio. Linhas de nota/legenda/link/rótulo de cena saem.
import { readFileSync, writeFileSync } from "node:fs";
const S = JSON.parse(readFileSync("data/scripts.json", "utf8"));

const META = /^(\*+)?\s*(nota|obs\b|observa|legenda|headline|t[ií]tulo|link|fonte|refer[eê]ncia|modelagem|grava|edi[cç][aã]o|editor|b-?roll|cena|texto na tela|lettering|insert|tela:|thumb|capa|v[ií]deo de refer|https?:\/\/|www\.|\[|\(|#)/i;
const CTA_LABEL = /^cta\s*(instagram|tiktok|youtube|facebook|ig|tt|yt)?\s*[:\-]?/i;
const ACAO = /\b(me segue|segue (o |a )?(meu |nosso |esse |este )?(perfil|canal|p[aá]gina|gente)|j[aá] (me )?segue|segue (pra|para|aqui|agora)|siga|seguir (o |a )?(meu |nosso )?(perfil|canal)|inscrev|comenta|comente|compartilh|manda (esse|este) (v[ií]deo|conte[uú]do)|manda (pra|para) (aquele|quem|um)|envia (esse|este)|salva (esse|este)|salve (esse|este)|ativa o sininho|link na bio)/i;
const VARIANTE = /^(hook|gancho|op[cç][aã]o|vers[aã]o)\s*\d+\s*[:\-.)]\s*/i;
const APRESENT = /\b([Ee]u sou (o |a )?[A-ZÁÉÍÓÚ]|[Mm]eu nome [eé]|[Ss]ou (o|a) [A-ZÁÉÍÓÚ][a-zà-ú]+|[Aa]qui (é|e) (o|a) [A-ZÁÉÍÓÚ])/;
const palavras = (t) => (t.match(/[\p{L}\p{N}]+(?:[.,][\p{N}]+)?/gu) ?? []).length;

const out = S.map((s) => {
  const linhas = (s.texto ?? "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const ctaPlat = {};
  const P = [];
  const variantes = [];
  for (const l of linhas) {
    const vm = l.match(VARIANTE);
    if (vm) { variantes.push(l.slice(vm[0].length).trim()); if (variantes.length === 1) P.push(l.slice(vm[0].length).trim()); continue; }
    const m = l.match(CTA_LABEL);
    if (m && m[0].length < l.length) { ctaPlat[(m[1] ?? "geral").toLowerCase()] = l.slice(m[0].length).trim(); continue; }
    if (META.test(l)) continue;
    if (palavras(l) < 2) continue;
    P.push(l);
  }
  // bloco final: a partir do 1º dos 3 últimos parágrafos com ação de comando ou apresentação
  let fim = P.length;
  for (let i = Math.max(2, P.length - 3); i < P.length; i++) {
    if (ACAO.test(P[i]) || APRESENT.test(P[i])) { fim = i; break; }
  }
  const hook = P[0] ?? "";
  const subhook = P[1] ?? "";
  const sub2 = P[2] ?? "";
  const conclusao = fim - 1 >= 3 ? P[fim - 1] : "";
  const conclusao2 = fim - 2 >= 3 ? P[fim - 2] : "";
  const corpo = P.slice(2, Math.max(2, fim - 1)).join("\n");
  const blocoFinal = P.slice(fim).join("\n");
  const apresentacao = (blocoFinal.match(/[^.!?\n]*\b(eu sou|meu nome [eé]|sou (o|a) [A-ZÁÉÍÓÚ])[^.!?\n]*[.!?]?/i) ?? [""])[0].trim();
  return {
    script_id: s.script_id,
    hook, subhook, sub2, corpo, conclusao, conclusao2,
    bloco_final: blocoFinal,
    apresentacao,
    cta_por_plataforma: Object.keys(ctaPlat).length ? ctaPlat : null,
    hook_variantes: variantes.length > 1 ? variantes : null,
    n_paragrafos: P.length,
    palavras_total: palavras(P.join(" ")),
    palavras_hook: palavras(hook),
    palavras_subhook: palavras(subhook),
    palavras_conclusao: palavras(conclusao),
    palavras_bloco_final: palavras(blocoFinal),
    tem_bloco_final: fim < P.length,
  };
});
writeFileSync("data/segmentos.json", JSON.stringify(out));
const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
console.log({
  n: out.length,
  sem_bloco_final: out.filter((o) => !o.tem_bloco_final).length,
  com_cta_plataforma: out.filter((o) => o.cta_por_plataforma).length,
  com_variantes_hook: out.filter((o) => o.hook_variantes).length,
  med_palavras: med(out.map((o) => o.palavras_total)),
  med_hook: med(out.map((o) => o.palavras_hook)),
  med_sub: med(out.map((o) => o.palavras_subhook)),
  med_conc: med(out.map((o) => o.palavras_conclusao)),
  med_final: med(out.map((o) => o.palavras_bloco_final)),
});
for (const o of out.sort(() => Math.random() - 0.5).slice(0, 3)) console.log("\n---\nHOOK:", o.hook, "\nSUB:", o.subhook, "\nCONC:", o.conclusao, "\nFINAL:", o.bloco_final, "\nAPRES:", o.apresentacao);
