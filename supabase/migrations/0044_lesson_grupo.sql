-- Agrupamento semântico das lições, para a fila do /ensinar virar uma lista de queixas
-- repetidas em vez de 126 itens soltos, e para o teto de 3 por agente escolher por
-- recorrência em vez de por data de criação (o critério de hoje, em context.ts).
--
-- Coluna nova e não `cluster_chave`: aquela é chave LITERAL de troca de termo
-- (`cliente|tipo|termo_de|termo_para`, edit-diff.ts) e só descreve edição de vocabulário.
-- Lição de correção nasce de texto livre e não tem termo_de/termo_para.
alter table vm_lesson_learnings add column if not exists grupo text;

comment on column vm_lesson_learnings.grupo is
  'Tema em que a lição se repete (kebab-case). Preenchido por scripts/agrupar-licoes.ts. O tamanho do grupo é a recorrência: quantas vezes o piloto pediu a mesma coisa.';

create index if not exists vm_lesson_learnings_grupo_idx on vm_lesson_learnings (grupo);
