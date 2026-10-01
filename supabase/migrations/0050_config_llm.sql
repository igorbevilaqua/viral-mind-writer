-- ─── Quem pensa cada parte do Codex vira configuração, não deploy ──────────
-- 01/10/2026.
--
-- O Codex chama modelo em ~30 lugares, e até aqui a escolha vivia em duas constantes de
-- módulo (WRITER_MODEL e ANALYST_MODEL) mais uma do Grok. Trocar o modelo da crítica, ou
-- descobrir quanto custaria rodar a checagem de fatos no Haiku, era mexer em código e esperar
-- deploy. Agora é um select numa tela que só o adm abre.
--
-- APPEND-ONLY, como a 0036. Uma linha por decisão e a mais recente de cada função vale. O
-- histórico não é luxo aqui: trocar o modelo da escrita muda o custo e a voz do produto ao
-- mesmo tempo, e "quando foi que isso mudou, e quem mudou" é a primeira pergunta quando a
-- conta sobe ou o roteiro estranha. Update in-place apagaria exatamente essa resposta.
--
-- FUNÇÃO E MODELO SEM CHECK. A lista válida dos dois vive em lib/llm-catalogo.ts, porque é a
-- mesma lista que desenha a tela e que filtra as opções por capacidade (metade das funções
-- arranca JSON por tool forçada, e a geração 5.5 rejeita tool forçada com 400). Repetir isso
-- num constraint daria duas definições para divergirem, e a do banco só apareceria como uma
-- recusa inexplicável no dia de adicionar um modelo novo. Quem valida é a server action, na
-- fronteira, contra o catálogo.
create table if not exists vm_config_llm (
  id uuid primary key default gen_random_uuid(),
  funcao text not null,
  modelo text not null,
  decidido_por uuid,
  created_at timestamptz not null default now()
);

create index if not exists vm_config_llm_funcao_idx on vm_config_llm (funcao, created_at desc);

comment on table vm_config_llm is
  'Modelo escolhido por função do Codex (lib/llm-catalogo.ts FUNCOES_LLM). Append-only: a linha mais recente de cada funcao vale. Função sem linha nenhuma usa o padrão do catálogo.';

comment on column vm_config_llm.decidido_por is
  'auth.users.id do adm que trocou. Sem FK: é rastro, não relação — a decisão sobrevive ao usuário sair.';

-- Mesmo padrão de 0011/0015/0035/0036: RLS habilitado SEM policy = só service role. Este
-- projeto Supabase é compartilhado, e escrever aqui é trocar quem pensa pelo produto inteiro.
alter table vm_config_llm enable row level security;
