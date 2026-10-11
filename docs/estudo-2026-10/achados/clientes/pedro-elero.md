# Pedro Elero

Lição por cliente (estudo 2026-10). Nicho: FUTEBOL / MARKETING / INOVAÇÃO (Negócios, marcas e cases). 68 roteiros, 200 vídeos analisáveis. Topo = quartil de cima do coeficiente viral dentro de cliente x rede x trimestre (base 25%). Com uma conta só, os números são direção, não lei.

## Síntese
- **Funciona para ele:** o dinheiro por trás do clube, com o nome do clube e "acabou de" ("O Palmeiras acaba de tomar uma atitude que deixou muita gente revoltada, mas você não pode ignorar.", TT, coef 427; "O Botafogo acabou de dar uma aula! Não de futebol, mas sim de como tomar a pior decisão financeira do ano.", TT, coef 292). "Acabou de" no hook: 67% de topo contra 18%; bastidores do dinheiro nos clubes: 52%; abrir pelo nome: 41% contra 19%. Derrubam: roteiro modelado (19% de topo contra 44% do não modelado), história só estrangeira (11%) e conclusão de sermão (8%, 8 roteiros).
- **Regra global que vale:** 12 das 16 que deram para medir; com diferença significativa nele: placar do hook, abrir pelo nome, "acabou de" e contra pauta só estrangeira.
- **Onde foge:** a modelagem inverte com força nele (78% dos roteiros são modelados; o estudo de embeddings achou OR 0,30). "Esse/Essa" rende quando traz objeto concreto e visual ("Essa marca de tênis manda uma faca de verdade dentro da caixa...", YT, coef 1.238): 47% de topo, mas em 6 roteiros. Lugar estrangeiro no hook (6 roteiros) e "você" (11) ficam contra a regra, com poucos casos.

## 1. Panorama
| rede | vídeos | % com coef >= 1,5 (não é a taxa oficial) | coef mediano | views medianas |
|---|---|---|---|---|
| Instagram | 68 | 31% | 1,12 | 2.204 |
| TikTok | 68 | 41% | 1,17 | 588 |
| YouTube | 64 | 48% | 1,44 | 1.987 |

## 2. Regras globais dentro dele
**vale** = mesma direção da regra global; **inverte** = direção contrária; **neutro** = com e sem a menos de 3 pontos; exige 12+ vídeos e 6+ roteiros com a característica. \* = diferença significativa dentro do cliente (OR por rede, IC95 fora de 1). (+)/(-) = direção da regra na casa.

| regra global | vídeos (roteiros) | topo com x sem | lift | IG / TT / YT | leitura |
|---|---|---|---|---|---|
| placar do hook >= +1 (+) | 60 (20) | 37% x 20% | 1,47\* | 1,60 / 1,60 / 1,20 | vale |
| placar do hook <= -1 (-) | 76 (26) | 21% x 27% | 0,84 | 0,77 / 0,77 / 1,00 | vale |
| abre com A/O + nome (ou o nome direto) (+) | 54 (18) | 41% x 19% | 1,63\* | 2,00 / 1,78 / 1,11 | vale |
| "acabou de" no hook (+) | 30 (10) | 67% x 18% | 2,67\* | 2,80 / 2,40 / 2,80 | vale |
| conflito nomeado no hook (+) | 18 (6) | 33% x 24% | 1,33 | - / - / - | vale |
| lugar estrangeiro no hook (China, EUA...) (+) | 18 (6) | 6% x 27% | 0,22 | - / - / - | inverte |
| hook sem nenhum nome próprio (-) | 52 (18) | 15% x 28% | 0,62 | 0,67 / 0,22 / 1,00 | vale |
| abre com Esse/Essa (-) | 17 (6) | 47% x 23% | 1,88\* | - / - / - | inverte |
| "você" no hook (-) | 32 (11) | 28% x 24% | 1,13 | 1,09 / 1,09 / 1,20 | inverte |
| história só estrangeira, sem ponte com o Brasil (-) | 80 (28) | 11% x 34% | 0,45\* | 0,14 / 0,57 / 0,67 | vale |
| 450 a 500 palavras faladas (+) | 21 (8) | 33% x 24% | 1,33 | 1,50 / 1,50 / - | vale |
| 2+ marcadores de origem contada em ordem (-) | 16 (6) | 13% x 26% | 0,50 | - / - / - | vale |
| "Ou seja" no corpo (+) | 45 (15) | 31% x 23% | 1,24 | 1,07 / 1,33 / 1,33 | vale |
| conclusão proibida (pode ser/talvez, a lição, a diferença, você precisa) (-) | 24 (8) | 8% x 27% | 0,33 | 0,50 / 0,50 / 0,00 | vale |
| conclusão em contraste "Enquanto" ou eco do hook (+) | 33 (11) | 33% x 23% | 1,33 | 1,45 / 0,73 / 1,82 | vale |
| roteiro modelado (+) | 155 (53) | 19% x 44% | 0,77\* | 0,83 / 0,68 / 0,82 | inverte |

Sem dado (amostra pequena): IA no hook sem sujeito nomeado na abertura; subhook que puxa o espectador ("imagina você"); menos de 300 palavras; payoff disputa com lado; payoff orgulho com régua de fora; payoff superação; payoff vantagem (dica para o espectador); pede comentário no bloco final (desfecho: seguidores).

## 3. Territórios (8+ roteiros)
- Funcionam: Bastidores do dinheiro nos clubes de futebol (52% de topo, 16 roteiros; casa 49%).
- Falham: Copa do Mundo, Seleção e patrocínios (17%, 8 roteiros; casa 21%).
- Onde mais produz: Bastidores do dinheiro nos clubes de futebol (24% dos roteiros, 52% de topo); Copa do Mundo, Seleção e patrocínios (12% dos roteiros, 17% de topo).

## 4. Payoff
- Mais usa: sacada genial (38% dos roteiros, 22% de topo); bastidor revelado (19% dos roteiros, 21% de topo); virada contraintuitiva (6% dos roteiros, 50% de topo).
- Rende (8+ roteiros): nenhum acima da base. Não rende: bastidor revelado 21%.

## 5. Comando
- Fórmula que converte (IG 48, TT 37): "Eu sou Pedro Elero e se você quer continuar recebendo histórias [das marcas / financeiras] que te fazem pensar fora da caixa, segue meu perfil." ("se você quer" 27% e 29% contra 18% e 17%; histórias 43% contra 22%). Exemplo de topo: TT: "Eu sou Pedro Eléro, e se você quer continuar recebendo histórias financeiras que te fazem pensar fora da caixa, segue meu perfil agora." (p100). IG: "Eu sou o Pedro Elero e se você é como poucos que enxergam gestão e estratégia onde a maioria só vê polêmica, já segue meu perfil." (p100, coef 89,7)
- Evitar: IG: "agora" (8% contra 31%) e "eu te mostro" (13% contra 28%); "quem segue o meu perfil sai com uma sacada nova... clica em seguir" (pior).

## 6. Rede
- Rende mais no YouTube (coef >= 1,5 em 48%, coef mediano 1,44); menos no Instagram (31%, 1,12); TikTok, 41%.
- Por quê: contas pequenas (views medianas de 588 a 2,2 mil). O YouTube é onde a história só estrangeira dele menos perde (lift 0,67 no YouTube contra 0,14 no Instagram), o que bate com a casa: o YouTube aceita história de fora sem ponte, e IG e TikTok punem (subagente de plataformas). O dinheiro do clube rende nas três.

## 7. Recomendações
1. **Pauta: o dinheiro do clube, não a Seleção.** Dívida, dono, presidente, patrocínio, contrato. Número dele: "Bastidores do dinheiro nos clubes de futebol", 52% de topo em 16 roteiros (24% da produção; na casa, 49% e o território mais forte junto com carro chinês); "Copa do Mundo, Seleção e patrocínios", 17% em 8 roteiros. Topo: "Ela foi ao Palmeiras para colocar o nome da empresa na camisa do clube. Acabou ficando com o cargo mais alto da história do time..." (TT, coef 452,95); "O Palmeiras te enganou e o Carlos Miguel não salvou o Verdão ontem da forma que a mídia está fazendo parecer." (TT, coef 169,79). Fraco: "O Neymar não é mais jogador de futebol! É isso que muito jornalista diz por aí e talvez eles estejam certos." (YT, coef 0,09).
2. **Use "[Clube ou marca] acabou de [verbo forte]".** Número dele: "acabou de" no hook, 67% de topo contra 18% (30 vídeos, 10 roteiros, significativo; só 15% dos hooks dele); abrir pelo nome, 41% contra 19% (significativo). Topo: "O Palmeiras acaba de tomar uma atitude que deixou muita gente revoltada, mas você não pode ignorar." (TT, coef 427,37); "O Botafogo acabou de dar uma aula! Não de futebol, mas sim de como tomar a pior decisão financeira do ano." (TT, coef 292,35). Fraco: "Quase ninguém percebeu que esta vai ser a Copa mais triste de todas." (IG, coef 0,60).
3. **Pare de modelar quase tudo.** Para ele, o roteiro próprio rende mais que o dobro do modelado; modele só quando a origem tem fato bizarro ou briga. Número dele: roteiro modelado, 19% de topo contra 44% do não modelado (155 vídeos, 53 roteiros, 78% da produção, significativo). Topo, não modelados: "O Palmeiras acabou de mandar uma promessa pra jogar com o Messi. E é por isso que cada vez mais, Barcelona e Real Madrid invejam o maior clube do Brasil." (YT, coef 82,72); "O Palmeiras acabou de fechar o semestre devendo R$124 milhões. Mas isso não foi um erro, foi uma estratégia da presidente que quase ninguém sacou." (IG, coef 67,60). Fraco, modelado: "Uma empresa acabou de criar o oposto do cigarro. Você leva à boca, inala, e em vez de destruir os pulmões, você os limpa." (YT, coef 0,18).
4. **Pauta de fora só com ponte para o Brasil.** Número dele: história só estrangeira, 11% de topo contra 34% (80 vídeos, 28 roteiros, 41% da produção, significativo). Topo: "Essa marca de carros que já está no Brasil acabou de fazer o impossível: ela criou um sistema que faz 45 km com apenas 1 litro de gasolina." (TT, coef 486,17); "A rival chinesa do iFood está gastando milhões para patrocinar Palmeiras e Santos, mas o motivo não é simplesmente aparecer na camisa." (TT, coef 21,79). Fraco: "A Red Bull investiu mais de 10 bilhões de dólares pra enganar você. Isso porque a maior marca de energético do mundo não vende bebidas... Vende atenção." (TT, coef 0,34).
5. **Comando: "Eu sou Pedro Elero e se você quer continuar recebendo histórias [das marcas / financeiras] que te fazem pensar fora da caixa, segue meu perfil."** "Se você quer" tem 27% (IG) e 29% (TT) de topo em seguidores contra 18% e 17%; "histórias", 43% contra 22%; no IG, "eu te mostro" (13% contra 28%) e "agora" (8% contra 31%) atrapalham. Topo: "Eu sou Pedro Elero, e se você quer continuar recebendo histórias financeiras que te fazem pensar fora da caixa, segue meu perfil agora." (TT, seguidores p100); "Eu sou Pedro Elero e se você quer aprender continuamente as estratégias de negócios mais inteligentes que as gigantes usam, segue meu perfil." (IG, seguidores p98). Fraco: "Eu sou Pedro Elero e quem segue o meu perfil sai com uma sacada nova para construir marcas de sucesso todos os dias. Então não perca tempo e clica em seguir." (IG, seguidores p4).

## 8. Preferências do cliente
- Proibições: religião; tópicos muito críticos ou polêmicos. Temas: negócios e franquias, futebol, marketing, política de direita com perspectiva empresarial, golfe.
- Conflito com regra global: conflito nomeado e disputa batem no limite do "muito polêmico". Os topos dele mostram o caminho: a briga é com número e decisão de gestão ("a pior decisão financeira do ano"), não com torcida, jogador ou pessoa.
