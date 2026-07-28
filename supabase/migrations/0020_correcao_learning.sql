-- 0020: correção na sala vira aprendizado
-- A caixa "AJUSTAR O ROTEIRO" (pedido do usuário) passa a gerar lições active:false,
-- curadas no /ensinar como qualquer outra. Libera o valor 'correcao' nos dois checks.
alter table vm_lesson_learnings drop constraint if exists vm_lesson_learnings_origem_check;
alter table vm_lesson_learnings add constraint vm_lesson_learnings_origem_check
  check (origem in ('extraido','manual','edicao','curador','correcao'));

alter table vm_lessons drop constraint if exists vm_lessons_source_kind_check;
alter table vm_lessons add constraint vm_lessons_source_kind_check
  check (source_kind in ('video_link','texto','edicao','curador','correcao'));
