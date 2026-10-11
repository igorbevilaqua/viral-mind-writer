// Insere os playbooks do estudo 2026-10 como PROPOSTAS (active:false) em vm_playbooks.
// Ativar é decisão humana no /ensinar (ou scripts/promote-playbook.ts). Idempotente: não duplica conteúdo igual.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const DIR = "/Users/igorbevilaqua/Projetos/CODEX - Viral Mind/docs/estudo-2026-10/playbooks/";
const SLUGS = ["hook", "subhook", "conclusao", "payoff", "comando", "storytelling", "checklist", "style_guide", "pauta"];
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
for (const slug of SLUGS) {
  const content = readFileSync(DIR + slug + ".md", "utf8").replace(/\u0000/g, "");
  if (/[—–]/.test(content)) throw new Error(`${slug}: tem travessão`);
  const { data: vers, error } = await db.from("vm_playbooks").select("version, content, active").eq("slug", slug).order("version", { ascending: false });
  if (error) throw error;
  if (vers?.some((v) => v.content === content)) { console.log(`${slug}: já existe com o mesmo conteúdo, nada a fazer`); continue; }
  const version = (vers?.[0]?.version ?? 0) + 1;
  const ativa = vers?.find((v) => v.active)?.version ?? null;
  const { error: e2 } = await db.from("vm_playbooks").insert({ slug, version, content, active: false });
  if (e2) throw e2;
  console.log(`${slug}: proposta v${version} gravada (${content.length} chars); ativa hoje: ${ativa ? "v" + ativa : "nenhuma"}`);
}
