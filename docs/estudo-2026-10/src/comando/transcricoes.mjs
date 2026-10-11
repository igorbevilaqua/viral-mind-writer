// Leitura (só select) do fim da transcrição de cada vídeo VM (Viral Data, tabela videos.roteiro).
// Motivo: comando_video é extraído por LLM e muitas vezes traz só a última frase do CTA.
// Rodar: node --env-file="/Users/igorbevilaqua/Projetos/CODEX - Viral Mind/.env.local" src/comando/transcricoes.mjs
// Saída: out/comando/transcricao_fim.json  { video_id: últimos 1200 caracteres da transcrição }
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const DATA = new URL("../../data/", import.meta.url).pathname, OUT = new URL("../../out/comando/", import.meta.url).pathname;
const vd = createClient(process.env.VIRAL_DATA_URL, process.env.VIRAL_DATA_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ids = JSON.parse(readFileSync(DATA + "videos.json", "utf8")).map((v) => v.video_id);
const out = {};
for (let i = 0; i < ids.length; i += 150) {
  const { data, error } = await vd.from("videos").select("id,roteiro").in("id", ids.slice(i, i + 150));
  if (error) throw error;
  for (const v of data ?? []) if (v.roteiro) out[v.id] = v.roteiro.slice(-1200);
}
writeFileSync(OUT + "transcricao_fim.json", JSON.stringify(out));
console.log("vídeos:", ids.length, "| com transcrição:", Object.keys(out).length);
