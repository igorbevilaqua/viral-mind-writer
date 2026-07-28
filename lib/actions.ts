"use server";

import { appDb, viralData } from "./db";
import { revalidatePath } from "next/cache";
import { platformVideoId } from "./video-url";
import { dedash } from "./pipeline/slop-lint";
import { rewriteFragment } from "./pipeline/rewrite-fragment";
import { extractFromEdit, extractFromNotes } from "./pipeline/teach";
import { isSubstantiveEdit } from "./learning-loop";
import { registrarAtividade, currentUserId } from "./hub";
import { createClient } from "./supabase/server";
import { runProbeTopup } from "./calibration-probe";

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
  const userId = await currentUserId();
  const { data: session, error } = await appDb
    .from("vm_sessions")
    .insert({ prompt: input.prompt, client_id: input.clientId, user_id: userId })
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
  await registrarAtividade("inicio", {
    sessaoId: session.id,
    userId,
    payload: { topico: input.prompt, client_id: input.clientId },
  });
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

export interface ClassVideo {
  titulo: string | null;
  link_video: string | null;
  views: number;
  data_publicacao: string | null;
  plataforma: string | null;
  vm_script: boolean;
}

// Drill-down do painel do cliente: vídeos (com link) que compõem uma linha
// de tema/storytelling/hook/comando (RPC vm_client_class_videos, migration 0017).
export async function getClassVideos(
  clientId: string,
  dim: "tema" | "storytelling" | "hook" | "comando",
  tipo: string
): Promise<ClassVideo[]> {
  const { data, error } = await viralData.rpc("vm_client_class_videos", {
    p_cliente_id: clientId,
    p_dim: dim,
    p_tipo: tipo,
    p_limit: 20,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClassVideo[];
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

  // Aprendizado supervisionado no encerramento → lição active:false, curadoria no /ensinar.
  // Falha aqui NUNCA bloqueia o encerramento — o feedback já está salvo.
  //  a) rating>=4 + edição substantiva: aprende do par sala→humano (a nota entra como contexto);
  //  b) senão, se houver observação escrita: aprende do próprio comentário — independe do rating,
  //     porque nota crítica com avaliação baixa costuma ser o feedback mais valioso.
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
    const notes = form.notes?.trim() ?? "";

    let learnings: Awaited<ReturnType<typeof extractFromEdit>> = [];
    let source_kind = "edicao";
    let source_title = "Edição humana de roteiro (sessão avaliada)";
    let origem = "edicao";
    let transcript = editada;

    if ((form.rating ?? 0) >= 4 && original && editada && isSubstantiveEdit(original, editada)) {
      learnings = await extractFromEdit({ original, editada, notes: notes || undefined });
    } else if (notes.length >= 15) {
      // ponytail: piso de 15 chars descarta "ok"/"bom"; suba se aparecer ruído
      learnings = await extractFromNotes({ nota: notes, roteiro: editada || original });
      source_kind = "correcao";
      source_title = "Observação ao finalizar sessão";
      origem = "correcao";
      transcript = editada || original || notes;
    }

    if (learnings.length) {
      const { data: lesson } = await appDb
        .from("vm_lessons")
        .insert({
          client_id: script!.client_id,
          source_kind,
          source_title,
          transcript,
          context_note: notes || null,
        })
        .select("id")
        .single();
      if (lesson) {
        await appDb.from("vm_lesson_learnings").insert(
          learnings.map((l) => ({ ...l, evidencia: l.evidencia ?? null, origem, active: false, lesson_id: lesson.id }))
        );
      }
    }
  } catch (e) {
    console.error("aprendizado do encerramento falhou — feedback salvo mesmo assim", e);
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
  await registrarAtividade("sessao_ensino_concluida", {
    userId: await currentUserId(),
    payload: { lesson_id: lesson.id, client_id: input.clientId, learnings: input.learnings.length },
  });
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
  await registrarAtividade("roteiro_salvo", {
    sessaoId: data.session_id,
    userId: await currentUserId(),
    payload: { script_id: scriptId },
  });
  revalidatePath(`/sessions/${data.session_id}`);
}

// "Reportar problema" (menu da sessão) → hub.bugs via RPC hub_reportar_bug.
// Client AUTENTICADO (anon key + cookies), não service role: a RPC grava auth.uid()
// como quem reportou, então precisa da sessão do usuário — não do appDb.
const IMG_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function reportarProblema(
  sessionId: string | null,
  descricao: string,
  imagem?: File | null
): Promise<void> {
  const texto = descricao.trim();
  if (!texto) throw new Error("descreva o problema antes de enviar");
  const supabase = await createClient();

  let imagemPath: string | null = null;
  if (imagem && imagem.size > 0) {
    const path = `writer/${crypto.randomUUID()}.${IMG_EXT[imagem.type] ?? "png"}`;
    const { error: upErr } = await supabase.storage
      .from("bug-prints")
      .upload(path, imagem, { contentType: imagem.type });
    if (upErr) throw new Error(`falha ao subir o print: ${upErr.message}`);
    imagemPath = path;
  }

  const { error } = await supabase.rpc("hub_reportar_bug", {
    p_sessao_id: sessionId,
    p_app: "writer",
    p_descricao: texto,
    p_imagem_path: imagemPath,
  });
  if (error) throw new Error(error.message);
}

// "Chame o Bob": a sala gera uma sugestão de substituição para o trecho selecionado.
// Não persiste nada — o usuário revisa/edita e só então aceita (via updateScript).
// Atribui/corrige o cliente de uma sessão já criada (resgata sessão criada sem cliente).
export async function updateSessionClient(sessionId: string, clientId: string | null) {
  const { error } = await appDb.from("vm_sessions").update({ client_id: clientId }).eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
}

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

// ── Calibração de hooks (RLHF-lite par-a-par) ────────────────────────────────
export interface CalibPairView {
  id: string;
  a: string; // texto do hook A (comparação CEGA — não revelamos mecanismo p/ não enviesar)
  b: string;
  restantes: number;
}

// Próximo par pendente que ESTE usuário ainda não votou (escopo do cliente + global).
// Rotação de eixos (Fatia 2) entra na ordenação; aqui os mais novos primeiro.
export async function getNextCalibrationPair(clientId: string | null): Promise<CalibPairView | null> {
  const userId = await currentUserId();
  const { data: voted } = await appDb.from("vm_calibration_votes").select("pair_id").eq("user_id", userId ?? "");
  const votados = new Set((voted ?? []).map((v) => v.pair_id));

  let q = appDb
    .from("vm_calibration_pairs")
    .select("id, option_a, option_b, client_id, axis, source")
    .eq("dimension", "hook")
    .order("source", { ascending: true }) // 'corpus' < 'generation' < 'probe' — varia a origem
    .order("created_at", { ascending: false })
    .limit(200);
  // com cliente: só os dele + globais; sem cliente ("geral"): qualquer par pendente
  // (a atribuição usa o client_id do próprio par, então continua correta).
  if (clientId) q = q.or(`client_id.eq.${clientId},client_id.is.null`);
  const { data: pairs, error } = await q;
  if (error) throw new Error(error.message);

  const disponiveis = (pairs ?? []).filter((p) => !votados.has(p.id));
  if (!disponiveis.length) return null;
  // rotação de eixos: sorteia um eixo entre os disponíveis para alternar a estratégia
  const eixos = [...new Set(disponiveis.map((p) => p.axis))];
  const eixo = eixos[Math.floor(Math.random() * eixos.length)];
  const p = disponiveis.find((x) => x.axis === eixo) ?? disponiveis[0];
  // dedash defensivo: hooks do corpus têm travessão; o sistema nunca exibe travessão.
  const txt = (o: unknown) => dedash(String((o as { texto?: string })?.texto ?? ""));
  return { id: p.id, a: txt(p.option_a), b: txt(p.option_b), restantes: disponiveis.length };
}

// Registra o voto (1 por usuário por par; re-voto atualiza). winner: 'a' | 'b' | 'skip'.
export async function submitCalibrationVote(
  pairId: string,
  winner: "a" | "b" | "skip",
  clientId: string | null
): Promise<CalibPairView | null> {
  const userId = await currentUserId();
  const { error } = await appDb
    .from("vm_calibration_votes")
    .upsert({ pair_id: pairId, user_id: userId, winner }, { onConflict: "pair_id,user_id" });
  if (error) throw new Error(error.message);
  return getNextCalibrationPair(clientId);
}

// Fatia 2: aprofundamento sob demanda. A UI chama isto (sem esperar) quando a fila
// esvazia — gera probes em background para a próxima sessão, sem travar o swipe.
export async function requestMoreProbes(): Promise<void> {
  try {
    await runProbeTopup(3);
  } catch (e) {
    console.error("topup de probes falhou", e);
  }
}

// Promove uma versão PROPOSTA de playbook (Fase 4) para ativa. Portão humano no /ensinar.
export async function promoteHookPlaybook(version: number) {
  await appDb.from("vm_playbooks").update({ active: false }).eq("slug", "hook");
  const { error } = await appDb.from("vm_playbooks").update({ active: true }).eq("slug", "hook").eq("version", version);
  if (error) throw new Error(error.message);
  revalidatePath("/ensinar");
}

// Descarta uma proposta (versão inativa) que o time não quer.
export async function dismissHookPlaybook(version: number) {
  const { error } = await appDb.from("vm_playbooks").delete().eq("slug", "hook").eq("version", version).eq("active", false);
  if (error) throw new Error(error.message);
  revalidatePath("/ensinar");
}
