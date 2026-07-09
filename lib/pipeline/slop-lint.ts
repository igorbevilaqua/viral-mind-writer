import type { BannedPhrase } from "./types";

export interface LintViolation {
  label: string;
  match: string;
  severity: "block" | "warn";
}

export function slopLint(text: string, phrases: BannedPhrase[]): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const p of phrases) {
    let re: RegExp;
    try {
      re = new RegExp(p.pattern, "gi");
    } catch {
      continue; // regex inválida cadastrada no settings não derruba a geração
    }
    const m = text.match(re);
    if (m) violations.push({ label: p.label ?? p.pattern, match: m[0], severity: p.severity });
  }

  // Heurísticas estruturais
  // Travessão é proibido, com UMA exceção: marca de fala de personagem (início de
  // linha ou logo após "dois-pontos "). Qualquer outro travessão é slop — tolerância zero.
  const dashes = slopDashCount(text);
  if (dashes > 0) {
    violations.push({ label: `travessão proibido (${dashes}x)`, match: "—", severity: "block" });
  }

  const consecutiveE = text.match(/(^|[.!?]\s+)E\s+[^.!?]+[.!?]\s+E\s/m);
  if (consecutiveE) {
    violations.push({ label: "frases consecutivas começando com 'E'", match: consecutiveE[0].slice(0, 60), severity: "warn" });
  }

  return violations;
}

export const blockCount = (v: LintViolation[]) => v.filter((x) => x.severity === "block").length;

// Travessão de fala de personagem: início de linha (após espaços) ou logo após ": ".
// É a única forma permitida — ex.: "João disse: —Nunca mais volte aqui."
const DIALOGUE_DASH = /(^[ \t]*|:[ \t]+)—/gm;
// Travessão de slop: em-dash em qualquer lugar, ou en-dash usado como travessão (" – ").
const SLOP_DASH = /—|\s–\s/g;

// Conta só os travessões de slop, ignorando os de fala.
function slopDashCount(text: string): number {
  return (text.replace(DIALOGUE_DASH, "$1 ").match(SLOP_DASH) ?? []).length;
}

// Remove todo travessão de slop (vira vírgula), preservando os de fala de personagem.
// Determinístico: a garantia final de "zero travessão" não depende do LLM obedecer.
export function dedash(text: string): string {
  const KEEP = " __KEEPDASH__ "; // sentinela pra proteger o travessão de fala
  return text
    .replace(DIALOGUE_DASH, (m) => m.replace("—", KEEP))
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s+–\s+/g, ", ")
    .replace(/,\s*,/g, ",")
    .split(KEEP)
    .join("—");
}

// Aplica dedash em toda string dentro de um objeto/array (artefatos aninhados).
export function deepDedash<T>(value: T): T {
  if (typeof value === "string") return dedash(value) as T;
  if (Array.isArray(value)) return value.map(deepDedash) as unknown as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deepDedash(v)])
    ) as T;
  }
  return value;
}
