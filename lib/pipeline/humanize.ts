import { anthropic, WRITER_MODEL } from "../anthropic";
import { slopLint, blockCount, type LintViolation } from "./slop-lint";
import type { GenerationContext } from "./types";
import { OUTPUT_FORMAT } from "./draft";

// Passe final: re-textura sem re-estruturar + lint determinístico com até 2 retries.
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
      max_tokens: 4000,
      system: `Você é um roteirista humano brasileiro fazendo o passe final de naturalidade. Reescreva o roteiro mantendo EXATAMENTE a mesma estrutura, beats e argumentos — mude apenas a textura do texto para soar como fala espontânea de brasileiro. Nada de registro de IA.\n\n${ctx.playbooks.style_guide ?? ""}\n\n${voiceRefs}`,
      messages: [
        {
          role: "user",
          content: `${OUTPUT_FORMAT}\n\nROTEIRO:\n${current}${lintNote}`,
        },
      ],
    });

    const block = res.content.find((b) => b.type === "text");
    current = block?.type === "text" ? block.text : current;

    violations = slopLint(current, ctx.bannedPhrases);
    if (blockCount(violations) === 0) break;
  }

  return { text: current, violations };
}
