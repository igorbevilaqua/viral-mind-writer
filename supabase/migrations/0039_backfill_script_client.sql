-- supabase/migrations/0039_backfill_script_client.sql
-- Realinha vm_generated_scripts.client_id com a sessão dona.
--
-- O campo é uma CÓPIA de vm_sessions.client_id, gravada uma vez no insert da geração
-- (lib/pipeline/index.ts). `updateSessionClient` só mexia na sessão, então todo roteiro cujo
-- cliente foi atribuído DEPOIS da geração ficou com o valor velho (em geral null).
--
-- O sintoma visível era o título da página pública sair sem o nome do cliente. Os outros
-- quatro leitores falham calados, e são piores:
--   · vm_lessons no encerramento grava lição do cliente como GLOBAL (contamina todo mundo)
--   · o flywheel do ETL não acha a média do cliente, o outcome nunca amadurece
--   · vm_edit_observations perde o escopo do cluster (plano 019)
--   · o insight client_feedback descarta a avaliação humana daquele roteiro
--
-- O código já não viola mais o invariante (lib/actions.ts, updateSessionClient propaga).
-- Isto recupera o que ficou para trás.
update vm_generated_scripts g
   set client_id = s.client_id
  from vm_sessions s
 where s.id = g.session_id
   and g.client_id is distinct from s.client_id;
