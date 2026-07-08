"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/allowed-emails";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  // Fora da allowlist: não envia nada, mas responde igual (não revela quem tem acesso).
  if (!email || !isAllowedEmail(email)) redirect("/login?sent=1");

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) redirect("/login?error=send");
  redirect("/login?sent=1");
}
