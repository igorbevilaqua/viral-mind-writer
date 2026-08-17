import { ANALYST_MODEL, trackedStream, type UsageLog } from "../anthropic";
import { agentPrompt, taughtBlock } from "./agents";
import { clientPrefsBlock } from "./draft";
import type { GenerationContext } from "./types";

// O que o turno do Kasparov recebe além do estado que já vive no GenerationContext:
// o roteiro em discussão (quando existe) e o assunto corrente da thread, em UMA linha.
// Nada aqui é lista, e é de propósito — ver montarContexto.
export interface EstadoDaThread {
  roteiroAberto?: string | null;
  assunto?: string | null;
}

// ────────────────────────────────────────────────────────────────────────────
// 018 §4 — o turno N NÃO recebe os turnos 1..N-1. Recebe o estado do sistema:
// playbooks por referência, lições ativas, prefs do cliente, o roteiro aberto e
// o assunto corrente. Duas razões, e a segunda é a que importa:
//
//   1. custo por turno constante em vez de linear;
//   2. o sistema não pode "lembrar" de algo que não foi gravado numa das quatro
//      casas da peça 1. Se uma conclusão importa, ela vira lição. Se não virou
//      lição, ela DEVE ser esquecida — memória de conversa que sobrevive fora
//      das casas é um segundo repositório de gosto, invisível para os agentes de
//      escrita e impossível de auditar.
//
// ISTO NÃO É UMA LIMITAÇÃO A CORRIGIR DEPOIS. É a decisão (018 §13). Se você veio
// aqui para injetar o histórico da conversa "só pra ele lembrar do turno passado":
// não. A thread é registro para o usuário reler, não insumo do modelo (018 §9), e
// tests/kasparov-contexto.test.ts falha de três jeitos diferentes se isso mudar.
// ────────────────────────────────────────────────────────────────────────────
export function montarContexto(ctx: GenerationContext, estado: EstadoDaThread = {}): string {
  // Cabeçalho fixo: com 0 lições ativas e sem cliente o resto do estado é vazio, e vazio
  // silencioso vira "ele inventou porque não tinha nada" — o mesmo defeito do §11.
  const partes: string[] = [
    "# ESTADO DO SISTEMA\nÉ tudo o que você sabe. O que não está registrado abaixo, o sistema não sabe, e você não finge que sabe.",
  ];

  // Playbook por REFERÊNCIA (slug+version), nunca o texto: é a mesma regra do rastro
  // em draft.ts:212. O texto integral já vive em vm_playbooks e faria o turno crescer
  // sem informação nova para quem está debatendo estratégia.
  const playbooks = ctx.playbookVersions ?? [];
  if (playbooks.length)
    partes.push(
      `# PLAYBOOKS VIGENTES (por referência: cite o slug e a versão quando o lastro for um deles)\n` +
        playbooks.map((p) => `- ${p.slug} v${p.version}`).join("\n")
    );

  // `dados` é o destinatário que já agrega todas as dimensões (015 §6.2), e é o que
  // corresponde a quem discute estratégia. Teto e registro de excedente são os do
  // taughtBlock — reuso deliberado: teto por destinatário é o que mantém o custo do
  // turno constante mesmo quando a base de lições crescer.
  const licoes = taughtBlock(ctx, "dados");
  if (licoes)
    partes.push(`# APRENDIZADOS ATIVOS (curadoria humana: prevalecem sobre padrão do corpus em conflito)\n${licoes}`);

  const prefs = clientPrefsBlock(ctx);
  if (prefs) partes.push(prefs);

  if (estado.roteiroAberto?.trim()) partes.push(`# ROTEIRO ABERTO (o que está em discussão)\n${estado.roteiroAberto.trim()}`);

  // Uma linha, reescrita a cada turno. O colapso de quebras não é cosmético: é o que
  // impede que o assunto vire o depósito onde alguém empilha a conversa inteira.
  const assunto = umaLinha(estado.assunto);
  if (assunto) partes.push(`# ASSUNTO CORRENTE DA THREAD\n${assunto}`);

  return partes.join("\n\n");
}

// ────────────────────────────────────────────────────────────────────────────
// O turno (018 §3, §6, §10)
// ────────────────────────────────────────────────────────────────────────────

// O assunto corrente atravessa turnos, e é o ÚNICO que atravessa. Por isso ele volta
// do modelo pela PRIMEIRA linha da resposta: no fim ele chegaria depois de tudo, e o
// usuário veria o marcador piscar na tela antes de ser cortado.
const MARCADOR = "ASSUNTO:";

const umaLinha = (s?: string | null) => (s ?? "").replace(/\s+/g, " ").trim();

// Puro: separa a linha de assunto do corpo. Sem o marcador (o modelo esqueceu), nada se
// perde — o texto inteiro é resposta e o assunto anterior segue valendo.
export function separarAssunto(bruto: string, anterior?: string | null): { texto: string; assunto: string } {
  const corte = bruto.indexOf("\n");
  const primeira = (corte === -1 ? bruto : bruto.slice(0, corte)).trim();
  if (!primeira.toUpperCase().startsWith(MARCADOR)) return { texto: bruto.trim(), assunto: umaLinha(anterior) };
  return {
    texto: corte === -1 ? "" : bruto.slice(corte + 1).trim(),
    assunto: umaLinha(primeira.slice(MARCADOR.length)) || umaLinha(anterior),
  };
}

// A mesma separação, aplicada ao streaming: segura os tokens até fechar a primeira linha
// e emite só o corpo. ponytail: sem quebra de linha nenhuma na resposta inteira, o filtro
// não emite nada e a tela só recebe o texto do retorno — caso degenerado, não caso comum.
export function filtroDeAssunto(): (pedaco: string) => string {
  let cabecalho = true;
  let buffer = "";
  return (pedaco) => {
    if (!cabecalho) return pedaco;
    buffer += pedaco;
    const corte = buffer.indexOf("\n");
    if (corte === -1) return "";
    cabecalho = false;
    const primeira = buffer.slice(0, corte).trim();
    if (!primeira.toUpperCase().startsWith(MARCADOR)) return buffer;
    return buffer.slice(corte + 1).replace(/^\s+/, "");
  };
}

// `mensagem` é SINGULAR: o que o usuário acabou de dizer. Não existe parâmetro para os
// turnos anteriores, e é essa ausência que mantém o custo por turno constante (018 §4).
// Streaming se justifica aqui e só aqui: resposta de debate é longa, ao contrário da
// classificação de ~3s da peça 1 (018 §10).
export async function turnoKasparov(args: {
  ctx: GenerationContext;
  estado: EstadoDaThread;
  mensagem: string;
  onToken?: (t: string) => void;
  log?: UsageLog;
}): Promise<{ texto: string; assunto: string }> {
  const onToken = args.onToken;
  const filtro = onToken ? filtroDeAssunto() : null;
  const bruto = await trackedStream(
    args.log ?? args.ctx.usageLog,
    "kasparov",
    {
      model: ANALYST_MODEL,
      // Análise e crítica = sonnet (lib/anthropic.ts). Teto folgado porque o modelo
      // pensa antes de responder e o thinking sai do mesmo orçamento: 2000 truncava
      // debate longo no meio.
      max_tokens: 4000,
      system: `${agentPrompt("kasparov")}\n\n${montarContexto(args.ctx, args.estado)}`,
      turno: args.mensagem,
    },
    onToken && filtro
      ? (t) => {
          const visivel = filtro(t);
          if (visivel) onToken(visivel);
        }
      : undefined
  );
  return separarAssunto(bruto, args.estado.assunto);
}

// ────────────────────────────────────────────────────────────────────────────
// Destilação (018 §5) — o ponto onde esta peça pode envenenar a peça 1
//
// O classificador da peça 1 (`classificarEnsinamento`) recebe `texto: string` — as
// palavras CRUAS do usuário — e `vm_lessons.context_note` as guarda literais. É esse
// campo que permite auditar depois se o sistema entendeu ou reescreveu (015 §5).
//
// Num debate de dez turnos essa string NÃO EXISTE: alguém tem que comprimir o acordo
// numa frase, e esse alguém é o Kasparov. Se a frase dele for gravada em context_note
// como se fosse fala do usuário, a auditoria da peça 1 morre em silêncio.
//
// Por isso o que sai daqui é uma PROPOSTA, com as palavras dele, e nada mais: o campo
// que vira `context_note` (`textoCru`) só é montado depois que o usuário confirmar ou
// reescrever a síntese na tela da peça 1. Este módulo não grava e não classifica —
// não existe atalho de "gravar direto quando a confiança for alta" (018 §14.1).
// ────────────────────────────────────────────────────────────────────────────

export interface PropostaDeDestilacao {
  /** as palavras do KASPAROV, para o usuário confirmar ou reescrever — nunca gravadas como fala dele */
  sintese: string;
  /** o que o registro guarda de procedência: nasceu de debate, não de digitação direta */
  origem: "kasparov";
}

// Dois formatos possíveis, e o padrão é o primeiro. Marcador de texto e não tool porque
// `trackedStream` já é a chamada de uma fala só — e é ela que mantém este módulo sem
// nenhum parâmetro por onde a conversa inteira entraria (§4).
const MARCADOR_REGRA = "REGRA:";

const INSTRUCAO_DESTILACAO = `# AGORA: o debate produziu regra nova?

Olhe para o que vocês acabaram de trocar e para o ESTADO DO SISTEMA abaixo. Responda em UM
destes dois formatos, e nada além disso:

NADA NOVO
${MARCADOR_REGRA} <uma frase, nas suas palavras, com a regra acordada>

"NADA NOVO" é o desfecho padrão e o mais frequente: confirmar o que o sistema já sabe não é
aprender, e conclusão que só vale para o roteiro aberto agora morre com a conversa. Só escreva
${MARCADOR_REGRA} quando o acordo for replicável em outro roteiro, sobre outro tema, por outra
pessoa, e quando ainda não estiver nos APRENDIZADOS ATIVOS.

A frase é uma PROPOSTA: ela vai à tela com as SUAS palavras e o usuário confirma ou reescreve
antes de virar registro. Não escreva como se fosse fala dele.`;

/**
 * Puro: lê a resposta da destilação e devolve a síntese, ou `null` quando não houve regra.
 * Qualquer coisa fora do formato cai em `null` — o desfecho seguro é o padrão do produto.
 */
export function separarProposta(bruto: string): string | null {
  const primeira = umaLinha(bruto.split("\n")[0]);
  if (!primeira.toUpperCase().startsWith(MARCADOR_REGRA)) return null;
  return umaLinha(primeira.slice(MARCADOR_REGRA.length)) || null;
}

/**
 * A procedência de uma lição nascida de debate (§5.3). Thread vazia devolve string vazia:
 * `gravarEnsinamento` recusa a gravação em vez de carimbar `/kasparov/undefined`.
 */
export const origemDoDebate = (threadId: string) => (threadId.trim() ? `/kasparov/${threadId.trim()}` : "");

/**
 * Propõe registrar o que foi acordado — ou nada, que é o caso comum (§3, §12.4).
 *
 * `mensagem` e `resposta` são o ÚLTIMO par, ambos no singular: não há parâmetro para os
 * turnos anteriores, pela mesma razão do turno (§4). O que o modelo tem além disso é o
 * estado do sistema, que é o que lhe permite dizer "isso já é lição, nada novo".
 */
export async function proporDestilacao(args: {
  ctx: GenerationContext;
  estado: EstadoDaThread;
  /** o que o usuário acabou de dizer */
  mensagem: string;
  /** o que o Kasparov acabou de responder */
  resposta: string;
  log?: UsageLog;
}): Promise<PropostaDeDestilacao | null> {
  const bruto = await trackedStream(args.log ?? args.ctx.usageLog, "kasparov-destilacao", {
    model: ANALYST_MODEL,
    // Uma frase de saída. Teto baixo de propósito: destilação longa é sintoma de resumo
    // da conversa, que é exatamente o que não pode virar lição.
    max_tokens: 300,
    system: `${agentPrompt("kasparov")}\n\n${INSTRUCAO_DESTILACAO}\n\n${montarContexto(args.ctx, args.estado)}`,
    turno: `VOCÊ ACABOU DE RESPONDER:\n${args.resposta}\n\nO USUÁRIO RESPONDEU:\n${args.mensagem}`,
  });
  const sintese = separarProposta(bruto);
  return sintese ? { sintese, origem: "kasparov" } : null;
}
