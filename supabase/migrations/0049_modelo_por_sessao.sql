-- ─── Quem escreve o roteiro passa a ser escolha da sessão ──────────────────
-- 01/10/2026.
--
-- O writer saiu do fable-5 para o opus-5-5 (US$ 4/20 por MTok contra 10/50, mesmo contexto de
-- 1M). Mais barato não é melhor para tudo: fable é a linha literária da casa e opus é de
-- raciocínio e trabalho agêntico. Em vez de decidir pelos dois no deploy, a escolha desce
-- para quem conjura — o seletor da home grava aqui.
--
-- NULL É RESPOSTA, NÃO BURACO. As 2.000+ sessões que já existem não ganham modelo retroativo:
-- elas foram escritas pelo fable, mas quem diz isso é pipeline_trace.usage, que grava o modelo
-- por fase desde sempre. Null aqui quer dizer "não escolheu", e o pipeline cai no WRITER_MODEL
-- do servidor — mudar a env move essas sessões sem tocar em nenhuma linha.
--
-- SEM CHECK CONSTRAINT. A lista válida vive em lib/generation.ts (MODELOS_ESCRITA) porque é a
-- mesma lista que a tela desenha; duplicá-la num constraint daria duas definições para
-- divergirem, e a errada só apareceria quando um modelo novo fosse recusado pelo banco.
alter table public.vm_sessions add column if not exists modelo text;

comment on column public.vm_sessions.modelo is
  'Modelo de escrita escolhido na criação (lib/generation.ts MODELOS_ESCRITA). Null = WRITER_MODEL do servidor.';
