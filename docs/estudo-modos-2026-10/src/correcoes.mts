// Exporta as lições (vm_lessons + vm_lesson_learnings) com o roteiro corrigido e o pedido. Só leitura.
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
const vd = createClient(process.env.VIRAL_DATA_URL!, process.env.VIRAL_DATA_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const { data: lessons, error: e1 } = await vd.from("vm_lessons").select("id,client_id,source_kind,source_title,transcript,context_note,created_at");
if (e1) throw e1;
const { data: ll, error: e2 } = await vd.from("vm_lesson_learnings").select("id,lesson_id,dimensao,titulo,descricao,evidencia,origem,active,grupo,destinatarios");
if (e2) throw e2;
const { data: cl } = await vd.from("clientes").select("id,nome");
const nome = new Map((cl ?? []).map((c: any) => [c.id, c.nome]));
const out = lessons!.map((l: any) => ({ ...l, cliente: nome.get(l.client_id) ?? null, learnings: ll!.filter((x: any) => x.lesson_id === l.id) }));
writeFileSync(new URL("../../out/modos/correcoes.json", import.meta.url).pathname, JSON.stringify(out, null, 1));
console.log("lessons", out.length, "| learnings", ll!.length, "| ativos", ll!.filter((x: any) => x.active).length);
