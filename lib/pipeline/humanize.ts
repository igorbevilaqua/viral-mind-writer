import { anthropic, WRITER_MODEL } from "../anthropic";
import { agentPrompt } from "./agents";
import { slopLint, blockCount, type LintViolation } from "./slop-lint";
import type { GenerationContext } from "./types";
import { OUTPUT_FORMAT } from "./draft";

// 8. Humanizador: re-textura sem re-estruturar + lint determinístico com até 2 retries.
export async function humanize(
  ctx: GenerationContext,
  script: string
): Promise<{ text: string; violations: LintViolation[] }> {
  const voiceRefs = ctx.fewShot
    .slice(0, 2)
    .map((f, i) => `## Referência de voz ${i + 1}\n${f.roteiro}`)
    .join("\n\n");

  let current = script;
  let violations: LintViolation[] = [];

  for (let attempt = 0; attempt <= 2; attempt++) {
    const lintNote =
      attempt === 0
        ? ""
        : `\n\nATENÇÃO: a versão anterior violou estas regras — elimine TODAS as ocorrências:\n${violations
            .map((v) => `- ${v.label} (trecho: "${v.match}")`)
            .join("\n")}`;

    const res = await anthropic.messages.create({
      model: WRITER_MODEL,
      // reescreve o roteiro inteiro (headline+hook+corpo+variações+comando+fontes) e o
      // fable-5 pensa sempre no mesmo teto — 4000 arriscava truncar. 8000 dá folga.
      max_tokens: 8000,
      system: `${agentPrompt("humanizador")}\n\n# GUIA DE ESTILO\n${ctx.playbooks.style_guide ?? ""}\n\n${voiceRefs}`,
      messages: [
        {
          role: "user",
          content: `${OUTPUT_FORMAT}\n\nROTEIRO:\n${current}${lintNote}`,
        },
      ],
    });

    const block = res.content.find((b) => b.type === "text");
    const next = block?.type === "text" ? block.text : "";
    // Guarda: só adota a reescrita se ela preservou o formato do roteiro.
    if (/##\s*ROTEIRO/i.test(next)) current = next;

    violations = slopLint(current, ctx.bannedPhrases);
    if (blockCount(violations) === 0) break;
  }

  return { text: current, violations };
}
