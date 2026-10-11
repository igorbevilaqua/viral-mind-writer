import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
const vd = createClient(process.env.VIRAL_DATA_URL, process.env.VIRAL_DATA_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await vd.from("vm_client_preferences").select("viral_data_cliente_id,client_id,proibicoes,tom_de_voz,temas_preferidos,vocabulario_evitar,vocabulario_usar");
if (error) throw error;
writeFileSync("data/preferencias.json", JSON.stringify(data));
console.log("preferências:", data.length, "com proibições:", data.filter((d) => d.proibicoes?.length).length);
