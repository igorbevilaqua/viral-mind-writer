// A caça (plano 014, WP-5): pool → busca → ranking → classificação → pool de novo.
//
// Orquestra as peças que já existem (queries.ts, buscar.ts, rank.ts) e é o único ponto que
// o suggest.ts precisa chamar. Fail-soft por construção: quem chama trata [] como "sem
// modelagem desta vez" — sugestão sem vídeo externo continua sendo sugestão.
//
// A ordem das etapas é a economia do plano:
//   1. pool primeiro, casando pelas queries do cliente — vídeo já descoberto é de graça;
//   2. só então a busca paga (1 crédito por query por plataforma);
//   3. ranking em código, nunca no LLM;
//   4. UMA chamada de classificação, só nos finalistas ainda sem classe, cacheada pra sempre;
//   5. upsert no pool, para a próxima rodada do mesmo nicho não pagar nada.
//
// Nada é transcrito aqui. Transcrição e autópsia só acontecem quando o usuário clica
// "usar com modelagem" — descobre 600, transcreve 1.

import { appDb, viralData } from "../db";
import { anthropic, ANALYST_MODEL } from "../anthropic";
import { agentPrompt, toolArray, toolInput } from "../pipeline/agents";
import { buscarCandidatos, type Candidato } from "./buscar";
import { rankear, type AplicabilidadeBr, type CandidatoRankeavel, type TimingClasse } from "./rank";
import { garantirSearchQueries } from "./queries";

const LIMITE_PADRAO = 15;
const MAX_CLASSIFICAR = 40; // finalistas que entram na chamada de classificação
const POOL_SUFICIENTE = 40; // pool quente o bastante para não pagar busca nenhuma
const MAX_POOL = 400;

export interface ModelagemSugerida {
  plataforma: string;
  plataform_id: string;
  url: string;
  autor: string;
  autor_seguidores: number | null;
  views: number;
  ratio: number;
  timing_classe: TimingClasse | null;
  caption: string;
}

interface PoolRow {
  plataforma: string;
  plataform_id: string;
  url: string;
  autor_handle: string | null;
  autor_seguidores: number | null;
  caption: string | null;
  duracao_seg: number | null;
  data_publicacao: string | null;
  views: number | null;
  likes: number | null;
  shares: number | null;
  comments: number | null;
  som_id: string | null;
  timing_classe: string | null;
  janela_sazonal: string | null;
  aplicabilidade_br: string | null;
  descoberto_por: string[] | null;
  usado_em: string[] | null;
}

const chaveDe = (c: { plataforma: string; plataform_id: string }) => `${c.plataforma}:${c.plataform_id}`;

// ─── Entradas ────────────────────────────────────────────────────────────────

function doPool(r: PoolRow): CandidatoRankeavel {
  return {
    plataforma: r.plataforma as Candidato["plataforma"],
    plataform_id: r.plataform_id,
    url: r.url,
    autor_handle: r.autor_handle ?? "",
    autor_seguidores: r.autor_seguidores,
    caption: r.caption ?? "",
    duracao_seg: r.duracao_seg ?? 0,
    data_publicacao: r.data_publicacao ?? "",
    views: Number(r.views ?? 0),
    likes: Number(r.likes ?? 0),
    shares: Number(r.shares ?? 0),
    comments: Number(r.comments ?? 0),
    som_id: r.som_id,
    queries: r.descoberto_por ?? [],
    timing_classe: (r.timing_classe as TimingClasse | null) ?? null,
    janela_sazonal: r.janela_sazonal,
    aplicabilidade_br: (r.aplicabilidade_br as AplicabilidadeBr | null) ?? null,
    usado_em: r.usado_em ?? [],
  };
}

/** plataform_ids que o cliente já publicou — o corpus dele. Vídeo que ele já viu não é modelagem. */
async function idsDoCorpus(clientId: string): Promise<Set<string>> {
  const { data: canais } = await viralData.from("canais").select("id").eq("cliente_id", clientId);
  const canalIds = ((canais ?? []) as { id: string }[]).map((c) => c.id);
  if (!canalIds.length) return new Set();
  const { data } = await viralData
    .from("videos")
    .select("plataform_id")
    .in("canal_id", canalIds)
    .not("plataform_id", "is", null);
  return new Set(((data ?? []) as { plataform_id: string }[]).map((v) => v.plataform_id));
}

// ─── Classificação (uma chamada, cacheada pra sempre) ────────────────────────

const CLASSIFICACAO_TOOL = {
  name: "registrar_classificacao",
  description: "Registra a classificação temporal e de aplicabilidade de cada vídeo recebido.",
  input_schema: {
    type: "object" as const,
    properties: {
      videos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            plataform_id: { type: "string" },
            timing_classe: { type: "string", enum: ["breaking", "trending", "ciclico", "perene"] },
            janela_sazonal: { type: ["string", "null"], description: "mês/faixa em minúsculas; null se não for ciclico" },
            idioma: { type: "string", description: "código de 2 letras: pt, es, en..." },
            aplicabilidade_br: { type: "string", enum: ["universal", "adaptavel", "local_estrangeiro"] },
          },
          required: ["plataform_id", "timing_classe", "aplicabilidade_br"],
        },
      },
    },
    required: ["videos"],
  },
};

interface LinhaClassificada {
  plataform_id?: string;
  timing_classe?: TimingClasse;
  janela_sazonal?: string | null;
  idioma?: string | null;
  aplicabilidade_br?: AplicabilidadeBr;
}

async function classificar(
  candidatos: CandidatoRankeavel[],
  sinal?: AbortSignal
): Promise<Map<string, LinhaClassificada>> {
  const lista = candidatos
    .map(
      (c) =>
        `- plataform_id: ${c.plataform_id} | @${c.autor_handle} | ${c.data_publicacao.slice(0, 10)} | ${c.duracao_seg}s | ${c.views} views${c.som_id ? " | usa áudio de trend" : ""}\n  legenda: ${(c.caption || "(sem legenda)").replace(/\s+/g, " ").slice(0, 300)}`
    )
    .join("\n");

  const res = await anthropic.messages.create(
    {
      model: ANALYST_MODEL,
      max_tokens: 8000, // 40 vídeos × ~5 campos; thinking divide o teto (AGENTS.md §5)
      tools: [CLASSIFICACAO_TOOL],
      tool_choice: { type: "tool", name: "registrar_classificacao" },
      system: [{ type: "text", text: agentPrompt("classificador-modelagens"), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `VÍDEOS:\n${lista}\n\nClassifique todos.` }],
    },
    sinal ? { signal: sinal } : undefined
  );

  const toolUse = res.content.find((b) => b.type === "tool_use");
  const linhas = toolUse?.type === "tool_use" ? toolArray<LinhaClassificada>(toolInput(toolUse), "videos") : [];
  const porId = new Map<string, LinhaClassificada>();
  for (const l of linhas) if (l?.plataform_id) porId.set(String(l.plataform_id), l);
  if (!porId.size) console.warn(`[modelagens] classificação vazia (stop_reason=${res.stop_reason})`);
  return porId;
}

// ─── Persistência ────────────────────────────────────────────────────────────

async function gravarNoPool(candidatos: CandidatoRankeavel[], agora: Date): Promise<void> {
  if (!candidatos.length) return;

  // descoberto_por é a chave de reaproveitamento do pool, e o upsert do PostgREST
  // SOBRESCREVE a coluna (medido). Sem unir com o que já está lá, um vídeo achado antes pela
  // query A e reachado agora pela B perde o A — e o próximo cliente que buscar A paga
  // crédito por um vídeo que já estava no pool. Uma leitura extra evita o vazamento.
  const { data: existentes } = await appDb
    .from("vm_modelagem_pool")
    .select("plataforma, plataform_id, descoberto_por")
    .in("plataform_id", candidatos.map((c) => c.plataform_id));
  const jaConhecidas = new Map(
    ((existentes ?? []) as Pick<PoolRow, "plataforma" | "plataform_id" | "descoberto_por">[]).map((r) => [
      chaveDe(r),
      r.descoberto_por ?? [],
    ])
  );

  const rows = candidatos.map((c) => ({
    plataforma: c.plataforma,
    plataform_id: c.plataform_id,
    url: c.url,
    autor_handle: c.autor_handle || null,
    autor_seguidores: c.autor_seguidores,
    caption: c.caption || null,
    duracao_seg: c.duracao_seg || null,
    data_publicacao: c.data_publicacao || null,
    views: c.views,
    likes: c.likes,
    shares: c.shares,
    comments: c.comments,
    som_id: c.som_id,
    timing_classe: c.timing_classe,
    janela_sazonal: c.janela_sazonal ?? null,
    aplicabilidade_br: c.aplicabilidade_br ?? null,
    descoberto_por: [...new Set([...(jaConhecidas.get(chaveDe(c)) ?? []), ...(c.queries ?? [])])],
    ultima_coleta: agora.toISOString(),
  }));
  // Falha aqui não estraga a sugestão: o pool é cache, não fonte. Perde-se a economia da
  // próxima rodada, não o resultado desta.
  const { error } = await appDb.from("vm_modelagem_pool").upsert(rows, { onConflict: "plataforma,plataform_id" });
  if (error) console.error("[modelagens] upsert no pool falhou", error);
}

// ─── Caça ────────────────────────────────────────────────────────────────────

export interface CacaOpts {
  limite?: number;
  agora?: Date;
  sinal?: AbortSignal;
}

/**
 * Devolve os melhores candidatos externos a modelagem para o cliente, do melhor para o
 * pior. Lista vazia significa "sem modelagem desta vez" — nunca é erro.
 */
export async function cacarModelagens(clientId: string, opts: CacaOpts = {}): Promise<ModelagemSugerida[]> {
  const agora = opts.agora ?? new Date();
  const limite = opts.limite ?? LIMITE_PADRAO;

  const queries = await garantirSearchQueries(clientId, agora);
  if (!queries.length) return [];

  const [poolRes, no_corpus] = await Promise.all([
    appDb
      .from("vm_modelagem_pool")
      .select(
        "plataforma, plataform_id, url, autor_handle, autor_seguidores, caption, duracao_seg, data_publicacao, views, likes, shares, comments, som_id, timing_classe, janela_sazonal, aplicabilidade_br, descoberto_por, usado_em"
      )
      .overlaps("descoberto_por", queries)
      .is("removido_em", null)
      .limit(MAX_POOL),
    idsDoCorpus(clientId),
  ]);

  const porChave = new Map<string, CandidatoRankeavel>();
  for (const r of (poolRes.data ?? []) as PoolRow[]) porChave.set(chaveDe(r), doPool(r));
  const vindosDoPool = new Set(porChave.keys());

  // Pool quente = zero crédito. É o caso do segundo clique no mesmo cliente e de dois
  // clientes que compartilham nicho (as queries batem em texto).
  if (porChave.size < POOL_SUFICIENTE) {
    const busca = await buscarCandidatos(queries, { paginas: 1, sinal: opts.sinal });
    for (const c of busca.candidatos) {
      const chave = chaveDe(c);
      const jaTinha = porChave.get(chave);
      // Pool tem prioridade: já carrega classificação (paga) e usado_em. Métrica nova
      // sobrescreve a antiga, o resto fica.
      porChave.set(chave, jaTinha ? { ...jaTinha, views: c.views, likes: c.likes, shares: c.shares, comments: c.comments } : c);
    }
  }

  const todos = [...porChave.values()];
  // Primeiro passe: sem classificação o decay é neutro, então isto ordena por ratio dentro
  // da plataforma — serve só para escolher QUEM vale classificar.
  const finalistas = rankear(todos, { agora, cliente_id: clientId, no_corpus });
  const semClasse = finalistas.filter((r) => !r.candidato.timing_classe).slice(0, MAX_CLASSIFICAR);

  if (semClasse.length) {
    try {
      const classes = await classificar(
        semClasse.map((r) => r.candidato),
        opts.sinal
      );
      for (const { candidato } of semClasse) {
        const c = classes.get(candidato.plataform_id);
        if (!c) continue;
        candidato.timing_classe = c.timing_classe ?? null;
        candidato.janela_sazonal = c.janela_sazonal ?? null;
        candidato.aplicabilidade_br = c.aplicabilidade_br ?? null;
      }
    } catch (e) {
      // Sem classificação o ranking continua de pé (decay neutro) e o filtro de
      // aplicabilidade fica inerte — pior resultado, não resultado nenhum.
      console.error("[modelagens] classificação falhou, seguindo sem ela", e);
    }
  }

  // Segundo passe, agora com timing/aplicabilidade: é aqui que perene antigo passa na
  // frente de breaking recente.
  const ranqueados = rankear(todos, { agora, cliente_id: clientId, no_corpus }).slice(0, limite);

  // Grava o que a busca trouxe de novo e o que acabou de ser classificado. O que veio do
  // pool sem mudança não precisa de escrita.
  const novos = todos.filter((c) => !vindosDoPool.has(chaveDe(c)));
  const classificadosAgora = semClasse.map((r) => r.candidato).filter((c) => vindosDoPool.has(chaveDe(c)));
  await gravarNoPool([...novos, ...classificadosAgora], agora);

  return ranqueados.map((r) => ({
    plataforma: r.candidato.plataforma,
    plataform_id: r.candidato.plataform_id,
    url: r.candidato.url,
    autor: r.candidato.autor_handle,
    autor_seguidores: r.candidato.autor_seguidores,
    views: r.candidato.views,
    ratio: Math.round(r.ratio * 10) / 10,
    timing_classe: r.candidato.timing_classe ?? null,
    caption: r.candidato.caption,
  }));
}
