// Roda o slop-lint sobre TODOS os roteiros salvos e imprime a densidade de cada tique.
// Existe porque `slop_lint_violations` era gravado em toda versão e lido por ninguém: sem
// isso, "acho que ainda está saindo tique" não tem número, e mudança de detector não tem
// antes/depois. Rodar da raiz: npm run style-report [-- --limit 50] [-- --csv]
import { appDb } from "../lib/db";
import { slopLint, type LintViolation } from "../lib/pipeline/slop-lint";
import type { BannedPhrase } from "../lib/pipeline/types";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
};
const LIMIT = Number(arg("limit") ?? 500);
const CSV = process.argv.includes("--csv");

interface Row {
  id: string;
  version: number;
  created_at: string;
  headline: string | null;
  hook: string | null;
  roteiro: string;
  comando: string | null;
  slop_lint_violations: number | null;
}

// O texto ENTREGUE, que é o que o usuário lê — não o pipeline_trace.
const fullText = (r: Row) =>
  [r.headline, r.hook, r.roteiro, r.comando].filter(Boolean).join("\n");

async function main() {
  const [{ data: phrases, error: pErr }, { data: scripts, error: sErr }] = await Promise.all([
    appDb.from("vm_banned_phrases").select("pattern, label, severity").eq("active", true),
    appDb
      .from("vm_generated_scripts")
      .select("id, version, created_at, headline, hook, roteiro, comando, slop_lint_violations")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);
  if (pErr) throw pErr;
  if (sErr) throw sErr;

  const banned = (phrases ?? []) as BannedPhrase[];
  const rows = (scripts ?? []) as Row[];
  if (!rows.length) return console.log("nenhum roteiro salvo");

  const porLabel = new Map<string, { ocorrencias: number; roteiros: number; amostra: string }>();
  const porRoteiro: { r: Row; v: LintViolation[] }[] = [];

  for (const r of rows) {
    const v = slopLint(fullText(r), banned);
    porRoteiro.push({ r, v });
    for (const label of new Set(v.map((x) => x.label))) {
      const e = porLabel.get(label) ?? { ocorrencias: 0, roteiros: 0, amostra: "" };
      e.roteiros += 1;
      e.ocorrencias += v.filter((x) => x.label === label).length;
      e.amostra ||= v.find((x) => x.label === label)!.match.slice(0, 80);
      porLabel.set(label, e);
    }
  }

  if (CSV) {
    console.log("label,ocorrencias,roteiros");
    for (const [label, e] of porLabel) console.log(`"${label}",${e.ocorrencias},${e.roteiros}`);
    return;
  }

  const total = rows.length;
  const limpos = porRoteiro.filter(({ v }) => v.length === 0).length;
  console.log(`\n${total} roteiros analisados · ${limpos} limpos (${Math.round((limpos / total) * 100)}%)\n`);

  const ordenado = [...porLabel.entries()].sort((a, b) => b[1].roteiros - a[1].roteiros);
  if (!ordenado.length) console.log("nenhuma violação — todos limpos");
  for (const [label, e] of ordenado) {
    const pct = Math.round((e.roteiros / total) * 100);
    console.log(`${String(e.roteiros).padStart(3)}/${total} (${String(pct).padStart(3)}%)  ${e.ocorrencias}x  ${label}`);
    console.log(`                     └─ ${e.amostra}`);
  }

  // Divergência entre o que o lint acusa HOJE e o que estava gravado na geração: é a medida
  // de quanto os detectores novos pegam que a banlist por string deixava passar.
  const regressoes = porRoteiro.filter(({ r, v }) => v.length > (r.slop_lint_violations ?? 0));
  if (regressoes.length) {
    console.log(
      `\n${regressoes.length} roteiros passaram na geração mas violam os detectores atuais ` +
        `(entregues com lint zerado ou subcontado):`
    );
    for (const { r, v } of regressoes.slice(0, 10)) {
      console.log(`  ${r.created_at.slice(0, 10)} v${r.version} ${r.id.slice(0, 8)} — gravado ${r.slop_lint_violations ?? 0}, agora ${v.length}`);
      for (const x of v.slice(0, 3)) console.log(`      · ${x.label}\n        "${x.match.slice(0, 90)}"`);
    }
  }
  console.log("");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
