# Livro de códigos: modos de roteiro da Viral Media Labs

Base: 168 roteiros publicados em 2026, 28 clientes, lidos inteiros. Amostra cega (sem desempenho). Gabarito em `rotulos_descoberta.jsonl`.

## Resumo em cinco linhas

1. Modo é melhor descrito como **categoria** (6 modos + misto), definida por duas perguntas juntas: **quem é o protagonista do corpo** e **como o corpo avança**. Essas duas coisas vêm amarradas na página: quando muda uma, muda o tipo de prova, a pesquisa e o que o revisor cobra.
2. Os modos: **história** (31,5%), **mecanismo** (31,0%), **demonstração** (17,9%), **panorama** (10,1%), **conselho** (5,4%), **publi** (2,4%), misto (1,8%).
3. Duas coisas que pareciam modo são **dimensões que atravessam os modos**: a **âncora** (notícia, passado, atemporal) e o **registro** (analítico, emotivo). Elas mudam a pesquisa e o tom, mas não o jeito de provar. Vale rotular as duas.
4. "Notícia" não é modo: 43% dos roteiros são ancorados em fato recente e eles se espalham por mecanismo, demonstração, panorama e história. "Emotivo" também não é modo: é registro de 21% dos roteiros, concentrado em história.
5. O modo não é o cliente: só 3 dos 28 clientes usam um modo só (Marcelo Germano: história; Ricardo Schumacher: mecanismo; Thiago Bisewski: demonstração). 98 de 168 roteiros (58%) estão no modo dominante do próprio cliente. A skill se escolhe por roteiro (pela premissa), com o mix do cliente como ponto de partida.

## Como os modos se distinguem (a tabela que decide)

| Modo | Protagonista do corpo | O corpo avança por | O que serve de prova |
|---|---|---|---|
| história | uma pessoa, família, empresa ou marca, contada no tempo | acontecimentos em ordem (anos, "até que", "foi aí que", "hoje") | os próprios fatos datados, uma cena, o número de desfecho |
| mecanismo | um caso, decisão ou regra (manobra tributária, modelo de negócio, campanha, golpe, disputa judicial) | explicação ("funciona assim", "ou seja", "a diferença é", "o motivo") | a regra ou estratégia nomeada, a conta, a decisão ou documento |
| demonstração | uma coisa (produto, invenção, máquina, ferramenta, método científico) | recursos e funcionamento ("olha isso", "e não para por aí") | especificação, princípio físico, teste, comparação tangível, preço |
| panorama | um fenômeno, tendência, mercado ou risco (sem caso único dono do vídeo) | dados empilhados e cadeia de causa até o espectador | estatísticas de várias fontes nomeadas, séries, comparações |
| conselho | o espectador ("você") | passos, técnicas, instruções | lógica, exemplo literal (frase, prompt, site), autoridade |
| publi | a oferta (curso, produto, candidato) | conteúdo de entrada e depois oferta | benefício, preço, chamada de conversão |

---

## Os modos

### 1. História (`historia`): 53 roteiros, 31,5%

**Definição.** O roteiro conta o que aconteceu com alguém (pessoa, família, empresa, marca, produto) ao longo do tempo. Convence porque aconteceu: a sequência de fatos é a prova. A lição vem do personagem para o espectador no fim.

**Sinais na página.**
- Marcadores de tempo em boa parte das frases do corpo: "Em 1974", "Anos depois", "Por quase uma década", "Até que", "Foi aí que", "Hoje".
- Sujeito das frases é o personagem agindo ou sofrendo: "ele abriu", "ela recusou", "a família cruzou o estado".
- Uma virada explícita ("Foi aí que", "Mas o plano deu errado", "Só que, na véspera").
- Número de desfecho no fim ("hoje fatura R$ 100 milhões", "312 lojas").
- Muitas vezes uma cena com detalhe físico ou uma fala atribuída ("O juiz mandou colocar duas telas em branco e ordenou: Pintem.").

**Variantes (mesma skill, mesma pesquisa).** Trajetória (anos ou décadas: Novalogic, Klabin, Frangolândia); episódio (um momento decisivo: Dolly Parton e Elvis, Messi e Nike, Steinmetz e o giz, o táxi do Duolingo); queda de marca (Zoomp, Ki-Suco, Rainha, Ping Pong); cadeia de eventos de um caso atual (o iate do Vorcaro).

**Âncoras.** `3c3e9d92-fa89-4a14-bade-3db9b4b75bb7` (ex-servente que fatura 100 milhões: trajetória, emotivo), `566c566b-2e28-4e33-9bf1-fb67e40ad06f` (Ki-Suco: queda de marca, analítico), `6002fd6f-f591-476c-96e2-f9f6033e737c` (Dolly recusa Elvis: episódio).

**O que pede de cada etapa.**
- Pesquisa: linha do tempo do protagonista. Origem (ano, lugar, ofício, família), 1 ou 2 obstáculos concretos com data, a decisão ou virada, o desfecho com número e fonte. Caçar uma cena com detalhe físico (o barraco atrás do posto, cortava grama por 5 reais, a sala que ficou em silêncio) e, se houver, uma fala real. Fontes: entrevista do fundador, perfil em reportagem, livro, site institucional, processo judicial.
- Tipo de prova: o fato datado e a cena. Número serve de marco de escala (início pequeno, fim grande), não de argumento. Densidade: mediana de 1,3 número por 100 palavras sem contar anos (2,0 contando anos).
- Estrutura: gancho com o contraste início e fim ("ex-servente... até o Google virou cliente"); corpo cronológico, sem voltar no tempo mais de uma vez; uma virada nomeada; desfecho "hoje".
- Tamanho: mediana 401 palavras (p25 a p75: 358 a 438).
- Fecho: lição que sai da virada. Se o registro for emotivo, lição de valor (coragem, caráter, justiça, "não desistir"); se analítico, lição de estratégia ("quem financia a obra com lucro nunca trabalha para o banco").
- Registro: 40% emotivo (21 de 53), o maior índice entre os modos. Âncora: 83% passado.
- O revisor cobra: personagem nomeado em toda a peça; cronologia sem buraco; obstáculo específico (não "enfrentou dificuldades"); virada datada; ao menos uma cena concreta; número de desfecho com fonte; a lição decorre da virada contada, e não de outra coisa.

### 2. Mecanismo (`mecanismo`): 52 roteiros, 31,0%

**Definição.** O roteiro pega um caso (uma empresa, uma disputa, uma regra, uma campanha, um golpe) e explica por dentro como ou por que ele funciona. Convence pela explicação: o espectador sai entendendo a regra, a conta ou a estratégia que estava escondida. O caso é a porta, o mecanismo é o conteúdo.

**Sinais na página.**
- Gancho com fato que parece absurdo ou contraditório: "A Receita cobrou imposto sobre três girafas", "O Ratinho lucrou 70 milhões perdendo dinheiro", "O McDonald's parou de vender sorvete e economizou 300 milhões".
- Conectores de explicação no corpo: "Pra entender", "Funciona assim", "Ou seja", "A diferença está", "O problema estava em", "E é aí que entra".
- Uma regra, lei, órgão ou modelo nomeado (risco sacado, lucro presumido, fato gerador, CARF, STJ, holding, efeito halo, recuperação judicial americana).
- Contraste senso comum contra realidade ("Todo mundo achava que... Mas era mentira").
- Termo técnico traduzido na mesma frase ("PIS e Cofins, duas contribuições ao governo cobradas sobre a receita").

**Âncoras.** `03733ea6-10d7-49d7-9f74-0645fa2b5055` (girafas e o fato gerador), `934bbbf8-18fd-4367-80a4-f008f24f8c2f` (Americanas e o risco sacado), `c2eab36b-33f5-4e06-841a-02956b949f33` (Planet Fitness vende alívio de culpa).

**O que pede de cada etapa.**
- Pesquisa: o caso em poucos fatos (quem, quando, quanto) e, principalmente, o mecanismo: o texto da regra, a decisão do tribunal ou conselho, a cláusula do contrato, o modelo de receita, a conta. Achar o número que mede o efeito (economizou 300 milhões, margem de 23% contra 3%). Achar o senso comum que o caso contraria.
- Tipo de prova: a regra ou estratégia nomeada e a conta que fecha. Documento, decisão ou fala oficial quando houver. Densidade: mediana de 1,0 número por 100 palavras sem anos; é o modo que mais explica e menos empilha.
- Estrutura: fato surpreendente; 1 a 3 linhas de contexto do caso; "pra entender"; mecanismo em 2 a 4 passos, cada um com sua consequência; o detalhe que vira o jogo; generalização ("isso vale para qualquer empresa").
- Tamanho: mediana 376 palavras (346 a 410).
- Fecho: regra geral reaplicável, quase sempre estratégica ("o que manda não é como você enxerga o negócio, é o fato gerador").
- Registro: 96% analítico (50 de 52). Âncora espalhada: 44% notícia, 33% passado, 23% atemporal.
- O revisor cobra: o mecanismo cabe numa frase; nenhum jargão sem tradução; a conta fecha com números do próprio caso; o personagem do caso não rouba o corpo (se o corpo virou biografia, o modo é história); a lição sai do mecanismo, não de moral.

### 3. Demonstração (`demonstracao`): 30 roteiros, 17,9%

**Definição.** O protagonista é uma coisa: produto, invenção, máquina, ferramenta, tecnologia, método científico. O roteiro mostra o que ela faz e como funciona, recurso por recurso. Convence porque o espectador vê a coisa funcionando.

**Sinais na página.**
- "O nome é X" ou "Ele se chama X" logo no começo.
- "Funciona assim", "Olha isso", "Você coloca e...", "Mas não para por aí", "E tem mais", "Para melhorar".
- Especificações com unidade (100 gramas, 21 mil cavalos, 750 km, 500 milissegundos, 5 mil nits).
- Comparação tangível ("mais força que um trem de carga", "menor que um Fiat Mobi").
- Preço, disponibilidade ou estágio (protótipo, à venda, previsto para 2028).
- Sujeito das frases é a coisa: "ele detecta", "a lanterna funciona", "o sistema ajusta".

**Âncoras.** `346344d2-c0aa-4897-a111-96faaefab436` (óculos da Meta), `592d2f13-f883-493a-b204-04bbd121f0eb` (bulbo de proa), `8de87f1f-67ad-43d4-94bf-c275b3d1d543` (capacete Shoei com tela na viseira).

**O que pede de cada etapa.**
- Pesquisa: ficha técnica. Nome exato, fabricante ou criador, problema que resolve, princípio de funcionamento (o porquê físico: efeito solo, reação do magnésio com sal, vasos da palma no infravermelho), 3 a 5 recursos com número, resultado de teste, preço convertido em reais, estágio e onde se compra. Vídeo ou imagem do objeto em ação para a edição.
- Tipo de prova: a especificação traduzida em benefício e a comparação tangível. Densidade: mediana de 1,0 número por 100 palavras sem anos, mas com unidade física; cada número difícil pede uma analogia.
- Estrutura: gancho com o efeito mais espantoso; nome; problema em 1 ou 2 linhas; funcionamento; escada de recursos do menos ao mais impressionante; preço e estágio; o que isso representa.
- Tamanho: mediana 368 palavras (303 a 404).
- Fecho: tendência ("a IA está saindo da tela e entrando nos objetos"), lição de inovação ou pergunta ("te anima ou te assusta?").
- Registro: 80% analítico, com espanto. Fica emotivo quando a coisa serve a quem sofre (cegos, idosos, casais inférteis, vítimas da dengue). Âncora: 60% notícia.
- O revisor cobra: cada recurso vira cena de uso para o espectador; analogia para todo número difícil; estágio honesto (protótipo não é produto à venda); preço em reais; nenhum recurso sem fonte; o "como funciona" está explicado e não só anunciado.

### 4. Panorama (`panorama`): 17 roteiros, 10,1%

**Definição.** O roteiro defende uma tese sobre o mundo (algo está acontecendo, vai acontecer ou é maior do que parece) e prova com dados de várias fontes, ligando causa e consequência até o bolso ou a vida do espectador. Não há um caso único dono do vídeo: os casos, quando aparecem, são exemplos numa lista.

**Sinais na página.**
- Gancho afirma um estado do mundo: "O cinema morreu", "A China está afundando o valor do seu carro", "Os jovens já não pensam mais em carteira assinada".
- Três ou mais dados de fontes diferentes, com instituição nomeada (MEC, Federal Reserve, Sebrae, Procon, TSE, FGV, Hibou).
- Comparações de série ou de país ("172 milhões em 2019, 116 milhões em 2025"; "7% contra 5%").
- Cadeia "quando X, Y": "o produto encalha, o preço despenca, o real enfraquece, o adubo fica mais caro".
- "E não é um caso isolado", "Esse movimento já vinha sendo sentido".

**Âncoras.** `9b31fe9f-6736-44b4-9381-39f3be79bb09` (o cinema vai acabar), `e8db7289-95d5-4af8-ad53-6efc27cf9720` (a China afundou o valor do seu carro), `877388f8-b7f6-4f94-8c21-93a75a36c043` (por que tantos brasileiros apostam).

**O que pede de cada etapa.**
- Pesquisa: a tese em uma frase e 4 a 8 dados de fontes distintas, todos com ano; uma série (antes e depois) ou comparação (Brasil e outro país); 1 a 3 exemplos nominais; os elos da cadeia causal até o espectador, cada um verificável.
- Tipo de prova: estatística agregada com fonte nomeada e a cadeia de consequências. É o modo de maior densidade: mediana de 1,5 número por 100 palavras sem anos (2,4 com anos), com p75 em 2,9.
- Estrutura: afirmação forte; o dado maior primeiro; empilhamento; causa; cadeia até o bolso; ressalva ("mas nem tudo é garantia"); fecho.
- Tamanho: mediana 408 palavras (374 a 427).
- Fecho: consequência concreta para o espectador ("quem paga a conta é você na feira") ou regra geral ("quem compra no auge paga a conta de quem compra depois").
- Registro: 76% analítico; fica emotivo quando denuncia alguém (governo, CEOs, "a grande mídia te enganou"). Âncora: 100% notícia.
- O revisor cobra: fonte e ano em cada número; números comparáveis (mesma base, mesmo período); a cadeia não pula elo; a tese não diz mais do que os dados mostram; a ponte com o espectador é concreta.

### 5. Conselho (`conselho`): 9 roteiros, 5,4%

**Definição.** O protagonista é o espectador. O roteiro ensina algo para ele fazer, parar de fazer ou passar a acreditar: técnica, ferramenta, direito, hábito, mentalidade. Convence pela lógica e pelo exemplo literal, não por fato pesquisado.

**Sinais na página.**
- Segunda pessoa dominante e imperativo: "Faça o seguinte", "Antes de abrir a boca, lembre", "Começa abrindo o seu navegador", "Use extração, não resumo".
- Técnicas numeradas ("A primeira técnica... A segunda... Já a terceira").
- Exemplo literal do que dizer ou digitar ("parece que você está frustrado com essa situação", o prompt colado entre aspas).
- Pouco ou nenhum número (mediana de 0,4 por 100 palavras).
- CTA de salvar ou compartilhar por utilidade.

**Âncoras.** `682d68fe-6b3b-4da6-a7b9-615f9316acb8` (conversar com quem você não gosta), `68b9f3fd-0e63-4619-a344-c168fdf533c6` (isenção de IPTU), `8a1b1b84-e6a2-4faf-bcb1-80d51f2a4c44` (como usar o Grok).

**O que pede de cada etapa.**
- Pesquisa: mínima e de verificação. Os passos funcionam, a regra está vigente, o site existe, a técnica tem origem (FBI, estudo, autor). Exemplos do cotidiano do público (o colega desagradável, o boleto do IPTU).
- Tipo de prova: lógica, exemplo literal, autoridade e demonstração em tela.
- Estrutura: o erro ou a dor do espectador ("99% usa errado"); o custo de não agir; 2 ou 3 técnicas em imperativo, cada uma com exemplo literal; regra de bolso.
- Tamanho: o mais curto. Mediana 302 palavras (228 a 339).
- Fecho: regra de comportamento e pedido de salvar ou compartilhar.
- Registro: analítico e instrucional (8 de 9). Âncora: 100% atemporal.
- O revisor cobra: o espectador consegue aplicar amanhã; todo passo tem exemplo literal; nada inventado sobre a autoridade citada; sem enrolação antes do primeiro passo.

### 6. Publi (`publi`): 4 roteiros, 2,4%

**Definição.** O roteiro existe para converter: vender um curso ou produto do cliente ou parceiro, ou pedir voto. A primeira metade costuma ser de outro modo (notícia, dica de ferramenta) e serve de ponte para a oferta.

**Sinais na página.** Preço de produto ("Custa apenas R$ 37", "3 parcelas de R$ 12,33"); "Comenta EXAME", "Comenta EU QUERO"; "link da bio pra acessar"; CTA separado por plataforma ("CTA Instagram", "CTA TikTok"); número de candidato ou "meu voto é".

**Âncoras.** `a96e1349-34a9-477e-b086-3ee385906b1a` (Vale do Silício goiano e Pré-MBA), `54f7500c-de2a-45a4-b029-f03019c257f6` (segurança pública e candidato).

**O que pede de cada etapa.** Pesquisa: o briefing da oferta (nome exato, preço, condições, link, benefícios, regras eleitorais) e um gancho de conteúdo atual. Prova: benefício concreto e preço ancorado ("menos que um café por mês"). Estrutura: conteúdo de entrada, ponte ("por isso, mais do que nunca, você precisa..."), oferta, CTA por plataforma. Tamanho: mediana 347 palavras. Fecho: CTA de conversão. O revisor cobra: dados da oferta exatos, CTA certo por plataforma, conformidade (propaganda eleitoral, promessa de resultado).

### 7. Misto (`misto`): 3 roteiros, 1,8%

Use **só** quando o corpo tem duas metades de modos diferentes, de tamanho parecido, **e** o gancho não promete nenhuma das duas com clareza, depois de aplicar todas as regras de desempate abaixo. Não use misto para "tem um pouco de tudo": quase todo roteiro tem. Exemplos: `c2203af9-16e5-4871-8c38-56ab466811a0` (Havan: o gancho pergunta "por quê", mas o corpo é metade processo judicial cronológico, metade planejamento tributário genérico), `07a75fc8-36aa-4be2-b2c0-68f364affc0e` (castanha de caju: metade panorama do gasto europeu, metade a descoberta), `af23f76d-1714-4256-88cd-5aa6aff703a8` (HomePod: histórico do produto e rumor, sem mecanismo nem demonstração dominantes). Se misto passar de 5% num lote, o rotulador está desistindo cedo demais.

---

## Regras de decisão entre vizinhos

Aplique na ordem. Sempre ignore as notas ao editor, a sugestão de b-roll, a legenda e a assinatura final ("Eu sou X... me segue").

**R0. Publi vence tudo.** Se há oferta (preço de produto, "comenta X que eu te mando", "link da bio pra acessar", pedido de voto ou número de candidato), é `publi`, qualquer que seja o resto. "Segue meu perfil" e "é aí que eu entro, segue o meu perfil" não são oferta.

**R1. História contra mecanismo** (a confusão mais comum: negócios contados com lição no fim).
- Leia só o corpo. Conte as linhas que narram acontecimentos no tempo e as linhas que explicam regra, estratégia ou conta.
- Mais da metade das linhas de acontecimento: `historia`. Mais da metade de explicação: `mecanismo`. Estratégia contada como ação no tempo ("ela lançou", "eles cortaram o preço") conta como acontecimento; só conta como explicação a linha que diz por que ou como aquilo funciona.
- Empate exato: decide o gancho. Gancho promete "como" ou "por quê" (segredo, jogada, truque, o motivo, "você vai entender") leva a `mecanismo`; gancho promete "quem" ou "o que aconteceu" (de X a Y, morreu na miséria, recusou 1 bilhão) leva a `historia`.
- A lição final estratégica não transforma história em mecanismo. Exemplos: Nubank `2ed33cc8-ead5-4e26-b749-1043ec59ce4f` é história (cena no banco, fundação, convites, resultado; o mecanismo aparece em 2 linhas); Assaí `214cedde-3dad-45cb-88a7-e68c3c586949` é mecanismo (a origem ocupa 6 linhas, o público empreendedor, os 16% contra 42% e o Assaí Pay ocupam 9).

**R2. História contra demonstração** (estudantes e inventores).
- Pergunte quem é o sujeito da maioria das frases do corpo: as pessoas ("os estudantes decidiram", "ela passou dois anos") levam a `historia`; a coisa ("o sistema captura", "a lanterna funciona", "ele tem sensores") leva a `demonstracao`.
- Atalho: se há "funciona assim" seguido de 3 ou mais linhas de funcionamento ou especificação, é `demonstracao`. Exemplos: Fonteviva `87d8ba56-4748-47c7-87e8-2a7b4c9948c4` é demonstração; estudantes maranhenses `3a9c1214-0274-4b5a-842a-68611f79775b` são história (a solução ocupa 2 linhas, o resto é a equipe e o reconhecimento).

**R3. Mecanismo contra demonstração.**
- O que está sendo explicado? Como uma coisa funciona fisicamente (motor, sensor, reação química, algoritmo): `demonstracao`. Como uma decisão, regra ou negócio funciona (imposto, modelo de receita, estratégia de lançamento): `mecanismo`.
- Produto apresentado como jogada da empresa ("O mais interessante não é o carro em si. É o que a BMW decidiu fazer"): `mecanismo` se as linhas de estratégia superam as de especificação. Exemplo: BMW iX5 `4aa6f836-6c99-4153-828a-073a1609d1f7`.

**R4. Mecanismo contra panorama.**
- Pergunte o que o espectador sai sabendo: COMO um caso ou regra funciona (`mecanismo`) ou QUE algo está acontecendo e de que tamanho (`panorama`).
- Um caso ou uma regra explicada em detalhe: `mecanismo` (imposto de importação do carro elétrico `e9003adc-97c8-4eb0-b7cb-8f777a619053`). Tese sobre tendência em que nenhum caso único é dono do vídeo: `panorama`, mesmo que os dados venham de uma fonte só ou sem fonte nomeada (várias fontes e lista de 3 ou mais exemplos são sinais, não exigência). Se uma empresa só é dona do vídeo e a tendência é pano de fundo, é `mecanismo`. Exemplos de `panorama`: (taxa das blusinhas `986a8088-d82b-41f7-9272-a43d831d2257`, demissões por IA `72712ff4-4a77-4b14-8642-218ec4de2854`).

**R5. Panorama contra história.** Sequência de eventos de um caso só (o iate do Vorcaro `092331ef-b08e-401c-9809-a9bbbb516f5b`) é `historia`. Sequência de eventos usada para sustentar um risco e descer até o bolso do espectador (Maduro, Cuba e o dólar `bacfa102-17aa-47ce-aa74-db7255102d84`) é `panorama`.

**R6. Conselho contra mecanismo.** Se o espectador recebe instruções para fazer (imperativo, técnica com exemplo literal, direito a pedir), é `conselho` (técnicas do FBI `9edda80d-1075-42a1-9f0d-7360e2ab6b4c`). Se recebe a explicação de como outra pessoa ou empresa fez, com lição no fim, é `mecanismo` (os gestos de Trump `f89ce13b-78f4-4ede-876c-8e1482cf65c6`, marketing da rejeição da BMW `8b142c6e-1e54-4c47-9365-30ab6796f8b6`).

**R7. Conselho contra demonstração (ferramentas de IA).** "Você está usando errado, faça assim", com passos: `conselho`. "Essa ferramenta faz X, Y e Z", com recursos: `demonstracao` (NotebookLM `d9b42856-75a9-46d3-bc71-53162549a038`, Claude Code `1bdc37a4-1fab-4c82-b5b8-ea2414f085ca`).

---

## Dimensões auxiliares

Testei tratar modo como cruzamento de três dimensões (âncora, tipo de prova, registro). O tipo de prova não é independente: ele coincide com o modo quase por definição (dado com panorama, cena com história, funcionamento com demonstração, explicação com mecanismo, instrução com conselho). Por isso modo fica como categoria e só duas dimensões valem rótulo próprio, porque atravessam os modos e mudam etapas do pipeline.

### `ancora`: de onde vem o fato que dá motivo ao vídeo

| Valor | Quando | Muda o quê |
|---|---|---|
| `noticia` | o fato central é marcado como recente: ano corrente ou anterior apresentado como novidade, ou "acabou de", "agora", "essa semana", "recentemente", "vai lançar", "foi anunciado" | pesquisa busca a última versão do fato e confere data; revisor cobra atualidade |
| `passado` | o fato central é uma história concluída há mais de cerca de 1 ano (biografia, caso antigo, trajetória), mesmo que termine em "hoje fatura X" | pesquisa vai a arquivo, perfil, livro, processo |
| `atemporal` | não há evento datado no centro: técnica, conceito, regra vigente, prática de empresa, máquina que existe há tempo, hábito | pesquisa vai a fonte explicativa ou especialista; não precisa de gancho de data |

O ano não decide sozinho: decide como o texto apresenta o fato central. Apresentado como novidade ou em andamento ("acabou de", "agora", "foi anunciado", "está acontecendo"): `noticia`. Apresentado como história concluída, mesmo que recente: `passado`. Sem data nenhuma e contado como trajetória: `passado`.

Quando o gancho usa um fato recente só como isca e o corpo trata de algo permanente (Anitta e Maisa de iPhone abrindo uma explicação sobre a marca Apple), vale o corpo: `atemporal`.

### `registro`: com o que o texto trabalha no espectador

| Valor | Quando |
|---|---|
| `emotivo` | o texto trabalha sentimento em relação a pessoas: admiração ou orgulho por quem superou, indignação contra quem errou ou enganou, compaixão por quem sofre. Precisa de pelo menos dois destes sinais: (a) cena de sofrimento, injustiça ou superação com detalhe; (b) julgamento moral do narrador sobre pessoas ou instituições ("por inveja", "fazendo o povo de otário", "herói esquecido"); (c) apelo coletivo de orgulho ou revolta ("o Sertão mandou uma pessoa só", "Nós, mulheres empresárias"); (d) fecho de valor (coragem, caráter, generosidade, justiça) ou pedido de compartilhar por causa ("compartilha se você acredita que Chagas deveria ser mais conhecido") |
| `analitico` | o texto trabalha entendimento e curiosidade: como funciona, quanto vale, o que fazer. Espanto e exagero ("insano", "absurdo", "olha isso", "humilhou") **não** tornam o registro emotivo |

### Combinações observadas (168 roteiros)

Modo por âncora:

| modo | notícia | passado | atemporal |
|---|---|---|---|
| historia | 9 | 44 | 0 |
| mecanismo | 23 | 17 | 12 |
| demonstracao | 18 | 4 | 8 |
| panorama | 17 | 0 | 0 |
| conselho | 0 | 0 | 9 |
| publi | 3 | 0 | 1 |
| misto | 2 | 1 | 0 |
| **total** | **72 (43%)** | **66 (39%)** | **30 (18%)** |

Modo por registro:

| modo | analítico | emotivo |
|---|---|---|
| historia | 32 | 21 |
| mecanismo | 50 | 2 |
| demonstracao | 24 | 6 |
| panorama | 13 | 4 |
| conselho | 8 | 1 |
| publi | 3 | 1 |
| misto | 2 | 1 |
| **total** | **132 (79%)** | **36 (21%)** |

As seis combinações mais comuns cobrem 67% da amostra: história passado analítico (27), mecanismo notícia analítico (22), história passado emotivo (17), mecanismo passado analítico (17), demonstração notícia analítico (16), panorama notícia analítico (13).

### Tamanho e densidade numérica medidos

Palavras faladas por roteiro (inclui assinatura e CTA, exclui notas e b-roll) e números escritos em algarismo por 100 palavras.

| modo | palavras, mediana (p25 a p75) | números por 100 palavras, sem anos | com anos |
|---|---|---|---|
| historia | 401 (358 a 438) | 1,3 | 2,0 |
| mecanismo | 376 (346 a 410) | 1,0 | 1,6 |
| demonstracao | 368 (303 a 404) | 1,0 | 1,2 |
| panorama | 408 (374 a 427) | 1,5 | 2,4 |
| conselho | 302 (228 a 339) | 0,4 | 0,4 |
| publi | 347 (280 a 444) | 1,7 | 1,7 |

Duas consequências para as regras gerais de hoje. A faixa de 420 a 500 palavras fica acima do p75 de quase todos os modos publicados. O teto de "2 números a cada 100 palavras" só aperta em panorama; nos outros modos a casa já escreve bem abaixo dele. E "um personagem nomeado carrega a história" vale para história, em parte para mecanismo e demonstração, e não vale para panorama nem conselho, que não têm personagem único.

---

## O que a hipótese do Igor acertou e errou

**Acertou.**
- Existe um modo cuja prova é empilhar fatos e dados para sustentar uma narrativa: é o **panorama** (10%). Pesquisa, prova e revisão dele são outras.
- Existe uma diferença real entre convencer por dado e convencer por emoção, e ela muda a escrita e a revisão.
- Notícia é material frequente: 43% dos roteiros têm âncora em fato recente.

**Errou.**
- **"Notícia" não é modo, é âncora.** Os 72 roteiros de notícia se dividem em mecanismo (23), demonstração (18), panorama (17), história (9) e outros. Notícia muda a pesquisa (buscar o fato mais recente, conferir data), mas não muda o que conta como prova. A maior parte das notícias da casa é **explicada** (mecanismo), não **provada com pilha de dados**.
- **"Emotivo" não é modo, é registro.** Aparece em 21% dos roteiros, mais da metade em história (21 dos 36). Mecanismo quase nunca é emotivo (2 de 52).
- **O pacote "demonstrações, exemplos, explicação e emoção" se separa em três coisas diferentes:** demonstração (a coisa funcionando, 18%, 80% analítica), mecanismo (a explicação, 31%, 96% analítica) e o registro emotivo (que atravessa os modos). Juntar isso numa skill só reproduziria o problema do caminho único.
- **Faltavam dois modos grandes:** história e mecanismo, que somam 62% da amostra. São os dois modos de "caso", e a diferença entre eles (o corpo avança pelo tempo ou pela explicação) é a decisão mais importante para a skill.
- **Faltavam dois modos pequenos:** conselho (5%, sem pesquisa factual, mais curto) e publi (2%, guiado por briefing de oferta).

---

## Como rotular (instruções para o rotulador)

Você vai ler um roteiro por vez e devolver uma linha JSON. Siga os passos na ordem. Não procure desempenho em lugar nenhum.

**Passo 0. Limpe.** Ignore notas ao editor, ao consultor ou à roteirista (texto entre parênteses começando com "Nota"), sugestões de b-roll, blocos "TAKE", "Legenda:", "Vídeo de Modelagem", e a assinatura final ("Eu sou X... segue o meu perfil"). O que sobra é o gancho (1 a 3 primeiras frases), o corpo e o fecho (a lição antes da assinatura).

**Passo 1. Publi?** Se houver oferta de produto, curso ou candidato (preço, "comenta X", "link da bio pra acessar", pedido de voto, número de candidato), `modo = publi`. Vá ao passo 5.

**Passo 2. Protagonista.** De quem ou do que fala a maioria das frases do corpo?
- o espectador, em segunda pessoa e imperativo: candidato `conselho`
- uma coisa (produto, invenção, máquina, ferramenta, método): candidato `demonstracao`
- uma pessoa, família, empresa ou marca agindo ao longo do tempo: candidato `historia`
- um caso, decisão, regra ou estratégia sendo explicada: candidato `mecanismo`
- um fenômeno, tendência, mercado, país ou risco, sem caso único dono do vídeo: candidato `panorama`

**Passo 3. Confirme pelo avanço do corpo.**
- avança por datas e acontecimentos: `historia`
- avança por explicação ("funciona assim", "ou seja", "a diferença", "o motivo"): `mecanismo`
- avança por recursos e funcionamento ("olha isso", "e não para por aí", especificações com unidade): `demonstracao`
- avança por dados de fontes diferentes e cadeia de consequência: `panorama`
- avança por passos e instruções: `conselho`

**Passo 4. Se os passos 2 e 3 discordarem,** aplique as regras R1 a R7 da seção "Regras de decisão entre vizinhos". Se ainda houver empate, decide o que o gancho promete. Só se o gancho também não decidir, `modo = misto`.

**Passo 5. Âncora.** `noticia`, `passado` ou `atemporal`, pela tabela da dimensão. Olhe o fato central do corpo, não só a isca do gancho.

**Passo 6. Registro.** `emotivo` só com dois ou mais dos sinais (a) a (d), e sinais diferentes: o mesmo sinal repetido conta uma vez. Espanto e superlativos não contam. Uma coisa que serve a quem sofre (demonstração para cegos, doentes) só é emotiva se houver cena de sofrimento com detalhe (a) mais outro sinal. Na dúvida, `analitico`.

**Passo 7. Confiança.**
- `alta`: os passos 2 e 3 apontaram o mesmo modo sem esforço.
- `media`: precisou de uma das regras R1 a R7 ou de contagem de linhas.
- `baixa`: decidiu pelo gancho no desempate, ou usou `misto`.

**Saída** (uma linha por roteiro, valores exatamente assim, sem acento):

```json
{"script_id": "<id>", "modo": "historia|mecanismo|demonstracao|panorama|conselho|publi|misto", "ancora": "noticia|passado|atemporal", "registro": "analitico|emotivo", "confianca": "alta|media|baixa"}
```

**Calibragem esperada num lote grande** (pela amostra): história e mecanismo perto de 30% cada, demonstração perto de 18%, panorama perto de 10%, conselho perto de 5%, publi perto de 2%, misto abaixo de 3%. Confiança baixa em menos de 10%. Se misto passar de 5% ou panorama passar de 20%, revise: o erro típico é chamar de panorama todo roteiro com muitos números, quando o que define panorama é a tese sobre tendência provada por várias fontes, não a quantidade de números.

**Casos de calibragem para conferir antes de rotular o lote** (os mais instrutivos da amostra):

| script_id | modo | por quê |
|---|---|---|
| 2ed33cc8-ead5-4e26-b749-1043ec59ce4f | historia | Nubank: lição de mecanismo no fim, corpo cronológico (R1) |
| 214cedde-3dad-45cb-88a7-e68c3c586949 | mecanismo | Assaí: começa como história, corpo explica o público e o Assaí Pay (R1) |
| 87d8ba56-4748-47c7-87e8-2a7b4c9948c4 | demonstracao | estudantes, mas "funciona assim" e especificações dominam (R2) |
| 3a9c1214-0274-4b5a-842a-68611f79775b | historia | estudantes, solução em 2 linhas, resto é a equipe (R2) |
| 4aa6f836-6c99-4153-828a-073a1609d1f7 | mecanismo | carro novo, mas o corpo é a estratégia da BMW (R3) |
| e9003adc-97c8-4eb0-b7cb-8f777a619053 | mecanismo | uma regra de imposto explicada em detalhe (R4) |
| 986a8088-d82b-41f7-9272-a43d831d2257 | panorama | decisão de governo provada por cadeia macro até o bolso (R4) |
| 092331ef-b08e-401c-9809-a9bbbb516f5b | historia | escândalo atual contado como sequência de eventos (R5) |
| f89ce13b-78f4-4ede-876c-8e1482cf65c6 | mecanismo | decodifica os gestos de Trump, não instrui (R6) |
| 9edda80d-1075-42a1-9f0d-7360e2ab6b4c | conselho | técnicas do FBI com frase literal para usar (R6) |
| 9f4e35fd-55d5-4544-a1da-9f780d97b7cb | mecanismo, atemporal | isca recente (Anitta e Maisa), corpo permanente |
| 1bdc37a4-1fab-4c82-b5b8-ea2414f085ca | demonstracao | ferramenta descrita por recursos, sem passos (R7) |
