import { appDb, viralData } from "./db";
import { anthropic, ANALYST_MODEL } from "./anthropic";
import { agentPrompt } from "./pipeline/agents";

// ETL semanal: materializa insights do corpus em vm_viral_insights
// (globais + por cliente, categorizados e pontuados) e sincroniza
// performance dos roteiros publicados (flywheel).

const CHUNK = 5; // clientes processados em paralelo (26 clientes ≈ 6 lotes, cabe no maxDuration do cron)
const TOP_PER_CAT = 5;

const CAT_TITLE: Record<string, string> = {
  tema: "Tema",
  storytelling: "Estrutura",
  hook: "Hook",
  comando: "Comando",
};

const prettyTipo = (t: string) => {
  const s = t.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));

interface ClientStat {
  categoria: string;
  tipo: string;
  amostra: number;
  media_views: number | null;
  media_seguidores: number | null;
  recencia_dias: number | null;
  ultimo_uso: string | null;
  performance_ratio: number;
  score: number;
}

interface InsightRow {
  scope: string;
  insight_type: string;
  payload: unknown;
}

function descricaoDe(s: ClientStat): string {
  const parts = [`${s.amostra} vídeos`];
  if (s.categoria === "comando") {
    // comando é eixo de conversão: descrito por seguidores, nunca por views
    if (s.media_seguidores != null)
      parts.push(`+${fmtNum(s.media_seguidores)} seguidores por vídeo (${s.performance_ratio}x a conversão média do cliente)`);
  } else if (s.media_views) {
    parts.push(`média de ${fmtNum(s.media_views)} views (${s.performance_ratio}x a média do cliente)`);
  }
  if (s.recencia_dias != null) parts.push(`último uso há ${s.recencia_dias} dias`);
  return parts.join(" · ");
}

const PRATICAS_TOOL = {
  name: "registrar_boas_praticas",
  description: "Registra as boas práticas gerais para roteiros deste cliente.",
  input_schema: {
    type: "object" as const,
    properties: {
      praticas: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            titulo: { type: "string", description: "curto, imperativo" },
            descricao: { type: "string", description: "1-2 frases, citando o dado que sustenta" },
          },
          required: ["titulo", "descricao"],
        },
      },
    },
    required: ["praticas"],
  },
};

async function generateBoasPraticas(
  cliente: { id: string; nome: string },
  stats: ClientStat[]
): Promise<{ titulo: string; descricao: string }[]> {
  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 1200,
    tools: [PRATICAS_TOOL],
    tool_choice: { type: "tool", name: "registrar_boas_praticas" },
    system: agentPrompt("dados"),
    messages: [
      {
        role: "user",
        content: `CLIENTE: ${cliente.nome}

INSIGHTS DO CLIENTE (pré-rankeados por performance + recência; score maior = padrão mais forte):
${JSON.stringify(stats, null, 1)}

Escreva de 2 a 4 BOAS PRÁTICAS GERAIS e acionáveis para quem for roteirizar os próximos vídeos deste cliente. Cada prática deve citar o dado que a sustenta. Não repita os insights individuais — sintetize o padrão por trás deles.

IMPORTANTE — dois eixos distintos: viralização (views) é impulsionada por TEMA, HOOK, ESTRUTURA DE STORYTELLING e ângulo narrativo. COMANDO é eixo de CONVERSÃO em seguidores, não driver de views (ajuda em views só quando pede compartilhamento). Nunca trate comando como fator prioritário de viralização; se recomendar comando, ancore em seguidores ganhos.`,
      },
    ],
  });
  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return [];
  // O modelo às vezes dupla-serializa o campo (praticas vem como string JSON) — normaliza os 3 formatos.
  let p: unknown = (toolUse.input as Record<string, unknown>).praticas;
  if (typeof p === "string") {
    try {
      p = JSON.parse(p);
    } catch {
      return [];
    }
  }
  if (p && !Array.isArray(p) && typeof p === "object" && Array.isArray((p as { praticas?: unknown }).praticas)) {
    p = (p as { praticas: unknown }).praticas;
  }
  if (!Array.isArray(p)) return [];
  return (p as { titulo?: string; descricao?: string }[])
    .filter((x): x is { titulo: string; descricao: string } => !!x?.titulo && !!x?.descricao);
}

// Insights categorizados e pontuados de UM cliente (estatístico via RPC + boas práticas via LLM).
async function clientInsightRows(cliente: { id: string; nome: string }): Promise<InsightRow[]> {
  const { data, error } = await viralData.rpc("vm_client_insights", { p_cliente_id: cliente.id });
  if (error) throw new Error(`vm_client_insights(${cliente.nome}): ${error.message}`);
  if (!data?.length) return [];

  const stats: ClientStat[] = data.map((r: Record<string, unknown>) => ({
    categoria: String(r.categoria),
    tipo: String(r.tipo),
    amostra: Number(r.amostra),
    media_views: r.media_views == null ? null : Number(r.media_views),
    media_seguidores: r.media_seguidores == null ? null : Number(r.media_seguidores),
    recencia_dias: r.recencia_dias == null ? null : Number(r.recencia_dias),
    ultimo_uso: (r.ultimo_uso as string) ?? null,
    performance_ratio: Number(r.performance_ratio),
    score: Number(r.score),
  }));

  // top N por categoria, e o maior score geral do cliente vira o destaque
  const byCat = new Map<string, ClientStat[]>();
  for (const s of stats) byCat.set(s.categoria, [...(byCat.get(s.categoria) ?? []), s]);
  const kept: ClientStat[] = [];
  for (const list of byCat.values()) kept.push(...list.sort((a, b) => b.score - a.score).slice(0, TOP_PER_CAT));
  kept.sort((a, b) => b.score - a.score);

  // destaque = maior score entre os fatores de VIRALIZAÇÃO (tema/hook/storytelling);
  // comando é eixo de conversão em seguidores e nunca disputa o destaque
  const destaqueIdx = kept.findIndex((s) => s.categoria !== "comando");

  const rows: InsightRow[] = kept.map((s, i) => ({
    scope: `client:${cliente.id}`,
    insight_type: `client_${s.categoria}`,
    payload: {
      tipo: s.tipo,
      titulo: `${CAT_TITLE[s.categoria] ?? s.categoria}: ${prettyTipo(s.tipo)}`,
      descricao: descricaoDe(s),
      score: s.score,
      performance_ratio: s.performance_ratio,
      media_views: s.media_views,
      media_seguidores: s.media_seguidores,
      amostra: s.amostra,
      recencia_dias: s.recencia_dias,
      ultimo_uso: s.ultimo_uso,
      destaque: i === destaqueIdx,
    },
  }));

  try {
    const praticas = await generateBoasPraticas(cliente, kept);
    rows.push(
      ...praticas.map((p, i) => ({
        scope: `client:${cliente.id}`,
        insight_type: "client_geral",
        payload: { ...p, score: 0, destaque: false, ordem: i },
      }))
    );
  } catch (e) {
    console.error(`boas práticas de ${cliente.nome} falharam, seguindo só com os estatísticos`, e);
  }
  return rows;
}

export async function runWeeklyEtl() {
  const { data: snapshot, error } = await viralData.rpc("vm_insights_snapshot");
  if (error) throw new Error(`vm_insights_snapshot: ${error.message}`);

  const rows: InsightRow[] = [];
  for (const type of ["top_views", "top_retention", "winning_elements", "pacing_stats"] as const) {
    if (snapshot[type]) rows.push({ scope: "global", insight_type: type, payload: snapshot[type] });
  }
  for (const [clienteId, tops] of Object.entries(snapshot.per_client ?? {})) {
    rows.push({ scope: `client:${clienteId}`, insight_type: "top_videos", payload: tops });
  }

  // Insights categorizados por cliente (painel + gerador), em lotes paralelos
  const { data: clientes } = await viralData.from("clientes").select("id, nome").eq("ativo", true);
  let clientInsights = 0;
  for (let i = 0; i < (clientes ?? []).length; i += CHUNK) {
    const chunk = (clientes ?? []).slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map((c) =>
        clientInsightRows(c).catch((e) => {
          console.error(`insights de ${c.nome} falharam, cliente pulado`, e);
          return [] as InsightRow[];
        })
      )
    );
    for (const r of results) {
      clientInsights += r.length;
      rows.push(...r);
    }
  }

  // ── Flywheel 1/3: casa roteiros marcados como publicados com o vídeo no corpus.
  // O vídeo pode entrar no corpus semanas depois da publicação — retenta a cada run até casar.
  const { data: pubScripts } = await appDb
    .from("vm_generated_scripts")
    .select("id, client_id, headline, hook, published_url, pipeline_trace")
    .eq("status", "published")
    .not("published_url", "is", null);

  let linked = 0;
  if (pubScripts?.length) {
    const { data: already } = await viralData
      .from("videos")
      .select("crm_script_id")
      .in("crm_script_id", pubScripts.map((s) => s.id));
    const done = new Set((already ?? []).map((v) => v.crm_script_id));
    for (const s of pubScripts.filter((x) => !done.has(x.id))) {
      const pid = platformVideoId(s.published_url!);
      if (!pid) continue;
      const { data: vid } = await viralData
        .from("videos")
        .select("id")
        .or(`link_video.ilike.%${pid}%,plataform_id.eq.${pid}`)
        .is("crm_script_id", null) // nunca sobrescreve vínculo existente
        .limit(1)
        .maybeSingle();
      if (vid) {
        const up = await viralData.from("videos").update({ crm_script_id: s.id }).eq("id", vid.id).is("crm_script_id", null);
        if (!up.error) linked++;
      }
    }
  }

  // ── Flywheel 2/3: performance real dos roteiros publicados de volta ao app.
  const { data: published, error: pubErr } = await viralData.rpc("vm_published_scripts");
  if (pubErr) throw new Error(`vm_published_scripts: ${pubErr.message}`);

  type PublishedRow = {
    crm_script_id: string;
    video_id: string;
    views: number;
    retencao_hook: number;
    retencao_final: number;
    compartilhamentos: number;
    seguidores_ganhos: number | null;
  };
  const scriptById = new Map((pubScripts ?? []).map((s) => [s.id, s]));
  let synced = 0;
  let perfRows: PublishedRow[] = [];
  if (published?.length) {
    const ids = published.map((p: PublishedRow) => p.crm_script_id);
    const { data: ours } = await appDb.from("vm_generated_scripts").select("id").in("id", ids);
    const ourIds = new Set((ours ?? []).map((o) => o.id));
    perfRows = (published as PublishedRow[]).filter((p) => ourIds.has(p.crm_script_id));
    const perf = perfRows.map((p) => ({
      script_id: p.crm_script_id,
      viral_data_video_id: p.video_id,
      views: p.views,
      retencao_hook: p.retencao_hook,
      retencao_final: p.retencao_final,
      compartilhamentos: p.compartilhamentos,
      seguidores_ganhos: p.seguidores_ganhos,
      synced_at: new Date().toISOString(),
    }));
    if (perf.length) {
      const up = await appDb.from("vm_script_performance").upsert(perf);
      if (up.error) throw new Error(`upsert performance: ${up.error.message}`);
      synced = perf.length;
    }
  }

  // ── Flywheel 3/3: resultado real dos roteiros da sala vira insight do agente Dados
  // (regenerado a cada run junto do snapshot — o wipe abaixo não é problema).
  const mediaByClient = new Map<string, number | null>();
  for (const p of perfRows) {
    const s = scriptById.get(p.crm_script_id);
    const clientId: string | null = s?.client_id ?? null;
    let ratio: number | null = null;
    if (clientId) {
      if (!mediaByClient.has(clientId)) {
        try {
          const { data: panel } = await viralData.rpc("vm_client_panel", { p_cliente_id: clientId });
          mediaByClient.set(clientId, Number(panel?.media_views_geral) || null);
        } catch {
          mediaByClient.set(clientId, null);
        }
      }
      const media = mediaByClient.get(clientId);
      if (media) ratio = Math.round((p.views / media) * 100) / 100;
    }
    const trace = (s?.pipeline_trace ?? {}) as { narrativa_escolhida?: { estrutura?: string } };
    const estrutura = trace.narrativa_escolhida?.estrutura ?? null;
    rows.push({
      scope: clientId ? `client:${clientId}` : "global",
      insight_type: "client_scriptresult",
      payload: {
        titulo: `Roteiro publicado: "${s?.headline ?? s?.hook?.slice(0, 60) ?? p.crm_script_id.slice(0, 6)}"`,
        descricao: [
          `${fmtNum(p.views)} views${ratio ? ` (${ratio}x a média do cliente)` : ""}`,
          estrutura ? `estrutura: ${estrutura}` : null,
          p.retencao_hook != null ? `retenção hook ${Math.round(p.retencao_hook)}%` : null,
          p.seguidores_ganhos ? `+${fmtNum(p.seguidores_ganhos)} seguidores` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        estrutura,
        hook: s?.hook ?? null,
        views: p.views,
        performance_ratio: ratio,
        retencao_hook: p.retencao_hook,
        retencao_final: p.retencao_final,
        seguidores_ganhos: p.seguidores_ganhos,
        score: ratio ?? 0, // ratio ordena: >1 = padrão confirmado da sala, <1 = anti-padrão
      },
    });
  }

  await appDb.from("vm_viral_insights").delete().neq("scope", ""); // snapshot completo substitui o anterior
  const ins = await appDb.from("vm_viral_insights").insert(rows);
  if (ins.error) throw new Error(`insert insights: ${ins.error.message}`);

  return { insights: rows.length, clientInsights, scriptsLinked: linked, scriptsSynced: synced };
}

// Extrai o id do vídeo na plataforma a partir da URL publicada (mesmos padrões do transcribe-link).
function platformVideoId(url: string): string | null {
  const m =
    url.match(/(?:v=|shorts\/|youtu\.be\/)([\w-]{11})/) ??
    url.match(/instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/) ??
    url.match(/tiktok\.com\/.*video\/(\d+)/);
  return m?.[1] ?? null;
}
