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

// ── Critérios de eliminação (guarda determinística) ──────────────────────────
// Os mesmos critérios estão em agents/hook.md, mas prompt não é garantia: o modelo já
// ignora "nada de travessão" de vez em quando (é por isso que o slop-lint existe). Aqui
// eles viram código, aplicado ANTES da seleção — candidato reprovado não pode virar o hook
// principal só por ter o mecanismo mais bem ranqueado.
//
// `\b` do JS é ASCII e NUNCA casa depois de letra acentuada ("você", "atenção") — a mesma
// armadilha documentada em slop-lint.ts. Por isso os limites aqui são explícitos: início de
// string para as saudações, e nada de \b depois de palavra acentuada.
const ABERTURAS_MORTAS: [RegExp, string][] = [
  // fim-de-palavra aqui é "não vem outra letra em seguida" — \b não serve depois de "olá"/"aí"
  [/^\s*(ol[áa]|oi|e a[íi]|fala|salve|bem[- ]?vindos?)(?![a-zà-ÿ])/i, "saudação"],
  [/voc[êe] sabia que/i, "'você sabia que'"],
  [/n(esse|este) v[íi]deo/i, "'nesse vídeo'"],
  [/hoje (eu )?vou (te )?(mostrar|contar|falar|ensinar)/i, "'hoje vou te mostrar'"],
  [/hoje (n[óo]s )?vamos falar/i, "'hoje vamos falar'"],
  [/presta[r]? aten[çc][ãa]o/i, "'presta atenção'"],
  [/^\s*(nesse|neste) v[íi]deo/i, "abertura genérica"],
];

const MAX_FRASES = 4;

// Conta períodos falados. O lookaround impede que o ponto DENTRO de um número quebre a
// contagem — "R$ 12.457,32" é uma frase só, e Ultra Especificidade vive desses números.
export function contarFrases(hook: string): number {
  return hook
    .split(/(?<![0-9])[.!?]+(?![0-9])/)
    .filter((f) => f.trim().length > 0).length;
}

// Devolve os motivos de reprovação. Vazio = passou.
export function hookLint(hook: string): string[] {
  const motivos: string[] = [];
  const t = (hook ?? "").trim();
  if (!t) return ["vazio"];
  for (const [re, label] of ABERTURAS_MORTAS) if (re.test(t)) motivos.push(`abertura morta: ${label}`);
  if (/[—–]/.test(t)) motivos.push("travessão");
  if (/;/.test(t)) motivos.push("ponto e vírgula");
  const n = contarFrases(t);
  if (n > MAX_FRASES) motivos.push(`${n} frases (máximo ${MAX_FRASES})`);
  return motivos;
}

// Fail-soft por design: o hook nunca derruba a geração. Se a filtragem deixar menos do que
// selectHook precisa (1 principal + 3 variantes), os reprovados voltam ATRÁS dos aprovados —
// a ordem é o que empurra os ruins para o fim da fila de variantes, não para fora.
export function filtrarCandidatos(
  candidatos: HookCandidate[],
  minimo = 4
): { candidatos: HookCandidate[]; descartados: { hook: string; motivos: string[] }[] } {
  const aprovados: HookCandidate[] = [];
  const reprovados: HookCandidate[] = [];
  const descartados: { hook: string; motivos: string[] }[] = [];
  for (const c of candidatos) {
    const motivos = hookLint(c.hook);
    if (motivos.length) {
      reprovados.push(c);
      descartados.push({ hook: c.hook, motivos });
    } else {
      aprovados.push(c);
    }
  }
  if (aprovados.length >= minimo) return { candidatos: aprovados, descartados };
  return { candidatos: [...aprovados, ...reprovados], descartados };
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
