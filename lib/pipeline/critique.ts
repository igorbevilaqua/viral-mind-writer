import { trackedCreate } from "../anthropic";
import { agentPrompt, toolArray, toolInput } from "./agents";
import { buildStaticSystemBlock, buildReviewDynamicBlock, ehCopiaDoHook } from "./draft";
import type { GenerationContext } from "./types";
import { modeloDe } from "../llm-config";

// 021 §1.1: crítica e reescrita saem em DUAS saídas estruturadas. O `split` por marcador de texto
// era o ponto frágil — e desde 2026-07-06 nunca chegou a ser exercitado, porque o thinking do
// sonnet comia os 8000 tokens antes de emitir bloco de texto nenhum (181 de 181 no teto).
// Plano 024, 2.7: a revisão devolve EDIÇÕES localizadas (trecho → substituto), não o documento
// inteiro. Reescrever tudo era a segunda reescrita em série e cada uma deixava os próprios
// tiques; com edição localizada o código aplica só o que o revisor apontou, e o resto do texto
// do roteirista fica intacto por construção.
const REVISAO_TOOL = {
  name: "registrar_revisao",
  description: "Registra os problemas encontrados pela sala de revisão e as edições localizadas que os corrigem.",
  input_schema: {
    type: "object" as const,
    properties: {
      problemas: {
        type: "array",
        items: { type: "string" },
        description: "Problemas objetivos encontrados, um por item, no formato 'CHAPÉU: problema'. Curto.",
      },
      edicoes: {
        type: "array",
        description: "Uma edição por problema que se resolve trocando um trecho. Vazio se nada precisa mudar.",
        items: {
          type: "object",
          properties: {
            trecho: { type: "string", description: "Texto EXATO copiado do roteiro (uma frase ou um parágrafo), sem mudar nada." },
            substituto: { type: "string", description: "O texto que entra no lugar. Vazio para cortar o trecho." },
            motivo: { type: "string", description: "Qual problema esta edição resolve, em poucas palavras." },
          },
          required: ["trecho", "substituto", "motivo"],
        },
      },
    },
    required: ["problemas", "edicoes"],
  },
};

export interface EdicaoRevisao {
  trecho: string;
  substituto: string;
  motivo: string;
}

// Aplica as edições do revisor. Só entra edição cujo trecho aparece UMA vez, fora do HOOK e das
// VARIAÇÕES (o hook é decidido por dado em outro agente). Trecho que não casa é descartado e
// contado: é o sinal de que o revisor parafraseou em vez de copiar.
export function aplicarEdicoes(doc: string, edicoes: EdicaoRevisao[]): { texto: string; aplicadas: number; descartadas: EdicaoRevisao[] } {
  const travado = [corpoDaSecao(doc, "HOOK"), corpoDaSecao(doc, "VARIACOES_DE_HOOK")].filter((x): x is string => !!x);
  let texto = doc;
  let aplicadas = 0;
  const descartadas: EdicaoRevisao[] = [];
  for (const e of edicoes) {
    const t = e.trecho?.trim();
    const ocorrencias = t ? texto.split(t).length - 1 : 0;
    // A cópia do hook abre o ROTEIRO: a 1ª ocorrência dele no corpo também é território travado.
    if (!t || ocorrencias !== 1 || travado.some((h) => h.includes(t) || t.includes(h))) {
      descartadas.push(e);
      continue;
    }
    texto = texto
      .replace(t, () => e.substituto.trim())
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n");
    aplicadas++;
  }
  return { texto, aplicadas, descartadas };
}

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

  const hookDoModelo = corpoDaSecao(revised, "HOOK");
  const mexeu = hookDoModelo !== hook;
  let out = trocarSecao(revised, "HOOK", hook);

  const variacoes = corpoDaSecao(assembled, "VARIACOES_DE_HOOK");
  if (variacoes) out = trocarSecao(out, "VARIACOES_DE_HOOK", variacoes);

  // `## ROTEIRO` abre com o hook colado na frente do corpo (index.ts monta assim). Sem trocar
  // aqui também, o roteiro entregue sai com dois hooks diferentes.
  // Só troca o 1º bloco quando ele é a cópia do hook: se o modelo apagou a cópia, o 1º bloco é
  // corpo de verdade, e trocá-lo pelo hook apagaria um parágrafo. Nesse caso o hook vai na frente.
  const roteiro = corpoDaSecao(out, "ROTEIRO");
  const primeiro = roteiro?.split(/\n\s*\n/)[0] ?? "";
  const semPrimeiro = roteiro?.replace(/^[\s\S]*?\n\s*\n/, "");
  if (roteiro && semPrimeiro && semPrimeiro !== roteiro) {
    // cópia = o hook original OU o hook que o próprio modelo reescreveu na seção HOOK
    const ehCopia = ehCopiaDoHook(hook, primeiro) || (!!hookDoModelo && ehCopiaDoHook(hookDoModelo, primeiro));
    const resto = ehCopia ? semPrimeiro : roteiro;
    out = trocarSecao(out, "ROTEIRO", `${hook}\n\n${resto}`);
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
      model: await modeloDe("critica"),
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
          content: `Revise o roteiro montado pela sala. Checklist eliminatório (qualquer item reprovado precisa de edição):
${ctx.playbooks.checklist ?? "(sem checklist)"}

Você NÃO reescreve o roteiro. Você devolve EDIÇÕES localizadas: para cada problema que se resolve trocando um trecho, copie o trecho EXATO (uma frase ou um parágrafo, letra por letra) e escreva o substituto. Substituto vazio corta o trecho. Edição cujo trecho não for cópia exata é descartada. Mexa só no que tem problema: o que não estiver numa edição fica como o roteirista escreveu.

NÃO edite o HOOK nem as VARIACOES_DE_HOOK: eles são decididos por outro agente, com dado de mecanismo e anti-colapso. Edite o CORPO, o COMANDO e a HEADLINE.

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
  // A crítica por chapéu: é ela que responde "por que o revisor mexeu nisto" no rastro de
  // proveniência (015 §4.1). As edições descartadas vão junto, marcadas.
  const edicoes = toolArray<EdicaoRevisao>(input, "edicoes").filter((e) => typeof e?.trecho === "string");
  const { texto, aplicadas, descartadas } = aplicarEdicoes(draft, edicoes);
  const critica = [
    ...toolArray<string>(input, "problemas"),
    ...descartadas.map((e) => `[edição descartada: trecho não casou] ${e.motivo}`),
  ].join("\n");
  // Sem tool nenhuma é falha (o roteiro segue montado, e o motivo vai ao rastro). Tool com zero
  // edições é revisão que aprovou o texto, não falha.
  const ok = !!block;
  return {
    revised: texto,
    critica: `${critica}${edicoes.length ? `\n(${aplicadas} de ${edicoes.length} edições aplicadas)` : ""}`,
    // O hook não é editável por construção (aplicarEdicoes recusa o trecho dele).
    hookMexido: descartadas.some((e) => (corpoDaSecao(draft, "HOOK") ?? "").includes(e.trecho.trim())),
    fallback: ok
      ? null
      : { motivo: "sem saída da tool", stop_reason: res.stop_reason ?? null, output_tokens: res.usage.output_tokens },
  };
}
