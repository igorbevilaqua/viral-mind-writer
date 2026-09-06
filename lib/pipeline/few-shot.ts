// Escolha dos 5 exemplos que o roteirista imita (e cujos 2 primeiros viram a "Referência de
// voz" do humanizador). Lógica PURA: sem db, sem OpenAI — o ranking é a decisão que está em
// discussão e ela precisa ser testável sem env, mesmo motivo de lib/performance-metrics.ts.
import { fmtNum } from "../format";

// O critério de hoje é `views`. `taxa_compartilhamento` só entra com aprovação humana
// explícita (fila do Kasparov + migration 0036) — trocar o critério troca ~4 dos 5 exemplos.
export type CriterioFewShot = "views" | "taxa_compartilhamento";
export const CRITERIO_PADRAO: CriterioFewShot = "views";

// WP-G (plano 020): de onde o exemplo veio. "cliente" só existe quando ≥3 candidatos do cliente
// entraram; com menos, o conjunto inteiro é "global" — o trace não finge escopo que não houve.
export type EscopoFewShot = "cliente" | "global";
const MIN_DO_CLIENTE = 3;

export interface CandidatoFewShot {
  roteiro: string;
  views: number;
  /**
   * null = SEM DADO, nunca zero: YouTube não tem coleta de compartilhamento (0 de 2.266 vídeos
   * do corpus) e só ~46% dos documents casam com métrica diária. Vídeo sem dado não pode ser
   * ranqueado como se compartilhasse zero — ele cai no fallback (views), explicitamente.
   */
  compartilhamentos: number | null;
  /** clientes.id via canais.cliente_id; null = vídeo sem canal/cliente conhecido */
  clienteId?: string | null;
}

export interface ExemploFewShot {
  roteiro: string;
  origem: string;
  views: number;
  taxa: number | null;
  /** por qual critério ESTE exemplo entrou. Diferente do pedido = entrou por fallback. */
  criterio: CriterioFewShot;
  /** null = ranking sem cliente (Kasparov avulso, sessão sem cliente): texto de origem inalterado */
  escopo: EscopoFewShot | null;
}

/** Compartilhamentos ÷ views. null quando falta qualquer um dos dois — nunca 0 por omissão. */
export function taxaCompartilhamento(c: CandidatoFewShot): number | null {
  return c.compartilhamentos != null && c.views > 0 ? c.compartilhamentos / c.views : null;
}

const pct = (t: number) => `${(t * 100).toFixed(2)}%`;

// A origem vai para o prompt E para o pipeline_trace, e o verbo "Por quê?" a lê de lá: ela tem
// que dizer por qual critério o exemplo entrou, senão o rastro mente quando o critério muda.
function origemDe(
  c: CandidatoFewShot,
  entrouPor: CriterioFewShot,
  pedido: CriterioFewShot,
  escopo: EscopoFewShot | null
): string {
  const fonte = `roteiro publicado (corpus${escopo ? `, ${escopo}` : ""})`;
  const taxa = taxaCompartilhamento(c);
  if (entrouPor === "taxa_compartilhamento" && taxa != null)
    return `${fonte} — ${pct(taxa)} de compartilhamento em ${fmtNum(c.views)} views, entrou por taxa de compartilhamento`;
  if (!c.views) return `${fonte} — sem dado de performance, ordem por similaridade`;
  const semDado = pedido === "taxa_compartilhamento" ? ", sem dado de compartilhamento" : "";
  return `${fonte} — ${fmtNum(c.views)} views${semDado}, entrou por views`;
}

const exemplo = (
  c: CandidatoFewShot,
  entrouPor: CriterioFewShot,
  pedido: CriterioFewShot,
  escopo: EscopoFewShot | null
): ExemploFewShot => ({
  roteiro: c.roteiro,
  origem: origemDe(c, entrouPor, pedido, escopo),
  views: c.views,
  taxa: taxaCompartilhamento(c),
  criterio: c.views ? entrouPor : CRITERIO_PADRAO,
  escopo,
});

// O pool inteiro ordenado pelo critério, com o critério pelo qual CADA um entrou.
function ordenar(candidatos: readonly CandidatoFewShot[], criterio: CriterioFewShot): [CandidatoFewShot, CriterioFewShot][] {
  const temViews = candidatos.some((c) => c.views > 0);
  const porViews = temViews ? [...candidatos].sort((a, b) => b.views - a.views) : [...candidatos];
  if (criterio === "views") return porViews.map((c) => [c, "views"]);

  const comTaxa = candidatos
    .filter((c) => taxaCompartilhamento(c) != null)
    .sort((a, b) => taxaCompartilhamento(b)! - taxaCompartilhamento(a)!);
  const semTaxa = porViews.filter((c) => taxaCompartilhamento(c) == null);
  return [...comTaxa.map((c): [CandidatoFewShot, CriterioFewShot] => [c, "taxa_compartilhamento"]), ...semTaxa.map((c): [CandidatoFewShot, CriterioFewShot] => [c, "views"])];
}

/**
 * Os `n` exemplos do pool de candidatos, pelo critério pedido.
 * - `views`: comportamento de sempre — nenhum candidato com views mantém a ordem de similaridade.
 * - `taxa_compartilhamento`: quem TEM dado ranqueia por taxa; quem não tem completa as vagas
 *   pelo critério de hoje (views), marcado na origem. Ausência de dado nunca vira taxa zero.
 * - `clientId` com ≥3 candidatos do cliente: os dele primeiro (pelo critério), globais completam
 *   as vagas (pelo critério). Com menos de 3, ranking global — e a origem diz "global".
 */
export function rankFewShot(
  candidatos: readonly CandidatoFewShot[],
  criterio: CriterioFewShot = CRITERIO_PADRAO,
  clientId: string | null = null,
  n = 5
): ExemploFewShot[] {
  const doCliente = clientId ? candidatos.filter((c) => c.clienteId === clientId) : [];
  if (doCliente.length < MIN_DO_CLIENTE)
    return ordenar(candidatos, criterio)
      .slice(0, n)
      .map(([c, por]) => exemplo(c, por, criterio, clientId ? "global" : null));
  const globais = candidatos.filter((c) => c.clienteId !== clientId);
  return [
    ...ordenar(doCliente, criterio).map(([c, por]) => exemplo(c, por, criterio, "cliente")),
    ...ordenar(globais, criterio).map(([c, por]) => exemplo(c, por, criterio, "global")),
  ].slice(0, n);
}

/** Escopo efetivo do conjunto: "cliente" só quando exemplos do cliente entraram (≥3, por construção). */
export function escopoFewShot(exemplos: readonly ExemploFewShot[]): EscopoFewShot {
  return exemplos.some((e) => e.escopo === "cliente") ? "cliente" : "global";
}

export interface MetricasVideo {
  views: number;
  compartilhamentos: number | null;
  clienteId?: string | null;
}

/** Linhas do RPC `match_documents` + métricas do corpus → candidatos. Puro para ser testável. */
export function candidatosDeDocumentos(
  rows: readonly { content?: string | null; video_id?: string | null; metadata?: unknown }[],
  metricas: ReadonlyMap<string, MetricasVideo> = new Map()
): CandidatoFewShot[] {
  return rows
    .filter((r) => r.content)
    .map((r) => {
      const m = r.video_id ? metricas.get(r.video_id) : undefined;
      // views do metadata primeiro: é o número que o critério de hoje usa, e trocá-lo aqui
      // mudaria silenciosamente o ranking por views junto com a mudança de critério.
      return {
        roteiro: r.content as string,
        views: Number((r.metadata as { views?: unknown } | null)?.views) || m?.views || 0,
        compartilhamentos: m?.compartilhamentos ?? null,
        clienteId: m?.clienteId ?? null,
      };
    });
}

// ── A comparação que vai à mesa do humano (fila do Kasparov) ────────────────────────────────

export interface ExemploResumo {
  trecho: string;
  views: number;
  taxa: number | null;
  /** entrou pelo critério de fallback (views) por falta de dado de compartilhamento */
  fallback: boolean;
}

export interface ComparacaoCriterio {
  tema: string;
  /** quantos dos 5 exemplos mudariam se o critério trocasse */
  mudam: number;
  views: ExemploResumo[];
  taxa: ExemploResumo[];
}

const resumo = (e: ExemploFewShot, pedido: CriterioFewShot): ExemploResumo => ({
  trecho: e.roteiro.replace(/\s+/g, " ").trim().slice(0, 180),
  views: e.views,
  taxa: e.taxa,
  fallback: e.criterio !== pedido,
});

/**
 * Os DOIS conjuntos lado a lado, para um tema real. `null` quando não há decisão a tomar —
 * ninguém com dado de compartilhamento, ou os dois conjuntos idênticos. Botão no escuro (ou
 * botão que não muda nada) é pior que nenhum botão.
 */
export function resumirComparacao(
  tema: string,
  candidatos: readonly CandidatoFewShot[],
  n = 5
): ComparacaoCriterio | null {
  if (!candidatos.some((c) => taxaCompartilhamento(c) != null)) return null;
  const porViews = rankFewShot(candidatos, "views", null, n);
  const porTaxa = rankFewShot(candidatos, "taxa_compartilhamento", null, n);
  const atuais = new Set(porViews.map((e) => e.roteiro));
  const mudam = porTaxa.filter((e) => !atuais.has(e.roteiro)).length;
  if (!mudam) return null;
  return {
    tema,
    mudam,
    views: porViews.map((e) => resumo(e, "views")),
    taxa: porTaxa.map((e) => resumo(e, "taxa_compartilhamento")),
  };
}
