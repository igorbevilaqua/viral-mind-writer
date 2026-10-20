import { appDb, crmDb, viralData } from "./db";

// Plano 020, WP-A. Casamento Codex → vídeo publicado, por texto (vm_match_scripts, 0040).
// Alta confiança entra no flywheel sozinha: vira `published_url`, e daí syncScriptPerformance
// faz o resto. Zona cinza vira pendência no Kasparov (kasparov-filas.ts). Abaixo, descartado.
//
// Dois sinais, papéis diferentes. O `ts_rank` da RPC só GERA candidatos: satura em hooks longos
// de tema parecido (Federer/Nike vs Nike/Federer deu 0,98 sendo vídeos diferentes). Quem DECIDE
// é a sobreposição de 5-gramas literais entre o texto do Codex e o do vídeo: o vídeo publicado
// é a transcrição do roteiro, então repete sequências inteiras. Medido em 06/09/2026 sobre 143
// candidatos: todo verdadeiro ≥ 0,09, todo falso ≤ 0,02.
export const MATCH_AUTO = 0.08;
export const MATCH_PENDENTE = 0.02;

/** Uma linha de vm_match_scripts. */
export interface MatchRow {
  script_id: string;
  video_id: string;
  plataforma: string | null;
  score: number;
  link_video: string | null;
  data_publicacao: string | null;
  hook_codex: string | null;
  hook_video: string | null;
  roteiro_codex: string | null;
  roteiro_video: string | null;
}

export interface Casamento extends MatchRow {
  /** fração dos 5-gramas do texto do Codex presentes no vídeo (0–1) */
  sobreposicao: number;
  auto: boolean;
  /** o vídeo cujo link vira published_url (um por roteiro) */
  principal: boolean;
}

const N_GRAMA = 5;
const tokens = (t: string | null) =>
  (t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9]+/g) ?? [];

function shingles(t: string | null): Set<string> {
  const w = tokens(t);
  const s = new Set<string>();
  for (let i = 0; i + N_GRAMA <= w.length; i++) s.add(w.slice(i, i + N_GRAMA).join(" "));
  return s;
}

// Pura. Fração dos 5-gramas de `a` que aparecem em `b`. Assimétrica de propósito: o lado do
// Codex é o menor e o que importa é quanto DELE sobreviveu no vídeo.
export function sobreposicao(a: string | null, b: string | null): number {
  return fracao(shingles(a), shingles(b));
}

function fracao(sa: Set<string>, sb: Set<string>): number {
  if (!sa.size) return 0;
  let k = 0;
  for (const x of sa) if (sb.has(x)) k++;
  return k / sa.size;
}

const textoCodex = (r: MatchRow) => `${r.hook_codex ?? ""} ${r.roteiro_codex ?? ""}`;
const textoVideo = (r: MatchRow) => `${r.hook_video ?? ""} ${r.roteiro_video ?? ""}`;

// Pura. Um vídeo pertence a UM roteiro (o de maior sobreposição — duas versões do mesmo
// roteiro casam com o mesmo vídeo). `principal` é Instagram se houver, senão a maior
// sobreposição; escolhido entre os automáticos quando existe algum, porque é dele que sai o
// published_url.
export function decidirCasamentos(rows: MatchRow[]): Casamento[] {
  const melhorPorVideo = new Map<string, Casamento>();
  for (const r of rows) {
    const ov = sobreposicao(textoCodex(r), textoVideo(r));
    if (ov < MATCH_PENDENTE) continue;
    const atual = melhorPorVideo.get(r.video_id);
    if (!atual || ov > atual.sobreposicao)
      melhorPorVideo.set(r.video_id, { ...r, sobreposicao: ov, auto: ov >= MATCH_AUTO, principal: false });
  }
  const porScript = new Map<string, Casamento[]>();
  for (const c of melhorPorVideo.values()) porScript.set(c.script_id, [...(porScript.get(c.script_id) ?? []), c]);

  const out: Casamento[] = [];
  for (const grupo of porScript.values()) {
    const ordem = [...grupo].sort((a, b) => b.sobreposicao - a.sobreposicao);
    const autos = ordem.filter((c) => c.auto);
    const base = autos.length ? autos : ordem;
    const principal = base.find((c) => c.plataforma === "Instagram") ?? base[0];
    for (const c of ordem) out.push({ ...c, principal: c === principal });
  }
  return out;
}

// Nunca sobrescreve published_url existente — quem colou o link sabe mais que o casamento.
async function publicar(scriptId: string, link: string, data: string | null): Promise<boolean> {
  const { data: upd, error } = await appDb
    .from("vm_generated_scripts")
    .update({ status: "published", published_url: link, published_at: data })
    .eq("id", scriptId)
    .is("published_url", null)
    .select("id");
  if (error) {
    console.warn(`casamento: não consegui publicar ${scriptId}: ${error.message}`);
    return false;
  }
  return (upd?.length ?? 0) > 0;
}

export interface ResultadoCasamento {
  auto: number;
  pendentes: number;
  publicados: number;
  /** o motivo de ter devolvido zero: vai no JSON do ETL, que o Summary do GitHub Actions mostra */
  erro?: string;
}

const NADA: ResultadoCasamento = { auto: 0, pendentes: 0, publicados: 0 };

// Roda no ETL semanal (lib/etl.ts) e no backfill. Best-effort: nunca derruba o ETL, mas o
// erro volta em `erro` (antes era um warn que ninguém lia).
export async function casarRoteiros(): Promise<ResultadoCasamento> {
  try {
    // ponytail: PostgREST devolve até 1000 linhas; ≤4 por roteiro e decididos saem da busca.
    const { data, error } = await appDb.rpc("vm_match_scripts");
    // Desde 21/09 estoura o statement_timeout de 8s do PostgREST (11,7s medidos em 20/10) e
    // o warn escondeu isso por 4 semanas. O erro sobe no resultado; casarComCrm cobre o buraco.
    if (error) return { ...NADA, erro: `vm_match_scripts: ${error.message}` };
    const casos = decidirCasamentos((data ?? []) as MatchRow[]);
    if (!casos.length) return NADA;

    const agora = new Date().toISOString();
    const up = await appDb.from("vm_script_matches").upsert(
      casos.map((c) => ({
        script_id: c.script_id,
        video_id: c.video_id,
        plataforma: c.plataforma,
        score: c.score,
        sobreposicao: c.sobreposicao,
        metodo: c.auto ? "shingle_auto" : "shingle_pendente",
        confirmado: c.auto ? true : null,
        decidido_em: c.auto ? agora : null,
      })),
      { onConflict: "script_id,video_id" }
    );
    if (up.error) return { ...NADA, erro: `vm_script_matches upsert: ${up.error.message}` };

    let publicados = 0;
    for (const c of casos)
      if (c.auto && c.principal && c.link_video && (await publicar(c.script_id, c.link_video, c.data_publicacao)))
        publicados++;
    return {
      auto: casos.filter((c) => c.auto).length,
      pendentes: casos.filter((c) => !c.auto).length,
      publicados,
    };
  } catch (e) {
    return { ...NADA, erro: e instanceof Error ? e.message : String(e) };
  }
}

// Resposta da pendência no Kasparov. Aceito → o vídeo vira published_url se ainda não houver.
export async function confirmarCasamento(scriptId: string, videoId: string, aceito: boolean): Promise<void> {
  const { error } = await appDb
    .from("vm_script_matches")
    .update({ confirmado: aceito, decidido_em: new Date().toISOString(), metodo: "kasparov" })
    .eq("script_id", scriptId)
    .eq("video_id", videoId);
  if (error) throw new Error(`não consegui gravar o casamento: ${error.message}`);
  if (!aceito) return;
  const { data: v } = await viralData
    .from("videos")
    .select("link_video, data_publicacao")
    .eq("id", videoId)
    .maybeSingle();
  if (v?.link_video) await publicar(scriptId, v.link_video as string, (v.data_publicacao as string | null) ?? null);
}

// ── Plano 024, 4.1: casamento Codex → roteiro do CRM → vídeo. O roteiro sai do Codex por
// copiar-e-colar no CRM, e o coletor já liga CRM → vídeo em videos.crm_script_id. Falta só
// Codex → CRM, e a mesma régua de 5-gramas resolve: medido em 20/10/2026, 56 casados a 0,08,
// 20/20 de acordo com vm_script_matches, 0 falsos em 10 conferidos (docs/ligacao-roteiro-video).
// Sem filtro de cliente de propósito: 3 dos 22 que o caminho antigo perdeu foram usados para
// outro cliente, e 78 roteiros do Codex nem têm cliente. O texto decide.

export interface RoteiroCodex {
  id: string;
  hook: string | null;
  roteiro: string | null;
  created_at: string;
}

export interface RoteiroCrm {
  id: string;
  script_text: string | null;
  created_at: string;
}

export interface CasamentoCrm {
  script_id: string;
  crm_script_id: string;
  sobreposicao: number;
  auto: boolean;
}

const DIA = 864e5;

// Pura. Melhor roteiro do CRM por roteiro do Codex, criado de 3 dias antes a 60 depois (a mesma
// janela de vm_match_scripts). Um roteiro do CRM pertence a UM do Codex: a versão de maior
// sobreposição. `reivindicados` são os do CRM já ligados num run anterior.
export function casarTextosCrm(
  codex: RoteiroCodex[],
  crm: RoteiroCrm[],
  reivindicados: Set<string> = new Set()
): CasamentoCrm[] {
  const alvos = crm
    .filter((r) => !reivindicados.has(r.id))
    .map((r) => ({ id: r.id, t: Date.parse(r.created_at), sh: shingles(r.script_text) }));
  const porCrm = new Map<string, CasamentoCrm>();
  for (const g of codex) {
    const sa = shingles(`${g.hook ?? ""} ${g.roteiro ?? ""}`);
    if (!sa.size) continue;
    const t = Date.parse(g.created_at);
    let melhor: CasamentoCrm | null = null;
    for (const r of alvos) {
      if (r.t < t - 3 * DIA || r.t > t + 60 * DIA) continue;
      const ov = fracao(sa, r.sh);
      if (ov >= MATCH_PENDENTE && (!melhor || ov > melhor.sobreposicao))
        melhor = { script_id: g.id, crm_script_id: r.id, sobreposicao: ov, auto: ov >= MATCH_AUTO };
    }
    const atual = melhor && porCrm.get(melhor.crm_script_id);
    if (melhor && (!atual || melhor.sobreposicao > atual.sobreposicao)) porCrm.set(melhor.crm_script_id, melhor);
  }
  return [...porCrm.values()];
}

type Pagina<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

// Sem `order` a paginação do PostgREST duplica e perde linhas (aconteceu na prova de 20/10):
// quem chama sempre ordena por id.
async function todas<T>(q: (de: number, ate: number) => Pagina<T>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await q(i, i + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) return out;
  }
}

export interface ResultadoCrm extends ResultadoCasamento {
  /** roteiros do Codex ligados a um roteiro do CRM neste run */
  roteiros: number;
  /** motivo de não ter rodado (sem as variáveis do CRM) */
  pulado?: string;
}

// Roda no ETL semanal antes de casarRoteiros e no backfill (`dias` maior, `gravar` false no
// dry-run). Grava crm_script_id/crm_sobreposicao (0055) e os vídeos em vm_script_matches, que o
// flywheel, o Kasparov e o codex_vs_canal já leem. 0,02–0,08 vai como pendente (confirmado null)
// para o Kasparov, como no caminho antigo; o crm_script_id só entra no automático.
export async function casarComCrm({ dias = 75, gravar = true } = {}): Promise<ResultadoCrm> {
  const zero: ResultadoCrm = { ...NADA, roteiros: 0 };
  const crm = crmDb;
  if (!crm) return { ...zero, pulado: "sem CRM_SUPABASE_URL/CRM_SERVICE_ROLE_KEY no ambiente" };
  try {
    const desde = new Date(Date.now() - dias * DIA).toISOString();
    // ponytail: um select só para os já ligados (centenas); paginar quando passar de 1000
    const ligados = await appDb
      .from("vm_generated_scripts")
      .select("id, crm_script_id, crm_sobreposicao, created_at")
      .not("crm_script_id", "is", null);
    if (ligados.error) throw new Error(`vm_generated_scripts.crm_script_id: ${ligados.error.message} — aplicar migration 0055`);
    const soltos = await todas<RoteiroCodex>((de, ate) =>
      appDb
        .from("vm_generated_scripts")
        .select("id, hook, roteiro, created_at")
        .is("crm_script_id", null)
        .gte("created_at", desde)
        .order("id")
        .range(de, ate)
    );
    let novos: CasamentoCrm[] = [];
    if (soltos.length) {
      const inicio = Math.min(...soltos.map((g) => Date.parse(g.created_at))) - 3 * DIA;
      const doCrm = await todas<RoteiroCrm>((de, ate) =>
        crm
          .from("scripts")
          .select("id, script_text, created_at")
          .gte("created_at", new Date(inicio).toISOString())
          .order("id")
          .range(de, ate)
      );
      novos = casarTextosCrm(soltos, doCrm, new Set((ligados.data ?? []).map((l) => l.crm_script_id as string)));
    }
    // Os já ligados na janela entram de novo: o coletor acha o TikTok e o YouTube dias depois.
    const casos = [
      ...novos,
      ...(ligados.data ?? [])
        .filter((l) => (l.created_at as string) >= desde)
        .map((l) => ({
          script_id: l.id as string,
          crm_script_id: l.crm_script_id as string,
          sobreposicao: Number(l.crm_sobreposicao ?? MATCH_AUTO),
          auto: true,
        })),
    ];
    if (!casos.length) return zero;

    const porCrm = new Map(casos.map((c) => [c.crm_script_id, c]));
    const ids = [...porCrm.keys()];
    const videos: { id: string; crm_script_id: string; link_video: string | null; data_publicacao: string | null; plataforma: string | null }[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await viralData
        .from("videos")
        .select("id, crm_script_id, link_video, data_publicacao, removido, canais(plataforma)")
        .in("crm_script_id", ids.slice(i, i + 100));
      if (error) throw new Error(`videos por crm_script_id: ${error.message}`);
      for (const v of data ?? []) {
        if (v.removido) continue;
        const canal = (Array.isArray(v.canais) ? v.canais[0] : v.canais) as { plataforma?: string | null } | null;
        videos.push({
          id: v.id as string,
          crm_script_id: v.crm_script_id as string,
          link_video: (v.link_video as string | null) ?? null,
          data_publicacao: (v.data_publicacao as string | null) ?? null,
          plataforma: canal?.plataforma ?? null,
        });
      }
    }
    // Vídeo já confirmado para outro roteiro não muda de dono (mesma regra de vm_match_scripts).
    // ponytail: um `in` só, ~3 vídeos por roteiro cabem na URL; fatiar se um dia não couber
    const donos = videos.length
      ? await appDb.from("vm_script_matches").select("script_id, video_id").eq("confirmado", true).in("video_id", videos.map((v) => v.id))
      : { data: [], error: null };
    if (donos.error) throw new Error(`vm_script_matches: ${donos.error.message}`);
    const dono = new Map((donos.data ?? []).map((d) => [d.video_id as string, d.script_id as string]));
    const agora = new Date().toISOString();
    const roteiroDe = (v: { crm_script_id: string }) => porCrm.get(v.crm_script_id)!.script_id;
    const livres = videos.filter((v) => (dono.get(v.id) ?? roteiroDe(v)) === roteiroDe(v));
    const linhas = livres.map((v) => {
      const c = porCrm.get(v.crm_script_id)!;
      return {
        script_id: c.script_id,
        video_id: v.id,
        plataforma: v.plataforma,
        score: c.sobreposicao,
        sobreposicao: c.sobreposicao,
        metodo: c.auto ? "crm_shingle" : "crm_shingle_pendente",
        confirmado: c.auto ? true : null,
        decidido_em: c.auto ? agora : null,
      };
    });
    const novosAuto = novos.filter((c) => c.auto);
    if (!gravar)
      return {
        ...zero,
        roteiros: novosAuto.length,
        auto: linhas.filter((l) => l.confirmado).length,
        pendentes: linhas.filter((l) => l.confirmado === null).length,
      };

    // Vídeos antes do crm_script_id: se o update falhar, o próximo run refaz tudo. ignoreDuplicates
    // porque linha existente é decisão do Kasparov (ou do caminho antigo) e não se sobrescreve.
    let auto = 0;
    let pendentes = 0;
    if (linhas.length) {
      const up = await appDb
        .from("vm_script_matches")
        .upsert(linhas, { onConflict: "script_id,video_id", ignoreDuplicates: true })
        .select("confirmado");
      if (up.error) throw new Error(`vm_script_matches upsert: ${up.error.message}`);
      auto = (up.data ?? []).filter((l) => l.confirmado).length;
      pendentes = (up.data ?? []).length - auto;
    }
    let roteiros = 0;
    for (const c of novosAuto) {
      const { error } = await appDb
        .from("vm_generated_scripts")
        .update({ crm_script_id: c.crm_script_id, crm_sobreposicao: c.sobreposicao })
        .eq("id", c.script_id)
        .is("crm_script_id", null);
      if (error) throw new Error(`crm_script_id de ${c.script_id}: ${error.message}`);
      roteiros++;
    }
    // published_url: Instagram se houver, senão o primeiro (mesma regra de decidirCasamentos)
    let publicados = 0;
    for (const c of casos.filter((x) => x.auto)) {
      const vs = livres.filter((v) => v.crm_script_id === c.crm_script_id && v.link_video);
      const principal = vs.find((v) => v.plataforma === "Instagram") ?? vs[0];
      if (principal && (await publicar(c.script_id, principal.link_video!, principal.data_publicacao))) publicados++;
    }
    return { auto, pendentes, publicados, roteiros };
  } catch (e) {
    return { ...zero, erro: e instanceof Error ? e.message : String(e) };
  }
}
