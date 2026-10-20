-- Plano 025: a skill de modo da sessão. NULL é resposta, não buraco: sessão anterior ao 025, ou
-- escolha automática que falhou. Nos dois casos o pipeline segue o caminho único.
alter table public.vm_sessions add column if not exists skill text
  check (skill in ('historia','mecanismo','demonstracao','panorama'));
alter table public.vm_sessions add column if not exists skill_origem text
  check (skill_origem in ('escolhida','sugerida'));
