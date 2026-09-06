import { appDb, viralData } from "./db";

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
  const sa = shingles(a);
  if (!sa.size) return 0;
  const sb = shingles(b);
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
}

const NADA: ResultadoCasamento = { auto: 0, pendentes: 0, publicados: 0 };

// Roda no ETL semanal (lib/etl.ts) e no backfill. Best-effort no padrão de varrerEdicoes:
// migration 0040 ausente vira warning, nunca derruba o ETL.
export async function casarRoteiros(): Promise<ResultadoCasamento> {
  try {
    // ponytail: PostgREST devolve até 1000 linhas; ≤4 por roteiro e decididos saem da busca.
    const { data, error } = await appDb.rpc("vm_match_scripts");
    if (error) {
      console.warn(`vm_match_scripts indisponível: ${error.message} — aplicar migration 0040`);
      return NADA;
    }
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
    if (up.error) {
      console.warn(`vm_script_matches upsert: ${up.error.message}`);
      return NADA;
    }

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
    console.error("casamento de roteiros falhou, ETL segue", e);
    return NADA;
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
