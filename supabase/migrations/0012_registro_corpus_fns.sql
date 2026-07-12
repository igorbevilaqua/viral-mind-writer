-- 0012: REGISTRO (plano 012, WP-C.8) — já aplicado no banco, commitado para
-- eliminar schema drift. Definições resgatadas do Viral Data em 2026-07-11.
-- Estas são as duas RPCs do lado corpus que o app consome:
--   match_documents      → lib/pipeline/context.ts (few-shot)
--   vm_insights_snapshot → lib/etl.ts (insights globais)
-- Reaplicar é seguro (create or replace idêntico).
-- NOTA (auditoria 2026-07-11): vm_insights_snapshot soma views_no_dia (sum),
-- enquanto as funções vm_* de 0005-0007 usam max(views_no_dia) tratando o dado
-- como snapshot acumulado — uma das duas leituras do corpus está errada.
-- Investigar com o dono do corpus antes de mexer; fora do escopo do plano 012.

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_threshold double precision DEFAULT 0.6, match_count integer DEFAULT 5, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, video_id uuid, content text, metadata jsonb, similarity double precision, taxa_conversao double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.video_id,
    d.content,
    d.metadata,
    (1 - (d.embedding::vector <=> query_embedding))::double precision AS similarity,
    (
      SELECT
        CASE
          WHEN mr.seguidores_ganhos IS NOT NULL
               AND mr.taxa_nao_seguidores IS NOT NULL
               AND mr.taxa_nao_seguidores > 0
               AND (d.metadata->>'views')::numeric > 0
          THEN (
            mr.seguidores_ganhos::numeric
            / NULLIF((d.metadata->>'views')::numeric * (mr.taxa_nao_seguidores / 100.0), 0)
            * 100.0
          )::double precision
          ELSE NULL
        END
      FROM metricas_retencao mr
      WHERE mr.video_id = d.video_id
      ORDER BY mr.created_at DESC
      LIMIT 1
    ) AS taxa_conversao
  FROM documents d
  WHERE (1 - (d.embedding::vector <=> query_embedding)) > match_threshold
    AND (filter = '{}'::jsonb OR d.metadata @> filter)
  ORDER BY (d.embedding::vector <=> query_embedding) ASC
  LIMIT match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.vm_insights_snapshot()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
with views_per_video as (
  select v.id, v.titulo, v.hook, v.categorias, v.elementos, v.sentimentos, v.video_duration, c.cliente_id,
         coalesce(sum(m.views_no_dia),0) + coalesce(sum(m.fb_views_no_dia),0) as total_views,
         coalesce(sum(m.compartilhamentos_no_dia),0) as total_shares
  from videos v
  join canais c on c.id = v.canal_id
  left join metricas_diarias m on m.video_id = v.id
  group by v.id, c.cliente_id
),
retencao as (
  select distinct on (video_id) video_id, retencao_hook, retencao_subhook, retencao_final
  from metricas_retencao order by video_id, data desc
),
top_views as (
  select * from views_per_video order by total_views desc limit 20
),
top_ret as (
  select r.*, v.titulo, v.hook, v.video_duration, v.total_views
  from retencao r join views_per_video v on v.id = r.video_id
  where r.retencao_hook is not null
  order by r.retencao_hook desc limit 20
),
decile as (
  select * from views_per_video
  where total_views >= (select percentile_cont(0.9) within group (order by total_views) from views_per_video)
),
elements as (
  select e as item, count(*) as freq from decile, unnest(coalesce(elementos,'{}')) e group by e order by freq desc limit 15
),
sentiments as (
  select s as item, count(*) as freq from decile, unnest(coalesce(sentimentos,'{}')) s group by s order by freq desc limit 15
),
cats as (
  select c2 as item, count(*) as freq from decile, unnest(coalesce(categorias,'{}')) c2 group by c2 order by freq desc limit 15
),
pacing as (
  select
    (select round(avg(video_duration)::numeric,1) from decile where video_duration > 0) as duracao_media_top10pct,
    (select round(avg(video_duration)::numeric,1) from views_per_video where video_duration > 0) as duracao_media_geral,
    (select round((percentile_cont(0.5) within group (order by retencao_hook))::numeric,1) from retencao where retencao_hook is not null) as mediana_retencao_hook,
    (select round((percentile_cont(0.5) within group (order by retencao_final))::numeric,1) from retencao where retencao_final is not null) as mediana_retencao_final
),
per_client as (
  select cliente_id, jsonb_agg(jsonb_build_object('titulo',titulo,'hook',hook,'views',total_views) order by total_views desc) as tops
  from (
    select *, row_number() over (partition by cliente_id order by total_views desc) rn from views_per_video
  ) t where rn <= 5 and cliente_id is not null
  group by cliente_id
)
select jsonb_build_object(
  'top_views', (select jsonb_agg(jsonb_build_object('titulo',titulo,'hook',hook,'views',total_views,'shares',total_shares,'duracao',video_duration)) from top_views),
  'top_retention', (select jsonb_agg(jsonb_build_object('titulo',titulo,'hook',hook,'retencao_hook',retencao_hook,'retencao_subhook',retencao_subhook,'retencao_final',retencao_final,'views',total_views,'duracao',video_duration)) from top_ret),
  'winning_elements', jsonb_build_object(
    'elementos', (select jsonb_agg(jsonb_build_object('item',item,'freq',freq)) from elements),
    'sentimentos', (select jsonb_agg(jsonb_build_object('item',item,'freq',freq)) from sentiments),
    'categorias', (select jsonb_agg(jsonb_build_object('item',item,'freq',freq)) from cats)
  ),
  'pacing_stats', (select to_jsonb(pacing) from pacing),
  'per_client', (select jsonb_object_agg(cliente_id::text, tops) from per_client)
);
$function$;
