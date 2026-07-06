-- Alinha o schema ao Checklist Codex V1: headline (texto de tela, ≤9 palavras)
-- e fontes (uma por linha, para cada dado específico do roteiro).
-- Aplicada no Viral Data como "vm_scripts_headline_fontes".
alter table vm_generated_scripts add column headline text, add column fontes text;
