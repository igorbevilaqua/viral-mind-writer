# Túlio Lichenstein

Lição por cliente (estudo 2026-10). Nicho: PSICODÉLICOS / INVESTIMENTOS / ECONOMIA (Dinheiro, economia e geopolítica). 49 roteiros, 119 vídeos analisáveis. Topo = quartil de cima do coeficiente viral dentro de cliente x rede x trimestre (base 26%). Com uma conta só, os números são direção, não lei.

## Síntese
- **Funciona para ele:** o fato do mercado com nome e o efeito no brasileiro ("Uma substância que só existia em festa clandestina virou aposta de 3,8 bilhões de dólares de uma das maiores farmacêuticas do mundo...", IG, coef 50; "Milhões de brasileiros finalmente conquistaram acesso à sala VIP do aeroporto. Então por que, justo agora, os bancos que criaram esse benefício tão fechando a porta na cara de quem confiou neles?", IG, coef 22). Placar do hook +1 ou mais: 38% de topo contra 19%; 450 a 500 palavras: 41% (6 roteiros). Derrubam: roteiro modelado (13% de topo contra 32% do próprio), bastidor (11%) e história só estrangeira (20%).
- **Regra global que vale:** 4 das 11 que deram para medir; com diferença significativa nele: placar do hook +1 ou mais. Na direção da casa, sem significância: contra placar negativo, contra pauta só estrangeira e 450 a 500 palavras.
- **Onde foge:** a modelagem inverte (significativo; o estudo de embeddings achou OR 0,33 para ele). As regras da primeira palavra (abrir pelo nome, Esse/Essa, hook sem nome, "acabou de") ficam neutras.

## 1. Panorama
| rede | vídeos | % com coef >= 1,5 (não é a taxa oficial) | coef mediano | views medianas |
|---|---|---|---|---|
| Instagram | 49 | 29% | 0,92 | 2.000 |
| TikTok | 39 | 36% | 1,18 | 641 |
| YouTube | 31 | 23% | 1,17 | 1.228 |

## 2. Regras globais dentro dele
**vale** = mesma direção da regra global; **inverte** = direção contrária; **neutro** = com e sem a menos de 3 pontos; exige 12+ vídeos e 6+ roteiros com a característica. \* = diferença significativa dentro do cliente (OR por rede, IC95 fora de 1). (+)/(-) = direção da regra na casa.

| regra global | vídeos (roteiros) | topo com x sem | lift | IG / TT / YT | leitura |
|---|---|---|---|---|---|
| placar do hook >= +1 (+) | 42 (16) | 38% x 19% | 1,46\* | 1,65 / 1,11 / 1,61 | vale |
| placar do hook <= -1 (-) | 40 (18) | 15% x 32% | 0,58 | 0,63 / 0,65 / 0,39 | vale |
| abre com A/O + nome (ou o nome direto) (+) | 16 (6) | 25% x 26% | 0,96 | - / - / - | neutro |
| "acabou de" no hook (+) | 15 (6) | 27% x 26% | 1,02 | - / - / - | neutro |
| hook sem nenhum nome próprio (-) | 43 (18) | 26% x 26% | 0,98 | 1,26 / 0,84 / 0,70 | neutro |
| abre com Esse/Essa (-) | 15 (7) | 27% x 26% | 1,02 | - / - / - | neutro |
| história só estrangeira, sem ponte com o Brasil (-) | 35 (16) | 20% x 29% | 0,77 | 0,71 / 0,78 / 0,86 | vale |
| 450 a 500 palavras faladas (+) | 17 (6) | 41% x 24% | 1,58 | - / - / - | vale |
| "Ou seja" no corpo (+) | 37 (15) | 27% x 26% | 1,04 | 1,01 / 0,98 / 1,16 | neutro |
| conclusão em contraste "Enquanto" ou eco do hook (+) | 23 (10) | 26% x 26% | 1,00 | 1,13 / - / - | neutro |
| roteiro modelado (+) | 38 (14) | 13% x 32% | 0,51\* | 0,54 / 0,28 / 0,78 | inverte |

Sem dado (amostra pequena): conflito nomeado no hook; lugar estrangeiro no hook (China, EUA...); "você" no hook; IA no hook sem sujeito nomeado na abertura; subhook que puxa o espectador ("imagina você"); menos de 300 palavras; 2+ marcadores de origem contada em ordem; conclusão proibida (pode ser/talvez, a lição, a diferença, você precisa); payoff disputa com lado; payoff orgulho com régua de fora; payoff superação; payoff vantagem (dica para o espectador); pede comentário no bloco final (desfecho: seguidores).

## 3. Territórios (8+ roteiros)
- Funcionam: nenhum se destaca.
- Falham: nenhum se destaca.
- Onde mais produz: nenhum território com 8+ roteiros.

## 4. Payoff
- Mais usa: bastidor revelado (22% dos roteiros, 11% de topo); alerta (18% dos roteiros, 19% de topo); curiosidade (10% dos roteiros, 36% de topo).
- Rende (8+ roteiros): nenhum acima da base. Não rende: bastidor revelado 11%; alerta 19%.

## 5. Comando
- Sem dado de seguidores. Já usa credencial com número: "tenho 26 anos de mercado financeiro. Se você quer entender...".

## 6. Rede
- Rende mais no TikTok (coef >= 1,5 em 36%, coef mediano 1,18); menos no YouTube (23%, 1,17); Instagram, 29%.
- Por quê: contas pequenas (views medianas de 641 a 2 mil), sem leitura própria no subagente de plataformas.

## 7. Recomendações
1. **Conte o placar do hook: nome de quem age e o efeito no brasileiro.** Número dele: placar do hook +1 ou mais, 38% de topo contra 19% (42 vídeos, 16 roteiros, significativo; 33% dos hooks dele); -1 ou menos, 15% contra 32%. Topo: "Milhões de brasileiros finalmente conquistaram acesso à sala VIP do aeroporto. Então por que, justo agora, os bancos que criaram esse benefício tão fechando a porta na cara de quem confiou neles?" (IG, coef 21,75); "A Apple acabou de fazer a maior mudança de todos os tempos no iPhone. Mas para o brasileiro a situação ficou complicada." (TT, coef 12,00). Fraco: "O empresário que senta pra jantar com esse cara dobra o valor da sua empresa num único dia. Não precisa de conversa ou acordo nenhum, basta ele aparecer numa foto sentado na mesa." (IG, coef 0,33).
2. **Pare de modelar.** Para ele, o roteiro próprio rende mais que o dobro. Número dele: modelado, 13% de topo contra 32% (38 vídeos, 14 roteiros, significativo; 29% da produção). Topo, não modelados: "Uma substância que só existia em festa clandestina virou aposta de 3,8 bilhões de dólares de uma das maiores farmacêuticas do mundo. Sim, estou falando de drogas psicodélicas." (IG, coef 49,97); "Um dos maiores banqueiros do século 20 lançou as bases do seu império aqui no Brasil, e se naturalizou brasileiro..." (TT, coef 4,59). Fraco, modelado: "Aquela borra de café que você jogou no lixo hoje de manhã já é negócio de centenas de milhões de dólares lá fora..." (YT, coef 0,01).
3. **Pauta de fora com o Brasil dentro; menos bastidor sem personagem.** Número dele: história só estrangeira, 20% de topo contra 29% (35 vídeos, 16 roteiros, 33% da produção); payoff bastidor, 11% em 11 roteiros. Topo: "Antes do Brasil ter a terceira maior fabricante de aviões do mundo, um cearense apostou tudo numa escola, não numa fábrica, e foi essa escola que tornou isso possível..." (IG, coef 8,81); "A Geração Z não vai ter casa própria, mas tá gastando milhares de reais em produto de beleza em vez de guardar dinheiro." (YT, coef 4,41). Fraco: "O maior mercado financeiro do mundo quer o fim dos homens calvos! E tá apostando bilhões de dólares pra isso acontecer." (YT, coef 0,03).

## 8. Preferências do cliente
- Sem preferências cadastradas na base (a tabela de preferências não tem linha para ele).
- Conflito com regra global: sem cadastro para checar.
