-- O hook era salvo duas vezes: na coluna `hook` e como 1º parágrafo de `roteiro`,
-- então aparecia duplicado na tela (e as duas cópias divergiam ao editar só uma).
-- Agora a coluna `hook` é a fonte única e `roteiro` guarda só o desenvolvimento.
-- Backfill das linhas antigas: corta o prefixo só quando ele é EXATAMENTE o hook.
update vm_generated_scripts
set roteiro = ltrim(substr(roteiro, length(hook) + 1), E' \n\r\t')
where hook is not null
  and hook <> ''
  and left(roteiro, length(hook)) = hook
  and length(roteiro) > length(hook);
