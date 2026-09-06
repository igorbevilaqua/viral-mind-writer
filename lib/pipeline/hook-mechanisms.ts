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
// Regra (WP-F, plano 020): score = lift_lb do mecanismo × 0.6^usos recentes. Lift em vez de
// share porque share mede prevalência, não eficácia (Contraste Extremo: 93% dos hooks do Codex,
// lift 1.04 sem evidência). A penalidade por uso recente existe porque, com UM só mecanismo
// acima de 1 no corpus, lift puro trocaria um monopólio por outro. Sem ranking (cliente novo /
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
const PENALIDADE_USO = 0.6; // score × 0.6 por cada aparição nos últimos hooks do cliente
const FOLGA_FORA_DO_RANKING = 0.05; // fora do top-6/n<10: abaixo de quem tem evidência, nunca zero
const LIMIAR_REGRA_DURA = 3; // mecanismo em ≥3 dos últimos 5 não é principal se houver alternativa forte
const ALTERNATIVA_FORTE = 0.8; // ...alternativa = base ≥ 0.8 × base do topo

const fmtLift = (n: number) => n.toFixed(2).replace(".", ",");

export function selectHook(
  candidatos: HookCandidate[],
  rankScore: Map<string, number>, // mecanismo → lift_lb (IC inferior do lift)
  opts: { recentes?: string[]; nVariantes?: number } = {}
): { principal: HookCandidate; variantes: HookCandidate[]; motivo: string } | null {
  const { recentes = [], nVariantes = 3 } = opts;
  const valid = candidatos.filter((c) => c?.hook?.trim());
  if (!valid.length) return null;

  // Base: lift_lb do ranking. Fora dele, o menor lift_lb presente menos a folga — zero nunca
  // seria escolhido, empate daria a quem não tem evidência o mesmo peso de quem tem.
  // Piso positivo: base negativa inverteria a penalidade (mais usos → score maior).
  const piso = rankScore.size ? Math.max(0.01, Math.min(...rankScore.values()) - FOLGA_FORA_DO_RANKING) : 0;
  const base = (m: string) => rankScore.get(m) ?? piso;
  const usos = (m: string) => recentes.filter((r) => r === m).length;
  const score = (c: HookCandidate) => base(c.mecanismo) * PENALIDADE_USO ** usos(c.mecanismo);

  // ordem estável: score desc, preservando a ordem original no empate
  const ordenar = (f: (c: HookCandidate) => number) =>
    valid.map((c, i) => ({ c, i })).sort((a, b) => f(b.c) - f(a.c) || a.i - b.i).map((x) => x.c);
  const ordered = ordenar(score);
  const topo = ordenar((c) => base(c.mecanismo))[0]; // maior score BRUTO, sem penalidade

  // Regra dura: o topo bruto saturado (≥3 dos últimos 5) só cede se houver alternativa com
  // evidência comparável — sem ela, repetir o que funciona ainda é a melhor aposta. Com 0.6^usos
  // e 5 recentes a penalidade já garante isso sozinha; a regra é o invariante que sobrevive se
  // alguém afrouxar a constante.
  const saturado = usos(topo.mecanismo) >= LIMIAR_REGRA_DURA;
  const alternativaForte = valid.some(
    (c) => c.mecanismo !== topo.mecanismo && base(c.mecanismo) >= ALTERNATIVA_FORTE * base(topo.mecanismo)
  );
  const principal =
    (saturado && alternativaForte ? ordered.find((c) => c.mecanismo !== topo.mecanismo) : undefined) ?? ordered[0];

  // motivo: só o que veio do ranking ou dos recentes — nada inventado
  const lb = rankScore.get(principal.mecanismo);
  let motivo: string;
  if (!rankScore.size) motivo = "sem ranking: ordem do modelo";
  else if (principal.mecanismo !== topo.mecanismo)
    motivo =
      `${topo.mecanismo} penalizado: ${usos(topo.mecanismo)} dos últimos ${recentes.length} hooks deste cliente; ` +
      `principal ${principal.mecanismo}${lb != null ? ` (IC inferior do lift ${fmtLift(lb)})` : " (fora do ranking)"}`;
  else if (lb != null) motivo = `${principal.mecanismo}: IC inferior do lift ${fmtLift(lb)}`;
  else motivo = `${principal.mecanismo}: fora do ranking (sem evidência mínima), ordem do modelo`;

  // variantes: mecanismos distintos entre si E do principal, priorizando os mais bem
  // ranqueados; completa com o que sobrar se faltarem mecanismos distintos.
  const restantes = ordered.filter((c) => c !== principal);
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
  return { principal, variantes, motivo };
}
