// Amostra dirigida: clientes pouco vistos + subhook, para fechar as listas de subhook e conclusão.
import { carregar } from "../lib.mjs";
const L = carregar();
const alvo = (process.argv[2] ?? "Patrick Diorio,João Felipe Marques,Leonardo Martins,Café com Ferri,Drielle Castelani,Lincoln Fracari,Izabela Anholett,Leonardo Nogueira,Ricardo Schumacher,Thiago Franco").split(",");
const cut = (t, n) => (t ?? "").replace(/\s+/g, " ").slice(0, n);
const vistos = new Set();
for (const c of alvo) {
  const rs = L.filter((r) => r.cliente === c).sort((a, b) => b.pq - a.pq);
  for (const r of [rs[0], rs[Math.floor(rs.length / 2)]].filter(Boolean)) {
    if (vistos.has(r.script_id)) continue; vistos.add(r.script_id);
    console.log(`\n## pq=${r.pq.toFixed(2)} ${r.plataforma} | ${c}\nT: ${cut(r.s?.titulo, 100)}\nH: ${cut(r.g?.hook, 220)}\nS: ${cut(r.g?.subhook, 220)}\nC: ${cut(r.g?.conclusao, 220)}`);
  }
}
