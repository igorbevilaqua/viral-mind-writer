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
  // Travessão é proibido no texto final (requisito do humanizador) — tolerância zero.
  const dashes = (text.match(/—|\s–\s/g) ?? []).length;
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
