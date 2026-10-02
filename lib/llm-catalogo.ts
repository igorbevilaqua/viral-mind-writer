// O inventário de quem pensa pelo Codex, em um lugar só.
//
// Puro de propósito: sem SDK, sem supabase, sem next. A tela de configuração é client
// component e lê daqui; o resolvedor do servidor (lib/llm-config.ts) também. Duas listas
// divergiriam no dia em que um modelo novo entrasse, e a divergência só apareceria como
// opção fantasma na tela ou 400 no meio de uma geração.

export type Provedor = "anthropic" | "xai";

/**
 * Os modelos que o Codex pode usar.
 *
 * `toolForcada` é a propriedade que mais importa aqui e não dá para inferir pelo nome: a
 * geração 5.5 e o Fable 5.1 rejeitam `tool_choice` do tipo `tool`/`any` com 400 (conferido
 * contra a API em 01/10/2026). Metade das funções abaixo arranca JSON do modelo por tool
 * obrigatória, e para essas um modelo sem `toolForcada` não é uma opção pior: é uma opção
 * que quebra. A tela filtra por isso em vez de confiar em quem escolhe.
 */
export const MODELOS = [
  { id: "claude-opus-5-5", nome: "Opus 5.5", provedor: "anthropic", toolForcada: false, nota: "mais barato, mais direto" },
  { id: "claude-sonnet-5-5", nome: "Sonnet 5.5", provedor: "anthropic", toolForcada: false, nota: "rápido e econômico" },
  { id: "claude-fable-5-1", nome: "Fable 5.1", provedor: "anthropic", toolForcada: false, nota: "o mais capaz, e o mais caro" },
  { id: "claude-fable-5", nome: "Fable 5", provedor: "anthropic", toolForcada: true, nota: "prosa mais literária" },
  { id: "claude-opus-5", nome: "Opus 5", provedor: "anthropic", toolForcada: true, nota: "geração anterior, equilibrado" },
  { id: "claude-sonnet-5", nome: "Sonnet 5", provedor: "anthropic", toolForcada: true, nota: "bom padrão para análise" },
  { id: "claude-haiku-4-5", nome: "Haiku 4.5", provedor: "anthropic", toolForcada: true, nota: "o mais barato, para tarefa simples" },
  { id: "grok-4.3", nome: "Grok 4.3", provedor: "xai", toolForcada: true, nota: "o único com busca na web ao vivo" },
] as const;

export type ModeloId = (typeof MODELOS)[number]["id"];

export const modelo = (id: string) => MODELOS.find((m) => m.id === id);
export const nomeDoModelo = (id: string) => modelo(id)?.nome ?? id;

/**
 * Cada coisa que o Codex faz pensando, com o nome que ela tem para quem usa o produto.
 *
 * `resumo` é a linha que a tela mostra embaixo do nome, e ela existe para a pessoa reconhecer
 * a função sem abrir o código: "Crítica do roteiro" não diz nada sozinho, "lê o rascunho e
 * aponta o que está fraco antes de você ver" diz.
 *
 * `toolObrigatoria: true` quer dizer que a função arranca a resposta do modelo por tool
 * forçada — a lista de opções dela exclui os modelos que rejeitam isso.
 *
 * `fixo: true` é função que não se troca por aqui: pesquisa roda no Grok porque é o único com
 * busca ao vivo, e trocar o provedor não é mudar um id, é mudar o cliente. Ela aparece na
 * tela mesmo assim — a pergunta "quem faz a pesquisa?" tem resposta, e escondê-la só faria
 * alguém procurar.
 */
export const FUNCOES_LLM = [
  {
    slug: "escrita",
    nome: "Escrita do roteiro",
    resumo: "escreve o rascunho, o hook e as reescritas de trecho",
    padrao: "claude-opus-5-5",
    toolObrigatoria: false,
  },
  {
    slug: "premissa",
    nome: "Definição da tese",
    resumo: "decide o que o vídeo afirma, antes de qualquer pesquisa",
    padrao: "claude-sonnet-5",
    toolObrigatoria: true,
  },
  {
    slug: "pesquisa",
    nome: "Pesquisa na web",
    resumo: "busca os fatos, números e fontes que entram no roteiro",
    padrao: "grok-4.3",
    toolObrigatoria: true,
    fixo: true,
  },
  {
    slug: "narrativas",
    nome: "Ângulos narrativos",
    resumo: "propõe os caminhos possíveis do vídeo e rankeia qual conta melhor",
    padrao: "claude-sonnet-5",
    toolObrigatoria: true,
  },
  {
    slug: "comando",
    nome: "Chamada para ação",
    resumo: "escreve o fecho que pede o comentário, o seguir, o clique",
    padrao: "claude-sonnet-5",
    toolObrigatoria: true,
  },
  {
    slug: "critica",
    nome: "Crítica do roteiro",
    resumo: "lê o rascunho e aponta o que está fraco antes de você ver",
    padrao: "claude-sonnet-5",
    toolObrigatoria: true,
  },
  {
    slug: "checagem",
    nome: "Checagem de fatos",
    resumo: "confere cada afirmação do roteiro contra as fontes",
    padrao: "claude-sonnet-5",
    toolObrigatoria: true,
  },
  {
    slug: "modelagem",
    nome: "Autópsia de vídeo",
    resumo: "disseca o vídeo que você mandou modelar e extrai o esqueleto dele",
    padrao: "claude-sonnet-5",
    toolObrigatoria: true,
  },
  {
    slug: "ideador",
    nome: "Sugestão de temas",
    resumo: "olha os dados do cliente e propõe assuntos com chance de viralizar",
    padrao: "claude-sonnet-5",
    toolObrigatoria: true,
  },
  {
    slug: "calibracao",
    nome: "Calibração de hooks",
    resumo: "gera as variantes de hook que o time compara no jogo de calibração",
    padrao: "claude-opus-5-5",
    toolObrigatoria: false,
  },
  {
    slug: "carrossel",
    nome: "Carrossel",
    resumo: "transforma o roteiro pronto em slides de carrossel",
    padrao: "claude-sonnet-5",
    toolObrigatoria: true,
  },
  {
    slug: "aprendizado",
    nome: "Aprendizado da casa",
    resumo: "lê o que o time ensina e o que foi publicado, e vira playbook",
    padrao: "claude-sonnet-5",
    toolObrigatoria: true,
  },
  {
    slug: "kasparov",
    nome: "Kasparov",
    resumo: "o sparring que debate as decisões do sistema com o time",
    padrao: "claude-sonnet-5",
    toolObrigatoria: true,
  },
] as const;

export type FuncaoLLM = (typeof FUNCOES_LLM)[number];
export type FuncaoSlug = FuncaoLLM["slug"];

export const funcao = (slug: string) => FUNCOES_LLM.find((f) => f.slug === slug);

/** As opções que a tela oferece para uma função: mesmo provedor, e que aguentem o que ela faz. */
export function opcoesDe(slug: string) {
  const f = funcao(slug);
  if (!f) return [];
  const provedor: Provedor = f.padrao.startsWith("grok") ? "xai" : "anthropic";
  return MODELOS.filter(
    (m) => m.provedor === provedor && (!f.toolObrigatoria || m.toolForcada)
  );
}

/** Valida o que veio do cliente: fora das opções da própria função, nada vale. */
export const modeloValidoPara = (slug: string, id: unknown): string | null =>
  typeof id === "string" && opcoesDe(slug).some((m) => m.id === id) ? id : null;

// ─── Custo estimado de um roteiro ────────────────────────────────────────────

type Tokens = { entrada: number; saida: number; cacheEscrita: number; cacheLeitura: number };

/**
 * Preço por milhão de tokens, em dólar, na API da Anthropic.
 *
 * Fonte: https://platform.claude.com/docs/en/about-claude/pricing, conferido em 02/10/2026.
 * `cacheEscrita` é o cache de 5 minutos, o único que o Codex usa (cache_control: ephemeral).
 * A leitura de cache NÃO é 10% do input em todo modelo: o opus-5-5 cobra 5% e o fable-5-1
 * cobra 2,5% — por isso as quatro colunas vêm copiadas da tabela, e não derivadas da entrada.
 *
 * Recalibrar = reabrir aquela página e conferir as quatro colunas. Modelo fora daqui custa
 * zero na conta (o Grok é o caso real: provedor diferente, e a função dele é fixa).
 */
export const PRECO_POR_MTOK: Record<string, Tokens> = {
  "claude-fable-5-1": { entrada: 10, saida: 50, cacheEscrita: 12.5, cacheLeitura: 0.25 },
  "claude-fable-5": { entrada: 10, saida: 50, cacheEscrita: 12.5, cacheLeitura: 1 },
  "claude-opus-5-5": { entrada: 4, saida: 20, cacheEscrita: 5, cacheLeitura: 0.2 },
  "claude-opus-5": { entrada: 5, saida: 25, cacheEscrita: 6.25, cacheLeitura: 0.5 },
  "claude-sonnet-5-5": { entrada: 2, saida: 10, cacheEscrita: 2.5, cacheLeitura: 0.2 },
  "claude-sonnet-5": { entrada: 2, saida: 10, cacheEscrita: 2.5, cacheLeitura: 0.2 },
  "claude-haiku-4-5": { entrada: 1, saida: 5, cacheEscrita: 1.25, cacheLeitura: 0.1 },
};

/**
 * Quanto um roteiro gasta em cada função, em tokens. NÃO é chute: é a mediana do que os
 * roteiros gastaram de verdade.
 *
 * Medido em 02/10/2026 sobre `vm_generated_scripts.pipeline_trace.usage` — a telemetria que
 * recordUsage grava por fase — nos 165 roteiros dos últimos 45 dias. As fases foram somadas
 * por função antes da mediana, porque uma função paga mais de uma chamada: `escrita` é
 * roteiro + hook + humanização (e a humanização chama ~2,5 vezes, contando os retries),
 * `narrativas` é propor + rankear, `checagem` é alegações + classificação.
 *
 * Recalibrar é rodar a mesma consulta de novo e trocar os números daqui.
 *
 * ponytail: mediana de QUEM RODOU, não média sobre todos os roteiros. Premissa roda em 17%
 * dos roteiros (só quando não é digitada), narrativas em 62% (modelar e replicar pulam) e
 * checagem em 87% — então a conta é a de um roteiro completo, que é o teto típico, e não o
 * custo médio da casa. Para o custo médio, o caminho é somar o usage real por mês em vez de
 * estimar por mediana.
 */
export const TOKENS_POR_ROTEIRO: Record<string, Tokens> = {
  escrita: { entrada: 33976, saida: 11609, cacheEscrita: 22115, cacheLeitura: 15066 },
  narrativas: { entrada: 36776, saida: 4764, cacheEscrita: 0, cacheLeitura: 0 },
  checagem: { entrada: 16820, saida: 2960, cacheEscrita: 0, cacheLeitura: 0 },
  critica: { entrada: 11382, saida: 8000, cacheEscrita: 7533, cacheLeitura: 0 },
  premissa: { entrada: 3294, saida: 516, cacheEscrita: 0, cacheLeitura: 0 },
  comando: { entrada: 2328, saida: 66, cacheEscrita: 0, cacheLeitura: 0 },
};

/** O que uma função custa num roteiro, em dólar, se quem pensa ela for `modeloId`. */
export function custoDaFuncao(slug: string, modeloId: string): number {
  const t = TOKENS_POR_ROTEIRO[slug];
  const p = PRECO_POR_MTOK[modeloId];
  if (!t || !p) return 0;
  return (
    (t.entrada * p.entrada +
      t.saida * p.saida +
      t.cacheEscrita * p.cacheEscrita +
      t.cacheLeitura * p.cacheLeitura) /
    1_000_000
  );
}

/** O roteiro inteiro, em dólar, com o mapa de modelos que a tela está mostrando. */
export const custoDoRoteiro = (mapa: Record<string, string>): number =>
  Object.keys(TOKENS_POR_ROTEIRO).reduce(
    (soma, slug) => soma + custoDaFuncao(slug, mapa[slug] ?? funcao(slug)?.padrao ?? ""),
    0
  );

/** US$ com duas casas e vírgula decimal. Centavo é a unidade que importa aqui. */
export const emDolar = (v: number) => `US$ ${v.toFixed(2).replace(".", ",")}`;
