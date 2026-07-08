import type { Dimensao } from "@/lib/pipeline/teach";

// Ordem e rótulos das dimensões de aprendizado (Ensinar) — usados no wizard e na lição.
export const DIMENSAO_ORDER: Dimensao[] = ["hook", "storytelling", "tema", "ritmo", "comando", "geral"];

export const DIMENSAO_LABEL: Record<Dimensao, string> = {
  hook: "Hook",
  storytelling: "Storytelling",
  tema: "Tema",
  ritmo: "Ritmo",
  comando: "Comando",
  geral: "Geral",
};

export const DIMENSAO_CLS: Record<Dimensao, string> = {
  hook: "border-gold/40 bg-gold/[.08] text-gold",
  storytelling: "border-violet-500/40 bg-violet-500/[.08] text-violet-300",
  tema: "border-sky-500/40 bg-sky-500/[.08] text-sky-300",
  ritmo: "border-emerald-500/40 bg-emerald-500/[.08] text-emerald-300",
  comando: "border-amber-500/40 bg-amber-500/[.08] text-amber-300",
  geral: "border-white/25 bg-white/[.05] text-white/70",
};
