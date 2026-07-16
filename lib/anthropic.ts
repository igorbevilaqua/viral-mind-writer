import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

// Rascunho e humanizador = qualidade de escrita; análise e crítica = sonnet.
export const WRITER_MODEL = process.env.VM_WRITER_MODEL ?? "claude-fable-5";
export const ANALYST_MODEL = process.env.VM_ANALYST_MODEL ?? "claude-sonnet-5";

// ── Telemetria de custo por fase (persistida em pipeline_trace.usage) ──
export interface FaseUsage {
  model: string;
  ms: number;
  chamadas: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}
export type UsageLog = Record<string, FaseUsage>;

// Liga um usageLog à sessão/usuário → recordUsage emite um evento 'llm' no hub por
// chamada de LLM. Chave Symbol: não aparece em Object.keys nem em JSON.stringify, então
// não polui o pipeline_trace.usage (que serializa o mesmo objeto).
const HUB_CTX = Symbol("vm.hubCtx");
export function bindUsageLog(log: UsageLog, ctx: { sessaoId: string; userId: string | null }): void {
  (log as unknown as Record<symbol, unknown>)[HUB_CTX] = ctx;
}

// Acumula usage/duração numa fase — retries e chamadas paralelas somam na mesma chave.
// Grok não expõe usage compatível: chame sem `usage` (registra só duração/modelo).
export function recordUsage(
  log: UsageLog | undefined,
  fase: string,
  model: string,
  ms: number,
  usage?: {
    input_tokens?: number | null;
    output_tokens?: number | null;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
  } | null
): void {
  if (!log) return;
  const f = (log[fase] ??= {
    model,
    ms: 0,
    chamadas: 0,
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  });
  f.model = model;
  f.ms += ms;
  f.chamadas += 1;
  f.input_tokens += usage?.input_tokens ?? 0;
  f.output_tokens += usage?.output_tokens ?? 0;
  f.cache_creation_input_tokens += usage?.cache_creation_input_tokens ?? 0;
  f.cache_read_input_tokens += usage?.cache_read_input_tokens ?? 0;

  // Telemetria por chamada de LLM (best-effort, fire-and-forget — registrarAtividade nunca lança).
  const hub = (log as unknown as Record<symbol, unknown>)[HUB_CTX] as
    | { sessaoId: string; userId: string | null }
    | undefined;
  if (hub) {
    // import dinâmico: mantém hub.ts (e o lib/db.ts que ele carrega) fora do grafo de
    // módulos das funções puras daqui — senão testes sem env quebram só de importar.
    const payload = { fase, modelo: model, tokens_in: usage?.input_tokens ?? 0, tokens_out: usage?.output_tokens ?? 0, ms };
    void import("./hub")
      .then((m) => m.registrarAtividade("llm", { sessaoId: hub.sessaoId, userId: hub.userId, payload }))
      .catch(() => {});
  }
}

export type Effort = "low" | "medium" | "high";

// messages.create com tiering de esforço (output_config.effort) + telemetria — 1 linha no call site.
// generateDraft (streaming) não passa por aqui: mantém default high e registra via recordUsage.
export async function trackedCreate(
  log: UsageLog | undefined,
  fase: string,
  params: Anthropic.MessageCreateParamsNonStreaming,
  effort?: Effort
): Promise<Anthropic.Message> {
  const t0 = Date.now();
  const res = await anthropic.messages.create(effort ? { ...params, output_config: { effort } } : params);
  recordUsage(log, fase, String(params.model), Date.now() - t0, res.usage);
  return res;
}
