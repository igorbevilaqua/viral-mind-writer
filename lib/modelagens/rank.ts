// Ranking dos candidatos a modelagem (plano 014, WP-3). Função pura: sem LLM, sem I/O,
// sem relógio implícito — `agora` entra por parâmetro, como em fmtWhen (lib/format.ts).
//
// A tese do plano em uma linha: o que qualifica um vídeo não é quanta view ele fez, é
// quanto ele estourou a própria audiência. Um vídeo com 1.556 seguidores fazendo 316k
// views (202,9x) tem o mérito inteiro no vídeo e zero na audiência herdada; ordenar por
// views o enterraria por volta da 20ª posição.
//
// E idade, sozinha, não penaliza — o que penaliza é dependência de contexto. Os dois
// vídeos mais antigos da validação (1.004d e 1.023d) ainda performando eram ambos do
// tema "empresas brasileiras que faliram": perene puro. Um decay linear por idade
// descartaria justamente os melhores exemplos atemporais.

import type { Candidato, Plataforma } from "./buscar";

export type TimingClasse = "breaking" | "trending" | "ciclico" | "perene";
export type AplicabilidadeBr = "universal" | "adaptavel" | "local_estrangeiro";

/** Campos preenchidos pela classificação em lote — ausentes no primeiro passe. */
export interface Classificacao {
  timing_classe?: TimingClasse | null;
  janela_sazonal?: string | null;
  aplicabilidade_br?: AplicabilidadeBr | null;
}

export type CandidatoRankeavel = Candidato &
  Classificacao & {
    /** Clientes que já usaram este vídeo (coluna usado_em do pool). */
    usado_em?: string[] | null;
  };

export interface Rankeado {
  candidato: CandidatoRankeavel;
  ratio: number;
  percentil: number;
  decay: number;
  score: number;
}

export interface RankOpts {
  agora?: Date;
  /** Cliente da vez: descarta o que ele já usou. */
  cliente_id?: string;
  /** plataform_ids já presentes no corpus — o cliente já viu esses vídeos. */
  no_corpus?: ReadonlySet<string>;
  /** Piso de views por plataforma. View de TikTok e de IG não são a mesma moeda. */
  piso_views?: Partial<Record<Plataforma, number>>;
}

// Knobs de calibração. São as constantes que decidem o quanto idade pesa — a Fase 0
// validou a forma da curva com 371 vídeos reais, não os valores exatos.
const MEIA_VIDA_DIAS: Record<TimingClasse, number> = {
  breaking: 15, // morre rápido, como deve
  trending: 45,
  ciclico: 180,
  perene: 3650, // idade praticamente não pesa
};
const BOOST_SAZONAL = 1.5; // cíclico dentro da própria janela
const PISO_VIEWS_PADRAO = 100_000;
const DURACAO_MAX_SEG = 180;
const RATIO_MINIMO = 3; // o vídeo estourou a própria audiência
const SEGUIDORES_MINIMOS = 1000; // clamp: conta nova não vira ratio infinito
const MAX_POR_AUTOR = 2; // senão um perfil bom domina os 15 cards
const DIA_MS = 86_400_000;

const MESES = [
  "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// \p{Diacritic} exigiria ES2018; o target do projeto é ES2017.
const semAcento = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** O mês corrente cai na janela sazonal declarada ('dezembro', 'novembro-janeiro', …). */
function naJanela(janela: string | null | undefined, agora: Date): boolean {
  return !!janela && semAcento(janela).includes(MESES[agora.getMonth()]);
}

function idadeEmDias(iso: string, agora: Date): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, (agora.getTime() - t) / DIA_MS);
}

function decaimento(c: CandidatoRankeavel, agora: Date): number {
  const idade = idadeEmDias(c.data_publicacao, agora);
  // Sem classificação (primeiro passe, antes da chamada em lote) idade não pesa: só os
  // ~40 finalistas são classificados, e é no segundo passe que o decay entra.
  if (!c.timing_classe || idade === null) return 1;
  const d = Math.pow(0.5, idade / MEIA_VIDA_DIAS[c.timing_classe]);
  return c.timing_classe === "ciclico" && naJanela(c.janela_sazonal, agora) ? d * BOOST_SAZONAL : d;
}

/**
 * Filtra, pontua e ordena os candidatos. Devolve no máximo MAX_POR_AUTOR por autor,
 * já ordenado do melhor para o pior.
 */
export function rankear(candidatos: CandidatoRankeavel[], opts: RankOpts = {}): Rankeado[] {
  const agora = opts.agora ?? new Date();

  const passaram = candidatos.filter((c) => {
    const piso = opts.piso_views?.[c.plataforma] ?? PISO_VIEWS_PADRAO;
    if (c.views < piso) return false;
    if (!c.duracao_seg || c.duracao_seg > DURACAO_MAX_SEG) return false;
    // O corte é por aplicabilidade, NÃO por idioma: uma boa ideia em espanhol se traduz
    // (a queda da Blockbuster serve inteira); o que não transfere é contexto local
    // estrangeiro (o dólar na Venezuela). Sem classificação, nada a cortar aqui.
    if (c.aplicabilidade_br === "local_estrangeiro") return false;
    if (opts.no_corpus?.has(c.plataform_id)) return false; // o cliente já viu
    if (opts.cliente_id && c.usado_em?.includes(opts.cliente_id)) return false;
    return true;
  });

  const comRatio = passaram
    .map((c) => ({ c, ratio: c.views / Math.max(c.autor_seguidores ?? 0, SEGUIDORES_MINIMOS) }))
    .filter((x) => x.ratio >= RATIO_MINIMO);

  // Percentil DENTRO da plataforma (nunca global): o TikTok conta view quase no scroll e
  // o YouTube exige ~30s, então ranking por valor absoluto entrega resultado enviesado
  // pró-TikTok e ninguém percebe. Normalizado, um sort global já intercala as plataformas.
  const ratiosPorPlataforma = new Map<Plataforma, number[]>();
  for (const { c, ratio } of comRatio) {
    const lista = ratiosPorPlataforma.get(c.plataforma) ?? [];
    lista.push(ratio);
    ratiosPorPlataforma.set(c.plataforma, lista);
  }

  const pontuados = comRatio.map(({ c, ratio }) => {
    const pares = ratiosPorPlataforma.get(c.plataforma)!;
    // Fração de itens da mesma plataforma com ratio <= o dele. Empates recebem o mesmo
    // valor e o pior fica em 1/n, nunca em 0 — zerado, decay não teria o que multiplicar.
    // ponytail: O(n²); n é uma rodada de busca (~600). Busca binária se o pool inteiro
    // um dia entrar aqui de uma vez.
    const percentil = pares.filter((r) => r <= ratio).length / pares.length;
    const decay = decaimento(c, agora);
    return { candidato: c, ratio, percentil, decay, score: percentil * decay };
  });

  // Desempate por ratio para a ordem ser determinística (o teste depende disso).
  pontuados.sort((a, b) => b.score - a.score || b.ratio - a.ratio);

  const porAutor = new Map<string, number>();
  return pontuados.filter((r) => {
    const n = (porAutor.get(r.candidato.autor_handle) ?? 0) + 1;
    porAutor.set(r.candidato.autor_handle, n);
    return n <= MAX_POR_AUTOR;
  });
}
