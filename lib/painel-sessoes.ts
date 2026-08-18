import { UUID_RE } from "./generation";

// O painel passou a listar duas coisas: roteiro (vm_sessions) e debate (vm_kasparov_threads).
// O que é decisão pura mora aqui, longe das queries e do JSX, porque é aqui que mora o bug
// silencioso: filtro que esconde uma linha que devia aparecer não quebra nada, só mente.

export type TipoDoPainel = "roteiro" | "kasparov";

/** `?cliente=a&cliente=b` (a janela de marcar/desmarcar) → ids válidos, sem repetição. */
export function clientesDoFiltro(param: string | string[] | undefined): string[] {
  const brutos = Array.isArray(param) ? param : param ? param.split(",") : [];
  return [...new Set(brutos.map((c) => c.trim()).filter((c) => UUID_RE.test(c)))];
}

/**
 * Este tipo entra na lista, com estes filtros?
 *
 * Filtro de tipo é explícito e manda em tudo. Filtro de status é filtro de ROTEIRO: debate não
 * tem status nenhum, então pedir "publicada" e ainda receber conversa do Kasparov no meio seria
 * ruído — e escondê-lo sem dizer por quê seria pior. A tela some com os chips de status quando
 * o tipo é kasparov, justamente para a combinação não existir.
 */
export function entraNoPainel(tipo: TipoDoPainel, tipoParam?: string, statusParam?: string): boolean {
  if (tipoParam === "roteiros") return tipo === "roteiro";
  if (tipoParam === "kasparov") return tipo === "kasparov";
  return tipo === "roteiro" || !statusParam;
}

/**
 * A linha de roteiro passa pelo chip de status ativo?
 *
 * `aguardando_premissa` tem chip próprio ("Aguardando você") porque é o estado que EXIGE ação
 * humana: sem ele, qualquer chip ativo escondia exatamente a sessão que estava parada esperando
 * alguém — o pior estado possível para ficar invisível.
 *
 * "publicada" é derivado do roteiro, não da sessão; os demais comparam com o status efetivo
 * (já resolvido para `stalled` quando a geração morreu).
 */
export function casaComStatus(statusParam: string | undefined, linha: { effStatus: string; published: boolean }): boolean {
  switch (statusParam) {
    case undefined:
    case "":
      return true;
    case "publicada":
      return linha.published;
    case "gerando":
      return linha.effStatus === "generating";
    case "aguardando":
      return linha.effStatus === "aguardando_premissa";
    case "pronta":
      return linha.effStatus === "done" && !linha.published;
    case "encerrada":
      return linha.effStatus === "closed";
    case "interrompida":
      return linha.effStatus === "stalled";
    // Status desconhecido na URL não esconde a lista inteira (link antigo, chip removido).
    default:
      return true;
  }
}

/**
 * As duas listas em uma, mais recente primeiro. `quando` é ISO em UTC nas duas tabelas, então
 * comparar string basta e não paga o custo de N Date().
 *
 * Roteiro ordena por criação (é quando a sessão nasceu) e debate por última atualização (é
 * quando o último turno aconteceu): conversa retomada hoje precisa subir, senão ela fica
 * enterrada na data de uma semana atrás e "recuperável" volta a ser teoria.
 */
export function mesclarPainel<T extends { quando: string }>(linhas: T[][], teto = 100): T[] {
  return linhas
    .flat()
    .sort((a, b) => b.quando.localeCompare(a.quando))
    .slice(0, teto);
}
