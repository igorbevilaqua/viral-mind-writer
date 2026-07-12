import type Anthropic from "@anthropic-ai/sdk";
import { WRITER_MODEL, trackedCreate } from "../anthropic";
import { agentPrompt } from "./agents";
import { slopLint, blockCount, dedash, type LintViolation } from "./slop-lint";
import type { GenerationContext } from "./types";
import { OUTPUT_FORMAT, buildStaticSystemBlock } from "./draft";

// Trecho violado com contexto ao redor — o modelo precisa ver a frase pra encaixar a substituição.
export function excerptAround(text: string, match: string, pad = 120): string {
  const i = text.indexOf(match);
  if (i < 0) return `[TRECHO: ${match}]`;
  const start = Math.max(0, i - pad);
  const end = Math.min(text.length, i + match.length + pad);
  return `${start > 0 ? "…" : ""}${text.slice(start, i)}[TRECHO: ${match}]${text.slice(i + match.length, end)}${
    end < text.length ? "…" : ""
  }`;
}

const textOf = (res: Anthropic.Message) => {
  const block = res.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
};

// 8. Humanizador: re-textura completa 1x + retries CIRÚRGICOS (só os trechos violados),
// e só quando o dedash determinístico não resolve sozinho.
export async function humanize(
  ctx: GenerationContext,
  script: string
): Promise<{ text: string; violations: LintViolation[] }> {
  const voiceRefs = ctx.fewShot
    .slice(0, 2)
    .map((f, i) => `## Referência de voz ${i + 1}\n${f.roteiro}`)
    .join("\n\n");

  // block 1 = mesmo prefixo estático do roteirista (mesmo modelo fable) → cache read na
  // primeira passada, e os retries cirúrgicos reusam este prefixo com ~90% de desconto.
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: buildStaticSystemBlock(ctx), cache_control: { type: "ephemeral" } },
    { type: "text", text: `${agentPrompt("humanizador")}\n\n${voiceRefs}` },
  ];

  let current = script;

  const res = await trackedCreate(
    ctx.usageLog,
    "humanizacao",
    {
      model: WRITER_MODEL,
      // reescreve o roteiro inteiro (headline+hook+corpo+variações+comando+fontes) e o
      // fable-5 pensa sempre no mesmo teto — 4000 arriscava truncar. 8000 dá folga.
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: `${OUTPUT_FORMAT}\n\nROTEIRO:\n${current}` }],
    },
    // re-textura segue regras mecânicas do guia de estilo — medium basta, high só encarecia
    "medium"
  );
  const next = textOf(res);
  // Guarda: só adota a reescrita se ela preservou o formato do roteiro.
  if (/##\s*ROTEIRO/i.test(next)) current = next;

  let violations = slopLint(current, ctx.bannedPhrases);
  for (let attempt = 0; attempt < 2 && blockCount(violations) > 0; attempt++) {
    // Só re-chama o LLM se restarem violações que o dedash final não resolve (travessões
    // são determinísticos — não pagam outra chamada).
    const targets = slopLint(dedash(current), ctx.bannedPhrases).filter((v) => v.severity === "block");
    if (!targets.length) break;

    const lista = targets
      .map((v, i) => `${i + 1}. regra violada: ${v.label}\n   ${excerptAround(current, v.match)}`)
      .join("\n");
    const fix = await trackedCreate(
      ctx.usageLog,
      "humanizacao",
      {
        model: WRITER_MODEL,
        // resposta curta (1 linha por trecho), mas o thinking do fable divide o teto — 4000.
        max_tokens: 4000,
        system, // mesmo prefixo → cache read
        messages: [
          {
            role: "user",
            content: `Um roteiro já humanizado ainda viola regras de estilo APENAS nos trechos abaixo. Para cada item, reescreva SÓ o texto marcado como [TRECHO: …], mantendo o sentido, a voz e extensão parecida, sem violar nenhuma regra — a substituição precisa encaixar exatamente no lugar do trecho. NÃO reescreva o roteiro. Responda EXATAMENTE uma linha por item, no formato "N. <texto substituto>", e nada mais.\n\n${lista}`,
          },
        ],
      },
      "medium"
    );
    for (const line of textOf(fix).split("\n")) {
      const m = line.match(/^(\d+)[.)]\s+(.*\S)/);
      const alvo = m && targets[Number(m[1]) - 1];
      // ponytail: substituição literal de todas as ocorrências do match; se o modelo
      // devolver linha a menos/mais, o trecho fica e o próximo lint/dedash decide.
      if (alvo && m[2]) current = current.split(alvo.match).join(m[2]);
    }
    violations = slopLint(current, ctx.bannedPhrases);
  }

  // Varredura determinística final: se ainda sobrou travessão de slop, elimina
  // (preservando fala de personagem). Recalcula as violações sobre o texto de fato salvo.
  const cleaned = dedash(current);
  return { text: cleaned, violations: slopLint(cleaned, ctx.bannedPhrases) };
}
