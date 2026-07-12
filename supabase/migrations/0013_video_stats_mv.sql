-- 0013 (plano 012, WP-C.1-3/5): materialized view vm_video_stats centraliza a
-- leitura de views/retenção do corpus (antes: subquery correlacionada
-- max(views_no_dia) duplicada em 0005:20/117, 0006:41, 0007:17).
-- Refresh disparado pelo ETL (vm_refresh_video_stats) no início de cada run.
-- As fns de 0005/0006/0007 são redefinidas abaixo mudando SÓ a fonte de
-- views/retenção (+ score novo em vm_client_insights, ver comentário lá).

create materialized view if not exists vm_video_stats as
select v.id as video_id,
       v.canal_id,
       ca.cliente_id,
       -- views_no_dia/fb_views_no_dia são SNAPSHOT ACUMULADO (total até o dia), não delta →
       -- total do vídeo = pico do contador (max), NUNCA soma dos dias (inflava ~Ndias×).
       coalesce(md.views_total, 0)::bigint as views_total,
       mr.seguidores_ganhos,
       mr.retencao_hook,
       mr.retencao_final
from videos v
join canais ca on ca.id = v.canal_id
left join lateral (
  select max(m.views_no_dia) + coalesce(max(m.fb_views_no_dia), 0) as views_total
  from metricas_diarias m where m.video_id = v.id
) md on true
left join lateral (
  -- última leitura de retenção do vídeo (mesmo padrão de 0005/0007)
  select nullif(regexp_replace(r.seguidores_ganhos::text, '[^0-9-]', '', 'g'), '')::bigint as seguidores_ganhos,
         r.retencao_hook::numeric as retencao_hook,
         r.retencao_final::numeric as retencao_final
  from metricas_retencao r where r.video_id = v.id
  order by r.data desc nulls last limit 1
) mr on true;

-- unique index habilita refresh concurrently (leitores não bloqueiam durante o refresh)
create unique index if not exists vm_video_stats_video_id_idx on vm_video_stats (video_id);
create index if not exists vm_video_stats_cliente_idx on vm_video_stats (cliente_id);

-- Chamada pelo ETL (lib/etl.ts) no início do run semanal.
create or replace function vm_refresh_video_stats()
returns void language plpgsql security definer
set search_path to 'public'
as $$
begin
  refresh materialized view concurrently vm_video_stats;
exception when others then
  -- ponytail: concurrently exige MV já populada; cai aqui só em estado degenerado
  refresh materialized view vm_video_stats;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- vm_client_panel (era 0005): idêntica, só a CTE vviews passa a ler da MV.
create or replace function vm_client_panel(p_cliente_id uuid)
returns jsonb
language sql stable
as $$
with vids as (
  select v.id, v.data_publicacao, v.categorias,
         coalesce(v.analise->'analise', v.analise) as an
  from videos v
  join canais ca on ca.id = v.canal_id and ca.cliente_id = p_cliente_id
),
vviews as (
  select vd.*,
         coalesce(st.views_total, 0) as views,
         st.seguidores_ganhos as seguidores
  from vids vd
  left join vm_video_stats st on st.video_id = vd.id
),
top_class as (
  select d.dim,
         regexp_replace(regexp_replace(cls->>'tipo', '^gatilho_', ''), '_(de|da|do|e)_', '_', 'g') as tipo_norm,
         mode() within group (order by cls->>'tipo') as tipo,
         count(*) as qtd,
         round(avg(vv.views)) as media_views,
         round(avg(vv.seguidores)) as media_seguidores
  from vviews vv,
       lateral (values
         ('storytelling', vv.an->'storytelling'->'classificacoes'),
         ('hook',         vv.an->'hook'->'classificacoes'),
         ('comando',      vv.an->'comando'->'classificacoes')
       ) as d(dim, arr),
       lateral jsonb_array_elements(coalesce(d.arr, '[]'::jsonb)) cls
  where cls->>'confianca' = 'alta'
  group by d.dim, regexp_replace(regexp_replace(cls->>'tipo', '^gatilho_', ''), '_(de|da|do|e)_', '_', 'g')
)
select jsonb_build_object(
  'total_videos', (select count(*) from vids),
  'videos_analisados', (select count(*) from vids where an->'storytelling' is not null),
  'videos_30d', (select count(*) from vids where data_publicacao >= current_date - 30),
  'media_views_30d', (select round(avg(views)) from vviews
                       where data_publicacao >= current_date - 30 and views > 0),
  'media_views_geral', (select round(avg(views)) from vviews where views > 0),
  'plataformas', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'plataforma', p.plataforma, 'username', p.username, 'seguidores', p.seguidores)
             order by p.seguidores desc nulls last), '[]'::jsonb)
    from (
      select ca.plataforma::text as plataforma, ca.username,
             (select mc.num_seguidores from metricas_canal mc
               where mc.canal_id = ca.id order by mc.data_registro desc limit 1) as seguidores
      from canais ca where ca.cliente_id = p_cliente_id and ca.ativo
    ) p
  ),
  'top_temas', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'tipo', t.tema, 'qtd', t.qtd, 'media_views', t.media_views) order by t.qtd desc), '[]'::jsonb)
    from (
      select coalesce(substring(c.raw from '"nome"\s*:\s*"([^"]+)"'), c.raw) as tema,
             count(*) as qtd, round(avg(c.views)) as media_views
      from (select unnest(categorias) as raw, views from vviews where categorias is not null) c
      group by 1 order by count(*) desc limit 8
    ) t
  ),
  'top_storytelling', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'tipo', s.tipo, 'qtd', s.qtd, 'media_views', s.media_views, 'media_seguidores', s.media_seguidores)
             order by s.qtd desc), '[]'::jsonb)
    from (select * from top_class where dim = 'storytelling' order by qtd desc limit 6) s
  ),
  'top_hook', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'tipo', s.tipo, 'qtd', s.qtd, 'media_views', s.media_views, 'media_seguidores', s.media_seguidores)
             order by s.qtd desc), '[]'::jsonb)
    from (select * from top_class where dim = 'hook' order by qtd desc limit 6) s
  ),
  -- comando é eixo de CONVERSÃO (seguidores), não de views: ordena por conversão
  'top_comando', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'tipo', s.tipo, 'qtd', s.qtd, 'media_views', s.media_views, 'media_seguidores', s.media_seguidores)
             order by s.media_seguidores desc nulls last, s.qtd desc), '[]'::jsonb)
    from (select * from top_class where dim = 'comando'
           order by media_seguidores desc nulls last, qtd desc limit 6) s
  )
);
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- vm_client_insights (era 0005): fonte de views/retenção = MV + score robusto.
-- score = performance_ratio * fator_retencao * recencia_peso * least(1, amostra/3)
--   performance_ratio: MEDIANA de views do grupo / mediana do cliente (comando:
--     seguidores ganhos) — mediana resiste a outlier viral (WP-C.2)
--   fator_retencao: hook multiplica por retencao_hook vs mediana do cliente;
--     comando por retencao_final; sem dado → 1.0 (WP-C.3)
--   recencia_peso: exp(-dias/260) (meia-vida ~180d) com piso 0.3 — exposto
--     separado do score para o payload (WP-C.2)
-- Retorno ganha a coluna recencia_peso → drop antes do create.
drop function if exists vm_client_insights(uuid);
create function vm_client_insights(p_cliente_id uuid)
returns table(
  categoria text, tipo text, amostra bigint,
  media_views numeric, media_seguidores numeric,
  recencia_dias int, ultimo_uso date,
  performance_ratio numeric, recencia_peso numeric, score numeric
)
language sql stable
as $$
with vids as (
  select v.id, v.data_publicacao, v.categorias,
         coalesce(v.analise->'analise', v.analise) as an
  from videos v
  join canais ca on ca.id = v.canal_id and ca.cliente_id = p_cliente_id
),
vviews as (
  select vd.*,
         coalesce(st.views_total, 0) as views,
         st.seguidores_ganhos as seguidores,
         st.retencao_hook, st.retencao_final
  from vids vd
  left join vm_video_stats st on st.video_id = vd.id
),
base as (
  select percentile_cont(0.5) within group (order by views) filter (where views > 0) as mediana_views_cliente,
         percentile_cont(0.5) within group (order by seguidores) filter (where seguidores is not null) as mediana_seg_cliente,
         percentile_cont(0.5) within group (order by retencao_hook) filter (where retencao_hook is not null) as mediana_ret_hook,
         percentile_cont(0.5) within group (order by retencao_final) filter (where retencao_final is not null) as mediana_ret_final
  from vviews
),
class as (
  select d.dim as categoria,
         regexp_replace(regexp_replace(cls->>'tipo', '^gatilho_', ''), '_(de|da|do|e)_', '_', 'g') as tipo_norm,
         cls->>'tipo' as tipo_raw,
         vv.views, vv.seguidores, vv.data_publicacao, vv.retencao_hook, vv.retencao_final
  from vviews vv,
       lateral (values
         ('storytelling', vv.an->'storytelling'->'classificacoes'),
         ('hook',         vv.an->'hook'->'classificacoes'),
         ('comando',      vv.an->'comando'->'classificacoes')
       ) as d(dim, arr),
       lateral jsonb_array_elements(coalesce(d.arr, '[]'::jsonb)) cls
  where cls->>'confianca' = 'alta'
  union all
  select 'tema',
         coalesce(substring(c.raw from '"nome"\s*:\s*"([^"]+)"'), c.raw),
         coalesce(substring(c.raw from '"nome"\s*:\s*"([^"]+)"'), c.raw),
         c.views, c.seguidores, c.data_publicacao, c.retencao_hook, c.retencao_final
  from (select unnest(vv.categorias) as raw, vv.views, vv.seguidores, vv.data_publicacao,
               vv.retencao_hook, vv.retencao_final
          from vviews vv where vv.categorias is not null) c
),
grouped as (
  select categoria, tipo_norm,
         mode() within group (order by tipo_raw) as tipo,
         count(*) as amostra,
         round(avg(views) filter (where views > 0)) as media_views,
         percentile_cont(0.5) within group (order by views) filter (where views > 0) as mediana_views,
         round(avg(seguidores) filter (where seguidores is not null)) as media_seguidores,
         percentile_cont(0.5) within group (order by seguidores) filter (where seguidores is not null) as mediana_seguidores,
         percentile_cont(0.5) within group (order by retencao_hook) filter (where retencao_hook is not null) as ret_hook_grupo,
         percentile_cont(0.5) within group (order by retencao_final) filter (where retencao_final is not null) as ret_final_grupo,
         (current_date - max(data_publicacao))::int as recencia_dias,
         max(data_publicacao) as ultimo_uso
  from class
  group by categoria, tipo_norm
)
select g.categoria, g.tipo, g.amostra, g.media_views, g.media_seguidores,
       g.recencia_dias, g.ultimo_uso,
       round(perf.ratio::numeric, 3) as performance_ratio,
       round(rec.peso::numeric, 4) as recencia_peso,
       round((perf.ratio * ret.fator * rec.peso * least(1.0, g.amostra / 3.0))::numeric, 4) as score
from grouped g
cross join base b
cross join lateral (
  -- Dois eixos distintos: viralização (tema/hook/storytelling → views) e conversão (comando → seguidores).
  -- Comando NUNCA é pontuado por views; sem dado de seguidores, o comando não vira insight.
  select case
    when g.categoria = 'comando'
      then case when g.mediana_seguidores is not null and b.mediana_seg_cliente > 0
                then g.mediana_seguidores / b.mediana_seg_cliente end
    else coalesce(g.mediana_views / nullif(b.mediana_views_cliente, 0), 0)
  end as ratio
) perf
cross join lateral (
  -- retenção como sinal: hook → retencao_hook, comando → retencao_final; sem dado → 1.0
  select case g.categoria
    when 'hook'    then coalesce(g.ret_hook_grupo  / nullif(b.mediana_ret_hook, 0),  1.0)
    when 'comando' then coalesce(g.ret_final_grupo / nullif(b.mediana_ret_final, 0), 1.0)
    else 1.0
  end as fator
) ret
cross join lateral (
  select greatest(0.3, exp(-coalesce(g.recencia_dias, 365) / 260.0)) as peso
) rec
where g.amostra >= 2 and perf.ratio is not null
order by score desc;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- vm_cross_client_hits (era 0006): idêntica, só a CTE scored passa a ler da MV.
create or replace function vm_cross_client_hits(p_cliente_id uuid, p_limit int default 12)
returns table(
  titulo text, assunto text, tema text, cliente_origem text,
  views bigint, data_publicacao date, storytelling_tipo text, hook_tipo text
)
language sql stable
as $$
with alvo as ( -- temas fortes do cliente selecionado (normalizados)
  select coalesce(substring(cat from '"nome"\s*:\s*"([^"]+)"'), cat) as tema
  from videos v
  join canais ca on ca.id = v.canal_id and ca.cliente_id = p_cliente_id,
       unnest(v.categorias) cat
  group by 1 order by count(*) desc limit 6
),
cand as ( -- vídeos de outros clientes ativos, sem títulos-lixo
  select v.id, v.titulo, v.assunto, cl.nome as cliente_origem, v.data_publicacao,
         coalesce(v.analise->'analise', v.analise) as an, v.categorias
  from videos v
  join canais ca on ca.id = v.canal_id
  join clientes cl on cl.id = ca.cliente_id and cl.ativo and cl.id <> p_cliente_id
  where v.titulo is not null
    and length(v.titulo) >= 15
    and v.titulo !~* '^(todo\M|teste\M|quem [eé]\M)'
    and v.categorias is not null
),
matched as ( -- 1 linha por vídeo, com o primeiro tema-alvo que casa
  select distinct on (c.id)
         c.id, c.titulo, c.assunto, c.cliente_origem, c.data_publicacao, c.an, t.tema
  from cand c
  cross join lateral (
    select coalesce(substring(cat from '"nome"\s*:\s*"([^"]+)"'), cat) as tema
    from unnest(c.categorias) cat
  ) t
  where t.tema in (select tema from alvo)
  order by c.id
),
scored as (
  select m.*, coalesce(st.views_total, 0) as views
  from matched m
  left join vm_video_stats st on st.video_id = m.id
),
dedup as ( -- mesmo título em várias plataformas → fica a cópia com mais views
  select distinct on (titulo) * from scored order by titulo, views desc
)
select d.titulo, d.assunto, d.tema, d.cliente_origem, d.views, d.data_publicacao,
       (select cls->>'tipo' from jsonb_array_elements(coalesce(d.an->'storytelling'->'classificacoes', '[]'::jsonb)) cls
         where cls->>'confianca' = 'alta' limit 1) as storytelling_tipo,
       (select cls->>'tipo' from jsonb_array_elements(coalesce(d.an->'hook'->'classificacoes', '[]'::jsonb)) cls
         where cls->>'confianca' = 'alta' limit 1) as hook_tipo
from dedup d
order by d.views desc
limit p_limit;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- vm_published_scripts (era 0007): views/retenção/seguidores da MV; views agora
-- incluem fb_views_no_dia (padrão das demais fns — 0007 só somava views_no_dia).
create or replace function vm_published_scripts()
returns table(crm_script_id uuid, video_id uuid, views bigint,
              retencao_hook numeric, retencao_final numeric,
              compartilhamentos bigint, seguidores_ganhos bigint)
language sql stable as $$
  select v.crm_script_id, v.id,
    coalesce(st.views_total, 0)::bigint,
    st.retencao_hook, st.retencao_final,
    -- compartilhamentos não estão na MV: snapshot acumulado → pico (max), não soma
    coalesce((select max(m.compartilhamentos_no_dia) from metricas_diarias m where m.video_id = v.id), 0)::bigint,
    st.seguidores_ganhos
  from videos v
  left join vm_video_stats st on st.video_id = v.id
  where v.crm_script_id is not null;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- vm_client_hook_examples (WP-C.5): top 5 hooks LITERAIS do cliente por views,
-- consumido pelo ETL como insight client_hook_examples.
create or replace function vm_client_hook_examples(p_cliente_id uuid, p_limit int default 5)
returns table(hook text, views bigint, retencao_hook numeric)
language sql stable as $$
  -- ponytail: sem dedupe de hooks idênticos entre plataformas; adicionar distinct on se poluir o top 5
  select v.hook, coalesce(st.views_total, 0)::bigint, st.retencao_hook
  from videos v
  join canais ca on ca.id = v.canal_id and ca.cliente_id = p_cliente_id
  left join vm_video_stats st on st.video_id = v.id
  where v.hook is not null and length(trim(v.hook)) >= 10
  order by st.views_total desc nulls last
  limit p_limit;
$$;
