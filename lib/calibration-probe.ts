// Fatia 2: aprofundamento adaptativo. A partir de um hook VENCEDOR, gera uma variante
// que inverte UM eixo (comprimento / personagem / especificidade) → novo par de
// calibração mais fino. Batch/assíncrono (nunca por voto) para não pagar latência.
import { appDb } from "./db";
import { anthropic, WRITER_MODEL } from "./anthropic";
import { toolInput } from "./pipeline/agents";
import { dedash } from "./pipeline/slop-lint";
import { HOOK_MECHANISMS } from "./pipeline/hook-mechanisms";
import type { CalibAxis } from "./calibration";

// Cold-start same-theme: reescreve um hook REAL mantendo EXATAMENTE o tema/fato/personagem
// mas trocando o MECANISMO de curiosidade. Assim o par compara mecanismo, não assunto
// (dois hooks reais nunca são do mesmo tema; um hook por vídeo). Retorna a variante + o
// mecanismo dela, ou null.
export async function generateMechanismAlternative(
  hook: string,
  mecanismoOriginal: string
): Promise<{ variante: string; mecanismo: string } | null> {
  const outros = HOOK_MECHANISMS.filter((m) => m !== mecanismoOriginal && m !== "Outro");
  const res = await anthropic.messages.create({
    model: WRITER_MODEL,
    max_tokens: 1500,
    tools: [
      {
        name: "registrar_alternativa",
        description: "Registra a variante do hook com mecanismo diferente e o nome do mecanismo usado.",
        input_schema: {
          type: "object" as const,
          properties: {
            mecanismo: { type: "string", enum: outros as unknown as string[], description: "o mecanismo de curiosidade da variante (diferente do original)" },
            variante: { type: "string", description: "o hook reescrito, MESMO tema/fato/personagem, mecanismo diferente" },
          },
          required: ["mecanismo", "variante"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "registrar_alternativa" },
    system: "Você é especialista em hooks virais. Reescreva o hook mantendo EXATAMENTE o mesmo tema, fato central e personagem, mudando só o MECANISMO de curiosidade (outro gatilho). Falado, natural. Nada de travessão.",
    messages: [{ role: "user", content: `HOOK ORIGINAL (mecanismo: ${mecanismoOriginal}):\n${hook}\n\nReescreva com um mecanismo diferente, o mesmo assunto.` }],
  });
  const tu = res.content.find((b) => b.type === "tool_use");
  if (!tu || tu.type !== "tool_use") return null;
  const input = toolInput(tu);
  const variante = dedash(String(input.variante ?? "").trim());
  const mecanismo = String(input.mecanismo ?? "");
  if (!variante || !mecanismo || mecanismo === mecanismoOriginal) return null;
  return { variante, mecanismo };
}

const PROBE_AXES: CalibAxis[] = ["comprimento", "personagem", "especificidade"];

const INSTRUCAO: Record<string, string> = {
  comprimento: "Gere uma versão com COMPRIMENTO oposto: se o original é longo, faça bem curto (uma frase); se é curto, expanda mantendo a força.",
  personagem: "INVERTA a presença de personagem: se o original cita uma pessoa/personalidade, reescreva SEM citar ninguém; se não cita, reescreva centrando numa figura.",
  especificidade: "INVERTA a especificidade: se tem número/detalhe concreto, deixe vago; se é vago, adicione um número/detalhe específico.",
};
const VALORES: Record<string, [string, string]> = {
  comprimento: ["curto", "longo"],
  personagem: ["cita", "nao"],
  especificidade: ["especifico", "vago"],
};

function probeTool(axis: CalibAxis) {
  const [v1, v2] = VALORES[axis];
  return {
    name: "registrar_variante",
    description: `Gera uma variante do hook invertendo o eixo ${axis} e rotula ambos.`,
    input_schema: {
      type: "object" as const,
      properties: {
        atributo_original: { type: "string", enum: [v1, v2], description: `valor de ${axis} do hook ORIGINAL` },
        variante: { type: "string", description: "o hook variante (mesmo tema e mecanismo, só o eixo mudou)" },
        atributo_variante: { type: "string", enum: [v1, v2], description: `valor de ${axis} da VARIANTE (oposto do original)` },
      },
      required: ["atributo_original", "variante", "atributo_variante"],
    },
  };
}

async function generateProbe(hook: string, axis: CalibAxis): Promise<{
  option_a: { texto: string; atributos: Record<string, string> };
  option_b: { texto: string; atributos: Record<string, string> };
} | null> {
  const tool = probeTool(axis);
  const res = await anthropic.messages.create({
    model: WRITER_MODEL,
    max_tokens: 2000,
    tools: [tool],
    tool_choice: { type: "tool", name: "registrar_variante" },
    system: "Você é especialista em hooks virais. Mantenha tema e mecanismo; mude só o eixo pedido. Nada de travessão.",
    messages: [{ role: "user", content: `HOOK ORIGINAL:\n${hook}\n\n${INSTRUCAO[axis]}` }],
  });
  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return null;
  const input = toolInput(toolUse);
  const variante = dedash(String(input.variante ?? "").trim());
  const ao = String(input.atributo_original ?? "");
  const av = String(input.atributo_variante ?? "");
  if (!variante || !ao || !av || ao === av) return null;
  return {
    option_a: { texto: hook, atributos: { [axis]: ao } },
    option_b: { texto: variante, atributos: { [axis]: av } },
  };
}

// Pega os hooks vencedores recentes e enfileira 1 probe por hook, alternando o eixo.
// Best-effort e limitado (custo controlado). Retorna quantos probes criou.
export async function runProbeTopup(max = 4): Promise<number> {
  // vencedores recentes: votos a|b → texto da opção vencedora + cliente do par
  const { data: votes } = await appDb
    .from("vm_calibration_votes")
    .select("winner, created_at, vm_calibration_pairs!inner(option_a, option_b, client_id, dimension)")
    .in("winner", ["a", "b"])
    .order("created_at", { ascending: false })
    .limit(50);
  const vistos = new Set<string>();
  const winners: { hook: string; clientId: string | null }[] = [];
  for (const v of votes ?? []) {
    const p = (Array.isArray(v.vm_calibration_pairs) ? v.vm_calibration_pairs[0] : v.vm_calibration_pairs) as
      | { option_a: { texto?: string }; option_b: { texto?: string }; client_id: string | null; dimension: string }
      | undefined;
    if (!p || p.dimension !== "hook") continue;
    const hook = String((v.winner === "a" ? p.option_a : p.option_b)?.texto ?? "").trim();
    if (!hook || vistos.has(hook)) continue;
    vistos.add(hook);
    winners.push({ hook, clientId: p.client_id });
    if (winners.length >= max) break;
  }
  if (!winners.length) return 0;

  let criados = 0;
  for (let i = 0; i < winners.length; i++) {
    const axis = PROBE_AXES[i % PROBE_AXES.length]; // alterna o eixo do aprofundamento
    try {
      const probe = await generateProbe(winners[i].hook, axis);
      if (!probe) continue;
      const { error } = await appDb.from("vm_calibration_pairs").insert({
        dimension: "hook", client_id: winners[i].clientId, axis,
        option_a: probe.option_a, option_b: probe.option_b, source: "probe",
      });
      if (!error) criados++;
    } catch (e) {
      console.error("geração de probe falhou, seguindo", e);
    }
  }
  return criados;
}
