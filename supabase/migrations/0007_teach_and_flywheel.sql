-- Máquina de aprendizado de acertos: menu Ensinar (lições + aprendizados curados)
-- e fechamento do flywheel de performance (publicação declarada no app).

-- Frente A: publicação declarada no app
alter table vm_generated_scripts
  add column published_url text,
  add column published_at timestamptz;
-- status já aceita 'published' (0001: generated|approved|published)

-- vm_published_scripts passa a devolver seguidores ganhos (eixo de conversão do Comando)
drop function if exists vm_published_scripts();
create or replace function vm_published_scripts()
returns table(crm_script_id uuid, video_id uuid, views bigint,
              retencao_hook numeric, retencao_final numeric,
              compartilhamentos bigint, seguidores_ganhos bigint)
language sql stable as $$
  select v.crm_script_id, v.id,
    -- métricas *_no_dia são snapshot acumulado (total até o dia) → total do vídeo = pico (max), não soma
    coalesce(max(m.views_no_dia),0)::bigint,
    (select r.retencao_hook from metricas_retencao r where r.video_id = v.id order by r.data desc limit 1)::numeric,
    (select r.retencao_final from metricas_retencao r where r.video_id = v.id order by r.data desc limit 1)::numeric,
    coalesce(max(m.compartilhamentos_no_dia),0)::bigint,
    (select nullif(regexp_replace(r.seguidores_ganhos::text, '[^0-9-]', '', 'g'), '')::bigint
       from metricas_retencao r where r.video_id = v.id order by r.data desc limit 1)
  from videos v
  left join metricas_diarias m on m.video_id = v.id
  where v.crm_script_id is not null
  group by v.id;
$$;

-- Frente B: lições (sessões de ensino, trilha de auditoria) + aprendizados destilados
create table vm_lessons (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clientes(id),        -- null = aprendizado global
  source_kind text not null check (source_kind in ('video_link','texto')),
  source_url text,
  source_title text,
  transcript text not null,                      -- transcrição obtida ou roteiro colado
  context_note text,                             -- nota do usuário: por que este vídeo importa
  created_at timestamptz not null default now()
);

create table vm_lesson_learnings (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references vm_lessons(id) on delete cascade,
  dimensao text not null check (dimensao in ('hook','storytelling','tema','ritmo','comando','geral')),
  titulo text not null,
  descricao text not null,
  evidencia text,                                -- trecho da transcrição que sustenta
  origem text not null default 'extraido' check (origem in ('extraido','manual')),
  active boolean not null default true,          -- desmarcado na revisão ou desativado depois = false
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on vm_lesson_learnings (active, dimensao);

alter table vm_lessons enable row level security;
alter table vm_lesson_learnings enable row level security;
create policy "authenticated full access" on vm_lessons for all to authenticated using (true) with check (true);
create policy "authenticated full access" on vm_lesson_learnings for all to authenticated using (true) with check (true);
