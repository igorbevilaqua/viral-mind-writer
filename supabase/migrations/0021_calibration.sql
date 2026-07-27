-- 0021: calibração de preferências (RLHF-lite par-a-par). Genérico por `dimension`
-- (hook agora; storytelling/comando depois). Pares vêm de graça da geração (candidatos
-- rotulados do designHook), do corpus (cold-start) ou de probes adaptativos (Fase 2).
create table if not exists vm_calibration_pairs (
  id uuid primary key default gen_random_uuid(),
  dimension text not null default 'hook',
  client_id uuid,                    -- corpus/geração de um cliente; null = global
  axis text not null,                -- o que varia entre A e B: mecanismo|comprimento|personagem|...
  option_a jsonb not null,           -- { texto, mecanismo?, atributos? }
  option_b jsonb not null,
  source text not null,              -- generation | corpus | probe
  status text not null default 'pending',  -- pending | answered
  created_at timestamptz not null default now()
);
create index if not exists vm_calibration_pairs_fila
  on vm_calibration_pairs (dimension, status, created_at desc);

create table if not exists vm_calibration_votes (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references vm_calibration_pairs(id) on delete cascade,
  user_id uuid,
  winner text not null,              -- a | b | skip
  created_at timestamptz not null default now(),
  unique (pair_id, user_id)          -- 1 voto por usuário por par
);
