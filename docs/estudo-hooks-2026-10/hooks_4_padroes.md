# Hooks: padrões, fórmulas e elementos que performam (playbook x dados reais)

Material de base para a aula de hooks (até 45 min). Gerado em 17/10/2026. Todos os números vêm de queries SELECT no Supabase do Oráculo (`qclvrddrqulgfzccndnl`). Não há número estimado.

## 0. Como ler os números

- **Base:** `oraculo.fato_video` sem `maturando`, sem hook vazio, sem `public.videos.removido` e sem `is_repost`. A classificação do playbook vem de `oraculo.playbook_class` (dimensão `hook`, `chave` = texto exato do hook; ver `supabase/migrations/0021_playbooks_vivos.sql`).
- **Acerto** = `classificacao='acerto'` (acima do limiar do canal: o maior entre 10k e 3x a mediana). **Viral** = alcance viral ou ultraviral (100k+). **Ultraviral** = 1M+. **Coef** = coeficiente viral (views ÷ mediana do canal). **Ret. hook** = retenção no hook (só IG e TikTok têm o dado).
- **Base classificada:** 11.511 vídeos (IG 5.095, YouTube 2.815, TikTok 2.653, Facebook 948).

| Rede | n | % acerto | % viral | % ultraviral | Coef mediano | Ret. hook mediana | Ret. sub-hook mediana |
|---|---|---|---|---|---|---|---|
| **Instagram** | 5.095 | **18,3%** | 12,3% | 1,16% | 1,00 | 64 (n=1.445) | 43 |
| TikTok | 2.653 | 18,3% | 8,2% | 0,49% | 1,10 | 61 (n=323) | 39 |
| YouTube | 2.815 | 14,2% | 4,7% | 0,36% | 1,23 | sem dado | sem dado |
| Facebook | 948 | 12,7% | 6,1% | 0,11% | 2,00 | sem dado | sem dado |
| Todas | 11.511 | 16,8% | 9,0% | 0,72% | 1,12 | 64 | 42 |

> Na prática, a base IG é quase toda dos últimos 12 meses: 6.123 dos 6.323 hooks IG não vazios foram publicados depois de 17/10/2025.

---

## 1. Ranking das categorias do playbook (MGCs)

Um hook pode ter várias categorias, então as linhas se sobrepõem. A taxa de referência do IG é **18,3%**.

### 1a. Instagram

| # | Categoria | n | % acerto | % viral | % ultra | Coef med. | Ret. hook med. (n) | Ret. sub-hook |
|---|---|---|---|---|---|---|---|---|
| 1 | **Elemento Controverso** | 232 | **27,2** | 28,4 | 3,45 | 1,29 | 67 (67) | 46 |
| 2 | **Conflito Declarado** | 269 | **25,7** | 24,5 | 4,09 | 1,21 | 66 (126) | 46 |
| 3 | **Urgência** | 275 | **25,1** | **32,7** | 2,91 | 1,37 | 64 (81) | 43 |
| 4 | **Esse Cara** | 1.077 | **24,5** | 16,5 | 1,02 | 1,18 | 66 (391) | 44 |
| 5 | O Proibido | 120 | 23,3 | 12,5 | 0,83 | 1,29 | 66 (57) | 43 |
| 6 | Apelo Histórico | 110 | 22,7 | 17,3 | 3,64 | 1,26 | 66 (41) | 44 |
| 7 | Contraste Extremo | 1.614 | 21,6 | 13,6 | 1,12 | 1,12 | 65 (704) | 44 |
| 8 | Apelo ao Esforço | 39 | 20,5 | 7,7 | 0 | 0,92 | 58 (7) | 38 |
| 9 | Superlativo | 632 | 20,4 | 14,6 | 1,42 | 1,13 | 64 (255) | 43 |
| 10 | Ultra Especificidade | 870 | 20,2 | 12,0 | 0,57 | 1,05 | 64 (315) | 42 |
| 11 | Revelação Secreta | 789 | 18,1 | 12,4 | 1,27 | 1,02 | 64 (313) | 43 |
| 12 | Desafio de Crença | 663 | 17,6 | 12,1 | 1,51 | 0,98 | 64 (193) | 44 |
| 13 | Apelo à Autoridade | 181 | 16,6 | 11,6 | 1,10 | 1,05 | 64,5 (56) | 42,5 |
| 14 | Viés de Negatividade | 774 | 16,1 | 13,6 | 0,90 | 0,96 | 63 (261) | 41 |
| 15 | Ordem Contra-intuitiva | 72 | 15,3 | 9,7 | 1,39 | 1,07 | 65 (16) | 43 |
| 16 | Pergunta Direta *(auto)* | 305 | 12,8 | 7,9 | 0,66 | 0,78 | 61,5 (20) | 41 |
| 17 | *(nenhum MGC identificado)* | 868 | **10,1** | 3,2 | 0,35 | 0,83 | 55 (32) | 36 |
| 18 | Apelo à Maioria | 49 | 8,2 | 6,1 | 2,04 | 0,75 | 64,5 (12) | 37,5 |
| 19 | Pergunta Reflexiva *(auto)* | 53 | 7,5 | 3,8 | 3,77 | 0,66 | n=1 | 82 |

**Leitura para a aula:**
- Os 4 primeiros (Controverso, Conflito, Urgência, Esse Cara) puxam acerto entre 24,5% e 27,2%, contra 18,3% da base. Urgência é o que mais vira **viral** no IG (32,7%).
- **Hook sem nenhum MGC acerta 10,1%**, quase metade da base. É o argumento mais forte de que o playbook funciona.
- A retenção no hook varia pouco entre categorias (63 a 67). O MGC decide se a pessoa **para de rolar**, não quanto tempo ela fica. Quem fica com retenção mais baixa são os hooks sem MGC (55) e a Pergunta Direta (61,5).

**Quantos MGCs por hook (IG):** nenhum, 10,1% de acerto (n=868). Um, 16,5% (n=1.036). **Dois, 21,6%** (n=2.485). Três ou mais, 19,1% (n=706). O ponto ótimo é **combinar 2 mecanismos**. No IG, um terceiro já não ajuda; nas outras redes, 3+ ainda sobe um pouco (20,6%).

### 1b. Outras redes (% acerto; n entre parênteses)

| Categoria | TikTok | YouTube | Facebook | Todas as redes (% acerto / % viral / coef) |
|---|---|---|---|---|
| Conflito Declarado | **35,5** (166) | 22,0 (173) | 22,0 (41) | 27,0 / 18,0 / 1,44 |
| Elemento Controverso | 25,6 (129) | 21,4 (112) | **31,6** (38) | 25,8 / 19,0 / 1,40 |
| O Proibido | 24,1 (83) | **29,9** (77) | 26,7 (15) | 25,4 / 13,2 / 1,32 |
| Urgência | 27,5 (138) | 24,4 (131) | 17,8 (45) | 25,0 / 21,6 / 1,59 |
| Esse Cara | 21,2 (755) | 17,9 (663) | 25,1 (187) | 22,0 / 11,6 / 1,28 |
| Apelo Histórico | 28,4 (67) | 10,4 (67) | 18,8 (16) | 20,8 / 10,8 / 1,49 |
| Contraste Extremo | 20,6 (1.004) | 16,5 (981) | 24,0 (229) | 20,2 / 10,3 / 1,16 |
| Superlativo | 22,0 (372) | 13,7 (380) | 20,0 (85) | 19,1 / 11,0 / 1,21 |
| Revelação Secreta | 19,7 (492) | 18,8 (480) | 19,5 (123) | 18,8 / 9,7 / 1,13 |
| Ultra Especificidade | 18,5 (509) | 15,2 (525) | 23,2 (155) | 18,7 / 9,2 / 1,23 |
| Apelo à Autoridade | 15,2 (92) | 24,1 (87) | 13,0 (46) | 17,5 / 8,1 / 1,11 |
| Viés de Negatividade | 14,6 (445) | 16,3 (411) | 6,3 (142) | 15,0 / 9,1 / 1,10 |
| Pergunta Direta | 24,7 (146) | 10,5 (114) | 4,3 (92) | 13,9 / 6,4 / 0,98 |
| Desafio de Crença | 14,2 (325) | **7,3** (327) | **7,9** (114) | 13,7 / 7,8 / 1,03 |
| Ordem Contra-intuitiva | **5,9** (51) | **6,3** (48) | 15,8 (19) | 10,5 / 4,7 / 1,12 |
| *(nenhum MGC)* | 7,4 (243) | 4,2 (425) | 3,1 (194) | 7,5 / 2,3 / 0,98 |
| **Base da rede** | **18,3** | **14,2** | **12,7** | 16,8 / 9,0 / 1,12 |

O pódio quase não muda entre redes (Conflito, Controverso, Proibido, Urgência). No **YouTube**, o Proibido lidera (29,9%) e Autoridade funciona (24,1%). No **TikTok**, Conflito Declarado chega a 35,5%.

### 1c. Exemplos reais (IG, acertos com mais views, 1 por cliente)

**Elemento Controverso**
- "Isso aqui é inacreditável. A Copa do Mundo nem começou, mas já aconteceu uma coisa que está deixando muita gente furiosa." (canal Felipe Dantas, sem cliente, 4.067.016 views) https://www.instagram.com/reel/DSFX79dDb1q
- "Esse é o cara mais odiado do mundo pelos donos de academia. Isso porque a academia tradicional vende o mesmo espaço para centenas de pessoas, ao mesmo tempo. Mas ele resolveu vender o espaço inteiro para uma pessoa só." (Renato Torres, 2.621.349 views, coef 244,6) https://www.instagram.com/reel/DY-bwdmpj4e
- "Tu achas que os artistas realmente eles acreditam no PT, votam realmente no PT ou eles estão só preocupados com os bilhões da Lei Rouanet? [...]" (Café com Ferri, 1.842.720 views) https://www.instagram.com/reel/DWzokn-k32y

**Conflito Declarado**
- "O Irã ameaçou esmagar os Estados Unidos, mas hoje um dos homens mais perversos da história está morto." (Felipe Dantas, 3.404.269 views) https://www.instagram.com/reel/DVUvWMqDUzo
- "O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar." (Fernando Pereira, 3.212.057 views, coef 544,4, ret. hook 79) https://www.instagram.com/reel/DVbunyzDvij
- "A criadora do ChatGPT tá preparando um golpe que vai destruir o iPhone em 2027. [...] Quase ninguém tá percebendo o que que isso significa." (Izabela Anholett, 1.905.875 views, ret. hook 78) https://www.instagram.com/reel/DZM4mrahLTo

**Urgência**
- "A contagem regressiva começou. A China vai implementar no Brasil os pagamentos com a palma da mão, ainda esse ano." (Izabela Anholett, 3.476.947 views, ret. hook 75) https://www.instagram.com/reel/DZcVckKByOp
- O hook de Fernando Pereira sobre os 40 dias de petróleo (acima), que entrou também em Urgência.
- "Tem algo muito estranho acontecendo nesse exato momento e todo mundo precisa saber, pois a verdade é muito pior do que você imagina." (canal sem cliente, 1.489.359 views; exemplo citado no playbook) https://www.instagram.com/reel/DVXGqozjdmC

**Esse Cara**
- "Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica." (Leonardo Nogueira, 6.192.964 views, coef 438,4, ret. hook 79) https://www.instagram.com/reel/DYo3ldvOFHW
- "Ela era a dançarina mais desejada do Brasil. Ele, um cantor no começo. Mais de 20 anos depois, Xanddy e Carla Perez seguem juntos, e o motivo surpreende muita gente." (Marcos Pelozato, 4.368.113 views, coef 478,9) https://www.instagram.com/reel/DcqJw8tOFPK
- "A brasileira desconhecida tá prestes a mudar a história da humanidade. Mas infelizmente poderá ser punida por isso." (Igor Bevilaqua, 3.289.941 views; exemplo do playbook) https://www.instagram.com/reel/DU-tOKCjiRx

**O Proibido**
- "essa estratégia assustadora fez esse empresário multiplicar 10x sua fortuna." (Cadu Neiva, 2.532.646 views, coef 740,2, o maior coeficiente IG dos últimos 12 meses) https://www.instagram.com/reel/DWuSVeFEdwk
- "Essa empresa britânica vai colocar uma câmera com inteligência artificial dentro da sua boca todos os dias e você vai querer pagar caro por isso." (Izabela Anholett, 834.024 views) https://www.instagram.com/reel/Dc1BL6nz19n
- "o pânico do governo milhões descobrem como zerar imposto [...] uma brecha para não precisar pagar um centavo de um imposto para esse governo" (Igor Bevilaqua, 818.004 views) https://www.instagram.com/reel/DVoA6xdDkAk

**Apelo Histórico**
- "A Samsung lançou um par de óculos que é o começo do fim da era do celular. Deixa eu te explicar." (Izabela Anholett, **9.391.531 views**, o maior IG do período, ret. hook 78) https://www.instagram.com/reel/DbvGvW2hRek
- "A Geely chocou o mundo mais uma vez. Ela acabou de dar o passo mais revolucionário da história." (Leonardo Cirino, 2.046.089 views, coef 93,7) https://www.instagram.com/reel/Dcw12PyNrZs
- O hook da brasileira desconhecida (Igor Bevilaqua, acima).

**Contraste Extremo**: o taxista e Xanddy & Carla Perez (acima), mais:
- "Coca-Cola gasta milhões no Nordeste, mas existe uma bebida cearense que ela não consegue superar." (Cadu Neiva, 2.128.919 views, coef 154,9) https://www.instagram.com/reel/DXaXOO3ibZs

**Superlativo**
- "Estamos ficando burros. E mais burros do que em qualquer outro momento da história." (Igor Bevilaqua, 3.987.699 views; o playbook usa como exemplo de Ordem Contra-intuitiva) https://www.instagram.com/reel/DV8w1VujrUd
- "Essa fábrica de balas tem o melhor chocolate do Brasil, uma fábrica do interior do Rio Grande do Sul criou um chocolate tão bom que a Hershey's e a Nestlé começaram a copiar." (Marcelo Germano, 2.487.357 views, ret. hook 74) https://www.instagram.com/reel/DVmZmdRDn7q

**Ultra Especificidade**
- O hook dos "exatamente 40 dias" (Fernando Pereira, acima).
- "A China está acabando com os personal trainers e destruindo um mercado de 7 bilhões de dólares. E a culpa é de um espelho ultra fino que está invadindo as casas de milhões de pessoas." (Lincoln Fracari, 1.621.063 views, coef 106,1) https://www.instagram.com/reel/DXu0gQfO-d7

**Outras redes: top 5 acertos dos últimos 12 meses**
- TikTok: "o mundo tem exatamente quarenta dias até o petróleo acabar e a culpa é de um pedaço de mar que o irã acabou de sequestrar" (Fernando Pereira, 6.256.813 views) https://www.tiktok.com/@fernandopereira.finance/video/7613106734680329493 · "Estamos emburrecendo mais rápido do que em qualquer outro momento da história." (Igor Bevilaqua, 2.777.609) https://www.tiktok.com/@igor.bevilaqua/video/7617867834902793490 · "esse cara quer ser presidente da república e tá prometendo eliminar cidades do brasil" (Igor Bevilaqua, 2.395.697) https://www.tiktok.com/@igor.bevilaqua/video/7606141165599001863 · "Essa mulher multiplicou as vendas da empresa do pai em 17 vezes e agora está tirando o sono da Red Bull." (Marcelo Germano, 1.525.181) https://www.tiktok.com/@marcelogermanoeag/video/7602311653362814226
- YouTube: "O Silvio Santos fez uma jogada genial que evitou qualquer dor de cabeça para sua família após a sua morte." (Dilson Peres, 5.750.348) https://www.youtube.com/shorts/Mny2Yyps5Ag · "A China proibiu homens afeminados de aparecerem na televisão e o motivo é muito mais estratégico do que parece." (Lincoln Fracari, 2.277.544, coef 1.788) https://www.youtube.com/shorts/OdGJ-yTtsog · "Essa marca de tênis manda uma faca de verdade dentro da caixa e pede para você destruir o produto que acabou de comprar." (Pedro Elero, 1.737.455) https://www.youtube.com/shorts/HQcSb-xdNMc
- Facebook: "Isso não é um robô que parece um inseto. É uma barata de verdade, viva, equipada com uma mochila tecnológica." (Izabela Anholett, 1.100.000) https://www.facebook.com/reel/1653379056025836 · "Na semana passada a Câmara aprovou a escala 6x1 e o Brasil inteiro começou a discutir o número errado. [...]" (Marcelo Germano, 722.829, coef 838) https://www.facebook.com/reel/1709757726737914

O mesmo hook costuma ganhar em todas as redes: Samsung, China/computadores, 40 dias de petróleo e "estamos ficando burros" aparecem no topo de duas ou mais.

---

## 2. Combinações de MGCs (pares no mesmo hook)

Só entram pares com pelo menos 30 vídeos no IG. Ordem: % de acerto no IG.

| # | Par | n IG | % acerto IG | % viral IG | Coef IG | Ret. hook IG | n todas | % acerto todas |
|---|---|---|---|---|---|---|---|---|
| 1 | **Esse Cara + O Proibido** | 31 | **38,7** | 16,1 | 2,13 | **73** | 65 | 32,3 |
| 2 | **Conflito Declarado + Contraste Extremo** | 50 | **32,0** | 16,0 | 1,47 | 65 | 130 | 33,1 |
| 3 | Desafio de Crença + Ultra Especificidade | 32 | 31,3 | 9,4 | 1,10 | 65 | 76 | 18,4 |
| 4 | **Elemento Controverso + Esse Cara** | 37 | 29,7 | **43,2** | 1,51 | 61 | 81 | 27,2 |
| 5 | **Urgência + Viés de Negatividade** | 120 | 27,5 | 31,7 | 1,52 | 63 | 243 | 25,9 |
| 6 | Desafio de Crença + Elemento Controverso | 44 | 27,3 | 27,3 | 1,44 | 72 | 75 | 22,7 |
| 7 | Esse Cara + Superlativo | 133 | 25,6 | 16,5 | 1,26 | 62 | 325 | 20,9 |
| 8 | Contraste Extremo + Superlativo | 250 | 24,4 | 15,6 | 1,26 | 65 | 584 | 21,7 |
| 9 | Revelação Secreta + Ultra Especificidade | 111 | 24,3 | 17,1 | 1,01 | 62 | 271 | 23,6 |
| 10 | Esse Cara + Ultra Especificidade | 221 | 22,6 | 15,8 | 1,03 | 68 | 557 | 20,1 |
| fora do top 10 | Conflito Declarado + Urgência | 42 | 19,0 | **42,9** | 1,22 | 61,5 | 79 | 21,5 |

**Pares que derrubam o acerto (IG):** Desafio de Crença + Viés de Negatividade, **6,6%** (n=61). O Proibido + Revelação Secreta, 12,2%. Desafio de Crença + Superlativo, 11,8%. Revelação Secreta + Viés de Negatividade, 12,4% (n=105).

**Exemplos (IG):**
1. Esse Cara + Proibido: "essa estratégia assustadora fez esse empresário multiplicar 10x sua fortuna." (Cadu Neiva, 2.532.646 views) https://www.instagram.com/reel/DWuSVeFEdwk · "Esse médico esperou o chefe ir embora, trancou a sala e enfiou um tubo dentro do próprio coração." (Drielle Castelani, 216.411 views, coef 120,2) https://www.instagram.com/reel/DZqY9lQhqRE
2. Conflito + Contraste: o hook do Irã que ameaçou os EUA (3.404.269) https://www.instagram.com/reel/DVUvWMqDUzo · "A Apple oficialmente matou a Siri bobinha e o seu iPhone agora vai ser turbinado pelo Google." (Izabela Anholett, 1.598.159) https://www.instagram.com/reel/DafSJJZhMXs
3. Desafio de Crença + Ultra Especificidade: "Marçal não é bilionário de verdade porque sua declaração de eleição foi de apenas 193 milhões." (Dilson Peres, 975.184, coef 55,7) https://www.instagram.com/reel/DVR4TwDjW-T · "Você não precisa mais de pedreiro para construir a sua casa. [...] em apenas cinco dias você vai construir uma casa de dois andares [...]" (Leonardo Cirino, 221.661) https://www.instagram.com/reel/DZDs7q4R6q0
4. Controverso + Esse Cara: o cara mais odiado pelos donos de academia (Renato Torres, 2.621.349) https://www.instagram.com/reel/DY-bwdmpj4e · "Esse cara quer ser presidente da República e tá prometendo eliminar cidades do Brasil." (Igor Bevilaqua, 1.674.550) https://www.instagram.com/reel/DUrXWUcj2tj
5. Urgência + Negatividade: o hook do "algo muito estranho acontecendo" (1.489.359) https://www.instagram.com/reel/DVXGqozjdmC · "Enquanto você estava distraído, uma notícia urgente está sendo praticamente ignorada, mas todo autônomo precisa saber." (1.347.508) https://www.instagram.com/reel/DStK_tJjWPl
6. Crença + Controverso: "Se você acredita que a captura do Maduro foi feita porque o governo americano precisa do petróleo da Venezuela, você caiu na maior mentira da técnica." (2.293.595) https://www.instagram.com/reel/DTGPeFxiST6 · "O Mc Donald's não vende mais sorvete, ele está mentindo para você!" (Dilson Peres, 1.266.588, coef 89,2) https://www.instagram.com/reel/DU6lPDvDf9N
7. Esse Cara + Superlativo: "A chinesa dona da Volvo comprou alguma das maiores empresas do mundo e agora chegou no Brasil. E a estratégia por trás disso é sensacional." (Franklin Tomich, 990.828, coef 196,7, ret. hook 81) https://www.instagram.com/reel/DY-krjmNG2R · "Esses dois irmãos saíram de uma porta de madeira no fundo de quintal para um dos maiores impérios de ônibus do planeta." (Marcelo Germano, 684.675) https://www.instagram.com/reel/DVzVymeFFEC
8. Contraste + Superlativo: a fábrica de balas (2.487.357) https://www.instagram.com/reel/DVmZmdRDn7q · a Coca-Cola contra a bebida cearense (2.128.919) https://www.instagram.com/reel/DXaXOO3ibZs
9. Revelação + Ultra Especificidade: "caras estão sabendo de alguma coisa que a gente não sabe. Foi revelado um novo gasto do Mark Zuckerberg de 270 milhões de dólares pra construir um bunker subterrâneo." (Igor Bevilaqua, 1.062.325) https://www.instagram.com/reel/DR-rqq7D_I1 · "de R$ 297 mil reais pra mais de R$ 700 mil todos os meses. E o segredo estava dentro do próprio ecossistema do Mercado Livre." (Thiago Franco, 781.864, coef 306,7) https://www.instagram.com/reel/DcejbHhB5pX
10. Esse Cara + Ultra Especificidade: "Uma gambiarra insana de um brasileiro virou uma economia de 13 milhões de litros de água." (Marcio Grazino, 865.497) https://www.instagram.com/reel/DbRQlG7xhNs
- Conflito + Urgência: "A Apple acabou de declarar guerra ao Mark Zuckerberg E o seu próximo iPhone não vai estar no seu bolso Mas sim no seu rosto" (Izabela Anholett, 1.776.694) https://www.instagram.com/reel/DYjr8VwBC53

**Regra prática:** junte um **personagem** (Esse Cara ou Controverso) com uma **tensão** (Proibido, Conflito, Contraste). Evite somar dois mecanismos "acusatórios" (Crença com Negatividade), porque o hook vira sermão.

---

## 3. Alertas: o que o playbook prega e o que surgiu sozinho

### 3a. Categorias do playbook que ficam abaixo da base

| Categoria | IG | Onde dói mais | Leitura |
|---|---|---|---|
| **Apelo à Maioria** | 8,2% (n=49) | FB 0% (n=20); TT 10,5% | O pior MGC "oficial". A frase "9 em cada 10..." soa como estatística, não como história. |
| **Ordem Contra-intuitiva** | 15,3% (n=72) | **TT 5,9%**, **YT 6,3%** | Nuance: quando a ordem derruba uma crença com nome próprio, funciona. Os hooks IG que abrem com "Pare de / Se você acredita / Esqueça" acertam 30,4% (n=23), como "Pare de acreditar que El Salvador foi salvo só pela polícia [...]" (1.592.861 views) https://www.instagram.com/reel/DSz79epDXP- e "Não compre mais carros da Porsche. [...]" (Leonardo Nogueira, 407.349) https://www.instagram.com/reel/DVpKJmjjKvm. O que falha é a ordem genérica de autoajuda. |
| **Viés de Negatividade** | 16,1% (n=774) | **FB 6,3%** | Viraliza no IG (13,6% viral), mas acerta abaixo da base. Funciona com Urgência (27,5%) e afunda com Crença (6,6%). |
| **Apelo à Autoridade** | 16,6% (n=181) | TT 15,2%, FB 13,0% (no YT funciona: 24,1%) | O sentimento "Autoridade" tem lift **0,56** nos acertos (ver seção 4). Credencial não para o scroll. |
| **Desafio de Crença** | 17,6% (n=663) | **YT 7,3%**, **FB 7,9%** | O MGC mais pregado e o mais traiçoeiro. Funciona ancorado em número ou figura controversa (Marçal, Maduro). Abstrato, falha ("disciplina vai mudar sua vida motivação não", 3.981 views, coef 0,03 https://www.instagram.com/reel/DTsb5L7Drq5). |
| Revelação Secreta | 18,1% (n=789) | ≈ base | Muito usada e neutra. Só sobe com número (24,3% com Ultra Especificidade). |

### 3b. Categorias criadas automaticamente pelo classificador (fonte `auto`, 12/07/2026)

- **Pergunta Direta** (promovida com 71 ocorrências): IG **12,8%** (n=305), FB **4,3%**, YT 10,5%. Só funciona no TikTok (24,7%). Hoje é a terceira pior categoria do IG.
- **Pergunta Reflexiva** (promovida com 13 ocorrências): IG **7,5%** (n=53), TT 2,9%. É a categoria com maior chance de cair no pior decil de coeficiente (lift 1,96).
- **Alerta de processo:** o auto-update do playbook (`fn_playbook_promover_candidatas`) promove pela **frequência**, não pela **performance**. As duas categorias promovidas são anti-padrões. Sugestão: tratar as duas como "a evitar" no `hooks.md` ou exigir taxa de acerto mínima na promoção.
- Candidatas ainda não promovidas: só "Desafio em Série/Progresso" (n=27, 0% de acerto, só YouTube) e "Pergunta Retórica" (n=9). Nada novo que valha promover.

### 3c. Padrões que os dados mostram e o playbook não nomeia

Fiz uma busca por expressão regular nos hooks IG (n=6.323, base 17,8% de acerto). Todos estes têm 10 ou mais clientes, e a taxa se mantém sem o maior cliente:

| Padrão | n IG | % acerto IG | % viral | Coef | Clientes | Sem o maior cliente | TT / YT / FB |
|---|---|---|---|---|---|---|---|
| "**declarou guerra / em guerra**" | 54 | **42,6** | 37,0 | 2,18 | 16 | 43,6 | 41,7 / 33,3 / 44,4 |
| **Regional (Nordeste, interior, estado)** | 294 | **39,1** | 25,9 | 2,07 | 24 | 39,9 | 35,3 / 12,4 / 21,0 |
| **Davi x Golias** (gigante perde para um pequeno) | 93 | **36,6** | n/d | n/d | 27 | 32,1 | 29,7 / 19,1 / 36,4 |
| "**acabou de / acaba de**" | 349 | **32,1** | 28,7 | 1,78 | 29 | 28,4 | 34,1 / 27,1 / 25,0 |
| **China** | 460 | **30,0** | 16,1 | 1,48 | 28 | 30,3 | 41,1 / 26,0 / 23,0 |
| Marca gigante citada (Apple, Coca, Google, BYD...) | 449 | 25,4 | 19,4 | 1,21 | n/d | n/d | n/d |
| Sub-hook causal ("e a culpa é / o motivo / o segredo / o pior") | 251 | 25,1 | 17,5 | 1,16 | 30 | 25,7 | 19,9 / 17,5 / 21,5 |
| destruir / fim de / matou / decretou | 185 | 24,3 | 20,0 | 1,02 | n/d | n/d | 23,9 / 20,1 / 21,7 |
| Abre com "Esse/Essa/Este" | 742 | 22,8 | 16,0 | 1,04 | n/d | n/d | 20,0 / 13,9 / 25,0 |

Proposta para o playbook: incluir **"Davi x Golias"** e **"Orgulho regional"** como MGCs (ou como variações de Contraste e de Conflito). Incluir **"acabou de"** em Palavras Mágicas, ao lado de Confessar, Revelar e Perturbador.

---

## 4. Elementos e sentimentos: o que aparece mais nos acertos (lift)

Lift = % dos acertos que têm o item ÷ % dos não-acertos que têm o item. Considerei só os elementos e sentimentos de rank 1 e 2.

### 4a. Sentimentos (IG: 520 acertos x 2.004 não-acertos com sentimento preenchido)

| Sentimento | n IG | % nos acertos | % nos não-acertos | **Lift IG** | Lift todas as redes |
|---|---|---|---|---|---|
| Nostalgia | 64 | 4,0 | 2,1 | **1,88** | 1,47 |
| Medo | 52 | 2,9 | 1,8 | **1,56** | 1,72 |
| Escândalo | 131 | 7,1 | 4,7 | **1,52** | 1,56 |
| **Admiração** | 586 | **30,4** | 21,4 | **1,42** | 1,44 |
| Indignação | 225 | 11,2 | 8,3 | 1,34 | 1,38 |
| Urgência | 210 | 10,4 | 7,8 | 1,33 | 1,05 |
| **Curiosidade** | 630 | 29,2 | 23,9 | 1,23 | 1,31 |
| Controvérsia | 120 | 5,2 | 4,6 | 1,12 | 1,26 |
| Sátira | 46 | 1,9 | 1,8 | 1,07 | 1,17 |
| Otimismo | 329 | 12,9 | 13,1 | 0,99 | 1,10 |
| Ambição | 584 | 21,7 | 23,5 | 0,92 | 0,80 |
| Entusiasmo | 157 | 5,4 | 6,4 | 0,84 | 0,69 |
| Alerta | 529 | 17,9 | 21,8 | 0,82 | 0,97 |
| **Didatismo** | 708 | 22,7 | 29,4 | **0,77** | 0,72 |
| Ceticismo | 99 | 2,7 | 4,2 | 0,63 | 0,66 |
| **Autoridade** | 467 | 11,3 | 20,4 | **0,56** | 0,55 |
| Confiança | 68 | 1,3 | 3,0 | **0,44** | 0,51 |

**Para a aula:** os acertos despertam **emoção sobre alguém** (admiração, escândalo, indignação, nostalgia, medo). Os não-acertos transmitem **credibilidade de quem fala** (autoridade, confiança, didatismo). O hook é para sentir; a autoridade fica para o corpo do vídeo.

### 4b. Elementos (famílias; IG: 520 acertos x 2.003 não-acertos)

O campo `elementos` é texto livre gerado por IA (há centenas de nomes diferentes), então agrupei por família com palavras-chave. Os lifts são menores que os dos sentimentos.

| Família de elemento (rank 1 e 2) | n IG (acerto / não) | **Lift IG** | Lift outras redes | Lift todas |
|---|---|---|---|---|
| Orgulho nacional/regional | 32 / 49 | **2,52** | 1,57 | 1,99 |
| Humor/ironia | 4 / 8 | 1,93 (n pequeno) | 0,53 | 1,25 |
| Geopolítica/China | 39 / 87 | **1,73** | 1,67 | 1,67 |
| Nostalgia | 6 / 14 | 1,65 (n pequeno) | 0,66 | 1,20 |
| **Conflito/dualidade/rivalidade** | 162 / 514 | **1,21** | 1,44 | 1,31 |
| Underdog/ascensão | 34 / 109 | 1,20 | 0,99 | 1,09 |
| Storytelling/arquétipo/personagem | 104 / 337 | 1,19 | 1,22 | 1,21 |
| Contraste/antes-depois | 68 / 227 | 1,15 | 1,00 | 1,08 |
| Futuro/tecnologia | 43 / 154 | 1,08 | 1,35 | 1,20 |
| Entidade de peso (nome ou marca famosa) | 223 / 805 | 1,07 | 1,00 | 1,03 |
| Quebra de expectativa | 104 / 410 | 0,98 | 0,99 | 0,98 |
| Números/escala | 69 / 286 | 0,93 | 0,80 | 0,87 |
| Medo/perda/ameaça | 38 / 158 | 0,93 | 1,01 | 0,97 |
| Segredo/bastidor | 32 / 135 | 0,91 | 1,09 | 1,00 |
| **Autoridade/prova/dados** | 152 / 653 | **0,90** | 0,97 | 0,93 |
| Mecanismo/estratégia | 35 / 152 | 0,89 | 0,95 | 0,91 |
| Identificação/dor | 23 / 108 | 0,82 | 1,16 | 0,97 |
| Polêmica/indignação | 12 / 60 | 0,77 | 1,26 | 0,98 |
| Assunto magnético/tendência | 34 / 170 | **0,77** | 1,04 | 0,89 |

Nomes literais com 25 ou mais ocorrências (todas as redes): **"Ângulo de ataque"** lift 2,39 (n=26). **"Contraste de escala"** 1,66 (n=26). **"Conflito de dualidade"** 1,63 (n=478, 26,6% de acerto). "Ancoragem em entidade de alto impacto" 1,48 (n=77). "Assimetria de informação" 1,37 (n=30). Na outra ponta: "Prova social quantitativa" 0,62, "Assuntos magnéticos" 0,48 e "Ancoragem em entidade de alto prestígio" 0,35.

**Leitura:** citar um nome famoso é condição comum (43% dos acertos e 40% dos não-acertos), não diferencial. O que separa é colocar o nome famoso **em conflito com alguém** (dualidade, Davi x Golias) e trazer o conflito para o território do público (Brasil, Nordeste, "seu iPhone").

---

## 5. Fórmulas (moldes) extraídas dos melhores hooks IG

**Amostra:** os 50 acertos IG com mais views dos últimos 12 meses (17/10/2025 a 17/10/2026), sem hooks duplicados. Também olhei os 30 maiores coeficientes do período. **As contagens abaixo são minha codificação manual dos 50**; um hook pode entrar em mais de uma fórmula. Na coluna "Validação", os números de acerto vêm de busca por padrão na base IG inteira (seção 3c), quando dá para medir assim.

| # | Fórmula (molde) | No top 50 | Validação na base IG |
|---|---|---|---|
| F1 | Decreto de morte | 7 | destruir/fim/matou: 24,3% (n=185) |
| F2 | Guerra de gigantes | 6 | "declarou guerra": **42,6%** (n=54) |
| F3 | Isso chega em você | 6 | — |
| F4 | Sub-hook causal improvável | 6 | 25,1% (n=251) |
| F5 | Potência silenciosa no Brasil | 6 citam a China; 3 no molde exato | China: 30,0% (n=460); "silenciosamente/quase ninguém percebe": 22,9% (n=214) |
| F6 | Davi x Golias | 4 | **36,6%** (n=93) |
| F7 | Personagem comum, feito desproporcional | 4 | abre com "Esse/Essa": 22,8% (n=742) |
| F8 | Ameaça/feito + "mas" + reviravolta | 4 | "mas" sozinho: 17,1% (neutro) |
| F9 | Superlativo histórico | 4 | — |
| F10 | Herói/vilão invertido | 4 | 46,2% (n=13, amostra pequena) |
| F11 | Prazo exato / contagem regressiva | 3 | 17,2% de acerto, 16,4% viral (n=134) |
| F12 | Crença derrubada com nome próprio | 2 (+1 corte) | abre com ordem/desafio: 30,4% (n=23) |
| F13 | Urgência vaga coletiva | 3 | 40,9% (n=22) |
| F14 | De [origem] para [resultado] | 3 | 22,2% (n=54) |
| F15 | Corte de conversa com opinião polêmica | 7 | — |

### F1. Decreto de morte: "[Marca/tecnologia] [acabou de / vai] [destruir / matar / decretar o fim de] [categoria ou profissão que todo mundo conhece]"
- **Por que funciona:** Impacto mais Contraste Extremo (o novo mata o velho), com Apelo Histórico ("o começo do fim da era..."). É simples e concreto: o espectador conhece o que vai "morrer".
- **Exemplos:**
  - "A Samsung lançou um par de óculos que é o começo do fim da era do celular. Deixa eu te explicar." (9.391.531) https://www.instagram.com/reel/DbvGvW2hRek
  - "O HB20 e o Onix serão destruídos por esse novo lançamento da BYD, que faz 71 quilômetros por litro." (Leonardo Cirino, 4.088.462, coef 180) https://www.instagram.com/reel/DdkDHUgBnEm
  - "IA vai destruir essa profissão. A IA acabou de decretar a morte de uma das profissões mais comuns do mundo: o operador de empilhadeira." (Izabela Anholett, 1.306.563, ret. hook 78) https://www.instagram.com/reel/DWMAp_kDSDk

### F2. Guerra de gigantes: "[Gigante A] acabou de declarar guerra a/ao [Gigante B ou algo do seu dia a dia]. [E o campo de batalha é você/seu X]."
- **Por que funciona:** Conflito Declarado (a expectativa de conflito ativa o instinto tribal) com Elemento Controverso (nomes que dividem). "Acabou de" põe Urgência de graça. Funciona em todas as redes (TT 41,7%, YT 33,3%, FB 44,4%).
- **Exemplos:**
  - "O dono do Instagram acabou de declarar guerra à Apple. Usando uma arma que pode literalmente mudar o mundo que a gente conhece. E o campo de batalha é o seu rosto, tá?" (Izabela Anholett, 3.154.215) https://www.instagram.com/reel/Dd4cgRKzhhw
  - "O ChatGPT acabou de declarar guerra ao seu cabeleireiro. [...]" (Izabela Anholett, 1.405.506, ret. hook 78) https://www.instagram.com/reel/DaC9WT2BtnK
  - "Três estados do nordeste estão em guerra e o Brasil inteiro devia torcer para essa guerra nunca acabar." (Cadu Neiva, 1.795.148, coef 217) https://www.instagram.com/reel/Dce9r_WJQp4

### F3. Isso chega em você: "[Fato macro] + [o seu iPhone / a sua cerveja / o seu cabeleireiro / toda vez que você entra no supermercado]"
- **Por que funciona:** Percepção de Relevância (o fato distante vira consequência pessoal). **Atenção:** o "você" sozinho não basta. Hooks com você/seu/sua acertam 15,7% (n=1.918), abaixo da base. Funciona como **segundo tempo** depois de um fato concreto, nunca como abertura acusatória (ver anti-padrões).
- **Exemplos:**
  - "A sua cerveja do final de semana vai ficar mais cara por conta do governo." (Dilson Peres, 2.131.824, ret. hook 72) https://www.instagram.com/reel/DX-KBg-thjK
  - "TODA VEZ QUE VOCÊ ENTRA NUM SUPERMERCADO GRANDE [...] A MAIORIA DAS PESSOAS NÃO VAI COMPRAR." (Quarto Slot Exame, 2.900.423, coef 345) https://www.instagram.com/reel/DWxGBlAh7DU
  - A Apple declarando guerra ao Zuckerberg: "o seu próximo iPhone não vai estar no seu bolso, mas sim no seu rosto" (1.776.694) https://www.instagram.com/reel/DYjr8VwBC53

### F4. Sub-hook causal improvável: "[Fato grande]. E a culpa é de / o motivo é / o segredo estava em / o pior é [algo pequeno, inesperado ou paradoxal]."
- **Por que funciona:** Gap de Curiosidade em dois tempos. A primeira frase dá a relevância; a segunda abre a lacuna com uma causa desproporcional (a "Consequência desproporcional" do playbook, invertida). É o sub-hook do storytelling.
- **Exemplos:**
  - "O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar." (3.212.057, coef 544) https://www.instagram.com/reel/DVbunyzDvij
  - "Esse é o maior golpe das lojas de shopping contra o governo. E o pior, o golpe é totalmente legal." (Dilson Peres, 2.212.971) https://www.instagram.com/reel/DdkLxRzBKTs
  - "A China proibiu homens afeminados de aparecerem na televisão e o motivo é muito mais estratégico do que parece." (Lincoln Fracari, 1.342.266 IG e 2.277.544 YT) https://www.instagram.com/reel/DYGAzoQOnyy

### F5. Potência silenciosa no Brasil: "A China [está silenciosamente / acabou de / vai] [ação de escala] [no Brasil / no Nordeste / contra um mercado]."
- **Por que funciona:** Revelação Secreta ("silenciosamente", "quase ninguém percebeu") com Conflito geopolítico e território local. A família Geopolítica/China tem lift 1,73 no IG. No TikTok, China chega a 41,1% de acerto.
- **Exemplos:**
  - "A China tá silenciosamente construindo um império no Nordeste brasileiro. E quando eu digo império, eu não estou exagerando." (Lincoln Fracari, 3.351.048, coef 450) https://www.instagram.com/reel/DVt98MUka1u
  - O hook da contagem regressiva para os pagamentos com a palma da mão (3.476.947) https://www.instagram.com/reel/DZcVckKByOp
  - "A China agora tá destruindo os computadores. Isso porque ela criou os primeiros óculos com IA programável do mundo." (Izabela Anholett, 1.331.707) https://www.instagram.com/reel/DakboQ0Bfla

### F6. Davi x Golias: "[Gigante] [domina / gasta milhões / tenta há 20 anos], mas [pequeno local ou improvável] [vence / não é superado / é copiado]."
- **Por que funciona:** Contraste Extremo (nós x eles) com orgulho regional, que tem o maior lift de elemento (2,52). É a "inversão de herói" aplicada a marcas.
- **Exemplos:**
  - A Coca-Cola contra a bebida cearense (2.128.919, coef 155) https://www.instagram.com/reel/DXaXOO3ibZs
  - "A Coca-Cola domina o planeta inteiro, menos um estado do Nordeste. E o que ela fez para resolver isso é a maior aula de marketing que você vai ver hoje." (Cadu Neiva, 1.433.236, coef 197) https://www.instagram.com/reel/DZoDSwwJ0Io
  - "Enquanto as gigantes gastam bilhões para criar tecnologia, esse jovem de 20 anos criou uma concorrente da Apple usando restos de lixo." (Rafael Rodrigues, 1.081.942, coef 438, ret. hook 71) https://www.instagram.com/reel/DWKJvC7Dz8-

### F7. Personagem comum, feito desproporcional: "Esse [taxista / médico / empresário / cara] [fez X] tanto/tão [...] que [consequência absurda]."
- **Por que funciona:** Esse Cara (expectativa de fofoca, personagem fácil de seguir) com Consequência desproporcional. Quanto mais comum o personagem e mais absurda a consequência, melhor.
- **Exemplos:**
  - O taxista que travou o software da Toyota (6.192.964, coef 438, ret. hook 79) https://www.instagram.com/reel/DYo3ldvOFHW
  - O médico que enfiou um tubo no próprio coração (Drielle Castelani, 216.411, coef 120) https://www.instagram.com/reel/DZqY9lQhqRE
  - "Jovem cria IA que simula jutsu do Naruto. [...]" (Patrick Diorio, 412.692, coef 457, ret. hook 85) https://www.instagram.com/reel/DcKNGwYuTIK

### F8. Ameaça ou feito, "mas" reviravolta: "[A] [ameaçou / estava prestes a / nem começou], mas [hoje / infelizmente / já] [reversão ou punição]."
- **Por que funciona:** o Contraste Extremo clássico do playbook ("Ontem bilionário, hoje preso"). **Atenção:** o "mas" sozinho é neutro (17,1%, n=1.003). Ele só funciona quando os dois lados são extremos.
- **Exemplos:**
  - O Irã que ameaçou os EUA (3.404.269) https://www.instagram.com/reel/DVUvWMqDUzo
  - A brasileira desconhecida que pode ser punida (3.289.941) https://www.instagram.com/reel/DU-tOKCjiRx
  - A Copa do Mundo que "nem começou" (4.067.016) https://www.instagram.com/reel/DSFX79dDb1q

### F9. Superlativo histórico: "[Afirmação coletiva ou de marca] + mais [X] do que em qualquer outro momento da história / o passo mais revolucionário da história / em [N] anos, só [2] conseguiram."
- **Por que funciona:** Superlativo com Apelo Histórico. A relevância fica clara em uma frase.
- **Exemplos:**
  - "Estamos ficando burros [...]" (3.987.699) https://www.instagram.com/reel/DV8w1VujrUd
  - "2.500 anos, apenas dois homens colocaram o Império Pérsia de joelhos. Alexandre, o Grande, e Donald Trump." (Igor Bevilaqua, 1.625.988) https://www.instagram.com/reel/DVcYWaljD27
  - A Geely e "o passo mais revolucionário da história" (2.046.089) https://www.instagram.com/reel/Dcw12PyNrZs

### F10. Herói/vilão invertido: "[Quem todos odeiam] [salvou / inovou]" ou "[o obstáculo] era justamente quem [jurava proteger]."
- **Por que funciona:** a "Inversão de herói e vilão" do playbook (Desafio de Crença) com Elemento Controverso.
- **Exemplos:**
  - "O país mais perigoso do mundo virou o mais seguro da América Latina em quatro anos. E o obstáculo que impedia isso era exatamente quem jurava proteger o povo." (1.338.405) https://www.instagram.com/reel/DePFrAPx57u
  - "A China está silenciosamente controlando o Brasil. E quem permitiu é justamente quem promete proteger a soberania brasileira." (1.752.963) https://www.instagram.com/reel/DeVJqYJBUPJ
  - O cara mais odiado pelos donos de academia (2.621.349) https://www.instagram.com/reel/DY-bwdmpj4e

### F11. Prazo exato / contagem regressiva: "[A contagem regressiva começou / O mundo tem exatamente N dias / Em breve] + [mudança concreta]."
- **Por que funciona:** Urgência com Ultra Especificidade. Na base, o padrão sozinho fica neutro em acerto (17,2%) e acima em viral (16,4%). O efeito vem da combinação com um fato forte.
- **Exemplos:**
  - Os 40 dias até o petróleo acabar (3.212.057) https://www.instagram.com/reel/DVbunyzDvij
  - A contagem regressiva da palma da mão (3.476.947) https://www.instagram.com/reel/DZcVckKByOp
  - "Em breve só vai ser gordo quem quiser. Essa empresa acaba de se tornar a primeira farmacêutica a valer um trilhão de dólares após criar o Mounjaro." (Igor Bevilaqua, 1.497.565) https://www.instagram.com/reel/DRsfRbKEojI

### F12. Crença derrubada com nome próprio: "Se você acredita que [explicação popular sobre fato famoso], você caiu na [maior mentira]" / "Pare de acreditar que [X]. A verdadeira [causa] foi [improvável]."
- **Por que funciona:** Desafio de Crença **ancorado** em fato e personagem conhecidos. Sem âncora, o mesmo MGC afunda (ver 3a).
- **Exemplos:**
  - O hook sobre a captura do Maduro (2.293.595) https://www.instagram.com/reel/DTGPeFxiST6
  - "Pare de acreditar que El Salvador foi salvo só pela polícia. [...]" (1.592.861) https://www.instagram.com/reel/DSz79epDXP-

### F13. Urgência vaga coletiva: "Tem algo muito estranho acontecendo / Enquanto você estava distraído / Isso aqui é inacreditável + todo mundo precisa saber."
- **Por que funciona:** gap de curiosidade puro, com Urgência e Viés de Negatividade.
- **Ressalva:** os 3 exemplos do top 50 são de um canal com mediana alta (Felipe Dantas, cerca de 235k). Os coeficientes são modestos (4 a 13), e há um caso do mesmo molde no pior decil: "Muito em breve quem usa o ChatGPT [...] vai ser severamente punido. Tem uma coisa muito estranha acontecendo no mundo." (Igor Bevilaqua, 70.871, coef 0,16) https://www.instagram.com/reel/DaQQ1oxO98c. Use com moderação.
- **Exemplos:**
  - O hook do "algo muito estranho acontecendo" (1.489.359) https://www.instagram.com/reel/DVXGqozjdmC
  - O hook do autônomo distraído (1.347.508) https://www.instagram.com/reel/DStK_tJjWPl

### F14. De [origem humilde] para [resultado com número]: "De [R$ 297 mil / um tanque no quintal] para [R$ 700 mil por mês / um sucesso bilionário]. E o segredo/a virada foi [X]."
- **Por que funciona:** Contraste antes x depois com Ultra Especificidade. Fica bom quando o sub-hook entrega o mecanismo. A trajetória sem segredo, conflito ou personagem marcante aparece entre os piores (ver 6).
- **Exemplos:**
  - "de um tanque num quintal para um sucesso bilionário" (Marcelo Germano, 1.865.745, ret. hook 73) https://www.instagram.com/reel/DV1sUGdlZHO
  - O hook dos R$ 297 mil que viraram R$ 700 mil por mês (Thiago Franco, 781.864, coef 307) https://www.instagram.com/reel/DcejbHhB5pX
  - "Esse vendedor do Mercado Livre foi de 400 mil para mais de 2 milhões de reais todos os meses! E a virada de chave foi [...]" (Thiago Franco, 754.977, coef 296) https://www.instagram.com/reel/DcggOMfJY86

### F15. Corte de conversa com opinião polêmica (formato podcast ou fala espontânea)
- 7 dos 50 (Café com Ferri, Marcos Pelozato, Lincoln Fracari). Normalmente ficam sem MGC no classificador, mas acertam pela polêmica sobre um grupo conhecido (cantores, artistas, patrões).
- **Exemplos:**
  - "cara pagar funcionário no quinto dia útil, no final do dia, irmão, é só pra revoltar o cara." (Marcos Pelozato, 1.874.117 IG e 2.140.972 TT) https://www.instagram.com/reel/DcSAD1cEavD
  - "Não tem como. Rapaz, cantor é tudo liso, pô. [...]" (Café com Ferri, 1.932.647) https://www.instagram.com/reel/DYNOB6AAJOd
  - "Firmino, por que você não tem sua própria linha de canecas?" (Lincoln Fracari, 1.468.744) https://www.instagram.com/reel/DXh0JFTj6OU

---

## 6. Anti-padrões: estruturas a evitar

**Por categoria do playbook:** lift de presença no **pior decil de coeficiente do IG** (coef ≤ 0,38). Lift acima de 1 quer dizer que a categoria aparece mais entre os piores.

| Categoria | n | % no pior decil | Lift pior |
|---|---|---|---|
| Pergunta Reflexiva | 53 | 18,9 | **1,96** |
| Sem MGC | 868 | 14,4 | **1,41** |
| Pergunta Direta | 305 | 13,1 | **1,27** |
| Apelo à Maioria | 49 | 12,2 | 1,17 |
| Desafio de Crença | 663 | 10,7 | 1,01 |
| Urgência (a mais protegida) | 275 | 5,8 | 0,52 |
| Conflito Declarado | 269 | 7,1 | 0,64 |

**Estruturas (busca por padrão nos hooks IG; base 17,8% de acerto):**

| Anti-padrão | n IG | % acerto | Outras redes | Exemplo real (pior desempenho) |
|---|---|---|---|---|
| **Lista ou dicas numeradas** ("3 dicas", "5 erros") | 26 | **3,8%** | — | "três dicas eh, para o empreendedor que tá começando agora [...]" (Café com Ferri, 9.290 views, coef 0,16) https://www.instagram.com/reel/DaigrhwJes2 |
| **Acusar o espectador** ("o problema é você", "a culpa é do seu anúncio") | 23 | **0,0%** (35% no pior decil) | TT 11,1, YT 12,5, FB 0 | "O comércio brasileiro vai faturar 258 bilhões em 2026. E se o seu negócio no Marketplace não está crescendo, o mercado não é o problema. Você é" (Thiago Franco, 2.547, ret. hook 35) https://www.instagram.com/reel/DYVHNmpJRTh |
| **Abrir com "Imagina..."** | 34 | **2,9%** | — | "Imagina um técnico que escala um jogador para uma posição que ele nunca treinou. [...]" (Marcelo Germano, 2.314) https://www.instagram.com/reel/DZa2KqyBKHY |
| **Contexto de série, evento ou programa** ("primeiro vídeo da série", "Dia um hoje no...") | 50 | **8,0%** | — | "Este é o primeiro vídeo da série onde eu analiso franquias nos Estados Unidos [...]" (João Paulo Albuquerque, 2.378) https://www.instagram.com/reel/DQ7h2xhEgse |
| **CTA ou promoção no hook** | 16 | 6,3% | — | "Quer ir para a Copa? Última chance, até sexta-feira a promoção da Copa." (Café com Ferri, 4.985) https://www.instagram.com/reel/DZIdOIDpX4r |
| **Abrir em 1ª pessoa** ("Eu...", "Meu...", "Hoje eu...") | 193 | **11,9%** | TT **2,7**, YT 7,4, FB 5,9 | "Meu canal gera um pouquinho mais de meio milhão mês." (Lincoln Fracari, 2.049) https://www.instagram.com/reel/DeHzaoJNRxg |
| **Anunciar o conteúdo** ("neste vídeo", "vou te mostrar", "olá") | 163 | 12,3% | TT 13,1, YT **4,8**, FB **3,6** | "A margem da Natura caiu 20% em um ano. E o que ela fez pra recuperar? Eu vou te mostrar aqui [...]" (Thiago Franco, 907) https://www.instagram.com/reel/DXrQkaGjaEN |
| **Hook com pergunta (?)** | 1.258 | 14,2% | TT 13,8, YT 9,1, FB **4,7** | "Ferri, papo reto hoje, perguntas diretas. Qual hábito simples mais mudou o seu jogo nos negócios?" (4.273) https://www.instagram.com/reel/DZDcZGQBgFX |
| **Promessa vazia** ("muito mais [X] do que parece / imagina") | 74 | **13,5%** (9,7% sem o maior cliente) | — | "Existe uma razão para o Trump ser o político mais poderoso do planeta. E ela começa antes mesmo dele abrir a boca." (Café com Ferri, 64.195, coef 0,06) https://www.instagram.com/reel/DbEcqtypv-k |
| **"Se você..." condicional de nicho** | 94 | 14,9% | — | "Se você fosse removido da sua empresa hoje, quantas reuniões da próxima semana ainda aconteceria? [...]" (Marcelo Germano, 2.674) https://www.instagram.com/reel/DYneABMBTYm |
| **Aforismo abstrato sem personagem** | 27 (≤45 caracteres) | 29,6% de acerto, mas 18,5% no pior decil (polarizado) | — | "vendedor vende, empresário ganha dinheiro." (Thiago Franco, 2.442) https://www.instagram.com/reel/DZKf641h4Jx |
| **Frase solta de corte, sem contexto** | sem categoria: 10,1% | — | "pra variar." (Café com Ferri, 9.294) https://www.instagram.com/reel/DUl4lOzgUjW · "Eu já virei um traidor." (121 views) https://www.instagram.com/reel/DZsqRSGpFMb |

**Nuances que valem a aula:**
- O "promessa vazia" funciona quando a primeira frase já é chocante e concreta: o hook da China proibindo homens afeminados terminou em "muito mais estratégico do que parece" e fez 1,3M no IG e 2,3M no YT. O problema é usar o clichê **no lugar** do fato.
- A trajetória de empresa sem conflito ("Essa empresa começou imprimindo cartões de visita [...] foi comprada por bilhões", 6.712 views, coef 0,15 https://www.instagram.com/reel/DYsnM73h8kA) aparece muito entre os piores. Na média, porém, o molde "começou... e hoje" acerta 25,7% (n=35). Não é anti-padrão em si. Falha quando falta vilão, segredo ou número no sub-hook.
- **O hook não é tudo:** o mesmo texto do Irã, no mesmo canal (Felipe Dantas), fez 3.404.269 views em 28/02 e **504 views** quando foi postado de novo em 01/03 (https://www.instagram.com/reel/DVWQa5lDWn4). Esse segundo post não está marcado como `is_repost` na base. Vale corrigir o dado e serve de lição: republicar no dia seguinte não repete o resultado.

---

## 7. Roteiro sugerido para a aula (45 min)

1. **(5 min) Por que hook importa:** sem MGC, 10,1% de acerto; com 2 MGCs, 21,6%. Os 3 princípios do playbook (curiosidade, relevância, impacto).
2. **(10 min) O ranking real:** os 4 MGCs campeões (Controverso, Conflito, Urgência, Esse Cara) e os 3 que decepcionam (Maioria, Ordem genérica, Crença abstrata). Mostrar Samsung, taxista e Irã.
3. **(15 min) As fórmulas:** F1 Decreto de morte, F2 Guerra de gigantes, F4 Sub-hook causal, F6 Davi x Golias, F7 Personagem comum e feito desproporcional, F5 Potência silenciosa. Para cada uma: molde, exemplo e exercício de reescrita.
4. **(5 min) Emoção x credibilidade:** sentimentos com lift (admiração, escândalo, indignação, nostalgia, medo) contra autoridade, didatismo e confiança. Na abertura, desperte emoção sobre alguém; credibilidade fica para o corpo do vídeo.
5. **(7 min) Anti-padrões:** lista de dicas, acusar o espectador, "Imagina...", abrir em 1ª pessoa, anunciar o conteúdo, CTA. Antes e depois com exemplos reais.
6. **(3 min) Checklist final:** personagem concreto + tensão (conflito, contraste ou proibido) + território do público (Brasil, região, "seu X") + sub-hook que abre uma causa improvável.
