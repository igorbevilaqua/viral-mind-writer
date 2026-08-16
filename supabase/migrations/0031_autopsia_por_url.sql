-- 0031 (plano 018 §7.2, decisão 18): destrava a autópsia da sessão.
--
-- Até aqui toda autópsia era filha de um anexo: `attachment_id` NOT NULL. Vídeo debatido com
-- o Kasparov não nasce de sessão, logo não tem anexo — não tinha onde ser gravado e cada
-- debate sobre o mesmo vídeo pagava transcrição + autópsia de novo.
--
-- AS DUAS CHAVES CONVIVEM. Nenhuma cobre o caso da outra:
--   • attachment_id — única chave das 13 autópsias já pagas, e a única possível para anexo
--     sem url (roteiro de referência colado: 3 dos 13 registros hoje);
--   • video_url — única chave possível para o vídeo avulso do Kasparov.
-- O lookup em lib/pipeline/modelagem.ts consulta as duas num `or`.

alter table vm_modelagem_analyses
  add column if not exists video_url text;

alter table vm_modelagem_analyses
  alter column attachment_id drop not null;

-- Backfill: as autópsias já pagas passam a ser reusáveis TAMBÉM por URL — o Kasparov não
-- paga de novo o que a sessão já pagou. As de anexo sem url continuam só com a chave velha.
update vm_modelagem_analyses m
   set video_url = a.url
  from vm_attachments a
 where a.id = m.attachment_id
   and a.url is not null
   and m.video_url is null;

-- Linha sem nenhuma das duas chaves seria autópsia impossível de reencontrar.
alter table vm_modelagem_analyses
  drop constraint if exists vm_modelagem_analyses_tem_chave;
alter table vm_modelagem_analyses
  add constraint vm_modelagem_analyses_tem_chave
  check (attachment_id is not null or video_url is not null);

-- ponytail: sem índice em video_url — o match é por id de plataforma (`ilike %pid%`, mesma
-- tática do lookupCorpus), que não usa btree, e a tabela tem 13 linhas. Se crescer, guardar o
-- pid normalizado numa coluna própria e indexar essa.
