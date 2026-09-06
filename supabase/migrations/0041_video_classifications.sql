-- supabase/migrations/0041_video_classifications.sql
-- Plano 020, WP-C. Uma taxonomia canônica por vídeo, nas três dimensões que a sala usa
-- (mecanismo de hook, estrutura narrativa, gatilho do comando) + tema.
--
-- Por quê: hoje cada dimensão vive num vocabulário diferente e parcial. `videos.analise`
-- (legado, 22% de cobertura, slugs inconsistentes) alimenta o insight por cliente;
-- `vm_hook_classifications` (0020) só tem os 800 hooks VENCEDORES do corpus, então qualquer
-- ranking tirado dela mede prevalência entre quem já venceu, não eficácia. O schema `oraculo`
-- (repo irmão, mesmo Supabase, read-only para nós) já pagou rótulos neutros para ~9,7k itens;
-- esta tabela é onde eles chegam, traduzidos para os nomes do Codex (lib/pipeline/taxonomia.ts),
-- e onde a lacuna é preenchida por LLM com definições neutras (scripts/classify-corpus.ts).
--
-- Uma linha por vídeo, decisão do plano. Como as três dimensões podem vir de fontes
-- diferentes (hook do Oráculo, estrutura do LLM do Codex), `fonte`/`modelo` registram a
-- ÚLTIMA escrita da linha e `fonte_hook/fonte_estruturas/fonte_comandos` dizem quem rotulou
-- cada dimensão. "Dimensão rotulada" = `fonte_<dim> is not null` (array vazio com fonte =
-- "avaliado, sem padrão"; é o que impede o classificador de pagar duas vezes pelo mesmo texto).
--
-- `vm_hook_classifications` é copiada para cá pelo seed (fonte 'codex-2026-07') e dropada
-- na 0042 -- aqui nada é dropado. video_id referencia o corpus sem FK, como as vizinhas vm_*.
create table if not exists vm_video_classifications (
  video_id uuid primary key,
  hook_mecanismos text[] not null default '{}',   -- nomes de HOOK_MECHANISMS
  hook_formato text,                               -- HOOK_FORMATS; null = não avaliado
  estruturas text[] not null default '{}',         -- códigos 'A1'..'F4' de playbooks/storytelling.md
  comandos text[] not null default '{}',           -- nomes dos gatilhos de playbooks/comando.md
  tema text,                                       -- oraculo.fato_video.categorias[1]
  fonte text not null,                             -- 'oraculo' | 'codex-2026-07' | 'codex-llm' (última escrita)
  modelo text,
  fonte_hook text,
  fonte_estruturas text,
  fonte_comandos text,
  updated_at timestamptz not null default now()
);

-- O estudo pergunta "quais vídeos têm a estrutura X / o mecanismo Y" — GIN é o índice de array.
create index if not exists vm_video_classifications_estruturas_idx
  on vm_video_classifications using gin (estruturas);
create index if not exists vm_video_classifications_hook_idx
  on vm_video_classifications using gin (hook_mecanismos);

-- RLS sem policy = só service role (padrão 0011; o projeto é compartilhado com outro app).
alter table vm_video_classifications enable row level security;
