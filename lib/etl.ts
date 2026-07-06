import { appDb, viralData } from "./db";

// ETL semanal: materializa insights do corpus em vm_viral_insights
// e sincroniza performance dos roteiros publicados (flywheel).
export async function runWeeklyEtl() {
  const { data: snapshot, error } = await viralData.rpc("vm_insights_snapshot");
  if (error) throw new Error(`vm_insights_snapshot: ${error.message}`);

  const rows: { scope: string; insight_type: string; payload: unknown }[] = [];
  for (const type of ["top_views", "top_retention", "winning_elements", "pacing_stats"] as const) {
    if (snapshot[type]) rows.push({ scope: "global", insight_type: type, payload: snapshot[type] });
  }
  for (const [clienteId, tops] of Object.entries(snapshot.per_client ?? {})) {
    rows.push({ scope: `client:${clienteId}`, insight_type: "top_videos", payload: tops });
  }

  await appDb.from("vm_viral_insights").delete().neq("scope", ""); // snapshot completo substitui o anterior
  const ins = await appDb.from("vm_viral_insights").insert(rows);
  if (ins.error) throw new Error(`insert insights: ${ins.error.message}`);

  // Flywheel: performance real dos roteiros gerados aqui e publicados
  const { data: published, error: pubErr } = await viralData.rpc("vm_published_scripts");
  if (pubErr) throw new Error(`vm_published_scripts: ${pubErr.message}`);

  let synced = 0;
  if (published?.length) {
    const ids = published.map((p: { crm_script_id: string }) => p.crm_script_id);
    const { data: ours } = await appDb.from("vm_generated_scripts").select("id").in("id", ids);
    const ourIds = new Set((ours ?? []).map((o) => o.id));
    const perf = published
      .filter((p: { crm_script_id: string }) => ourIds.has(p.crm_script_id))
      .map((p: { crm_script_id: string; video_id: string; views: number; retencao_hook: number; retencao_final: number; compartilhamentos: number }) => ({
        script_id: p.crm_script_id,
        viral_data_video_id: p.video_id,
        views: p.views,
        retencao_hook: p.retencao_hook,
        retencao_final: p.retencao_final,
        compartilhamentos: p.compartilhamentos,
        synced_at: new Date().toISOString(),
      }));
    if (perf.length) {
      const up = await appDb.from("vm_script_performance").upsert(perf);
      if (up.error) throw new Error(`upsert performance: ${up.error.message}`);
      synced = perf.length;
    }
  }

  return { insights: rows.length, scriptsSynced: synced };
}
