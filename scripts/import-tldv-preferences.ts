// Puxa as calls de kickoff no TL;dv, casa cada uma com um cliente pelo nome,
// extrai preferências (tom de voz, proibições, vocabulário...) via LLM e
// grava em vm_client_preferences.
// Rodar da raiz do projeto: npx tsx --env-file=.env.local scripts/import-tldv-preferences.ts [--dry-run]
import { anthropic, ANALYST_MODEL } from "../lib/anthropic";
import { appDb, viralData } from "../lib/db";

const TLDV_API_KEY = process.env.TLDV_API_KEY;
if (!TLDV_API_KEY) throw new Error("TLDV_API_KEY não definida em .env.local");

const DRY_RUN = process.argv.includes("--dry-run");
const BASE = "https://pasta.tldv.io/v1alpha1";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

async function tldvFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { "x-api-key": TLDV_API_KEY! } });
  if (!res.ok) throw new Error(`TL;dv ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

type Meeting = { id: string; name: string; happenedAt: string };

async function listKickoffMeetings(): Promise<Meeting[]> {
  const out: Meeting[] = [];
  let page = 1;
  for (;;) {
    const data = await tldvFetch(`/meetings?page=${page}&pageSize=50&meetingType=external`);
    for (const m of data.results as Meeting[]) {
      if (normalize(m.name).includes("kickoff")) out.push(m);
    }
    if (page >= data.pages) break;
    page++;
  }
  return out;
}

async function getMeetingText(meetingId: string): Promise<string> {
  try {
    const notes = await tldvFetch(`/meetings/${meetingId}/notes`);
    if (notes.markdownContent?.trim()) return notes.markdownContent;
  } catch {
    // segue pro transcript
  }
  const transcript = await tldvFetch(`/meetings/${meetingId}/transcript`);
  return (transcript.data as { speaker: string; text: string }[])
    .map((t) => `${t.speaker}: ${t.text}`)
    .join("\n");
}

const EXTRACAO_TOOL = {
  name: "registrar_preferencias",
  description: "Registra as preferências de escrita de um cliente extraídas da call de kickoff.",
  input_schema: {
    type: "object" as const,
    properties: {
      proibicoes: { type: "array", items: { type: "string" }, description: "temas, palavras ou abordagens que o cliente pediu para NUNCA usar" },
      tom_de_voz: { type: "string", description: "tom de voz desejado, em poucas palavras" },
      temas_preferidos: { type: "array", items: { type: "string" } },
      vocabulario_evitar: { type: "array", items: { type: "string" } },
      vocabulario_usar: { type: "array", items: { type: "string" } },
      notas_entrevista: { type: "string", description: "resumo livre com contexto relevante que não coube nos campos acima" },
    },
    required: ["proibicoes", "tom_de_voz", "temas_preferidos", "vocabulario_evitar", "vocabulario_usar", "notas_entrevista"],
  },
};

async function extractPrefs(transcript: string) {
  const msg = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 2000,
    tools: [EXTRACAO_TOOL],
    tool_choice: { type: "tool", name: "registrar_preferencias" },
    messages: [
      {
        role: "user",
        content: `Extraia as preferências de escrita de conteúdo mencionadas nesta transcrição de call de kickoff com cliente. Só inclua o que foi dito explicitamente; campos sem menção ficam vazios/nulos.\n\n${transcript.slice(0, 100_000)}`,
      },
    ],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("modelo não retornou tool_use");
  return block.input as {
    proibicoes: string[];
    tom_de_voz: string;
    temas_preferidos: string[];
    vocabulario_evitar: string[];
    vocabulario_usar: string[];
    notas_entrevista: string;
  };
}

async function main() {
  const { data: clientes, error } = await viralData.from("clientes").select("id, nome").eq("ativo", true);
  if (error) throw error;
  if (!clientes?.length) throw new Error("nenhum cliente ativo encontrado");

  const meetings = await listKickoffMeetings();
  console.log(`${meetings.length} calls de kickoff encontradas no TL;dv`);

  for (const cliente of clientes) {
    const match = meetings.find((m) => normalize(m.name).includes(normalize(cliente.nome)));
    if (!match) {
      console.log(`- ${cliente.nome}: sem call de kickoff correspondente, pulando`);
      continue;
    }

    console.log(`- ${cliente.nome}: casado com "${match.name}" (${match.happenedAt})`);
    const text = await getMeetingText(match.id);
    const prefs = await extractPrefs(text);

    if (DRY_RUN) {
      console.log(JSON.stringify(prefs, null, 2));
      continue;
    }

    const { error: upErr } = await appDb.from("vm_client_preferences").upsert({
      client_id: cliente.id,
      proibicoes: prefs.proibicoes,
      tom_de_voz: prefs.tom_de_voz || null,
      temas_preferidos: prefs.temas_preferidos,
      vocabulario_evitar: prefs.vocabulario_evitar,
      vocabulario_usar: prefs.vocabulario_usar,
      notas_entrevista: prefs.notas_entrevista || null,
      updated_at: new Date().toISOString(),
    });
    if (upErr) throw upErr;
    console.log(`  salvo em vm_client_preferences`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
