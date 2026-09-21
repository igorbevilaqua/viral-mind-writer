-- ─── O cross-post IG/FB vira UM vídeo, com as duas redes visíveis ──────────
-- 20/09/2026.
--
-- O QUE ESTAVA ERRADO. Um Reel publicado no Instagram e replicado no Facebook entrava duas
-- vezes no repertório do cliente: uma como post do IG, outra como vídeo do FB. São 597 casos
-- em 10 clientes, conferidos um a um contra os links das duas redes. O efeito não era só na
-- tela: a cópia de baixo alcance entrava no ranking de tema, hook e comando que a sala de
-- agentes lê, contando o mesmo conteúdo duas vezes, uma delas com número pequeno.
--
-- NÃO É SOMAR E ESQUECER. `views_rede` e `views_fb_espelho` ficam separadas. Quem estuda o
-- cliente continua vendo quanto rendeu em cada rede, e ganha o que não existia: `cross_post`
-- diz que aquele conteúdo rodou nas duas. Em 311 dos 597 o Facebook rendeu pelo menos metade
-- do Instagram (o maior fez 1.309.475 views lá), e até hoje esse sinal era invisível porque
-- o Codex não sabia que os dois vídeos eram o mesmo.
--
-- A REGRA DO FACEBOOK É A DO ORÁCULO, NÃO UMA NOVA. 19 dos 597 posts do Instagram já trazem
-- `fb_views_no_dia` próprio (um com 199.682). Somar o gêmeo por cima contaria o Facebook duas
-- vezes. Quando o post do IG tem medição própria, ela vale e o gêmeo é ignorado; senão as
-- views do gêmeo entram. É o que `oraculo.fato_video` faz desde a migration 0026 de lá.
--
-- O RANKING PASSA A SER POR REDE (decisão do dono, 20/09/2026). O número que ordena tema,
-- hook e comando é `views_rede`: as views na PRÓPRIA rede do post. Post do Instagram ranqueia
-- pelo Instagram, que é a rede que o cliente quer crescer e a que o Cockpit já pesa em dobro
-- na nota de saúde. O Facebook espelhado fica ao lado como contexto, fora da ordenação.
-- Post de TikTok ou YouTube ranqueia pela própria rede: ranquear tudo por Instagram apagaria
-- o repertório inteiro de quem publica fora dele.
--
-- `views_total` sobrevive e continua sendo rede + espelho. Quem mede ENTREGA (o roteiro que
-- escrevemos rendeu quanto, `vm_published_scripts`) quer o alcance real do conteúdo; quem
-- mede REPERTÓRIO (o que funciona para este cliente) quer a rede. São perguntas diferentes.

-- ── A matview: uma linha por vídeo de verdade ──────────────────────────────
-- Colunas novas → drop antes do create. O ETL chama vm_refresh_video_stats no início do run,
-- então a MV volta populada sem passo manual.
drop materialized view if exists vm_video_stats cascade;

create materialized view vm_video_stats as
select v.id as video_id,
       v.canal_id,
       ca.cliente_id,
       ca.plataforma::text as plataforma,
       -- views_no_dia/fb_views_no_dia são SNAPSHOT ACUMULADO (total até o dia), não delta →
       -- total do vídeo = pico do contador (max), NUNCA soma dos dias (inflava ~Ndias×).
       coalesce(md.views, 0)::bigint as views_rede,
       -- O Facebook deste mesmo conteúdo: medição própria do post quando existe, senão o
       -- gêmeo. Nunca as duas — são duas leituras da mesma coisa.
       --
       -- SÓ PARA POST DO INSTAGRAM. 31 vídeos do TikTok têm fb_views_no_dia preenchido (até
       -- 9.887 views), que é ruído de coleta: vídeo do TikTok não tem alcance no Facebook. A
       -- definição anterior somava isso em views_total sem dizer a ninguém. E num vídeo cujo
       -- canal JÁ é o Facebook, views_rede é o Facebook — somar de novo contaria duas vezes.
       fb.espelho::bigint as views_fb_espelho,
       (coalesce(md.views, 0) + fb.espelho)::bigint as views_total,
       (par.fb_video_id is not null or fb.espelho > 0) as cross_post,
       mr.seguidores_ganhos,
       mr.retencao_hook,
       mr.retencao_final
from videos v
join canais ca on ca.id = v.canal_id
-- O gêmeo do Facebook não é vídeo: é o mesmo conteúdo, e está fundido no post do Instagram.
left join oraculo.cross_post_par gemeo_de on gemeo_de.fb_video_id = v.id
left join oraculo.cross_post_par par on par.ig_video_id = v.id
left join lateral (
  select max(m.views_no_dia) as views, max(m.fb_views_no_dia) as fb_views
  from metricas_diarias m where m.video_id = v.id
) md on true
left join lateral (
  select max(m.views_no_dia) + coalesce(max(m.fb_views_no_dia), 0) as views
  from metricas_diarias m where m.video_id = par.fb_video_id
) gem on true
left join lateral (
  select case when ca.plataforma <> 'Instagram' then 0
              when coalesce(md.fb_views, 0) > 0 then coalesce(md.fb_views, 0)
              else coalesce(gem.views, 0) end as espelho
) fb on true
left join lateral (
  -- última leitura de retenção do vídeo (mesmo padrão de 0005/0007)
  select nullif(regexp_replace(r.seguidores_ganhos::text, '[^0-9-]', '', 'g'), '')::bigint as seguidores_ganhos,
         r.retencao_hook::numeric as retencao_hook,
         r.retencao_final::numeric as retencao_final
  from metricas_retencao r where r.video_id = v.id
  order by r.data desc nulls last limit 1
) mr on true
where gemeo_de.fb_video_id is null;

comment on materialized view vm_video_stats is
  'Uma linha por vídeo do corpus, com o cross-post IG/FB já fundido. views_rede = a própria rede do post (é o número que ranqueia repertório); views_fb_espelho = o mesmo conteúdo no Facebook; views_total = os dois. Refresh por vm_refresh_video_stats, no início do run do ETL.';

create unique index vm_video_stats_video_id_idx on vm_video_stats (video_id);
create index vm_video_stats_cliente_idx on vm_video_stats (cliente_id);

-- ── As funções: ranqueiam por views_rede, e o gêmeo some das contagens ─────
-- POR QUE SUBSTITUIÇÃO E NÃO REESCRITA. A primeira versão desta migration reescrevia as seis
-- funções por inteiro, copiando o corpo da 0013. Ao aplicar, o Postgres recusou: a
-- vm_cross_client_hits em produção tem duas colunas (`vm_script`, `link_video`) que a 0026
-- acrescentou depois. vm_client_insights e vm_client_class_videos também mudaram na 0017,
-- 0018 e 0042. Reescrever a partir da migration que introduziu a função apagaria tudo que
-- veio depois — e o erro só apareceu porque a transação abortou inteira.
--
-- Então a mudança é cirúrgica: lê a definição VIGENTE de cada função e troca duas coisas.
--   `left join vm_video_stats st` → `join ...`  : o gêmeo já não existe na MV, e o inner
--       join tira da conta o vídeo que sumiu dela.
--   `st.views_total` → `st.views_rede`          : o ranking de repertório passa a ser por
--       rede. vm_published_scripts fica de fora: mede ENTREGA (o roteiro rendeu quanto), e aí
--       o alcance real do conteúdo é o total, rede + espelho.

do $mig$
declare f record; novo text; n int := 0;
begin
  for f in
    select p.oid, p.proname from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public'
      and p.proname in ('vm_client_panel','vm_client_insights','vm_cross_client_hits',
                        'vm_client_class_videos','vm_client_hook_examples','vm_published_scripts')
  loop
    novo := pg_get_functiondef(f.oid);
    novo := replace(novo, 'left join vm_video_stats st', 'join vm_video_stats st');
    if f.proname <> 'vm_published_scripts' then
      novo := replace(novo, 'st.views_total', 'st.views_rede');
    end if;
    execute novo;
    n := n + 1;
  end loop;
  raise notice 'funcoes recriadas: %', n;
end
$mig$;

-- ── A contagem de vídeos do painel ─────────────────────────────────────────
-- `total_videos`, `videos_analisados` e `videos_30d` saem da CTE `vids`, que lê `videos` e
-- não a matview: sem este join o gêmeo do Facebook continuaria contado e a tela ficaria
-- inconsistente consigo mesma — média corrigida, contagem não. Medido antes do ajuste:
-- Fernando Pereira mostrava 613 vídeos com 494 na matview.
--
-- O `if position(...) = 0 then raise` existe porque esta é uma substituição de texto sobre a
-- definição vigente: no dia em que outra migration reescrever a CTE `vids`, isto falha alto
-- em vez de aplicar pela metade em silêncio.
do $mig$
declare novo text; antes text; alvo oid;
begin
  select p.oid into alvo from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public' and p.proname = 'vm_client_panel';

  antes := 'with vids as (
  select v.id, v.data_publicacao, v.categorias,
         coalesce(v.analise->''analise'', v.analise) as an
  from videos v
  join canais ca on ca.id = v.canal_id and ca.cliente_id = p_cliente_id
),';

  novo := pg_get_functiondef(alvo);
  if position(antes in novo) = 0 then
    raise exception 'a CTE vids do vm_client_panel nao bate com o esperado — nada alterado';
  end if;

  novo := replace(novo, antes, 'with vids as (
  select v.id, v.data_publicacao, v.categorias,
         coalesce(v.analise->''analise'', v.analise) as an
  from videos v
  join canais ca on ca.id = v.canal_id and ca.cliente_id = p_cliente_id
  join vm_video_stats stv on stv.video_id = v.id
),');
  execute novo;
end
$mig$;

-- FICA PENDENTE, de propósito: o bloco `cross_post` no payload do vm_client_panel (quantos
-- vídeos rodaram nas duas redes, média em cada uma, quantos renderam metade ou mais no
-- Facebook). São 311 dos 597 e é o sinal novo que esta migration torna possível, mas
-- acrescentá-lo exige reescrever o jsonb_build_object inteiro — a operação que esta migration
-- acabou de aprender a não fazer às cegas. Entra numa migration própria, com a definição
-- vigente em mãos.
-- ponytail: os dados já estão na MV (views_rede, views_fb_espelho, cross_post); falta só expor.
