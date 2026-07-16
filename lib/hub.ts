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

// user_id do usuário logado (null = anônimo). Curto-vivo: só em server actions/rotas
// onde os cookies são confiáveis — NUNCA dentro do stream de geração (lá o user_id vem
// de vm_sessions.user_id, sem depender de cookies() num contexto que já respondeu).
export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Registra atividade em hub.atividades (app='writer') via service role.
// Best-effort: nunca lança — telemetria não pode derrubar o fluxo principal.
// sessaoId = vm_sessions.id → o cockpit liga o evento ao contexto rico da sessão.
// A identidade (userId/sessaoId) é passada pelo chamador; antes resolvíamos o user
// via cookies() aqui dentro, o que estourava no contexto do stream SSE e engolia tudo.
export async function registrarAtividade(
  evento: string,
  opts: { sessaoId?: string | null; userId?: string | null; payload?: Record<string, unknown> } = {}
) {
  try {
    const { error } = await appDb.rpc("hub_registrar_atividade", {
      p_user_id: opts.userId ?? null,
      p_app: "writer",
      p_evento: evento,
      p_payload: opts.payload ?? null,
      p_sessao_id: opts.sessaoId ?? null,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error(`registrarAtividade(${evento}) falhou`, e);
  }
}
