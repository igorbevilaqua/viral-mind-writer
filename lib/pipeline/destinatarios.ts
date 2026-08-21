// Fonte única de verdade do roteamento de lições. O backfill da migration 0027 replica
// DIMENSAO_DESTINATARIOS — se um mudar, o outro muda junto.

export const DESTINATARIOS = [
  "hook", "roteirista", "revisao", "comando",
  "premissa", "storytelling", "modelagem", "dados",
] as const;

export type Destinatario = (typeof DESTINATARIOS)[number];

// Payload do pseudo-insight `taught` montado em context.ts e lido por taughtBlock /
// formatInsightsForDados. `dimensao` sobrevive só como rótulo de agrupamento no bloco do Dados.
export interface TaughtPayload {
  // vm_lesson_learnings.id — é ele que transforma "veio da lição X" num botão que abre a lição X
  // para correção (015 §4.3). Opcional só para contexto montado à mão em teste.
  id?: string;
  titulo: string;
  descricao: string;
  destinatarios?: string[];
  dimensao?: string;
}

// `dados` (formatInsightsForDados, agents.ts:136) agrupa TODO taught_* — por isso aparece em
// todas as linhas. `revisao` não aparece: hoje o revisor não recebe lição nenhuma (Task 3 liga
// o call site; lições só chegam nele quando alguém ensinar explicitamente para o revisor).
export const DIMENSAO_DESTINATARIOS: Record<string, Destinatario[]> = {
  hook:         ["hook", "dados"],
  storytelling: ["storytelling", "modelagem", "dados"],
  tema:         ["storytelling", "modelagem", "premissa", "dados"],
  ritmo:        ["roteirista", "dados"],
  comando:      ["comando", "dados"],
  geral:        ["roteirista", "premissa", "dados"],
};

/**
 * Carimba `destinatarios` a partir da dimensão, para TODO insert em vm_lesson_learnings.
 *
 * A coluna nasceu na 0027 com `default '{}'` e um backfill de uma vez só. O RPC do botão
 * Ensinar preenchia; os quatro caminhos de máquina (encerramento de sessão, correção na sala,
 * curador, lição manual) não. `licoesPara` roteia por `destinatarios.includes(agente)`, então
 * array vazio não casa com agente nenhum: a lição aparecia em /ensinar, o adm ativava, e ela
 * nunca chegava a prompt algum. Sem erro e sem log — nem entrava em `licoes_excedidas`, que
 * existe justamente para denunciar corte silencioso.
 *
 * Derivar aqui e não num trigger: o mapa acima é a fonte única, e a 0027 já provou que uma
 * segunda cópia em SQL desanda quando alguém mexe num lado só.
 */
export function comDestinatarios<T extends { dimensao?: string | null; destinatarios?: string[] }>(
  rows: T[]
): (T & { destinatarios: string[] })[] {
  return rows.map((r) => ({
    ...r,
    // quem já traz (o RPC, um dia um caller novo) manda: derivar por cima seria regressão
    destinatarios: r.destinatarios?.length ? r.destinatarios : (DIMENSAO_DESTINATARIOS[r.dimensao ?? ""] ?? []),
  }));
}

// O que cada agente recebia ANTES da 0027. Existe só para o teste de equivalência.
// draft.ts:202 · agents.ts:485 · agents.ts:757 · agents.ts:839 · premissa.ts:65 · modelagem.ts:245
export const LEGACY_DIMENSOES: Record<Destinatario, string[]> = {
  hook:         ["hook"],
  roteirista:   ["ritmo", "geral"],
  revisao:      [],
  comando:      ["comando"],
  premissa:     ["tema", "geral"],
  storytelling: ["storytelling", "tema"],
  modelagem:    ["storytelling", "tema"],
  dados:        ["hook", "storytelling", "tema", "ritmo", "comando", "geral"],
};
