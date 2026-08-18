-- 0035: RLS nas tabelas que ficaram de fora da 0011.
-- Mesmo padrão da 0011 (e da 0015): RLS habilitado SEM policy = acesso exclusivo do
-- service role (que ignora RLS). Este projeto Supabase é compartilhado com outro app;
-- sem RLS, qualquer portador da chave anon lia e escrevia nestas cinco tabelas via
-- PostgREST. Verificado antes de aplicar: todo acesso do app a elas é via `appDb`
-- (service role, lib/db.ts) — o cliente anon (lib/supabase/server.ts) só faz auth.
-- Nenhuma policy é criada de propósito.

alter table vm_hook_classifications enable row level security;
alter table vm_calibration_pairs enable row level security;
alter table vm_calibration_votes enable row level security;
alter table vm_kasparov_threads enable row level security;
alter table vm_kasparov_messages enable row level security;
