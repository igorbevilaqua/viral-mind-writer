// Backfill de embeddings do corpus (Viral Data → tabela documents). A lógica mora em
// lib/corpus-embeddings.ts, que o ETL semanal também chama com janela de 60 dias.
//
// Rodar da raiz do projeto:
//   npx tsx --env-file=.env.local scripts/backfill-embeddings.ts [--dry-run] [--limit N]
//   --dry-run  só conta e estima o custo, não chama a OpenAI nem escreve no banco
//   --limit N  processa no máximo N itens (default: sem limite)
import { sincronizarCorpus } from "../lib/corpus-embeddings";

const dryRun = process.argv.includes("--dry-run");
const limitIdx = process.argv.indexOf("--limit");
const limit = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : undefined;
if (limitIdx >= 0 && !Number.isFinite(limit)) throw new Error("--limit precisa de um número");

sincronizarCorpus({ dryRun, limit })
  .then((r) => console.log(`${dryRun ? "[dry-run] " : ""}fim: ${r.itens} itens, custo ${dryRun ? "estimado " : "aprox. "}US$ ${r.usd.toFixed(4)} (text-embedding-3-small)`))
  .catch((e) => {
    console.error("backfill falhou:", e);
    process.exit(1);
  });
