import { anthropic, WRITER_MODEL, recordUsage } from "../anthropic";
import { agentPrompt, clientInsightBlock, formatNarrativa, taughtBlock } from "./agents";
import type { GenerationContext, ScriptSections } from "./types";

// Formato final do roteiro montado (usado por revisão e humanização).
export const OUTPUT_FORMAT = `Responda EXATAMENTE neste formato (headers literais):

## HEADLINE
(texto de tela exibido no início do vídeo, MÁXIMO 9 palavras, caixa alta, gera curiosidade lida isolada — não é o primeiro parágrafo do roteiro)

## HOOK
(o hook falado, 1-3 períodos, seguindo pelo menos 1 MGC)

## ROTEIRO
(o roteiro falado do início ao fim, começando com o hook — mas SEM o comando/CTA final: ele vai APENAS na seção COMANDO, nunca repetido aqui)

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
// Dieta do playbook: o PLAYBOOK DE STORYTELLING (~52KB) saiu daqui — a estrutura é decisão do
// agente storytelling; o roteirista recebe só o trecho da estrutura vencedora (buildDynamicSystemBlock).
export function buildStaticSystemBlock(ctx: GenerationContext): string {
  const banned = ctx.bannedPhrases.map((b) => `- ${b.label ?? b.pattern}`).join("\n");
  return `# PLAYBOOK DE HOOKS
${ctx.playbooks.hook ?? "(sem playbook)"}

# PLAYBOOK DE COMANDO/CTA
${ctx.playbooks.comando ?? "(sem playbook)"}

# GUIA DE ESTILO (INEGOCIÁVEL)
${ctx.playbooks.style_guide ?? ""}

# FRASES E PADRÕES TERMINANTEMENTE PROIBIDOS
${banned}`;
}

// Extrai do playbook de storytelling só a seção da estrutura vencedora, por heading "## ".
// Match por código ("A1") ou nome ("Jornada do Herói"); não achou → "" e o roteirista segue
// só com a narrativa formatada (que já carrega estrutura e beats).
export function extractPlaybookSection(playbook: string | undefined, estrutura: string | undefined): string {
  if (!playbook || !estrutura) return "";
  const dot = estrutura.indexOf(".");
  const code = (dot > 0 ? estrutura.slice(0, dot) : "").trim();
  const nome = (dot > 0 ? estrutura.slice(dot + 1) : estrutura).trim().toLowerCase();
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sections = playbook.split(/\n(?=##\s)/);
  const hit = sections.find((s) => {
    const heading = (s.split("\n")[0] ?? "").trim();
    if (!heading.startsWith("##")) return false;
    if (code && new RegExp(`(^|[^\\w])${escape(code)}([^\\w]|$)`).test(heading)) return true;
    return Boolean(nome) && heading.toLowerCase().includes(nome);
  });
  return hit?.trim() ?? "";
}

// Índice condensado do playbook (heading "## " + primeiras linhas de cada seção) —
// vocabulário suficiente pra classificar sem pagar o playbook inteiro no contexto.
export function playbookIndex(playbook: string | undefined): string {
  if (!playbook) return "";
  return playbook
    .split(/\n(?=##\s)/)
    .filter((s) => s.startsWith("##"))
    .map((s) => s.split("\n").slice(0, 7).join("\n").trim())
    .join("\n\n");
}

// Restrições/voz do cliente — usado no bloco dinâmico completo e na variante enxuta da revisão.
function clientPrefsBlock(ctx: GenerationContext): string {
  if (!ctx.clientPrefs) return "";
  const p = ctx.clientPrefs;
  return `# RESTRIÇÕES DO CLIENTE "${p.nome}" (INVIOLÁVEIS)
${p.proibicoes.length ? `PROIBIDO: ${p.proibicoes.join("; ")}` : "(sem proibições registradas)"}
${p.vocabulario_evitar.length ? `Nunca usar as palavras: ${p.vocabulario_evitar.join(", ")}` : ""}

# VOZ DO CLIENTE
${p.tom_de_voz ? `Tom: ${p.tom_de_voz}` : ""}
${p.vocabulario_usar.length ? `Preferir vocabulário: ${p.vocabulario_usar.join(", ")}` : ""}
${p.temas_preferidos.length ? `Temas preferidos: ${p.temas_preferidos.join(", ")}` : ""}
${p.notas_entrevista ? `Notas da entrevista: ${p.notas_entrevista}` : ""}`;
}

export function buildDynamicSystemBlock(ctx: GenerationContext): string {
  const parts: string[] = [];

  if (ctx.artifacts) {
    const a = ctx.artifacts;
    if (a.dossie) parts.push(`# DOSSIÊ DE PESQUISA (fatos verificados em tempo real)\n${a.dossie}`);
    const n = a.candidatas[a.escolhida];
    if (n) {
      parts.push(`# NARRATIVA VENCEDORA (escolhida pela sala — execute exatamente esta)\n${formatNarrativa(n)}`);
      // dieta do playbook: só o trecho da estrutura vencedora chega ao roteirista
      const trecho = extractPlaybookSection(ctx.playbooks.storytelling, n.estrutura);
      if (trecho) parts.push(`# ESTRUTURA "${n.estrutura}" (trecho do playbook — siga esta arquitetura)\n${trecho}`);
    }
    if (a.orientacao_roteiro)
      parts.push(`# ORIENTAÇÃO DOS DADOS (padrões dos +6 mil vídeos publicados)\n${a.orientacao_roteiro}`);
  }

  const boasPraticas = clientInsightBlock(ctx, ["geral"], 4);
  if (boasPraticas) parts.push(`# BOAS PRÁTICAS DESTE CLIENTE (aprendidas dos dados de performance)\n${boasPraticas}`);

  const ensinado = taughtBlock(ctx, ["ritmo", "geral"]);
  if (ensinado) parts.push(`# APRENDIZADOS ENSINADOS PELO TIME (ritmo e regras gerais — curadoria humana, cumpra)\n${ensinado}`);

  const prefs = clientPrefsBlock(ctx);
  if (prefs) parts.push(prefs);

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

// Variante enxuta pro agente de revisão: ele corrige contra checklist, não imita voz —
// dispensa few-shot e materiais do usuário; dossiê truncado a ~2000 chars. Briefs de
// modelagem entram: fidelidade à arquitetura-modelo é item eliminatório da revisão.
export function buildReviewDynamicBlock(ctx: GenerationContext): string {
  const parts: string[] = [];
  if (ctx.modelagemBriefs.length) {
    parts.push(
      `# ARQUITETURA-MODELO (o usuário pediu modelagem — item ELIMINATÓRIO: verifique se o roteiro segue esta arquitetura de hook, beats e arco; aponte e corrija desvios)\n` +
        ctx.modelagemBriefs.join("\n\n---\n\n")
    );
  }
  if (ctx.artifacts) {
    const a = ctx.artifacts;
    const n = a.candidatas[a.escolhida];
    if (n) parts.push(`# NARRATIVA VENCEDORA (o roteiro deve executar exatamente esta)\n${formatNarrativa(n)}`);
    if (a.orientacao_roteiro)
      parts.push(`# ORIENTAÇÃO DOS DADOS (padrões dos +6 mil vídeos publicados)\n${a.orientacao_roteiro}`);
    if (a.dossie) parts.push(`# DOSSIÊ DE PESQUISA (resumo — confira fatos citados)\n${a.dossie.slice(0, 2000)}`);
  }
  const prefs = clientPrefsBlock(ctx);
  if (prefs) parts.push(prefs);
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

  const t0 = Date.now();
  const stream = anthropic.messages.stream({
    model: WRITER_MODEL,
    // streaming, mas o teto ainda cobre thinking (sempre on no fable-5) + o corpo escrito.
    // 4000 podia truncar o corpo no meio; 8000 dá folga (streaming evita timeout de HTTP).
    // effort mantém o default (high): o draft é a peça de qualidade da geração.
    max_tokens: 8000,
    system: [
      // block 1 = estático idêntico compartilhado (cacheado): humanizador e rewriteFragment usam
      // o MESMO block 1 no MESMO modelo (fable) → leem este prefixo com ~90% de desconto.
      // Persona no block 2, fora do cache, pra não fragmentar o prefixo por agente.
      { type: "text", text: buildStaticSystemBlock(ctx), cache_control: { type: "ephemeral" } },
      { type: "text", text: `${agentPrompt("roteirista")}\n\n${buildDynamicSystemBlock(ctx)}` },
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
  recordUsage(ctx.usageLog, "roteiro", WRITER_MODEL, Date.now() - t0, final.usage);
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

// O roteiro é "falado do início ao fim" e o comando é o fechamento — os agentes tendem
// a repetir o CTA no fim do roteiro E na seção COMANDO. Corta a repetição do fim do roteiro.
export function stripTrailingComando(roteiro: string, comando: string): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-zà-ú0-9]+/gi, " ").trim();
  const cmd = norm(comando);
  if (cmd.length < 12) return roteiro; // comando curto demais → risco de falso positivo
  const blocks = roteiro.split(/\n\s*\n/);
  // No máximo 1 bloco, e só se o último for longo o bastante — o while antigo
  // comia múltiplos blocos finais curtos legítimos contidos no comando.
  if (blocks.length > 1) {
    const last = norm(blocks[blocks.length - 1]);
    if (last.length >= 12 && (last === cmd || cmd.includes(last) || last.includes(cmd))) blocks.pop();
  }
  return blocks.join("\n\n").trimEnd();
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
