import { viralData } from "../db";

// A ESTRATÉGIA VIGENTE DO CLIENTE, vinda do Cockpit (hub.planos + hub.pulsos).
//
// Por que existe: o Cockpit decide o ciclo (a frase, as apostas, os territórios, o que está
// em teste) e até hoje essa decisão morria na tela dele. A sala escrevia sem saber qual
// hipótese está sendo testada — e o Oráculo media um resultado que ninguém tinha declarado
// como intenção. Isto fecha o elo: decisão -> roteiro -> medição -> decisão.
//
// NÃO reimplementa nada. `hub_painel_estrategia_atual` já resolve qual plano está valendo
// (o mais recente submetido/aprovado) e já emenda os pulsos posteriores. Aqui só se lê e
// formata. Se o Cockpit mudar a regra do que "está valendo", a sala acompanha de graça.
//
// Mix e KPIs do plano ficam de fora de propósito: são planejamento de produção (quantos
// vídeos de cada tipo, meta de views do ciclo). Quem escreve UM roteiro não age sobre eles,
// e todo token aqui entra em todos os prompts da sala.

type Hipotese = { texto?: string; evidencia_n?: number | null; aposta?: boolean };
type Teste = { texto?: string; criterio?: string | null };
type Ajuste = { semana?: string; decisao?: string; sinal?: string | null; ajuste?: string | null };

const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Formata o jsonb de `hub_painel_estrategia_atual`. Payload ausente/vazio → "". */
export function formatarEstrategia(raw: unknown): string {
  const est = raw as { plano?: Record<string, unknown> | null; ajustes?: unknown } | null;
  const plano = est?.plano;
  if (!plano) return "";

  const partes: string[] = [];

  const frase = texto(plano.plano_resumo);
  if (frase) partes.push(`A FRASE DO CICLO: ${frase}`);

  // Ajustes ANTES das apostas: são mais recentes que o plano, e ler a aposta original sem
  // saber que ela foi emendada é o jeito de escrever o vídeo errado (mesma ordem da tela).
  const ajustes = lista(est?.ajustes)
    .slice(0, 3)
    .map((a) => {
      const x = a as Ajuste;
      const corpo = texto(x.ajuste) || texto(x.sinal);
      return corpo ? `- ${corpo}` : "";
    })
    .filter(Boolean);
  if (ajustes.length) partes.push(`AJUSTES DESDE ENTÃO (valem sobre o plano original):\n${ajustes.join("\n")}`);

  const apostas = lista(plano.decisoes).map(texto).filter(Boolean);
  if (apostas.length) partes.push(`AS APOSTAS DO CICLO:\n${apostas.map((d, i) => `${i + 1}. ${d}`).join("\n")}`);

  const testes = lista(plano.testes)
    .map((t) => {
      const x = t as Teste;
      const t0 = texto(x.texto);
      if (!t0) return "";
      const c = texto(x.criterio);
      return c ? `- ${t0} (dá certo se: ${c})` : `- ${t0}`;
    })
    .filter(Boolean);
  if (testes.length) partes.push(`EM TESTE AGORA:\n${testes.join("\n")}`);

  // Só hipótese com evidência: "achamos que" não é material de decisão para quem escreve.
  const sabidos = lista(plano.hipoteses)
    .map((h) => h as Hipotese)
    .filter((h) => texto(h.texto) && Number(h.evidencia_n) > 0)
    .slice(0, 5)
    .map((h) => `- ${texto(h.texto)} (${h.evidencia_n} ${Number(h.evidencia_n) === 1 ? "vídeo sustenta" : "vídeos sustentam"})`);
  if (sabidos.length) partes.push(`O QUE JÁ ESTÁ PROVADO NESTA CONTA:\n${sabidos.join("\n")}`);

  const territorios = lista(plano.satelites).map(texto).filter(Boolean);
  if (territorios.length) partes.push(`TERRITÓRIOS DO CICLO: ${territorios.join(", ")}`);

  if (!partes.length) return "";
  return `# ESTRATÉGIA VIGENTE DO CLIENTE (decidida no Cockpit — é a direção da conta, não sugestão)\n${partes.join("\n\n")}`;
}

/** Lê a estratégia vigente. Indisponível (sem plano, RPC ausente, sem permissão) → "". */
export async function carregarEstrategia(clientId: string | null): Promise<string> {
  if (!clientId) return "";
  try {
    const { data, error } = await viralData.rpc("hub_painel_estrategia_atual", { p_cliente: clientId });
    if (error) throw new Error(error.message);
    return formatarEstrategia(data);
  } catch (e) {
    // Tolerante como as lições e a paleta: cliente sem plano é o caso NORMAL hoje, e um
    // Cockpit fora do ar nunca pode derrubar a geração de roteiro.
    console.error("estratégia vigente indisponível, sala segue sem o briefing do Cockpit", e);
    return "";
  }
}
