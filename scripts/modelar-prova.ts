// Banco de prova do /modelagem (plano 027): roda leitura → pesquisa → escrita sobre o original de
// sessões reais e grava o resultado para leitura humana. Não grava nada no banco.
// Custo por sessão: uma leitura, até 3 buscas no Grok e uma escrita (perto de US$ 0,50).
//   npx tsx --env-file=.env.local scripts/modelar-prova.ts <sessionId> [sessionId...]
// Saída: runs/027-prova/v2/<sessionId>.json
import fs from "node:fs";
import path from "node:path";
import { appDb } from "../lib/db";
import type { UsageLog } from "../lib/anthropic";
import { modelar } from "../lib/modelagem/modelar";
import { medir, portoes } from "../lib/modelagem/portoes";

async function uma(sessao: string) {
  const { data: s } = await appDb.from("vm_sessions").select("prompt").eq("id", sessao).single();
  const { data: a } = await appDb
    .from("vm_attachments")
    .select("raw_content")
    .eq("session_id", sessao)
    .eq("is_modelagem", true)
    .limit(1)
    .maybeSingle();
  const original = ((a?.raw_content as string | null) ?? "").trim();
  if (!original) throw new Error(`${sessao}: sessão sem original gravado`);

  const log: UsageLog = {};
  const t0 = Date.now();
  const m = await modelar(original, s?.prompt ?? "", log);
  const seg = Math.round((Date.now() - t0) / 1000);

  const saida = {
    sessao,
    seg,
    uso: log,
    medidas: { original: medir(m.originalQueFica), novo: medir(m.roteiro) },
    portoes: portoes(m.originalQueFica, m.roteiro),
    ...m,
  };
  const dir = path.join(process.cwd(), "runs", "027-prova", "v2");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${sessao}.json`), JSON.stringify(saida, null, 2));
  console.log(
    `${sessao} | ${seg} s | ${m.leitura.beats.length} blocos | ${m.reforcos.length} reforços | original ${JSON.stringify(saida.medidas.original)} novo ${JSON.stringify(saida.medidas.novo)}\nportões: ${saida.portoes.join(" | ") || "passou"}\nuso: ${JSON.stringify(log)}`
  );
}

async function main() {
  const ids = process.argv.slice(2);
  if (!ids.length) throw new Error("passe ao menos um sessionId");
  // em série: é prova para leitura humana, não lote
  for (const id of ids) await uma(id).catch((e) => console.error(`${id} FALHOU`, e));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
