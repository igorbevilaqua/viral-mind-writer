import { ANALYST_MODEL, trackedCreate } from "../anthropic";
import { agentPrompt } from "./agents";
import { OUTPUT_FORMAT, buildStaticSystemBlock, buildReviewDynamicBlock } from "./draft";
import type { GenerationContext } from "./types";

// 7. Sala de revisão multi-chapéu + reescrita em UMA chamada.
// Os chapéus vivem em agents/revisao.md; o checklist eliminatório vem do playbook.
// Contexto enxuto: a revisão corrige contra checklist, não imita voz — sem few-shot,
// sem materiais do usuário, dossiê truncado (buildReviewDynamicBlock).
export async function critiqueAndRewrite(
  ctx: GenerationContext,
  draft: string,
  // Sinais determinísticos daquela geração (eco numérico, hook × abertura — 016 §6).
  // Chegam prontos de index.ts: o revisor é quem decide, o detector só sinaliza.
  sinais = ""
): Promise<{ revised: string; critica: string }> {
  const res = await trackedCreate(ctx.usageLog, "revisao", {
    model: ANALYST_MODEL,
    max_tokens: 8000,
    system: [
      // block 1 = estático compartilhado + cache: o modelo é sonnet (cache separado do fable),
      // mas "gerar nova versão" re-roda a revisão com o mesmo prefixo e reusa a escrita.
      { type: "text", text: buildStaticSystemBlock(ctx), cache_control: { type: "ephemeral" } },
      { type: "text", text: `${agentPrompt("revisao")}\n\n${buildReviewDynamicBlock(ctx, sinais)}` },
    ],
    messages: [
      {
        role: "user",
        content: `Revise o roteiro montado pela sala. Checklist eliminatório (qualquer item reprovado precisa ser corrigido na reescrita):
${ctx.playbooks.checklist ?? "(sem checklist)"}

Primeiro liste objetivamente os problemas encontrados (curto, por chapéu). Depois escreva a versão corrigida completa depois de uma linha contendo apenas "=====ROTEIRO_REVISADO=====".

${OUTPUT_FORMAT}

ROTEIRO MONTADO:
${draft}`,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "text");
  const text = block?.type === "text" ? block.text : "";
  const parts = text.split(/=====\s*ROTEIRO_REVISADO\s*=====/i);
  const revised = (parts[1] ?? "").trim();
  // A crítica por chapéu: já era calculada e nunca lida. É ela que responde "por que o revisor
  // reescreveu isto" no rastro de proveniência (015 §4.1).
  const critica = (parts[0] ?? "").trim();
  // Guarda: reescrita truncada/ausente nunca pode zerar o roteiro — o trabalho
  // dos especialistas (montado) segue em frente e a humanização cuida do resto.
  // A crítica vai junto mesmo nesse caminho: é ela que explica por que a revisão falhou.
  return { revised: /##\s*ROTEIRO/i.test(revised) ? revised : draft, critica };
}
