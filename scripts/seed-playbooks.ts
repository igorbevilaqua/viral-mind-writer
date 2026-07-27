// Sobe playbooks/*.md para vm_playbooks (nome do arquivo = slug).
// Cria nova versão ativa e desativa as anteriores do mesmo slug.
// Rodar da raiz do projeto: npx tsx --env-file=.env.local scripts/seed-playbooks.ts [--slug NOME]
//   --slug NOME  sobe só esse playbook (não toca nos outros slugs)
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { appDb } from "../lib/db";

const dir = join(process.cwd(), "playbooks");
const slugIdx = process.argv.indexOf("--slug");
const ONLY_SLUG = slugIdx >= 0 ? process.argv[slugIdx + 1] : null;

async function main() {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const slug = basename(file, ".md");
    if (ONLY_SLUG && slug !== ONLY_SLUG) continue;
    // \u0000 vem de PDFs exportados e o Postgres rejeita em colunas text
    const content = readFileSync(join(dir, file), "utf8").replace(/\u0000/g, "");

    const { data: latest, error: qErr } = await appDb
      .from("vm_playbooks")
      .select("version, content")
      .eq("slug", slug)
      .order("version", { ascending: false })
      .limit(1);
    if (qErr) throw qErr;

    if (latest?.[0]?.content === content) {
      console.log(`${slug}: sem mudança (v${latest[0].version})`);
      continue;
    }

    const version = (latest?.[0]?.version ?? 0) + 1;
    const { error: deactErr } = await appDb
      .from("vm_playbooks")
      .update({ active: false })
      .eq("slug", slug);
    if (deactErr) throw deactErr;

    const { error: insErr } = await appDb
      .from("vm_playbooks")
      .insert({ slug, version, content, active: true });
    if (insErr) throw insErr;

    console.log(`${slug}: v${version} ativa (${content.length} chars)`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
