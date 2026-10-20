// Backfill do casamento Codex → vídeo publicado (plano 020 WP-A, plano 024 4.1). O cron semanal
// faz o mesmo (lib/etl.ts) com janela de 75 dias; aqui a janela é o ano inteiro.
// Rodar: npx tsx --env-file=.env.local scripts/backfill-matches.ts [--dry-run]
// Precisa de CRM_SUPABASE_URL/CRM_SERVICE_ROLE_KEY e da migration 0055 aplicada.
import { appDb } from "../lib/db";
import { casarComCrm, casarRoteiros, decidirCasamentos, type MatchRow } from "../lib/script-matches";
import { syncScriptPerformance } from "../lib/script-performance";

const dryRun = process.argv.includes("--dry-run");
const corta = (s: string | null) => (s ?? "—").replace(/\s+/g, " ").trim().slice(0, 80);

async function main() {
  // Pelo CRM primeiro: casado aqui sai da busca da RPC antiga, que estoura o tempo.
  const crm = await casarComCrm({ dias: 365, gravar: !dryRun });
  console.log("== pelo CRM ==", crm);
  if (crm.erro) throw new Error(`casarComCrm: ${crm.erro}`);

  const { data, error } = await appDb.rpc("vm_match_scripts");
  if (error) console.warn(`vm_match_scripts: ${error.message} — seguindo só com o CRM`);
  const casos = decidirCasamentos((data ?? []) as MatchRow[]);
  for (const auto of [true, false]) {
    const grupo = casos.filter((c) => c.auto === auto);
    console.log(`\n== RPC ${auto ? "AUTO" : "PENDENTE"} (${grupo.length}) ==`);
    for (const c of grupo)
      console.log(
        `ov ${c.sobreposicao.toFixed(2)} (ts ${c.score.toFixed(2)}) · ${c.plataforma ?? "?"}${c.principal ? " ★" : ""} · ${corta(c.hook_codex)} · ${corta(c.hook_video)}`
      );
  }
  if (dryRun) {
    console.log("\n(dry-run, nada gravado)");
    return;
  }

  if (!error) {
    const r = await casarRoteiros();
    console.log(`\nRPC: ${r.auto} automático(s), ${r.pendentes} pendente(s) no Kasparov, ${r.publicados} publicado(s)${r.erro ? ` · erro: ${r.erro}` : ""}`);
  }
  const { rows, naoCasaram } = await syncScriptPerformance();
  console.log(`${rows.length} medido(s) em vm_script_performance, ${naoCasaram.length} sem vídeo no corpus`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
