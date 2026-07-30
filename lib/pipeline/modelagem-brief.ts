import type { ModelagemAnalysis } from "./types";

// O brief de replicação é COMPOSTO EM CÓDIGO, não escrito pelo modelo: só campos do
// `esqueleto` entram, então é estruturalmente impossível vazar uma frase do vídeo
// original para o roteirista. Fica fora de modelagem.ts (que carrega lib/db) para ser
// função pura testável — a asserção anti-cópia vive em tests/modelagem-brief.test.ts.
//
// De `compreensao` só saem RECOMPENSA e os dois motores de engajamento — são tipo de
// prêmio, não conteúdo, e o roteirista precisa deles como alvo a bater.
// NUNCA incluir aqui: `compreensao.tema`, `compreensao.argumento_central`,
// `compreensao.promessa_da_abertura`, `compreensao.alegacoes` (conteúdo do original, que
// alimenta só a pesquisa e a proposta de ângulos) e `diagnostico.por_camada[].evidencia`
// (citação literal). É por esses campos que a cópia voltava.
const BRIEF_MAX = 1400;

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

  const c = a.compreensao;
  const corpo = [
    c?.recompensa &&
      `RECOMPENSA A ENTREGAR (o espectador precisa sair com isto — iguale ou supere): ${c.recompensa}`,
    c?.motor_comentario && `O que provoca comentário: ${c.motor_comentario}`,
    c?.motor_compartilhamento && `O que faz compartilhar: ${c.motor_compartilhamento}`,
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

// A metade que fica DENTRO da sala: entendimento do material para a pesquisa dirigida e
// para o agente de storytelling propor ângulos novos. Não vai ao roteirista.
export function compreensaoBlock(a: ModelagemAnalysis): string {
  const c = a.compreensao;
  if (!c?.tema) return "";
  return [
    `TEMA DO VÍDEO ORIGINAL: ${c.tema}`,
    c.argumento_central && `ÂNGULO QUE O ORIGINAL USOU (não repita — ataque por outro): ${c.argumento_central}`,
    c.promessa_da_abertura && `PROMESSA DA ABERTURA DELE: ${c.promessa_da_abertura}`,
    c.recompensa && `RECOMPENSA QUE ELE ENTREGOU (a nossa versão precisa igualar ou superar): ${c.recompensa}`,
    c.motor_comentario && `POR QUE COMENTAM: ${c.motor_comentario}`,
    c.motor_compartilhamento && `POR QUE COMPARTILHAM: ${c.motor_compartilhamento}`,
  ]
    .filter(Boolean)
    .join("\n");
}
