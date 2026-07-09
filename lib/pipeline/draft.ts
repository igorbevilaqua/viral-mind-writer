import { anthropic, WRITER_MODEL } from "../anthropic";
import { agentPrompt, clientInsightBlock, formatNarrativa, taughtBlock } from "./agents";
import type { GenerationContext, ScriptSections } from "./types";

// Formato final do roteiro montado (usado por revisão e humanização).
export const OUTPUT_FORMAT = `Responda EXATAMENTE neste formato (headers literais):

## HEADLINE
(texto de tela exibido no início do vídeo, MÁXIMO 9 palavras, caixa alta, gera curiosidade lida isolada — não é o primeiro parágrafo do roteiro)

## HOOK
(o hook falado, 1-3 períodos, seguindo pelo menos 1 MGC)

## ROTEIRO
(o roteiro completo, incluindo o hook no início, pronto para ser lido em voz alta)

## VARIACOES_DE_HOOK
1. (variação 1)
2. (variação 2)
3. (variação 3)

## COMANDO
(o CTA final, com benefício explícito escrito na própria frase)

## FONTES
(uma por linha: cada dado específico do roteiro — número, percentual, data, citação, ranking — e de onde veio, SEMPRE com o link completo (URL) da fonte quando existir; se veio de material fornecido no brief, diga qual)`;

// Formato do roteirista-chefe: ele escreve só o corpo — hook e comando vêm dos especialistas.
const WRITER_FORMAT = `Responda EXATAMENTE neste formato (headers literais):

## HEADLINE
(texto de tela exibido no início do vídeo, MÁXIMO 9 palavras, caixa alta, gera curiosidade lida isolada)

## CORPO
(o corpo do roteiro, começando imediatamente após o hook, pronto para ser lido em voz alta; NÃO escreva o hook nem o CTA)

## FONTES
(uma por linha: cada dado específico do corpo — número, percentual, data, citação, ranking — e de onde veio, SEMPRE com o link completo (URL) da fonte quando existir — o dossiê traz os links; se veio de material fornecido no brief, diga qual)`;

// Bloco compartilhado da sala: playbooks + estilo + proibições (sem persona — cada agente traz a sua).
export function buildStaticSystemBlock(ctx: GenerationContext): string {
  const banned = ctx.bannedPhrases.map((b) => `- ${b.label ?? b.pattern}`).join("\n");
  return `# PLAYBOOK DE HOOKS
${ctx.playbooks.hook ?? "(sem playbook)"}

# PLAYBOOK DE STORYTELLING
${ctx.playbooks.storytelling ?? "(sem playbook)"}

# PLAYBOOK DE COMANDO/CTA
${ctx.playbooks.comando ?? "(sem playbook)"}

# GUIA DE ESTILO (INEGOCIÁVEL)
${ctx.playbooks.style_guide ?? ""}

# FRASES E PADRÕES TERMINANTEMENTE PROIBIDOS
${banned}`;
}

export function buildDynamicSystemBlock(ctx: GenerationContext): string {
  const parts: string[] = [];

  if (ctx.artifacts) {
    const a = ctx.artifacts;
    if (a.dossie) parts.push(`# DOSSIÊ DE PESQUISA (fatos verificados em tempo real)\n${a.dossie}`);
    const n = a.candidatas[a.escolhida];
    if (n) parts.push(`# NARRATIVA VENCEDORA (escolhida pela sala — execute exatamente esta)\n${formatNarrativa(n)}`);
    if (a.orientacao_roteiro)
      parts.push(`# ORIENTAÇÃO DOS DADOS (padrões dos +6 mil vídeos publicados)\n${a.orientacao_roteiro}`);
  }

  const boasPraticas = clientInsightBlock(ctx, ["geral"], 4);
  if (boasPraticas) parts.push(`# BOAS PRÁTICAS DESTE CLIENTE (aprendidas dos dados de performance)\n${boasPraticas}`);

  const ensinado = taughtBlock(ctx, ["ritmo", "geral"]);
  if (ensinado) parts.push(`# APRENDIZADOS ENSINADOS PELO TIME (ritmo e regras gerais — curadoria humana, cumpra)\n${ensinado}`);

  if (ctx.clientPrefs) {
    const p = ctx.clientPrefs;
    parts.push(`# RESTRIÇÕES DO CLIENTE "${p.nome}" (INVIOLÁVEIS)
${p.proibicoes.length ? `PROIBIDO: ${p.proibicoes.join("; ")}` : "(sem proibições registradas)"}
${p.vocabulario_evitar.length ? `Nunca usar as palavras: ${p.vocabulario_evitar.join(", ")}` : ""}

# VOZ DO CLIENTE
${p.tom_de_voz ? `Tom: ${p.tom_de_voz}` : ""}
${p.vocabulario_usar.length ? `Preferir vocabulário: ${p.vocabulario_usar.join(", ")}` : ""}
${p.temas_preferidos.length ? `Temas preferidos: ${p.temas_preferidos.join(", ")}` : ""}
${p.notas_entrevista ? `Notas da entrevista: ${p.notas_entrevista}` : ""}`);
  }

  if (ctx.fewShot.length) {
    parts.push(
      `# ROTEIROS REAIS DE ALTA PERFORMANCE (imite o REGISTRO e a NATURALIDADE, nunca o conteúdo)\n` +
        ctx.fewShot.map((f, i) => `## Exemplo ${i + 1} (${f.origem})\n${f.roteiro}`).join("\n\n")
    );
  }

  if (ctx.modelagemBriefs.length) {
    parts.push(
      `# ESTRUTURA-MODELO (o usuário pediu modelagem: siga esta ARQUITETURA à risca, NUNCA o texto original)\n` +
        ctx.modelagemBriefs.join("\n\n---\n\n")
    );
  }

  const refs = ctx.attachments.filter((a) => !a.is_modelagem && a.raw_content);
  if (refs.length) {
    const kindLabel: Record<string, string> = {
      reference_script: "Roteiro de referência",
      news_link: "Comentários do usuário sobre a notícia (o conteúdo dela está no dossiê; estes comentários orientam o ângulo)",
      document: "Documento",
      video_link: "Transcrição de vídeo de referência",
    };
    parts.push(
      `# MATERIAIS DE REFERÊNCIA FORNECIDOS PELO USUÁRIO\n` +
        refs.map((a) => `## ${kindLabel[a.kind]}${a.url ? ` (${a.url})` : ""}\n${a.raw_content!.slice(0, 6000)}`).join("\n\n")
    );
  }

  return parts.join("\n\n");
}

export interface WriterOutput {
  headline: string | null;
  corpo: string;
  fontes: string | null;
}

// 4. Roteirista-chefe: escreve o CORPO executando a narrativa vencedora (streaming).
// Com `revision`, reescreve a versão anterior atendendo o feedback do usuário.
export async function generateDraft(
  ctx: GenerationContext,
  onToken: (t: string) => void,
  revision?: { anterior: string; feedback: string }
): Promise<WriterOutput> {
  const task = revision
    ? `Reescreva o corpo do roteiro abaixo atendendo o FEEDBACK DO USUÁRIO (prioridade máxima), mantendo a NARRATIVA VENCEDORA do seu contexto e o brief. Aproveite o que já funciona na versão anterior; mude o que o feedback pedir.\n\nVERSÃO ANTERIOR:\n${revision.anterior}\n\nFEEDBACK DO USUÁRIO:\n${revision.feedback}`
    : `Escreva o corpo do roteiro executando a NARRATIVA VENCEDORA do seu contexto, sobre o brief abaixo.`;

  const stream = anthropic.messages.stream({
    model: WRITER_MODEL,
    // streaming, mas o teto ainda cobre thinking (sempre on no fable-5) + o corpo escrito.
    // 4000 podia truncar o corpo no meio; 8000 dá folga (streaming evita timeout de HTTP).
    max_tokens: 8000,
    system: [
      { type: "text", text: `${agentPrompt("roteirista")}\n\n${buildStaticSystemBlock(ctx)}`, cache_control: { type: "ephemeral" } },
      { type: "text", text: buildDynamicSystemBlock(ctx) },
    ],
    messages: [
      {
        role: "user",
        content: `${task} Duração-alvo: 60 a 180 segundos de fala (150 a 430 palavras no corpo — fora disso o roteiro é eliminado na revisão).\n\nBRIEF:\n${ctx.prompt}\n\n${WRITER_FORMAT}`,
      },
    ],
  });

  stream.on("text", onToken);
  const final = await stream.finalMessage();
  const block = final.content.find((b) => b.type === "text");
  const text = block?.type === "text" ? block.text : "";

  const grab = (header: string) => {
    const m = text.match(new RegExp(`##\\s*${header}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i"));
    return m ? m[1].trim() : null;
  };
  return {
    headline: grab("HEADLINE"),
    corpo: grab("CORPO") ?? text.trim(),
    fontes: grab("FONTES"),
  };
}

export function parseSections(text: string): ScriptSections {
  const grab = (header: string) => {
    const m = text.match(new RegExp(`##\\s*${header}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i"));
    return m ? m[1].trim() : null;
  };
  const variantsRaw = grab("VARIACOES_DE_HOOK") ?? grab("VARIAÇÕES_DE_HOOK") ?? "";
  const hookVariants = variantsRaw
    .split(/\n\d+\.\s*/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return {
    headline: grab("HEADLINE"),
    hook: grab("HOOK"),
    roteiro: grab("ROTEIRO") ?? text.trim(),
    hookVariants,
    comando: grab("COMANDO"),
    fontes: grab("FONTES"),
  };
}
