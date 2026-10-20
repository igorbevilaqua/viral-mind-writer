-- supabase/migrations/0055_roteiro_crm.sql
-- Plano 024, 4.1. Liga o roteiro do Codex ao roteiro do CRM em que ele foi colado à mão.
-- Quem grava é casarComCrm() (lib/script-matches.ts), no ETL semanal: 5-gramas ≥ 0,08 contra
-- scripts.script_text do CRM. O vídeo continua em vm_script_matches (metodo 'crm_shingle'),
-- achado por videos.crm_script_id, que o coletor preenche. Sem FK: o CRM é outro projeto.
alter table vm_generated_scripts
  add column if not exists crm_script_id uuid,
  add column if not exists crm_sobreposicao real; -- fração dos 5-gramas do Codex no texto do CRM

create index if not exists vm_generated_scripts_crm_idx on vm_generated_scripts (crm_script_id);
