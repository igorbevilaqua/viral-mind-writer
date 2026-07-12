-- PostgREST 13.0.5 rejeita filtros or= em PATCH (42703 "column vm_sessions.status
-- does not exist") — o lock otimista de geração vira função SQL: mesmo predicado
-- da migration 0010, atômico, imune ao bug de query-building do PostgREST.
create or replace function vm_acquire_generation_lock(p_session_id uuid, p_stale_before timestamptz)
returns boolean
language sql
volatile
set search_path = public
as $$
  update vm_sessions
     set status = 'generating',
         generation_started_at = now()
   where id = p_session_id
     and (status <> 'generating'
          or generation_started_at is null
          or generation_started_at < p_stale_before)
  returning true;
$$;
