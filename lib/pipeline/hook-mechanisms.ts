// Taxonomia canônica de mecanismos de hook — espelha os MGCs de playbooks/hook.md.
// Fonte de verdade do vocabulário ESTRUTURADO usado em dois lugares: a classificação
// do corpus (scripts/analyze-hooks.ts) e a rotulação do hook gerado (designHook).
// Mudou o playbook? Atualize aqui. "Esse Cara"/"Visual" NÃO são mecanismos: são formato.
export const HOOK_MECHANISMS = [
  "Contraste Extremo",
  "Elemento Controverso",
  "Desafio de Crença",
  "Urgência",
  "Viés de Ilegalidade",
  "Ordem Contra-intuitiva",
  "Apelo à Autoridade",
  "Viés de Negatividade",
  "Ultra Especificidade",
  "Apelo à Maioria",
  "Apelo ao Esforço",
  "Apelo Histórico",
  "Revelação Secreta",
  "Conflito Declarado",
  "Superlativo",
  "Outro",
] as const;
export type HookMechanism = (typeof HOOK_MECHANISMS)[number];

export const HOOK_FORMATS = ["Personagem Central", "Visual", "Nenhum"] as const;
export type HookFormat = (typeof HOOK_FORMATS)[number];

// Seleção do hook a partir dos candidatos gerados (função pura, testável).
// Regra: o PRINCIPAL é o candidato cujo mecanismo pontua mais alto no ranking de
// vencedores (garante repetição do padrão comprovado); as VARIANTES são candidatos
// de mecanismos DISTINTOS entre si (garante diversidade). Sem ranking (cliente novo /
// adaptação), cai na ordem em que o modelo devolveu.
export interface HookCandidate {
  hook: string;
  mecanismo: string;
  formato?: string;
  racional?: string;
}
export function selectHook(
  candidatos: HookCandidate[],
  rankShare: Map<string, number>,
  nVariantes = 3
): { principal: HookCandidate; variantes: HookCandidate[] } | null {
  const valid = candidatos.filter((c) => c?.hook?.trim());
  if (!valid.length) return null;
  const score = (c: HookCandidate) => rankShare.get(c.mecanismo) ?? 0;
  // ordem estável: score desc, preservando a ordem original no empate
  const ordered = valid.map((c, i) => ({ c, i })).sort((a, b) => score(b.c) - score(a.c) || a.i - b.i).map((x) => x.c);
  const principal = ordered[0];

  // variantes: mecanismos distintos entre si E do principal, priorizando os mais bem
  // ranqueados; completa com o que sobrar se faltarem mecanismos distintos.
  const restantes = ordered.slice(1);
  const variantes: HookCandidate[] = [];
  const usados = new Set<string>([principal.mecanismo]);
  for (const c of restantes) {
    if (usados.has(c.mecanismo)) continue;
    variantes.push(c);
    usados.add(c.mecanismo);
    if (variantes.length === nVariantes) break;
  }
  for (const c of restantes) {
    if (variantes.length === nVariantes) break;
    if (!variantes.includes(c)) variantes.push(c);
  }
  return { principal, variantes };
}
