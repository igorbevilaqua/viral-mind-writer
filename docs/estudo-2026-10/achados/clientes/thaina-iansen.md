# Thainá Iansen

Lição por cliente (estudo 2026-10). Nicho: MÚSICA / MARKETING / CARREIRA (Negócios, marcas e cases). 27 roteiros, 62 vídeos analisáveis. Topo = quartil de cima do coeficiente viral dentro de cliente x rede x trimestre (base 26%). Com uma conta só, os números são direção, não lei.

## Síntese
- **Funciona para ela:** mulher famosa ou que virou fortuna, com a virada no hook ("A Zara Larsson tem quase 20 bilhões de reproduções na internet, mas, se ela passasse do seu lado na rua, talvez você nem olharia.", TT, coef 293; "Ela reprovou no concurso para juíza e acabou se tornando a 15ª mulher mais rica do Brasil.", TT, coef 103). "Mulheres que saíram da feira para o império": 35% de topo (67% da produção). Derrubam: hook com placar negativo (12% de topo contra 36%), roteiro modelado (18% contra 54% do próprio) e origem contada em ordem (12%).
- **Regra global que vale:** 5 das 8 que deram para medir; com diferença significativa nela: contra placar negativo. Amostra mínima: 27 roteiros; trate como direção.
- **Onde foge:** história só estrangeira rende mais nela (39% contra 13%, significativo): o público dela quer a estrela internacional. A modelagem inverte com força (significativo; o estudo de embeddings achou OR 0,20 para ela).

## 1. Panorama
| rede | vídeos | % com coef >= 1,5 (não é a taxa oficial) | coef mediano | views medianas |
|---|---|---|---|---|
| Instagram | 27 | 48% | 1,31 | 3.085 |
| TikTok | 24 | 29% | 0,89 | 1.274 |
| YouTube | 11 | 27% | 0,84 | 1.677 |

## 2. Regras globais dentro dela
**vale** = mesma direção da regra global; **inverte** = direção contrária; **neutro** = com e sem a menos de 3 pontos; exige 12+ vídeos e 6+ roteiros com a característica. \* = diferença significativa dentro do cliente (OR por rede, IC95 fora de 1). (+)/(-) = direção da regra na casa.

| regra global | vídeos (roteiros) | topo com x sem | lift | IG / TT / YT | leitura |
|---|---|---|---|---|---|
| placar do hook <= -1 (-) | 26 (12) | 12% x 36% | 0,45\* | 0,32 / 0,80 / - | vale |
| hook sem nenhum nome próprio (-) | 26 (11) | 19% x 31% | 0,75 | 0,77 / 0,73 / - | vale |
| abre com Esse/Essa (-) | 13 (6) | 8% x 31% | 0,30 | - / - / - | vale |
| história só estrangeira, sem ponte com o Brasil (-) | 31 (14) | 39% x 13% | 1,50\* | 1,65 / 1,33 / - | inverte |
| 450 a 500 palavras faladas (+) | 16 (7) | 25% x 26% | 0,97 | - / - / - | neutro |
| 2+ marcadores de origem contada em ordem (-) | 17 (8) | 12% x 31% | 0,46 | 0,48 / - / - | vale |
| payoff superação (-) | 27 (12) | 22% x 29% | 0,86 | 0,70 / 1,20 / - | vale |
| roteiro modelado (+) | 49 (22) | 18% x 54% | 0,71\* | - / - / - | inverte |

Sem dado (amostra pequena): placar do hook >= +1; abre com A/O + nome (ou o nome direto); "acabou de" no hook; conflito nomeado no hook; lugar estrangeiro no hook (China, EUA...); "você" no hook; IA no hook sem sujeito nomeado na abertura; subhook que puxa o espectador ("imagina você"); menos de 300 palavras; "Ou seja" no corpo; conclusão proibida (pode ser/talvez, a lição, a diferença, você precisa); conclusão em contraste "Enquanto" ou eco do hook; payoff disputa com lado; payoff orgulho com régua de fora; payoff vantagem (dica para o espectador); pede comentário no bloco final (desfecho: seguidores).

## 3. Territórios (8+ roteiros)
- Funcionam: Mulheres que saíram da feira para o império (35% de topo, 18 roteiros; casa 26%).
- Falham: nenhum se destaca.
- Onde mais produz: Mulheres que saíram da feira para o império (67% dos roteiros, 35% de topo).

## 4. Payoff
- Mais usa: superação (44% dos roteiros, 22% de topo); sacada genial (19% dos roteiros, 10% de topo); orgulho (7% dos roteiros, 50% de topo).
- Rende (8+ roteiros): nenhum acima da base. Não rende: nenhum abaixo da base.

## 5. Comando
- Sem dado de seguidores. Já no padrão nome + promessa do território; testar "todo dia" e "me segue aqui".

## 6. Rede
- Rende mais no Instagram (coef >= 1,5 em 48%, coef mediano 1,31); menos no YouTube (27%, 0,84); TikTok, 29%.
- Por quê: sem leitura própria no subagente de plataformas; o maior coef dela, porém, é do TikTok (Zara Larsson, 293).

## 7. Recomendações
1. **Pare de entregar hook com placar negativo.** A protagonista pelo nome ou pelo feito, nunca "o motivo vai te dar uma aula". Número dela: placar do hook -1 ou menos, 12% de topo contra 36% (26 vídeos, 12 roteiros, significativo; 44% dos hooks). Topo: "A Zara Larsson tem quase 20 bilhões de reproduções na internet, mas, se ela passasse do seu lado na rua, talvez você nem olharia." (TT, coef 293,39); "Ela recusou o homem mais famoso do mundo e faturou 10 milhões de dólares." (IG, coef 31,80). Fraco: "O CEO do Duolingo pagava motoristas de táxi pra avaliar quem ele ia contratar e o motivo vai te dar uma aula de mentalidade bilionária." (TT, coef 0,11).
2. **Pare de modelar tudo.** 81% dos roteiros dela são modelados; os poucos próprios rendem três vezes mais. Número dela: modelado, 18% de topo contra 54% (49 vídeos, 22 roteiros; só 5 roteiros não modelados, significativo). Topo, não modelados: "Ela reprovou no concurso para juíza e acabou se tornando a 15ª mulher mais rica do Brasil." (TT, coef 103,44); "Foi assim que a Rihanna humilhou o mercado de cosméticos mundial: enxergando cores que ninguém mais via..." (IG, coef 7,22). Fraco, modelado: "A Beyoncé te enganou e o segredo do império dela não é só talento." (YT, coef 0,09).
3. **Pare de contar a origem em ordem.** Nada de "Tudo começou nos anos 50", "nasceu em", "cresceu em": comece pelo feito e vire com "Até que". Número dela: 2+ marcadores de origem, 12% de topo contra 31% (17 vídeos, 8 roteiros); superação, 22% contra 29% (12 roteiros). Topo: "Pouca gente sabe, mas a Anitta era técnica em administração no Rio, hoje é dona de um grupo empresarial que administra outros artistas..." (YT, coef 6,19); "Zoada, vaiada, investigada e, ainda assim, uma das mulheres mais influentes do Brasil." (IG, coef 3,15). Fraco: "O comitê de homens da Mattel rejeitou a Barbie dizendo que nenhuma mãe ia comprar uma boneca com seios." / corpo: «Tudo começou nos anos 50, quando a grande maioria das bonecas nas lojas americanas era bebê...» (IG, coef 0,12).

## 8. Preferências do cliente
- Sem preferências cadastradas na base (a tabela de preferências não tem linha para ela).
- Conflito com regra global: sem cadastro para checar.
