import { anthropic, ANALYST_MODEL } from "../anthropic";
import { OUTPUT_FORMAT, buildStaticSystemBlock, buildDynamicSystemBlock } from "./draft";
import type { GenerationContext } from "./types";

// Crítica multi-chapéu + reescrita em UMA chamada: avalia com cada "chapéu"
// (hook, storytelling, comando, ritmo/clareza, restrições do cliente) e já corrige.
export async function critiqueAndRewrite(ctx: GenerationContext, draft: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 5000,
    system: [
      { type: "text", text: buildStaticSystemBlock(ctx), cache_control: { type: "ephemeral" } },
      { type: "text", text: buildDynamicSystemBlock(ctx) },
    ],
    messages: [
      {
        role: "user",
        content: `Você agora é a sala de revisão. Avalie o rascunho abaixo vestindo cada chapéu, na ordem:

1. HOOK: os 3 primeiros segundos geram tensão/curiosidade concreta? Compare com o playbook de hooks.
2. STORYTELLING: os beats progridem? Há loop aberto até o final? O payoff entrega o que o hook prometeu?
3. COMANDO: o CTA é específico e conectado ao conteúdo?
4. RITMO E CLAREZA: frases faladas, uma ideia por frase, sem palavra que trave na boca?
5. RESTRIÇÕES DO CLIENTE: alguma proibição foi violada? (Se sim, corrigir é prioridade máxima.)

Depois dos chapéus, aplique o checklist eliminatório abaixo — qualquer item reprovado precisa ser corrigido na reescrita:
${ctx.playbooks.checklist ?? "(sem checklist)"}

Primeiro liste objetivamente os problemas encontrados (curto, por chapéu). Depois escreva a versão corrigida completa.

A versão corrigida deve vir DEPOIS de uma linha contendo apenas "=====ROTEIRO_REVISADO=====".

${OUTPUT_FORMAT}

RASCUNHO:
${draft}`,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "text");
  const text = block?.type === "text" ? block.text : "";
  const parts = text.split(/=====\s*ROTEIRO_REVISADO\s*=====/i);
  return (parts[1] ?? text).trim();
}
