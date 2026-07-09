-- Reaproveitamento cruzado: vídeos de OUTROS clientes nos temas fortes do cliente-alvo,
-- rankeados por views — matéria-prima do botão "Sugerir tema".
-- Dedup em 2 níveis: por vídeo (1 linha por tema casado) e por título (mesmo vídeo em
-- várias plataformas → fica a cópia com mais views). Títulos-lixo (TODO, teste, "quem é...") filtrados.
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
scored as ( -- views computadas SÓ para os casados (não para o corpus inteiro)
  select m.*,
         -- views_no_dia/fb_views_no_dia são SNAPSHOT ACUMULADO (total até o dia), não delta →
         -- total do vídeo = pico do contador (max), NUNCA soma dos dias (inflava ~Ndias× → "389M views").
         coalesce((select max(md.views_no_dia) + coalesce(max(md.fb_views_no_dia), 0)
                     from metricas_diarias md where md.video_id = m.id), 0) as views
  from matched m
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
