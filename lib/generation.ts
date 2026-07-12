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
