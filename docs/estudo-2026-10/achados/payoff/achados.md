# Payoff: o que o vídeo entrega e o que isso faz com o alcance

Estudo 2026-10, subagente payoff. Base: 2.809 roteiros VM rotulados por Claude Sonnet 5.5 (`data/rotulos_llm.json`), dos quais 2.713 têm vídeo analisável (6.581 vídeos; 6.305 em Instagram, TikTok e YouTube). Desfecho principal: vídeo no quartil superior do coeficiente viral no estrato cliente x rede x trimestre (base 26%). Toda leitura "replica" vem da régua comum (`src/lib.mjs`): IC do lift fora de 1, OR de Mantel-Haenszel por cliente x rede fora de 1 e mesmo sinal na descoberta (antes de 01/07/2026) e na validação.

## 1. Resumo em 10 linhas

1. **Briga com lado é o payoff que mais viraliza.** Roteiro que põe dois lados com nome em guerra (marca x marca, país x país) e toma partido vai ao topo 1,6 vez mais (OR 2,09; replica; vale nas 3 redes, nos 3 nichos, com ou sem China). É só 3% da produção.
2. **Orgulho só funciona com régua de fora.** "O Nordeste humilhou a Europa", "paraenses vencem dentro da China": orgulho com comparação estrangeira ou com gigante tem OR 2,05 a 2,45; orgulho "só Brasil" não sai da média. Vale no Instagram e no TikTok, não no YouTube.
3. **Davi precisa de Golias com nome.** Herói (estudante, inventor, empresa pequena) contra gigante nomeado: OR 1,89; o mesmo herói sem antagonista empata com a média. Abra comparando: "A NASA gasta milhões, mas esse estudante...".
4. **Superação pura atrapalha.** "Cresceu pobre e hoje fatura bilhões", "quase faliu e voltou": OR 0,68, replica nas 3 redes; a fórmula mais usada (porquê + lição de moral) é a pior (OR 0,57). É 9% da produção e 15% em Negócios.
5. **Dica para o espectador derruba alcance e multiplica salvamento.** Vantagem prática (direito, ferramenta, "como você pode"): alcance OR 0,62, salvamento no TikTok OR 5,84. Hook que promete ensinar cai mais ainda (OR 0,57).
6. **Cada payoff move uma métrica.** Revolta e nostalgia geram comentário (OR 2,70 e 2,27) sem gerar alcance; orgulho, futuro e exemplo inspirador geram compartilhamento (OR 1,58 a 1,71); queda do gigante derruba compartilhamento e salvamento (OR 0,42 e 0,14).
7. **Payoff de nicho existe.** Queda do gigante funciona em Dinheiro (OR 1,85, replica) e não em Tecnologia; alerta funciona em Dinheiro (OR 1,40) e não em Tecnologia; revolta funciona em Negócios (OR 1,77, replica) e fica abaixo da média em Dinheiro, onde é mais usada.
8. **Abertura e fechamento certos por payoff.** Futuro: abra com a novidade e feche projetando (OR 1,54, replica), nunca abra com "por quê" (0,69). Alerta: abra pelo porquê e feche na consequência. Disputa: abra com a notícia da briga e feche com frase-síntese ou pergunta de lado.
9. **Subhook que puxa para o espectador derruba.** "Imagina você...", "aquela loja que você..." no segundo parágrafo: OR 0,50, replica em 26 clientes; o subhook que soma um dado e eleva a aposta ajuda (OR 1,24).
10. **Fechamento tem função.** Frase-síntese segura até o fim no Instagram (retenção final OR 2,07); consequência para o espectador gera compartilhamento (OR 1,42); pergunta gera comentário (OR 1,63); lição de moral derruba comentário (OR 0,68). História só estrangeira, sem ponte com o Brasil, fica abaixo (OR 0,74).

## 2. A taxonomia de payoff (base do playbook novo)

Payoff é a recompensa que o espectador leva quando o vídeo termina. Cada categoria é definida pelo que dá para apontar no texto, não pelo tema. Foi montada lendo 60 roteiros (30 de topo e 30 de baixo, 2 por cliente no máximo, todos os macro nichos) e mais 20 dirigidos a clientes pouco vistos; refinada num piloto de 40 roteiros com 15 rótulos conferidos à mão contra o texto.

| código | payoff | definição observável | sinais no texto | exemplo real |
|---|---|---|---|---|
| `revolta` | Revolta com injustiça | Alguém com poder (governo, grande empresa, rico, instituição) prejudica gente comum, o espectador ou quem merecia reconhecimento, e o texto termina sem reparação: a injustiça continua. | "e quem paga é você", "ninguém foi punido", "o Brasil nem percebeu" | "Os Correios quebraram com um rombo de 8,5 bilhões e agora é você quem paga a conta." |
| `orgulho` | Orgulho nacional ou de grupo | O Brasil ou um grupo com que o público se identifica (estado, região, torcida, profissão, mulheres empresárias) aparece vencendo, sendo o maior ou sendo reconhecido lá fora, e o fechamento celebra essa identidade. | "o mundo está de olho no Brasil", "a engenharia brasileira", "o Nordeste deu ao mundo" | "Dubai, Estados Unidos e o resto do mundo estão de olho no Brasil. E o motivo é a nossa engenharia." |
| `bastidor` | Bastidor revelado | O texto expõe o mecanismo escondido por trás de algo que o espectador vê ou usa (um preço, um produto que sumiu, uma brecha na lei, como uma empresa ganha dinheiro, um plano geopolítico), e o clímax é: é assim que funciona por dentro. | "o motivo que quase ninguém conhece", "por trás de", "o que ninguém te contou" | lojas que fecham a venda no tablet para faturar em outro estado e pagar menos ICMS, dentro da lei. |
| `virada` | Virada contraintuitiva | O texto defende uma tese que contradiz o óbvio (o que parecia derrota virou vitória, o castigo enriqueceu, o consenso estava errado) e prova com fatos; a surpresa é a inversão. | "mas foi justamente isso que", "ao contrário do que parece", um paradoxo dito com todas as letras | o governo dividiu a Standard Oil em 34 pedaços e Rockefeller saiu quase três vezes mais rico. |
| `vantagem` | Vantagem para o espectador | O espectador sai com algo que pode usar na própria vida: um direito, um jeito de economizar ou ganhar dinheiro, uma ferramenta, uma técnica, um passo a passo. | "você pode", "seu direito", "faça isso antes de" | "Se você morrer hoje, quem paga suas dívidas?", e o texto explica que herdeiro não herda dívida. |
| `alerta` | Alerta ou ameaça pessoal | O texto aponta um risco concreto que pode atingir o espectador (bolso, emprego, saúde, segurança, dados, o país dele) e o tom é de ameaça ou urgência. | "é urgente", "isso vai afetar você", "cuidado" | "Um dos maiores investidores do mundo acabou de anunciar uma venda que está deixando o mercado em pânico." |
| `superacao` | Superação ou volta por cima | O protagonista parte de uma desvantagem concreta (pobreza, falência, rejeição, tragédia, crise) e chega a um resultado grande; o texto marca o ponto de partida e o de chegada. | "cresceu sem luz elétrica... hoje fatura", "quase faliu e voltou mais forte" | "Essa mulher cresceu sem luz elétrica em casa, mas construiu um império que fatura mais de dois bilhões." |
| `inspiracao` | Exemplo inspirador | Gente comum (estudante, comunidade, pequeno empreendedor, profissional) resolve um problema real com poucos recursos ou faz o bem aos outros; o fechamento celebra a atitude, sem arco de enriquecimento. | "ele decidiu não aceitar", "com o que tinha em mãos", "para quem mais precisa" | estudante gaúcho cria uma IA para ajudar colegas com dificuldade de aprendizagem. |
| `queda` | Queda do gigante ou erro caro | Uma empresa, marca, clube ou pessoa poderosa erra, perde muito dinheiro, decai ou some; o clímax é o tamanho da perda e o erro que a causou. | "o erro que custou", "perdeu bilhões", "quebrou" | a Oxxo abriu uma loja a cada 42 horas no Brasil e perdeu 165 milhões de reais num ano. |
| `futuro` | O futuro chegou | Uma tecnologia, produto ou mudança nova, que acabou de surgir ou está chegando, parece ficção, e o texto mostra como ela vai mudar a vida (para o bem ou para o mal). | "acabou de criar", "chegou ao Brasil", "parece Black Mirror" | colar com IA que traduz para o português o que o seu pet está dizendo. |
| `sacada` | Sacada genial | Uma ideia, decisão ou estratégia específica e engenhosa de alguém (muitas vezes simples) e o clímax é por que ela funcionou. | "a jogada", "genial", "ninguém pensou nisso antes" | a marca de carvão cuja embalagem vai direto para a churrasqueira e viralizou lá fora. |
| `disputa` | Disputa com lado | Dois lados nomeados em confronto (países, empresas, clubes, gerações, posições políticas) e o texto toma partido ou pede que o espectador tome. | "guerra", "contra", "e você, de que lado está?" | "A indústria brasileira declarou guerra à China. E o motivo? O botijão de gás da sua cozinha." |
| `nostalgia` | Nostalgia | O texto evoca algo do passado do espectador (marca, produto, programa, lugar da infância ou da avó) e o valor está na memória e no que aconteceu com aquilo. | "da sua infância", "que a sua avó guardava", "o que aconteceu com" | "O que aconteceu com a Yopa? O sorvete que fazia parte do verão da sua infância simplesmente sumiu." |
| `curiosidade` | Curiosidade pura | Um fato, recorde, objeto ou história surpreendente que vale por si, sem ameaça, sem injustiça, sem lado e sem lição forte. | "isso aconteceu de verdade", um recorde, um objeto ou evento improvável | a mosca que pousou na bola e pôs 2,9 milhões de dólares no bolso de um golfista. |

**Desempates** (quando o texto tem dois payoffs, o principal é o que o fechamento entrega):
- bastidor x sacada: se o clímax elogia a inteligência de alguém, sacada; se explica como um sistema funciona, bastidor.
- revolta x queda: se há vítima comum sem reparação, revolta; se o foco é o erro do poderoso, queda.
- superação x inspiração: se há antes e depois de dinheiro ou status, superação.
- orgulho x inspiração/superação: se o texto destaca a identidade (brasileiro, nordestino, o Brasil contra o mundo), orgulho.
- futuro x curiosidade: se é tecnologia nova que muda a vida, futuro.
- virada x sacada: se a inversão é sobre como o mundo funciona, virada; se é a decisão esperta de alguém, sacada.

**Listas fechadas de estrutura** (também em `data/rotulos_llm.json`, para os outros estudos):
- `promessa_hook` (o que o hook promete): `porque_como` (já entrega o fato e a pergunta que fica é como ou por quê), `quem_qual` (a pergunta é "quem é?" ou "qual é?"), `desfecho` (conta o começo e para antes do final), `alerta` (ameaça ao espectador), `numero` (um número ou recorde é o centro), `comparacao` (confronta dois lados), `ensinar` (promete algo que o espectador vai poder fazer), `novidade` (algo que acabou de acontecer ou chegar), `tese` (opinião forte que o vídeo sustenta).
- `funcao_subhook` (o que o segundo parágrafo faz): `eleva_aposta`, `contradiz`, `contexto_personagem`, `volta_tempo`, `explica`, `puxa_espectador`, `promete`, `pergunta`, `nenhum`.
- `tipo_conclusao`: `licao` (princípio geral), `virada_final` ("não era X, era Y"), `futuro` (projeção), `pergunta`, `sintese` (resume o caso ou celebra o protagonista, sem princípio geral), `consequencia` (o que aquilo significa para o espectador ou o país dele), `retomada` (volta à imagem do hook), `instrucao` (manda fazer algo prático), `sem_fechamento`.
- `protagonista`: famoso, anônimo, empresa, país, tecnologia, espectador, grupo. `antagonista`: nenhum, governo, gigante, sistema, rival, problema. `recorte`: Brasil, estrangeiro, Brasil x estrangeiro. `utilidade_pratica`: sim ou não (lição genérica não conta). `sinal`: até 12 palavras do texto que mostram o payoff.

Distribuição na casa (roteiros): bastidor 13%, futuro 13%, alerta 12%, sacada 10%, superação 9%, vantagem 6%, inspiração 6%, queda 6%, virada 6%, orgulho 5%, curiosidade 4%, revolta 3%, disputa 3%, nostalgia 2%. Por nicho, o payoff dominante é sacada em Negócios (19%) e superação (15%), bastidor em Dinheiro (27%) e alerta (23%), futuro em Tecnologia (27%) e inspiração (17%).

## 3. Ranking dos payoffs por rede e por macro nicho

Lift do topo do coeficiente viral (n de vídeos entre parênteses). ▲/▼: OR de Mantel-Haenszel (controla cliente x rede) com IC95 acima/abaixo de 1 naquele recorte.

| payoff | roteiros (% da casa) | geral: lift [IC95] · OR MH · desc/val | Instagram | TikTok | YouTube | Negócios | Dinheiro | Tecnologia |
|---|---|---|---|---|---|---|---|---|
| **Disputa com lado** | 90 (3%) | 1,59 [1,34 a 1,86] · 2,09 [1,56 a 2,79] · 1,44/1,69 · ajuda (replica) | 1,36 (86) | 1,70 ▲ (59) | 1,81 ▲ (60) | 2,11 ▲ (48) | 1,41 ▲ (66) | 1,52 ▲ (87) |
| **Orgulho nacional ou de grupo** | 144 (5%) | 1,32 [1,14 a 1,51] · 1,64 [1,28 a 2,09] · 1,34/1,31 · ajuda (replica) | 1,51 ▲ (144) | 1,45 ▲ (120) | 0,93 (113) | 1,23 (130) | 1,25 (31) | 1,38 ▲ (216) |
| **Queda do gigante ou erro caro** | 171 (6%) | 1,09 [0,94 a 1,27] · 1,16 [0,92 a 1,47] · 1,03/1,16 · sem evidência | 1,03 (170) | 0,97 (108) | 1,26 ▲ (144) | 1,11 (314) | 1,47 ▲ (58) | 0,54 (50) |
| **Virada contraintuitiva** | 165 (6%) | 1,06 [0,89 a 1,24] · 1,09 [0,86 a 1,38] · 1,08/1,04 · sem evidência | 1,01 (165) | 1,07 (105) | 1,12 (111) | 1,01 (226) | 0,98 (75) | 1,29 (75) |
| **O futuro chegou** | 341 (13%) | 1,06 [0,94 a 1,18] · 1,11 [0,91 a 1,36] · 1,09/1,03 · sem evidência | 1,07 (331) | 1,07 (217) | 1,02 (216) | 1,26 (99) | 0,85 (123) | 1,06 (513) |
| **Alerta ou ameaça pessoal** | 326 (12%) | 1,04 [0,91 a 1,17] · 1,06 [0,88 a 1,28] · 1,08/0,99 · sem evidência | 1,03 (315) | 1,10 (207) | 0,98 (186) | 0,96 (214) | 1,19 ▲ (303) | 0,90 (177) |
| **Exemplo inspirador** | 174 (6%) | 1,03 [0,89 a 1,19] · 1,08 [0,84 a 1,38] · 1,18/0,92 · sem evidência | 1,11 (175) | 0,99 (160) | 0,99 (149) | 0,85 (64) | - | 1,06 (407) |
| **Sacada genial** | 273 (10%) | 0,94 [0,82 a 1,07] · 0,91 [0,74 a 1,11] · 0,98/0,89 · sem evidência | 0,95 (270) | 0,85 (191) | 1,01 (191) | 0,98 (525) | 0,81 (38) | 0,79 (88) |
| **Revolta com injustiça** | 94 (3%) | 0,94 [0,73 a 1,18] · 0,91 [0,65 a 1,27] · 0,78/1,05 · sem evidência | 1,02 (92) | 0,94 (70) | 0,76 (41) | 1,44 ▲ (70) | 0,71 (104) | 0,53 (29) |
| **Bastidor revelado** | 361 (13%) | 0,93 [0,82 a 1,05] · 0,89 [0,74 a 1,07] · 0,90/0,96 · sem evidência | 0,88 (354) | 0,87 (231) | 1,08 (223) | 0,90 (348) | 0,96 (350) | 0,88 (101) |
| **Curiosidade pura** | 110 (4%) | 0,90 [0,71 a 1,12] · 0,86 [0,64 a 1,17] · 0,86/0,92 · sem evidência | 0,93 (100) | 0,98 (75) | 0,76 (71) | 1,05 (85) | 0,69 (79) | 0,89 (78) |
| **Superação ou volta por cima** | 240 (9%) | 0,79 [0,67 a 0,94] · 0,68 [0,54 a 0,86] · 0,85/0,70 · atrapalha (replica) | 0,80 ▼ (234) | 0,81 (168) | 0,77 (135) | 0,84 ▼ (373) | 1,37 (31) | 0,54 ▼ (129) |
| **Nostalgia** | 51 (2%) | 0,73 [0,50 a 1,04] · 0,65 [0,41 a 1,05] · 0,94/0,66 · sem evidência | 0,99 (51) | 0,74 (26) | 0,39 ▼ (40) | 0,73 (90) | - | 0,67 (23) |
| **Vantagem para o espectador** | 173 (6%) | 0,72 [0,58 a 0,87] · 0,62 [0,47 a 0,81] · 0,74/0,66 · atrapalha (replica) | 0,68 ▼ (171) | 0,74 (120) | 0,74 (110) | 0,75 (151) | 0,66 ▼ (94) | 0,71 ▼ (152) |

Entretenimento (Patrick Diorio, 78 vídeos só no Instagram) não tem volume por payoff; Facebook (276 vídeos) também não.

**Payoff x engajamento** (lift do quartil superior da métrica por mil views no estrato cliente x rede; ▲/▼ = replica pela régua; (+)/(-) = OR significativo sem replicação completa):

| payoff | compartilhamento (IG+TT) | comentários (IG+TT+YT) | salvamentos (TT) | seguidores por mil (IG) |
|---|---|---|---|---|
| Disputa com lado | 0,86 · OR 0,82 (n=95) | 1,10 · OR 1,14 (n=205) | 0,59 · OR 0,51 (n=53) | 1,16 · OR 1,26 (n=34) |
| Orgulho nacional ou de grupo | 1,32 · OR 1,71 ▲ (n=213) | 1,51 · OR 2,12 ▲ (n=377) | 1,25 · OR 1,55 (n=119) | 1,43 · OR 1,74 (n=36) |
| Queda do gigante ou erro caro | 0,55 · OR 0,42 ▼ (n=155) | 0,76 · OR 0,67 ▼ (n=422) | 0,22 · OR 0,14 ▼ (n=91) | 0,75 · OR 0,63 (n=111) |
| Virada contraintuitiva | 0,99 · OR 0,97 (n=146) | 0,75 · OR 0,68 ▼ (n=381) | 0,63 · OR 0,53 ▼ (n=94) | 1,12 · OR 1,17 (n=85) |
| O futuro chegou | 1,25 · OR 1,70 ▲ (n=388) | 0,89 · OR 0,78 (-) (n=764) | 0,93 · OR 0,87 (n=215) | 1,28 · OR 1,77 (+) (n=130) |
| Alerta ou ameaça pessoal | 0,96 · OR 0,93 (n=310) | 1,19 · OR 1,35 ▲ (n=708) | 0,66 · OR 0,53 ▼ (n=190) | 0,95 · OR 0,92 (n=162) |
| Exemplo inspirador | 1,22 · OR 1,58 ▲ (n=262) | 1,30 · OR 1,76 ▲ (n=484) | 1,26 · OR 1,70 (+) (n=159) | 1,27 · OR 1,55 (n=62) |
| Sacada genial | 0,88 · OR 0,79 (n=222) | 0,66 · OR 0,51 ▼ (n=652) | 0,91 · OR 0,82 (n=164) | 0,82 · OR 0,73 (n=140) |
| Revolta com injustiça | 1,10 · OR 1,16 (n=92) | 1,80 · OR 2,70 ▲ (n=203) | 1,15 · OR 1,24 (n=65) | 1,09 · OR 1,11 (n=40) |
| Bastidor revelado | 0,84 · OR 0,75 (n=296) | 0,98 · OR 0,97 (n=808) | 1,02 · OR 1,03 (n=207) | 1,00 · OR 0,99 (n=185) |
| Curiosidade pura | 0,97 · OR 0,97 (n=101) | 0,98 · OR 0,98 (n=246) | 1,05 · OR 1,10 (n=71) | 0,90 · OR 0,87 (n=35) |
| Superação ou volta por cima | 0,80 · OR 0,67 (-) (n=229) | 0,65 · OR 0,51 ▼ (n=537) | 0,87 · OR 0,77 (n=154) | 1,01 · OR 1,02 (n=113) |
| Nostalgia | 0,33 · OR 0,25 ▼ (n=47) | 1,63 · OR 2,27 ▲ (n=117) | 0,65 · OR 0,57 (n=24) | 0,42 · OR 0,34 (n=19) |
| Vantagem para o espectador | 1,12 · OR 1,19 (n=178) | 0,95 · OR 0,92 (n=401) | 2,44 · OR 5,84 ▲ (n=114) | 0,89 · OR 0,85 (n=116) |

## 4. Achados

### A1. Disputa com lado é o payoff que mais viraliza, e a casa quase não usa
- **O que:** dois lados com nome em confronto (Geely x BYD, China x Corolla, Zuckerberg x Apple, Nike x Adidas) e o texto toma partido ou pede que o espectador escolha.
- **Número:** 41% no topo contra 25%; lift 1,59 [1,34 a 1,86]; OR MH 2,09 [1,56 a 2,79]; descoberta 1,44 / validação 1,69; 205 vídeos, 90 roteiros, 18 clientes. Tirando qualquer um dos 4 clientes que mais usam, o OR fica entre 1,82 e 2,32. Sem China no hook ou no título: lift 1,62, OR 2,09 (replica), então não é o efeito China disfarçado. No KPI da casa (coef >= 1,5): OR 1,47 (replica). O antagonista `rival` sozinho, em qualquer payoff, também ajuda: lift 1,23, OR 1,43 (replica, 936 vídeos).
- **Onde vale:** global. Instagram 1,36, TikTok 1,70 (OR 2,37), YouTube 1,81 (OR 2,71); Negócios 2,11 (OR 3,55, replica), Tecnologia 1,52 (OR 1,93), Dinheiro 1,41 (OR 1,71). É payoff de alcance: não mexe em compartilhamento, comentário nem salvamento.
- **Exemplos:** Renato Mendes, TikTok, coef 482,9: "A China declarou guerra ao carro mais amado do Brasil. E em agosto o Corolla perdeu o trono pela primeira vez na história." Fecha: "se você fosse comprar um carro hoje, iria de chinês ou de japonês?". Izabela Anholett, YouTube, coef 195,9: "O governo chinês declarou guerra ao dono do Instagram por causa de uma IA de 2 bilhões de dólares e proibiu seus fundadores de deixar o país." Fecha com síntese: "Inteligência artificial é hoje a corrida do ouro e as maiores potências do mundo estão fazendo de tudo para ficar na frente." Fraco: Leonardo Cirino, Instagram, coef 0,20: "A Apple decidiu declarar guerra contra a Amazon. E para isso, ela vai ressuscitar um dispositivo que caiu no esquecimento" (a briga não tem placar nem lado; vira notícia de produto).
- **Instrução:** "Quando a pauta tiver dois atores grandes, escreva como briga: os dois com nome no hook, um placar concreto ('perdeu o trono', 'ameaçado') e um lado no fechamento. Faça: 'A Geely deixou a BYD com medo.' Evite: 'A Geely anunciou nova fábrica no Brasil.'"

### A2. Orgulho funciona quando há uma régua de fora
- **O que:** o Brasil, uma região ou um grupo vence, é o maior ou é reconhecido lá fora.
- **Número:** lift 1,32 [1,14 a 1,51]; OR 1,64 [1,28 a 2,09]; 1,34/1,31; 377 vídeos, 144 roteiros, 23 clientes (OR entre 1,54 e 1,69 tirando qualquer um dos maiores). O efeito mora na comparação: orgulho com recorte Brasil x estrangeiro tem lift 1,55, OR 2,05 [1,47 a 2,85] (replica, 165 vídeos); orgulho com gigante ou rival como antagonista, lift 1,75, OR 2,45 [1,57 a 3,83] (replica, 82 vídeos); orgulho só Brasil, lift 1,12, OR 1,17 (sem evidência, 205 vídeos). Também gera compartilhamento (OR 1,71) e comentário (OR 2,12), os dois replicando.
- **Onde vale:** Instagram e TikTok juntos, lift 1,49, OR 2,09 (replica). YouTube, 0,93 (OR 0,84): não funciona lá. Tecnologia, OR 1,80 (replica); Negócios e Dinheiro positivos sem significância.
- **Exemplos:** Rafael Rodrigues, TikTok, coef 168,2: "Nem a China esperava por essa. A maior potência de tecnologia do mundo acabou superada dentro de Pequim por esses estudantes paraenses." Cadu Neiva, YouTube, coef 18,6: "A Europa gastou mais de 10 bilhões de euros tentando resolver um problema que o Nordeste do Brasil já resolveu, e quase ninguém ficou sabendo." Fecha: "Enquanto a Europa queimava bilhões, um professor em Fortaleza resolveu com o lixo da castanha." Fraco: Cadu Neiva, TikTok, coef 0,03: "A farmácia mais lembrada do Rio Grande do Norte faturou R$ 870 milhões e se tornou uma das maiores redes do país." (orgulho sem régua).
- **Instrução:** "Orgulho sempre com régua: ponha no hook quem o Brasil superou (um país, uma multinacional, uma universidade famosa). Reescrita: 'A farmácia potiguar que [a rede nacional que tentou entrar] não conseguiu tirar do Rio Grande do Norte faturou R$ 870 milhões (com o rival real, checado na fonte).' No YouTube, não aposte em orgulho."

### A3. Davi precisa de Golias com nome
- **O que:** história de herói (orgulho, inspiração ou superação) em que o texto nomeia o gigante que ficou para trás.
- **Número:** herói com gigante nomeado: 39% no topo, lift 1,52 [1,20 a 1,85], OR 1,89 [1,31 a 2,72], 1,86/1,09 (replica), 128 vídeos, 16 clientes (OR de 1,61 a 1,94 tirando um cliente por vez). Herói sem antagonista: 1,06, OR 1,08 (sem evidência). Exemplo inspirador com gigante ou rival: OR 2,22 (replica); sem antagonista: 0,81. Inspiração aberta por comparação: 1,46 (replica); o trio inspiração + hook de comparação + lição: lift 1,80 [1,26 a 2,37], OR 2,64, 1,72/1,94 (replica, 43 vídeos).
- **Onde vale:** global (IG 1,71, TT 1,51, YT 1,26). É o formato de Rafael Rodrigues e Marcio Grazino quando dá certo.
- **Exemplos:** Rafael Rodrigues, Instagram, coef 438,4: "Enquanto as gigantes gastam bilhões para criar tecnologia, esse jovem de 20 anos criou uma concorrente da Apple usando restos de lixo." Marcio Grazino, Instagram, coef 124,3: "Três estudantes de escola pública no interior da Bahia fizeram o que a indústria do chocolate não fez em 50 anos." Fraco: Rafael Rodrigues, Instagram, coef 0,11: "A Copa do Mundo vai muito além do futebol. E essa iniciativa do Ceará mostrou que o maior evento do mundo também é palco para inovação."
- **Instrução:** "Todo roteiro de estudante ou inventor abre com o gigante e o tamanho do gasto dele: 'A NASA gasta milhões contra o calor, mas esse estudante de São Paulo resolveu com lixo.' Sem gigante nomeado, não é Davi e Golias, é notícia de feira de ciências."

### A4. Superação pura atrapalha
- **O que:** de pobre a bilionário, quase faliu e voltou, o arco "de onde saiu e onde chegou".
- **Número:** 20% no topo contra 26%; lift 0,79 [0,67 a 0,94]; OR 0,68 [0,54 a 0,86]; 0,85/0,70 (replica); 537 vídeos, 240 roteiros, 22 clientes (OR de 0,69 a 0,73 tirando um cliente por vez). A fórmula mais comum, superação + hook de porquê + lição de moral, tem lift 0,68, OR 0,57 (replica, 290 vídeos). Com virada (payoff2 virada ou fecho "não era X, era Y"): 0,96, só neutraliza. Com gigante ou rival: 0,91, só neutraliza. Também derruba comentário (OR 0,51).
- **Onde vale:** as 3 redes (0,80 / 0,81 / 0,77); Tecnologia 0,54 (OR 0,44, replica), Negócios 0,84 (OR 0,73). Marcio Grazino 0,48 e Rafael Rodrigues 0,56 (IC abaixo de 1).
- **Exemplos (quando escapa):** João Paulo Albuquerque, TikTok, coef 441,8: "Ela levou 10 anos para construir essa empresa. E um único dia para descobrir que podia ser destruída por causa da Nestlé." (história aberta, com gigante, fecha em síntese). Marcos Pelozato, YouTube, coef 145,9: "Essa empresa dominava o mercado de telhas no Brasil. Até que a Justiça proibiu o único produto que mantinha tudo de pé." Fraco: Rodrigo Waughan, YouTube, coef 0,01: "Esse homem pagou plano de saúde para quem limpava chão e ficou bilionário por causa disso." Fecha: "A lição é clara: quem blinda a sua base, constrói um império inquebrável."
- **Instrução:** "Não venda a superação como payoff. Se a história é de ascensão, transforme em briga (quem tentou destruí-lo, com nome) ou em história aberta ('até que...'), e feche contando o desfecho, não a moral. Evite: 'cresceu sem nada e hoje fatura bilhões. A lição é...'"

### A5. Vantagem para o espectador: o alcance cai, o salvamento explode
- **O que:** o espectador sai com direito, ferramenta, técnica ou passo a passo.
- **Número:** alcance: lift 0,72 [0,58 a 0,87], OR 0,62 [0,47 a 0,81], 0,74/0,66 (replica), 401 vídeos, 173 roteiros. Salvamento no TikTok: 46% no topo, lift 2,44 [2,08 a 2,77], OR 5,84 [3,91 a 8,73], 2,65/1,96 (replica). Utilidade prática (qualquer payoff): salvamento OR 3,47 (replica), alcance 0,92 (sem evidência). Hook que promete ensinar: alcance 0,66, OR 0,57 (replica); passagem dos 3s no Instagram, 0,33, OR 0,26 (replica). Dentro da vantagem: abrir com novidade 1,26 (sem significância, n=37) contra ensinar 0,60 (replica); fechar com instrução 0,96 contra consequência 0,27 (replica).
- **Onde vale:** as 3 redes e os 3 nichos no alcance (Dinheiro OR 0,53, Tecnologia OR 0,61); salvamento medido só no TikTok. Izabela Anholett, 0,67 no alcance (IC abaixo de 1).
- **Exemplos:** Dilson Peres, YouTube, coef 237,8: "O Silvio Santos fez uma jogada genial que evitou qualquer dor de cabeça para sua família." (a vantagem vem embrulhada num caso). Manoel Victor, YouTube, coef 3,6: "A BMW ficou bilionária mandando o cliente comprar na concorrência", fecha com instrução: "Diga não pro cliente errado... Agora pode ser sua vez." Fraco: Manoel Victor, Instagram, coef 0,31: "O autor do livro 'Pai Rico, Pai Pobre' revelou o segredo pra usar IA da forma certa e que muita gente não percebe."
- **Instrução:** "Use vantagem quando a meta do vídeo for salvamento, nunca quando for alcance. Embrulhe a dica num caso com personagem e abra pelo caso: 'O Silvio Santos fez uma jogada que salvou R$ 6,4 bilhões', não 'Como você pode economizar na herança'. Feche com a instrução prática, não com a consequência."

### A6. Cada payoff move uma métrica diferente
- **O que e número:** comentário: revolta OR 2,70, nostalgia 2,27, orgulho 2,12, inspiração 1,76, alerta 1,35 (todos replicam); sacada 0,51, superação 0,51, queda 0,67 e virada 0,68 derrubam (replicam). Compartilhamento: orgulho OR 1,71, futuro 1,70, inspiração 1,58 (replicam); queda 0,42 e nostalgia 0,25 derrubam (replicam). Salvamento (TikTok): vantagem OR 5,84; queda 0,14, virada 0,53 e alerta 0,53 derrubam (replicam). Seguidores por mil (Instagram): nenhum payoff replica; futuro tem OR 1,77 [1,10 a 2,84] como sinal.
- **Onde vale:** global; compartilhamento só tem volume em IG e TT, salvamento só no TikTok.
- **Exemplos:** comentário por revolta: Cadu Neiva, TikTok, coef 102,0: "Albert Einstein veio ao Brasil e ignorou presidentes, políticos e intelectuais famosos pra almoçar com esse médico baiano. Mas você provavelmente nunca ouviu falar dele." Compartilhamento por futuro: Izabela Anholett, Instagram, coef 146,7: "A Samsung lançou um par de óculos que é o começo do fim da era do celular."
- **Instrução:** "Escolha o payoff pela métrica do vídeo: alcance pede disputa ou orgulho com régua; compartilhamento pede orgulho, futuro ou exemplo inspirador; comentário pede revolta, nostalgia ou pergunta no fim; salvamento pede vantagem prática. Queda do gigante não serve para engajamento."

### A7. Payoff de nicho
- **Queda do gigante** funciona em Dinheiro, economia e geopolítica: lift 1,47, OR 1,85 [1,06 a 3,23], 1,36/1,79 (replica, 58 vídeos, 21 roteiros); em Tecnologia, 0,54 (OR 0,46). Ex.: Fernando Pereira, YouTube, coef 19,6: "Por que um dos maiores craques da história tem uma dívida de milhões que a Justiça tenta cobrar há mais de 20 anos?"
- **Alerta** funciona em Dinheiro: lift 1,19 [1,00 a 1,40], OR 1,40 [1,05 a 1,86], 1,22/1,15, nas 3 redes (1,20/1,18/1,18); em Tecnologia, 0,90. É o nicho onde alerta é 23% da produção.
- **Revolta** funciona em Negócios, marcas e cases: lift 1,44, OR 1,77 [1,07 a 2,93], 1,85/1,19 (replica, 70 vídeos, 31 roteiros); em Dinheiro, onde é mais usada (8% dos roteiros), fica em 0,71 (OR 0,61).
- **Orgulho** é mais forte em Tecnologia (OR 1,80, replica); **superação** é pior em Tecnologia (OR 0,44, replica).
- **Globais:** disputa ajuda nos 3 nichos; vantagem atrapalha nos 3. Bastidor (27% da produção de Dinheiro) e sacada (19% de Negócios) são neutros em todos: os payoffs mais usados em cada nicho não são os que mais rendem.
- **Instrução:** "Em Dinheiro, prefira queda do gigante (erro caro de alguém famoso) e alerta aberto pelo porquê; deixe a revolta para cases de marca. Em Tecnologia, troque superação por orgulho com régua estrangeira ou por Davi e Golias."

### A8. Payoff por rede
- **Orgulho:** Instagram e TikTok, OR 2,09 (replica); YouTube, 0,93. **Queda do gigante:** só no YouTube, 1,26, OR 1,50 [1,01 a 2,23] (sinal). **Nostalgia:** YouTube 0,39, OR 0,30 [0,10 a 0,86] (replica com n pequeno, 40 vídeos); Instagram 0,99. **Disputa:** as 3, mais forte no YouTube (1,81) e no TikTok (1,70). **Bastidor:** YouTube 1,08 contra 0,88 no IG+TT (sem significância).
- **Instrução:** "O mesmo roteiro em 3 redes: se o payoff é orgulho, a versão do YouTube precisa de outro gancho (a briga ou o erro do gigante); se é nostalgia, não suba no YouTube sem reescrever."

### A9. Estrutura: o que o hook promete, o que o subhook faz, quem é o antagonista
- **Subhook que puxa para o espectador** ("imagina você...", "aquela loja que você conhece..."): 15% no topo, lift 0,59 [0,48 a 0,73], OR 0,50 [0,38 a 0,65], 0,60/0,59 (replica, 457 vídeos, 26 clientes); retenção do subhook no Instagram 0,65, OR 0,56 (replica). **Subhook que eleva a aposta** com novo dado: lift 1,13, OR 1,24 (replica, 935 vídeos). Ex. bom: Marcos Pelozato, TikTok, coef 1.356: hook das 298 lojas fechadas da Casas Bahia, subhook "Foram quase 300 lojas fechadas de uma só vez. Quase 2 mil funcionários demitidos em apenas dois dias." Ex. fraco: Marcos Pelozato, YouTube, coef 0,01: "O Brasil virou um cemitério de empresas, e o seu casamento pode ser a próxima vítima." / "Pode parecer exagero, mas uma empresa quebrar longe de você pode terminar dentro da sua casa."
- **Protagonista "você"**: lift 0,69, OR 0,59 (replica). Mesma direção do teste de sanidade (hook com "você", OR 0,78).
- **Promessa do hook:** comparação 1,23 (OR 1,37) e novidade 1,20 (OR 1,47) ajudam (replicam); alerta 0,82 (OR 0,74) e ensinar 0,66 (OR 0,57) atrapalham (replicam). Metade dos hooks (50%) é "porquê/como" e fica na média.
- **Antagonista:** rival 1,23 (OR 1,43) e gigante 1,23 (OR 1,37) ajudam; "problema" (doença, crise, natureza) 0,89 (OR 0,80) atrapalha; todos replicam.
- **Recorte:** história só estrangeira 0,89 (OR 0,74, replica, 2.355 vídeos); conectar ao Brasil 1,16 (OR 1,32), mas só na validação (0,99/1,30).
- **Instrução:** "No subhook, some um número que aumenta a aposta; não chame o espectador para dentro ('imagina você'). Dê um oponente com nome ao protagonista: um rival ou um gigante vale mais do que 'a crise'. Em pauta de fora, faça a ponte com o Brasil no hook ou no fechamento."

### A10. O fechamento tem uma função por métrica
- **Frase-síntese** (resume o caso, sem princípio geral) segura até o fim no Instagram: retenção final 40% no topo contra 24%, lift 1,54 [1,24 a 1,86], OR 2,07 [1,44 a 3,00], 1,51/1,73 (replica, 138 vídeos); com roteiros de 350 a 499 palavras o efeito se mantém (1,55, OR 1,92), então não é tamanho. Ex.: Franklin Tomich, Instagram, coef 62,2: "E foi assim que a marca que dominou os recreios brasileiros por décadas chegou ao fim."
- **Consequência** para o espectador ou o país gera compartilhamento: lift 1,21, OR 1,42 (replica, 350 vídeos).
- **Pergunta** gera comentário: 1,34, OR 1,63 (replica). **Lição de moral** derruba comentário: 0,87, OR 0,68 (replica), e é o fechamento de 46% dos vídeos; virada final também derruba (OR 0,74).
- **Retomada** do hook: alcance 1,39, OR 1,62, só na validação (0,93/1,53), hipótese.
- **Instrução:** "Escolha o último parágrafo pela meta: síntese do caso para reter até o fim, consequência para o espectador para compartilhar, pergunta de lado para comentar. Lição de moral é o padrão da casa e não move nenhuma métrica: use só quando a lição for a sacada."

## 5. Por payoff: como abrir e como fechar quando funciona

Lift no topo do coef contra a população (entre parênteses, n de vídeos). "Replica" marca o que é regra; o resto é a melhor opção observada dentro do payoff, sem significância.

| payoff | abra com | feche com | evite |
|---|---|---|---|
| Disputa | a notícia da briga, com os dois nomes (`novidade` 1,73, n=94, replica) | frase-síntese que diz quem está ganhando (`sintese` 1,90, n=51, replica) ou pergunta de lado (`pergunta` 1,67, n=51, replica) | briga sem placar nem lado |
| Orgulho | quem foi superado (`quem_qual` 1,63, n=38, replica; `porque_como` 1,31, replica) | o que isso significa para o Brasil (`consequencia` 2,16, n=36, replica) ou lição (1,28, replica) | orgulho sem régua estrangeira; YouTube |
| Exemplo inspirador | comparação com o gigante (`comparacao` 1,46, n=64, replica) | lição (trio 1,80, OR 2,64, replica) | herói sem antagonista (0,81) |
| O futuro chegou | a novidade, "acabou de" (`novidade` 1,18, replica; trio novidade + futuro 1,33, OR 1,54, n=140, replica) | projeção (`futuro` 1,27, replica) | abrir com "por quê" (0,69, replica) |
| Queda do gigante | tese (`tese` 1,94, n=28, replica) ou história sem final (`desfecho` 1,35; trio desfecho + lição 1,46, OR 1,78, replica) | síntese (1,94, n=34, replica) | usar para engajamento; Tecnologia |
| Alerta | o porquê, não o alarme (`porque_como` 1,48, n=71, replica) | consequência para o espectador (1,22, n=268, replica) | abrir com número solto (0,27) e acabar sem fechamento (0,47), os dois replicam |
| Vantagem | o caso de alguém ou a novidade (`novidade` 1,26) | instrução prática (0,96) | prometer ensinar (0,60) e fechar com consequência (0,27), os dois replicam |
| Virada | porquê, história ou tese | "não era X, era Y" (`virada_final` 1,25, n=90) | pergunta e lição genérica |
| Superação | história sem final (`desfecho`, 1,29 dentro do payoff) | síntese (1,20 dentro do payoff) | porquê + lição (0,68, replica) |
| Revolta | tese ou "quem é" (1,07 e 1,03) | pergunta (1,18) ou síntese (1,08) | consequência (0,69); Dinheiro |
| Bastidor | número (1,55, n=25) ou "quem é" | lição (1,05) | pergunta no fim (porquê + pergunta 0,40, replica) |
| Sacada | número ou porquê | virada final (1,09) | lição longa |
| Nostalgia | porquê ("o que aconteceu com") | lição ou síntese | história sem final (0,00, n=37); YouTube |
| Curiosidade | "quem é" (1,36, n=40) | pergunta (1,35, n=46) | lição (0,71) |

**Dois exemplos reais de topo por payoff** (cliente, rede, coef; hook e fechamento):

- **Disputa.** Renato Mendes, TikTok, coef 288,7: "A chinesa que está comprando o mundo deu o passo definitivo para dominar o Brasil. E agora, o império da BYD está oficialmente ameaçado." / "A Geely não veio para ser mais uma chinesa que vende carros no Brasil, ela chegou para ser brasileira." Izabela Anholett, YouTube, coef 195,9: "O governo chinês declarou guerra ao dono do Instagram..." / "Inteligência artificial é hoje a corrida do ouro e as maiores potências do mundo estão fazendo de tudo para ficar na frente."
- **Orgulho.** Leonardo Cirino, Instagram, coef 63,5: "Enquanto todo mundo olha pra China e Estados Unidos, o interior de São Paulo está se preparando para ser a próxima capital da Inteligência Artificial." / "E o Brasil, quase sem perceber, acabou de se tornar um dos lugares mais estratégicos..." Marcio Grazino, TikTok, coef 740,2: "Você tinha vergonha de usar Olympikus na escola. Hoje em dia, ela humilha a Nike e a Adidas no Brasil." / "Ao invés de ser uma cópia barata do líder, resolva o problema local que ele não consegue enxergar."
- **Exemplo inspirador.** Rafael Rodrigues, Instagram, coef 438,4: "Enquanto as gigantes gastam bilhões para criar tecnologia, esse jovem de 20 anos criou uma concorrente da Apple usando restos de lixo." / "a escassez nem sempre é um limite." Marcio Grazino, Instagram, coef 124,3: "Três estudantes de escola pública no interior da Bahia fizeram o que a indústria do chocolate não fez em 50 anos." / "Às vezes a inovação não nasce de laboratório milionário..."
- **O futuro chegou.** Izabela Anholett, Instagram, coef 146,7: "A Samsung lançou um par de óculos que é o começo do fim da era do celular." / "A informação está saindo da palma da sua mão e indo para o mundo que a sua vista alcança." Izabela Anholett, Instagram, coef 79,1: "A contagem regressiva começou. A China vai implementar no Brasil os pagamentos com a palma da mão ainda este ano." / "A previsão é chegar ao mercado ainda no segundo semestre deste ano."
- **Queda do gigante.** Rafael Rodrigues, TikTok, coef 630,1: "A Nike passou vergonha ao esquecer o mais importante sobre o Brasil: Nós somos brasileiros." / "E não é uma marca de fora que vai mudar isso." Franklin Tomich, YouTube, coef 21,5: "O que aconteceu com o Playcenter, o parque mais icônico de São Paulo? Ele afundou por causa de um concorrente que ele mesmo criou." / "ceder parte do próprio negócio pode ser a única saída, mas também pode criar o concorrente que vai te superar depois."
- **Alerta.** Marcos Pelozato, TikTok, coef 1.356: "A Casas Bahia sobreviveu a hiperinflação, plano Collor e pandemia. Agora fechou 298 lojas de uma vez, e pouca gente consegue entender o porquê." / "quem não prestar atenção agora pode acabar sofrendo as consequências." Ricardo Schumacher, TikTok, coef 133,5: "O Ratinho agora virou Paraguaio! Só que tem um detalhe nessa história que pode custar caro pra quem tá pensando em fazer o mesmo." / "precisa resolver o vínculo, não só o documento." Fraco: Fernando Pereira, Instagram, coef 0,08: "Em 2025, mais empresas brasileiras pediram recuperação judicial do que em qualquer outro momento da história" (número solto no hook).
- **Vantagem.** Dilson Peres, YouTube, coef 237,8: "O Silvio Santos fez uma jogada genial que evitou qualquer dor de cabeça para sua família." / "Planejamento sucessório não é assunto de fim de vida." Marcelo Germano, TikTok, coef 188,9: "A Netflix tem três séries absurdas sobre mentalidade, desenvolvimento e caráter que, se você é líder..., precisa ver imediatamente." / "Envie esse vídeo pra alguém que você quer ver liderar este ano."
- **Virada.** Cadu Neiva, Instagram, coef 740,2: "Esse empresário nordestino 'faliu' a própria marca para ficar dez vezes mais rico." / "O Bompreço morreu para o público, mas o império da família só cresceu." Rodrigo Waughan, YouTube, coef 11,3: "A Apple passou 11 anos tentando provar que não precisava de Steve Jobs..." / "Steve Jobs precisou perder a Apple para construir tudo o que faria a Apple ser o que ela é hoje."
- **Superação.** João Paulo Albuquerque, TikTok, coef 441,8: "Ela levou 10 anos para construir essa empresa. E um único dia para descobrir que podia ser destruída por causa da Nestlé." João Paulo Albuquerque, YouTube, coef 293,6: "Essa mulher gastou toda a poupança da faculdade dos filhos para criar uma bolsa de praia. Hoje fatura 100 milhões de dólares por ano."
- **Revolta.** Cadu Neiva, TikTok, coef 102,0: "Albert Einstein veio ao Brasil e ignorou presidentes... pra almoçar com esse médico baiano. Mas você provavelmente nunca ouviu falar dele." Drielle Castelani, Instagram, coef 120,2: "Esse médico esperou o chefe ir embora, trancou a sala, e enfiou um tubo dentro do próprio coração." / "Mas o sistema segue usando a ideia, sem mencionar de onde veio."
- **Bastidor.** Lincoln Fracari, TikTok, coef 291,1: "A China está construindo um verdadeiro país paralelo no Nordeste brasileiro e quase ninguém tá percebendo isso." / "quem constrói o próprio campo de batalha, dita as regras do jogo." Dilson Peres, TikTok, coef 115,7: "Esse homem recebe em torno de 4 milhões por mês da Globo e, mesmo assim, o salário não explica nem metade da fortuna dele."
- **Sacada.** Pedro Elero, YouTube, coef 1.237,7: "Essa marca de tênis manda uma faca de verdade dentro da caixa. E pede para você destruir o produto que acabou de comprar." Renato Torres, Instagram, coef 244,0: "Esse é o cara mais odiado do mundo pelos donos de academia!" / "nicho não é limitação. É valor."
- **Nostalgia.** Franklin Tomich, Instagram, coef 62,2: "Você lembra do Ping Pong? O chiclete que fazia bola, com figurinha dentro, simplesmente sumiu. E a culpada foi uma decisão corporativa que quase ninguém conhece." João Paulo Albuquerque, TikTok, coef 384,3: "A Sony matou essa empresa. Só que uma marca brasileira transformou esse nome enterrado em um negócio que já projeta faturar bilhões."
- **Curiosidade.** Leonardo Nogueira, Instagram, coef 438,3: "Este taxista rodou tanto com o seu Toyota que ele simplesmente travou o software da fábrica." / "E se você pudesse escolher 1 carro para rodar 1 milhão de km, qual carro seria?" Leonardo Martins, Instagram, coef 232,3: "Esse equipamento faz um barco parar de balançar, mesmo com o mar agitado."

## 6. Por cliente (hipóteses: n de 15 a 140 vídeos, sem teste de replicação)

\* = IC95 do lift acima de 1; † = abaixo de 1. Lista completa em `tabelas.md`, seção 4.
- Disputa rende acima da média em Fernando Pereira (1,78\*), Izabela Anholett (1,70\*) e Renato Mendes (3,12\*, n=15).
- Orgulho: Marcio Grazino (1,58\*) e Rafael Rodrigues (1,33\*), os dois que mais produzem; superação é o pior payoff dos dois (0,48† e 0,56†).
- Virada: Marcio Grazino (1,81\*) e Rodrigo Waughan (1,53\*); em Franklin Tomich, 0,34†.
- Bastidor: Marcos Pelozato (1,71\*); em Renato Mendes, 0,26†.
- Vantagem é o pior payoff de Izabela Anholett (0,67†, 115 vídeos), que mais usa ferramenta e curso.
- Curiosidade é o pior de Lincoln Fracari (0,36†); futuro é o pior de João Felipe Marques (0,32†, n=24).

## 7. O que os playbooks atuais afirmam e o dado confirma, corrige ou desmente

| playbook e regra | veredito | dado |
|---|---|---|
| storytelling, "Davi e Golias: sem declaração explícita da escala do Golias, o vídeo perde tensão" | **confirma (forte)** | herói com gigante nomeado OR 1,89 (replica); sem antagonista 1,08; inspiração com gigante OR 2,22 contra 0,81 |
| storytelling, "Conflito Imprevisível" no Tier C | **corrige para o topo** | disputa com lado é o payoff de maior lift da casa (OR 2,09), nas 3 redes e 3 nichos |
| hook, "Conflito Declarado" e "Contraste Extremo, o mecanismo base" | **confirma** | disputa OR 2,09; promessa de comparação OR 1,37 (replica) |
| storytelling, "Jornada do Herói" no Tier A e "sem a decisão contraintuitiva, vira apenas uma história de sucesso" | **confirma a ressalva, corrige o tier** | superação sem virada OR 0,65 (replica); com virada 0,96 (neutra, não positiva) |
| storytelling, "Herói Esquecido: raiva moral = compartilhamento compulsório" | **corrige** | revolta não move compartilhamento (OR 1,16, sem evidência) nem alcance (0,94); move comentário (OR 2,70, replica). Herói esquecido (revolta + orgulho) 1,35, sem evidência (n=46) |
| storytelling, "Erro Fatal: alta taxa de salvamento e compartilhamento como proteção" | **desmente** | queda do gigante: salvamento OR 0,14 e compartilhamento OR 0,42 (replicam). Funciona para alcance em Dinheiro (OR 1,85) e no YouTube (OR 1,50) |
| storytelling, "Estratégia Oculta: alta taxa de salvamento" | **não confirma** | bastidor 1,02 e sacada 0,91 em salvamento; quem salva é vantagem aplicável (OR 5,84) e utilidade prática (OR 3,47) |
| storytelling, "O Iconoclasta" no Tier S | **não confirma** | virada contraintuitiva 1,06 (sem evidência), derruba comentário (OR 0,68) e salvamento (OR 0,53); funciona em Marcio Grazino e Rodrigo Waughan, falha em Franklin Tomich |
| storytelling, "Geopolítica & Impacto Brasil" no Tier S | **confirma em parte** | conectar estrangeiro ao Brasil 1,16 (OR 1,32, só validação); história só estrangeira OR 0,74 (replica); alerta em Dinheiro OR 1,40 |
| storytelling e hook, "Urgência & Alerta" (Tier C) e "Urgência: anti-padrão de sobreuso" | **confirma no hook** | hook que promete alerta OR 0,74 (replica); alerta como payoff é neutro, bom em Dinheiro se aberto pelo porquê |
| storytelling, "Regra de ouro: vídeos que tocam dois eixos viralizam" | **não deu para testar** | o modelo marcou payoff secundário em 92% dos roteiros |
| checklist, "O roteiro ativa pelo menos uma emoção identificável e nomeável" | **complementa** | a emoção certa depende da métrica (seção 3); superação (admiração) e vantagem (ambição) são emoções nomeáveis que derrubam alcance |
| sanidade, "hook com 'você' OR 0,78" | **confirma e estende** | subhook que puxa o espectador OR 0,50; protagonista "você" OR 0,59; hook que promete ensinar OR 0,57 |

## 8. O que NÃO deu para afirmar

- **Dois payoffs juntos:** payoff2 veio preenchido em 92% dos roteiros, então não separa nada (lift 1,00). A regra "dois eixos viralizam" fica sem teste.
- **Ruído do rótulo:** duas rodadas no piloto (com e sem pensamento, mesmo prompt) concordaram em 78% no payoff principal; em 98% o payoff de uma aparece como principal ou secundário na outra. As confusões são entre vizinhos (orgulho x inspiração, futuro x curiosidade, bastidor x virada x sacada). Efeitos pequenos (lift entre 0,9 e 1,1) podem ser só ruído.
- **Seguidores:** só cerca de 1.270 vídeos do Instagram têm o dado; nenhum payoff replica. Futuro (OR 1,77) é pista.
- **Tema x payoff:** o OR controla cliente e rede, não o assunto. Disputa sobrevive sem China, mas não dá para separar todo efeito de pauta (notícia quente de tecnologia, por exemplo) do efeito do payoff.
- **Subgrupos pequenos:** queda em Dinheiro (21 roteiros), revolta em Negócios (31), nostalgia (51 no total), disputa + novidade + síntese (27 vídeos): replicam ou têm sinal, mas com poucos roteiros; trate como regra provisória.
- **Alerta em Dinheiro e queda no YouTube:** OR significativo e mesmo sinal nas duas metades, mas o IC do lift encosta em 1. Pista forte, não regra.
- **Retomada do hook no fechamento** (alcance 1,39) e **ponte com o Brasil** (1,16) só aparecem na validação.
- **Fechamento sem conclusão gera comentário** (OR 2,80), mas é quase sempre CTA de "comenta X" (Dilson Peres); é efeito do comando, não do payoff.
- **Sentimentos do Gemini** só existem na descoberta; serviram de checagem, não de teste com replicação.
- **Facebook e Entretenimento:** volume insuficiente por payoff.
- **Por cliente:** os números da seção 6 não passaram por replicação; servem para levantar pauta, não para virar regra do cliente.

## 9. Método e custo

- **Rótulos:** Claude Sonnet 5.5 (`claude-sonnet-5-5`), pensamento adaptativo em esforço baixo, saída estruturada por JSON Schema (`output_config.format`, com enums fechados; o modelo não aceita tool use forçado), system prompt com as definições em cache, lotes de 18 roteiros, 5 em paralelo, retry com espera, fallback de recusa no servidor. Entrada por roteiro: título, hook, subhook, os dois parágrafos finais e o resumo do vídeo do Gemini, truncados. 0 recusas, 0 falhas. Código: `src/payoff/taxonomia.mjs` (definições e prompt), `classificar.mjs`.
- **Validação:** 15 rótulos conferidos à mão no piloto (acertos claros no payoff; ajustes nas definições de "desfecho" e "quem é" no hook e uma regra para ignorar notas de gravação no fechamento). Convergência com os sentimentos do Gemini, que foram feitos por outro modelo sobre o vídeo: revolta tem INDIGNAÇÃO em 89% dos vídeos (7,2 vezes a média), alerta tem MEDO 6,1 vezes, nostalgia tem NOSTALGIA 84% (26,6 vezes), disputa tem CONTROVÉRSIA 5,3 vezes, inspiração tem OTIMISMO 91% e ADMIRAÇÃO 99%.
- **Custo real (`custo.json`):** US$ 6,38 no total (teto US$ 10). Piloto com pensamento US$ 0,10, piloto sem pensamento US$ 0,10, rodada final US$ 6,18 (previsão antes de rodar: US$ 6,15). 161 chamadas; 990.375 tokens de entrada, 897.489 lidos do cache, 16.624 escritos no cache, 418.169 de saída. Haiku não foi necessário.
- **Arquivos:** `data/rotulos_llm.json` (2.809 roteiros); `out/payoff/tabelas.md` (todas as tabelas), `resultados.json` (todos os números), `exemplos_combo.json`, `rot_*.jsonl` (rótulos brutos com o trecho-sinal), `custo.json`. Análise: `src/payoff/analise.mjs`, `robustez.mjs`, `exemplos_combo.mjs`, `blocos.mjs`.
