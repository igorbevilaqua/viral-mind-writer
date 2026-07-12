-- Plano 012 WP-A: lock otimista de geração + unicidade de versão por sessão.
-- generation_started_at é setado no update condicional que assume a geração;
-- leitura trata generating >10min como interrompida (recuperável).
alter table vm_sessions add column if not exists generation_started_at timestamptz;

-- Duas gerações concorrentes não podem gravar a mesma version — o insert do
-- pipeline trata o 23505 recalculando a version e tentando de novo.
-- Antes do índice: renumera versões APENAS nas sessões que têm duplicata
-- (ordem de criação preservada; sessões sãs não mudam).
with dup_sessions as (
  select session_id
  from vm_generated_scripts
  group by session_id, version
  having count(*) > 1
),
renum as (
  select id,
         row_number() over (partition by session_id order by version, created_at, id) as rn
  from vm_generated_scripts
  where session_id in (select session_id from dup_sessions)
)
update vm_generated_scripts g
set version = renum.rn
from renum
where g.id = renum.id and g.version <> renum.rn;

create unique index if not exists vm_generated_scripts_session_version_key
  on vm_generated_scripts (session_id, version);
