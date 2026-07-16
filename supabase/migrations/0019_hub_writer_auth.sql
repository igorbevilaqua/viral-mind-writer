-- Identidade unificada VML: RPCs em public para o schema hub (que não é exposto
-- no PostgREST). security definer contorna o RLS de hub.permissoes/hub.atividades.

-- Papel do usuário logado num app do hub (null = sem acesso).
create or replace function public.hub_meu_papel(p_app text)
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select papel from hub.permissoes where user_id = auth.uid() and app = p_app;
$$;
revoke execute on function public.hub_meu_papel(text) from public, anon;
grant execute on function public.hub_meu_papel(text) to authenticated;

-- Gate do magic link: o email já tem usuário + permissão no app?
-- Só service_role (chamada server-side no login) — anon não pode enumerar emails.
create or replace function public.hub_email_tem_permissao(p_email text, p_app text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from auth.users u
    join hub.permissoes p on p.user_id = u.id
    where lower(u.email) = lower(p_email) and p.app = p_app
  );
$$;
revoke execute on function public.hub_email_tem_permissao(text, text) from public, anon, authenticated;
grant execute on function public.hub_email_tem_permissao(text, text) to service_role;

-- Registro de atividade (chamado via service role pelo helper registrarAtividade).
create or replace function public.hub_registrar_atividade(p_user_id uuid, p_app text, p_evento text, p_payload jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into hub.atividades (user_id, app, evento, payload)
  values (p_user_id, p_app, p_evento, p_payload);
$$;
revoke execute on function public.hub_registrar_atividade(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.hub_registrar_atividade(uuid, text, text, jsonb) to service_role;
