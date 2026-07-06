import OpenAI from "openai";
import { appDb, viralData } from "../db";
import type { Attachment, BannedPhrase, ClientPrefs, GenerationContext } from "./types";

const openai = new OpenAI();

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small", // 1536 dims, compatível com os embeddings existentes
    input: text.slice(0, 8000),
  });
  return res.data[0].embedding;
}

async function fetchFewShot(prompt: string, clientId: string | null) {
  const fewShot: { roteiro: string; origem: string }[] = [];
  try {
    const queryEmbedding = await embed(prompt);
    const corpus = await viralData.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: 5,
      match_threshold: 0.3,
    });
    for (const d of corpus.data ?? []) {
      if (d.content) fewShot.push({ roteiro: d.content, origem: "roteiro publicado (corpus)" });
    }
  } catch (e) {
    console.error("few-shot search failed, seguindo sem exemplos vetoriais", e);
  }
  void clientId; // ponytail: filtro de few-shot por cliente entra quando o corpus tiver embeddings por cliente
  return fewShot.slice(0, 6);
}

export async function loadContext(sessionId: string): Promise<GenerationContext> {
  const { data: session, error } = await appDb
    .from("vm_sessions")
    .select("id, prompt, client_id")
    .eq("id", sessionId)
    .single();
  if (error || !session) throw new Error(`sessão não encontrada: ${error?.message}`);

  const [attachments, playbooksRes, bannedRes, prefsRes, fewShot] = await Promise.all([
    appDb.from("vm_attachments").select("id, kind, is_modelagem, url, raw_content").eq("session_id", sessionId),
    appDb.from("vm_playbooks").select("slug, content").eq("active", true),
    appDb.from("vm_banned_phrases").select("pattern, label, severity").eq("active", true),
    session.client_id
      ? appDb
          .from("vm_client_preferences")
          .select("proibicoes, tom_de_voz, temas_preferidos, vocabulario_evitar, vocabulario_usar, notas_entrevista, viral_data_cliente_id, clientes(nome)")
          .eq("client_id", session.client_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    fetchFewShot(session.prompt, session.client_id),
  ]);

  const playbooks: Record<string, string> = {};
  for (const p of playbooksRes.data ?? []) playbooks[p.slug] = p.content;

  let clientPrefs: ClientPrefs | null = null;
  const prefs = prefsRes.data as (Omit<ClientPrefs, "nome"> & { viral_data_cliente_id: string | null; clientes: { nome: string } | { nome: string }[] | null }) | null;
  if (prefs) {
    const clientRel = Array.isArray(prefs.clientes) ? prefs.clientes[0] : prefs.clientes;
    clientPrefs = { ...prefs, nome: clientRel?.nome ?? "cliente" };
  }

  // Insights: globais + do cliente (pós-consolidação, client_id JÁ é o id no corpus)
  const scopes = ["global"];
  if (session.client_id) scopes.push(`client:${session.client_id}`);
  const { data: insights } = await appDb
    .from("vm_viral_insights")
    .select("insight_type, scope, payload")
    .in("scope", scopes);

  return {
    sessionId,
    prompt: session.prompt,
    clientId: session.client_id,
    clientPrefs,
    playbooks,
    bannedPhrases: (bannedRes.data ?? []) as BannedPhrase[],
    insights: insights ?? [],
    fewShot,
    attachments: (attachments.data ?? []) as Attachment[],
    modelagemBriefs: [],
  };
}
