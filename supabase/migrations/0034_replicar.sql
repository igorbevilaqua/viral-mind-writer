-- 0034: REPLICAR — o segundo modo de usar um material de referência.
--
-- MODELAR (o que a UI chamava de "modelagem"): a autópsia extrai a arquitetura transferível e
-- a sala reinterpreta — storytelling propõe narrativas, Dados escolhe, o roteirista escreve com
-- liberdade dentro da estrutura.
--
-- REPLICAR: a estrutura do original NÃO está em discussão. O roteiro segue os beats do original
-- na mesma ordem, com a mesma função e a mesma proporção de duração; o trabalho é frase a frase
-- (palavra mais simples, palavra mais forte, contraste onde havia só afirmação, no máximo 2 dados
-- novos que somem à tese). Storytelling e agente Dados são PULADOS — a narrativa é montada em
-- código a partir do esqueleto da autópsia (lib/pipeline/replicar.ts).
--
-- `is_modelagem` continua sendo a flag "este anexo é a referência estrutural", e continua `true`
-- nos DOIS modos: todo o código que já testa `is_modelagem` (contexto, filtros de material,
-- transcrição, premissa, procedência) segue funcionando sem tocar. Só os ramos que precisam
-- divergir leem `modo`.

alter table vm_attachments
  add column if not exists modo text check (modo in ('modelar','replicar'));

comment on column vm_attachments.modo is
  'Só faz sentido quando is_modelagem = true. NULL É LIDO COMO ''modelar'' — é o que mantém todas as sessões anteriores à 0034 válidas sem backfill, e por isso o app grava a coluna só quando o modo é ''replicar'' (lib/actions.ts). ''replicar'' = seguir o original beat a beat, sem storytelling nem ranking de narrativas; ''modelar'' = usar a arquitetura dele para outro tema.';

-- Sem índice e sem unique: a regra "no máximo 1 anexo em Replicar por sessão" é uma decisão de
-- PRODUTO (relação 1:1 com o material), garantida na UI, e o pipeline já degrada sozinho quando
-- chega mais de um (fica com o primeiro e registra o descarte no rastro). Um unique parcial aqui
-- transformaria uma escolha de formulário em erro 23505 no meio da criação de sessão.
