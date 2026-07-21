import { anthropic, WRITER_MODEL } from "../anthropic";
import { grokClient, RESEARCH_MODEL } from "../grok";
import { agentPrompt } from "./agents";
import { buildStaticSystemBlock, buildDynamicSystemBlock } from "./draft";
import { loadContext } from "./context";
import { dedash } from "./slop-lint";

export type BobModo = "completar" | "reescrever" | "pesquisar";

export interface BobInput {
  modo: BobModo;
  roteiro: string; // roteiro completo em edição (contexto — nunca reescrito por inteiro)
  antes: string; // texto antes do cursor
  depois: string; // texto depois do cursor
  trecho?: string; // seleção (modo reescrever)
  instrucao: string;
  evitar?: string; // sugestão anterior recusada → gerar diferente
}

// Bob durante a edição manual: completa no cursor, reescreve a seleção ou pesquisa e
// insere um dado fresco — sempre na voz do cliente e com o contexto da sala (mesmo
// prefixo cacheado do roteirista). Retorna só o texto a encaixar; no modo pesquisar
// também devolve a(s) fonte(s) pra ir pro campo FONTES.
export async function bobAssist(sessionId: string, input: BobInput): Promise<{ texto: string; fonte?: string }> {
  const ctx = await loadContext(sessionId);

  // Fase 2 — pesquisa fresca (Grok + web_search). Falha nunca aborta: o writer segue
  // sem dados frescos (e é instruído a não inventar número).
  let pesquisa = "";
  let fonte: string | undefined;
  if (input.modo === "pesquisar") {
    try {
      const res = await grokClient().responses.create({
        model: RESEARCH_MODEL,
        instructions:
          "Você é um pesquisador factual. Responda EXATAMENTE o que foi pedido com dados concretos (números, datas) e a URL da fonte de cada dado. Direto e conciso — sem opinião, sem enrolação.",
        input: input.instrucao,
        tools: [{ type: "web_search" }] as never,
      });
      pesquisa = res.output_text ?? "";
      const urls = [...new Set(pesquisa.match(/https?:\/\/[^\s)\]]+/g) ?? [])];
      if (urls.length) fonte = urls.join("\n");
    } catch (e) {
      console.error("pesquisa do Bob falhou, seguindo sem dados frescos", e);
    }
  }

  const posicao = `ROTEIRO EM EDIÇÃO (contexto — NÃO reescreva; ⟦AQUI⟧ marca onde seu texto entra):
${input.antes}⟦AQUI⟧${input.depois}`;

  let userMsg: string;
  if (input.modo === "reescrever") {
    userMsg = `Um roteiro está sendo editado. O usuário selecionou UM trecho e pediu uma alteração só nele. Reescreva SÓ esse trecho, mantendo o papel dele no roteiro, a voz do cliente e uma extensão parecida. Ele precisa encaixar no lugar exato, emendando com o texto antes e depois. NÃO reescreva o roteiro. Responda com o TEXTO SUBSTITUTO e nada mais — sem aspas, sem rótulos, sem explicação.

ROTEIRO COMPLETO (contexto — não reescreva):
${input.roteiro}

TRECHO A SUBSTITUIR:
${input.trecho}

PEDIDO DO USUÁRIO:
${input.instrucao}`;
  } else if (input.modo === "completar") {
    userMsg = `Um roteiro está sendo editado. Escreva SÓ o texto que entra na posição ⟦AQUI⟧, na voz do cliente, emendando naturalmente com o que vem antes e depois. NÃO repita o texto ao redor, NÃO reescreva o roteiro. Responda só o texto a inserir — sem aspas, sem rótulos, sem explicação.

${posicao}

PEDIDO DO USUÁRIO:
${input.instrucao}`;
  } else {
    userMsg = `Um roteiro está sendo editado. Com base na PESQUISA abaixo, escreva SÓ o texto que entra na posição ⟦AQUI⟧, incorporando o dado com naturalidade na voz do cliente e emendando com o texto antes e depois. NÃO cole URLs no corpo do roteiro, NÃO reescreva o roteiro. Responda só o texto a inserir — sem aspas, sem rótulos, sem explicação.

${posicao}

PEDIDO DO USUÁRIO:
${input.instrucao}

PESQUISA (dados frescos com fontes — use os números, não invente):
${pesquisa || "(a pesquisa não retornou dados — não invente números; escreva o que der com conhecimento geral)"}`;
  }

  if (input.evitar) userMsg += `\n\nA sugestão anterior abaixo foi recusada — gere uma DIFERENTE:\n${input.evitar}`;

  const res = await anthropic.messages.create({
    model: WRITER_MODEL,
    max_tokens: 2000,
    // inserção pontual e bem especificada — effort low corta o custo do fable
    output_config: { effort: "low" },
    system: [
      // mesma ordem block1-estático/block2-persona do roteirista → reusa o prefixo cacheado
      { type: "text", text: buildStaticSystemBlock(ctx), cache_control: { type: "ephemeral" } },
      { type: "text", text: `${agentPrompt("roteirista")}\n\n${buildDynamicSystemBlock(ctx)}` },
    ],
    messages: [{ role: "user", content: userMsg }],
  });
  const block = res.content.find((b) => b.type === "text");
  const texto = block?.type === "text" ? dedash(block.text.trim()) : "";
  return { texto, fonte };
}
