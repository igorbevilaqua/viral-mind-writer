// Gate de maturidade do flywheel (plano 012, WP-C.4).
// Roteiro publicado há <14 dias ainda está acumulando views: resultado fica
// "em observação" com score neutro e NUNCA vira anti-padrão.
// Módulo separado de lib/etl.ts para ser testável sem env de Supabase/Anthropic.

export const MATURITY_DAYS = 14;

export type Verdict = "repetir" | "evitar" | "neutro";

export interface MaturityGate {
  maduro: boolean;
  em_observacao: boolean;
  verdict: Verdict;
  score: number;
}

export function maturityGate(ratio: number | null, publishedAt: string | null, now = Date.now()): MaturityGate {
  const ts = publishedAt ? Date.parse(publishedAt) : NaN;
  // sem published_at (roteiros antigos) = idade desconhecida → trata como em observação
  const maduro = Number.isFinite(ts) && now - ts >= MATURITY_DAYS * 86_400_000;
  // limiares do plano 012 (WP-D.3): repita >1.2x, evite <0.8x — só depois de maduro
  const verdict: Verdict =
    !maduro || ratio == null ? "neutro" : ratio < 0.8 ? "evitar" : ratio > 1.2 ? "repetir" : "neutro";
  return { maduro, em_observacao: !maduro, verdict, score: maduro ? ratio ?? 0 : 0 };
}
