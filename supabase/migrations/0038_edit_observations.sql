-- supabase/migrations/0038_edit_observations.sql
-- Plano 019, Fase 1. A edição livre vira observação estruturada.
--
-- Nada aqui é lido por prompt nenhum. É registro determinístico (lib/edit-diff.ts, sem LLM)
-- do que a edição fez com cada parágrafo. O que separa "isto é uma regra" de "isto era
-- daquele vídeo" é CONTAGEM, e até esta tabela existir não havia nada no schema que
-- registrasse uma edição individual: uma edição é anedota, a mesma edição três vezes é regra.
--
-- `tipo` NÃO tem 'factual': correção de dado é descartada na fronteira, em
-- `observacoesDaEdicao`. O check é a segunda tranca — o valor de nunca gravar é que nenhum
-- consumidor futuro pode esquecer de filtrar (é a lição envenenada do 015 §7.2).
create table if not exists vm_edit_observations (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null references vm_generated_scripts(id) on delete cascade,
  client_id uuid references clientes(id),
  tipo text not null check (tipo in ('vocabulario','corte','insercao','ritmo','reescrita')),
  antes text not null,
  depois text not null,
  -- só em tipo='vocabulario': o par que o cluster conta
  termo_de text,
  termo_para text,
  created_at timestamptz not null default now()
);

-- A query do cluster é sempre (cliente, tipo, par de→para).
create index if not exists vm_edit_observations_cluster_idx
  on vm_edit_observations (client_id, tipo, termo_de, termo_para);

-- A varredura do ETL precisa saber o que já processou sem varrer a tabela toda.
create index if not exists vm_edit_observations_script_idx
  on vm_edit_observations (script_id);

alter table vm_edit_observations enable row level security;
create policy "authenticated full access" on vm_edit_observations
  for all to authenticated using (true) with check (true);

-- Fase 5: quando uma lição foi ativada, para medir se a recorrência do cluster caiu depois.
-- Sem isto a única retroalimentação possível seria por performance publicada, e
-- vm_script_performance está com 0 linhas.
alter table vm_lesson_learnings add column if not exists ativada_em timestamptz;

comment on column vm_lesson_learnings.ativada_em is
  'Quando a lição passou a valer. O ETL conta observações do MESMO cluster depois desta data: recorrência que não cai = lição que não funciona (plano 019, Fase 5).';

-- De qual cluster a lição saiu. Sem isto a medição de recorrência não teria como distinguir
-- "continuaram fazendo ESTA edição" de "houve edição no sistema", e marcaria toda lição ativa
-- como suspeita na primeira semana. Formato: chaveDoCluster() em lib/edit-diff.ts.
alter table vm_lesson_learnings add column if not exists cluster_chave text;

create index if not exists vm_lesson_learnings_cluster_idx
  on vm_lesson_learnings (cluster_chave) where cluster_chave is not null;
