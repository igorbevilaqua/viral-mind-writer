// Plano 025: o roteiro saiu no modo que a skill pediu? Classifica as saídas do banco com o mesmo
// classificador dos roteiros da casa (agents/classificador-modo.md).
//   npx tsx --env-file=.env.local scripts/bancada-modo.ts --runs <dir> --braco S
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { trackedCreate } from "../lib/anthropic";
import { modeloDe } from "../lib/llm-config";
import { PRECO_POR_MTOK } from "../lib/llm-catalogo";
import { agentPrompt, toolArray, toolInput } from "../lib/pipeline/agents";

const MODOS = ["historia", "mecanismo", "demonstracao", "panorama", "conselho", "publi", "misto"];
const CONFIANCA = ["alta", "media", "baixa"];

// ponytail: tool mínima local; a registrar_modos completa (âncora, registro) nasce na Task 11 e
// substitui esta.
const MODOS_TOOL = {
  name: "registrar_modos",
  description: "Registra o modo e a confiança de cada roteiro.",
  input_schema: {
    type: "object" as const,
    properties: {
      rotulos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            script_id: { type: "string" },
            modo: { type: "string", enum: MODOS },
            confianca: { type: "string", enum: CONFIANCA },
          },
          required: ["script_id", "modo", "confianca"],
        },
      },
    },
    required: ["rotulos"],
  },
};

interface Rotulo { script_id: string; modo: string; confianca: string }

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const RUNS = arg("runs")!;
const BRACO = arg("braco")!;
const dir = join(RUNS, BRACO);
const saidas = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

void (async () => {
  const modelo = await modeloDe("aprendizado");
  const rotulos = new Map<string, Rotulo>();
  let usd = 0;
  for (let i = 0; i < saidas.length; i += 10) {
    const lote = saidas.slice(i, i + 10);
    const res = await trackedCreate(undefined, "classificacao_modo", {
      model: modelo,
      max_tokens: 8000,
      tools: [MODOS_TOOL],
      tool_choice: { type: "tool", name: "registrar_modos" },
      system: agentPrompt("classificador-modo"),
      messages: [{ role: "user", content: lote.map((s) => `### ${s.pauta.id}\n\n${s.hook ?? ""}\n\n${s.roteiro ?? ""}`).join("\n\n---\n\n") }],
    });
    const p = PRECO_POR_MTOK[modelo];
    const u = res.usage;
    if (p) usd += (u.input_tokens * p.entrada + u.output_tokens * p.saida + (u.cache_creation_input_tokens ?? 0) * p.cacheEscrita + (u.cache_read_input_tokens ?? 0) * p.cacheLeitura) / 1e6;
    const ids = new Set(lote.map((s) => s.pauta.id as string));
    const tool = res.content.find((b) => b.type === "tool_use");
    const lidos = tool?.type === "tool_use" ? toolArray<Rotulo>(toolInput(tool), "rotulos") : [];
    for (const r of lidos) if (ids.has(r.script_id) && MODOS.includes(r.modo)) rotulos.set(r.script_id, r);
  }
  const dist: Record<string, number> = {};
  for (const r of rotulos.values()) dist[r.modo] = (dist[r.modo] ?? 0) + 1;
  const porPauta = saidas.map((s) => ({ id: s.pauta.id, skill: s.skill ?? null, modo: rotulos.get(s.pauta.id)?.modo ?? null, confianca: rotulos.get(s.pauta.id)?.confianca ?? null }));
  const comSkill = porPauta.filter((x) => x.skill && x.modo);
  const bate = comSkill.filter((x) => x.modo === x.skill).length;
  const rel = { braco: BRACO, modelo, custo_usd: +usd.toFixed(3), modos: dist, fidelidade: comSkill.length ? `${bate}/${comSkill.length}` : null, por_pauta: porPauta };
  writeFileSync(join(RUNS, `modo-${BRACO}.json`), JSON.stringify(rel, null, 1));
  console.log(JSON.stringify(rel, null, 1));
})();
