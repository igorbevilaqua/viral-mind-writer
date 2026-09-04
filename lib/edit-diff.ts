// Plano 019, Fase 1. O diff da edição livre — determinístico, sem LLM, sem dependência nova.
//
// O desenho antigo mandava os DOIS roteiros inteiros (~15k chars cada) ao Professor e pedia
// "extraia só das DIFERENÇAS": estava pagando um modelo para fazer um diff, e a precisão do
// sinal morria aí. Aqui o diff é grátis e exato, e o LLM só entra depois, sobre um punhado de
// pares curtos que já se repetiram.
//
// Puro de propósito (padrão de learning-loop.ts): sem Supabase, sem Anthropic, testável em
// vitest sem mock.
import { extrairAncoras } from "./pipeline/delta";

/**
 * O que a edição fez com um parágrafo. A ordem de teste em `classificarMudanca` é a regra de
 * negócio, não detalhe: `factual` precisa ser decidido ANTES de tudo porque é o único tipo que
 * nunca pode chegar ao Professor.
 */
export type TipoMudanca = "factual" | "vocabulario" | "corte" | "insercao" | "ritmo" | "reescrita";

export interface Par {
  tipo: TipoMudanca;
  antes: string;
  depois: string;
}

/** Troca de 1 a 3 tokens é vocabulário; acima disso o autor reescreveu, não trocou palavra. */
export const MAX_TOKENS_VOCABULARIO = 3;
/**
 * Acima disto os parágrafos são coisas diferentes, não versões um do outro.
 * 0,75 e não 0,6: parágrafo curto de uma frase só chega a 0,63 com duas palavras trocadas, e
 * a 0,6 ele virava corte+inserção — o par de vocabulário mais óbvio que existe se perdia.
 */
const DISTANCIA_MAXIMA_PAR = 0.75;
/** Palavra de até 2 letras é artigo/preposição. "a"→"o" não é regra de vocabulário, é ruído. */
const MIN_CHARS_TERMO = 3;

const paragrafos = (t: string) =>
  t
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/**
 * Pontuação FORA do token. `changedRatio` compara palavras cruas, então "cedo," e "cedo." são
 * palavras diferentes para ele — e a edição que só mexe em pontuação aparecia como troca de
 * vocabulário. Aqui a pontuação é ruído: quem mede pontuação é o slop-lint.
 */
const tokens = (t: string) =>
  t
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);

/**
 * Distância entre parágrafos, com a mesma conta de `changedRatio` mas sobre tokens já limpos
 * de pontuação. Não dá para reusar `changedRatio` direto: ele alimenta `isSubstantiveEdit`, e
 * mudar a tokenização dele mexeria num portão que não é deste plano.
 */
function distancia(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  const mass = (ws: string[]) => ws.reduce((n, w) => n + w.length, 0);
  const total = Math.max(mass(ta), mass(tb));
  if (!total) return 0;
  const pool = new Map<string, number>();
  for (const w of ta) pool.set(w, (pool.get(w) ?? 0) + 1);
  let comum = 0;
  for (const w of tb) {
    const c = pool.get(w) ?? 0;
    if (c > 0) {
      comum += w.length;
      pool.set(w, c - 1);
    }
  }
  return 1 - comum / total;
}

/** Palavras que existem num lado e não no outro, na ordem em que aparecem. */
function tokensSo(a: string[], b: string[]): string[] {
  const pool = new Map<string, number>();
  for (const w of b) pool.set(w, (pool.get(w) ?? 0) + 1);
  const out: string[] = [];
  for (const w of a) {
    const c = pool.get(w) ?? 0;
    if (c > 0) pool.set(w, c - 1);
    else out.push(w);
  }
  return out;
}

/**
 * Pares (antes → depois) por parágrafo, via LCS sobre a grade de distâncias.
 *
 * Distância própria em vez de instalar uma lib de diff: a conta é a de `changedRatio`, que já
 * existe e já é testada, e o custo de errar aqui é um par mal formado que a classificação joga
 * em `reescrita` — não uma regra errada no prompt.
 *
 * Sem par à esquerda = corte; sem par à direita = inserção. Parágrafo idêntico não vira Par.
 */
export function parearParagrafos(antes: string, depois: string): Par[] {
  const a = paragrafos(antes);
  const b = paragrafos(depois);
  // custo[i][j] = melhor alinhamento de a[i..] com b[j..]. Distância 0 = idêntico.
  const custo: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) custo[i][b.length] = custo[i + 1][b.length] + 1;
  for (let j = b.length - 1; j >= 0; j--) custo[a.length][j] = custo[a.length][j + 1] + 1;
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const d = distancia(a[i], b[j]);
      const parear = d > DISTANCIA_MAXIMA_PAR ? Infinity : d + custo[i + 1][j + 1];
      custo[i][j] = Math.min(parear, 1 + custo[i + 1][j], 1 + custo[i][j + 1]);
    }
  }

  const out: Par[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i === a.length) {
      out.push({ tipo: "insercao", antes: "", depois: b[j++] });
      continue;
    }
    if (j === b.length) {
      out.push({ tipo: "corte", antes: a[i++], depois: "" });
      continue;
    }
    const d = distancia(a[i], b[j]);
    const parear = d > DISTANCIA_MAXIMA_PAR ? Infinity : d + custo[i + 1][j + 1];
    if (parear <= Math.min(1 + custo[i + 1][j], 1 + custo[i][j + 1])) {
      if (a[i] !== b[j]) out.push({ tipo: classificarMudanca(a[i], b[j]), antes: a[i], depois: b[j] });
      i++;
      j++;
    } else if (1 + custo[i + 1][j] <= 1 + custo[i][j + 1]) {
      out.push({ tipo: "corte", antes: a[i++], depois: "" });
    } else {
      out.push({ tipo: "insercao", antes: "", depois: b[j++] });
    }
  }
  return out;
}

/**
 * De que tipo é a mudança. A ORDEM É A REGRA:
 *
 * 1. `factual` primeiro e sem apelação. Âncora (quantidade, data, nome próprio) que muda é
 *    correção de dado, não regra de escrita — é a lição envenenada do §7.2 ("prefira 4,5 bi a
 *    45 bi"). Sai do fluxo antes de qualquer LLM ver.
 * 2. `vocabulario` depois: poucas palavras trocadas com o resto intacto. É o tipo que MAIS
 *    generaliza e o que o portão antigo (>10% do roteiro) jogava fora — 1 palavra em 3.000
 *    chars dá 0,3%.
 * 3. `ritmo`: as mesmas palavras reorganizadas. `changedRatio` usa multiset, então reordenação
 *    pura dá ~0 — é exatamente o que separa este caso de uma reescrita.
 * 4. `reescrita`: o resto. Caro e arriscado, só entra em cluster com N alto.
 */
export function classificarMudanca(antes: string, depois: string): TipoMudanca {
  if (!antes.trim()) return "insercao";
  if (!depois.trim()) return "corte";

  const ancorasAntes = new Set(extrairAncoras(antes));
  const ancorasDepois = new Set(extrairAncoras(depois));
  const ancoraMudou =
    [...ancorasAntes].some((x) => !ancorasDepois.has(x)) || [...ancorasDepois].some((x) => !ancorasAntes.has(x));
  if (ancoraMudou) return "factual";

  const ta = tokens(antes);
  const tb = tokens(depois);
  const saiu = tokensSo(ta, tb);
  const entrou = tokensSo(tb, ta);
  if (!saiu.length && !entrou.length) return "ritmo"; // mesmas palavras, outra ordem/pontuação
  // Vocabulário é TROCA: precisa de palavra saindo E entrando. Só tirar (ou só pôr) um
  // conectivo é reorganização de frase, e chamar isso de vocabulário fabricaria a regra
  // "evite a palavra 'e'" a partir de três edições de ritmo.
  const ehTroca = saiu.length > 0 && entrou.length > 0;
  if (ehTroca && saiu.length <= MAX_TOKENS_VOCABULARIO && entrou.length <= MAX_TOKENS_VOCABULARIO)
    return "vocabulario";
  if (saiu.length + entrou.length <= MAX_TOKENS_VOCABULARIO) return "ritmo";
  return "reescrita";
}

/**
 * O par de→para de uma troca de vocabulário. Só faz sentido quando `classificarMudanca` já
 * devolveu "vocabulario": fora disso são dezenas de palavras e nenhuma correspondência real.
 * Devolve [] quando os dois lados não têm o mesmo tamanho — sem 1:1 não há par honesto, e
 * inventar um alinhamento aqui viraria regra de vocabulário errada no cliente.
 */
export function termosTrocados(antes: string, depois: string): { de: string; para: string }[] {
  // Artigo e preposição fora ANTES do 1:1: "Leia a manchete" → "Leia o título" trocou duas
  // palavras, mas só uma é regra. Sem este filtro o cluster acabaria perguntando ao usuário
  // se "trocar 'a' por 'o'" vira preferência do cliente.
  const grande = (w: string) => w.length >= MIN_CHARS_TERMO;
  const saiu = tokensSo(tokens(antes), tokens(depois)).filter(grande);
  const entrou = tokensSo(tokens(depois), tokens(antes)).filter(grande);
  if (!saiu.length || saiu.length !== entrou.length) return [];
  return saiu.map((de, i) => ({ de, para: entrou[i] }));
}

export interface Observacao {
  tipo: TipoMudanca;
  antes: string;
  depois: string;
  termo_de: string | null;
  termo_para: string | null;
}

/**
 * O que vai para `vm_edit_observations`. `factual` é DESCARTADO aqui, na fronteira — não
 * adianta filtrar depois: o valor de nunca gravar é que nenhum consumidor futuro pode
 * esquecer de filtrar.
 *
 * Vocabulário vira uma observação POR TERMO trocado: o cluster conta pares (de→para), e um
 * parágrafo com duas trocas é duas evidências, não uma.
 */
export function observacoesDaEdicao(antes: string, depois: string): Observacao[] {
  const out: Observacao[] = [];
  for (const p of parearParagrafos(antes, depois)) {
    if (p.tipo === "factual") continue;
    if (p.tipo === "vocabulario") {
      const termos = termosTrocados(p.antes, p.depois);
      // sem par 1:1 o sinal de vocabulário não existe; o parágrafo ainda é evidência de ritmo
      if (!termos.length) {
        out.push({ tipo: "ritmo", antes: p.antes, depois: p.depois, termo_de: null, termo_para: null });
        continue;
      }
      for (const t of termos)
        out.push({ tipo: "vocabulario", antes: p.antes, depois: p.depois, termo_de: t.de, termo_para: t.para });
      continue;
    }
    out.push({ tipo: p.tipo, antes: p.antes, depois: p.depois, termo_de: null, termo_para: null });
  }
  return out;
}

export interface Cluster {
  tipo: TipoMudanca;
  clientId: string | null;
  termo_de: string | null;
  termo_para: string | null;
  n: number;
  exemplos: { antes: string; depois: string }[];
}

/** Abaixo disto é anedota. É ESTE número que separa o generalizável do circunstancial. */
export const N_CLUSTER = 3;

/**
 * Agrupa observações no que já se repetiu o bastante para virar pergunta.
 *
 * Vocabulário agrupa pelo par (de→para); os outros tipos agrupam só por tipo, porque não há
 * chave literal — é o LLM que vai ler os exemplos e dizer se há regra ali. Por isso o `n` de
 * `reescrita` significa muito menos que o de `vocabulario`, e o plano trata os dois em fases
 * diferentes de propósito.
 */
/**
 * A identidade de um cluster, em texto. É o que a lição guarda em `cluster_chave` para a
 * Fase 5 conseguir perguntar "esta edição continuou acontecendo depois da regra valer?" —
 * sem isso a medição de recorrência contaria observação de qualquer cluster e marcaria toda
 * lição como suspeita.
 */
export function chaveDoCluster(c: {
  clientId: string | null;
  tipo: TipoMudanca;
  termo_de: string | null;
  termo_para: string | null;
}): string {
  return `${c.clientId ?? ""}|${c.tipo}|${c.termo_de ?? ""}|${c.termo_para ?? ""}`;
}

export function clusters(obs: (Observacao & { clientId: string | null })[], n = N_CLUSTER): Cluster[] {
  const mapa = new Map<string, Cluster>();
  for (const o of obs) {
    const chave = chaveDoCluster(o);
    const atual = mapa.get(chave);
    if (atual) {
      atual.n++;
      if (atual.exemplos.length < 8) atual.exemplos.push({ antes: o.antes, depois: o.depois });
      continue;
    }
    mapa.set(chave, {
      tipo: o.tipo,
      clientId: o.clientId,
      termo_de: o.termo_de,
      termo_para: o.termo_para,
      n: 1,
      exemplos: [{ antes: o.antes, depois: o.depois }],
    });
  }
  return [...mapa.values()].filter((c) => c.n >= n).sort((a, b) => b.n - a.n);
}
