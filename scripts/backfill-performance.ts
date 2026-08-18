// Backfill do flywheel: casa os roteiros já marcados como publicados com o vídeo do corpus
// e grava vm_script_performance. O cron semanal faz exatamente o mesmo (lib/etl.ts) — este
// script existe para popular o histórico sob demanda, sem esperar a segunda-feira.
// Rodar: npx tsx --env-file=.env.local scripts/backfill-performance.ts [--dry-run]
import { syncScriptPerformance } from "../lib/script-performance";

const dryRun = process.argv.includes("--dry-run");

syncScriptPerformance(dryRun)
  .then(({ rows, naoCasaram }) => {
    for (const r of rows)
      console.log(
        `${r.script_id} → vídeo ${r.viral_data_video_id}: ${r.views} views, ` +
          `retenção hook ${r.retencao_hook ?? "—"}, compart. ${r.compartilhamentos ?? "sem coleta"}`
      );
    for (const n of naoCasaram) console.log(`SEM CORPUS  ${n.scriptId} → ${n.url}`);
    console.log(`${rows.length} medido(s), ${naoCasaram.length} sem vídeo no corpus${dryRun ? " (dry-run, nada gravado)" : ""}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
