import { appDb, viralData } from "./db";

// Plano 020, WP-A. Casamento Codex → vídeo publicado, por texto (vm_match_scripts, 0040).
// Alta confiança entra no flywheel sozinha: vira `published_url`, e daí syncScriptPerformance
// faz o resto. Zona cinza vira pendência no Kasparov (kasparov-filas.ts). Abaixo, descartado.
// Limiares travados pelo conferido a olho em 05/09/2026 (≥0,98 = mesmo roteiro, 12/12).
export const MATCH_AUTO = 0.8;
export const MATCH_PENDENTE = 0.4;

/** Uma linha de vm_match_scripts. */
export interface MatchRow {
  script_id: string;
  video_id: string;
  plataforma: string | null;
  score: number;
  link_video: string | null;
  data_publicacao: string | null;
  hook_codex: string | null;
  hook_video: string | null;
}

export interface Casamento extends MatchRow {
  auto: boolean;
  /** o vídeo cujo link vira published_url (um por roteiro) */
  principal: boolean;
}

// Pura. Um vídeo pertence a UM roteiro (o de maior score — duas versões do mesmo roteiro
// casam com o mesmo vídeo). `principal` é Instagram se houver, senão o maior score; escolhido
// entre os automáticos quando existe algum, porque é dele que sai o published_url.
export function decidirCasamentos(rows: MatchRow[]): Casamento[] {
  const melhorPorVideo = new Map<string, MatchRow>();
  for (const r of rows) {
    if (r.score < MATCH_PENDENTE) continue;
    const atual = melhorPorVideo.get(r.video_id);
    if (!atual || r.score > atual.score) melhorPorVideo.set(r.video_id, r);
  }
  const porScript = new Map<string, MatchRow[]>();
  for (const r of melhorPorVideo.values()) porScript.set(r.script_id, [...(porScript.get(r.script_id) ?? []), r]);

  const out: Casamento[] = [];
  for (const grupo of porScript.values()) {
    const ordem = [...grupo].sort((a, b) => b.score - a.score);
    const autos = ordem.filter((r) => r.score >= MATCH_AUTO);
    const base = autos.length ? autos : ordem;
    const principal = base.find((r) => r.plataforma === "Instagram") ?? base[0];
    for (const r of ordem) out.push({ ...r, auto: r.score >= MATCH_AUTO, principal: r === principal });
  }
  return out;
}

// Nunca sobrescreve published_url existente — quem colou o link sabe mais que o ts_rank.
async function publicar(scriptId: string, link: string, data: string | null): Promise<boolean> {
  const { data: upd, error } = await appDb
    .from("vm_generated_scripts")
    .update({ status: "published", published_url: link, published_at: data })
    .eq("id", scriptId)
    .is("published_url", null)
    .select("id");
  if (error) {
    console.warn(`casamento: não consegui publicar ${scriptId}: ${error.message}`);
    return false;
  }
  return (upd?.length ?? 0) > 0;
}

export interface ResultadoCasamento {
  auto: number;
  pendentes: number;
  publicados: number;
}

const NADA: ResultadoCasamento = { auto: 0, pendentes: 0, publicados: 0 };

// Roda no ETL semanal (lib/etl.ts) e no backfill. Best-effort no padrão de varrerEdicoes:
// migration 0040 ausente vira warning, nunca derruba o ETL.
export async function casarRoteiros(): Promise<ResultadoCasamento> {
  try {
    // ponytail: PostgREST devolve até 1000 linhas; ≤4 por roteiro e decididos saem da busca.
    const { data, error } = await appDb.rpc("vm_match_scripts", { p_min: MATCH_PENDENTE });
    if (error) {
      console.warn(`vm_match_scripts indisponível: ${error.message} — aplicar migration 0040`);
      return NADA;
    }
    const casos = decidirCasamentos((data ?? []) as MatchRow[]);
    if (!casos.length) return NADA;

    const agora = new Date().toISOString();
    const up = await appDb.from("vm_script_matches").upsert(
      casos.map((c) => ({
        script_id: c.script_id,
        video_id: c.video_id,
        plataforma: c.plataforma,
        score: c.score,
        metodo: c.auto ? "tsrank_auto" : "tsrank_hook",
        confirmado: c.auto ? true : null,
        decidido_em: c.auto ? agora : null,
      })),
      { onConflict: "script_id,video_id" }
    );
    if (up.error) {
      console.warn(`vm_script_matches upsert: ${up.error.message}`);
      return NADA;
    }

    let publicados = 0;
    for (const c of casos)
      if (c.auto && c.principal && c.link_video && (await publicar(c.script_id, c.link_video, c.data_publicacao)))
        publicados++;
    return {
      auto: casos.filter((c) => c.auto).length,
      pendentes: casos.filter((c) => !c.auto).length,
      publicados,
    };
  } catch (e) {
    console.error("casamento de roteiros falhou, ETL segue", e);
    return NADA;
  }
}

// Resposta da pendência no Kasparov. Aceito → o vídeo vira published_url se ainda não houver.
export async function confirmarCasamento(scriptId: string, videoId: string, aceito: boolean): Promise<void> {
  const { error } = await appDb
    .from("vm_script_matches")
    .update({ confirmado: aceito, decidido_em: new Date().toISOString(), metodo: "kasparov" })
    .eq("script_id", scriptId)
    .eq("video_id", videoId);
  if (error) throw new Error(`não consegui gravar o casamento: ${error.message}`);
  if (!aceito) return;
  const { data: v } = await viralData
    .from("videos")
    .select("link_video, data_publicacao")
    .eq("id", videoId)
    .maybeSingle();
  if (v?.link_video) await publicar(scriptId, v.link_video as string, (v.data_publicacao as string | null) ?? null);
}
