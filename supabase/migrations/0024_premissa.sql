-- A premissa é o argumento que o vídeo defende (1-2 frases, afirmativa). Ela não existia no
-- sistema: a unidade de ideia era a NARRATIVA CANDIDATA (personagem + conflito + emoção), que
-- é forma narrativa, não tese. Sem tese declarada o roteirista fabrica tensão frase a frase, e
-- a forma mais barata de fabricar tensão é negar algo — a origem da antítese ("não é X, é Y").
--
-- Hierarquia: premissa → narrativa → pesquisa → hook. A narrativa SERVE a premissa; a pesquisa
-- busca o que a confirma e enriquece; hook contraintuitivo nasce dela.
alter table vm_sessions add column if not exists premissa text;

-- De onde a premissa veio. Importa para a garantia: 'digitada' significa que NENHUM modelo
-- tocou o texto (o nó de derivação é pulado), então não há deriva possível.
alter table vm_sessions add column if not exists premissa_origem text; -- digitada|modelagem|derivada

comment on column vm_sessions.premissa is
  'Argumento central do vídeo, 1-2 frases. Congelado: todo estágio recebe esta string literal.';
comment on column vm_sessions.premissa_origem is
  'digitada (usuário, adotada verbatim) | modelagem (extraída do original e confirmada) | derivada (nó premissa a partir do tema)';

-- status ganha 'aguardando_premissa' (a coluna é text livre, sem check — nada a alterar):
-- em modo modelagem o run 1 extrai a tese do original e PARA; confirmarPremissa dispara o run 2,
-- que reusa vm_sessions.artifacts. Duas execuções normais no lugar de uma suspensa — sem fila,
-- sem motor de pause/resume.
comment on column vm_sessions.status is
  'draft|generating|aguardando_premissa|done|error|closed';
