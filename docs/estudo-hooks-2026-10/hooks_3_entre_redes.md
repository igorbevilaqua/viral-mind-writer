# Hooks que funcionam em todas as redes: o que eles têm de especial

*Viral Media Labs · base: Oráculo (`oraculo.fato_video` + `public.videos.crm_script_id`), consulta de 17/10/2026*

## Método

- **Mesmo conteúdo em redes diferentes** = mesmo `crm_script_id` (mesmo roteiro, um vídeo por rede). Para cada par (roteiro, rede), entra só a publicação com mais views.
- **Ficaram de fora:** roteiros com qualquer vídeo ainda **maturando**, e vídeos marcados como `removido` ou `is_repost`.
- **Acerto** = `classificacao = 'acerto'`, ou seja, acima do limiar do próprio canal (o maior entre 10k e 3x a mediana). **Coeficiente** = views ÷ mediana móvel do canal. Por isso dá para comparar redes de tamanhos diferentes.
- **Universo:** **1.618 roteiros publicados em 3 ou mais redes** (1.389 em 3 redes, 229 nas 4), de 24 clientes. A combinação mais comum é IG + TikTok + YouTube. O Facebook aparece em poucos clientes (Izabela, Rafael, Marcio, Marcos, Cadu, Lincoln, Franklin, Thainá, Renato Torres e outros).
- **O campo `hook` é transcrição.** Diferenças pequenas entre redes ("Zuckberg" × "Zuckerberg", "dois mil e vinte e sete" × "2027", "[música]") são ruído de transcrição, não um hook diferente.
- **Viés importante:** **Izabela Anholett** é a única cliente com volume grande nas 4 redes. Ela tem 30 dos 93 acertos universais e 56 dos 121 roteiros com acerto em 3 ou mais redes. Por isso toda leitura de perfil abaixo aparece também **sem a Izabela**.

---

## 1. Acerto universal: quantos roteiros acertam em todas as redes

| Redes publicadas | Roteiros | Acerto em 0 | em 1 | em 2 | em 3 | em 4 | **Acerto em TODAS** | Acima de 100k em todas |
|---|---|---|---|---|---|---|---|---|
| 3 redes | 1.389 | 888 | 257 | 179 | 65 | – | **65 (4,7%)** | 22 |
| 4 redes | 229 | 74 | 72 | 27 | 28 | 28 | **28 (12,2%)** | 21 |
| **Total** | **1.618** | 962 | 329 | 206 | 93 | 28 | **93 (5,7%)** | **43** |

- **Acerto em 3 redes ou mais:** 121 roteiros (7,5%). **Acerto em pelo menos uma rede:** 656 (40,5%).
- **O acaso explicaria bem menos.** Pelas taxas de acerto de cada rede (IG 23,9%, TikTok 22,2%, YouTube 19,5%), se as redes fossem independentes, acertar nas três aconteceria em cerca de **1%** dos roteiros (0,239 × 0,222 × 0,195). O observado é 4,7% em 3 redes e 5,7% no total, de 4 a 5 vezes mais. Ou seja, existe um "fator conteúdo/hook" comum às redes.

**Acertos universais por cliente** (roteiros em 3+ redes / acerto em todas / acerto em 3+):
Izabela Anholett 228 / 30 / 56 · Rafael Rodrigues 210 / 17 / 17 · Marcio Grazino 146 / 14 / 16 · Dilson Peres 75 / 11 / 11 · Lincoln Fracari 97 / 6 / 6 · Pedro Elero 69 / 4 / 4 · Thiago Bisewski 30 / 4 / 4 · Marcos Pelozato 102 / 3 / 3 · Fernando Pereira 64 / 2 / 2 · Leonardo Nogueira 35 / 1 / 1 · Franklin Tomich 6 / 1 / 1.
Nenhum acerto universal: Rodrigo Waughan (127 roteiros), Thiago Franco (96), Manoel Victor (67), Cadu Neiva (64), Renato Mendes (63), João Paulo Albuquerque (55), entre outros.

### 1a. Top 20 "acertos universais"

Ordem: número de redes com acerto e, em seguida, mediana do coeficiente entre as redes. O ranking puro sai 100% Izabela, porque ela é a única com 4 redes e 4 acertos. O hook é o mesmo em todas as redes (só muda a transcrição).

| # | Cliente · data | Hook (literal) | FB | IG | TikTok | YouTube | Mediana do coef. |
|---|---|---|---|---|---|---|---|
| 1 | Izabela · 07/08 | "A Samsung lançou um par de óculos que é o começo do fim da era do celular. Deixa eu te explicar." | [557k · 20,6x](https://www.facebook.com/reel/2150015449258037) | [9,39M · 146,7x](https://www.instagram.com/reel/DbvGvW2hRek) | [455k · 27,8x](https://www.tiktok.com/@izabela.anholett/video/7669659195427376405) | [2,72M · 163,3x](https://www.youtube.com/shorts/uI-qstDty4Y) | 87,2 |
| 2 | Izabela · 11/06 | "A contagem regressiva começou. A China vai implementar no Brasil os pagamentos com a palma da mão, ainda esse ano." | [255k · 13,1x](https://www.facebook.com/reel/1727613015357583) | [3,48M · 79,1x](https://www.instagram.com/reel/DZcVckKByOp) | [1,10M · 83,8x](https://www.tiktok.com/@izabela.anholett/video/7649512486550490388) | [176k · 60,0x](https://www.youtube.com/shorts/Bag4yS36oXg) | 69,5 |
| 3 | Izabela · 09/07 | "A China agora tá destruindo os computadores. Isso porque ela criou os primeiros óculos com IA programável do mundo." | [809k · 36,0x](https://www.facebook.com/reel/1749778832876995) | [1,33M · 24,2x](https://www.instagram.com/reel/DakboQ0Bfla) | [1,02M · 63,5x](https://www.tiktok.com/@izabela.anholett/video/7659966063307934997) | [1,79M · 340,3x](https://www.youtube.com/shorts/SyprPGFoWus) | 49,7 |
| 4 | Izabela · 29/09 | "O dono do Instagram acabou de declarar guerra à Apple. Usando uma arma que pode literalmente mudar o mundo que a gente conhece. E o campo de batalha é o seu rosto, tá?" | [2,10M · 50,6x](https://www.facebook.com/reel/1667967728187258) | [3,15M · 40,1x](https://www.instagram.com/reel/Dd4cgRKzhhw) | [2,23M · 110,1x](https://www.tiktok.com/@izabela.anholett/video/7691032073427012870) | [1,34M · 33,9x](https://www.youtube.com/shorts/12CH99HFtHk) | 45,4 |
| 5 | Izabela · 07/07 | "A Apple oficialmente matou a Siri bobinha e o seu iPhone agora vai ser turbinado pelo Google." | [176k · 7,8x](https://www.facebook.com/reel/27674808922151427) | [1,60M · 30,2x](https://www.instagram.com/reel/DafSJJZhMXs) | [802k · 51,4x](https://www.tiktok.com/@izabela.anholett/video/7657938250266447121) | [524k · 101,9x](https://www.youtube.com/shorts/2HRRoDok-CI) | 40,8 |
| 6 | Izabela · 20/05 | "A Apple acabou de declarar guerra ao Mark Zuckerberg, e o seu próximo iPhone não vai estar no seu bolso, mas sim no seu rosto." | [176k · 8,8x](https://www.facebook.com/reel/27808738062061403) | [1,78M · 57,7x](https://www.instagram.com/reel/DYjr8VwBC53) | [40k · 3,0x](https://www.tiktok.com/@izabela.anholett/video/7641762657107840276) | [363k · 164,9x](https://www.youtube.com/shorts/QCBN753lLrc) | 33,2 |
| 7 | Izabela · 05/06 | "A criadora do ChatGPT tá preparando um golpe que vai destruir o iPhone em 2027. Um celular com IA e sem os apps tradicionais. Quase ninguém tá percebendo o que isso significa." | [181k · 9,3x](https://www.facebook.com/reel/1534601124834491) | [1,91M · 48,4x](https://www.instagram.com/reel/DZM4mrahLTo) | [222k · 16,8x](https://www.tiktok.com/@izabela.anholett/video/7645500077158468885) | [577k · 214,0x](https://www.youtube.com/shorts/YvMkK7sJMD4) | 32,6 |
| 8 | Izabela · 23/05 | "O Elon Musk acabou de ser humilhado pela China com o que ela acabou de liberar para o mundo." | [385k · 18,8x](https://www.facebook.com/reel/970152475816405) | [869k · 27,1x](https://www.instagram.com/reel/DYrpwcbhHwR) | [255k · 17,7x](https://www.tiktok.com/@izabela.anholett/video/7642889764588375303) | [600k · 249,1x](https://www.youtube.com/shorts/tr7psrGU4fc) | 22,9 |
| 9 | Izabela · 08/10 | "Estão dizendo que a China acabou de humilhar a câmera do iPhone. Isso porque a empresa chinesa Honor lançou um celular com braço robótico de titânio…" | [1,60M · 32,6x](https://www.facebook.com/reel/2174161500651990) | [433k · 5,0x](https://www.instagram.com/reel/DeOwCAeB5K4) | [865k · 36,1x](https://www.tiktok.com/@izabela.anholett/video/7694140838712036628) | [587k · 12,3x](https://www.youtube.com/shorts/oEO19e6hA5I) | 22,5 |
| 10 | Izabela · 29/06 | "Essa empresa quer colocar inteligência artificial dentro do seu olho, e a ferramenta já foi criada. Parece Black Mirror, mas ele é real." | [333k · 13,9x](https://www.facebook.com/reel/1047015334978754) | [879k · 16,6x](https://www.instagram.com/reel/DaKrvkAhbW6) | [1,04M · 65,1x](https://www.tiktok.com/@izabela.anholett/video/7655161762660076820) | [111k · 25,0x](https://www.youtube.com/shorts/lVY9tMscaLI) | 20,8 |
| 11 | Izabela · 11/07 | "A Apple agora vai colocar uma câmera no seu ouvido, vai ver tudo ao seu redor em tempo real." | [130k · 5,4x](https://www.facebook.com/reel/3492107080938875) | [347k · 6,2x](https://www.instagram.com/reel/Dap0rWsBpev) | [563k · 35,0x](https://www.tiktok.com/@izabela.anholett/video/7660946700239899924) | [203k · 36,5x](https://www.youtube.com/shorts/_YYq0zX4qtc) | 20,6 |
| 12 | Izabela · 10/07 | "Parece mentira, mas a China acabou de abrir a pré-venda de um robô humanoide hiper-realista criado pra ser seu companheiro." | [195k · 8,5x](https://www.facebook.com/reel/1680163226427599) | [532k · 9,6x](https://www.instagram.com/reel/DanAb4SB73r) | [440k · 27,4x](https://www.tiktok.com/@izabela.anholett/video/7659969095172918548) | [385k · 72,7x](https://www.youtube.com/shorts/gi5HnolLW0g) | 18,5 |
| 13 | Izabela · 19/09 | "O Mark Zuckerberg deve tá em choque. Esse inventor de 20 anos na Nigéria, sem muitos recursos, criou um óculos inteligente…" | [1,00M · 27,8x](https://www.facebook.com/reel/2173136650289164) | [542k · 7,1x](https://www.instagram.com/reel/DdeEZKohBya) | [469k · 26,1x](https://www.tiktok.com/@izabela.anholett/video/7686300277384727826) | [351k · 9,8x](https://www.youtube.com/shorts/mHFux-jSdJY) | 17,9 |
| 14 | Izabela · 21/06 | "A China acabou de criar um colar com inteligência artificial que traduz o que o seu pet está dizendo para o português." | [147k · 6,5x](https://www.facebook.com/reel/2155290458365930) | [756k · 16,1x](https://www.instagram.com/reel/DZ2U38YBfzW) | [240k · 17,5x](https://www.tiktok.com/@izabela.anholett/video/7653265691939785992) | [61k · 15,7x](https://www.youtube.com/shorts/HPIR8mjUT3s) | 15,9 |
| 15 | Izabela · 15/04 | "O Google matou o Duolingo com essa nova ferramenta secreta e gratuita." | [273k · 13,7x](https://www.facebook.com/reel/1277875851156355) | [356k · 15,5x](https://www.instagram.com/reel/DXJkJQ-hOSA) | [929k · 61,2x](https://www.tiktok.com/@izabela.anholett/video/7628788815351614721) | [11k · 8,2x](https://www.youtube.com/shorts/TobQG97IqFQ) | 14,6 |
| 16 | Izabela · 03/10 | "O ChatGPT acabou de lançar uma atualização que pode ser o começo do fim dos empregos que a gente conhece, mas quase ninguém percebeu." | [858k · 17,9x](https://www.facebook.com/reel/1564428971632228) | [815k · 9,9x](https://www.instagram.com/reel/DeCFbf-T-OA) | [1,25M · 59,5x](https://www.tiktok.com/@izabela.anholett/video/7692094460536147220) | [403k · 9,6x](https://www.youtube.com/shorts/T9mKARfuByU) | 13,9 |
| 17 | Izabela · 19/07 | "O Japão deu um golpe nas IAs dos Estados Unidos e escolheu o melhor pior momento possível para isso." | [346k · 15,0x](https://www.facebook.com/reel/1108783775437635) | [276k · 4,9x](https://www.instagram.com/reel/Da-bmVtz3nm) | [185k · 11,5x](https://www.tiktok.com/@izabela.anholett/video/7663715272792067348) | [258k · 27,2x](https://www.youtube.com/shorts/E3mzfxTCASA) | 13,3 |
| 18 | Izabela · 28/06 | "A coisa mais perigosa dessa foto não é o rosto dele, mas sim o sinal de paz e amor." | [348k · 15,1x](https://www.facebook.com/reel/1524669502685152) | [585k · 11,2x](https://www.instagram.com/reel/DaIbO--T4vl) | [142k · 9,1x](https://www.tiktok.com/@izabela.anholett/video/7655152788640468245) | [409k · 92,8x](https://www.youtube.com/shorts/gI-7faogRcY) | 13,2 |
| 19 | Izabela · 23/07 | "Tem mulheres na Índia sendo pagas para filmar a si mesmas cozinhando na própria casa. E o motivo ele é mais perturbador do que parece." | [185k · 7,7x](https://www.facebook.com/reel/2079661852657967) | [228k · 4,1x](https://www.instagram.com/reel/DbIhTbzTfGf) | [239k · 14,7x](https://www.tiktok.com/@izabela.anholett/video/7665167970024377621) | [239k · 21,9x](https://www.youtube.com/shorts/HFMcuLnfy7w) | 11,2 |
| 20 | Izabela · 18/05 | "Você acha que sabe o que é inteligência artificial? Eu garanto que você não faz ideia." | [345k · 17,3x](https://www.facebook.com/reel/2179252566253236) | [124k · 4,0x](https://www.instagram.com/reel/DYhHGsLBT43) | [62k · 4,7x](https://www.tiktok.com/@izabela.anholett/video/7641072419234483477) | [96k · 45,2x](https://www.youtube.com/shorts/Bob2nPJshco) | 11,0 |

Todos os 20 são acerto nas 4 redes.

### 1b. Top 20 "acertos universais" sem a Izabela (máximo de 3 por cliente)

Todos têm acerto nas 3 redes publicadas (IG, TikTok, YouTube, a menos que esteja indicado outra combinação).

| # | Cliente · data | Hook (literal) | IG | TikTok | YouTube | Mediana do coef. |
|---|---|---|---|---|---|---|
| 1 | Thiago Bisewski · 15/09 | "A China acabou de humilhar o resto do mundo mais uma vez, e agora foi dando uma facada no coração da indústria automobilística." | [224k · 81,3x](https://www.instagram.com/reel/DdTifh5RbIl) | [733k · 449,9x](https://www.tiktok.com/@thiagobisewski/video/7685736723988483348) | [683k · 882,0x](https://www.youtube.com/shorts/eF6Y3LzVvuE) | 449,9 |
| 2 | Marcio Grazino · 18/03 | "Antigamente, você tinha vergonha de usar Olympikus na escola. Hoje em dia, ela humilha a Nike e a Adidas no Brasil." | [649k · 101,0x](https://www.instagram.com/reel/DWBOY0QjSv4) | [1,30M · 741,8x](https://www.tiktok.com/@marcio.grazino/video/7618421911848094994) | [454k · 277,8x](https://www.youtube.com/shorts/CiiztW8lgFg) | 277,8 |
| 3 | Rafael Rodrigues · 22/04 | "Um nordestino de apenas 14 anos criou uma máquina que pode salvar mais de 2 bilhões de pessoas." | [134k · 35,3x](https://www.instagram.com/reel/DXcqxyQD9rG) | [207k · 243,4x](https://www.tiktok.com/@rafaelrodriguesluiz/video/7631689058183351559) | [1,08M · 866,7x](https://www.youtube.com/shorts/pdWWbMISqqI) | 243,4 |
| 4 | Pedro Elero · 19/09 | "Essa marca de carros que já está no Brasil acabou de fazer o impossível. Ela criou um sistema que faz 45 km com apenas 1 litro de gasolina." | [12k · 5,7x](https://www.instagram.com/reel/DdeNrVekxR0) | [278k · 484,6x](https://www.tiktok.com/@pedro_elero/video/7687261571130608903) | [425k · 237,9x](https://www.youtube.com/shorts/q_NJSRj-Vng) | 237,9 |
| 5 | Lincoln Fracari · 05/04 | "A China está construindo um verdadeiro país paralelo no nordeste brasileiro e quase ninguém está percebendo isso." | [1,21M · 164,0x](https://www.instagram.com/reel/DWxFzHvjhyk) | [670k · 291,1x](https://www.tiktok.com/@lincolnfracari/video/7625446328075848981) | [21k · 12,3x](https://www.youtube.com/shorts/TF3669jAKEE) | 164,0 |
| 6 | Pedro Elero · 16/09 | "Uma das famílias mais ricas do Brasil tem mais de 170 herdeiros. E todos eles estão proibidos de mandar na empresa. Mas, o mais curioso é que foram eles mesmo que se proibiram." | [124k · 59,4x](https://www.instagram.com/reel/DdWfdeQlVrC) | [114k · 208,0x](https://www.tiktok.com/@pedro_elero/video/7686148334846774548) | [266k · 152,0x](https://www.youtube.com/shorts/6KmQPF1Uaco) | 152,0 |
| 7 | Rafael Rodrigues · 25/04 | "Os gênios do Brasil não estão em São Paulo ou no Rio. Na verdade, eles vêm de um estado do Nordeste. E isso não é por acaso." | [620k · 139,6x](https://www.instagram.com/reel/DXkcaK3j4ct) | [146k · 163,0x](https://www.tiktok.com/@rafaelrodriguesluiz/video/7632810269936323847) | [63k · 48,9x](https://www.youtube.com/shorts/AcJIe1nlAbU) | 139,6 |
| 8 | Fernando Pereira · 12/03 | "A empresa mais valiosa do mundo acabou de emitir [palavra faltando na transcrição] que ninguém queria ouvir." | [844k · 132,7x](https://www.instagram.com/reel/DVzCXslj2aC) | [420k · 117,2x](https://www.tiktok.com/@fernandopereira.finance/video/7616466575205436692) | [327k · 125,5x](https://www.youtube.com/shorts/FcGY_lupK74) | 125,5 |
| 9 | Leonardo Nogueira · 21/06 | *(hook não transcrito; categorias: carro elétrico / inovação)* | [197k · 14,2x](https://www.instagram.com/reel/DZ2OwErudA4) | [466k · 120,6x](https://www.tiktok.com/@leonardo.nogueira162/video/7653820135257574676) | [379k · 357,6x](https://www.youtube.com/shorts/Rf-MsjU70_0) | 120,6 |
| 10 | Rafael Rodrigues · 28/03 | "A Nike passou vergonha ao esquecer o mais importante sobre o Brasil. Nós somos brasileiros." | [323k · 107,6x](https://www.instagram.com/reel/DWchpM_j7ac) | [490k · 630,1x](https://www.tiktok.com/@rafaelrodriguesluiz/video/7622445343443029255) | [38k · 36,0x](https://www.youtube.com/shorts/ZiGzE8yw8Lg) | 107,6 |
| 11 | Marcio Grazino · 26/07 | "Uma gambiarra insana de um brasileiro virou uma economia de 13 milhões de litros de água." | [865k · 59,7x](https://www.instagram.com/reel/DbRQlG7xhNs) | [395k · 126,8x](https://www.tiktok.com/@marcio.grazino/video/7666937765505846548) | [878k · 98,7x](https://www.youtube.com/shorts/J71Dwmc2MGk) | 98,7 |
| 12 | Marcos Pelozato · 14/08 | "A Casas Bahia sobreviveu à hiperinflação, Plano Collor e pandemia. Agora fechou 298 lojas de uma vez e pouca gente consegue entender o porquê." | [227k · 22,9x](https://www.instagram.com/reel/DcCzESsscbT) | [899k · 1356,3x](https://www.tiktok.com/@marcospelozato/video/7674077995404922130) | [239k · 67,5x](https://www.youtube.com/shorts/dS887X28d5U) | 67,5 |
| 13 | Marcio Grazino · 20/04 | "Três estudantes de escola pública no interior da Bahia fizeram o que a indústria do chocolate não fez em 50 anos." | [763k · 124,4x](https://www.instagram.com/reel/DXXnUopEU-f) | [265k · 56,8x](https://www.tiktok.com/@marcio.grazino/video/7630959626506259732) | [41k · 3,8x](https://www.youtube.com/shorts/mTsJvDwEULc) | 56,8 |
| 14 | Pedro Elero · 03/09 | "O Botafogo acabou de dar uma aula, não de futebol, mas sim de como tomar a pior decisão financeira do ano." | [107k · 53,0x](https://www.instagram.com/reel/Dc0s5JZDRXl) | [137k · 291,2x](https://www.tiktok.com/@pedro_elero/video/7681277833951317265) | [11k · 6,7x](https://www.youtube.com/shorts/s3TEjy1IHUk) | 53,0 |
| 15 | Thiago Bisewski · 21/09 | "O Japão vai colocar o Jarvis do Homem de Ferro na sua cabeça com esse capacete futurista." | [185k · 38,4x](https://www.instagram.com/reel/DdkOyHLxm9Y) | [39k · 20,5x](https://www.tiktok.com/@thiagobisewski/video/7688119271393725716) | [116k · 38,6x](https://www.youtube.com/shorts/XCEri3m9KTM) | 38,4 |
| 16 | Lincoln Fracari · 01/06 | "Essa máscara parece coisa de ficção científica, mas virou uma febre na China e pode ser o maior pesadelo do Duolingo." | [500k · 28,9x](https://www.instagram.com/reel/DZDy_tByevR) | [233k · 123,0x](https://www.tiktok.com/@lincolnfracari/video/7646511649955826952) | [131k · 8,1x](https://www.youtube.com/shorts/w5sYPfbvMDo) | 28,9 |
| 17 | Dilson Peres · 26/04 | "O Silvio Santos fez uma jogada genial que evitou qualquer dor de cabeça para sua família após a sua morte." | [1,31M · 26,8x](https://www.instagram.com/reel/DXkt-uODQv4) | [267k · 12,8x](https://www.tiktok.com/@doutortax/video/7633204312407067925) | [5,75M · 237,8x](https://www.youtube.com/shorts/Mny2Yyps5Ag) | 26,8 |
| 18 | Dilson Peres · 25/09 | "Os bancos vão cobrar um pedágio do governo toda vez que alguém fizer um pix ou passar o cartão. E adivinha quem vai pagar a conta?" | [1,05M · 26,4x](https://www.instagram.com/reel/Ddue5rGvzRq) | [290k · 62,6x](https://www.tiktok.com/@doutortax/video/7689556115364891924) | [1,09M · 12,8x](https://www.youtube.com/shorts/XsGkMb5x6Jo) | 26,4 |
| 19 | Marcos Pelozato · 15/06 | "Essa empresa dominava o mercado de telhas no Brasil, até que a justiça proibiu o único produto que mantinha tudo de pé…" | [74k · 10,9x](https://www.instagram.com/reel/DZnu9bhBBV4) | [25k · 23,0x](https://www.tiktok.com/@marcospelozato/video/7651723980113497352) | [282k · 145,9x](https://www.youtube.com/shorts/YvZSiHzOST8) | 23,0 |
| 20 | Dilson Peres · 02/04 | "O Ratinho não ficou bilionário com o SBT, e ele não ficou bilionário com o salário do SBT." | [481k · 22,4x](https://www.instagram.com/reel/DWpREWBDR-6) | [358k · 21,9x](https://www.tiktok.com/@doutortax/video/7624280985433099538) | [298k · 15,6x](https://www.youtube.com/shorts/dbhb1iugzIM) | 21,9 |

Também acertaram em todas as redes: Franklin Tomich (FB + IG + YT, [FB 105k](https://www.facebook.com/reel/1057852820231595/) · [IG 127k](https://www.instagram.com/reel/DZ6L_xlt65F) · [YT 23k](https://www.youtube.com/shorts/LxiTrSzpzo8); hook não transcrito), Lincoln ("A China criou um celular que vira um videogame…"), Thiago Bisewski ("Os chineses descobriram como fazer um objeto sólido aparecer do nada…"), Marcos Pelozato ("A marca de óculos mais conhecida do Brasil está devendo quase 600 milhões…") e Fernando Pereira ("Essa nova ameaça à economia da China…").

---

## 2. Top 20 por views somadas entre redes (roteiros em 3+ redes)

| # | Cliente | Hook | Total | FB | IG | TikTok | YouTube | Redes com acerto |
|---|---|---|---|---|---|---|---|---|
| 1 | Izabela | "A Samsung lançou um par de óculos que é o começo do fim da era do celular." | 13,12M | [557k](https://www.facebook.com/reel/2150015449258037) | [9,39M](https://www.instagram.com/reel/DbvGvW2hRek) | [455k](https://www.tiktok.com/@izabela.anholett/video/7669659195427376405) | [2,72M](https://www.youtube.com/shorts/uI-qstDty4Y) | 4/4 |
| 2 | Fernando Pereira | "O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar." | 9,48M | – | [3,21M · 544x](https://www.instagram.com/reel/DVbunyzDvij) | [6,26M · 3661x](https://www.tiktok.com/@fernandopereira.finance/video/7613106734680329493) | [8k · 3,1x](https://www.youtube.com/shorts/TJy-SCaxCqM) | 2/3 |
| 3 | Izabela | "O dono do Instagram acabou de declarar guerra à Apple…" | 8,82M | [2,10M](https://www.facebook.com/reel/1667967728187258) | [3,15M](https://www.instagram.com/reel/Dd4cgRKzhhw) | [2,23M](https://www.tiktok.com/@izabela.anholett/video/7691032073427012870) | [1,34M](https://www.youtube.com/shorts/12CH99HFtHk) | 4/4 |
| 4 | Dilson Peres | "O Silvio Santos fez uma jogada genial que evitou qualquer dor de cabeça para sua família após a sua morte." | 7,32M | – | [1,31M](https://www.instagram.com/reel/DXkt-uODQv4) | [267k](https://www.tiktok.com/@doutortax/video/7633204312407067925) | [5,75M](https://www.youtube.com/shorts/Mny2Yyps5Ag) | 3/3 |
| 5 | Leonardo Nogueira | "Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica." | 6,60M | – | [6,19M · 438x](https://www.instagram.com/reel/DYo3ldvOFHW) | [402k · 130x](https://www.tiktok.com/@leonardo.nogueira162/video/7643034699543104788) | [3k · 3,0x](https://www.youtube.com/shorts/eP1bW4ReQSg) | 2/3 |
| 6 | Izabela | "A contagem regressiva começou. A China vai implementar no Brasil os pagamentos com a palma da mão…" | 5,01M | [255k](https://www.facebook.com/reel/1727613015357583) | [3,48M](https://www.instagram.com/reel/DZcVckKByOp) | [1,10M](https://www.tiktok.com/@izabela.anholett/video/7649512486550490388) | [176k](https://www.youtube.com/shorts/Bag4yS36oXg) | 4/4 |
| 7 | Izabela | "A China agora tá destruindo os computadores…" | 4,95M | [809k](https://www.facebook.com/reel/1749778832876995) | [1,33M](https://www.instagram.com/reel/DakboQ0Bfla) | [1,02M](https://www.tiktok.com/@izabela.anholett/video/7659966063307934997) | [1,79M](https://www.youtube.com/shorts/SyprPGFoWus) | 4/4 |
| 8 | Dilson Peres | *(hook não transcrito; título: "O GOVERNO VAI TE DAR CNPJ SEM VIRAR EMPRESA!")* | 3,69M | – | [482k](https://www.instagram.com/reel/DZvkP1bB2-r) | [38k](https://www.tiktok.com/@doutortax/video/7652791760409742600) | [3,17M](https://www.youtube.com/shorts/Po0ZMk6PeGw) | 3/3 |
| 9 | Izabela | "Estão dizendo que a China acabou de humilhar a câmera do iPhone…" | 3,48M | [1,60M](https://www.facebook.com/reel/2174161500651990) | [433k](https://www.instagram.com/reel/DeOwCAeB5K4) | [865k](https://www.tiktok.com/@izabela.anholett/video/7694140838712036628) | [587k](https://www.youtube.com/shorts/oEO19e6hA5I) | 4/4 |
| 10 | Izabela | "A China acabou de destruir o ChatGPT e quase ninguém percebeu." | 3,39M | [1,10M](https://www.facebook.com/reel/1565321458257390) | [1,28M](https://www.instagram.com/reel/DVYRG02DV4S) | [1,01M](https://www.tiktok.com/@izabela.anholett/video/7609159254041234695) | [3k · 2,0x](https://www.youtube.com/shorts/CHEQiQcLrOA) | 3/4 |
| 11 | Izabela | "O ChatGPT acabou de lançar uma atualização que pode ser o começo do fim dos empregos…" | 3,32M | [858k](https://www.facebook.com/reel/1564428971632228) | [815k](https://www.instagram.com/reel/DeCFbf-T-OA) | [1,25M](https://www.tiktok.com/@izabela.anholett/video/7692094460536147220) | [403k](https://www.youtube.com/shorts/T9mKARfuByU) | 4/4 |
| 12 | Izabela | "A Apple oficialmente matou a Siri bobinha…" | 3,10M | [176k](https://www.facebook.com/reel/27674808922151427) | [1,60M](https://www.instagram.com/reel/DafSJJZhMXs) | [802k](https://www.tiktok.com/@izabela.anholett/video/7657938250266447121) | [524k](https://www.youtube.com/shorts/2HRRoDok-CI) | 4/4 |
| 13 | Izabela | "A criadora do ChatGPT tá preparando um golpe que vai destruir o iPhone em 2027…" | 2,89M | [181k](https://www.facebook.com/reel/1534601124834491) | [1,91M](https://www.instagram.com/reel/DZM4mrahLTo) | [222k](https://www.tiktok.com/@izabela.anholett/video/7645500077158468885) | [577k](https://www.youtube.com/shorts/YvMkK7sJMD4) | 4/4 |
| 14 | Izabela | "O Google e a Samsung acabaram de declarar guerra ao Mark Zuckerberg. E o seu próximo celular não vai estar no seu bolso, vai estar no seu rosto." | 2,69M | [50k · 2,4x](https://www.facebook.com/reel/3093059270885368) | [658k](https://www.instagram.com/reel/DZuXAgWhE6c) | [1,34M](https://www.tiktok.com/@izabela.anholett/video/7652522714443369736) | [646k](https://www.youtube.com/shorts/V2ZDHgj0Adk) | 3/4 |
| 15 | Dilson Peres | "Os bancos vão cobrar um pedágio do governo toda vez que alguém fizer um pix…" | 2,43M | – | [1,05M](https://www.instagram.com/reel/Ddue5rGvzRq) | [290k](https://www.tiktok.com/@doutortax/video/7689556115364891924) | [1,09M](https://www.youtube.com/shorts/XsGkMb5x6Jo) | 3/3 |
| 16 | Marcio Grazino | "Antigamente, você tinha vergonha de usar Olympikus na escola…" | 2,40M | – | [649k](https://www.instagram.com/reel/DWBOY0QjSv4) | [1,30M](https://www.tiktok.com/@marcio.grazino/video/7618421911848094994) | [454k](https://www.youtube.com/shorts/CiiztW8lgFg) | 3/3 |
| 17 | Izabela | "Essa empresa quer colocar inteligência artificial dentro do seu olho…" | 2,37M | [333k](https://www.facebook.com/reel/1047015334978754) | [879k](https://www.instagram.com/reel/DaKrvkAhbW6) | [1,04M](https://www.tiktok.com/@izabela.anholett/video/7655161762660076820) | [111k](https://www.youtube.com/shorts/lVY9tMscaLI) | 4/4 |
| 18 | Izabela | "O Mark Zuckerberg deve tá em choque…" | 2,36M | [1,00M](https://www.facebook.com/reel/2173136650289164) | [542k](https://www.instagram.com/reel/DdeEZKohBya) | [469k](https://www.tiktok.com/@izabela.anholett/video/7686300277384727826) | [351k](https://www.youtube.com/shorts/mHFux-jSdJY) | 4/4 |
| 19 | Izabela | "A Apple acabou de declarar guerra ao Mark Zuckerberg…" | 2,36M | [176k](https://www.facebook.com/reel/27808738062061403) | [1,78M](https://www.instagram.com/reel/DYjr8VwBC53) | [40k](https://www.tiktok.com/@izabela.anholett/video/7641762657107840276) | [363k](https://www.youtube.com/shorts/QCBN753lLrc) | 4/4 |
| 20 | Dilson Peres | "Esse homem recebe em torno de 4 milhões por mês da Globo. Mesmo assim, o salário não explica nem metade da fortuna dele. Esse é o Luciano Huck…" | 2,31M | – | [529k](https://www.instagram.com/reel/Dc11fw-BxzF) | [961k](https://www.tiktok.com/@doutortax/video/7681408196501589268) | [817k](https://www.youtube.com/shorts/93mxy2vQyfU) | 3/3 |

**O que esse ranking mostra:** 16 dos 20 tiveram acerto em todas as redes. As exceções são o petróleo do Fernando (YouTube 8k), o taxista do Leonardo (YouTube 3k), "A China destruiu o ChatGPT" (YouTube 3k) e "Google e Samsung declararam guerra ao Zuckerberg" (Facebook 50k). **Volume alto entre redes vem quase sempre de acertar em todas, não de um único mega-hit.**

---

## 3. Contraste: roteiros que explodiram em uma rede só

Critério: acerto em uma única rede, e a melhor rede com pelo menos 5x as views da segunda. São **140 roteiros**. A rede vencedora foi o **Instagram em 89 (64%)**, o YouTube em 27, o TikTok em 22 e o Facebook em 2.

Top 10 por views da rede vencedora:

| # | Cliente | Venceu em | Razão sobre a 2ª rede | O hook era igual? | Rede vencedora | Outras redes |
|---|---|---|---|---|---|---|
| 1 | Dilson Peres | IG 2,13M (32,2x) | 45,5 | **Igual:** "A sua cerveja do final de semana vai ficar mais cara por conta do governo." | [IG](https://www.instagram.com/reel/DX-KBg-thjK) | [YT 47k](https://www.youtube.com/shorts/Z4rSYFqF0oU) · [TT 9k](https://www.tiktok.com/@doutortax/video/7636514685843574037) |
| 2 | Café com Ferri | IG 1,11M (53,6x) | 2951 | **Igual:** "Nikolas Ferreira te enganou esse tempo todo. Ele fala que é apenas um simples político, mas na verdade, ele é o maior comunicador do Brasil." | [IG](https://www.instagram.com/reel/DbB2sYbp5VF) | [TT 374](https://www.tiktok.com/@cafecomferri/video/7664722695472336149) · [YT 66](https://www.youtube.com/shorts/yq0NqUK2YX8) |
| 3 | Dilson Peres | YT 692k (16,9x) | 13,2 | **Igual:** "A Larissa Manoela acumulou 18 milhões de reais, mas não tinha acesso à própria conta bancária. O pior é que tudo isso era legal." | [YT](https://www.youtube.com/shorts/QXP29Vur2zw) | [IG 52k](https://www.instagram.com/reel/DZI9P8ftTd5) · [TT 13k](https://www.tiktok.com/@doutortax/video/7647294568878148884) |
| 4 | Marcos Pelozato | YT 582k (161,2x) | 95,4 | **Igual:** "Quando Elon Musk tinha 3 anos de idade, esse brasileiro já tinha um carro elétrico rodando na rua. O triste foi o fim que ele levou." | [YT](https://www.youtube.com/shorts/Urt4n7qmmB4) | [IG 6k](https://www.instagram.com/reel/DcPOJqTuAYm) · [TT 906](https://www.tiktok.com/@marcospelozato/video/7675868352975293704) |
| 5 | Renato Mendes | TT 576k (496,6x) | 165,9 | **Igual:** "A China declarou guerra ao carro mais amado do Brasil. E em agosto, o Corolla perdeu o trono pela primeira vez na história." | [TT](https://www.tiktok.com/@renatofmendes79/video/7684211577305746708) | [IG 3k](https://www.instagram.com/reel/DdJHpicB5ZV) · [YT 1k](https://www.youtube.com/shorts/ttHplN1VVVE) |
| 6 | Rodrigo Waughan | IG 544k (176,9x) | 157,5 | **Igual:** "A maior banda do mundo cancelou um show milionário por causa de um simples M&M marrom." | [IG](https://www.instagram.com/reel/DWEHDe8DlJz) | [YT 3k](https://www.youtube.com/shorts/sQjVOqzG9Ow) · [TT 942](https://www.tiktok.com/@.rodrigowaughan/video/7618935481518263572) |
| 7 | Cadu Neiva | IG 504k (11,9x) | 8,1 | **Diferente no TikTok:** o IG usou a frase curta "Dois nordestinos resolveram o problema da dengue com 36 centavos." O TikTok emendou "…enquanto o governo investia bilhões… dois adolescentes cearenses resolveram o problema gastando migalhas." | [IG](https://www.instagram.com/reel/DaHFKcxJ2Kc) | [TT 62k](https://www.tiktok.com/@caduneiva/video/7656252602069306642) · [YT 4k](https://www.youtube.com/shorts/aOX4IipBu4A) |
| 8 | Leonardo Nogueira | TT 439k (111,3x) | 61,1 | **Igual:** "O carro do presidente dos Estados Unidos é muito mais insano do que você imagina." | [TT](https://www.tiktok.com/@leonardo.nogueira162/video/7670254479744290068) | [IG 7k](https://www.instagram.com/reel/DboQ3MIP_gk) · [YT 912](https://www.youtube.com/shorts/2fSw2IkR4ZM) |
| 9 | Dilson Peres | YT 417k (12,2x) | 18,0 | **Diferente de verdade.** O YouTube abriu com o número: "R$ 6 bilhões [86 bi] de reais em mercadorias foram usadas para sonegar imposto bem na frente dos olhos do governo." O IG abriu com "O que? no porto do Rio de Janeiro. E o que encontraram lá…" e deixou o número para o fim. | [YT](https://www.youtube.com/shorts/g1D21krOPso) | [IG 23k](https://www.instagram.com/reel/DY2-kgOtE2N) · [TT 4k](https://www.tiktok.com/@doutortax/video/7644703626065186068) |
| 10 | Izabela | FB 416k (13,2x) | 5,2 | **Igual:** "O criador do Facebook acabou de declarar guerra tecnológica à China, mas quase ninguém percebeu." | [FB](https://www.facebook.com/reel/1767351140835637) | [IG 79k](https://www.instagram.com/reel/DdOnmBdhe_P) · [YT 42k](https://www.youtube.com/shorts/wH104pYj5u0) · [TT 19k](https://www.tiktok.com/@izabela.anholett/video/7684469164139973909) |

**Leitura:**
- **Em 8 dos 10 casos o hook era literalmente o mesmo.** Hook idêntico não garante resultado em todas as redes: a distribuição de cada rede pesa (a "loteria", sobretudo no Instagram).
- **Hook diferente aparece mais nos casos de rede única.** Comparando os primeiros 25 caracteres normalizados, o hook difere entre redes em **41% dos casos de rede única**, contra **28% dos acertos universais** (35% nos que não acertaram em nenhuma rede). A medida tem ruído de transcrição, mas aponta na mesma direção do caso 9: mexer no hook em uma rede costuma custar caro.
- **Ingrediente que se repete:** nos casos de rede única, o hook tende a ser uma curiosidade local, com um personagem que só um nicho conhece. Exemplos: o "brasileiro que tinha carro elétrico" e a "banda + M&M", que não dizem logo quem é a banda. Entre as categorias, **HISTÓRIA DE EMPRESA/EMPRESÁRIO** gerou 25 casos de rede única e só 10 universais (3,9% de acerto universal, contra a média de 5,7%).

---

## 4. Perfil: hooks universais × hooks de rede única

Hook representativo de cada roteiro: o do Instagram (ou o mais longo, se não houver IG). Os marcadores foram detectados por regex na transcrição.

### 4a. Taxas por grupo (todos os clientes)

| Grupo | Roteiros | Palavras na 1ª frase (mediana) | Palavras no hook | Número | Nome próprio | País/região | Marca/famoso | Pergunta | Contraste ("mas", "enquanto") | Tempo ("acabou de", "agora") | "Quase ninguém percebeu" | Conflito ("guerra", "humilha", "destrói") | "Você/seu" | Superlativo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Universal** (acerto em todas) | 89 | 17 | 24,2 | 31% | 76% | **48%** | **30%** | 8% | 28% | **29%** | 9% | **20%** | 29% | 24% |
| Rede única (5x) | 136 | 15 | 22,9 | 40% | 71% | 34% | 12% | 8% | 28% | 17% | 4% | 17% | 29% | 21% |
| Acerto em 1 rede (sem 5x) | 182 | 16 | 25,3 | 33% | 77% | 41% | 19% | 9% | 24% | 25% | 8% | 15% | 24% | 25% |
| Nenhum acerto | 936 | 16 | 25,1 | 40% | 71% | 31% | 12% | 7% | 25% | 19% | 6% | 9% | 27% | 29% |

### 4b. Mesmo corte sem a Izabela (controle do viés)

| Grupo | Roteiros | Palavras na 1ª frase (mediana) | Número | País/região | Marca/famoso | Pergunta | Contraste | Tempo | "Quase ninguém" | Conflito |
|---|---|---|---|---|---|---|---|---|---|---|
| **Universal** | 60 | 17 | 38% | **53%** | **20%** | **3%** | **30%** | 18% | 8% | 8% |
| Rede única (5x) | 128 | 15 | 41% | 34% | 9% | 9% | 28% | 15% | 2% | 16% |
| Nenhum acerto | 863 | 16 | 41% | 33% | 11% | 6% | 25% | 19% | 5% | 9% |

### 4c. Lift: chance de acerto universal com e sem cada marcador (1.569 roteiros com hook; média de 5,7%)

| Marcador | Hooks com o marcador | % universal (com) | % universal (sem) | Sem Izabela (com / sem) | % acerto em alguma rede (com / sem) |
|---|---|---|---|---|---|
| **Marca/famoso** (Apple, Google, Nike, Musk, Silvio Santos…) | 229 | **11,8%** | 4,6% | **8,6% / 4,0%** | 49,8% / 38,7% |
| **País/região** (China, Brasil, Japão, EUA, Nordeste…) | 544 | **7,9%** | 4,5% | **6,4% / 3,3%** | 46,0% / 37,4% |
| "Quase ninguém percebeu" | 103 | 7,8% | 5,5% | 6,7% / 4,3% | 47,6% / 39,8% |
| Tempo ("acabou de", "agora", "oficialmente") | 336 | 7,7% | 5,1% | 4,2% / 4,5% | 47,0% / 38,5% |
| Conflito ("guerra", "humilha", "destrói", "matou") | 193 | 9,3% | 5,2% | 3,5% / 4,5% | 54,9% / 38,3% |
| Contraste ("mas", "enquanto", "só que") | 395 | 6,3% | 5,5% | 5,3% / 4,2% | 40,5% / 40,3% |
| Nome próprio (qualquer um) | 1.135 | 6,0% | 4,8% | 4,5% / 4,4% | 41,6% / 37,1% |
| Pergunta ("?") | 111 | 6,3% | 5,6% | **2,4% / 4,6%** | 44,1% / 40,1% |
| Número | 596 | 4,7% | 6,3% | 4,2% / 4,6% | 36,4% / 42,8% |
| Superlativo ("maior", "primeiro", "do mundo") | 421 | 5,0% | 5,9% | 4,0% / 4,6% | 36,1% / 41,9% |
| 1ª frase com até 12 palavras | 495 | 5,1% | 6,0% | 3,4% / 4,9% | 41,0% / 40,0% |
| 1ª frase com 20 palavras ou mais | 453 | 6,2% | 5,5% | 5,1% / 4,1% | 37,5% / 41,5% |

### 4d. Categorias com mais acerto universal (mínimo de 20 roteiros; média de 5,7%)

| Categoria | Roteiros | Clientes | Universal | % universal | Rede única (5x) | % acerto em alguma rede |
|---|---|---|---|---|---|---|
| AUTOMAÇÃO | 20 | 6 | 3 | 15,0% | 0 | 65,0% |
| DICAS DE USO DE IA | 49 | 3 | 7 | 14,3% | 0 | 46,9% |
| FUTEBOL | 50 | 14 | 6 | 12,0% | 4 | 48,0% |
| INOVAÇÃO | 230 | 17 | 27 | 11,7% | 14 | 50,4% |
| ROBÓTICA | 28 | 6 | 3 | 10,7% | 0 | 67,9% |
| SUSTENTABILIDADE | 100 | 16 | 10 | 10,0% | 8 | 52,0% |
| IMPOSTOS | 91 | 9 | 9 | 9,9% | 11 | 47,3% |
| INTELIGÊNCIA ARTIFICIAL | 346 | 20 | 32 | 9,2% | 17 | 51,4% |
| … | | | | | | |
| EDUCAÇÃO | 166 | 13 | 9 | 5,4% | 14 | 49,4% |
| HISTÓRIA | 48 | 10 | 2 | 4,2% | 1 | 39,6% |
| **HISTÓRIA DE EMPRESA/EMPRESÁRIO** | 259 | 20 | 10 | **3,9%** | **25** | 27,0% |

**Leitura:**
- **Tamanho não decide.** Hooks curtos (até 12 palavras na 1ª frase) não acertam mais em todas as redes. Os universais têm uma 1ª frase um pouco mais longa (mediana de 17 palavras, contra 15 nos de rede única): é uma frase que já conta a história inteira.
- **Os sinais que sobrevivem sem a Izabela** são três: personagem conhecido (marca ou famoso), âncora geográfica (país ou região) e afirmação em vez de pergunta.
- **"Guerra/humilha/destrói" e "acabou de" são assinatura da Izabela.** Com ela, o lift é forte; sem ela, desaparece. É um estilo que funciona no canal dela, não uma regra geral.
- **Número sozinho não ajuda,** e chega a ser levemente negativo. Os universais usam número como escala de um feito ("13 milhões de litros", "170 herdeiros", "2 bilhões de pessoas"), não como abertura solta.
- **Tema:** tecnologia, inovação, IA e sustentabilidade viajam bem entre redes. História de empresário tende a explodir em uma rede só.

---

## 5. Por rede: qual é mais permissiva e qual é mais exigente

Base: roteiros em 3+ redes, melhor publicação por rede.

| Rede | Roteiros | % acerto (acima do limiar do canal) | Mediana do coeficiente | % acima de 100k | % em que é a rede de maior coeficiente |
|---|---|---|---|---|---|
| Facebook | 257 | **30,0%** | 1,44 | 23,7% | 24,9% |
| Instagram | 1.616 | 23,9% | 1,10 | 16,5% | 25,6% |
| TikTok | 1.598 | 22,2% | 1,13 | 9,1% | 35,9% |
| YouTube | 1.612 | **19,5%** | 1,14 | **8,3%** | 35,1% |

- **Mais permissiva: Facebook.** Tem a maior taxa de acerto e a maior mediana de coeficiente, mas a amostra é pequena e concentrada em poucos clientes.
- **Mais exigente: YouTube.** Tem a menor taxa de acerto e a menor fração acima de 100k, e é a rede **menos previsível a partir das outras** (ver abaixo).
- **TikTok e YouTube** são, cada um, a rede de maior coeficiente em cerca de 35% dos roteiros. Quando pegam, pegam muito acima da mediana do canal (YouTube 882x no Thiago Bisewski, TikTok 3661x no petróleo do Fernando).
- **Instagram é a "loteria":** responde por 64% das explosões em rede única (89 de 140).

### Correlação entre redes (ln do coeficiente, mesmo roteiro)

| Par | Pares | Correlação | P(acerto na 2ª rede \| acerto na 1ª) | P(acerto na 2ª \| sem acerto na 1ª) | Base da 2ª rede |
|---|---|---|---|---|---|
| IG → TikTok | 1.862 | **0,56** | **54,8%** | 10,0% | 20,5% |
| IG → YouTube | 1.814 | **0,38** | **38,4%** | 13,4% | 19,5% |
| IG → Facebook | 309 | 0,56 | 61,4% | 12,7% | 26,5% |
| TikTok → IG | 1.862 | 0,56 | 62,5% | 13,2% | 23,3% |
| TikTok → YouTube | 1.648 | 0,30 | 37,1% | 13,6% | 18,9% |
| FB → TikTok | 237 | **0,62** | 64,4% | 14,6% | 30,0% |
| YouTube → IG | 1.814 | 0,38 | 47,6% | 18,5% | 24,1% |
| YouTube → TikTok | 1.648 | 0,30 | 44,1% | 17,4% | 22,4% |
| FB → YouTube | 251 | 0,32 | 53,9% | 37,7% | 42,6% |

### Se pegou no IG, qual a chance de pegar nas outras? (roteiros com IG, TikTok e YouTube)

| Coeficiente no IG | Roteiros | % acerto no TikTok | % acerto no YouTube | TikTok **e** YouTube | TikTok **ou** YouTube |
|---|---|---|---|---|---|
| < 1x | 724 | 5,0% | 7,3% | 1,2% | 11,0% |
| 1–3x | 474 | 19,0% | 22,4% | 5,5% | 35,9% |
| 3–10x | 186 | 48,4% | 34,4% | 21,0% | 61,8% |
| 10–30x | 103 | 64,1% | 45,6% | **34,0%** | 75,7% |
| ≥ 30x | 103 | **69,9%** | 37,9% | 26,2% | **81,6%** |

**Leitura:**
- **IG, TikTok e Facebook formam um bloco** (correlação de 0,56 a 0,62). Se o hook pega no IG, a chance de pegar no TikTok fica 2,7 vezes maior (54,8% contra 20,5% de base).
- **O YouTube anda mais sozinho** (correlação de 0,30 a 0,38). Mesmo um IG acima de 30x só leva a acerto no YouTube em 38% dos casos.
- **Na prática:** um IG acima de 10x é o melhor preditor de acerto no TikTok (cerca de 2 em 3). Para o YouTube, o IG é um sinal fraco: vale testar o corte e o título do Shorts separadamente.

---

## 6. Conclusões: o que dá "força especial" multi-rede a um hook

### Princípio 1: Personagem que qualquer pessoa reconhece em 1 segundo (marca ou famoso)

É o sinal mais forte e o mais robusto. Acerto universal de **11,8% com marca/famoso contra 4,6% sem**; **8,6% contra 4,0% sem a Izabela**. O personagem conhecido dispensa contexto, e é por isso que funciona igual em qualquer feed.

- "Antigamente, você tinha vergonha de usar **Olympikus** na escola. Hoje em dia, ela humilha a **Nike** e a **Adidas** no Brasil." (Marcio Grazino): [IG 649k](https://www.instagram.com/reel/DWBOY0QjSv4) · [TT 1,30M](https://www.tiktok.com/@marcio.grazino/video/7618421911848094994) · [YT 454k](https://www.youtube.com/shorts/CiiztW8lgFg)
- "O **Silvio Santos** fez uma jogada genial que evitou qualquer dor de cabeça para sua família após a sua morte." (Dilson Peres): [IG 1,31M](https://www.instagram.com/reel/DXkt-uODQv4) · [TT 267k](https://www.tiktok.com/@doutortax/video/7633204312407067925) · [YT 5,75M](https://www.youtube.com/shorts/Mny2Yyps5Ag)
- Bônus: "A **Samsung** lançou um par de óculos que é o começo do fim da era do celular." (Izabela, 13,1M somados): [FB](https://www.facebook.com/reel/2150015449258037) · [IG](https://www.instagram.com/reel/DbvGvW2hRek) · [TT](https://www.tiktok.com/@izabela.anholett/video/7669659195427376405) · [YT](https://www.youtube.com/shorts/uI-qstDty4Y)

### Princípio 2: Âncora geográfica ("nós" × "eles": Brasil, Nordeste, China, Japão)

Acerto universal de **7,9% com país ou região contra 4,5% sem**; **6,4% contra 3,3% sem a Izabela**. Entre os universais sem a Izabela, 53% citam um lugar. Nos de rede única, 34%. O lugar cria identidade (orgulho brasileiro) ou rivalidade (a China contra o resto).

- "**Um nordestino** de apenas 14 anos criou uma máquina que pode salvar mais de 2 bilhões de pessoas." (Rafael Rodrigues): [IG 134k](https://www.instagram.com/reel/DXcqxyQD9rG) · [TT 207k](https://www.tiktok.com/@rafaelrodriguesluiz/video/7631689058183351559) · [YT 1,08M](https://www.youtube.com/shorts/pdWWbMISqqI)
- "**A China** está construindo um verdadeiro país paralelo **no nordeste brasileiro** e quase ninguém está percebendo isso." (Lincoln Fracari): [IG 1,21M](https://www.instagram.com/reel/DWxFzHvjhyk) · [TT 670k](https://www.tiktok.com/@lincolnfracari/video/7625446328075848981) · [YT 21k](https://www.youtube.com/shorts/TF3669jAKEE)

### Princípio 3: Virada embutida na própria frase (antes × depois, esperado × real)

Contraste explícito tem efeito modesto (5,3% contra 4,2% sem a Izabela), e "quase ninguém percebeu" tem 6,7% contra 4,3% (n = 103). O padrão comum aos universais é que **a frase já carrega a quebra de expectativa**, sem precisar de uma segunda frase.

- "Uma das famílias mais ricas do Brasil tem mais de 170 herdeiros. E todos eles estão proibidos de mandar na empresa. **Mas** o mais curioso é que foram eles mesmos que se proibiram." (Pedro Elero): [IG 124k](https://www.instagram.com/reel/DdWfdeQlVrC) · [TT 114k](https://www.tiktok.com/@pedro_elero/video/7686148334846774548) · [YT 266k](https://www.youtube.com/shorts/6KmQPF1Uaco)
- "O Botafogo acabou de dar uma aula, **não de futebol, mas sim** de como tomar a pior decisão financeira do ano." (Pedro Elero): [IG 107k](https://www.instagram.com/reel/Dc0s5JZDRXl) · [TT 137k](https://www.tiktok.com/@pedro_elero/video/7681277833951317265) · [YT 11k](https://www.youtube.com/shorts/s3TEjy1IHUk)

### Princípio 4: Afirmar, não perguntar

Sem a Izabela, hooks com pergunta acertam em todas as redes em **2,4%** dos casos, contra **4,6%** sem pergunta. Só 3% dos universais (sem a Izabela) têm "?". Os vencedores são afirmações categóricas; quando há pergunta, ela vem depois da afirmação.

- "A empresa mais valiosa do mundo acabou de emitir […] que ninguém queria ouvir." (Fernando Pereira): [IG 844k](https://www.instagram.com/reel/DVzCXslj2aC) · [TT 420k](https://www.tiktok.com/@fernandopereira.finance/video/7616466575205436692) · [YT 327k](https://www.youtube.com/shorts/FcGY_lupK74)
- "Os bancos vão cobrar um pedágio do governo toda vez que alguém fizer um pix ou passar o cartão. E adivinha quem vai pagar a conta?" (Dilson Peres; a pergunta só vem depois da afirmação): [IG 1,05M](https://www.instagram.com/reel/Ddue5rGvzRq) · [TT 290k](https://www.tiktok.com/@doutortax/video/7689556115364891924) · [YT 1,09M](https://www.youtube.com/shorts/XsGkMb5x6Jo)

### Princípio 5: Uma frase que conta a história inteira (sujeito + feito + escala), com número só como escala

A 1ª frase com até 12 palavras **não** é melhor (3,4% contra 4,9% sem a Izabela). A mediana dos universais é de 17 palavras. Número solto não ajuda (4,2% contra 4,6%). Funciona quando o número **mede o feito de um personagem**.

- "Uma gambiarra insana de **um brasileiro** virou uma economia de **13 milhões de litros** de água." (Marcio Grazino): [IG 865k](https://www.instagram.com/reel/DbRQlG7xhNs) · [TT 395k](https://www.tiktok.com/@marcio.grazino/video/7666937765505846548) · [YT 878k](https://www.youtube.com/shorts/J71Dwmc2MGk)
- "**Três estudantes** de escola pública no interior da Bahia fizeram o que a indústria do chocolate não fez em **50 anos**." (Marcio Grazino): [IG 763k](https://www.instagram.com/reel/DXXnUopEU-f) · [TT 265k](https://www.tiktok.com/@marcio.grazino/video/7630959626506259732) · [YT 41k](https://www.youtube.com/shorts/mTsJvDwEULc)

### Princípio 6: Não mexa no hook entre redes, e não espere que o YouTube siga o IG

Os universais têm hook diferente entre redes em 28% dos casos; os de rede única, em 41%. O caso mais claro é o dos "86 bilhões" do Dilson. Abrindo com o número, o YouTube fez 417k. Abrindo com "O que? no porto do Rio…", o IG fez 23k.

- Hook com número na abertura (YouTube): [YT 417k](https://www.youtube.com/shorts/g1D21krOPso). Hook diluído (IG): [IG 23k](https://www.instagram.com/reel/DY2-kgOtE2N). TikTok: [TT 4k](https://www.tiktok.com/@doutortax/video/7644703626065186068).
- Hook idêntico e mesmo assim só uma rede: "A maior banda do mundo cancelou um show milionário por causa de um simples M&M marrom." (Rodrigo Waughan): [IG 544k](https://www.instagram.com/reel/DWEHDe8DlJz) · [YT 3k](https://www.youtube.com/shorts/sQjVOqzG9Ow) · [TT 942](https://www.tiktok.com/@.rodrigowaughan/video/7618935481518263572). Aqui o personagem não tem nome: "a maior banda do mundo" em vez de dizer qual é a banda. É o Princípio 1 ao contrário.

### Resumo para a aula

1. **Quem:** personagem conhecido (marca ou famoso). É o maior lift.
2. **Onde:** âncora geográfica que gera identidade ou rivalidade.
3. **Virada:** a quebra de expectativa dentro da mesma frase.
4. **Tom:** afirmação categórica, sem pergunta na abertura.
5. **Forma:** uma frase completa (cerca de 15 a 20 palavras), com número só como escala do feito.
6. **Distribuição:** o mesmo hook em todas as redes. IG, TikTok e Facebook andam juntos. O YouTube é uma aposta separada.

### Limitações

- **Peso da Izabela.** Ela é cerca de um terço dos acertos universais. Os princípios 1, 2 e 4 foram checados sem ela; "conflito" e "acabou de" não se sustentam sem ela.
- **Hook é transcrição.** A comparação de hook igual ou diferente usa um prefixo normalizado e tem ruído.
- **Marcadores por regex.** A lista de marcas e famosos é uma heurística; nome próprio genérico pega até "IA" e "Brasil".
- **Associação, não causa.** Cliente, tema e data se confundem com o hook; não houve controle por cliente além do recorte sem a Izabela.
