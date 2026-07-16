import OpenAI from "openai";
import { appDb, viralData } from "../db";
import { fmtNum } from "../format";
import type { Attachment, BannedPhrase, ClientPrefs, GenerationContext } from "./types";

async function embed(text: string): Promise<number[]> {
  // instanciado aqui (não no import): sem OPENAI_API_KEY o construtor lança,
  // e o try/catch do few-shot absorve — a geração segue sem exemplos vetoriais.
  const openai = new OpenAI();
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small", // 1536 dims, compatível com os embeddings existentes
    input: text.slice(0, 8000),
  });
  return res.data[0].embedding;
}

// Few-shot vencedor: pede 20 por similaridade e fica com os 5 de mais views reais
// (metadata->>'views' gravado pelo backfill). Nenhum exemplo com views → mantém a
// ordem de similaridade (fallback). Origem anota as views pro prompt (ex.: "— 2.1M views").
export function pickTopFewShot(
  rows: { content?: string | null; metadata?: unknown }[],
  n = 5
): { roteiro: string; origem: string }[] {
  const items = rows
    .filter((r) => r.content)
    .map((r) => ({
      roteiro: r.content as string,
      views: Number((r.metadata as { views?: unknown } | null)?.views) || 0,
    }));
  const ranked = items.some((i) => i.views > 0) ? [...items].sort((a, b) => b.views - a.views) : items;
  return ranked.slice(0, n).map((i) => ({
    roteiro: i.roteiro,
    origem: `roteiro publicado (corpus)${i.views ? ` — ${fmtNum(i.views)} views` : ""}`,
  }));
}

async function fetchFewShot(prompt: string, clientId: string | null) {
  if (!prompt.trim()) return []; // adaptação sem tema: nada pra embutir; embeddings rejeita string vazia
  try {
    const queryEmbedding = await embed(prompt);
    const corpus = await viralData.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: 20, // sobra pra pós-filtrar por performance; threshold inalterado
      match_threshold: 0.3,
    });
    void clientId; // ponytail: filtro de few-shot por cliente adiado — entra com match_documents_v2 (WP-C.7)
    return pickTopFewShot(corpus.data ?? []);
  } catch (e) {
    console.error("few-shot search failed, seguindo sem exemplos vetoriais", e);
    return [];
  }
}

export async function loadContext(sessionId: string): Promise<GenerationContext> {
  const { data: session, error } = await appDb
    .from("vm_sessions")
    .select("id, user_id, prompt, client_id, artifacts")
    .eq("id", sessionId)
    .single();
  if (error || !session) throw new Error(`sessão não encontrada: ${error?.message}`);

  const [attachments, playbooksRes, bannedRes, prefsRes, fewShot, lastRun] = await Promise.all([
    appDb.from("vm_attachments").select("id, kind, is_modelagem, url, raw_content").eq("session_id", sessionId),
    appDb.from("vm_playbooks").select("slug, content, version").eq("active", true),
    appDb.from("vm_banned_phrases").select("pattern, label, severity").eq("active", true),
    session.client_id
      ? appDb
          .from("vm_client_preferences")
          .select("proibicoes, tom_de_voz, temas_preferidos, vocabulario_evitar, vocabulario_usar, notas_entrevista, viral_data_cliente_id, clientes(nome)")
          .eq("client_id", session.client_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    fetchFewShot(session.prompt, session.client_id),
    // WP-E.1: id do run de insights vigente entra no fingerprint do roteiro.
    // Tabela vazia/ausente (migration 0014 não aplicada) → null, sem erro.
    appDb.from("vm_insight_runs").select("id").order("run_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  // Falha de query aqui gerava roteiro silenciosamente SEM materiais/playbooks/banned.
  // Lançar é o certo: o catch do pipeline persiste e exibe o erro ao usuário.
  if (attachments.error) throw new Error(`falha ao carregar anexos: ${attachments.error.message}`);
  if (playbooksRes.error) throw new Error(`falha ao carregar playbooks: ${playbooksRes.error.message}`);
  if (bannedRes.error) throw new Error(`falha ao carregar frases banidas: ${bannedRes.error.message}`);

  const playbooks: Record<string, string> = {};
  for (const p of playbooksRes.data ?? []) playbooks[p.slug] = p.content;
  // WP-E.1: slug+version dos playbooks usados — parte do fingerprint do roteiro
  const playbookVersions = (playbooksRes.data ?? []).map((p) => ({ slug: p.slug, version: Number(p.version) || 0 }));

  let clientPrefs: ClientPrefs | null = null;
  const prefs = prefsRes.data as (Omit<ClientPrefs, "nome"> & { viral_data_cliente_id: string | null; clientes: { nome: string } | { nome: string }[] | null }) | null;
  if (prefs) {
    const clientRel = Array.isArray(prefs.clientes) ? prefs.clientes[0] : prefs.clientes;
    clientPrefs = { ...prefs, nome: clientRel?.nome ?? "cliente" };
  }

  // Insights: globais + do cliente (pós-consolidação, client_id JÁ é o id no corpus)
  const scopes = ["global"];
  if (session.client_id) scopes.push(`client:${session.client_id}`);
  const { data: insights, error: insightsErr } = await appDb
    .from("vm_viral_insights")
    .select("insight_type, scope, payload")
    .in("scope", scopes);
  if (insightsErr) throw new Error(`falha ao carregar insights: ${insightsErr.message}`);

  // Aprendizados ensinados (menu Ensinar): entram como pseudo-insights taught_<dimensao>,
  // roteados por dimensão nos agentes via taughtBlock. Curadoria humana: prevalecem em conflito.
  const taught: { insight_type: string; scope: string; payload: unknown }[] = [];
  const lessonIds: string[] = []; // WP-E.1: ids das lições que entraram no contexto (fingerprint)
  try {
    const { data } = await appDb
      .from("vm_lesson_learnings")
      .select("id, dimensao, titulo, descricao, created_at, vm_lessons!inner(client_id)")
      .eq("active", true)
      .order("created_at", { ascending: false });
    const rows = (data ?? [])
      .map((t) => ({ ...t, lessonClient: (Array.isArray(t.vm_lessons) ? t.vm_lessons[0] : t.vm_lessons)?.client_id ?? null }))
      .filter((t) => t.lessonClient === null || t.lessonClient === session.client_id)
      // client-scoped antes de global; dentro do grupo, mais novos primeiro (já ordenado)
      .sort((a, b) => Number(!!b.lessonClient) - Number(!!a.lessonClient))
      .slice(0, 12); // orçamento de contexto do agente Dados
    lessonIds.push(...rows.map((t) => t.id));
    taught.push(
      ...rows.map((t) => ({
        insight_type: `taught_${t.dimensao}`,
        scope: t.lessonClient ? `client:${t.lessonClient}` : "global",
        payload: { titulo: t.titulo, descricao: t.descricao },
      }))
    );
  } catch (e) {
    console.error("aprendizados ensinados indisponíveis, seguindo sem", e);
  }

  return {
    sessionId,
    userId: session.user_id ?? null,
    prompt: session.prompt,
    clientId: session.client_id,
    clientPrefs,
    playbooks,
    bannedPhrases: (bannedRes.data ?? []) as BannedPhrase[],
    insights: [...(insights ?? []), ...taught],
    fewShot,
    attachments: (attachments.data ?? []) as Attachment[],
    modelagemBriefs: [],
    artifacts: (session.artifacts as GenerationContext["artifacts"]) ?? null,
    usageLog: {},
    lessonIds,
    playbookVersions,
    insightRunId: lastRun.data?.id ?? null,
  };
}
