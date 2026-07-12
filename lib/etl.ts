import { appDb, viralData } from "./db";
import { anthropic, ANALYST_MODEL } from "./anthropic";
import { agentPrompt, toolInput, toolArray } from "./pipeline/agents";
import { platformVideoId } from "./video-url";
import { fmtNum } from "./format";
import { maturityGate } from "./etl-gate";
import { attributeLessons, computeCalibration } from "./learning-loop";

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

interface ClientStat {
  categoria: string;
  tipo: string;
  amostra: number;
  media_views: number | null;
  media_seguidores: number | null;
  recencia_dias: number | null;
  ultimo_uso: string | null;
  performance_ratio: number;
  recencia_peso: number | null;
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
    max_tokens: 4000, // thinking divide o teto — 1200 truncava o tool_use
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
  return toolArray<{ titulo: string; descricao: string }>(toolInput(toolUse), "praticas").filter(
    (x): x is { titulo: string; descricao: string } => !!x?.titulo && !!x?.descricao
  );
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
    recencia_peso: r.recencia_peso == null ? null : Number(r.recencia_peso),
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
      // performance e recência separadas do score composto (plano 012, WP-C.2)
      performance: s.performance_ratio,
      recencia: s.recencia_peso,
      performance_ratio: s.performance_ratio,
      media_views: s.media_views,
      media_seguidores: s.media_seguidores,
      amostra: s.amostra,
      recencia_dias: s.recencia_dias,
      ultimo_uso: s.ultimo_uso,
      destaque: i === destaqueIdx,
    },
  }));

  // Top 5 hooks LITERAIS do cliente por views (plano 012, WP-C.5) — melhor
  // esforço: fn ausente (PGRST202, migration 0013 não aplicada) só gera warning.
  const hooks = await viralData.rpc("vm_client_hook_examples", { p_cliente_id: cliente.id });
  if (hooks.error) {
    console.warn(`vm_client_hook_examples(${cliente.nome}): ${hooks.error.message}`);
  } else if (hooks.data?.length) {
    rows.push({
      scope: `client:${cliente.id}`,
      insight_type: "client_hook_examples",
      payload: {
        titulo: "Hooks campeões do cliente (texto literal)",
        hooks: hooks.data, // [{ hook, views, retencao_hook }]
        score: 0,
        destaque: false,
      },
    });
  }

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
  // MV vm_video_stats alimenta as fns vm_* (migration 0013) — refresh antes de tudo.
  // PGRST202 = migration não aplicada: as fns ainda usam a definição antiga, seguir com warning.
  const refresh = await viralData.rpc("vm_refresh_video_stats");
  if (refresh.error) {
    if (refresh.error.code !== "PGRST202") throw new Error(`vm_refresh_video_stats: ${refresh.error.message}`);
    console.warn("vm_refresh_video_stats ausente — aplicar migration 0013; seguindo sem refresh da MV");
  }

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
    .select("id, session_id, client_id, headline, hook, published_url, published_at, pipeline_trace")
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
  // WP-E.2: roteiros maduros viram outcomes (previsto×real + fingerprint) — fonte do aprendizado
  const outcomeRows: {
    script_id: string;
    session_id: string | null;
    client_id: string | null;
    predicted_score: number | null;
    ratio: number | null;
    verdict: string;
    fingerprint: unknown;
  }[] = [];
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
    const trace = (s?.pipeline_trace ?? {}) as {
      narrativa_escolhida?: { estrutura?: string };
      predicted_score?: number | null;
      fingerprint?: unknown;
    };
    const estrutura = trace.narrativa_escolhida?.estrutura ?? null;
    // Gate de maturidade (plano 012, WP-C.4): <14 dias de publicação = em observação,
    // score neutro e verdict "neutro" — resultado parcial nunca vira anti-padrão.
    const gate = maturityGate(ratio, s?.published_at ?? null);
    if (gate.maduro && s) {
      outcomeRows.push({
        script_id: s.id,
        session_id: s.session_id ?? null,
        client_id: clientId,
        predicted_score: typeof trace.predicted_score === "number" ? trace.predicted_score : null,
        ratio,
        verdict: gate.verdict,
        fingerprint: trace.fingerprint ?? null,
      });
    }
    rows.push({
      scope: clientId ? `client:${clientId}` : "global",
      insight_type: "client_scriptresult",
      payload: {
        titulo: `Roteiro publicado: "${s?.headline ?? s?.hook?.slice(0, 60) ?? p.crm_script_id.slice(0, 6)}"`,
        descricao: [
          `${fmtNum(p.views)} views${ratio ? ` (${ratio}x a média do cliente)` : ""}`,
          gate.em_observacao ? "em observação (<14 dias)" : null,
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
        verdict: gate.verdict, // repetir (>1.2x maduro) | evitar (<0.8x maduro) | neutro
        ...(gate.maduro ? { maduro: true } : { em_observacao: true }),
        score: gate.score, // maduro: ratio ordena (>1 padrão, <1 anti-padrão); em observação: 0
      },
    });
  }

  // ── WP-E.2/3/5: outcomes maduros → calibração do Dados + atribuição lição×outcome.
  // Melhor esforço: migration 0015 ausente só gera warning, nunca derruba o ETL.
  if (outcomeRows.length) {
    const up = await appDb.from("vm_outcomes").upsert(outcomeRows, { onConflict: "script_id" });
    if (up.error) console.warn(`vm_outcomes upsert: ${up.error.message} — aplicar migration 0015`);
  }
  const { data: outcomes, error: outErr } = await appDb
    .from("vm_outcomes")
    .select("predicted_score, ratio, fingerprint");
  if (outErr) {
    console.warn(`vm_outcomes select: ${outErr.message} — aplicar migration 0015`);
  } else {
    // WP-E.3: calibração previsto×real vira insight global — o Dados vê o próprio histórico.
    // Com n<5 o payload marca insuficiente:true e o prompt omite a nota (agents.ts).
    rows.push({
      scope: "global",
      insight_type: "calibracao_dados",
      payload: computeCalibration(
        (outcomes ?? []).map((o) => ({
          predicted: o.predicted_score == null ? null : Number(o.predicted_score),
          ratio: o.ratio == null ? null : Number(o.ratio),
        }))
      ),
    });
    // WP-E.5: lição presente em ≥2 outcomes com ratio mediano <0.8 → needs_review
    // (marca para revisão humana no /ensinar — NUNCA desativa sozinho).
    const flagged = attributeLessons(
      (outcomes ?? []).map((o) => {
        const ids = (o.fingerprint as { lesson_ids?: unknown } | null)?.lesson_ids;
        return {
          ratio: o.ratio == null ? null : Number(o.ratio),
          lessonIds: Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [],
        };
      })
    ).filter((a) => a.needs_review);
    if (flagged.length) {
      // ponytail: só liga a flag — desligar (lição reabilitada) é decisão humana no /ensinar
      const upd = await appDb
        .from("vm_lesson_learnings")
        .update({ needs_review: true })
        .in("id", flagged.map((f) => f.lessonId));
      if (upd.error) console.warn(`needs_review update: ${upd.error.message} — aplicar migration 0015`);
    }
  }

  // ── WP-E.4: vm_script_feedback deixa de ser write-only — rating médio por
  // estrutura (pipeline_trace.narrativa_escolhida) vira insight client_feedback.
  try {
    const { data: fb } = await appDb.from("vm_script_feedback").select("script_id, rating").not("rating", "is", null);
    if (fb?.length) {
      const { data: fbScripts } = await appDb
        .from("vm_generated_scripts")
        .select("id, client_id, pipeline_trace")
        .in("id", [...new Set(fb.map((f) => f.script_id))]);
      const meta = new Map(
        (fbScripts ?? []).map((sc) => {
          const t = (sc.pipeline_trace ?? {}) as { narrativa_escolhida?: { estrutura?: string } };
          return [sc.id, { client: sc.client_id as string | null, estrutura: t.narrativa_escolhida?.estrutura ?? null }];
        })
      );
      const agg = new Map<string, Map<string, number[]>>(); // cliente → estrutura → ratings
      for (const f of fb) {
        const m = meta.get(f.script_id);
        if (!m?.client || !m.estrutura || f.rating == null) continue;
        const byEstrutura = agg.get(m.client) ?? new Map<string, number[]>();
        byEstrutura.set(m.estrutura, [...(byEstrutura.get(m.estrutura) ?? []), Number(f.rating)]);
        agg.set(m.client, byEstrutura);
      }
      for (const [clienteId, byEstrutura] of agg) {
        const estruturas = [...byEstrutura.entries()]
          .map(([estrutura, ratings]) => ({
            estrutura,
            n: ratings.length,
            rating_medio: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
          }))
          .sort((a, b) => b.rating_medio - a.rating_medio);
        rows.push({
          scope: `client:${clienteId}`,
          insight_type: "client_feedback",
          payload: {
            titulo: "Avaliação humana por estrutura",
            descricao: estruturas.map((e) => `${e.estrutura}: ${e.rating_medio}/5 (${e.n})`).join(" · "),
            estruturas,
            score: 0,
          },
        });
      }
    }
  } catch (e) {
    console.error("agregação de feedback falhou, seguindo sem client_feedback", e);
  }

  // Histórico de runs (plano 012, WP-C.6): grava o array completo ANTES do replace,
  // retém os 12 mais recentes. Melhor esforço — tabela ausente não derruba o ETL.
  const runIns = await appDb.from("vm_insight_runs").insert({ rows });
  if (runIns.error) {
    console.warn(`vm_insight_runs insert: ${runIns.error.message} — aplicar migration 0014`);
  } else {
    const { data: old } = await appDb
      .from("vm_insight_runs")
      .select("id")
      .order("run_at", { ascending: false })
      .range(12, 1000); // ponytail: além do 12º mais recente = poda
    if (old?.length) await appDb.from("vm_insight_runs").delete().in("id", old.map((o) => o.id));
  }

  // Troca atômica via RPC; se a function ainda não foi aplicada no banco (PGRST202),
  // cai no caminho antigo (não-atômico) com aviso — rollout seguro.
  const rpc = await appDb.rpc("vm_replace_insights", { _rows: rows });
  if (rpc.error) {
    if (rpc.error.code !== "PGRST202") throw new Error(`vm_replace_insights: ${rpc.error.message}`);
    console.warn("vm_replace_insights ausente — aplicar migration 0009; usando caminho não-atômico");
    // Nunca deletar sem rows validados: run com 0 insights esvaziaria a tabela em silêncio.
    if (!rows.length) throw new Error("ETL produziu 0 insights — abortando replace não-atômico");
    const del = await appDb.from("vm_viral_insights").delete().neq("scope", "");
    if (del.error) throw new Error(`delete insights: ${del.error.message}`);
    const ins = await appDb.from("vm_viral_insights").insert(rows);
    if (ins.error) {
      // delete já rodou: sem os insights o pipeline degrada até o próximo run — gritar alto.
      console.error("CRÍTICO: vm_viral_insights deletada e insert falhou — tabela vazia até o próximo run bem-sucedido", ins.error);
      throw new Error(`insert insights (pós-delete!): ${ins.error.message}`);
    }
  }

  return { insights: rows.length, clientInsights, scriptsLinked: linked, scriptsSynced: synced };
}
