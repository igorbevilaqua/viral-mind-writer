// Helpers puros de resiliência de geração (plano 012 WP-A).
// Sem import de lib/db — importável por client components e pelos testes vitest.

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// generating há mais que isso = geração morta (deploy, crash, timeout) → recuperável.
export const STALE_GENERATION_MS = 10 * 60_000;

// Sessão presa em generating: started_at null cobre linhas pré-migration 0010.
export function isStaleGeneration(
  status: string,
  generationStartedAt: string | null | undefined,
  now: number = Date.now()
): boolean {
  if (status !== "generating") return false;
  if (!generationStartedAt) return true;
  return now - new Date(generationStartedAt).getTime() > STALE_GENERATION_MS;
}

// Rótulo curto de cada fase da sala. Mora aqui, e não na tela, porque três lugares leem a MESMA
// fase: o stepper da geração ao vivo, o bloco de acompanhamento e a lista de sessões.
export const PHASE_SHORT: Record<string, string> = {
  premissa: "Premissa",
  pesquisa: "Pesquisa",
  modelagem: "Autópsia",
  narrativas: "Narrativas",
  roteiro: "Roteiro",
  hook_comando: "Hook + CTA",
  revisao: "Revisão",
  humanizacao: "Humanização",
  salvando: "Salvando",
  verificacao: "Verificação",
};

/**
 * Fase corrente de uma geração, lida de `vm_sessions.debug.phase` — runPipeline grava a cada
 * troca de fase justamente para quem só ACOMPANHA (outra aba, reload) saber onde a sala está.
 * `null` quando não há nada persistido, quando o dump é de outro run (`init`) ou quando a fase
 * não é conhecida por esta versão do front.
 */
export function faseDeDebug(debug: unknown): string | null {
  if (!debug || typeof debug !== "object" || Array.isArray(debug)) return null;
  const p = (debug as { phase?: unknown }).phase;
  return typeof p === "string" && PHASE_SHORT[p] ? p : null;
}

/**
 * Esta aba pode disparar uma geração agora? Decidido pelo ESTADO (status do banco), nunca por
 * query param — param fica stale e mente. Um dono só por sessão:
 * - premissa pendente espera decisão humana; gerar aqui re-paga transcrição e autópsia para
 *   voltar exatamente ao mesmo estado;
 * - `generating` não-stale pertence a outra conexão — esta aba acompanha, não reprocessa.
 */
export function podeGerar(o: {
  status: string;
  generationStale: boolean;
  /** já existe uma geração em curso NESTA aba */
  gerandoAqui: boolean;
  premissaPendente: boolean;
}): boolean {
  if (o.gerandoAqui || o.premissaPendente) return false;
  if (o.status === "closed") return false;
  return !(o.status === "generating" && !o.generationStale);
}

// Ponto único de guarda do emit: cliente desconectou → controller.enqueue lança →
// todo emit seguinte vira no-op e o pipeline continua até salvar no banco.
export function guardEmit<T>(emit: (e: T) => void): (e: T) => void {
  let closed = false;
  return (e) => {
    if (closed) return;
    try {
      emit(e);
    } catch {
      closed = true;
    }
  };
}
