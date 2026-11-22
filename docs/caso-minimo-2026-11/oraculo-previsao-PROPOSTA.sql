-- PROPOSTA, NÃO APLICADA. Plano 028, etapas 3 e 4: previsão congelada e conferência semanal.
-- Destino: repo do Oráculo (supabase/migrations), que é o dono do schema oraculo. Só aplicar com
-- o ok do Igor. Está aqui no Codex para revisão junto com o plano.
--
-- Exceção explícita à trava do plano 020 ("o Codex nunca escreve no schema oraculo"), com o menor
-- privilégio possível:
--   * duas tabelas novas, sem grant de escrita para ninguém (nem service_role);
--   * escrita só por duas RPCs SECURITY DEFINER que validam a entrada;
--   * a previsão é só insert: nunca é reescrita nem apagada pela RPC;
--   * anon e authenticated não leem nem executam nada disto.
-- O resto do schema oraculo não muda.

-- 1. Previsão congelada: uma linha por roteiro do CRM e versão do modelo, gravada antes de postar.
create table if not exists oraculo.previsao_roteiro (
  id bigint generated always as identity primary key,
  crm_script_id uuid not null,              -- crm.scripts.id (outro projeto, sem FK)
  cliente_id uuid,                          -- public.clientes.id
  versao_modelo text not null,              -- ex.: preditor-v0-2026-10_openai
  nota real not null check (nota >= 0 and nota <= 1),  -- chance de topo do próprio cliente
  faixa text not null check (faixa in ('0-15','15-22','22-30','30-40','40+')),
  base_cliente_90d real check (base_cliente_90d is null or (base_cliente_90d >= 0 and base_cliente_90d <= 1)),
  base_knn real check (base_knn is null or (base_knn >= 0 and base_knn <= 1)),
  features jsonb not null default '{}'::jsonb,
  hash_texto text not null,                 -- sha256 do texto pontuado, para saber o que foi visto
  ja_postado boolean not null default false,-- pontuado depois de ir ao ar: fica fora da métrica limpa
  origem text not null default 'etl' check (origem in ('etl','codex')),
  pontuado_em timestamptz not null default now(),
  unique (crm_script_id, versao_modelo)
);
create index if not exists previsao_roteiro_cliente_idx on oraculo.previsao_roteiro (cliente_id, pontuado_em);

-- 2. Conferência: uma linha por semana, versão, comparado (o modelo ou um baseline) e alvo.
create table if not exists oraculo.previsao_acuracia (
  id bigint generated always as identity primary key,
  semana date not null,                     -- segunda-feira da semana de publicação
  versao_modelo text not null,
  comparado text not null check (comparado in ('modelo','base_cliente_90d','base_knn')),
  alvo text not null default 'topo' check (alvo in ('topo','seguidores_por_mil')),
  n int not null check (n >= 0),
  grupos int not null check (grupos >= 0),
  pares int not null check (pares >= 0),
  par_a_par real check (par_a_par is null or (par_a_par >= 0 and par_a_par <= 1)),
  ic_baixo real,
  ic_alto real,
  auc real,
  brier real,
  brier_base real,
  calibracao jsonb not null default '[]'::jsonb,
  rotulo_provisorio boolean not null default true, -- o topo é por trimestre; refaz no fecho
  calculado_em timestamptz not null default now(),
  unique (semana, versao_modelo, comparado, alvo)
);

-- 3. Sem acesso direto. O default do schema dá SELECT ao service_role nas tabelas novas: mantido
-- só para leitura (painel do Oráculo e Codex). Nenhum INSERT, UPDATE ou DELETE direto.
alter table oraculo.previsao_roteiro enable row level security;
alter table oraculo.previsao_acuracia enable row level security;
revoke all on oraculo.previsao_roteiro, oraculo.previsao_acuracia from public, anon, authenticated, service_role;
grant select on oraculo.previsao_roteiro, oraculo.previsao_acuracia to service_role;

-- 4. Escrita da previsão: lote em jsonb, só insert, conflito é ignorado (a nota nunca muda).
-- Devolve quantas linhas entraram.
create or replace function oraculo.fn_registrar_previsao(p_linhas jsonb)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n int;
begin
  if jsonb_typeof(p_linhas) is distinct from 'array' then
    raise exception 'p_linhas precisa ser um array';
  end if;
  if jsonb_array_length(p_linhas) > 2000 then
    raise exception 'lote acima de 2000 linhas';
  end if;

  insert into oraculo.previsao_roteiro
    (crm_script_id, cliente_id, versao_modelo, nota, faixa, base_cliente_90d, base_knn,
     features, hash_texto, ja_postado, origem)
  select (l->>'crm_script_id')::uuid,
         nullif(l->>'cliente_id','')::uuid,
         l->>'versao_modelo',
         (l->>'nota')::real,
         l->>'faixa',
         nullif(l->>'base_cliente_90d','')::real,
         nullif(l->>'base_knn','')::real,
         coalesce(l->'features', '{}'::jsonb),
         l->>'hash_texto',
         coalesce((l->>'ja_postado')::boolean, false),
         coalesce(l->>'origem', 'etl')
  from jsonb_array_elements(p_linhas) as l
  on conflict (crm_script_id, versao_modelo) do nothing;

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- 5. Escrita da conferência: upsert, porque a semana é refeita quando o trimestre fecha.
create or replace function oraculo.fn_registrar_acuracia(p_linhas jsonb)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n int;
begin
  if jsonb_typeof(p_linhas) is distinct from 'array' then
    raise exception 'p_linhas precisa ser um array';
  end if;
  if jsonb_array_length(p_linhas) > 500 then
    raise exception 'lote acima de 500 linhas';
  end if;

  insert into oraculo.previsao_acuracia
    (semana, versao_modelo, comparado, alvo, n, grupos, pares, par_a_par, ic_baixo, ic_alto,
     auc, brier, brier_base, calibracao, rotulo_provisorio, calculado_em)
  select (l->>'semana')::date,
         l->>'versao_modelo',
         l->>'comparado',
         coalesce(l->>'alvo', 'topo'),
         (l->>'n')::int,
         (l->>'grupos')::int,
         (l->>'pares')::int,
         nullif(l->>'par_a_par','')::real,
         nullif(l->>'ic_baixo','')::real,
         nullif(l->>'ic_alto','')::real,
         nullif(l->>'auc','')::real,
         nullif(l->>'brier','')::real,
         nullif(l->>'brier_base','')::real,
         coalesce(l->'calibracao', '[]'::jsonb),
         coalesce((l->>'rotulo_provisorio')::boolean, true),
         now()
  from jsonb_array_elements(p_linhas) as l
  on conflict (semana, versao_modelo, comparado, alvo) do update set
    n = excluded.n, grupos = excluded.grupos, pares = excluded.pares,
    par_a_par = excluded.par_a_par, ic_baixo = excluded.ic_baixo, ic_alto = excluded.ic_alto,
    auc = excluded.auc, brier = excluded.brier, brier_base = excluded.brier_base,
    calibracao = excluded.calibracao, rotulo_provisorio = excluded.rotulo_provisorio,
    calculado_em = excluded.calculado_em;

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- 6. Leitura para o painel e para o Codex (security invoker: usa o SELECT do item 3).
create or replace function oraculo.fn_previsao_acuracia(p_inicio date, p_fim date)
returns setof oraculo.previsao_acuracia
language sql
stable
set search_path = ''
as $$
  select * from oraculo.previsao_acuracia
  where semana between p_inicio and p_fim
  order by semana, versao_modelo, comparado, alvo;
$$;

-- 7. Quem executa: só o service_role. Função nova nasce executável por PUBLIC no Postgres,
-- então o revoke é obrigatório.
revoke all on function oraculo.fn_registrar_previsao(jsonb) from public, anon, authenticated;
revoke all on function oraculo.fn_registrar_acuracia(jsonb) from public, anon, authenticated;
revoke all on function oraculo.fn_previsao_acuracia(date, date) from public, anon, authenticated;
grant execute on function oraculo.fn_registrar_previsao(jsonb) to service_role;
grant execute on function oraculo.fn_registrar_acuracia(jsonb) to service_role;
grant execute on function oraculo.fn_previsao_acuracia(date, date) to service_role;

comment on table oraculo.previsao_roteiro is
  'Plano 028: nota do preditor gravada antes de postar, uma por roteiro e versão. Só insert, via oraculo.fn_registrar_previsao.';
comment on table oraculo.previsao_acuracia is
  'Plano 028: acurácia semanal do preditor e dos baselines. Escrita só via oraculo.fn_registrar_acuracia.';
comment on function oraculo.fn_registrar_previsao(jsonb) is
  'Única porta de escrita do Codex em oraculo.previsao_roteiro. Insert-only; conflito é ignorado.';
comment on function oraculo.fn_registrar_acuracia(jsonb) is
  'Única porta de escrita da conferência semanal em oraculo.previsao_acuracia. Upsert por semana, versão, comparado e alvo.';

-- Reverter (se precisar): drop function oraculo.fn_previsao_acuracia(date, date);
-- drop function oraculo.fn_registrar_acuracia(jsonb); drop function oraculo.fn_registrar_previsao(jsonb);
-- drop table oraculo.previsao_acuracia; drop table oraculo.previsao_roteiro;
