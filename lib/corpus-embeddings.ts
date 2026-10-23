// Corpus vetorial do few-shot e do preditor (tabela documents, text-embedding-3-small, 1536
// dims, a RPC match_documents). Duas passadas, ambas resumíveis:
//   1. documents com embedding IS NULL → gera embedding do content existente.
//   2. videos com roteiro sem linha em documents → cria o document (content = Título/Assunto +
//      roteiro) com embedding.
// Quem chama: scripts/backfill-embeddings.ts (tudo) e o ETL semanal (só os publicados nos
// últimos `dias`), porque até 22/10/2026 só o script manual alimentava a tabela e ela parou
// em 14/09.
import OpenAI from "openai";
import { viralData } from "./db";

const MODEL = "text-embedding-3-small";
const PRICE_PER_1M_TOKENS = 0.02; // USD, text-embedding-3-small
const BATCH = 100;
const MAX_CHARS = 8000; // mesmo corte do embed() em lib/pipeline/context.ts

// O HNSW de documents.embedding deixa o upsert de 100 vetores passar do statement timeout
// (8 s): grava em fatias de 10.
const GRAVA = 10;

let DRY_RUN = false;
let LIMIT = Infinity;
let DESDE: string | null = null;
let openai: OpenAI | null = null;
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

// Views por vídeo, paginando o PostgREST. views_no_dia é snapshot acumulado (total até
// o dia), não delta → total do vídeo = pico (max), não soma dos dias.
async function viewsFor(videoIds: string[]): Promise<Map<string, number>> {
  const views = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await viralData
      .from("metricas_diarias")
      .select("video_id, views_no_dia")
      .in("video_id", videoIds)
      .range(from, from + 999);
    if (error) throw new Error(`metricas_diarias: ${error.message}`);
    for (const m of data ?? []) views.set(m.video_id, Math.max(views.get(m.video_id) ?? 0, m.views_no_dia ?? 0));
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
    if (DESDE) q = q.gte("data_publicacao", DESDE);
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
    for (let i = 0; i < rows.length; i += GRAVA) {
      const { error: insErr } = await viralData.from("documents").upsert(rows.slice(i, i + GRAVA), { onConflict: "video_id" });
      if (insErr) throw new Error(`upsert documents: ${insErr.message}`);
    }
    processed += pending.length;
    console.log(`passada 2: ${processed} documents criados com embedding`);
  }
}

export async function sincronizarCorpus(opts: { dryRun?: boolean; limit?: number; dias?: number } = {}) {
  DRY_RUN = !!opts.dryRun;
  LIMIT = opts.limit ?? Infinity;
  DESDE = opts.dias ? new Date(Date.now() - opts.dias * 86_400_000).toISOString().slice(0, 10) : null;
  openai = DRY_RUN ? null : new OpenAI();
  processed = 0;
  estTokens = 0;
  await fillNullEmbeddings();
  await fillMissingDocuments();
  return { itens: processed, usd: Math.round((estTokens / 1_000_000) * PRICE_PER_1M_TOKENS * 10_000) / 10_000 };
}
