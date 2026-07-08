import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Aceita os dois formatos de magic link do Supabase:
// - code/PKCE: template PADRÃO ({{ .ConfirmationURL }}), que redireciona com ?code=
// - token_hash: template custom do README ({{ .RedirectTo }}?token_hash=...)
// Como o projeto Supabase é compartilhado com outro app, não trocamos o template;
// a rota lida com o que chegar.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  } else if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
