import type { ModelagemAnalysis } from "./types";

// O brief de replicação é COMPOSTO EM CÓDIGO, não escrito pelo modelo: só campos do
// `esqueleto` entram, então é estruturalmente impossível vazar uma frase do vídeo
// original para o roteirista. Fica fora de modelagem.ts (que carrega lib/db) para ser
// função pura testável — a asserção anti-cópia vive em tests/modelagem-brief.test.ts.
//
// NUNCA incluir aqui: `diagnostico.por_camada[].evidencia` (é citação literal do
// original) e `angulos` (viajam como narrativas candidatas, não como arquitetura).
const BRIEF_MAX = 1200;

export function composeBrief(a: ModelagemAnalysis, resumoMetricas = ""): string {
  const e = a.esqueleto;
  if (!e?.estrutura_narrativa || !e.hook?.tipo) return "";

  const header = [
    `ESTRUTURA-BASE: ${e.estrutura_narrativa}`,
    `HOOK: ${e.hook.tipo}${e.hook.mecanismo ? ` (${e.hook.mecanismo})` : ""}`,
    resumoMetricas && `MÉTRICAS REAIS: ${resumoMetricas}`,
  ]
    .filter(Boolean)
    .join(" | ");

  const beats = (e.beats ?? [])
    .map((b) => `${b.ordem}. ${b.funcao} — ${b.mecanismo_de_atencao} [${b.emocao}]`)
    .join("\n");
  const loops = (e.loops_abertos ?? [])
    .map((l) => `- ${l.o_que_fica_pendente} (fecha no beat ${l.fecha_em_qual_beat})`)
    .join("\n");
  const cmd = e.comando?.tipo
    ? `Comando: ${e.comando.tipo}${e.comando.gatilho ? ` via ${e.comando.gatilho}` : ""}${
        e.comando.posicao ? ` (${e.comando.posicao})` : ""
      }`
    : "";

  const corpo = [
    "ARQUITETURA A REPLICAR (a mecânica, jamais o texto):",
    `Abertura: ${e.hook.funcao ?? e.hook.mecanismo}`,
    beats && `Beats:\n${beats}`,
    loops && `Loops abertos:\n${loops}`,
    e.escalada && `Escalada: ${e.escalada}`,
    cmd,
    a.nao_transferivel?.length && `NÃO REPLICAR (não transfere): ${a.nao_transferivel.join("; ")}`,
    a.diagnostico?.gargalo &&
      `GARGALO DO ORIGINAL: ${a.diagnostico.gargalo} — ${a.diagnostico.onde_superamos ?? ""}`.trimEnd(),
    a.timing?.classe && `TIMING: ${a.timing.classe} (${a.timing.contribuicao_pct ?? 0}% do resultado veio da janela)`,
  ]
    .filter(Boolean)
    .join("\n");

  const full = `${header}\n\n${corpo}`;
  return full.length <= BRIEF_MAX ? full : `${full.slice(0, BRIEF_MAX).trimEnd()}…`;
}
