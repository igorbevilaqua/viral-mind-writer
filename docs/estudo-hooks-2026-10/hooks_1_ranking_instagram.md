# Ranking dos melhores hooks no Instagram — Viral Media Labs

Data de corte: 17/10/2026. Fonte: `oraculo.fato_video` (Viral Data, `qclvrddrqulgfzccndnl`), junto de `public.videos` e `public.canais`. Só leitura (SELECT).

## Base e filtros

- **Plataforma:** Instagram. O cross-post IG+FB já vem somado em `views_total`.
- **Saem da base:** vídeos ainda maturando (menos de 7 dias), removidos, reposts e vídeos sem hook.
- **Só clientes (`canais.is_cliente = true`).** O filtro mantém 6.145 dos 6.323 vídeos válidos e tira só 3 canais: Felipe Dantas, Igor Bevilaqua oficial e Igor Beviláqua XP. Eles aparecem num anexo à parte, como referência.
- **Janela de 12 meses (17/10/2025 em diante):** 6.010 vídeos. Só 135 vídeos de cliente são anteriores à janela, por isso o "all-time" quase coincide com a janela.
- **Régua de leitura:**
  - **coeficiente** = views ÷ mediana móvel do canal;
  - **viral** = mais de 100 mil views;
  - **ultraviral** = mais de 1 milhão.
- **Retenção no hook (`retencao_hook`):** existe para 1.445 vídeos IG de clientes, todos de 2026. A distribuição é a seguinte:
  - p5 = 41, p25 = 56, mediana = 64, p75 = 72, p95 = 106,8, máximo = 142.
  - **Anomalia:** 94 dos 153 vídeos de **Rodrigo Waughan** têm valor acima de 100 (mediana do cliente = 106). Esse cliente usa outra escala, provavelmente uma métrica diferente, e foi **excluído das análises de retenção**. Também saíram os valores 0.
  - A base de retenção ficou com **1.290 vídeos**.
- **Hooks transcritos:** os de vídeos `vm_script = 'nao'` (cortes de podcast, como Café com Ferri e Quarto Slot Exame) são transcrição da fala. Por isso alguns têm repetições e oralidade, e foram mantidos literais.

---

## 1. Top 25 por views absolutas (últimos 12 meses)

| # | Hook (literal) | Cliente | Data | Views | Coef. | Ret. hook | VM | Link |
|---|---|---|---|---:|---:|---:|---|---|
| 1 | A Samsung lançou um par de óculos que é o começo do fim da era do celular. Deixa eu te explicar. | Izabela Anholett | 2026-08-07 | 9.391.531 | 146,7 | 78 | sim | [reel](https://www.instagram.com/reel/DbvGvW2hRek) |
| 2 | Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica. | Leonardo Nogueira | 2026-05-22 | 6.192.964 | 438,4 | 79 | sim | [reel](https://www.instagram.com/reel/DYo3ldvOFHW) |
| 3 | a única maneira de mudar de vida é mudando de ambiente? a única maneira de mudar de vida é mudar de ambiente. | Café com Ferri | 2026-05-13 | 4.638.542 | 88,4 | — | não | [reel](https://www.instagram.com/reel/DYSIvUclThT) |
| 4 | Ela era a dançarina mais desejada do Brasil. Ele, um cantor no começo. Mais de 20 anos depois, Xanddy e Carla Perez seguem juntos, e o motivo surpreende muita gente. | Marcos Pelozato | 2026-08-30 | 4.368.113 | 478,9 | — | não | [reel](https://www.instagram.com/reel/DcqJw8tOFPK) |
| 5 | O HB20 e o Onix serão destruídos por esse novo lançamento da BYD, que faz 71 quilômetros por litro. | Leonardo Cirino | 2026-09-21 | 4.088.462 | 179,7 | — | sim | [reel](https://www.instagram.com/reel/DdkDHUgBnEm) |
| 6 | A contagem regressiva começou. A China vai implementar no Brasil os pagamentos com a palma da mão, ainda esse ano. | Izabela Anholett | 2026-06-11 | 3.476.947 | 79,1 | 75 | sim | [reel](https://www.instagram.com/reel/DZcVckKByOp) |
| 7 | A China tá silenciosamente construindo um império no Nordeste brasileiro. E quando eu digo império, eu não estou exagerando. | Lincoln Fracari | 2026-03-10 | 3.351.048 | 450,3 | — | não | [reel](https://www.instagram.com/reel/DVt98MUka1u) |
| 8 | A caminhada deu mais engajamento do que o Oscar. | Café com Ferri | 2026-02-06 | 3.237.621 | 51,9 | — | não | [reel](https://www.instagram.com/reel/DUbU6HoCohh) |
| 9 | O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar. | Fernando Pereira | 2026-03-03 | 3.212.057 | 544,4 | 79 | sim | [reel](https://www.instagram.com/reel/DVbunyzDvij) |
| 10 | O dono do Instagram acabou de declarar guerra à Apple. Usando uma arma que pode literalmente mudar o mundo que a gente conhece. E o campo de batalha é o seu rosto, tá? | Izabela Anholett | 2026-09-29 | 3.154.215 | 40,1 | — | sim | [reel](https://www.instagram.com/reel/Dd4cgRKzhhw) |
| 11 | TODA VEZ QUE VOCÊ ENTRA NUM SUPERMERCADO GRANDE NA ENTRADA SABENDO DAS PESSOAS, A MAIORIA DAS PESSOAS NÃO VAI COMPRAR. | Quarto Slot Exame (Antigo Caio Lima) | 2026-04-05 | 2.900.423 | 344,9 | — | não | [reel](https://www.instagram.com/reel/DWxGBlAh7DU) |
| 12 | Hoje eu fui numa reunião da da Cimed, recebi pessoas formadas lá que eles são um mais um dois. 10 slides pra fazer um, uma coisa óbvia. | Café com Ferri | 2026-02-04 | 2.830.936 | 43,8 | — | não | [reel](https://www.instagram.com/reel/DUVzHjLE4gO) |
| 13 | Esse é o cara mais odiado do mundo pelos donos de academia. Isso porque a academia tradicional vende o mesmo espaço para centenas de pessoas, ao mesmo tempo. Mas ele resolveu vender o espaço inteiro para uma pessoa só. | Renato Torres | 2026-05-30 | 2.621.349 | 244,6 | — | sim | [reel](https://www.instagram.com/reel/DY-bwdmpj4e) |
| 14 | aí o Zé Felipe veio falar esses dia que não quer que os menino viaje pra ir pra escola. | Café com Ferri | 2026-05-07 | 2.603.890 | 51,0 | — | não | [reel](https://www.instagram.com/reel/DYDnO44EhKv) |
| 15 | essa estratégia assustadora fez esse empresário multiplicar 10x sua fortuna. | Cadu Neiva | 2026-04-04 | 2.532.646 | 740,2 | — | sim | [reel](https://www.instagram.com/reel/DWuSVeFEdwk) |
| 16 | Essa fábrica de balas tem o melhor chocolate do Brasil, uma fábrica do interior do Rio Grande do Sul criou um chocolate tão bom que a Hershey's e a Nestlé começaram a copiar. | Marcelo Germano | 2026-03-07 | 2.487.357 | 137,8 | 74 | não | [reel](https://www.instagram.com/reel/DVmZmdRDn7q) |
| 17 | Esse é o maior golpe das lojas de shopping contra o governo. E o pior, o golpe é totalmente legal. | Dilson Peres | 2026-09-21 | 2.212.971 | 55,7 | — | sim | [reel](https://www.instagram.com/reel/DdkLxRzBKTs) |
| 18 | A sua cerveja do final de semana vai ficar mais cara por conta do governo. | Dilson Peres | 2026-05-05 | 2.131.824 | 32,2 | 72 | sim | [reel](https://www.instagram.com/reel/DX-KBg-thjK) |
| 19 | Coca-Cola gasta milhões no Nordeste, mas existe uma bebida cearense que ela não consegue superar. | Cadu Neiva | 2026-04-21 | 2.128.919 | 154,9 | — | sim | [reel](https://www.instagram.com/reel/DXaXOO3ibZs) |
| 20 | A Geely chocou o mundo mais uma vez. Ela acabou de dar o passo mais revolucionário da história. | Leonardo Cirino | 2026-09-01 | 2.046.089 | 93,7 | — | sim | [reel](https://www.instagram.com/reel/Dcw12PyNrZs) |
| 21 | Não tem como. Rapaz, cantor é tudo liso, pô. É tudo, é tudo quebrado. Cantor tem, tem 4, 5 cantores que tem avião para começar. Então, A galera não ganha grana demais? Para onde vai essa grana? De quem? | Café com Ferri | 2026-05-11 | 1.932.647 | 37,9 | — | não | [reel](https://www.instagram.com/reel/DYNOB6AAJOd) |
| 22 | A criadora do ChatGPT tá preparando um golpe que vai destruir o iPhone em 2027. Um celular com IA e sem os apps tradicionais. Quase ninguém tá percebendo o que que isso significa. | Izabela Anholett | 2026-06-05 | 1.905.875 | 48,4 | 78 | sim | [reel](https://www.instagram.com/reel/DZM4mrahLTo) |
| 23 | cara pagar funcionário no quinto dia útil, no final do dia, irmão, é só pra revoltar o cara. | Marcos Pelozato | 2026-08-20 | 1.874.117 | 211,1 | — | não | [reel](https://www.instagram.com/reel/DcSAD1cEavD) |
| 24 | de um tanque num quintal para um sucesso bilionário | Marcelo Germano | 2026-03-13 | 1.865.745 | 41,3 | 73 | sim | [reel](https://www.instagram.com/reel/DV1sUGdlZHO) |
| 25 | Tu achas que os artistas realmente eles acreditam no PT, votam realmente no PT ou eles estão só preocupados com os bilhões da Lei Rouanet? Não, estão preocupados com grana. Esquece. | Café com Ferri | 2026-04-06 | 1.842.720 | 36,8 | — | não | [reel](https://www.instagram.com/reel/DWzokn-k32y) |

**Observações**
- **Dois tipos de hook no topo:**
  - *Notícia com consequência*: Samsung "começo do fim da era do celular", BYD "HB20 e Onix serão destruídos", petróleo "40 dias", cerveja "vai ficar mais cara". Esse é o padrão dos roteiros VM.
  - *Frase-polêmica de opinião* em corte de podcast: Café com Ferri, Pelozato, Quarto Slot. Esse é o padrão dos `nao`.
- **Marca ou ator conhecido logo nas primeiras palavras:** Samsung, Toyota, BYD, China, Instagram/Apple, Coca-Cola, Geely, ChatGPT/iPhone. Na janela, hooks que citam uma marca grande viralizam em **18,6%** dos casos, contra **8,8%** sem marca, e respondem por **29,4%** dos ultravirais.
- **Verbo de ruptura no presente ("acabou de", "lançou", "vai implementar", "chocou"):** hooks com "acabou/acaba de" têm **22,4%** de taxa viral, contra **8,9%** dos demais, e coeficiente mediano de **1,84**, contra **0,96**. Foi o padrão textual mais forte que medimos.
- **Promessa de explicação no fim do hook:** "Deixa eu te explicar.", "e o motivo surpreende muita gente", "Quase ninguém tá percebendo...". O hook abre a lacuna e adia a resposta.

---

## 2. Top 25 por coeficiente viral (views ≥ 50 mil, últimos 12 meses)

| # | Hook (literal) | Cliente | Data | Views | Mediana do canal | Coef. | Ret. hook | VM | Link |
|---|---|---|---|---:|---:|---:|---:|---|---|
| 1 | essa estratégia assustadora fez esse empresário multiplicar 10x sua fortuna. | Cadu Neiva | 2026-04-04 | 2.532.646 | 3.422 | 740,2 | — | sim | [reel](https://www.instagram.com/reel/DWuSVeFEdwk) |
| 2 | Você é dono de empresa e um dia pretende vender o seu negócio? Então fica até o final, pois tem uma surpresa pra você. | Franklin Tomich | 2026-04-08 | 273.411 | 375 | 729,1 | — | não | [reel](https://www.instagram.com/reel/DW4XTgRDt0a) |
| 3 | O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar. | Fernando Pereira | 2026-03-03 | 3.212.057 | 5.900 | 544,4 | 79 | sim | [reel](https://www.instagram.com/reel/DVbunyzDvij) |
| 4 | Ela era a dançarina mais desejada do Brasil. Ele, um cantor no começo. Mais de 20 anos depois, Xanddy e Carla Perez seguem juntos, e o motivo surpreende muita gente. | Marcos Pelozato | 2026-08-30 | 4.368.113 | 9.121 | 478,9 | — | não | [reel](https://www.instagram.com/reel/DcqJw8tOFPK) |
| 5 | Jovem cria IA que simula jutsu do Naruto. Esse cara criou uma IA que reconhece se você fez o rasengan certo. E agora a geração inteira que imitava o Naruto no espelho, pode descobrir se o jutsu funcionaria de verdade. | Patrick Diorio | 2026-08-17 | 412.692 | 903 | 457,3 | 85 | sim | [reel](https://www.instagram.com/reel/DcKNGwYuTIK) |
| 6 | A China tá silenciosamente construindo um império no Nordeste brasileiro. E quando eu digo império, eu não estou exagerando. | Lincoln Fracari | 2026-03-10 | 3.351.048 | 7.442 | 450,3 | — | não | [reel](https://www.instagram.com/reel/DVt98MUka1u) |
| 7 | Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica. | Leonardo Nogueira | 2026-05-22 | 6.192.964 | 14.125 | 438,4 | 79 | sim | [reel](https://www.instagram.com/reel/DYo3ldvOFHW) |
| 8 | Enquanto as gigantes gastam bilhões para criar tecnologia, esse jovem de 20 anos criou uma concorrente da Apple usando restos de lixo. | Rafael Rodrigues | 2026-03-21 | 1.081.942 | 2.468 | 438,4 | 71 | sim | [reel](https://www.instagram.com/reel/DWKJvC7Dz8-) |
| 9 | A Estrela, a Bombril, as Americanas e a Polishop, todas elas pediram recuperação judicial. A Varig e a Parmalat simplesmente desapareceram. E todas elas deixaram sinais muito antes da crise explodir. E o mais assustador, você sabe o que todas elas tinham em comum? A resposta vai te surpreender. | Franklin Tomich | 2026-05-24 | 187.053 | 466 | 401,4 | — | não | [reel](https://www.instagram.com/reel/DYvEahZtxVE) |
| 10 | O Palmeiras fracassou em 2025. Essa é a frase que começou a circular depois do fim da temporada. | Pedro Elero | 2026-03-07 | 411.505 | 1.037 | 396,8 | — | não | [reel](https://www.instagram.com/reel/DVliQCqjilr) |
| 11 | Você sabia que existe um órgão no Brasil que pode proibir a venda de uma empresa? Pois é, ele se chama CADE. | Franklin Tomich | 2026-04-06 | 134.415 | 349 | 385,1 | — | não | [reel](https://www.instagram.com/reel/DWzVGx_jfRB) |
| 12 | Um bilhão, isto mesmo, um bilhão foi o preço que a dona da Nutella pagou para aquisição da Bold. Uma empresa criada em 2018 por um jovem de Divinópolis, em Minas Gerais. | Franklin Tomich | 2026-03-28 | 170.179 | 452 | 376,5 | — | não | [reel](https://www.instagram.com/reel/DWb3BkZDrCS) |
| 13 | TODA VEZ QUE VOCÊ ENTRA NUM SUPERMERCADO GRANDE NA ENTRADA SABENDO DAS PESSOAS, A MAIORIA DAS PESSOAS NÃO VAI COMPRAR. | Quarto Slot Exame (Antigo Caio Lima) | 2026-04-05 | 2.900.423 | 8.409 | 344,9 | — | não | [reel](https://www.instagram.com/reel/DWxGBlAh7DU) |
| 14 | de R$ 297 mil reais pra mais de R$ 700 mil todos os meses. E o segredo estava dentro do próprio ecossistema do Mercado Livre. | Thiago Franco | 2026-08-25 | 781.864 | 2.549 | 306,7 | — | não | [reel](https://www.instagram.com/reel/DcejbHhB5pX) |
| 15 | Essa campanha da Pepsi vai além da provocação. A Monster vai deixar de ser o energético dos gamers para invadir a bolsa das mulheres. | Manoel Victor | 2026-02-22 | 727.514 | 2.405 | 302,5 | 78 | sim | [reel](https://www.instagram.com/reel/DVDzbdUiYvV) |
| 16 | Você sabe como Bernardo Arnault, dono da Louis Vuitton, construiu uma fortuna de 500 bilhões de dólares? Ele não criou nenhuma marca ou construiu nenhuma empresa. Ele simplesmente comprou. | Franklin Tomich | 2026-04-07 | 109.766 | 365 | 300,7 | — | não | [reel](https://www.instagram.com/reel/DW1WFMlDtHu) |
| 17 | Essa IA recebeu a ordem explícita de não cometer crimes, mas cometeu. Depois, sentiu remorso e votou pela própria destruição. Sim, isso aconteceu de verdade. | João Felipe Marques | 2026-06-06 | 510.036 | 1.709 | 298,5 | — | sim | [reel](https://www.instagram.com/reel/DZPs8ZuBt9M) |
| 18 | Esse vendedor do Mercado Livre foi de 400 mil para mais de 2 milhões de reais todos os meses! E a virada de chave foi quando eles pararam de usar Mercado Ads como se cada produto fosse igual! | Thiago Franco | 2026-08-26 | 754.977 | 2.547 | 296,4 | — | não | [reel](https://www.instagram.com/reel/DcggOMfJY86) |
| 19 | Qual a diferença entre vender uma empresa na pessoa física ou na pessoa jurídica? | Franklin Tomich | 2026-03-29 | 118.177 | 452 | 261,5 | — | não | [reel](https://www.instagram.com/reel/DWenTIujhmc) |
| 20 | Esse é o cara mais odiado do mundo pelos donos de academia. Isso porque a academia tradicional vende o mesmo espaço para centenas de pessoas, ao mesmo tempo. Mas ele resolveu vender o espaço inteiro para uma pessoa só. | Renato Torres | 2026-05-30 | 2.621.349 | 10.715 | 244,6 | — | sim | [reel](https://www.instagram.com/reel/DY-bwdmpj4e) |
| 21 | Esse equipamento faz o barco parar de balançar, mesmo com o mar agitado. E não, ele não ancora a embarcação. E também não tenta controlar as ondas. | Leonardo Martins | 2026-09-25 | 780.453 | 3.218 | 242,6 | — | sim | [reel](https://www.instagram.com/reel/DduHhYxx97R) |
| 22 | Essa marca de tênis manda uma faca de verdade dentro da caixa e pede para você destruir o produto que acabou de comprar. | Pedro Elero | 2026-08-14 | 432.403 | 1.923 | 224,9 | 82 | sim | [reel](https://www.instagram.com/reel/DcBhRCHD9Gk) |
| 23 | Três estados do nordeste estão em guerra e o Brasil inteiro devia torcer para essa guerra nunca acabar. | Cadu Neiva | 2026-08-25 | 1.795.148 | 8.254 | 217,5 | — | não | [reel](https://www.instagram.com/reel/Dce9r_WJQp4) |
| 24 | cara pagar funcionário no quinto dia útil, no final do dia, irmão, é só pra revoltar o cara. | Marcos Pelozato | 2026-08-20 | 1.874.117 | 8.876 | 211,1 | — | não | [reel](https://www.instagram.com/reel/DcSAD1cEavD) |
| 25 | Preciso saber programar bem para conseguir a primeira vaga? | Patrick Diorio | 2025-10-24 | 215.890 | 1.034 | 208,8 | — | não | [reel](https://www.instagram.com/reel/DQMk333kbwg) |

**Observações**
- **Franklin Tomich ocupa 6 das 25 posições,** com mediana de canal entre 349 e 466 views. Num canal pequeno, 100 a 270 mil views já vira coeficiente de 300 a 700. Esses hooks funcionam bem fora do nicho dele (venda de empresas, M&A), mas o coeficiente infla em canais pequenos. Para a aula, eles valem como exemplo de **hook de nicho que fura a bolha**.
- **"Esse/Essa + personagem + feito improvável":** "essa estratégia assustadora fez esse empresário...", "Esse taxista...", "esse jovem de 20 anos criou uma concorrente da Apple usando restos de lixo", "Essa marca de tênis manda uma faca...". O demonstrativo põe um sujeito concreto na tela, e o contraste vem na mesma frase.
- **Número específico e exagerado como âncora:** "40 dias", "10x", "R$ 297 mil → R$ 700 mil", "400 mil para mais de 2 milhões", "500 bilhões", "Um bilhão, isto mesmo, um bilhão".
- **Negação dupla que fecha as explicações óbvias** ("E não, ele não ancora... E também não tenta controlar as ondas") e **"Sim, isso aconteceu de verdade"**: o hook antecipa a objeção do espectador.

---

## 3. Visualização + retenção no hook

**Base:** 1.290 vídeos IG de clientes com `retencao_hook` entre 1 e 100 (sem Rodrigo Waughan, pela escala diferente).

**Fórmula:** `score = percent_rank(coeficiente_viral) × percent_rank(retencao_hook)`, as duas calculadas dentro dessa base de 1.290.
- Cada fator vai de 0 a 1. O produto só fica alto se o vídeo estiver no topo **das duas** dimensões.
- O coeficiente foi usado no lugar das views absolutas para não favorecer canais grandes.
- Empate é desempatado por views.

**O dado que abre a aula:** a retenção no hook prevê distribuição.

| Métrica | Valor |
|---|---:|
| Correlação: retenção no hook × log(views) | **0,59** |
| Correlação: retenção no hook × log(coeficiente) | **0,53** |
| Correlação: retenção no sub-hook × log(views) | **0,54** |

| Retenção no hook | Vídeos | Viralizaram (100 mil+) | Mediana de views |
|---|---:|---:|---:|
| ≥ 78% | 81 | 58 (**72%**) | **216.411** |
| < 60% | 469 | 9 (**1,9%**) | **3.965** |

Leitura: quem segura 78% ou mais nos primeiros segundos quase sempre distribui. Correlação não prova causa: o algoritmo do IG distribui para quem fica, e público mais qualificado também retém mais.

### 3a. Top 25 pelo score combinado

| # | Hook (literal) | Cliente | Data | Views | Coef. | Ret. hook | Ret. sub-hook | Pct. coef | Pct. ret | Score | Link |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | Jovem cria IA que simula jutsu do Naruto. Esse cara criou uma IA que reconhece se você fez o rasengan certo. E agora a geração inteira que imitava o Naruto no espelho, pode descobrir se o jutsu funcionaria de verdade. | Patrick Diorio | 2026-08-17 | 412.692 | 457,3 | 85 | 71 | 0,999 | 0,997 | 0,996 | [reel](https://www.instagram.com/reel/DcKNGwYuTIK) |
| 2 | Essa marca de tênis manda uma faca de verdade dentro da caixa e pede para você destruir o produto que acabou de comprar. | Pedro Elero | 2026-08-14 | 432.403 | 224,9 | 82 | 74 | 0,996 | 0,987 | 0,983 | [reel](https://www.instagram.com/reel/DcBhRCHD9Gk) |
| 3 | Você não percebeu, mas o São Paulo deu uma aula. Não de futebol, mas de gestão e liderança. | Rafael Rodrigues | 2026-03-12 | 234.940 | 118,3 | 84 | 72 | 0,987 | 0,994 | 0,981 | [reel](https://www.instagram.com/reel/DVzP5yVjxRA) |
| 4 | A chinesa dona da Volvo comprou alguma das maiores empresas do mundo e agora chegou no Brasil. E a estratégia por trás disso é sensacional. | Franklin Tomich | 2026-05-30 | 990.828 | 196,7 | 81 | 66 | 0,995 | 0,977 | 0,972 | [reel](https://www.instagram.com/reel/DY-krjmNG2R) |
| 5 | O Palmeiras acabou de mandar uma promessa para jogar com o Messi. E é por isso que cada vez mais Barcelona e Real Madrid invejam o maior clube do Brasil. | Pedro Elero | 2026-08-28 | 150.093 | 75,6 | 84 | 61 | 0,978 | 0,994 | 0,971 | [reel](https://www.instagram.com/reel/DcmRAR0DFEz) |
| 6 | E quando todo mundo achou que a guerra acabou, o governo brasileiro ligou um alerta de pânico com a atitude do Trump. | Fernando Pereira | 2026-04-17 | 613.002 | 91,1 | 82 | 70 | 0,982 | 0,987 | 0,969 | [reel](https://www.instagram.com/reel/DXPntylEZ0k) |
| 7 | O Palmeiras acaba de tomar uma atitude que deixou muita gente revoltada, mas que você não pode ignorar. | Pedro Elero | 2026-07-31 | 171.823 | 89,6 | 82 | 70 | 0,981 | 0,987 | 0,968 | [reel](https://www.instagram.com/reel/DbeNjTKCCxZ) |
| 8 | A empresa mais valiosa do mundo acabou de emitir que ninguém queria ouvir. | Fernando Pereira | 2026-03-12 | 843.605 | 132,7 | 81 | 65 | 0,991 | 0,977 | 0,968 | [reel](https://www.instagram.com/reel/DVzCXslj2aC) |
| 9 | Ela foi ao Palmeiras para colocar o nome da empresa na camisa do clube, acabou ficando com o cargo mais alto da história do time, se tornando a primeira mulher a presidi-lo em mais de 100 anos de existência. | Pedro Elero | 2026-08-27 | 246.765 | 126,7 | 81 | 65 | 0,989 | 0,977 | 0,966 | [reel](https://www.instagram.com/reel/DcjvDmQmqyp) |
| 10 | Uma gambiarra insana de um brasileiro virou uma economia de 13 milhões de litros de água. | Marcio Grazino | 2026-07-26 | 865.497 | 59,7 | 83 | 68 | 0,971 | 0,992 | 0,964 | [reel](https://www.instagram.com/reel/DbRQlG7xhNs) |
| 11 | A Nike passou vergonha ao esquecer o mais importante sobre o Brasil. Nós somos brasileiros. | Rafael Rodrigues | 2026-03-28 | 323.376 | 107,6 | 81 | 67 | 0,984 | 0,977 | 0,962 | [reel](https://www.instagram.com/reel/DWchpM_j7ac) |
| 12 | O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar. | Fernando Pereira | 2026-03-03 | 3.212.057 | 544,4 | 79 | 62 | 1,000 | 0,956 | 0,956 | [reel](https://www.instagram.com/reel/DVbunyzDvij) |
| 13 | Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica. | Leonardo Nogueira | 2026-05-22 | 6.192.964 | 438,4 | 79 | 67 | 0,998 | 0,956 | 0,954 | [reel](https://www.instagram.com/reel/DYo3ldvOFHW) |
| 14 | O Palmeiras acabou de fechar o semestre devendo 124 milhões de reais. Mas isso não foi um erro, foi uma das estratégias da presidente que quase ninguém sacou. | Pedro Elero | 2026-08-19 | 131.314 | 68,1 | 81 | 63 | 0,976 | 0,977 | 0,953 | [reel](https://www.instagram.com/reel/DcPFuYgmoMQ) |
| 15 | Você se lembra do Ping Pong? O chiclete que fazia bola com figurinha dentro, simplesmente sumiu. E a culpada foi uma decisão corporativa que quase ninguém conhece. | Franklin Tomich | 2026-07-04 | 1.158.776 | 62,2 | 81 | 67 | 0,974 | 0,977 | 0,951 | [reel](https://www.instagram.com/reel/DaY1yoxuPZ8) |
| 16 | Essa brasileira ganhou um prêmio do Google ao fazer de graça o que muitos cursinhos cobram mais de mil reais por mês. E ela fez isso em 48 horas. | Rafael Rodrigues | 2026-05-03 | 218.219 | 44,1 | 84 | 68 | 0,955 | 0,994 | 0,949 | [reel](https://www.instagram.com/reel/DX46fHqv7w7) |
| 17 | Os herdeiros largaram a faculdade e ficaram mais ricos. Os filhos dos milionários pararam de estudar e estão se tornando ainda mais ricos. | Rafael Rodrigues | 2026-02-22 | 123.709 | 125,1 | 79 | 54 | 0,988 | 0,956 | 0,945 | [reel](https://www.instagram.com/reel/DVFKx-Qj1RP) |
| 18 | O brasileiro mais rico do mundo abriu mão de ser americano e o Congresso dos Estados Unidos ficou tão revoltado com isso que tentou criar uma lei só para impedir a volta dele para o país. | Ricardo Schumacher | 2026-08-31 | 147.917 | 56,7 | 81 | 63 | 0,967 | 0,977 | 0,944 | [reel](https://www.instagram.com/reel/Dct8khVp1XE) |
| 19 | Antigamente, ter uma Monarque era o sonho de todo brasileiro, só que por causa de uma das piores decisões da história, hoje você nem se lembra mais dela. | Marcio Grazino | 2026-05-27 | 405.265 | 45,3 | 82 | 72 | 0,957 | 0,987 | 0,944 | [reel](https://www.instagram.com/reel/DY1-5KPxvUX) |
| 20 | O ingresso de futebol mais caro do mundo: o Real Madrid transformou seu estádio na sala de reunião mais cara do planeta. O ingresso custa 1,5 milhão de reais. | Manoel Victor | 2026-03-03 | 129.862 | 54,3 | 81 | 64 | 0,965 | 0,977 | 0,943 | [reel](https://www.instagram.com/reel/DVb1oAQDPmw) |
| 21 | A Honda, uma das montadoras mais conservadoras do mercado, tomou uma das decisões mais ousadas da sua história ao tirar de linha um dos carros mais amados que o Brasil já viu, e o motivo pode te surpreender. | Leonardo Nogueira | 2026-04-17 | 342.439 | 43,9 | 82 | 65 | 0,954 | 0,987 | 0,942 | [reel](https://www.instagram.com/reel/DXOyr8JjkwH) |
| 22 | Essa campanha da Pepsi vai além da provocação. A Monster vai deixar de ser o energético dos gamers para invadir a bolsa das mulheres. | Manoel Victor | 2026-02-22 | 727.514 | 302,5 | 78 | 64 | 0,997 | 0,938 | 0,935 | [reel](https://www.instagram.com/reel/DVDzbdUiYvV) |
| 23 | A Samsung lançou um par de óculos que é o começo do fim da era do celular. Deixa eu te explicar. | Izabela Anholett | 2026-08-07 | 9.391.531 | 146,7 | 78 | 61 | 0,994 | 0,938 | 0,932 | [reel](https://www.instagram.com/reel/DbvGvW2hRek) |
| 24 | Uma cirurgia brasileira salvou mais de 8.000 pessoas ao provar que muitos tumores de câncer simplesmente desaparecem sozinhos. Mas é triste o motivo de você nunca ter ouvido falar nela. | Drielle Castelani | 2026-07-08 | 129.476 | 50,5 | 80 | 63 | 0,962 | 0,965 | 0,928 | [reel](https://www.instagram.com/reel/DajCYYMJpvN) |
| 25 | Esse médico esperou o chefe ir embora, trancou a sala e enfiou um tubo dentro do próprio coração. | Drielle Castelani | 2026-06-16 | 216.411 | 120,2 | 78 | 57 | 0,988 | 0,938 | 0,926 | [reel](https://www.instagram.com/reel/DZqY9lQhqRE) |

**Observações**
- **Todos os 25 são roteiros da casa (`vm_script = 'sim'`).** Retenção medida é quase exclusiva da VM (1.256 dos 1.445 vídeos com retenção são `sim`), então essa lista mostra o **padrão VM** no seu melhor.
- **O "mas" na segunda frase:** "Não de futebol, mas de gestão", "Mas isso não foi um erro, foi uma estratégia", "Mas é triste o motivo de você nunca ter ouvido falar nela". O sub-hook fica acima de 60% quando a segunda frase vira a expectativa que a primeira criou.
- **Referência afetiva brasileira + reviravolta corporativa:** Palmeiras, São Paulo, Ping Pong, Monarque, Nike × Brasil, "brasileiro mais rico do mundo". Pedro Elero aparece 5 vezes com Palmeiras: clube de massa + bastidor de gestão.
- **Hooks curtos e visuais seguram mais:** "Esse médico... enfiou um tubo dentro do próprio coração", "Uma gambiarra insana...". A cena cabe na cabeça em 2 segundos.

### 3b. Hook que segura, mas não distribui (ret. hook ≥ 76 = p90 e coeficiente < 1)

Só **8 casos** em 1.290: retenção alta quase sempre vem com distribuição.

| Hook (literal) | Cliente | Data | Views | Coef. | Ret. hook | Ret. sub-hook | % não seguidores | Link |
|---|---|---|---:|---:|---:|---:|---:|---|
| O chat GPT mais avançado de todos os tempos acabou de chegar, dando início a uma nova era na terra. A era em que a IA já consegue fazer melhor a maioria dos trabalhos que a mente humana faz. | Thiago Bisewski | 2026-09-05 | 2.902 | 0,73 | 100 | 76 | 99,8 | [reel](https://www.instagram.com/reel/Dc6ibuaRBHV) |
| Esse cara decidiu abrir a boca e expor um segredo assustador que está acontecendo bem debaixo do seu nariz, e você precisa saber disso. | Thiago Bisewski | 2026-09-11 | 2.021 | 0,70 | 99 | 62 | 100,0 | [reel](https://www.instagram.com/reel/DdKiSY9xjSZ) |
| Em fevereiro de 2026, o governo Trump fez o que chamaram de a maior ação desregulatória da história dos Estados Unidos. | Leonardo Nogueira | 2026-05-25 | 7.607 | 0,53 | 77 | 63 | 71,5 | [reel](https://www.instagram.com/reel/DYyB7FDPAK_) |
| Na Coreia, o Starbucks lançou uma campanha que fez o CEO ser demitido em algumas horas e semanas depois ser indicado como suspeito criminal pela polícia. | Pedro Elero | 2026-07-11 | 1.644 | 0,87 | 76 | 53 | 84,6 | [reel](https://www.instagram.com/reel/Daqni1rEc-Y) |
| Toyota quase faliu antes de ter sucesso, mas quase ninguém sabe disso. | Leonardo Nogueira | 2026-04-12 | 5.086 | 0,54 | 76 | 53 | 91,1 | [reel](https://www.instagram.com/reel/DXDarrgjJsh) |
| O carro do presidente dos Estados Unidos é muito mais insano do que você imagina. The Beast é blindado contra explosivos, dá choque em quem encosta na maçaneta e carrega suprimentos de sangue do tipo exato do presidente numa geladeira a bordo. | Leonardo Nogueira | 2026-08-04 | 7.186 | 0,58 | 76 | 56 | 35,2 | [reel](https://www.instagram.com/reel/DboQ3MIP_gk) |
| Todo mundo chamava essa mulher de burra, e até o próprio namorado duvidou dela. Mas todos eles estavam enganados. | Marcio Grazino | 2026-08-05 | 8.261 | 0,56 | 76 | 58 | 59,5 | [reel](https://www.instagram.com/reel/Dbq_w9gRpJY) |
| A marca de carro chinesa que ninguém conhecia, tá derrubando os concorrentes no Brasil e no mundo. E a cada 10 carros elétricos vendidos no Brasil, sete são dela. Em fevereiro desse ano, o carro mais vendido no varejo brasileiro não foi japonês, nem alemão, nem americano, foi um chinês da BYD. | Leonardo Nogueira | 2026-07-04 | 11.552 | 0,88 | 76 | 59 | 70,0 | [reel](https://www.instagram.com/reel/DaY-NmhvA1Z) |

Observações:
- **Thiago Bisewski** (retenção de 99 e 100%, com 100% de não seguidores) tem só 6 vídeos com retenção, e números tão altos sobre amostra pequena sugerem uma medição instável. Trate como suspeito.
- **Nos outros casos o hook é bom, mas o tema é morno ou genérico:** "ação desregulatória", "Toyota quase faliu", "o carro do presidente". O hook segura quem chegou, mas o assunto não puxa compartilhamento.
- Leonardo Nogueira aparece 4 vezes. É o mesmo cliente do 2º maior vídeo da janela (6,19 milhões), sinal de que no canal dele **o tema decide mais que o hook**.

### 3c. Distribui sem segurar (ret. hook ≤ 55 = p25 e views ≥ 50 mil)

| Hook (literal) | Cliente | Data | Views | Coef. | Ret. hook | Ret. sub-hook | % não seguidores | Link |
|---|---|---|---:|---:|---:|---:|---:|---|
| Esses dois irmãos saíram de uma porta de madeira no fundo de quintal para um dos maiores impérios de ônibus do planeta. | Marcelo Germano | 2026-03-12 | 684.675 | 17,64 | 3 | 0 | 25,6 | [reel](https://www.instagram.com/reel/DVzVymeFFEC) |
| Nessa empresa nasceu uma oficina falida e hoje milhões de casas no mundo inteiro são feitas usando as peças que ela fabrica. | Marcelo Germano | 2026-03-14 | 429.322 | 4,68 | 46 | 24 | 41,4 | [reel](https://www.instagram.com/reel/DV4Zoc5jjci) |
| Esse cara foi chamado de burro na escola e hoje fatura 18 bilhões por ano. | Marcelo Germano | 2026-02-28 | 207.935 | 4,61 | 53 | 26 | 10,0 | [reel](https://www.instagram.com/reel/DVUVUVqjn-V) |
| Esses estudantes baianos transformaram lixo em um concreto que aguenta quase três toneladas. E tudo começou dentro de uma escola pública no sertão da Bahia. | Marcio Grazino | 2026-09-06 | 163.158 | 11,31 | 55 | 38 | 69,2 | [reel](https://www.instagram.com/reel/Dc88ZmVx8SY) |
| Esse farmacêutico comprou os restos de lixo do Silvio Santos e construiu um império que fatura mais de 30 bilhões por ano. | Marcelo Germano | 2026-03-20 | 145.870 | 2,21 | 53 | 33 | 33,2 | [reel](https://www.instagram.com/reel/DWH3CDEhSAS) |
| Esses dois irmãos construíram uma das maiores marcas do Brasil! | Marcelo Germano | 2026-03-17 | 106.711 | 1,75 | 51 | 24 | 32,0 | [reel](https://www.instagram.com/reel/DWANsxJFIaJ) |
| Esses caras quase faliram vendendo chapéus E hoje eles faturam 400 milhões de reais por ano | Marcelo Germano | 2026-03-18 | 70.722 | 0,84 | 53 | 28 | 37,8 | [reel](https://www.instagram.com/reel/DWCyfFMhox_) |
| Essa pequena oficina de Joinville se tornou uma das maiores empresas do Brasil. | Marcelo Germano | 2026-03-16 | 61.037 | 0,66 | 47 | 28 | 38,1 | [reel](https://www.instagram.com/reel/DV9pNZgjbZo) |
| A cacau show não vende mais chocolates. A cacau show não vende mais chocolate. Ou, pelo menos, não só. Ela agora vende ingressos para parque de diversão. | Marcelo Germano | 2026-03-21 | 58.722 | 0,83 | 55 | 31 | 31,3 | [reel](https://www.instagram.com/reel/DWKZkU8AU30) |
| A Leite de Rosas quase virou lembrança de banheiro antigo, mas foi salva por uma decisão que parecia burra: parar de tentar parecer jovem e voltar a vender o produto da sua avó. | Marcos Pelozato | 2026-06-18 | 56.728 | 6,96 | 54 | 30 | 48,6 | [reel](https://www.instagram.com/reel/DZvnppllYwJ) |
| 25 de Março morreu de vez. | Thiago Franco | 2026-03-13 | 53.758 | 6,49 | 55 | 34 | 56,0 | [reel](https://www.instagram.com/reel/DV1isvMj7FK) |
| o shopping está falindo e o lojista que está dentro está sendo o último a perceber | Thiago Franco | 2026-04-18 | 53.660 | 3,54 | 52 | 34 | 30,6 | [reel](https://www.instagram.com/reel/DXSKhZRJInu) |

Observações:
- **Marcelo Germano tem 8 dos 12 casos, todos de fevereiro e março de 2026,** e um deles com retenção de 3% (provável erro de coleta). O padrão parece de medição ou de canal: base grande e fiel, com baixa taxa de não seguidores (10 a 41%). Não é evidência de que "hook fraco viraliza". Vale checar a coleta desse cliente antes de usar o caso em aula.
- **A fórmula "de X humilde a império de Y bilhões" se repete aqui:** "Esses dois irmãos...", "oficina falida", "quase faliram vendendo chapéus". O resultado é previsível ("vai virar império"), então quem chega não precisa ficar. A promessa está toda entregue no hook.

---

## 4. Hall da fama all-time (top 15 por views, sem janela)

Os 15 maiores vídeos IG de clientes **estão todos dentro da janela de 12 meses**, então a lista é idêntica às 15 primeiras posições do ranking 1. Por isso entram também os melhores vídeos de antes da janela e um anexo com os canais de casa que não são clientes.

| # | Hook (literal) | Cliente | Data | Views | Coef. | Ret. hook | VM | Link |
|---|---|---|---|---:|---:|---:|---|---|
| 1 | A Samsung lançou um par de óculos que é o começo do fim da era do celular. Deixa eu te explicar. | Izabela Anholett | 2026-08-07 | 9.391.531 | 146,7 | 78 | sim | [reel](https://www.instagram.com/reel/DbvGvW2hRek) |
| 2 | Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica. | Leonardo Nogueira | 2026-05-22 | 6.192.964 | 438,4 | 79 | sim | [reel](https://www.instagram.com/reel/DYo3ldvOFHW) |
| 3 | a única maneira de mudar de vida é mudando de ambiente? a única maneira de mudar de vida é mudar de ambiente. | Café com Ferri | 2026-05-13 | 4.638.542 | 88,4 | — | não | [reel](https://www.instagram.com/reel/DYSIvUclThT) |
| 4 | Ela era a dançarina mais desejada do Brasil. Ele, um cantor no começo. Mais de 20 anos depois, Xanddy e Carla Perez seguem juntos, e o motivo surpreende muita gente. | Marcos Pelozato | 2026-08-30 | 4.368.113 | 478,9 | — | não | [reel](https://www.instagram.com/reel/DcqJw8tOFPK) |
| 5 | O HB20 e o Onix serão destruídos por esse novo lançamento da BYD, que faz 71 quilômetros por litro. | Leonardo Cirino | 2026-09-21 | 4.088.462 | 179,7 | — | sim | [reel](https://www.instagram.com/reel/DdkDHUgBnEm) |
| 6 | A contagem regressiva começou. A China vai implementar no Brasil os pagamentos com a palma da mão, ainda esse ano. | Izabela Anholett | 2026-06-11 | 3.476.947 | 79,1 | 75 | sim | [reel](https://www.instagram.com/reel/DZcVckKByOp) |
| 7 | A China tá silenciosamente construindo um império no Nordeste brasileiro. E quando eu digo império, eu não estou exagerando. | Lincoln Fracari | 2026-03-10 | 3.351.048 | 450,3 | — | não | [reel](https://www.instagram.com/reel/DVt98MUka1u) |
| 8 | A caminhada deu mais engajamento do que o Oscar. | Café com Ferri | 2026-02-06 | 3.237.621 | 51,9 | — | não | [reel](https://www.instagram.com/reel/DUbU6HoCohh) |
| 9 | O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar. | Fernando Pereira | 2026-03-03 | 3.212.057 | 544,4 | 79 | sim | [reel](https://www.instagram.com/reel/DVbunyzDvij) |
| 10 | O dono do Instagram acabou de declarar guerra à Apple. Usando uma arma que pode literalmente mudar o mundo que a gente conhece. E o campo de batalha é o seu rosto, tá? | Izabela Anholett | 2026-09-29 | 3.154.215 | 40,1 | — | sim | [reel](https://www.instagram.com/reel/Dd4cgRKzhhw) |
| 11 | TODA VEZ QUE VOCÊ ENTRA NUM SUPERMERCADO GRANDE NA ENTRADA SABENDO DAS PESSOAS, A MAIORIA DAS PESSOAS NÃO VAI COMPRAR. | Quarto Slot Exame (Antigo Caio Lima) | 2026-04-05 | 2.900.423 | 344,9 | — | não | [reel](https://www.instagram.com/reel/DWxGBlAh7DU) |
| 12 | Hoje eu fui numa reunião da da Cimed, recebi pessoas formadas lá que eles são um mais um dois. 10 slides pra fazer um, uma coisa óbvia. | Café com Ferri | 2026-02-04 | 2.830.936 | 43,8 | — | não | [reel](https://www.instagram.com/reel/DUVzHjLE4gO) |
| 13 | Esse é o cara mais odiado do mundo pelos donos de academia. Isso porque a academia tradicional vende o mesmo espaço para centenas de pessoas, ao mesmo tempo. Mas ele resolveu vender o espaço inteiro para uma pessoa só. | Renato Torres | 2026-05-30 | 2.621.349 | 244,6 | — | sim | [reel](https://www.instagram.com/reel/DY-bwdmpj4e) |
| 14 | aí o Zé Felipe veio falar esses dia que não quer que os menino viaje pra ir pra escola. | Café com Ferri | 2026-05-07 | 2.603.890 | 51,0 | — | não | [reel](https://www.instagram.com/reel/DYDnO44EhKv) |
| 15 | essa estratégia assustadora fez esse empresário multiplicar 10x sua fortuna. | Cadu Neiva | 2026-04-04 | 2.532.646 | 740,2 | — | sim | [reel](https://www.instagram.com/reel/DWuSVeFEdwk) |

**Melhores de clientes antes da janela (antes de 17/10/2025)**

| Hook (literal) | Cliente | Data | Views | Coef. | VM | Link |
|---|---|---|---:|---:|---|---|
| Lista de desabrigados, pessoas perdendo os filhos, pessoas perdendo os pais, os avós e assim por diante. | João Felipe Marques | 2024-05-05 | 2.092.817 | 1201,4 | não | [reel](https://www.instagram.com/reel/C6m8VJ9NkkQ) |
| Um equívoco que às vezes a gente tem com a, com a inteligência artificial, é que a gente quer meio que testar a IA, tipo, deixa eu ver se ela entende mesmo, se ela sabe fazer um PPT, que é uma forma que a gente não teria com o colaborador, em resumo. | Leonardo Cirino | 2025-03-16 | 1.006.786 | 78,4 | não | [reel](https://www.instagram.com/reel/DHQmaC-uonz) |
| marketing B2B também é sobre relação humana. Por trás de toda empresa, de todo CNPJ, há um ser humano que é o tomador de decisão. | Leonardo Cirino | 2025-04-26 | 544.446 | 47,3 | não | [reel](https://www.instagram.com/reel/DI6dAD3ueep) |

**Anexo: canais da casa que não são clientes (fora dos rankings), com 1 milhão de views ou mais**

| Hook (literal) | Canal | Data | Views | Coef. | Link |
|---|---|---|---:|---:|---|
| Isso aqui é inacreditável. A Copa do Mundo nem começou, mas já aconteceu uma coisa que está deixando muita gente furiosa. | Felipe Dantas | 2025-12-10 | 4.067.016 | 12,7 | [reel](https://www.instagram.com/reel/DSFX79dDb1q) |
| Estamos ficando burros. E mais burros do que em qualquer outro momento da história. | Igor Bevilaqua | 2026-03-16 | 3.987.699 | 20,7 | [reel](https://www.instagram.com/reel/DV8w1VujrUd) |
| O Irã ameaçou esmagar os Estados Unidos, mas hoje um dos homens mais perversos da história está morto. | Felipe Dantas | 2026-02-28 | 3.404.269 | 14,5 | [reel](https://www.instagram.com/reel/DVUvWMqDUzo) |
| A brasileira desconhecida tá prestes a mudar a história da humanidade. Mas infelizmente poderá ser punida por isso. | Igor Bevilaqua | 2026-02-20 | 3.289.941 | 18,7 | [reel](https://www.instagram.com/reel/DU-tOKCjiRx) |
| Se você acredita que a captura do Maduro foi feita porque o governo americano precisa do petróleo da Venezuela, você caiu na maior mentira da técnica. | Felipe Dantas | 2026-01-04 | 2.293.595 | 7,6 | [reel](https://www.instagram.com/reel/DTGPeFxiST6) |

**Observações**
- **O hall da fama é recente:** os 15 maiores são de fevereiro a setembro de 2026. O topo atual veio do método atual, e não de um acerto antigo isolado.
- **Formato:** 8 dos 15 são roteiros VM (`sim`). Os outros 7 são cortes de opinião (Café com Ferri soma 4).
- **Tecnologia e geopolítica de consumo (celular, carro, China, Big Tech) são o tema dominante.** O hook traduz a notícia para o bolso ou o cotidiano do espectador: "seu rosto", "HB20 e Onix", "pagar com a palma da mão".

---

## 5. Recorte: roteiro da casa (`vm_script = 'sim'`) × outros (`'nao'`), últimos 12 meses

| Grupo | Vídeos | Clientes | Mediana de views | Média de views | Coef. mediano | % acima do limiar (acerto) | % viral (100 mil+) | Ultravirais (1 milhão+) | Palavras no hook (mediana) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| sim (VM) | 2.644 | 29 | **9.263** | **77.644** | **1,07** | **21,6%** | **14,0%** | **30** | 24 |
| não | 3.366 | 31 | 5.281,5 | 40.021 | 0,92 | 14,9% | 6,1% | 21 | 24 |

O roteiro VM viraliza **2,3 vezes mais** (14,0% contra 6,1%) e tem mediana de views 75% maior, com hooks do mesmo tamanho (mediana de 24 palavras nos dois grupos).

### 5a. Top 10 roteiros VM por views (12 meses)

| # | Hook (literal) | Cliente | Data | Views | Coef. | Link |
|---|---|---|---|---:|---:|---|
| 1 | A Samsung lançou um par de óculos que é o começo do fim da era do celular. Deixa eu te explicar. | Izabela Anholett | 2026-08-07 | 9.391.531 | 146,7 | [reel](https://www.instagram.com/reel/DbvGvW2hRek) |
| 2 | Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica. | Leonardo Nogueira | 2026-05-22 | 6.192.964 | 438,4 | [reel](https://www.instagram.com/reel/DYo3ldvOFHW) |
| 3 | O HB20 e o Onix serão destruídos por esse novo lançamento da BYD, que faz 71 quilômetros por litro. | Leonardo Cirino | 2026-09-21 | 4.088.462 | 179,7 | [reel](https://www.instagram.com/reel/DdkDHUgBnEm) |
| 4 | A contagem regressiva começou. A China vai implementar no Brasil os pagamentos com a palma da mão, ainda esse ano. | Izabela Anholett | 2026-06-11 | 3.476.947 | 79,1 | [reel](https://www.instagram.com/reel/DZcVckKByOp) |
| 5 | O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar. | Fernando Pereira | 2026-03-03 | 3.212.057 | 544,4 | [reel](https://www.instagram.com/reel/DVbunyzDvij) |
| 6 | O dono do Instagram acabou de declarar guerra à Apple. Usando uma arma que pode literalmente mudar o mundo que a gente conhece. E o campo de batalha é o seu rosto, tá? | Izabela Anholett | 2026-09-29 | 3.154.215 | 40,1 | [reel](https://www.instagram.com/reel/Dd4cgRKzhhw) |
| 7 | Esse é o cara mais odiado do mundo pelos donos de academia. Isso porque a academia tradicional vende o mesmo espaço para centenas de pessoas, ao mesmo tempo. Mas ele resolveu vender o espaço inteiro para uma pessoa só. | Renato Torres | 2026-05-30 | 2.621.349 | 244,6 | [reel](https://www.instagram.com/reel/DY-bwdmpj4e) |
| 8 | essa estratégia assustadora fez esse empresário multiplicar 10x sua fortuna. | Cadu Neiva | 2026-04-04 | 2.532.646 | 740,2 | [reel](https://www.instagram.com/reel/DWuSVeFEdwk) |
| 9 | Esse é o maior golpe das lojas de shopping contra o governo. E o pior, o golpe é totalmente legal. | Dilson Peres | 2026-09-21 | 2.212.971 | 55,7 | [reel](https://www.instagram.com/reel/DdkLxRzBKTs) |
| 10 | A sua cerveja do final de semana vai ficar mais cara por conta do governo. | Dilson Peres | 2026-05-05 | 2.131.824 | 32,2 | [reel](https://www.instagram.com/reel/DX-KBg-thjK) |

### 5b. Top 15 roteiros VM por coeficiente (views ≥ 50 mil, 12 meses)

| # | Hook (literal) | Cliente | Data | Views | Coef. | Ret. hook | Link |
|---|---|---|---|---:|---:|---:|---|
| 1 | essa estratégia assustadora fez esse empresário multiplicar 10x sua fortuna. | Cadu Neiva | 2026-04-04 | 2.532.646 | 740,2 | — | [reel](https://www.instagram.com/reel/DWuSVeFEdwk) |
| 2 | O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar. | Fernando Pereira | 2026-03-03 | 3.212.057 | 544,4 | 79 | [reel](https://www.instagram.com/reel/DVbunyzDvij) |
| 3 | Jovem cria IA que simula jutsu do Naruto. Esse cara criou uma IA que reconhece se você fez o rasengan certo. E agora a geração inteira que imitava o Naruto no espelho, pode descobrir se o jutsu funcionaria de verdade. | Patrick Diorio | 2026-08-17 | 412.692 | 457,3 | 85 | [reel](https://www.instagram.com/reel/DcKNGwYuTIK) |
| 4 | Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica. | Leonardo Nogueira | 2026-05-22 | 6.192.964 | 438,4 | 79 | [reel](https://www.instagram.com/reel/DYo3ldvOFHW) |
| 5 | Enquanto as gigantes gastam bilhões para criar tecnologia, esse jovem de 20 anos criou uma concorrente da Apple usando restos de lixo. | Rafael Rodrigues | 2026-03-21 | 1.081.942 | 438,4 | 71 | [reel](https://www.instagram.com/reel/DWKJvC7Dz8-) |
| 6 | Essa campanha da Pepsi vai além da provocação. A Monster vai deixar de ser o energético dos gamers para invadir a bolsa das mulheres. | Manoel Victor | 2026-02-22 | 727.514 | 302,5 | 78 | [reel](https://www.instagram.com/reel/DVDzbdUiYvV) |
| 7 | Essa IA recebeu a ordem explícita de não cometer crimes, mas cometeu. Depois, sentiu remorso e votou pela própria destruição. Sim, isso aconteceu de verdade. | João Felipe Marques | 2026-06-06 | 510.036 | 298,5 | — | [reel](https://www.instagram.com/reel/DZPs8ZuBt9M) |
| 8 | Esse é o cara mais odiado do mundo pelos donos de academia. Isso porque a academia tradicional vende o mesmo espaço para centenas de pessoas, ao mesmo tempo. Mas ele resolveu vender o espaço inteiro para uma pessoa só. | Renato Torres | 2026-05-30 | 2.621.349 | 244,6 | — | [reel](https://www.instagram.com/reel/DY-bwdmpj4e) |
| 9 | Esse equipamento faz o barco parar de balançar, mesmo com o mar agitado. E não, ele não ancora a embarcação. E também não tenta controlar as ondas. | Leonardo Martins | 2026-09-25 | 780.453 | 242,6 | — | [reel](https://www.instagram.com/reel/DduHhYxx97R) |
| 10 | Essa marca de tênis manda uma faca de verdade dentro da caixa e pede para você destruir o produto que acabou de comprar. | Pedro Elero | 2026-08-14 | 432.403 | 224,9 | 82 | [reel](https://www.instagram.com/reel/DcBhRCHD9Gk) |
| 11 | A chinesa dona da Volvo comprou alguma das maiores empresas do mundo e agora chegou no Brasil. E a estratégia por trás disso é sensacional. | Franklin Tomich | 2026-05-30 | 990.828 | 196,7 | 81 | [reel](https://www.instagram.com/reel/DY-krjmNG2R) |
| 12 | O HB20 e o Onix serão destruídos por esse novo lançamento da BYD, que faz 71 quilômetros por litro. | Leonardo Cirino | 2026-09-21 | 4.088.462 | 179,7 | — | [reel](https://www.instagram.com/reel/DdkDHUgBnEm) |
| 13 | Enquanto muita gente critica esse desenho de luta por mostrar violência para criança. Esse psicólogo resolveu investigar e descobriu que ele faz exatamente o efeito contrário. | Patrick Diorio | 2026-08-21 | 156.689 | 177,5 | 70 | [reel](https://www.instagram.com/reel/DcUeHJiB5ZI) |
| 14 | A maior banda do mundo cancelou um show milionário por causa de um simples M&M marrom. | Rodrigo Waughan | 2026-03-19 | 543.929 | 176,9 | 110* | [reel](https://www.instagram.com/reel/DWEHDe8DlJz) |
| 15 | eu não acredito que ninguém pensou nisso antes essa marca de carvão brasileira viralizou lá fora por causa da sua embalagem | Rodrigo Waughan | 2026-03-07 | 529.589 | 174,9 | 60* | [reel](https://www.instagram.com/reel/DVlNhOaCB6m) |

\* Rodrigo Waughan usa outra escala de retenção (veja "Base e filtros").

### 5c. Top 10 não VM por coeficiente (views ≥ 50 mil, 12 meses), para contraste

| # | Hook (literal) | Cliente | Data | Views | Coef. | Link |
|---|---|---|---|---:|---:|---|
| 1 | Você é dono de empresa e um dia pretende vender o seu negócio? Então fica até o final, pois tem uma surpresa pra você. | Franklin Tomich | 2026-04-08 | 273.411 | 729,1 | [reel](https://www.instagram.com/reel/DW4XTgRDt0a) |
| 2 | Ela era a dançarina mais desejada do Brasil. Ele, um cantor no começo. Mais de 20 anos depois, Xanddy e Carla Perez seguem juntos, e o motivo surpreende muita gente. | Marcos Pelozato | 2026-08-30 | 4.368.113 | 478,9 | [reel](https://www.instagram.com/reel/DcqJw8tOFPK) |
| 3 | A China tá silenciosamente construindo um império no Nordeste brasileiro. E quando eu digo império, eu não estou exagerando. | Lincoln Fracari | 2026-03-10 | 3.351.048 | 450,3 | [reel](https://www.instagram.com/reel/DVt98MUka1u) |
| 4 | A Estrela, a Bombril, as Americanas e a Polishop, todas elas pediram recuperação judicial. A Varig e a Parmalat simplesmente desapareceram. E todas elas deixaram sinais muito antes da crise explodir. E o mais assustador, você sabe o que todas elas tinham em comum? A resposta vai te surpreender. | Franklin Tomich | 2026-05-24 | 187.053 | 401,4 | [reel](https://www.instagram.com/reel/DYvEahZtxVE) |
| 5 | O Palmeiras fracassou em 2025. Essa é a frase que começou a circular depois do fim da temporada. | Pedro Elero | 2026-03-07 | 411.505 | 396,8 | [reel](https://www.instagram.com/reel/DVliQCqjilr) |
| 6 | Você sabia que existe um órgão no Brasil que pode proibir a venda de uma empresa? Pois é, ele se chama CADE. | Franklin Tomich | 2026-04-06 | 134.415 | 385,1 | [reel](https://www.instagram.com/reel/DWzVGx_jfRB) |
| 7 | Um bilhão, isto mesmo, um bilhão foi o preço que a dona da Nutella pagou para aquisição da Bold. Uma empresa criada em 2018 por um jovem de Divinópolis, em Minas Gerais. | Franklin Tomich | 2026-03-28 | 170.179 | 376,5 | [reel](https://www.instagram.com/reel/DWb3BkZDrCS) |
| 8 | TODA VEZ QUE VOCÊ ENTRA NUM SUPERMERCADO GRANDE NA ENTRADA SABENDO DAS PESSOAS, A MAIORIA DAS PESSOAS NÃO VAI COMPRAR. | Quarto Slot Exame (Antigo Caio Lima) | 2026-04-05 | 2.900.423 | 344,9 | [reel](https://www.instagram.com/reel/DWxGBlAh7DU) |
| 9 | de R$ 297 mil reais pra mais de R$ 700 mil todos os meses. E o segredo estava dentro do próprio ecossistema do Mercado Livre. | Thiago Franco | 2026-08-25 | 781.864 | 306,7 | [reel](https://www.instagram.com/reel/DcejbHhB5pX) |
| 10 | Você sabe como Bernardo Arnault, dono da Louis Vuitton, construiu uma fortuna de 500 bilhões de dólares? Ele não criou nenhuma marca ou construiu nenhuma empresa. Ele simplesmente comprou. | Franklin Tomich | 2026-04-07 | 109.766 | 300,7 | [reel](https://www.instagram.com/reel/DW1WFMlDtHu) |

**Observações**
- **A assinatura do hook VM é "sujeito concreto + ação no presente + consequência":** "Esse taxista... travou o software", "Essa marca de tênis manda uma faca", "A Samsung lançou... começo do fim". Raramente começa com pergunta.
- **O hook não VM de sucesso começa mais com pergunta ou com "Você...":** "Você é dono de empresa...?", "Você sabia que...", "Preciso saber programar...?". Na janela, porém, hooks com pergunta viralizam **menos** que a média (6,6% contra 10,3%), e os que abrem com "Você" também (7,3% contra 9,7%). **A pergunta funciona para nicho** (Franklin, Patrick Diorio), não para escala.
- **Os ganchos de "lacuna", explícitos ou não, aparecem nos dois grupos:** "A resposta vai te surpreender", "e o motivo surpreende muita gente", "quase ninguém sacou". Hooks com "quase ninguém / ninguém sabe / você nunca" viralizam em **17,4%** dos casos, contra 9,3% dos demais.

---

## Anexo: padrões textuais × resultado (12 meses, clientes, IG)

Regex aplicado sobre o hook em minúsculas. "% viral" é a parcela de vídeos com 100 mil views ou mais. "% dos ultra" é a parcela dos 51 ultravirais da janela que contém o padrão.

| Padrão no hook | Vídeos com o padrão | % viral com | % viral sem | Coef. mediano com | Coef. mediano sem | % dos ultravirais |
|---|---:|---:|---:|---:|---:|---:|
| "acabou de" / "acaba de" | 322 | **22,4** | 8,9 | **1,84** | 0,96 | 19,6 |
| Marca grande (Apple, iPhone, Samsung, Google, Toyota, BYD, Nike, Coca, Pepsi, Tesla, Meta, ChatGPT, OpenAI, Nestlé, Mercado Livre, Honda, Volvo, Geely) | 488 | **18,6** | 8,8 | 1,22 | 0,975 | **29,4** |
| Guerra / destruir / matar / fim de / acabar com | 303 | 18,2 | 9,2 | 1,16 | 0,98 | 23,5 |
| "quase ninguém" / "ninguém sabe/conhece/percebe" / "você nunca" / "você não percebeu" | 236 | 17,4 | 9,3 | 1,215 | 0,98 | 9,8 |
| China / chinês / chinesa | 452 | 14,8 | 9,2 | 1,51 | 0,96 | 17,6 |
| Abre com "Esse/Essa/Esses/Essas" | 711 | 14,6 | 8,9 | 1,04 | 0,98 | 9,8 |
| Contém número | 1.620 | 9,9 | 9,5 | 1,03 | 0,97 | 25,5 |
| Abre com "Você" | 247 | 7,3 | 9,7 | 0,90 | 1,00 | 2,0 |
| Contém pergunta (?) | 1.175 | 6,6 | 10,3 | 0,85 | 1,02 | 19,6 |

**Limites desta leitura:**
- É uma associação, não um teste causal. Os padrões se sobrepõem entre si e com `vm_script`, já que roteiro VM usa mais "acabou de" e marca.
- O "?" inclui as transcrições de podcast, o que explica ele estar em 19,6% dos ultravirais (Café com Ferri) mesmo com taxa viral baixa.
