// Estudo de comunicação (plano 020, WP-B): mede cada texto do corpus e do Codex com
// lib/text-metrics.ts e grava um JSON. Não persiste em tabela — só o estudo (WP-D) lê.
//
// Rodar da raiz do projeto:
//   npx tsx --env-file=.env.local scripts/study-text-metrics.ts
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { appDb, viralData } from "../lib/db";
import { textMetrics, type TextMetrics } from "../lib/text-metrics";

const OUT = "docs/estudo-2026-09/text-metrics.json";
const PAGE = 1000;

interface FatoVideo {
  video_id: string;
  cliente_id: string | null;
  plataforma: string | null;
  vm_script: string | null;
  coeficiente_viral: number | null;
  classificacao: string | null;
  maturando: boolean | null;
  hook: string | null;
}

interface Video { id: string; hook: string | null; roteiro: string | null }
interface Script { id: string; client_id: string | null; hook: string | null; roteiro: string | null; created_at: string }

type Item = TextMetrics & {
  fonte: "corpus" | "codex";
  video_ids?: string[];
  script_id?: string;
  cliente_id: string | null;
  plataformas: string[];
  vm_script: string | null;
  coeficiente_viral: number | null;
  classificacao: string | null;
  maturando: boolean | null;
  created_at?: string;
};

// PostgREST devolve no máximo 1000 linhas por chamada: pagina por .range() com ordem
// estável, senão páginas podem repetir/pular linhas entre chamadas.
async function paginar<T>(nome: string, query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error(`${nome}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

async function main() {
  const fato = await paginar<FatoVideo>("oraculo.fato_video", (a, b) =>
    viralData
      .schema("oraculo")
      .from("fato_video")
      .select("video_id, cliente_id, plataforma, vm_script, coeficiente_viral, classificacao, maturando, hook")
      .order("video_id")
      .range(a, b)
  );
  const fatoPorVideo = new Map(fato.map((f) => [f.video_id, f]));
  console.log(`fato_video: ${fato.length} linhas`);

  // Tabela inteira paginada e filtrada em memória: .in() com 11k uuids estoura a URL.
  const videos = (
    await paginar<Video>("videos", (a, b) =>
      viralData.from("videos").select("id, hook, roteiro").not("roteiro", "is", null).order("id").range(a, b)
    )
  ).filter((v) => fatoPorVideo.has(v.id) && v.roteiro?.trim());
  console.log(`videos com roteiro e em fato_video: ${videos.length}`);

  const scripts = (
    await paginar<Script>("vm_generated_scripts", (a, b) =>
      appDb.from("vm_generated_scripts").select("id, client_id, hook, roteiro, created_at").order("id").range(a, b)
    )
  ).filter((s) => s.roteiro?.trim());
  console.log(`vm_generated_scripts com roteiro: ${scripts.length}`);

  // Dedup por md5(roteiro): o mesmo roteiro postado em IG/TT/YT é UM texto (unidade do estudo).
  // Linha principal = Instagram se houver (estrato primário), senão a primeira.
  const grupos = new Map<string, Video[]>();
  for (const v of videos) {
    const k = md5(v.roteiro!.trim());
    grupos.set(k, [...(grupos.get(k) ?? []), v]);
  }
  const corpus: Item[] = [...grupos.values()].map((vs) => {
    const fatos = vs.map((v) => fatoPorVideo.get(v.id)!);
    const principal = fatos.find((f) => f.plataforma === "Instagram") ?? fatos[0];
    const texto = vs[0].roteiro!;
    return {
      fonte: "corpus",
      video_ids: vs.map((v) => v.id),
      cliente_id: principal.cliente_id,
      plataformas: [...new Set(fatos.map((f) => f.plataforma).filter((p): p is string => !!p))],
      vm_script: principal.vm_script,
      coeficiente_viral: principal.coeficiente_viral,
      classificacao: principal.classificacao,
      maturando: fatos.some((f) => f.maturando),
      ...textMetrics(texto, vs[0].hook ?? principal.hook),
    };
  });

  // Codex: sem plataforma nem resultado próprio aqui — o casamento com vídeo é do WP-A.
  const codex: Item[] = scripts.map((s) => ({
    fonte: "codex",
    script_id: s.id,
    cliente_id: s.client_id,
    plataformas: [],
    vm_script: null,
    coeficiente_viral: null,
    classificacao: null,
    maturando: null,
    created_at: s.created_at,
    ...textMetrics(s.roteiro!, s.hook),
  }));

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify({ gerado_em: new Date().toISOString(), n_corpus: corpus.length, n_codex: codex.length, itens: [...corpus, ...codex] }, null, 1)
  );
  console.log(`gravado ${OUT}: ${corpus.length} textos do corpus (de ${videos.length} vídeos), ${codex.length} do Codex`);
}

main().catch((e) => {
  console.error("study-text-metrics falhou:", e);
  process.exit(1);
});
