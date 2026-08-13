// Queries de busca por cliente, cacheadas (plano 014, WP-2).
//
// Gerar query a cada busca é desperdício: o nicho de um cliente muda em meses, não em
// minutos. Fica em vm_client_preferences.search_queries e regenera só quando envelhece
// (7 dias) ou quando as preferências mudam.
//
// A semente tem DUAS camadas, e a primeira não é fallback de emergência:
//
//   1. o corpus do próprio cliente, com peso no que performou acima da média DELE —
//      mediana por cliente, nunca global, senão canal pequeno nunca aparece;
//   2. temas_preferidos + insights client_tema (o mesmo `nicho` que suggest.ts já monta).
//
// Medido em 2026-08-13: dos 30 clientes ativos, 6 não têm linha em vm_client_preferences
// (logo camada 2 vazia) e 4 desses também não têm nenhuma linha em vm_video_stats (logo
// sem métrica para pesar a camada 1). Por isso o corpus tem que produzir query utilizável
// sozinho, com ou sem views — é requisito, não otimização.

import { appDb, viralData } from "../db";
import { anthropic, ANALYST_MODEL } from "../anthropic";
import { agentPrompt, toolArray, toolInput } from "../pipeline/agents";

const VALIDADE_DIAS = 7;
const DIA_MS = 86_400_000;
// O write do cache cria linha nova cujo updated_at (now() do banco) nasce alguns ms depois
// do search_queries_em (new Date() do app). Sem margem, o cache se autoinvalida e cada
// busca paga uma chamada de LLM.
const MARGEM_PREFS_MS = 60_000;

const MAX_VIDEOS = 60; // amostra do corpus lida do banco
const MAX_TITULOS = 15; // títulos que entram na semente
const MAX_CATEGORIAS = 8;

// ─── Cache ───────────────────────────────────────────────────────────────────

export interface PrefsCache {
  search_queries?: string[] | null;
  search_queries_em?: string | null;
  updated_at?: string | null;
}

export function precisaRegenerar(prefs: PrefsCache | null | undefined, agora = new Date()): boolean {
  if (!prefs?.search_queries?.length || !prefs.search_queries_em) return true;
  const em = Date.parse(prefs.search_queries_em);
  if (Number.isNaN(em)) return true;
  if (agora.getTime() - em > VALIDADE_DIAS * DIA_MS) return true;
  const prefsEm = prefs.updated_at ? Date.parse(prefs.updated_at) : NaN;
  return !Number.isNaN(prefsEm) && prefsEm > em + MARGEM_PREFS_MS;
}

// ─── Semente (pura) ──────────────────────────────────────────────────────────

export interface VideoCorpus {
  titulo: string | null;
  categorias: string[] | null;
  views: number;
}

// categorias convive em DUAS formas na mesma base, às vezes no mesmo cliente: rótulo puro
// ("NEGÓCIOS") e JSON em string ({"rank":1,"nome":"MARKETING"}). Mesma extração que o
// substring de 0013/0018 faz no SQL.
const nomeCategoria = (raw: string) => raw.match(/"nome"\s*:\s*"([^"]+)"/)?.[1] ?? raw;

// Categoria de placeholder do coletor — não é tema, é ausência de tema.
const CATEGORIA_LIXO = /^conte[úu]do indefinido$/i;

// Título de vídeo do corpus é sujo por natureza: os três mais vistos de um cliente real
// são "TODO", "not_found" e "TE DÁ". Mesmo critério do vm_cross_client_hits (0013):
// >= 15 caracteres e sem os prefixos-lixo conhecidos.
const TITULO_LIXO = /^(todo\b|teste\b|quem [eé]\b|not_found)/i;

function titulavel(t: string | null | undefined): t is string {
  const s = t?.trim();
  return !!s && s.length >= 15 && !TITULO_LIXO.test(s);
}

/**
 * Monta o texto da semente. `mediana` é a mediana de views DO CLIENTE (0 quando o corpus
 * dele não tem métrica). Devolve "" quando não há sinal nenhum — aí não há query a gerar.
 */
export function montarSemente(
  videos: VideoCorpus[],
  temas: string[],
  mediana: number,
  proibicoes: string[] = []
): string {
  const comTitulo = videos.filter((v) => titulavel(v.titulo));

  const blocos: string[] = [];

  if (mediana > 0) {
    const acima = comTitulo
      .filter((v) => v.views >= mediana)
      .sort((a, b) => b.views - a.views)
      .slice(0, MAX_TITULOS);
    if (acima.length)
      blocos.push(
        `ACIMA DA MÉDIA DELE (mediana do cliente: ${Math.round(mediana).toLocaleString("pt-BR")} views):\n` +
          acima
            .map((v) => `- "${v.titulo!.trim()}" — ${(v.views / mediana).toFixed(1)}x a média dele`)
            .join("\n")
      );
  }

  // Sem métrica (MV vazia ou desatualizada) o título ainda diz do que o cliente fala —
  // é o caso de 4 clientes ativos, e a semente não pode morrer neles.
  if (!blocos.length && comTitulo.length)
    blocos.push(
      "TÍTULOS RECENTES DO CORPUS (cliente sem métrica de views):\n" +
        comTitulo.slice(0, MAX_TITULOS).map((v) => `- "${v.titulo!.trim()}"`).join("\n")
    );

  const contagem = new Map<string, number>();
  for (const v of videos)
    for (const raw of v.categorias ?? []) {
      const nome = nomeCategoria(raw).trim();
      if (!nome || CATEGORIA_LIXO.test(nome)) continue;
      contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
    }
  const recorrentes = [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORIAS);
  if (recorrentes.length)
    blocos.push(
      "TEMAS RECORRENTES NO CORPUS DELE:\n" + recorrentes.map(([n, q]) => `- ${n} (${q} vídeos)`).join("\n")
    );

  const declarados = temas.map((t) => t.trim()).filter(Boolean);
  if (declarados.length)
    blocos.push("TEMAS DECLARADOS PELO CLIENTE:\n" + declarados.map((t) => `- ${t}`).join("\n"));

  // Proibição não é preferência: query em território proibido gasta crédito para trazer
  // vídeo que o Ideador é obrigado a descartar depois. Mesmo bloco que suggest.ts já passa
  // ao Grok e ao Ideador. Só entra se houver semente — sozinha ela não gera busca.
  const vetos = proibicoes.map((p) => p.trim()).filter(Boolean);
  if (blocos.length && vetos.length)
    blocos.push(
      "PROIBIÇÕES DO CLIENTE (INVIOLÁVEIS — nenhuma busca pode esbarrar nisso):\n" +
        vetos.map((p) => `- ${p}`).join("\n")
    );

  return blocos.join("\n\n");
}

// ─── Leitura do corpus ───────────────────────────────────────────────────────

interface Corpus {
  videos: VideoCorpus[];
  mediana: number;
}

async function lerCorpus(clientId: string): Promise<Corpus> {
  const [stats, canais] = await Promise.all([
    viralData.from("vm_video_stats").select("video_id, views_total").eq("cliente_id", clientId),
    viralData.from("canais").select("id").eq("cliente_id", clientId),
  ]);

  const views = new Map<string, number>();
  for (const r of (stats.data ?? []) as { video_id: string; views_total: number | null }[])
    views.set(r.video_id, Number(r.views_total) || 0);

  const positivas = [...views.values()].filter((v) => v > 0).sort((a, b) => a - b);
  const mediana = positivas.length ? positivas[Math.floor(positivas.length / 2)] : 0;

  const topIds = [...views.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_VIDEOS)
    .map(([id]) => id);

  const sel = "id, titulo, categorias";
  const res = topIds.length
    ? await viralData.from("videos").select(sel).in("id", topIds)
    : // vm_video_stats é materializada e só o ETL a atualiza: cliente novo (ou coleta sem
      // métrica) não aparece lá, e aí o caminho é canal → vídeos mais recentes.
      await (async () => {
        const canalIds = ((canais.data ?? []) as { id: string }[]).map((c) => c.id);
        if (!canalIds.length) return { data: [] };
        return viralData
          .from("videos")
          .select(sel)
          .in("canal_id", canalIds)
          .order("data_publicacao", { ascending: false, nullsFirst: false })
          .limit(MAX_VIDEOS);
      })();

  const videos = ((res.data ?? []) as { id: string; titulo: string | null; categorias: string[] | null }[]).map(
    (v) => ({ titulo: v.titulo, categorias: v.categorias, views: views.get(v.id) ?? 0 })
  );

  return { videos, mediana };
}

// ─── Geração ─────────────────────────────────────────────────────────────────

const QUERIES_TOOL = {
  name: "registrar_queries",
  description: "Registra as buscas em linguagem natural para caçar modelagens externas.",
  input_schema: {
    type: "object" as const,
    properties: {
      queries: {
        type: "array",
        minItems: 8,
        maxItems: 10,
        items: {
          type: "string",
          description: "Busca em linguagem natural, 2-6 palavras, como se digitada na lupa do TikTok.",
        },
      },
    },
    required: ["queries"],
  },
};

export function limparQueries(queries: string[]): string[] {
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const q of queries) {
    // A tool pode devolver hashtag mesmo proibida no prompt; a busca por keyword não
    // entende '#' e devolveria menos, não mais.
    const limpa = String(q ?? "").replace(/[#"]/g, "").trim();
    const chave = limpa.toLowerCase();
    if (limpa.length < 3 || vistas.has(chave)) continue;
    vistas.add(chave);
    out.push(limpa);
  }
  return out;
}

/**
 * Devolve as search_queries do cliente, gerando e persistindo quando o cache venceu.
 * Lista vazia = não há semente (cliente sem corpus e sem preferência) — o chamador trata
 * como "sem caça desta vez"; a caça é fail-soft por construção.
 */
export async function garantirSearchQueries(clientId: string, agora = new Date()): Promise<string[]> {
  const { data: prefs } = await appDb
    .from("vm_client_preferences")
    .select("temas_preferidos, proibicoes, search_queries, search_queries_em, updated_at")
    .eq("client_id", clientId)
    .maybeSingle();

  if (!precisaRegenerar(prefs, agora)) return prefs!.search_queries as string[];

  const [{ videos, mediana }, insights] = await Promise.all([
    lerCorpus(clientId),
    appDb
      .from("vm_viral_insights")
      .select("payload")
      .eq("scope", `client:${clientId}`)
      .eq("insight_type", "client_tema"),
  ]);

  const temas = [
    ...((prefs?.temas_preferidos as string[] | null) ?? []),
    ...((insights.data ?? []) as { payload: { tipo?: string } | null }[])
      .map((i) => i.payload?.tipo)
      .filter((t): t is string => !!t),
  ];

  const semente = montarSemente(videos, temas, mediana, (prefs?.proibicoes as string[] | null) ?? []);
  if (!semente) return [];

  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 4000, // thinking divide o teto (AGENTS.md §5)
    tools: [QUERIES_TOOL],
    tool_choice: { type: "tool", name: "registrar_queries" },
    system: [{ type: "text", text: agentPrompt("cacador-modelagens"), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: `${semente}\n\nGere as buscas para caçar modelagens.` }],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  const queries = limparQueries(
    toolUse?.type === "tool_use" ? toolArray<string>(toolInput(toolUse), "queries") : []
  );
  if (!queries.length) {
    console.error(`[modelagens] caçador não devolveu query (stop_reason=${res.stop_reason})`);
    return [];
  }

  // Upsert parcial: em linha que já existe, o PostgREST só toca as colunas do payload —
  // preferência do cliente fica intacta, e updated_at não é bumpado (senão o cache que
  // acabou de ser escrito nasceria vencido).
  // search_queries_em é do momento da ESCRITA, não do início da função: entre um e outro
  // corre a chamada do LLM (7,7s medidos), e o updated_at da linha nova nasce no fim. Usar
  // `agora` aqui abriria uma janela do tamanho da latência do modelo — chamada lenta
  // estouraria a margem de 60s e o cache nasceria vencido.
  const { error } = await appDb
    .from("vm_client_preferences")
    .upsert({ client_id: clientId, search_queries: queries, search_queries_em: new Date().toISOString() });
  if (error) console.error("[modelagens] falha ao salvar search_queries (segue com as da memória)", error);

  return queries;
}
