import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await db.from("vm_playbooks").select("slug,version,active,content").order("slug").order("version");
if (error) throw error;
for (const p of data) writeFileSync(`data/playbooks_ativos/${p.slug}_v${p.version}${p.active ? "_ATIVO" : ""}.md`, p.content);
console.log(data.map((p) => `${p.slug} v${p.version}${p.active ? " (ativo)" : ""}: ${p.content.length}`).join("\n"));
