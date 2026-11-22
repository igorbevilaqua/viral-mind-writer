import { trackedCreate, type UsageLog } from "../anthropic";
import { modeloDe } from "../llm-config";
import { agentPrompt, toolInput } from "../pipeline/agents";
import { estrito } from "../pipeline/modelagem";
import { LEITURA_SCHEMA, oQueFaltouNaLeitura, type Leitura } from "./leitura-schema";

const TOOL = "registrar_leitura";

/** Exportada para scripts/checa-leitura.ts: schema estrito só se prova com chamada real. */
export function leituraTool() {
  return {
    name: TOOL,
    description: "Registra a leitura de um vídeo viral: o que ele afirma, o que faz sentir e o conteúdo que o sustenta.",
    strict: true,
    input_schema: estrito(LEITURA_SCHEMA),
  };
}

/**
 * Lê o vídeo. Uma chamada; se voltar incompleta, uma segunda com o teto dobrado (o thinking
 * divide o teto com o tool_use, mesmo remédio da autópsia). Incompleta duas vezes → lança com o
 * motivo, porque sem leitura não há o que escrever.
 */
export async function lerVideo(transcricao: string, direcao = "", log?: UsageLog): Promise<Leitura> {
  const model = await modeloDe("leitura");
  const tentar = async (max_tokens: number) => {
    const res = await trackedCreate(log, "leitura", {
      model,
      max_tokens,
      system: agentPrompt("leitor"),
      tools: [leituraTool()],
      tool_choice: { type: "tool", name: TOOL },
      messages: [
        {
          role: "user",
          content:
            (direcao.trim()
              ? `DIREÇÃO DO USUÁRIO (recorte dentro da mesma tese; não muda a leitura do que o vídeo é):\n${direcao.trim()}\n\n`
              : "") + `TRANSCRIÇÃO:\n${transcricao}`,
        },
      ],
    });
    const bloco = res.content.find((b) => b.type === "tool_use");
    const leitura = (bloco?.type === "tool_use" ? toolInput(bloco) : {}) as unknown as Leitura;
    return { leitura, falta: oQueFaltouNaLeitura(leitura, transcricao), stop: res.stop_reason };
  };

  let r = await tentar(8000);
  if (r.falta) {
    console.error(`leitura incompleta (${r.falta}), stop_reason=${r.stop}; tentando com teto maior`);
    r = await tentar(16000);
  }
  if (r.falta)
    throw Object.assign(new Error(`A leitura do vídeo voltou incompleta duas vezes (${r.falta}). Tente de novo.`), {
      debug: { step: "leitura", stop_reason: r.stop, falta: r.falta },
    });
  return r.leitura;
}
