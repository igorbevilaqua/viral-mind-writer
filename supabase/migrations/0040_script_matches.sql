-- supabase/migrations/0040_script_matches.sql
-- Plano 020, WP-A. Casamento Codex → vídeo publicado, por texto.
--
-- O flywheel inteiro (vm_script_performance → vm_outcomes → calibração/lições) depende de
-- alguém colar `published_url` no roteiro — e ninguém cola: 2 de 157. Mas o roteiro publicado
-- ESTÁ no corpus, com hook e transcrição, e o mesmo cliente. `ts_rank` do hook do Codex contra
-- hook‖roteiro do vídeo, na janela −3/+60 dias da geração, separa limpo: ≥0,98 é o mesmo
-- roteiro com edição leve (12/12 conferidos a olho, 05/09/2026).
--
-- `confirmado` em três estados: true (casou sozinho ou o humano disse "é este"), false (humano
-- disse "não é"), null (zona cinza — vira pendência no Kasparov). Sem FK para videos: o corpus
-- é domínio do outro app que divide este Supabase (padrão 0020).
create table if not exists vm_script_matches (
  script_id uuid not null references vm_generated_scripts(id) on delete cascade,
  video_id uuid not null,
  plataforma text,
  score real not null,
  metodo text not null default 'tsrank_hook', -- tsrank_hook (pendente) | tsrank_auto | kasparov
  confirmado boolean,                         -- null = pendente
  decidido_em timestamptz,
  created_at timestamptz not null default now(),
  primary key (script_id, video_id)
);

-- A fila do Kasparov só lê o que está pendente.
create index if not exists vm_script_matches_pendentes_idx
  on vm_script_matches (script_id) where confirmado is null;

-- RLS sem policy = só service role (padrão 0011).
alter table vm_script_matches enable row level security;

-- A query validada em produção. Um candidato por (roteiro, plataforma) — o mesmo roteiro sai
-- em IG/TT/YT e cada um é um vídeo diferente. Roteiro já decidido (qualquer linha com
-- confirmado not null) sai da busca; vídeo já confirmado para um roteiro também sai, senão a
-- versão 2 do mesmo roteiro casaria com o mesmo vídeo na semana seguinte.
create or replace function vm_match_scripts(p_min real default 0.4)
returns table(
  script_id uuid, video_id uuid, plataforma text, score real,
  link_video text, data_publicacao date, hook_codex text, hook_video text
)
language sql stable
set search_path = public
as $$
with s as (
  select g.id, g.client_id, g.hook, g.created_at::date as dia,
         plainto_tsquery('portuguese', coalesce(nullif(g.hook, ''), left(g.roteiro, 400))) as q
  from vm_generated_scripts g
  where not exists (select 1 from vm_script_matches m where m.script_id = g.id and m.confirmado is not null)
),
cand as (
  select s.id as script_id, v.id as video_id, ca.plataforma::text as plataforma,
         ts_rank(to_tsvector('portuguese', coalesce(v.hook, '') || ' ' || left(coalesce(v.roteiro, ''), 1500)), s.q) as score,
         v.link_video, v.data_publicacao, s.hook as hook_codex, v.hook as hook_video
  from s
  join canais ca on ca.cliente_id = s.client_id
  join videos v on v.canal_id = ca.id
  where not coalesce(v.removido, false)
    and v.data_publicacao between s.dia - 3 and s.dia + 60
    and not exists (select 1 from vm_script_matches m where m.video_id = v.id and m.confirmado = true)
)
select distinct on (c.script_id, c.plataforma)
       c.script_id, c.video_id, c.plataforma, c.score, c.link_video, c.data_publicacao, c.hook_codex, c.hook_video
from cand c
where c.score >= p_min
order by c.script_id, c.plataforma, c.score desc;
$$;
