-- supabase/migrations/0037_backfill_destinatarios_orfaos.sql
-- Conserta as lições que nasceram órfãs DEPOIS da 0027.
--
-- A 0027 criou `destinatarios` com default '{}' e rodou um backfill de uma vez só. Dos cinco
-- caminhos que escrevem em vm_lesson_learnings, só o RPC do botão Ensinar (0028) preenchia a
-- coluna; os quatro de máquina (encerramento de sessão, correção na sala, curador mensal,
-- lição manual) deixavam no default. Como `licoesPara` (lib/pipeline/agents.ts) roteia por
-- `destinatarios.includes(agente)`, array vazio não casa com agente nenhum: a lição aparecia
-- em /ensinar, o adm ativava, e ela não chegava a prompt algum. Sem erro e sem log.
--
-- O conserto do código está em `comDestinatarios` (lib/pipeline/destinatarios.ts), aplicado
-- nos quatro inserts. Esta migration recupera só o que já está gravado.
--
-- Mesmo `case` da 0027 e mesmo motivo para não ter `else`: dimensão fora do mapa devolve NULL,
-- a coluna é not null, e a migration aborta. Falha barulhenta é melhor que lição roteada para
-- o agente errado em silêncio.
update vm_lesson_learnings set destinatarios = (case dimensao
  when 'hook'         then '{hook,dados}'
  when 'storytelling' then '{storytelling,modelagem,dados}'
  when 'tema'         then '{storytelling,modelagem,premissa,dados}'
  when 'ritmo'        then '{roteirista,dados}'
  when 'comando'      then '{comando,dados}'
  when 'geral'        then '{roteirista,premissa,dados}'
end)::text[]
where destinatarios = '{}';
