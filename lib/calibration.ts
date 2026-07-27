// Calibração de preferências de hook (par-a-par, RLHF-lite). Funções PURAS aqui
// (agregação, Wilson, montagem de par) — testáveis em vitest sem banco. O acesso a
// dados vive nas server actions / rotas / ETL que importam daqui.
import type { HookCandidate } from "./pipeline/hook-mechanisms";

export type CalibAxis = "mecanismo" | "comprimento" | "personagem" | "especificidade" | "abertura";

export interface CalibOption {
  texto: string;
  mecanismo?: string;
  atributos?: Partial<Record<CalibAxis, string>>;
}
export interface CalibPair {
  dimension: string;
  client_id: string | null;
  axis: CalibAxis;
  option_a: CalibOption;
  option_b: CalibOption;
  source: "generation" | "corpus" | "probe";
}

// Valor do eixo dentro de uma opção (mecanismo é campo próprio; o resto vem de atributos).
export function axisValue(opt: CalibOption, axis: CalibAxis): string | null {
  if (axis === "mecanismo") return opt.mecanismo ?? null;
  return opt.atributos?.[axis] ?? null;
}

// Limite inferior do intervalo de Wilson (95%) para uma proporção — pune amostra pequena.
// É o que impede uma preferência de baixo volume de virar regra na geração.
export function wilsonLower(wins: number, n: number): number {
  if (n <= 0) return 0;
  const z = 1.96;
  const p = wins / n;
  const z2 = z * z;
  const centro = p + z2 / (2 * n);
  const margem = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return Math.max(0, (centro - margem) / (1 + z2 / n));
}

export interface PrefStat {
  scope: string; // "global" | "client:<id>"
  axis: CalibAxis;
  valor: string;
  wins: number;
  n: number;
  winrate: number;
  confianca: number; // wilson lower bound
}

// Agrega votos (com o par que os originou) em estatísticas por escopo/eixo/valor.
// Cada voto conta uma vitória para o valor do vencedor e uma aparição para ambos.
export function aggregatePreferences(
  votes: { clientId: string | null; axis: CalibAxis; winnerValue: string | null; loserValue: string | null }[],
  minN = 8,
  minConfianca = 0.5
): PrefStat[] {
  // chave scope|axis|valor → { wins, n }
  const acc = new Map<string, { wins: number; n: number }>();
  const bump = (scope: string, axis: CalibAxis, valor: string, win: boolean) => {
    const k = `${scope}|${axis}|${valor}`;
    const e = acc.get(k) ?? { wins: 0, n: 0 };
    e.n += 1;
    if (win) e.wins += 1;
    acc.set(k, e);
  };
  for (const v of votes) {
    if (!v.winnerValue || !v.loserValue || v.winnerValue === v.loserValue) continue;
    for (const scope of v.clientId ? ["global", `client:${v.clientId}`] : ["global"]) {
      bump(scope, v.axis, v.winnerValue, true);
      bump(scope, v.axis, v.loserValue, false);
    }
  }
  const out: PrefStat[] = [];
  for (const [k, { wins, n }] of acc) {
    if (n < minN) continue;
    const [scope, axis, valor] = k.split("|") as [string, CalibAxis, string];
    const confianca = Math.round(wilsonLower(wins, n) * 100) / 100;
    if (confianca < minConfianca) continue;
    out.push({ scope, axis, valor, wins, n, winrate: Math.round((wins / n) * 100) / 100, confianca });
  }
  // por escopo+eixo, o valor mais confiante primeiro
  return out.sort((a, b) => b.confianca - a.confianca || b.n - a.n);
}

// Monta o par grátis a partir dos candidatos que o agente gerou: o ESCOLHIDO (principal)
// vs o vice de MECANISMO diferente — "confirme ou corrija a decisão do agente". Null se
// não houver dois mecanismos distintos.
export function pairFromCandidates(
  candidatos: HookCandidate[],
  clientId: string | null
): CalibPair | null {
  const validos = candidatos.filter((c) => c?.hook?.trim() && c.mecanismo);
  if (validos.length < 2) return null;
  const escolhido = validos[0]; // o 1º é o principal selecionado (selectHook ordena)
  const vice = validos.slice(1).find((c) => c.mecanismo !== escolhido.mecanismo);
  if (!vice) return null;
  const opt = (c: HookCandidate): CalibOption => ({ texto: c.hook, mecanismo: c.mecanismo, atributos: { comprimento: c.hook.length > 120 ? "longo" : "curto" } });
  return { dimension: "hook", client_id: clientId, axis: "mecanismo", option_a: opt(escolhido), option_b: opt(vice), source: "generation" };
}
