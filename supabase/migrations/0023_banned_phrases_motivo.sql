-- vm_banned_phrases guardava só a string proibida, nunca o motivo. Sem motivo a regra não
-- generaliza (a banlist tinha "não é [^.,;!?]{1,50}, é " e passou batido em
-- "não são um ataque de raiva. Aquilo é um plano") e não sabe abrir exceção (bane
-- "acredite ou não" mas a casa QUER "você não vai acreditar" — mesma família, veredito
-- oposto). O motivo vai junto da regra no prompt: o modelo passa a saber o que evitar
-- quando a string exata não aparece.
alter table vm_banned_phrases add column if not exists motivo text;

-- Backfill por família. Deliberadamente por grupo, não por linha: o motivo é a razão da
-- FAMÍLIA, e é isso que permite generalizar para variantes não cadastradas.
update vm_banned_phrases set motivo =
  'Antítese: afirma uma relação sem argumentá-la. Trocar a vírgula por ponto, pluralizar ou '
  'interpor pronome ("não são X. Aquilo é Y") é a MESMA construção — igualmente proibida. '
  'Afirme direto o que É.'
where pattern like '%não é%' or pattern like '%não e %';

update vm_banned_phrases set motivo =
  'Falsa exclusividade: promete informação secreta que o roteiro não entrega. Se o dado é '
  'realmente pouco conhecido, mostre o dado — não anuncie que ele é raro.'
where pattern ~ 'ninguém|pouca gente|quase ninguém|o segredo que';

update vm_banned_phrases set motivo =
  'Hipérbole vazia de LLM: adjetiva o impacto em vez de mostrá-lo. Troque pelo fato que '
  'justificaria o adjetivo (número, consequência concreta).'
where pattern ~ 'brutal|muda tudo|muda o jogo|game.?changer|divisor de águas|turbinar';

update vm_banned_phrases set motivo =
  'Marcador de oralidade postiça: imita intimidade sem construí-la, e some sem prejuízo '
  'nenhum para a frase. Corte e vá direto ao conteúdo.'
where pattern ~ 'a real é que|a verdade é que|vamos ser honestos|sem rodeios|deixa eu te contar|mas calma|pega essa|não se engane|acredite ou não';

update vm_banned_phrases set motivo =
  'Calco de inglês ou jargão de internet: quebra o registro de brasileiro falando.'
where pattern ~ 'no final do dia|plot twist|spoiler:|vamos mergulhar|desvendar';

update vm_banned_phrases set motivo =
  'Intensificador que não intensifica: ocupa espaço de fala e enfraquece a frase. Corte.'
where pattern ~ 'literalmente|simplesmente|não é exagero';

-- Rede de segurança: nenhuma regra fica sem motivo (o prompt renderiza "— motivo" só quando existe,
-- mas uma regra muda é uma regra que o modelo não sabe estender).
update vm_banned_phrases
set motivo = 'Clichê de IA: construção estatisticamente provável que denuncia texto gerado. Reescreva a frase inteira, não troque sinônimo.'
where motivo is null;
