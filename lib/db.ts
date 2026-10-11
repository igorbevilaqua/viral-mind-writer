import { createClient } from "@supabase/supabase-js";

// Server-only. appDb = banco do app (projeto Viral Mind). viralData = corpus read-only.
export const appDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const viralData = createClient(
  process.env.VIRAL_DATA_URL!,
  process.env.VIRAL_DATA_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// CRM (projeto Supabase próprio): só leitura do texto ESCRITO dos roteiros da casa, com parágrafos,
// para o few-shot (plano 024, 2.5). Opcional: sem as duas variáveis, null, e quem usa cai na
// transcrição do vídeo. As chaves são as mesmas que o Cockpit já usa.
export const crmDb =
  process.env.CRM_SUPABASE_URL && process.env.CRM_SERVICE_ROLE_KEY
    ? createClient(process.env.CRM_SUPABASE_URL, process.env.CRM_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;
