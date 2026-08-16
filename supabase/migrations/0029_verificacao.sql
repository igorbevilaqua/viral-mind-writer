-- 0029 (plano 017, peça 3 da 2.0): resultado da verificação factual do roteiro final.
--
-- Coluna e não tabela, por decisão do Igor em 2026-08-16 (item 7 do 2.0-decisoes):
-- é UM registro por roteiro, sobrescrito a cada rodada, sem histórico pedido e sem consulta
-- cruzada. Tabela com FK seria estrutura para uma consulta que ninguém vai fazer.
-- Precedente direto: vm_modelagem_analyses.analysis (0001_init), que guarda uma análise
-- estruturada inteira e é renderizada por AnalysisSections.
--
-- Promover a tabela depois, se alguém quiser série histórica, é migration simples. O
-- contrário — nascer com tabela e nunca consultar — é custo que não volta.
--
-- Forma do jsonb (017 §9). `rastreadas` são as que o filtro de delta deixou passar SEM
-- verificar: é a contagem que mostra o regime C funcionando, e ela some se só o total for
-- guardado. `excedentes` são as que estouraram o teto da rodada — listadas como "não
-- verificada", nunca omitidas.
--
-- {
--   at, regime: 'delta' | 'completa', dossie_presente: bool,
--   total_alegacoes, rastreadas, verificadas, excedentes,
--   itens: [ { alegacao, trecho_literal, veredicto, fonte, correcao, explicacao, aplicada } ]
-- }
alter table vm_generated_scripts add column if not exists verificacao jsonb;

-- Índice só pelo veredicto agregado, para a pergunta que o produto vai fazer de verdade
-- ("quais roteiros têm alegação falsa?"). Sem GIN no jsonb inteiro: o campo é lido por id
-- na tela do roteiro, e índice que ninguém consulta é custo de escrita em toda geração.
create index if not exists vm_generated_scripts_verificacao_regime_idx
  on vm_generated_scripts ((verificacao->>'regime'))
  where verificacao is not null;
