import { createBrowserClient } from "@supabase/ssr";

// ⚠️ ÚNICO cliente Supabase que roda no NAVEGADOR, e existe SÓ para presença/broadcast
// (canais do Realtime — quem está online, quem está editando, "alguém salvou").
// A regra da casa NÃO mudou: todo DADO continua passando por server component ou server action
// com service role (ver lib/supabase/server.ts e lib/db.ts). Não leia nem escreva tabela por
// aqui — o anon key no browser não tem RLS montada para isso.
//
// Singleton: um socket por aba. Sem ele, o StrictMode do React 19 (que monta o effect duas
// vezes em dev) abriria duas conexões.
let cliente: ReturnType<typeof createBrowserClient> | null = null;

export function browserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Env ausente no build → sem presença, sem exceção na cara do usuário.
  if (!url || !anon) return null;
  cliente ??= createBrowserClient(url, anon);
  return cliente;
}
