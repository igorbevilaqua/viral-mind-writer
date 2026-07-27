-- 0020: classificações canônicas de hook (taxonomia de mecanismos do playbook v2).
-- SEPARADA de videos.analise->hook->classificacoes, que usa um vocabulário ad-hoc
-- legado (segredo_oculto, paradoxo_lucrativo...) e alimenta o agrupamento do painel.
-- Esta tabela usa os MGCs do playbook (Contraste Extremo, Revelação Secreta...) +
-- o eixo de formato, e alimenta o insight hook_mechanism_ranking do ETL (Fase 2).
-- Populada por scripts/analyze-hooks.ts --persist; video_id referencia o corpus
-- (sem FK: videos vive no domínio "corpus read-mostly", como as demais tabelas vm_).
create table if not exists vm_hook_classifications (
  video_id uuid primary key,
  mecanismos text[] not null default '{}',
  formato text,
  updated_at timestamptz not null default now()
);
