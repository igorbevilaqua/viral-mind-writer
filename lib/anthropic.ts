import Anthropic from "@anthropic-ai/sdk";
import { MODELOS } from "./llm-catalogo";

export const anthropic = new Anthropic();

// Tool forçada para modelo que não aceita (geração 5.5 e fable-5-1 dão 400 com `tool`/`any`):
// troca por `auto` e pede a tool no fim do system. Mora no client porque é o ponto por onde
// todo call site passa — os ~20 que forçam tool seguem escritos como estavam, e a tela de
// configuração pode oferecer esses modelos em qualquer função.
//
// ponytail: `auto` + instrução é pedido, não garantia. Conferido contra a API em 13/10/2026
// (opus-5-5 chamou a tool), e quem lê já trata a ausência de tool_use como erro da fase.
const SEM_TOOL_FORCADA = new Set<string>(MODELOS.filter((m) => !m.toolForcada).map((m) => m.id));

export function adaptarToolChoice<P extends Anthropic.MessageCreateParams>(p: P): P {
  const tc = p.tool_choice;
  if (!tc || (tc.type !== "tool" && tc.type !== "any") || !SEM_TOOL_FORCADA.has(String(p.model))) return p;
  const pedido =
    tc.type === "tool"
      ? `Responda chamando a ferramenta ${tc.name}. Não responda em texto.`
      : "Responda chamando uma das ferramentas. Não responda em texto.";
  const system: Anthropic.TextBlockParam[] =
    typeof p.system === "string" ? [{ type: "text", text: p.system }] : [...(p.system ?? [])];
  return { ...p, tool_choice: { type: "auto" }, system: [...system, { type: "text", text: pedido }] };
}

const criar = anthropic.messages.create.bind(anthropic.messages);
anthropic.messages.create = ((params: Anthropic.MessageCreateParams, opts?: Anthropic.RequestOptions) =>
  criar(adaptarToolChoice(params), opts)) as typeof anthropic.messages.create;

// Rascunho e humanizador = qualidade de escrita; análise e crítica = sonnet.
//
// opus-5-5 (21/09/2026) no lugar do fable-5: 1M de contexto e thinking adaptativo igual, a
// US$ 4/20 por MTok contra 10/50 — e cache de leitura a US$ 0,20, que é o que o prefixo
// estático do roteirista mais usa. O que ele NÃO aceita é `tool_choice` forçado: os três
// agentes do writer que pediam tool obrigatória agora pedem pelo prompt (`auto`), o que
// também vale no fable — dá para voltar só pela env se a escrita cair no A/B.
export const WRITER_MODEL = process.env.VM_WRITER_MODEL ?? "claude-opus-5-5";
// A lista que o seletor da home oferece mora em lib/generation.ts: ela é dado puro e o
// seletor é client component — importá-la daqui arrastaria o SDK para o bundle do browser.
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

// Streaming com telemetria — o par de trackedCreate para resposta longa (018 §10).
// `turno` é UMA fala do usuário, de propósito: quem chama daqui não tem por onde passar
// uma lista de turnos anteriores, e é isso que mantém o custo por turno constante (018 §4).
// generateDraft não passa por aqui: ele monta system em dois blocos com cache_control.
export async function trackedStream(
  log: UsageLog | undefined,
  fase: string,
  params: { model: string; max_tokens: number; system: string; turno: string },
  onToken?: (t: string) => void
): Promise<string> {
  const t0 = Date.now();
  const stream = anthropic.messages.stream({
    model: params.model,
    max_tokens: params.max_tokens,
    system: params.system,
    messages: [{ role: "user", content: params.turno }],
  });
  if (onToken) stream.on("text", onToken);
  const final = await stream.finalMessage();
  recordUsage(log, fase, params.model, Date.now() - t0, final.usage);
  const block = final.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
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
