"use server";

import { appDb } from "./db";
import { revalidatePath } from "next/cache";
import { VIDEO_URL_RE } from "./video-url";

export interface NewAttachment {
  kind: "reference_script" | "news_link" | "document" | "video_link";
  is_modelagem: boolean;
  url: string;
  raw_content: string;
}

export async function createSession(input: {
  prompt: string;
  clientId: string | null;
  attachments: NewAttachment[];
}): Promise<string> {
  const { data: session, error } = await appDb
    .from("vm_sessions")
    .insert({ prompt: input.prompt, client_id: input.clientId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (input.attachments.length) {
    const { error: attErr } = await appDb.from("vm_attachments").insert(
      input.attachments.map((a) => ({
        session_id: session.id,
        kind: a.kind,
        is_modelagem: a.is_modelagem,
        url: a.url || null,
        raw_content: a.raw_content || null,
      }))
    );
    if (attErr) throw new Error(attErr.message);
  }
  return session.id;
}

export async function savePreferences(clientId: string, form: {
  proibicoes: string;
  tom_de_voz: string;
  temas_preferidos: string;
  vocabulario_evitar: string;
  vocabulario_usar: string;
  notas_entrevista: string;
}) {
  const toArray = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const { error } = await appDb.from("vm_client_preferences").upsert({
    client_id: clientId,
    proibicoes: toArray(form.proibicoes),
    tom_de_voz: form.tom_de_voz || null,
    temas_preferidos: toArray(form.temas_preferidos),
    vocabulario_evitar: toArray(form.vocabulario_evitar),
    vocabulario_usar: toArray(form.vocabulario_usar),
    notas_entrevista: form.notas_entrevista || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings/clientes");
}

// Finaliza a sessão: registra o feedback (se houver) e encerra ("closed" → "Encerrada" na lista).
export async function finalizeSession(
  sessionId: string,
  scriptId: string,
  form: { rating: number | null; notes: string; edited_version: string }
) {
  if (form.rating || form.notes || form.edited_version) {
    const { error } = await appDb.from("vm_script_feedback").insert({
      script_id: scriptId,
      rating: form.rating,
      notes: form.notes || null,
      edited_version: form.edited_version || null,
    });
    if (error) throw new Error(error.message);
  }
  const { error: sessErr } = await appDb.from("vm_sessions").update({ status: "closed" }).eq("id", sessionId);
  if (sessErr) throw new Error(sessErr.message);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
}

// ── Ensinar: lições (sessões de aprendizado) + aprendizados destilados ──────

export interface LessonLearningInput {
  dimensao: "hook" | "storytelling" | "tema" | "ritmo" | "comando" | "geral";
  titulo: string;
  descricao: string;
  evidencia: string | null;
  origem: "extraido" | "manual";
  active: boolean; // desmarcado na revisão = false (fica guardado na lição, reativável)
}

export async function saveLesson(input: {
  clientId: string | null;
  sourceKind: "video_link" | "texto";
  sourceUrl: string | null;
  sourceTitle: string | null;
  transcript: string;
  contextNote: string | null;
  learnings: LessonLearningInput[];
}): Promise<string> {
  const { data: lesson, error } = await appDb
    .from("vm_lessons")
    .insert({
      client_id: input.clientId,
      source_kind: input.sourceKind,
      source_url: input.sourceUrl,
      source_title: input.sourceTitle,
      transcript: input.transcript,
      context_note: input.contextNote,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (input.learnings.length) {
    const { error: lrnErr } = await appDb
      .from("vm_lesson_learnings")
      .insert(input.learnings.map((l) => ({ ...l, lesson_id: lesson.id })));
    if (lrnErr) throw new Error(lrnErr.message);
  }
  revalidatePath("/ensinar");
  return lesson.id;
}

export async function setLearningActive(id: string, active: boolean) {
  const { error } = await appDb
    .from("vm_lesson_learnings")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/ensinar");
}

export async function updateLearning(
  id: string,
  patch: { titulo?: string; descricao?: string; dimensao?: LessonLearningInput["dimensao"] }
) {
  const { error } = await appDb
    .from("vm_lesson_learnings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/ensinar");
}

export async function addLearning(
  lessonId: string,
  l: { dimensao: LessonLearningInput["dimensao"]; titulo: string; descricao: string }
) {
  const { error } = await appDb
    .from("vm_lesson_learnings")
    .insert({ ...l, lesson_id: lessonId, origem: "manual" });
  if (error) throw new Error(error.message);
  revalidatePath("/ensinar");
}

// ── Flywheel: marca o roteiro como publicado; o ETL semanal casa a URL com o
// vídeo no corpus (videos.crm_script_id) e traz a performance de volta. ──────

export async function markPublished(scriptId: string, url: string) {
  if (!VIDEO_URL_RE.test(url)) throw new Error("link não reconhecido (YouTube, Reels ou TikTok)");
  const { data, error } = await appDb
    .from("vm_generated_scripts")
    .update({ status: "published", published_url: url.trim(), published_at: new Date().toISOString() })
    .eq("id", scriptId)
    .select("session_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${data.session_id}`);
}

// Troca o hook do roteiro por uma das variações (a antiga vira variação — dá pra desfazer trocando de volta).
export async function swapHook(scriptId: string, variantIndex: number) {
  const { data: s, error } = await appDb
    .from("vm_generated_scripts")
    .select("session_id, hook, hook_variants, roteiro")
    .eq("id", scriptId)
    .single();
  if (error || !s) throw new Error(error?.message ?? "roteiro não encontrado");

  const variants: string[] = (s.hook_variants as string[]) ?? [];
  const novo = variants[variantIndex];
  if (!novo || !s.hook) throw new Error("variação inexistente");

  // o roteiro começa com o hook por construção — troca o primeiro bloco
  const blocks = (s.roteiro as string).split("\n\n");
  blocks[0] = novo;
  variants[variantIndex] = s.hook;

  const { error: upErr } = await appDb
    .from("vm_generated_scripts")
    .update({ hook: novo, hook_variants: variants, roteiro: blocks.join("\n\n") })
    .eq("id", scriptId);
  if (upErr) throw new Error(upErr.message);
  revalidatePath(`/sessions/${s.session_id}`);
}
