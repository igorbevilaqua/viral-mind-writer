// Preditor 2026-10: exporta vm_roteiro_modo (banco do app) para data/modo.json. Só leitura.
//   npx tsx --env-file="<codex>/.env.local" src/preditor/export_modo.ts
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  const out: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("vm_roteiro_modo").select("crm_script_id,modo,ancora,registro,origem").range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  writeFileSync(new URL("../../data/modo.json", import.meta.url), JSON.stringify(out));
  console.log("vm_roteiro_modo:", out.length);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
