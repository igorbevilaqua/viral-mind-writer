import type { ModelagemAnalysis } from "./types";

// O brief de replicação é COMPOSTO EM CÓDIGO, não escrito pelo modelo: a fronteira do que
// atravessa é decidida aqui, não pela obediência de um LLM. Fica fora de modelagem.ts (que
// carrega lib/db) para ser função pura testável — as asserções vivem em
// tests/modelagem-brief.test.ts.
//
// FRONTEIRA (revisada — antes o brief carregava só o `esqueleto`):
// a missão da modelagem é EXTRAIR A TESE do original e escrever uma versão MELHOR dela, não
// fugir do ângulo dele. Então a linha divisória deixou de ser "conteúdo vs mecânica" e passou
// a ser **ideia vs texto**:
//   ATRAVESSA → `compreensao.tema` e `compreensao.argumento_central` (a tese a sustentar),
//     `recompensa` e os dois motores (o sentimento a igualar ou superar), `esqueleto` inteiro,
//     `diagnostico.gargalo`/`onde_superamos` (a lista de otimização).
//   NÃO ATRAVESSA → `diagnostico.por_camada[].evidencia` (frase LITERAL da transcrição) e
//     `compreensao.alegacoes` (as afirmações como o vídeo as enuncia, que existem para a
//     pesquisa CHECAR, não para o roteirista repetir), e `promessa_da_abertura` (é o hook dele
//     em forma quase literal — o nosso hook nasce da premissa, não do texto original).
// O plágio segue barrado porque o que atravessa é uma AFIRMAÇÃO, não uma redação: os fatos são
// re-pesquisados e re-verificados antes de entrar, e o texto é escrito do zero.
//
// Teto dobrado (era 1400 e truncava de verdade — havia brief salvo com 1401 chars cortado no
// meio de uma palavra, comendo justamente a cauda com gargalo e timing).
const BRIEF_MAX = 2800;

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
    // A TESE vem primeiro: é o fio condutor da nossa versão, a mesma do original.
    c?.tema && `ASSUNTO: ${c.tema}`,
    c?.argumento_central &&
      `TESE DO ORIGINAL, QUE A NOSSA VERSÃO VAI SUSTENTAR (não fuja dela, defenda-a melhor): ${c.argumento_central}`,
    // O sentimento é alvo, não decoração: replicar e, se possível, potencializar.
    c?.recompensa &&
      `RECOMPENSA A ENTREGAR (o espectador precisa sair com isto — iguale ou supere): ${c.recompensa}`,
    c?.motor_comentario && `O que provoca comentário (reproduza o mesmo efeito, mais forte): ${c.motor_comentario}`,
    c?.motor_compartilhamento && `O que faz compartilhar (reproduza o mesmo efeito, mais forte): ${c.motor_compartilhamento}`,
    "ARQUITETURA A REPLICAR (a mecânica e a curva emocional, jamais o texto):",
    `Abertura: ${e.hook.funcao ?? e.hook.mecanismo}`,
    beats && `Beats:\n${beats}`,
    loops && `Loops abertos:\n${loops}`,
    e.escalada && `Escalada: ${e.escalada}`,
    cmd,
    a.nao_transferivel?.length && `NÃO REPLICAR (não transfere): ${a.nao_transferivel.join("; ")}`,
    // O gargalo é a instrução de otimização mais concreta que existe: diz em QUAL das quatro
    // camadas o original era mais fraco, e é ali que a nossa versão precisa ganhar dele.
    a.diagnostico?.gargalo &&
      `ONDE O ORIGINAL ERA MAIS FRACO (é aqui que a nossa versão ganha dele): ${a.diagnostico.gargalo} — ${a.diagnostico.onde_superamos ?? ""}`.trimEnd(),
    a.timing?.classe && `TIMING: ${a.timing.classe} (${a.timing.contribuicao_pct ?? 0}% do resultado veio da janela)`,
  ]
    .filter(Boolean)
    .join("\n");

  const full = `${header}\n\n${corpo}`;
  return full.length <= BRIEF_MAX ? full : `${full.slice(0, BRIEF_MAX).trimEnd()}…`;
}

// Entendimento do material para a pesquisa dirigida e para o storytelling montar a arquitetura.
// Carrega as alegações e a promessa literal do original, que NÃO vão ao roteirista.
//
// Antes este bloco mandava "não repita o ângulo dele — ataque por outro". Invertido: a missão da
// modelagem é sustentar a MESMA tese com execução melhor, então o argumento central chega como
// premissa a defender. Fugir do ângulo do original era jogar fora justamente o que fez o vídeo
// funcionar.
export function compreensaoBlock(a: ModelagemAnalysis): string {
  const c = a.compreensao;
  if (!c?.tema) return "";
  return [
    `TEMA DO VÍDEO ORIGINAL (é o nosso assunto também): ${c.tema}`,
    c.argumento_central &&
      `TESE DO ORIGINAL — É ESTA QUE VAMOS DEFENDER, MELHOR: ${c.argumento_central}\n` +
        `Não troque a tese por outra. O trabalho é sustentá-la com argumento mais forte, mais prova, ` +
        `linguagem mais simples, hook mais claro e conclusão mais consequente.`,
    c.promessa_da_abertura && `PROMESSA DA ABERTURA DELE (referência de efeito, não de texto): ${c.promessa_da_abertura}`,
    c.recompensa && `RECOMPENSA QUE ELE ENTREGOU (a nossa versão precisa igualar ou superar): ${c.recompensa}`,
    c.motor_comentario && `POR QUE COMENTAM: ${c.motor_comentario}`,
    c.motor_compartilhamento && `POR QUE COMPARTILHAM: ${c.motor_compartilhamento}`,
  ]
    .filter(Boolean)
    .join("\n");
}
