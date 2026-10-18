// Por cliente: fatia de cada modo e lift no coef dentro do cliente (IG, TT, YT). Vira o bloco de modos do perfil do cliente.
import { readFileSync, writeFileSync } from "node:fs";
import { carregar, lift, DESFECHOS, OUT } from "../lib.mjs";
const rot = new Map(readFileSync(OUT + "modos/rotulos_modo.jsonl", "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).map((r) => [r.script_id, r]));
const L = carregar().filter((r) => rot.has(r.script_id)).map((r) => ({ ...r, m: rot.get(r.script_id).modo }));
const out = {};
for (const cid of new Set(L.map((r) => r.cliente_id))) {
  const Lc = L.filter((r) => r.cliente_id === cid);
  const roteiros = [...new Map(Lc.map((r) => [r.script_id, r])).values()];
  const Lp = Lc.filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
  out[cid] = {
    cliente: Lc[0].cliente,
    roteiros: roteiros.length,
    modos: Object.fromEntries(["historia", "mecanismo", "demonstracao", "panorama", "conselho", "publi"].map((m) => {
      const n = roteiros.filter((r) => r.m === m).length;
      const l = lift(Lp, (r) => r.m === m, DESFECHOS.coef);
      return [m, { fatia: +(n / roteiros.length).toFixed(3), videos: l?.n ?? 0, lift: l?.n >= 15 ? +l.lift.toFixed(2) : null, lb: l?.n >= 15 ? +l.lb.toFixed(2) : null, ub: l?.n >= 15 ? +l.ub.toFixed(2) : null }];
    })),
  };
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log("clientes", Object.keys(out).length);
