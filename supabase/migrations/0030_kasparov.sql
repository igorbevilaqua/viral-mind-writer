-- 0030 (plano 018, peça 4 da 2.0): threads de conversa com o Kasparov.
--
-- Tabela e não coluna jsonb, por decisão do Igor em 2026-08-16 (item 17 do 2.0-decisoes):
-- há consulta por thread e ordenação por turno, que é justamente o que o precedente de jsonb
-- da casa (vm_modelagem_analyses.analysis, vm_generated_scripts.verificacao) não cobre.
--
-- O QUE ESTA TABELA NÃO É: memória do modelo. O contexto de cada turno é o ESTADO DO SISTEMA
-- (playbooks + lições ativas + prefs + roteiro aberto), nunca o histórico — 018 §4. Isso é o
-- que mantém o custo por turno constante e o que garante que nada sobreviva fora das quatro
-- casas da peça 1: se uma conclusão importa, ela vira lição; se não virou, deve ser esquecida.
-- Guardar as mensagens aqui serve para o USUÁRIO reler, não para o Kasparov lembrar.
-- Thread velha é descartável por construção.

create table if not exists vm_kasparov_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  client_id uuid,                    -- null = conversa sem cliente selecionado
  -- assunto corrente, reescrito a cada turno: é a ÚNICA linha da conversa que entra no
  -- contexto do turno seguinte (§4), e o que dá título à thread na lista.
  assunto text,
  -- roteiro em discussão, quando o debate nasceu de um. Sem FK forte: a thread sobrevive
  -- ao roteiro ser regerado, e o §4 já trata roteiro ausente.
  script_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vm_kasparov_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references vm_kasparov_threads(id) on delete cascade,
  papel text not null check (papel in ('usuario', 'kasparov')),
  conteudo text not null,
  -- turno dentro da thread. Explícito e não derivado de created_at: duas mensagens no mesmo
  -- milissegundo ordenariam por acaso, e a ordem da conversa é o único índice que importa.
  ordem int not null,
  created_at timestamptz not null default now(),
  unique (thread_id, ordem)
);

-- A consulta que justifica a tabela: as mensagens de UMA thread, na ordem do debate.
create index if not exists vm_kasparov_messages_thread_idx
  on vm_kasparov_messages (thread_id, ordem);

-- Lista de conversas do usuário, mais recente primeiro.
create index if not exists vm_kasparov_threads_user_idx
  on vm_kasparov_threads (user_id, updated_at desc);
