// Identidade unificada VML — helpers server-side do schema hub (migration 0019).
import { cookies } from "next/headers";
import { appDb } from "./db";
import { createClient } from "./supabase/server";
import { HUB_COOKIE, verificarPermissao } from "./hub-cookie";

// Papel padrão no writer é 'usuario' (gestão no Painel VML — adm.viralmindlabs.com).
export type Papel = string;

// Papel do usuário logado no writer (null = sem acesso). Lê o cookie assinado
// pelo middleware; sem cookie válido, consulta hub.permissoes via RPC.
export async function getPapel(): Promise<Papel | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const cached = (await cookies()).get(HUB_COOKIE)?.value;
  if (cached) {
    const papel = await verificarPermissao(cached, user.id);
    if (papel) return papel === "none" ? null : (papel as Papel);
  }

  const { data, error } = await supabase.rpc("hub_meu_papel", { p_app: "writer" });
  if (error) {
    // Hub inacessível: bloqueia (auth centralizada no painel, sem fallback local).
    console.error("hub.permissoes inacessível", error.message);
    return null;
  }
  return (data as Papel | null) ?? null;
}

// Registra atividade em hub.atividades (app='writer') via service role.
// Best-effort: nunca lança — telemetria não pode derrubar o fluxo principal.
export async function registrarAtividade(evento: string, payload?: Record<string, unknown>) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await appDb.rpc("hub_registrar_atividade", {
      p_user_id: user?.id ?? null,
      p_app: "writer",
      p_evento: evento,
      p_payload: payload ?? null,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error(`registrarAtividade(${evento}) falhou`, e);
  }
}
