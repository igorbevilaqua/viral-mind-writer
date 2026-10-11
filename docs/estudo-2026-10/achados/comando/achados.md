# Bloco final (apresentação "Eu sou" + comando): o que converte em seguidor nos roteiros da casa

Base: vídeos VM analisáveis. Desfecho principal `seguidores` = vídeo no quartil superior de seguidores por mil views dentro do estrato cliente x rede (Instagram 1.268 vídeos, TikTok 250). Checagens: `comentarios`, `compart`, `coef`. Lift com Wilson, OR de Mantel-Haenszel por cliente x rede, descoberta (antes de 01/07/2026) x validação (depois). Dois controles extras em todo achado de seguidores: OR estratificado também pelo quartil de viralização (no Instagram, seguidor por mil views anda junto com viralizar: 44% de topo no quartil viral contra 14% a 24% nos outros) e OR com o percentil de seguidores recalculado por trimestre.

**Texto medido.** O `comando_video` (extraído por LLM) perde a apresentação em 41% dos vídeos em que ela foi dita e muitas vezes guarda só a última frase. Por isso li o fim da transcrição de cada vídeo (`videos.roteiro` no Viral Data, só leitura) e recortei o bloco final de verdade (o que o espectador ouviu). Nos números abaixo, "transcrição" é esse texto; "escrito" é o `bloco_final` do CRM; "LLM" é o `comando_video`.

## 1. Resumo em 10 linhas

1. O texto do comando é ajuste fino. O mesmo CTA, palavra por palavra, vai do pior ao melhor vídeo do cliente: em 59% dos grupos de CTA repetido o mesmo texto aparece no topo e na metade de baixo, e o texto explica no máximo 15% da variação de conversão. Quem faz seguir é o vídeo.
2. O que mais custa seguidor é pedir outra coisa no fim. "Comenta aqui...", "me conta..." derrubam a chance de topo em seguidores para menos da metade (lift 0,29 a 0,46; OR 0,22 a 0,36, replica) e não aumentam views; só dobram comentários (OR 3,7). Um vídeo, um pedido.
3. Prometa o território do canal, não o assunto do vídeo. CTA que vende o que o perfil entrega sempre converte mais (OR 1,45; 1,35 com todos os controles); CTA que repete palavras do hook ou do assunto do vídeo converte menos (OR 0,61 a 0,72, replica).
4. "Todo dia eu te mostro [território]" é a fórmula de maior conversão com volume (lift 1,29, OR 1,64, replica) e também puxa compartilhamento; perde parte da força quando controlo o trimestre (OR 1,42).
5. Fechar com "me segue aqui" converte mais que "segue o meu perfil" (OR 2,05, replica e resiste a todos os controles), mas o dado vem de 5 clientes: use e meça.
6. "Eu sou [Nome]" não ajuda nem atrapalha (OR 1,12 [0,78 a 1,60]). Mantenha curto; credencial só concreta e com número ("já treinei mais de 5 mil equipes"); título genérico (CEO, empreendedor serial, presidente do grupo) é pista negativa.
7. O playbook v2 não se confirma na casa: condicional + promessa específica (0,98), "mais conteúdo como esse" (0,91), apresentação (1,01), "para não perder o próximo vídeo" (1,04) e a faixa de 16 a 25 palavras (0,86) são neutros, inclusive com a régua do próprio v2. Parte do v2 nasceu de erro de medição: 91% dos "genéricos" do campo LLM tinham nome e promessa na fala.
8. Para compartilhamento, peça o envio a uma pessoa: "manda esse vídeo para alguém que..." dobra a chance de topo em compartilhamento (OR 3,1, replica) sem custo visível em seguidores.
9. "Se você gosta de / gostou desse conteúdo" é o pior condicional da casa (OR 0,17, replica; puxado por um cliente). Troque pela promessa do território.
10. Plataforma: o Instagram tem a evidência; o TikTok aponta para o mesmo lado com amostra pequena; no YouTube nenhum comando mexe no coef, e pedir comentário lá é pista de menos views (OR 0,61).

## 2. Achados

### A1. O mesmo CTA vai do pior ao melhor: o comando é ajuste fino, não alavanca
- **O que:** 71 grupos de vídeos do mesmo cliente x rede com o bloco final escrito idêntico (312 vídeos). A variância do percentil de seguidores dentro do grupo é 0,07, contra 0,08 no total: o texto do CTA explica no máximo 15% da variação (teto, porque o grupo também junta vídeos de época parecida). Em 59% dos grupos o mesmo CTA tem vídeo no quartil de cima e vídeo na metade de baixo.
- **Exemplos reais:** Dilson Peres (Instagram), 16 vídeos com "Meu nome é Dilson Peres Junior, especialista em direito tributário, e eu te mostro as melhores estratégias para economizar o seu dinheiro e o da sua empresa...": percentis de seguidores de 0,01 a 0,79. Marcelo Germano usa o mesmo CTA em 23 de 23 vídeos ("E você, vai continuar apagando incêndio ou vai me seguir aqui?"): um é p100 e outro p0. JP Albuquerque (TikTok): "Meu nome é JP Albuquerque, eu trago análises de negócio fora do óbvio..." é p100 num vídeo e p05 no outro.
- **Onde vale:** global.
- **Instrução para o playbook:** "O comando não salva vídeo fraco nem estraga vídeo forte. Gaste a energia no hook e no roteiro; no comando, siga a fórmula e não cometa os erros caros (pedido duplo, promessa do assunto do vídeo)." E no agente: nunca escolher o CTA de um cliente pelo vídeo campeão de seguidores; escolher pela fórmula com média medida em 10 ou mais vídeos.
- **Confiança:** alta.

### A2. Pedir comentário (ou qualquer segundo pedido) no bloco final corta seguidores
- **O que:** bloco final com "comenta", "me conta", "me diz", "deixa nos comentários" junto com o pedido de seguir.
- **Número (seguidores, transcrição):** qualquer pedido de comentário: lift 0,29 [0,14 a 0,57], n=94 vídeos / 84 roteiros, OR MH 0,22 [0,10 a 0,48], descoberta 0,43 / validação 0,00, Instagram 0,24 (84), TikTok 0,78 (10); controle viral 0,25, controle trimestre 0,30. Pergunta de opinião sem palavra-chave: lift 0,33, OR 0,25 [0,11 a 0,55], replica. Qualquer segundo pedido (comenta, compartilha, salva, curte): lift 0,46 [0,29 a 0,73], OR 0,36 [0,21 a 0,63], replica. Os 82 vídeos com "comenta + segue" têm 9% de topo em seguidores contra base de 25%.
- **Número (o que ele pede):** comentários lift 2,09 [1,90 a 2,29], OR 3,73 [3,02 a 4,61], replica nas 3 redes (Instagram 2,35, TikTok 1,58, YouTube 2,25). "Comenta X que eu te mando": 93% dos 27 vídeos no topo de comentários. Viralização: coef 0,91 (sem evidência). Pedir comentário não aumenta views.
- **Onde vale:** global; negativo em todos os 6 cliente x rede com volume para comparar (Marcos Pelozato 0 de 13 no topo, Izabela 6% contra 31%, Thiago Franco 11% contra 26%, Marcio Grazino 0 de 6, Fernando Pereira 0 de 9).
- **Exemplos fracos reais:** Marcio Grazino, Instagram, seguidores p0: "Agora comenta aqui em quantos anos você acha que o carro voador deixa de ser coisa de rico. Eu sou Marcio Grazino, e se você quer ficar por dentro dessas mudanças antes delas chegarem ao seu bolso, me segue agora." Marcos Pelozato, Instagram, p6: "Agora me conta, você acredita que um rombo de 20 bilhões pode crescer durante anos sem ninguém no topo perceber? Eu sou Marcos Pelozato...". Thiago Franco, Instagram, p3: "comenta aqui VENDA. E se você quer mais conteúdos como esse, me segue."
- **Instrução:** "Um vídeo, um pedido. Se o objetivo é seguidor, o bloco final não pede comentário, nem pergunta de opinião, nem palavra-chave. Se o objetivo do vídeo é comentário (isca de DM, enquete), assuma o custo: escreva o pedido de comentário e deixe o 'segue' de fora ou em segundo plano." Reescrita: "Agora me conta, isso ainda é pecuária ou já virou mercado financeiro? Eu sou Marcos Pelozato, e se você quer..." vira "Eu sou Marcos Pelozato, e se você quer entender as estruturas milionárias que se movimentam no Brasil antes de virarem manchete, segue o meu perfil agora." (a pergunta, se for essencial, sobe para a conclusão, longe do comando).
- **Confiança:** alta.

### A3. Prometa o território do canal, não o assunto deste vídeo
- **O que:** "território" = a promessa do comando fala do que o perfil entrega sempre (histórias de empresas que quase morreram, as inovações que estão mudando o planeta) e não repete palavras do hook nem do assunto deste vídeo. "Amarrado ao assunto" = o comando repete pelo menos 1 palavra do hook ou 2 palavras do título/assunto que não fazem parte do vocabulário fixo de CTA do cliente.
- **Número:** território, sem pedido extra: lift 1,16 [1,03 a 1,30], n=676 vídeos / 589 roteiros, OR 1,51 [1,19 a 1,93], descoberta 1,21 / validação 1,08, Instagram 1,14 (566), TikTok 1,27 (110), controle viral 1,42, controle trimestre 1,43. Território com todos os controles juntos (pedido extra, todo dia, "me segue aqui"): OR 1,35 [1,05 a 1,74]; somando trimestre: 1,27 [0,98 a 1,65]. Amarrado ao assunto: OR 0,70 [0,54 a 0,90], com controles 0,71 [0,55 a 0,93]. Repete 1+ palavra do hook: lift 0,84, OR 0,72 [0,55 a 0,94], replica. Repete 2+ palavras do tema fora do vocabulário fixo: lift 0,73 [0,56 a 0,95], OR 0,61 [0,42 a 0,87], descoberta 0,74 / validação 0,71, replica. Amarrar ao assunto também anda com menos compartilhamento (OR 0,77) e menos comentário (OR 0,84).
- **Onde vale:** global; amarrar ao assunto é negativo em 14 de 21 cliente x rede (Marcelo Germano 9% contra 50%, Manoel Victor 8% contra 29%, Fernando Pereira 9% contra 28%, Rafael Rodrigues 10% contra 28%, Marcos Pelozato no TikTok 14% contra 43%, Marcio Grazino 18% contra 31%). Exceções: Marcos Pelozato no Instagram (30% contra 20%) e Patrick Diorio (38% contra 15%), em que o assunto do vídeo funciona.
- **Exemplos reais de topo (território):** Marcos Pelozato, TikTok, p100 (110 seg/mil): "Eu sou Marcos Pelozato, se você quer enxergar o negócio com a clareza que a maioria dos empresários nunca teve, segue o meu perfil agora." Rodrigo Waughan, Instagram, p100 (85,5/mil): "Sou Rodrigo Vaughan de Lemos e se você quiser conhecer as estratégias responsáveis por negócios multimilionários, já segue meu perfil." Ricardo Schumacher, Instagram, p100: "Eu sou Ricardo Schumacher, Estrategista Tributário. Se você quer entender como o conhecimento tributário molda os maiores empresários brasileiros, já segue meu perfil."
- **Contraexemplo (assunto):** Marcos Pelozato, Instagram, p1, num vídeo sobre um bilionário que perdeu tudo: "Eu sou Marcos Pelozato, e se você quer entender os erros que podem deixar até bilionários pobres, segue o meu perfil agora."
- **Instrução:** "A promessa do comando é a do canal, não a do vídeo. Não reescreva o assunto do vídeo no comando; a ponte com o vídeo é uma palavra ('Então', 'E se você quer mais disso'), não o tema." Reescrita: "se você quer entender os erros que podem deixar até bilionários pobres" vira "se você quer continuar recebendo histórias de empresas que quase morreram e as estratégias que as tiraram do buraco".
- **Confiança:** alta para "amarrar ao assunto piora"; média para o tamanho do ganho do território.

### A4. "Todo dia eu te mostro [território]": a fórmula de maior conversão com volume
- **O que:** promessa de frequência ("todo dia", "todos os dias", "diariamente") na primeira pessoa ("eu te mostro", "eu trago", "eu analiso").
- **Número:** "todo dia" (qualquer forma, transcrição): lift 1,26 [1,02 a 1,52], n=210 / 192 roteiros, OR 1,59 [1,13 a 2,24], descoberta 1,29 / validação 1,21, Instagram 1,25 (192), TikTok 1,30 (18), controle viral 1,53; controle trimestre 1,39 [0,98 a 1,95]; estrato x trimestre 1,42 [0,98 a 2,07]. Fórmula (todo dia + eu te mostro, sem pedido extra): lift 1,29 [1,03 a 1,59], n=165 / 156 roteiros, OR 1,64 [1,12 a 2,39], descoberta 1,30 / validação 1,35, controle viral 1,51, controle trimestre 1,59. Compartilhamento: n-grama "todos os dias eu" OR 2,43 [1,64 a 3,58], replica (88 roteiros). "Eu te mostro" sozinho: OR 1,37, cai para 1,25 [0,93 a 1,68] quando controlo "todo dia" (o ganho é da frequência).
- **Onde vale:** positivo em 10 de 14 cliente x rede (Manoel Victor 47% contra 16%, Izabela 37% contra 19%, Dilson 38% contra 22%, Franklin 40% contra 23%) e dentro do mesmo trimestre nos que mais usam (Izabela no 3º tri 47% contra 13%; Manoel Victor no 1º tri 30% contra 14% e no 2º 67% contra 33%; Thiago Franco no 1º tri 50% contra 20%). Exceções: Fernando Pereira (0 de 6), Ricardo Schumacher, Leonardo Nogueira, Patrick Diorio.
- **Exemplos reais de topo:** Izabela Anholett, Instagram, p99 (22,3/mil, coef 30,2): "Eu sou Izabela Anholett, todo dia eu te mostro as novidades mais incríveis da tecnologia que tá dominando o mundo. Então me segue para não perder o próximo vídeo." Thiago Franco, Instagram, p97 (coef 107,7): "Eu sou o Thiago Franco, especialista em marketplace, e eu analiso todos os dias o que as marcas no digital estão fazendo de diferente. Então segue o meu perfil pra não ficar pra trás." Rodrigo Waughan, Instagram, p99 (35/mil): "Eu sou Rodrigo Vaughan de Lemos e analiso diariamente as estratégias das grandes empresas, sejam elas boas ou ruins. Então me segue para não perder a próxima."
- **Instrução:** "Quando o cliente publica com frequência, prometa a série: 'Eu sou [Nome] e todo dia eu te mostro [território em 6 a 12 palavras]. Então me segue.' Não prometa frequência que o perfil não cumpre."
- **Confiança:** média (replica e resiste ao controle viral; perde parte da força com o controle de tempo).

### A5. Fechar com "me segue aqui"
- **O que:** a ação final com o dêitico "aqui" ("já me segue aqui", "me segue aqui no perfil") no lugar de "segue o meu perfil".
- **Número:** lift 1,47 [1,10 a 1,89], n=86 vídeos / 78 roteiros, OR 2,05 [1,25 a 3,36], descoberta 1,57 / validação 1,35, Instagram 1,52 (76), TikTok 1,16 (10); controle viral 1,74; controle trimestre 2,34; com controle de território, pedido extra e todo dia: 2,04 [1,22 a 3,40]. No escrito também replica (OR 2,02 [1,17 a 3,48]). "Segue o meu perfil": 0,99 (neutro).
- **Onde vale:** Izabela (46% contra 22%), Patrick Diorio (43% contra 14%), Rodrigo Waughan (43% e 38% contra 23% e 24%), Franklin Tomich (43% contra 21%). Não funcionou em Thiago Franco (0 de 4) e JP Albuquerque (0 de 3).
- **Exemplos reais:** Patrick Diorio, Instagram, p100: "Meu nome é Patrick Diorio, e se você quer entender como a tecnologia está mudando o que significa ter companhia, me segue aqui." Rodrigo Waughan, TikTok, p98: "Eu sou Rodrigo Volga de Lemos, presidente do grupo Gerbera Mais e empreendedor serial. E se você quer as melhores estratégias para dominar o seu mercado, já me segue aqui."
- **Instrução:** "Termine com 'me segue aqui' (ação curta, no presente, apontando para o perfil)." Reescrita: "..., segue o meu perfil." vira "..., me segue aqui."
- **Confiança:** média (replica e resiste a controles, mas concentrado em poucos clientes; o mecanismo, talvez o gesto de apontar, não está medido).

### A6. Apresentação "Eu sou": neutra; credencial só se for concreta
- **O que:** presença do nome, posição e tipo de credencial.
- **Número (seguidores, transcrição):** com apresentação: lift 1,01 [0,92 a 1,11], n=1.251, OR 1,12 [0,78 a 1,60] (escrito: OR 1,24 [0,80 a 1,94]). Sem apresentação: 0,88, OR 0,82 [0,55 a 1,24]. Antes da promessa (96% dos casos): 1,02; depois: 17 vídeos (não dá para medir). Credencial qualquer: 1,01, OR 1,03. "Especialista em": 1,04. Número na credencial ("mais de 5 mil equipes", "há 10 anos", "26 anos de mercado"): lift 1,22 [0,90 a 1,60], OR 2,23 [1,06 a 4,70], descoberta 1,18 / validação 1,29, controle trimestre 2,28 (o lift bruto não fecha: sinal). Cargo (CEO, fundador, sócio, presidente): 0,85, OR 0,67 [0,40 a 1,15]. Profissão genérica (empreendedor, investidor, educador): 0,84, OR 0,66 [0,39 a 1,14], controle trimestre 0,56 [0,33 a 0,96].
- **Onde vale:** global para o nulo. Dentro de clientes: credencial concreta e ligada ao tema ajuda Marcos Pelozato ("especialista em recuperação judicial": 50% contra 21%), Drielle ("já treinei mais de 5 mil equipes de saúde": 58% no topo em 12 vídeos), Franklin ("mais de 15 anos com compra e venda de empresas": 27% contra 14%), Leonardo Nogueira ("fundador da Barigui Locadora": 50% contra 23%, n=6). Título genérico atrapalha Rafael Rodrigues ("CEO e educador": 11% contra 30%) e Patrick Diorio ("especialista em liderança técnica e mentor de carreira": 14% contra 27%).
- **Exemplos reais:** Drielle Castelani, Instagram, p100 (16,9/mil): "Meu nome é Drielle Castelani, e já treinei mais de 5 mil equipes de saúde. E se você quer mais vídeos de histórias que mudaram a medicina e impactam o brasileiro até hoje, segue o meu perfil." Franklin Tomich, Instagram, p100: "Meu nome é Franklin Tomich, tenho mais de 15 anos trabalhando com compra e venda de empresas. Se você quer aprender como grandes empresas estão redesenhando o mundo dos negócios, já segue o meu perfil." Fraco: Rafael Rodrigues, Instagram, p1: "Eu sou Rafael Rodrigues, CEO e educador. E se você quer fazer parte da minoria que pensa diferente da média e busca conhecimento, já segue o meu perfil."
- **Instrução:** ver seção 6.
- **Confiança:** alta para "o nome não custa nem ajuda"; média-baixa para "credencial com número ajuda" e "título genérico atrapalha".

### A7. "Se você gosta de / gostou desse conteúdo": o pior condicional
- **Número:** lift 0,25 [0,07 a 0,79], n=32 vídeos / 28 roteiros, OR 0,17 [0,04 a 0,74], descoberta 0,16 / validação 0,54, controle viral 0,18, controle trimestre 0,25. Metade dos casos é de Manoel Victor (16 vídeos, 6% no topo contra 31%); nos outros 9 clientes que usaram, 1 de 16 vídeos ficou no topo.
- **Exemplos fracos reais:** Manoel Victor, Instagram, p12: "Meu nome é Manoel Victor, eu analiso estratégias de empresas vencedoras, e se você gostou desse conteúdo, considere me seguir por aqui." Fernando Pereira, Instagram, p9: "...e se você gosta desse tipo de conteúdo, eu te convido a me seguir."
- **Instrução:** "Nunca condicione o seguir ao gosto pelo vídeo ('se você gostou', 'se você curte esse tipo de conteúdo'). Condicione ao que a pessoa quer receber: 'se você quer [território]'." Reescrita: "se você gostou desse conteúdo, considere me seguir por aqui" vira "todos os dias eu te mostro as estratégias de empresas vencedoras. Então já me segue aqui."
- **Confiança:** média.

### A8. Compartilhamento: peça o envio a uma pessoa
- **O que:** "manda esse vídeo para alguém que...", "compartilha esse vídeo para que mais pessoas...".
- **Número:** compartilhamento lift 1,95 [1,37 a 2,53], n=40 vídeos, OR 3,07 [1,63 a 5,79], descoberta 1,89 / validação 2,13, Instagram 2,25 (12), TikTok 1,82 (28); no escrito, OR 1,71 [1,05 a 2,78], replica. Comentários também sobem (OR 2,34). Seguidores: 1,39 (n=17, amostra pequena, sem sinal de custo).
- **Exemplos reais:** Drielle Castelani, Instagram, seguidores p93: "Meu nome é Drielle Castelani, já treinei mais de 5.000 equipes de saúde. Se você acha que Semmelweis merece ser lembrado por estar certo, mande esse vídeo para alguém e já segue o meu perfil que eu te ajudo a entender os principais fatos da medicina de forma simples." Marcio Grazino, Instagram, p94: "Eu sou o Márcio Grazino e se você quer que mais pessoas conheçam a história da Marli, compartilha esse vídeo para outras pessoas e não esqueça de me seguir para receber mais vídeos como esse."
- **Instrução:** "Quando o vídeo tem causa ou injustiça (alguém merece ser lembrado, mais gente precisa saber), o pedido de envio entra antes do segue: 'Se você acha que [X merece Y], manda esse vídeo para alguém e já segue o meu perfil.'" É o único pedido extra que não mostrou custo em seguidores.
- **Confiança:** média (replica, n pequeno).

### A9. O que não mexe: tamanho, condicional, "para não perder", "mais conteúdo como esse", urgência, exclusividade
- **Número (seguidores, transcrição):** faixa 16 a 25 palavras 0,86 [0,70 a 1,05], OR 0,77; 26 a 40 palavras (a norma da casa, 66% dos vídeos) 1,03; 41+ 1,05. Condicional ("se você quer") sem "eu te mostro" 0,93, OR 0,80 [0,62 a 1,05]. "Para não perder o próximo vídeo" 1,04. "Mais conteúdos como esse" 0,91. Urgência 1,02. Exclusividade 0,97. Termina em "agora" 0,98, OR 0,92 (coef OR 0,76: pista de menos views).
- **Instrução:** "Pare de cortar comando por tamanho. Na casa, 26 a 40 palavras é normal e neutro (no YouTube, fique abaixo de 41: ver A11)."
- **Confiança:** alta para o nulo.

### A10. Medição: o campo de comando do vídeo engana
- **O que:** `comando_video` (LLM) traz só a última frase em boa parte dos vídeos. Apresentação: 49% no LLM, 86% na transcrição, 93% no escrito. "Genérico puro": 19% no LLM, 3% na transcrição. Dos 1.256 comandos que o LLM marca como genéricos, 91% tinham nome e promessa na fala; dos 1.653 "para não perder", 92% tinham promessa antes.
- **Consequência:** a tabela do v2, feita sobre esse campo, mediu "a última frase do CTA". O "genérico" dele era quase sempre um CTA completo de duas frases.
- **Instrução para o pipeline:** "Para medir comando, use o fim da transcrição (`videos.roteiro`) ou o bloco final escrito, nunca o `comando` do fato_video sozinho."
- **Confiança:** alta.

### A11. Plataformas
- **Instagram:** onde está a evidência (1.268 vídeos com seguidores). Valem A2 a A8.
- **TikTok:** só 250 vídeos com seguidores; tudo aponta para o mesmo lado do Instagram (território 1,26; todo dia 1,29; eu te mostro 1,34; "se você quer" 0,89; amarrado ao assunto 0,83; pedido de comentário 0,77), sem significância isolada. Pedir comentário rende menos comentário no TikTok (lift 1,58 contra 2,35 no Instagram). Pedir envio a alguém funciona (compartilhamento 1,82, n=28).
- **YouTube:** só coef. Nenhuma característica do comando mexe na viralização: apresentação 1,00, todo dia 0,95, pedir para seguir 0,99. Pistas negativas: pedir comentário lift 0,70 [0,48 a 1,01], OR 0,61 [0,38 a 0,99] (descoberta 0,70 / validação 0,71); bloco com 41+ palavras 0,77, OR 0,69 [0,46 a 1,03]. A casa diz "segue o meu perfil" em 75% dos Shorts e "se inscreve" em 2 vídeos: não há como medir o verbo nativo do YouTube.
- **Link na bio:** 9 vídeos em toda a base (6 no TikTok), só em promoção. Nos 22 roteiros com CTA por rede (quase todos da Izabela, Pré-MBA), o Instagram com "comenta EXAME" fica no percentil 0,90 de comentários e o TikTok com "link na bio" no 0,55; a conversão em seguidores desses vídeos de Instagram fica abaixo da mediana dela (média p38). Não dá para dizer se link na bio converte.
- **Confiança:** média para Instagram; baixa para TikTok e YouTube.

### A12. Hipóteses que valem teste (não são regra)
- "para não perder a próxima [história/inovação]" (série) no lugar de "o próximo vídeo": seguidores OR 1,84 [1,01 a 3,35], mas descoberta 1,57 / validação 1,03; compartilhamento OR 1,52 e coef OR 1,61 replicam. 52 roteiros, quase todos de Marcio Grazino e Rodrigo Waughan.
- "antes de todo mundo": neutro no geral (1,23, n=32), forte só em Fernando Pereira (39% contra 20%).
- "Eu te mostro as [plural]" e "as inovações que estão mudando o planeta" andam com mais viralização (coef OR 1,61 e 1,64, replicam), mas isso é tema e formato de série, não efeito do comando no fim do vídeo.

### A13. Mineração de palavras do comando (o que o dado achou sozinho)
- **Como:** n-gramas de 1 a 4 palavras da transcrição do bloco final, descobertos antes de 01/07 e confirmados depois, 30+ roteiros, desfecho seguidores (IG+TT).
- **Replicam e ajudam:** "todo mundo" (quase sempre "antes de todo mundo"; 33 roteiros, OR 2,57 [1,33 a 4,96]), "dia"/"todo" (todo dia; OR 2,37 e 2,12), "não ficar" (de fora / para trás; OR 2,24, quase tudo Izabela), "que estão mudando o (planeta)" (OR 2,08), "segue aqui" (OR 2,03).
- **Replicam e atrapalham:** "que eu" (de "comenta X que eu te mando"; OR 0,38 [0,17 a 0,85]); "esse perfil" (OR 0,59, não fecha) e "conteúdo" (OR 0,49, não fecha) como pistas.
- **Para compartilhamento:** "todos os dias eu" (88 roteiros, OR 2,43 [1,64 a 3,58], replica) e "eu trago" (OR 2,06). Para comentário: só o próprio "comenta" (OR 5,36).
- **Leitura:** a mineração não trouxe nada fora das regras A2 a A5; ela as confirma por outro caminho.

## 3. A tabela do v2 refeita nos roteiros VM

Régua do v2 = mediana da razão "seguidores por mil views do vídeo ÷ mediana do canal" (aqui, 809 vídeos IG+TT com 5 mil+ views). Régua do estudo = quartil superior de seguidores por mil views no cliente x rede, com OR controlado por cliente x rede.

| Padrão do v2 | v2: lift (n) | VM, régua do v2, transcrição: lift (n) | VM, régua do estudo: lift seguidores [IC95] (n) | OR MH [IC95] | descoberta / validação | Veredito |
|---|---|---|---|---|---|---|
| Condicional + promessa específica | 1,49 (205) | 1,00 (282) | 0,98 [0,85 a 1,12] (603) | 0,96 [0,74 a 1,23] | 0,96 / 1,00 | Desmentido: neutro |
| "Mais conteúdo como esse" | 1,39 (192) | 0,95 (114) | 0,91 [0,70 a 1,17] (190) | 0,86 [0,59 a 1,26] | 0,94 / 0,86 | Desmentido: neutro |
| Linguagem de exclusividade | 1,34 (50) | 1,09 (72) | 0,97 [0,69 a 1,31] (114) | 0,96 [0,60 a 1,52] | 0,97 / 0,94 | Não confirmado |
| Promessa específica (qualquer forma) | 1,24 (356) | 1,00 (595) | 1,03 [0,94 a 1,14] (1.120) | 1,22 [0,92 a 1,61] | 1,03 / 1,05 | Não confirmado; o que separa é território x assunto (A3) |
| Pergunta no comando | 1,16 (170) | 0,94 (47) | 0,90 [0,55 a 1,39] (57) | 0,82 [0,38 a 1,74] | 1,31 / 0,19 | Corrigido: pergunta de opinião derruba seguidores (A2) |
| Promessa de frequência | 1,12 (170) | 1,17 (136) | 1,26 [1,02 a 1,52] (210) | 1,59 [1,13 a 2,24] | 1,29 / 1,21 | **Confirmado e mais forte** (A4) |
| Condicional sozinho | 1,09 (649) | 0,95 (95) | 0,86 [0,66 a 1,09] (221) | 0,76 [0,53 a 1,10] | 0,78 / 0,91 | Não confirmado (tende a negativo) |
| Urgência ("agora", "já segue") | 1,03 (482) | 0,99 (324) | 1,02 [0,89 a 1,15] (655) | 1,05 [0,81 a 1,37] | 0,98 / 1,04 | Confirmado: neutro |
| Apresentação com nome | 0,77 (515) | 1,00 (620) | 1,01 [0,92 a 1,11] (1.251) | 1,12 [0,78 a 1,60] | 1,02 / 0,99 | Desmentido: neutro (A6, A10) |
| "Para não perder o próximo vídeo" | 0,69 (357) | 1,00 (164) | 1,04 [0,86 a 1,23] (338) | 1,07 [0,78 a 1,47] | 1,10 / 0,93 | Desmentido: neutro |
| Pedido de engajamento | 0,68 (118) | 0,87 (84) | 0,46 [0,29 a 0,73] (128) | 0,36 [0,21 a 0,63] | 0,60 / 0,19 | **Confirmado e mais forte** (A2) |
| Genérico puro | 0,65 (183) | 1,11 (24) | 1,13 [0,68 a 1,72] (42) | 1,21 [0,60 a 2,42] | 1,19 / 0,00 | Não testável: só 3% dos CTAs da casa são genéricos de verdade (A10) |
| Tamanho 1 a 8 palavras | 1,00 (105) | - | 1,31 [0,71 a 2,10] (24) | 1,52 [0,64 a 3,61] | - | Amostra pequena |
| Tamanho 9 a 15 | 1,05 (292) | - | 0,94 [0,55 a 1,50] (46) | 0,94 [0,46 a 1,91] | 0,77 / 2,83 | Neutro |
| Tamanho 16 a 25 ("ponto ótimo") | 1,17 (364) | - | 0,86 [0,70 a 1,05] (324) | 0,77 [0,57 a 1,05] | 0,66 / 1,13 | Desmentido: não é ótimo |
| Tamanho 26 a 40 | 0,93 (477) | - | 1,03 [0,92 a 1,14] (953) | 1,11 [0,87 a 1,43] | 1,10 / 0,92 | Desmentido: neutro (é a norma da casa) |
| Tamanho 41 ou mais | 0,92 (123) | - | 1,05 [0,76 a 1,40] (109) | 1,08 [0,69 a 1,68] | 0,94 / 1,26 | Neutro (no YouTube, pista negativa) |

Leitura: com a régua do v2 ou com a do estudo, com o texto da transcrição, do CRM ou do campo LLM (tabelas completas em `v2.md` e `regua_v2.md`), só duas linhas do v2 se sustentam na casa: frequência ajuda e pedido de engajamento atrapalha. A explicação mais provável para o resto: o v2 misturou vídeos de fora da casa (onde há CTA realmente sem promessa) e usou o campo LLM que corta a apresentação.

## 4. Fórmulas de comando (com número e exemplos reais de topo)

Topo = quartil superior de seguidores por mil views no cliente x rede; base 25%.

**F1. Série com frequência.** "Eu sou [Nome] e todo dia eu te mostro [território do canal]. Então me segue (aqui)."
165 vídeos com "todo dia + eu te mostro" e sem pedido extra; lift 1,29 [1,03 a 1,59], OR 1,64 [1,12 a 2,39], replica; também puxa compartilhamento ("todos os dias eu": OR 2,43).
- Izabela Anholett, Instagram, p99: "Eu sou Izabela Anholett, todo dia eu te mostro as novidades mais incríveis da tecnologia que tá dominando o mundo. Então me segue para não perder o próximo vídeo."
- Franklin Tomich, Instagram, p97: "Meu nome é Franklin Tomich, atuo com fusões e aquisições há mais de 15 anos, e aqui eu trago todos os dias um caso como este. Então me segue para não perder o próximo caso."
- Manoel Victor, Instagram, p97: "Meu nome é Manoel Victor e todos os dias eu te mostro as melhores IAs e as novidades desse mercado, então já me segue para não ficar para trás."

**F2. Condicional do território.** "Eu sou [Nome], e se você quer [o que o canal entrega sempre], segue o meu perfil."
322 vídeos; o grupo "território sem pedido extra" tem lift 1,16 [1,03 a 1,30], OR 1,51 [1,19 a 1,93], replica. A mesma frase com o assunto do vídeo: OR 0,70.
- Marcos Pelozato, TikTok, p100 (110 seg/mil): "Eu sou Marcos Pelozato, se você quer enxergar o negócio com a clareza que a maioria dos empresários nunca teve, segue o meu perfil agora."
- Rodrigo Waughan, Instagram, p100 (85,5/mil): "Sou Rodrigo Vaughan de Lemos e se você quiser conhecer as estratégias responsáveis por negócios multimilionários, já segue meu perfil."
- Fraco (assunto do vídeo): Marcos Pelozato, Instagram, p1: "Eu sou Marcos Pelozato, e se você quer entender os erros que podem deixar até bilionários pobres, segue o meu perfil agora."

**F3. Fecho com "me segue aqui".** "..., me segue aqui."
86 vídeos; lift 1,47 [1,10 a 1,89] (cerca de 37% no topo contra base de 25%), OR 2,05 [1,25 a 3,36], replica.
- Patrick Diorio, Instagram, p100: "Meu nome é Patrick Diorio, e se você quer entender como a tecnologia está mudando o que significa ter companhia, me segue aqui."
- Izabela Anholett, Instagram, p98: "Se você quer se manter por dentro das inovações que vão mudar o mundo, já me segue aqui. Eu sou Izabela Anholett e todos os dias traduzo a inteligência artificial para o mundo real."

**F4. Credencial com número antes da promessa.** "Meu nome é [Nome], [feito com número]. Se você quer [território], segue o meu perfil."
105 vídeos com número ou feito, 30% no topo; número na credencial OR 2,23 [1,06 a 4,70] (sinal: o lift bruto não fecha).
- Drielle Castelani, Instagram, p100: "Meu nome é Drielle Castelani, e já treinei mais de 5 mil equipes de saúde. E se você quer mais vídeos de histórias que mudaram a medicina e impactam o brasileiro até hoje, segue o meu perfil."
- Franklin Tomich, Instagram, p100: "Meu nome é Franklin Tomich, tenho mais de 15 anos trabalhando com compra e venda de empresas. Se você quer aprender como grandes empresas estão redesenhando o mundo dos negócios, já segue o meu perfil."

**F5. Envio a uma pessoa (quando o vídeo tem causa).** "Se você acha que [X merece Y], manda esse vídeo para alguém e já segue o meu perfil."
40 vídeos; compartilhamento lift 1,95, OR 3,07, replica; sem custo visível em seguidores.
- Drielle Castelani, Instagram, p93: "...Se você acha que Semmelweis merece ser lembrado por estar certo, mande esse vídeo para alguém e já segue o meu perfil que eu te ajudo a entender os principais fatos da medicina de forma simples."

**F6. Vídeo de comentário (isca), separado do vídeo de seguidor.** "Comenta [PALAVRA] que eu te mando [o material]." Sem pedir seguidor junto.
Palavra-chave: 93% dos 27 vídeos no topo de comentários; mas "comenta + segue" tem 9% de topo em seguidores (OR 0,26 [0,12 a 0,56]).
- Izabela Anholett, Instagram, comentários p93: "Para ter acesso a esse treinamento basta comentar aqui a palavra EXAME que eu mando o link."

**Anti-fórmulas (reescrever sempre):** pergunta de opinião ou "comenta" antes do segue (A2); "se você gosta de / gostou desse conteúdo" (A7); repetir no comando o assunto do vídeo (A3).

## 5. O que os playbooks afirmam e o dado confirma, corrige ou desmente

`comando.md` v2:
- "A regra que manda: promessa específica vale mais que apresentação" (lift 1,49 e 1,24): **corrige.** Nem promessa "específica" nem apresentação separam na casa. O que separa é o tipo de promessa (território do canal, não assunto do vídeo), a frequência e não pedir outra coisa.
- "O clichê mais caro: 'segue para não perder o próximo vídeo', lift 0,69": **desmente.** 1,04 [0,86 a 1,23]. Como cauda depois de nome e promessa (92% dos casos), é neutro. Pode ficar.
- "Apresentação com nome: lift 0,77 sozinho": **desmente.** 1,01; OR 1,12. O 0,77 vem do campo LLM que corta a apresentação.
- "Tamanho: 16 a 25 palavras é o ponto ótimo" e critério "passa de 30 palavras ou fica abaixo de 9": **desmente.** 16 a 25 dá 0,86 (OR 0,77); 26 a 40 é neutro e é a norma da casa. Tirar o critério de tamanho (manter só o limite de 40 no YouTube, como pista).
- "Anatomia: a condição puxa o lift para 1,49": **desmente.** Condicional sem "eu te mostro": 0,93 (OR 0,80); declarativa "eu te mostro" sem condicional: 1,13 (OR 1,33 [1,01 a 1,77]). A condição é opcional e neutra; a declaração de entrega com frequência é melhor.
- "Promessa de frequência: lift 1,12": **confirma e reforça** (1,26; OR 1,59; fórmula completa OR 1,64).
- "Pedido de engajamento: 0,68" e critério "pede engajamento quando o objetivo é seguidor": **confirma e reforça** (0,46; OR 0,36; comentário OR 0,22).
- "Linguagem de exclusividade puxa 1,34": **não confirma** (0,97). Só Fernando Pereira se beneficia de "antes de todo mundo".
- "Pergunta no comando: 1,16": **corrige.** Pergunta de opinião antes do segue derruba seguidores (OR 0,25).
- "Mais conteúdo como esse: 1,39": **desmente** (0,91; negativo dentro de Izabela, Thiago Franco e Dilson, positivo em Drielle).
- Critério "não emenda no payoff do roteiro, parecendo anúncio colado": **corrige.** Emendar com o assunto do vídeo piora (OR 0,61 a 0,72). A emenda é uma ponte de uma palavra; a promessa é do canal.
- Critério "abre com apresentação de nome sem que a credencial faça parte da promessa": **desmente.** O nome é neutro; o que pesa é credencial genérica (pista negativa) contra credencial com número (pista positiva).
- Gatilho "Propósito e altruísmo, 1,95 (n=20)": **não dá para confirmar em seguidores** ("se você valoriza / acredita / faz parte": 17 vídeos, 0,70); puxa comentário (OR 2,04, replica).
- "Prioridade 1: conversão real do cliente vence" e, em `agents/comando.md`, "priorize os comandos já pré-rankeados por seguidores ganhos": **corrige.** O mesmo CTA vai de p01 a p79 no mesmo cliente (A1). Ranquear CTA por vídeo campeão é ranquear ruído; ranquear por fórmula com 10 ou mais vídeos.
- "Conversão está registrada em 13% dos vídeos": continua verdade; e o texto do comando no fato_video está cortado (A10).

`checklist.md` e `style_guide.md`: se repetirem o critério de 16 a 25 palavras ou "apresentação só com credencial", herdam as correções acima.

## 6. O que fazer com a apresentação "Eu sou"

1. **Mantenha o nome, curto, no começo do bloco.** Não ajuda nem atrapalha seguidor (OR 1,12 [0,78 a 1,60]); tirar o nome não melhora (sem apresentação: 0,88). Ele serve à marca do cliente e não custa conversão. Dentro da Izabela, tirar o nome piorou (16% contra 30%).
2. **Credencial: só concreta, verificável e com número**, ligada ao território ("já treinei mais de 5 mil equipes de saúde", "tenho mais de 15 anos com compra e venda de empresas", "fundador da Barigui Locadora, o maior revendedor de veículos do sul do Brasil"). Pista positiva (OR 2,23).
3. **Evite título genérico** ("CEO e educador", "empreendedor serial", "presidente do grupo X", "mentor de carreira"): pista negativa (OR 0,66 a 0,67; 0,56 com controle de tempo na profissão genérica).
4. **Posição:** antes da promessa, como a casa já faz (96%). Depois da promessa aparece em só 17 vídeos: não dá para dizer que é melhor.
5. **Não deixe a apresentação sem promessa** ("Eu sou X, especialista em Y. Segue o meu perfil."): 0,88, OR 0,81 [0,58 a 1,13], pista negativa. Nome + entrega na mesma frase: "Eu sou [Nome] e todo dia eu te mostro [território]".

## 7. Recomendações por plataforma

- **Instagram:** use F1 a F3; nunca "comenta" ou pergunta de opinião no bloco de seguidor; prometa o território; credencial só concreta. Para isca de comentário (palavra-chave), faça um vídeo próprio e aceite a conversão menor.
- **TikTok:** mesmas regras (tudo aponta para o mesmo lado, com amostra pequena). "Eu te mostro" vai bem (1,34, n=81). Pedir comentário rende menos comentário que no Instagram (1,58 contra 2,35); "manda para alguém" funciona para compartilhamento (1,82). Link na bio: sem dado para afirmar.
- **YouTube Shorts:** o comando não move a viralização. Bloco curto (até 40 palavras) e sem pedido de comentário (pistas de menos views: OR 0,69 e 0,61). Teste "se inscreve no canal" (verbo nativo da rede), que a casa nunca usou (2 vídeos).
- **Facebook:** sem seguidores nem volume para medir (276 vídeos).

## 8. Uma linha por cliente

Clientes com 30+ vídeos com seguidores. "Topo X% contra Y%" = taxa de topo de seguidores com a característica contra sem, dentro do cliente x rede. Amostras de cliente são pequenas: trate como direção, não como lei.

| Cliente (rede, n) | Fórmula que converte para ele | Exemplo real de topo | Evitar |
|---|---|---|---|
| Izabela Anholett (IG, 164) | Nome + "todo dia eu te mostro" + território de IA + "me segue aqui" (todo dia 37% contra 19%; me segue aqui 46% contra 22%; eu te mostro 32% contra 20%) | "Eu sou Izabela Anholett, todo dia eu te mostro as novidades mais incríveis da tecnologia que tá dominando o mundo. Então me segue para não perder o próximo vídeo." (p99, 22,3 seg/mil) | Palavra-chave/comenta no vídeo de seguidor (6% contra 31%); "mais conteúdos como esse" (0 de 10); tirar o nome (16% contra 30%) |
| Rodrigo Waughan (IG 111, TT 88) | "Eu sou Rodrigo e aqui eu te mostro as estratégias das grandes empresas. Então já me segue aqui." (TT: estratégias 31% contra 18%, "aqui eu te mostro" 67% em 6; me segue aqui 43% e 38% contra 23% e 24%) | TT: "Eu sou Rodrigo Vaughan de Lemos, e aqui eu te mostro tudo sobre as estratégias das grandes empresas. Sejam as boas para você se inspirar ou as ruins para você não cometer o mesmo erro. Então já me segue para não perder o próximo vídeo." (p99) | "Se gostou dessa história, me segue" (pior); credencial longa (23% contra 28%); "se você quer" no TT (22% contra 29%) |
| Marcio Grazino (IG, 111) | "Eu sou Marcio Grazino e eu te mostro as inovações que estão mudando o nosso planeta. Então me segue para não perder a próxima." (eu te mostro 31% contra 19%; "para não perder" 32% contra 20%) | O próprio texto acima (p100, 41,2 seg/mil, coef 11,9) | "Agora comenta aqui..." (p0); promessa do assunto do vídeo (18% contra 31%); "segue o meu perfil" (10% contra 32%) |
| Thiago Franco (IG, 110) | Credencial + "eu analiso todos os dias" + território + "segue o meu perfil pra não ficar pra trás" (eu te mostro/analiso 29% contra 19%; todo dia 29% contra 21%) | "Eu sou o Thiago Franco, especialista em marketplace, e eu analiso todos os dias o que as marcas no digital estão fazendo de diferente. Então segue o meu perfil pra não ficar pra trás." (p97, coef 107,7) | "comenta aqui VENDA" junto (11% contra 26%); "mais conteúdos como esse" (16% contra 27%) |
| Fernando Pereira (IG, 93) | Credencial + "se você quer entender [o que move a economia] antes de todo mundo" + "segue meu perfil agora" (território 36% contra 13%; "antes de todo mundo/à frente" 39% contra 20%; "agora" 42% contra 19%) | "Meu nome é Fernando Pereira, especialista em mercado financeiro, e se você quer entender o que é que tá acontecendo na economia global antes de todo mundo e como isso afeta o seu bolso, segue meu perfil agora." (p97) | Assunto do vídeo no comando (9% contra 28%); "todo dia" e "para não perder" (0 de 6 cada); "me diz você..." e "se você gosta desse tipo de conteúdo" |
| Marcos Pelozato (IG 89, TT 59) | IG: credencial de recuperação de empresas + "se você quer continuar recebendo histórias de empresas que quase morreram..." (credencial 50% contra 21%). TT: território, não o assunto (53% contra 14%) | IG: "Eu sou Marcos Pelozato. E se você quer continuar recebendo histórias de empresas que quase morreram e entender as estratégias que tiraram essas empresas do buraco, me segue agora." (p100, coef 59). TT: "Eu sou Marcos Pelozato, se você quer enxergar o negócio com a clareza que a maioria dos empresários nunca teve, segue o meu perfil agora." (p100, 110 seg/mil) | "Agora me conta..." antes do CTA (0 de 13 no topo) |
| Rafael Rodrigues (IG, 81) | "Meu nome é Rafael Rodrigues e eu te mostro [histórias de grandes mentes] para você se inspirar e evoluir na carreira. Então já segue o meu perfil." (eu te mostro 30% contra 15%; histórias 35% contra 20%) | O próprio texto (p100, 25,2 seg/mil, coef 35,3) | "Se você quer" (8% contra 30%); "CEO e educador" (11% contra 30%); assunto do vídeo (10% contra 28%) |
| Manoel Victor (IG, 68) | "Meu nome é Manoel Victor e todos os dias eu te mostro [as melhores IAs e as novidades desse mercado]. Então já me segue para não ficar para trás." (todo dia 47% contra 16%; território 31% contra 17%) | O próprio texto (p97) | "se você gostou desse conteúdo, me siga" (6% de topo em 16 vídeos); "estratégias" (11% contra 35%); "se você quer" (18% contra 30%) |
| Dilson Peres (IG, 68) | Credencial tributária + "te mostro todos os dias as melhores estratégias para economizar o seu dinheiro e o da sua empresa" (todo dia 38% contra 22%; território 28% contra 17%) | "Eu sou o Dilson Perez Júnior, especialista em direito tributário e te mostro todos os dias as melhores estratégias para economizar o seu dinheiro e da sua empresa. Então segue o meu perfil..." (p100, 23,1 seg/mil) | "mais conteúdos como esse" (18% contra 29%); assunto do vídeo (17% contra 27%). O CTA fixo dele foi de p01 a p79 em 16 vídeos |
| Drielle Castelani (IG, 60) | "Meu nome é Drielle Castelani e já treinei mais de 5 mil equipes de saúde. Se você quer mais histórias que mudaram a medicina, segue o meu perfil." ("5 mil equipes" 58% de topo em 12; histórias 42% contra 23%) | "Meu nome é Drielle Castelani, e já treinei mais de 5 mil equipes de saúde. E se você quer mais vídeos de histórias que mudaram a medicina e impactam o brasileiro até hoje, segue o meu perfil." (p100, 16,9 seg/mil) | "agora" (13% contra 32%); "se você gosta de conteúdo sobre saúde" (p14) |
| Patrick Diorio (IG, 58) | "Meu nome é Patrick Diorio, e se você quer entender/acompanhar como a [tecnologia/IA] está mudando [X], me segue aqui." (me segue aqui 43% contra 14%; nele o assunto do vídeo funciona, 38% contra 15%) | "Meu nome é Patrick Diorio, e se você quer entender como a tecnologia está mudando o que significa ter companhia, me segue aqui." (p100) | "para não perder" (0 de 7); "especialista em liderança técnica e mentor de carreira" (14% contra 27%) |
| Pedro Elero (IG 48, TT 37) | "Eu sou Pedro Elero e se você quer continuar recebendo histórias [das marcas / financeiras] que te fazem pensar fora da caixa, segue meu perfil." ("se você quer" 27% e 29% contra 18% e 17%; histórias 43% contra 22%) | TT: "Eu sou Pedro Eléro, e se você quer continuar recebendo histórias financeiras que te fazem pensar fora da caixa, segue meu perfil agora." (p100). IG: "Eu sou o Pedro Elero e se você é como poucos que enxergam gestão e estratégia onde a maioria só vê polêmica, já segue meu perfil." (p100, coef 89,7) | IG: "agora" (8% contra 31%) e "eu te mostro" (13% contra 28%); "quem segue o meu perfil sai com uma sacada nova... clica em seguir" (pior) |
| Ricardo Schumacher (IG, 43) | "Eu sou Ricardo Schumacher, estrategista tributário. Se você quer entender como [os impostos mexem no seu dia a dia], já segue o meu perfil." ("entender como" 75% de topo em 8) | "Eu sou Ricardo Schumacher, Estrategista Tributário. Se você quer entender como o conhecimento tributário molda os maiores empresários brasileiros, já segue meu perfil." (p100) | "todos os dias eu mostro..." (20% contra 27%): exceção à regra geral |
| João Paulo Albuquerque (TT, 43) | "Meu nome é JP Albuquerque e eu trago análises de negócio fora do óbvio que você não vê em qualquer lugar. Me segue para não perder o próximo vídeo." (eu trago 35% contra 15%; "para não perder" 29% contra 13%) | O próprio texto (p100, 21,5 seg/mil); o mesmo texto também deu p05: a diferença foi o vídeo | "Se você quer" (15% contra 35%) |
| Franklin Tomich (IG, 40) | Credencial com número + "se você quer aprender como grandes empresas..." + "já segue o meu perfil" ou "me segue aqui" (credencial 27% contra 14%; "se você quer" 38% contra 17%; me segue aqui 43% contra 21%) | "Meu nome é Franklin Tomich, tenho mais de 15 anos trabalhando com compra e venda de empresas. Se você quer aprender como grandes empresas estão redesenhando o mundo dos negócios, já segue o meu perfil." (p100) | Assunto do vídeo (19% contra 32%) |
| Leonardo Nogueira (IG, 32) | Credencial concreta (Barigui) + "se você quer continuar descobrindo histórias surpreendentes do mercado automotivo" (credencial 50% contra 23%, n=6; "se você quer" 36% contra 22%) | "Eu sou Leonardo Nogueira, fundador da Barigui Locadora, do grupo Barigui, o maior revendedor de veículos do sul do Brasil. Se você quer continuar descobrindo histórias surpreendentes do mercado automotivo, segue o meu perfil." (p100, 17,5 seg/mil) | "todos os dias eu trago" (19% contra 38% para eu te mostro/trago; n pequeno) |
| Marcelo Germano (IG, 23 com bloco) | CTA fixo em 23 de 23 vídeos; o mesmo texto deu p100 e p0. Não há o que aprender do comando dele; testar F1 com território | "Meu nome é Marcelo Germano e há 10 anos eu ajudo empresários a acabar com o caos na empresa através de uma equipe autogerenciada. E você, vai continuar apagando incêndio ou vai me seguir aqui nesse perfil?" (p100) | Tratar o CTA fixo como causa do resultado |

Sem dado de seguidores (aplicar a regra geral; CTA atual típico entre aspas): Lincoln Fracari (442 vídeos; "eu te mostro a filosofia chinesa... já segue esse perfil pra receber mais vídeos como esse": trocar o fecho por "me segue aqui" e prometer a série com "todo dia"); Cadu Neiva (208; pede comentário em 25% e promete "mais dicas": separar vídeo de comentário e trocar "dicas" pelo território); Renato Mendes (164; "empreendedor, investidor e conselheiro": trocar por credencial concreta, ele já usou "ex-sócio da Netshoes"); Renato Torres (123; já usa F1: "todos os dias eu posto vídeos como esse para te mostrar as estratégias..."); Leonardo Cirino (121; promoções com "comenta EXAME" no Instagram: separar do vídeo de seguidor); Túlio Lichenstein (119; já usa F4: "tenho 26 anos de mercado financeiro. Se você quer entender..."); João Felipe Marques, Thiago Bisewski, Thainá Iansen e Café com Ferri (65 a 51 vídeos; já no padrão nome + promessa do território; testar "todo dia" e "me segue aqui").

## 9. O que NÃO deu para afirmar

- **Causalidade.** Tudo é observacional. O estilo de CTA anda junto com roteirista, época e tema; o MH controla cliente x rede, e os controles de viralização e trimestre seguram os achados principais, mas não eliminam confusão com tema.
- **TikTok.** 250 vídeos com seguidores: as direções batem com o Instagram, mas nada fecha sozinho no TikTok.
- **"Me segue aqui".** Replica e resiste a controles, mas vem de 78 roteiros de 9 clientes, com efeito em 5. Não sei o mecanismo (gesto? brevidade?).
- **"Todo dia".** Com o tempo controlado mês a mês, OR 1,44 [0,98 a 2,13]: parte do efeito pode ser época.
- **Credencial com número.** MH fecha (2,23) e replica nas metades, mas o lift bruto não (IC 0,90 a 1,60).
- **Heterogeneidade por cliente.** Marcos Pelozato no Instagram e Patrick Diorio convertem melhor com o assunto do vídeo no comando; Ricardo Schumacher pior com "todo dia"; Pedro Elero pior com "eu te mostro" no Instagram. As linhas por cliente têm de 6 a 60 vídeos por característica: direção, não lei.
- **Pedidos raros.** Link na bio (8 vídeos), salva (17), curte (6), "se inscreve" (2): sem como medir. A comparação "comenta no IG x link na bio no TT" tem 22 roteiros quase todos de promoção da Izabela.
- **CTA fixo x variável entre clientes.** O desfecho é percentil dentro do cliente, então não dá para comparar clientes de CTA fixo com clientes de CTA variável. Dentro do cliente, CTA repetido e CTA único convertem igual (OR 1,47 [0,55 a 3,89] e 0,81 [0,61 a 1,06]).
- **Viralização.** Nenhum comando é alavanca de views. As associações que replicam com coef ("eu te mostro as", "as inovações que estão mudando", "a próxima") parecem tema e formato de série, não efeito de uma frase no fim do vídeo.
- **Reprodução do v2.** Não encontrei o código do v2; reproduzi a régua dele pela descrição do playbook. Os números dele não aparecem na casa com nenhuma combinação de régua e texto.
- **Transcrição.** Recorte por regra (últimos 90 tokens, primeira deixa de CTA); 4% dos vídeos sem bloco detectado; algumas transcrições têm ruído do reconhecedor de fala (ex.: "Legenda por Sônia Ruberti").

## Arquivos de apoio (em `out/comando/`)
`v2.md` (tabela do v2 nos três textos), `regua_v2.md` (régua do v2), `verbos.md`, `apresentacao.md`, `formas_ft.md` e `formas_fe.md`, `conexao.md` (território x assunto, CTA fixo), `estrutura.md` (fórmulas e YouTube), `mesmo_cta.md`, `plataforma.md`, `clientes.md` e `clientes.json`, `exemplos.md` e `exemplos.json`, `minera_*.md`, `transcricao_fim.json` (fim das transcrições, lido do Viral Data). Código em `src/comando/` (`feat.mjs` tem as regex e o recorte da transcrição, com self-check).
