import type { Attachment, ModelagemAnalysis, NarrativaCandidata } from "./types";

// ── Modo REPLICAR: o original não é reinterpretado, é reexecutado melhor ──────────────────
// Módulo PURO de propósito (só tipos importados): é ele que a sala usa no lugar do storytelling
// e do agente Dados, e a única forma de garantir que a narrativa sintética é determinística é
// não depender de banco nem de LLM. As asserções vivem em tests/replicar.test.ts.

export type Modo = "modelar" | "replicar";

// NULL é lido como 'modelar' (migration 0034): toda sessão anterior ao modo Replicar continua
// valendo sem backfill, e qualquer valor estranho degrada para o modo antigo — nunca para o novo.
export function resolverModo(modo: string | null | undefined): Modo {
  return modo === "replicar" ? "replicar" : "modelar";
}

// O anexo que manda no modo Replicar. É 1:1 com o material: se por algum caminho houver mais de
// um, o primeiro vence e o pipeline registra o descarte no rastro (index.ts) — nunca em silêncio.
export function anexoReplicar<T extends Pick<Attachment, "is_modelagem" | "modo">>(attachments: T[]): T | null {
  return attachments.find((a) => a.is_modelagem && resolverModo(a.modo) === "replicar") ?? null;
}

// O anexo que dita a linha central da sessão — a MESMA regra 1:1 do Replicar, agora valendo para
// Modelar (Regra 4): os dois ditam premissa e arquitetura, então dois deles é contradição, não
// riqueza. Replicar vence quando existe (é o modo mais restritivo); senão, o primeiro marcado.
// Os excedentes perdem a condição de modelagem e seguem como material de referência comum.
export function anexoModelagem<T extends Pick<Attachment, "is_modelagem" | "modo">>(attachments: T[]): T | null {
  return anexoReplicar(attachments) ?? attachments.find((a) => a.is_modelagem) ?? null;
}

// Marcador registrável para "o original não pedia nada ao espectador" (esqueleto.comando.tipo).
// Campo vazio é ambíguo — não distingue "não havia comando" de "a autópsia não olhou".
export const SEM_COMANDO = "nenhum";

export function semComando(comando: NonNullable<ModelagemAnalysis["esqueleto"]>["comando"]): boolean {
  const t = comando?.tipo?.trim().toLowerCase();
  return !t || t === SEM_COMANDO || t === "nenhum" || t === "sem comando";
}

/**
 * A decisão que o AGENTE não toma: adaptar o CTA do original, ou criar um quando ele não tinha.
 * Sai do esqueleto, em código, e vira instrução única no input do agente comando.
 */
export function comandoDoOriginal(a: ModelagemAnalysis | null | undefined): { adaptar: boolean; descricao: string } {
  const c = a?.esqueleto?.comando;
  if (semComando(c)) return { adaptar: false, descricao: "o original NÃO pedia nada ao espectador" };
  return {
    adaptar: true,
    descricao: [c!.tipo, c!.gatilho && `via ${c!.gatilho}`, c!.posicao && `(${c!.posicao})`].filter(Boolean).join(" "),
  };
}

// Sem esqueleto não há o que replicar: em Modelar a autópsia pode falhar que a sala segue com o
// tema, aqui ela É o trabalho. Falha explícita, com o caminho de saída, em vez de um roteiro
// que finge ter seguido uma estrutura que ninguém leu.
export function exigirEsqueletoDoOriginal(a: ModelagemAnalysis | null | undefined): void {
  if (!a?.esqueleto?.beats?.length)
    throw new Error(
      "Replicar precisa da autópsia do original (estrutura e beats), e ela não saiu deste material. " +
        "Cole a transcrição no campo do material e conjure de novo, ou use o modo Modelar."
    );
}

const beatLinha = (b: NonNullable<NonNullable<ModelagemAnalysis["esqueleto"]>["beats"]>[number], i: number): string =>
  `${b.funcao ?? `beat ${i + 1}`} — ${b.mecanismo_de_atencao ?? "(mecanismo não registrado)"}` +
  `${b.emocao ? ` [${b.emocao}]` : ""}${b.seg ? ` · ~${b.seg}s` : ""}`;

/**
 * A "narrativa vencedora" do modo Replicar, montada em CÓDIGO a partir do esqueleto da autópsia.
 *
 * Substitui as duas chamadas caras que ela dispensa (storytelling 16k + Dados 6k) e, mais
 * importante, remove o ponto exato onde a sala reinterpretava e perdia a estrutura do original.
 * O formato é o mesmo `NarrativaCandidata` que roteirista, hook e revisor já consomem — nenhum
 * consumidor downstream sabe que ela não veio de um modelo.
 *
 * Robusta a beat faltando ou fora de ordem: ordena por `ordem` (estável, ausente vai para o fim
 * na posição em que chegou) e nunca deixa um campo obrigatório do tipo indefinido.
 */
export function narrativaDoOriginal(a: ModelagemAnalysis): NarrativaCandidata {
  const e = a.esqueleto ?? {};
  const c = a.compreensao;
  const beats = [...(e.beats ?? [])]
    // ordem ausente vai para o fim preservando a posição de chegada (índice como desempate)
    .map((b, i) => ({ b, i, ord: typeof b?.ordem === "number" ? b.ordem : Number.POSITIVE_INFINITY }))
    .sort((x, y) => x.ord - y.ord || x.i - y.i)
    .map(({ b }, i) => beatLinha(b, i));

  const emocoes = [...new Set((e.beats ?? []).map((b) => b?.emocao).filter(Boolean))].join(" → ");

  return {
    titulo: c?.tema ? `Réplica: ${c.tema}` : "Réplica da estrutura do original",
    // código + nome do playbook: é este campo que faz extractPlaybookSection achar o trecho certo
    estrutura: e.estrutura_narrativa ?? "(a estrutura do original, como a autópsia a registrou)",
    como_serve_a_premissa:
      "É a estrutura do próprio original, que já sustentou esta tese diante de uma audiência real. " +
      "Ela não está em discussão: a ordem, a função e a proporção de duração dos beats são inegociáveis.",
    personagem: "o mesmo do original — não invente personagem novo",
    conflito: e.escalada ?? "a mesma tensão do original, na mesma escalada",
    mecanismo_emocional:
      c?.recompensa ?? (emocoes ? `curva emocional do original: ${emocoes}` : "a mesma recompensa emocional do original"),
    beats: beats.length ? beats : ["(a autópsia não registrou beats — siga a arquitetura do brief)"],
    gancho_potencial: e.hook?.fator_de_curiosidade ?? e.hook?.funcao ?? "",
    porque_funciona:
      a.diagnostico?.onde_superamos ??
      "a arquitetura já performou no original; o ganho vem da execução frase a frase, não de estrutura nova",
  };
}
