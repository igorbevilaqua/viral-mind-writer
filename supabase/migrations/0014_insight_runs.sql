-- 0014 (plano 012, WP-C.6): histórico dos runs do ETL — 1 linha por run com o
-- array completo de insights ANTES do replace atômico. Dá tendência/rollback ao
-- conhecimento. Retenção de 12 runs feita pelo próprio ETL (lib/etl.ts).
create table if not exists vm_insight_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  rows jsonb not null
);

-- padrão 0011: RLS habilitado sem policy = acesso exclusivo do service role
alter table vm_insight_runs enable row level security;
