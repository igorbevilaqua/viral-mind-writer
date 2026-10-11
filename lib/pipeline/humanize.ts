import type Anthropic from "@anthropic-ai/sdk";
import { trackedCreate } from "../anthropic";
import { agentPrompt, registrarBloco } from "./agents";
import {
  slopLint,
  blockCount,
  dedash,
  LABEL_ANUNCIO,
  paragrafosLongos,
  PARAGRAFO_MAX_PALAVRAS,
  type LintViolation,
} from "./slop-lint";
import type { GenerationContext } from "./types";
import { alvosDoPiso } from "./piso";

// O corpo do documento montado, sem a cópia do hook que abre o ROTEIRO: o hook é travado em
// código depois (preservarHook), então corrigir frase dele seria trabalho jogado fora.
function corpoSemHook(doc: string): string {
  const roteiro = doc.match(/##\s*ROTEIRO\s*\n([\s\S]*?)(?=\n##\s|$)/i)?.[1] ?? "";
  return roteiro.split(/\n\s*\n/).slice(1).join("\n\n");
}
const hookDe = (doc: string) => doc.match(/##\s*HOOK\s*\n([\s\S]*?)(?=\n##\s|$)/i)?.[1]?.trim() ?? null;
const alvosPiso = (doc: string) => alvosDoPiso(corpoSemHook(doc), hookDe(doc));

// Troca só DEPOIS da cópia do hook que abre o ROTEIRO. O alvo do piso é medido no corpo, e a
// frase do corpo que repete o hook existe, por definição, também na seção HOOK e na cópia:
// trocar em todo o documento reescreveria o hook travado.
function trocarNoCorpo(doc: string, trecho: string, novo: string): string {
  const m = doc.match(/##\s*ROTEIRO\s*\n[\s\S]*?\n\s*\n/i);
  const corte = m ? (m.index ?? 0) + m[0].length : 0;
  return doc.slice(0, corte) + doc.slice(corte).split(trecho).join(novo);
}
import { buildStaticSystemBlock } from "./draft";
import type { FallbackInfo } from "./critique";

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
// O anúncio vazio é o único defeito cuja correção certa costuma ser CORTAR: o fato que ele
// promete já está na frase seguinte, então trocá-lo por outra frase só troca uma enrolação por
// outra. Só ele aceita a resposta "[CORTAR]" — mandar o modelo apagar um parágrafo longo ou uma
// sequência de frases jogaria conteúdo fora.
const CORTAR = /^\[?\s*CORTAR\s*\]?[.!?]*$/i;

// Remove o trecho e fecha o buraco: parágrafo inteiro cortado deixa três quebras de linha, e
// frase no meio do parágrafo deixa espaço duplo.
const removerTrecho = (texto: string, trecho: string) =>
  texto
    .split(trecho)
    .join("")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

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
  // Frases longas seguidas NÃO viram alvo (plano 024, 0.4): o teto de 3 mandava encurtar e
  // picava o texto, que é a reclamação nº 2 do time; o humano junta frases quando edita, e no
  // estudo de outubro 90% dos roteiros da casa "violam" o teto sem nenhuma faixa separar resultado.
  return paragrafos;
}

// 8. Humanizador: re-textura completa 1x + retries CIRÚRGICOS (só os trechos violados),
// e só quando o dedash determinístico não resolve sozinho.
export async function humanize(
  ctx: GenerationContext,
  script: string
): Promise<{ text: string; violations: LintViolation[]; fallback: FallbackInfo | null }> {
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
  // Plano 024, 2.8: o humanizador deixou de reescrever o roteiro inteiro. A re-textura completa
  // era a terceira reescrita em série (roteirista, revisor, humanizador), cada uma com os
  // próprios tiques, e foi ela que reescreveu a cópia do hook e duplicou a abertura (09/10).
  // Agora ele só corrige o que foi MEDIDO: slop, parágrafo longo e o piso de clareza.
  const fallback: FallbackInfo | null = null;

  let violations = slopLint(current, ctx.bannedPhrases);
  let ritmo = ritmoTargets(current);
  let piso = alvosPiso(current);
  for (let attempt = 0; attempt < 2 && blockCount(violations) + ritmo.length + piso.length > 0; attempt++) {
    // Só re-chama o LLM se restarem violações que o dedash final não resolve (travessões
    // são determinísticos — não pagam outra chamada).
    const targets = [
      ...slopLint(dedash(current), ctx.bannedPhrases).filter((v) => v.severity === "block"),
      ...ritmo,
      ...piso.map((a) => ({ ...a, severity: "block" as const, piso: true })),
    ];
    if (!targets.length) break;

    const lista = targets
      .map((v, i) => `${i + 1}. regra violada: ${v.label}\n   ${excerptAround(current, v.match)}`)
      .join("\n");
    const fix = await trackedCreate(
      ctx.usageLog,
      "humanizacao",
      {
        model: ctx.modelo,
        // resposta curta (1 linha por trecho), mas os dois modelos pensam dentro do mesmo teto — 4000.
        max_tokens: 4000,
        system, // mesmo prefixo → cache read
        messages: [
          {
            role: "user",
            content: `Um roteiro pronto viola regras de estilo e de clareza APENAS nos trechos abaixo. Para cada item, reescreva SÓ o texto marcado como [TRECHO: …].

REGRA CENTRAL: elimine a CONSTRUÇÃO, não a palavra. Trocar sinônimo, pontuação ou número mantendo a mesma forma NÃO resolve — a forma é o problema. Reescreva a frase por inteiro:
- negação seguida de assertiva ("não é X, é Y" / "não são X. Aquilo é Y") → afirme direto o que É, sem passar pela negação.
- pergunta curta usada como transição ("O resultado?") → diga a transição falando: "E adivinha o que aconteceu depois", "E a consequência disso ninguém esperava".
- itens justapostos por vírgula ("carros na rua, garotos jogando bola") → amarre com conectivo e verbo: "de um lado você vê X, de outro Y, mas se der bobeira Z".
- anúncio vazio ("Agora vem a parte que piora tudo", "E aqui entra o detalhe", "E tem mais.") → a frase promete algo grande e não diz nada, empurrando o fato pra frase seguinte. Duas saídas: CORTE a frase e vá direto ao fato (responda "N. [CORTAR]" — só vale para ESTE item), ou reescreva para ela já carregar o fato que anuncia ("Agora presta atenção, porque nesse mesmo período o governo reduziu impostos em 2,5% do PIB"). Não troque uma antecipação genérica por outra.

CLAREZA é a família que o time mais reclama: quem ouve uma vez não pode precisar traduzir nada.
- capital no lugar do país → diga o país ou o governo pelo nome.
- sigla ou nome sem explicação → cole o que ele é na mesma frase ("a CPFL, que distribui a luz de metade de São Paulo"), ou troque pelo que ele é.
- número exato demais → arredonde como se fala ("mais de 25 mil", "quase 2 bilhões"); não invente número novo.
- expressão repetida ("Ou seja" pela segunda vez etc.) → mantenha o sentido e diga de outro jeito; a primeira ocorrência fica.
- frase que repete o hook → o espectador acabou de ouvir aquilo: escreva a frase que vem DEPOIS dele, puxando a ideia adiante com informação nova.

RITMO E PARÁGRAFO são outra família e pedem outra correção:
- parágrafo acima do teto de palavras → quebre em dois ou três parágrafos, escrevendo "${MARCA_PARAGRAFO}" onde entra a linha em branco. Se der, corte o que não carrega a ideia. NÃO invente informação para preencher.

O roteiro é LIDO EM VOZ ALTA: se a frase só funciona porque o olho reconstrói o que falta, ela está errada. A substituição PODE e costuma ficar mais longa que o trecho original — subordinar custa palavras, e isso é esperado, não um problema. Mantenha o sentido e a voz. NÃO reescreva o resto do roteiro, e não repita nem reordene as seções (## HEADLINE, ## ROTEIRO…). Responda EXATAMENTE uma linha por item, no formato "N. <texto substituto>", e nada mais.\n\n${lista}`,
          },
        ],
      },
      "medium"
    );
    for (const line of textOf(fix).split("\n")) {
      const m = line.match(/^(\d+)[.)]\s+(.*\S)/);
      if (!m) continue;
      const alvo = targets[Number(m[1]) - 1];
      // ponytail: substituição literal de todas as ocorrências do match; se o modelo
      // devolver linha a menos/mais, o trecho fica e o próximo lint/dedash decide.
      if (!alvo) continue;
      current =
        CORTAR.test(m[2].trim()) && alvo.label === LABEL_ANUNCIO
          ? removerTrecho(current, alvo.match)
          : "piso" in alvo
            ? trocarNoCorpo(current, alvo.match, aplicarMarca(m[2]))
            : current.split(alvo.match).join(aplicarMarca(m[2]));
    }
    violations = slopLint(current, ctx.bannedPhrases);
    ritmo = ritmoTargets(current);
    piso = alvosPiso(current);
  }

  // Varredura determinística final: se ainda sobrou travessão de slop, elimina
  // (preservando fala de personagem). Recalcula as violações sobre o texto de fato salvo.
  const cleaned = dedash(current);
  return { text: cleaned, violations: slopLint(cleaned, ctx.bannedPhrases), fallback };
}
