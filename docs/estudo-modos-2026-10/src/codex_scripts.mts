// Primeira versão de cada sessão do Codex (o que o pipeline entrega antes de qualquer ajuste), as 150 mais recentes. Só leitura.
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
const vd = createClient(process.env.VIRAL_DATA_URL!, process.env.VIRAL_DATA_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const { data, error } = await vd.from("vm_generated_scripts").select("id,session_id,client_id,version,hook,roteiro,comando,headline,created_at").not("roteiro", "is", null).order("created_at", { ascending: false }).limit(2000);
if (error) throw error;
const { data: cl } = await vd.from("clientes").select("id,nome");
const nome = new Map((cl ?? []).map((c: any) => [c.id, c.nome]));
const primeira = new Map<string, any>();
for (const r of data!) if ((r.roteiro ?? "").length > 800) { const p = primeira.get(r.session_id); if (!p || r.version < p.version) primeira.set(r.session_id, r); }
const xs = [...primeira.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 150);
writeFileSync(new URL("../../out/modos/lotes/codex.md", import.meta.url).pathname, xs.map((r) => `### ${r.id}\ncliente: ${nome.get(r.client_id) ?? "?"}\ntitulo: ${r.headline ?? ""}\n\n${[r.hook, r.roteiro, r.comando].filter(Boolean).join("\n\n").trim()}\n`).join("\n---\n\n"));
writeFileSync(new URL("../../out/modos/codex_meta.json", import.meta.url).pathname, JSON.stringify(xs.map((r) => ({ id: r.id, cliente: nome.get(r.client_id) ?? null, created_at: r.created_at }))));
console.log("sessões", primeira.size, "| exportados", xs.length, "| de", xs.at(-1).created_at.slice(0, 10), "a", xs[0].created_at.slice(0, 10));
