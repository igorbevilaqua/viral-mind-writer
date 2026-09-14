import { ANALYST_MODEL, trackedCreate } from "../anthropic";
import { agentPrompt, toolArray, toolInput } from "./agents";
import { OUTPUT_FORMAT, buildStaticSystemBlock, buildReviewDynamicBlock } from "./draft";
import type { GenerationContext } from "./types";

// 021 §1.1: crítica e reescrita saem em DUAS saídas estruturadas. O `split` por marcador de texto
// era o ponto frágil — e desde 2026-07-06 nunca chegou a ser exercitado, porque o thinking do
// sonnet comia os 8000 tokens antes de emitir bloco de texto nenhum (181 de 181 no teto).
const REVISAO_TOOL = {
  name: "registrar_revisao",
  description: "Registra os problemas encontrados pela sala de revisão e a versão corrigida completa do roteiro.",
  input_schema: {
    type: "object" as const,
    properties: {
      problemas: {
        type: "array",
        items: { type: "string" },
        description: "Problemas objetivos encontrados, um por item, no formato 'CHAPÉU: problema'. Curto.",
      },
      roteiro_revisado: {
        type: "string",
        description: "Roteiro completo corrigido, com TODAS as seções no formato de saída exigido.",
      },
    },
    required: ["problemas", "roteiro_revisado"],
  },
};

// O que a fase degradou e por quê — 021 §0.3. Sem isto, F1 volta a acontecer em silêncio.
export type FallbackInfo = { motivo: string; stop_reason: string | null; output_tokens: number };


// Julgamento humano do portão de 021 §1.1: em 5 rodadas reais o revisor melhorou o corpo
// (parágrafo longo quebrado, causa explicitada, conta redundante cortada) e PIOROU o hook,
// trocando afirmação concreta por teaser. O hook tem agente próprio, variações e anti-colapso
// por mecanismo — segundo palpite aqui desfaz escolha tomada por dado.
// Guarda determinística e não só instrução no prompt: a lição de F1 é que instrução ignorada
// falha em silêncio por 187 gerações.
function corpoDaSecao(txt: string, nome: string): string | null {
  const m = txt.match(new RegExp(`##\\s*${nome}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i"));
  return m ? m[1].trim() : null;
}

function trocarSecao(txt: string, nome: string, novo: string): string {
  // callback em vez de string: `$&`/`$1` dentro do hook seriam interpretados como referência.
  return txt.replace(new RegExp(`(##\\s*${nome}\\s*\\n)([\\s\\S]*?)(?=\\n##\\s|$)`, "i"), (_m, cab) => `${cab}${novo}\n`);
}

export function preservarHook(assembled: string, revised: string): { texto: string; mexeu: boolean } {
  const hook = corpoDaSecao(assembled, "HOOK");
  if (!hook) return { texto: revised, mexeu: false };

  const mexeu = corpoDaSecao(revised, "HOOK") !== hook;
  let out = trocarSecao(revised, "HOOK", hook);

  const variacoes = corpoDaSecao(assembled, "VARIACOES_DE_HOOK");
  if (variacoes) out = trocarSecao(out, "VARIACOES_DE_HOOK", variacoes);

  // `## ROTEIRO` abre com o hook colado na frente do corpo (index.ts monta assim). Sem trocar
  // aqui também, o roteiro entregue sai com dois hooks diferentes.
  const roteiro = corpoDaSecao(out, "ROTEIRO");
  const semPrimeiro = roteiro?.replace(/^[\s\S]*?\n\s*\n/, "");
  if (roteiro && semPrimeiro && semPrimeiro !== roteiro) {
    out = trocarSecao(out, "ROTEIRO", `${hook}\n\n${semPrimeiro}`);
  }
  return { texto: out, mexeu };
}

// 7. Sala de revisão multi-chapéu + reescrita em UMA chamada.
// Os chapéus vivem em agents/revisao.md; o checklist eliminatório vem do playbook.
// Contexto enxuto: a revisão corrige contra checklist, não imita voz — sem few-shot,
// sem materiais do usuário, dossiê truncado (buildReviewDynamicBlock).
export async function critiqueAndRewrite(
  ctx: GenerationContext,
  draft: string,
  // Sinais determinísticos daquela geração (eco numérico, hook × abertura — 016 §6).
  // Chegam prontos de index.ts: o revisor é quem decide, o detector só sinaliza.
  sinais = ""
): Promise<{ revised: string; critica: string; fallback: FallbackInfo | null; hookMexido: boolean }> {
  const res = await trackedCreate(
    ctx.usageLog,
    "revisao",
    {
      model: ANALYST_MODEL,
      // O documento revisado tem ~4,3 KB (~1,2k tokens) e o thinking do sonnet-5 come o resto.
      // 8000 nunca bastou: era o teto inteiro, não folga (AGENTS.md §5).
      max_tokens: 16000,
      tools: [REVISAO_TOOL],
      tool_choice: { type: "tool", name: "registrar_revisao" },
      system: [
        // block 1 = estático compartilhado + cache: o modelo é sonnet (cache separado do fable),
        // mas "gerar nova versão" re-roda a revisão com o mesmo prefixo e reusa a escrita.
        { type: "text", text: buildStaticSystemBlock(ctx), cache_control: { type: "ephemeral" } },
        { type: "text", text: `${agentPrompt("revisao")}\n\n${buildReviewDynamicBlock(ctx, sinais)}` },
      ],
      messages: [
        {
          role: "user",
          content: `Revise o roteiro montado pela sala. Checklist eliminatório (qualquer item reprovado precisa ser corrigido na reescrita):
${ctx.playbooks.checklist ?? "(sem checklist)"}

NÃO reescreva o HOOK nem as VARIACOES_DE_HOOK: eles são decididos por outro agente, com dado de mecanismo e anti-colapso. O que você devolver neles é descartado. Revise o CORPO, o COMANDO e a HEADLINE.

${OUTPUT_FORMAT}

ROTEIRO MONTADO:
${draft}`,
        },
      ],
    },
    // A revisão corrige contra checklist, não inventa. Se medium não entregar, subir medindo.
    "medium"
  );

  const block = res.content.find((b) => b.type === "tool_use");
  const input = block ? toolInput(block) : {};
  const revised = typeof input.roteiro_revisado === "string" ? input.roteiro_revisado.trim() : "";
  // A crítica por chapéu: é ela que responde "por que o revisor reescreveu isto" no rastro de
  // proveniência (015 §4.1).
  const critica = toolArray<string>(input, "problemas").join("\n");
  // Guarda: reescrita truncada/ausente nunca pode zerar o roteiro — o trabalho
  // dos especialistas (montado) segue em frente e a humanização cuida do resto.
  // A crítica vai junto mesmo nesse caminho: é ela que explica por que a revisão falhou.
  const ok = /##\s*ROTEIRO/i.test(revised);
  const { texto, mexeu } = ok ? preservarHook(draft, revised) : { texto: draft, mexeu: false };
  return {
    revised: texto,
    critica,
    // Mede se a instrução do prompt basta: se `mexeu` for raro, a guarda é cinto de segurança;
    // se for a regra, o prompt está sendo ignorado e vale saber.
    hookMexido: mexeu,
    fallback: ok
      ? null
      : {
          motivo: revised ? "roteiro_revisado sem seção ROTEIRO" : "sem saída da tool",
          stop_reason: res.stop_reason ?? null,
          output_tokens: res.usage.output_tokens,
        },
  };
}
