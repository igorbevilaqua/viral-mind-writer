// Banco de prova do /modelagem (plano 027): UMA chamada do modelador sobre o original de sessões
// reais, lado a lado com o que a produção entregou, com as medidas em código.
// Não grava nada no banco. Custo: uma chamada do modelo de escrita por sessão.
//   npx tsx --env-file=.env.local scripts/modelar-prova.ts <sessionId> [sessionId...]
// Saída: runs/027-prova/<sessionId>.md
import fs from "node:fs";
import path from "node:path";
import { appDb } from "../lib/db";
import { trackedCreate, type UsageLog } from "../lib/anthropic";
import { modeloDe } from "../lib/llm-config";
import { agentPrompt } from "../lib/pipeline/agents";
import { medir, portoes } from "../lib/modelagem/portoes";

const secao = (texto: string, nome: string) =>
  texto.match(new RegExp(`## ${nome}\\s*\\n([\\s\\S]*?)(?=\\n## [A-Z]|$)`))?.[1]?.trim() ?? "";

async function uma(sessao: string) {
  const { data: s } = await appDb.from("vm_sessions").select("prompt").eq("id", sessao).single();
  const { data: a } = await appDb
    .from("vm_attachments")
    .select("raw_content")
    .eq("session_id", sessao)
    .eq("is_modelagem", true)
    .limit(1)
    .maybeSingle();
  const { data: g } = await appDb
    .from("vm_generated_scripts")
    .select("hook, roteiro")
    .eq("session_id", sessao)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const original = ((a?.raw_content as string | null) ?? "").trim();
  if (!original) throw new Error(`${sessao}: sessão sem original gravado`);

  const log: UsageLog = {};
  const t0 = Date.now();
  const res = await trackedCreate(log, "modelador", {
    model: await modeloDe("escrita"),
    max_tokens: 16000,
    system: agentPrompt("modelador"),
    messages: [
      {
        role: "user",
        content:
          (s?.prompt?.trim() ? `DIREÇÃO DO USUÁRIO:\n${s.prompt.trim()}\n\n` : "") + `VÍDEO ORIGINAL (transcrição):\n${original}`,
      },
    ],
  });
  const texto = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");
  const seg = Math.round((Date.now() - t0) / 1000);

  const hook1 = secao(texto, "HOOKS").match(/^1\.\s*(?:\[[^\]]*\]\s*)?(.+)$/m)?.[1] ?? "";
  const novo = `${hook1}\n\n${secao(texto, "ROTEIRO")}`;
  const producao = g ? `${g.hook ?? ""}\n\n${g.roteiro ?? ""}` : "";
  const linha = (nome: string, t: string) => {
    const m = medir(t);
    return `| ${nome} | ${m.palavras} | ${m.numeros} | ${m.palavrasPorFrase} |`;
  };
  const usd = Object.values(log).reduce((x, f) => x + ((f as { usd?: number }).usd ?? 0), 0);

  const md = [
    `# ${sessao}`,
    `${seg} s | US$ ${usd.toFixed(2)} | modelo ${res.model}`,
    `| versão | palavras | números | palavras por frase |\n|---|---|---|---|\n${linha("original", original)}\n${linha("novo", novo)}\n${producao ? linha("produção", producao) : ""}`,
    `Portões do novo: ${portoes(original, novo).join(" | ") || "passou"}`,
    producao ? `Portões da produção: ${portoes(original, producao).join(" | ") || "passou"}` : "",
    `## ORIGINAL\n${original}`,
    `## NOVO\n${texto}`,
    producao ? `## PRODUÇÃO (o que o Codex entregou)\n${producao}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const dir = path.join(process.cwd(), "runs", "027-prova");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${sessao}.md`), md);
  console.log(md.split("## ORIGINAL")[0]);
}

async function main() {
  const ids = process.argv.slice(2);
  if (!ids.length) throw new Error("passe ao menos um sessionId");
  // em série: é prova para leitura humana, não lote
  for (const id of ids) await uma(id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
