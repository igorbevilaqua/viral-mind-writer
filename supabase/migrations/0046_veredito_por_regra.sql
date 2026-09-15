-- Um grupo pode ser testado por mais de um detector: o grupo grande mistura várias regras
-- (personagem nomeado, contraste, virada) e cada uma se mede sozinha. A chave passa a ser
-- (grupo, regra) para as duas medidas coexistirem em vez de uma sobrescrever a outra.
alter table vm_licao_vereditos drop constraint vm_licao_vereditos_pkey;
alter table vm_licao_vereditos add primary key (grupo, regra);
