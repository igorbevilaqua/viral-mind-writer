import fs from "node:fs";
import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import { ANALYST_MODEL, WRITER_MODEL, recordUsage, trackedCreate } from "../anthropic";
import { grokClient, RESEARCH_MODEL } from "../grok";
import { fmtNum } from "../format";
import type { CalibrationPayload } from "../learning-loop";
import type { ClientInsightPayload, GenerationContext, NarrativaCandidata, RankingItem } from "./types";

// Os prompts dos agentes vivem em agents/*.md — fonte única consumida pelo app e pela skill /goal.
const promptCache = new Map<string, string>();
export function agentPrompt(name: string): string {
  let p = promptCache.get(name);
  if (!p) {
    p = fs.readFileSync(path.join(process.cwd(), "agents", `${name}.md`), "utf8");
    promptCache.set(name, p);
  }
  return p;
}

// Insights do cliente (materializados pelo ETL, insight_type client_<categoria>),
// já pontuados por performance+recência — cada agente recebe só a(s) sua(s) categoria(s).
export function clientInsightBlock(ctx: GenerationContext, categorias: string[], n = 5): string {
  const rows = ctx.insights
    .filter((i) => categorias.some((c) => i.insight_type === `client_${c}`))
    .map((i) => i.payload as ClientInsightPayload)
    .filter((p) => p?.titulo)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, n);
  if (!rows.length) return "";
  return rows.map((r) => `- ${r.titulo} — ${r.descricao}${r.destaque ? " [INSIGHT MAIS FORTE DO CLIENTE]" : ""}`).join("\n");
}

// Aprendizados ensinados pelo usuário (menu Ensinar, curadoria humana):
// roteados por dimensão, máx 3 por prompt de especialista.
export function taughtBlock(ctx: GenerationContext, dimensoes: string[], n = 3): string {
  const rows = ctx.insights
    .filter((i) => dimensoes.some((d) => i.insight_type === `taught_${d}`))
    .slice(0, n)
    .map((i) => i.payload as { titulo: string; descricao: string });
  if (!rows.length) return "";
  return rows.map((r) => `- ${r.titulo} — ${r.descricao}`).join("\n");
}

// Payload de client_scriptresult (flywheel do ETL). verdict/em_observacao/maduro chegam
// com o WP-C em paralelo — tratados como opcionais aqui.
interface ScriptResultPayload {
  titulo?: string;
  descricao?: string;
  estrutura?: string | null;
  hook?: string | null;
  views?: number;
  performance_ratio?: number | null;
  retencao_hook?: number | null;
  score?: number;
  verdict?: string;
  em_observacao?: boolean;
  maduro?: boolean;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function scriptResults(ctx: GenerationContext): ScriptResultPayload[] {
  return ctx.insights
    .filter((i) => i.insight_type === "client_scriptresult")
    .map((i) => i.payload as ScriptResultPayload)
    .filter((p) => p && typeof p === "object")
    .sort((a, b) => num(b.score) - num(a.score));
}

function scriptResultLine(p: ScriptResultPayload): string {
  const flags = [p.em_observacao ? "em observação <14d — não trate como padrão" : null].filter(Boolean);
  const prefix = p.verdict === "evitar" ? "- EVITE: " : "- ";
  return `${prefix}${p.titulo ?? "roteiro publicado"} — ${p.descricao ?? ""}${flags.length ? ` [${flags.join("; ")}]` : ""}`;
}

// Linha curta e segura pra payloads de shape desconhecido (snapshot global do corpus).
function shortLine(v: unknown, max = 160): string {
  const s = typeof v === "string" ? v : JSON.stringify(v) ?? "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

// Insights formatados pro agente Dados — substitui o JSON dump. Blocos por categoria,
// ordenados por score desc, orçamento global de ~30 linhas de bullet; globais truncados.
export function formatInsightsForDados(
  insights: { insight_type: string; scope: string; payload: unknown }[],
  maxLines = 30
): string {
  if (!insights.length) return "(sem insights carregados — avalie por heurística e declare isso)";
  const parts: string[] = [];
  let budget = maxLines;
  // ponytail: orçamento único consumido na ordem das seções — scriptresults primeiro
  // (evidência mais forte), globais por último podem ser espremidos; por-seção se doer.
  const take = (lines: string[]) => {
    const kept = lines.slice(0, Math.max(budget, 0));
    budget -= kept.length;
    return kept;
  };

  // WP-E.3: calibração previsto×real do próprio Dados — o avaliador vê seu histórico.
  // Nota curta no topo, fora do orçamento de linhas; amostra insuficiente → omitida.
  const cal = insights.find((i) => i.insight_type === "calibracao_dados")?.payload as
    | CalibrationPayload
    | undefined;
  if (cal?.resumo && !cal.insuficiente) {
    parts.push(`## SUA CALIBRAÇÃO HISTÓRICA (previsto×real dos seus rankings anteriores)\n${cal.resumo}`);
  }

  const results = insights
    .filter((i) => i.insight_type === "client_scriptresult")
    .map((i) => i.payload as ScriptResultPayload)
    .filter((p) => p && typeof p === "object")
    .sort((a, b) => num(b.score) - num(a.score));
  if (results.length) {
    const lines = take(results.slice(0, 8).map(scriptResultLine));
    if (lines.length)
      parts.push(`## RESULTADOS REAIS DESTA SALA (roteiros publicados: repita >1.2x, evite <0.8x maduro)\n${lines.join("\n")}`);
  }

  const grouped = new Map<string, ClientInsightPayload[]>();
  const globals: { type: string; payload: unknown }[] = [];
  for (const i of insights) {
    if (i.insight_type === "client_scriptresult" || i.insight_type === "client_hook_examples") continue;
    if (i.insight_type === "calibracao_dados") continue; // já injetado como nota no topo
    const p = i.payload as ClientInsightPayload;
    if ((i.insight_type.startsWith("client_") || i.insight_type.startsWith("taught_")) && p?.titulo) {
      grouped.set(i.insight_type, [...(grouped.get(i.insight_type) ?? []), p]);
    } else {
      globals.push({ type: i.insight_type, payload: i.payload });
    }
  }
  for (const [type, rows] of grouped) {
    const perf = (r: ClientInsightPayload) => {
      const bits = [
        r.performance_ratio != null ? `perf ${r.performance_ratio}x` : null,
        r.amostra ? `amostra ${r.amostra}` : null,
      ].filter(Boolean);
      return bits.length ? ` [${bits.join(", ")}]` : "";
    };
    const lines = take(
      [...rows].sort((a, b) => num(b.score) - num(a.score)).map((r) => `- ${r.titulo} — ${r.descricao}${perf(r)}`)
    );
    if (lines.length) parts.push(`## ${type}\n${lines.join("\n")}`);
  }
  for (const g of globals) {
    const arr = Array.isArray(g.payload) ? g.payload : [g.payload];
    const lines = take(arr.slice(0, 6).map((v) => `- ${shortLine(v)}`)); // top 5-8 itens por lista
    if (lines.length) parts.push(`## ${g.type} (top ${lines.length} de ${arr.length})\n${lines.join("\n")}`);
  }
  return parts.join("\n\n") || "(sem insights carregados — avalie por heurística e declare isso)";
}

// Roteia client_scriptresult por dimensão: estrutura → storytelling/narrativas; hook → agente de hook.
// verdict:"evitar" vira linha "EVITE:" explícita (anti-padrão maduro do WP-C).
export function scriptResultBlock(ctx: GenerationContext, dim: "estrutura" | "hook", n = 6): string {
  const rows = scriptResults(ctx).filter((p) => p[dim]);
  if (!rows.length) return "";
  const line = (p: ScriptResultPayload) => {
    const bits = [
      p.views ? `${fmtNum(p.views)} views` : null,
      p.performance_ratio != null ? `${p.performance_ratio}x a média do cliente` : null,
      dim === "hook" && p.retencao_hook != null ? `retenção hook ${Math.round(Number(p.retencao_hook))}%` : null,
      p.em_observacao ? "em observação <14d" : null,
    ].filter(Boolean);
    const label = dim === "hook" ? `"${p.hook}"` : String(p.estrutura);
    return p.verdict === "evitar" ? `- EVITE: ${label} — ${bits.join(", ")}` : `- ${label} — ${bits.join(", ")}`;
  };
  const wins = rows.filter((p) => p.verdict !== "evitar").slice(0, n);
  const avoid = rows.filter((p) => p.verdict === "evitar").slice(0, n);
  return [...wins, ...avoid].map(line).join("\n");
}

// Hooks literais campeões do cliente (client_hook_examples, WP-C) — payload flexível:
// array de itens, {hooks:[...]} ou item único; campos hook/texto/frase + views + retencao_hook.
export function hookExamplesBlock(ctx: GenerationContext, n = 5): string {
  type HookItem = { hook?: string; texto?: string; frase?: string; views?: number; retencao_hook?: number | null };
  const items: HookItem[] = [];
  for (const i of ctx.insights) {
    if (i.insight_type !== "client_hook_examples") continue;
    const p = i.payload as HookItem & { hooks?: HookItem[] };
    if (Array.isArray(p)) items.push(...(p as HookItem[]));
    else if (Array.isArray(p?.hooks)) items.push(...p.hooks);
    else if (p) items.push(p);
  }
  return items
    .map((h) => ({ texto: h.hook ?? h.texto ?? h.frase, views: num(h.views), ret: h.retencao_hook }))
    .filter((h) => h.texto)
    .sort((a, b) => b.views - a.views)
    .slice(0, n)
    .map(
      (h) =>
        `- "${h.texto}"${h.views ? ` — ${fmtNum(h.views)} views` : ""}${h.ret != null ? `, retenção hook ${Math.round(Number(h.ret))}%` : ""}`
    )
    .join("\n");
}

// Claude às vezes serializa o input da tool — ou um campo array dele — como string JSON
// (double-encode). Sem isso, `input.campo.map(...)` estoura "reading 'map' of undefined".
// Mesmo problema já tratado no ideador (suggest.ts).
export function toolInput(block: { input: unknown }): Record<string, unknown> {
  let v: unknown = block.input;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      v = {};
    }
  }
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export function toolArray<T>(input: Record<string, unknown>, key: string): T[] {
  let v: unknown = input[key];
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      v = [];
    }
  }
  if (v && !Array.isArray(v) && typeof v === "object" && Array.isArray((v as Record<string, unknown>)[key])) {
    v = (v as Record<string, unknown>)[key];
  }
  return Array.isArray(v) ? (v as T[]) : [];
}

export function formatNarrativa(n: NarrativaCandidata): string {
  return `TÍTULO: ${n.titulo}
ESTRUTURA: ${n.estrutura}
PERSONAGEM: ${n.personagem}
CONFLITO: ${n.conflito}
MECANISMO EMOCIONAL: ${n.mecanismo_emocional}
BEATS:
${n.beats.map((b, i) => `${i + 1}. ${b}`).join("\n")}
GANCHO POTENCIAL: ${n.gancho_potencial}`;
}

// ── 1. Pesquisador (Grok + busca em tempo real) ─────────────────────────────
export async function research(ctx: GenerationContext): Promise<string> {
  // Notícias anexadas: o pesquisador abre os links e incorpora os fatos ao dossiê,
  // guiado pelos comentários do usuário sobre cada uma.
  const noticias = ctx.attachments.filter((a) => a.kind === "news_link" && a.url);
  const t0 = Date.now();
  try {
    const res = await grokClient().responses.create({
      model: RESEARCH_MODEL,
      instructions: agentPrompt("pesquisador"),
      input: `TEMA DO VÍDEO: ${ctx.prompt}${
        ctx.clientPrefs
          ? `\nCLIENTE: ${ctx.clientPrefs.nome}${ctx.clientPrefs.temas_preferidos.length ? ` (nicho: ${ctx.clientPrefs.temas_preferidos.join(", ")})` : ""}`
          : ""
      }${
        noticias.length
          ? `\n\nNOTÍCIAS INDICADAS PELO USUÁRIO — abra/pesquise cada link e incorpore os fatos ao dossiê (com fonte e data). Os comentários do usuário indicam o ângulo desejado:\n${noticias
              .map((n) => `- ${n.url}${n.raw_content?.trim() ? `\n  comentários do usuário: ${n.raw_content.trim().slice(0, 500)}` : ""}`)
              .join("\n")}`
          : ""
      }\n\nMonte o dossiê.`,
      tools: [{ type: "web_search" }] as never,
    });
    return res.output_text ?? "";
  } catch (e) {
    // pesquisa nunca derruba a geração — a sala segue com o que o usuário forneceu
    console.error("pesquisa grok falhou, seguindo sem dossiê", e);
    return "";
  } finally {
    // Grok: só duração (usage não é compatível com o formato Anthropic)
    recordUsage(ctx.usageLog, "pesquisa", RESEARCH_MODEL, Date.now() - t0);
  }
}

// ── 3. Storytelling (propõe narrativas candidatas) ──────────────────────────
const NARRATIVAS_TOOL = {
  name: "registrar_narrativas",
  description: "Registra as narrativas candidatas propostas para o tema.",
  input_schema: {
    type: "object" as const,
    properties: {
      candidatas: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            estrutura: { type: "string", description: "código + nome no playbook, ex: 'A1. Jornada do Herói'" },
            personagem: { type: "string" },
            conflito: { type: "string" },
            mecanismo_emocional: { type: "string" },
            beats: { type: "array", minItems: 5, maxItems: 7, items: { type: "string" } },
            gancho_potencial: { type: "string" },
            porque_funciona: { type: "string" },
          },
          required: [
            "titulo",
            "estrutura",
            "personagem",
            "conflito",
            "mecanismo_emocional",
            "beats",
            "gancho_potencial",
            "porque_funciona",
          ],
        },
      },
    },
    required: ["candidatas"],
  },
};

export async function proposeNarratives(ctx: GenerationContext, dossie: string): Promise<NarrativaCandidata[]> {
  const refs = ctx.attachments
    .filter((a) => !a.is_modelagem && a.raw_content)
    .map((a) => a.raw_content!.slice(0, 3000))
    .join("\n\n---\n\n");
  const dadosCliente = clientInsightBlock(ctx, ["storytelling", "tema"], 8);
  const ensinado = taughtBlock(ctx, ["storytelling", "tema"]);
  const resultadosSala = scriptResultBlock(ctx, "estrutura");

  const messages = [
    {
      role: "user" as const,
      content: `TEMA DO VÍDEO: ${ctx.prompt}

DOSSIÊ DE PESQUISA:
${dossie || "(pesquisa indisponível — proponha narrativas sustentáveis pelo material do usuário)"}
${resultadosSala ? `\nRESULTADOS REAIS DESTA SALA (estruturas de roteiros já publicados para este cliente — repita o que performou, evite o marcado como EVITE):\n${resultadosSala}\n` : ""}${dadosCliente ? `\nO QUE JÁ FUNCIONA PARA ESTE CLIENTE (dados reais, pré-rankeados por performance+recência — evidência forte ao escolher estruturas):\n${dadosCliente}\n` : ""}${ensinado ? `\nAPRENDIZADOS ENSINADOS PELO TIME (curadoria humana de virais analisados — se conflitar com heurística, isto prevalece):\n${ensinado}\n` : ""}${refs ? `\nMATERIAIS FORNECIDOS PELO USUÁRIO:\n${refs}` : ""}${
        ctx.modelagemBriefs.length
          ? `\nARQUITETURA-MODELO PEDIDA PELO USUÁRIO (as candidatas devem respeitá-la — use a ESTRUTURA-BASE indicada no brief como estrutura das candidatas, salvo incompatibilidade justificada):\n${ctx.modelagemBriefs.join("\n---\n")}`
          : ""
      }

Proponha as narrativas candidatas.`,
    },
  ];
  // 2-3 narrativas × (7 campos + beats 5-7) é muito JSON; e o sonnet-5 usa thinking adaptativo,
  // que divide o mesmo teto de max_tokens. Se truncar (stop_reason max_tokens), o tool_use vem
  // parcial → parse falha → candidatas vazias. Tenta com folga e, se truncou mesmo assim, dobra.
  // Sem cache_control: prefixo one-shot — o playbook (~15k tokens) pagaria +25% de escrita
  // em toda geração pra economizar só no retry raro de truncamento. Regeneração não re-roda
  // storytelling (artifacts cacheados em vm_sessions).
  const call = (maxTokens: number) =>
    trackedCreate(ctx.usageLog, "narrativas", {
      model: ANALYST_MODEL,
      max_tokens: maxTokens,
      tools: [NARRATIVAS_TOOL],
      tool_choice: { type: "tool", name: "registrar_narrativas" },
      system: `${agentPrompt("storytelling")}\n\n# PLAYBOOK DE STORYTELLING\n${ctx.playbooks.storytelling ?? "(sem playbook)"}`,
      messages,
    });

  let { candidatas, debug } = extractNarrativas(await call(16000));
  if (!candidatas.length && debug.stop_reason === "max_tokens") {
    ({ candidatas, debug } = extractNarrativas(await call(32000)));
  }
  if (!candidatas.length) {
    console.error("storytelling vazio", debug);
    // anexa o diagnóstico ao erro → o pipeline persiste em vm_sessions.debug (ver index.ts)
    throw Object.assign(new Error("storytelling: nenhuma narrativa válida"), { debug });
  }
  return candidatas;
}

// Extrai as candidatas do tool_use + um diagnóstico do que veio (pra debug de print de bug).
function extractNarrativas(res: Anthropic.Message): {
  candidatas: NarrativaCandidata[];
  debug: Record<string, unknown>;
} {
  const toolUse = res.content.find((b) => b.type === "tool_use");
  const raw = toolUse && toolUse.type === "tool_use" ? toolUse.input : undefined;
  const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw ?? "");
  const debug = {
    step: "storytelling",
    stop_reason: res.stop_reason,
    output_tokens: res.usage?.output_tokens,
    input_type: typeof raw,
    input_len: rawStr.length,
    input_snippet: rawStr.slice(0, 800),
  };
  if (!toolUse || toolUse.type !== "tool_use") return { candidatas: [], debug: { ...debug, note: "sem tool_use" } };
  return { candidatas: toolArray<NarrativaCandidata>(toolInput(toolUse), "candidatas"), debug };
}

// ── 2. Dados (rankeia narrativas + orienta roteiro e hook) ──────────────────
const RANKING_TOOL = {
  name: "registrar_ranking",
  description: "Registra o ranking das narrativas e as orientações baseadas em dados.",
  input_schema: {
    type: "object" as const,
    properties: {
      ranking: {
        type: "array",
        items: {
          type: "object",
          properties: {
            indice: { type: "number", description: "índice da candidata na lista recebida (0-based)" },
            score: { type: "number", description: "potencial viral 0-100" },
            justificativa: { type: "string" },
            evidencia: {
              type: "array",
              maxItems: 3,
              items: { type: "string" },
              description:
                "até 3 dados concretos e curtos que pesaram no score, citando números dos insights (ex: 'estrutura A1: 12 usos, mediana 210k views (1.8x)', 'hook curiosidade: retenção 68% vs mediana 61%'). Omita se o score for heurístico.",
            },
          },
          required: ["indice", "score", "justificativa"],
        },
      },
      orientacao_roteiro: { type: "string", description: "3-5 diretrizes concretas para o roteirista" },
      orientacao_hook: { type: "string", description: "o que os dados dizem sobre hooks neste tema/cliente" },
    },
    required: ["ranking", "orientacao_roteiro", "orientacao_hook"],
  },
};

export async function rankNarratives(
  ctx: GenerationContext,
  dossie: string,
  candidatas: NarrativaCandidata[]
): Promise<{ ranking: RankingItem[]; orientacao_roteiro: string; orientacao_hook: string }> {
  // Blocos formatados no lugar do JSON dump (payloads inteiros custavam milhares de tokens).
  const insights = formatInsightsForDados(ctx.insights);

  // Sem cache_control: one-shot por geração (regenerar reusa artifacts, não re-roda o Dados).
  const res = await trackedCreate(ctx.usageLog, "ranking", {
    model: ANALYST_MODEL,
    // mesmo risco de truncamento do storytelling: ranking de N candidatas + 2 orientações
    // longas, dividindo o teto com o thinking adaptativo do sonnet-5. 2500 → 6000.
    max_tokens: 6000,
    tools: [RANKING_TOOL],
    tool_choice: { type: "tool", name: "registrar_ranking" },
    system: `${agentPrompt("dados")}\n\n# INSIGHTS DE PERFORMANCE (dados reais dos +6 mil vídeos)\n${insights}`,
    messages: [
      {
        role: "user",
        content: `TEMA: ${ctx.prompt}${ctx.clientPrefs ? `\nCLIENTE: ${ctx.clientPrefs.nome}` : ""}

NARRATIVAS CANDIDATAS:
${candidatas.map((n, i) => `[${i}]\n${formatNarrativa(n)}\nPor que funciona (storytelling): ${n.porque_funciona}`).join("\n\n")}

RESUMO DO DOSSIÊ:
${dossie.slice(0, 2000) || "(sem dossiê)"}

Rankeie as candidatas e produza as orientações.`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("dados: sem ranking estruturado");
  const input = toolInput(toolUse);
  return {
    // evidencia normalizada: só array de strings vai pra UI (o modelo pode omitir ou devolver lixo)
    ranking: toolArray<RankingItem>(input, "ranking").map((r) => ({
      ...r,
      evidencia: Array.isArray(r.evidencia) ? r.evidencia.filter((e) => typeof e === "string").slice(0, 3) : undefined,
    })),
    orientacao_roteiro: String(input.orientacao_roteiro ?? ""),
    orientacao_hook: String(input.orientacao_hook ?? ""),
  };
}

// ── 5. Hook (projetado sobre o roteiro pronto + narrativa + dados) ──────────
const HOOK_TOOL = {
  name: "registrar_hook",
  description: "Registra o hook principal, as variações e o racional.",
  input_schema: {
    type: "object" as const,
    properties: {
      hook: { type: "string" },
      variantes: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
      racional: { type: "string" },
    },
    required: ["hook", "variantes", "racional"],
  },
};

export async function designHook(
  ctx: GenerationContext,
  corpo: string
): Promise<{ hook: string; variantes: string[]; racional: string }> {
  // Modo adaptação não tem narrativa vencedora: a arquitetura vem dos briefs de modelagem.
  const a = ctx.artifacts;
  const n = a ? a.candidatas[a.escolhida] : null;
  const narrativaBloco = n ? formatNarrativa(n) : ctx.modelagemBriefs.join("\n\n---\n\n");
  const orientacaoHook = a?.orientacao_hook || "(sem orientação)";
  const banned = ctx.bannedPhrases.map((b) => `- ${b.label ?? b.pattern}`).join("\n");
  const hookCampeoes = hookExamplesBlock(ctx);
  const resultadosHook = scriptResultBlock(ctx, "hook");

  const res = await trackedCreate(
    ctx.usageLog,
    "hook",
    {
      model: WRITER_MODEL,
      // fable-5 tem thinking sempre ligado, dividindo o teto de max_tokens com o tool_use.
      // 1500 truncava o hook+variantes; 4000 dá folga (ver mesmo problema no ideador/storytelling).
      max_tokens: 4000,
      tools: [HOOK_TOOL],
      tool_choice: { type: "tool", name: "registrar_hook" },
      // block 1 estático + cache: as tools entram no prefixo antes do system, então o hook não
      // compartilha cache com os outros agentes — mas "gerar nova versão" re-roda o hook com o
      // mesmo prefixo e reusa. Persona no block 2, fora do trecho cacheado que muda menos.
      system: [
        {
          type: "text",
          text: `# PLAYBOOK DE HOOKS\n${ctx.playbooks.hook ?? "(sem playbook)"}\n\n# GUIA DE ESTILO\n${ctx.playbooks.style_guide ?? ""}\n\n# PADRÕES PROIBIDOS\n${banned}`,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: agentPrompt("hook") },
      ],
      messages: [
        {
          role: "user",
          content: `NARRATIVA VENCEDORA:
${narrativaBloco}

ORIENTAÇÃO DOS DADOS SOBRE HOOKS:
${orientacaoHook}
${hookCampeoes ? `\nHOOKS CAMPEÕES DESTE CLIENTE (literais — a primeira frase real dos vídeos de mais views; use como referência de registro, nunca copie):\n${hookCampeoes}` : ""}${resultadosHook ? `\nHOOKS DE ROTEIROS DESTA SALA JÁ PUBLICADOS (resultado real — evite o marcado como EVITE):\n${resultadosHook}` : ""}${clientInsightBlock(ctx, ["hook"]) ? `\nHOOKS QUE JÁ FUNCIONARAM PARA ESTE CLIENTE (pré-rankeados por performance+recência):\n${clientInsightBlock(ctx, ["hook"])}` : ""}${taughtBlock(ctx, ["hook"]) ? `\nAPRENDIZADOS DE HOOK ENSINADOS PELO TIME (curadoria humana — prevalecem sobre padrões do corpus em conflito):\n${taughtBlock(ctx, ["hook"])}` : ""}

CORPO DO ROTEIRO (o hook precisa emendar na primeira frase e ser pago pelo final):
${corpo}

Desenhe o hook.`,
        },
      ],
    },
    // hook escolhe entre padrões já dados no contexto — medium basta, high só encarecia
    "medium"
  );

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("hook: sem saída estruturada");
  const input = toolInput(toolUse);
  return {
    hook: String(input.hook ?? ""),
    variantes: toolArray<string>(input, "variantes"),
    racional: String(input.racional ?? ""),
  };
}

// ── 6. Comando (CTA) ─────────────────────────────────────────────────────────
export async function writeComando(ctx: GenerationContext, corpo: string): Promise<string> {
  const p = ctx.clientPrefs;
  // CTA é fórmula curta sobre padrões dados no contexto: ANALYST_MODEL + effort low bastam
  // (era WRITER_MODEL/fable, ~3x o preço, pra 2-3 frases). Sem cache_control: prompt pequeno
  // (provavelmente abaixo do mínimo cacheável) e agora no modelo barato — write premium não paga.
  const res = await trackedCreate(
    ctx.usageLog,
    "comando",
    {
      model: ANALYST_MODEL,
      // thinking adaptativo divide o mesmo teto; 2000 garante o texto do CTA além do raciocínio.
      max_tokens: 2000,
      system: `${agentPrompt("comando")}\n\n# PLAYBOOK DE COMANDOS\n${ctx.playbooks.comando ?? "(sem playbook)"}`,
      messages: [
      {
        role: "user",
        content: `${p ? `CLIENTE: ${p.nome}${p.tom_de_voz ? ` | Tom: ${p.tom_de_voz}` : ""}${p.notas_entrevista ? `\nNotas: ${p.notas_entrevista.slice(0, 800)}` : ""}\n\n` : ""}${
          clientInsightBlock(ctx, ["comando"])
            ? `COMANDOS QUE JÁ CONVERTERAM PARA ESTE CLIENTE (pré-rankeados por seguidores ganhos):\n${clientInsightBlock(ctx, ["comando"])}\n\n`
            : ""
        }${
          taughtBlock(ctx, ["comando"])
            ? `APRENDIZADOS DE COMANDO ENSINADOS PELO TIME (curadoria humana — prevalecem sobre padrões do corpus em conflito):\n${taughtBlock(ctx, ["comando"])}\n\n`
            : ""
        }FINAL DO ROTEIRO (o comando vem logo depois):
${corpo.slice(-1200)}

Escreva o comando.`,
        },
      ],
    },
    "low"
  );

  const block = res.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text.trim() : "";
}
