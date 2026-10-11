// Mineração de n-gramas no hook e no subhook (descobre antes de 07/2026, valida depois).
import { minerar, fmt } from "../lib.mjs";
const f2 = fmt.f2;
const show = (titulo, res, k = 25) => {
  const rep = res.filter((x) => x.replica);
  console.log(`\n## ${titulo}: ${res.length} candidatos na descoberta, ${rep.length} replicam`);
  for (const x of rep.slice(0, k)) console.log(`${x.or_total > 1 ? "+" : "-"} "${x.gram}" rot=${x.roteiros} n=${x.n} lift=${f2(x.lift)} [${f2(x.lb)}-${f2(x.ub)}] ORd=${f2(x.or_desc)} ORv=${f2(x.or_val)} [${f2(x.or_val_lo)}-${f2(x.or_val_hi)}] ORt=${f2(x.or_total)} [${f2(x.or_lo)}-${f2(x.or_hi)}]`);
  const nrep = res.filter((x) => !x.replica).slice(0, 8);
  console.log("  (não replicam: " + nrep.map((x) => `"${x.gram}" ORd=${f2(x.or_desc)} ORv=${f2(x.or_val)}`).join("; ") + ")");
};
const arg = process.argv[2] ?? "coef";
const plats = arg === "coef" || arg === "acerto" ? ["Instagram", "TikTok", "YouTube"] : ["Instagram"];
const minR = plats.length === 1 ? 30 : 40;
show(`[${arg}] HOOK início (1-3 palavras)`, minerar((r) => r.g?.hook, { inicio: true, ns: [1, 2, 3], minRoteiros: minR, desfecho: arg, plats }));
show(`[${arg}] HOOK inteiro (1-3)`, minerar((r) => r.g?.hook, { ns: [1, 2, 3], minRoteiros: minR, desfecho: arg, plats }), 40);
show(`[${arg}] SUBHOOK início (1-3)`, minerar((r) => r.g?.subhook, { inicio: true, ns: [1, 2, 3], minRoteiros: minR, desfecho: arg, plats }));
show(`[${arg}] SUBHOOK inteiro (1-3)`, minerar((r) => r.g?.subhook, { ns: [1, 2, 3], minRoteiros: minR, desfecho: arg, plats }), 30);
