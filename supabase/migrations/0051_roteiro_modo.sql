-- Plano 025: o modo de cada roteiro escrito pela casa. Carga inicial = estudo de modos de out/2026
-- (2.832 roteiros, kappa 0,91 entre rotuladores); daqui pra frente o ETL classifica os novos.
-- Alimenta os exemplos de voz de cada skill e o mix de modos do cliente.
create table if not exists public.vm_roteiro_modo (
  crm_script_id uuid primary key,
  cliente_id uuid,
  modo text not null check (modo in ('historia','mecanismo','demonstracao','panorama','conselho','publi','misto')),
  ancora text check (ancora in ('noticia','passado','atemporal')),
  registro text check (registro in ('analitico','emotivo')),
  confianca text check (confianca in ('alta','media','baixa')),
  origem text not null default 'estudo-2026-10',
  created_at timestamptz not null default now()
);
create index if not exists vm_roteiro_modo_cliente on public.vm_roteiro_modo (cliente_id, modo);
create index if not exists vm_roteiro_modo_modo on public.vm_roteiro_modo (modo);
comment on table public.vm_roteiro_modo is
  'Modo de cada roteiro VM (crm.scripts.id). Livro de códigos: docs/estudo-modos-2026-10/codebook.md.';
