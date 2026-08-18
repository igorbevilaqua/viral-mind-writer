import { notFound } from "next/navigation";
import { appDb } from "@/lib/db";
import { writerScope } from "@/lib/hub";
import { origemDoDebate } from "@/lib/pipeline/kasparov";
import KasparovChat from "@/components/kasparov-chat";

export const dynamic = "force-dynamic";

// A conversa recuperada. Esta rota não é nova em espírito: `origemDoDebate` já grava
// `/kasparov/<threadId>` em vm_lessons.source_url desde a peça 4, ou seja, toda lição nascida
// de debate aponta para cá — e até agora apontava para o vazio.
//
// A thread e as mensagens estão no banco desde a 0030. Reabrir é só lê-las: o turno seguinte
// continua vendo o estado do sistema e o assunto corrente, nunca o histórico (018 §4). Guardar
// a conversa serve para o USUÁRIO reler, e é exatamente o que esta tela faz.
export default async function ThreadDoKasparov({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { isAdmin, userId } = await writerScope();
  const [{ data: thread }, { data: msgs }, { data: clients }] = await Promise.all([
    appDb.from("vm_kasparov_threads").select("id, client_id, user_id").eq("id", id).maybeSingle(),
    appDb.from("vm_kasparov_messages").select("papel, conteudo, ordem").eq("thread_id", id).order("ordem"),
    appDb.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
  ]);
  if (!thread) notFound();
  // Mesmo tratamento de /sessions/[id]: conversa alheia não existe para quem não é dono nem adm.
  if (!isAdmin && thread.user_id !== userId) notFound();

  return (
    <KasparovChat
      clients={clients ?? []}
      inicial={{
        thread: { id: thread.id, origem: origemDoDebate(thread.id) },
        clientId: (thread.client_id as string | null) ?? null,
        msgs: (msgs ?? []).map((m) => ({ papel: m.papel as "usuario" | "kasparov", conteudo: m.conteudo })),
      }}
    />
  );
}
