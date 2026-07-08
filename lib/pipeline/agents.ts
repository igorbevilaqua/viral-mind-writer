import fs from "node:fs";
import path from "node:path";
import { anthropic, ANALYST_MODEL, WRITER_MODEL } from "../anthropic";
import { grokClient, RESEARCH_MODEL } from "../grok";
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

  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 3000,
    tools: [NARRATIVAS_TOOL],
    tool_choice: { type: "tool", name: "registrar_narrativas" },
    system: [
      {
        type: "text",
        text: `${agentPrompt("storytelling")}\n\n# PLAYBOOK DE STORYTELLING\n${ctx.playbooks.storytelling ?? "(sem playbook)"}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `TEMA DO VÍDEO: ${ctx.prompt}

DOSSIÊ DE PESQUISA:
${dossie || "(pesquisa indisponível — proponha narrativas sustentáveis pelo material do usuário)"}
${dadosCliente ? `\nO QUE JÁ FUNCIONA PARA ESTE CLIENTE (dados reais, pré-rankeados por performance+recência — evidência forte ao escolher estruturas):\n${dadosCliente}\n` : ""}${ensinado ? `\nAPRENDIZADOS ENSINADOS PELO TIME (curadoria humana de virais analisados — se conflitar com heurística, isto prevalece):\n${ensinado}\n` : ""}${refs ? `\nMATERIAIS FORNECIDOS PELO USUÁRIO:\n${refs}` : ""}${
          ctx.modelagemBriefs.length
            ? `\nARQUITETURA-MODELO PEDIDA PELO USUÁRIO (as candidatas devem respeitá-la):\n${ctx.modelagemBriefs.join("\n---\n")}`
            : ""
        }

Proponha as narrativas candidatas.`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("storytelling: sem narrativas estruturadas");
  return (toolUse.input as { candidatas: NarrativaCandidata[] }).candidatas;
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
  const insights = ctx.insights.length
    ? ctx.insights.map((i) => `## ${i.insight_type} (${i.scope})\n${JSON.stringify(i.payload)}`).join("\n\n")
    : "(sem insights carregados — avalie por heurística e declare isso)";

  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 2500,
    tools: [RANKING_TOOL],
    tool_choice: { type: "tool", name: "registrar_ranking" },
    system: [
      {
        type: "text",
        text: `${agentPrompt("dados")}\n\n# INSIGHTS DE PERFORMANCE (dados reais dos +6 mil vídeos)\n${insights}`,
        cache_control: { type: "ephemeral" },
      },
    ],
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
  return toolUse.input as { ranking: RankingItem[]; orientacao_roteiro: string; orientacao_hook: string };
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
  const a = ctx.artifacts!;
  const n = a.candidatas[a.escolhida];
  const banned = ctx.bannedPhrases.map((b) => `- ${b.label ?? b.pattern}`).join("\n");

  const res = await anthropic.messages.create({
    model: WRITER_MODEL,
    max_tokens: 1500,
    tools: [HOOK_TOOL],
    tool_choice: { type: "tool", name: "registrar_hook" },
    system: [
      {
        type: "text",
        text: `${agentPrompt("hook")}\n\n# PLAYBOOK DE HOOKS\n${ctx.playbooks.hook ?? "(sem playbook)"}\n\n# GUIA DE ESTILO\n${ctx.playbooks.style_guide ?? ""}\n\n# PADRÕES PROIBIDOS\n${banned}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `NARRATIVA VENCEDORA:
${formatNarrativa(n)}

ORIENTAÇÃO DOS DADOS SOBRE HOOKS:
${a.orientacao_hook || "(sem orientação)"}
${clientInsightBlock(ctx, ["hook"]) ? `\nHOOKS QUE JÁ FUNCIONARAM PARA ESTE CLIENTE (pré-rankeados por performance+recência):\n${clientInsightBlock(ctx, ["hook"])}` : ""}${taughtBlock(ctx, ["hook"]) ? `\nAPRENDIZADOS DE HOOK ENSINADOS PELO TIME (curadoria humana — prevalecem sobre padrões do corpus em conflito):\n${taughtBlock(ctx, ["hook"])}` : ""}

CORPO DO ROTEIRO (o hook precisa emendar na primeira frase e ser pago pelo final):
${corpo}

Desenhe o hook.`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("hook: sem saída estruturada");
  return toolUse.input as { hook: string; variantes: string[]; racional: string };
}

// ── 6. Comando (CTA) ─────────────────────────────────────────────────────────
export async function writeComando(ctx: GenerationContext, corpo: string): Promise<string> {
  const p = ctx.clientPrefs;
  const res = await anthropic.messages.create({
    model: WRITER_MODEL,
    max_tokens: 300,
    system: [
      {
        type: "text",
        text: `${agentPrompt("comando")}\n\n# PLAYBOOK DE COMANDOS\n${ctx.playbooks.comando ?? "(sem playbook)"}`,
        cache_control: { type: "ephemeral" },
      },
    ],
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
  });

  const block = res.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text.trim() : "";
}
