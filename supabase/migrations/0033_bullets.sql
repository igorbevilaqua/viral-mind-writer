-- 0033: BULLETS — ranking coletivo de palavras/expressões de alta carga emocional,
-- curado pelo time por votação estilo Reddit. Os termos que passam do corte viram a
-- PALETA EMOCIONAL injetada no roteirista e no hook (lib/pipeline/agents.ts).
--
-- Sem policy nenhuma, como toda tabela vm_* desde a 0011: RLS ligada e zero policies =
-- acesso exclusivo do service role (que ignora RLS). O projeto Supabase é compartilhado.

create table if not exists vm_bullets (
  id uuid primary key default gen_random_uuid(),
  termo text not null,
  termo_norm text not null,
  client_id uuid,
  criado_por uuid,
  created_at timestamptz not null default now()
);

comment on column vm_bullets.termo is
  'O termo como o time escreveu (caixa preservada) — é esta forma que vai ao prompt.';
comment on column vm_bullets.termo_norm is
  'lowercase + trim + espaços colapsados. Só existe para dedupe: "Perturbador" e "perturbador " são o mesmo bullet.';
comment on column vm_bullets.client_id is
  'null = paleta global. A coluna já nasce pronta para paleta por cliente; a UI começa só no global.';

-- Um unique (termo_norm, client_id) NÃO resolveria o escopo global: em Postgres NULL nunca
-- colide com NULL, então dois bullets globais com o mesmo termo entrariam os dois e o dedupe
-- do addBullet viraria decoração. Dois índices parciais cobrem os dois escopos sem depender
-- de `nulls not distinct` (PG15+) nem de coalesce com uuid sentinela.
create unique index if not exists vm_bullets_termo_global_idx
  on vm_bullets (termo_norm) where client_id is null;
create unique index if not exists vm_bullets_termo_cliente_idx
  on vm_bullets (termo_norm, client_id) where client_id is not null;

create table if not exists vm_bullet_votes (
  id uuid primary key default gen_random_uuid(),
  bullet_id uuid not null references vm_bullets(id) on delete cascade,
  user_id uuid,
  valor smallint not null check (valor in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (bullet_id, user_id)  -- 1 voto por usuário por bullet (mesmo padrão de vm_calibration_votes, 0021)
);

comment on column vm_bullet_votes.valor is
  '+1 ou -1. Não existe voto 0: votar de novo no mesmo sentido APAGA a linha (toggle do Reddit). Quem cria o bullet recebe um +1 automático — bullet novo nascendo com score 0 seria indistinguível de bullet rejeitado.';

alter table vm_bullets enable row level security;
alter table vm_bullet_votes enable row level security;
