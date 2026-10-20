-- Plano 025: a triagem das lições. alcance diz se a regra vale em qualquer roteiro, num modo, num
-- cliente, numa pauta ou num caso só; skills diz em que modos ela vale quando é de modo;
-- absorvida_em diz onde o texto da regra já mora (camada comum, skill, perfil), para o /ensinar
-- não pedir para ativar o que já está no prompt.
alter table public.vm_lesson_learnings add column if not exists alcance text
  check (alcance in ('universal','modo','cliente','pauta','caso'));
alter table public.vm_lesson_learnings add column if not exists skills text[];
alter table public.vm_lesson_learnings add column if not exists absorvida_em text;
