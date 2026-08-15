// Fonte única de verdade do roteamento de lições. O backfill da migration 0027 replica
// DIMENSAO_DESTINATARIOS — se um mudar, o outro muda junto.

export const DESTINATARIOS = [
  "hook", "roteirista", "revisao", "comando",
  "premissa", "storytelling", "modelagem", "dados",
] as const;

export type Destinatario = (typeof DESTINATARIOS)[number];

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
