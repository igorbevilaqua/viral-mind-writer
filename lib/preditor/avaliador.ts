// Plano 026, Task C: avaliador de pauta. Antes da sala, olha os vídeos da casa com tema parecido
// com o que foi digitado e diz quantos são, quantos ficaram no topo do cliente (em faixa), o modo
// que rendeu acima dos parecidos, os avisos de repetição e até 3 referências da casa.
// A faixa é a taxa observada nos parecidos, não o prever() do v0: o modelo foi validado roteiro
// contra roteiro, e um tema de uma linha cai fora do que ele viu (deu 15 a 25% num tema cujos
// parecidos tinham 9% de topo).
// Custo: um embedding por clique. Nenhum LLM, nenhuma escrita.
import OpenAI from "openai";
import { appDb, viralData } from "../db";
import { SKILLS, type Skill } from "../skills-catalogo";
import { modosDosRoteiros } from "../pipeline/modo-roteiro";
import modelo from "./modelo.json";
import { TOPO, featuresDoCliente, medido, vizinhanca, vizinhosDe, type Rotulo, type Vizinho } from "./index";

const L = modelo.limiares;
// ponytail: um tema digitado é curto e o corpus é "Título + Assunto + roteiro", então o cosseno
// fica mais baixo que o de roteiro contra roteiro (os limiares 0,72/0,69 do modelo). Medido em
// 23/10 com duas pautas: tema que a casa já fez deu 0,62 a 0,72 e tema que ela nunca fez deu
// 0,37 a 0,45. O corte fica no meio. Recalibrar quando houver cliques de verdade.
export const PARECIDO = 0.55;
export const MIN_N = 5; // abaixo disso: "pouco histórico", sem faixa
const MIN_MODO = 3; // roteiros parecidos no modo para ele contar
const SEQUENCIA_DIAS = 21; // acerto recente = bom momento para continuação (achado 7 do estudo)

// Faixas largas porque n é pequeno: a taxa de 9 vídeos não sustenta um número com unidade.
export function faixaDaChance(p: number): string {
  if (p < 0.15) return "abaixo de 15%";
  if (p < 0.25) return "15 a 25%";
  if (p < 0.4) return "25 a 40%";
  return "40% ou mais";
}

export interface RefBruta { video_id: string; script_id: string; cliente_id: string | null; pq: number; sim: number }

/** Uma referência por roteiro (o melhor vídeo dele), só as que ficaram no topo, até 3, do maior pq. */
export function rankearReferencias(videos: Rotulo[], simDe: Map<string, number>, max = 3): RefBruta[] {
  const melhor = new Map<string, Rotulo>();
  for (const v of videos) {
    if (v.pq == null || v.pq < TOPO) continue;
    const m = melhor.get(v.script_id);
    if (!m || v.pq > m.pq!) melhor.set(v.script_id, v);
  }
  return [...melhor.values()]
    .map((v) => ({ video_id: v.video_id, script_id: v.script_id, cliente_id: v.cliente_id, pq: v.pq!, sim: simDe.get(v.script_id) ?? 0 }))
    .sort((a, b) => b.pq - a.pq || b.sim - a.sim)
    .slice(0, max);
}

export interface Resumo {
  n: number; // vídeos parecidos, maduros
  topo: number;
  faixa: string | null; // null quando n < MIN_N
  modo: { skill: Skill; n: number; topo: number } | null;
  avisos: string[];
  refs: RefBruta[];
}

const fmtData = (d: string) => d.slice(8, 10) + "/" + d.slice(5, 7);
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/** A parte pura: dos vizinhos e rótulos ao que o card mostra. */
export function resumir(o: {
  vizCorte: Vizinho[]; // vizinhos com resultado maduro (corte de 30 dias)
  vizHoje: Vizinho[]; // os mesmos sem o corte, só para o aviso de continuação
  rotulos: Rotulo[];
  clienteId: string;
  hoje: string;
  corte: string;
  modos: Map<string, string>;
}): Resumo {
  const parecidos = o.vizCorte.filter((v) => v.sim >= PARECIDO);
  const ids = new Set(parecidos.map((v) => v.script_id));
  const videos = o.rotulos.filter((r) => ids.has(r.script_id) && medido(r) && r.data <= o.corte);
  const n = videos.length;
  const topo = videos.filter((v) => v.pq! >= TOPO).length;

  // modo que mais rendeu: taxa de topo por vídeo, entre os modos com MIN_MODO roteiros parecidos,
  // e só se ela passa a dos parecidos (senão "o que mais rendeu" é só o mais frequente)
  let modo: Resumo["modo"] = null;
  for (const s of SKILLS) {
    const scripts = parecidos.filter((v) => o.modos.get(v.script_id) === s).map((v) => v.script_id);
    if (scripts.length < MIN_MODO) continue;
    const vs = videos.filter((v) => scripts.includes(v.script_id));
    const t = vs.filter((v) => v.pq! >= TOPO).length;
    if (vs.length && t / vs.length > topo / n && (!modo || t / vs.length > modo.topo / modo.n)) modo = { skill: s, n: vs.length, topo: t };
  }

  // repetição, com as réguas de acerto e fracasso do modelo (topo_pq e fraco_pq)
  const avisos: string[] = [];
  const doCli = parecidos.filter((v) => v.cliente_id === o.clienteId);
  const fora = parecidos.filter((v) => v.cliente_id !== o.clienteId);
  const flop = doCli.filter((v) => v.pq <= L.fraco_pq).sort((a, b) => b.data.localeCompare(a.data))[0];
  if (flop) avisos.push(`Tema parecido já foi fraco neste cliente em ${fmtData(flop.data)}.`);
  if (fora.some((v) => v.pq <= L.fraco_pq) && !fora.some((v) => v.pq >= L.topo_pq))
    avisos.push("Tema parecido já foi fraco em outro cliente e não acertou em nenhum.");
  const hit = o.vizHoje
    .filter((v) => v.sim >= PARECIDO && v.cliente_id === o.clienteId && v.pq >= L.topo_pq && diasEntre(v.data, o.hoje) <= SEQUENCIA_DIAS)
    .sort((a, b) => b.data.localeCompare(a.data))[0];
  if (hit) avisos.push(`Tema parecido foi acerto deste cliente há ${diasEntre(hit.data, o.hoje)} dias. Bom momento para uma continuação.`);

  const simDe = new Map(parecidos.map((v) => [v.script_id, v.sim]));
  return { n, topo, faixa: n >= MIN_N ? faixaDaChance(topo / n) : null, modo, avisos, refs: rankearReferencias(videos, simDe) };
}

// ---------------------------------------------------------------- rede e banco

export interface Referencia { url: string; titulo: string | null; cliente: string | null; coef: number | null; plataforma: string | null }
export interface Avaliacao extends Omit<Resumo, "refs"> {
  taxaCliente: number | null; // null com menos de 10 vídeos do cliente nos 90 dias
  referencias: Referencia[];
}

export async function avaliarComVetor(vetor: number[], clienteId: string): Promise<Avaliacao> {
  const { hoje, corte, docs, rotulos, doCliente } = await vizinhanca([vetor], clienteId);
  const vizCorte = vizinhosDe(docs[0], rotulos, corte);
  const vizHoje = vizinhosDe(docs[0], rotulos, hoje);
  const cliente = featuresDoCliente(doCliente, corte);
  const modos = await modosDosRoteiros(vizCorte.filter((v) => v.sim >= PARECIDO).map((v) => v.script_id));
  const r = resumir({ vizCorte, vizHoje, rotulos, clienteId, hoje, corte, modos });

  const idsRef = r.refs.map((x) => x.video_id);
  const idsCli = [...new Set(r.refs.map((x) => x.cliente_id).filter((c): c is string => !!c))];
  const [videos, fato, docsRef, clientes] = idsRef.length
    ? await Promise.all([
        viralData.from("videos").select("id, link_video").in("id", idsRef),
        viralData.schema("oraculo").from("fato_video").select("video_id, coeficiente_viral, plataforma").in("video_id", idsRef),
        viralData.from("documents").select("video_id, content").in("video_id", idsRef),
        appDb.from("clientes").select("id, nome").in("id", idsCli),
      ])
    : [];
  const link = new Map((videos?.data ?? []).map((v) => [v.id as string, v.link_video as string | null]));
  const fv = new Map((fato?.data ?? []).map((f) => [f.video_id as string, f]));
  const titulo = new Map((docsRef?.data ?? []).map((d) => [d.video_id as string, /^Título:\s*(.+)$/m.exec((d.content as string) ?? "")?.[1]?.trim() ?? null]));
  const nome = new Map((clientes?.data ?? []).map((c) => [c.id as string, c.nome as string]));
  const referencias = r.refs
    .filter((x) => link.get(x.video_id))
    .map((x) => {
      const f = fv.get(x.video_id);
      return {
        url: link.get(x.video_id)!,
        titulo: titulo.get(x.video_id) ?? null,
        cliente: x.cliente_id ? nome.get(x.cliente_id) ?? null : null,
        coef: f?.coeficiente_viral != null ? Number(f.coeficiente_viral) : null,
        plataforma: (f?.plataforma as string | null) ?? null,
      };
    });

  const nCli = doCliente.filter(medido).length;
  return { n: r.n, topo: r.topo, faixa: r.faixa, modo: r.modo, avisos: r.avisos, taxaCliente: nCli >= 10 ? cliente.cli90 : null, referencias };
}

/** Um embedding (no formato do corpus, "Título: ...") e a avaliação. */
export async function avaliarPauta(tema: string, clienteId: string): Promise<Avaliacao> {
  const res = await new OpenAI().embeddings.create({ model: "text-embedding-3-small", input: `Título: ${tema}`.slice(0, 8000) });
  return avaliarComVetor(res.data[0].embedding, clienteId);
}

