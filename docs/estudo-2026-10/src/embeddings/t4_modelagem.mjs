// Tarefa 4: modelagem (roteiro baseado num vídeo que já funcionou). Por rede, nicho, cliente, origem do link,
// e se o efeito some quando se controla território (cluster) ou novidade.
import { writeFileSync } from "node:fs";
import { carregar, avaliar, porGrupo, tabela, mantelHaenszel, DESFECHOS, ler, OUT, fmt } from "../lib.mjs";
import { features } from "./t3_repeticao.mjs";

const L = carregar();
const PL = ["Instagram", "TikTok", "YouTube"];
const mod = (r) => !!r.s?.modelagem;
const origem = (r) => { const u = (r.s?.modelagem_url ?? "").toLowerCase(); return !mod(r) ? null : u.includes("instagram") ? "instagram" : u.includes("tiktok") ? "tiktok" : u.includes("youtu") ? "youtube" : u ? "outro" : "sem link"; };
const f2 = fmt.f2, orTxt = (m) => `${f2(m.or)} [${f2(m.lo)} a ${f2(m.hi)}]`;

const A = [avaliar("roteiro modelado", mod)];
for (const o of ["instagram", "tiktok", "youtube", "outro"]) A.push(avaliar(`modelado de link ${o}`, (r) => origem(r) === o, { minN: 10 }));
console.log(tabela(A));

console.log("\nMH por rede de postagem (só modelado vs não):");
for (const p of PL) { const a = avaliar("m", mod, { plats: [p] }); console.log(`  ${p}: n=${a.todas.n} lift ${f2(a.todas.lift)} OR ${orTxt(a.mh)} desc/val ${f2(a.descoberta?.lift)}/${f2(a.validacao?.lift)} -> ${a.leitura}`); }
console.log("\nOrigem do link x rede de postagem (OR MH):");
for (const o of ["instagram", "tiktok"]) for (const p of PL) { const a = avaliar("m", (r) => origem(r) === o, { plats: [p], minN: 10 }); console.log(`  link ${o} postado no ${p}: n=${a.todas.n} lift ${f2(a.todas.lift)} OR ${orTxt(a.mh)} -> ${a.leitura}`); }

console.log("\nPor macro nicho:");
for (const g of porGrupo("m", mod, (r) => r.macro)) console.log(`  ${g.grupo}: n=${g.n} rot=${g.roteiros} lift ${f2(g.lift)} [${f2(g.lb)} a ${f2(g.ub)}] OR ${orTxt(g.mh)}`);
const share = {};
for (const r of L) if (PL.includes(r.plataforma)) { const s = (share[r.cliente] ??= { m: new Set(), t: new Set() }); s.t.add(r.script_id); if (mod(r)) s.m.add(r.script_id); }
console.log("\nPor cliente (com >=15 vídeos modelados):");
const pc = porGrupo("m", mod, (r) => r.cliente);
for (const g of pc) console.log(`  ${g.grupo}: ${share[g.grupo].m.size}/${share[g.grupo].t.size} roteiros modelados | n=${g.n} lift ${f2(g.lift)} OR ${orTxt(g.mh)}`);
console.log(`  clientes com OR>1: ${pc.filter((g) => g.mh.or > 1).length} de ${pc.length}`);

// controle por território e por novidade
const cl = new Map(ler("clusters.json").map((c) => [c.script_id, c]));
const { F } = features();
const banda = (r) => { const s = F.get(r.script_id)?.simCli; return s == null ? "x" : s < 0.78 ? "a" : s < 0.82 ? "b" : s < 0.86 ? "c" : "d"; };
const base = L.filter((r) => PL.includes(r.plataforma));
const y = DESFECHOS.coef;
const ctrl = {
  "cliente x rede (base)": (r) => r.estrato,
  "+ território k=30": (r) => `${r.estrato}|${cl.get(r.script_id)?.c30}`,
  "+ território k=60": (r) => `${r.estrato}|${cl.get(r.script_id)?.c60}`,
  "+ trimestre": (r) => `${r.estrato}|${r.tri}`,
  "+ novidade (faixa de sim c/ passado do cliente)": (r) => `${r.estrato}|${banda(r)}`,
  "+ território k=30 + trimestre": (r) => `${r.estrato}|${cl.get(r.script_id)?.c30}|${r.tri}`,
};
console.log("\nOR MH do modelado, controlando:");
const ctrlRes = {};
for (const [k, fn] of Object.entries(ctrl)) { const m = mantelHaenszel(base.map((r) => ({ ...r, estrato: fn(r) })), mod, y); ctrlRes[k] = m; console.log(`  ${k}: ${orTxt(m)}`); }

// modelado é mais "novo" para o cliente?
const sims = (p) => { const v = [...new Set(base.filter(p).map((r) => r.script_id))].map((id) => F.get(id)?.simCli).filter((x) => x != null).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
console.log(`\nmediana da maior sim com o passado do cliente: modelado ${sims(mod).toFixed(3)} x não modelado ${sims((r) => !mod(r)).toFixed(3)}`);

// em que o modelado ganha: outros desfechos
console.log("\nModelado contra outros desfechos:");
const outros = {};
for (const d of ["acerto", "ret_hook", "ret_sub", "ret_final", "compart", "seguidores", "comentarios"]) {
  const a = avaliar("m", mod, { desfecho: d });
  outros[d] = { n: a.todas?.n, lift: a.todas?.lift, or: a.mh.or, lo: a.mh.lo, hi: a.mh.hi, leitura: a.leitura };
  console.log(`  ${d}: n=${a.todas?.n} lift ${f2(a.todas?.lift)} OR ${orTxt(a.mh)} -> ${a.leitura}`);
}
writeFileSync(OUT + "embeddings/modelagem.json", JSON.stringify({ geral: A.map((a) => ({ nome: a.nome, n: a.todas?.n, lift: a.todas?.lift, or: a.mh.or, lo: a.mh.lo, hi: a.mh.hi, leitura: a.leitura, ig: a.Instagram?.lift, tt: a.TikTok?.lift, yt: a.YouTube?.lift })), clientes: pc.map((g) => ({ cliente: g.grupo, n: g.n, lift: g.lift, or: g.mh.or })), controle: ctrlRes, outros }, null, 1));

console.log("\nOR MH do modelado por período (cliente x rede):");
for (const per of ["descoberta", "validacao"]) {
  const b = base.filter((r) => r.periodo === per);
  const m = mantelHaenszel(b, mod, y), mt = mantelHaenszel(b.filter((r) => r.macro === "Tecnologia, IA e inovação"), mod, y);
  const mo = mantelHaenszel(b.filter((r) => r.macro !== "Tecnologia, IA e inovação"), mod, y);
  console.log(`  ${per}: todos ${orTxt(m)} | Tecnologia ${orTxt(mt)} | demais nichos ${orTxt(mo)} | % modelado ${Math.round(100 * b.filter(mod).length / b.length)}%`);
}
for (const tri of [...new Set(base.map((r) => r.tri))].sort()) { const b = base.filter((r) => r.tri === tri); console.log(`  ${tri}: n=${b.length} OR ${orTxt(mantelHaenszel(b, mod, y))} % modelado ${Math.round(100 * b.filter(mod).length / b.length)}%`); }

// validação fora de Tecnologia: o negativo sobrevive a território? E sem os 4 clientes com OR negativo?
const valFora = base.filter((r) => r.periodo === "validacao" && r.macro !== "Tecnologia, IA e inovação");
console.log(`\nvalidação fora de Tecnologia: ${orTxt(mantelHaenszel(valFora, mod, y))} | + território k30 ${orTxt(mantelHaenszel(valFora.map((r) => ({ ...r, estrato: `${r.estrato}|${cl.get(r.script_id)?.c30}` })), mod, y))}`);
const negativos = new Set(["Pedro Elero", "Renato Mendes", "Thainá Iansen", "Túlio Lichenstein"]);
console.log(`  sem ${[...negativos].join(", ")}: ${orTxt(mantelHaenszel(valFora.filter((r) => !negativos.has(r.cliente)), mod, y))}`);
