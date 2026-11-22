// Roda a LEITURA (plano 027) sobre o original de uma sessão real e imprime o resultado.
// Serve a duas coisas: provar que a API aceita o schema estrito, e deixar um humano ler a leitura.
// Gasta uma chamada de modelo (~US$ 0,05).
//   npx tsx --env-file=.env.local scripts/checa-leitura.ts [sessionId]
import { appDb } from "../lib/db";
import { lerVideo } from "../lib/modelagem/leitura";
import { palavras } from "../lib/modelagem/leitura-schema";
import type { UsageLog } from "../lib/anthropic";

const SESSAO = process.argv[2] ?? "b4725097-34cb-4abc-9189-cdbb124fc2af"; // quiet luxury

async function main() {
  const { data } = await appDb
    .from("vm_attachments")
    .select("raw_content")
    .eq("session_id", SESSAO)
    .eq("is_modelagem", true)
    .limit(1)
    .maybeSingle();
  const original = ((data?.raw_content as string | null) ?? "").trim();
  if (!original) throw new Error("sessão sem original gravado");

  const log: UsageLog = {};
  const t0 = Date.now();
  const l = await lerVideo(original, "", log);
  console.log(JSON.stringify(l, null, 2));
  const cobertura = palavras(l.beats.map((b) => b.trecho).join(" ")) / palavras(original);
  console.log(
    `\n${((Date.now() - t0) / 1000).toFixed(0)} s | ${l.beats.length} beats | cobertura ${(cobertura * 100).toFixed(0)}% | ` +
      `${l.ativos.length} ativos (${l.ativos.filter((a) => a.destino === "abrasileirar").length} abrasileirar, ` +
      `${l.ativos.filter((a) => a.checar).length} checar) | ${l.palavras_dificeis.length} palavras difíceis`
  );
  console.log("uso:", JSON.stringify(log));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
