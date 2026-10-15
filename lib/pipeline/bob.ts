import Anthropic from "@anthropic-ai/sdk";
import { anthropic, bindUsageLog } from "../anthropic";
import { grokPesquisa } from "./grok-search";
import { agentPrompt, hookMechanismBlock, hookPreferenceBlock } from "./agents";
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
  if (ctx.usageLog) bindUsageLog(ctx.usageLog, { sessaoId: sessionId, userId: ctx.userId });

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

  // Bob bom em hook: se a edição é na ABERTURA (onde vive o hook), injeta a orientação
  // de dados (ranking de mecanismos + preferências do time) — compacta, sem o playbook inteiro.
  if (input.antes.trim().length < 160) {
    const guia = [hookMechanismBlock(ctx), hookPreferenceBlock(ctx)].filter(Boolean).join("\n\n");
    if (guia) userMsg += `\n\nVocê está editando a ABERTURA (o hook). Oriente-se por estes dados:\n${guia}`;
  }

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMsg }];
  const fontes = new Set<string>();

  // Loop de tool-use: no máx. 1 rodada de pesquisa antes de compor (turn 0 pode pesquisar,
  // turn 1 escreve). Sem pesquisa, resolve em 1 chamada.
  for (let turn = 0; turn < 2; turn++) {
    const res = await anthropic.messages.create({
      model: ctx.modelo,
      // Folga para o thinking: ele divide o teto com a resposta (mesma correção de 9acaf7f no
      // resto do pipeline). Com 2000, duas pesquisas grandes faziam o modelo pensar até o teto e
      // não sobrava nada para o texto: a tela mostrava as fontes e uma sugestão vazia.
      max_tokens: 8000,
      system: [
        // mesma ordem block1-estático/block2-persona do roteirista → reusa o prefixo cacheado
        { type: "text", text: buildStaticSystemBlock(ctx), cache_control: { type: "ephemeral" } },
        { type: "text", text: `${agentPrompt("roteirista")}\n\n${buildDynamicSystemBlock(ctx)}` },
      ],
      tools: turn === 0 ? [PESQUISAR_TOOL] : undefined, // só a 1ª rodada pode pesquisar
      messages,
    });

    // O modelo pode pedir mais de uma pesquisa na mesma resposta (tool use paralelo). A API
    // exige um tool_result para CADA tool_use: responder só ao primeiro dá 400 na rodada seguinte.
    const toolUses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (toolUses.length) {
      const resultados = await Promise.all(
        toolUses.map(async (t): Promise<Anthropic.ToolResultBlockParam> => {
          const query = (t.input as { query?: string }).query ?? input.instrucao;
          onPhase?.({ phase: "pesquisando", query });
          let resultado = "(a pesquisa não retornou dados — não invente números)";
          try {
            const r = await grokPesquisa(query, ctx.usageLog, "bob_busca");
            if (r.texto.trim()) resultado = r.texto;
            // Só as fontes que a pesquisa CITA no texto: o Grok 4.7 devolve como citação toda
            // página que abriu (71 numa busca só), e o campo FONTES virava uma parede de links.
            const citadas = r.fontes.filter((u) => r.texto.includes(u));
            (citadas.length ? citadas : r.fontes.slice(0, 3)).forEach((u) => fontes.add(u));
          } catch (e) {
            console.error("pesquisa do Bob falhou, seguindo sem dados frescos", e);
          }
          return { type: "tool_result", tool_use_id: t.id, content: resultado };
        })
      );
      onPhase?.({ phase: "escrevendo" });
      messages.push({ role: "assistant", content: res.content });
      messages.push({ role: "user", content: resultados });
      continue;
    }

    const block = res.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const texto = block ? dedash(block.text.trim()) : "";
    // Sugestão vazia em silêncio parece que o Bob não entendeu; erro aparece na tela e diz o que houve.
    if (!texto) throw new Error(`O Bob não chegou a escrever (${res.stop_reason}). Tente de novo.`);
    return { texto, fonte: fontes.size ? [...fontes].join("\n") : undefined };
  }

  throw new Error("O Bob não chegou a escrever. Tente de novo.");
}
