import { anthropic, WRITER_MODEL, recordUsage } from "../anthropic";
import { agentPrompt, bulletsBlock, clientInsightBlock, direcaoBlock, formatNarrativa, licaoRefs, licoesPara, premissaBlock, registrarBloco } from "./agents";
import { anexoModelagem, anexoReplicar } from "./replicar";
import type { EcoNumerico } from "./slop-lint";
import type { GenerationContext, ScriptSections } from "./types";

// Formato final do roteiro montado (usado por revisão e humanização).
export const OUTPUT_FORMAT = `Responda EXATAMENTE neste formato (headers literais):

## HEADLINE
(texto de tela exibido no início do vídeo, MÁXIMO 9 palavras, caixa alta, gera curiosidade lida isolada — não é o primeiro parágrafo do roteiro)

## HOOK
(o hook falado, 2 a 4 frases (a maioria com duas), seguindo pelo menos 1 MGC)

## ROTEIRO
(o roteiro falado do início ao fim, começando com o hook — mas SEM o comando/CTA final: ele vai APENAS na seção COMANDO, nunca repetido aqui)

## VARIACOES_DE_HOOK
1. (variação 1)
2. (variação 2)
3. (variação 3)

## COMANDO
(o CTA final, com benefício explícito escrito na própria frase)

## FONTES
(SÓ o nome da fonte e o link, nada mais. Um bloco por fonte: o nome do veículo ou instituição numa linha, o link completo (URL) na linha seguinte, e uma linha em branco antes da próxima fonte.
NUNCA escreva o dado, o número ou a manchete junto. NUNCA diga de que seção do dossiê veio. Nada depois do link.
O dossiê NÃO é fonte: cite o veículo ou instituição original que ele aponta, com o link dele.
Fonte que veio de material do brief e não tem URL entra só com o nome.
Exemplo:
Harris Poll
https://theharrispoll.com/exemplo

New York Times
https://nytimes.com/exemplo)`;

// Formato do roteirista-chefe: ele escreve só o corpo — hook e comando vêm dos especialistas.
const WRITER_FORMAT = `Responda EXATAMENTE neste formato (headers literais):

## HEADLINE
(texto de tela exibido no início do vídeo, MÁXIMO 9 palavras, caixa alta, gera curiosidade lida isolada)

## CORPO
(o corpo do roteiro, começando imediatamente após o hook, pronto para ser lido em voz alta; NÃO escreva o hook nem o CTA)

## FONTES
(SÓ o nome da fonte e o link, nada mais. Um bloco por fonte: o nome do veículo ou instituição numa linha, o link completo (URL) na linha seguinte, e uma linha em branco antes da próxima fonte. O dossiê traz os links.
NUNCA escreva o dado, o número ou a manchete junto. NUNCA diga de que seção do dossiê veio. Nada depois do link.
O dossiê NÃO é fonte: cite o veículo ou instituição original que ele aponta, com o link dele.
Fonte que veio de material do brief e não tem URL entra só com o nome.
Exemplo:
Harris Poll
https://theharrispoll.com/exemplo

New York Times
https://nytimes.com/exemplo)`;

// Bloco compartilhado da sala: playbooks + estilo + proibições (sem persona — cada agente traz a sua).
// Dieta do playbook: o PLAYBOOK DE STORYTELLING (~52KB) saiu daqui — a estrutura é decisão do
// agente storytelling; o roteirista recebe só o trecho da estrutura vencedora (buildDynamicSystemBlock).
export function buildStaticSystemBlock(ctx: GenerationContext): string {
  // O motivo vai junto da regra: proibição sem razão não se estende às variantes. Regras da
  // mesma família são agrupadas sob o motivo comum pra não repetir o texto 30 vezes.
  const porMotivo = new Map<string, string[]>();
  for (const b of ctx.bannedPhrases) {
    const key = b.motivo?.trim() || "";
    const arr = porMotivo.get(key) ?? [];
    arr.push(b.label ?? b.pattern);
    porMotivo.set(key, arr);
  }
  const banned = [...porMotivo.entries()]
    .map(([motivo, labels]) =>
      motivo
        ? `${labels.map((l) => `- ${l}`).join("\n")}\n  POR QUÊ: ${motivo}`
        : labels.map((l) => `- ${l}`).join("\n")
    )
    .join("\n\n");
  return `# IDIOMA (INEGOCIÁVEL)
Todo texto de saída — roteiro, hook, headline, comando, variações — SEMPRE em português do Brasil, qualquer que seja o idioma dos materiais de referência ou da transcrição.

# PLAYBOOK DE HOOKS
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

// Extrai a seção "## CHECAGEM" do dossiê (só existe quando há modelagem: o pesquisador
// verifica ali cada alegação do vídeo original). Vai inteira ao revisor — truncar a checagem
// é o mesmo que não checar. Teto de segurança pra dossiê degenerado.
export function checagemSection(dossie: string | undefined, max = 4000): string {
  if (!dossie) return "";
  // `(?![\s\S])` e não `$`: com a flag `m` o `$` casaria o fim da PRIMEIRA linha e
  // devolveria só a primeira alegação — checagem truncada é o mesmo que não checar.
  const m = dossie.match(/^#{1,3}\s*CHECAGEM\b[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|(?![\s\S]))/im);
  const corpo = m?.[1]?.trim() ?? "";
  return corpo.length <= max ? corpo : `${corpo.slice(0, max).trimEnd()}…`;
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

// Modo modelagem: o roteiro persegue o vídeo modelado, e o cliente deixa de ser referência de
// voz/tema — escrever "no tom dele, sobre os temas dele" era a interferência que descaracterizava
// a modelagem. Sobram exatamente duas licenças, e o texto insiste no default de NÃO mexer:
// o veto (proibições, inviolável) e um ajuste de autoridade só com alta confiança.
// A identidade sai de temas_preferidos — sem ela, a licença 2 nem é oferecida.
function clientModelagemBlock(p: NonNullable<GenerationContext["clientPrefs"]>): string {
  const veto = [
    p.proibicoes.length ? `PROIBIDO: ${p.proibicoes.join("; ")}` : "(sem proibições registradas)",
    p.vocabulario_evitar.length ? `Nunca usar as palavras: ${p.vocabulario_evitar.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const autoridade = p.temas_preferidos.length
    ? `\n\n2. AUTORIDADE (licença estreita) — o cliente é referência em: ${p.temas_preferidos.join(", ")}.
Só quando você tiver ALTA CONFIANÇA de que uma informação específica desse campo enriquece o roteiro E aumenta a autoridade percebida dele, faça um ajuste PONTUAL (uma frase, um dado, um exemplo). Na dúvida, não ajuste — o default é não mexer. Nunca troque a tese, o ângulo, a estrutura ou o registro por causa disso, e nunca invente experiência pessoal, cliente ou caso dele.`
    : "";
  return `# CLIENTE "${p.nome}" — INTERFERÊNCIA MÍNIMA (o usuário pediu MODELAGEM)
Escreva como se NÃO houvesse cliente selecionado: quem dita tese, ângulo, estrutura, tom e vocabulário é o material modelado, não o histórico do cliente. Duas exceções, e só elas:

1. RESTRIÇÕES DO CLIENTE (INVIOLÁVEIS) — se algo do roteiro cair aqui, adapte ou remova em silêncio, sem comentar a mudança no texto.
${veto}${autoridade}`;
}

// Restrições/voz do cliente — usado no bloco dinâmico completo, na variante enxuta
// da revisão e na modelagem (onde vira veto: ângulo incompatível nem chega a nascer).
export function clientPrefsBlock(ctx: GenerationContext): string {
  if (!ctx.clientPrefs) return "";
  const p = ctx.clientPrefs;
  if (ctx.modoModelagem) return clientModelagemBlock(p);
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
  const replicando = anexoReplicar(ctx.attachments);

  // A premissa vem PRIMEIRO, antes do dossiê e da narrativa: é o fio condutor, e tudo que vem
  // depois no contexto existe para servi-la. Sem isso o roteirista recebia molde e beats, mas
  // nada que fosse a afirmação a sustentar — e fabricava tensão frase a frase pra compensar.
  const premissa = premissaBlock(ctx);
  if (premissa) parts.push(premissa);

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

  const licoes = licoesPara(ctx, "roteirista");
  const ensinado = licoes.length ? licoes.map((r) => `- ${r.titulo} — ${r.descricao}`).join("\n") : "";
  if (ensinado) parts.push(`# APRENDIZADOS ENSINADOS PELO TIME (ritmo e regras gerais — curadoria humana, cumpra)\n${ensinado}`);

  const paleta = bulletsBlock(ctx);
  if (paleta) parts.push(paleta);

  // Rastro (015 §4.1): o que o roteirista viu, por referência. Custo zero de LLM — é
  // serialização do que esta função já montou em memória e descartava.
  registrarBloco(ctx, "roteirista", {
    modo: replicando ? "replicar" : "modelar",
    premissa: ctx.premissa || null,
    narrativa_id: ctx.artifacts?.escolhida ?? null,
    playbook_ref: ctx.playbookVersions ?? [], // slug+version, nunca o texto do playbook
    licoes: licaoRefs(licoes),
    vocabulario: ctx.clientPrefs?.vocabulario_evitar ?? [],
    prefs_cliente: ctx.clientPrefs?.proibicoes ?? [],
    paleta_emocional: paleta || null,
    // Por qual critério os 5 exemplos entraram, e a origem de cada um (que já diz o critério
    // dele — exemplo sem dado de compartilhamento entra por views mesmo com o critério trocado).
    few_shot_criterio: ctx.fewShotCriterio,
    few_shot_origens: ctx.fewShot.map((f) => f.origem),
  });

  const prefs = clientPrefsBlock(ctx);
  if (prefs) parts.push(prefs);

  if (ctx.fewShot.length) {
    parts.push(
      `# ROTEIROS REAIS DE ALTA PERFORMANCE (imite o REGISTRO e a NATURALIDADE, nunca o conteúdo)\n` +
        ctx.fewShot.map((f, i) => `## Exemplo ${i + 1} (${f.origem})\n${f.roteiro}`).join("\n\n")
    );
  }

  if (ctx.modelagemBriefs.length && replicando) {
    // REPLICAR: aqui o roteirista recebe a TRANSCRIÇÃO INTEIRA do original, e não só o brief de
    // 2.800 chars. Esconder o texto que se quer superar é pedir fidelidade de estrutura com os
    // olhos fechados — a trava contra cópia é a proibição de frase literal (agents/replicador.md),
    // não a ignorância do original.
    parts.push(
      `# ARQUITETURA DO ORIGINAL (INEGOCIÁVEL — é ela que você executa, beat a beat)\n` +
        `A ordem dos beats, a FUNÇÃO de cada um e a PROPORÇÃO de duração entre eles são do original e não se discutem. ` +
        `Você não escolhe estrutura: ela já foi escolhida e já funcionou.\n\n` +
        ctx.modelagemBriefs.join("\n\n---\n\n")
    );
    const original = replicando.raw_content?.trim();
    if (original)
      parts.push(
        `# TEXTO DO ORIGINAL (o que você vai superar — LEIA, NUNCA COPIE)\n` +
          `Este é o texto do vídeo que estamos replicando. Ele está aqui para você saber exatamente o que cada beat diz e ` +
          `quanto tempo ocupa. NENHUMA frase literal dele pode aparecer no seu roteiro: a fidelidade é de ESTRUTURA, não de texto. ` +
          `Beat a beat, o alvo é: a palavra mais simples no lugar da difícil, a palavra mais forte no lugar da morna, ` +
          `contraste onde ele só afirmou.\n\n${original.slice(0, 20000)}`
      );
  } else if (ctx.modelagemBriefs.length) {
    // O mandato da modelagem: MESMA tese, execução melhor. Ele vive aqui (prosa estática) e não
    // dentro do brief, que é só dado e tem teto de tamanho.
    parts.push(
      `# MATERIAL MODELADO — MESMA TESE, VERSÃO MELHOR\n` +
        `O usuário pediu modelagem de um material que funcionou (vídeo ou carrossel). Sua tarefa NÃO é fugir do ângulo dele, é vencê-lo no próprio ângulo: ` +
        `sustente a mesma premissa e a mesma arquitetura, executando melhor em cinco frentes —\n` +
        `1. LINGUAGEM: simplifique o que é difícil. Palavra que o espectador precisa parar pra entender é palavra que perde retenção.\n` +
        `2. ARGUMENTO: fortaleça o encadeamento. Onde o original afirmou, você demonstra.\n` +
        `3. PROVA: traga mais fato e número do dossiê que a versão original não tinha (só o que passou pela CHECAGEM).\n` +
        `4. HOOK e CONCLUSÃO: mais claros e mais consequentes que os dele.\n` +
        `5. SENTIMENTO: a recompensa emocional indicada no brief é o alvo — iguale ou supere, e siga a curva emocional dos beats.\n` +
        `Você NÃO tem o texto original e não precisa dele: escreva do zero, com as suas palavras.\n\n` +
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
      carousel_link: "Texto dos slides de um carrossel de referência",
    };
    parts.push(
      `# MATERIAIS DE REFERÊNCIA FORNECIDOS PELO USUÁRIO\n` +
        refs.map((a) => `## ${kindLabel[a.kind]}${a.url ? ` (${a.url})` : ""}\n${a.raw_content!.slice(0, 6000)}`).join("\n\n")
    );
  }

  return parts.join("\n\n");
}

// Quantos ecos vão na lista do revisor. O excedente é DITO, nunca cortado em silêncio —
// lista longa demais vira ruído e o revisor para de ler, que é o mesmo que não sinalizar.
export const TETO_ECOS = 6;

// Os sinais determinísticos viram lista de DECISÃO, não de correção (016 §6.1). O detector
// não julga: três em quatro ecos reais são texto bom — o refrão do "400%", o contraste do
// "37,5%". Por isso a instrução termina em MANTENHA, e não em corte: "não repita" produziria
// exatamente os dois cortes errados. A regra é "repetição tem que se pagar".
export function blocoSinaisRevisor(ecos: EcoNumerico[], ecoHookAbertura: boolean): string {
  const partes: string[] = [];

  if (ecos.length) {
    const listados = ecos.slice(0, TETO_ECOS);
    const linhas = listados.map(
      (e) =>
        `- "${e.valor}" aparece em ${e.frases.length} frases:\n${e.frases.map((f, i) => `    ${i + 1}. "${f}"`).join("\n")}`
    );
    const excedente =
      ecos.length > listados.length ? `\n(mais ${ecos.length - listados.length} valores repetidos não listados aqui)` : "";
    partes.push(
      `QUANTIDADES REPETIDAS (o ouvinte não distingue dois fatos com o mesmo número):\n${linhas.join("\n")}${excedente}\n` +
        `Se forem fatos diferentes, diferencie ou corte um. Se o retorno se paga (fecha arco, arma contraste, vira virada), MANTENHA.`
    );
  }

  if (ecoHookAbertura) {
    partes.push(
      `HOOK E ABERTURA DO CORPO DIZEM A MESMA COISA: o espectador ouve os dois seguidos e escuta a mesma frase duas vezes. ` +
        `Se a repetição for costura deliberada (o hook promete, a abertura confirma e avança), MANTENHA. Se for só a mesma ideia reescrita, reescreva a abertura para AVANÇAR.`
    );
  }

  return partes.join("\n\n");
}

// Variante enxuta pro agente de revisão: ele corrige contra checklist, não imita voz —
// dispensa few-shot e materiais do usuário; dossiê truncado a ~2000 chars. Briefs de
// modelagem entram: fidelidade à arquitetura-modelo é item eliminatório da revisão.
export function buildReviewDynamicBlock(ctx: GenerationContext, sinais = ""): string {
  const parts: string[] = [];
  // Eliminatório na revisão: roteiro que não sustenta a premissa é roteiro errado, por bem
  // escrito que esteja. Mesmo bloco literal do roteirista — a tese não pode divergir entre eles.
  const premissa = premissaBlock(ctx);
  if (premissa)
    parts.push(
      `${premissa}\n\nITEM ELIMINATÓRIO: o roteiro sustenta esta premissa do início ao fim? A abertura chama atenção para ela, o meio a prova, o fim entrega a consequência dela? Se ele defende outra tese, ou se dilui em duas, reescreva para a premissa acima.`
    );
  const replicando = anexoReplicar(ctx.attachments);
  if (ctx.modelagemBriefs.length) {
    parts.push(
      `# ARQUITETURA-MODELO (o usuário pediu modelagem — item ELIMINATÓRIO: verifique se o roteiro segue esta arquitetura de hook, beats e arco; aponte e corrija desvios)\n` +
        ctx.modelagemBriefs.join("\n\n---\n\n")
    );
  }
  // Replicar tem DOIS eliminatórios próprios, e os dois precisam do texto do original na mesa:
  // sem ele, "não copiou nenhuma frase" seria um palpite. O revisor é o último portão antes do
  // humanizador, que não vê o original.
  if (replicando) {
    const original = replicando.raw_content?.trim();
    parts.push(
      `# MODO REPLICAR — DOIS ITENS ELIMINATÓRIOS\n` +
        `1. DESVIO DA ESTRUTURA DO ORIGINAL: os beats têm que aparecer na MESMA ordem, com a MESMA função e a MESMA ` +
        `proporção de duração entre eles. Beat pulado, invertido, fundido, inventado, ou um beat curto do original ` +
        `virando metade do nosso roteiro é reprovação — reponha a estrutura na reescrita.\n` +
        `2. FRASE COPIADA LITERALMENTE DO ORIGINAL: fidelidade é de ESTRUTURA, nunca de texto. Qualquer frase do ` +
        `original que sobreviveu (mesmo com uma ou duas palavras trocadas) sai e é reescrita com outras palavras, ` +
        `dizendo a mesma coisa de forma mais simples e mais forte.` +
        (original ? `\n\nTEXTO DO ORIGINAL (referência de comparação — não é modelo de redação):\n${original.slice(0, 8000)}` : "")
    );
  }
  if (ctx.artifacts) {
    const a = ctx.artifacts;
    const n = a.candidatas[a.escolhida];
    if (n) parts.push(`# NARRATIVA VENCEDORA (o roteiro deve executar exatamente esta)\n${formatNarrativa(n)}`);
    if (a.orientacao_roteiro)
      parts.push(`# ORIENTAÇÃO DOS DADOS (padrões dos +6 mil vídeos publicados)\n${a.orientacao_roteiro}`);
    // A checagem vai INTEIRA e antes do dossiê truncado: é com ela que o revisor consegue
    // aplicar a PRECISÃO FACTUAL do checklist (que já é eliminatória). Cortada, é inútil.
    const checagem = checagemSection(a.dossie);
    if (checagem)
      parts.push(
        `# CHECAGEM DAS ALEGAÇÕES DO VÍDEO MODELADO (ELIMINATÓRIO)\n` +
          `Afirmação marcada como "contestado" ou "nao_verificavel" NÃO pode aparecer no roteiro como fato nosso — ` +
          `ou sai, ou é atribuída explicitamente ("segundo o vídeo original"). Corrija.\n${checagem}`
      );
    if (a.dossie) parts.push(`# DOSSIÊ DE PESQUISA (resumo — confira fatos citados)\n${a.dossie.slice(0, 2000)}`);
  }
  // O revisor passa a ser ensinável (015 §6.3): até esta linha ele era o único agente de
  // julgamento sem canal de lição — ensinar para ele gravava e não produzia efeito.
  // Sinais determinísticos desta geração (016 §6): o revisor é o juiz nomeado, e sem este
  // push os detectores das Tasks 3 e 4 gravariam no trace sem mudar nada no roteiro.
  if (sinais)
    parts.push(
      `# SINAIS AUTOMÁTICOS SOBRE ESTE ROTEIRO (detectados em código, NÃO são veredito — você decide)\n${sinais}`
    );
  // A outra metade do §5.2: o pesquisador já não emite superlativo sem fonte datada; aqui o
  // revisor trata o que escapou com o mesmo rigor que a CHECAGEM dá a "contestado".
  parts.push(
    `# SUPERLATIVO SEM FONTE (016 §5.2)\n"O maior", "o primeiro", "o único" são alegações factuais, não ênfase. ` +
      `Superlativo que o dossiê não sustenta com fonte datada sai, ou vira a afirmação menor que a fonte banca. Comparação de escala não precisa disso: ela é conta sobre número que a pesquisa trouxe.`
  );
  const licoes = licoesPara(ctx, "revisao");
  if (licoes.length)
    parts.push(
      `# APRENDIZADOS ENSINADOS PELO TIME PARA A REVISÃO (curadoria humana — prevalecem sobre padrões do corpus em conflito)\n${licoes
        .map((r) => `- ${r.titulo} — ${r.descricao}`)
        .join("\n")}`
    );
  registrarBloco(ctx, "revisao", {
    modo: replicando ? "replicar" : "modelar",
    // O checklist é o playbook `checklist` — referência por slug+version, nunca o texto.
    checklist_ref: ctx.playbookVersions?.find((p) => p.slug === "checklist") ?? null,
    licoes: licaoRefs(licoes),
  });
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
  // Replicar é outro trabalho, não outro parágrafo de instrução: prompt próprio (AGENTS.md §5).
  const replicando = anexoReplicar(ctx.attachments);
  // Com modelagem (nos dois modos) o assunto é o do material e o texto digitado é DIREÇÃO — o
  // mesmo canal que só o Replicar tinha, agora valendo para Modelar (Regra 3).
  const modelando = anexoModelagem(ctx.attachments);
  const direcao = direcaoBlock(ctx, 'recorte, ênfase ou exemplo a citar ("cite o caso X", "seja mais crítico")');
  const task = revision
    ? `Reescreva o corpo do roteiro abaixo atendendo o FEEDBACK DO USUÁRIO (prioridade máxima), mantendo a NARRATIVA VENCEDORA do seu contexto e o brief. Aproveite o que já funciona na versão anterior; mude o que o feedback pedir.\n\nVERSÃO ANTERIOR:\n${revision.anterior}\n\nFEEDBACK DO USUÁRIO:\n${revision.feedback}`
    : replicando
      ? `Escreva o corpo do roteiro replicando a ARQUITETURA DO ORIGINAL do seu contexto, beat a beat, na mesma ordem, com a mesma função e a mesma proporção de duração. Não proponha estrutura nova e não troque a tese: o ganho é frase a frase.${direcao}`
      : modelando
        ? // Modelagem: mesmo assunto e MESMA TESE do vídeo analisado, execução melhor.
          // O texto original não chega aqui de propósito — a premissa, a narrativa e o dossiê bastam.
          `Escreva o corpo do roteiro sustentando a PREMISSA do seu contexto (é a tese do vídeo modelado, confirmada pelo usuário) e executando a NARRATIVA VENCEDORA. Não invente ângulo novo: a aposta é vencer o original no mesmo ângulo, com linguagem mais simples, argumento mais forte, mais prova e conclusão mais consequente. Você NÃO tem o texto original em mãos — e não precisa dele: use os fatos do DOSSIÊ (confira a seção CHECAGEM antes de afirmar qualquer coisa) e a arquitetura da seção do vídeo modelado.${direcao}`
        : ctx.prompt.trim()
          ? `Escreva o corpo do roteiro executando a NARRATIVA VENCEDORA do seu contexto, sobre o brief abaixo.`
          : `Escreva o corpo do roteiro executando a NARRATIVA VENCEDORA do seu contexto e sustentando a PREMISSA.`;

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
      { type: "text", text: `${agentPrompt(replicando ? "replicador" : "roteirista")}\n\n${buildDynamicSystemBlock(ctx)}` },
    ],
    messages: [
      {
        role: "user",
        content: `${task} Duração-alvo: 60 a 180 segundos de fala (150 a 430 palavras no corpo — fora disso o roteiro é eliminado na revisão).${
          // Com modelagem o texto digitado já entrou como ORIENTAÇÃO na task: repeti-lo como
          // BRIEF seria oferecer ao roteirista um tema novo, que é justamente o que a Regra 3 proíbe.
          ctx.prompt.trim() && !modelando ? `\n\nBRIEF:\n${ctx.prompt}` : ""
        }\n\n${WRITER_FORMAT}`,
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

// No documento montado o hook ABRE a seção ROTEIRO — revisão e humanização precisam ver a
// emenda hook→corpo. Mas salvar as duas cópias mostrava o hook duas vezes na tela e deixava
// as duas divergirem (editar só o campo HOOK não mexia na cópia de dentro do roteiro).
// A coluna `hook` é a fonte única; o roteiro guarda só o desenvolvimento.
export function stripLeadingHook(roteiro: string, hook: string | null): string {
  if (!hook) return roteiro;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-zà-ú0-9]+/gi, " ").trim();
  const blocks = roteiro.split(/\n\s*\n/);
  if (blocks.length < 2) return roteiro; // um bloco só: cortar esvaziaria o roteiro
  const first = norm(blocks[0]);
  const h = norm(hook);
  if (first.length < 12) return roteiro; // curto demais → risco de falso positivo
  // divergiu de verdade → não corta: hook repetido é menos grave que parágrafo do corpo perdido
  if (first === h || h.includes(first) || first.includes(h)) blocks.shift();
  return blocks.join("\n\n").trimStart();
}

// As variações são escritas DEPOIS do corpo, olhando para ele, e às vezes uma delas sai
// como a primeira frase do corpo reescrita com outras palavras. Guardada, ela é inofensiva;
// no dia em que alguém troca o hook por ela (swapHook), o vídeo passa a dizer a mesma coisa
// duas vezes seguidas. Caso real: "O homem mais poderoso do PLANETA estaria morto se um
// aviso..." como variação de um corpo que abria com "O homem mais poderoso do MUNDO estaria
// morto agora se Israel...". Barreira em código, não pedido no prompt: variação que ecoa a
// abertura não chega a ser oferecida.
const PALAVRAS_VAZIAS = new Set(
  ("a o e de da do das dos em no na nos nas um uma uns umas que se por para com sem sobre " +
    "ao aos as à às pelo pela é era foi ser sendo seu sua seus suas este esta esse essa isso " +
    "aquele aquela mais menos muito ja nao sim como quando onde qual quais tao ate entao " +
    "voce vocês ele ela eles elas eu nos meu minha depois antes agora aqui ali la").split(" ")
);

const conteudo = (frase: string): Set<string> =>
  new Set(
    frase
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((p) => p.length > 2 && !PALAVRAS_VAZIAS.has(p))
  );

const primeiraFrase = (texto: string) => texto.trim().split(/(?<=[.!?])\s+/)[0] ?? texto.trim();

// Compara só a PRIMEIRA frase de cada lado: o que incomoda o espectador é ouvir a mesma
// abertura duas vezes seguidas, não duas frases que dividem vocabulário lá adiante.
const MIN_PALAVRAS_EM_COMUM = 4; // frase curta divide metade das palavras por acaso
const LIMITE_ECO = 0.5;

export function ecoa(a: string, b: string): boolean {
  const pa = conteudo(primeiraFrase(a));
  const pb = conteudo(primeiraFrase(b));
  if (!pa.size || !pb.size) return false;
  let comuns = 0;
  for (const p of pa) if (pb.has(p)) comuns++;
  return comuns >= MIN_PALAVRAS_EM_COMUM && comuns / Math.min(pa.size, pb.size) >= LIMITE_ECO;
}

/**
 * O par que nunca foi olhado: o hook ESCOLHIDO contra o primeiro bloco do corpo — os dois trechos
 * que o espectador ouve seguidos. Não descarta nada; hook e abertura ecoarem pode ser costura
 * deliberada. Só devolve o sinal, e o revisor decide.
 *
 * Identidade é PULADA, não sinalizada (§7): `stripLeadingHook` é fuzzy e pode não cortar, e nesse
 * caso o "primeiro bloco" é o próprio hook — eco de 100% por construção, falso positivo garantido.
 */
export function hookEcoaAbertura(hook: string | null, corpo: string | null): boolean {
  if (!hook?.trim() || !corpo?.trim()) return false;
  const abertura = corpo.split(/\n\s*\n/)[0] ?? "";
  // mesma comparação fuzzy de stripLeadingHook: se ela cortaria, os dois lados são o mesmo texto
  const norm = (s: string) => s.toLowerCase().replace(/[^a-zà-ú0-9]+/gi, " ").trim();
  const h = norm(hook);
  const a = norm(abertura);
  if (h === a || h.includes(a) || a.includes(h)) return false;
  return ecoa(hook, abertura);
}

/** Descarta as variações de hook que só reescrevem a abertura do roteiro. */
export function semEcoDaAbertura(variantes: string[] | null, roteiro: string | null): string[] {
  if (!variantes?.length || !roteiro?.trim()) return variantes ?? [];
  const abertura = roteiro.split(/\n\s*\n/)[0] ?? "";
  return variantes.filter((v) => !ecoa(v, abertura));
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
