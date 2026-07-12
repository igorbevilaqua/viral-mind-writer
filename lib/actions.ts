"use server";

import { appDb } from "./db";
import { revalidatePath } from "next/cache";
import { platformVideoId } from "./video-url";
import { dedash } from "./pipeline/slop-lint";
import { rewriteFragment } from "./pipeline/rewrite-fragment";
import { extractFromEdit } from "./pipeline/teach";
import { isSubstantiveEdit } from "./learning-loop";

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

  // WP-E.4 (plano 010): avaliação alta + edição substantiva = sinal supervisionado.
  // Professor extrai as diferenças → lição active:false, curadoria humana no /ensinar.
  // Falha aqui NUNCA bloqueia o encerramento — o feedback já está salvo.
  if ((form.rating ?? 0) >= 4) {
    try {
      const { data: script } = await appDb
        .from("vm_generated_scripts")
        .select("roteiro, client_id, pipeline_trace")
        .eq("id", scriptId)
        .single();
      const trace = (script?.pipeline_trace ?? {}) as { roteiro_original?: string };
      // original = texto que a sala gerou (preservado pelo updateScript na 1ª edição inline)
      const original = trace.roteiro_original ?? script?.roteiro ?? "";
      // editada = versão colada no feedback OU o roteiro atual quando houve edição inline
      const editada = form.edited_version.trim() || (trace.roteiro_original ? script!.roteiro : "");
      if (original && editada && isSubstantiveEdit(original, editada)) {
        const learnings = await extractFromEdit({ original, editada, notes: form.notes || undefined });
        if (learnings.length) {
          const { data: lesson } = await appDb
            .from("vm_lessons")
            .insert({
              client_id: script!.client_id,
              source_kind: "edicao",
              source_title: "Edição humana de roteiro (sessão avaliada)",
              transcript: editada,
              context_note: form.notes || null,
            })
            .select("id")
            .single();
          if (lesson) {
            await appDb.from("vm_lesson_learnings").insert(
              learnings.map((l) => ({ ...l, evidencia: l.evidencia ?? null, origem: "edicao", active: false, lesson_id: lesson.id }))
            );
          }
        }
      }
    } catch (e) {
      console.error("aprendizado da edição falhou — feedback salvo mesmo assim", e);
    }
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
  // platformVideoId exige o id do vídeo — link de perfil passaria no regex de domínio
  // e o flywheel nunca casaria com o corpus, silenciosamente.
  if (!platformVideoId(url))
    throw new Error("link precisa ser de um vídeo específico (YouTube, Reels ou TikTok), não de perfil");
  const { data, error } = await appDb
    .from("vm_generated_scripts")
    .update({ status: "published", published_url: url.trim(), published_at: new Date().toISOString() })
    .eq("id", scriptId)
    .select("session_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${data.session_id}`);
}

// WP-F.3: feedback 1-clique por versão — 👍 grava rating 5, 👎 grava 1, sem encerrar a sessão.
// Cada clique insere uma linha nova; a UI mostra o rating mais recente por script.
export async function quickFeedback(scriptId: string, sessionId: string, thumb: "up" | "down") {
  const { error } = await appDb
    .from("vm_script_feedback")
    .insert({ script_id: scriptId, rating: thumb === "up" ? 5 : 1 });
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
}

// Edição manual do roteiro: salva os campos editados no próprio roteiro (sem nova versão).
// dedash garante zero travessão de slop mesmo no texto colado/editado à mão.
export async function updateScript(
  scriptId: string,
  patch: { headline?: string | null; hook?: string | null; roteiro?: string; comando?: string | null; fontes?: string | null }
) {
  const clean = (v: string | null | undefined) => (typeof v === "string" ? dedash(v) : v);
  const update: Record<string, unknown> = {};
  for (const k of ["headline", "hook", "roteiro", "comando", "fontes"] as const) {
    if (patch[k] !== undefined) update[k] = clean(patch[k]) ?? null;
  }
  if (!Object.keys(update).length) return;
  // WP-E.4: a 1ª edição do roteiro preserva o texto gerado pela sala no trace —
  // o par original→editado alimenta o aprendizado no finalizeSession. Best-effort.
  if (typeof update.roteiro === "string") {
    try {
      const { data: cur } = await appDb
        .from("vm_generated_scripts")
        .select("roteiro, pipeline_trace")
        .eq("id", scriptId)
        .single();
      const trace = (cur?.pipeline_trace ?? {}) as { roteiro_original?: string };
      if (cur && update.roteiro !== cur.roteiro) {
        update.pipeline_trace = {
          ...trace,
          roteiro_original: trace.roteiro_original ?? cur.roteiro, // sempre o texto da sala, nunca de edição anterior
          edicao_humana: true,
        };
      }
    } catch (e) {
      console.error("preservação do roteiro original no trace falhou — edição segue", e);
    }
  }
  const { data, error } = await appDb
    .from("vm_generated_scripts")
    .update(update)
    .eq("id", scriptId)
    .select("session_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${data.session_id}`);
}

// "Chame o Bob": a sala gera uma sugestão de substituição para o trecho selecionado.
// Não persiste nada — o usuário revisa/edita e só então aceita (via updateScript).
export async function suggestFragment(
  sessionId: string,
  input: { roteiro: string; trecho: string; instrucao: string; evitar?: string }
): Promise<string> {
  if (!input.trecho.trim() || !input.instrucao.trim()) throw new Error("trecho e pedido são obrigatórios");
  return rewriteFragment(sessionId, input);
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

  // o roteiro costuma começar com o hook — se blocks[0] divergiu (edição manual),
  // não sobrescreve conteúdo do usuário: prefixa o hook novo.
  const blocks = (s.roteiro as string).split("\n\n");
  if (blocks[0] === s.hook) blocks[0] = novo;
  else blocks.unshift(novo);
  variants[variantIndex] = s.hook;

  // update otimista: condiciona ao hook lido — troca concorrente resulta em 0 linhas.
  const { data: updated, error: upErr } = await appDb
    .from("vm_generated_scripts")
    .update({ hook: novo, hook_variants: variants, roteiro: blocks.join("\n\n") })
    .eq("id", scriptId)
    .eq("hook", s.hook)
    .select("id");
  if (upErr) throw new Error(upErr.message);
  if (!updated?.length) throw new Error("o roteiro mudou enquanto você trocava o hook — recarregue e tente de novo");
  revalidatePath(`/sessions/${s.session_id}`);
}
