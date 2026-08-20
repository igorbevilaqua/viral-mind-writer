"use server";

import { appDb, viralData } from "./db";
import { revalidatePath } from "next/cache";
import { platformVideoId } from "./video-url";
import { dedash } from "./pipeline/slop-lint";
import { rewriteFragment } from "./pipeline/rewrite-fragment";
import { extractFromEdit, extractFromNotes } from "./pipeline/teach";
import {
  isSubstantiveEdit,
  houveEdicaoHumana,
  marcarOrigemEdicao,
  aplicarCorrecaoLiteral,
  type TraceEdicao,
} from "./learning-loop";
import { registrarAtividade, currentUserId } from "./hub";
import { exigirAcesso, ErroDeAcesso } from "./autorizacao";
import { createClient } from "./supabase/server";
import { runProbeTopup } from "./calibration-probe";
import { classificarEnsinamento, DIRECOES, type Casa, type Ensinamento } from "./pipeline/classify-teaching";
import { atribuirEtapa } from "./provenance";
import { explicar, type Explicacao, type TraceExplicavel } from "./pipeline/explain";
import { verificarScriptSalvo } from "./pipeline";
import type { RegistroVerificacao } from "./pipeline/verificar";
import { validarPadrao } from "./regex-safety";
import { normalizarTermo, validarTermo } from "./bullets";

export interface NewAttachment {
  kind: "reference_script" | "news_link" | "document" | "video_link" | "carousel_link";
  is_modelagem: boolean;
  // Como o material é usado quando is_modelagem = true (migration 0034): "modelar" (a arquitetura
  // dele para o SEU tema) ou "replicar" (mesmo vídeo, execução melhor). Ausente = modelar.
  modo?: "modelar" | "replicar" | null;
  url: string;
  raw_content: string;
}

export async function createSession(input: {
  prompt: string;
  premissa?: string;
  clientId: string | null;
  attachments: NewAttachment[];
}): Promise<string> {
  const userId = await currentUserId();
  // Premissa digitada é adotada VERBATIM (origem 'digitada'): o nó de derivação nem roda, então
  // nenhum modelo reescreve a tese do usuário. Vazia → o pipeline resolve (modelagem ou derivação).
  //
  // Com material marcado como modelagem, porém, ela NÃO existe: a tese é a do vídeo, e dois donos
  // da tese é contradição. O formulário some com o campo, e esta linha é a invariante — UI não é
  // autorização. Editar a tese DEPOIS de extraída continua valendo (é a caixa de confirmação),
  // e é por isso que a regra mora aqui, na criação, e não em runPipeline: lá `premissa` já pode
  // ser a confirmada da modelagem, e ignorá-la poria a sessão em laço eterno de confirmação.
  const temModelagem = input.attachments.some((a) => a.is_modelagem);
  const premissa = (temModelagem ? "" : input.premissa?.trim()) || null;
  const { data: session, error } = await appDb
    .from("vm_sessions")
    .insert({
      prompt: input.prompt,
      premissa,
      premissa_origem: premissa ? "digitada" : null,
      client_id: input.clientId,
      user_id: userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (input.attachments.length) {
    const { error: attErr } = await appDb.from("vm_attachments").insert(
      input.attachments.map((a) => ({
        session_id: session.id,
        kind: a.kind,
        is_modelagem: a.is_modelagem,
        // Só grava a coluna quando o modo é Replicar: null já É "modelar" (0034), e assim a
        // criação de sessão continua funcionando mesmo antes de a migration ser aplicada.
        ...(a.is_modelagem && a.modo === "replicar" ? { modo: "replicar" } : {}),
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
  // Regra 3: preferência de cliente é restrição inviolável no prompt dele — adm edita, todos leem.
  await exigirAcesso({ adm: "editar as preferências do cliente" });
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
  // Os DOIS ids vêm do cliente e cada um manda numa escrita diferente (o roteiro recebe o
  // feedback, a sessão é encerrada). Checar só um deixaria a outra escrita aberta.
  await exigirAcesso({ sessao: sessionId });
  await exigirAcesso({ script: scriptId });
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
    const trace = (script?.pipeline_trace ?? {}) as TraceEdicao;
    // original = texto que a sala gerou (preservado pelo updateScript na 1ª edição inline)
    const original = trace.roteiro_original ?? script?.roteiro ?? "";
    // editada = versão colada no feedback OU o roteiro atual quando houve edição HUMANA.
    // O portão é `edicao_humana`, não `roteiro_original` (§16.1): a correção factual também
    // preserva o original, e lê-lo aqui faria o Professor aprender com a máquina.
    const editada = form.edited_version.trim() || (houveEdicaoHumana(trace) ? script!.roteiro : "");
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
  // Regra 2: aceita `active` vindo do cliente — lição ativa entra no prompt de todo mundo.
  await exigirAcesso({ adm: "criar lição já ativa" });
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
  // Regra 2: lição ativa entra no prompt de todos os clientes.
  await exigirAcesso({ adm: "ativar ou desativar uma lição" });
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
  // Regra 2: se a lição está ativa, este texto É o que entra no prompt de todos os clientes.
  // Ativar e reescrever mudam a mesma coisa — quem só pode uma das duas não está protegido.
  await exigirAcesso({ adm: "editar uma lição" });
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
  // Regra 2: nasce active=true por default de coluna — é lição no ar sem passar por curadoria.
  await exigirAcesso({ adm: "adicionar um aprendizado à lição" });
  const { error } = await appDb
    .from("vm_lesson_learnings")
    .insert({ ...l, lesson_id: lessonId, origem: "manual" });
  if (error) throw new Error(error.message);
  revalidatePath("/ensinar");
}

// ── Flywheel: marca o roteiro como publicado; o ETL semanal casa a URL com o
// vídeo no corpus pelo link (lib/script-performance.ts) e traz a performance
// de volta. Não usa videos.crm_script_id — aquela coluna é do outro app. ─────

export async function markPublished(scriptId: string, url: string) {
  await exigirAcesso({ script: scriptId });
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
  // `sessionId` aqui só endereça o revalidatePath; quem recebe a escrita é o roteiro.
  await exigirAcesso({ script: scriptId });
  const { error } = await appDb
    .from("vm_script_feedback")
    .insert({ script_id: scriptId, rating: thumb === "up" ? 5 : 1 });
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
}

// Edição manual do roteiro: salva os campos editados no próprio roteiro (sem nova versão).
// dedash garante zero travessão de slop mesmo no texto colado/editado à mão.
// `origem` decide o rótulo no trace: "correcao_factual" (verificação) não vale como
// edição humana e por isso não abre o portão do Professor (§7.2 + §16.1).
export async function updateScript(
  scriptId: string,
  patch: { headline?: string | null; hook?: string | null; roteiro?: string; comando?: string | null; fontes?: string | null },
  // "autosave" é edição humana para efeito de aprendizado (o trace marca igual), mas NÃO vira
  // linha no feed do hub: uma edição de 5 minutos publicaria dezenas de "roteiro salvo" e
  // enterraria o resto da atividade da casa.
  origem: "humano" | "correcao_factual" | "autosave" = "humano"
) {
  // A guarda mora aqui e não em cada chamador: `aplicarCorrecao` também desemboca neste update.
  await exigirAcesso({ script: scriptId });
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
      const trace = (cur?.pipeline_trace ?? {}) as TraceEdicao;
      if (cur && update.roteiro !== cur.roteiro) {
        update.pipeline_trace = marcarOrigemEdicao(trace, cur.roteiro, origem === "autosave" ? "humano" : origem);
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
  if (origem !== "autosave")
    await registrarAtividade("roteiro_salvo", {
      sessaoId: data.session_id,
      userId: await currentUserId(),
      payload: { script_id: scriptId },
    });
  revalidatePath(`/sessions/${data.session_id}`);
}

// Verificação factual sob demanda (017 §8): a MESMA fase que roda no fim da geração, acionada
// da tela. `completa` pula o filtro de delta (§4.3) e é a operação cara — o rótulo do botão diz
// isso. Não lança: a tela precisa mostrar o erro sem perder o que já tinha na mão.
// Para varredura completa com progresso na tela, use a rota `app/api/verificar` — server
// action não transmite andamento.
export async function verificarScript(
  scriptId: string,
  regime: "delta" | "completa"
): Promise<{ ok: true; registro: RegistroVerificacao } | { ok: false; erro: string }> {
  try {
    // Dentro do try de propósito: esta action não lança, e "este roteiro é de outra pessoa"
    // chega na tela pelo mesmo campo `erro` que já existe, em vez de estourar a página.
    await exigirAcesso({ script: scriptId });
    const { registro, sessionId } = await verificarScriptSalvo(scriptId, regime);
    revalidatePath(`/sessions/${sessionId}`);
    return { ok: true, registro };
  } catch (e) {
    console.error("verificação falhou — nada foi gravado", e);
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

// Correção cirúrgica da verificação (017 §7.1). ZERO LLM: a verificação já achou o dado
// certo, então os dois lados são conhecidos e não há o que gerar — é `split/join` +
// `updateScript`, que já aplica dedash, já preserva `roteiro_original` e já revalida.
// A origem "correcao_factual" é o que impede a lição envenenada do §7.2: correção de
// máquina não marca `edicao_humana` e por isso não abre o portão do Professor.
export async function aplicarCorrecao(
  scriptId: string,
  trecho_literal: string,
  correcao: string,
  // "reescrita" = texto do Bob para um veredicto `falso`. A troca literal é a MESMA (o resto
  // desta função não muda); o que muda é só a marca no registro: `reescrito` em vez de
  // `aplicada`, porque ninguém verificou o texto novo (§11).
  modo: "correcao" | "reescrita" = "correcao"
): Promise<{ aplicada: boolean; motivo?: string }> {
  await exigirAcesso({ script: scriptId });
  // §11: `updateScript` é patch por campo inteiro, SEM guarda otimista. Reler aqui,
  // imediatamente antes de aplicar, e refazer o split/join sobre o texto NOVO — senão a
  // edição que o usuário fez entre a verificação e o clique seria apagada.
  const { data, error } = await appDb
    .from("vm_generated_scripts")
    .select("roteiro, session_id, verificacao")
    .eq("id", scriptId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "roteiro não encontrado");

  // §11: valida com `includes` ANTES de aplicar (dentro de aplicarCorrecaoLiteral).
  const novo = aplicarCorrecaoLiteral(data.roteiro ?? "", trecho_literal, correcao);
  if (novo === null) {
    // Registrar o descasamento: é o sinal de que o modelo está parafraseando em vez de
    // copiar, e some se ninguém contar. Best-effort e nunca lança — o veredicto continua
    // valendo, só a ação automática cai.
    await registrarAtividade("correcao_nao_aplicada", {
      sessaoId: data.session_id,
      payload: { script_id: scriptId, trecho_literal },
    });
    return {
      aplicada: false,
      motivo:
        "o trecho da verificação não está no roteiro atual — ou ele foi editado depois, ou o modelo parafraseou em vez de copiar. Verifique de novo.",
    };
  }
  await updateScript(scriptId, { roteiro: novo }, "correcao_factual");

  // Marcar a linha como aplicada no próprio registro. Sem isto, no refresh seguinte a tela
  // olharia o roteiro já corrigido, não acharia mais o `trecho_literal` e diria "o trecho não
  // está no roteiro" sobre uma correção que ela mesma acabou de aplicar. Best-effort: o
  // roteiro já foi corrigido, e falhar aqui não pode desfazer isso.
  const reg = data.verificacao as RegistroVerificacao | null;
  if (reg?.itens?.length) {
    // `reescrito` NÃO zera o veredicto: ele fala do texto antigo e continua contando ❌ no selo
    // até uma nova rodada olhar o texto novo. Marcar `confirmado` aqui seria inventar
    // confirmação sobre algo que nenhuma busca viu.
    const marca = modo === "reescrita" ? { reescrito: true } : { aplicada: true };
    const itens = reg.itens.map((i) => (i.trecho_literal === trecho_literal ? { ...i, ...marca } : i));
    const { error: erroMarca } = await appDb
      .from("vm_generated_scripts")
      .update({ verificacao: { ...reg, itens } })
      .eq("id", scriptId);
    if (erroMarca) console.error(`correção aplicada, mas não marcada no registro: ${erroMarca.message}`);
  }
  return { aplicada: true };
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
// Confirma a premissa extraída do vídeo modelado (status 'aguardando_premissa' → 'draft').
// É a única pausa interativa do pipeline, e ela existe sem motor de pause/resume: o run 1
// gravou a sugestão em artifacts e parou; este action grava a tese confirmada e devolve o
// controle, e o cliente dispara o run 2, que reusa os artifacts como qualquer regeneração.
export async function confirmarPremissa(sessionId: string, premissa: string) {
  await exigirAcesso({ sessao: sessionId });
  const texto = premissa.trim();
  if (!texto) throw new Error("a premissa não pode ficar vazia — nenhum roteiro é gerado sem ela");
  const { error } = await appDb
    .from("vm_sessions")
    .update({
      premissa: dedash(texto),
      // Editada na confirmação ou aceita como veio, o usuário é o autor final da tese.
      premissa_origem: "modelagem",
      status: "draft",
      error_message: null,
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
}

// Corrige a premissa de uma sessão já gerada. Muda a tese → a narrativa precisa ser refeita,
// então limpa as candidatas cacheadas: manter narrativa antiga sob tese nova é o defeito que
// a Etapa B existe pra impedir.
export async function updatePremissa(sessionId: string, premissa: string) {
  await exigirAcesso({ sessao: sessionId });
  const texto = premissa.trim();
  if (!texto) throw new Error("a premissa não pode ficar vazia");
  const { data: s } = await appDb.from("vm_sessions").select("artifacts").eq("id", sessionId).single();
  const artifacts = (s?.artifacts ?? null) as Record<string, unknown> | null;
  const { error } = await appDb
    .from("vm_sessions")
    .update({
      premissa: dedash(texto),
      premissa_origem: "digitada",
      // preserva o dossiê (a pesquisa continua útil), descarta narrativas e ranking
      artifacts: artifacts ? { dossie: artifacts.dossie ?? "" } : null,
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
}

// Atribui/corrige o cliente de uma sessão já criada (resgata sessão criada sem cliente).
export async function updateSessionClient(sessionId: string, clientId: string | null) {
  await exigirAcesso({ sessao: sessionId });
  const { error } = await appDb.from("vm_sessions").update({ client_id: clientId }).eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
}

export async function suggestFragment(
  sessionId: string,
  input: { roteiro: string; trecho: string; instrucao: string; evitar?: string }
): Promise<string> {
  await exigirAcesso({ sessao: sessionId });
  if (!input.trecho.trim() || !input.instrucao.trim()) throw new Error("trecho e pedido são obrigatórios");
  return rewriteFragment(sessionId, input);
}

// Modo "Por quê" (015 §4): etapa é determinística (pertencimento de sentença nos três
// snapshots, que existem em todos os 47 roteiros), causa sai do rastro. Nada é inventado —
// roteiro sem `proveniencia` responde nao_determinado sem chamar modelo nenhum.
export async function explicarTrecho(scriptId: string, trecho: string): Promise<Explicacao> {
  // Leitura, mas de dado interno (pipeline_trace): a regra vale aqui, e não vale em /r/[id].
  await exigirAcesso({ script: scriptId });
  if (!trecho.trim()) throw new Error("selecione um trecho");
  // A coluna `slop_lint_violations` é int (contagem, 0001_init) — as violações em si vivem em
  // pipeline_trace.violations, e é de lá que a etapa de humanização é explicada.
  const { data, error } = await appDb
    .from("vm_generated_scripts")
    .select("pipeline_trace")
    .eq("id", scriptId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "roteiro não encontrado");
  const t = (data.pipeline_trace ?? null) as TraceExplicavel | null;
  const etapa = atribuirEtapa(trecho, { assembled: t?.assembled, revised: t?.revised, final: t?.final });
  return explicar({ trecho, etapa, trace: t });
}

// Troca o hook do roteiro por uma das variações (a antiga vira variação — dá pra desfazer trocando de volta).
export async function swapHook(scriptId: string, variantIndex: number) {
  await exigirAcesso({ script: scriptId });
  const { data: s, error } = await appDb
    .from("vm_generated_scripts")
    .select("session_id, hook, hook_variants")
    .eq("id", scriptId)
    .single();
  if (error || !s) throw new Error(error?.message ?? "roteiro não encontrado");

  const variants: string[] = (s.hook_variants as string[]) ?? [];
  const novo = variants[variantIndex];
  if (!novo || !s.hook) throw new Error("variação inexistente");

  variants[variantIndex] = s.hook;

  // update otimista: condiciona ao hook lido — troca concorrente resulta em 0 linhas.
  const { data: updated, error: upErr } = await appDb
    .from("vm_generated_scripts")
    .update({ hook: novo, hook_variants: variants })
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
export async function promoteHookPlaybook(version: number, slug = "hook") {
  // Regra 2: playbook ativo é o manual que TODOS os agentes leem.
  await exigirAcesso({ adm: "ativar uma versão de playbook" });
  await appDb.from("vm_playbooks").update({ active: false }).eq("slug", slug);
  const { error } = await appDb.from("vm_playbooks").update({ active: true }).eq("slug", slug).eq("version", version);
  if (error) throw new Error(error.message);
  revalidatePath("/ensinar");
}

// Descarta uma proposta (versão inativa) que o time não quer.
export async function dismissHookPlaybook(version: number, slug = "hook") {
  // Regra 2: DELETE irrecuperável de uma proposta que ninguém mais consegue reconstruir.
  await exigirAcesso({ adm: "descartar uma proposta de playbook" });
  const { error } = await appDb.from("vm_playbooks").delete().eq("slug", slug).eq("version", version).eq("active", false);
  if (error) throw new Error(error.message);
  revalidatePath("/ensinar");
}

// O classificador roda no servidor (SDK da Anthropic); o dialog de ensino é client component.
// Devolve `erro` em vez de lançar: na tela o texto cru do usuário precisa sobreviver à falha
// para o botão de repetir ter o que repetir (§8).
export async function classificarTexto(input: {
  texto: string;
  trecho?: string;
  referenciaId?: string;
  clientId?: string | null;
}): Promise<{ ok: true; ensinamento: Ensinamento } | { ok: false; erro: string }> {
  if (!input.texto.trim()) return { ok: false, erro: "escreva o que você quer ensinar" };
  try {
    // Nome do cliente é contexto do classificador ("evite X" costuma ser sobre a marca).
    const { data: cli } = input.clientId
      ? await appDb.from("clientes").select("nome").eq("id", input.clientId).maybeSingle()
      : { data: null };
    const ensinamento = await classificarEnsinamento({
      texto: input.texto,
      trecho: input.trecho,
      referenciaId: input.referenciaId,
      clienteNome: cli?.nome ?? undefined,
    });
    return { ok: true, ensinamento };
  } catch (e) {
    console.error("classificarTexto falhou", e);
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

// Lição citada por uma explicação (§7.2, "Corrigir esta lição"): o dialog precisa do título e
// da descrição atuais para editar sem apagar o que já estava lá.
export async function getLearning(
  id: string
): Promise<{ titulo: string; descricao: string; active: boolean } | null> {
  const { data, error } = await appDb
    .from("vm_lesson_learnings")
    .select("titulo, descricao, active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export interface EnsinamentoConfirmado extends Ensinamento {
  textoCru: string;
  escopo: "cliente" | "global";
  sessionId: string;
  clientId: string | null;
  /**
   * Procedência quando o ensino não nasceu numa sessão: a origem do debate com o Kasparov
   * (`/kasparov/<thread>` ou a URL do vídeo discutido). Debate avulso não tem `sessionId` —
   * `loadContextAvulso` devolve "" de propósito, como sinal (018 §5.3).
   */
  sourceUrl?: string;
}

// A procedência que vai para `vm_lessons.source_url`. Não exportada: este arquivo é
// "use server" e só exporta server actions.
// `/sessions/${sessionId}` com sessionId vazio grava lição com procedência FALSA
// (`/sessions/`), que é pior que não gravar: a auditoria passa a apontar para uma sessão
// que nunca existiu. Sem procedência nenhuma, erro explícito (018 §5.3).
const procedencia = (e: EnsinamentoConfirmado): string | null =>
  e.sourceUrl?.trim() || (e.sessionId?.trim() ? `/sessions/${e.sessionId.trim()}` : null);

// Doutrina não tem playbook único: a dimensão diz qual manual a proposta altera.
const PLAYBOOK_POR_DIMENSAO: Record<string, string> = {
  hook: "hook",
  storytelling: "storytelling",
  tema: "storytelling",
  comando: "comando",
  ritmo: "style_guide",
  geral: "style_guide",
};

// Só para a mensagem de recusa dizer o que foi barrado, em vez do nome interno da casa.
const CASA_LABEL: Record<Casa, string> = {
  licao: "lição",
  vocabulario: "vocabulário do cliente",
  frase_banida: "frase banida",
  playbook: "proposta de playbook",
};

// Grava o ensinamento CONFIRMADO pelo humano na casa que o classificador escolheu (§5.1).
// Os quatro casos existem de verdade: um `case` faltando devolveria `undefined`, a tela diria
// "gravado" e nada teria sido gravado — a falha silenciosa que a peça 015 existe para matar.
export async function gravarEnsinamento(
  e: EnsinamentoConfirmado
): Promise<{ ok: boolean; id?: string; erro?: string }> {
  // vm_client_preferences é por cliente por definição: vocabulário com escopo Global cai em
  // frase banida com severity warn (§5.1).
  const casa: Casa = e.casa === "vocabulario" && e.escopo === "global" ? "frase_banida" : e.casa;
  const clientId = e.escopo === "cliente" ? e.clientId : null;

  // Regras 2 e 3: das quatro casas, só `licao` fica aberta — ela nasce active:false, é proposta,
  // e a curadoria (adm) é o portão. As outras três escrevem direto no que a sala lê: regex de
  // lint em produção, proposta de playbook e a preferência do cliente.
  // Devolve `erro` em vez de deixar lançar porque o painel de confirmação precisa sobreviver à
  // recusa com o texto do usuário na tela (§8) — mesmo contrato dos outros erros daqui.
  if (casa !== "licao") {
    try {
      await exigirAcesso({ adm: `gravar ${CASA_LABEL[casa]}` });
    } catch (erroAcesso) {
      if (!(erroAcesso instanceof ErroDeAcesso)) throw erroAcesso;
      return { ok: false, erro: erroAcesso.message };
    }
  }

  switch (casa) {
    case "licao": {
      const origem = procedencia(e);
      if (!origem)
        return { ok: false, erro: "sem procedência: a lição precisa da sessão ou da origem do debate" };
      // RPC transacional: vm_lessons + vm_lesson_learnings ou nenhum dos dois (§8).
      const { data, error } = await appDb.rpc("vm_gravar_ensinamento", {
        p_client_id: clientId,
        p_session_url: origem,
        p_texto_cru: e.textoCru,
        p_titulo: e.regra,
        p_descricao: e.regra,
        p_dimensao: e.dimensao,
        p_destinatarios: e.destinatarios,
        p_evidencia: e.evidencia ?? null,
      });
      if (error) return { ok: false, erro: error.message };
      revalidatePath("/ensinar");
      return { ok: true, id: data as string };
    }

    case "frase_banida": {
      // Regex de LLM entrando num lint de produção é onde se apaga texto bom em silêncio.
      const v = validarPadrao(e.padrao ?? "");
      if (!v.ok) {
        // Vocabulário rebaixado para frase banida não traz `padrao` (o classificador só o
        // preenche quando ELE escolheu frase_banida). Erro explícito > regex inventada.
        return {
          ok: false,
          erro:
            e.casa === "vocabulario"
              ? `vocabulário com escopo Global vira frase banida e precisa de um padrão — ${v.motivo}`
              : v.motivo,
        };
      }
      const { error } = await appDb.from("vm_banned_phrases").insert({
        pattern: e.padrao, // a coluna é `pattern` (0001_init), não `padrao`
        label: e.regra,
        motivo: e.motivo ?? e.textoCru,
        severity: "warn",
      });
      return error ? { ok: false, erro: error.message } : { ok: true };
    }

    case "vocabulario": {
      if (!clientId) return { ok: false, erro: "vocabulário é por cliente: a sessão precisa ter um cliente" };
      // A direção vem do classificador e passa pelo chip do dialog. Adivinhar grava o OPOSTO
      // do que o usuário ensinou, em silêncio — erro explícito, como no caminho frase_banida.
      if (!e.direcao || !DIRECOES.includes(e.direcao))
        return { ok: false, erro: "vocabulário precisa de uma direção: evitar ou preferir" };
      const campo = e.direcao === "evitar" ? "vocabulario_evitar" : "vocabulario_usar";
      // A lista é de palavras, não de frases: grava o termo, com a regra como rede.
      const termo = e.termo?.trim() || e.regra;
      const { data: prefs, error: readErr } = await appDb
        .from("vm_client_preferences")
        .select("vocabulario_evitar, vocabulario_usar")
        .eq("client_id", clientId)
        .maybeSingle();
      if (readErr) return { ok: false, erro: readErr.message };
      // ponytail: read-modify-write. Cliente sem linha ainda é comum (6 de 30), daí o upsert.
      // Duas confirmações simultâneas no mesmo cliente perderiam uma — gesto humano, ignorado.
      const atual: string[] = prefs?.[campo] ?? [];
      if (atual.includes(termo)) return { ok: true };
      const { error } = await appDb.from("vm_client_preferences").upsert({
        client_id: clientId,
        [campo]: [...atual, termo],
        updated_at: new Date().toISOString(),
      });
      if (error) return { ok: false, erro: error.message };
      revalidatePath("/settings/clientes");
      return { ok: true };
    }

    case "playbook": {
      // Playbook é manual versionado que todos os agentes leem: ensinamento de sessão vira
      // PROPOSTA (active:false), nunca escrita direta (§5.1). Mesmo trilho do curador da Fase 4
      // — quem ativa é o humano em /ensinar (components/playbook-proposals.tsx).
      const slug = PLAYBOOK_POR_DIMENSAO[e.dimensao] ?? "style_guide";
      const { data: latest, error: pbErr } = await appDb
        .from("vm_playbooks")
        .select("version, content")
        .eq("slug", slug)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pbErr) return { ok: false, erro: pbErr.message };
      if (!latest) return { ok: false, erro: `sem playbook base para "${slug}"` };
      // "em sessão" seria mentira num acordo de debate, e playbook é manual que todos os
      // agentes leem: a procedência da proposta é a mesma da lição (§5.3).
      const onde = procedencia(e)?.startsWith("/kasparov/") ? "debate" : "sessão";
      const content = `${String(latest.content).trimEnd()}

## Ensinado em ${onde} (${new Date().toISOString().slice(0, 10)})

- ${e.regra}

> ${e.textoCru.trim().replace(/\s*\n+\s*/g, " ")}
`;
      const { error } = await appDb
        .from("vm_playbooks")
        .insert({ slug, version: (Number(latest.version) || 0) + 1, content, active: false });
      if (error) return { ok: false, erro: error.message };
      revalidatePath("/ensinar");
      return { ok: true };
    }
  }
}

// ── BULLETS: paleta emocional votada pelo time (migration 0033) ───────────────
// Escopo global só: a coluna client_id existe na tabela, mas a curadoria começa numa
// paleta única — palavra forte é do idioma, não do cliente.

export interface BulletView {
  id: string;
  termo: string;
  score: number;
  meuVoto: -1 | 0 | 1;
}

export async function listBullets(): Promise<BulletView[]> {
  const userId = await currentUserId();
  const { data, error } = await appDb
    .from("vm_bullets")
    .select("id, termo, vm_bullet_votes(user_id, valor)")
    .is("client_id", null);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((b) => {
      const votos = (b.vm_bullet_votes ?? []) as { user_id: string | null; valor: number }[];
      return {
        id: b.id as string,
        termo: b.termo as string,
        score: votos.reduce((s, v) => s + (Number(v.valor) || 0), 0),
        meuVoto: ((userId && votos.find((v) => v.user_id === userId)?.valor) || 0) as -1 | 0 | 1,
      };
    })
    .sort((a, b) => b.score - a.score || a.termo.localeCompare(b.termo));
}

/**
 * Adiciona um bullet e já dá o +1 de quem adicionou (comportamento do Reddit: bullet novo
 * nascendo com score 0 é indistinguível de bullet rejeitado). Termo repetido NÃO duplica —
 * vira upvote no que já existe, que é o que o gesto significava.
 * Devolve `erro` em vez de lançar: a estrela da sessão precisa piscar em vermelho, não quebrar.
 */
export async function addBullet(termo: string): Promise<{ erro?: string }> {
  const erro = validarTermo(termo);
  if (erro) return { erro };
  const limpo = termo.trim().replace(/\s+/g, " ");
  const userId = await currentUserId();
  // Mesma guarda do voteBullet: user_id null não colide na unique (bullet_id, user_id), então
  // sem identidade o auto-upvote viraria voto duplicável. O middleware já exige sessão.
  if (!userId) return { erro: "sessão expirada" };

  const { data: existente, error: selErr } = await appDb
    .from("vm_bullets")
    .select("id")
    .eq("termo_norm", normalizarTermo(limpo))
    .is("client_id", null)
    .maybeSingle();
  if (selErr) return { erro: selErr.message };

  let id = existente?.id as string | undefined;
  if (!id) {
    const { data, error } = await appDb
      .from("vm_bullets")
      .insert({ termo: limpo, termo_norm: normalizarTermo(limpo), criado_por: userId })
      .select("id")
      .single();
    if (error) return { erro: error.message };
    id = data.id;
  }
  // upsert e não insert: refavoritar o mesmo termo é idempotente, nunca erro na cara do usuário.
  const { error: votoErr } = await appDb
    .from("vm_bullet_votes")
    .upsert({ bullet_id: id, user_id: userId, valor: 1 }, { onConflict: "bullet_id,user_id" });
  if (votoErr) return { erro: votoErr.message };

  await registrarAtividade("bullet_adicionado", { userId, payload: { termo: limpo, novo: !existente } });
  revalidatePath("/bullets");
  return {};
}

/** Voto do usuário. Votar de novo no mesmo sentido REMOVE o voto (toggle do Reddit). */
export async function voteBullet(bulletId: string, valor: 1 | -1): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return; // sem identidade não há voto a atribuir (o middleware já exige sessão)

  const { data: atual } = await appDb
    .from("vm_bullet_votes")
    .select("id, valor")
    .eq("bullet_id", bulletId)
    .eq("user_id", userId)
    .maybeSingle();

  const { error } =
    atual?.valor === valor
      ? await appDb.from("vm_bullet_votes").delete().eq("id", atual.id)
      : await appDb
          .from("vm_bullet_votes")
          .upsert({ bullet_id: bulletId, user_id: userId, valor }, { onConflict: "bullet_id,user_id" });
  if (error) throw new Error(error.message);

  await registrarAtividade("bullet_votado", { userId, payload: { bullet_id: bulletId, valor: atual?.valor === valor ? 0 : valor } });
  revalidatePath("/bullets");
}
