import OpenAI from "openai";
import { appDb, viralData } from "../db";
import { agregarDiarias, type Diaria } from "../performance-metrics";
import {
  candidatosDeDocumentos,
  rankFewShot,
  resumirComparacao,
  CRITERIO_PADRAO,
  type CandidatoFewShot,
  type ComparacaoCriterio,
  type CriterioFewShot,
  type ExemploFewShot,
  type MetricasVideo,
} from "./few-shot";
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

type DocRow = { content?: string | null; video_id?: string | null; metadata?: unknown };

// Compartilhamento não vive em documents.metadata (3,7% de cobertura, inviável): vive em
// metricas_diarias, e o RPC já devolve `video_id`. Uma segunda query pelos 20 ids dá ~46% de
// cobertura. A plataforma vem junto porque é ela que decide se 0 é zero ou ausência de dado.
async function metricasDosCandidatos(rows: DocRow[]): Promise<Map<string, MetricasVideo>> {
  const mapa = new Map<string, MetricasVideo>();
  const ids = [...new Set(rows.map((r) => r.video_id).filter((v): v is string => !!v))];
  if (!ids.length) return mapa;
  const { data, error } = await viralData
    .from("videos")
    .select("id, canais(plataforma), metricas_diarias(views_no_dia, fb_views_no_dia, compartilhamentos_no_dia)")
    .in("id", ids);
  if (error) {
    // Sem métrica o ranking cai no critério de hoje sozinho (candidato sem dado ⇒ fallback).
    console.error("métricas dos candidatos indisponíveis, few-shot segue por views", error.message);
    return mapa;
  }
  const linhas = (data ?? []) as unknown as {
    id: string;
    canais: { plataforma?: string | null } | { plataforma?: string | null }[] | null;
    metricas_diarias: Diaria[] | null;
  }[];
  for (const v of linhas) {
    const canal = Array.isArray(v.canais) ? v.canais[0] : v.canais;
    mapa.set(v.id, agregarDiarias(v.metricas_diarias ?? [], canal?.plataforma ?? null));
  }
  return mapa;
}

async function candidatosFewShot(prompt: string): Promise<CandidatoFewShot[]> {
  const queryEmbedding = await embed(prompt);
  const corpus = await viralData.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: 20, // sobra pra pós-filtrar por performance; threshold inalterado
    match_threshold: 0.3,
  });
  const rows = (corpus.data ?? []) as DocRow[];
  return candidatosDeDocumentos(rows, await metricasDosCandidatos(rows));
}

// A decisão humana sobre o critério (migration 0036). Última linha vence; tabela vazia — ou
// ainda não aplicada — é o comportamento de hoje: views. Rejeitar grava 'views' explicitamente,
// que é o que faz a pendência sumir da fila do Kasparov sem mudar nada.
export async function criterioFewShot(): Promise<CriterioFewShot> {
  const { data, error } = await appDb
    .from("vm_fewshot_criterio")
    .select("criterio")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("critério do few-shot indisponível, seguindo por views", error.message);
    return CRITERIO_PADRAO;
  }
  return data?.criterio === "taxa_compartilhamento" ? "taxa_compartilhamento" : CRITERIO_PADRAO;
}

// Few-shot vencedor: 20 por similaridade, 5 pelo critério vigente. Vale para os DOIS
// consumidores — o roteirista (draft.ts) e a referência de voz do humanizador (humanize.ts),
// que lê os 2 primeiros desta mesma lista.
async function fetchFewShot(
  prompt: string,
  clientId: string | null
): Promise<{ exemplos: ExemploFewShot[]; criterio: CriterioFewShot }> {
  // adaptação sem tema: nada pra embutir; embeddings rejeita string vazia
  if (!prompt.trim()) return { exemplos: [], criterio: CRITERIO_PADRAO };
  try {
    void clientId; // ponytail: filtro de few-shot por cliente adiado — entra com match_documents_v2 (WP-C.7)
    const [candidatos, criterio] = await Promise.all([candidatosFewShot(prompt), criterioFewShot()]);
    return { exemplos: rankFewShot(candidatos, criterio), criterio };
  } catch (e) {
    console.error("few-shot search failed, seguindo sem exemplos vetoriais", e);
    return { exemplos: [], criterio: CRITERIO_PADRAO };
  }
}

// A comparação que o Kasparov leva ao humano (fila em kasparov-filas.ts). Roda para um TEMA
// REAL — o prompt da última sessão — porque conjunto de exemplo inventado não decide nada.
// ponytail: custa um embedding por turno do Kasparov, e só até a decisão existir: com a
// decisão gravada esta função sai na primeira linha, antes de qualquer chamada externa.
export async function comparacaoFewShot(clientId: string | null): Promise<ComparacaoCriterio | null> {
  const { data: decidido, error } = await appDb.from("vm_fewshot_criterio").select("id").limit(1).maybeSingle();
  // Já decidido, ou não há onde gravar (0036 não aplicada): nos dois casos a pergunta não vai à
  // mesa. Oferecer um botão que não tem onde salvar a resposta é pior do que não oferecer.
  if (decidido || error) return null;
  const ultimoTema = async (c: string | null) => {
    const q = appDb
      .from("vm_sessions")
      .select("prompt")
      .neq("prompt", "")
      .order("created_at", { ascending: false })
      .limit(1);
    const { data } = await (c ? q.eq("client_id", c) : q).maybeSingle();
    return (data?.prompt as string | undefined)?.trim() ?? "";
  };
  // tema do cliente da conversa; sem sessão dele, o último tema da casa serve igual
  const tema = (await ultimoTema(clientId)) || (clientId ? await ultimoTema(null) : "");
  if (!tema) return null;
  return resumirComparacao(tema, await candidatosFewShot(tema));
}

// O estado que NÃO depende de sessão: playbooks, frases banidas, prefs do cliente, insights e
// lições ativas. Uma implementação só, consumida pela sessão (loadContext) e pelo debate avulso
// (loadContextAvulso) — duas cópias divergiriam no primeiro campo novo.
type EstadoComum = Pick<
  GenerationContext,
  "playbooks" | "playbookVersions" | "bannedPhrases" | "clientPrefs" | "insights" | "lessonIds" | "insightRunId" | "bullets"
>;

async function loadEstadoComum(clientId: string | null, modoModelagem: boolean): Promise<EstadoComum> {
  const [playbooksRes, bannedRes, prefsRes, lastRun, bulletsRes] = await Promise.all([
    appDb.from("vm_playbooks").select("slug, content, version").eq("active", true),
    appDb.from("vm_banned_phrases").select("pattern, label, severity, motivo").eq("active", true),
    clientId
      ? appDb
          .from("vm_client_preferences")
          .select("proibicoes, tom_de_voz, temas_preferidos, vocabulario_evitar, vocabulario_usar, notas_entrevista, viral_data_cliente_id, clientes(nome)")
          .eq("client_id", clientId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // WP-E.1: id do run de insights vigente entra no fingerprint do roteiro.
    // Tabela vazia/ausente (migration 0014 não aplicada) → null, sem erro.
    appDb.from("vm_insight_runs").select("id").order("run_at", { ascending: false }).limit(1).maybeSingle(),
    // Paleta emocional votada pelo time (migration 0033). ponytail: a lista inteira vem e o
    // escopo é filtrado em memória — são dezenas de palavras, não vale um .or() escapado.
    appDb.from("vm_bullets").select("termo, client_id, vm_bullet_votes(valor)"),
  ]);

  // Falha de query aqui gerava roteiro silenciosamente SEM playbooks/banned.
  // Lançar é o certo: o catch do pipeline persiste e exibe o erro ao usuário.
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
  if (clientId && !modoModelagem) scopes.push(`client:${clientId}`);
  const { data: insights, error: insightsErr } = await appDb
    .from("vm_viral_insights")
    .select("insight_type, scope, payload")
    .in("scope", scopes);
  if (insightsErr) throw new Error(`falha ao carregar insights: ${insightsErr.message}`);

  // Aprendizados ensinados (menu Ensinar): entram como pseudo-insights `taught`, roteados por
  // DESTINATÁRIO nos agentes via taughtBlock. Curadoria humana: prevalecem em conflito.
  const taught: { insight_type: string; scope: string; payload: unknown }[] = [];
  const lessonIds: string[] = []; // WP-E.1: ids das lições que entraram no contexto (fingerprint)
  try {
    const { data } = await appDb
      .from("vm_lesson_learnings")
      .select("id, dimensao, destinatarios, titulo, descricao, created_at, vm_lessons!inner(client_id)")
      .eq("active", true)
      .order("created_at", { ascending: false });
    const rows = (data ?? [])
      .map((t) => ({ ...t, lessonClient: (Array.isArray(t.vm_lessons) ? t.vm_lessons[0] : t.vm_lessons)?.client_id ?? null }))
      .filter((t) => t.lessonClient === null || (!modoModelagem && t.lessonClient === clientId))
      // client-scoped antes de global; dentro do grupo, mais novos primeiro (já ordenado)
      .sort((a, b) => Number(!!b.lessonClient) - Number(!!a.lessonClient));
    // sem .slice(): o teto agora é por destinatário, aplicado em taughtBlock, com o excedente
    // registrado. O corte global de 12 escondia lição ativa sem dizer a ninguém.
    lessonIds.push(...rows.map((t) => t.id));
    taught.push(
      ...rows.map((t) => ({
        insight_type: "taught",
        scope: t.lessonClient ? `client:${t.lessonClient}` : "global",
        payload: {
          id: t.id,
          titulo: t.titulo,
          descricao: t.descricao,
          destinatarios: t.destinatarios ?? [],
          dimensao: t.dimensao,
        },
      }))
    );
  } catch (e) {
    console.error("aprendizados ensinados indisponíveis, seguindo sem", e);
  }

  // Bullets: tolerante como as lições — paleta indisponível (ou migration 0033 ainda não
  // aplicada) NUNCA derruba a geração, o roteiro sai sem paleta e ninguém percebe.
  let bullets: GenerationContext["bullets"] = [];
  if (bulletsRes.error) {
    console.error("bullets indisponíveis, seguindo sem paleta emocional", bulletsRes.error.message);
  } else {
    bullets = (bulletsRes.data ?? [])
      .filter((b) => b.client_id === null || (!modoModelagem && b.client_id === clientId))
      .map((b) => ({
        termo: b.termo as string,
        score: (b.vm_bullet_votes ?? []).reduce((s: number, v: { valor: number }) => s + (Number(v.valor) || 0), 0),
      }));
  }

  return {
    bullets,
    playbooks,
    playbookVersions,
    bannedPhrases: (bannedRes.data ?? []) as BannedPhrase[],
    clientPrefs,
    insights: [...(insights ?? []), ...taught],
    lessonIds,
    insightRunId: lastRun.data?.id ?? null,
  };
}

// `modo` (migration 0034) é a única coluna nova do anexo, e ela decide Modelar × Replicar.
// Se o deploy chegar antes da migration ser aplicada, o select inteiro falharia e NENHUMA sessão
// geraria; a segunda tentativa sem a coluna mantém tudo rodando em Modelar (que é como null é
// lido de qualquer forma). Custa uma ida a mais ao banco só no dia em que a coluna não existe.
async function carregarAnexos(sessionId: string) {
  const colunas = "id, kind, is_modelagem, url, raw_content";
  const res = await appDb.from("vm_attachments").select(`${colunas}, modo`).eq("session_id", sessionId);
  if (!res.error) return res;
  console.error("anexos: coluna `modo` indisponível (migration 0034 não aplicada?), seguindo em Modelar", res.error.message);
  return appDb.from("vm_attachments").select(colunas).eq("session_id", sessionId);
}

export async function loadContext(sessionId: string): Promise<GenerationContext> {
  const { data: session, error } = await appDb
    .from("vm_sessions")
    .select("id, user_id, prompt, client_id, artifacts, premissa, premissa_origem")
    .eq("id", sessionId)
    .single();
  if (error || !session) throw new Error(`sessão não encontrada: ${error?.message}`);

  const [attachments, fewShot] = await Promise.all([
    carregarAnexos(sessionId),
    fetchFewShot(session.prompt, session.client_id),
  ]);
  // Falha de query aqui gerava roteiro silenciosamente SEM materiais.
  if (attachments.error) throw new Error(`falha ao carregar anexos: ${attachments.error.message}`);

  // Modelagem pedida: o alvo é o vídeo modelado. O que o cliente já fez (hooks campeões,
  // estruturas que performaram, lições dele) puxava o roteiro de volta pro repertório da casa —
  // era essa a interferência. Em modo modelagem esse material NÃO entra: o cliente sobrevive
  // só como veto e identidade (clientPrefsBlock). Insight/lição global continua valendo.
  // É ele que decide o escopo dos insights, e por isso a carga comum vem DEPOIS dos anexos:
  // ponytail: uma ida a mais ao banco numa geração de minutos, em troca de uma carga só.
  const modoModelagem = (attachments.data ?? []).some((a) => a.is_modelagem);

  return {
    sessionId,
    userId: session.user_id ?? null,
    prompt: session.prompt,
    premissa: (session.premissa ?? "").trim(),
    premissaOrigem: (session.premissa_origem ?? null) as GenerationContext["premissaOrigem"],
    clientId: session.client_id,
    modoModelagem,
    ...(await loadEstadoComum(session.client_id, modoModelagem)),
    fewShot: fewShot.exemplos,
    fewShotCriterio: fewShot.criterio,
    attachments: (attachments.data ?? []) as Attachment[],
    modelagemBriefs: [],
    modelagemHooks: [],
    artifacts: (session.artifacts as GenerationContext["artifacts"]) ?? null,
    usageLog: {},
  };
}

// 018 §2 e §5.3: o Kasparov debate FORA de qualquer sessão — entrada global, vídeo aleatório.
// loadContext exige uma sessão real (e lança sem ela), então o debate precisa desta porta.
// Os campos que só existem em sessão vêm vazios de propósito: `sessionId` vazio é o sinal de
// "não há sessão", e é ele que impede a lição nascida daqui de gravar `/sessions/undefined`.
export async function loadContextAvulso(clientId: string | null): Promise<GenerationContext> {
  return {
    sessionId: "",
    userId: null,
    prompt: "",
    premissa: "",
    premissaOrigem: null,
    clientId,
    modoModelagem: false,
    ...(await loadEstadoComum(clientId, false)),
    fewShot: [],
    fewShotCriterio: CRITERIO_PADRAO,
    attachments: [],
    modelagemBriefs: [],
    modelagemHooks: [],
    artifacts: null,
    usageLog: {},
  };
}
