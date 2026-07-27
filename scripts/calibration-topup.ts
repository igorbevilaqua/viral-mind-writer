// Gera probes de calibração (aprofundamentos por eixo) a partir dos vencedores recentes.
// Roda de graça no cron semanal e sob demanda pela UI; este script permite rodar à mão
// ou num cron mais frequente. Rodar: npx tsx --env-file=.env.local scripts/calibration-topup.ts [--max N]
import { runProbeTopup } from "../lib/calibration-probe";

const i = process.argv.indexOf("--max");
const max = i >= 0 ? Number(process.argv[i + 1]) : 6;

runProbeTopup(max)
  .then((n) => {
    console.log(`${n} probe(s) de calibração criados`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
