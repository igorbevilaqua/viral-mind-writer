-- Artefatos da sala de agentes (dossiê, narrativas candidatas, ranking, escolha)
-- cacheados por sessão: regenerar/trocar narrativa não re-paga pesquisa + storytelling.
alter table vm_sessions add column if not exists artifacts jsonb;
