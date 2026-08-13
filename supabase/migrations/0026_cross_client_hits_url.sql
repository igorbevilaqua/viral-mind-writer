-- 0026 (plano 014, WP-5): vm_cross_client_hits passa a devolver `link_video`.
--
-- O hit cruzado é a modelagem que a casa já tem em mão, e a sugestão exibia dele só título
-- e views: para virar modelagem o usuário tinha que ir procurar o vídeo. Com a URL no
-- retorno, o hit interno vira modelagem em um clique, igual ao candidato externo do pool.
--
-- Idêntica à 0018 em tudo o mais: régua de 50k, dedup preferindo Instagram, ordem
-- produção VM > 1M > Instagram > views. Mudar o RETURNS TABLE exige drop antes do create.
drop function if exists vm_cross_client_hits(uuid, int);
create function vm_cross_client_hits(p_cliente_id uuid, p_limit int default 12)
returns table(
  titulo text, assunto text, tema text, cliente_origem text,
  views bigint, data_publicacao date, storytelling_tipo text, hook_tipo text,
  vm_script boolean, link_video text
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
         (v.crm_script_id is not null) as vm_script,
         v.link_video
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
         c.an, c.plataforma, c.vm_script, c.link_video, t.tema
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
       d.vm_script, d.link_video
from dedup d
order by d.vm_script desc, (d.views >= 1000000) desc, (d.plataforma = 'Instagram') desc, d.views desc
limit p_limit;
$$;
