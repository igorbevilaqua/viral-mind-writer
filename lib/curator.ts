import { appDb } from "./db";
import { anthropic, ANALYST_MODEL } from "./anthropic";
import { agentPrompt, toolInput, toolArray } from "./pipeline/agents";
import { DIMENSOES, type Dimensao } from "./pipeline/teach";

// Curador mensal (plano 012, WP-E.6): lê winners/losers de vm_outcomes + lições
// já ativas e propõe até 3 lições novas — SEMPRE active:false, curadoria humana
// no /ensinar. Regra de ouro: nenhum conhecimento entra na sala sem aprovação.
// Upgrade path (fora desta rodada): propor nova versão de playbook active:false
// via trilho vm_playbooks.version quando houver volume de outcomes.

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
