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
