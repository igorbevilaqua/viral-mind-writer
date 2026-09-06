// Plano 020, WP-H: anexa ao playbook de storytelling ATIVO a seção "PARTE 2-B — O que os dados
// dizem" (matriz estrutura × tema do estudo, lift.json de scripts/study-lift.ts) e grava como
// PROPOSTA — vm_playbooks(version+1, active:false). Nunca ativa: quem promove é o humano em
// /ensinar (components/playbook-proposals.tsx) ou scripts/promote-playbook.ts. Sem LLM.
//
// Idempotente: se já existe versão inativa do slug contendo o título da PARTE 2-B, não insere.
// STOP do plano: nenhuma célula n≥15 com lift_lb>1 → não grava nada.
//
// Rodar da raiz do projeto:
//   npx tsx --env-file=.env.local scripts/propose-playbook-from-study.ts --slug storytelling --dry-run
//   npx tsx --env-file=.env.local scripts/propose-playbook-from-study.ts --slug storytelling [--in docs/estudo-2026-09/lift.json]
import { readFileSync } from "node:fs";
import { anexarSecao, celulasFortes, secaoDados, TITULO_2B, type CelulaMatriz } from "../lib/playbook-proposta";

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const DRY_RUN = process.argv.includes("--dry-run");
const IN = arg("--in") ?? "docs/estudo-2026-09/lift.json";
const SLUG = arg("--slug") ?? "storytelling";
// ponytail: só storytelling tem matriz no estudo; `hook` entra quando houver dado equivalente.
if (SLUG !== "storytelling") throw new Error(`--slug ${SLUG}: só "storytelling" tem dado no estudo 2026-09`);

async function main() {
  const lift = JSON.parse(readFileSync(IN, "utf8")) as { gerado_em: string; matriz: { celulas: CelulaMatriz[] } };
  const fortes = celulasFortes(lift.matriz.celulas);
  console.log(`${IN} (gerado em ${lift.gerado_em}) — ${fortes.length} célula(s) com n≥15 e lift_lb>1\n`);
  if (!fortes.length) {
    console.log("STOP (plano 020, WP-H): nenhuma célula passa no corte; nada a propor. PARTE 2 manual continua.");
    return;
  }
  const secao = secaoDados(fortes);
  if (DRY_RUN) {
    console.log(secao);
    console.log("\n--dry-run: nada gravado.");
    return;
  }

  // import tardio: o --dry-run não precisa de banco nem de env.
  const { appDb } = await import("../lib/db");
  const { data: versoes, error } = await appDb
    .from("vm_playbooks")
    .select("version, active, content")
    .eq("slug", SLUG)
    .order("version", { ascending: false });
  if (error) throw new Error(`vm_playbooks: ${error.message}`);
  const ativo = (versoes ?? []).find((v) => v.active);
  if (!ativo) throw new Error(`sem playbook ativo para "${SLUG}"`);
  const jaProposta = (versoes ?? []).find((v) => !v.active && String(v.content).includes(TITULO_2B));
  if (jaProposta) {
    console.log(`${SLUG} v${jaProposta.version} (inativa) já contém "${TITULO_2B}". Nada a fazer.`);
    return;
  }
  const version = (Number(versoes![0].version) || 0) + 1;
  const ins = await appDb.from("vm_playbooks").insert({ slug: SLUG, version, content: anexarSecao(String(ativo.content), secao), active: false });
  if (ins.error) throw new Error(`insert vm_playbooks: ${ins.error.message}`);
  console.log(`${SLUG} v${version} gravada como PROPOSTA (active:false), a partir da v${ativo.version} ativa. Promova em /ensinar.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
