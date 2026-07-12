-- 0015 (plano 012, WP-E): ciclo de autoaprimoramento.
-- vm_outcomes = 1 linha por roteiro MADURO (≥14d publicado, gate de lib/etl-gate.ts):
-- previsto (score do ranking do Dados) × real (ratio de views) + fingerprint do
-- conhecimento usado na geração. É a tabela-fonte da calibração do Dados (WP-E.3),
-- da atribuição lição×outcome (WP-E.5) e do curador mensal (WP-E.6).

create table if not exists vm_outcomes (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null unique references vm_generated_scripts(id) on delete cascade,
  session_id uuid,
  client_id uuid,
  predicted_score numeric,            -- score 0-100 da narrativa vencedora (null p/ roteiros pré-WP-E)
  ratio numeric,                      -- views / média do cliente na maturação
  verdict text,                       -- repetir | evitar | neutro (lib/etl-gate.ts)
  fingerprint jsonb,                  -- { lesson_ids, playbook_slugs_versions, insight_run_id }
  matured_at timestamptz not null default now()
);
-- padrão 0011: RLS habilitado sem policy = acesso exclusivo do service role
alter table vm_outcomes enable row level security;

-- WP-E.5: lição presente no fingerprint de ≥2 outcomes com ratio mediano <0.8
-- é MARCADA para revisão humana no /ensinar — NUNCA desativada automaticamente.
alter table vm_lesson_learnings add column if not exists needs_review boolean not null default false;

-- Novas origens do ciclo: edição humana (WP-E.4) e curador mensal (WP-E.6)
alter table vm_lesson_learnings drop constraint if exists vm_lesson_learnings_origem_check;
alter table vm_lesson_learnings add constraint vm_lesson_learnings_origem_check
  check (origem in ('extraido','manual','edicao','curador'));
alter table vm_lessons drop constraint if exists vm_lessons_source_kind_check;
alter table vm_lessons add constraint vm_lessons_source_kind_check
  check (source_kind in ('video_link','texto','edicao','curador'));
