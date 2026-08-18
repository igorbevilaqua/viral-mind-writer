import { getNextCalibrationPair, setLearningActive, submitCalibrationVote } from "@/lib/actions";
import { appDb } from "@/lib/db";
import { UUID_RE } from "@/lib/generation";
import { sseResponse } from "@/lib/sse";
import { currentUserId, writerScope } from "@/lib/hub";
import { barrarNaRota } from "@/lib/autorizacao";
import { comparacaoFewShot, loadContextAvulso } from "@/lib/pipeline/context";
import { origemDoDebate, proporDestilacao, turnoKasparov } from "@/lib/pipeline/kasparov";
import {
  decidirCriterioDb,
  proximaPendencia,
  responder,
  type FilasDeps,
  type Pendencia,
  type Resposta,
} from "@/lib/pipeline/kasparov-filas";
import { blocoDeVideo, urlDeVideo } from "@/lib/pipeline/kasparov-video";

// Transcrição + autópsia + debate longo. É o teto do /api/generate, pela mesma razão.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// ────────────────────────────────────────────────────────────────────────────
// 018 §10 — a rota do debate. Molde do /api/bob: valida o payload → guardEmit →
// phase/done/error. É o único lugar do pacote onde SSE se justifica: resposta de
// debate é longa (a classificação da peça 1 leva ~3s e não transmite nada).
//
// O wiring das filas mora AQUI e não em kasparov-filas.ts: `lib/actions.ts` é
// "use server" (todo export vira endpoint) e o módulo das filas não pode importá-lo.
//
// Requer a migration 0030 (vm_kasparov_threads + vm_kasparov_messages). Enquanto ela
// não for aplicada esta rota devolve 500 com a mensagem do Postgres, e é o certo:
// conversa que não persiste não é conversa, e fallback em memória fingiria que sim.
// ────────────────────────────────────────────────────────────────────────────

const FILAS: FilasDeps = {
  proximoPar: getNextCalibrationPair,
  votar: submitCalibrationVote,
  ativarLicao: setLearningActive,
  comparacaoCriterio: comparacaoFewShot,
  // quem decidiu fica na linha: é a única forma de saber depois de quem foi a troca de critério
  decidirCriterio: async (criterio, amostra) => decidirCriterioDb(criterio, amostra, await currentUserId()),
};

const RESPOSTAS: Resposta[] = ["a", "b", "skip", "ativar", "rejeitar"];

// Regra 2: das quatro filas, duas terminam em decisão global — ativar a lição a põe no prompt de
// todos, e o critério do few-shot troca ~4 dos 5 exemplos que a sala imita. Calibração e métrica
// são commons e seguem abertas. `decidirCriterioDb` é chamado só daqui, então este é o portão dele.
const PENDENCIA_DE_ADM: Record<string, string> = {
  licao: "ativar uma lição",
  criterio: "trocar o critério do few-shot",
};

// Forma do payload, e SÓ isso — `responder` roteia por `p.tipo` e leva o id direto ao banco,
// então objeto solto do cliente viraria update com id `undefined`. A permissão é outra coisa e
// é resolvida logo abaixo, em `PENDENCIA_DE_ADM`: até a peça de segurança, um `learningId` real
// e alheio passava por aqui de forma perfeitamente válida e ativava a lição de outra pessoa.
function pendenciaValida(p: unknown): p is Pendencia {
  const o = p as Partial<Pendencia> | null;
  if (!o || typeof o !== "object") return false;
  if (o.tipo === "calibracao") return typeof (o as { pairId?: unknown }).pairId === "string";
  if (o.tipo === "licao") return typeof (o as { learningId?: unknown }).learningId === "string";
  // A pendência de critério não leva id a lugar nenhum — ela vira a coluna `amostra` (jsonb) da
  // linha da decisão. O que precisa ser barrado aqui é payload fora de forma, não id forjado.
  if (o.tipo === "criterio") {
    const c = o as { views?: unknown; taxa?: unknown };
    return Array.isArray(c.views) && Array.isArray(c.taxa) && c.views.length <= 5 && c.taxa.length <= 5;
  }
  return false;
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const clientId = typeof b?.clientId === "string" && UUID_RE.test(b.clientId) ? b.clientId : null;
  const threadId = typeof b?.threadId === "string" && UUID_RE.test(b.threadId) ? b.threadId : null;

  // ── Resposta de fila (§8): voto ou ativação. Não é debate, não custa token e não
  // transmite nada — JSON puro. O gravador continua sendo o de hoje; nenhuma porta nova.
  if (b?.pendencia !== undefined || b?.resposta !== undefined) {
    if (!pendenciaValida(b?.pendencia)) return new Response("pendência inválida", { status: 400 });
    if (!RESPOSTAS.includes(b?.resposta)) return new Response("resposta inválida", { status: 400 });
    const decisaoGlobal = PENDENCIA_DE_ADM[b.pendencia.tipo];
    if (decisaoGlobal) {
      const barrado = await barrarNaRota({ adm: decisaoGlobal });
      if (barrado) return barrado;
    }
    try {
      await responder(b.pendencia, b.resposta as Resposta, clientId, FILAS);
      return Response.json({ ok: true });
    } catch (e) {
      return new Response(e instanceof Error ? e.message : String(e), { status: 400 });
    }
  }

  const mensagem = typeof b?.mensagem === "string" ? b.mensagem.trim() : "";
  if (!mensagem) return new Response("mensagem obrigatória", { status: 400 });

  // Retomar thread alheia é ler a conversa de outra pessoa e escrever dentro dela. Mesmo
  // tratamento de /sessions/[id]; thread nova (threadId null) não tem dono ainda.
  const barrado = threadId ? await barrarNaRota({ thread: threadId }) : null;
  if (barrado) return barrado;

  // Tudo que depende de cookies() acontece ANTES do stream: dentro do start() o contexto
  // da request já respondeu e a leitura estoura (lib/hub.ts:41). Vale para currentUserId,
  // para writerScope e para proximaPendencia, que passa por getNextCalibrationPair.
  const { isAdmin } = await writerScope();
  const userId = await currentUserId();
  let pendencia = await proximaPendencia(clientId, FILAS).catch(() => null);
  // Cortesia, não autorização (o portão é o PENDENCIA_DE_ADM lá em cima): não se oferece a
  // quem não pode responder — a pendência voltaria a ser sorteada para o adm mais adiante.
  if (!isAdmin && pendencia && PENDENCIA_DE_ADM[pendencia.tipo]) pendencia = null;

  // A thread nasce na primeira mensagem. Sem `id` não há onde gravar, e a tela precisa
  // dele para o turno seguinte e para a procedência da lição (§5.3).
  const { data: thread, error: erroThread } = threadId
    ? await appDb.from("vm_kasparov_threads").select("id, assunto, script_id").eq("id", threadId).single()
    : await appDb
        .from("vm_kasparov_threads")
        .insert({ user_id: userId, client_id: clientId })
        .select("id, assunto, script_id")
        .single();
  if (erroThread || !thread)
    return new Response(`não consegui abrir a conversa: ${erroThread?.message ?? "sem retorno"}`, { status: 500 });

  // O roteiro em discussão, quando a thread nasceu de um (§4). Coluna sem FK forte: roteiro
  // apagado devolve null e o contexto segue sem ele, que é o caso comum hoje.
  const { data: script } = thread.script_id
    ? await appDb.from("vm_generated_scripts").select("roteiro").eq("id", thread.script_id).maybeSingle()
    : { data: null };

  const { data: ultima } = await appDb
    .from("vm_kasparov_messages")
    .select("ordem")
    .eq("thread_id", thread.id)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordem = (ultima?.ordem ?? -1) + 1;

  return sseResponse(async (emit) => {
    const gravar = async (papel: "usuario" | "kasparov", conteudo: string, n: number) => {
      const { error } = await appDb
        .from("vm_kasparov_messages")
        .insert({ thread_id: thread.id, papel, conteudo, ordem: n });
      if (error) throw new Error(`não consegui gravar a mensagem: ${error.message}`);
    };

    try {
      // Vai antes de tudo: a tela manda este id no turno seguinte, e a procedência da
      // lição sai dele. Thread nova sem este evento gravaria a próxima mensagem em outra.
      emit({ type: "thread", threadId: thread.id, origem: origemDoDebate(thread.id) });
      emit({ type: "phase", phase: "pensando" });
      await gravar("usuario", mensagem, ordem);

      const ctx = await loadContextAvulso(clientId);
      const estado = { roteiroAberto: (script?.roteiro as string | null) ?? null, assunto: thread.assunto };

      // §7 — link na frase vira bloco de vídeo composto ANTES da mensagem do usuário.
      let turno = mensagem;
      const url = urlDeVideo(mensagem);
      if (url) {
        emit({ type: "phase", phase: "vendo-video", url });
        const v = await blocoDeVideo(url, { log: ctx.usageLog });
        if (!v.ok) {
          // §11: nunca opinar sobre vídeo que não leu. A recusa é a resposta — o turno
          // não roda, e o que vai à tela é o motivo, com o link.
          await gravar("kasparov", v.erro, ordem + 1);
          await appDb
            .from("vm_kasparov_threads")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", thread.id);
          emit({ type: "done", texto: v.erro, assunto: estado.assunto, pendencia });
          return;
        }
        turno = `${v.bloco}\n\n${mensagem}`;
      }

      emit({ type: "phase", phase: "escrevendo" });
      const { texto, assunto } = await turnoKasparov({
        ctx,
        estado,
        mensagem: turno,
        onToken: (t) => emit({ type: "token", t }),
      });

      await gravar("kasparov", texto, ordem + 1);
      // O assunto é a única linha da conversa que atravessa turnos (§4).
      await appDb
        .from("vm_kasparov_threads")
        .update({ assunto, updated_at: new Date().toISOString() })
        .eq("id", thread.id);

      // §5 — proposta, nunca gravação: quem grava é a confirmação da peça 1. `null` é o
      // desfecho padrão, e destilação que falha não derruba o turno que já respondeu.
      emit({ type: "phase", phase: "destilando" });
      const proposta = await proporDestilacao({ ctx, estado: { ...estado, assunto }, mensagem, resposta: texto }).catch(
        (e) => {
          console.error("kasparov: destilação falhou (turno segue sem proposta)", e);
          return null;
        }
      );

      emit({ type: "done", texto, assunto, proposta, pendencia });
    } catch (e) {
      emit({ type: "error", message: e instanceof Error ? e.message : String(e) });
    }
  });
}
