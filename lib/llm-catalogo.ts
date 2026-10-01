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
