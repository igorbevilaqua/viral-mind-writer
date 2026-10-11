// Bateria: cada característica de hook/subhook contra coef (principal), acerto, ret_hook/ret_sub (IG)
// e o hook falado (hook_video) como checagem. Saída: out/hooks/bateria_<parte>.md e .json; console resumido.
// Uso: node src/hooks/bateria.mjs hook|sub
import { writeFileSync } from "node:fs";
import { carregar, avaliar, tabela, OUT, fmt } from "../lib.mjs";
import { HOOK, SUB } from "./feat.mjs";

const parte = process.argv[2] ?? "hook";
const L = carregar();
const f2 = fmt.f2;
const campo = parte === "hook" ? (r) => r.g?.hook : (r) => r.g?.subhook;
const feats = parte === "hook" ? HOOK : SUB;
const IG = { plats: ["Instagram"] };
const curto = (a) => a.todas ? `${f2(a.mh.or)} [${f2(a.mh.lo)}-${f2(a.mh.hi)}] n=${a.todas.n}` : "-";
const sig = (a) => ({ "ajuda (replica)": "AJUDA", "atrapalha (replica)": "ATRAPALHA", "sinal sem replicação": "sinal", "sem evidência": ".", "amostra pequena": "peq" })[a.leitura] ?? a.leitura;

const res = [];
for (const [id, grupo, desc, fn] of feats) {
  const pred = (r) => fn(campo(r));
  const coef = avaliar(id, pred);
  const acerto = avaliar(id, pred, { desfecho: "acerto" });
  const rh = avaliar(id, pred, { desfecho: "ret_hook", ...IG, minN: 20 });
  const rs = avaliar(id, pred, { desfecho: "ret_sub", ...IG, minN: 20 });
  const hv = parte === "hook" ? avaliar(id, (r) => r.hook_video && fn(r.hook_video), { linhas: L.filter((r) => r.hook_video) }) : null;
  res.push({ id, grupo, desc, coef, acerto, ret_hook: rh, ret_sub: rs, hook_video: hv });
}

const md = [`# Bateria ${parte} (texto escrito; desfecho coef salvo indicação)`, ""];
for (const g of [...new Set(res.map((x) => x.grupo))]) {
  const sel = res.filter((x) => x.grupo === g);
  md.push(`## ${g}`, "", sel.map((x) => `- \`${x.id}\`: ${x.desc}`).join("\n"), "", "### coef", tabela(sel.map((x) => x.coef)), "", "### acerto", tabela(sel.map((x) => x.acerto)), "");
  md.push("### ret_hook (Instagram)", tabela(sel.map((x) => x.ret_hook), ["Instagram"]), "", "### ret_sub (Instagram)", tabela(sel.map((x) => x.ret_sub), ["Instagram"]), "");
  if (parte === "hook") md.push("### coef com o hook FALADO (hook_video)", tabela(sel.map((x) => x.hook_video)), "");
}
writeFileSync(`${OUT}hooks/bateria_${parte}.md`, md.join("\n"));
const slim = (a) => a && { lift: a.todas?.lift, lb: a.todas?.lb, ub: a.todas?.ub, n: a.todas?.n, roteiros: a.todas?.roteiros, clientes: a.todas?.clientes, p: a.todas?.p, p_sem: a.todas?.p_sem, or: a.mh.or, or_lo: a.mh.lo, or_hi: a.mh.hi, desc: a.descoberta?.lift, val: a.validacao?.lift, IG: a.Instagram?.lift, IG_n: a.Instagram?.n, TT: a.TikTok?.lift, TT_n: a.TikTok?.n, YT: a.YouTube?.lift, YT_n: a.YouTube?.n, leitura: a.leitura };
writeFileSync(`${OUT}hooks/bateria_${parte}.json`, JSON.stringify(res.map((x) => ({ id: x.id, grupo: x.grupo, desc: x.desc, coef: slim(x.coef), acerto: slim(x.acerto), ret_hook: slim(x.ret_hook), ret_sub: slim(x.ret_sub), hook_video: slim(x.hook_video) })), null, 1));

console.log("id | rot | coef OR [IC] lift d/v | IG/TT/YT | leitura || acerto | ret_hook | ret_sub | falado");
for (const x of res) {
  const c = x.coef, t = c.todas;
  console.log(`${x.id} | ${t?.roteiros} | ${f2(c.mh.or)} [${f2(c.mh.lo)}-${f2(c.mh.hi)}] ${f2(t?.lift)} ${f2(c.descoberta?.lift)}/${f2(c.validacao?.lift)} | ${f2(c.Instagram?.lift)}/${f2(c.TikTok?.lift)}/${f2(c.YouTube?.lift)} | ${sig(c)} || ${f2(x.acerto.mh.or)} ${sig(x.acerto)} | ${curto(x.ret_hook)} ${sig(x.ret_hook)} | ${curto(x.ret_sub)} ${sig(x.ret_sub)} | ${x.hook_video ? f2(x.hook_video.mh.or) + " " + sig(x.hook_video) : ""}`);
}
