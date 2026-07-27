// Portão humano da Fase 4: promove uma versão PROPOSTA de playbook (active:false,
// criada por runHookPlaybookCurator) para active — desativando as demais do slug.
// Sempre revise o conteúdo antes (o curador só PROPÕE; ativar é decisão humana).
//
// Rodar da raiz do projeto:
//   npx tsx --env-file=.env.local scripts/promote-playbook.ts --slug hook --version N [--show]
//   --show   só imprime o conteúdo da versão (para revisar), não ativa nada
import { appDb } from "../lib/db";

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const SLUG = arg("--slug");
const VERSION = Number(arg("--version"));
const SHOW = process.argv.includes("--show");
if (!SLUG || !Number.isFinite(VERSION)) throw new Error("uso: --slug NOME --version N [--show]");

async function main() {
  const { data: row, error } = await appDb
    .from("vm_playbooks")
    .select("id, version, active, content")
    .eq("slug", SLUG)
    .eq("version", VERSION)
    .maybeSingle();
  if (error) throw error;
  if (!row) throw new Error(`${SLUG} v${VERSION} não existe`);

  if (SHOW) {
    console.log(`${SLUG} v${VERSION} (active=${row.active}, ${row.content.length} chars):\n`);
    console.log(row.content);
    return;
  }
  if (row.active) {
    console.log(`${SLUG} v${VERSION} já está ativa. Nada a fazer.`);
    return;
  }
  const deact = await appDb.from("vm_playbooks").update({ active: false }).eq("slug", SLUG);
  if (deact.error) throw deact.error;
  const act = await appDb.from("vm_playbooks").update({ active: true }).eq("id", row.id);
  if (act.error) throw act.error;
  console.log(`${SLUG} v${VERSION} agora ATIVA (as demais versões foram desativadas).`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
