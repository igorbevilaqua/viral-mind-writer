// Estatística do estudo (plano 020, WP-D). Puro: sem banco, sem LLM — só o que o
// pré-registro travou: lift com Wilson e encolhimento, Cliff's delta, quartil no estrato,
// célula encolhida da matriz estrutura × tema, dominância e consistência por cliente.
import { wilsonLower, wilsonUpper } from "./calibration";

export interface LiftRow {
  label: string;
  top: boolean;
  cliente?: string | null;
}

export type LiftFlag = "ok" | "baixa_confianca" | "suprimido";

export interface LiftResult {
  label: string;
  n: number;
  k: number;
  p: number;
  lift: number;
  lift_lb: number;
  lift_ub: number;
  flag: LiftFlag;
  // Fração do rótulo que vem de UM cliente (>0.5 = o rótulo é aquele cliente).
  dominancia: number;
  dominante: string | null;
  // "positivo em x de y clientes" — clientes com ≥ minCliente vídeos no rótulo.
  consistencia: { positivos: number; clientes: number };
}

export interface LiftOpts {
  base?: number; // P(top) por construção (0.25)
  minN?: number; // abaixo disso: suprimido (10 no global, 8 por cliente)
  publicaN?: number; // a partir daqui publica sem encolher (30)
  K?: number; // pseudo-observações do encolhimento (20)
  minCliente?: number; // n mínimo de um cliente para contar na consistência (8)
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;

// P(top | rótulo) / base, com Wilson 95%. Entre minN e publicaN o rótulo é encolhido para
// a base com K pseudo-observações — e o Wilson é calculado sobre os pseudo-contadores, assim
// lb < lift < ub vale sempre (Wilson sobre k/n brutos podia deixar o ponto encolhido fora do IC).
export function lift(rows: LiftRow[], opts: LiftOpts = {}): LiftResult[] {
  const { base = 0.25, minN = 10, publicaN = 30, K = 20, minCliente = 8 } = opts;
  const grupos = new Map<string, LiftRow[]>();
  for (const r of rows) grupos.set(r.label, [...(grupos.get(r.label) ?? []), r]);
  const out: LiftResult[] = [];
  for (const [label, rs] of grupos) {
    const n = rs.length;
    const k = rs.filter((r) => r.top).length;
    const flag: LiftFlag = n < minN ? "suprimido" : n < publicaN ? "baixa_confianca" : "ok";
    const encolhe = flag === "baixa_confianca";
    const k2 = encolhe ? k + base * K : k;
    const n2 = encolhe ? n + K : n;
    const p = n2 ? k2 / n2 : base;
    const { dominancia, dominante } = dominanciaDe(rs.map((r) => r.cliente ?? null));
    out.push({
      label,
      n,
      k,
      p: r3(p),
      lift: r3(p / base),
      lift_lb: r3(wilsonLower(k2, n2) / base),
      lift_ub: r3(wilsonUpper(k2, n2) / base),
      flag,
      dominancia: r3(dominancia),
      dominante,
      consistencia: consistencia(rs, base, minCliente),
    });
  }
  return out.sort((a, b) => b.n - a.n);
}

// Maior fatia de um único cliente. Linhas sem cliente não contam no numerador.
export function dominanciaDe(clientes: (string | null)[]): { dominancia: number; dominante: string | null } {
  if (!clientes.length) return { dominancia: 0, dominante: null };
  const cont = new Map<string, number>();
  for (const c of clientes) if (c) cont.set(c, (cont.get(c) ?? 0) + 1);
  let dominante: string | null = null;
  let max = 0;
  for (const [c, n] of cont) if (n > max) [max, dominante] = [n, c];
  return { dominancia: max / clientes.length, dominante };
}

// Em quantos clientes (com ≥ minCliente vídeos no rótulo) a taxa de top passa da base.
export function consistencia(rows: LiftRow[], base = 0.25, minCliente = 8): { positivos: number; clientes: number } {
  const porCliente = new Map<string, { n: number; k: number }>();
  for (const r of rows) {
    if (!r.cliente) continue;
    const e = porCliente.get(r.cliente) ?? { n: 0, k: 0 };
    e.n += 1;
    if (r.top) e.k += 1;
    porCliente.set(r.cliente, e);
  }
  let positivos = 0;
  let clientes = 0;
  for (const { n, k } of porCliente.values()) {
    if (n < minCliente) continue;
    clientes += 1;
    if (k / n > base) positivos += 1;
  }
  return { positivos, clientes };
}

// Cliff's delta: P(a > b) − P(a < b). +1 = a inteiramente acima de b.
// ponytail: O(n·m) — 3k × 3k × 17 métricas roda em <1s; trocar por merge ordenado se crescer.
export function cliffsDelta(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  let s = 0;
  for (const x of a) for (const y of b) s += x > y ? 1 : x < y ? -1 : 0;
  return s / (a.length * b.length);
}

// Quartis por posição na amostra ordenada (sem interpolação — basta para cortar top/bottom).
export function quartis(xs: number[]): { q1: number; q2: number; q3: number } {
  const s = [...xs].sort((a, b) => a - b);
  const at = (f: number) => s[Math.min(s.length - 1, Math.floor(f * s.length))] ?? NaN;
  return { q1: at(0.25), q2: at(0.5), q3: at(0.75) };
}

// `top` = quartil superior DENTRO do estrato — por posição (os floor(n/4) maiores), então
// P(top) ≤ 0.25 por construção mesmo com empates. Estrato com n < 4 não tem top.
export function topNoEstrato<T>(rows: T[], estrato: (r: T) => string, valor: (r: T) => number): (T & { top: boolean })[] {
  const grupos = new Map<string, T[]>();
  for (const r of rows) {
    const e = estrato(r);
    grupos.set(e, [...(grupos.get(e) ?? []), r]);
  }
  const top = new Set<T>();
  for (const rs of grupos.values()) {
    const ord = [...rs].sort((a, b) => valor(b) - valor(a));
    for (const r of ord.slice(0, Math.floor(rs.length / 4))) top.add(r);
  }
  return rows.map((r) => ({ ...r, top: top.has(r) }));
}

// Mesmo corte, mas o quartil INFERIOR — o "bottom" do Cliff's delta.
export function bottomNoEstrato<T>(rows: T[], estrato: (r: T) => string, valor: (r: T) => number): (T & { bottom: boolean })[] {
  // topNoEstrato preserva a ordem — junta por índice para não perder campos já existentes (ex.: `top`).
  const b = topNoEstrato(rows, estrato, (r) => -valor(r));
  return rows.map((r, i) => ({ ...r, bottom: b[i].top }));
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

// Célula da matriz estrutura × tema com encolhimento aditivo para um prior que soma os
// efeitos marginais (p_tema + p_estr − base). n=0 devolve o prior.
export function celulaEncolhida(k: number, n: number, pTema: number, pEstr: number, K = 15): { p: number; prior: number } {
  const prior = clamp(pTema + pEstr - 0.25, 0.05, 0.95);
  return { p: (k + K * prior) / (n + K), prior };
}

// Percentil de x entre controles (empate conta meio). Usado no Codex vs humanos.
export function percentil(x: number, controles: number[]): number {
  if (!controles.length) return NaN;
  let s = 0;
  for (const c of controles) s += x > c ? 1 : x === c ? 0.5 : 0;
  return s / controles.length;
}

export const mediana = (xs: number[]): number => quartis(xs).q2;
