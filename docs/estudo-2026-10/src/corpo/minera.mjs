// Mineração de n-gramas no corpo e na conclusão. Descobre na 1ª metade, confirma na 2ª (régua da lib).
// Filtro extra: replica E IC do OR total fora de 1.
import { minerar, salvar, linhasCtl, fmt } from "./h.mjs";

const alvo = process.argv[2] ?? "corpo";
const campo = { corpo: (r) => r.g.corpo, conclusao: (r) => r.g.conclusao, conclusao_inicio: (r) => r.g.conclusao }[alvo];
const inicio = alvo === "conclusao_inicio";
const cfgs = alvo === "corpo"
  ? [["coef", ["Instagram", "TikTok", "YouTube"]], ["ret_final", ["Instagram"]]]
  : [["coef", ["Instagram", "TikTok", "YouTube"]], ["compart", ["Instagram", "TikTok"]], ["comentarios", ["Instagram", "TikTok", "YouTube"]], ["salvamentos", ["TikTok"]], ["ret_final", ["Instagram"]]];
const out = {};
for (const [d, plats] of cfgs) {
  const min = d === "coef" ? 40 : 30;
  const res = minerar(campo, { linhas: linhasCtl(), ns: inicio ? [1, 2, 3] : [1, 2, 3, 4], minRoteiros: min, desfecho: d, plats, inicio });
  const fortes = res.filter((x) => x.replica && (x.or_lo > 1 || x.or_hi < 1));
  out[d] = { candidatos: res.length, fortes };
  console.log(`\n## ${alvo} x ${d} (${plats.join("+")}): ${res.length} candidatos na descoberta, ${res.filter((x) => x.replica).length} mantêm o sinal, ${fortes.length} com IC total fora de 1`);
  for (const sinal of [1, -1]) {
    const l = fortes.filter((x) => (sinal > 0 ? x.or_total > 1 : x.or_total < 1)).slice(0, 30);
    console.log(sinal > 0 ? "AJUDA:" : "ATRAPALHA:");
    for (const x of l) console.log(`  "${x.gram}" rot=${x.roteiros} n=${x.n} lift ${fmt.f2(x.lift)} OR desc ${fmt.f2(x.or_desc)} val ${fmt.f2(x.or_val)} [${fmt.f2(x.or_val_lo)}-${fmt.f2(x.or_val_hi)}] total ${fmt.f2(x.or_total)} [${fmt.f2(x.or_lo)}-${fmt.f2(x.or_hi)}]`);
  }
}
salvar(`minera_${alvo}.json`, out);
