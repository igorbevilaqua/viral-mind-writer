-- Veredito do acervo por grupo de lições: a regra que o piloto pediu anda com vídeo bom,
-- com vídeo ruim, ou não separa. Escrito por scripts/testar-licoes.ts, lido no /ensinar ao
-- lado do botão de ativar, para a decisão deixar de ser no escuro.
--
-- Uma linha por GRUPO e não por lição: a regra é a mesma para todas as lições do grupo, e o
-- detector testa a regra, não o texto de cada uma.
create table if not exists vm_licao_vereditos (
  grupo text primary key,
  regra text not null,          -- o detector, em português, para a tela poder dizer o que mediu
  n_segue int not null,
  n_nao_segue int not null,
  lift numeric not null,
  lift_lb numeric not null,     -- limite inferior do IC 95%: é ele que decide, não o ponto
  lift_ub numeric not null,
  veredito text not null check (veredito in ('confirma','contraria','nao_separa','amostra_fina')),
  medido_em timestamptz not null default now()
);

comment on table vm_licao_vereditos is
  'Teste das regras do /ensinar contra o acervo (coeficiente_viral, quartil no estrato cliente x plataforma). O veredito informa a decisão humana, nunca ativa lição sozinho: os efeitos medidos ficam na casa de 5%.';
