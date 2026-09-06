-- supabase/migrations/0042_client_insights_canonicas.sql
-- Plano 020, WP-E. vm_client_insights passa a ler a taxonomia canônica (vm_video_classifications,
-- 0041) em vez de videos.analise — o legado tinha 22% de cobertura e vocabulário inconsistente
-- (gatilho_expectativa / gatilho_de_expectativa / expectativa), então o insight por cliente
-- que alimenta client_hook/client_storytelling/client_comando era ruído.
--
-- Assinatura e colunas de retorno IDÊNTICAS à 0018 (lib/etl.ts lê por nome); score, régua,
-- retenção e recência ficam como estavam. Só a CTE `class` muda:
--   hook          ← unnest(hook_mecanismos), sem 'Outro' (rótulo-lixo do classificador)
--   storytelling  ← unnest(estruturas) traduzido para "A1. Jornada do Herói" (o mesmo formato que
--                   extractPlaybookSection em lib/pipeline/draft.ts já aceita; nomes de
--                   lib/pipeline/taxonomia.ts)
--   comando       ← unnest(comandos) — continua pontuando por seguidores, nunca por views
--   tema          ← intacto (videos.categorias)
-- "Dimensão rotulada" = fonte_<dim> is not null (regra da 0041): array vazio com fonte é
-- "avaliado, sem padrão" e não gera linha; sem fonte a dimensão não entra.
-- vm_client_panel NÃO muda aqui (segue no legado até ter dono).
--
-- Ao final, vm_hook_classifications (0020) é dropada: os 800 vencedores já foram copiados
-- para vm_video_classifications pelo seed (fonte_hook='codex-2026-07').

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
  select v.id, v.data_publicacao, v.categorias
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
estruturas(code, nome) as (values
  ('A1', 'Jornada do Herói'), ('A2', 'Herói Improvável'), ('A3', 'Herói Esquecido'),
  ('B1', 'Davi e Golias'), ('B2', 'Conflito Imprevisível'), ('B3', 'Queda do Gigante'),
  ('C1', 'O Iconoclasta'), ('C2', 'Estratégia Oculta'), ('C3', 'Investigação & Escândalo'),
  ('D1', 'Urgência & Alerta'), ('D2', 'Evento Global'), ('D3', 'Efeito Dominó'),
  ('E1', 'Paradoxo Contraintuitivo'), ('E2', 'Inovação & Sacada Genial'), ('E3', 'Narrativa Filosófica'),
  ('F1', 'Erro Fatal'), ('F2', 'Dois Mundos'), ('F3', 'O Profeta Ignorado'), ('F4', 'Transformação de Identidade')
),
class as (
  -- tipo_norm = tipo_raw: o vocabulário já é canônico, a normalização por regexp do legado saiu
  select d.categoria, d.tipo as tipo_norm, d.tipo as tipo_raw,
         vv.views, vv.seguidores, vv.data_publicacao, vv.retencao_hook, vv.retencao_final
  from vviews vv
  join vm_video_classifications vc on vc.video_id = vv.id
  cross join lateral (
    select 'hook', m from unnest(vc.hook_mecanismos) m
     where vc.fonte_hook is not null and m <> 'Outro'
    union all
    select 'storytelling', e.code || '. ' || e.nome
      from unnest(vc.estruturas) c join estruturas e on e.code = c
     where vc.fonte_estruturas is not null
    union all
    select 'comando', c from unnest(vc.comandos) c
     where vc.fonte_comandos is not null
  ) as d(categoria, tipo)
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

-- ── vm_client_class_videos: o drill-down do painel acompanha a taxonomia ─────────────────────
-- Sem isto, clicar num insight canônico ("Contraste Extremo", "A1. Jornada do Herói") casaria
-- p_tipo contra videos.analise legado e voltaria lista vazia — falha silenciosa. Tema fica igual.
-- Corpo idêntico à 0018 fora do `matched`.
create or replace function vm_client_class_videos(p_cliente_id uuid, p_dim text, p_tipo text, p_limit int default 20)
returns table(titulo text, link_video text, views bigint, data_publicacao date, plataforma text, vm_script boolean)
language sql stable
as $$
with vids as (
  select v.id, v.titulo, v.link_video, v.data_publicacao, v.categorias,
         ca.plataforma::text as plataforma,
         (v.crm_script_id is not null) as vm_script
  from videos v
  join canais ca on ca.id = v.canal_id and ca.cliente_id = p_cliente_id
),
matched as (
  select vd.* from vids vd
  where case p_dim
    when 'tema' then exists (select 1 from unnest(vd.categorias) cat
                             where coalesce(substring(cat from '"nome"\s*:\s*"([^"]+)"'), cat) = p_tipo)
    when 'hook' then exists (select 1 from vm_video_classifications vc
                             where vc.video_id = vd.id and vc.fonte_hook is not null and p_tipo = any(vc.hook_mecanismos))
    when 'storytelling' then exists (select 1 from vm_video_classifications vc
                             where vc.video_id = vd.id and vc.fonte_estruturas is not null and left(p_tipo, 2) = any(vc.estruturas))
    when 'comando' then exists (select 1 from vm_video_classifications vc
                             where vc.video_id = vd.id and vc.fonte_comandos is not null and p_tipo = any(vc.comandos))
    else false
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

-- Os 800 vencedores já vivem em vm_video_classifications (seed, fonte_hook='codex-2026-07');
-- nada mais lê esta tabela (lib/etl.ts e scripts/seed-calibration.ts migraram no WP-E).
drop table if exists vm_hook_classifications;
