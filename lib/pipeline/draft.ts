import { anthropic, WRITER_MODEL } from "../anthropic";
import type { GenerationContext, ScriptSections } from "./types";

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
(uma por linha: cada dado específico do roteiro — número, percentual, data, citação, ranking — e de onde veio; se veio de material fornecido no brief, diga qual)`;

export function buildStaticSystemBlock(ctx: GenerationContext): string {
  const banned = ctx.bannedPhrases.map((b) => `- ${b.label ?? b.pattern}`).join("\n");
  return `Você é o roteirista-chefe de uma agência brasileira especializada em vídeos curtos virais (Reels/TikTok/Shorts). Você escreve roteiros para serem FALADOS em voz alta por especialistas, em português brasileiro coloquial. Sua escrita é indistinguível da de um roteirista humano experiente.

# PLAYBOOK DE HOOKS
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

  if (ctx.insights.length) {
    parts.push(
      `# INSIGHTS DE PERFORMANCE (dados reais dos ${">"}6 mil vídeos publicados pela agência)\n` +
        ctx.insights.map((i) => `## ${i.insight_type} (${i.scope})\n${JSON.stringify(i.payload)}`).join("\n\n")
    );
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
      news_link: "Notícia/artigo",
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

export async function generateDraft(ctx: GenerationContext, onToken: (t: string) => void): Promise<string> {
  const stream = anthropic.messages.stream({
    model: WRITER_MODEL,
    max_tokens: 4000,
    system: [
      { type: "text", text: buildStaticSystemBlock(ctx), cache_control: { type: "ephemeral" } },
      { type: "text", text: buildDynamicSystemBlock(ctx) },
    ],
    messages: [
      {
        role: "user",
        content: `Escreva um roteiro viral sobre o brief abaixo. Duração-alvo: 60 a 180 segundos de fala (150 a 430 palavras no corpo do roteiro — fora disso o roteiro é eliminado na revisão).\n\nBRIEF:\n${ctx.prompt}\n\n${OUTPUT_FORMAT}`,
      },
    ],
  });

  stream.on("text", onToken);
  const final = await stream.finalMessage();
  const block = final.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
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
