// Autorização do writer — dono nas mutações, adm nas decisões globais.
// Fonte da verdade: plans/seguranca-dono-e-adm.md.
//
// Existe UM resolvedor e ele LANÇA. Devolver booleano é o buraco silencioso desta peça: quem
// esquece de olhar o retorno não escreve código quebrado, escreve código inseguro que passa
// no gate. Aqui, esquecer de chamar é a única falha possível, e ela aparece no teste.
//
// ⚠️ Depende de cookies() (via writerScope). Só pode ser chamado NA FRONTEIRA: server action,
// ou o começo do handler da rota, ANTES de abrir o ReadableStream. Dentro do start() do stream
// o contexto da request já respondeu e a leitura estoura (lib/hub.ts:41).
import { appDb } from "./db";
import { writerScope } from "./hub";

export class ErroDeAcesso extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroDeAcesso";
  }
}

/** O que se está tentando tocar. `adm` não tem dono: é decisão que vale para todos os clientes. */
export type Alvo = { sessao: string } | { script: string } | { thread: string } | { adm: string };

/**
 * A decisão, pura e sem I/O — é o que os testes cobrem.
 *
 * `isAdmin` vem do writerScope (lib/hub.ts:36), que continua sendo a única definição de "adm"
 * do writer; este módulo não reimplementa `papel === "adm"`.
 *
 * Dono nulo ou usuário anônimo nunca casam: linha órfã não pertence a ninguém. É a MESMA regra
 * que /sessions/[id] já aplica na leitura (`!isAdmin && session.user_id !== userId` → notFound),
 * então a escrita não fica mais frouxa que a leitura da mesma sessão.
 */
export function decidirAcesso(t: {
  isAdmin: boolean;
  userId: string | null;
  ownerId: string | null;
}): "adm" | "dono" | "negado" {
  if (t.isAdmin) return "adm";
  if (t.userId && t.ownerId && t.userId === t.ownerId) return "dono";
  return "negado";
}

// A cadeia até o dono. Duas idas ao banco no caso do roteiro, em vez de um embed do PostgREST:
// é a mesma cadeia que a página da sessão percorre, e join implícito que quebre em produção
// trancaria toda edição de roteiro de uma vez.
async function dono(
  alvo: Exclude<Alvo, { adm: string }>
): Promise<{ ownerId: string | null; recado: string }> {
  if ("thread" in alvo) {
    const { data } = await appDb
      .from("vm_kasparov_threads")
      .select("user_id")
      .eq("id", alvo.thread)
      .maybeSingle();
    return { ownerId: (data?.user_id as string | null) ?? null, recado: "esta conversa é de outra pessoa" };
  }
  const recado = "script" in alvo ? "este roteiro é de outra pessoa" : "esta sessão é de outra pessoa";
  let sessao: string | null = "script" in alvo ? null : alvo.sessao;
  if ("script" in alvo) {
    const { data } = await appDb
      .from("vm_generated_scripts")
      .select("session_id")
      .eq("id", alvo.script)
      .maybeSingle();
    sessao = (data?.session_id as string | null) ?? null;
  }
  // Linha inexistente cai aqui: sem sessão não há dono, e negar é o desfecho correto — quem
  // pode mesmo mexer (o adm) já saiu na primeira linha de exigirAcesso.
  if (!sessao) return { ownerId: null, recado };
  const { data } = await appDb.from("vm_sessions").select("user_id").eq("id", sessao).maybeSingle();
  return { ownerId: (data?.user_id as string | null) ?? null, recado };
}

/** Lança ErroDeAcesso quando o usuário logado não pode agir sobre o alvo. Adm sempre passa. */
export async function exigirAcesso(alvo: Alvo): Promise<void> {
  const { isAdmin, userId } = await writerScope();
  // Adm passa por tudo, e sai antes de qualquer leitura: é a mesma semântica do writerScope.
  if (isAdmin) return;
  if ("adm" in alvo)
    throw new ErroDeAcesso(`${alvo.adm} muda o sistema para todo mundo — só o administrador decide isso`);
  const { ownerId, recado } = await dono(alvo);
  if (decidirAcesso({ isAdmin, userId, ownerId }) === "negado") throw new ErroDeAcesso(recado);
}

/**
 * Fronteira das rotas: devolve a resposta 403 pronta (corpo curto, nunca 500) ou `null` quando
 * está liberado. Uso: `const barrado = await barrarNaRota(...); if (barrado) return barrado;`
 * SEMPRE antes de abrir o stream — depois dele não há cookies() para ler.
 */
export async function barrarNaRota(alvo: Alvo): Promise<Response | null> {
  try {
    await exigirAcesso(alvo);
    return null;
  } catch (e) {
    if (e instanceof ErroDeAcesso) return new Response(e.message, { status: 403 });
    throw e;
  }
}
