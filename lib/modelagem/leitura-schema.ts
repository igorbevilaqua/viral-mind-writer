import { HOOK_MECHANISMS } from "../pipeline/hook-mechanisms";

// Plano 027: a LEITURA substitui a autópsia no /modelagem. A diferença de fundo é que ela
// GUARDA o conteúdo (exemplo, afirmação, número) em vez de proibi-lo: é o que o original tem de
// mais forte, e o esqueleto livre de conteúdo jogava fora justamente isso.
//
// Puro de propósito (só tipos e uma constante): o teste não precisa de banco nem de SDK.

export interface Ativo {
  texto: string;
  tipo: "exemplo" | "afirmacao" | "numero" | "personagem" | "comparacao";
  beat: number;
  destino: "manter" | "abrasileirar";
  checar: boolean;
  por_que: string;
}

export interface Leitura {
  premissa: string;
  emocao: { predominante: string; motor: string };
  hook: { texto: string; promessa: string; mecanismo: string };
  beats: { ordem: number; funcao: string; trecho: string }[];
  ativos: Ativo[];
  palavras_dificeis: { termo: string; troca: string }[];
  nao_transferivel: string[];
}

const str = (description: string) => ({ type: "string", description });

export const LEITURA_SCHEMA = {
  type: "object" as const,
  properties: {
    premissa: str("a tese do vídeo em 1-2 frases afirmativas"),
    emocao: {
      type: "object",
      properties: {
        predominante: str("uma emoção só"),
        motor: str("o que neste vídeo produz essa emoção, com os elementos do próprio vídeo"),
      },
      required: ["predominante", "motor"],
    },
    hook: {
      type: "object",
      properties: {
        texto: str("a abertura como foi dita"),
        promessa: str("o que o espectador espera receber se ficar"),
        mecanismo: { type: "string", enum: HOOK_MECHANISMS as unknown as string[] },
      },
      required: ["texto", "promessa", "mecanismo"],
    },
    beats: {
      type: "array",
      description: "o vídeo inteiro em blocos, na ordem; os trechos cobrem a transcrição toda. No mínimo 3.",
      items: {
        type: "object",
        properties: {
          ordem: { type: "number" },
          funcao: str("o que este bloco faz pelo vídeo"),
          trecho: str("o trecho LITERAL da transcrição"),
        },
        required: ["ordem", "funcao", "trecho"],
      },
    },
    ativos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          texto: str("a peça como o vídeo a diz"),
          tipo: { type: "string", enum: ["exemplo", "afirmacao", "numero", "personagem", "comparacao"] },
          beat: { type: "number", description: "a ordem do beat onde aparece" },
          destino: { type: "string", enum: ["manter", "abrasileirar"] },
          checar: { type: "boolean", description: "true para todo fato verificável" },
          por_que: str("o que esta peça faz pelo vídeo, em 1 frase"),
        },
        required: ["texto", "tipo", "beat", "destino", "checar", "por_que"],
      },
    },
    palavras_dificeis: {
      type: "array",
      items: {
        type: "object",
        properties: { termo: { type: "string" }, troca: str("a versão simples") },
        required: ["termo", "troca"],
      },
    },
    nao_transferivel: { type: "array", items: { type: "string" } },
  },
  required: ["premissa", "emocao", "hook", "beats", "ativos", "palavras_dificeis", "nao_transferivel"],
};

export const palavras = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * O que impede a leitura de servir de base para a escrita. "" = nada.
 * Mesma ideia de `oQueFaltouNaAutopsia`: o motivo vira dado para a mensagem e o rastro.
 */
export function oQueFaltouNaLeitura(l: Partial<Leitura> | null | undefined, transcricao: string): string {
  const faltas = [
    (l?.premissa?.trim().length ?? 0) < 20 && "a premissa",
    !l?.emocao?.motor?.trim() && "o motor da emoção",
    !l?.hook?.texto?.trim() && "o hook",
    (l?.beats?.length ?? 0) < 3 && "os beats (menos de 3)",
    // Beats que cobrem pouco do original = o leitor resumiu em vez de dividir, e o escritor
    // perderia blocos inteiros. ponytail: razão de contagem de palavras, não alinhamento de
    // texto; alinhar de verdade só se aparecer leitura que passa aqui e ainda assim pula trecho.
    (l?.beats?.length ?? 0) >= 3 &&
      palavras(l!.beats!.map((b) => b.trecho ?? "").join(" ")) < 0.7 * palavras(transcricao) &&
      "boa parte da transcrição (os beats cobrem menos de 70% dela)",
  ].filter((s): s is string => Boolean(s));
  return faltas.length ? `faltou ${faltas.join(", ")}` : "";
}
