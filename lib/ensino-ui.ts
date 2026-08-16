// Decisões puras da tela de ensino (015 §7). Módulo sem import de runtime servidor de
// propósito: o dialog é client component e não pode arrastar o SDK da Anthropic para o bundle.
// `Casa` entra como import de tipo (apagado na compilação).

import type { Casa, Direcao } from "./pipeline/classify-teaching";

export type Escopo = "cliente" | "global";

// Record fechado: se CASAS ganhar uma casa, o tsc quebra aqui em vez de a tela desenhar
// três chips e esconder a quarta.
export const CASA_LABEL: Record<Casa, string> = {
  licao: "lição",
  vocabulario: "vocabulário",
  frase_banida: "frase banida",
  playbook: "playbook",
};

/**
 * Onde o ensinamento REALMENTE cai. Espelha `gravarEnsinamento` (lib/actions.ts): vocabulário
 * é por cliente por definição, então escopo Global rebaixa para frase banida (§5.1).
 */
export const casaFinal = (casa: Casa, escopo: Escopo): Casa =>
  casa === "vocabulario" && escopo === "global" ? "frase_banida" : casa;

/**
 * O campo `padrao` precisa estar na tela, editável. Vale também para vocabulário+Global: o
 * classificador zera `padrao` fora de `frase_banida` (classify-teaching.ts:96) e a gravação
 * rebaixa esse caso para `frase_banida` — sem campo editável o usuário bate num erro sem saída.
 */
export const precisaPadrao = (casa: Casa, escopo: Escopo) => casaFinal(casa, escopo) === "frase_banida";

// Mesmo Record fechado do CASA_LABEL: direção nova quebra o tsc aqui, não a tela.
export const DIRECAO_LABEL: Record<Direcao, string> = {
  evitar: "evitar",
  preferir: "preferir",
};

/**
 * Direção e termo precisam estar na tela, editáveis: `gravarEnsinamento` recusa vocabulário
 * sem direção (pendência 10) — adivinhar grava na lista oposta à que o usuário ensinou.
 */
export const precisaDirecao = (casa: Casa, escopo: Escopo) => casaFinal(casa, escopo) === "vocabulario";

// Frase que `explicar()` devolve em roteiro anterior à 2.0 (lib/pipeline/explain.ts).
const SEM_PROVENIENCIA = "anterior ao registro de proveniência";

/**
 * §7.2 manda texto literal para `nao_determinado`; §8 manda NÃO inventar causa em roteiro
 * anterior à 2.0 — e nesse caminho o servidor já devolveu a frase honesta. Quem tem rastro
 * recebe o literal; quem não tem fica com o que o servidor disse.
 */
export const textoNaoDeterminado = (explicacao: string) =>
  explicacao.includes(SEM_PROVENIENCIA)
    ? explicacao
    : "Nada no prompt determinou esta frase. Foi escolha do roteirista.";
