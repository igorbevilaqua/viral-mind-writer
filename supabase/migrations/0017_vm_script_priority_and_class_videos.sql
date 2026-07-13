-- 0017: (a) vm_cross_client_hits prioriza produção nossa (videos.crm_script_id
-- not null = roteiro vm-script publicado) e expõe o flag vm_script para o
-- ideador rotular no prompt; (b) vm_client_class_videos lista os vídeos (com
-- link) por trás de cada linha do painel do cliente (drill-down na UI).

-- retorno ganha a coluna vm_script → drop antes do create
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
         c.id, c.titulo, c.assunto, c.cliente_origem, c.data_publicacao, c.an, c.vm_script, t.tema
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
         where cls->>'confianca' = 'alta' limit 1) as hook_tipo,
       d.vm_script
from dedup d
order by d.vm_script desc, d.views desc
limit p_limit;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- vm_client_class_videos: vídeos do cliente que compõem uma linha do painel
-- (vm_client_panel). p_dim: 'tema' casa o nome da categoria; storytelling/hook/
-- comando casam a classificação (confiança alta) com a MESMA normalização do
-- agrupamento do painel — clicar num grupo devolve exatamente seus vídeos.
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
)
select m.titulo, m.link_video, coalesce(st.views_total, 0)::bigint, m.data_publicacao, m.plataforma, m.vm_script
from matched m
left join vm_video_stats st on st.video_id = m.id
order by st.views_total desc nulls last
limit p_limit;
$$;
