-- Viral Mind v2 — schema do app (convive com as tabelas da v1 no mesmo projeto)

create table vm_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  client_id uuid references clients(id),
  prompt text not null,
  status text not null default 'draft', -- draft|generating|done|error
  error_message text,
  created_at timestamptz not null default now()
);

create table vm_attachments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references vm_sessions(id) on delete cascade,
  kind text not null check (kind in ('reference_script','news_link','document','video_link')),
  is_modelagem boolean not null default false,
  url text,
  raw_content text,
  created_at timestamptz not null default now()
);

create table vm_modelagem_analyses (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid not null references vm_attachments(id) on delete cascade,
  analysis jsonb not null,
  replication_brief text not null,
  created_at timestamptz not null default now()
);

create table vm_generated_scripts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references vm_sessions(id) on delete cascade,
  client_id uuid references clients(id),
  version int not null default 1,
  hook text,
  hook_variants jsonb,
  roteiro text not null,
  comando text,
  pipeline_trace jsonb,
  slop_lint_violations int not null default 0,
  status text not null default 'generated', -- generated|approved|published
  created_at timestamptz not null default now()
);

create table vm_script_feedback (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null references vm_generated_scripts(id) on delete cascade,
  user_id uuid references auth.users(id),
  rating smallint check (rating between 1 and 5),
  notes text,
  edited_version text,
  created_at timestamptz not null default now()
);

create table vm_playbooks (
  id uuid primary key default gen_random_uuid(),
  slug text not null, -- hook|storytelling|comando|style_guide
  version int not null default 1,
  content text not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (slug, version)
);

create table vm_banned_phrases (
  id uuid primary key default gen_random_uuid(),
  pattern text not null, -- regex case-insensitive
  label text,
  severity text not null default 'block' check (severity in ('block','warn')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table vm_client_preferences (
  client_id uuid primary key references clients(id) on delete cascade,
  proibicoes text[] not null default '{}',
  tom_de_voz text,
  temas_preferidos text[] not null default '{}',
  vocabulario_evitar text[] not null default '{}',
  vocabulario_usar text[] not null default '{}',
  notas_entrevista text,
  viral_data_cliente_id uuid, -- FK lógica p/ clientes.id no projeto Viral Data
  updated_at timestamptz not null default now()
);

create table vm_viral_insights (
  id uuid primary key default gen_random_uuid(),
  scope text not null, -- 'global' | 'client:<viral_data_cliente_id>' | 'categoria:<x>'
  insight_type text not null, -- top_hooks|top_retention|winning_elements|pacing_stats|retention_rules
  payload jsonb not null,
  computed_at timestamptz not null default now()
);
create index on vm_viral_insights (scope, insight_type);

create table vm_script_performance (
  script_id uuid not null references vm_generated_scripts(id) on delete cascade,
  viral_data_video_id uuid not null,
  views bigint,
  retencao_hook numeric,
  retencao_final numeric,
  compartilhamentos bigint,
  seguidores_ganhos bigint,
  synced_at timestamptz not null default now(),
  primary key (script_id, viral_data_video_id)
);

-- RLS: equipe interna, todos autenticados veem tudo
alter table vm_sessions enable row level security;
alter table vm_attachments enable row level security;
alter table vm_modelagem_analyses enable row level security;
alter table vm_generated_scripts enable row level security;
alter table vm_script_feedback enable row level security;
alter table vm_playbooks enable row level security;
alter table vm_banned_phrases enable row level security;
alter table vm_client_preferences enable row level security;
alter table vm_viral_insights enable row level security;
alter table vm_script_performance enable row level security;

do $$
declare t text;
begin
  foreach t in array array['vm_sessions','vm_attachments','vm_modelagem_analyses','vm_generated_scripts','vm_script_feedback','vm_playbooks','vm_banned_phrases','vm_client_preferences','vm_viral_insights','vm_script_performance']
  loop
    execute format('create policy "authenticated full access" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
