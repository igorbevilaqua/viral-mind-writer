-- 0011: RLS service-role-only (plano 012, WP-B.1)
-- O projeto Supabase é COMPARTILHADO com outro app: as policies "authenticated
-- full access" (0001:125 e 0007:59-60) davam leitura/escrita total nas tabelas
-- vm_* a QUALQUER usuário authenticated via PostgREST. Este app só acessa dados
-- via service role (lib/db.ts); o cliente anon (lib/supabase/server.ts,
-- middleware.ts) faz apenas auth. RLS permanece habilitado sem policy =
-- acesso exclusivo do service role (que ignora RLS).

do $$
declare t text;
begin
  foreach t in array array[
    'vm_sessions','vm_attachments','vm_modelagem_analyses','vm_generated_scripts',
    'vm_script_feedback','vm_playbooks','vm_banned_phrases','vm_client_preferences',
    'vm_viral_insights','vm_script_performance','vm_lessons','vm_lesson_learnings'
  ]
  loop
    execute format('drop policy if exists "authenticated full access" on %I', t);
  end loop;
end $$;
