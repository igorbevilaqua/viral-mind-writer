// 5. Estruturas (rótulo cls_estrutura do estudo de setembro, 1º rótulo) com a régua nova, global e por macro nicho.
import { carregar, avaliar, porGrupo, fmt, salvar, resumo, linhasCtl } from "./h.mjs";
const L = carregar();
const prim = (r) => { const e = r.cls_estrutura; const v = Array.isArray(e) ? e[0] : typeof e === "string" && e !== "null" ? e.split(",")[0] : null; return v ? String(v).trim() : null; };
const cont = {};
for (const r of L) { const e = prim(r); if (e) cont[e] = (cont[e] ?? 0) + 1; }
console.log("vídeos com rótulo:", L.filter(prim).length, "de", L.length, JSON.stringify(cont));
const Lr = linhasCtl().filter((r) => prim(r)); // só rotulados, MH com controle de tamanho
const out = {};
console.log("| estrutura | n | % topo | lift [IC] | OR MH [IC] | desc/val | IG TT YT | leitura | macro (lift n) |\n|---|---|---|---|---|---|---|---|---|");
for (const e of Object.keys(cont).sort()) {
  const p = (r) => prim(r) === e;
  const a = avaliar(e, p, { linhas: Lr });
  if (!a.todas || a.todas.n < 30) continue;
  const m = porGrupo(e, p, (r) => r.macro, { linhas: Lr, minN: 15 });
  out[e] = { ...resumo(a), macro: m.map((x) => ({ g: x.grupo, n: x.n, lift: x.lift, lb: x.lb, ub: x.ub, or: x.mh.or })) };
  console.log(`| ${e} | ${a.todas.n} | ${fmt.pct(a.todas.p)} | ${fmt.f2(a.todas.lift)} [${fmt.f2(a.todas.lb)}-${fmt.f2(a.todas.ub)}] | ${fmt.f2(a.mh.or)} [${fmt.f2(a.mh.lo)}-${fmt.f2(a.mh.hi)}] | ${fmt.f2(a.descoberta?.lift)}/${fmt.f2(a.validacao?.lift)} | ${["Instagram", "TikTok", "YouTube"].map((x) => fmt.f2(a[x]?.lift)).join(" ")} | ${a.leitura} | ${m.map((x) => `${x.grupo.slice(0, 10)} ${fmt.f2(x.lift)} (${x.n}) [${fmt.f2(x.lb)}-${fmt.f2(x.ub)}]`).join("; ")} |`);
}
salvar("estruturas.json", out);
