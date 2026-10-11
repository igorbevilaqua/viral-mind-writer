// Mineração por plataforma: n-gramas do hook que replicam numa rede só.
import { minerar, fmt } from "../lib.mjs";
const f2 = fmt.f2;
for (const p of ["Instagram", "TikTok", "YouTube"]) {
  for (const [rot, opts] of [["início", { inicio: true, ns: [1, 2, 3] }], ["inteiro", { ns: [1, 2, 3] }]]) {
    const res = minerar((r) => r.g?.hook, { ...opts, plats: [p], minRoteiros: 30 }).filter((x) => x.replica);
    console.log(`\n## ${p} | hook ${rot}: ${res.length} replicam`);
    console.log(res.slice(0, 14).map((x) => `${x.or_total > 1 ? "+" : "-"}"${x.gram}" rot=${x.roteiros} OR=${f2(x.or_total)} [${f2(x.or_lo)}-${f2(x.or_hi)}] d/v ${f2(x.or_desc)}/${f2(x.or_val)}`).join("\n"));
  }
}
