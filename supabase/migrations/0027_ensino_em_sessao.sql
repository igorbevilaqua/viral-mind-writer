-- supabase/migrations/0027_ensino_em_sessao.sql
-- Peça 1 da 2.0. Roteamento de lições por destinatário + ensino declarativo em sessão.
-- O backfill replica DIMENSAO_DESTINATARIOS de lib/pipeline/destinatarios.ts.

alter table vm_lesson_learnings add column destinatarios text[] not null default '{}';

update vm_lesson_learnings set destinatarios = case dimensao
  when 'hook'         then '{hook,dados}'
  when 'storytelling' then '{storytelling,modelagem,dados}'
  when 'tema'         then '{storytelling,modelagem,premissa,dados}'
  when 'ritmo'        then '{roteirista,dados}'
  when 'comando'      then '{comando,dados}'
  when 'geral'        then '{roteirista,premissa,dados}'
end;

create index vm_lesson_learnings_destinatarios_idx
  on vm_lesson_learnings using gin (destinatarios);

-- origem ganha 'ensino'
alter table vm_lesson_learnings drop constraint if exists vm_lesson_learnings_origem_check;
alter table vm_lesson_learnings add constraint vm_lesson_learnings_origem_check
  check (origem in ('extraido','manual','edicao','curador','correcao','ensino'));

-- vm_lessons: source_kind ganha 'sessao'; transcript vira nullable (ensino declarativo não tem)
alter table vm_lessons drop constraint if exists vm_lessons_source_kind_check;
alter table vm_lessons add constraint vm_lessons_source_kind_check
  check (source_kind in ('video_link','texto','edicao','curador','correcao','sessao'));
alter table vm_lessons alter column transcript drop not null;
