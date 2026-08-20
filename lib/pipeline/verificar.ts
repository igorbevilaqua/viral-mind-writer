import { ANALYST_MODEL, trackedCreate, type UsageLog } from "../anthropic";
import { agentPrompt, fontesBlock, toolArray, toolInput } from "./agents";
import { falhaDeInfra } from "../grok";
import { procedencia } from "./estudos";
import { grokPesquisa } from "./grok-search";
import { ehRastreada } from "./delta";

// Verificação factual (017): as duas chamadas Anthropic do pipeline de 5 passos, o passo 3
// (busca) e a orquestração 1→4. Passo 1 extrai as alegações do roteiro FINAL; passo 4 julga o
// delta com a evidência de busca já em mãos. O passo 2 mora em `delta.ts`; o 5 (ação) não mora aqui.

export const VEREDICTOS = ["confirmado", "impreciso", "falso", "nao_verificavel"] as const;
export type TipoVeredicto = (typeof VEREDICTOS)[number];

export interface Fonte {
  url: string;
  veiculo: string;
  ano: string;
}

export interface Veredicto {
  alegacao: string;
  trecho_literal: string;
  veredicto: TipoVeredicto;
  fonte: Fonte | null;
  correcao: string | null;
  explicacao: string;
  /**
   * Domínio da fonte quando ela sustenta um `confirmado` mas está FORA do
   * `fontes-autoritativas.json`. O veredicto continua valendo — o JSON não é exaustivo, e
   * recusar por isso reprovava `blog.google` sobre um anúncio do próprio Google. A marca é o que
   * impede que essa confirmação seja lida como uma de tier 1.
   * Opcional: os registros já gravados (inclusive a v3) seguem válidos sem o campo.
   */
  fonte_fraca?: string | null;
}

export interface ItemBusca {
  alegacao: string;
  busca: { texto: string; fontes: string[] };
}

// Teto de saída com folga: o sonnet-5 pensa por padrão dentro do mesmo teto, e thinking que
// come o orçamento trunca o `tool_use` — o mesmo motivo do 8000 em `modelagem.ts:325-327`.
const MAX_TOKENS = 8000;

// Sem anotação `Anthropic.Tool` de propósito nas duas: o teste de contrato lê
// `.input_schema.properties.<x>...enum`, e `Anthropic.Tool` apaga esse formato (input_schema vira
// índice aberto). A inferência do literal é o que mantém o acesso tipado. (Mesmo caso de
// `classify-teaching.ts:24-26`.)
export const ALEGACOES_TOOL = {
  name: "registrar_alegacoes",
  description: "Registra as alegações factuais verificáveis encontradas no roteiro final.",
  input_schema: {
    type: "object" as const,
    properties: {
      alegacoes: {
        type: "array",
        items: { type: "string" },
        description:
          "uma alegação por item, COPIADA LITERALMENTE do roteiro (texto EXATO, caractere a caractere, nunca paráfrase nem resumo) e autocontida o bastante para ser checada sozinha",
      },
    },
    required: ["alegacoes"],
  },
};

export const VERIFICACAO_TOOL = {
  name: "registrar_verificacao",
  description: "Registra o veredicto de cada alegação verificada, um registro por alegação.",
  input_schema: {
    type: "object" as const,
    properties: {
      itens: {
        type: "array",
        items: {
          type: "object" as const,
          properties: {
            alegacao: { type: "string", description: "a alegação como ela aparece no roteiro, copiada" },
            trecho_literal: {
              type: "string",
              description:
                "o texto EXATO do roteiro que carrega o problema, copiado caractere a caractere — ele é substituído LITERALMENTE no roteiro por uma máquina, então paráfrase, resumo ou reescrita fazem a correção não aplicar",
            },
            veredicto: { type: "string", enum: [...VEREDICTOS] },
            fonte: {
              type: "object" as const,
              properties: {
                url: { type: "string" },
                veiculo: { type: "string" },
                ano: { type: "string" },
              },
              required: ["url", "veiculo", "ano"],
              description: "a fonte que sustenta o veredicto; omita só em nao_verificavel",
            },
            correcao: {
              type: "string",
              description:
                "o dado certo, pronto para entrar no lugar do trecho_literal. Só quando veredicto=impreciso E o dado certo é conhecido",
            },
            explicacao: { type: "string", description: "uma frase: o que está errado, ou o que a fonte confirma" },
          },
          required: ["alegacao", "trecho_literal", "veredicto", "explicacao"],
        },
      },
    },
    required: ["itens"],
  },
};

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

function lerFonte(v: unknown): Fonte | null {
  const f = v as Partial<Fonte> | null | undefined;
  const url = str(f?.url);
  // Sem URL não é fonte: é uma citação de memória, exatamente o que o prompt proíbe.
  return url ? { url, veiculo: str(f?.veiculo), ano: str(f?.ano) } : null;
}

/**
 * Fronteira de confiança da saída do modelo. A peça não pode mentir "verificado" (§3.1, §11):
 * qualquer coisa que não seja um veredicto do enum sustentado por fonte cai para
 * `nao_verificavel` — a degradação segura, nunca para `confirmado`.
 */
export function sanitizarVeredicto(raw: unknown, alegacaoOriginal: string): Veredicto {
  const r = (raw ?? {}) as Record<string, unknown>;
  const alegacao = str(r.alegacao) || alegacaoOriginal;
  // Sem trecho_literal a correção cirúrgica não roda, mas o veredicto ainda vale como aviso —
  // a alegação já é texto do roteiro (a tool de extração exige cópia literal).
  const trecho_literal = str(r.trecho_literal) || alegacao;
  const fonte = lerFonte(r.fonte);

  const v = str(r.veredicto) as TipoVeredicto;
  const valido = (VEREDICTOS as readonly string[]).includes(v);
  if (!valido) console.error(`verificador: veredicto fora do enum (${JSON.stringify(r.veredicto)}) — ${alegacao.slice(0, 120)}`);

  // A HIERARQUIA DE FONTES entra aqui, e ela MARCA — não recusa. O `fontes-autoritativas.json`
  // não é exaustivo: o próprio `_comentario` dele diz que tier 0 (site do dono do fato) é
  // "contextual, tratado no prompt", e a docstring de `extrairEstudos` já decidiu a semântica
  // para o dossiê — "domínio fora do JSON entra REBAIXADO, porque o JSON não é exaustivo e
  // descartar por isso jogaria fora estudo legítimo" (016 §5.1).
  // Recusar era mais rígido que a régua que esta função diz copiar, e a rodada real provou o
  // custo: `blog.google` sustentando um anúncio DO PRÓPRIO GOOGLE virou `nao_verificavel`, com
  // `confirmado` caindo de 8/14 para 1/11. O ganho de verdade não era rejeitar
  // `bestcolleges.com` — era ele parar de passar como confirmação LIMPA.
  const proc = fonte ? procedencia(fonte.url) : null;
  const fonte_fraca = v === "confirmado" && fonte && proc?.tier == null ? proc?.dominio || fonte.url : null;

  // `confirmado` sem fonte NENHUMA continua não confirmando nada — isso é ausência de fonte, não
  // procedência fraca. `falso` e `impreciso` seguem intocados por tier: rebaixá-los apagaria o
  // aviso, que é o oposto da direção segura.
  const veredicto: TipoVeredicto = !valido || (v === "confirmado" && !fonte) ? "nao_verificavel" : v;

  return {
    alegacao,
    trecho_literal,
    veredicto,
    fonte,
    // O domínio, não um booleano: quem lê o aviso precisa saber DE QUEM é a fonte para julgar.
    // A explicação do verificador fica intacta — a marca carrega o sinal, sem reescrever o que
    // ele apurou.
    fonte_fraca,
    // correcao só existe em impreciso (§7) — o modelo às vezes preenche por inércia.
    correcao: veredicto === "impreciso" ? str(r.correcao) || null : null,
    explicacao: str(r.explicacao) || (valido ? "" : "veredicto inválido do verificador; tratado como não verificável"),
  };
}

/**
 * Passo 1 (§5): extrai as alegações factuais do roteiro FINAL — o que saiu de roteirista, revisor
 * e humanizador, não o insumo. Falha aqui derruba a verificação inteira: o selo dirá "não
 * verificado", nunca "verificado, 0 problemas" (§11).
 */
export async function extrairAlegacoes(
  roteiro: { hook: string; roteiro: string; comando: string },
  log?: UsageLog
): Promise<string[]> {
  const res = await trackedCreate(log, "verificacao_alegacoes", {
    model: ANALYST_MODEL,
    max_tokens: MAX_TOKENS,
    tools: [ALEGACOES_TOOL],
    tool_choice: { type: "tool", name: "registrar_alegacoes" },
    // Sem cache_control, e medido: o prefixo cacheável daqui (tools + system) dá 1.845 tokens,
    // ABAIXO do mínimo de 2.048 do sonnet — a API ignorava o bloco em silêncio, então o cache
    // nunca existiu. E o prefixo nunca casaria com o do passo 4: `tools` entra no prefixo ANTES
    // do system, e as duas chamadas usam tools diferentes.
    // ponytail: só vale voltar se os dois passos passarem a compartilhar tools+system (aí o
    // passo 4 leria o que o passo 1 escreveu) ou se este prefixo crescer além de 2.048.
    system: [{ type: "text", text: agentPrompt("verificador") }],
    messages: [
      {
        role: "user",
        content: `Este é o roteiro FINAL, como vai ao ar. Nesta chamada você NÃO classifica nada — você só levanta o que há de verificável nele.

Liste cada fato verificável: nomes, cargos, números, datas, eventos, relações de causa e efeito, citações, superlativos e status atual. Opinião, promessa, chamada para ação, hipérbole e figura de linguagem NÃO são alegações factuais — deixe fora. Quem apresenta se identificar ("eu sou X", "aqui é o X") também não é alegação a checar: é a assinatura do vídeo, não um fato sobre o mundo.

Cada alegação tem que ser COPIADA LITERALMENTE do roteiro, caractere a caractere. O texto que você devolver vai ser casado com o roteiro por uma máquina; paráfrase quebra o casamento. Copie o pedaço mínimo que ainda se sustenta sozinho — se o número só faz sentido com o sujeito, traga a frase inteira.

HOOK:
${roteiro.hook}

ROTEIRO:
${roteiro.roteiro}

COMANDO:
${roteiro.comando}

Registre pela tool.`,
      },
    ],
    // effort medium: este passo COPIA frases do roteiro e o prompt proíbe julgar qualquer uma
    // delas — o thinking adaptativo em `high` (default do sonnet-5) está raciocinando sobre uma
    // tarefa de transcrição. Menos thinking também deixa mais dos 8000 tokens para o tool_use,
    // que é o que trunca quando o orçamento acaba.
  }, "medium");

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("verificador: extração de alegações sem saída estruturada");
  return toolArray<string>(toolInput(toolUse), "alegacoes")
    .map((a) => (typeof a === "string" ? a.trim() : ""))
    .filter(Boolean);
}

/**
 * Passo 4 (§5): julga o delta em lote, com a evidência de busca já em mãos.
 * O agente **não recebe o roteiro** (§6.2) — recebe alegação e evidência. Julgamento de fato não
 * precisa de contexto narrativo, e mandar o roteiro convida o modelo a opinar sobre qualidade,
 * que o próprio prompt dele proíbe.
 */
export async function classificar(itens: ItemBusca[], log?: UsageLog): Promise<Veredicto[]> {
  if (!itens.length) return [];

  const dossieDeBusca = itens
    .map(
      (it, i) => `### ALEGAÇÃO ${i + 1}
${it.alegacao}

RESULTADO DA BUSCA WEB:
${it.busca.texto.trim() || "(a busca não retornou nada)"}
FONTES: ${it.busca.fontes.length ? it.busca.fontes.join(", ") : "(nenhuma)"}`
    )
    .join("\n\n");

  const res = await trackedCreate(log, "verificacao_classificacao", {
    model: ANALYST_MODEL,
    max_tokens: MAX_TOKENS,
    tools: [VERIFICACAO_TOOL],
    tool_choice: { type: "tool", name: "registrar_verificacao" },
    // Sem cache_control, e medido: o prefixo daqui dá ~2.185 tokens (passa do mínimo, então
    // ESTE escrevia cache de verdade), mas ninguém lê — nenhuma outra chamada usa
    // VERIFICACAO_TOOL, e a segunda rodada da mesma sessão chega tarde demais. Em produção as 3
    // varreduras `completa` rodaram 36-45 min depois da geração, contra um TTL de 5 min: 1
    // escrita, 0 leituras, ~546 tokens de prêmio jogados fora por rodada.
    // `fontesBlock` FICA: ele é a régua que faz o modelo escolher uma fonte de tier bom, e o
    // portão de código novo em `sanitizarVeredicto` só sabe rejeitar depois do fato.
    system: [{ type: "text", text: agentPrompt("verificador") }, { type: "text", text: fontesBlock() }],
    messages: [
      {
        role: "user",
        content: `A busca web já foi feita para cada alegação abaixo e o resultado está junto dela — é sobre essa evidência que você julga. Não invente fonte que não esteja aí: busca vazia, contraditória ou que não fala da alegação = \`nao_verificavel\`, nunca \`confirmado\`.

Você recebe as alegações soltas, sem o roteiro em volta, de propósito. Não comente estilo, qualidade, ordem ou escolha editorial: você verifica fato.

Um registro por alegação, TODAS as ${itens.length}, na mesma ordem, com a alegação copiada exatamente como está aqui.

${dossieDeBusca}

Registre pela tool.`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("verificador: classificação sem saída estruturada");
  const crus = toolArray<Record<string, unknown>>(toolInput(toolUse), "itens");

  // Nenhum corte silencioso: a saída tem uma linha por alegação DE ENTRADA. O modelo casa por
  // texto (a alegação é copiada literalmente); quando ele pula uma, ela volta como
  // `nao_verificavel` em vez de sumir da tabela.
  const porAlegacao = new Map(crus.map((c) => [str(c?.alegacao), c]));
  return itens.map((it) => {
    // Casamento SÓ por texto. Havia um fallback posicional aqui (`crus[i]` quando as contagens
    // batiam) e ele era o único ponto da peça que degradava para o lado INSEGURO: modelo que
    // devolve N itens fora de ordem colava o veredicto de uma alegação em OUTRA — inclusive um
    // `confirmado` com a fonte errada. Sem ele, o descasamento cai em `nao_verificavel` com
    // motivo, que é a degradação certa.
    const cru = porAlegacao.get(it.alegacao.trim());
    if (!cru) console.error(`verificador: sem veredicto para "${it.alegacao.slice(0, 120)}"`);
    return sanitizarVeredicto(
      cru ?? { alegacao: it.alegacao, explicacao: "o verificador não devolveu veredicto para esta alegação" },
      it.alegacao
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Passo 3 (busca) e a orquestração dos passos 1→4 (§5, §8, §11)
// ─────────────────────────────────────────────────────────────────────────────

export type Regime = "delta" | "completa";

export interface ItemVerificado extends Veredicto {
  /** marcada pela correção cirúrgica (§7.1), nunca aqui. */
  aplicada?: boolean;
  /**
   * O Bob reescreveu o trecho deste item (caminho do `falso`, que não tem `correcao` pronta).
   * Campo separado de `aplicada` de propósito, e é o §11 que exige a separação: `aplicada`
   * significa "o dado certo, que a verificação JÁ TINHA em mãos, entrou no lugar"; `reescrito`
   * significa "uma máquina escreveu texto novo que NINGUÉM verificou". O veredicto continua
   * `falso` porque ele fala do texto ANTIGO — só uma nova rodada pode falar do novo.
   */
  reescrito?: boolean;
}

/** A forma do §9 — o que vai para `vm_generated_scripts.verificacao`. Montar não é gravar. */
export interface RegistroVerificacao {
  at: string;
  regime: Regime;
  dossie_presente: boolean;
  /**
   * Motivo de a INFRA de busca ter caído (crédito/cota/chave), quando caiu. Existe porque
   * `nao_verificavel` cobria dois mundos opostos com o mesmo 🔍: "procurei e não achei fonte
   * confiável" (veredicto real) e "não consegui nem buscar" (nada foi checado). Opcional: os
   * registros já gravados em jsonb seguem válidos sem ele.
   */
  busca_indisponivel?: string | null;
  total_alegacoes: number;
  rastreadas: number;
  verificadas: number;
  excedentes: number;
  itens: ItemVerificado[];
}

export interface DepsVerificacao {
  buscar: (query: string) => Promise<{ texto: string; fontes: string[] }>;
  extrair: typeof extrairAlegacoes;
  classificar: typeof classificar;
}

/**
 * Teto de alegações buscadas por rodada. 20 porque é o que os dois tetos reais permitem: 20
 * buscas simultâneas cabem no `maxDuration = 300` da geração, e 20 veredictos cabem nos 8000
 * tokens de saída do passo 4 com folga para o thinking do sonnet. O excedente NÃO some — vai
 * para `itens` como "não verificada nesta rodada" e o botão de varredura completa drena.
 * ponytail: teto simples; se roteiros de 40+ alegações virarem rotina, quebrar o passo 4 em
 * lotes de 20 é a saída, não subir o número.
 */
export const TETO_POR_RODADA = 20;

// A MESMA função que o Bob usa, não uma cópia. Import estático: `grok-search.ts` é módulo
// próprio justamente para não arrastar o grafo de contexto (Supabase na carga) atrás dela.
const DEPS_PADRAO: DepsVerificacao = { buscar: grokPesquisa, extrair: extrairAlegacoes, classificar };

const queryDe = (alegacao: string) =>
  `Esta afirmação é factualmente correta? Traga os dados atuais e a URL da fonte de cada um: "${alegacao}"`;

// Degradação segura em forma de item: nunca `confirmado`, nunca sem motivo visível (§11).
const naoVerificavel = (alegacao: string, explicacao: string): ItemVerificado => ({
  alegacao,
  trecho_literal: alegacao,
  veredicto: "nao_verificavel",
  fonte: null,
  correcao: null,
  explicacao,
});

/**
 * Orquestra a verificação: extrair (1) → filtro de delta (2) → buscar em paralelo (3) →
 * classificar (4). Devolve o registro do §9 **sem gravar** — quem persiste é a rota.
 *
 * Regime `completa` (§4.3) pula o filtro: toda alegação vira delta. É o que o usuário aciona
 * quando está inseguro, e a única forma de auditar o próprio dossiê pelo produto.
 *
 * Paralelizar o passo 3 é requisito, não otimização (§8): N buscas sequenciais não cabem no
 * `maxDuration`. E `onProgresso` alimenta o heartbeat de 15s — fase longa e silenciosa derruba
 * a conexão no proxy da Hostinger.
 */
export async function verificarRoteiro(
  args: {
    roteiro: { hook: string; roteiro: string; comando: string };
    dossie: string;
    regime: Regime;
    log?: UsageLog;
    onProgresso?: (e: { etapa: string; feito?: number; total?: number }) => void;
  },
  deps: DepsVerificacao = DEPS_PADRAO
): Promise<RegistroVerificacao> {
  const { roteiro, dossie, regime, log, onProgresso } = args;

  onProgresso?.({ etapa: "extraindo" });
  const alegacoes = await deps.extrair(roteiro, log);

  const delta = regime === "completa" ? alegacoes : alegacoes.filter((a) => !ehRastreada(a, dossie));
  const aBuscar = delta.slice(0, TETO_POR_RODADA);
  const excedentes = delta.slice(TETO_POR_RODADA);

  onProgresso?.({ etapa: "buscando", feito: 0, total: aBuscar.length });
  let feito = 0;
  // Primeiro motivo de infra visto na rodada — sobe ao registro para a tela poder gritar.
  let buscaIndisponivel: string | null = null;
  // Fail-soft POR ALEGAÇÃO (§11): o try/catch é de cada busca, não da rodada. Uma exceção
  // marca aquela alegação e as outras seguem — `Promise.all` só vê promessas resolvidas.
  const buscas = await Promise.all(
    aBuscar.map(async (alegacao) => {
      try {
        return { alegacao, busca: await deps.buscar(queryDe(alegacao)), motivo: "busca falhou" };
      } catch (e) {
        console.error(`verificacao: busca falhou — ${alegacao.slice(0, 120)}`, e);
        // Crédito/cota estourado não é "não achei fonte": NADA foi checado. O motivo entra no
        // item e no registro, senão o selo mostra 🔍 igual a um veredicto de verdade.
        const infra = falhaDeInfra(e);
        if (infra) buscaIndisponivel ??= infra;
        return { alegacao, busca: null, motivo: infra ? `a busca não rodou: ${infra}` : "busca falhou" };
      } finally {
        onProgresso?.({ etapa: "buscando", feito: ++feito, total: aBuscar.length });
      }
    })
  );

  // Busca falha não vai para o passo 4: sem evidência, não há o que julgar, e o julgamento
  // determinístico aqui é o que garante que ela nunca vire `confirmado`.
  const comBusca = buscas.flatMap((b, i) => (b.busca ? [{ i, item: { alegacao: b.alegacao, busca: b.busca } }] : []));
  onProgresso?.({ etapa: "classificando", total: comBusca.length });
  const veredictos = comBusca.length ? await deps.classificar(comBusca.map((c) => c.item), log) : [];

  const itens: ItemVerificado[] = buscas.map((b) => naoVerificavel(b.alegacao, b.motivo));
  comBusca.forEach(({ i, item }, k) => {
    itens[i] = veredictos[k] ?? naoVerificavel(item.alegacao, "o verificador não devolveu veredicto para esta alegação");
  });
  for (const a of excedentes) {
    itens.push(naoVerificavel(a, `não verificada nesta rodada (teto de ${TETO_POR_RODADA} alegações por rodada)`));
  }

  return {
    at: new Date().toISOString(),
    regime,
    dossie_presente: Boolean(dossie?.trim()),
    busca_indisponivel: buscaIndisponivel,
    total_alegacoes: alegacoes.length,
    // Rastreada passa direto por decisão de regime (§4.1) — conta, mas não vira linha na tabela.
    rastreadas: alegacoes.length - delta.length,
    // Tentadas nesta rodada, inclusive as de busca falha: elas têm linha e motivo.
    verificadas: aBuscar.length,
    excedentes: excedentes.length,
    itens,
  };
}
