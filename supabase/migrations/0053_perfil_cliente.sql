-- Plano 025: o perfil do cliente, um texto que o time lê e edita. Gerado por scripts/gerar-perfis.ts
-- a partir do estudo de modos, do estudo de outubro e das correções do time; entra em todo agente
-- que já recebe as preferências do cliente.
alter table public.vm_client_preferences add column if not exists perfil text;
