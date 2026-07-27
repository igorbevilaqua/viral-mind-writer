import { appDb } from "./db";
import { anthropic, ANALYST_MODEL } from "./anthropic";
import { agentPrompt, toolInput, toolArray } from "./pipeline/agents";
import { DIMENSOES, type Dimensao } from "./pipeline/teach";
import { hookMechanismOutcomes } from "./learning-loop";

// Curador mensal (plano 012, WP-E.6): lê winners/losers de vm_outcomes + lições
// já ativas e propõe até 3 lições novas — SEMPRE active:false, curadoria humana
// no /ensinar. Regra de ouro: nenhum conhecimento entra na sala sem aprovação.
// runHookPlaybookCurator (Fase 4) estende isso ao trilho vm_playbooks.version:
// propõe nova versão do playbook de hook (active:false) a partir do desempenho real
// dos mecanismos na própria sala. Promoção = decisão humana (scripts/promote-playbook.ts).

const CURADOR_TOOL = {
  name: "propor_licoes",
  description: "Propõe lições novas a partir dos resultados reais (winners/losers) da sala.",
  input_schema: {
    type: "object" as const,
    properties: {
      licoes: {
        type: "array",
        minItems: 0,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            dimensao: { type: "string", enum: ["hook", "storytelling", "tema", "ritmo", "comando", "geral"] },
            titulo: { type: "string", description: "curto, imperativo" },
            descricao: { type: "string", description: "1-3 frases com o mecanismo e o dado que sustenta" },
          },
          required: ["dimensao", "titulo", "descricao"],
        },
      },
    },
    required: ["licoes"],
  },
};

export interface CuratorResult {
  ran: boolean;
  proposed: number;
  reason?: string;
}

export async function runMonthlyCurator(): Promise<CuratorResult> {
  // Guarda de frequência = data da última lição do próprio curador (menor diff
  // que uma tabela kv). ponytail: run que propõe 0 lições não grava marcador e
  // reavalia na semana seguinte — 1 chamada barata, aceitável.
  const { data: lastLesson } = await appDb
    .from("vm_lessons")
    .select("created_at")
    .eq("source_kind", "curador")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastLesson && Date.now() - Date.parse(lastLesson.created_at) < 30 * 86_400_000) {
    return { ran: false, proposed: 0, reason: "curador já rodou há menos de 30 dias" };
  }

  const { data: outcomes, error } = await appDb
    .from("vm_outcomes")
    .select("script_id, predicted_score, ratio")
    .not("ratio", "is", null)
    .order("ratio", { ascending: false });
  if (error) return { ran: false, proposed: 0, reason: `vm_outcomes: ${error.message} — aplicar migration 0015` };
  if ((outcomes ?? []).length < 4) return { ran: false, proposed: 0, reason: "outcomes maduros insuficientes (<4)" };

  // top 5 + bottom 5 (dedupe quando a tabela é pequena e as fatias se sobrepõem)
  const picked = [...outcomes!.slice(0, 5), ...outcomes!.slice(-5)].filter(
    (o, i, arr) => arr.findIndex((x) => x.script_id === o.script_id) === i
  );
  const { data: scripts } = await appDb
    .from("vm_generated_scripts")
    .select("id, headline, hook, pipeline_trace")
    .in("id", picked.map((o) => o.script_id));
  const byId = new Map((scripts ?? []).map((s) => [s.id, s]));
  const linha = (o: { script_id: string; predicted_score: number | null; ratio: number }) => {
    const s = byId.get(o.script_id);
    const t = (s?.pipeline_trace ?? {}) as { narrativa_escolhida?: { estrutura?: string } };
    return `- ${o.ratio}x a média do cliente${o.predicted_score != null ? ` (previsto ${o.predicted_score}/100)` : ""} · estrutura: ${
      t.narrativa_escolhida?.estrutura ?? "?"
    } · headline: "${s?.headline ?? "?"}" · hook: "${(s?.hook ?? "").slice(0, 120)}"`;
  };
  const winners = picked.filter((o) => Number(o.ratio) > 1).map(linha).join("\n");
  const losers = picked.filter((o) => Number(o.ratio) <= 1).map(linha).join("\n");

  const { data: activeLearnings } = await appDb
    .from("vm_lesson_learnings")
    .select("dimensao, titulo")
    .eq("active", true)
    .limit(40);
  const jaEnsinado = (activeLearnings ?? []).map((l) => `- [${l.dimensao}] ${l.titulo}`).join("\n");

  // digest vira também o transcript da lição (trilha de auditoria no /ensinar)
  const digest = `RESULTADOS REAIS DA SALA (roteiros maduros ≥14d; ratio = views / média do cliente)

MELHORES:
${winners || "(nenhum acima da média)"}

PIORES:
${losers || "(nenhum abaixo da média)"}

LIÇÕES JÁ ATIVAS NA SALA (não repita):
${jaEnsinado || "(nenhuma)"}`;

  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 4000, // thinking divide o teto (padrão do repo)
    tools: [CURADOR_TOOL],
    tool_choice: { type: "tool", name: "propor_licoes" },
    system: agentPrompt("professor"),
    messages: [
      {
        role: "user",
        content: `${digest}\n\nCompare os MELHORES com os PIORES e proponha até 3 lições NOVAS e generalizáveis (regras replicáveis que expliquem a diferença de resultado, nunca descrições dos vídeos). Se os dados não sustentarem nenhuma lição confiável, proponha zero.`,
      },
    ],
  });
  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return { ran: true, proposed: 0, reason: "curador sem saída estruturada" };
  const licoes = toolArray<{ dimensao: Dimensao; titulo: string; descricao: string }>(toolInput(toolUse), "licoes")
    .filter((l) => l?.titulo && l?.descricao && DIMENSOES.includes(l.dimensao))
    .slice(0, 3);
  if (!licoes.length) return { ran: true, proposed: 0 };

  const { data: lesson, error: lErr } = await appDb
    .from("vm_lessons")
    .insert({
      client_id: null, // lições do curador são globais nesta rodada
      source_kind: "curador",
      source_title: `Curador mensal — ${new Date().toLocaleDateString("pt-BR")}`,
      transcript: digest,
    })
    .select("id")
    .single();
  if (lErr || !lesson) return { ran: true, proposed: 0, reason: `vm_lessons: ${lErr?.message}` };
  // active:false — toda proposta passa pela curadoria humana existente no /ensinar
  const ins = await appDb.from("vm_lesson_learnings").insert(
    licoes.map((l) => ({ ...l, origem: "curador", active: false, lesson_id: lesson.id }))
  );
  if (ins.error) return { ran: true, proposed: 0, reason: ins.error.message };
  return { ran: true, proposed: licoes.length };
}

// ── Fase 4: curador do playbook de hook ──────────────────────────────────────
const PLAYBOOK_TOOL = {
  name: "registrar_playbook",
  description: "Registra a versão revisada COMPLETA do playbook de hooks (markdown).",
  input_schema: {
    type: "object" as const,
    properties: {
      content: { type: "string", description: "o playbook inteiro revisado, em markdown, pronto para substituir o atual" },
      resumo_mudancas: { type: "string", description: "1-3 frases: o que mudou e o dado que justifica" },
    },
    required: ["content", "resumo_mudancas"],
  },
};

export interface HookCuratorResult {
  ran: boolean;
  proposed: number; // 1 = nova versão active:false criada; 0 = nada
  version?: number;
  reason?: string;
}

// Propõe (NUNCA ativa) uma nova versão do playbook de hook a partir do desempenho
// real dos mecanismos na sala. Roda no máx 1x/30 dias (guarda = created_at da última
// versão do slug hook, o que também evita propor logo após um humano versionar).
export async function runHookPlaybookCurator(): Promise<HookCuratorResult> {
  const { data: latest, error: pbErr } = await appDb
    .from("vm_playbooks")
    .select("version, content, created_at")
    .eq("slug", "hook")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pbErr) return { ran: false, proposed: 0, reason: `vm_playbooks: ${pbErr.message}` };
  if (!latest) return { ran: false, proposed: 0, reason: "sem playbook de hook base" };
  if (Date.now() - Date.parse(latest.created_at) < 30 * 86_400_000) {
    return { ran: false, proposed: 0, reason: "playbook de hook versionado há menos de 30 dias" };
  }

  // outcomes maduros + mecanismo do hook (pipeline_trace.hook_mecanismo, gravado na Fase 3)
  const { data: outcomes, error: outErr } = await appDb.from("vm_outcomes").select("script_id, ratio").not("ratio", "is", null);
  if (outErr) return { ran: false, proposed: 0, reason: `vm_outcomes: ${outErr.message}` };
  if ((outcomes ?? []).length < 6) return { ran: false, proposed: 0, reason: "outcomes maduros insuficientes (<6)" };

  const { data: scripts } = await appDb
    .from("vm_generated_scripts")
    .select("id, pipeline_trace")
    .in("id", (outcomes ?? []).map((o) => o.script_id));
  const mecById = new Map(
    (scripts ?? []).map((s) => [s.id, (s.pipeline_trace as { hook_mecanismo?: string } | null)?.hook_mecanismo ?? null])
  );
  const mecOutcomes = hookMechanismOutcomes(
    (outcomes ?? []).map((o) => ({ ratio: o.ratio == null ? null : Number(o.ratio), mecanismo: mecById.get(o.script_id) ?? null }))
  );
  const acionavel = mecOutcomes.filter((m) => m.verdict !== "neutro");
  if (!acionavel.length) {
    return { ran: true, proposed: 0, reason: "nenhum mecanismo com sinal claro (>1.2 ou <0.8) na sala ainda" };
  }

  // digest para o analista revisar o playbook
  const digest = mecOutcomes
    .map((m) => `- ${m.mecanismo}: ratio mediano ${m.ratio_mediano}x em ${m.n} roteiros → ${m.verdict}`)
    .join("\n");
  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 8000, // playbook inteiro + thinking dividem o teto
    tools: [PLAYBOOK_TOOL],
    tool_choice: { type: "tool", name: "registrar_playbook" },
    system: agentPrompt("professor"),
    messages: [
      {
        role: "user",
        content: `PLAYBOOK DE HOOKS ATUAL:\n${latest.content}\n\nDESEMPENHO REAL DOS MECANISMOS NESTA SALA (ratio = views / média do cliente; roteiros maduros ≥14d):\n${digest}\n\nProduza a versão REVISADA COMPLETA do playbook: promova os mecanismos com verdict "promover" (suba na ordem, reforce), rebaixe/mova para anti-padrão os com "derrubar", e PRESERVE o resto do conteúdo, estrutura e exemplos. Não invente números. Nada de travessão.`,
      },
    ],
  });
  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return { ran: true, proposed: 0, reason: "curador sem saída estruturada" };
  const input = toolInput(toolUse); // deepDedash: garante zero travessão no conteúdo persistido
  const content = String(input.content ?? "").trim();
  if (content.length < 500) return { ran: true, proposed: 0, reason: "playbook proposto curto demais, descartado" };

  const version = (Number(latest.version) || 0) + 1;
  // active:false SEMPRE — promoção é decisão humana (scripts/promote-playbook.ts)
  const { error: insErr } = await appDb.from("vm_playbooks").insert({ slug: "hook", version, content, active: false });
  if (insErr) return { ran: true, proposed: 0, reason: `insert playbook: ${insErr.message}` };
  return { ran: true, proposed: 1, version };
}
