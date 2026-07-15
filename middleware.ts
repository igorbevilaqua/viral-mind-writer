import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { HUB_COOKIE, HUB_COOKIE_TTL_S, assinarPermissao, verificarPermissao } from "@/lib/hub-cookie";

// Rotas sem sessão: login, callbacks de auth e o cron (protegido por CRON_SECRET na própria rota).
const PUBLIC_PATHS = ["/login", "/auth", "/api/cron"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Acesso = linha em hub.permissoes (app='writer'), cacheada em cookie assinado
  // por 5 min. Usuários/permissões geridos no Painel VML (adm.viralmindlabs.com).
  let papel: string | null = null; // papel do hub ou 'none' (negativa cacheada)
  let setCookie = false;
  if (user) {
    const cached = request.cookies.get(HUB_COOKIE)?.value;
    papel = cached ? await verificarPermissao(cached, user.id) : null;
    if (!papel) {
      const { data, error } = await supabase.rpc("hub_meu_papel", { p_app: "writer" });
      if (error) {
        // Hub inacessível: bloqueia (sem fallback). O erro não vai pro cookie.
        console.error("hub.permissoes inacessível", error.message);
        papel = null;
      } else {
        papel = (data as string | null) ?? "none";
        setCookie = true;
      }
    }
  }
  const authorized = papel !== null && papel !== "none";

  // Cacheia inclusive a negativa ('none') — também na resposta de bloqueio,
  // senão usuário sem acesso consultaria o banco a cada request.
  const withHubCookie = async (res: NextResponse) => {
    if (user && setCookie && papel) {
      res.cookies.set(HUB_COOKIE, await assinarPermissao(user.id, papel), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: HUB_COOKIE_TTL_S,
        path: "/",
      });
    }
    return res;
  };

  if (!authorized && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return withHubCookie(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return withHubCookie(NextResponse.redirect(url));
  }

  return withHubCookie(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
