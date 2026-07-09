-- Diagnóstico de bugs: quando a sessão falha, guardamos o contexto (fase, versão do
-- app, git sha, stop_reason do modelo etc.) na própria linha da sessão. Assim, a partir
-- do id que aparece no print (#db47a5), dá pra reconstruir o que aconteceu sem log server.
alter table vm_sessions add column if not exists debug jsonb;
