// Plano 026, Task B: preditor v0 (docs/preditor-2026-10, a variante OpenAI) em modo SOMBRA.
// Pontua as candidatas de hook e de narrativa de cada geração e grava as notas e a escolhida em
// vm_preditor_sombra. Não decide nada: roda depois do `done`, em melhor esforço, e a escolha da
// sala é a mesma com ou sem ele.
//
// A nota segue features.mjs/modelo.mjs do estudo. O que muda na produção, e por quê:
// - Vizinhos: o top-40 de documents pelo match_documents (o HNSW devolve no máximo 40), agrupado
//   por roteiro. O estudo usava o centróide de cada roteiro e o corpus inteiro.
// - Rótulos: vm_preditor_rotulos, que o ETL semanal recalcula com a régua de lib.mjs.
// - Território (terr_c30/terr_c60): fica na média do treino, ou seja, não pesa. Os centróides
//   são do k-means do estudo e não vieram para a produção. Os dois pesos são pequenos.
// - Taxa do cliente (cli90/cli_tend): as três redes juntas, porque a sessão não tem rede.
// - Âncora: a sessão não tem, fica fora (como os roteiros sem modo no estudo).
import OpenAI from "openai";
import { appDb, viralData } from "../db";
import modelo from "./modelo.json";
import { marcasDoHook } from "./hook";

export const VERSAO = modelo.versao;
const L = modelo.limiares;
const REDES = ["Instagram", "TikTok", "YouTube"];
const TOPO = 0.75; // pq >= 0,75 é topo (lib.mjs, DESFECHOS.coef)
const DIA = 86_400_000;

export interface Rotulo {
  video_id: string;
  script_id: string;
  cliente_id: string | null;
  plataforma: string | null;
  data: string; // yyyy-mm-dd
  pq: number | null;
}
export interface Vizinho {
  script_id: string;
  cliente_id: string | null;
  sim: number;
  topo: number; // média do topo dos vídeos já maduros do roteiro
  pq: number;
  data: string; // o vídeo mais recente entre eles
}
export interface Features {
  knn20: number; sim_media: number; n_casa: number; casa_taxa: number; n_cli: number; cli_taxa: number;
  rep_acerto: number; rep_acerto_90: number; rep_fraco: number; fora_fraco: number; fora_acerto: number;
  cli90: number; cli_tend: number;
  modo: string | null; ancora: string | null;
  hk: string[];
  terr_c30?: number; terr_c60?: number; // ausentes na produção: entram na média
}

const encolher = (k: number, n: number, m: number) => (k + m * L.base) / (n + m);
const menosDias = (d: string, n: number) => new Date(Date.parse(d) - n * DIA).toISOString().slice(0, 10);
const dias = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DIA);
const medido = (r: Rotulo) => r.pq != null && REDES.includes(r.plataforma ?? "");

// Documento → roteiro, com o resultado conhecido até o corte (conhecido() de features.mjs).
// ponytail: a similaridade do roteiro é a do melhor documento dele; no estudo era o centróide,
// e os vídeos do mesmo roteiro têm cosseno mediano de 0,95 entre si.
export function vizinhosDe(docs: { video_id: string; similarity: number }[], rotulos: Rotulo[], corte: string): Vizinho[] {
  const scriptDe = new Map(rotulos.map((r) => [r.video_id, r.script_id]));
  const sim = new Map<string, number>();
  for (const d of docs) {
    const s = scriptDe.get(d.video_id);
    if (s) sim.set(s, Math.max(sim.get(s) ?? -1, d.similarity));
  }
  const out: Vizinho[] = [];
  for (const [script_id, s] of sim) {
    const doRoteiro = rotulos.filter((r) => r.script_id === script_id);
    const vs = doRoteiro.filter((r) => medido(r) && r.data <= corte);
    if (!vs.length) continue;
    out.push({
      script_id,
      cliente_id: doRoteiro[0].cliente_id,
      sim: s,
      topo: vs.filter((v) => v.pq! >= TOPO).length / vs.length,
      pq: vs.reduce((a, v) => a + v.pq!, 0) / vs.length,
      data: vs.reduce((a, v) => (v.data > a ? v.data : a), ""),
    });
  }
  return out.sort((a, b) => b.sim - a.sim);
}

// Tema e repetição (featuresDe de features.mjs, mesma ordem e mesmos limiares).
export function featuresDoTexto(viz: Vizinho[], clienteId: string | null, hoje: string) {
  const top = viz.slice(0, L.k_casa);
  const mesmo = (v: Vizinho) => v.cliente_id === clienteId;
  const casa = viz.filter((v) => v.sim >= (mesmo(v) ? L.mesmo_cliente : L.outro_cliente)).slice(0, L.k_casa);
  const cli = viz.filter((v) => mesmo(v) && v.sim >= L.mesmo_cliente).slice(0, L.k_cliente);
  const hit = cli.find((v) => v.pq >= L.topo_pq), flop = cli.find((v) => v.pq <= L.fraco_pq);
  const fora = viz.filter((v) => !mesmo(v) && v.sim >= L.outro_cliente);
  const soma = (vs: Vizinho[]) => vs.reduce((a, v) => a + v.topo, 0);
  return {
    knn20: top.length ? soma(top) / top.length : L.base,
    sim_media: viz.length ? viz.slice(0, L.k_sim).reduce((a, v) => a + v.sim, 0) / Math.min(L.k_sim, viz.length) : 0,
    n_casa: casa.length,
    casa_taxa: encolher(soma(casa), casa.length, 5),
    n_cli: cli.length,
    cli_taxa: encolher(soma(cli), cli.length, 3),
    rep_acerto: hit ? 1 : 0,
    rep_acerto_90: hit && dias(hit.data, hoje) >= 90 ? 1 : 0,
    rep_fraco: flop ? 1 : 0,
    fora_fraco: fora.some((v) => v.pq <= L.fraco_pq) ? 1 : 0,
    fora_acerto: fora.some((v) => v.pq >= L.topo_pq) ? 1 : 0,
  };
}

// Taxa de topo do cliente em [corte-90, corte] e a tendência (45 dias recentes menos os 45 antes).
export function featuresDoCliente(doCliente: Rotulo[], corte: string) {
  const ini = menosDias(corte, 90), meio = menosDias(corte, 45);
  let n1 = 0, k1 = 0, n2 = 0, k2 = 0;
  for (const v of doCliente) {
    if (!medido(v) || v.data > corte || v.data < ini) continue;
    const y = v.pq! >= TOPO ? 1 : 0;
    if (v.data > meio) { n2++; k2 += y; } else { n1++; k1 += y; }
  }
  return { cli90: encolher(k1 + k2, n1 + n2, 10), cli_tend: n1 && n2 ? k2 / n2 - k1 / n1 : 0 };
}

function valor(f: Features, nome: string, media: number): number {
  if (nome === "log_n_casa") return Math.log1p(f.n_casa);
  if (nome === "log_n_cli") return Math.log1p(f.n_cli);
  if (nome.startsWith("modo_")) return f.modo === nome.slice(5) ? 1 : 0;
  if (nome.startsWith("ancora_")) return f.ancora === nome.slice(7) ? 1 : 0;
  if (nome.startsWith("hk_")) return f.hk.includes(nome.slice(3)) ? 1 : 0;
  const v = (f as unknown as Record<string, number | undefined>)[nome];
  return v ?? media;
}

// p = 1 / (1 + exp(-(intercepto + soma(peso * (x - media) / dp)))), a fórmula do modelo.json
export function prever(f: Features): number {
  const z = modelo.features.reduce((s, c) => s + (c.peso * (valor(f, c.nome, c.media) - c.media)) / c.dp, modelo.intercepto);
  return 1 / (1 + Math.exp(-z));
}

// ---------------------------------------------------------------- produção (rede e banco)

const TIMEOUT_MS = 20_000;
const LOTE_IN = 100; // ids por .in(): a URL do PostgREST não aguenta centenas de uuids

async function emLotes<T>(ids: string[], q: (lote: string[]) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += LOTE_IN) {
    const { data, error } = await q(ids.slice(i, i + LOTE_IN));
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
  }
  return out;
}

const COLS = "video_id, script_id, cliente_id, plataforma, data, pq";

export interface Candidata {
  embutir: string; // no formato do corpus: "Título: ...\n\nroteiro"
  hook: string; // o texto que o catálogo de hook lê
}

async function pontuar(candidatas: Candidata[], clienteId: string | null, modo: string | null) {
  const hoje = new Date().toISOString().slice(0, 10);
  const corte = menosDias(hoje, L.gap_dias);
  // um request de embedding para a fase inteira
  const emb = await new OpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: candidatas.map((c) => c.embutir.slice(0, 8000)),
  });
  const docs = await Promise.all(
    emb.data.map(async (e) => {
      const { data, error } = await viralData
        .rpc("match_documents", { query_embedding: e.embedding, match_count: 40, match_threshold: 0.3 })
        .select("video_id, similarity");
      if (error) throw new Error(`match_documents: ${error.message}`);
      return (data ?? []) as unknown as { video_id: string; similarity: number }[];
    })
  );
  const idsDocs = [...new Set(docs.flat().map((d) => d.video_id))];
  const ligados = await emLotes<Rotulo>(idsDocs, (l) => appDb.from("vm_preditor_rotulos").select(COLS).in("video_id", l));
  const scripts = [...new Set(ligados.map((r) => r.script_id))];
  const rotulos = await emLotes<Rotulo>(scripts, (l) => appDb.from("vm_preditor_rotulos").select(COLS).in("script_id", l));
  let cliente = { cli90: L.base, cli_tend: 0 };
  if (clienteId) {
    const { data, error } = await appDb
      .from("vm_preditor_rotulos")
      .select(COLS)
      .eq("cliente_id", clienteId)
      .gte("data", menosDias(corte, 90))
      .lte("data", corte);
    if (error) throw new Error(error.message);
    cliente = featuresDoCliente((data ?? []) as Rotulo[], corte);
  }
  return candidatas.map((c, i) => {
    const viz = vizinhosDe(docs[i], rotulos, corte);
    const f: Features = { ...featuresDoTexto(viz, clienteId, hoje), ...cliente, modo, ancora: null, hk: marcasDoHook(c.hook) };
    return { nota: prever(f), features: { ...f, n_viz: viz.length } };
  });
}

/**
 * Pontua as candidatas de uma fase e grava em vm_preditor_sombra. Nunca lança e nunca muda a
 * escolha: quem chama faz `void` depois do `done`. Sem a migration 0056, avisa e segue.
 */
export async function sombraDoPreditor(o: {
  sessionId: string;
  scriptId: string | null;
  clienteId: string | null;
  modo: string | null;
  fase: "hook" | "narrativa";
  candidatas: Candidata[];
  escolhida: number;
}): Promise<void> {
  if (o.candidatas.length < 2) return; // uma candidata só não tem o que ordenar
  let relogio: ReturnType<typeof setTimeout> | undefined;
  try {
    const tempo = new Promise<never>((_, rej) => {
      relogio = setTimeout(() => rej(new Error(`passou de ${TIMEOUT_MS / 1000} s`)), TIMEOUT_MS);
    });
    const notas = await Promise.race([pontuar(o.candidatas, o.clienteId, o.modo), tempo]);
    const { error } = await appDb.from("vm_preditor_sombra").insert(
      notas.map((n, i) => ({
        session_id: o.sessionId,
        script_id: o.scriptId,
        client_id: o.clienteId,
        fase: o.fase,
        indice: i,
        texto: o.fase === "hook" ? o.candidatas[i].hook : o.candidatas[i].embutir,
        nota: n.nota,
        escolhida: i === o.escolhida,
        features: n.features,
        versao: VERSAO,
      }))
    );
    if (error) throw new Error(error.message);
  } catch (e) {
    console.warn(`preditor sombra (${o.fase}) não gravou, geração segue (migration 0056 aplicada?)`, e instanceof Error ? e.message : e);
  } finally {
    clearTimeout(relogio);
  }
}

// ---------------------------------------------------------------- ETL semanal

// lib.mjs: trimestre do estudo, com outubro a dezembro dentro do Q3 ("out/2026 entra no Q3").
// ponytail: igual ao estudo para o rótulo ser o mesmo do treino; revisar na recalibração (Task D).
const trimestre = (d: string) => {
  const [y, m] = d.split("-").map(Number);
  return `${y}Q${Math.min(3, Math.floor((m - 1) / 3) + 1)}`;
};

// percentilEm de lib.mjs: empates recebem o percentil médio do bloco
function percentilEm<T extends { coef: number }>(g: T[], destino: (r: T, p: number) => void) {
  g.sort((a, b) => a.coef - b.coef);
  for (let i = 0; i < g.length; ) {
    let j = i;
    while (j + 1 < g.length && g[j + 1].coef === g[i].coef) j++;
    for (let t = i; t <= j; t++) destino(g[t], (i + j) / 2 / (g.length - 1));
    i = j + 1;
  }
}

type Fato = { video_id: string; cliente_id: string | null; plataforma: string | null; data_publicacao: string | null; coeficiente_viral: number | string | null; views_total: number | null; maturando: boolean | null };
type Video = { id: string; crm_script_id: string; is_repost: boolean | null };

/** Linhas puras do rótulo (sem banco), para o ETL e para o teste. */
export function rotularVideos(fato: Fato[], videos: Video[]): Rotulo[] {
  const vid = new Map(videos.map((v) => [v.id, v]));
  const linhas = fato
    .filter((f) => vid.has(f.video_id) && f.data_publicacao)
    .map((f) => {
      const v = vid.get(f.video_id)!;
      const coef = Number(f.coeficiente_viral);
      const analisavel = !f.maturando && (f.views_total ?? 0) > 0 && f.coeficiente_viral != null && Number.isFinite(coef) && !v.is_repost;
      return { video_id: f.video_id, script_id: v.crm_script_id, cliente_id: f.cliente_id, plataforma: f.plataforma, data: f.data_publicacao!.slice(0, 10), pq: null as number | null, coef, analisavel, p2: null as number | null };
    });
  const g1 = new Map<string, typeof linhas>(), g2 = new Map<string, typeof linhas>();
  for (const r of linhas) {
    if (!r.analisavel) continue;
    const k2 = `${r.cliente_id}|${r.plataforma}`, k1 = `${k2}|${trimestre(r.data)}`;
    (g1.get(k1) ?? g1.set(k1, []).get(k1)!).push(r);
    (g2.get(k2) ?? g2.set(k2, []).get(k2)!).push(r);
  }
  for (const g of g2.values()) if (g.length >= 8) percentilEm(g, (r, p) => (r.p2 = p));
  for (const g of g1.values()) if (g.length >= 8) percentilEm(g, (r, p) => (r.pq = p));
  return linhas.map(({ video_id, script_id, cliente_id, plataforma, data, pq, p2 }) => ({ video_id, script_id, cliente_id, plataforma, data, pq: pq ?? p2 }));
}

async function paginar<T>(q: (a: number, b: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let a = 0; ; a += 1000) {
    const { data, error } = await q(a, a + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

/** ETL semanal: recalcula vm_preditor_rotulos inteira a partir de oraculo.fato_video. */
export async function atualizarRotulos(): Promise<{ videos: number; medidos: number }> {
  const inicio = new Date().toISOString();
  const fato = await paginar<Fato>((a, b) =>
    viralData.schema("oraculo").from("fato_video")
      .select("video_id, cliente_id, plataforma, data_publicacao, coeficiente_viral, views_total, maturando")
      .eq("vm_script", "sim").order("video_id").range(a, b)
  );
  const videos = await paginar<Video>((a, b) =>
    viralData.from("videos").select("id, crm_script_id, is_repost").not("crm_script_id", "is", null).order("id").range(a, b)
  );
  const linhas = rotularVideos(fato, videos);
  for (let i = 0; i < linhas.length; i += 500) {
    const { error } = await appDb
      .from("vm_preditor_rotulos")
      .upsert(linhas.slice(i, i + 500).map((r) => ({ ...r, atualizado_em: inicio })), { onConflict: "video_id" });
    if (error) throw new Error(`vm_preditor_rotulos (migration 0056 aplicada?): ${error.message}`);
  }
  // o que não veio nesta rodada (virou repost, perdeu o roteiro) sai
  const del = await appDb.from("vm_preditor_rotulos").delete().lt("atualizado_em", inicio);
  if (del.error) throw new Error(`vm_preditor_rotulos delete: ${del.error.message}`);
  return { videos: linhas.length, medidos: linhas.filter((r) => r.pq != null).length };
}
