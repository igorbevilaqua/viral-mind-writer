-- 0036: a decisão humana sobre COMO os 5 exemplos few-shot são escolhidos.
--
-- Hoje o RPC match_documents devolve 20 candidatos por similaridade e o top-5 sai por
-- metadata->>'views'. Esses 5 alimentam DOIS consumidores: o roteirista (lib/pipeline/draft.ts)
-- e a "Referência de voz" do humanizador (lib/pipeline/humanize.ts, os 2 primeiros) — ou seja,
-- a voz do produto é modelada pelos 2 vídeos de mais views do pool.
--
-- Medido no corpus: views × taxa de compartilhamento têm rho 0,34, e num pool de 20 o top-5 de
-- cada critério coincide em 1,17 de 5 (acaso = 1,25). Trocar o critério troca ~4 dos 5 exemplos,
-- e por isso a troca NÃO entra sozinha: só com aprovação humana explícita, na fila do Kasparov.
--
-- Uma linha por decisão, a mais recente vale. Rejeitar grava 'views' (o critério de hoje): é a
-- linha que existe que fecha a pendência, e é ela que impede o sistema de perguntar de novo.
-- NÃO fica em vm_viral_insights de propósito — o ETL apaga e reinsere aquela tabela inteira a
-- cada run semanal (lib/etl.ts), e a decisão evaporaria no domingo seguinte.

create table if not exists vm_fewshot_criterio (
  id uuid primary key default gen_random_uuid(),
  criterio text not null check (criterio in ('views', 'taxa_compartilhamento')),
  decidido_por uuid,
  amostra jsonb,
  created_at timestamptz not null default now()
);

comment on column vm_fewshot_criterio.criterio is
  'Critério que ordena os 20 candidatos do match_documents. ''views'' = comportamento de sempre (metadata->>''views''); ''taxa_compartilhamento'' = compartilhamentos/views vindos de metricas_diarias, com fallback para views em quem não tem o dado (~54% dos candidatos, incluindo TODO o YouTube, que não tem coleta de compartilhamento). Lido por criterioFewShot() em lib/pipeline/context.ts.';

comment on column vm_fewshot_criterio.decidido_por is
  'auth.users.id de quem respondeu a pendência no Kasparov. Sem FK: a decisão sobrevive ao usuário ser removido, e o valor aqui é rastro, não relação.';

comment on column vm_fewshot_criterio.amostra is
  'A comparação que estava NA MESA quando a decisão foi tomada: tema real, os dois conjuntos de 5 (trecho + views + taxa) e quantos mudariam. É o que torna a decisão auditável depois — sem ela, a linha diz o que foi escolhido e nada sobre com base em quê.';

-- Mesmo padrão de 0011/0015/0035: RLS habilitado SEM policy = acesso exclusivo do service role
-- (que ignora RLS). Este projeto Supabase é compartilhado; sem RLS qualquer portador da chave
-- anon escreveria aqui via PostgREST — e escrever aqui é trocar o critério do produto inteiro.
alter table vm_fewshot_criterio enable row level security;
