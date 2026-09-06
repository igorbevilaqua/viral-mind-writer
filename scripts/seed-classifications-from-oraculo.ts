// Plano 020, WP-C: semeia vm_video_classifications com os rótulos que o Oráculo já pagou.
//
// Lê (read-only, schema `oraculo` do mesmo Supabase):
//   playbook_class  — hook/comando: chave = o TEXTO exato de fato_video.hook/comando
//                     (fn_playbook_para_classificar, Oráculo 0021/0023); storytelling: chave =
//                     fato_roteiro.script_id::text.
//   fato_video      — hook, comando e categorias (já normalizadas) por vídeo; tema = categorias[1].
//   fato_roteiro    — script_id → video_id (ponte do storytelling para o vídeo).
// Traduz slugs → nomes do Codex com lib/pipeline/taxonomia.ts e faz upsert (appDb) com
// fonte='oraculo'. Depois copia vm_hook_classifications (800 vencedores, taxonomia do Codex)
// só para vídeos SEM linha do Oráculo, fonte='codex-2026-07'.
// Imprime contagens e a concordância do mecanismo principal na interseção Oráculo × Codex.
//
//   npx tsx --env-file=.env.local scripts/seed-classifications-from-oraculo.ts [--dry-run]
import { appDb, viralData } from "../lib/db";
import { mapearOraculo, slugConhecido, type Dimensao, type Rotulos } from "../lib/pipeline/taxonomia";

const DRY_RUN = process.argv.includes("--dry-run");
const oraculo = viralData.schema("oraculo");
const PAGE = 1000;

// Paginação genérica por range: a matview não tem cursor estável sem order, então quem
// chama passa o order. (Duplicado em classify-corpus.ts de propósito: scripts não importam scripts.)
async function paginado<T>(
  nome: string,
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(`${nome}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

interface ClassRow { chave: string; categorias: string[] | null; modelo: string | null }
interface FatoVideo { video_id: string; hook: string | null; comando: string | null; categorias: string[] | null }
interface Linha {
  video_id: string;
  hook_mecanismos?: string[];
  hook_formato?: string | null;
  estruturas?: string[];
  comandos?: string[];
  fonte_hook?: string;
  fonte_estruturas?: string;
  fonte_comandos?: string;
  tema: string | null;
  fonte: string;
  modelo: string | null;
  updated_at: string;
}

async function classPorDimensao(dim: Dimensao): Promise<Map<string, ClassRow>> {
  const rows = await paginado<ClassRow>(`playbook_class/${dim}`, (a, b) =>
    oraculo.from("playbook_class").select("chave, categorias, modelo").eq("dimensao", dim).order("chave").range(a, b)
  );
  return new Map(rows.map((r) => [r.chave, r]));
}

// Upsert em lotes. PostgREST só grava as colunas presentes no payload (e exige as mesmas
// chaves em todo o lote), então agrupamos por "forma" — assim re-rodar o seed depois do LLM
// não zera uma dimensão que o Oráculo não tem.
async function upsertPorForma(linhas: Linha[]): Promise<void> {
  const formas = new Map<string, Linha[]>();
  for (const l of linhas) {
    const k = Object.keys(l).sort().join(",");
    formas.set(k, [...(formas.get(k) ?? []), l]);
  }
  for (const grupo of formas.values()) {
    for (let i = 0; i < grupo.length; i += 500) {
      const { error } = await appDb.from("vm_video_classifications").upsert(grupo.slice(i, i + 500), { onConflict: "video_id" });
      if (error) throw new Error(`upsert vm_video_classifications: ${error.message}`);
    }
  }
}

async function main() {
  console.log("carregando oraculo.playbook_class...");
  const [hookClass, comandoClass, storyClass] = await Promise.all([
    classPorDimensao("hook"), classPorDimensao("comando"), classPorDimensao("storytelling"),
  ]);
  console.log(`  hook ${hookClass.size} · comando ${comandoClass.size} · storytelling ${storyClass.size}`);

  console.log("carregando oraculo.fato_video + fato_roteiro...");
  const [videos, roteiros] = await Promise.all([
    paginado<FatoVideo>("fato_video", (a, b) =>
      oraculo.from("fato_video").select("video_id, hook, comando, categorias").order("video_id").range(a, b)
    ),
    paginado<{ script_id: string; video_id: string }>("fato_roteiro", (a, b) =>
      oraculo.from("fato_roteiro").select("script_id, video_id").order("script_id").range(a, b)
    ),
  ]);
  // um vídeo pode ter mais de um roteiro no CRM (raro); fica o primeiro com classificação
  const storyPorVideo = new Map<string, ClassRow>();
  for (const r of roteiros) {
    const c = storyClass.get(r.script_id);
    if (c && !storyPorVideo.has(r.video_id)) storyPorVideo.set(r.video_id, c);
  }

  const agora = new Date().toISOString();
  const linhas: Linha[] = [];
  const cont = { hook: 0, comando: 0, storytelling: 0, hookOutro: 0 };
  const desconhecidos = new Map<string, number>();
  const anota = (dim: Dimensao, slugs: string[]) => {
    for (const s of slugs) if (!slugConhecido(dim, s)) desconhecidos.set(`${dim}/${s}`, (desconhecidos.get(`${dim}/${s}`) ?? 0) + 1);
  };
  const oraculoHook = new Map<string, string[]>(); // video_id → mecanismos (para a concordância)

  for (const v of videos) {
    const h = v.hook ? hookClass.get(v.hook) : undefined;
    const c = v.comando ? comandoClass.get(v.comando) : undefined;
    const s = storyPorVideo.get(v.video_id);
    if (!h && !c && !s) continue;
    const linha: Linha = {
      video_id: v.video_id,
      tema: v.categorias?.[0] ?? null,
      fonte: "oraculo",
      modelo: (h ?? s ?? c)?.modelo ?? null,
      updated_at: agora,
    };
    if (h) {
      anota("hook", h.categorias ?? []);
      const r: Rotulos = mapearOraculo("hook", h.categorias ?? []);
      linha.hook_mecanismos = r.hook_mecanismos!;
      linha.hook_formato = r.hook_formato ?? null;
      linha.fonte_hook = "oraculo";
      oraculoHook.set(v.video_id, r.hook_mecanismos!);
      cont.hook++;
      if (r.hook_mecanismos![0] === "Outro") cont.hookOutro++;
    }
    if (c) {
      anota("comando", c.categorias ?? []);
      linha.comandos = mapearOraculo("comando", c.categorias ?? []).comandos!;
      linha.fonte_comandos = "oraculo";
      cont.comando++;
    }
    if (s) {
      anota("storytelling", s.categorias ?? []);
      linha.estruturas = mapearOraculo("storytelling", s.categorias ?? []).estruturas!;
      linha.fonte_estruturas = "oraculo";
      cont.storytelling++;
    }
    linhas.push(linha);
  }

  console.log(`\nOráculo → ${linhas.length} vídeos com algum rótulo`);
  console.log(`  hook ${cont.hook} (Outro: ${cont.hookOutro}) · comando ${cont.comando} · storytelling ${cont.storytelling}`);
  if (desconhecidos.size) {
    console.log("  slugs SEM mapa em taxonomia.ts (ignorados):");
    for (const [k, n] of desconhecidos) console.log(`    ${k} ×${n}`);
  }

  // ── Codex 2026-07: os 800 vencedores, só onde o Oráculo não chegou ──────────────────────
  const codex = await paginado<{ video_id: string; mecanismos: string[] | null; formato: string | null }>(
    "vm_hook_classifications",
    (a, b) => appDb.from("vm_hook_classifications").select("video_id, mecanismos, formato").order("video_id").range(a, b)
  );
  const comOraculo = new Set(linhas.map((l) => l.video_id));
  const temaPorVideo = new Map(videos.map((v) => [v.video_id, v.categorias?.[0] ?? null]));
  const copiadas: Linha[] = [];
  let puladasComOraculo = 0;
  for (const k of codex) {
    if (comOraculo.has(k.video_id)) { puladasComOraculo++; continue; }
    copiadas.push({
      video_id: k.video_id,
      hook_mecanismos: k.mecanismos?.length ? k.mecanismos : ["Outro"],
      hook_formato: k.formato ?? null,
      fonte_hook: "codex-2026-07",
      tema: temaPorVideo.get(k.video_id) ?? null,
      fonte: "codex-2026-07",
      modelo: null, // analyze-hooks não gravou o modelo
      updated_at: agora,
    });
  }
  console.log(`\nCodex 2026-07 → ${codex.length} vencedores: ${copiadas.length} copiados · ${puladasComOraculo} já tinham linha do Oráculo (não copiados)`);

  // ── Concordância do mecanismo principal (Oráculo × Codex), na interseção ─────────────────
  let n = 0, principal = 0, qualquer = 0;
  for (const k of codex) {
    const o = oraculoHook.get(k.video_id);
    const cx = k.mecanismos ?? [];
    if (!o || !cx.length) continue;
    n++;
    if (o[0] === cx[0]) principal++;
    if (o.some((m) => cx.includes(m))) qualquer++;
  }
  const pct = (x: number) => (n ? `${Math.round((100 * x) / n)}%` : "—");
  console.log(`\nconcordância Oráculo × Codex (hook, n=${n}): principal ${pct(principal)} · algum mecanismo em comum ${pct(qualquer)}`);

  if (DRY_RUN) {
    console.log("\n[dry-run] nada gravado.");
    return;
  }
  await upsertPorForma(linhas);
  await upsertPorForma(copiadas);
  console.log(`\ngravadas ${linhas.length + copiadas.length} linhas em vm_video_classifications`);
}

main().catch((e) => {
  console.error("seed-classifications-from-oraculo falhou:", e);
  process.exit(1);
});
