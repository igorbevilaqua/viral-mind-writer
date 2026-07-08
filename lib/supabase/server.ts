import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente Supabase de auth (anon key + cookies). O acesso a dados continua via service role em lib/db.ts.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components não podem escrever cookies; o middleware renova a sessão.
          }
        },
      },
    }
  );
}
