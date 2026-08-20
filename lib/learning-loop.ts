// Funções puras do ciclo de autoaprimoramento (plano 012, WP-E).
// Sem imports de Supabase/Anthropic — testáveis em vitest puro (padrão etl-gate.ts).

// ── WP-E.4: decisão de edição substantiva ────────────────────────────────────

// Fração da "massa de caracteres" alterada entre as versões, via multiset de
// palavras. ponytail: reordenação pura conta como igual — heurística barata e
// explicável; trocar por diff real (LCS) se gerar falso negativo relevante.
export function changedRatio(original: string, editada: string): number {
  const words = (s: string) => s.toLowerCase().split(/\s+/).filter(Boolean);
  const mass = (ws: string[]) => ws.reduce((n, w) => n + w.length, 0);
  const a = words(original);
  const b = words(editada);
  const total = Math.max(mass(a), mass(b));
  if (!total) return 0;
  const pool = new Map<string, number>();
  for (const w of a) pool.set(w, (pool.get(w) ?? 0) + 1);
  let comum = 0;
  for (const w of b) {
    const c = pool.get(w) ?? 0;
    if (c > 0) {
      comum += w.length;
      pool.set(w, c - 1);
    }
  }
  return 1 - comum / total;
}

// Edição só vira aprendizado quando mexeu em >~10% dos chars (plano 012, WP-E.4).
export function isSubstantiveEdit(original: string, editada: string, threshold = 0.1): boolean {
  return changedRatio(original, editada) > threshold;
}

// ── Peça 3 §7.2/§16.1: quem tem direito de alimentar o Professor ─────────────

export interface TraceEdicao {
  roteiro_original?: string;
  edicao_humana?: boolean;
  correcao_factual?: boolean;
}

// Merge do trace na escrita do roteiro (updateScript). `roteiro_original` é preservado
// nas DUAS origens — a correção factual também precisa ser revertível; só o rótulo muda.
export function marcarOrigemEdicao(
  trace: TraceEdicao,
  roteiroAnterior: string,
  origem: "humano" | "correcao_factual"
): TraceEdicao {
  // sempre o texto da sala, nunca de edição anterior
  const base = { ...trace, roteiro_original: trace.roteiro_original ?? roteiroAnterior };
  return origem === "humano" ? { ...base, edicao_humana: true } : { ...base, correcao_factual: true };
}

// O portão do aprendizado por edição. Lê `edicao_humana` e NUNCA `roteiro_original`:
// a correção factual de máquina também grava `roteiro_original`, então decidir por esse
// campo faria o Professor extrair lição da própria correção ("prefira 4,5 bi a 45 bi"),
// que não é regra de escrita nenhuma — a lição envenenada do §7.2. NÃO "simplifique"
// isto de volta para `trace.roteiro_original`.
// Legado seguro: updateScript sempre gravou os dois campos no MESMO objeto literal, então
// todo roteiro que tem `roteiro_original` hoje também tem `edicao_humana`.
export function houveEdicaoHumana(trace: TraceEdicao): boolean {
  return trace.edicao_humana === true;
}

// ── Peça 3 §7.1: a correção cirúrgica não precisa de LLM ─────────────────────

// A verificação já achou os dois lados (o trecho errado e o dado certo), então não há o
// que gerar: a correção é `split/join` sobre o campo.
// A substituição GLOBAL é benigna aqui. Trocar todas as ocorrências é o avesso do conserto
// para repetição estilística — é o motivo de a peça 2 ter recusado o retry cirúrgico
// (016 §4.4) — mas para um dado errado é exatamente o certo: `45 bilhões` errado é errado
// em toda aparição.
// null (nunca throw, §11) = o trecho não casa: ou o modelo parafraseou em vez de copiar,
// ou o roteiro mudou depois da verificação. O veredicto sobrevive; só a ação automática cai.
export function aplicarCorrecaoLiteral(roteiro: string, trecho_literal: string, correcao: string): string | null {
  // trecho vazio casa em tudo e `split("")` estilhaçaria o roteiro em caracteres
  if (!trecho_literal || !roteiro.includes(trecho_literal)) return null;
  return roteiro.split(trecho_literal).join(correcao);
}

// ── `falso` não tem correção pronta: o caminho dele é o Bob ──────────────────

/**
 * `impreciso` traz `correcao` (o dado certo, pronto para troca literal); `falso` NÃO traz
 * substituto nenhum — a verificação sabe que a afirmação não se sustenta, não o que dizer no
 * lugar. Por isso ele não pode ir pelo caminho do `impreciso`: aquele troca `trecho_literal`
 * por `correcao`, que aqui é `null`, e o roteiro perderia o trecho.
 * O portão em si é o mesmo do `podeAplicar`: sem o trecho literal no roteiro ATUAL não há o
 * que substituir depois que o Bob responder.
 */
export function podeReescrever(
  item: { veredicto: string; trecho_literal?: string | null },
  roteiro: string
): boolean {
  return item.veredicto === "falso" && !!item.trecho_literal && roteiro.includes(item.trecho_literal);
}

/**
 * O que o Bob recebe para não errar de novo no lugar do erro.
 * ponytail: usa `explicacao` + `fonte`, e NÃO o texto bruto da busca — ele nunca foi
 * persistido em `verificacao` (o registro guarda só fonte e explicação), e persistir custaria
 * KBs de jsonb por roteiro para reproduzir algo que o Bob já sabe buscar: ele tem
 * `pesquisar_web`, e a explicação do verificador já diz o que é falso e qual é o dado real.
 * Persistir `ItemBusca.busca.texto` só se na prática o Bob começar a errar por falta de contexto.
 * A proibição vem no primeiro parágrafo de propósito: enterrada no fim, o modelo a ignora.
 */
export function instrucaoReescritaFalso(item: {
  explicacao?: string;
  fonte?: { url?: string; veiculo?: string; ano?: string } | null;
}): string {
  const f = item.fonte;
  const fonte = f?.url
    ? `\n\nFONTE QUE DERRUBOU A AFIRMAÇÃO: ${[f.veiculo, f.ano].filter(Boolean).join(", ") || "fonte"} — ${f.url}`
    : "";
  return `Este trecho foi verificado e REPROVADO: a afirmação é factualmente FALSA. Reescreva o trecho dizendo o que é verdade, ou tire a afirmação e preserve só o papel dela no roteiro. NUNCA repita a afirmação falsa, nem amaciada por hedge ("pode ser que", "há indícios de", "alguns dizem"). Se não tiver um fato sólido para pôr no lugar, PESQUISE antes de escrever; se ainda assim não achar, reescreva SEM nenhuma afirmação factual nova em vez de inventar uma.

O QUE O VERIFICADOR APUROU: ${item.explicacao?.trim() || "a afirmação não se sustenta nas fontes."}${fonte}`;
}

// ── WP-E.3: calibração previsto×real do agente Dados ─────────────────────────

export interface CalibrationPayload {
  n: number;
  insuficiente?: true;
  // % de acerto entre previsões "com opinião": previsto>60 devia dar ratio>1, previsto<40 ratio<1
  correlacao_direcional: number | null;
  // média de (previsto/100 − min(ratio/2, 1)); >0 = o Dados superestima o potencial
  vies: number | null;
  resumo: string;
}

export function computeCalibration(
  rows: { predicted: number | null | undefined; ratio: number | null | undefined }[]
): CalibrationPayload {
  const valid = rows.filter(
    (r): r is { predicted: number; ratio: number } =>
      typeof r.predicted === "number" && Number.isFinite(r.predicted) &&
      typeof r.ratio === "number" && Number.isFinite(r.ratio)
  );
  const n = valid.length;
  if (n < 5) {
    return {
      n,
      insuficiente: true,
      correlacao_direcional: null,
      vies: null,
      resumo: `Apenas ${n} outcome(s) maduro(s) com previsão — amostra insuficiente para calibrar.`,
    };
  }
  // direcional: só previsões fora da zona morta 40-60 contam como "opinião"
  const direcionais = valid.filter((r) => r.predicted > 60 || r.predicted < 40);
  const acertos = direcionais.filter(
    (r) => (r.predicted > 60 && r.ratio > 1) || (r.predicted < 40 && r.ratio < 1)
  ).length;
  const correlacao = direcionais.length ? Math.round((100 * acertos) / direcionais.length) : null;
  // ratio normalizado a 0-1 (2x a média do cliente = 1.0) pra comparar com previsto/100
  const vies =
    Math.round((valid.reduce((s, r) => s + (r.predicted / 100 - Math.min(r.ratio / 2, 1)), 0) / n) * 100) / 100;
  const resumo = `Em ${n} roteiros maduros, ${
    correlacao == null
      ? "nenhuma previsão saiu da zona neutra (score 40-60)"
      : `suas previsões fortes (score >60 ou <40) acertaram a direção em ${correlacao}% dos casos`
  }; viés médio ${vies > 0 ? "+" : ""}${vies} (positivo = você superestima o potencial).`;
  return { n, correlacao_direcional: correlacao, vies, resumo };
}

// ── Fase 2: ranking de mecanismos de hook por escopo ─────────────────────────
// A partir das classificações canônicas dos hooks de ALTA PERFORMANCE (vm_hook_classifications,
// só entram vencedores), rankeia por FREQUÊNCIA o mecanismo que caracteriza os vencedores de
// cada cliente + global. Frequência entre vencedores = "aposte neste mecanismo aqui".
export interface HookMecRank {
  mecanismo: string;
  n: number;
  share: number; // fração dos hooks vencedores do escopo que usam este mecanismo
}

export function rankHookMechanisms(
  rows: { mecanismos: string[]; clienteId: string | null }[],
  minSample = 8,
  topK = 6
): { scope: string; total: number; ranking: HookMecRank[] }[] {
  // agrupa por escopo: "global" (todos) + "client:<id>" (cada cliente)
  const buckets = new Map<string, { mecanismos: string[] }[]>();
  const push = (scope: string, r: { mecanismos: string[] }) => buckets.set(scope, [...(buckets.get(scope) ?? []), r]);
  for (const r of rows) {
    push("global", r);
    if (r.clienteId) push(`client:${r.clienteId}`, r);
  }

  const out: { scope: string; total: number; ranking: HookMecRank[] }[] = [];
  for (const [scope, list] of buckets) {
    if (list.length < minSample) continue; // amostra insuficiente: não emite ranking ruidoso
    const count = new Map<string, number>();
    for (const r of list) for (const m of new Set(r.mecanismos)) count.set(m, (count.get(m) ?? 0) + 1);
    const ranking = [...count.entries()]
      .map(([mecanismo, n]) => ({ mecanismo, n, share: Math.round((n / list.length) * 100) / 100 }))
      .sort((a, b) => b.n - a.n)
      .slice(0, topK);
    out.push({ scope, total: list.length, ranking });
  }
  return out;
}

// ── Fase 4: performance dos mecanismos de hook NA PRÓPRIA SALA ───────────────
// Junta os outcomes maduros (ratio real) com o mecanismo do hook gravado no
// pipeline_trace (Fase 3). É o feedback mais direto que existe: mecanismo com
// ratio mediano >1.2 é padrão a promover no playbook; <0.8 é anti-padrão.
export interface HookMecOutcome {
  mecanismo: string;
  n: number;
  ratio_mediano: number;
  verdict: "promover" | "derrubar" | "neutro";
}
export function hookMechanismOutcomes(
  outcomes: { ratio: number | null | undefined; mecanismo: string | null | undefined }[],
  minPorMecanismo = 3
): HookMecOutcome[] {
  const byMec = new Map<string, number[]>();
  for (const o of outcomes) {
    if (!o.mecanismo || typeof o.ratio !== "number" || !Number.isFinite(o.ratio)) continue;
    byMec.set(o.mecanismo, [...(byMec.get(o.mecanismo) ?? []), o.ratio]);
  }
  const med = (a: number[]) => {
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  return [...byMec.entries()]
    .filter(([, r]) => r.length >= minPorMecanismo)
    .map(([mecanismo, r]) => {
      const ratio = Math.round(med(r) * 100) / 100;
      return {
        mecanismo,
        n: r.length,
        ratio_mediano: ratio,
        verdict: ratio > 1.2 ? ("promover" as const) : ratio < 0.8 ? ("derrubar" as const) : ("neutro" as const),
      };
    })
    .sort((a, b) => b.ratio_mediano - a.ratio_mediano);
}

// ── WP-E.5: atribuição lição×outcome ─────────────────────────────────────────

export interface LessonAttribution {
  lessonId: string;
  usos: number;
  ratio_mediano: number;
  needs_review: boolean; // ≥2 usos com mediana <0.8 → revisão humana (nunca desativa sozinho)
}

export function attributeLessons(
  outcomes: { ratio: number | null | undefined; lessonIds: string[] }[]
): LessonAttribution[] {
  const byLesson = new Map<string, number[]>();
  for (const o of outcomes) {
    if (typeof o.ratio !== "number" || !Number.isFinite(o.ratio)) continue; // sem média do cliente = sem sinal
    for (const id of o.lessonIds) byLesson.set(id, [...(byLesson.get(id) ?? []), o.ratio]);
  }
  return [...byLesson.entries()].map(([lessonId, ratios]) => {
    const sorted = [...ratios].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const mediano = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return { lessonId, usos: ratios.length, ratio_mediano: mediano, needs_review: ratios.length >= 2 && mediano < 0.8 };
  });
}
