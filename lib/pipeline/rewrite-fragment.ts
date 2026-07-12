import { anthropic, WRITER_MODEL } from "../anthropic";
import { agentPrompt } from "./agents";
import { buildStaticSystemBlock, buildDynamicSystemBlock } from "./draft";
import { loadContext } from "./context";
import { dedash } from "./slop-lint";

// "Chame o Bob": reescreve APENAS um trecho do roteiro atendendo o pedido do usuário,
// com todo o contexto da sala (narrativa vencedora, voz do cliente, proibições, estilo).
// Retorna só o texto substituto, pronto pra encaixar no lugar do trecho.
export async function rewriteFragment(
  sessionId: string,
  { roteiro, trecho, instrucao, evitar }: { roteiro: string; trecho: string; instrucao: string; evitar?: string }
): Promise<string> {
  const ctx = await loadContext(sessionId);
  const res = await anthropic.messages.create({
    model: WRITER_MODEL,
    max_tokens: 2000,
    // reescrita pontual e bem especificada — effort low corta o custo do fable aqui
    output_config: { effort: "low" },
    system: [
      // mesma ordem block1-estático/block2-persona do roteirista → reusa o prefixo cacheado dele
      { type: "text", text: buildStaticSystemBlock(ctx), cache_control: { type: "ephemeral" } },
      { type: "text", text: `${agentPrompt("roteirista")}\n\n${buildDynamicSystemBlock(ctx)}` },
    ],
    messages: [
      {
        role: "user",
        content: `Um roteiro já está pronto. O usuário selecionou UM trecho e pediu uma alteração só nele. Reescreva SÓ esse trecho, mantendo o papel dele no roteiro, a voz do cliente e uma extensão parecida. Ele precisa encaixar no lugar exato do trecho, emendando naturalmente no texto antes e depois. NÃO reescreva o roteiro inteiro. Responda com o TEXTO SUBSTITUTO e nada mais — sem aspas, sem rótulos, sem explicação.

ROTEIRO COMPLETO (contexto — não reescreva):
${roteiro}

TRECHO A SUBSTITUIR:
${trecho}

PEDIDO DO USUÁRIO:
${instrucao}${evitar ? `\n\nA sugestão anterior abaixo foi recusada — gere uma DIFERENTE:\n${evitar}` : ""}`,
      },
    ],
  });
  const block = res.content.find((b) => b.type === "text");
  const text = block?.type === "text" ? block.text.trim() : "";
  return dedash(text);
}
