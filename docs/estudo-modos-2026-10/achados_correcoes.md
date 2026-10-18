# Correções do time contra os modos de roteiro

Base: 46 lições de `correcoes.json`, 156 aprendizados, 37 roteiros rotulados pelo `codebook.md`. Rótulos completos, com id inteiro e justificativa de cada um, em `correcoes_rotuladas.json`. Aqui os ids aparecem pelos 8 primeiros caracteres.

## 1. Resumo em 8 linhas

1. São 156 aprendizados. 62 valem para qualquer roteiro, 61 dependem do modo, 17 são gosto de cliente, 6 são escolha de pauta e 10 só valiam para aquele roteiro.
2. O que vale para tudo é checagem e clareza: fato com fonte, gancho que se entende de primeira, cortar enrolação, explicar sigla. Quase toda a revisão (28 de 30) é comum.
3. O que muda com o modo é a estrutura (15 de 15) e metade do gancho e do fecho: abrir pelo personagem, pelo dado, pelo efeito ou pela contradição depende de ser história, panorama, demonstração ou mecanismo.
4. Tom é do cliente: Franklin quer "jogo estratégico", Ricardo quer alarme, Izabela quer oportunidade. Isso vai para o perfil, não para regra geral.
5. Das 23 contradições, 10 somem separando por modo, 4 separando por cliente ou pauta, 3 são exagero de um caso só e 6 são reais. A mais visível: a lição ativa manda cortar "agora vem a parte..." e outro aprendizado manda escrever exatamente isso.
6. As queixas que mais voltam: gancho que não entrega o impacto (12 lições), fecho e CTA (12), fato errado (9, mesmo com checagem), material do usuário cortado (6), falta de personagem ou emoção (6).
7. Os roteiros corrigidos são 54% mecanismo e 73% notícia (na casa, 31% e 43%). Demonstração cai de 18% para 8% e conselho some. Mesmo só entre notícias, mecanismo fica em 52% contra 32% da casa.
8. As correções puxam para o outro lado (pedem personagem e emoção, tiram o "segredo" de produto), o que sugere um Codex que escreve tudo como "explicar a jogada". Com 37 roteiros e pautas repetidas, é sinal, não prova.

## 2. Alcance

### Total

| alcance | aprendizados | % |
|---|---|---|
| universal | 62 | 40% |
| modo | 61 | 39% |
| cliente | 17 | 11% |
| caso | 10 | 6% |
| pauta | 6 | 4% |
| **total** | **156** | |

Os 4 aprendizados ativos (78361ea0, 3a7a7215, f8cff418, ac05ad5f) são todos universais.

### Por etapa do pipeline

| etapa | universal | modo | cliente | pauta | caso | total |
|---|---|---|---|---|---|---|
| premissa | 1 | 6 | 4 | 4 | 0 | 15 |
| pesquisa | 7 | 7 | 2 | 0 | 1 | 17 |
| estrutura | 0 | 15 | 0 | 0 | 0 | 15 |
| hook | 11 | 14 | 3 | 0 | 2 | 30 |
| corpo | 9 | 11 | 1 | 2 | 4 | 27 |
| fecho | 4 | 3 | 1 | 0 | 2 | 10 |
| comando | 2 | 4 | 3 | 0 | 0 | 9 |
| revisao | 28 | 1 | 0 | 0 | 1 | 30 |
| tom | 0 | 0 | 3 | 0 | 0 | 3 |

O desenho que sai daqui: revisão é comum, estrutura é do modo, tom é do cliente, premissa é pauta ou cliente. Gancho e corpo se dividem: a regra de clareza é comum, a fórmula é do modo.

### Por modo do roteiro de onde o aprendizado saiu

| modo do roteiro | aprendizados | universal | modo | cliente | pauta | caso |
|---|---|---|---|---|---|---|
| mecanismo | 76 | 36 | 27 | 4 | 3 | 6 |
| panorama | 30 | 6 | 19 | 2 | 1 | 2 |
| historia | 28 | 13 | 10 | 3 | 0 | 2 |
| demonstracao | 10 | 2 | 5 | 3 | 0 | 0 |
| sem roteiro | 12 | 5 | 0 | 5 | 2 | 0 |

Mecanismo tem muito universal porque é onde caíram os relatórios do checador (iPhone, bets, terras raras). Panorama é o que mais gera regra própria (19 de 30). Demonstração tem poucos aprendizados e quase metade é preferência da Izabela.

Dos 61 aprendizados de modo, quantos valeriam em cada skill: mecanismo 45, panorama 40, história 23, demonstração 10, conselho 2, publi 1. Só 18 servem a um modo único (mecanismo 7, panorama 4, história 4, demonstração 3); os outros servem a dois ou três modos vizinhos, quase sempre mecanismo e panorama juntos.

Por origem: as 22 lições de edição humana dão só 6 universais e 12 de modo; as correções na sala dão 51 universais em 121, puxadas pela checagem de fato.

### Modo dos roteiros corrigidos contra a casa

37 roteiros rotulados (36 completos e um só com o gancho). Confiança: 12 alta, 24 média, 1 baixa.

| modo | casa (168) | corrigidos (37) | sem pauta repetida (32) | casa, só notícia (72) | corrigidos, só notícia (27) |
|---|---|---|---|---|---|
| historia | 31,5% | 7 (19%) | 7 (22%) | 12,5% | 4 (15%) |
| mecanismo | 31,0% | 20 (54%) | 16 (50%) | 32% | 14 (52%) |
| demonstracao | 17,9% | 3 (8%) | 3 (9%) | 25% | 2 (7%) |
| panorama | 10,1% | 7 (19%) | 6 (19%) | 24% | 7 (26%) |
| conselho | 5,4% | 0 | 0 | 0 | 0 |
| publi | 2,4% | 0 | 0 | 4% | 0 |

| dimensão | casa | corrigidos |
|---|---|---|
| âncora notícia | 43% | 27 (73%) |
| âncora passado | 39% | 3 (8%) |
| âncora atemporal | 18% | 7 (19%) |
| registro emotivo | 21% | 9 (24%) |

O Codex parece puxar para mecanismo. Três coisas sustentam isso:

- **A distribuição.** Mecanismo dobra e demonstração cai à metade. Parte disso é o tipo de pauta que passa pelo Codex (notícia, quase nada de biografia antiga). Mas, comparando só notícia com notícia, mecanismo ainda fica 20 pontos acima da casa (14 de 27, quando o esperado seria 9). Tirando as pautas repetidas (três versões do iPhone, duas da MP das bets), a sobra cai para 11 de 24 contra 8 esperados, e aí já não dá para separar do acaso.
- **O que as correções descrevem da versão anterior.** No Google AI Pro e no chip da MediaTek, o Codex tinha escrito "a estratégia oculta" e "a decisão que os sites ignoraram" (mecanismo), e o usuário pediu benefício e capacidade (demonstração). No Coxon, o Codex fez lista de eventos e o usuário pediu personagem (história). O próprio aprendizado 7e968f06 diz que "a sala tende a default para Estratégia Oculta". Contando a versão anterior desses casos, mecanismo passaria de 20 para 22 dos 37.
- **O sentido das correções.** Seis lições pedem personagem ou emoção (Trump, El Salvador, Nike, Coxon, bets, Bahia) e duas tiram a moldura de segredo de produto. Só uma empurra de história para mecanismo (Odebrecht, pedido do Franklin).

Efeito colateral no tamanho: os roteiros de mecanismo corrigidos têm mediana de 422 palavras, contra 376 na casa; 11 de 19 passam do p75 da casa (410).

## 3. Contradições

| # | A | pede | B | pede | explica |
|---|---|---|---|---|---|
| 1 | 78361ea0 (ativa) | cortar "Agora vem a parte que interessa pro seu bolso" | 928a9453 | escrever "Agora vem a parte genial da jogada" | **nada**: contradição real |
| 2 | 9c416f65 | desconfiar de superlativo absoluto | d3f39c0d | "pela primeira vez em nossa história" | **nada**: resolve com "superlativo só com fonte" |
| 3 | 9c416f65 | absoluto expõe a correção | 9d1e3e4c | não qualificar o gancho, absoluto prende | modo: o absoluto retórico do gancho de mecanismo não é fato verificável |
| 4 | 09f787b6 (+73dd12d3, 02760182) | gancho entendido na primeira leitura | 9d1e3e4c | ambiguidade que obriga a ficar | modo: absurdo compreensível (mecanismo) não é confusão de referente |
| 5 | 53952941 | usar o número máximo | 53ec67ee (+9c416f65) | período e base de cada número | caso: generalizou uma correção de preço errado |
| 6 | 893f1cbc | abrir pelo dado agregado, não pela história individual | e4bae783 (+d605daf3, 1527f486) | personagem nomeado, não massa de eventos | modo: panorama contra história; nos dois casos o usuário trocou o modo da peça |
| 7 | 23650f6e | dado agregado prova a escala | 29786df3 | fato isolado em vez de tese ampla | modo: 29786df3 é "evite panorama", tirado de 10 vídeos |
| 8 | 1fb1a9dd | vários exemplos nomeados | 7fc52bcc (+b2ecc40a) | um eixo só, tirar outras marcas | modo: panorama empilha, mecanismo mantém um caso |
| 9 | 7e968f06 (+3c3df870) | oportunidade, não estratégia oculta | ef5f8b0a | bastidor silencioso que chega à mesa | cliente (Izabela contra Franklin) e modo (demonstração contra mecanismo) |
| 10 | 91e30691 (+49d6b498) | abrir pelo efeito, tirar "decisão que ninguém viu" | f720a830 (+e1b2c016, e962c486) | Revelação Secreta como motor do gancho | modo: demonstração contra mecanismo; Revelação Secreta também é lift de Marcelo Germano |
| 11 | e5c34af6 (+d1a1c722) | paradoxo estratégico, não denúncia | d61aeb94 (+949f8358) | gancho mais alarmista, nomear a revolta | cliente: Franklin contra Ricardo e Fernando |
| 12 | d61aeb94 | mais alarmista | efb4912d | ameaça abstrata está entre os piores | **nada**: concilia se o alarme vier com data e número |
| 13 | 8c5f9581 | fatos datados viram passos de plano | db6fd7e5 (+30d88c18) | personagem e cronologia sem buraco | modo: 8c5f9581 transforma história em mecanismo |
| 14 | 11154422 (+1f025268) | aprofundar a queda como traição de identidade | d1a1c722 | poder como jogo, não denúncia | cliente e registro: Nike (sem cliente) contra Odebrecht (Franklin) |
| 15 | 1846b7a8 (+ee35b81a) | frase-síntese antes do CTA | fc8a0c30 | cortar a reflexão final porque o CTA já vira | caso: depende de o CTA do cliente carregar a virada |
| 16 | 7b32d3c9 | fechar com pergunta de opinião | 1846b7a8 (+27cbf361) | fechar com frase de impacto | modo e registro; não são exclusivas |
| 17 | 5f0c1dfc (+768afa86, 53dd22ad) | CTA de seguir por exclusividade | 288eac63 (+5d3003ed) | CTA de compartilhar por causa | registro: analítico pede seguir, emotivo pede compartilhar |
| 18 | 9cab2f26 | incluir até menção secundária do briefing | b2ecc40a (+c012b7a7) | tirar outras marcas, enxugar lista | caso: cada usuário pediu uma coisa; a regra é "siga o briefing" |
| 19 | b6866347 (+507764ea) | cadeia causal completa, elo por elo | 49435f67 | cadeia sem fonte sai | **nada**: complementares só com "cada elo com fonte" |
| 20 | 68f33fb3 | "só dois homens decidem" distorce | 56c0dfc3 | nomear Motta e Alcolumbre como "os dois homens" | **nada**: mesma pauta, mesmo dia, duas checagens; o texto final manteve "dois homens" |
| 21 | bc17b075 | emoção antes do dado | 5ca69355 (+51fdf948) | alarme e dado primeiro | modo e registro: história emotiva contra panorama e mecanismo |
| 22 | d46793e0 | sair da disputa entre empresas, ir ao prato | 7d38d1ba | mostrar a disputa (concorrentes, Cade, varejo) | pauta: mesmo cliente, JBS toca o consumidor, Yoki foi pedido de bastidor |
| 23 | d2e5fc8f (+d3f39c0d) | a versão do fato que piora a injustiça | fa7bae45 | maioria não vira unanimidade | **nada**: amplificar contra ser exato |

Resumo: 10 se explicam por modo (inclui registro), 3 por cliente, 1 por pauta, 3 são caso, 6 não se explicam. As 6 reais são de dois tipos: **marcador de virada** (1) e **impacto contra exatidão** (2, 12, 19, 20, 23). O segundo tipo não some com skill por modo. Pede uma regra comum de precisão que diga quando o superlativo, o alarme e a cadeia causal são permitidos (com fonte, com data, com número).

As contradições de modo mostram onde o caminho único briga consigo mesmo: na abertura (personagem, dado agregado, efeito ou contradição), na prova (um caso ou vários exemplos), na ordem (emoção ou dado primeiro) e no CTA (seguir ou compartilhar).

## 4. Temas recorrentes

O campo `grupo` não serve para isso: `estrutura-paradoxo-contraste` junta 33 aprendizados de 13 assuntos diferentes (personagem, precisão, CTA, prova...). Os temas abaixo saem da leitura do texto.

| tema | aprendizados | lições | modos dos roteiros | regra no Codex (pela leitura do pedido) |
|---|---|---|---|---|
| Gancho que não entrega o impacto na primeira frase | 13 | 12 | mec 6, pan 3, hist 2 | existe, mas o tipo de gancho é escolhido sem olhar o modo |
| Fecho e CTA | 18 | 12 | mec 6, pan 4, demo 1, hist 1 | existe (bloco COMANDO); falta o texto por cliente e por registro |
| Fato errado ou sem fonte | 27 | 9 | mec 5, hist 3 | existe (portão de checagem), mas o erro nasce na escrita e às vezes passa |
| Fatos soltos: frase picada, sem conectivo, sem o porquê | 10 | 7 | pan 5, hist 1, demo 1 | faltando |
| Troca de ângulo da pauta | 10 | 7 | mec 3, pan 2, hist 1 | não é regra de escrita |
| Material do usuário ou da fonte cortado | 10 | 6 | mec 5, hist 1 | faltando |
| Falta personagem ou emoção | 9 | 6 | hist 3, pan 2, mec 1 | personagem: existe e é ignorada em notícia; emoção: faltando |
| Pedido literal não aplicado (achado no texto, não nos aprendizados) | 0 | 6 | mec 5, pan 1 | faltando, ou uma regra concorrente reescreve |
| Preferência de cliente (tom e lift) | 8 | 6 | | faltando (não há perfil) |
| Escolha da prova (qual dado) | 8 | 8 | mec 4, pan 4 | a regra de hoje é de densidade; falta a de qual dado por modo |
| Contraste senso comum contra realidade | 7 | 6 | mec 4, hist 2 | existe; pedem mais explícito |
| Moldura de segredo e bastidor | 8 | 5 | demo 2, mec 2, pan 1 | existe como padrão e é aplicada fora do modo |
| Gancho confuso | 7 | 4 | mec 4 | faltando um teste concreto |
| Enrolação e anúncio do que vem | 5 | 4 | mec 3 | ativa desde 06/09; efeito incerto |
| Número sem tradução | 3 | 3 | | parcial (só a comparação está ativa) |
| Sigla, marca ou jargão sem explicação | 3 | 2 | pan 1 | ativa desde 10/10 |
| Amplificar além do fato | 4 | 3 | mec 2, hist 1 | não se aplica (caso) |

Notas sobre os principais:

- **Gancho sem impacto.** É a queixa mais espalhada, e a queixa é universal: a primeira frase não entrega nada. A correção é que muda: pessoa nomeada (Trump), dado agregado (82% endividados), efeito do produto (PC gamer no bolso), contradição (avião que ia levar o pobre), colapso (agro). Uma regra comum de "impacto na primeira frase" e uma fórmula de abertura por modo resolvem as duas metades.
- **Fato errado.** Cinco pedidos são relatórios de checagem colados ("bloqueante", "não bloqueante", "delta-verificação"), então o portão existe. Os erros se repetem em forma: compressão de linha do tempo, superlativo, negócio condicional dito como fechado, hipótese como fato, número sem período. Em três casos quem pegou foi o usuário (Embraer, iPhone a 30 mil, data da Fox Kids). Isso é tarefa da camada comum de escrita, para o erro não nascer, e não só do portão.
- **Fecho e CTA.** As duas edições humanas de julho e agosto (Palmeiras, Ferrero) dizem que a versão da sala terminava sem CTA. Nas versões posteriores o COMANDO sempre aparece. As queixas de agora são sobre o que o CTA promete e para quem: falta perfil de cliente e regra por registro.
- **Material cortado.** Três pedidos são da mesma pauta (iPhone dobrável, dois clientes) pedindo de volta o que estava no briefing. No Muffato, o texto guardado parece ter perdido a parte que o usuário escreveu: "A conta chega sozinha no seu celular" ficou sem o "você entra pelo aplicativo" que explicava a frase.
- **Pedido literal não aplicado.** Comparando o pedido com o texto guardado: o gancho ditado não aparece no GTA 6, no Rolls-Royce nem na MP das bets; no "feito por humanos" o CTA de compartilhar pedido virou "segue o perfil"; em terras raras e na segunda versão das bets o corpo foi corrigido, mas o gancho que a checagem mandou mudar ficou igual ("acabaram de comprar", "a medida que você aplaudiu"). Os aprendizados extraídos supõem que o pedido foi cumprido.
- **Enrolação.** A lição ativa (78361ea0) é de 06/09. Oito dos dez roteiros posteriores ainda têm "Agora olha", "Agora repara", "Agora pensa" ou "Agora coloca". Parte disso é virada legítima ("Agora olha pro Brasil"), então não dá para dizer que a regra é ignorada, só que o padrão continua.

## 5. Proposta de destino

Total: 62 para a camada comum, 61 para modo (48 nas skills de modo, 8 numa camada de registro emotivo, 5 numa de âncora notícia), 17 para o perfil do cliente, 16 descartados.

### Camada comum (62 aprendizados, cabem em 10 regras)

| regra | ids |
|---|---|
| 1. Todo fato com fonte; sem superlativo, prazo, escopo ou conclusão que a fonte não sustente; hipótese marcada como hipótese; número com período | 58f8afe6, 9c416f65, a530fc64, 9fd3ea30, b6e17276, 1a172f0f, 892222af, d32716ef, e2f63706, 8bf47c27, 130ba4fe, f01ec65c, 4c027968, 68f33fb3, fcdd04f9, 53ec67ee, 384cb44d, 49435f67, b3bc6dbf, fa7bae45, 56c0dfc3, c32619a5, f8cff418 (ativa) |
| 2. Corrigir fato sem quebrar o arco | c96476fb, 7231d7d7 |
| 3. Usar o material da fonte e do usuário dentro da narrativa | 2cee55e4, 88177ef0, a311b18e, 3e207043, cb56daf2 |
| 4. Gancho claro: um só, sem antecâmara, com referente, autossuficiente | c9bfcd61, 51936f16, 73dd12d3, 09f787b6, 02760182, da2b124e |
| 5. Impacto concreto na primeira frase, não contexto nem ameaça abstrata | 04937269, 04e0f841, efb4912d |
| 6. Coerência entre gancho, corpo, fecho e CTA | eba0fe14, b2ecc40a, 3896833a, bfbcb082, 27cbf361, b7431b65, 1846b7a8, ee35b81a |
| 7. Cortar anúncio, redundância e lista inchada | 25629faa, c012b7a7, 64a5c847, 78361ea0 (ativa) |
| 8. Costurar com conectivo e explicar cada elo | 8c11b99f, 59dd1576, fa3f1476, b6866347, 57caa066 |
| 9. Linguagem leiga: sigla, marca e jargão explicados | 55d1af11, c535ad95, 3a7a7215 (ativa) |
| 10. Número que se sente: imagem para o grande, contraste só com diferença perceptível | d7b95291, e1f52f92, ac05ad5f (ativa) |

892222af está rotulado como regra do Franklin, mas é precisão geral. A regra 1 precisa de uma cláusula que resolva as contradições 2, 12, 19, 20 e 23: superlativo, alarme e cadeia causal são permitidos quando têm fonte, data e número.

### Skill de cada modo (48)

- **história**: personagem nomeado como fio e cada revelação pela boca dele (db6fd7e5, d65baf61, e4bae783); escolher o alvo pessoal concreto em vez do sistêmico (d3c935d1, d605daf3); cronologia sem compressão (30d88c18); contraste irônico que organiza a queda (0d1a1273); decisão contraintuitiva (d8a9e729); lição que sai da virada (a30e64c0, 21491e78); número de contraste no gancho (4d0fe8c4); um eixo de comparação (7fc52bcc).
- **mecanismo**: senso comum contra realidade dito com todas as letras (d8a9e729, 8fa750cc, 1a3d2dc4, 8297eefb, 0d1a1273); fato bruto do caso antes da leitura (51fdf948); passos marcados (8c5f9581, 10c15cba); um caso e um eixo até o fim (7fc52bcc); gancho de fato absurdo sem qualificador e de inversão de crença (9d1e3e4c, ef8ef37d, 662a4ae8, e1b2c016, f720a830, d605daf3, 4d0fe8c4); o número que mede o efeito e a especificação como prova (031a67d1, f553dc30); a lei por trás e o porquê com frase articulada (b85df3d2, 46e7d4ce, 476cb93b); ponte para o espectador e fecho de regra (21491e78, a30e64c0, 7b32d3c9); CTA de exclusividade ou antecipação para análise (5f0c1dfc, 53dd22ad); moldura de bastidor (ef5f8b0a). Pendente de decisão: 928a9453 (marcar a virada), que contradiz a lição ativa.
- **demonstração**: gancho no efeito mais espantoso (91e30691); ângulo "o que ele faz" (10c7ed3d); sem moldura de investigação (49d6b498); porquê físico explicado (46e7d4ce, 476cb93b); número no gancho (4d0fe8c4); fecho em pergunta (7b32d3c9).
- **panorama**: abrir pelo dado maior ou pela tese explícita (893f1cbc, ab2caa24); em crise, alarme primeiro e grandeza depois (eca66ef3, af94e12e, 5ca69355); prova por exemplos nomeados, número de escala e precedente análogo (1fb1a9dd, 23650f6e, 990fa4ea, 031a67d1); nomear o padrão que une os casos (c624a29b, b85df3d2, 10c15cba); cadeia até o prato e o bolso, com o lado do cidadão (d46793e0, 507764ea, 4ba7cece); fato antes da leitura (51fdf948); fecho de consequência (21491e78, a30e64c0, 7b32d3c9); ganchos compartilhados com mecanismo (662a4ae8, ef8ef37d, e1b2c016, f720a830, ef5f8b0a, 4d0fe8c4); CTA de análise (5f0c1dfc, 53dd22ad).
- **conselho e publi**: nenhum roteiro desses modos foi corrigido. Só herdam 10c15cba (marcadores de etapa) e 4d0fe8c4.

### Camadas que atravessam os modos (13)

- **Registro emotivo** (8): nomear a emoção do grupo (949f8358), emoção antes do dado (bc17b075), cada decisão como traição de identidade (11154422), fatos servindo a uma tese emocional (1f025268), rosto humano para o número (1527f486), privação sentida no corpo (c6634cb5), CTA de compartilhar por causa (288eac63, 5d3003ed). Hoje são aprendizados soltos que valeriam para todos; ativados no caminho único, brigariam com o mecanismo analítico (96% da casa).
- **Âncora notícia** (5): corte da manchete depois do gancho (3383caf4), comparação ancorada em notícia citável (acf076e8), buscar fala pública contraditória (3e8efe54, 70fb2471), dado local e recente (c6c1b6a9).

### Perfil do cliente (17)

| cliente | ids |
|---|---|
| Franklin Tomich | e5c34af6, d1a1c722 (jogo estratégico, não denúncia), 271aa5f9, 768afa86 (CTA), 7d38d1ba, 455fed47 (camada de Cade e concorrência em fusões e aquisições) |
| Izabela Anholett | 7e968f06, 3c3df870, cb0af903 (tecnologia utilitária, fecho em prazo e benefício), 817b3b5c (lift Conflito Declarado), c5844ee1 (lift INOVAÇÃO) |
| Fernando Pereira | ff35f2b1 (lift Urgência) |
| Ricardo Schumacher | d61aeb94 (gancho alarmista) |
| João Paulo Albuquerque | ce227d4b (CTA para o empresário que decide) |
| Pedro Elero | 4bdcf879 (benefício para consumidor e empresário) |
| Lincoln Fracari | fcac289a (lift GEOPOLÍTICA) |
| Marcelo Germano | e962c486 (lift Revelação Secreta) |

### Descartar da escrita (16)

- **Caso** (10): d2e5fc8f, d3f39c0d, e6e95bad, fc8a0c30, 1fff96ba, 6110f329, 9cab2f26, 53952941, ee595b52, 5cf81286. Quatro deles (d2e5fc8f, d3f39c0d, 53952941, 6110f329) empurram para amplificar além do fato.
- **Pauta** (6): 1f672405, 61f662b3, 7772fbab, 08091624 saem. 8117a714 (nome famoso) e 29786df3 (fato isolado em vez de tese) podem ir para a escolha de pauta, não para a escrita; vêm de 10 vídeos e o segundo, aplicado como regra, apagaria o panorama.

## 6. O que não deu para afirmar

- **Sem roteiro.** 9 lições não têm roteiro para rotular: 4 sessões sem texto, 4 linhas de lift do curador e o relatório mensal. Uma (Rolls-Royce, tipo texto) tem só o gancho e entrou com confiança baixa.
- **Antes ou depois.** O texto guardado parece ser a versão depois da correção (Trump, Embraer, Fortlev e Sky mostram o pedido aplicado). Então o modo rotulado é o do roteiro já corrigido, e a versão original do Codex não está nos dados. O que digo da versão anterior vem da descrição dentro dos aprendizados. O tema "pedido literal não aplicado" só vale se o texto guardado for a versão final.
- **Amostra pequena e repetida.** São 37 roteiros e 32 pautas distintas (iPhone 3 vezes, bets 3, feito por humanos 2, Rolls-Royce 2). Franklin Tomich (8 lições, 36 aprendizados) e Fernando Pereira (7) pesam demais; a regra "comum" pode estar falando o idioma deles.
- **Modos sem evidência.** Nenhum roteiro de conselho ou publi foi corrigido, então essas skills não têm o que herdar destas correções.
- **Rótulo de um leitor só.** 24 dos 37 rótulos têm confiança média. Fronteiras discutíveis: avião (mecanismo ou panorama), Ferrero (panorama ou mecanismo), Coxon (panorama ou história), Odebrecht (história ou mecanismo pela R1), Rolls-Royce (mecanismo ou demonstração). Três mecanismos ficaram emotivos (Milei, avião, Bahia), o que é raro na casa (2 de 52) e pode ser leitura minha.
- **Alcance é julgamento, não teste.** "Universal" aqui quer dizer que não atrapalha em nenhum modo, não que foi testado em todos.
- **Regra no Codex.** Inferi pelo pedido, sem abrir o código. "Existe" quer dizer que o pedido ou o texto mostra a regra funcionando em parte (o portão de checagem, o bloco COMANDO, as lições ativas).
- **Defeitos do texto guardado.** Quatro textos começam com o gancho duplicado (agro, avião, Embraer, bets do Túlio): pode ser formato (gancho e alternativa) ou defeito. Isso também infla um pouco a contagem de palavras.
- **Desempenho.** Os únicos números de resultado são os 10 vídeos do curador mensal e os lifts por cliente do estudo de setembro. Nenhum aprendizado foi medido contra desempenho por modo.
