-- supabase/migrations/0028_rpc_gravar_ensinamento.sql
-- Ensino confirmado na sessão grava DUAS linhas: vm_lessons (as palavras cruas) e
-- vm_lesson_learnings (a regra roteada por destinatário). Escrita parcial — a primeira grava,
-- a segunda falha no CHECK de dimensao/origem — deixa lição órfã, que significa "acreditei que
-- ensinei e não ensinei": o defeito que a peça 015 existe para matar (§8). Por isso as duas
-- inserts moram no corpo de uma função plpgsql: uma transação só, tudo ou nada.

create or replace function vm_gravar_ensinamento(
  p_client_id uuid,
  p_session_url text,
  p_texto_cru text,
  p_titulo text,
  p_descricao text,
  p_dimensao text,
  p_destinatarios text[],
  p_evidencia text
) returns uuid
language plpgsql
volatile
set search_path = public
as $$
declare
  v_lesson_id uuid;
  v_learning_id uuid;
begin
  -- transcript null: ensino declarativo não tem transcrição (a 0027 tirou o not null).
  -- source_title preenchido de propósito: /ensinar cai em `transcript.slice(0, 90)` quando o
  -- título é null, e transcript agora pode ser null.
  -- context_note recebe o texto cru LITERAL (§5): sem ele não há como auditar depois se a sala
  -- entendeu o que o usuário disse ou reescreveu por conta própria.
  insert into vm_lessons (client_id, source_kind, source_url, source_title, transcript, context_note)
  values (p_client_id, 'sessao', p_session_url, p_titulo, null, p_texto_cru)
  returning id into v_lesson_id;

  -- active := true só nesta porta (origem 'ensino'): a confirmação humana na sessão É a curadoria
  -- (§6.4). Lição extraída por máquina continua active:false na fila do /ensinar — esta migration
  -- não toca nas 28 existentes.
  insert into vm_lesson_learnings
    (lesson_id, dimensao, destinatarios, titulo, descricao, evidencia, origem, active)
  values (v_lesson_id, p_dimensao, p_destinatarios, p_titulo, p_descricao, p_evidencia, 'ensino', true)
  returning id into v_learning_id;

  return v_learning_id;
end;
$$;

comment on function vm_gravar_ensinamento is
  'Ensino confirmado em sessão: vm_lessons + vm_lesson_learnings numa transação só. Retorna o id do learning. Plano 015 §8.';
