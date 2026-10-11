-- Plano 024: ativa os playbooks de outubro (corrigidos) junto do deploy do escrita-dev.
-- Pré-requisito: scripts/playbooks-024.ts --aplicar (grava style_guide v6, storytelling v4,
-- conclusao v2, checklist v5). Reverter: o mesmo bloco com as versões anteriores
-- (hook 3, comando 2, checklist 3, style_guide 4, storytelling 1; subhook, conclusao, payoff e
-- pauta sem versão ativa).
begin;
update vm_playbooks set active = false
 where slug in ('hook','subhook','conclusao','payoff','pauta','comando','storytelling','checklist','style_guide');
update vm_playbooks set active = true
 where (slug, version) in (('hook',4),('subhook',1),('conclusao',2),('payoff',1),('pauta',1),
                           ('comando',3),('storytelling',4),('checklist',5),('style_guide',6));
-- 9 linhas ativas, uma por slug; menos que isso = alguma versão não foi gravada
select slug, version from vm_playbooks
 where active and slug in ('hook','subhook','conclusao','payoff','pauta','comando','storytelling','checklist','style_guide');
commit;
