// Backfill de embeddings do corpus (Viral Data → tabela documents).
// Duas passadas, ambas resumíveis (rodar de novo continua de onde parou):
//   1. documents com embedding IS NULL → gera embedding do content existente.
//   2. videos com roteiro sem linha em documents (~5,6k) → cria o document
//      (content = Título/Assunto + roteiro, como os docs existentes) com embedding.
// Modelo: text-embedding-3-small (1536 dims) — mesmo de lib/pipeline/context.ts,
// compatível com a coluna documents.embedding vector(1536) e a RPC match_documents.
//
// Rodar da raiz do projeto:
//   npx tsx --env-file=.env.local scripts/backfill-embeddings.ts [--dry-run] [--limit N]
//   --dry-run  só conta e estima o custo, não chama a OpenAI nem escreve no banco
//   --limit N  processa no máximo N itens (default: sem limite)
import OpenAI from "openai";
import { viralData } from "../lib/db";

const MODEL = "text-embedding-3-small";
const PRICE_PER_1M_TOKENS = 0.02; // USD, text-embedding-3-small
const BATCH = 100;
const MAX_CHARS = 8000; // mesmo corte do embed() em lib/pipeline/context.ts

const DRY_RUN = process.argv.includes("--dry-run");
const limitIdx = process.argv.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : Infinity;
if (!Number.isFinite(LIMIT) && limitIdx >= 0) throw new Error("--limit precisa de um número");

const openai = DRY_RUN ? null : new OpenAI();
let processed = 0;
let estTokens = 0;

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await openai!.embeddings.create({
    model: MODEL,
    input: texts.map((t) => t.slice(0, MAX_CHARS)),
  });
  return res.data.map((d) => d.embedding);
}

function trackCost(texts: string[]) {
  for (const t of texts) estTokens += Math.ceil(Math.min(t.length, MAX_CHARS) / 4);
}

// Passada 1: documents já existentes mas sem embedding.
async function fillNullEmbeddings() {
  for (;;) {
    if (processed >= LIMIT) return;
    const { data, error } = await viralData
      .from("documents")
      .select("id, content")
      .is("embedding", null)
      .order("id")
      .limit(Math.min(BATCH, LIMIT - processed));
    if (error) throw new Error(`select documents: ${error.message}`);
    if (!data?.length) return;

    trackCost(data.map((d) => d.content ?? ""));
    if (DRY_RUN) {
      processed += data.length;
      console.log(`[dry-run] passada 1: +${data.length} documents sem embedding (total ${processed})`);
      // dry-run não escreve, então o WHERE embedding IS NULL devolveria a mesma página para sempre
      if (data.length < BATCH) return;
      continue;
    }

    const embeddings = await embedBatch(data.map((d) => d.content ?? ""));
    for (let i = 0; i < data.length; i++) {
      const { error: upErr } = await viralData.from("documents").update({ embedding: embeddings[i] }).eq("id", data[i].id);
      if (upErr) throw new Error(`update document ${data[i].id}: ${upErr.message}`);
    }
    processed += data.length;
    console.log(`passada 1: ${processed} embeddings preenchidos`);
  }
}

// Soma de views por vídeo (metricas_diarias é diária), paginando o PostgREST.
async function viewsFor(videoIds: string[]): Promise<Map<string, number>> {
  const views = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await viralData
      .from("metricas_diarias")
      .select("video_id, views_no_dia")
      .in("video_id", videoIds)
      .range(from, from + 999);
    if (error) throw new Error(`metricas_diarias: ${error.message}`);
    for (const m of data ?? []) views.set(m.video_id, (views.get(m.video_id) ?? 0) + (m.views_no_dia ?? 0));
    if (!data || data.length < 1000) return views;
  }
}

// Passada 2: vídeos com roteiro que nunca viraram document.
async function fillMissingDocuments() {
  const { data: canais, error: canErr } = await viralData.from("canais").select("id, nome_do_canal, plataforma");
  if (canErr) throw new Error(`canais: ${canErr.message}`);
  const canalById = new Map((canais ?? []).map((c) => [c.id, c]));

  let lastId = "";
  for (;;) {
    if (processed >= LIMIT) return;
    let q = viralData
      .from("videos")
      .select("id, canal_id, titulo, assunto, roteiro, data_publicacao")
      .not("roteiro", "is", null)
      .neq("roteiro", "")
      .order("id")
      .limit(BATCH);
    if (lastId) q = q.gt("id", lastId);
    const { data: videos, error } = await q;
    if (error) throw new Error(`select videos: ${error.message}`);
    if (!videos?.length) return;
    lastId = videos[videos.length - 1].id;

    // pula os que já têm document (é isso que torna o script resumível)
    const { data: existing, error: exErr } = await viralData
      .from("documents")
      .select("video_id")
      .in("video_id", videos.map((v) => v.id));
    if (exErr) throw new Error(`select documents: ${exErr.message}`);
    const done = new Set((existing ?? []).map((d) => d.video_id));

    const pending = videos.filter((v) => !done.has(v.id) && v.roteiro.trim()).slice(0, LIMIT - processed);
    if (!pending.length) continue;

    const contents = pending.map((v) => {
      const header = [`Título: ${v.titulo ?? "sem título"}`, v.assunto ? `Assunto: ${v.assunto}` : null].filter(Boolean).join("\n");
      return `${header}\n\n${v.roteiro.trim()}`;
    });
    trackCost(contents);

    if (DRY_RUN) {
      processed += pending.length;
      console.log(`[dry-run] passada 2: +${pending.length} vídeos sem document (total ${processed})`);
      continue;
    }

    const [embeddings, views] = await Promise.all([embedBatch(contents), viewsFor(pending.map((v) => v.id))]);
    const rows = pending.map((v, i) => {
      const canal = canalById.get(v.canal_id);
      return {
        video_id: v.id,
        content: contents[i],
        embedding: embeddings[i],
        metadata: {
          video_id: v.id,
          canal_id: v.canal_id,
          canal_nome: canal?.nome_do_canal ?? null,
          plataforma: canal?.plataforma ?? null,
          titulo: v.titulo,
          assunto: v.assunto,
          data_publicacao: v.data_publicacao,
          views: views.get(v.id) ?? null,
          backfill: true,
        },
      };
    });
    const { error: insErr } = await viralData.from("documents").upsert(rows, { onConflict: "video_id" });
    if (insErr) throw new Error(`upsert documents: ${insErr.message}`);
    processed += pending.length;
    console.log(`passada 2: ${processed} documents criados com embedding`);
  }
}

async function main() {
  await fillNullEmbeddings();
  await fillMissingDocuments();
  const cost = (estTokens / 1_000_000) * PRICE_PER_1M_TOKENS;
  console.log(
    `${DRY_RUN ? "[dry-run] " : ""}fim: ${processed} itens, ~${estTokens.toLocaleString()} tokens, custo ${DRY_RUN ? "estimado " : "aprox. "}US$ ${cost.toFixed(4)} (${MODEL})`
  );
}

main().catch((e) => {
  console.error("backfill falhou:", e);
  process.exit(1);
});
