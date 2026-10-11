// Tarefa 3: repetição e novidade. Para cada roteiro, o quão parecido ele é com roteiros ANTERIORES
// do mesmo cliente e de outros clientes, e se o anterior parecido foi topo ou fraco.
import { writeFileSync } from "node:fs";
import { carregar, avaliar, tabela, mantelHaenszel, DESFECHOS, ler, OUT, fmt } from "../lib.mjs";
import { E3072, N, POS, truncar, matrizSim, infoRoteiros, dias } from "./base.mjs";

export const T_CLI = 0.80;  // mesmo território dentro do cliente: ~3% mais similares (p97 dos pares do cliente = 0,799)
export const T_OUT = 0.76;  // mesmo tema entre clientes: p99,5 dos pares entre clientes (estilo diferente baixa o cosseno)

export function features() {
  const L = carregar();
  const info = infoRoteiros(L);
  const entregue = new Map(ler("scripts.json").map((s) => [s.script_id, s.entregue]));
  const S = matrizSim(truncar(E3072, 3072, 768), 768);
  const pqs = info.map((x) => x.pqMedio).filter((x) => x != null).sort((a, b) => a - b);
  const Q25 = pqs[Math.floor(0.25 * (pqs.length - 1))], Q75 = pqs[Math.floor(0.75 * (pqs.length - 1))];
  const classe = (p) => (p == null ? null : p >= Q75 ? "topo" : p <= Q25 ? "fraco" : "meio");
  const porCli = new Map();
  for (const x of info) (porCli.get(x.cliente) ?? porCli.set(x.cliente, []).get(x.cliente)).push(x);
  const F = new Map();
  for (const x of info) {
    const i = x.i, ent = entregue.get(x.id);
    const f = { nPrev: 0, simCli: null, gapCli: null, simCli90: null, nRep: 0, hit: null, flop: null, simOut: null, outHit: null, outFlop: null, outHitMesmoMacro: null };
    for (const y of porCli.get(x.cliente)) {
      if (y.data >= x.data) continue;
      const s = S[i * N + y.i];
      f.nPrev++;
      if (f.simCli == null || s > f.simCli) { f.simCli = s; f.gapCli = dias(y.data, x.data); }
      if (dias(y.data, x.data) <= 90 && (f.simCli90 == null || s > f.simCli90)) f.simCli90 = s;
      if (s >= T_CLI) f.nRep++;
      // resultado conhecido: o anterior já estava no ar quando este roteiro foi entregue
      if (y.data < ent && s >= T_CLI) {
        const c = classe(y.pqMedio);
        if (c === "topo" && (!f.hit || s > f.hit.sim)) f.hit = { sim: s, j: y.i, gap: dias(y.data, x.data) };
        if (c === "fraco" && (!f.flop || s > f.flop.sim)) f.flop = { sim: s, j: y.i, gap: dias(y.data, x.data) };
      }
    }
    // quantas vezes o acerto já tinha sido repetido antes deste (mesmo cliente, entre o acerto e este, parecidos com o acerto)
    if (f.hit) {
      const h = info[f.hit.j];
      f.hit.repeticoes = porCli.get(x.cliente).filter((y) => y.data > h.data && y.data < x.data && S[h.i * N + y.i] >= T_CLI).length;
    }
    for (let j = 0; j < N; j++) {
      const y = info[j];
      if (y.cliente === x.cliente || y.data >= x.data) continue;
      const s = S[i * N + j];
      if (f.simOut == null || s > f.simOut) f.simOut = s;
      if (s >= T_OUT && y.data < ent) {
        const c = classe(y.pqMedio);
        if (c === "topo" && (!f.outHit || s > f.outHit.sim)) f.outHit = { sim: s, j };
        if (c === "fraco" && (!f.outFlop || s > f.outFlop.sim)) f.outFlop = { sim: s, j };
      }
    }
    F.set(x.id, f);
  }
  return { L, info, S, F, Q25, Q75 };
}

if (process.argv[1]?.endsWith("t3_repeticao.mjs") && process.argv[2] !== "extra") {
  const { L, info, F, Q25, Q75 } = features();
  const f = (r) => F.get(r.script_id);
  console.log(`quartis do pq médio por roteiro: fraco <= ${fmt.f2(Q25)}, topo >= ${fmt.f2(Q75)}`);
  const vals = info.map((x) => F.get(x.id)).filter((x) => x.nPrev >= 20).map((x) => x.simCli).sort((a, b) => a - b);
  console.log("simCli (com >=20 anteriores): p10/p25/p50/p75/p90 =", [0.1, 0.25, 0.5, 0.75, 0.9].map((p) => vals[Math.floor(p * (vals.length - 1))].toFixed(3)).join(" / "));
  const ok = (r) => f(r)?.nPrev >= 20; // histórico mínimo para "máximo parecido" ser comparável
  const A = [];
  // 1) quão parecido com o que o próprio cliente já fez
  for (const [lo, hi] of [[0, 0.78], [0.78, 0.80], [0.80, 0.82], [0.82, 0.84], [0.84, 0.87], [0.87, 1.01]])
    A.push(avaliar(`maior sim c/ anterior do cliente ${lo}-${hi}`, (r) => ok(r) && f(r).simCli >= lo && f(r).simCli < hi));
  for (const [lo, hi] of [[0, 1], [1, 2], [2, 4], [4, 8], [8, 999]])
    A.push(avaliar(`anteriores do cliente com sim>=0,80: ${lo}${hi > 900 ? "+" : `-${hi - 1}`}`, (r) => ok(r) && f(r).nRep >= lo && f(r).nRep < hi));
  // 2) parecido com anterior topo x anterior fraco (resultado já conhecido na entrega)
  const cat = (r) => { const x = f(r); if (!x) return null; if (x.hit && (!x.flop || x.hit.sim >= x.flop.sim)) return "acerto"; if (x.flop) return "fraco"; return "nenhum"; };
  A.push(avaliar("parecido (>=0,80) com acerto anterior do cliente", (r) => cat(r) === "acerto"));
  A.push(avaliar("parecido (>=0,80) com fraco anterior do cliente", (r) => cat(r) === "fraco"));
  A.push(avaliar("sem anterior parecido de resultado conhecido", (r) => cat(r) === "nenhum"));
  // 3) quantas vezes o acerto já tinha sido repetido / distância do acerto
  for (const [lo, hi] of [[0, 1], [1, 2], [2, 4], [4, 999]])
    A.push(avaliar(`repete acerto, ${lo}${hi > 900 ? "+" : hi - lo > 1 ? `-${hi - 1}` : ""} repetições antes`, (r) => cat(r) === "acerto" && f(r).hit.repeticoes >= lo && f(r).hit.repeticoes < hi));
  for (const [lo, hi] of [[0, 21], [21, 45], [45, 90], [90, 999]])
    A.push(avaliar(`repete acerto postado ${lo}-${hi} dias antes`, (r) => cat(r) === "acerto" && f(r).hit.gap >= lo && f(r).hit.gap < hi));
  // 4) transferência entre contas
  const out = (r) => { const x = f(r); if (!x) return null; if (x.outHit && (!x.outFlop || x.outHit.sim >= x.outFlop.sim)) return "acerto"; if (x.outFlop) return "fraco"; return "nenhum"; };
  A.push(avaliar("parecido (>=0,76) com acerto anterior de OUTRO cliente", (r) => out(r) === "acerto"));
  A.push(avaliar("parecido (>=0,76) com fraco anterior de OUTRO cliente", (r) => out(r) === "fraco"));
  A.push(avaliar("sem análogo em outro cliente", (r) => out(r) === "nenhum"));
  for (const [lo, hi] of [[0, 0.72], [0.72, 0.74], [0.74, 0.76], [0.76, 0.78], [0.78, 1.01]])
    A.push(avaliar(`maior sim c/ anterior de outro cliente ${lo}-${hi}`, (r) => f(r)?.simOut != null && f(r).simOut >= lo && f(r).simOut < hi));
  console.log(tabela(A));

  // controle por território: o efeito de "repetir acerto" sobrevive dentro do mesmo cluster?
  const cl = new Map(ler("clusters.json").map((c) => [c.script_id, c]));
  const y = DESFECHOS.coef, base = L.filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
  const comTerr = base.map((r) => ({ ...r, estrato: `${r.estrato}|${cl.get(r.script_id)?.c30}` }));
  for (const [nome, p] of [["acerto", (r) => cat(r) === "acerto"], ["fraco", (r) => cat(r) === "fraco"], ["acerto vs fraco", (r) => cat(r) === "acerto"]]) {
    const linhas = nome === "acerto vs fraco" ? comTerr.filter((r) => ["acerto", "fraco"].includes(cat(r))) : comTerr;
    const mh = mantelHaenszel(linhas, p, y);
    console.log(`MH controlando cliente x plataforma x território (k=30), ${nome}: OR ${fmt.f2(mh.or)} [${fmt.f2(mh.lo)} a ${fmt.f2(mh.hi)}]`);
  }
  const outT = (r) => out(r) === "acerto";
  const mhO = mantelHaenszel(comTerr, outT, y);
  console.log(`MH com território, acerto de outro cliente: OR ${fmt.f2(mhO.or)} [${fmt.f2(mhO.lo)} a ${fmt.f2(mhO.hi)}]`);
  writeFileSync(OUT + "embeddings/repeticao.json", JSON.stringify(A.map((a) => ({ nome: a.nome, leitura: a.leitura, n: a.todas?.n, roteiros: a.todas?.roteiros, lift: a.todas?.lift, lb: a.todas?.lb, ub: a.todas?.ub, or: a.mh.or, lo: a.mh.lo, hi: a.mh.hi, desc: a.descoberta?.lift, val: a.validacao?.lift, ig: a.Instagram?.lift, tt: a.TikTok?.lift, yt: a.YouTube?.lift })), null, 1));
}

// Checagens extras (rodar com: node src/embeddings/t3_repeticao.mjs extra)
if (process.argv[1]?.endsWith("t3_repeticao.mjs") && process.argv[2] === "extra") {
  const { L, info, S, F, Q25, Q75 } = features();
  const f = (r) => F.get(r.script_id);
  const cat = (r) => { const x = f(r); if (!x) return null; if (x.hit && (!x.flop || x.hit.sim >= x.flop.sim)) return "acerto"; if (x.flop) return "fraco"; return "nenhum"; };
  const A = [];
  // repetições x distância
  for (const [rn, rp] of [["1ª repetição", (h) => h.repeticoes === 0], ["2ª em diante", (h) => h.repeticoes >= 1]])
    for (const [gn, gp] of [["<=21d", (g) => g < 21], ["21-90d", (g) => g >= 21 && g < 90], [">=90d", (g) => g >= 90]])
      A.push(avaliar(`acerto, ${rn}, ${gn}`, (r) => cat(r) === "acerto" && rp(f(r).hit) && gp(f(r).hit.gap)));
  // robustez: anterior classificado pelo pq na MESMA rede do vídeo atual
  const pqRede = new Map(); for (const r of L) pqRede.set(`${r.script_id}|${r.plataforma}`, r.pq);
  const entregue = new Map(ler("scripts.json").map((s) => [s.script_id, s.entregue]));
  const porCli = new Map(); for (const x of info) (porCli.get(x.cliente) ?? porCli.set(x.cliente, []).get(x.cliente)).push(x);
  const memo = new Map();
  const catRede = (r) => {
    const k = `${r.script_id}|${r.plataforma}`;
    if (memo.has(k)) return memo.get(k);
    const x = info[POS.get(r.script_id)], ent = entregue.get(r.script_id);
    let best = null;
    for (const y of porCli.get(x.cliente)) {
      if (y.data >= ent) continue;
      const s = S[x.i * N + y.i], p = pqRede.get(`${y.id}|${r.plataforma}`);
      if (s < T_CLI || p == null) continue;
      if (!best || s > best.s) best = { s, c: p >= 0.75 ? "acerto" : p <= 0.25 ? "fraco" : "meio" };
    }
    const c = best?.c ?? "nenhum"; memo.set(k, c); return c;
  };
  A.push(avaliar("ROBUSTEZ mesma rede: mais parecido anterior foi topo na rede", (r) => catRede(r) === "acerto"));
  A.push(avaliar("ROBUSTEZ mesma rede: mais parecido anterior foi fraco na rede", (r) => catRede(r) === "fraco"));
  // transferência: mesmo macro nicho x outro macro
  const macro = new Map(L.map((r) => [r.cliente, r.macro]));
  const outCat = (r) => { const x = f(r); if (!x?.outHit || (x.outFlop && x.outFlop.sim > x.outHit.sim)) return null; return macro.get(info[x.outHit.j].cliente) === r.macro ? "mesmo" : "outro"; };
  A.push(avaliar("acerto de outro cliente do MESMO macro nicho", (r) => outCat(r) === "mesmo"));
  A.push(avaliar("acerto de outro cliente de OUTRO macro nicho", (r) => outCat(r) === "outro"));
  console.log(tabela(A));
  writeFileSync(OUT + "embeddings/repeticao_extra.json", JSON.stringify(A.map((a) => ({ nome: a.nome, leitura: a.leitura, n: a.todas?.n, roteiros: a.todas?.roteiros, p: a.todas?.p, lift: a.todas?.lift, or: a.mh.or, lo: a.mh.lo, hi: a.mh.hi, desc: a.descoberta?.lift, val: a.validacao?.lift, ig: a.Instagram?.lift, tt: a.TikTok?.lift, yt: a.YouTube?.lift })), null, 1));
  const cl = new Map(ler("clusters.json").map((c) => [c.script_id, c]));
  const out = (r) => { const x = f(r); if (!x) return null; if (x.outHit && (!x.outFlop || x.outHit.sim >= x.outFlop.sim)) return "acerto"; if (x.outFlop) return "fraco"; return "nenhum"; };
  const base = L.filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma)).map((r) => ({ ...r, estrato: `${r.estrato}|${cl.get(r.script_id)?.c30}` }));
  const mh = mantelHaenszel(base.filter((r) => ["acerto", "fraco"].includes(out(r))), (r) => out(r) === "acerto", DESFECHOS.coef);
  console.log(`outro cliente, acerto vs fraco, com território: OR ${fmt.f2(mh.or)} [${fmt.f2(mh.lo)} a ${fmt.f2(mh.hi)}]`);
  const mh2 = mantelHaenszel(base, (r) => out(r) === "fraco", DESFECHOS.coef);
  console.log(`outro cliente, fraco vs resto, com território: OR ${fmt.f2(mh2.or)} [${fmt.f2(mh2.lo)} a ${fmt.f2(mh2.hi)}]`);
  // exemplos: repetição de acerto que também foi topo, e repetição de fraco que foi fraca
  const ex = (c, bom) => info.filter((x) => { const y = F.get(x.id); return x.pqMedio != null && (c === "acerto" ? y.hit && (!y.flop || y.hit.sim >= y.flop.sim) : y.flop && (!y.hit || y.flop.sim > y.hit.sim)) && (bom ? x.pqMedio >= 0.85 : x.pqMedio <= 0.15); })
    .slice(0, 400).sort(() => 0).slice(0, 6).map((x) => { const y = F.get(x.id), p = c === "acerto" ? y.hit : y.flop, o = info[p.j]; return `${x.cliente} | anterior (${o.data}, pq ${fmt.f2(o.pqMedio)}): "${o.titulo}" -> novo (${x.data}, pq ${fmt.f2(x.pqMedio)}, sim ${p.sim.toFixed(2)}, ${p.gap}d, ${p.repeticoes ?? "-"} rep): "${x.titulo}"`; });
  console.log("\nexemplos repete acerto e acerta:\n" + ex("acerto", true).join("\n"));
  console.log("\nexemplos repete fraco e erra:\n" + ex("fraco", false).join("\n"));
}
