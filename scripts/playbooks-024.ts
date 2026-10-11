// Plano 024: grava como INATIVAS as versões corrigidas dos playbooks de outubro (expressão
// coloquial sim, carimbo não; ver plano §9.1 e §9.2). A troca das ativas é um SQL à parte,
// numa transação, depois do deploy: docs/escrita-2026-10/ativar-playbooks.sql.
//
//   npx tsx --env-file=.env.local scripts/playbooks-024.ts [--aplicar]
import { readFileSync } from "node:fs";
import { appDb } from "../lib/db";

const NOVAS = [
  { slug: "style_guide", version: 6 },
  { slug: "storytelling", version: 4 },
  { slug: "conclusao", version: 2 },
  { slug: "checklist", version: 5 },
];
const APLICAR = process.argv.includes("--aplicar");

void (async () => {
  for (const { slug, version } of NOVAS) {
    const content = readFileSync(`docs/escrita-2026-10/playbooks/${slug}.md`, "utf8");
    const { data } = await appDb.from("vm_playbooks").select("id").eq("slug", slug).eq("version", version).maybeSingle();
    if (data) { console.log(`${slug} v${version}: já existe, pulado`); continue; }
    if (!APLICAR) { console.log(`${slug} v${version}: seria gravado (${content.length} caracteres)`); continue; }
    const { error } = await appDb.from("vm_playbooks").insert({ slug, version, content, active: false });
    if (error) throw error;
    console.log(`${slug} v${version}: gravado, inativo`);
  }
})();
