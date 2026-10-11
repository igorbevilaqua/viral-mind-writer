import { fmtNum } from "../format";
import OpenAI from "openai";
import { appDb, crmDb, viralData } from "../db";
import { agregarDiarias, type Diaria } from "../performance-metrics";
import {
  candidatosDeDocumentos,
  rankFewShot,
  resumirComparacao,
  CRITERIO_PADRAO,
  escopoFewShot,
  type CandidatoFewShot,
  type ComparacaoCriterio,
  type CriterioFewShot,
  type EscopoFewShot,
  type ExemploFewShot,
  type MetricasVideo,
} from "./few-shot";
import { carregarEstrategia } from "./estrategia";
import { modeloValidoPara } from "../llm-catalogo";
import { modeloDe } from "../llm-config";
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
// metricas_diarias, e o RPC já devolve `video_id`. Uma segunda query pelos 60 ids dá ~46% de
// cobertura. A plataforma vem junto porque é ela que decide se 0 é zero ou ausência de dado;
// o cliente vem junto porque é ele que separa few-shot "do cliente" de "global" (WP-G).
async function metricasDosCandidatos(rows: DocRow[]): Promise<Map<string, MetricasVideo>> {
  const mapa = new Map<string, MetricasVideo>();
  const ids = [...new Set(rows.map((r) => r.video_id).filter((v): v is string => !!v))];
  if (!ids.length) return mapa;
  const { data, error } = await viralData
    .from("videos")
    .select("id, canais(plataforma, cliente_id), metricas_diarias(views_no_dia, fb_views_no_dia, compartilhamentos_no_dia)")
    .in("id", ids);
  if (error) {
    // Sem métrica o ranking cai no critério de hoje sozinho (candidato sem dado ⇒ fallback).
    console.error("métricas dos candidatos indisponíveis, few-shot segue por views", error.message);
    return mapa;
  }
  type Canal = { plataforma?: string | null; cliente_id?: string | null };
  const linhas = (data ?? []) as unknown as { id: string; canais: Canal | Canal[] | null; metricas_diarias: Diaria[] | null }[];
  for (const v of linhas) {
    const canal = Array.isArray(v.canais) ? v.canais[0] : v.canais;
    mapa.set(v.id, {
      ...agregarDiarias(v.metricas_diarias ?? [], canal?.plataforma ?? null),
      clienteId: canal?.cliente_id ?? null,
    });
  }
  return mapa;
}

async function candidatosFewShot(prompt: string): Promise<CandidatoFewShot[]> {
  const queryEmbedding = await embed(prompt);
  const corpus = await viralData.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: 60, // sobra pra pós-filtrar por performance E por cliente (WP-G); threshold inalterado
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

// Few-shot vencedor: 60 por similaridade, 5 pelo critério vigente — os do cliente primeiro
// quando há ≥3 deles. Vale para os DOIS consumidores — o roteirista (draft.ts) e a referência de
// voz do humanizador (humanize.ts), que lê os 2 primeiros desta mesma lista.
// Plano 024, 2.5: a voz se aprende com o que a CASA escreveu para ESTE cliente e viralizou no
// perfil DELE, não com o vídeo mais visto do corpus inteiro (views absolutos medem a audiência
// herdada, não o roteiro). Os 3 roteiros VM do cliente com maior coeficiente viral nos últimos
// 180 dias, um por roteiro. É o registro que se imita; o tema vem do dossiê.
// O texto vem do CRM (escrito, com parágrafos) quando CRM_SUPABASE_URL/CRM_SERVICE_ROLE_KEY
// existem; sem elas, da transcrição do vídeo (ASR, sem parágrafo), que ensina a voz igual.
const FEW_SHOT_DA_CASA = 3;
const JANELA_DA_CASA_DIAS = 180;

// Notas de edição do CRM vêm entre parênteses/colchetes no meio do texto ("(corta pra b-roll)"),
// e links de referência soltos entre os parágrafos: nada disso é fala.
const limparNotasDoCrm = (t: string) =>
  t.replace(/https?:\/\/\S+/g, " ").replace(/\([^)]*\)|\[[^\]]*\]|\*/g, " ").replace(/[ \t]+/g, " ").trim();

async function textosDoCrm(ids: string[]): Promise<Map<string, string>> {
  if (!crmDb || !ids.length) return new Map();
  const { data, error } = await crmDb.from("scripts").select("id, script_text").in("id", ids);
  if (error) {
    console.error("few-shot: CRM indisponível, seguindo com a transcrição", error.message);
    return new Map();
  }
  return new Map((data ?? []).filter((r) => r.script_text).map((r) => [r.id as string, limparNotasDoCrm(r.script_text as string)]));
}

async function fewShotDaCasa(clientId: string): Promise<ExemploFewShot[]> {
  const desde = new Date(Date.now() - JANELA_DA_CASA_DIAS * 864e5).toISOString();
  const { data: topo, error } = await viralData
    .schema("oraculo")
    .from("fato_video")
    .select("video_id, coeficiente_viral, views_total")
    .eq("cliente_id", clientId)
    .eq("vm_script", "sim")
    .eq("maturando", false)
    .gte("data_publicacao", desde)
    .order("coeficiente_viral", { ascending: false })
    .limit(30);
  if (error || !topo?.length) return [];
  const { data: videos } = await viralData
    .from("videos")
    .select("id, roteiro, crm_script_id")
    .in("id", topo.map((t) => t.video_id));
  const porId = new Map((videos ?? []).map((v) => [v.id, v]));
  const escritos = await textosDoCrm((videos ?? []).map((v) => v.crm_script_id as string | null).filter((x): x is string => !!x));
  const vistos = new Set<string>();
  const out: ExemploFewShot[] = [];
  for (const t of topo) {
    const v = porId.get(t.video_id);
    const chave = (v?.crm_script_id as string | null) ?? (t.video_id as string);
    const texto = (v?.crm_script_id && escritos.get(v.crm_script_id as string)) || (v?.roteiro as string | undefined);
    if (!texto || texto.length < 600 || vistos.has(chave)) continue;
    vistos.add(chave);
    out.push({
      roteiro: texto,
      origem: `roteiro ${escritos.has(chave) ? "escrito" : "transcrito"} da casa para este cliente — ${Number(t.coeficiente_viral).toFixed(1)}x a média do canal, ${fmtNum(Number(t.views_total))} views`,
      views: Number(t.views_total) || 0,
      taxa: null,
      criterio: "views",
      escopo: "cliente",
    });
    if (out.length === FEW_SHOT_DA_CASA) break;
  }
  return out;
}

async function fetchFewShot(
  prompt: string,
  clientId: string | null
): Promise<{ exemplos: ExemploFewShot[]; criterio: CriterioFewShot; escopo: EscopoFewShot }> {
  if (clientId) {
    try {
      const casa = await fewShotDaCasa(clientId);
      if (casa.length === FEW_SHOT_DA_CASA) return { exemplos: casa, criterio: "views", escopo: "cliente" };
    } catch (e) {
      console.error("few-shot da casa falhou, seguindo pelo corpus", e);
    }
  }
  // adaptação sem tema: nada pra embutir; embeddings rejeita string vazia
  if (!prompt.trim()) return { exemplos: [], criterio: CRITERIO_PADRAO, escopo: "global" };
  try {
    const [candidatos, criterio] = await Promise.all([candidatosFewShot(prompt), criterioFewShot()]);
    const exemplos = rankFewShot(candidatos, criterio, clientId);
    return { exemplos, criterio, escopo: escopoFewShot(exemplos) };
  } catch (e) {
    console.error("few-shot search failed, seguindo sem exemplos vetoriais", e);
    return { exemplos: [], criterio: CRITERIO_PADRAO, escopo: "global" };
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
  "playbooks" | "playbookVersions" | "bannedPhrases" | "clientPrefs" | "insights" | "lessonIds" | "insightRunId" | "bullets" | "estrategia"
>;

async function loadEstadoComum(clientId: string | null, modoModelagem: boolean): Promise<EstadoComum> {
  const [playbooksRes, bannedRes, prefsRes, lastRun, bulletsRes, estrategia] = await Promise.all([
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
    // A estratégia vigente do cliente, decidida no Cockpit. Entra aqui junto do resto porque
    // vale para TODA geração da conta, inclusive em modelagem: ela diz a direção (apostas,
    // territórios, o que está em teste), não repete o repertório que a modelagem suprime.
    carregarEstrategia(clientId),
  ]);

  // Falha de query aqui gerava roteiro silenciosamente SEM playbooks/banned.
  // Lançar é o certo: o catch do pipeline persiste e exibe o erro ao usuário.
  if (playbooksRes.error) throw new Error(`falha ao carregar playbooks: ${playbooksRes.error.message}`);
  if (bannedRes.error) throw new Error(`falha ao carregar frases banidas: ${bannedRes.error.message}`);

  // Banco de prova (plano 024, 1.1): CODEX_BANCADA_PLAYBOOKS='{"hook":4,"style_guide":5}' troca
  // a versão ATIVA pela pedida, sem ativar nada no banco. Só existe em script; produção não seta.
  const pedidas = process.env.CODEX_BANCADA_PLAYBOOKS
    ? (JSON.parse(process.env.CODEX_BANCADA_PLAYBOOKS) as Record<string, number>)
    : null;
  if (pedidas) {
    const { data: versoes, error: erroVersoes } = await appDb
      .from("vm_playbooks")
      .select("slug, content, version")
      .in("slug", Object.keys(pedidas));
    if (erroVersoes) throw new Error(`banco de prova: falha ao carregar playbooks pedidos: ${erroVersoes.message}`);
    const escolhidas = (versoes ?? []).filter((v) => Number(v.version) === pedidas[v.slug]);
    const faltando = Object.keys(pedidas).filter((slug) => !escolhidas.some((v) => v.slug === slug));
    if (faltando.length) throw new Error(`banco de prova: versão pedida não existe para ${faltando.join(", ")}`);
    playbooksRes.data = [...(playbooksRes.data ?? []).filter((p) => !(p.slug in pedidas)), ...escolhidas];
  }

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
      .select("id, dimensao, destinatarios, titulo, descricao, grupo, created_at, vm_lessons!inner(client_id)")
      .eq("active", true)
      .order("created_at", { ascending: false });
    const rows = (data ?? [])
      .map((t) => ({ ...t, lessonClient: (Array.isArray(t.vm_lessons) ? t.vm_lessons[0] : t.vm_lessons)?.client_id ?? null }))
      .filter((t) => t.lessonClient === null || (!modoModelagem && t.lessonClient === clientId));
    // Recorrência: quantas lições ATIVAS do mesmo grupo disputam esta geração. É o número que
    // substitui "a mais recente ganha" no teto de 3 por agente (licoesPara). Lição sem grupo
    // conta como grupo próprio, recorrência 1: nunca vira favorita por falta de dado.
    const recorrencia = new Map<string, number>();
    for (const t of rows) {
      const g = t.grupo ?? t.id;
      recorrencia.set(g, (recorrencia.get(g) ?? 0) + 1);
    }
    // client-scoped antes de global; depois o que o piloto pediu mais vezes; empate por data
    // (o `order` do select já trouxe mais novos primeiro, e o sort do JS é estável).
    rows.sort(
      (a, b) =>
        Number(!!b.lessonClient) - Number(!!a.lessonClient) ||
        (recorrencia.get(b.grupo ?? b.id) ?? 1) - (recorrencia.get(a.grupo ?? a.id) ?? 1)
    );
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
          grupo: t.grupo ?? null,
          recorrencia: recorrencia.get(t.grupo ?? t.id) ?? 1,
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
    estrategia,
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
    .select("id, user_id, prompt, client_id, artifacts, premissa, premissa_origem, modelo")
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
    // A coluna só é LIDA hoje: o seletor da home saiu quando a tela de configuração passou a
    // mandar em quem escreve. As sessões criadas enquanto ele existiu têm valor gravado e
    // continuam honrando a escolha delas; todas as outras seguem a configuração vigente.
    modelo: modeloValidoPara("escrita", session.modelo) ?? (await modeloDe("escrita")),
    modoModelagem,
    ...(await loadEstadoComum(session.client_id, modoModelagem)),
    fewShot: fewShot.exemplos,
    fewShotCriterio: fewShot.criterio,
    // Escopo efetivo do few-shot → pipeline_trace.proveniencia.blocos.few_shot (index.ts já
    // serializa `blocos`; registrarBloco preserva esta chave). STOP do WP-G lê daqui.
    blocos: { few_shot: { escopo: fewShot.escopo } },
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
    modelo: await modeloDe("escrita"), // sem sessão não há escolha a herdar
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

// Banco de prova (plano 024, 1.1): o contexto de uma pauta sem sessão. Mesmo estado comum e
// mesmo few-shot da geração real; sem anexos (as pautas do banco são tema digitado).
export async function loadContextBancada(clientId: string, prompt: string): Promise<GenerationContext> {
  const [ctx, fewShot] = await Promise.all([loadContextAvulso(clientId), fetchFewShot(prompt, clientId)]);
  return {
    ...ctx,
    prompt,
    modelo: await modeloDe("escrita"),
    fewShot: fewShot.exemplos,
    fewShotCriterio: fewShot.criterio,
    blocos: { few_shot: { escopo: fewShot.escopo } },
  };
}
