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
