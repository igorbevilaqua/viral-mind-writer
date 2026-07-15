"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Auth centralizada no Painel VML (adm.viralmindlabs.com): login por senha.
// Acesso é checado pelo middleware via hub.permissoes; usuários/senhas são geridos no painel.
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=credenciais");

  redirect("/");
}
