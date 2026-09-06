// Funções puras do ciclo de autoaprimoramento (plano 012, WP-E).
// Sem imports de Supabase/Anthropic — testáveis em vitest puro (padrão etl-gate.ts).
import { wilsonLower } from "./calibration";

// ── WP-E.4: decisão de edição substantiva ────────────────────────────────────

// Fração da "massa de caracteres" alterada entre as versões, via multiset de
// palavras. ponytail: reordenação pura conta como igual — heurística barata e
// explicável; trocar por diff real (LCS) se gerar falso negativo relevante.
export function changedRatio(original: string, editada: string): number {
  const words = (s: string) => s.toLowerCase().split(/\s+/).filter(Boolean);
  const mass = (ws: string[]) => ws.reduce((n, w) => n + w.length, 0);
  const a = words(original);
  const b = words(editada);
  const total = Math.max(mass(a), mass(b));
  if (!total) return 0;
  const pool = new Map<string, number>();
  for (const w of a) pool.set(w, (pool.get(w) ?? 0) + 1);
  let comum = 0;
  for (const w of b) {
    const c = pool.get(w) ?? 0;
    if (c > 0) {
      comum += w.length;
      pool.set(w, c - 1);
    }
  }
  return 1 - comum / total;
}

// `isSubstantiveEdit` (>10% dos chars) morreu no plano 019, Fase 4: o piso descartava a troca
// de palavra — 1 palavra em 3.000 chars dá 0,3% — que é justamente o tipo de edição que mais
// generaliza. Quem decide o que vira aprendizado agora é a REPETIÇÃO (lib/edit-diff.ts), não
// o tamanho do diff. `changedRatio` continua: virou distância de pareamento.

// ── Peça 3 §7.2/§16.1: quem tem direito de alimentar o Professor ─────────────

export interface TraceEdicao {
  roteiro_original?: string;
  /**
   * O texto no instante da PRIMEIRA edição humana — plano 019, Fase 1.
   *
   * Existe porque `roteiro_original` não serve para aprender quando houve correção factual
   * antes: `aplicarCorrecao` chama updateScript com origem "correcao_factual" e grava T0; o
   * humano edita depois e o par que o Professor recebia era T0 → T2, com a correção da
   * MÁQUINA dentro do diff. Era exatamente a lição envenenada do §7.2 ("prefira 4,5 bi a
   * 45 bi") entrando pela porta que `houveEdicaoHumana` não cobre — aquele portão pega o caso
   * puro-máquina, não a mistura.
   *
   * `roteiro_original` continua intocado: é o que a explicação e o revert leem.
   */
  roteiro_pre_humano?: string;
  edicao_humana?: boolean;
  correcao_factual?: boolean;
}

// Merge do trace na escrita do roteiro (updateScript). `roteiro_original` é preservado
// nas DUAS origens — a correção factual também precisa ser revertível; só o rótulo muda.
export function marcarOrigemEdicao(
  trace: TraceEdicao,
  roteiroAnterior: string,
  origem: "humano" | "correcao_factual"
): TraceEdicao {
  // sempre o texto da sala, nunca de edição anterior
  const base = { ...trace, roteiro_original: trace.roteiro_original ?? roteiroAnterior };
  return origem === "humano"
    ? // `?? roteiroAnterior` e não `?? base.roteiro_original`: o lado esquerdo do par de
      // aprendizado tem que ser o texto que existia quando ESTE humano começou, já com
      // qualquer correção de máquina aplicada. Só a primeira edição humana grava.
      { ...base, edicao_humana: true, roteiro_pre_humano: trace.roteiro_pre_humano ?? roteiroAnterior }
    : { ...base, correcao_factual: true };
}

/**
 * O lado esquerdo do par de aprendizado: o texto da máquina imediatamente antes de o humano
 * mexer. Cai em `roteiro_original` para os roteiros anteriores à 019 (que não têm o campo
 * novo) — neles a contaminação por correção factual continua possível, mas é histórico, e
 * fabricar um valor aqui seria pior que usar o que existe.
 */
export function textoPreHumano(trace: TraceEdicao): string | null {
  return trace.roteiro_pre_humano ?? trace.roteiro_original ?? null;
}

// O portão do aprendizado por edição. Lê `edicao_humana` e NUNCA `roteiro_original`:
// a correção factual de máquina também grava `roteiro_original`, então decidir por esse
// campo faria o Professor extrair lição da própria correção ("prefira 4,5 bi a 45 bi"),
// que não é regra de escrita nenhuma — a lição envenenada do §7.2. NÃO "simplifique"
// isto de volta para `trace.roteiro_original`.
// Legado seguro: updateScript sempre gravou os dois campos no MESMO objeto literal, então
// todo roteiro que tem `roteiro_original` hoje também tem `edicao_humana`.
export function houveEdicaoHumana(trace: TraceEdicao): boolean {
  return trace.edicao_humana === true;
}

// ── Peça 3 §7.1: a correção cirúrgica não precisa de LLM ─────────────────────

// A verificação já achou os dois lados (o trecho errado e o dado certo), então não há o
// que gerar: a correção é `split/join` sobre o campo.
// A substituição GLOBAL é benigna aqui. Trocar todas as ocorrências é o avesso do conserto
// para repetição estilística — é o motivo de a peça 2 ter recusado o retry cirúrgico
// (016 §4.4) — mas para um dado errado é exatamente o certo: `45 bilhões` errado é errado
// em toda aparição.
// null (nunca throw, §11) = o trecho não casa: ou o modelo parafraseou em vez de copiar,
// ou o roteiro mudou depois da verificação. O veredicto sobrevive; só a ação automática cai.
export function aplicarCorrecaoLiteral(roteiro: string, trecho_literal: string, correcao: string): string | null {
  // trecho vazio casa em tudo e `split("")` estilhaçaria o roteiro em caracteres
  if (!trecho_literal || !roteiro.includes(trecho_literal)) return null;
  return roteiro.split(trecho_literal).join(correcao);
}

// ── `falso` não tem correção pronta: o caminho dele é o Bob ──────────────────

/**
 * `impreciso` traz `correcao` (o dado certo, pronto para troca literal); `falso` NÃO traz
 * substituto nenhum — a verificação sabe que a afirmação não se sustenta, não o que dizer no
 * lugar. Por isso ele não pode ir pelo caminho do `impreciso`: aquele troca `trecho_literal`
 * por `correcao`, que aqui é `null`, e o roteiro perderia o trecho.
 * O portão em si é o mesmo do `podeAplicar`: sem o trecho literal no roteiro ATUAL não há o
 * que substituir depois que o Bob responder.
 */
export function podeReescrever(
  item: { veredicto: string; trecho_literal?: string | null },
  roteiro: string
): boolean {
  return item.veredicto === "falso" && !!item.trecho_literal && roteiro.includes(item.trecho_literal);
}

/**
 * O que o Bob recebe para não errar de novo no lugar do erro.
 * ponytail: usa `explicacao` + `fonte`, e NÃO o texto bruto da busca — ele nunca foi
 * persistido em `verificacao` (o registro guarda só fonte e explicação), e persistir custaria
 * KBs de jsonb por roteiro para reproduzir algo que o Bob já sabe buscar: ele tem
 * `pesquisar_web`, e a explicação do verificador já diz o que é falso e qual é o dado real.
 * Persistir `ItemBusca.busca.texto` só se na prática o Bob começar a errar por falta de contexto.
 * A proibição vem no primeiro parágrafo de propósito: enterrada no fim, o modelo a ignora.
 */
export function instrucaoReescritaFalso(item: {
  explicacao?: string;
  fonte?: { url?: string; veiculo?: string; ano?: string } | null;
}): string {
  const f = item.fonte;
  const fonte = f?.url
    ? `\n\nFONTE QUE DERRUBOU A AFIRMAÇÃO: ${[f.veiculo, f.ano].filter(Boolean).join(", ") || "fonte"} — ${f.url}`
    : "";
  return `Este trecho foi verificado e REPROVADO: a afirmação é factualmente FALSA. Reescreva o trecho dizendo o que é verdade, ou tire a afirmação e preserve só o papel dela no roteiro. NUNCA repita a afirmação falsa, nem amaciada por hedge ("pode ser que", "há indícios de", "alguns dizem"). Se não tiver um fato sólido para pôr no lugar, PESQUISE antes de escrever; se ainda assim não achar, reescreva SEM nenhuma afirmação factual nova em vez de inventar uma.

O QUE O VERIFICADOR APUROU: ${item.explicacao?.trim() || "a afirmação não se sustenta nas fontes."}${fonte}`;
}

// ── WP-E.3: calibração previsto×real do agente Dados ─────────────────────────

export interface CalibrationPayload {
  n: number;
  insuficiente?: true;
  // % de acerto entre previsões "com opinião": previsto>60 devia dar ratio>1, previsto<40 ratio<1
  correlacao_direcional: number | null;
  // média de (previsto/100 − min(ratio/2, 1)); >0 = o Dados superestima o potencial
  vies: number | null;
  resumo: string;
}

export function computeCalibration(
  rows: { predicted: number | null | undefined; ratio: number | null | undefined }[]
): CalibrationPayload {
  const valid = rows.filter(
    (r): r is { predicted: number; ratio: number } =>
      typeof r.predicted === "number" && Number.isFinite(r.predicted) &&
      typeof r.ratio === "number" && Number.isFinite(r.ratio)
  );
  const n = valid.length;
  if (n < 5) {
    return {
      n,
      insuficiente: true,
      correlacao_direcional: null,
      vies: null,
      resumo: `Apenas ${n} outcome(s) maduro(s) com previsão — amostra insuficiente para calibrar.`,
    };
  }
  // direcional: só previsões fora da zona morta 40-60 contam como "opinião"
  const direcionais = valid.filter((r) => r.predicted > 60 || r.predicted < 40);
  const acertos = direcionais.filter(
    (r) => (r.predicted > 60 && r.ratio > 1) || (r.predicted < 40 && r.ratio < 1)
  ).length;
  const correlacao = direcionais.length ? Math.round((100 * acertos) / direcionais.length) : null;
  // ratio normalizado a 0-1 (2x a média do cliente = 1.0) pra comparar com previsto/100
  const vies =
    Math.round((valid.reduce((s, r) => s + (r.predicted / 100 - Math.min(r.ratio / 2, 1)), 0) / n) * 100) / 100;
  const resumo = `Em ${n} roteiros maduros, ${
    correlacao == null
      ? "nenhuma previsão saiu da zona neutra (score 40-60)"
      : `suas previsões fortes (score >60 ou <40) acertaram a direção em ${correlacao}% dos casos`
  }; viés médio ${vies > 0 ? "+" : ""}${vies} (positivo = você superestima o potencial).`;
  return { n, correlacao_direcional: correlacao, vies, resumo };
}

// ── Plano 020, WP-E: ranking de rótulos por LIFT, não por share ──────────────
// `rankHookMechanisms` rankeava por frequência entre os vencedores. Share mede prevalência,
// não eficácia — "Contraste Extremo" em 58% dos vencedores estava também em 58% dos perdedores,
// e a sala colapsou nele (134/144 roteiros). Aqui cada linha é UM vídeo rotulado, com `top` =
// quartil superior de coeficiente_viral dentro do estrato (cliente, plataforma), então
// P(top) = baseTop por construção e lift = P(top | rótulo) / baseTop. Ordena por `lift_lb`
// (Wilson 95%, limite inferior): amostra pequena com lift alto não passa na frente de amostra
// grande com lift moderado. lift_lb < 1 = IC cruza 1 = sem evidência (pré-registro do plano).
export interface LiftRank {
  label: string;
  n: number; // vídeos do escopo com o rótulo
  top_n: number; // desses, quantos no quartil superior do estrato
  lift: number; // (top_n/n) / baseTop
  lift_lb: number; // wilsonLower(top_n, n) / baseTop
}

const MIN_LABEL_N = 10; // abaixo disto o rótulo não entra (n<10 suprime — plano 020)

export function rankByLift(
  rows: { labels: string[]; clienteId: string | null; top: boolean }[],
  minSample = 30,
  topK = 6,
  baseTop = 0.25,
  minSampleCliente = 40 // rótulo de hook tem ~52% de concordância entre fontes; cliente pede mais amostra
): { scope: string; total: number; ranking: LiftRank[] }[] {
  // agrupa por escopo: "global" (todos) + "client:<id>" (cada cliente)
  const buckets = new Map<string, { labels: string[]; top: boolean }[]>();
  const push = (scope: string, r: { labels: string[]; top: boolean }) => buckets.set(scope, [...(buckets.get(scope) ?? []), r]);
  for (const r of rows) {
    push("global", r);
    if (r.clienteId) push(`client:${r.clienteId}`, r);
  }

  const r2 = (x: number) => Math.round(x * 100) / 100;
  const out: { scope: string; total: number; ranking: LiftRank[] }[] = [];
  for (const [scope, list] of buckets) {
    if (list.length < (scope === "global" ? minSample : minSampleCliente)) continue;
    const count = new Map<string, { n: number; top_n: number }>();
    for (const r of list)
      for (const l of new Set(r.labels)) {
        const c = count.get(l) ?? { n: 0, top_n: 0 };
        count.set(l, { n: c.n + 1, top_n: c.top_n + (r.top ? 1 : 0) });
      }
    const ranking = [...count.entries()]
      .filter(([, c]) => c.n >= MIN_LABEL_N)
      .map(([label, c]) => ({
        label,
        n: c.n,
        top_n: c.top_n,
        lift: r2(c.top_n / c.n / baseTop),
        lift_lb: r2(wilsonLower(c.top_n, c.n) / baseTop),
      }))
      .sort((a, b) => b.lift_lb - a.lift_lb || b.n - a.n)
      .slice(0, topK);
    out.push({ scope, total: list.length, ranking });
  }
  return out;
}

// ── Fase 4: performance dos mecanismos de hook NA PRÓPRIA SALA ───────────────
// Junta os outcomes maduros (ratio real) com o mecanismo do hook gravado no
// pipeline_trace (Fase 3). É o feedback mais direto que existe. Veredito só com
// evidência (plano 020): "mediana > 1.2" é o mesmo que "mais da metade repete (ratio > 1.2)",
// então `promover` exige wilsonLower(#repetir, n) > 0.5; `derrubar`, simetricamente,
// wilsonLower(#evitar (ratio < 0.8), n) > 0.5. IC cruzando 0.5 = neutro, por mais que a
// mediana pareça boa — 3 roteiros com 1.4x não são padrão, são sorte.
export interface HookMecOutcome {
  mecanismo: string;
  n: number;
  ratio_mediano: number;
  verdict: "promover" | "derrubar" | "neutro";
}
export function hookMechanismOutcomes(
  outcomes: { ratio: number | null | undefined; mecanismo: string | null | undefined }[],
  minPorMecanismo = 10
): HookMecOutcome[] {
  const byMec = new Map<string, number[]>();
  for (const o of outcomes) {
    if (!o.mecanismo || typeof o.ratio !== "number" || !Number.isFinite(o.ratio)) continue;
    byMec.set(o.mecanismo, [...(byMec.get(o.mecanismo) ?? []), o.ratio]);
  }
  const med = (a: number[]) => {
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  return [...byMec.entries()]
    .filter(([, r]) => r.length >= minPorMecanismo)
    .map(([mecanismo, r]) => {
      const repetir = r.filter((x) => x > 1.2).length;
      const evitar = r.filter((x) => x < 0.8).length;
      return {
        mecanismo,
        n: r.length,
        ratio_mediano: Math.round(med(r) * 100) / 100,
        verdict:
          wilsonLower(repetir, r.length) > 0.5
            ? ("promover" as const)
            : wilsonLower(evitar, r.length) > 0.5
              ? ("derrubar" as const)
              : ("neutro" as const),
      };
    })
    .sort((a, b) => b.ratio_mediano - a.ratio_mediano);
}

// ── WP-E.5: atribuição lição×outcome ─────────────────────────────────────────

export interface LessonAttribution {
  lessonId: string;
  usos: number;
  ratio_mediano: number;
  needs_review: boolean; // ≥2 usos com mediana <0.8 → revisão humana (nunca desativa sozinho)
}

export function attributeLessons(
  outcomes: { ratio: number | null | undefined; lessonIds: string[] }[]
): LessonAttribution[] {
  const byLesson = new Map<string, number[]>();
  for (const o of outcomes) {
    if (typeof o.ratio !== "number" || !Number.isFinite(o.ratio)) continue; // sem média do cliente = sem sinal
    for (const id of o.lessonIds) byLesson.set(id, [...(byLesson.get(id) ?? []), o.ratio]);
  }
  return [...byLesson.entries()].map(([lessonId, ratios]) => {
    const sorted = [...ratios].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const mediano = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return { lessonId, usos: ratios.length, ratio_mediano: mediano, needs_review: ratios.length >= 2 && mediano < 0.8 };
  });
}
