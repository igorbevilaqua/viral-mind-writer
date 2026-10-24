// Plano 026, Task D: o preditor se confere todo mês, sozinho. Pega o último mês maduro, pontua cada
// vídeo VM da casa daquele mês pelo MESMO caminho da produção (match_documents top-40 → vizinhosDe →
// featuresDoTexto + featuresDoCliente → prever) e mede contra o resultado. Só leitura, custo zero:
// o vetor de cada vídeo é o documents.embedding que já está guardado, sem chamar embedding.
// Sem vazamento: o vizinho só conta se publicado 30+ dias antes do vídeo (o corte de vizinhosDe),
// e o próprio roteiro do vídeo sai da vizinhança (como `j === i` em features.mjs).
import { appDb, viralData } from "../db";
import { wilsonLower, wilsonUpper } from "../calibration";
import modelo from "./modelo.json";
import { marcasDoHook } from "./hook";
import {
  TOPO, VERSAO, emLotes, featuresDoCliente, featuresDoTexto, medido, menosDias, paginar, prever, vizinhosDe,
  type Features, type Rotulo,
} from "./index";

export const PORTAO = 0.58;
const DIA = 86_400_000;
const PARALELO = 10; // RPCs ao mesmo tempo: ~1.200 vídeos cabem nos 300 s da rota

// ---------------------------------------------------------------- métricas (puras)

export interface Linha { grupo: string; y: number; p: number }

/** Acurácia par a par dentro de cada grupo, com IC95 por bootstrap de grupos (modelo.mjs). */
export function parAPar(linhas: Linha[]) {
  const G = new Map<string, Linha[]>();
  for (const l of linhas) (G.get(l.grupo) ?? G.set(l.grupo, []).get(l.grupo)!).push(l);
  const grupos: [number, number][] = [];
  for (const g of G.values()) {
    const pos = g.filter((l) => l.y === 1).map((l) => l.p), neg = g.filter((l) => l.y === 0).map((l) => l.p);
    if (!pos.length || !neg.length) continue;
    let c = 0;
    for (const a of pos) for (const b of neg) c += a > b ? 1 : a === b ? 0.5 : 0;
    grupos.push([c, pos.length * neg.length]);
  }
  const acc = (gs: [number, number][]) => gs.reduce((s, g) => s + g[0], 0) / gs.reduce((s, g) => s + g[1], 0);
  if (!grupos.length) return { acc: null, lo: null, hi: null, pares: 0, grupos: 0 };
  let semente = 7; // a mesma semente e o mesmo gerador do estudo
  const rnd = () => (semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648;
  const boot: number[] = [];
  for (let b = 0; b < 1000; b++) boot.push(acc(grupos.map(() => grupos[Math.floor(rnd() * grupos.length)])));
  boot.sort((a, b) => a - b);
  return { acc: acc(grupos), lo: boot[25], hi: boot[974], pares: grupos.reduce((s, g) => s + g[1], 0), grupos: grupos.length };
}

export function auc(linhas: Linha[]): number | null {
  const s = [...linhas].sort((a, b) => a.p - b.p);
  let somaPos = 0, nPos = 0;
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j + 1 < s.length && s[j + 1].p === s[i].p) j++;
    for (let t = i; t <= j; t++) if (s[t].y) { somaPos += (i + j) / 2 + 1; nPos++; }
    i = j + 1;
  }
  const nNeg = s.length - nPos;
  return nPos && nNeg ? (somaPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg) : null;
}

// as faixas que a tela usa (faixaDaChance em avaliador.ts)
export const FAIXAS: [string, number, number][] = [["<15%", 0, 0.15], ["15-25%", 0.15, 0.25], ["25-40%", 0.25, 0.4], ["40%+", 0.4, Infinity]];

export function calibracao(linhas: Linha[]) {
  return FAIXAS.map(([faixa, a, b]) => {
    const sel = linhas.filter((l) => l.p >= a && l.p < b), k = sel.reduce((s, l) => s + l.y, 0), n = sel.length;
    return { faixa, n, previsto: n ? sel.reduce((s, l) => s + l.p, 0) / n : null, observado: n ? k / n : null, lo: wilsonLower(k, n), hi: wilsonUpper(k, n) };
  });
}

/** Tudo o que o mês reporta, a partir das linhas pontuadas. */
export function metricas(linhas: Linha[]) {
  const n = linhas.length, base = n ? linhas.reduce((s, l) => s + l.y, 0) / n : 0;
  const brier = (p: (l: Linha) => number) => (n ? linhas.reduce((s, l) => s + (p(l) - l.y) ** 2, 0) / n : null);
  return { n, taxa_topo: base, par_a_par: parAPar(linhas), auc: auc(linhas), brier: brier((l) => l.p), brier_base: brier(() => base), calibracao: calibracao(linhas) };
}

/** O último mês cujo último dia ficou 30+ dias para trás (a mesma folga dos rótulos e do corte). */
export function mesMaduro(hoje: string): string {
  const d = new Date(Date.parse(hoje) - 30 * DIA);
  const fim = new Date(d.getTime() + DIA).getUTCDate() === 1 ? d : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0));
  return fim.toISOString().slice(0, 7);
}

// ponytail: o hook do treino é o 1º parágrafo do roteiro do CRM, que não está nas variáveis do
// Codex local. Aqui é o começo do roteiro do documento (transcrição): frases até 12 palavras,
// no máximo 40. Trocar pelo texto do CRM se o crmDb passar a existir nos dois lados.
export function hookDoDocumento(content: string): string {
  const corpo = content.split(/\n\s*\n/).slice(1).join(" ").replace(/\s+/g, " ").trim();
  let out = "";
  for (const f of corpo.split(/(?<=[.!?…])\s+/)) {
    out = out ? `${out} ${f}` : f;
    if (out.split(" ").length >= 12) break;
  }
  return out.split(" ").slice(0, 40).join(" ");
}

// ---------------------------------------------------------------- banco (só leitura)

const COLS = "video_id, script_id, cliente_id, plataforma, data, pq";
const fimDoMes = (mes: string) => new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7), 0)).toISOString().slice(0, 10);

export interface Pontuado extends Rotulo { y: number; p: number; n_viz: number }

/** Cada vídeo VM medido do mês, com a nota que a produção daria na data dele. */
export async function pontuarMes(mes: string) {
  const todos = await paginar<Rotulo>((a, b) => appDb.from("vm_preditor_rotulos").select(COLS).order("video_id").range(a, b));
  const porVideo = new Map(todos.map((r) => [r.video_id, r]));
  const porScript = new Map<string, Rotulo[]>(), porCliente = new Map<string, Rotulo[]>();
  for (const r of todos) {
    (porScript.get(r.script_id) ?? porScript.set(r.script_id, []).get(r.script_id)!).push(r);
    if (r.cliente_id) (porCliente.get(r.cliente_id) ?? porCliente.set(r.cliente_id, []).get(r.cliente_id)!).push(r);
  }
  const doMes = todos.filter((r) => medido(r) && r.data >= `${mes}-01` && r.data <= fimDoMes(mes));
  const docs = await emLotes<{ video_id: string; content: string | null; embedding: string | null }>(doMes.map((r) => r.video_id), (l) =>
    viralData.from("documents").select("video_id, content, embedding").in("video_id", l)
  );
  const doc = new Map(docs.filter((d) => d.embedding).map((d) => [d.video_id, d]));
  const modos = new Map(
    (await emLotes<{ crm_script_id: string; modo: string }>([...new Set(doMes.map((r) => r.script_id))], (l) =>
      appDb.from("vm_roteiro_modo").select("crm_script_id, modo").in("crm_script_id", l)
    )).map((m) => [m.crm_script_id, m.modo])
  );

  const alvo = doMes.filter((r) => doc.has(r.video_id));
  const out: Pontuado[] = [];
  let falhas = 0;
  for (let i = 0; i < alvo.length; i += PARALELO) {
    await Promise.all(alvo.slice(i, i + PARALELO).map(async (r) => {
      const d = doc.get(r.video_id)!;
      const { data, error } = await viralData
        .rpc("match_documents", { query_embedding: JSON.parse(d.embedding!), match_count: 40, match_threshold: 0.3 })
        .select("video_id, similarity");
      if (error) { falhas++; return; }
      // o roteiro do próprio vídeo não é vizinho dele (o estudo também tira `j === i`)
      const vizDocs = ((data ?? []) as unknown as { video_id: string; similarity: number }[]).filter((x) => porVideo.get(x.video_id)?.script_id !== r.script_id);
      const scripts = new Set(vizDocs.map((x) => porVideo.get(x.video_id)?.script_id).filter((s): s is string => !!s));
      const rotulos = [...scripts].flatMap((s) => porScript.get(s) ?? []);
      const corte = menosDias(r.data, modelo.limiares.gap_dias);
      const viz = vizinhosDe(vizDocs, rotulos, corte);
      // como na sombra: cliente nas três redes juntas, âncora fora, modo do roteiro
      const f: Features = {
        ...featuresDoTexto(viz, r.cliente_id, r.data),
        ...featuresDoCliente(r.cliente_id ? porCliente.get(r.cliente_id) ?? [] : [], corte),
        modo: modos.get(r.script_id) ?? null, ancora: null, hk: marcasDoHook(hookDoDocumento(d.content ?? "")),
      };
      out.push({ ...r, y: r.pq! >= TOPO ? 1 : 0, p: prever(f), n_viz: viz.length });
    }));
  }
  return { linhas: out, medidos: doMes.length, sem_documento: doMes.length - alvo.length, falhas, rotulosMes: doMes };
}

/**
 * Checagem entre sessões: entre os roteiros do Codex publicados no mês, a nota sombra da candidata
 * escolhida contra o resultado, par a par dentro de cliente × rede. Liga pela crm_script_id do
 * roteiro gerado e pelos casamentos confirmados em vm_script_matches.
 */
async function sombraDoMes(rotulosMes: Rotulo[]) {
  const { data: s, error } = await appDb.from("vm_preditor_sombra").select("script_id, fase, nota").eq("escolhida", true).not("script_id", "is", null);
  if (error) return { erro: error.message };
  if (!s?.length) return { hook: { n: 0 }, narrativa: { n: 0 }, aviso: "nenhuma linha escolhida em vm_preditor_sombra" };
  const ids = [...new Set(s.map((x) => x.script_id as string))];
  const [gerados, casados] = await Promise.all([
    emLotes<{ id: string; crm_script_id: string | null }>(ids, (l) => appDb.from("vm_generated_scripts").select("id, crm_script_id").in("id", l)),
    emLotes<{ script_id: string; video_id: string }>(ids, (l) => appDb.from("vm_script_matches").select("script_id, video_id").eq("confirmado", true).in("script_id", l)),
  ]);
  const doMes = new Map(rotulosMes.map((r) => [r.video_id, r]));
  const crm = new Map(gerados.map((g) => [g.id, g.crm_script_id]));
  const videosDe = (id: string) => {
    const vs = new Set(casados.filter((c) => c.script_id === id).map((c) => c.video_id));
    for (const r of rotulosMes) if (crm.get(id) && r.script_id === crm.get(id)) vs.add(r.video_id);
    return [...vs].map((v) => doMes.get(v)).filter((r): r is Rotulo => !!r);
  };
  const porFase = (fase: string) => {
    const linhas = s.filter((x) => x.fase === fase && x.nota != null).flatMap((x) =>
      videosDe(x.script_id as string).map((r) => ({ grupo: `${r.cliente_id}|${r.plataforma}`, y: r.pq! >= TOPO ? 1 : 0, p: x.nota as number }))
    );
    return { n: linhas.length, par_a_par: parAPar(linhas) };
  };
  return { hook: porFase("hook"), narrativa: porFase("narrativa") };
}

/** A medição do mês (padrão: o último mês maduro). É o que a rota devolve e o Actions lê. */
export async function medirMes(mes = mesMaduro(new Date().toISOString().slice(0, 10))) {
  const t0 = Date.now();
  const { linhas, medidos, sem_documento, falhas, rotulosMes } = await pontuarMes(mes);
  const m = metricas(linhas.map((l) => ({ grupo: `${l.cliente_id}|${l.plataforma}`, y: l.y, p: l.p })));
  const acc = m.par_a_par.acc, lo = m.par_a_par.lo;
  return {
    mes,
    versao: VERSAO,
    portao: PORTAO,
    passou: acc != null && lo != null && acc >= PORTAO && lo >= 0.5,
    medidos,
    sem_documento,
    falhas,
    ...m,
    sombra: await sombraDoMes(rotulosMes),
    segundos: Math.round((Date.now() - t0) / 1000),
  };
}
