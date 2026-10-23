// Preditor 2026-10 (variante OpenAI): baixa da public.documents (viral data) o embedding
// text-embedding-3-small (1536) dos vídeos do estudo. Só leitura (select paginado por lote de ids).
//   npx tsx --env-file="<codex>/.env.local" src/preditor/export_documents.ts
// Saída (cache local, fora do git): data/docs_emb.f32 (Float32, 1536 por linha) e data/docs_ids.json.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const DATA = new URL("../../data/", import.meta.url);
const vd = createClient(process.env.VIRAL_DATA_URL!, process.env.VIRAL_DATA_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  const ids: string[] = JSON.parse(readFileSync(new URL("videos.json", DATA), "utf8")).map((v: { video_id: string }) => v.video_id);
  const meta: { id: string; video_id: string; len: number }[] = [], vecs: number[][] = [];
  for (let a = 0; a < ids.length; a += 100) {
    const { data, error } = await vd.from("documents").select("id,video_id,content,embedding").in("video_id", ids.slice(a, a + 100));
    if (error) throw error;
    for (const d of data ?? []) {
      const e = typeof d.embedding === "string" ? JSON.parse(d.embedding) : d.embedding;
      if (!Array.isArray(e) || e.length !== 1536) continue;
      meta.push({ id: d.id, video_id: d.video_id, len: String(d.content ?? "").length });
      vecs.push(e);
    }
  }
  const out = new Float32Array(vecs.length * 1536);
  vecs.forEach((v, i) => out.set(v, i * 1536));
  writeFileSync(new URL("docs_emb.f32", DATA), Buffer.from(out.buffer));
  writeFileSync(new URL("docs_ids.json", DATA), JSON.stringify(meta));
  console.log("vídeos do estudo", ids.length, "| documents encontrados", meta.length, "| vídeos com documento", new Set(meta.map((m) => m.video_id)).size);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
