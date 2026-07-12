import { notFound } from "next/navigation";
import { appDb } from "@/lib/db";
import LessonView from "@/components/lesson-view";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: lesson } = await appDb
    .from("vm_lessons")
    .select("id, source_kind, source_url, source_title, transcript, context_note, created_at, clientes(nome)")
    .eq("id", id)
    .maybeSingle();
  if (!lesson) notFound();

  const { data: learnings } = await appDb
    .from("vm_lesson_learnings")
    .select("id, dimensao, titulo, descricao, evidencia, origem, active, needs_review")
    .eq("lesson_id", id)
    .order("created_at");

  const client = Array.isArray(lesson.clientes) ? lesson.clientes[0] : lesson.clientes;

  return (
    <LessonView
      lesson={{
        id: lesson.id,
        sourceUrl: lesson.source_url,
        sourceTitle: lesson.source_title,
        transcript: lesson.transcript,
        contextNote: lesson.context_note,
        createdAt: lesson.created_at,
        clientNome: client?.nome ?? null,
      }}
      learnings={(learnings ?? []) as Parameters<typeof LessonView>[0]["learnings"]}
    />
  );
}
