// O modo strict usa um SUBCONJUNTO do JSON Schema, e a única forma de saber se ele aceita o
// schema da modelagem (que usa minItems/maxItems) é mandando uma chamada real.
// Gasta uma chamada de modelo. `npx tsx --env-file=.env.local scripts/checa-modelagem-estrita.ts`
import Anthropic from "@anthropic-ai/sdk";
import { modelagemTool } from "../lib/pipeline/modelagem";
import { viralData } from "../lib/db";

const SESSAO = process.argv[2] ?? "c0b9ced1-f23d-4a9a-88c0-b0cc158ee2a8";

async function main() {
  const { data } = await viralData
    .from("vm_attachments")
    .select("raw_content")
    .eq("session_id", SESSAO)
    .limit(1)
    .maybeSingle();
  const transcript = (data?.raw_content as string | null) ?? "";
  if (!transcript) { console.error("anexo sem transcricao"); process.exit(1); }
  console.log(`transcricao: ${transcript.length} caracteres`);

  const tool = modelagemTool();
  console.log("strict:", (tool as { strict?: boolean }).strict);

  const client = new Anthropic();
  const res = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    tools: [tool as Anthropic.Tool],
    tool_choice: { type: "tool", name: "registrar_modelagem" },
    messages: [{ role: "user", content: `Desconstrua o video abaixo: o mecanismo, nao o conteudo.\n\nTRANSCRICAO:\n${transcript}` }],
  });

  console.log("stop_reason:", res.stop_reason);
  const tu = res.content.find((b) => b.type === "tool_use");
  if (tu?.type !== "tool_use") { console.error("sem tool_use"); process.exit(1); }
  const input = tu.input as Record<string, unknown>;
  const esperados = ["compreensao", "diagnostico", "esqueleto", "nao_transferivel", "timing"];
  console.log("chaves:", Object.keys(input).sort().join(", "));
  const faltando = esperados.filter((k) => !(k in input));
  console.log(faltando.length ? `FALTOU: ${faltando.join(", ")}` : "TODOS OS CAMPOS OBRIGATORIOS VIERAM");
  const esq = input.esqueleto as Record<string, unknown> | undefined;
  console.log("esqueleto.estrutura_narrativa:", esq?.estrutura_narrativa ?? "(ausente)");
  console.log("beats:", Array.isArray(esq?.beats) ? (esq.beats as unknown[]).length : "(ausente)");
}
void main();
