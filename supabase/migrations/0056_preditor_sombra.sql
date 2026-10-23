-- Plano 026, Task B: o preditor v0 (docs/preditor-2026-10, modelo OpenAI) em modo sombra.
-- Ele pontua os hooks e as narrativas candidatas de cada geração e só REGISTRA: a escolha da
-- sala não muda. Com o resultado publicado depois, dá para medir se a nota ordenaria melhor.
-- RLS sem policy, como a 0035: só o service role (appDb) lê e escreve.

-- Rótulo de cada vídeo VM da casa, recalculado inteiro pelo ETL semanal (lib/preditor).
-- pq = percentil do coeficiente viral no estrato cliente x rede x trimestre, a régua de
-- docs/estudo-2026-10/src/lib.mjs (topo = pq >= 0,75). null = vídeo que não mede (maturando,
-- sem views, repost) e que só serve para ligar o documento do corpus ao roteiro dele.
create table if not exists public.vm_preditor_rotulos (
  video_id uuid primary key,          -- videos.id do viral data (o mesmo de documents.video_id)
  script_id uuid not null,            -- videos.crm_script_id: o roteiro do CRM
  cliente_id uuid,
  plataforma text,
  data date,                          -- data de publicação
  pq real,
  atualizado_em timestamptz not null default now()
);
create index if not exists vm_preditor_rotulos_script on public.vm_preditor_rotulos (script_id);
create index if not exists vm_preditor_rotulos_cliente on public.vm_preditor_rotulos (cliente_id, data);
alter table public.vm_preditor_rotulos enable row level security;

-- Uma linha por candidata pontuada. fase hook = os 5 a 6 do agente de hook (descartados
-- incluídos), fase narrativa = as 2 a 3 do storytelling. escolhida = a que a sala escolheu.
create table if not exists public.vm_preditor_sombra (
  id bigint generated always as identity primary key,
  session_id uuid not null references vm_sessions(id) on delete cascade,
  script_id uuid,                     -- vm_generated_scripts.id da geração
  client_id uuid,
  fase text not null check (fase in ('hook','narrativa')),
  indice int not null,
  texto text not null,
  nota real,                          -- probabilidade de topo do cliente (v0, só para ordenar)
  escolhida boolean not null,
  features jsonb,
  versao text not null,
  created_at timestamptz not null default now()
);
create index if not exists vm_preditor_sombra_sessao on public.vm_preditor_sombra (session_id);
create index if not exists vm_preditor_sombra_script on public.vm_preditor_sombra (script_id);
alter table public.vm_preditor_sombra enable row level security;
