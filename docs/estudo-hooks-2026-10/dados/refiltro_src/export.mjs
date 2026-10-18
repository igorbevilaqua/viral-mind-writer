import { createClient } from "/Users/igorbevilaqua/Projetos/Oraculo VM/node_modules/@supabase/supabase-js/dist/index.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync("/Users/igorbevilaqua/Projetos/Oraculo VM/.env.local","utf8").split("\n").filter(l=>l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,"")]}));
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const OUT = new URL(".", import.meta.url).pathname;
async function all(q, cols, order) {
  const out = []; for (let o = 0; ; o += 1000) {
    const { data, error } = await q().select(cols).order(order).range(o, o + 999);
    if (error) throw error; out.push(...data); if (data.length < 1000) break; }
  return out;
}
const fv = await all(() => sb.schema("oraculo").from("fato_video"), "video_id,cliente_id,cliente_nome,plataforma,vm_script,data_publicacao,hook,retencao_hook,retencao_subhook,retencao_final,views_total,coeficiente_viral,classificacao,alcance,maturando,canal_median_views", "video_id");
console.log("fato_video", fv.length);
writeFileSync(OUT + "fv.json", JSON.stringify(fv));
const v = await all(() => sb.from("videos"), "id,removido,is_repost,crm_script_id,vm_script", "id");
console.log("videos", v.length);
writeFileSync(OUT + "videos.json", JSON.stringify(v));
const p = await all(() => sb.schema("oraculo").from("playbook_class"), "*", "chave");
console.log("playbook_class", p.length, Object.keys(p[0]));
writeFileSync(OUT + "pb.json", JSON.stringify(p));
