# Plataformas: o que funciona em todas as redes e o que é de uma rede só

Estudo 2026-10, subagente de plataformas. Base: 6.305 vídeos analisáveis (Instagram 2.658, TikTok 1.857, YouTube 1.790) de 2.713 roteiros VM, mais 276 do Facebook. Desfecho principal: vídeo no quartil de cima do coeficiente viral no estrato cliente x rede x trimestre (base 26%). Código em `src/plataformas/`, saídas brutas em `out/plataformas/*.txt` e `*.json`.

**O experimento natural.** O mesmo roteiro saiu em duas redes em 1.792 casos (IG e TT, 23 clientes), 1.726 (IG e YT, 21 clientes) e 1.571 (TT e YT, 19 clientes). Para cada par, d = percentil do roteiro na rede A menos o percentil do mesmo roteiro na rede B (o percentil já é relativo ao cliente, à rede e ao trimestre). Para cada característica: Δ = média de d com a característica menos média sem, calculada dentro de cada cliente e ponderada (n com x n sem / n total), com IC por bootstrap estratificado por cliente (2.000 reamostragens de roteiros). Δ em pontos de percentil (pp). Chamo de "de rede" o que tem IC fora de zero e aparece em 3 ou mais clientes (3+ roteiros com e sem); "replica" = mesmo sinal antes e depois de 01/07/2026. Foram 328 testes e 45 passaram (16 seriam esperados por acaso): trato como **regra** só o que aparece nos dois pares da rede (a rede ganha das outras duas no mesmo roteiro) ou tem efeito próprio na rede (OR MH com IC fora de 1 pela régua `avaliar`) confirmado pelo pareado.

**Fato de base que muda a leitura:** a casa posta o MESMO arquivo nas três redes. A duração do mesmo roteiro difere em até 2 s em 97% dos pares IG x TT, 97% dos IG x YT e 100% dos TT x YT; o fim falado (comando) é o mesmo texto em 92% dos pares; 81% dos roteiros saem no mesmo dia em todas. Então o pareado mede como cada rede responde à mesma peça. Ele não mede adaptação, porque quase não existe adaptação na base.

## 1. Resumo em 10 linhas

1. A mesma peça vai para as três redes (mesmo arquivo, mesma duração, mesmo comando, mesmo dia em 81% dos casos) e o percentil do mesmo roteiro só se repete em parte (IG x TT 0,49; com YouTube 0,32 a 0,35): a rede muda o resultado, e há padrão de qual roteiro rende em qual rede.
2. Funciona nas três: China no hook (OR 1,81 / 1,84 / 1,78) e carro chinês humilhando montadora tradicional (2,27 / 2,19 / 3,41); briga com os dois lados nomeados quase nas três. Atrapalha nas três: subhook que puxa o espectador ("Imagina você...", 0,51 / 0,58 / 0,40) e fundador que vendeu a empresa por milhões (0,44 / 0,39 / 0,48).
3. YouTube: valor em R$ ou dólares no hook ajuda só lá (OR 1,49; no IG 0,75 e no TikTok 0,72). O mesmo roteiro fica 8 a 9 pontos de percentil mais alto no YouTube do que no IG e no TikTok, em 13 de 18 e 14 de 16 clientes, nos dois períodos.
4. O YouTube também aceita o que IG e TikTok punem: história só estrangeira (YT 0,93 contra IG 0,73 e TT 0,59), conclusão com virada final (+9 pp no YT), queda de gigante (YT 1,50) e vídeo de 120 a 149 s (YT 1,27).
5. Instagram e TikTok pagam o que o YouTube não paga: orgulho (IG 1,73, TT 1,69, YT 1,07), estudante brasileiro inventor (1,96 / 1,72 / 0,73), Davi contra Golias com gigante nomeado, subhook que eleva a aposta. O mesmo roteiro perde de 6 a 16 pontos no YouTube.
6. TikTok: nome próprio e mega-marca no hook (TT 1,62 e 1,47; IG 1,18 e 1,05; +3 a +6 pp no mesmo roteiro). É a rede que mais pune vídeo abaixo de 90 s (0,65), vilão abstrato tipo "o problema" (0,64) e biografia de marca global (0,45).
7. Duração: IG e TikTok rendem mais com 150 a 179 s (OR 1,43 e 1,63); o YouTube rende mais com 120 a 149 s (1,27) e não ganha nada acima de 150 s. Com um arquivo só, mire 150 a 165 s; numa versão para o YouTube, 125 a 145 s.
8. Instagram postado depois das outras redes rende menos (16% de topo contra 27%, OR 0,42, replica; 8% quando sai 2 ou mais dias depois). O YouTube aceita atraso. Poste o IG primeiro ou no mesmo dia.
9. O "acerto" do panorama é coef acima de 3 E 10 mil views ou mais (não coef >= 1,5): conta com mediana abaixo de 2 mil views numa rede quase não consegue acertar lá (Waughan, Franco, Manoel Victor no TikTok e no YouTube). Os 46% da Izabela no YouTube são a decolagem do canal de maio a julho (mediana de 1,3 mil para 69 mil views); em setembro, 22%.
10. O conteúdo explica a direção do encaixe: contas de dinheiro e queda de empresa (Pelozato, Dilson) rendem mais no YouTube; contas de orgulho e estudante inventor (Rafael, Marcio, Cadu) rendem no IG e no TikTok e caem no YouTube. O comando não muda por rede (73% dos vídeos do YouTube dizem "segue", 7 dizem "se inscreve"): não há como medir adaptação de comando.

## 2. Achados

### A. Funciona em todas as redes (e o que atrapalha em todas)

Critério estrito: lift com IC acima de 1 nas três ou OR MH com IC acima de 1 nas três. "Pareado" = Δ do mesmo roteiro entre redes (perto de zero = rende igual nas três).

| # | característica | Instagram | TikTok | YouTube | pareado (mesmo roteiro) | leitura |
|---|---|---|---|---|---|---|
| 1 | Hook cita China/chinês | 32% topo, OR 1,81 [1,28 a 2,56], n=271 | 32%, OR 1,84 [1,19 a 2,84], n=211 | 31%, OR 1,78 [1,16 a 2,74], n=238 | IG-TT +0,5; IG-YT +3,2; TT-YT +2,6 (todos com IC em zero) | **regra global**, replica |
| 2 | Território: carro chinês (BYD, Geely) contra montadora tradicional | 42%, OR 2,27 [1,37 a 3,74], n=72 | 41%, OR 2,19 [1,19 a 4,05], n=49 | 50%, OR 3,41 [1,91 a 6,08], n=54 | rende mais no TT que no IG (+9,6 pp) | **regra global** |
| 3 | Payoff disputa (dois lados nomeados em guerra) | 35%, OR 1,58 [1,00 a 2,50] | 44%, OR 2,37 [1,39 a 4,05] | 47%, OR 2,71 [1,60 a 4,59] | sem diferença | quase global (IG no limite) |
| 4 | Antagonista rival nomeado | OR 1,28 [1,00 a 1,63] | OR 1,63 [1,22 a 2,16] | OR 1,48 [1,12 a 1,96] | sem diferença | quase global |
| 5 | Subhook que puxa o espectador ("Imagina você...", "aquela loja que você...") | 16%, OR 0,51 [0,34 a 0,76] | 17%, OR 0,58 [0,37 a 0,91] | 13%, OR 0,40 [0,23 a 0,68] | sem diferença; Facebook 0,17 | **atrapalha nas quatro redes** |
| 6 | Território: fundador que vendeu a empresa por milhões | 14%, OR 0,44 [0,24 a 0,78] | 12%, OR 0,39 [0,20 a 0,76] | 14%, OR 0,48 [0,24 a 0,94] | menos ruim no YT (+8,8 pp contra IG) | **atrapalha nas três** |
| 7 | Roteiro com menos de 300 palavras | OR 0,76 [0,57 a 1,01] | 0,65 [0,47 a 0,91] | 0,67 [0,48 a 0,94] | sofre menos no IG (+5,1 pp contra TT) | atrapalha (no IG no limite) |
| 8 | Protagonista é o espectador | 0,50 [0,33 a 0,76] | 0,76 [0,48 a 1,21] | 0,56 [0,32 a 0,96] | sem diferença | atrapalha em duas, mesma direção na terceira |

Não separam em rede nenhuma (não gaste tempo adaptando): "Eu sou"/"meu nome é" falado no fim (OR 1,20 / 1,03 / 1,07), comando de seguir (1,26 / 0,94 / 0,89), pergunta no hook (1,15 / 1,22 / 1,05), hook de até 15 palavras (0,94 / 0,99 / 0,92), número (dígito) no hook (0,93 / 0,93 / 1,01).

**Exemplos reais (alto nas três redes):**
- Thiago Bisewski: "A China acabou de humilhar o resto do mundo mais uma vez e agora foi dando uma facada no coração da indústria automobilística." IG coef 77,2 (p100), TT 450,5 (p100), YT 713,4 (p100).
- Renato Mendes: "A chinesa que está comprando o mundo deu o passo definitivo para dominar o Brasil. E agora, o império da BYD está oficialmente ameaçado." IG 86,1 (p98), TT 288,7 (p98), YT 1,28 (p88).
- Izabela Anholett (disputa): "O Google e a Samsung acabaram de declarar guerra ao Mark Zuckerberg, e o seu próximo celular não vai estar no seu bolso, vai estar no seu rosto." IG 14,4 (p86), TT 101,3 (p100), YT 179,3 (p96).

**Onde vale:** China no hook vale dentro de Izabela, Franklin, Fernando e Leonardo (IG 1,27 a 1,93); no Lincoln Fracari, com China em 88% dos hooks, é rotina e não separa (IG 1,14, YT 0,99).

**Instrução para o playbook:** "Estas regras valem para a peça única, em qualquer rede: China, marca chinesa contra marca tradicional e briga entre dois lados com nome. Nunca abra o subhook falando com o espectador ('Imagina você...'); traga um fato novo. Evite a premissa 'fundador que vendeu por milhões'." Reescrita do subhook: "Imagina você pagar R$ 200 mil num carro e ele virar sucata em 3 anos." vira "Em agosto, o Corolla perdeu o trono de mais vendido pela primeira vez na história."

**Confiança:** alta (1, 2, 5, 6), média (3, 4, 7, 8).

### B. Por rede: funciona aqui e não nas outras

#### B1. YouTube Shorts

| característica | Instagram | TikTok | YouTube | mesmo roteiro: YT contra IG / contra TT | clientes com mesmo sinal |
|---|---|---|---|---|---|
| **Moeda no hook (R$, reais, dólares)** | 22% topo, OR 0,75 [0,58 a 0,98] | 21%, OR 0,72 [0,52 a 0,99] | **32%, OR 1,49 [1,11 a 2,00]**, d/v 1,28/1,22 | **+8,2 pp [3,5 a 12,7] / +8,9 pp [3,9 a 13,8]** | 13 de 18 / 14 de 16 |
| Payoff queda de gigante | OR 1,05 | 0,97 | **1,50 [1,01 a 2,23]** | +0,3 / **+7,1 [0,1 a 14,2]** | 8 de 10 (TT) |
| Conclusão com virada final | 0,76 | 0,81 | 1,23 (IC 0,79 a 1,92) | **+9,3 [2,4 a 16,3] / +8,8 [1,3 a 16,2]** | 10 de 14 / 10 de 13 |
| História só estrangeira (sem ponte com o Brasil) | **0,73 [0,59 a 0,90]** | **0,59 [0,46 a 0,76]** | 0,93 [0,72 a 1,19] | **+4,8 [1,0 a 8,7] / +6,8 [3,0 a 10,7]** | 12 de 20 / 12 de 18 |
| Subhook que volta no tempo ("Em 1998...") | 0,80 | 0,76 | 1,20 | **+9,0 [4,3 a 13,8]** / - | 14 de 18 |
| Vídeo de 120 a 149 s | 0,93 | 0,85 | **1,27 [1,02 a 1,60]** | **+4,0 [0,7 a 7,5]** / +3,5 | 10 de 19 |
| Território "Inovação verde e tecnologia do Nordeste" | 1,08 | 1,23 | **1,88 [1,09 a 3,24]** | +6,2 / +6,8 (IC em zero) | Marcio e Cadu |

Milhões e bilhões sem moeda ("600 milhões de pessoas") não se separam em rede nenhuma (IG 1,37, TT 1,26, YT 1,08, todos com IC em 1): o que o YouTube paga é dinheiro.

**Exemplos reais (o mesmo roteiro):**
- Lincoln Fracari: "Um chinês destruiu 600 bilhões de dólares em um único dia, sem comprar uma ação, sem disparar um tiro e sem que quase ninguém soubesse quem ele era." IG coef 0,67 (p17), YT 10,1 (p91).
- Cadu Neiva: "Esse jovem do sertão construiu um império de R$ 10 bilhões sem um real no bolso." IG 1,22 (p13), TT 0,27 (p22), YT 1,67 (p86).
- Rodrigo Waughan (queda): "Uma das marcas de luxo mais desejadas do Brasil está sendo devorada por um segredo de um bilhão de reais." IG 0,97 (p66), TT 1,05 (p64), YT 13,0 (p97).
- Marcos Pelozato (virada final): "A Polaroid faliu duas vezes, mas foi salva por uma tecnologia que o mundo inteiro tinha jogado fora." IG 1,23 (p53), YT 11,5 (p91).
- Franklin Tomich (148 s): "A Coca Cola e o Guaraná Antarctica sempre ignoraram o Sul do Brasil. A Fruki aproveitou isso e montou uma das melhores estratégias do país." IG 0,35 (p4), YT 129,8 (p98).

**Instrução para o playbook:** "No YouTube, ponha o valor em reais ou dólares no hook e feche com uma virada. História de empresa estrangeira pode ir pura. Queda de gigante e volta no tempo funcionam lá." Reescrita para a versão YouTube: "A Havan fez um pix pros funcionários e quase ninguém ficou sabendo." vira "A Havan fez um pix de 90 milhões de reais pros funcionários e quase ninguém ficou sabendo."

**Confiança:** alta (moeda no hook, conclusão com virada final, história só estrangeira); média (queda, volta no tempo, 120 a 149 s); baixa (Inovação verde, só 2 clientes).

#### B2. Instagram e TikTok, não YouTube (o que o YouTube não paga)

| característica | Instagram | TikTok | YouTube | mesmo roteiro: YT contra IG / contra TT | clientes |
|---|---|---|---|---|---|
| **Orgulho (payoff ou payoff2)** | 32%, OR **1,73 [1,30 a 2,30]** | 32%, OR **1,69 [1,22 a 2,34]** | 27%, OR 1,07 [0,76 a 1,51] | **-7,0 [-12,6 a -1,6] / -10,8 [-16,0 a -5,7]** | 9 de 13 / 9 de 12 |
| **Estudante brasileiro inventor** (território) | **1,96 [1,25 a 3,08]** | **1,72 [1,08 a 2,75]** | 0,73 [0,45 a 1,17] | **-16,1 [-22,4 a -9,3] / -11,7 [-18,3 a -4,5]** | Rafael, Marcio, Cadu |
| Davi contra Golias (antagonista gigante nomeado) | **1,40 [1,01 a 1,94]** | **1,51 [1,02 a 2,25]** | 1,18 [0,78 a 1,78] | **-6,8 / -9,5** | 8 de 13 / 9 de 12 |
| Subhook que eleva a aposta | **1,46 [1,15 a 1,85]** | 1,24 [0,94 a 1,65] | 0,95 | **-6,8 [-11,2 a -2,7] / -5,7 [-10,4 a -1,4]** | 12 de 17 / 9 de 16 |
| Promessa de novidade ("acabou de lançar") | **1,50 [1,13 a 1,99]** | **1,72 [1,22 a 2,42]** | 1,22 | **-6,2 [-11,4 a -1,1]** / - | 8 de 13 |
| Ponte Brasil x estrangeiro | **1,42 [1,14 a 1,76]** | **1,35 [1,05 a 1,75]** | 1,17 | - / **-4,6 [-8,9 a -0,4]** | 11 de 17 |
| Nostalgia (payoff) | 1,00 | 0,67 | **0,30 [0,10 a 0,86]**, n=40 | -10,9 / - | n pequeno |

**Exemplos reais (o mesmo roteiro):**
- Rafael Rodrigues: "Esse menino cearense de apenas 8 anos ainda não tem os dentes da frente, mas acabou de conquistar o pódio de uma olimpíada científica nos Estados Unidos." IG coef 88,6 (p99), TT 75,0 (p95), YT 0,07 (p3).
- Marcio Grazino: "Essa baiana pegou os restos de lixo e criou um produto que as grandes indústrias cobram fortunas pra vender" IG 63,5 (p98), TT 81,7 (p100), YT 0,16 (p3).
- João Paulo Albuquerque (gigante): "Ela levou 10 anos para construir essa empresa. E um único dia para descobrir que podia ser destruída por causa da Nestlé." IG 2,63 (p100), TT 441,8 (p100), YT 0,18 (p6).
- Dilson Peres (eleva a aposta): "A Virgínia te enganou e o sucesso dela não veio das redes sociais." IG 33,6 (p98), TT 54,4 (p100), YT 0,19 (p0).

**Instrução para o playbook:** "Orgulho, estudante inventor e Davi contra Golias são munição de Instagram e TikTok. No YouTube não conte com eles: a mesma peça cai de 7 a 16 pontos de percentil lá." Para a versão YouTube de uma história de orgulho, troque a régua de orgulho pela régua de dinheiro (hipótese, não medida, porque a casa nunca fez as duas versões): "Essa baiana pegou os restos de lixo e criou um produto..." vira "Essa baiana transformou lixo num produto que a indústria vende por R$ X o quilo."

**Confiança:** alta (orgulho, estudante inventor, eleva a aposta); média (gigante, novidade, ponte Brasil x estrangeiro); baixa (nostalgia).

#### B3. TikTok

| característica | Instagram | TikTok | YouTube | mesmo roteiro: TT contra IG / contra YT | clientes |
|---|---|---|---|---|---|
| **Nome próprio no hook** (marca, pessoa, país, cidade) | 1,18 [0,96 a 1,46] | **1,62 [1,25 a 2,10]** | 1,13 [0,87 a 1,47] | **+3,3 [0,1 a 6,3] / +6,2 [2,4 a 10,3]** | 17 de 23 / 15 de 19 |
| **Mega-marca ou figura** (Shein, Trump, BYD, Apple, Musk) | 1,05 [0,86 a 1,29] | **1,47 [1,16 a 1,87]** | 1,26 [0,98 a 1,61] | **+4,5 [1,1 a 7,7]** / +3,6 | 17 de 21 |
| EUA/americano/Trump no hook | 0,93 | **1,68 [1,02 a 2,76]**, n=75 | 1,34 | +2,1 / +4,4 (IC em zero) | sinal |
| Roteiro de 300 a 449 palavras | 0,99 | **1,29 [1,00 a 1,67]** | 1,05 | **+4,3 [1,1 a 7,4]** / +2,1 | 12 de 19 |
| Vídeo abaixo de 90 s | 0,88 | **0,65 [0,44 a 0,95]** | 0,84 | **-5,3 [-9,7 a -0,9]** / -1,5 | 8 de 10 |
| Vilão abstrato (antagonista = "o problema": seca, doença, burocracia) | 0,83 | **0,64 [0,49 a 0,84]** | 0,95 | **-3,4 [-6,5 a -0,3]** / -3,6 | 12 de 20 |
| Biografia de marca global (Starbucks, Red Bull, Zara) | 0,68 | **0,45 [0,24 a 0,83]** | 0,71 | **-7,7 [-14,6 a -0,7]** / -0,5 | 7 de 9 (não replica) |
| Promessa "por que / como" | 0,83 | **0,72 [0,57 a 0,90]** | 1,11 | - / **-4,2 [-7,8 a -0,6]** | 9 de 18 |

Com 450 palavras ou mais o TikTok não ganha mais nada (OR 1,02), enquanto IG (1,32) e YouTube (1,42) ganham.

**Exemplos reais (o mesmo roteiro):**
- Thiago Franco: "Em 2023, o governo disse que sua blusinha da Shein era contrabando. Criou uma taxa, arrecadou 5 bilhões, e agora, em ano de eleição, quer tirar a taxa fingindo que nunca quis ela." IG coef 0,26 (p3), TT 7,17 (p100), YT 1,21 (p84).
- Café com Ferri: "Existe uma razão pro Trump ser o político mais poderoso do planeta. E ela começa antes mesmo dele abrir a boca." IG 0,06 (p10), TT 112,0 (p100), YT 0,87 (p36).
- Leonardo Nogueira: "O carro do presidente dos Estados Unidos é muito mais insano do que você imagina." IG 0,58 (p48), TT 111,5 (p96), YT 0,83 (p18).
- Contraexemplo (vilão abstrato), Cadu Neiva: "Um pedreiro analfabeto do sertão da Bahia fez mais pelo Brasil do que a maioria dos políticos." IG 4,23 (p91), TT 0,07 (p10), YT 15,7 (p98).
- Contraexemplo (curto), Dilson Peres, 287 palavras, 88 s: "A Havan fez um pix pros funcionários de 90 milhões de reais e quase ninguém ficou sabendo." IG 75,9 (p100), TT 0,00 (p0).

**Instrução para o playbook:** "No TikTok, a primeira linha precisa de um nome que o público reconhece (Shein, Trump, BYD, Apple). Não mande ao TikTok vídeo abaixo de 90 s nem história cujo vilão é 'o problema'; dê rosto ao adversário." Reescrita: "Um pedreiro analfabeto do sertão da Bahia fez mais pelo Brasil do que a maioria dos políticos." vira, para o TikTok, "Um pedreiro analfabeto da Bahia resolveu a seca que o governo federal não resolveu em 50 anos." (o adversário passa a ter nome).

**Confiança:** alta (nome próprio, mega-marca); média (300 a 449 palavras, abaixo de 90 s, vilão abstrato, "por que/como"); baixa (EUA, biografia de marca global).

#### B4. Instagram

| característica | Instagram | TikTok | YouTube | mesmo roteiro: IG contra TT / contra YT | clientes |
|---|---|---|---|---|---|
| Roteiro curto sofre menos (abaixo de 300 palavras) | 0,76 [0,57 a 1,01] | 0,65 | 0,67 | **+5,1 [1,4 a 8,8]** / +3,1 | 9 de 13 |
| Modelagem | **1,34 [1,10 a 1,63]** | 1,09 | 1,25 [0,99 a 1,57] | +0,8 / +2,5 (IC em zero) | 28 clientes |
| Território "Pré-MBA: ChatGPT, novas IAs e empregos" | **0,53 [0,34 a 0,82]** | 0,86 | 0,71 | **-9,3 [-15,3 a -3,5]** / -5,9 | sinal |
| Hook que promete ensinar | **0,47 [0,24 a 0,90]** | 0,60 | 0,69 | -2,5 / **-9,8 [-17,6 a -2,0]** | 5 de 6 |
| Hook de alerta ("cuidado", "isso vai te afetar") | **0,60 [0,42 a 0,87]** | 0,89 | 0,82 | sem diferença | sinal |

O Instagram não tem uma característica de roteiro que funcione só nele com confirmação pareada; o subhook que eleva a aposta é do IG (1,46) e do TikTok (ver B2). O pedido para compartilhar no fim ("compartilha esse vídeo", "manda pra alguém que...") não move o coef no IG (OR 1,57 [0,87 a 2,82], n=52); ele move compartilhamento (OR 3,1, subagente de comando).

**Exemplos reais:** Dilson Peres (curto, 88 s): "A Havan fez um pix pros funcionários de 90 milhões de reais..." IG 75,9 (p100), TT 0,00 (p0). Contraexemplo Pré-MBA, Manoel Victor: "O Google acabou de destruir o atendente de marketing!" IG 0,47 (p30), TT 6,83 (p100).

**Instrução para o playbook:** "Se o roteiro saiu curto (menos de 300 palavras), o Instagram é a rede onde ele perde menos; no TikTok e no YouTube, alongue. Série de ferramenta de IA e empregos ('Pré-MBA') rende no TikTok e cai no Instagram."

**Confiança:** média (curto, Pré-MBA); baixa (ensinar, alerta).

### C. Duração ideal por rede

A mesma história NÃO tem durações diferentes por rede: o mesmo arquivo vai para as três (mediana IG 125 s, TT 122 s, YT 123 s; diferença acima de 10 s em só 17, 18 e 1 pares). O ótimo abaixo vem de comparar vídeos diferentes dentro do mesmo cliente e trimestre (OR MH), não do mesmo vídeo cortado.

| faixa | Instagram (% topo, OR MH [IC]) | TikTok | YouTube |
|---|---|---|---|
| abaixo de 90 s | 24%, 0,88 [0,64 a 1,21] | 21%, **0,65 [0,44 a 0,95]** | 23%, 0,84 [0,58 a 1,22] |
| 90 a 119 s | 25%, 0,92 [0,75 a 1,12] | 26%, 1,07 [0,85 a 1,35] | 23%, **0,77 [0,60 a 0,99]** |
| 120 a 149 s | 25%, 0,93 [0,77 a 1,12] | 24%, 0,85 [0,68 a 1,07] | 29%, **1,27 [1,02 a 1,60]** |
| 150 a 179 s | 31%, **1,43 [1,12 a 1,84]** | 33%, **1,63 [1,20 a 2,22]** | 27%, 1,11 [0,81 a 1,50] |
| 180 s ou mais | 25%, 0,99 (n=44) | 27%, 1,01 (n=15) | n=5 |

Faixas finas: o melhor ponto do IG e do TT é 165 a 179 s (OR 1,56 e 1,55); no YouTube, 120 a 134 s (1,25) e 135 a 149 s (1,14). As faixas ótimas replicam nas duas metades (IG 1,15/1,22; TT 1,28/1,25; YT 1,21/1,02). No pareado, o mesmo vídeo de 120 a 149 s rende +4,0 pp mais no YouTube que no IG; o de menos de 90 s rende +5,3 pp mais no IG que no TikTok.

**Ponto ótimo:** Instagram 150 a 179 s; TikTok 150 a 179 s, e nunca abaixo de 90; YouTube 120 a 149 s, sem ganho acima de 150 s. Em palavras, use a régua do subagente de corpo (IG 450 a 500; YT 400 a 500; TT 350 a 500, evitando menos de 300); a duração inclui pausas e bloco final, então não converta segundos em palavras por conta própria. Bate com o achado deles de que, com palavras fixas, 150 a 180 s ajuda IG e TT e não o YT.

**Instrução:** "Com um arquivo só, mire 150 a 165 s (IG 1,26 a 1,56, TT 1,42 a 1,55, YT neutro). Se for cortar uma versão para o YouTube, 125 a 145 s." **Confiança:** alta para IG e TT; média para YouTube.

### D. Ordem e intervalo de postagem

- 2.071 roteiros saíram em 2 ou mais redes (IG, TT, YT). 81% saíram no mesmo dia em todas. Dos 393 escalonados, o IG saiu primeiro (sozinho ou junto) em 296 (75%); o intervalo máximo mediano é de 2 dias (1 dia em 185, 2 a 7 em 124, mais de 7 em 84). Lincoln Fracari escalona 95 de 172; Marcelo Germano 42 de 46; Cadu Neiva 36 de 62.
- **Instagram que sai depois de outra rede:** 97 vídeos, 16% de topo contra 27% no mesmo dia, OR 0,42 [0,22 a 0,79], d/v 0,60/0,64 (replica), Δ dentro do cliente -9,1 pp [-15,2 a -3,3]. Saindo 2 ou mais dias depois: 49 vídeos, 8% de topo, OR 0,19 [0,06 a 0,56]. Concentração: 58 dos 97 são do Lincoln (22% de topo); nos demais clientes, 2 de 39.
- **TikTok depois do IG:** 201 vídeos, 26% contra 26%, OR 0,88 [0,57 a 1,37]; Δ -6,6 pp [-12,1 a -1,0]. Sinal fraco.
- **YouTube depois:** 182 vídeos, 27% contra 26%, OR 1,09 [0,75 a 1,59]; 2 ou mais dias depois, 34% (OR 1,59, IC 0,91 a 2,77). O YouTube aceita atraso.
- Seleção: o vídeo da rede que saiu primeiro numa série escalonada não era muito melhor (IG 33% contra 26%, OR 1,24 [0,89 a 1,74]): não parece "testar no IG e depois replicar".

**Instrução:** "Poste o Instagram primeiro ou no mesmo dia das outras. Se precisar escalonar, atrase o YouTube, nunca o Instagram." **Confiança:** média (replica, mas pouco volume e um cliente dominante).

### E. Ajuste cliente x rede

#### E1. O "acerto" do panorama é outra régua

O campo `acerto` de `videos.json` (que alimenta `panorama.json`) é `classificacao` "acerto"/"outlier" do Oráculo, e bate exatamente com **coef acima de 3 E 10 mil views ou mais** (1.405 de 1.405 vídeos; 1 vídeo com coef 3,00 cravado fica de fora). Não é coef >= 1,5, como diz o CONTEXTO, e não é o `DESFECHOS.acerto` da lib (coef >= 1,5, que marca 39% dos vídeos contra 21%). Consequência: numa rede onde o canal tem mediana de poucas centenas de views, o acerto é quase impossível, qualquer que seja o roteiro.

#### E2. O que é canal (tamanho e decolagem), não roteiro

| conta | rede | acerto da casa | % com 10 mil+ views | % coef > 3 | views medianas (1º tri para o último) | leitura |
|---|---|---|---|---|---|---|
| Rodrigo Waughan | IG / TT / YT | 5% / 3% / 3% | 5% / 3% / 3% | 5% / 8% / 12% | IG 3.234 para 1.453; TT 547; YT 892 | no TT e no YT, 8% e 12% dos vídeos têm coef acima de 3, mas só 3% chegam a 10 mil views. Canais pequenos e sem pico (p90/p50 de 2,3 a 2,9) |
| Thiago Franco | IG / TT / YT | 16% / 4% / 3% | 40% / 4% / 3% | 16% / 13% / 6% | TT 759 para 6 (o TikTok parou de distribuir no 3º tri); YT 1.090 | TT e YT presos na régua de 10 mil |
| Izabela Anholett | YT | 46% (IG 33%, TT 28%) | 66% | 50% | YT por mês: 1.324 (fev), 4.293 (abr), 27.525 (mai), 68.671 (jun), 38.825 (set) | acerto de 0% em fev e mar, 80% em mai, 100% em jun, 89% em jul, 43% em ago e 22% em set: é a decolagem do canal (o coef divide pela mediana dos 180 dias anteriores) |
| Lincoln Fracari | TT | 43% (IG 25%, YT 24%) | 53% | 44% | TT 1.826 para 21.395; abr 75%, mai 0%, jul 67% | TikTok amplifica os picos dele (p90/p50 10,2 contra 4,7 no IG e 4,5 no YT) |
| Marcos Pelozato | TT | 6% (YT 29%, IG 19%) | 6% | 23% | TT 884 | régua de 10 mil |
| Leonardo Nogueira, Renato Mendes, Cadu Neiva, Franklin Tomich | YT | 3%, 0%, 3%, 9% | 3%, 0%, 3%, 9% | 6%, 0%, 9%, 23% | YT 1.185, 956, 1.115, 1.423 | canal de YouTube sem distribuição (Nogueira e Mendes: p90/p50 de 1,2 a 1,3, nenhum pico) |

#### E3. O que é conteúdo (bate com o perfil de cada rede)

Como o mesmo roteiro vai para as três redes, o conteúdo da conta é um só; o que muda é quanto cada rede paga por ele. Usando "% de vídeos com coef acima de 3" (tira a régua de 10 mil), YouTube menos Instagram:

| conta | YT menos IG (coef > 3) | o que o conteúdo tem (casa entre parênteses) | por que encaixa |
|---|---|---|---|
| Marcos Pelozato | +14 pts | queda de gigante 29% (6%), moeda no hook 34% (15%), protagonista empresa 66% (33%), "varejistas quebrando com dívidas bilionárias" 57% | tudo o que o YouTube paga (B1) |
| Dilson Peres | +9 pts | moeda no hook 32% (15%), empresa 46%, bastidor 45%, "empresas que venceram o governo no imposto" 88% | dinheiro no hook |
| Izabela Anholett | +17 pts | história só estrangeira 71% (38%), novidade 48% (13%), roteiro abaixo de 300 palavras 42% (14%), "Pré-MBA" 37% | estrangeiro e curto são punidos no IG e no TT e não no YT (B1, B3, B4); somado à decolagem do canal |
| Rafael Rodrigues | -4 pts | orgulho 56% (15%), estudante inventor 61% (7%) | orgulho não rende no YT (B2); acerto no YT caiu de 31% para 11% na validação |
| Marcio Grazino | -10 pts | orgulho 44%, estudante inventor 31%, vilão abstrato 46% (25%) | idem; no TT, poucos vídeos enormes (p90/p50 41) |
| Cadu Neiva | -21 pts | orgulho 74%, "empresários nordestinos que começaram do zero" 45% | idem, e YT sem audiência |
| Leonardo Nogueira | TT 41% (IG 33%, YT 3%) | mega-marca no hook 46% (27%), "carros de luxo e montadoras clássicas" 62% | mega-marca é o que o TikTok paga (B3) |
| Lincoln Fracari | TT 43% (IG 25%) | China 88%, protagonista país 56%, ponte Brasil x estrangeiro 46% (21%) | ponte com o Brasil rende no TT (B2); 58 dos 135 vídeos do IG saíram depois do TT/YT (acerto 21% contra 29%) |
| Rodrigo Waughan | 5% / 3% / 3% | sacada de marketing 34%, empresa 58%, só estrangeiro 58%, promessa "por que/como" 75%, "jogadas de marketing" 68% | nada que rede nenhuma pague: estrangeiro puro e "por que/como" são punidos no IG e no TT, e no YT falta audiência |
| Thiago Franco | 16% / 4% / 3% | "guerra dos marketplaces e o fim da loja física" 67%, empresa 48%, Brasil 61% | sem traço de rede; o problema do TT é distribuição (mediana de 6 views no 3º tri) |

**Instrução:** "Antes de culpar o roteiro por não acertar numa rede, olhe a mediana de views da conta lá: abaixo de 2 mil, o acerto da casa é quase impossível. Para conta de dinheiro e empresa, priorize o YouTube; para conta de orgulho e estudante inventor, priorize IG e TikTok e não espere o YouTube." **Confiança:** alta para a régua e a decolagem; média para o conteúdo (16 contas, sem teste formal entre contas).

### F. Facebook

276 vídeos: Izabela Anholett 213, Renato Torres 55, Marcelo Germano 8. Acerto da casa 25%, coef mediano 1,33, views medianas 18 mil, sem duração na base. Sai no mesmo dia do IG em 96% dos casos. O percentil do mesmo roteiro segue o IG (0,62 na Izabela) e o TikTok (0,66 na Izabela); no Renato Torres, FB e IG são independentes (0,06).
- "Você" no hook derruba no Facebook: 8% de topo contra 29%, OR 0,20 [0,06 a 0,67], replica (n=40). Subhook que puxa o espectador: 6% contra 28%, OR 0,17 [0,04 a 0,73] (n=32). As duas coisas também atrapalham nas outras redes, mais fraco.
- Só na Izabela (não é "de rede"): conteúdo prático rende relativamente melhor no FB que no IG (utilidade prática -7,4 pp, promessa de ensinar -18,9 pp, payoff vantagem -13,4 pp; negativo = melhor no FB). Hipótese: público do FB quer a ferramenta.

**Instrução:** "No Facebook, trate como Instagram, sem 'você' no hook e sem subhook que chama o espectador." **Confiança:** baixa (um cliente).

### G. Recomendações de adaptação: o que mudar quando o mesmo roteiro vai para outra rede

Hoje nada muda: mesmo arquivo, mesmo hook, mesmo comando, mesmo dia. Estas são as mudanças que o dado sustenta (as reescritas são aplicações; nenhuma versão adaptada foi medida, porque a casa não as produz).

| alavanca | Instagram | TikTok | YouTube Shorts |
|---|---|---|---|
| **Hook** | Nome na abertura; ponte com o Brasil se a história é de fora; sem "você"; sem promessa de ensinar ou alerta | O nome que o público reconhece (marca, pessoa, Trump, EUA) na primeira linha; vilão com rosto, nunca "o problema" | Valor em R$ ou dólares no hook; história estrangeira pura pode ir; "Por que...?" e "Uma das..." (subagente de hook) |
| **Payoff e tema** | Orgulho com régua de fora, Davi contra Golias, novidade | Orgulho, gigante nomeado, carro chinês; evite biografia de marca global | Queda de gigante, dinheiro, empresa; não aposte em orgulho, estudante inventor, nostalgia |
| **Subhook** | Eleve a aposta com um dado | Eleve a aposta | Volta no tempo e contradição funcionam aqui |
| **Conclusão** | (sem diferença de rede medida) | (idem) | Virada final (+9 pp contra IG e TT) |
| **Duração** | 150 a 179 s; o curto perde menos aqui | 150 a 179 s; nunca abaixo de 90 s; 300 a 449 palavras já bastam | 120 a 149 s; nada acima de 150 s |
| **Comando** | "Me segue"; pedir para mandar a alguém dá compartilhamento, não alcance | "Me segue" | A casa diz "segue" em 73% dos vídeos e "se inscreve" em 7: teste "se inscreve no canal" como experimento; não peça comentário (subagente de comando: 0,61) |
| **Postagem** | Primeiro ou no mesmo dia (depois das outras: 16% contra 27% de topo) | Mesmo dia | Pode sair depois |

Exemplo completo de adaptação, roteiro real de Dilson Peres (IG p100, TT p0, 287 palavras, 88 s): "A Havan fez um pix pros funcionários de 90 milhões de reais e quase ninguém ficou sabendo."
- Instagram: fica como está (curto perde menos aqui; moeda custa pouco, OR 0,75).
- TikTok: alongar para 350 a 450 palavras e 150 s ou mais; tirar o valor do hook e abrir com o nome e o lado: "A Havan fez com os funcionários o que nenhuma empresa grande do Brasil teve coragem de fazer."
- YouTube: manter o valor no hook e fechar com virada; 125 a 145 s.

## 3. O que os playbooks atuais afirmam e o dado confirma, corrige ou desmente

| playbook e regra | o dado | veredito |
|---|---|---|
| Nenhum dos cinco (hook v3, comando v2, checklist v3, style_guide v4, storytelling v1) tem regra por rede | O mesmo roteiro rende diferente de forma previsível: moeda no hook (+8 a +9 pp no YT), orgulho (-7 a -11 pp no YT), nome próprio (+3 a +6 pp no TT) | **Lacuna:** criar o playbook "plataformas" com a tabela G |
| hook.md, Ultra Especificidade: "Fraco contra forte: 'ganhou muito dinheiro' (ruim) / 'lucrou 12 milhões' (bom)" | Moeda no hook: YT 1,49, IG 0,75, TT 0,72; número em geral neutro nas três | **Corrige:** valor em dinheiro no hook é regra do YouTube; no IG e no TT, leve o valor para o subhook |
| checklist.md: "150 palavras = 60 s; 430 palavras = 180 s; acima de 430, eliminado" | Ótimo em 150 a 179 s no IG e no TT e em 120 a 149 s no YT; o TT pune abaixo de 90 s | **Desmente** a conversão e o teto (junto com o subagente de corpo); o teto de 430 corta a faixa ótima do IG e do TT |
| comando.md: ação "segue, me segue, já segue o perfil" usada em todas as redes | No YouTube "segue" é 73% dos vídeos e não mexe no coef (OR 0,89); "se inscreve" quase não existe (7 vídeos) | **Não dá para julgar:** falta a versão do YouTube; testar |
| comando.md, Propósito: "Manda esse vídeo para quem vive na Europa" | No IG, pedido de envio não move o coef (OR 1,57 [0,87 a 2,82]); move compartilhamento (OR 3,1, subagente de comando) | **Confirma em parte:** use para compartilhamento, não espere alcance |
| hook.md, antipadrões: abertura genérica ("você sabia que") | "Você" no hook: 0,81 / 0,74 / 0,78 e Facebook 0,20 (replica) | **Confirma** e o Facebook é onde mais pesa |

## 4. O que NÃO deu para afirmar

- **Adaptação real por rede:** a base quase não tem. Duração igual em 97 a 100% dos pares, fim falado igual em 92%, 23 roteiros com CTA por plataforma no CRM. Todo efeito "de rede" aqui é a mesma peça medida em públicos diferentes; o ganho de produzir versões é hipótese a testar.
- **Comando por rede:** "se inscreve" no YouTube tem 7 vídeos. Sem medida.
- **Ordem de postagem:** o Instagram atrasado são 97 vídeos, 58 deles do Lincoln (só 6 clientes têm 3 ou mais vídeos nos dois grupos). O TikTok atrasado tem Δ -6,6 pp com OR sem significância.
- **Comparações múltiplas:** 45 de 328 testes pareados passaram e 16 seriam esperados por acaso. Itens que aparecem num par só e com poucos clientes são hipótese: nostalgia (n=26 a 40), biografia de marca global (não replica na validação), superação e antagonista governo melhores no YT que no IG, protagonista país melhor no IG que no YT (não replica), promessa de ensinar.
- **Territórios de poucos clientes:** estudante inventor (Rafael, Marcio, Cadu) e inovação verde do Nordeste (Marcio, Cadu): o efeito vale dentro dessas contas.
- **Cliente x rede:** a explicação por conteúdo é consistente com os perfis, mas são 16 contas e o acerto da casa é dominado por tamanho e decolagem do canal. Não é teste formal.
- **Por que o YouTube paga moeda e queda:** o YouTube não tem retenção nem compartilhamento na base; não dá para saber se é busca, público ou formato.
- **Facebook:** um cliente (Izabela) é 77% da amostra; o pareado IG x FB só tem ela.
- **Retenção por rede:** só o Instagram tem volume; nada aqui diz qual rede segura melhor os 3 s.
