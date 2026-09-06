// Backfill do casamento Codex → vídeo publicado (plano 020, WP-A). O cron semanal faz o mesmo
// (lib/etl.ts); este script existe para conferir a lista a olho antes de gravar.
// Rodar: npx tsx --env-file=.env.local scripts/backfill-matches.ts [--dry-run]
import { appDb } from "../lib/db";
import { casarRoteiros, decidirCasamentos, MATCH_PENDENTE, type MatchRow } from "../lib/script-matches";
import { syncScriptPerformance } from "../lib/script-performance";

const dryRun = process.argv.includes("--dry-run");
const corta = (s: string | null) => (s ?? "—").replace(/\s+/g, " ").trim().slice(0, 80);

async function main() {
  const { data, error } = await appDb.rpc("vm_match_scripts", { p_min: MATCH_PENDENTE });
  if (error) throw new Error(`vm_match_scripts: ${error.message} — aplicar migration 0040`);
  const casos = decidirCasamentos((data ?? []) as MatchRow[]);

  for (const auto of [true, false]) {
    const grupo = casos.filter((c) => c.auto === auto);
    console.log(`\n== ${auto ? "AUTO" : "PENDENTE"} (${grupo.length}) ==`);
    for (const c of grupo)
      console.log(
        `${c.score.toFixed(2)} · ${c.plataforma ?? "?"}${c.principal ? " ★" : ""} · ${corta(c.hook_codex)} · ${corta(c.hook_video)}`
      );
  }
  if (dryRun) {
    console.log("\n(dry-run, nada gravado)");
    return;
  }

  const r = await casarRoteiros();
  console.log(`\n${r.auto} automático(s), ${r.pendentes} pendente(s) no Kasparov, ${r.publicados} roteiro(s) marcados como publicados`);
  const { rows, naoCasaram } = await syncScriptPerformance();
  console.log(`${rows.length} medido(s) em vm_script_performance, ${naoCasaram.length} sem vídeo no corpus`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
