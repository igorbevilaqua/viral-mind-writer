# Modos de roteiro: etapa 1 da reforma por skills

Data: 18/10/2026. Base: 2.832 roteiros escritos pela casa e publicados em 2026 (6.922 vídeos com resultado), 150 roteiros do Codex (a primeira versão de cada sessão, de 23/08 a 17/10) e as 156 correções do time guardadas em `vm_lesson_learnings`.

## Resumo

1. **Os modos existem e dá para rotular com segurança.** São quatro grandes: história (39%), mecanismo (28%), demonstração (18%) e panorama (12%). Conselho e publi somam 4%. Rotuladores independentes concordam em 93% dos casos (kappa 0,91).
2. **"Notícia" e "emotivo" não são modos.** Notícia é a âncora do roteiro (51% da casa) e aparece nos quatro modos. Emotivo é o registro (11%) e se concentra em história. A hipótese inicial juntava coisas que pedem skills diferentes.
3. **Nenhum modo viraliza sozinho.** No alcance os quatro modos empatam. Quem decide continua sendo o payoff, a pauta e a âncora. A exceção é o conselho, que derruba o alcance.
4. **Cada modo move uma métrica diferente.** História segura até o fim (2 vezes mais retenção final) mas é pouco compartilhada. Demonstração é compartilhada e tem a melhor taxa de acerto. Panorama gera comentário e compartilhamento. Conselho gera salvamento. Isso define o que cada skill precisa compensar.
5. **A melhor combinação é história contada a partir de uma notícia** (OR 1,34, replica). História de algo antigo fica abaixo da média (OR 0,81).
6. **Dentro de cada modo, o payoff certo faz diferença.** Em mecanismo, o payoff mais usado é "bastidor revelado", que fica abaixo da média; queda do gigante, disputa e orgulho ganham. Em história, a superação pura perde e orgulho e disputa ganham.
7. **O Codex de hoje puxa tudo para mecanismo.** Com o mesmo mix de clientes, a casa escreveria 37 roteiros de mecanismo e 39 de história nessa amostra; o Codex escreveu 56 e 24. Essa diferença não é acaso. O Codex transforma história em "explicar a jogada" e perde justamente o modo que segura o espectador até o fim.
8. **As correções do time confirmam o caminho por modo.** 40% valem para qualquer roteiro, 39% dependem do modo, 11% são gosto de cliente. Das 23 contradições entre correções, 14 somem quando se separa por modo, cliente ou pauta. As 6 que sobram são de precisão e pedem uma regra comum.
9. **Para o plano:** uma skill para cada um dos quatro modos grandes, começando por história e mecanismo, mais uma camada comum de clareza e precisão e um perfil por cliente. Âncora e registro entram como ajustes dentro da skill, não como skills separadas.

## 1. Os modos

| modo | o corpo avança por | o que serve de prova | roteiros | palavras (mediana) |
|---|---|---|---|---|
| história | acontecimentos no tempo, com personagem | o fato datado, uma cena, o número do desfecho | 39% | 404 |
| mecanismo | explicação de um caso, regra ou estratégia | a regra nomeada e a conta que fecha | 28% | 380 |
| demonstração | recursos e funcionamento de uma coisa | especificação traduzida, comparação tangível | 18% | 359 |
| panorama | dados de várias fontes sobre uma tendência | estatística com fonte e cadeia até o bolso | 12% | 387 |
| conselho | passos para o espectador fazer | lógica e exemplo literal | 2% | 308 |
| publi | conteúdo de entrada e depois a oferta | benefício e preço | 2% | |

As definições, os sinais no texto e as regras de desempate estão em `codebook.md`.

**Confiabilidade.** Um agente leu 168 roteiros às cegas e montou o livro de códigos. Um segundo agente, sem ver os rótulos, chegou ao mesmo modo em 94% dos casos. Na base inteira, os rotuladores concordaram com o gabarito em 93% dos modos (kappa 0,91) e 94% das âncoras (kappa 0,90). O registro emotivo é o rótulo mais frouxo (91%, kappa 0,67).

**Hipótese inicial ("notícia com prova" e "emotivo").** Ela acertou que existe um modo que convence empilhando dados: é o panorama. Mas notícia aparece nos quatro modos, e a maior parte das notícias da casa é explicada (mecanismo) ou demonstrada, não provada com pilha de dados. O "emotivo" do jeito que estava descrito misturava três coisas: demonstração, explicação e emoção. Juntar as três numa skill só repetiria o problema do caminho único.

## 2. Desempenho por modo

Desfecho principal: o vídeo ficar no quartil de cima do coeficiente viral do próprio canal, no mesmo trimestre e na mesma rede. A tabela traz o odds ratio controlando cliente e rede (1 = neutro). "R" quer dizer que o efeito aparece igual antes e depois de julho.

| | alcance | acerto (coef ≥ 1,5) | retenção no hook | retenção final | compartilhamento | salvamento | comentário |
|---|---|---|---|---|---|---|---|
| história | 0,96 | 1,04 | 1,03 | **2,06 R** | **0,71 R** | **0,64 R** | **0,66 R** |
| mecanismo | 1,08 | 0,98 | 1,08 | 0,71 | 0,81 | 0,84 | 1,00 |
| demonstração | 1,16 | **1,23 R** | 1,10 | 0,56 | **1,63 R** | 1,21 | 0,85 |
| panorama | 0,92 | 0,91 | 1,11 | 0,57 | **1,46 R** | 1,00 | **1,70 R** |
| conselho | **0,52 R** | **0,56 R** | 0,47 | 1,44 | 0,92 | **5,02 R** | **0,49 R** |
| âncora notícia | **1,31 R** | **1,15 R** | **1,61 R** | **0,62 R** | **1,48 R** | 0,91 | **1,68 R** |
| âncora passado | **0,78 R** | 0,97 | 0,86 | **1,86 R** | **0,62 R** | **0,67 R** | **0,59 R** |
| registro emotivo | 1,07 | 1,10 | 1,06 | 1,48 | 1,35 | 1,34 | 1,86 |

Retenção existe para cerca de 1.300 vídeos do Instagram, até 14/09. Os números completos, com intervalos e por rede, estão em `analise.md`.

**Como ler.** O modo não decide o alcance, e isso bate com o estudo de outubro. Controlando o payoff, a diferença de alcance entre modos some de vez. O modo decide **como** o vídeo funciona. Cada skill nasce com uma força e uma fraqueza conhecidas:

- **História** segura até o fim, mas o espectador não compartilha nem comenta. A skill precisa de payoff que dê motivo para passar adiante e, sempre que der, partir de um fato atual.
- **Mecanismo** é neutro em tudo e fraco no fim. A skill precisa de fecho mais forte e de payoff melhor que o bastidor.
- **Demonstração** é compartilhada e acerta mais, mas perde gente no fim. A skill precisa de fecho.
- **Panorama** gera conversa, mas também perde gente no fim. A skill precisa de fecho.
- **Conselho** é salvo e não alcança. Não vale skill própria agora.

### Combinações que replicam

- história contada a partir de uma notícia: OR 1,34, replica. É 25% das histórias da casa.
- história de algo antigo: OR 0,81.
- conselho atemporal: OR 0,40, replica.

### Payoff dentro de cada modo (lift no alcance)

| modo | ganha | perde | o mais usado |
|---|---|---|---|
| história | disputa 1,67; orgulho 1,36 | superação 0,76 | superação (521 vídeos) |
| mecanismo | orgulho 1,92; queda 1,51; disputa 1,37 | curiosidade 0,49; bastidor 0,89 | bastidor (602 vídeos) |
| demonstração | disputa 1,49 | vantagem 0,61; sacada 0,60 | futuro (634 vídeos), neutro |
| panorama | orgulho 1,40 | revolta 0,68; bastidor 0,63 | alerta (319 vídeos), neutro |

O payoff mais usado em história e em mecanismo está abaixo da média. A skill deve propor primeiro os payoffs que ganham no seu modo.

### Tamanho

Abaixo de 350 palavras, história (0,81), demonstração (0,87) e mecanismo (0,90) perdem alcance. Acima disso não há diferença clara, exceto um sinal em demonstração com 450 palavras ou mais (1,71, só 47 vídeos). A regra atual de 420 a 500 palavras fica acima da mediana de todos os modos (360 a 405). O piso de 350 é a parte que o dado sustenta.

### Por cliente

O mix varia muito: Cadu Neiva, Franklin Tomich e Marcelo Germano fazem mais de 80% de história, Ricardo Schumacher 94% de mecanismo, Thiago Bisewski 83% de demonstração. Dentro do próprio cliente, quatro modos se destacam com significância:

- Izabela Anholett: demonstração 1,18. É 56% dos roteiros dela.
- João Felipe Marques: história 1,91.
- Leonardo Nogueira: demonstração 1,63, mas só 18% dos roteiros.
- Rodrigo Waughan: demonstração 2,04, mas só 4% dos roteiros.

Há também sinais sem significância de modo dominante que rende menos: Manoel Victor (história 0,63, mecanismo 1,24), Renato Torres (história 0,65, mecanismo 1,23), Patrick Diorio (história 0,49, demonstração 1,39) e Café com Ferri (conselho é 45% dos roteiros, com 0,52). Isso alimenta o perfil de cliente: o modo que funciona para cada um, e não só o modo de costume.

### Tendência

De um trimestre para outro, a casa trocou história (de 40% para 36%) por demonstração (de 11% para 20%) e panorama (de 8% para 13%).

## 3. O Codex de hoje

Foram 150 sessões, com a primeira versão de cada uma, antes de qualquer ajuste.

| | história | mecanismo | demonstração | panorama |
|---|---|---|---|---|
| Codex | 19% | 46% | 11% | 23% |
| casa (todos) | 39% | 28% | 18% | 12% |
| casa com o mesmo mix de clientes | 36% | 34% | 10% | 18% |

Contra o esperado para os mesmos clientes, o Codex escreve mecanismo demais (56 contra 37, z = 4,4) e história de menos (24 contra 39, z = −3,9). Demonstração e panorama ficam no esperado. O exemplo mais claro é o Franklin Tomich: 80% dos roteiros da casa para ele são história, e 13 dos 24 roteiros do Codex para ele são mecanismo.

As correções contam a mesma coisa vista de dentro. O próprio aprendizado 7e968f06 diz que "a sala tende a default para Estratégia Oculta". Seis correções pedem personagem ou emoção, e duas tiram a moldura de segredo de um lançamento de produto. O custo disso aparece na tabela da seção 2: o Codex troca o modo que segura o espectador até o fim por um modo neutro, e usa o payoff "bastidor", que fica abaixo da média dentro do mecanismo.

## 4. As correções do time

São 156 aprendizados, 4 ativos. Os detalhes, com o destino de cada id, estão em `achados_correcoes.md`.

| alcance | aprendizados | para onde vai |
|---|---|---|
| vale para qualquer roteiro | 62 | camada comum, em 10 regras |
| depende do modo | 61 | 48 nas skills, 8 numa camada de registro emotivo, 5 na âncora notícia |
| gosto do cliente | 17 | perfil do cliente |
| só daquele roteiro ou pauta | 16 | descartar da escrita |

- **Revisão é comum** (28 de 30 aprendizados), **estrutura é do modo** (15 de 15) e **tom é do cliente**. Gancho e corpo se dividem: a regra de clareza é comum, a fórmula de abertura é do modo.
- **Das 23 contradições**, 10 somem separando por modo, 4 por cliente ou pauta, 3 eram exagero de um caso só e 6 são reais. As reais opõem impacto e exatidão: superlativo, alarme, cadeia causal. Elas pedem uma cláusula comum: impacto é permitido quando tem fonte, data e número. Uma delas bate de frente com uma lição ativa: 78361ea0 manda cortar "Agora vem a parte...", e 928a9453 manda escrever exatamente isso. Precisa da sua decisão.
- **As queixas mais repetidas** são gancho que não entrega o impacto (12 lições), fecho e CTA (12), fato errado mesmo com checagem (9) e material do usuário cortado (6).
- **Ativar os 152 no caminho único seria um erro.** Metade deles só faz sentido num modo e brigaria com os outros.

## 5. O que isso muda no plano das skills

1. **Quatro skills de modo:** história, mecanismo, demonstração e panorama, que cobrem 97% da casa. Conselho e publi ficam sem skill por enquanto: conselho derruba o alcance e publi depende do briefing da oferta.
2. **Começar por história e mecanismo.**
   - História é o maior modo da casa, o que o Codex mais deixa de escrever, o único que segura até o fim e, partindo de notícia, a melhor combinação de alcance.
   - Mecanismo é o que o Codex já faz. Separá-lo numa skill limpa o prompt das regras de história que brigam com ele e serve de controle no teste.
   - Demonstração e panorama vêm em seguida.
3. **Cada skill traz:** a receita de pesquisa, o tipo de prova, a estrutura, a fórmula de abertura, o fecho, o checklist do revisor, os payoffs que ganham naquele modo, a alavanca fraca a compensar e exemplos reais de topo daquele modo. Os exemplos saem do `rotulos_modo.jsonl` cruzado com o desempenho.
4. **Âncora e registro são ajustes dentro da skill.** Notícia muda a pesquisa (conferir a data, buscar a versão mais recente) e pede fecho mais forte, porque perde no fim. Emotivo muda o fecho e o CTA (compartilhar por causa).
5. **Camada comum:** as 10 regras de clareza e precisão das correções, mais a cláusula de impacto com fonte. Vale para todas as skills e substitui a parede de regras de hoje.
6. **Perfil do cliente:** os 17 aprendizados de cliente, o mix de modos e o modo que rende dentro do cliente.
7. **Tamanho por modo:** piso de 350 palavras. A faixa de 420 a 500 deixa de ser regra geral.
8. **Escolha do modo:** o usuário escolhe, com uma sugestão do sistema baseada na premissa e no histórico do cliente.

## 6. Limites

- **É correlação, não causa.** Modo e payoff andam juntos com pauta e cliente. O controle por cliente e rede ajuda, mas não substitui um teste.
- **Rótulos de modelo.** O modo é confiável (kappa 0,91); o registro emotivo, menos (0,67).
- **Retenção parcial:** só Instagram, cerca de 1.300 vídeos, até 14/09.
- **Amostra do Codex:** 150 sessões, 41 sem cliente. É a primeira versão, não a que foi publicada, e o desempenho dos roteiros do Codex não pode ser medido enquanto o roteiro não estiver ligado ao vídeo publicado.
- **Correções:** 37 roteiros e algumas pautas repetidas. Franklin Tomich e Fernando Pereira pesam demais.

## Arquivos

- `codebook.md`: definição dos modos, regras de desempate e como rotular.
- `analise.md`: todas as tabelas, com intervalos, por rede, por cliente, por payoff e por tamanho.
- `achados_correcoes.md`: as correções por alcance, as contradições, os temas e o destino de cada aprendizado.
- `dados/rotulos_modo.jsonl`: modo, âncora, registro e confiança dos 2.832 roteiros. `rotulos_codex.jsonl`: os 150 do Codex. `rotulos_descoberta.jsonl` e `rotulos_piloto.jsonl`: gabarito e piloto. `correcoes_rotuladas.json`: as 156 correções classificadas.
- `src/`: os scripts. Eles rodam sobre a base do estudo de outubro (`docs/estudo-2026-10/src/export.ts` e `segment.mjs` regeneram `data/`).
