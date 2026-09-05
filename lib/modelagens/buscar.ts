// Busca de vídeos externos candidatos a modelagem via ScrapeCreators (plano 014, WP-1).
// Mesma conta/chave do coletor (api-viral-data), `fetch` puro com x-api-key — sem
// dependência nova. Cada chamada de busca custa 1 crédito.
//
// Nada é transcrito aqui. A busca só descobre e normaliza; transcrição e autópsia só
// acontecem quando o usuário clica "usar como modelagem". É a maior economia do plano:
// descobre 600, transcreve 1.
//
// YouTube ficou de fora do v1: o endpoint devolve shorts[] com apenas
// id/url/title/viewCount — sem canal, data, duração ou inscritos, ou seja, sem nada do
// que o ranking precisa. Enriquecer custaria 1 crédito por vídeo (61 contra 1 da busca).

import { creditosVistos, sc } from "../scrapecreators";

export type Plataforma = "tiktok" | "instagram";

export interface Candidato {
  plataforma: Plataforma;
  plataform_id: string; // chave de dedup (mesmo typo da coluna do corpus)
  url: string;
  autor_handle: string;
  autor_seguidores: number | null;
  caption: string;
  duracao_seg: number;
  data_publicacao: string; // ISO
  views: number;
  likes: number;
  shares: number;
  comments: number;
  som_id: string | null; // sinal de trend (só TikTok)
  /** Queries que trouxeram este item nesta rodada — vira `descoberto_por` no pool, que é a
   *  chave de reaproveitamento: busca repetida não paga crédito de novo. */
  queries?: string[];
}

export interface BuscaOpts {
  paginas?: number; // páginas por query/plataforma; cada uma custa 1 crédito
  sinal?: AbortSignal;
}

export interface Busca {
  candidatos: Candidato[];
  creditos_restantes: number | null;
  falhas: { plataforma: Plataforma; query: string; erro: string }[];
}

const CONCORRENCIA = 8;
const IG_PAGINA_MAX = 11; // page >= 12 responde 400

// ─── TikTok ──────────────────────────────────────────────────────────────────

interface TikTokResp {
  search_item_list?: {
    aweme_info?: {
      aweme_id?: string;
      desc?: string;
      create_time?: number; // unix (s)
      statistics?: { play_count?: number; digg_count?: number; share_count?: number; comment_count?: number };
      video?: { duration?: number };
      music?: { id_str?: string; id?: number };
      author?: { unique_id?: string; follower_count?: number };
    };
  }[];
  cursor?: number;
}

// video.duration vem em MILISSEGUNDOS (verificado na resposta real: 36500 = 36,5s).
// O Instagram, no mesmo pacote de dados, usa segundos — daí a conversão só existir aqui.
const paraSegundos = (ms: number) => Math.round(ms / 1000);

async function buscarTikTok(query: string, pagina: number, sinal?: AbortSignal): Promise<Candidato[]> {
  // O parâmetro é `query` — `keyword` (o nome do endpoint) é ignorado e devolve vazio.
  const data = await sc<TikTokResp>(
    "/v1/tiktok/search/keyword",
    { query, cursor: (pagina - 1) * 20 },
    sinal
  );

  const out: Candidato[] = [];
  for (const item of data.search_item_list ?? []) {
    const a = item.aweme_info;
    const handle = a?.author?.unique_id;
    if (!a?.aweme_id || !handle || !a.create_time) continue;

    out.push({
      plataforma: "tiktok",
      plataform_id: String(a.aweme_id),
      url: `https://www.tiktok.com/@${handle}/video/${a.aweme_id}`,
      autor_handle: handle,
      autor_seguidores: a.author?.follower_count ?? null,
      caption: a.desc ?? "",
      duracao_seg: paraSegundos(a.video?.duration ?? 0),
      data_publicacao: new Date(a.create_time * 1000).toISOString(),
      views: a.statistics?.play_count ?? 0,
      likes: a.statistics?.digg_count ?? 0,
      shares: a.statistics?.share_count ?? 0,
      comments: a.statistics?.comment_count ?? 0,
      som_id: a.music?.id_str ?? (a.music?.id != null ? String(a.music.id) : null),
    });
  }
  return out;
}

// ─── Instagram ───────────────────────────────────────────────────────────────

// O reel vem PLANO (sem wrapper `media`) e com nomes próprios: `shortcode` — não `code`
// —, `owner` — não `user` — e `taken_at` já em ISO 8601, não em unix. Verificado contra
// resposta real; errar qualquer um deles descarta o item inteiro em silêncio.
interface IgReel {
  id?: string;
  shortcode?: string;
  url?: string;
  caption?: string | null;
  owner?: { username?: string; follower_count?: number };
  video_duration?: number; // segundos (float)
  taken_at?: string | number; // ISO 8601
  video_play_count?: number;
  video_view_count?: number;
  like_count?: number;
  comment_count?: number;
}

interface IgResp {
  reels?: IgReel[];
  next_page?: number | null;
}

async function buscarInstagram(query: string, pagina: number, sinal?: AbortSignal): Promise<Candidato[]> {
  const data = await sc<IgResp>("/v2/instagram/reels/search", { query, page: pagina }, sinal);

  const out: Candidato[] = [];
  for (const r of data.reels ?? []) {
    const handle = r.owner?.username;
    const id = r.id ?? r.shortcode;
    if (!id || !handle || !r.taken_at) continue;

    // taken_at vem ISO; number (unix) tratado por segurança, caso a API volte a mudar.
    const publicado = typeof r.taken_at === "number" ? new Date(r.taken_at * 1000) : new Date(r.taken_at);
    if (Number.isNaN(publicado.getTime())) continue;

    out.push({
      plataforma: "instagram",
      plataform_id: String(id),
      url: r.url ?? `https://www.instagram.com/reel/${r.shortcode}/`,
      autor_handle: handle,
      autor_seguidores: r.owner?.follower_count ?? null,
      caption: r.caption ?? "",
      duracao_seg: Math.round(r.video_duration ?? 0),
      data_publicacao: publicado.toISOString(),
      // video_play_count, nunca video_view_count: os dois divergem no mesmo reel (plays
      // contam replay) — 60.774 contra 33.188 no primeiro item da busca real. Misturar as
      // semânticas torna o ratio incomparável; play_count é o que alinha com o TikTok.
      views: r.video_play_count ?? 0,
      likes: r.like_count ?? 0,
      shares: 0, // a busca do IG não expõe shares
      comments: r.comment_count ?? 0,
      som_id: null,
    });
  }
  return out;
}

// ─── Orquestração ────────────────────────────────────────────────────────────

/**
 * Roda as queries nas duas plataformas e devolve os candidatos já normalizados e
 * deduplicados. Uma query que falha não derruba a busca — a caça é fail-soft por
 * construção: sugestão sem modelagem ainda é sugestão.
 */
export async function buscarCandidatos(queries: string[], opts: BuscaOpts = {}): Promise<Busca> {
  const paginas = Math.max(1, opts.paginas ?? 1);

  const tarefas: { plataforma: Plataforma; query: string; run: () => Promise<Candidato[]> }[] = [];
  for (const query of queries) {
    for (let p = 1; p <= paginas; p++) {
      tarefas.push({ plataforma: "tiktok", query, run: () => buscarTikTok(query, p, opts.sinal) });
      if (p <= IG_PAGINA_MAX)
        tarefas.push({ plataforma: "instagram", query, run: () => buscarInstagram(query, p, opts.sinal) });
    }
  }

  // Dedup DENTRO da rodada, não só no upsert: a doc do TikTok avisa que o endpoint
  // repete resultados entre páginas, e a mesma query em plataformas diferentes converge.
  const porChave = new Map<string, Candidato>();
  const falhas: Busca["falhas"] = [];

  // ponytail: lotes de Promise.all no lugar de um limiter. São dezenas de chamadas por
  // rodada — Bottleneck (como no coletor) só entra se virar milhares.
  for (let i = 0; i < tarefas.length; i += CONCORRENCIA) {
    const lote = tarefas.slice(i, i + CONCORRENCIA);
    const res = await Promise.allSettled(lote.map((t) => t.run()));
    res.forEach((r, j) => {
      if (r.status === "rejected") {
        falhas.push({
          plataforma: lote[j].plataforma,
          query: lote[j].query,
          erro: r.reason instanceof Error ? r.reason.message : String(r.reason),
        });
        return;
      }
      for (const c of r.value) {
        const chave = `${c.plataforma}:${c.plataform_id}`;
        // O mesmo vídeo volta em queries diferentes (e o TikTok repete entre páginas):
        // acumula a atribuição em vez de sobrescrever.
        const anterior = porChave.get(chave);
        c.queries = [...new Set([...(anterior?.queries ?? []), lote[j].query])];
        porChave.set(chave, c);
      }
    });
  }

  if (falhas.length)
    console.warn(`[modelagens] ${falhas.length}/${tarefas.length} buscas falharam`, falhas.slice(0, 3));

  return { candidatos: [...porChave.values()], creditos_restantes: creditosVistos(), falhas };
}
