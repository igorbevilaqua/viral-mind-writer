-- ─── O painel do cliente passa a mostrar o que rodou nas duas redes ────────
-- 21/09/2026. A 0047 fundiu o cross-post IG/FB num vídeo só e guardou as duas redes separadas
-- (views_rede, views_fb_espelho, cross_post), mas o painel não expunha nada disso: o sinal
-- existia no banco e não chegava a ninguém.
--
-- É o sinal que a 0047 tornou possível. Em 311 dos 597 pares o Facebook rendeu pelo menos
-- metade do Instagram, e até então o Codex via dois vídeos sem relação nenhuma: a pergunta
-- "o que funcionou nas DUAS redes?" não tinha como ser feita.
--
-- SUBSTITUIÇÃO SOBRE A DEFINIÇÃO VIGENTE, e não reescrita. A 0047 aprendeu isso do jeito
-- ruim: a primeira versão dela copiava o corpo da 0013 e teria apagado as colunas que a 0026
-- acrescentou, além das mudanças de 0017, 0018 e 0042. As duas âncoras abaixo falham alto se
-- alguém mudar a CTE `vids` ou o payload, em vez de aplicar pela metade em silêncio.

do $mig$
declare novo text; a1 text; a2 text; alvo oid;
begin
  select p.oid into alvo from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public' and p.proname = 'vm_client_panel';
  novo := pg_get_functiondef(alvo);

  -- 1. a CTE carrega as colunas por rede que a matview já tem
  a1 := '  select v.id, v.data_publicacao, v.categorias,
         coalesce(v.analise->''analise'', v.analise) as an
  from videos v
  join canais ca on ca.id = v.canal_id and ca.cliente_id = p_cliente_id
  join vm_video_stats stv on stv.video_id = v.id';
  if position(a1 in novo) = 0 then raise exception 'CTE vids fora do formato esperado - nada alterado'; end if;
  novo := replace(novo, a1, '  select v.id, v.data_publicacao, v.categorias,
         coalesce(v.analise->''analise'', v.analise) as an,
         stv.views_rede, stv.views_fb_espelho, stv.cross_post
  from videos v
  join canais ca on ca.id = v.canal_id and ca.cliente_id = p_cliente_id
  join vm_video_stats stv on stv.video_id = v.id');

  -- 2. o bloco novo, logo depois das médias. `filter` vai DENTRO do avg: por fora, o Postgres
  -- recusa com "FILTER specified, but round is not an aggregate function".
  a2 := '''media_views_geral'', (select round(avg(views)) from vviews where views > 0),';
  if position(a2 in novo) = 0 then raise exception 'ancora media_views_geral nao encontrada - nada alterado'; end if;
  novo := replace(novo, a2, a2 || '
  ''cross_post'', (
    select jsonb_build_object(
      ''videos'', count(*),
      ''media_views_instagram'', round(avg(views_rede) filter (where views_rede > 0)),
      ''media_views_facebook'', round(avg(views_fb_espelho) filter (where views_fb_espelho > 0)),
      ''rendeu_metade_ou_mais_no_fb'', count(*) filter (where views_rede > 0 and views_fb_espelho::numeric / views_rede >= 0.5))
    from vids where cross_post),');

  execute novo;
end
$mig$;

-- Conferido em 21/09/2026, Fernando Pereira: 122 vídeos nas duas redes, média de 53.633 no
-- Instagram contra 12.950 no Facebook, 20 renderam metade ou mais.
