import { notFound } from "next/navigation";
import { appDb, viralData } from "@/lib/db";
import { isStaleGeneration } from "@/lib/generation";
import type { LintViolation } from "@/lib/pipeline/slop-lint";
import SessionView from "@/components/session-view";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string }>;
}) {
  const { id } = await params;
  const { start } = await searchParams;

  const { data: session } = await appDb
    .from("vm_sessions")
    .select("id, prompt, status, error_message, artifacts, generation_started_at, created_at, client_id, clientes(nome)")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();

  const [{ data: scripts }, { data: analyses }] = await Promise.all([
    appDb
      .from("vm_generated_scripts")
      .select(
        "id, version, headline, hook, hook_variants, roteiro, comando, fontes, slop_lint_violations, status, published_url, published_at, created_at, pipeline_trace"
      )
      .eq("session_id", id)
      .order("version", { ascending: false }),
    appDb
      .from("vm_modelagem_analyses")
      .select("analysis, replication_brief, vm_attachments!inner(session_id)")
      .eq("vm_attachments.session_id", id),
  ]);

  const scriptIds = (scripts ?? []).map((s) => s.id);
  // Performance real dos roteiros publicados (flywheel fechado — sincroniza toda segunda via ETL)
  const [{ data: performance }, { data: feedback }] = scriptIds.length
    ? await Promise.all([
        appDb
          .from("vm_script_performance")
          .select("script_id, views, retencao_hook, retencao_final, compartilhamentos, seguidores_ganhos")
          .in("script_id", scriptIds),
        // WP-F.3: feedback já dado aparece marcado — rating mais recente por script
        appDb
          .from("vm_script_feedback")
          .select("script_id, rating")
          .in("script_id", scriptIds)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const lastRating: Record<string, number> = {};
  for (const f of feedback ?? []) {
    if (f.rating != null && lastRating[f.script_id] === undefined) lastRating[f.script_id] = f.rating;
  }

  // WP-F.4/.3: só o que a UI precisa do trace (violations + edição inline) — o resto fica no server
  const scriptsView = (scripts ?? []).map(({ pipeline_trace, ...s }) => {
    const trace = (pipeline_trace ?? {}) as { violations?: LintViolation[]; edicao_humana?: boolean };
    return {
      ...s,
      violations: Array.isArray(trace.violations) ? trace.violations : [],
      edicao_humana: !!trace.edicao_humana,
    };
  });

  // WP-F.2: baseline do cliente (média 30d, fallback geral) pra comparar com as métricas reais.
  // Só busca quando há performance a comparar; falha do RPC nunca derruba a página.
  let baseline: { views: number; periodo: "30d" | "geral" } | null = null;
  if (session.client_id && (performance ?? []).some((p) => p.views != null)) {
    try {
      const { data: panel } = await viralData.rpc("vm_client_panel", { p_cliente_id: session.client_id });
      const v30 = Number(panel?.media_views_30d) || 0;
      const geral = Number(panel?.media_views_geral) || 0;
      baseline = v30 ? { views: v30, periodo: "30d" } : geral ? { views: geral, periodo: "geral" } : null;
    } catch (e) {
      console.error("vm_client_panel indisponível — PublishBox segue sem baseline", e);
    }
  }

  const client = Array.isArray(session.clientes) ? session.clientes[0] : session.clientes;
  // generating >10min = geração morta → erro recuperável (botão de retry volta)
  const generationStale = isStaleGeneration(session.status, session.generation_started_at);

  return (
    <SessionView
      session={{
        id: session.id,
        prompt: session.prompt,
        status: session.status,
        error_message: session.error_message,
        clientNome: client?.nome ?? null,
      }}
      generationStale={generationStale}
      scripts={scriptsView}
      performance={performance ?? []}
      baseline={baseline}
      lastRating={lastRating}
      analyses={(analyses ?? []).map((a) => ({ analysis: a.analysis, replication_brief: a.replication_brief }))}
      artifacts={session.artifacts ?? null}
      autoStart={start === "1" && session.status === "draft"}
    />
  );
}
