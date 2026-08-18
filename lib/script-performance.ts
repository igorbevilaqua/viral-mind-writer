import { appDb, viralData } from "./db";
import { platformVideoId } from "./video-url";
import { agregarDiarias, mesmoVideo, parseSeguidores, type Diaria } from "./performance-metrics";

// Elo que faltava do flywheel: roteiro publicado → vídeo do corpus → métricas reais em
// vm_script_performance. NÃO passa por videos.crm_script_id: essa coluna pertence ao outro
// app que divide este projeto Supabase (4.952 vídeos já carregam id de script do CRM, zero
// deles nosso), e o linker do ETL só escreve onde ela é null — vídeo já reivindicado pelo
// CRM nunca casaria, inclusive um dos nossos dois publicados.

export interface PerfRow {
  script_id: string;
  viral_data_video_id: string;
  views: number;
  retencao_hook: number | null;
  retencao_final: number | null;
  compartilhamentos: number | null;
  seguidores_ganhos: number | null;
}

export interface CorpusVideo {
  videoId: string;
  plataforma: string | null;
}

// published_url → vídeo do corpus. null = ou a URL não tem id de vídeo, ou o vídeo ainda
// não entrou no corpus. Usada pelo sync e pela página da sessão (mesma resposta nos dois).
export async function resolveCorpusVideo(url: string): Promise<CorpusVideo | null> {
  const pid = platformVideoId(url);
  if (!pid) return null;
  const { data } = await viralData
    .from("videos")
    .select("id, link_video, canais(plataforma)")
    // ponytail: sem índice, seq scan em ~10k linhas; virar índice trigram se doer
    .ilike("link_video", `%${pid}%`)
    .limit(5);
  for (const v of data ?? []) {
    if (!mesmoVideo(v.link_video as string | null, pid)) continue;
    const canal = (Array.isArray(v.canais) ? v.canais[0] : v.canais) as { plataforma?: string | null } | null;
    return { videoId: v.id as string, plataforma: canal?.plataforma ?? null };
  }
  return null;
}

async function metricasDoVideo(video: CorpusVideo) {
  const [diarias, retencao] = await Promise.all([
    viralData
      .from("metricas_diarias")
      .select("views_no_dia, fb_views_no_dia, compartilhamentos_no_dia")
      .eq("video_id", video.videoId),
    viralData
      .from("metricas_retencao")
      .select("retencao_hook, retencao_final, seguidores_ganhos")
      .eq("video_id", video.videoId)
      .order("data", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const r = retencao.data;
  return {
    ...agregarDiarias((diarias.data ?? []) as Diaria[], video.plataforma),
    retencao_hook: r?.retencao_hook == null ? null : Number(r.retencao_hook),
    retencao_final: r?.retencao_final == null ? null : Number(r.retencao_final),
    seguidores_ganhos: parseSeguidores(r?.seguidores_ganhos),
  };
}

export interface SyncResult {
  rows: PerfRow[];
  /** publicado e sem vídeo no corpus — some da medição se ninguém olhar, por isso vai para a UI */
  naoCasaram: { scriptId: string; url: string }[];
}

// Roda no cron semanal (lib/etl.ts) e sob demanda (scripts/backfill-performance.ts).
// Re-sincroniza TODOS os publicados, não só os sem linha: views crescem, e o gate de
// maturidade de 14 dias precisa do número maduro, não do da primeira captura.
export async function syncScriptPerformance(dryRun = false): Promise<SyncResult> {
  const { data: pub, error } = await appDb
    .from("vm_generated_scripts")
    .select("id, published_url")
    .eq("status", "published")
    .not("published_url", "is", null);
  if (error) throw new Error(`roteiros publicados: ${error.message}`);

  const rows: PerfRow[] = [];
  const naoCasaram: SyncResult["naoCasaram"] = [];
  // ponytail: serial; com 2 publicados sobra. Paralelizar em lotes se passar de ~100.
  for (const s of pub ?? []) {
    const url = s.published_url as string;
    const video = await resolveCorpusVideo(url);
    if (!video) {
      // nenhum corte é silencioso: além do log, a caixa de publicação da sessão mostra isso
      naoCasaram.push({ scriptId: s.id, url });
      console.warn(`performance: roteiro ${s.id} publicado em ${url} não casou com nenhum vídeo do corpus`);
      continue;
    }
    rows.push({ script_id: s.id, viral_data_video_id: video.videoId, ...(await metricasDoVideo(video)) });
  }

  if (rows.length && !dryRun) {
    const synced_at = new Date().toISOString();
    const up = await appDb
      .from("vm_script_performance")
      .upsert(rows.map((r) => ({ ...r, synced_at })), { onConflict: "script_id,viral_data_video_id" });
    if (up.error) throw new Error(`upsert vm_script_performance: ${up.error.message}`);
  }
  return { rows, naoCasaram };
}
