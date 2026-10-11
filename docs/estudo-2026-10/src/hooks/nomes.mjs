// Nomes próprios mais frequentes nos hooks (sequências de palavras com maiúscula fora do início de frase).
import { carregar, DESFECHOS, mantelHaenszel, fmt } from "../lib.mjs";
const L = carregar().filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
const por = new Map();
for (const r of L) if (!por.has(r.script_id)) por.set(r.script_id, r);
export function nomesProprios(txt) {
  const out = new Set();
  for (const fr of (txt ?? "").split(/(?<=[.!?…:])\s+/)) {
    const w = fr.split(/\s+/);
    let cur = [];
    const flush = () => { if (cur.length) out.add(cur.join(" ").replace(/[.,;:!?…"“”'()]+$/g, "")); cur = []; };
    w.forEach((x, i) => {
      const limpo = x.replace(/^["“'(]+/, "");
      const cap = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}'’\-&.]*[\p{L}]/u.test(limpo) || /^[A-Z]{2,}/.test(limpo);
      if (cap && (i > 0 || cur.length)) { cur.push(limpo.replace(/[.,;:!?…"”')]+$/g, "")); if (/[.,;:!?…"”)]$/.test(x)) flush(); }
      else if (/^(de|da|do|dos|das|e)$/.test(limpo) && cur.length) cur.push(limpo);
      else { while (cur.length && /^(de|da|do|dos|das|e)$/.test(cur[cur.length - 1])) cur.pop(); flush(); }
    });
    while (cur.length && /^(de|da|do|dos|das|e)$/.test(cur[cur.length - 1])) cur.pop();
    flush();
  }
  return out;
}
if (process.argv[1].endsWith("nomes.mjs")) {
  const cont = new Map();
  for (const r of por.values()) for (const n of nomesProprios(r.g.hook)) cont.set(n, (cont.get(n) ?? 0) + 1);
  const y = DESFECHOS.coef;
  const lista = [...cont].filter(([, c]) => c >= 6).sort((a, b) => b[1] - a[1]);
  console.log("nomes distintos com >=6 roteiros:", lista.length);
  const linhas = lista.slice(0, 120).map(([n, c]) => {
    const pred = (r) => nomesProprios(r.g.hook).has(n);
    const sel = L.filter(pred);
    const p = sel.reduce((s, r) => s + y(r), 0) / sel.length;
    const mh = mantelHaenszel(L, pred, y);
    return `${n}:${c}:${fmt.pct(p)}:${fmt.f2(mh.or)}`;
  });
  console.log(linhas.join(" | "));
}
