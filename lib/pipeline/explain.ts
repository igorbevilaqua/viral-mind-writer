import { ANALYST_MODEL, trackedCreate } from "../anthropic";
import type { Etapa } from "../provenance";
import { agentPrompt, toolInput } from "./agents";
import type { LintViolation } from "./slop-lint";

// Agente "por quê" (015 §4.3): recebe um trecho e a etapa que já foi determinada por
// `atribuirEtapa`, e devolve a causa SAINDO DO RASTRO. Não julga o texto e não sugere nada.
// A etapa não vai para o modelo decidir — ela é determinística e já está resolvida.

export const CAUSAS = [
  "licao",
  "playbook",
  "vocabulario",
  "premissa",
  "narrativa",
  "violacao",
  "instrucao_sua",
  "nao_determinado",
] as const;
export type Causa = (typeof CAUSAS)[number];

export interface Explicacao {
  etapa: Etapa;
  causa: Causa;
  referencia: { tipo: string; id: string } | null;
  explicacao: string;
}

// O que `pipeline_trace` carrega e interessa aqui. Tudo opcional: roteiro anterior à 2.0 só
// tem os três snapshots.
export interface TraceExplicavel {
  assembled?: string;
  revised?: string;
  final?: string;
  violations?: LintViolation[];
  roteiro_original?: string; // presente ⇒ houve edição humana depois de salvar
  proveniencia?: {
    blocos?: Record<string, unknown>;
    critica?: string;
    bob?: unknown[];
  };
}

const ROTULO: Record<Etapa, string> = {
  roteirista: "o roteirista escreveu",
  revisao: "o revisor reescreveu",
  humanizacao: "o humanizador reescreveu",
  pos_save: "uma edição posterior à geração produziu",
};

// Sem anotação de tipo do SDK de propósito: o teste de contrato lê
// `.input_schema.properties.causa.enum`, e `Anthropic.Tool` apaga esse formato (input_schema
// vira índice aberto). A inferência do literal é o que mantém o acesso tipado.
export const EXPLICACAO_TOOL = {
  name: "registrar_explicacao",
  description: "Registra por que este trecho está no roteiro, saindo apenas do rastro recebido.",
  input_schema: {
    type: "object" as const,
    properties: {
      causa: { type: "string", enum: [...CAUSAS] },
      // Plano (§4.3) modela `referencia` como objeto aninhado nulável. Achatado em dois campos
      // opcionais: nulável aninhado é onde tool call erra mais, e a montagem do objeto é uma
      // linha aqui embaixo.
      referencia_tipo: { type: "string", description: "licao | playbook | vocabulario | narrativa | violacao" },
      referencia_id: { type: "string", description: "id LITERAL vindo de ids_citaveis; nunca inventado" },
      explicacao: { type: "string", description: "1 a 3 frases, sem elogio e sem sugestão" },
    },
    required: ["causa", "explicacao"],
  },
};

// Normalização mínima para casar violação com o trecho selecionado.
const lower = (s: string) => s.toLowerCase();

const licoesDoBloco = (bloco: unknown): string[] => {
  const b = bloco as { licoes?: { id?: string | null }[] } | undefined;
  return (b?.licoes ?? []).map((l) => l?.id).filter((id): id is string => !!id);
};

/**
 * Monta o que vai no user content conforme a etapa (tabela do Passo 2 da Task 6).
 * `null` = roteiro anterior à 2.0 (sem `proveniencia` no trace) ⇒ NÃO chamar o modelo.
 * Função pura e exportada para o teste não precisar mockar o SDK.
 */
export function montarEntrada(
  trecho: string,
  etapa: Etapa,
  trace: TraceExplicavel | null | undefined,
): Record<string, unknown> | null {
  const prov = trace?.proveniencia;
  if (!prov) return null;
  const blocos = prov.blocos ?? {};

  switch (etapa) {
    case "roteirista": {
      // Divergência deliberada da tabela do plano, que manda só `blocos.roteirista`: o
      // `assembled` inclui as seções HOOK e COMANDO, então trecho de hook resolve para a etapa
      // `roteirista` e sem os blocos irmãos a lição dele nunca seria citável.
      const escrita = { roteirista: blocos.roteirista, hook: blocos.hook, comando: blocos.comando };
      return {
        blocos_da_escrita: escrita,
        ids_citaveis: [
          ...licoesDoBloco(blocos.roteirista),
          ...licoesDoBloco(blocos.hook),
          ...licoesDoBloco(blocos.comando),
        ],
      };
    }
    case "revisao": {
      const checklist = (blocos.revisao as { checklist_ref?: { slug?: string } } | undefined)?.checklist_ref?.slug;
      return {
        critica: prov.critica ?? "",
        bloco_da_revisao: blocos.revisao ?? null,
        ids_citaveis: [...licoesDoBloco(blocos.revisao), ...(checklist ? [checklist] : [])],
      };
    }
    case "humanizacao": {
      // Só as violações que casam com o trecho. Nenhuma casada é informação, não lacuna: o
      // humanizador mexeu por outro motivo e a resposta certa passa a ser nao_determinado.
      const alvo = lower(trecho);
      return {
        violacoes_no_trecho: (trace?.violations ?? []).filter((v) => v?.match && alvo.includes(lower(v.match))),
        ids_citaveis: [],
      };
    }
    case "pos_save":
      return {
        edicoes_do_bob: prov.bob ?? [],
        houve_edicao_humana: !!trace?.roteiro_original,
        ids_citaveis: [],
      };
  }
}

export async function explicar(input: {
  trecho: string;
  etapa: Etapa;
  trace: TraceExplicavel | null | undefined;
}): Promise<Explicacao> {
  const { trecho, etapa, trace } = input;
  const entrada = montarEntrada(trecho, etapa, trace);

  // Roteiro anterior à 2.0: a etapa ainda resolve (os três snapshots existem desde sempre), mas
  // não há blocos. Economiza a chamada e é a resposta honesta — inventar causa aqui é o defeito
  // que a peça existe para matar (§8).
  if (!entrada)
    return {
      etapa,
      causa: "nao_determinado",
      referencia: null,
      explicacao: `Sei que ${ROTULO[etapa]} este trecho, mas este roteiro é anterior ao registro de proveniência.`,
    };

  const res = await trackedCreate(
    undefined,
    "explicacao",
    {
      model: ANALYST_MODEL,
      max_tokens: 1000,
      tools: [EXPLICACAO_TOOL],
      tool_choice: { type: "tool", name: "registrar_explicacao" },
      system: [{ type: "text", text: agentPrompt("proveniencia"), cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `ETAPA QUE PRODUZIU O TRECHO: ${etapa} (${ROTULO[etapa]} isto — já determinado, não questione)

TRECHO SELECIONADO PELO USUÁRIO:
${trecho}

O QUE ESSA ETAPA VIA (rastro, é tudo que existe):
${JSON.stringify(entrada, null, 2)}

Explique por que este trecho está assim.`,
        },
      ],
    },
    "low",
  );

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("proveniencia: sem saída estruturada");
  const raw = toolInput(toolUse) as { causa?: string; referencia_tipo?: string; referencia_id?: string; explicacao?: string };

  // Saída de LLM é fronteira de confiança. Causa fora do enum vira rótulo que a tela não sabe
  // desenhar; aqui degrada para nao_determinado (que é resposta válida) em vez de derrubar a
  // explicação inteira.
  const causa = CAUSAS.includes(raw.causa as Causa) ? (raw.causa as Causa) : "nao_determinado";
  if (causa !== raw.causa) console.error(`proveniencia: causa fora do enum — ${JSON.stringify(raw).slice(0, 300)}`);

  // `referencia.id` é o que vira o botão "abrir a lição X para correção": id que o modelo
  // inventou abriria nada ou a lição errada. Só passa o que estava no rastro.
  const citaveis = (entrada.ids_citaveis ?? []) as string[];
  const id = raw.referencia_id?.trim();
  const referencia = id && raw.referencia_tipo && citaveis.includes(id) ? { tipo: raw.referencia_tipo, id } : null;
  if (id && !referencia) console.error(`proveniencia: referencia "${id}" não está no rastro — descartada`);

  return {
    etapa,
    causa,
    referencia: causa === "nao_determinado" ? null : referencia,
    explicacao: raw.explicacao?.trim() || "Nada no rastro determina este trecho.",
  };
}
