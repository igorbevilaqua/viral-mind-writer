-- 0032: carrossel do Instagram como fonte/modelagem.
--
-- Por que um `kind` novo e não reusar 'video_link': num reel o conteúdo está no áudio e a
-- transcrição resolve; num carrossel o conteúdo está ESCRITO nas imagens e a leitura é por visão
-- (lib/carrossel.ts). São dois caminhos de código diferentes, e a tela precisa dizer qual é qual —
-- guardar carrossel como 'video_link' faria o campo pedir "cole a transcrição do vídeo" para uma
-- coisa que não tem áudio, e o registro mentiria para quem consultasse o banco depois.
alter table vm_attachments drop constraint if exists vm_attachments_kind_check;
alter table vm_attachments add constraint vm_attachments_kind_check
  check (kind in ('reference_script','news_link','document','video_link','carousel_link'));
