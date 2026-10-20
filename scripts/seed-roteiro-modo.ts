// Plano 025: carrega em vm_roteiro_modo os rótulos do estudo de modos (docs/estudo-modos-2026-10).
// Idempotente (upsert por crm_script_id).
//   npx tsx --env-file=.env.local scripts/seed-roteiro-modo.ts
import { readFileSync } from "node:fs";
import { appDb } from "../lib/db";

const linhas = readFileSync("docs/estudo-modos-2026-10/dados/roteiro_modo_seed.jsonl", "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => ({ ...JSON.parse(l), origem: "estudo-2026-10" }));

void (async () => {
  for (let i = 0; i < linhas.length; i += 500) {
    const { error } = await appDb.from("vm_roteiro_modo").upsert(linhas.slice(i, i + 500), { onConflict: "crm_script_id" });
    if (error) throw new Error(error.message);
  }
  const { count } = await appDb.from("vm_roteiro_modo").select("*", { count: "exact", head: true });
  console.log(`vm_roteiro_modo: ${count} linhas`);
})();
