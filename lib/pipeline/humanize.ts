import type Anthropic from "@anthropic-ai/sdk";
import { WRITER_MODEL, trackedCreate } from "../anthropic";
import { agentPrompt, registrarBloco } from "./agents";
import {
  slopLint,
  blockCount,
  dedash,
  paragrafosLongos,
  sequenciasLongas,
  MAX_LONGAS_SEGUIDAS,
  PARAGRAFO_MAX_PALAVRAS,
  type LintViolation,
} from "./slop-lint";
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

// Quantos trechos de ritmo, POR TIPO, vão para uma retentativa cirúrgica. Existe porque hoje
// 85% dos parágrafos estouram o teto: sem limite, o passe "cirúrgico" viraria "reescreva o
// roteiro inteiro" — o oposto do que ele existe pra fazer, e o custo e a fidelidade pagam.
// Os piores primeiro; o excedente sai no rastro (`proveniencia.ritmo`), nunca em silêncio.
export const TETO_TRECHOS_RITMO = 3;

// A quebra de parágrafo é a única correção que não cabe na resposta de uma linha por item, daí
// o marcador: o modelo escreve "||" onde entra a linha em branco e a aplicação a devolve.
const MARCA_PARAGRAFO = "||";
const aplicarMarca = (s: string) =>
  s.split(MARCA_PARAGRAFO).map((p) => p.trim()).filter(Boolean).join("\n\n");

// Ritmo e parágrafo viram violação determinística no MESMO formato do slop-lint, para entrarem
// no mesmo laço de retentativa cirúrgica. Medidos sobre o texto COMO ESTÁ (não o dedashado):
// o `match` é substituído literalmente, e um travessão de diferença deixaria a busca sem alvo.
export function ritmoTargets(text: string): LintViolation[] {
  const paragrafos = paragrafosLongos(text)
    .sort((a, b) => b.palavras - a.palavras)
    .slice(0, TETO_TRECHOS_RITMO)
    .map((p) => ({
      label: `parágrafo de ${p.palavras} palavras (teto ${PARAGRAFO_MAX_PALAVRAS})`,
      match: p.texto,
      severity: "block" as const,
    }));
  const sequencias = sequenciasLongas(text)
    .sort((a, b) => b.tamanho - a.tamanho)
    .slice(0, TETO_TRECHOS_RITMO)
    .map((s) => ({
      label: `${s.tamanho} frases longas seguidas sem nenhuma curta (teto ${MAX_LONGAS_SEGUIDAS})`,
      match: s.texto,
      severity: "block" as const,
    }));
  return [...paragrafos, ...sequencias];
}

// 8. Humanizador: re-textura completa 1x + retries CIRÚRGICOS (só os trechos violados),
// e só quando o dedash determinístico não resolve sozinho.
export async function humanize(
  ctx: GenerationContext,
  script: string
): Promise<{ text: string; violations: LintViolation[] }> {
  // Este é o segundo consumidor do few-shot, e é o que decide a VOZ do produto: os 2 primeiros
  // exemplos do mesmo ranking do roteirista. Troca de critério vale aqui também, por construção.
  const referencias = ctx.fewShot.slice(0, 2);
  const voiceRefs = referencias.map((f, i) => `## Referência de voz ${i + 1}\n${f.roteiro}`).join("\n\n");

  // Rastro: sem isto, o "Por quê?" explica o roteiro e cala sobre a voz.
  registrarBloco(ctx, "humanizador", {
    few_shot_criterio: ctx.fewShotCriterio,
    referencia_de_voz: referencias.map((f) => f.origem),
  });

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
  let ritmo = ritmoTargets(current);
  for (let attempt = 0; attempt < 2 && blockCount(violations) + ritmo.length > 0; attempt++) {
    // Só re-chama o LLM se restarem violações que o dedash final não resolve (travessões
    // são determinísticos — não pagam outra chamada).
    const targets = [
      ...slopLint(dedash(current), ctx.bannedPhrases).filter((v) => v.severity === "block"),
      ...ritmo,
    ];
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
            content: `Um roteiro já humanizado ainda viola regras de estilo APENAS nos trechos abaixo. Para cada item, reescreva SÓ o texto marcado como [TRECHO: …].

REGRA CENTRAL: elimine a CONSTRUÇÃO, não a palavra. Trocar sinônimo, pontuação ou número mantendo a mesma forma NÃO resolve — a forma é o problema. Reescreva a frase por inteiro:
- negação seguida de assertiva ("não é X, é Y" / "não são X. Aquilo é Y") → afirme direto o que É, sem passar pela negação.
- pergunta curta usada como transição ("O resultado?") → diga a transição falando: "E adivinha o que aconteceu depois", "E a consequência disso ninguém esperava".
- itens justapostos por vírgula ("carros na rua, garotos jogando bola") → amarre com conectivo e verbo: "de um lado você vê X, de outro Y, mas se der bobeira Z".

RITMO E PARÁGRAFO são outra família e pedem outra correção:
- parágrafo acima do teto de palavras → quebre em dois ou três parágrafos, escrevendo "${MARCA_PARAGRAFO}" onde entra a linha em branco. Se der, corte o que não carrega a ideia. NÃO invente informação para preencher.
- frases longas seguidas → encurte UMA delas, ou entre com uma frase curta que quebre a inércia. NÃO alterne curta e longa a cada frase: o alvo é dinamismo, não metrônomo.

O roteiro é LIDO EM VOZ ALTA: se a frase só funciona porque o olho reconstrói o que falta, ela está errada. A substituição PODE e costuma ficar mais longa que o trecho original — subordinar custa palavras, e isso é esperado, não um problema. Mantenha o sentido e a voz. NÃO reescreva o resto do roteiro, e não repita nem reordene as seções (## HEADLINE, ## ROTEIRO…). Responda EXATAMENTE uma linha por item, no formato "N. <texto substituto>", e nada mais.\n\n${lista}`,
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
      if (alvo && m[2]) current = current.split(alvo.match).join(aplicarMarca(m[2]));
    }
    violations = slopLint(current, ctx.bannedPhrases);
    ritmo = ritmoTargets(current);
  }

  // Varredura determinística final: se ainda sobrou travessão de slop, elimina
  // (preservando fala de personagem). Recalcula as violações sobre o texto de fato salvo.
  const cleaned = dedash(current);
  return { text: cleaned, violations: slopLint(cleaned, ctx.bannedPhrases) };
}
