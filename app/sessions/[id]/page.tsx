import { notFound } from "next/navigation";
import { appDb } from "@/lib/db";
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
    .select("id, prompt, status, error_message, created_at, clientes(nome)")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();

  const [{ data: scripts }, { data: analyses }] = await Promise.all([
    appDb
      .from("vm_generated_scripts")
      .select("id, version, headline, hook, hook_variants, roteiro, comando, fontes, slop_lint_violations, created_at")
      .eq("session_id", id)
      .order("version", { ascending: false }),
    appDb
      .from("vm_modelagem_analyses")
      .select("analysis, replication_brief, vm_attachments!inner(session_id)")
      .eq("vm_attachments.session_id", id),
  ]);

  const client = Array.isArray(session.clientes) ? session.clientes[0] : session.clientes;

  return (
    <SessionView
      session={{
        id: session.id,
        prompt: session.prompt,
        status: session.status,
        error_message: session.error_message,
        clientNome: client?.nome ?? null,
      }}
      scripts={scripts ?? []}
      analyses={(analyses ?? []).map((a) => ({ analysis: a.analysis, replication_brief: a.replication_brief }))}
      autoStart={start === "1" && session.status === "draft"}
    />
  );
}
