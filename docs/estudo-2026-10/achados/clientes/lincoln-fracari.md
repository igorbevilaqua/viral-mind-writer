# Lincoln Fracari

Lição por cliente (estudo 2026-10). Nicho: SOCIEDADE / NEGÓCIOS / GEOPOLÍTICA (Dinheiro, economia e geopolítica). 179 roteiros, 442 vídeos analisáveis. Topo = quartil de cima do coeficiente viral dentro de cliente x rede x trimestre (base 26%). Com uma conta só, os números são direção, não lei.

## Síntese
- **Funciona para ele:** a China tirando algo de alguém (emprego, mercado, liderança), de preferência com o Brasil no meio ("A China está construindo um verdadeiro país paralelo no Nordeste brasileiro e quase ninguém tá percebendo isso.", TT, coef 291). Roteiro de 450 a 500 palavras (38% de topo) e fecho em contraste ("Enquanto a concorrência gastou tempo fazendo piada..., a China gastou bilhões..."). Derrubam: curiosidade chinesa sem ameaça (9% de topo em 23 roteiros), roteiro abaixo de 300 palavras (17%) e hook sem nome próprio (16%).
- **Regra global que vale:** 11 das 20 que deram para medir; com diferença significativa nele: contra hook sem nome e contra roteiro curto. Na mesma direção da casa, sem significância: conflito nomeado (40% de topo, 10 roteiros), 450 a 500 palavras, contraste ou eco na conclusão, disputa, contra "você" e contra conclusão de sermão.
- **Onde foge:** as regras de abertura (abrir pelo nome, Esse/Essa, IA sem dono) e o placar do hook não separam nele porque a China já está em 90% dos hooks: o nome virou rotina, e o que decide é o que a China está fazendo com alguém. Modelagem inverte: 74% dos roteiros dele são modelados e ficam em 23% de topo, contra 32% dos não modelados (sem significância; o estudo de embeddings achou o mesmo sinal, OR 0,64).

## 1. Panorama
| rede | vídeos | % com coef >= 1,5 (não é a taxa oficial) | coef mediano | views medianas |
|---|---|---|---|---|
| Instagram | 135 | 46% | 1,35 | 19.715 |
| TikTok | 137 | 66% | 2,43 | 11.499 |
| YouTube | 170 | 46% | 1,37 | 18.586 |

## 2. Regras globais dentro dele
**vale** = mesma direção da regra global; **inverte** = direção contrária; **neutro** = com e sem a menos de 3 pontos; exige 12+ vídeos e 6+ roteiros com a característica. \* = diferença significativa dentro do cliente (OR por rede, IC95 fora de 1). (+)/(-) = direção da regra na casa.

| regra global | vídeos (roteiros) | topo com x sem | lift | IG / TT / YT | leitura |
|---|---|---|---|---|---|
| placar do hook >= +1 (+) | 295 (120) | 27% x 24% | 1,04 | 1,01 / 1,17 / 0,95 | neutro |
| placar do hook <= -1 (-) | 54 (21) | 20% x 27% | 0,79 | 0,40 / 0,76 / 1,22 | vale |
| abre com A/O + nome (ou o nome direto) (+) | 180 (75) | 24% x 27% | 0,93 | 0,94 / 1,14 / 0,76 | inverte |
| "acabou de" no hook (+) | 56 (22) | 25% x 26% | 0,97 | 0,93 / 1,12 / 0,88 | neutro |
| conflito nomeado no hook (+) | 25 (10) | 40% x 25% | 1,55 | 0,44 / - / 2,32 | vale |
| lugar estrangeiro no hook (China, EUA...) (+) | 396 (161) | 27% x 15% | 1,05 | 1,11 / 1,05 / 1,00 | vale |
| hook sem nenhum nome próprio (-) | 76 (30) | 16% x 28% | 0,61\* | 0,48 / 0,33 / 0,97 | vale |
| abre com Esse/Essa (-) | 48 (18) | 29% x 25% | 1,13 | 1,10 / 0,82 / 1,45 | inverte |
| "você" no hook (-) | 43 (18) | 19% x 27% | 0,72 | 0,31 / 0,95 / 0,86 | vale |
| IA no hook sem sujeito nomeado na abertura (-) | 26 (11) | 35% x 25% | 1,34 | - / 1,69 / 1,40 | inverte |
| história só estrangeira, sem ponte com o Brasil (-) | 235 (93) | 26% x 26% | 1,01 | 1,21 / 0,82 / 1,00 | neutro |
| subhook que puxa o espectador ("imagina você") (-) | 23 (9) | 26% x 26% | 1,01 | - / - / 0,86 | neutro |
| 450 a 500 palavras faladas (+) | 39 (15) | 38% x 25% | 1,49 | 1,44 / 1,76 / 1,29 | vale |
| menos de 300 palavras (-) | 104 (43) | 17% x 28% | 0,67\* | 0,61 / 0,44 / 0,89 | vale |
| 2+ marcadores de origem contada em ordem (-) | 15 (6) | 20% x 26% | 0,78 | - / - / - | vale |
| "Ou seja" no corpo (+) | 56 (22) | 27% x 26% | 1,04 | 0,99 / 1,06 / 1,05 | neutro |
| conclusão proibida (pode ser/talvez, a lição, a diferença, você precisa) (-) | 41 (15) | 20% x 26% | 0,76 | 1,22 / 0,82 / 0,28 | vale |
| conclusão em contraste "Enquanto" ou eco do hook (+) | 111 (44) | 30% x 24% | 1,15 | 1,12 / 1,37 / 0,99 | vale |
| payoff disputa com lado (+) | 37 (15) | 30% x 25% | 1,15 | 0,36 / 1,73 / 1,29 | vale |
| roteiro modelado (+) | 328 (132) | 23% x 32% | 0,91 | 0,93 / 0,86 / 0,93 | inverte |

Sem dado (amostra pequena): payoff orgulho com régua de fora; payoff superação; payoff vantagem (dica para o espectador); pede comentário no bloco final (desfecho: seguidores).

## 3. Territórios (8+ roteiros)
- Funcionam: nenhum se destaca.
- Falham: nenhum se destaca.
- Onde mais produz: China humilhando o mundo com robôs e tecnologia (32% dos roteiros, 30% de topo); Planos da China para dominar o mundo e o Nordeste (22% dos roteiros, 23% de topo).

## 4. Payoff
- Mais usa: o futuro chegou (24% dos roteiros, 22% de topo); bastidor revelado (16% dos roteiros, 31% de topo); alerta (15% dos roteiros, 31% de topo).
- Rende (8+ roteiros): alerta 31%; bastidor revelado 31%. Não rende: curiosidade 9%.

## 5. Comando
- Sem dado de seguidores. CTA atual: "eu te mostro a filosofia chinesa... já segue esse perfil pra receber mais vídeos como esse"; trocar o fecho por "me segue aqui" e prometer a série com "todo dia".

## 6. Rede
- Rende mais no TikTok (coef >= 1,5 em 66%, coef mediano 2,43); menos no YouTube (coef >= 1,5 em 46%, coef mediano 1,37).
- Por quê: a ponte Brasil x estrangeiro (46% dos roteiros dele, casa 21%) é o que o TikTok paga. No Instagram, 58 dos 135 vídeos saíram depois do TikTok ou do YouTube, e Instagram atrasado tem acerto da casa de 21% contra 29% (subagente de plataformas). Instrução: poste o Instagram primeiro ou no mesmo dia; se precisar escalonar, atrase o YouTube.

## 7. Recomendações
1. **Pauta: a China precisa estar tirando algo de alguém; pare com a curiosidade chinesa.** Payoff curiosidade: 9% de topo em 23 roteiros (13% da produção); "Costumes e curiosidades do cotidiano chinês": 21% em 34 roteiros; "China humilhando o mundo com robôs e tecnologia": 30% em 57 roteiros (no estudo de territórios, OR 1,66 para ele). Topo: "A China está acabando com os personal trainers e destruindo um mercado de 7 bilhões de dólares." (IG, coef 106,06); "Essa máscara parece coisa de ficção científica, mas virou febre na China e pode ser o maior pesadelo do Duolingo." (TT, coef 123,01). Fraco: "Quase ninguém tá falando disso, mas na China você pode literalmente alugar uma namorada ou até um pai." (YT, coef 0,32).
2. **Pare de entregar menos de 300 palavras; mire 450 a 500.** O que falta entra como mais um fato de escala, não como repetição. Número dele: abaixo de 300 palavras, 17% de topo contra 28% (104 vídeos, 43 roteiros, 24% da produção, significativo); 450 a 500 palavras, 38% contra 25% (15 roteiros). Topo: "Como esse garoto pobre transformou um copo de chá com QUEIJO em um império de 9 bilhões de dólares?" [493 palavras] (YT, coef 36,94); "Por que o Brasil é hoje o 4º país que mais consome pornografia no mundo, enquanto na China esse tipo de conteúdo dá até cadeia?" [452 palavras] (TT, coef 33,24). Fraco: "Esse refrigerante do regime nazista é um dos mais bebidos no mundo até hoje" [210 palavras] (YT, coef 0,05).
3. **Todo hook com nome próprio; quando houver, o de quem perde para a China.** Número dele: hook sem nenhum nome próprio, 16% de topo contra 28% (76 vídeos, 30 roteiros, significativo); conflito com os dois lados nomeados, 40% contra 25% (10 roteiros, poucos). Topo: "A China está construindo um verdadeiro país paralelo no Nordeste brasileiro e quase ninguém tá percebendo isso." (TT, coef 291,10); "A China criou a maior cidade de sapatos falsos do mundo e quase ninguém sabe disso." (IG, coef 172,19). Fraco: "Existe uma grande chance de você estar sendo vigiado por uma câmera chinesa agora mesmo… e o nome da empresa que faz isso, você provavelmente nunca ouviu falar." (IG, coef 0,43).
4. **Feche em contraste: o que o mundo fez contra o que a China fez.** "Enquanto [o Ocidente fazia o óbvio], a China [fez o contrário]" ou a palavra-chave do hook de volta. Número dele: contraste "Enquanto" ou eco do hook, 30% de topo contra 24% (111 vídeos, 44 roteiros); só 25% das conclusões dele usam. Topo: «Enquanto a concorrência gastou tempo fazendo piada da performance dos robôs, a China gastou bilhões aperfeiçoando a tecnologia que está dominando o mundo.» (hook "Presta atenção nesses robôs.", YT, coef 94,18); «O time chinês não pisou no gramado, mas a China está rodando a Copa. E quem controla a estrutura não precisa de gol nenhum para liderar.» (hook "A China não está na Copa, mas silenciosamente está controlando tudo dentro dela.", TT, coef 143,05). Fraco: «O cara que começou com bambu e fios de pesca, hoje fabrica tecnologias incríveis que muita empresa grande do Ocidente nem sonha em...» (hook "Esse criador de conteúdo da China destruiu um carro com um braço robótico de 5 toneladas que ele mesmo construiu.", YT, coef 0,43).
5. **Pare de modelar quase tudo.** Para ele, o roteiro próprio rende mais que o modelado (sinal sem significância, mesmo sinal do estudo de embeddings); modele só quando a origem traz a China tirando algo de alguém. Número dele: 74% dos roteiros são modelados e ficam em 23% de topo, contra 32% dos não modelados (328 vídeos modelados, 132 roteiros). Topo, não modelados: "Por que a China está investindo R$ 250 milhões em Santa Catarina?" (TT, coef 43,72); "O FBI descobriu que esta mulher, que acabou de se tornar prefeita nos EUA, é, na verdade, uma “agente secreta” da China." (TT, coef 33,26). Fraco, modelado: "A China tem uma filosofia de mais de 2.500 anos que vai contra tudo que o Ocidente acredita sobre sucesso." (TT, coef 0,17).

## 8. Preferências do cliente
- Proibições: nenhuma cadastrada. Temas preferidos: China e gestão.
- Conflito com regra global: nenhum.
