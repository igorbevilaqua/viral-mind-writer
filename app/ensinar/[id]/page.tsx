import { notFound } from "next/navigation";
import { appDb } from "@/lib/db";
import { writerScope } from "@/lib/hub";
import LessonView from "@/components/lesson-view";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Regra 2: ler a lição é de todos; ativar/adicionar aprendizado é do adm.
  const { isAdmin } = await writerScope();
  const { data: lesson } = await appDb
    .from("vm_lessons")
    .select("id, source_kind, source_url, source_title, transcript, context_note, created_at, clientes(nome)")
    .eq("id", id)
    .maybeSingle();
  if (!lesson) notFound();

  const { data: learnings } = await appDb
    .from("vm_lesson_learnings")
    .select("id, dimensao, titulo, descricao, evidencia, origem, active, needs_review, grupo")
    .eq("lesson_id", id)
    .order("created_at");

  // Veredito do acervo por grupo (scripts/testar-licoes.ts). Só os grupos desta lição: a tabela
  // é pequena hoje, mas filtrar aqui evita que ela cresça para dentro de toda página.
  const grupos = [...new Set((learnings ?? []).map((l) => l.grupo).filter((g): g is string => !!g))];
  const { data: vereditos } = grupos.length
    ? await appDb.from("vm_licao_vereditos").select("grupo, regra, n_segue, n_nao_segue, lift, lift_lb, lift_ub, veredito").in("grupo", grupos)
    : { data: [] };

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
      vereditos={(vereditos ?? []) as Parameters<typeof LessonView>[0]["vereditos"]}
      isAdmin={isAdmin}
    />
  );
}
