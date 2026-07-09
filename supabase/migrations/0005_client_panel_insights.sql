-- Painel de dados + insights por cliente.
-- videos.analise vem em 2 formatos ({analise:{...}} e plano) → coalesce normaliza.
-- videos.categorias mistura strings puras e JSON serializado {"rank":n,"nome":"X"} → regex extrai o nome.
-- Tipos de hook/comando têm aliases (gatilho_autoridade vs gatilho_de_autoridade) → normaliza conectivos.
-- Só classificações confianca='alta' contam (precisão > amostra).

-- Painel ao vivo: agregados de exibição por cliente.
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
         -- views_no_dia/fb_views_no_dia são SNAPSHOT ACUMULADO (total até o dia), não delta →
         -- total do vídeo = pico do contador (max), NUNCA soma dos dias (inflava ~Ndias×).
         coalesce((select max(md.views_no_dia) + coalesce(max(md.fb_views_no_dia), 0)
                     from metricas_diarias md where md.video_id = vd.id), 0) as views,
         (select nullif(regexp_replace(mr.seguidores_ganhos, '[^0-9-]', '', 'g'), '')::bigint
            from metricas_retencao mr where mr.video_id = vd.id
            order by mr.data desc nulls last limit 1) as seguidores
  from vids vd
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

-- Insights pontuados por categoria (tema/storytelling/hook/comando), consumidos pelo ETL semanal.
-- score = performance_ratio * exp(-dias_desde_ultimo_uso/90) * least(1, amostra/3)
--   performance_ratio: média de views do grupo / média do cliente (comando: seguidores ganhos)
--   recência: decaimento sobre o ÚLTIMO uso (padrão recém-usado pesa mais)
--   relevancia_gate: penaliza amostras minúsculas sem zerar (davi_e_golias com poucos vídeos e média altíssima sobe)
create or replace function vm_client_insights(p_cliente_id uuid)
returns table(
  categoria text, tipo text, amostra bigint,
  media_views numeric, media_seguidores numeric,
  recencia_dias int, ultimo_uso date,
  performance_ratio numeric, score numeric
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
         -- views_no_dia/fb_views_no_dia são SNAPSHOT ACUMULADO (total até o dia), não delta →
         -- total do vídeo = pico do contador (max), NUNCA soma dos dias (inflava ~Ndias×).
         coalesce((select max(md.views_no_dia) + coalesce(max(md.fb_views_no_dia), 0)
                     from metricas_diarias md where md.video_id = vd.id), 0) as views,
         (select nullif(regexp_replace(mr.seguidores_ganhos, '[^0-9-]', '', 'g'), '')::bigint
            from metricas_retencao mr where mr.video_id = vd.id
            order by mr.data desc nulls last limit 1) as seguidores
  from vids vd
),
base as (
  select avg(views) filter (where views > 0) as media_views_cliente,
         avg(seguidores) filter (where seguidores is not null) as media_seg_cliente
  from vviews
),
class as (
  select d.dim as categoria,
         regexp_replace(regexp_replace(cls->>'tipo', '^gatilho_', ''), '_(de|da|do|e)_', '_', 'g') as tipo_norm,
         cls->>'tipo' as tipo_raw,
         vv.views, vv.seguidores, vv.data_publicacao
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
         c.views, c.seguidores, c.data_publicacao
  from (select unnest(vv.categorias) as raw, vv.views, vv.seguidores, vv.data_publicacao
          from vviews vv where vv.categorias is not null) c
),
grouped as (
  select categoria, tipo_norm,
         mode() within group (order by tipo_raw) as tipo,
         count(*) as amostra,
         round(avg(views) filter (where views > 0)) as media_views,
         round(avg(seguidores) filter (where seguidores is not null)) as media_seguidores,
         (current_date - max(data_publicacao))::int as recencia_dias,
         max(data_publicacao) as ultimo_uso
  from class
  group by categoria, tipo_norm
)
select g.categoria, g.tipo, g.amostra, g.media_views, g.media_seguidores,
       g.recencia_dias, g.ultimo_uso,
       round(perf.ratio, 3) as performance_ratio,
       round(perf.ratio
             * exp(-coalesce(g.recencia_dias, 365) / 90.0)
             * least(1.0, g.amostra / 3.0), 4) as score
from grouped g
cross join base b
cross join lateral (
  -- Dois eixos distintos: viralização (tema/hook/storytelling → views) e conversão (comando → seguidores).
  -- Comando NUNCA é pontuado por views; sem dado de seguidores, o comando não vira insight.
  select case
    when g.categoria = 'comando'
      then case when g.media_seguidores is not null and b.media_seg_cliente > 0
                then g.media_seguidores / b.media_seg_cliente end
    else coalesce(g.media_views / nullif(b.media_views_cliente, 0), 0)
  end as ratio
) perf
where g.amostra >= 2 and perf.ratio is not null
order by score desc;
$$;
