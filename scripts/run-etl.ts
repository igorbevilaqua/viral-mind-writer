// Rodar: npx tsx --env-file=.env.local scripts/run-etl.ts
import { runWeeklyEtl } from "../lib/etl";

runWeeklyEtl()
  .then((r) => {
    console.log("ETL ok:", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error("ETL falhou:", e);
    process.exit(1);
  });
