// Juiz de teto do banco de prova (plano 024, 1.3): dois roteiros do mesmo cliente, qual tem
// mais potencial de viralizar. Comparação em PAR, nunca nota absoluta, e sempre nas duas ordens:
// juiz LLM tem viés de posição, de tamanho e de autopreferência. Só conta o voto que sobrevive à
// troca de ordem; o resto é empate.
//
// Ele só vira régua depois de calibrado nos 232 pares cegos do estudo de outubro
// (scripts/juiz-calibrar.ts). Leitores LLM acertaram 62% ali: juiz que não passa disso não decide.
import { anthropic } from "../anthropic";

// Os critérios são os que REPLICAM no dado da casa (docs/estudo-2026-10), não gosto de leitor.
// Na leitura cega, "mais simples", "mais curto" e "promete" ENGANARAM (acerto ≤ 50%); a ponte
// com o Brasil foi a pista mais confiável (79%). O juiz recebe isso dito.
const SISTEMA = `Você compara dois roteiros de vídeo curto (Reels/TikTok/Shorts) do MESMO criador brasileiro e aposta qual dos dois viralizou mais no perfil dele (mais views em relação à média do canal).

O que o histórico de 2.800 roteiros publicados dessa casa mostra que separa vencedor de perdedor:
- O TEMA pesa mais que a forma. Pauta com ponte direta com o Brasil e com o bolso/país de quem assiste vence história só estrangeira.
- Hook que abre com NOME próprio (pessoa, empresa, país, marca) vence hook sem nome. "[Nome] acabou de [fato]" e conflito com os dois lados nomeados são os mais fortes. Hook que abre com "Esse/Essa", que fala "você", que promete ensinar, que usa "nunca", "pode", "bilionário", palavra muito longa ou ano em algarismo perde.
- Recompensa (payoff) que vence: briga com lado tomado, orgulho brasileiro comparado com um rival de fora, Davi contra Golias nomeado. Que perde: superação pura, dica/vantagem para o espectador, queda de gigante sem lado.
- O fecho que funciona fica no caso (contraste "enquanto todo mundo X, ele Y", estado atual do personagem). Fecho com lição de moral, "a lição é", "talvez", "você precisa" perde.
- Contar a origem em ordem ("nasceu", "começou", "foi aí que") perde.

O que NÃO prevê vitória e você deve ignorar: ser mais curto, parecer mais simples, prometer mais no hook, ter mais números, escrita mais bonita.

Responda em exatamente três linhas:
VENCEDOR: A ou B
CONFIANÇA: 1, 2 ou 3
MOTIVO: uma frase`;

export interface VotoJuiz {
  escolha: "A" | "B";
  confianca: number;
  motivo: string;
}

async function votar(a: string, b: string, modelo: string): Promise<VotoJuiz | null> {
  const res = await anthropic.messages.create({
    model: modelo,
    max_tokens: 300,
    system: SISTEMA,
    messages: [{ role: "user", content: `ROTEIRO A\n${a}\n\n=====\n\nROTEIRO B\n${b}` }],
  });
  const txt = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const escolha = txt.match(/VENCEDOR:\s*([AB])/i)?.[1]?.toUpperCase() as "A" | "B" | undefined;
  if (!escolha) return null;
  return {
    escolha,
    confianca: Number(txt.match(/CONFIANÇA:\s*([123])/i)?.[1] ?? 1),
    motivo: txt.match(/MOTIVO:\s*(.+)/i)?.[1]?.trim() ?? "",
  };
}

export interface Julgamento {
  /** "A" ou "B" quando as duas ordens concordam; "empate" quando discordam ou falham. */
  vencedor: "A" | "B" | "empate";
  confianca: number;
  motivos: string[];
}

/** Julga A contra B nas duas ordens. Só há vencedor quando a troca de posição não muda o voto. */
export async function julgarPar(a: string, b: string, modelo = "claude-sonnet-5-5"): Promise<Julgamento> {
  const [ida, volta] = await Promise.all([votar(a, b, modelo), votar(b, a, modelo)]);
  const voltaNaOrdemCerta = volta && { ...volta, escolha: volta.escolha === "A" ? ("B" as const) : ("A" as const) };
  const motivos = [ida?.motivo, voltaNaOrdemCerta?.motivo].filter((m): m is string => !!m);
  if (!ida || !voltaNaOrdemCerta || ida.escolha !== voltaNaOrdemCerta.escolha)
    return { vencedor: "empate", confianca: 0, motivos };
  return { vencedor: ida.escolha, confianca: Math.min(ida.confianca, voltaNaOrdemCerta.confianca), motivos };
}
