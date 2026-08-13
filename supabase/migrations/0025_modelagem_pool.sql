-- 0025: pool global de vídeos externos candidatos a modelagem (plano 014, WP-4).
--
-- Pool GLOBAL, compartilhado entre clientes — a personalização acontece na CONSULTA,
-- não na coleta. Um vídeo descoberto para o cliente A serve ao cliente B sem custar
-- crédito de novo. É a decisão que torna o custo de busca desprezível.
--
-- Reaproveitamento agressivo: vídeo já descoberto nunca é re-analisado. Os campos
-- marcados (lazy) só são preenchidos para quem passou o filtro de ranking — não se
-- embeda 600 vídeos para mostrar 15 — e uma vez preenchidos valem para sempre: nem a
-- classe temporal nem a aplicabilidade de um vídeo mudam com o tempo.

create table if not exists vm_modelagem_pool (
  id uuid primary key default gen_random_uuid(),

  plataforma text not null,        -- tiktok|instagram
  plataform_id text not null,      -- mesmo nome (e mesmo typo) da coluna do corpus: videos.plataform_id
  url text not null,

  autor_handle text,
  autor_seguidores int,
  caption text,
  duracao_seg int,
  data_publicacao timestamptz,

  views bigint,
  likes bigint,
  shares bigint,
  comments bigint,
  som_id text,                     -- id do áudio; sinal de trend (só TikTok)

  timing_classe text,              -- (lazy) breaking|trending|ciclico|perene
  janela_sazonal text,             -- (lazy) ex.: 'dezembro'
  idioma text,                     -- (lazy) informativo, NÃO é filtro
  aplicabilidade_br text,          -- (lazy) universal|adaptavel|local_estrangeiro
  embedding vector(1536),          -- (lazy) OpenAI text-embedding-3-small sobre a caption

  descoberto_por text[] not null default '{}',  -- queries que trouxeram este vídeo
  usado_em uuid[] not null default '{}',        -- clientes que já o usaram como modelagem
  removido_em timestamptz,                      -- vídeo apagado na origem (marcado na recoleta)

  primeira_coleta timestamptz not null default now(),
  ultima_coleta timestamptz not null default now(),

  unique (plataforma, plataform_id)             -- chave de dedup e alvo do upsert
);

-- YouTube fica fora do v1 de propósito: o endpoint de busca devolve só
-- id/url/title/viewCount em shorts[] — sem canal, data, duração ou inscritos, ou seja,
-- sem o que calcular ratio, decay ou cap por autor. Por isso a coluna é text livre, sem
-- check: quando o YouTube voltar (enriquecimento pago ou YouTube Data API), não há DDL.
comment on column vm_modelagem_pool.plataforma is 'tiktok|instagram — YouTube fora do v1 (metadado insuficiente na busca)';

-- Views não são a mesma moeda entre plataformas (TikTok conta quase no scroll). Aqui a
-- coluna guarda o valor cru; a comparação justa é por percentil DENTRO da plataforma,
-- feita em lib/modelagens/rank.ts. No Instagram é video_play_count — nunca
-- video_view_count: os dois divergiram 2,2x no mesmo reel, e misturar as duas semânticas
-- torna o ratio incomparável.
comment on column vm_modelagem_pool.views is 'TikTok: statistics.play_count | Instagram: video_play_count (NUNCA video_view_count)';

comment on column vm_modelagem_pool.aplicabilidade_br is
  'universal|adaptavel|local_estrangeiro — responde "um brasileiro modelaria isso?", NÃO "está em português?". Idioma não é filtro: uma boa ideia em espanhol se traduz; contexto local estrangeiro não.';

comment on column vm_modelagem_pool.removido_em is
  'Vídeo apagado na origem. Preenchido na recoleta (mesmo padrão de videos.removido_em) — link morto sai da sugestão sem sair do histórico.';

create index if not exists vm_modelagem_pool_timing_views_idx
  on vm_modelagem_pool (timing_classe, views desc);

-- Extensão vector já instalada no projeto (usada pela tabela documents do corpus).
-- ATENÇÃO: documents usa gemini-embedding-001 e este pool usa text-embedding-3-small.
-- Ambos têm 1536 dims, então o Postgres aceita o join entre os dois e devolve lixo
-- silenciosamente. Nunca cruzar os dois espaços.
create index if not exists vm_modelagem_pool_embedding_idx
  on vm_modelagem_pool using hnsw (embedding vector_cosine_ops);

-- ─────────────────────────────────────────────────────────────────────────────
-- Queries de busca por cliente (WP-2). Ficam aqui, e não numa migration própria,
-- porque sem elas a tabela acima não tem como ser alimentada — é o mesmo passo.
--
-- Gerar query a cada busca é desperdício: o nicho de um cliente muda em meses, não em
-- minutos. Regenera quando `search_queries_em` passa de 7 dias ou quando `updated_at`
-- das preferências é mais recente.
alter table vm_client_preferences
  add column if not exists search_queries text[] not null default '{}',
  add column if not exists search_queries_em timestamptz;

-- A semente dessas queries tem DUAS camadas, e a segunda não é opcional: preferência
-- declarada não basta. `temas_preferidos` está nulo na maior parte da base (Pedro Elero
-- e Ricardo Schumacher não têm sequer linha nesta tabela), então derivar query só de
-- preferência entrega query vazia justamente para quem mais precisa. O corpus do próprio
-- cliente é fonte de primeira classe, com peso maior no que performou acima da média
-- DELE — performance_ratio (lib/etl.ts:53-55), baseline por cliente e não global.
comment on column vm_client_preferences.search_queries is
  'Buscas em linguagem natural (8-10), derivadas de corpus do cliente + temas_preferidos. Cache; ver plano 014 §WP-2.';

-- RLS habilitada e SEM policy = acesso exclusivo do service role (que ignora RLS),
-- mesmo padrão da 0011. Não é formalidade: o Radar Viral lê este mesmo banco físico com
-- a anon key, e uma tabela nova sem RLS ficaria legível por qualquer authenticated via
-- PostgREST.
alter table vm_modelagem_pool enable row level security;
