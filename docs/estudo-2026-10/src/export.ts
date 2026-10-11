// Estudo 2026-10: exporta a base comum (roteiros VM publicados) para os subagentes.
// Rodar de scratchpad/estudo:
//   npx tsx --env-file="<codex>/.env.local" --env-file="<cockpit>/.env.local" src/export.ts
// Saídas em data/: videos.json (1 linha por vídeo), scripts.json (1 por roteiro do CRM),
// nichos.json, emb.f32 + emb_ids.json (embeddings gemini-embedding-001 do CRM, 3072d, L2-normalizados).
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const opts = { auth: { persistSession: false } };
const vd = createClient(process.env.VIRAL_DATA_URL!, process.env.VIRAL_DATA_SERVICE_ROLE_KEY!, opts);
const crm = createClient(process.env.CRM_SUPABASE_URL!, process.env.CRM_SERVICE_ROLE_KEY!, opts);
const OUT = new URL("../data/", import.meta.url).pathname;

async function paginar<T>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, page = 1000) {
  const out: T[] = [];
  for (let from = 0; ; from += page) {
    const { data, error } = await q(from, from + page - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < page) return out;
  }
}

async function emLotes<T>(ids: string[], size: number, f: (lote: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += size) {
    const { data, error } = await f(ids.slice(i, i + size));
    if (error) throw error;
    out.push(...(data ?? []));
  }
  return out;
}

const COLS_FATO =
  "video_id,canal_id,cliente_id,cliente_nome,plataforma,data_publicacao,titulo,assunto,hook,comando,video_duration," +
  "categorias,sentimentos,views_total,curtidas_total,comentarios_total,compart_total,salvamentos_total," +
  "retencao_hook,retencao_subhook,retencao_final,taxa_nao_seguidores,seguidores_ganhos,canal_median_views," +
  "coeficiente_viral,classificacao,maturando,link_video";

type Row = Record<string, any>;

// percentil dentro do estrato (cliente x plataforma); null quando o valor falta ou o estrato tem < 8
function percentis(rows: Row[], campo: string, destino: string) {
  const grupos = new Map<string, Row[]>();
  for (const r of rows) {
    const v = r[campo];
    if (v == null || !Number.isFinite(v) || !r.analisavel) continue;
    const k = `${r.cliente_id}|${r.plataforma}`;
    (grupos.get(k) ?? grupos.set(k, []).get(k)!).push(r);
  }
  for (const g of grupos.values()) {
    if (g.length < 8) continue;
    g.sort((a, b) => a[campo] - b[campo]);
    // empates recebem o percentil médio do bloco
    for (let i = 0; i < g.length; ) {
      let j = i;
      while (j + 1 < g.length && g[j + 1][campo] === g[i][campo]) j++;
      const p = (i + j) / 2 / (g.length - 1);
      for (let t = i; t <= j; t++) g[t][destino] = Math.round(p * 1000) / 1000;
      i = j + 1;
    }
  }
}

const num = (x: unknown) => (x == null || x === "" ? null : Number(x));
const taxa = (a: unknown, views: number) => (a == null || !views ? null : (Number(a) / views) * 1000);

async function main() {
  // 1. fotografia dos vídeos com roteiro VM
  const fato = await paginar<Row>((a, b) =>
    vd.schema("oraculo").from("fato_video").select(COLS_FATO).eq("vm_script", "sim").order("video_id").range(a, b)
  );
  console.log("fato_video vm:", fato.length);

  const ids = fato.map((r) => r.video_id);
  const vids = await emLotes<Row>(ids, 150, (l) =>
    vd.from("videos").select("id,crm_script_id,crm_title,roteiro,is_repost,data_entrega_roteiro,crm_origem").in("id", l)
  );
  const vidPor = new Map(vids.map((v) => [v.id, v]));

  const cls = await emLotes<Row>(ids, 150, (l) =>
    vd.from("vm_video_classifications").select("video_id,hook_mecanismos,hook_formato,estruturas,comandos,tema").in("video_id", l)
  );
  const clsPor = new Map(cls.map((c) => [c.video_id, c]));

  const nichos = await paginar<Row>((a, b) => vd.schema("oraculo").from("cliente_nicho").select("*").range(a, b));
  const roteiroFato = await paginar<Row>((a, b) =>
    vd.schema("oraculo").from("fato_roteiro").select("script_id,topic_names,character_names").range(a, b)
  );
  const topicos = new Map<string, Row>();
  for (const r of roteiroFato) if (!topicos.has(r.script_id)) topicos.set(r.script_id, r);

  const videos: Row[] = fato.map((f) => {
    const v = vidPor.get(f.video_id) ?? {};
    const c = clsPor.get(f.video_id) ?? {};
    const views = Number(f.views_total ?? 0);
    const rh = num(f.retencao_hook), rs = num(f.retencao_subhook), rf = num(f.retencao_final);
    return {
      video_id: f.video_id,
      script_id: v.crm_script_id ?? null,
      cliente_id: f.cliente_id,
      cliente: f.cliente_nome,
      canal_id: f.canal_id,
      plataforma: f.plataforma,
      data: f.data_publicacao,
      duracao: num(f.video_duration),
      hook_video: f.hook,
      comando_video: f.comando,
      titulo_video: f.titulo,
      assunto: f.assunto,
      categorias: f.categorias,
      sentimentos: (f.sentimentos ?? []).map((s: string) => { try { return JSON.parse(s).sentimento; } catch { return s; } }),
      is_repost: v.is_repost ?? null,
      views,
      coef: num(f.coeficiente_viral),
      classificacao: f.classificacao,
      acerto: f.classificacao === "acerto" || f.classificacao === "outlier",
      maturando: f.maturando,
      analisavel: !f.maturando && views > 0 && f.coeficiente_viral != null,
      canal_median_views: num(f.canal_median_views),
      ret_hook: rh,
      ret_sub: rs,
      ret_final: rf,
      // retenção condicional: quem passou do hook e ficou até o subhook; quem passou do subhook e ficou até o fim
      ret_sub_cond: rh && rs != null ? rs / rh : null,
      ret_final_cond: rs && rf != null ? rf / rs : null,
      nao_seguidores: num(f.taxa_nao_seguidores),
      seguidores: num(f.seguidores_ganhos),
      seg_por_mil: taxa(f.seguidores_ganhos, views),
      comp_por_mil: f.compart_total ? taxa(f.compart_total, views) : null,
      salv_por_mil: f.salvamentos_total ? taxa(f.salvamentos_total, views) : null,
      coment_por_mil: taxa(f.comentarios_total, views),
      curt_por_mil: taxa(f.curtidas_total, views),
      link: f.link_video,
      cls_hook: c.hook_mecanismos ?? null,
      cls_formato: c.hook_formato ?? null,
      cls_estrutura: c.estruturas ?? null,
      cls_comando: c.comandos ?? null,
      cls_tema: c.tema ?? null,
    };
  });

  for (const [campo, dest] of [
    ["coef", "p_coef"], ["ret_hook", "p_ret_hook"], ["ret_sub_cond", "p_ret_sub_cond"], ["ret_final", "p_ret_final"],
    ["ret_final_cond", "p_ret_final_cond"], ["seg_por_mil", "p_seg"], ["comp_por_mil", "p_comp"],
    ["salv_por_mil", "p_salv"], ["coment_por_mil", "p_coment"],
  ]) percentis(videos, campo, dest);

  // 2. roteiros do CRM (texto escrito, com parágrafos)
  const scriptIds = [...new Set(videos.map((v) => v.script_id).filter(Boolean))] as string[];
  const scripts = await emLotes<Row>(scriptIds, 150, (l) =>
    crm.from("scripts").select(
      "id,display_id,client_id,title,script_text,sources,notes,responsible,delivered_at,posted_at,created_at,status_key,client_approval_state"
    ).in("id", l)
  );
  console.log("scripts crm:", scripts.length, "de", scriptIds.length);
  const scriptsOut = scripts.map((s) => {
    const fontes: string = s.sources ?? "";
    const m = fontes.match(/modelagem[^\n]*?\n*\s*(https?:\/\/\S+)/i) ?? fontes.match(/modelagem:\s*(https?:\/\/\S+)/i);
    const vs = videos.filter((v) => v.script_id === s.id);
    const t = topicos.get(s.id);
    return {
      script_id: s.id,
      display_id: s.display_id,
      cliente_id: vs[0]?.cliente_id ?? null,
      cliente: vs[0]?.cliente ?? null,
      titulo: s.title,
      texto: s.script_text,
      roteirista: s.responsible,
      entregue: s.delivered_at,
      postado: s.posted_at,
      modelagem: /modelagem/i.test(fontes),
      modelagem_url: m?.[1] ?? null,
      topicos: t?.topic_names ?? null,
      personagens: t?.character_names ?? null,
      plataformas: [...new Set(vs.map((v) => v.plataforma))],
      video_ids: vs.map((v) => v.video_id),
    };
  });

  writeFileSync(OUT + "videos.json", JSON.stringify(videos));
  writeFileSync(OUT + "scripts.json", JSON.stringify(scriptsOut));
  writeFileSync(OUT + "nichos.json", JSON.stringify(nichos));
  console.log("videos.json", videos.length, "| scripts.json", scriptsOut.length, "| nichos", nichos.length);

  // 3. embeddings do CRM, só dos roteiros publicados
  const D = 3072;
  const embRows = await emLotes<Row>(scriptIds, 40, (l) => crm.from("script_embeddings").select("script_id,embedding").in("script_id", l));
  const buf = new Float32Array(embRows.length * D);
  const embIds: string[] = [];
  embRows.forEach((r, i) => {
    const vec = (typeof r.embedding === "string" ? JSON.parse(r.embedding) : r.embedding) as number[];
    if (vec.length !== D) throw new Error(`dims ${vec.length}`);
    let n = 0;
    for (const x of vec) n += x * x;
    n = Math.sqrt(n) || 1;
    for (let j = 0; j < D; j++) buf[i * D + j] = vec[j] / n;
    embIds.push(r.script_id);
  });
  writeFileSync(OUT + "emb.f32", Buffer.from(buf.buffer));
  writeFileSync(OUT + "emb_ids.json", JSON.stringify(embIds));
  console.log("embeddings:", embIds.length, "x", D);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
