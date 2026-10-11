# Embeddings dos roteiros: territórios de tema, repetição, modelagem e pares

Estudo 2026-10, frente de embeddings. Base: 2.809 roteiros VM com embedding (gemini-embedding-001 do CRM) e 6.305 vídeos analisáveis de Instagram, TikTok e YouTube. Desfecho principal `coef`: vídeo no quartil de cima do coeficiente viral dentro de cliente x rede x trimestre (base 26%). Nenhum token de LLM em massa: só cosseno, k-means e a régua `src/lib.mjs`.

## Resumo em 10 linhas

1. O tema pesa mais que a fórmula: dentro do mesmo cliente, só o território do roteiro leva a chance de topo de 11% a 49%.
2. Carro chinês humilhando a montadora tradicional (BYD, Geely contra Corolla, Volkswagen) é a pauta mais segura da casa: 47% de topo, OR 2,96, em 4 de 4 clientes, nas 3 redes, nos dois períodos, e não saturou com o volume mais que dobrando.
3. Futebol só funciona pelo dinheiro do clube (a dívida do Palmeiras, a patrocinadora que virou presidente, a dívida do Romário): 49% de topo, OR 3,24, em 3 de 3 clientes. Seleção e Copa ficam em 21%.
4. Estudante inventor funciona quando resolve com lixo ou centavos o que a indústria não resolveu (35% de topo, OR 1,74, 3 de 3 clientes). "Venceram um torneio" sozinho fica em 22%. E esse território está saturando.
5. Evite como premissa: fundador que vendeu a empresa por milhões (13% de topo, OR 0,43, ruim em 8 de 8 clientes), biografia de marca global no estilo "o segredo da Starbucks" (19%, OR 0,61), marca feia que virou desejo (11%, OR 0,36), série Pré-MBA (OR 0,66).
6. Acertou? Faça a continuação em até 3 semanas: a primeira repetição de um acerto nesse prazo dá 47% de topo (OR 2,62). Entre 3 semanas e 3 meses, repetir de novo não ganha nada (27%). Depois de 90 dias o tema volta a render (37%, OR 1,73).
7. Não repita o tema de um fracasso do cliente (20% de topo, OR 0,69) nem tema que já falhou em outro cliente da casa (OR 0,77). Repetir tema de acerto rende OR 1,41 e sobrevive ao controle de território. Vale no Instagram e no TikTok; no YouTube não muda nada.
8. Modelagem é regra em Tecnologia e IA (OR 1,64; 1,90 depois de julho). Fora de Tecnologia, pagou até junho (1,48) e desde julho virou negativa no conjunto (OR 0,74), puxada por quatro clientes, três deles modelando quase tudo; sem eles, neutra.
9. O ganho da modelagem não vem do tema copiado: controlando território, o OR sobe de 1,23 para 1,42. Vem da forma: o modelado segura a retenção até o fim (OR 1,52) e não ganha em compartilhamento. Link de origem do Instagram funciona (OR 1,24); do TikTok, não se separa (1,11).
10. Para a leitura contrastiva: 260 pares vencedor x perdedor do mesmo cliente, mesma rede e mesmo território, de 27 clientes, em `data/pares.json`; os territórios de cada roteiro em `data/clusters.json`.

## Como foi feito

1. **Dimensão.** Truncar o embedding para as 768 primeiras dimensões e renormalizar preserva **89,8%** dos 10 vizinhos mais próximos da versão 3072 (200 roteiros sorteados; pior roteiro 60%). Com 512 seriam 79,8%; com 1536, 95,5%. Tudo abaixo usa 768.
2. **Similaridade crua, validada contra o CRM.** Testei descontar a média de cada cliente (para tirar o "Eu sou fulano" e o estilo da conta): piorou. Entre os 3% de pares mais parecidos dentro do cliente, o cosseno cru dá personagem em comum (campo `personagens` do CRM) em 49% dos pares e tópico em comum em 87%; o centrado, 39% e 81%.
3. **Dois limiares de "mesmo tema".** Dentro do mesmo cliente o cosseno vem inflado pelo estilo (mediana 0,72 contra 0,66 entre clientes). Mesmo tema dentro do cliente: cosseno >= 0,80 (os 3% mais parecidos do cliente). Entre clientes: >= 0,76 (os 0,5% mais parecidos), onde já há personagem em comum em 37% dos pares e tópico em comum em 75%.
4. **Territórios.** k-means esférico com k-means++, 6 sementes por k, fiquei com a de maior coesão (k=30: 0,854; k=60: 0,861). Nome escrito à mão a partir dos 8 títulos mais próximos do centróide.
5. **Medida.** `avaliar` (coef, por rede, descoberta antes de 01/07 x validação depois) e `porGrupo` por cliente (mínimo 10 vídeos do cliente no território). **Global**: OR de Mantel-Haenszel com IC acima de 1 e OR > 1 em pelo menos 60% dos clientes medidos (2 ou mais). **Do cliente**: um cliente tem 75% ou mais dos roteiros do território, ou é o único medido.
6. **Cuidado.** 12 dos 30 territórios (17 dos 60) têm mais de 80% dos roteiros de um só cliente: o nicho do cliente é o tema. Nesses, o efeito vale "dentro daquele cliente".

## Achado 1. Três territórios que funcionam em vários clientes (regras globais)

### 1a. Carro chinês humilhando a montadora tradicional

- **O que:** BYD, Geely e outras chinesas que já estão no Brasil tirando o trono de Corolla, Volkswagen, Toyota, Tesla.
- **Número:** k=60, 66 roteiros, **47% de topo** contra base de 26%. Lift Instagram 1,76, TikTok 1,64, YouTube 2,12. **OR MH 2,96 [2,08 a 4,21]**. Lift na descoberta 2,00 e na validação 1,79: replica. OR > 1 em 4 de 4 clientes medidos: Leonardo Cirino 7,87, Renato Mendes 7,46, Leonardo Nogueira 1,76, Lincoln Fracari 1,33 (topos também em Thiago Bisewski e Pedro Elero). No k=30 (80 roteiros): OR 2,55 [1,85 a 3,51], 4 de 6 clientes.
- **Não depende de citar a China no hook:** com China no hook, OR 3,37; sem, OR 2,17 (os dois replicam). E parte do efeito "hook que cita China" da bateria de sanidade (OR 1,81) é este território: fora de carro chinês, China no hook cai para OR 1,41.
- **Onde vale:** global (tecnologia, carros, negócios), nas 3 redes, e é um território em crescimento que não saturou (achado 6).
- **Exemplos reais:**
  - Renato Mendes, TikTok, coef 482,9: "A China declarou guerra ao carro mais amado do Brasil. E em agosto o Corolla perdeu o trono pela primeira vez na história."
  - Pedro Elero, TikTok, coef 486,2: "Essa marca de carros que já está no Brasil acabou de fazer o impossível: ela criou um sistema que faz 45 km com apenas 1 litro de gasolina."
  - Thiago Bisewski, YouTube, coef 713,4: "A China acabou de humilhar o resto do mundo mais uma vez e agora foi dando uma facada no coração da indústria automobilística."
  - Contraexemplo, Lincoln Fracari, Instagram, coef 0,26: "Elon Musk riu desses caras em 2011, mas acabou quebrando a cara!" (o rival é um bilionário distante; os topos põem no ringue o carro que o brasileiro conhece ou o ganho no bolso).
- **Instrução para o playbook:** "Pauta de carro chinês é a aposta de tema mais segura para clientes de tecnologia, carros e negócios. Ponha no ringue o carro que o brasileiro tem na garagem ou o ganho no bolso. Fraco: 'A China pisou no Elon Musk.' Forte: 'A China gastou bilhões para humilhar o Corolla.'"

### 1b. Futebol: o dinheiro do clube, não a Seleção

- **O que:** dívida de clube, dono estrangeiro, contrato, presidente, patrocinador; craque endividado.
- **Número:** "Bastidores do dinheiro nos clubes de futebol" (k=60): 42 roteiros, **49% de topo**. Lift Instagram 1,95, TikTok 2,05, YouTube 1,68. **OR MH 3,24 [2,16 a 4,87]**. Descoberta 1,82, validação 1,94: replica. OR > 1 em 3 de 3 clientes: Pedro Elero 5,16, Rafael Rodrigues 2,68, Manoel Victor 1,68. O vizinho "Copa do Mundo, Seleção e patrocínios" (41 roteiros): **21% de topo**, OR 0,75 [0,46 a 1,24], e piorou na validação (lift 0,58).
- **Onde vale:** global entre os clientes que tocam futebol, nas 3 redes.
- **Exemplos reais:**
  - Pedro Elero, TikTok, coef 452,95: "Ela foi ao Palmeiras para colocar o nome da empresa na camisa do clube. Acabou ficando com o cargo mais alto da história do time (...)"
  - Fernando Pereira, YouTube, coef 19,56: "Por que um dos maiores craques da história tem uma dívida de milhões que a Justiça tenta cobrar há mais de 20 anos e ainda não conseguiu?"
  - Contraexemplo, Pedro Elero, YouTube, coef 0,09: "O Neymar não é mais jogador de futebol! É isso que muito jornalista diz por aí e talvez eles estejam certos."
- **Instrução para o playbook:** "No futebol, a pauta é o dinheiro do clube: dívida, dono, contrato, presidente, patrocínio. Seleção e Copa como premissa não sustentam. Fraco: 'O Neymar se aposentou?!' Forte: 'A dívida insana do Palmeiras.'"

### 1c. Estudante inventor: a solução barata que a indústria não achou, não o prêmio

- **O que:** estudante ou adolescente que resolve com lixo, sucata ou centavos um problema caro que a indústria ou o governo não resolveu.
- **Número:** "Estudantes que resolvem problemas com lixo barato" (k=60): 89 roteiros, **35% de topo**. Lift Instagram 1,39, TikTok 1,49, YouTube 1,15. **OR MH 1,74 [1,29 a 2,34]**. Descoberta 1,62, validação 1,17: replica, mas caindo. OR > 1 em 3 de 3 clientes: Rafael Rodrigues 1,86, Marcio Grazino 1,75, Cadu Neiva 1,27. O vizinho "Alunos brasileiros premiados em robótica e ciência" (87 roteiros): **22% de topo**, OR 0,75 [0,53 a 1,07].
- **Onde vale:** global nos clientes de inovação e educação (Rafael Rodrigues, Marcio Grazino, Cadu Neiva), Instagram e TikTok mais que YouTube.
- **Exemplos reais:**
  - Marcio Grazino, Instagram, coef 124,35: "Três estudantes de escola pública no interior da Bahia fizeram o que a indústria do chocolate não fez em 50 anos."
  - Marcio Grazino, TikTok, coef 81,68: "Essa baiana pegou os restos de lixo e criou um produto que as grandes indústrias cobram fortunas pra vender"
  - Rafael Rodrigues, Instagram, coef 438,39 (mesmo dentro do território dos premiados, o topo usa o ângulo do lixo contra a gigante): "Enquanto as gigantes gastam bilhões para criar tecnologia, esse jovem de 20 anos criou uma concorrente da Apple usando restos de lixo."
  - Contraexemplo, Rafael Rodrigues, YouTube, coef 0,03: "Essas seis garotas do Maranhão provaram que o futuro da tecnologia é feminino, tem sotaque nordestino e se constrói com peças de LEGO." (prêmio e orgulho, sem problema resolvido).
  - Não é garantia, Cadu Neiva, Instagram, coef 0,05: "Enquanto o governo investe bilhões pra combater a dengue, dois adolescentes do Ceará resolveram o problema com trinta e seis centavos."
- **Instrução para o playbook:** "Na pauta de estudante, o payoff é o problema caro resolvido com lixo ou centavos, contra uma gigante que não resolveu. O prêmio entra como prova no corpo, nunca como premissa. Fraco: 'Meninas do Maranhão venceram um enorme torneio de robótica.' Forte: 'Três estudantes de escola pública no interior da Bahia fizeram o que a indústria do chocolate não fez em 50 anos.' Dose: o território está saturando (achado 6)."

## Achado 2. Territórios que funcionam só num cliente

- **Impostos por trás da fortuna de famosos (Ricardo Schumacher e Dilson Peres).** 68 roteiros, **41% de topo**, **OR 3,99 [1,92 a 8,29]**, replica (descoberta 2,03, validação 1,41). Mais forte no TikTok (lift 3,10) e no YouTube (3,87) que no Instagram (1,16). Ricardo: OR 1,92 (58 roteiros). Dilson: só 5 roteiros aqui, mas lift 3,25, enquanto o território de sempre dele, "Empresas que venceram o governo no imposto" (79 roteiros), tem **OR 0,40**.
  - Dilson Peres, YouTube, coef 237,78: "O Silvio Santos fez uma jogada genial que evitou qualquer dor de cabeça para sua família."
  - Dilson Peres, TikTok, coef 115,71: "Esse homem recebe em torno de 4 milhões por mês da Globo e, mesmo assim, o salário não explica nem metade da fortuna dele."
  - Ricardo Schumacher, TikTok, coef 133,54: "O Ratinho agora virou Paraguaio! Só que tem um detalhe nessa história que pode custar caro pra quem tá pensando em fazer o mesmo."
  - Contraexemplos, empresa no lugar do famoso: Dilson Peres, YouTube, coef 0,06: "Foi assim que a Netflix descobriu como não pagar impostos por ANOS."; Ricardo Schumacher, Instagram, coef 0,33: "A GOL recebeu ajuda do governo e agora paga menos impostos."
  - **Instrução:** "No tributário, o personagem é o famoso (Silvio Santos, Luciano Huck, Ratinho), não a empresa. Fraco: 'Foi assim que a Netflix descobriu como não pagar impostos por ANOS.' Forte: 'Esse homem recebe em torno de 4 milhões por mês da Globo e, mesmo assim, o salário não explica nem metade da fortuna dele.'"
- **China tirando o emprego ou o mercado de alguém (Lincoln Fracari).** "China humilhando o mundo com robôs e tecnologia": 69 roteiros, 33% de topo, **OR 1,66 [1,12 a 2,47]**, replica. Na mesma conta, curiosidade chinesa sem ameaça não funciona ("Costumes e curiosidades do cotidiano chinês", OR 0,73).
  - Lincoln Fracari, Instagram, coef 28,96: "A China está acabando com os personal trainers e destruindo um mercado de 45 bilhões de dólares."
  - Contraexemplo, Lincoln Fracari, YouTube, coef 0,37: "A China criou um animal de estimação imortal e ele pode ser seu."
  - **Instrução:** "Para Lincoln, a China precisa estar tirando algo de alguém (emprego, mercado, liderança). Curiosidade exótica sozinha não basta."
- **Indústria de Santa Catarina nascida no quintal (Marcelo Germano).** 57 roteiros, 36% de topo, **OR 1,86 [1,13 a 3,07]**, replica. O território vizinho genérico "De vendedor humilde a dono de império" não funciona para ele (OR 0,94).
  - Marcelo Germano, TikTok, coef 39,13: "Esses dois vizinhos passaram 70 anos tentando destruir um ao outro, mas acabaram se casando." (Sadia e Perdigão)
  - Marcelo Germano, Instagram, coef 22,87: "Essa mãe viúva pegou alguns pedaços de pano para não deixar os filhos passarem fome... e acabou dominando o mercado de travesseiros da América Latina."
- **Lula, eleição e candidatos de 2026 (Fernando Pereira).** 20 roteiros, 45% de topo, OR 2,60 [1,26 a 5,40]. Só existe no período de validação: hipótese, sem replicação.

## Achado 3. Territórios para evitar

- **Fundador que vendeu a empresa por milhões.** k=30: 105 roteiros, **13% de topo** (metade da base). Lift Instagram 0,53, TikTok 0,48, YouTube 0,56. **OR MH 0,43 [0,30 a 0,62]**; descoberta 0,54, validação 0,50: replica. OR < 1 em **8 de 8 clientes** (Rafael Rodrigues 0,23, Thiago Franco 0,26, Marcio Grazino 0,26, João Paulo Albuquerque 0,33, Fernando Pereira 0,41, Marcelo Germano 0,43, Rodrigo Waughan 0,82; Manoel Victor sem nenhum topo). No k=60: 15% de topo, OR 0,52, 7 de 8 clientes.
  - Rodrigo Waughan, YouTube, coef 0,01: "Esse homem pagou plano de saúde para quem limpava chão e ficou bilionário por causa disso."
  - Thiago Franco, YouTube, coef 0,14: "Esse ex-funcionário do Bill Gates criou uma máquina de imprimir dinheiro dentro da empresa"
  - A exceção que escapa tem uma gigante em pânico como antagonista (hipótese, não medida): Rodrigo Waughan, TikTok, coef 54,61: "Esse garoto de 17 anos registrou um site com o próprio nome, mas acabou fazendo a Microsoft entrar em pânico."
- **De vendedor humilde a dono de império.** 126 roteiros, 22% de topo, OR 0,76 [0,54 a 1,07], OR < 1 em 6 de 6 clientes. Indício, sem significância. Fraco: Café com Ferri, YouTube, coef 0,07: "O Véio da Havan transformou uma loja de tecidos em um império de R$18,5 bilhões. (...)"
- **Biografia de marca global ("o segredo da Starbucks, da Red Bull, da Patagonia").** k=30: 144 roteiros, **19% de topo**. Lift Instagram 0,79, TikTok 0,58, YouTube 0,80. **OR MH 0,61 [0,45 a 0,84]**, replica; OR <= 1 em 6 de 7 clientes (Renato Mendes 0,47, Pedro Elero 0,49, Thiago Franco 0,55, Renato Torres 0,61, Manoel Victor 0,82).
  - Marcio Grazino, YouTube, coef 0,01: "O segredo que faz o mundo inteiro querer ir a Paris não é a Torre Eiffel, mas sim uma estratégia secreta que quase ninguém conhece"
  - Manoel Victor, YouTube, coef 0,02: "Nos anos 2000, a Oakley não era apenas uma marca de óculos, mas sim um fenômeno cultural (...)"
  - As exceções têm fato bizarro concreto ou marca brasileira humilhando a gringa: Pedro Elero, YouTube, coef 1.237,7: "Essa marca de tênis manda uma faca de verdade dentro da caixa. E pede para você destruir o produto que acabou de comprar."; Marcio Grazino, TikTok, coef 740,2: "Você tinha vergonha de usar Olympikus na escola. Hoje em dia, ela humilha a Nike e a Adidas no Brasil."
- **Marca feia ou falida que virou desejo.** k=60: 48 roteiros, **11% de topo**, **OR 0,36 [0,19 a 0,69]**, replica, ruim em 4 de 4 clientes (Renato Torres 0,14).
- **Série Pré-MBA (Izabela Anholett e satélites).** k=30: 208 roteiros, 21% de topo, **OR 0,66 [0,50 a 0,88]**, replica; lift caiu de 0,93 (descoberta) para 0,55 (validação). A casa já cortou de 10% para 5% da produção.
- **Do cliente, evitar:** "Empresas que venceram o governo no imposto" (Dilson Peres, 79 roteiros, OR 0,40); "Chocolates e doces que viraram fortuna" (OR 0,47; Rodrigo Waughan 0,56); "Dívida pública e governo empobrecendo o brasileiro" (k=60, OR 0,60 [0,38 a 0,95]: Fernando Pereira 0,62, Marcos Pelozato 0,33).
- **Instrução para o playbook:** "Evite como premissa: fundador que vendeu a empresa por X milhões, de vendedor humilde a bilionário, o segredo de uma marca global, marca feia que virou desejo. Se o cliente pedir o tema, troque a biografia pela briga ou pelo fato bizarro: a gigante em pânico, a marca brasileira humilhando a gringa, a faca dentro da caixa do tênis. Fraco: 'Oakley.' / 'O segredo obscuro de Paris.' Forte: 'O tênis indiano que vem com uma faca.'"

## Achado 4. Repetição e novidade: a regra de pauta

Para cada roteiro: o mais parecido entre os roteiros ANTERIORES do mesmo cliente (por data de postagem) e de outros clientes, e se esse anterior foi topo ou fraco. Topo e fraco = quartis do pq médio do roteiro nas redes (>= 0,69 e <= 0,30). Só conta como "resultado conhecido" o anterior que já estava no ar quando o novo roteiro foi entregue.

| situação do roteiro novo | roteiros | % topo | OR MH [IC95] | descoberta / validação | leitura |
|---|---|---|---|---|---|
| parecido (>= 0,80) com um **acerto** anterior do cliente | 457 | 31% (resto 25%) | **1,41 [1,21 a 1,63]** | 1,13 / 1,25 | ajuda (replica) |
| parecido com um **fraco** anterior do cliente | 260 | 20% (resto 26%) | **0,69 [0,56 a 0,86]** | 0,85 / 0,72 | atrapalha (replica) |
| os dois acima, controlando território (cliente x rede x k=30) | | | acerto 1,24 [1,05 a 1,46]; fraco 0,74 [0,59 a 0,93] | | sobrevive |
| **1ª repetição** do acerto, até 21 dias depois dele | 32 | **47%** | **2,62 [1,67 a 4,10]** | 2,35 / 1,36 | ajuda (replica) |
| 1ª repetição, de 21 a 90 dias | 58 | 31% | 1,28 [0,89 a 1,85] | | sem evidência |
| 2ª repetição em diante, até 21 dias | 32 | 31% | 1,31 [0,81 a 2,11] | | sem evidência |
| 2ª repetição em diante, de 21 a 90 dias | 252 | 27% | 1,07 [0,88 a 1,30] | | sem evidência |
| 2ª repetição em diante, 90 dias ou mais | 78 | **37%** | **1,73 [1,27 a 2,36]** | 1,35 / 1,44 | ajuda (replica) |
| quase cópia de um roteiro anterior do cliente (cosseno >= 0,87) | 160 | 31% | 1,38 [1,09 a 1,74] | 1,30 / 1,12 | ajuda (replica) |
| 8 ou mais roteiros anteriores do cliente no mesmo tema | 179 | 24% | 0,87 [0,69 a 1,11] | 0,80 / 1,01 | sem evidência (Instagram 0,76) |
| parecido (>= 0,76) com **acerto de outro cliente** | 805 | 28% | 1,17 [1,03 a 1,33]; com território 1,11 [0,97 a 1,28] | 1,10 / 1,07 | fraco, some com território |
| parecido com **fraco de outro cliente** | 698 | 22% | **0,77 [0,67 a 0,88]**; com território 0,77 [0,67 a 0,90] | 0,90 / 0,83 | atrapalha (replica) |

- **Novidade não é virtude por si:** nas faixas de "quão parecido com o passado do cliente" abaixo de 0,87, nenhuma se separa (OR entre 0,91 e 1,15, todos com IC cruzando 1). O que importa é se o tema parecido deu certo ou errado antes.
- **Robustez:** classificando o anterior pelo resultado na mesma rede do vídeo novo, dá o mesmo: acerto 33% de topo (OR 1,56 [1,32 a 1,86]), fraco 20% (OR 0,68 [0,53 a 0,87]).
- **Por rede:** repetir tema de acerto tem lift 1,29 no Instagram e 1,25 no TikTok; no YouTube, 0,99. Repetir tema de fraco: 0,68 no Instagram, 0,71 no TikTok, 1,00 no YouTube. No YouTube Shorts a sequência não conta.
- **Transferência entre contas:** o acerto de outro cliente quase não transfere (OR 1,11 com território, sem significância; mesmo macro nicho 1,11, outro macro 1,18). O fracasso transfere: tema que já falhou em outro cliente da casa falha de novo (OR 0,77).
- **Exemplos reais:**
  - Continuação rápida que acertou: Pedro Elero, "A dívida insana do Palmeiras" (pq médio 0,87) e 8 dias depois "Foi patrocinar o time do marido, virou presidente" (0,92). Leonardo Cirino, "Essa empresa chinesa está usando IA para dominar o mundo" (0,80) e 12 dias depois "A Toyota transformou a ameaça da China em combustível" (0,87). Fernando Pereira, "40 Dias para o Petróleo Acabar" (0,93) e 9 dias depois "Saudi Aramco - Alerta da Maior Empresa de Petróleo" (0,98).
  - Retorno depois de 90 dias que acertou: Izabela Anholett, "Apple em guerra com Mark Zuckerberg" (0,89) e 132 dias depois "Mark Zuckerberg em guerra com a Apple" (0,97). Thiago Franco, "O Brás MORREU" (0,91) e 118 dias depois "Estão matando as lojas de esquina!" (1,00).
  - Repetição na zona morta (21 a 90 dias, com 3 ou mais repetições antes): Lincoln Fracari, "Na China, a IA declarou guerra aos atores" (0,81) e 37 dias depois "A IA está destruindo os atores na China" (0,06). Thiago Franco, "A 25 de março morreu DE VEZ" (0,75) e 78 dias depois "O conselho que está quebrando quem vende online" (0,01).
  - Repetiu um fracasso: Izabela Anholett, "Pré-MBA: O fim do trabalho como conhecemos" (0,10) e depois "Pré-MBA: Quem erra nisso fica humilhantemente atrasado" (0,06).
- **Instrução para o playbook (regra de pauta):** "1. Acertou, faça a continuação em até 21 dias: mesmo território, fato novo. 2. Da segunda repetição em diante, espere 90 dias para voltar ao tema; entre 3 semanas e 3 meses, repetir não ganha nada. 3. Tema que deu fraco no cliente não volta, e tema que já falhou em outro cliente da casa também não. 4. Roteiro inédito para o cliente não rende mais por ser inédito. 5. No YouTube essa regra não vale: lá a pauta é livre."

## Achado 5. Modelagem: o veredito

- **Efeito geral:** 2.869 vídeos modelados, 28% de topo contra 24%, **OR 1,23 [1,09 a 1,40]**, replica pela régua, mas a validação quase zerou (lift 1,13 na descoberta, 1,01 na validação). Por trimestre: OR 1,60 no 1º, 1,52 no 2º, **1,03 no 3º**.
- **Por macro nicho:** Tecnologia, IA e inovação **OR 1,64 [1,33 a 2,02]** (419 roteiros); Negócios, marcas e cases 1,09 [0,89 a 1,33]; Dinheiro, economia e geopolítica 0,99 [0,76 a 1,28]; Entretenimento 0,97.
- **Por período e nicho (o achado central):** Tecnologia 1,49 [1,11 a 1,99] na descoberta e **1,90 [1,38 a 2,61]** na validação. Fora de Tecnologia, 1,48 [1,18 a 1,86] na descoberta e **0,74 [0,59 a 0,93]** na validação (0,74 também controlando território). Tirando os 4 clientes com OR negativo (Pedro Elero, 53 de 68 roteiros modelados; Renato Mendes, 40 de 55; Thainá Iansen, 22 de 27; e Túlio Lichenstein, 14 de 49), fora de Tecnologia a validação fica neutra: 1,06 [0,81 a 1,39].
- **Por cliente (26 com 15 ou mais vídeos modelados):** OR > 1 em 14. Fortes e significativos: Izabela Anholett 2,95 [1,93 a 4,52] (143 de 221 roteiros modelados), Franklin Tomich 2,96, Renato Torres 3,30, Dilson Peres 2,02, Thiago Franco 1,90. Negativos e significativos: Pedro Elero 0,30, Renato Mendes 0,36, Thainá Iansen 0,20, Túlio Lichenstein 0,33; Lincoln Fracari 0,64 [0,40 a 1,02] no limite.
- **Por rede de postagem:** Instagram OR 1,34 [1,10 a 1,63] (sem replicação: validação 1,00), YouTube 1,25 [0,99 a 1,57], TikTok 1,09 [0,87 a 1,37].
- **Pela rede de origem do link:** Instagram **OR 1,24 [1,08 a 1,41]**, replica (2.057 vídeos); TikTok 1,11 [0,93 a 1,34] (681 vídeos); YouTube 0,34 (28 vídeos) e notícia ou X 0,83 (84 vídeos), amostras pequenas. Cruzando: link do Instagram postado no YouTube 1,40 [1,09 a 1,79] (replica) e no Instagram 1,32 [1,07 a 1,62]; no TikTok, 1,01. Link do TikTok não se separa em rede nenhuma.
- **Some quando se controla território? Não, cresce:** cliente x rede 1,23; + território k=30 **1,35 [1,17 a 1,55]**; + território k=60 **1,42 [1,23 a 1,65]**; + trimestre 1,25; + faixa de novidade 1,30; + território e trimestre 1,35. O modelado não vence por escolher tema melhor; vence dentro do mesmo tema. (E é ligeiramente mais novo para o cliente: mediana da maior similaridade com o passado 0,789 contra 0,797.)
- **Em que o modelado ganha:** retenção até o fim **OR 1,52 [1,17 a 1,97]** (replica), retenção no hook 1,43 e no subhook 1,44 (retenção existe quase só no Instagram), acerto absoluto (coef >= 1,5) 1,27 (replica). Compartilhamento 0,99, seguidores 1,24 (sem significância), comentários 0,86.
- **Exemplos reais:**
  - Thiago Bisewski, YouTube, coef 713,4, link do Instagram: "A China acabou de humilhar o resto do mundo mais uma vez e agora foi dando uma facada no coração da indústria automobilística."
  - Izabela Anholett, YouTube, coef 340,3, link do Instagram: "A China agora está destruindo os computadores!"
  - Leonardo Martins, Instagram, coef 232,3, link do Instagram: "Esse equipamento faz um barco parar de balançar, mesmo com o mar agitado."
  - Contraexemplo fora de Tecnologia, validação: Thainá Iansen, YouTube, coef 0,09, link do Instagram: "A Beyoncé te enganou e o segredo do império dela não é só talento." (biografia de marca, o território do achado 3).
- **Veredito:** modelagem é regra em Tecnologia e IA, com link do Instagram, e o ganho é de execução (retenção), não de tema. Fora de Tecnologia, deixou de pagar a partir de julho; nos clientes que modelam quase toda a pauta (Pedro Elero, Renato Mendes, Thainá Iansen), atrapalha.
- **Instrução para o playbook:** "Em Tecnologia e IA, modele: parta de um vídeo que já funcionou no Instagram e copie a forma (ordem das revelações, ritmo, onde cai a virada), não só o assunto. Fora de Tecnologia, a modelagem não é atalho: use quando o vídeo de origem tem fato bizarro ou briga, e nunca como regra para 100% da pauta de um cliente."

## Achado 6. Saturação de tema (bônus)

Volume = % dos roteiros da casa no período; OR MH na descoberta (antes de 01/07) e na validação.

| território | volume | % topo | OR descoberta | OR validação | leitura |
|---|---|---|---|---|---|
| Estudantes que resolvem problemas com lixo barato | 2,5% para 3,8% | 42% para 30% | 2,55 [1,60 a 4,08] | 1,36 [0,90 a 2,07] | **saturando**: volume subiu, vantagem caiu pela metade |
| Crianças cearenses premiadas em olimpíadas mundiais | 1,7% para 2,7% | 40% para 26% | 2,14 [1,25 a 3,67] | 1,04 [0,66 a 1,65] | **saturou** |
| Estudantes brasileiros que inventaram soluções premiadas (k=30, a família toda) | 6% para 8% | 35% para 24% | 2,10 [1,46 a 3,03] | 0,81 [0,54 a 1,23] | **saturou** |
| Impostos por trás de fortunas de famosos | 1,1% para 3,4% | 52% para 36% | 6,56 [1,75 a 24,52] | 3,14 [1,29 a 7,66] | ainda forte, mas caindo com o volume triplicado |
| Pré-MBA: ChatGPT, novas IAs e empregos | 10% para 5% | 24% para 14% | 0,84 [0,60 a 1,18] | 0,36 [0,20 a 0,65] | piorando mesmo com menos volume |
| Carros chineses BYD e Geely dominando o Brasil | 1,6% para 3,8% | 42% para 45% | 2,16 [1,17 a 3,98] | 2,69 [1,84 a 3,93] | **cresce sem saturar** |
| Bastidores do dinheiro nos clubes de futebol | 1,4% para 1,5% | 47% para 50% | 2,70 [1,52 a 4,80] | 3,83 [2,16 a 6,81] | estável e forte |

- **Instrução:** "Território que vira linha de produção perde a vantagem em um trimestre: estudante inventor e criança premiada passaram de OR acima de 2 para neutro quando o volume subiu cerca de 50%. Cada território forte precisa de teto de volume e de ângulo novo; carro chinês ainda aguenta mais."

## (a) Tabela dos territórios

Lift por rede = P(topo | território) / 26%. "Onde funciona" = clientes com OR > 1 no território (OR MH dentro do cliente, mínimo 10 vídeos). Leitura pela régua comum; escopo pela regra da seção "Como foi feito".

#### Territórios k=30 (ordenados pelo OR de Mantel-Haenszel)

| território | roteiros | % topo | lift IG | lift TT | lift YT | OR MH [IC95] | lift desc / val | onde funciona (OR>1 no cliente) | onde não | leitura | escopo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Carros chineses BYD e Geely dominando o Brasil | 80 | 44% | 1,62 | 1,58 | 1,94 | 2,55 [1,85 a 3,51] | 1,64 / 1,73 | Leonardo Cirino 6,49; Renato Mendes 7,46; Franklin Tomich 3,10; Leonardo Nogueira 1,78 | Marcos Pelozato 0,96; Lincoln Fracari 0,87 | ajuda (replica) | global (4 de 6 clientes) |
| Barcos, iates e navegação sem combustível | 24 | 30% | 1,24 | 1,29 | 0,00 | 1,77 [0,48 a 6,61] | 2,58 / 0,97 | nenhum | Leonardo Martins - | amostra pequena | neutro |
| Impostos por trás de fortunas de famosos | 100 | 27% | 0,95 | 1,37 | 1,94 | 1,56 [0,64 a 3,79] | 1,11 / 1,05 | Ricardo Schumacher 1,02 | nenhum | sem evidência | neutro |
| Copa, Seleção e dinheiro no futebol | 83 | 31% | 1,33 | 1,25 | 1,04 | 1,42 [1,03 a 1,96] | 1,21 / 1,22 | Renato Mendes 2,01; Manoel Victor 1,83; Pedro Elero 1,76; Rafael Rodrigues 1,24 | Thiago Franco 0,38 | sem evidência | indício só no OR MH: global (4 de 5 clientes) |
| Estudantes brasileiros que inventaram soluções premiadas | 202 | 29% | 1,25 | 1,19 | 0,88 | 1,37 [1,05 a 1,78] | 1,34 / 0,94 | Marcio Grazino 1,80; Rafael Rodrigues 1,19; Cadu Neiva 1,00 | nenhum | sem evidência | indício só no OR MH: global (3 de 3 clientes) |
| Inovação verde e tecnologia do Nordeste | 96 | 31% | 1,04 | 1,15 | 1,39 | 1,35 [0,99 a 1,84] | 1,11 / 1,22 | Rafael Rodrigues 2,14; Cadu Neiva 1,50; Marcio Grazino 1,28 | nenhum | sem evidência | neutro |
| Marcas brasileiras de comida vendidas por bilhões | 61 | 31% | 1,40 | 0,91 | 1,17 | 1,33 [0,91 a 1,95] | 1,09 / 1,36 | Franklin Tomich 2,52; João Paulo Albuquerque 2,03; Marcelo Germano 1,15 | Rodrigo Waughan 0,94; Marcio Grazino 0,47 | sem evidência | neutro |
| Mulheres que saíram da feira para o império | 55 | 29% | 1,19 | 1,01 | 1,25 | 1,33 [0,84 a 2,12] | 1,26 / 1,08 | Thiago Franco 1,89; Thainá Iansen 5,78 | João Paulo Albuquerque 0,58; Marcio Grazino 0,20 | sem evidência | neutro |
| China humilhando o mundo com robôs e tecnologia | 96 | 28% | 0,95 | 1,15 | 1,17 | 1,27 [0,84 a 1,92] | 1,13 / 1,05 | Lincoln Fracari 1,24 | nenhum | sem evidência | neutro |
| Robôs domésticos e máquinas controladas pela mente | 83 | 30% | 1,08 | 1,04 | 1,52 | 1,26 [0,79 a 1,99] | 0,67 / 1,29 | Izabela Anholett 2,94; Patrick Diorio 2,15; Thiago Bisewski 1,72 | João Felipe Marques 0,32 | sem evidência | neutro |
| Guerra, petróleo e EUA x China no seu bolso | 72 | 29% | 1,24 | 1,00 | 1,03 | 1,24 [0,82 a 1,89] | 1,16 / 1,03 | Marcos Pelozato 1,99; Fernando Pereira 1,30 | nenhum | sem evidência | neutro |
| IA no dia a dia: ferramentas, vigilância, China | 136 | 27% | 1,14 | 1,04 | 0,98 | 1,18 [0,83 a 1,68] | 1,07 / 1,03 | Izabela Anholett 1,24 | nenhum | sem evidência | neutro |
| Guerra dos marketplaces e o fim da loja física | 109 | 26% | 0,99 | 1,14 | 0,87 | 1,11 [0,69 a 1,76] | 0,99 / 1,06 | Thiago Franco 1,30 | nenhum | sem evidência | neutro |
| Erros de comunicação e como falar melhor | 75 | 27% | 1,02 | 1,13 | 1,07 | 1,10 [0,73 a 1,67] | 0,98 / 1,17 | Patrick Diorio 2,17; Marcelo Germano 1,18 | Café com Ferri -; Rafael Rodrigues 0,85 | sem evidência | neutro |
| Empresários nordestinos que começaram do zero | 50 | 27% | 1,01 | 1,33 | 0,85 | 1,08 [0,66 a 1,76] | 0,94 / 1,10 | nenhum | Cadu Neiva 0,82 | sem evidência | neutro |
| Varejistas brasileiras quebrando com dívidas bilionárias | 89 | 26% | 0,88 | 1,20 | 0,94 | 1,00 [0,66 a 1,53] | 0,99 / 1,01 | Marcos Pelozato 1,31 | nenhum | sem evidência | neutro |
| Costumes, proibições e planos da China | 82 | 26% | 1,23 | 1,04 | 0,77 | 1,00 [0,67 a 1,49] | 0,99 / 1,02 | nenhum | Lincoln Fracari 0,88 | sem evidência | neutro |
| Dívida pública e governo empobrecendo o brasileiro | 118 | 25% | 1,00 | 0,96 | 0,91 | 0,94 [0,66 a 1,34] | 1,05 / 0,92 | Túlio Lichenstein 1,33; Fernando Pereira 1,03 | Marcos Pelozato 0,42 | sem evidência | neutro |
| Marcas da infância que sumiram | 57 | 25% | 1,07 | 0,52 | 0,95 | 0,93 [0,59 a 1,47] | 1,35 / 0,72 | Franklin Tomich 1,02 | Marcio Grazino 0,57 | sem evidência | neutro |
| Médicos, medicina e plano de saúde | 72 | 25% | 1,02 | 0,89 | 1,11 | 0,93 [0,47 a 1,84] | 1,23 / 0,71 | Drielle Castelani 1,09 | Rafael Rodrigues 0,73 | sem evidência | neutro |
| Carros de luxo e montadoras clássicas | 57 | 25% | 0,82 | 0,93 | 1,19 | 0,92 [0,59 a 1,45] | 0,96 / 0,95 | Manoel Victor 1,92 | Leonardo Nogueira 0,54; Marcio Grazino 0,57 | sem evidência | neutro |
| Jogadas de marketing de produtos e lojas | 92 | 25% | 1,08 | 0,97 | 0,88 | 0,86 [0,53 a 1,38] | 0,93 / 1,02 | nenhum | Rodrigo Waughan 0,94 | sem evidência | neutro |
| A decisão que salvou ou afundou uma gigante brasileira | 85 | 23% | 0,78 | 0,74 | 1,10 | 0,83 [0,55 a 1,24] | 0,64 / 1,12 | Túlio Lichenstein 3,26; Marcos Pelozato 1,30 | Franklin Tomich 0,60; Fernando Pereira - | sem evidência | neutro |
| Apple, iPhone e suas jogadas de venda | 41 | 21% | 0,50 | 1,09 | 1,00 | 0,77 [0,47 a 1,27] | 0,70 / 0,87 | Rodrigo Waughan 2,07; João Paulo Albuquerque 1,54 | Renato Mendes 0,65 | sem evidência | neutro |
| De vendedor humilde a dono de império | 126 | 22% | 0,88 | 0,67 | 1,16 | 0,76 [0,54 a 1,07] | 0,91 / 0,79 | nenhum | Marcelo Germano 0,94; Rodrigo Waughan 0,83; João Paulo Albuquerque 0,65; Marcio Grazino 0,61; Thiago Franco 0,61; Marcos Pelozato 0,61 | sem evidência | neutro |
| Pré-MBA: ChatGPT, novas IAs e empregos | 208 | 21% | 0,75 | 0,93 | 0,84 | 0,66 [0,50 a 0,88] | 0,93 / 0,55 | João Felipe Marques 2,80 | Manoel Victor 0,99; Izabela Anholett 0,64; Patrick Diorio 0,39 | atrapalha (replica) | global (3 de 4 clientes), evitar |
| Segredos de marcas globais como Starbucks e Red Bull | 144 | 19% | 0,79 | 0,58 | 0,80 | 0,61 [0,45 a 0,84] | 0,77 / 0,70 | Marcio Grazino 1,05 | João Paulo Albuquerque 0,99; Manoel Victor 0,82; Renato Torres 0,61; Renato Mendes 0,47; Pedro Elero 0,49; Thiago Franco 0,55 | atrapalha (replica) | global (6 de 7 clientes), evitar |
| Brasil como polo de IA entre China e EUA | 93 | 21% | 0,76 | 0,97 | 0,97 | 0,60 [0,32 a 1,11] | 0,76 / 0,83 | nenhum | Leonardo Cirino 0,49; Manoel Victor 0,64 | sem evidência | neutro |
| Empresas que venceram o governo no imposto | 118 | 23% | 0,99 | 0,80 | 0,86 | 0,51 [0,29 a 0,91] | 0,86 / 0,95 | nenhum | Dilson Peres 0,39; Marcos Pelozato 0,86 | sem evidência | indício só no OR MH: do cliente Dilson Peres, evitar |
| Fundadores que venderam empresas por milhões | 105 | 13% | 0,53 | 0,48 | 0,56 | 0,43 [0,30 a 0,62] | 0,54 / 0,50 | nenhum | Rodrigo Waughan 0,82; Marcelo Germano 0,43; Fernando Pereira 0,41; João Paulo Albuquerque 0,33; Thiago Franco 0,26; Marcio Grazino 0,26; Rafael Rodrigues 0,23; Manoel Victor - | atrapalha (replica) | global (8 de 8 clientes), evitar |

#### Territórios k=60 (ordenados pelo OR de Mantel-Haenszel)

| território | roteiros | % topo | lift IG | lift TT | lift YT | OR MH [IC95] | lift desc / val | onde funciona (OR>1 no cliente) | onde não | leitura | escopo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Impostos por trás de fortunas de famosos | 68 | 41% | 1,16 | 3,10 | 3,87 | 3,99 [1,92 a 8,29] | 2,03 / 1,41 | Dilson Peres 17,39; Ricardo Schumacher 1,92 | nenhum | ajuda (replica) | do cliente Ricardo Schumacher |
| Bastidores do dinheiro nos clubes de futebol | 42 | 49% | 1,95 | 2,05 | 1,68 | 3,24 [2,16 a 4,87] | 1,82 / 1,94 | Pedro Elero 5,16; Rafael Rodrigues 2,68; Manoel Victor 1,68 | nenhum | ajuda (replica) | global (3 de 3 clientes) |
| Carros chineses BYD e Geely dominando o Brasil | 66 | 47% | 1,76 | 1,64 | 2,12 | 2,96 [2,08 a 4,21] | 2,00 / 1,79 | Leonardo Cirino 7,87; Renato Mendes 7,46; Leonardo Nogueira 1,76; Lincoln Fracari 1,33 | nenhum | ajuda (replica) | global (4 de 4 clientes) |
| Lula, eleição e candidatos de 2026 | 20 | 45% | 1,95 | 1,93 | 0,77 | 2,60 [1,26 a 5,40] | - / 1,77 | Fernando Pereira 7,29 | Túlio Lichenstein 0,86 | sinal sem replicação | misto |
| Barcos, iates e megaconstruções de engenharia | 37 | 36% | 1,18 | 1,69 | 1,55 | 1,90 [1,05 a 3,45] | 1,29 / 1,41 | Marcio Grazino 1,70 | Leonardo Martins - | sem evidência | indício só no OR MH: misto |
| Indústrias de Santa Catarina nascidas no quintal | 57 | 36% | 1,50 | 1,25 | 1,16 | 1,86 [1,13 a 3,07] | 1,21 / 1,75 | Marcelo Germano 2,13 | Marcio Grazino 0,71 | ajuda (replica) | do cliente Marcelo Germano |
| Estudantes que resolvem problemas com lixo barato | 89 | 35% | 1,39 | 1,49 | 1,15 | 1,74 [1,29 a 2,34] | 1,62 / 1,17 | Rafael Rodrigues 1,86; Marcio Grazino 1,75; Cadu Neiva 1,27 | nenhum | ajuda (replica) | global (3 de 3 clientes) |
| China humilhando o mundo com robôs e tecnologia | 69 | 33% | 1,32 | 1,21 | 1,33 | 1,66 [1,12 a 2,47] | 1,32 / 1,26 | Lincoln Fracari 1,33 | nenhum | ajuda (replica) | do cliente Lincoln Fracari |
| O fim do comércio de bairro e do Brás | 43 | 32% | 1,26 | 1,14 | 1,29 | 1,52 [0,94 a 2,44] | 1,20 / 1,35 | Thiago Franco 1,68 | nenhum | sem evidência | neutro |
| Guerra, petróleo e Trump no seu bolso | 38 | 32% | 1,30 | 1,20 | 1,23 | 1,50 [0,90 a 2,50] | 1,31 / 1,02 | Fernando Pereira 1,63 | nenhum | sem evidência | neutro |
| Golpes e armadilhas feitas com IA | 34 | 30% | 1,22 | 0,00 | 0,00 | 1,46 [0,52 a 4,14] | 1,29 / 0,78 | João Felipe Marques 1,99 | nenhum | sem evidência | neutro |
| Varejistas brasileiras quebrando com dívidas bilionárias | 62 | 30% | 1,11 | 1,32 | 1,10 | 1,40 [0,92 a 2,12] | 1,11 / 1,21 | Marcos Pelozato 1,83 | nenhum | sem evidência | neutro |
| Apple, Meta e Google na guerra dos óculos de IA | 65 | 32% | 1,14 | 1,39 | 1,29 | 1,38 [0,88 a 2,17] | 1,11 / 1,28 | Izabela Anholett 3,74 | Thiago Bisewski 0,95; Leonardo Cirino 0,73 | sem evidência | neutro |
| Crianças cearenses premiadas em olimpíadas mundiais | 64 | 31% | 1,53 | 1,09 | 1,00 | 1,36 [0,97 a 1,93] | 1,56 / 1,02 | Rafael Rodrigues 1,59; Marcio Grazino 1,26; Cadu Neiva 1,09 | nenhum | sem evidência | neutro |
| Negócios que transformam lixo em dinheiro | 31 | 31% | 1,04 | 1,00 | 1,58 | 1,32 [0,81 a 2,14] | 0,78 / 1,23 | Cadu Neiva 3,14; Marcio Grazino 1,78; João Paulo Albuquerque 1,72 | Pedro Elero - | sem evidência | neutro |
| Novas IAs como Claude assustando o mercado | 29 | 30% | 1,11 | 1,22 | 1,22 | 1,27 [0,74 a 2,19] | 1,18 / 1,11 | Manoel Victor 1,51; Izabela Anholett 1,14 | nenhum | sem evidência | neutro |
| Marcas brasileiras vendidas para gigantes estrangeiras | 99 | 28% | 1,09 | 1,45 | 1,02 | 1,27 [0,78 a 2,08] | 0,95 / 1,18 | nenhum | Franklin Tomich 0,89 | sem evidência | neutro |
| China comprando o agro e a energia do Brasil | 29 | 28% | 1,30 | 1,51 | 0,60 | 1,15 [0,65 a 2,02] | 0,32 / 1,54 | nenhum | Lincoln Fracari 0,88 | sem evidência | neutro |
| Carros de luxo e marcas clássicas como Ferrari | 55 | 27% | 0,92 | 1,01 | 1,29 | 1,12 [0,70 a 1,77] | 1,21 / 0,84 | Manoel Victor 4,34; Marcio Grazino 1,45 | Leonardo Nogueira 0,52 | sem evidência | neutro |
| Apple, iPhone e suas jogadas de venda | 24 | 28% | 0,68 | 1,29 | 1,37 | 1,10 [0,61 a 1,98] | 0,68 / 1,23 | Rodrigo Waughan 2,07 | Renato Mendes 0,71 | sem evidência | neutro |
| Brasil no meio da briga EUA x China | 37 | 27% | 1,19 | 1,06 | 0,82 | 1,10 [0,67 a 1,80] | 1,13 / 0,97 | Marcos Pelozato 1,47 | Fernando Pereira 0,91 | sem evidência | neutro |
| IA substituindo profissões e criando vagas | 31 | 27% | 1,07 | 0,97 | 0,97 | 1,07 [0,48 a 2,38] | 0,00 / 1,08 | Patrick Diorio 1,13 | nenhum | sem evidência | neutro |
| Brasil entre China e EUA na corrida da IA | 53 | 27% | 0,84 | 0,70 | 1,84 | 1,04 [0,65 a 1,68] | 1,57 / 0,75 | Izabela Anholett 1,70; Leonardo Cirino 1,35 | nenhum | sem evidência | neutro |
| Robôs humanoides chineses substituindo pessoas | 53 | 26% | 0,89 | 1,29 | 1,01 | 1,01 [0,63 a 1,62] | 1,00 / 1,03 | Izabela Anholett 1,76; Lincoln Fracari 1,28 | Thiago Bisewski 0,44; Leonardo Cirino - | sem evidência | neutro |
| Médicos heróis esquecidos pelo Brasil | 52 | 26% | 1,09 | 0,94 | 0,89 | 1,01 [0,59 a 1,74] | 1,26 / 0,86 | Drielle Castelani 1,38 | Rafael Rodrigues 0,83; Cadu Neiva 0,77 | sem evidência | neutro |
| McDonald's e a guerra do fast food | 20 | 26% | 1,36 | 1,07 | 0,58 | 0,99 [0,54 a 1,83] | 1,70 / 0,74 | Rodrigo Waughan 1,46 | nenhum | sem evidência | neutro |
| Mulheres que saíram da feira para o império | 39 | 26% | 1,11 | 0,85 | 1,01 | 0,99 [0,53 a 1,82] | 0,70 / 1,09 | Thainá Iansen 9,46 | João Paulo Albuquerque 0,52; Marcio Grazino - | sem evidência | neutro |
| Negócios de família nordestinos que viraram milhões | 51 | 25% | 0,95 | 1,17 | 0,82 | 0,95 [0,61 a 1,48] | 1,07 / 0,91 | Rodrigo Waughan 1,43 | Cadu Neiva 0,72; João Paulo Albuquerque 0,73 | sem evidência | neutro |
| Coca-Cola e os rivais que a desafiaram | 51 | 24% | 1,12 | 0,64 | 0,94 | 0,93 [0,60 a 1,44] | 1,13 / 0,78 | Manoel Victor 2,43; Franklin Tomich 1,99; Rodrigo Waughan 1,21 | João Paulo Albuquerque 0,65; Pedro Elero 0,16 | sem evidência | neutro |
| Planos da China para dominar o mundo e o Nordeste | 48 | 25% | 0,84 | 1,29 | 0,79 | 0,92 [0,56 a 1,51] | 1,05 / 0,73 | nenhum | Lincoln Fracari 0,85 | sem evidência | neutro |
| Vendas online e lives que faturam milhões | 40 | 23% | 1,30 | 0,66 | 0,77 | 0,90 [0,53 a 1,50] | 0,83 / 1,73 | nenhum | Thiago Franco 0,77 | sem evidência | neutro |
| Guerra dos marketplaces: Mercado Livre, Shopee, Amazon | 51 | 24% | 0,87 | 1,22 | 0,65 | 0,88 [0,54 a 1,45] | 0,92 / 0,86 | nenhum | Thiago Franco 0,97 | sem evidência | neutro |
| Erros de comunicação e como falar melhor | 45 | 25% | 0,85 | 1,09 | 1,03 | 0,88 [0,49 a 1,57] | 0,79 / 1,15 | nenhum | Café com Ferri -; Rafael Rodrigues 0,47 | sem evidência | neutro |
| Médico mal pago e armadilhas da profissão | 35 | 24% | 0,83 | 1,19 | - | 0,87 [0,37 a 2,03] | 1,06 / 0,60 | nenhum | Drielle Castelani 0,87 | sem evidência | neutro |
| Jogadas de marketing que fazem fila na porta | 74 | 24% | 0,83 | 0,92 | 1,04 | 0,85 [0,58 a 1,26] | 0,91 / 0,94 | nenhum | Rodrigo Waughan 0,95; Pedro Elero 0,31 | sem evidência | neutro |
| Ferramentas de IA que acabam com empregos | 99 | 24% | 0,97 | 0,92 | 0,85 | 0,81 [0,56 a 1,15] | 0,95 / 0,86 | nenhum | Izabela Anholett 0,81 | sem evidência | neutro |
| Segredos e contradições de bilionários como Buffett | 32 | 22% | 0,50 | 1,06 | 1,16 | 0,80 [0,46 a 1,42] | 0,89 / 0,74 | Rafael Rodrigues 2,98; Túlio Lichenstein 1,46 | Manoel Victor 0,57; Fernando Pereira 0,48 | sem evidência | neutro |
| Academias como Smart Fit e seus modelos de negócio | 32 | 22% | 0,88 | 0,84 | 0,81 | 0,80 [0,46 a 1,39] | 0,78 / 0,89 | Renato Mendes 2,16 | João Paulo Albuquerque 0,37 | sem evidência | neutro |
| Reforma tributária e impostos escondidos | 65 | 22% | 0,93 | 0,85 | 0,67 | 0,79 [0,50 a 1,26] | 1,04 / 0,76 | Dilson Peres 1,14 | Marcos Pelozato 0,78; Ricardo Schumacher 0,47; Fernando Pereira 0,16 | sem evidência | neutro |
| Chips cerebrais e IA lendo a mente | 38 | 22% | 0,84 | 0,86 | 0,83 | 0,78 [0,46 a 1,31] | 0,79 / 0,89 | nenhum | Izabela Anholett 0,86 | sem evidência | neutro |
| Colapso de gigantes como Americanas e Pão de Açúcar | 43 | 21% | 0,81 | 0,70 | 0,94 | 0,75 [0,46 a 1,22] | 0,78 / 0,84 | nenhum | Marcos Pelozato 0,76 | sem evidência | neutro |
| Alunos brasileiros premiados em robótica e ciência | 87 | 22% | 0,96 | 0,89 | 0,69 | 0,75 [0,53 a 1,07] | 0,92 / 0,78 | nenhum | Rafael Rodrigues 0,66 | sem evidência | neutro |
| Copa do Mundo, Seleção e patrocínios | 41 | 21% | 0,85 | 0,80 | 0,72 | 0,75 [0,46 a 1,24] | 1,01 / 0,58 | nenhum | Rafael Rodrigues 0,65; Pedro Elero 0,57 | sem evidência | neutro |
| Costumes e curiosidades do cotidiano chinês | 36 | 21% | 1,14 | 0,30 | 1,00 | 0,73 [0,41 a 1,30] | 0,90 / 0,72 | nenhum | Lincoln Fracari 0,73 | sem evidência | neutro |
| Olympikus, Nike e a guerra dos tênis | 28 | 20% | 0,97 | 0,67 | 0,65 | 0,72 [0,40 a 1,27] | 0,65 / 0,90 | Renato Mendes 2,15 | Marcio Grazino 0,96; Pedro Elero 0,66; Rodrigo Waughan 0,55; Marcos Pelozato - | sem evidência | neutro |
| Uber e Elon Musk trocando humanos por máquinas | 20 | 20% | 0,58 | 1,55 | 0,35 | 0,70 [0,32 a 1,52] | 1,06 / 0,41 | nenhum | nenhum | sem evidência | neutro |
| Bilionários que perderam tudo, como Eike Batista | 31 | 19% | 0,81 | 0,35 | 1,11 | 0,68 [0,38 a 1,24] | 0,53 / 1,11 | Marcos Pelozato 1,09 | Fernando Pereira 0,37 | sem evidência | neutro |
| De vendedor humilde a bilionário do varejo | 50 | 19% | 0,79 | 0,70 | 0,67 | 0,64 [0,38 a 1,06] | 1,06 / 0,39 | nenhum | Marcelo Germano 0,88; Cadu Neiva 0,76; Rodrigo Waughan 0,40 | sem evidência | neutro |
| Empresas e pessoas que enriqueceram usando IA | 41 | 18% | 0,60 | 0,50 | 1,00 | 0,60 [0,36 a 1,02] | 0,62 / 0,85 | nenhum | Manoel Victor 0,67; Túlio Lichenstein 0,40; Rafael Rodrigues 0,26 | sem evidência | neutro |
| Dívida pública e governo empobrecendo o brasileiro | 67 | 18% | 0,72 | 0,66 | 0,84 | 0,60 [0,38 a 0,95] | 0,84 / 0,67 | Túlio Lichenstein 1,48 | Fernando Pereira 0,62; Marcos Pelozato 0,33 | atrapalha (replica) | global (2 de 3 clientes), evitar |
| Havaianas: do chinelo barato ao luxo | 12 | 17% | 0,97 | 0,00 | 0,97 | 0,59 [0,23 a 1,56] | 0,48 / 0,90 | nenhum | nenhum | amostra pequena | neutro |
| Marcas da infância que sumiram, como Ki-Suco | 9 | 17% | 0,78 | 0,64 | 0,48 | 0,58 [0,20 a 1,70] | 0,55 / 0,69 | nenhum | nenhum | amostra pequena | neutro |
| Pré-MBA: ChatGPT, novas IAs e empregos | 70 | 18% | 0,52 | 1,02 | 0,57 | 0,57 [0,38 a 0,87] | 0,80 / 0,22 | Manoel Victor 1,15 | Izabela Anholett 0,51 | atrapalha (replica) | misto, evitar |
| Celular, dados e IA vigiando sua vida | 21 | 17% | 0,74 | 0,00 | 0,97 | 0,57 [0,21 a 1,57] | 0,00 / 0,97 | nenhum | Patrick Diorio 0,55 | amostra pequena | neutro |
| Fundadores que venderam empresas por milhões | 92 | 15% | 0,60 | 0,59 | 0,62 | 0,52 [0,35 a 0,75] | 0,61 / 0,58 | Rodrigo Waughan 1,27 | Cadu Neiva 0,63; Marcelo Germano 0,56; Marcio Grazino 0,46; Rafael Rodrigues 0,35; Thiago Franco 0,15; João Paulo Albuquerque 0,14; Pedro Elero - | atrapalha (replica) | global (7 de 8 clientes), evitar |
| Chocolates e doces que viraram fortuna | 32 | 15% | 0,54 | 0,00 | 1,23 | 0,47 [0,25 a 0,91] | 0,70 / 0,38 | nenhum | Rodrigo Waughan 0,56 | atrapalha (replica) | do cliente Rodrigo Waughan, evitar |
| Carro voador e aviação sem piloto | 13 | 14% | 0,30 | 0,64 | 0,65 | 0,44 [0,17 a 1,13] | 0,43 / 0,61 | nenhum | Marcio Grazino 0,22 | sem evidência | neutro |
| Empresas que venceram o governo no imposto | 89 | 20% | 0,82 | 0,70 | 0,81 | 0,41 [0,24 a 0,70] | 0,76 / 0,84 | nenhum | Dilson Peres 0,40 | sem evidência | indício só no OR MH: do cliente Dilson Peres, evitar |
| Marcas feias ou falidas que viraram desejo | 48 | 11% | 0,25 | 0,50 | 0,82 | 0,36 [0,19 a 0,69] | 0,55 / 0,24 | nenhum | João Paulo Albuquerque 0,31; Renato Mendes 0,25; Renato Torres 0,14; Manoel Victor - | atrapalha (replica) | global (4 de 4 clientes), evitar |
| Tecnologia antiga que a geração Z quer de volta | 12 | 10% | 0,35 | 0,35 | 0,55 | 0,33 [0,10 a 1,10] | 0,55 / 0,35 | nenhum | nenhum | amostra pequena | neutro |

## (d) Pares para leitura contrastiva (`data/pares.json`)

- **260 pares** de **27 clientes** (todos menos Lerry Granville, 5 roteiros, e Leonardo Martins, 20). Instagram 127, TikTok 100, YouTube 33 (YouTube só para completar, em rodadas que priorizam o cliente com menos pares).
- **Critério:** mesmo cliente e mesma rede; vencedor com pq >= 0,8 e perdedor com pq <= 0,3; postados com até 150 dias de distância; nenhum roteiro em dois pares; no máximo 25 pares por cliente (Izabela Anholett e Rafael Rodrigues bateram o teto); escolha gulosa pela maior similaridade.
- **Limiar de mesmo território:** os 3% de pares mais parecidos dentro de cada cliente (p97 da distribuição do próprio cliente), com piso de 0,78. Na prática, de 0,78 (clientes de nicho largo, como Rodrigo Waughan e Marcio Grazino) a 0,845 (Café com Ferri); 0,831 em Thiago Franco, 0,805 em Izabela Anholett. O p97 de todos os pares dentro de cliente é 0,799.
- **Resultado:** similaridade mínima 0,78, mediana 0,818, máxima 0,93. Distância mediana entre as postagens: 35 dias (p90: 109). pq médio do vencedor 0,90 e do perdedor 0,15. Em 258 de 260 pares o vencedor também é melhor na média das redes (o contraste não é ruído de uma rede só).
- **Pares por cliente:** Izabela Anholett 25, Rafael Rodrigues 25, Lincoln Fracari 24, Fernando Pereira 19, Rodrigo Waughan 19, Thiago Franco 18, Marcio Grazino 17, Marcos Pelozato 13, Manoel Victor 13, Franklin Tomich 12, Dilson Peres 12, Marcelo Germano 8, Cadu Neiva 7, Leonardo Cirino 6, Pedro Elero 6, Drielle Castelani 5, Ricardo Schumacher 5, Renato Mendes 5, João Felipe Marques 4, Túlio Lichenstein 4, Patrick Diorio 3, Leonardo Nogueira 3, Café com Ferri 2, João Paulo Albuquerque 2, Renato Torres 1, Thainá Iansen 1, Thiago Bisewski 1.
- **Conferência a olho (5 sorteados), todos no mesmo território:** P058 Izabela Anholett, Instagram, 0,899: "O “ChatGPT” tornará o Iphone lixo em 2027" (pq 0,97) x "A Apple quer destruir a nova criação do ChatGPT" (0,20). P023 Drielle Castelani, Instagram, 0,851: "O médico que usou o próprio coração como cobaia" (1,00) x "O aparelho que salva seu coração nasceu numa cozinha" (0,26). P201 Rafael Rodrigues, Instagram, 0,795: "O Ceará pode mudar o futuro tecnológico do Brasil" (0,88) x "A ideia do Ceará que transformou a Copa do Mundo em aula de tecnologia" (0,01). P163 Marcos Pelozato, TikTok, 0,83: "Mais uma gigante ACABA de cair!" (0,83) x "A cerveja mais famosa do Brasil quase sumiu." (0,22). P180 Pedro Elero, TikTok, 0,785: "Jogador de 18 anos acaba de trocar São Paulo pelo Palmeiras" (0,83) x "O Neymar se aposentou?!" (0,14).
- **Campos de cada lado:** `script_id, titulo, hook, subhook, sub2, conclusao2, conclusao, bloco_final, comando_video, coef, pq, views, duracao, palavras_total, data, link, macro` e mais `pq_medio_redes`. Sem o corpo. `comando_video` vazio em 27 lados, `bloco_final` em 6.

## O que os playbooks afirmam e o dado confirma, corrige ou desmente

- **checklist.md, RELEVÂNCIA: "O tema tem potencial de interesse para ao menos 20 milhões de brasileiros", com a tabela de audiência por tema (Futebol ~160 mi, Bilionários ~80 mi, Empreendedorismo ~60 a 80 mi, Geopolítica ~25 a 40 mi). Corrige.** O tamanho da audiência do macro tema não ordena o desempenho. Bilionários e Empreendedorismo abrigam os piores territórios da base (fundador que vendeu: 13% de topo; vendedor humilde a império: 22%). Futebol só funciona no recorte do dinheiro do clube (49%) e falha na Seleção e na Copa (21%). Proposta: trocar a régua de audiência por uma lista de territórios que funcionam e de territórios para evitar, revisada a cada trimestre.
- **hook.md, anti-padrão "Apresentar o TEMA em vez do IMPACTO". Confirma, no nível da pauta.** Estudante que "venceu torneio" (tema) fica em 22%; estudante que "resolveu com lixo o que a indústria não resolveu" (impacto) fica em 35%. Biografia de marca ("o segredo da Starbucks") é tema sem impacto: 19%.
- **hook.md, mecanismo "Revelação Secreta" (promete o que quase ninguém percebeu). Limita.** A promessa de segredo não salva biografia de marca global (OR 0,61) nem a de fundador (OR 0,43). O segredo precisa estar preso a um impacto concreto (o famoso que paga menos imposto, OR 3,99 em tributário).
- **hook.md, "sustentar a modelagem de um vídeo que funcionou". Corrige o alcance.** Modelagem vale em Tecnologia e IA (OR 1,64; 1,90 depois de julho) e deixou de valer fora de Tecnologia desde julho.
- **comando.md: "Medir comando por views mede o canal e o tema". Confirma.** Só o território move o topo de 11% a 49% dentro do mesmo cliente.
- **Lacuna:** nenhum playbook fala de pauta (repetição, continuação, distância entre temas, modelagem). Proposta: uma seção PAUTA no checklist com a regra do achado 4 e o veredito do achado 5.

## O que NÃO deu para afirmar

- **Território e cliente se confundem:** 12 dos 30 territórios têm mais de 80% dos roteiros de um cliente. Nesses, o efeito é "dentro daquele cliente" e não dá para separar tema de conta.
- **Muitas comparações:** 90 territórios testados; a 5% esperam-se 4 ou 5 falsos positivos. Só trate como regra os que replicam com OR longe de 1 (carro chinês, dinheiro do clube, estudante com lixo barato, fortunas de famosos, fundador, marca global, marca feia, Pré-MBA).
- **Amostras pequenas na regra de repetição:** "1ª repetição até 21 dias" tem 32 roteiros; "1ª repetição depois de 90 dias", só 5 (sem leitura). A distância é contada a partir do acerto original, não da repetição anterior.
- **Dilson Peres em fortunas de famosos:** só 5 roteiros; o sinal é grande, mas a amostra é mínima.
- **Modelagem por cliente:** os clientes com OR negativo modelam quase tudo, então o grupo de comparação deles é pequeno (Thainá Iansen tem 5 roteiros não modelados; Pedro Elero e Renato Mendes, 15).
- **Transferência positiva entre clientes** não ficou demonstrada (OR 1,11 com território, IC cruzando 1).
- **"Lula, eleição e candidatos de 2026"** só existe na validação: hipótese.
- **Similaridade inclui o bloco final** ("Eu sou..." e comando), por isso o cosseno dentro do cliente é inflado e os limiares dentro e entre clientes são diferentes (0,80 e 0,76).
- **Facebook ficou de fora** (276 vídeos).

## Arquivos

- Dados escritos para os outros subagentes: `data/clusters.json` (2.809 linhas: `script_id, c30, c60, nome30, nome60, sim_centroide30`; o `carregar()` da lib já anexa em `r.cluster`) e `data/pares.json` (260 pares).
- Saídas: `out/embeddings/achados.md`, `out/embeddings/achados.json`, `out/embeddings/tabela_territorios.md`, `out/embeddings/territorios.json`, `out/embeddings/repeticao.json`, `out/embeddings/repeticao_extra.json`, `out/embeddings/modelagem.json`, `out/embeddings/saturacao.json`, `out/embeddings/pares_stats.json`, `out/embeddings/kmeans.json` e os logs `*_log.txt`.
- Código (rodar da raiz do estudo): `src/embeddings/base.mjs` (carga, truncagem, cosseno), `t0_similaridade.mjs` (limiares e validação contra o CRM), `t1_dimensao.mjs`, `t2_kmeans.mjs`, `t2_territorios.mjs`, `t3_repeticao.mjs` (e `extra`), `t4_modelagem.mjs`, `t5_pares.mjs`, `t6_saturacao.mjs`, `t7_exemplos.mjs`.
