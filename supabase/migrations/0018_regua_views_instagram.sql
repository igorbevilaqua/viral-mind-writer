-- 0018: régua absoluta de aprendizado (pedido do Igor, 13/jul):
--   < 50k views  → quase nada a ensinar (corta/penaliza)
--   ≥ 1M views   → muito a ensinar (prioriza)
-- + prioridade Instagram (plataforma principal). A média do canal continua
-- valendo (performance_ratio), a régua entra como fator adicional.

-- ── vm_client_class_videos: exemplos do drill-down ──────────────────────────
-- Corta <50k (fallback: se o grupo não tem nenhum ≥50k, mostra o que houver);
-- ordena por régua (≥1M primeiro), Instagram antes das demais, depois views.
create or replace function vm_client_class_videos(p_cliente_id uuid, p_dim text, p_tipo text, p_limit int default 20)
returns table(titulo text, link_video text, views bigint, data_publicacao date, plataforma text, vm_script boolean)
language sql stable
as $$
with vids as (
  select v.id, v.titulo, v.link_video, v.data_publicacao, v.categorias,
         ca.plataforma::text as plataforma,
         (v.crm_script_id is not null) as vm_script,
         coalesce(v.analise->'analise', v.analise) as an
  from videos v
  join canais ca on ca.id = v.canal_id and ca.cliente_id = p_cliente_id
),
matched as (
  select vd.* from vids vd
  where case when p_dim = 'tema' then
    exists (select 1 from unnest(vd.categorias) cat
            where coalesce(substring(cat from '"nome"\s*:\s*"([^"]+)"'), cat) = p_tipo)
  else
    exists (select 1 from jsonb_array_elements(coalesce(vd.an->p_dim->'classificacoes', '[]'::jsonb)) cls
            where cls->>'confianca' = 'alta'
              and regexp_replace(regexp_replace(cls->>'tipo', '^gatilho_', ''), '_(de|da|do|e)_', '_', 'g')
                = regexp_replace(regexp_replace(p_tipo, '^gatilho_', ''), '_(de|da|do|e)_', '_', 'g'))
  end
),
final as (
  select m.titulo, m.link_video, coalesce(st.views_total, 0)::bigint as views,
         m.data_publicacao, m.plataforma, m.vm_script
  from matched m
  left join vm_video_stats st on st.video_id = m.id
)
select f.titulo, f.link_video, f.views, f.data_publicacao, f.plataforma, f.vm_script
from final f
where f.views >= 50000
   or not exists (select 1 from final x where x.views >= 50000)
order by (f.views >= 1000000) desc, (f.plataforma = 'Instagram') desc, f.views desc
limit p_limit;
$$;

-- ── vm_cross_client_hits: hits que alimentam o ideador ──────────────────────
-- Só considera acertos (≥50k); dedup entre plataformas prefere Instagram;
-- ordem final: produção VM > régua 1M > Instagram > views.
drop function if exists vm_cross_client_hits(uuid, int);
create function vm_cross_client_hits(p_cliente_id uuid, p_limit int default 12)
returns table(
  titulo text, assunto text, tema text, cliente_origem text,
  views bigint, data_publicacao date, storytelling_tipo text, hook_tipo text,
  vm_script boolean
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
         coalesce(v.analise->'analise', v.analise) as an, v.categorias,
         ca.plataforma::text as plataforma,
         (v.crm_script_id is not null) as vm_script
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
         c.id, c.titulo, c.assunto, c.cliente_origem, c.data_publicacao,
         c.an, c.plataforma, c.vm_script, t.tema
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
  where coalesce(st.views_total, 0) >= 50000 -- régua: abaixo disso não ensina
),
dedup as ( -- mesmo título em várias plataformas → prefere Instagram, depois views
  select distinct on (titulo) * from scored
  order by titulo, (plataforma = 'Instagram') desc, views desc
)
select d.titulo, d.assunto, d.tema, d.cliente_origem, d.views, d.data_publicacao,
       (select cls->>'tipo' from jsonb_array_elements(coalesce(d.an->'storytelling'->'classificacoes', '[]'::jsonb)) cls
         where cls->>'confianca' = 'alta' limit 1) as storytelling_tipo,
       (select cls->>'tipo' from jsonb_array_elements(coalesce(d.an->'hook'->'classificacoes', '[]'::jsonb)) cls
         where cls->>'confianca' = 'alta' limit 1) as hook_tipo,
       d.vm_script
from dedup d
order by d.vm_script desc, (d.views >= 1000000) desc, (d.plataforma = 'Instagram') desc, d.views desc
limit p_limit;
$$;

-- ── vm_client_insights: score ganha o fator régua ───────────────────────────
-- score = performance_ratio * fator_retencao * recencia_peso * amostra * REGUA
-- régua pela mediana de views do grupo: ≥1M → 1.3 · ≥50k → 1.0 · <50k → 0.6
-- (comando é eixo de seguidores, não de views → régua neutra).
-- ponytail: degraus fixos 1.3/0.6; virar curva contínua se os saltos incomodarem
create or replace function vm_client_insights(p_cliente_id uuid)
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
       round((perf.ratio * ret.fator * rec.peso * least(1.0, g.amostra / 3.0) * rg.regua)::numeric, 4) as score
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
cross join lateral (
  -- régua absoluta: complementa (não substitui) a comparação com a média do canal
  select case
    when g.categoria = 'comando' then 1.0
    when g.mediana_views >= 1000000 then 1.3
    when g.mediana_views >= 50000 then 1.0
    else 0.6
  end as regua
) rg
where g.amostra >= 2 and perf.ratio is not null
order by score desc;
$$;
