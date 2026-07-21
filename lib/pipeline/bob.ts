import Anthropic from "@anthropic-ai/sdk";
import { anthropic, WRITER_MODEL } from "../anthropic";
import { grokClient, RESEARCH_MODEL } from "../grok";
import { agentPrompt } from "./agents";
import { buildStaticSystemBlock, buildDynamicSystemBlock } from "./draft";
import { loadContext } from "./context";
import { dedash } from "./slop-lint";

export type BobModo = "completar" | "reescrever";
export type BobPhase = "pensando" | "pesquisando" | "escrevendo";

export interface BobInput {
  modo: BobModo;
  roteiro: string; // roteiro completo em edição (contexto — nunca reescrito por inteiro)
  antes: string; // texto antes do cursor
  depois: string; // texto depois do cursor
  trecho?: string; // seleção (modo reescrever)
  instrucao: string;
  evitar?: string; // sugestão anterior recusada → gerar diferente
}

// Bob decide sozinho se precisa de fato externo — só então pesquisa na web (Grok).
// Ajuste de estilo/tom não paga latência de pesquisa; pedido factual pesquisa e escreve.
const PESQUISAR_TOOL: Anthropic.Tool = {
  name: "pesquisar_web",
  description:
    "Pesquisa dados factuais atuais na web (números, datas, estatísticas, notícias, nomes, valores). Use SOMENTE quando o pedido do usuário exigir uma informação externa concreta que você não tem com confiança. NÃO use para ajuste de estilo, tom, ritmo ou reescrita que não dependa de fato novo.",
  input_schema: {
    type: "object",
    properties: { query: { type: "string", description: "O que pesquisar, específico e em linguagem natural" } },
    required: ["query"],
  },
};

async function grokPesquisa(query: string): Promise<{ texto: string; fontes: string[] }> {
  const res = await grokClient().responses.create({
    model: RESEARCH_MODEL,
    instructions:
      "Você é um pesquisador factual. Responda EXATAMENTE o que foi pedido com dados concretos (números, datas) e a URL da fonte de cada dado. Direto e conciso — sem opinião, sem enrolação.",
    input: query,
    tools: [{ type: "web_search" }] as never,
  });
  const texto = res.output_text ?? "";
  const fontes = [...new Set(texto.match(/https?:\/\/[^\s)\]]+/g) ?? [])];
  return { texto, fontes };
}

// Bob na edição manual: completa no cursor ou reescreve a seleção — na voz do cliente,
// com o contexto da sala (mesmo prefixo cacheado do roteirista) e pesquisando na web
// quando o pedido exigir. Retorna o texto a encaixar e as fontes usadas (→ FONTES).
export async function bobAssist(
  sessionId: string,
  input: BobInput,
  onPhase?: (e: { phase: BobPhase; query?: string }) => void
): Promise<{ texto: string; fonte?: string }> {
  onPhase?.({ phase: "pensando" });
  const ctx = await loadContext(sessionId);

  const posicao = `ROTEIRO EM EDIÇÃO (contexto — NÃO reescreva; ⟦AQUI⟧ marca onde seu texto entra):
${input.antes}⟦AQUI⟧${input.depois}`;

  let userMsg: string;
  if (input.modo === "reescrever") {
    userMsg = `Um roteiro está sendo editado. O usuário selecionou UM trecho e pediu uma alteração só nele. Reescreva SÓ esse trecho, mantendo o papel dele no roteiro, a voz do cliente e uma extensão parecida. Ele precisa encaixar no lugar exato, emendando com o texto antes e depois. Se o pedido exigir um dado externo (número, data, fato), pesquise antes de escrever. NÃO reescreva o roteiro. Responda com o TEXTO SUBSTITUTO e nada mais — sem aspas, sem rótulos, sem explicação, sem colar URLs no corpo.

ROTEIRO COMPLETO (contexto — não reescreva):
${input.roteiro}

TRECHO A SUBSTITUIR:
${input.trecho}

PEDIDO DO USUÁRIO:
${input.instrucao}`;
  } else {
    userMsg = `Um roteiro está sendo editado. Escreva SÓ o texto que entra na posição ⟦AQUI⟧, na voz do cliente, emendando naturalmente com o que vem antes e depois. Se o pedido exigir um dado externo (número, data, fato), pesquise antes de escrever. NÃO repita o texto ao redor, NÃO reescreva o roteiro, NÃO cole URLs no corpo. Responda só o texto a inserir — sem aspas, sem rótulos, sem explicação.

${posicao}

PEDIDO DO USUÁRIO:
${input.instrucao}`;
  }

  if (input.evitar) userMsg += `\n\nA sugestão anterior abaixo foi recusada — gere uma DIFERENTE:\n${input.evitar}`;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMsg }];
  const fontes = new Set<string>();

  // Loop de tool-use: no máx. 1 rodada de pesquisa antes de compor (turn 0 pode pesquisar,
  // turn 1 escreve). Sem pesquisa, resolve em 1 chamada.
  for (let turn = 0; turn < 2; turn++) {
    const res = await anthropic.messages.create({
      model: WRITER_MODEL,
      max_tokens: 2000,
      system: [
        // mesma ordem block1-estático/block2-persona do roteirista → reusa o prefixo cacheado
        { type: "text", text: buildStaticSystemBlock(ctx), cache_control: { type: "ephemeral" } },
        { type: "text", text: `${agentPrompt("roteirista")}\n\n${buildDynamicSystemBlock(ctx)}` },
      ],
      tools: turn === 0 ? [PESQUISAR_TOOL] : undefined, // só a 1ª rodada pode pesquisar
      messages,
    });

    const toolUse = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (toolUse && toolUse.name === "pesquisar_web") {
      const query = (toolUse.input as { query?: string }).query ?? input.instrucao;
      onPhase?.({ phase: "pesquisando", query });
      let resultado = "(a pesquisa não retornou dados — não invente números)";
      try {
        const r = await grokPesquisa(query);
        if (r.texto.trim()) resultado = r.texto;
        r.fontes.forEach((u) => fontes.add(u));
      } catch (e) {
        console.error("pesquisa do Bob falhou, seguindo sem dados frescos", e);
      }
      onPhase?.({ phase: "escrevendo" });
      messages.push({ role: "assistant", content: res.content });
      messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: resultado }] });
      continue;
    }

    const block = res.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const texto = block ? dedash(block.text.trim()) : "";
    return { texto, fonte: fontes.size ? [...fontes].join("\n") : undefined };
  }

  return { texto: "", fonte: fontes.size ? [...fontes].join("\n") : undefined };
}
