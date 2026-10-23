# Preditor da casa v0 (outubro 2026)

Plano 026, Task A. Dá a chance de um vídeo com roteiro VM cair no topo do próprio cliente: o quartil de cima do coeficiente viral no estrato cliente × rede × trimestre, com base de 26%. É a régua do estudo de outubro (`docs/estudo-2026-10/src/lib.mjs`). Custo de LLM: zero. Só embeddings que já estavam no CRM, métricas medidas e regex.

## Veredito: passou no portão, mas raspando

| | par a par (portão: 58%) | AUC | Brier |
|---|---|---|---|
| **v0, jul+ago+set juntos** (3.157 vídeos, 12.750 pares, 162 grupos) | **60,9%** [58,7 a 63,0] | 0,596 | 0,189 |
| julho (957 vídeos, 48 grupos) | 58,0% [54,9 a 60,9] | 0,582 | 0,184 |
| agosto (1.032 vídeos, 55 grupos) | 59,1% [55,2 a 63,0] | 0,562 | 0,187 |
| setembro (1.168 vídeos, 59 grupos) | 64,4% [60,5 a 68,5] | 0,655 | 0,194 |
| outubro parcial, que nenhum estudo viu (573 vídeos, 46 grupos) | 58,2% [53,1 a 63,0] | 0,547 | 0,187 |

- **Par a par** quer dizer: pegue dois vídeos do mesmo cliente, na mesma rede e no mesmo mês, um que foi topo e outro que não foi. Em 61% das vezes o v0 deu nota maior para o que foi topo. No chute, seriam 50%.
- No conjunto dos três meses o intervalo inteiro fica acima de 58%. Mês a mês, julho e agosto ficam em cima da linha, e outubro também.
- **A probabilidade em si melhora pouco.** O Brier é 0,189 contra 0,192 de chutar 26% para todo mundo. O preditor serve para **ordenar** (qual de dois roteiros tem mais chance). Ainda não serve para prometer um número.
- **Calibração.** Entre 15% e 40% está certa, e é aí que caem 92% dos vídeos. Acima de 40% ela exagera: prevê 47% e o observado foi 33% [26 a 41], em 154 vídeos. Na tela, mostrar no máximo "40% ou mais".

| faixa prevista | vídeos | previsto | observado [IC95] |
|---|---|---|---|
| 0 a 15% | 105 | 12,0% | 15,2% [9,6 a 23,3] |
| 15 a 22% | 532 | 19,8% | 16,7% [13,8 a 20,1] |
| 22 a 30% | 1.813 | 25,7% | 25,3% [23,3 a 27,3] |
| 30 a 40% | 553 | 33,6% | 36,3% [32,4 a 40,4] |
| 40% ou mais | 154 | 47,4% | 33,1% [26,2 a 40,9] |

**Recomendação.** Use para ordenar candidatos (Task B), sempre gravando a nota, a escolhida e o resultado depois. Na Task C, mostre a faixa e os dados da casa, não o número com decimal. Repita a medição em novembro (Task D) antes de deixar o preditor decidir sozinho, porque a margem sobre o portão é de 1 a 3 pontos.

## Com o embedding da produção (OpenAI), rodada de 23/10

A produção não tem Gemini. O Codex gera embedding com o OpenAI `text-embedding-3-small` (1.536 dimensões, `embed()` em `lib/pipeline/context.ts`), e o corpus da casa está na `public.documents` do viral data. Refiz o v0 trocando só o embedding. Features, regra dos 30 dias, logística, λ, meses e métricas são os mesmos. Custo: zero. Só leitura dos vetores que já estavam guardados.

### Veredito: o embedding não muda nada. O OpenAI fica igual ao Gemini nos mesmos vídeos

| v0 nos mesmos 2.471 vídeos (jul + ago + set até o dia 14) | par a par [IC95] | AUC | Brier | jul / ago / set |
|---|---|---|---|---|
| **OpenAI (documents)** | **58,7%** [56,7 a 61,2] | 0,581 | 0,187 | 57,8 / 58,5 / 63,1 |
| Gemini (CRM) | 58,9% [56,9 a 61,4] | 0,577 | 0,187 | 58,2 / 59,2 / 60,3 |
| Gemini, todos os 3.157 vídeos (a rodada de cima) | 60,9% [58,7 a 63,0] | 0,596 | 0,189 | 58,0 / 59,1 / 64,4 |

- **Diferença entre os dois embeddings:** 0,2 ponto, bem dentro do ruído (IC de ±2 pontos).
- **Portão (58%):** o OpenAI passa no número (58,7%), mas raspando, e o IC começa abaixo da linha (56,7%). O Gemini fica igual nesse recorte. Julho fica embaixo da linha com os dois.
- **De onde vem a queda de 60,9% para 58,7%:** do recorte, não do embedding. A `documents` não tem a segunda metade de setembro, e era o mês mais forte. Nos mesmos vídeos, o Gemini também cai, para 58,9%.
- **Brier:** 0,187, contra 0,188 de chutar a taxa de topo (25,1%) para todo mundo. Igual ao Gemini, então serve para ordenar e não para prometer número.
- **Outubro:** não dá para medir. Nenhum vídeo de outubro tem documento.

**Calibração (OpenAI, jul-set):** igual à do Gemini. Está certa até 40%. Acima disso exagera ainda mais: prevê 48% e o observado é 29%.

| faixa prevista | vídeos | previsto | observado [IC95] |
|---|---|---|---|
| 0 a 15% | 120 | 12,2% | 12,5% [7,7 a 19,6] |
| 15 a 22% | 556 | 19,2% | 18,3% [15,3 a 21,8] |
| 22 a 30% | 1.096 | 25,7% | 25,2% [22,7 a 27,8] |
| 30 a 40% | 511 | 33,9% | 33,7% [29,7 a 37,9] |
| 40% ou mais | 188 | 47,6% | 29,3% [23,2 a 36,1] |

### Para ordenar candidatos da mesma sessão: só a parte do texto

Numa sessão do Codex, os candidatos têm o mesmo cliente, a mesma rede e o mesmo modo. Por isso a taxa do cliente, a tendência, o modo e a âncora não mudam a ordem entre eles. O que muda é a parte do texto: tema (kNN), repetição e catálogo de hook. Medi a nota só com essa parte, usando os pesos do v0 de cada mês.

| só a parte do texto | par a par [IC95] | jul / ago / set |
|---|---|---|
| **OpenAI, 2.471 vídeos** | **57,6%** [55,7 a 60,1] | 58,2 / 56,0 / 62,6 |
| Gemini, os mesmos vídeos | 57,4% [55,4 a 60,0] | 58,2 / 56,3 / 59,2 |
| Gemini, todos os 3.157 vídeos | 60,1% [57,9 a 61,9] | 58,2 / 56,4 / 64,6 |
| um modelo treinado só com o texto, OpenAI | 56,9% [55,2 a 59,6] | 58,2 / 54,6 / 62,0 |

- **Leitura:** entre dois vídeos do mesmo cliente, na mesma rede e no mesmo mês, a parte do texto acerta qual foi topo em 57,6% das vezes. Fica meio ponto abaixo do portão.
- **Limite da medida:** os pares aqui são vídeos diferentes, com temas diferentes. Os candidatos de uma sessão são variações do mesmo tema. Então o kNN muda pouco entre eles, e quem ordena é quase só o catálogo de hook. A acurácia nesse caso ainda não foi medida. A Task B precisa gravar as candidatas e o resultado para medir.

### Os limiares novos

Recalibrei do mesmo jeito do estudo de embeddings: o limiar do mesmo cliente é o percentil 97 dos cossenos entre roteiros do mesmo cliente, e o de outro cliente é o percentil 99,5 dos cossenos entre clientes. Rodei o mesmo cálculo no Gemini, na base de hoje (3.020 roteiros), e ele devolve 0,798 e 0,761. Ou seja, o método reproduz o 0,80 e o 0,76 de antes.

| | mesmo cliente (p97) | outro cliente (p99,5) | mediana dentro / entre |
|---|---|---|---|
| Gemini 768 (antes) | 0,80 | 0,76 | 0,72 / 0,66 |
| **OpenAI 1.536 (novo)** | **0,72** (0,723) | **0,69** (0,688) | 0,55 / 0,43 |

- **Por que os números são mais baixos:** o OpenAI espalha mais os cossenos. Não dá para usar o 0,80 do Gemini nele.
- **Separação:** o OpenAI separa melhor o cliente. A distância entre a mediana dentro e a mediana entre clientes é de 0,11 ponto, contra 0,06 no Gemini.
- **Vizinhos acima do limiar:** com os limiares novos, 22% dos vídeos de teste ficam sem nenhum, contra 18% no Gemini.
- **kNN sozinho:** o kNN cru dos 20 vizinhos dá 58,4% com OpenAI e 56,6% com Gemini. Com limiar, dá 55,5% e 56,4%. Nos dois embeddings o cru é melhor que o com limiar.

### Cobertura: a `documents` parou em 14/09

- **Vídeos:** dos 7.667 vídeos VM do estudo, 5.634 têm documento (73%). Dos 6.810 usados no preditor, 5.468 têm (80%).
- **Roteiros:** dos 3.020 roteiros com embedding Gemini, 2.401 têm pelo menos um documento (80%). O roteiro recebe a média dos vetores dos seus vídeos, renormalizada. Os vídeos do mesmo roteiro têm cosseno mediano de 0,95 entre si.
- **Por mês** (vídeos do preditor cujo roteiro tem documento):

| fev | mar | abr | mai | jun | jul | ago | set | out |
|---|---|---|---|---|---|---|---|---|
| 312/313 | 594/594 | 610/611 | 663/665 | 897/897 | 957/957 | 1.032/1.032 | 482/1.168 | 1/573 |

- **O último documento é de um vídeo de 14/09/2026.** Desde então nenhum vídeo VM entrou na `documents`.
- **Por que isso importa:** a ingestão parou. Isso já afeta a produção hoje, porque o few-shot vetorial do Codex (`match_documents`) não vê nada do último mês e meio. E vai afetar o preditor: o kNN da casa só enxerga o que está na tabela.
- **O que fazer antes da Task B:** religar a ingestão da `documents`. Para pontuar um candidato, o Codex usa o `embed()` que já existe. A chave é a mesma OpenAI, e custa frações de centavo por texto.

### O que muda para a produção

- **Modelo para a produção:** `modelo_openai.json`. Treinado com 5.547 vídeos (fevereiro a 14/09), λ = 3.000, 170 features.
  - Cada feature tem o campo `texto`, que diz se ela entra na parte do texto.
  - As features e a ordem dos pesos são quase as mesmas do Gemini. Pesam a taxa do cliente (negativa), "acabou de", região do Brasil, "Nem", "tema já fracassou em outro cliente" e A/O + nome.
- **Texto do corpus:** é "Título + Assunto + roteiro" (o `content` da `documents`), não o roteiro do CRM. Na hora de pontuar, embutir o candidato no mesmo formato, ou pelo menos título + roteiro, para cair na mesma escala.
- **Território:** no modo OpenAI, todo roteiro vai para o centróide mais próximo no espaço OpenAI, como um roteiro novo iria na produção. Os centróides usam os rótulos do k-means feito no Gemini (`clusters.json`), e essa feature pesa pouco.

## Contra os baselines e as variações

Validação em janela móvel: treino até o mês M−1, teste no mês M, para julho, agosto e setembro. O λ (a força da regularização) foi escolhido em cada mês olhando só o mês anterior. Par a par com IC95 por bootstrap de grupos.

| modelo | par a par jul-set [IC95] | AUC | Brier | jul / ago / set | out parcial |
|---|---|---|---|---|---|
| **v0: tema + repetição + cliente + modo + catálogo de hook** | **60,9%** [58,7 a 63,0] | 0,596 | 0,189 | 58,0 / 59,1 / 64,4 | 58,2% |
| só o roteiro: tema + repetição + catálogo de hook | 59,9% [57,5 a 61,6] | 0,580 | 0,191 | 57,9 / 56,5 / 64,0 | 57,4% |
| sem hook: tema + repetição + cliente + modo | 57,5% [54,1 a 60,4] | 0,588 | 0,187 | 52,8 / 60,9 / 58,2 | 57,1% |
| tema + repetição (regressão) | 56,5% [53,4 a 58,9] | 0,547 | 0,191 | 54,0 / 57,3 / 57,7 | 56,4% |
| **baseline: só o kNN da casa** (taxa de topo dos 20 vizinhos) | 58,0% [55,8 a 60,3] | 0,567 | 0,191 | 58,9 / 54,5 / 60,3 | - |
| **baseline: só a taxa recente do cliente** | 48,4% [45,4 a 51,2] | 0,441 | 0,199 | 49,6 / 45,3 / 50,2 | - |
| só o kNN com limiar (0,80 / 0,76) | 56,7% [54,1 a 59,0] | 0,566 | 0,190 | 56,5 / 57,4 / 56,4 | - |
| só o território (k=60) | 54,6% [52,0 a 57,6] | 0,549 | 0,192 | 50,0 / 56,5 / 56,4 | - |
| com o placar do hook do estudo (otimista, ver abaixo) | 64,0% [61,3 a 66,7] | 0,638 | 0,182 | 58,1 / 64,0 / 68,2 | 56,5% |
| só o placar do hook (otimista) | 63,6% [61,4 a 66,1] | 0,622 | - | 60,4 / 60,7 / 68,2 | - |

Por rede o v0 é igual nas três: Instagram 61,1%, TikTok 60,5% e YouTube 61,1%.

**A armadilha do placar.** O placar do hook (+1 por elemento bom, −1 por ruim) chega sozinho a 63,6%. Mas os elementos dele foram escolhidos no estudo de outubro porque replicavam também de julho em diante. Ou seja, ele já tinha visto os meses de teste. Em outubro, que ele não viu, o modelo com placar cai para 56,5%. Por isso o v0 não usa o placar. Usa o catálogo inteiro do estudo de hooks (as 145 marcas, boas e ruins), com os pesos aprendidos só no passado de cada mês.

## O que ajudou e o que não ajudou

1. **O hook é a maior alavanca.** Somar o catálogo de hook ao modelo sem hook leva de 57,5% para 60,9%. As marcas que mais pesam são as mesmas do estudo de hooks:
   - **Puxam para cima:** "acabou de", região do Brasil, abrir com "A/O + nome", "guerra/briga", "proibiu/cancelou" e marca chinesa.
   - **Puxam para baixo:** IA no hook, "vida/sonho", "empresa/marca" genérico, abrir com "O Brasil", e "te".
2. **O tema (kNN) é o melhor sinal sozinho.** A taxa de topo dos 20 roteiros anteriores mais parecidos da casa dá 58,0%. A versão com o limiar do estudo de embeddings (0,80 no cliente, 0,76 fora dele) dá menos, 56,7%, porque 19% dos vídeos de teste ficam sem vizinho acima do limiar. O território dá menos ainda, 54,6%.
3. **A repetição quase não pesa com a regra dos 30 dias.** O achado forte do estudo é "acertou, repita em até 21 dias", e a regra de 30 dias apaga exatamente essa janela. Com uma folga de 7 dias, que é otimista porque a métrica ainda não maturou, o modelo sem hook vai de 57,5% para 60,9% e o v0 de 60,9% para 62,4% (`resultado_gap7.json`). Há sinal no resultado recente.
4. **A taxa recente do cliente fica abaixo do chute** (48,4%, AUC 0,44): é volta à média, não qualidade. O coeficiente divide as views pela mediana móvel de 180 dias do canal. Depois de uma fase boa, a mediana sobe e o vídeo seguinte rende menos em coeficiente. No v0 é a feature de maior peso, e é negativa. Ela mede o momento da conta, não o roteiro. Na Task B, entre candidatos do mesmo vídeo, ela é constante e não muda nada. Sem ela e sem o modo, só com o roteiro, o modelo ainda dá 59,9%.
5. **Modo e âncora ajudam pouco.**
   - **Pesos:** âncora "passado" pesa contra, "notícia" a favor; "panorama" contra, "misto" a favor.
   - **Ganho:** junto com o cliente, somam 1 ponto: 59,9% para 60,9%.

## Pesos do v0

Modelo final treinado com 6.237 vídeos (fevereiro a setembro), λ = 3.000. A regularização forte deixa cada peso pequeno, então o que importa é o sinal e a ordem, não o tamanho. O peso está em unidades de 1 desvio-padrão da feature; OR é a razão de chances por desvio-padrão. As 170 features estão em `modelo.json`.

| feature | peso por DP | OR por DP |
|---|---|---|
| taxa de topo recente do cliente na rede (cli90) | −0,069 | 0,93 |
| hook: "acabou de" | +0,039 | 1,04 |
| hook: região do Brasil | +0,037 | 1,04 |
| hook: abre com A/O/Os/As | +0,033 | 1,03 |
| hook: IA | −0,031 | 0,97 |
| hook: abre com "Nem" | +0,031 | 1,03 |
| kNN com limiar (casa_taxa) | +0,030 | 1,03 |
| hook: A/O + nome próprio | +0,030 | 1,03 |
| hook: proibiu/baniu/cancelou | +0,028 | 1,03 |
| hook: guerra/briga/rival | +0,027 | 1,03 |
| hook: vida/sonho | −0,027 | 0,97 |
| hook: "empresa/marca" genérico | −0,026 | 0,97 |
| hook: marca chinesa | +0,025 | 1,03 |
| hook: abre com "O Brasil" | −0,025 | 0,98 |
| kNN da casa (knn20) | +0,024 | 1,02 |
| tema já fracassou em outro cliente (fora_fraco) | −0,024 | 0,98 |
| âncora passado | −0,019 | 0,98 |
| território k=60 | +0,019 | 1,02 |
| âncora notícia | +0,019 | 1,02 |
| modo misto | +0,018 | 1,02 |
| tema já fracassou no cliente (rep_fraco) | −0,017 | 0,98 |
| tendência do cliente | −0,012 | 0,99 |
| repete acerto de 90 dias ou mais | +0,010 | 1,01 |
| repete acerto (qualquer prazo), acerto de outro cliente, similaridade média | perto de 0 | 1,00 |

## Exemplos (teste de julho a setembro, nota do v0 sem ter visto o mês)

**Nota alta:** 1 de 5 foi topo.

| nota | cliente, rede, data | hook | resultado |
|---|---|---|---|
| 68% | Rafael Rodrigues, YouTube, 31/07 | "Se você acha que é preciso meses para vencer um dos maiores campeonatos do mundo, esses sete estudantes do interior de São Paulo acabaram de provar o contrário." | não (pq 0,41) |
| 66% | Marcio Grazino, TikTok, 07/07 | "Essas estudantes do interior da Bahia usaram tomates para desafiar um problema que atinge mais da metade dos brasileiros." | **topo** (pq 0,96, coef 59,6) |
| 66% | Rafael Rodrigues, YouTube, 27/07 | "Santa Catarina é famosa pelas tradições alemãs e pelo turismo. Mas agora, uma cidade do interior, com 37 mil habitantes, virou destaque..." | não (pq 0,20) |
| 64% | Marcio Grazino, YouTube, 15/07 | "Esses estudantes do interior do Ceará transformaram os restos do maracujá numa solução para os maiores problemas dos agricultores." | não (pq 0,02) |
| 64% | Marcio Grazino, TikTok, 03/07 | "Esses estudantes de escola pública no interior da Bahia prestaram atenção num problema sofrido pelos próprios colegas..." | não (pq 0,71, quase) |

**Nota baixa:** nenhum dos 5 foi topo.

| nota | cliente, rede, data | hook | resultado |
|---|---|---|---|
| 4% | Renato Torres, Instagram, 27/07 | "Tem uma taxa quase invisível no iFood que pode gerar mais de R$ 150 milhões por mês. E você provavelmente já pagou ela sem nem perceber." | não (pq 0,31) |
| 6% | Renato Torres, Instagram, 23/07 | "Enquanto as marcas vendiam chuteira para atleta, o Kichute vendeu sonho para criança..." | não (pq 0,06) |
| 8% | Rodrigo Waughan, YouTube, 03/07 | "Uma das marcas mais famosas da história tentou agradar todo mundo, quase perdeu tudo, mas a virada veio de um bilhetinho em um copo de café." (Starbucks) | não (pq 0,55) |
| 8% | Marcos Pelozato, TikTok, 14/07 | "Esse cara nasceu cercado por um império, mas gastou como se sua grana nunca pudesse acabar." | não (pq 0,36) |
| 8% | Rodrigo Waughan, Instagram, 15/07 | "Em 2009, o diretor da Domino's sentou na frente de uma câmera e admitiu em voz alta: 'a nossa massa parece papelão molhado.'..." | não (pq 0,49) |

As notas altas são quase todas "estudante do interior". O modelo aprendeu com o primeiro semestre, quando esse território rendia, e não percebeu que ele saturou (achado 6 do estudo de embeddings: de OR 2,1 para 0,8). Esse é o tipo de erro que a recalibração mensal precisa pegar. As notas baixas batem com o estudo: biografia de marca, "você/te", "Esse cara" e ano no hook.

## Limitações

1. **O catálogo de hook ainda carrega um pouco de otimismo.** Os pesos foram aprendidos só no passado, mas a lista de 145 marcas foi montada no estudo de outubro, que viu os dados até o começo de outubro. A checagem em outubro (58,2%) é a mais limpa, e tem só 573 vídeos.
2. **O rótulo dos vizinhos é o de hoje.** O "topo" de um vizinho é o percentil dentro do trimestre dele, calculado com todos os vídeos do trimestre, inclusive os posteriores. O coeficiente usa a mediana móvel do canal na data do export. O efeito de um vídeo sobre o percentil dos outros é de 1 em dezenas, pequeno.
3. **O treino vai até o mês M−1 inteiro, como pedido.** Na produção, os vídeos do fim de M−1 ainda não estariam maduros no começo de M. A regra dos 30 dias vale para as features, não para os rótulos de treino.
4. **Pouco tempo.** São 3 meses de teste e 162 grupos. O IC é de ±2 pontos no conjunto e de ±3 a 4 por mês. De um mês para outro o resultado oscila entre 58% e 64%.
5. **O λ escolhido ficou no topo da grade (3.000).** O modelo pede o máximo de encolhimento: cada feature carrega pouco sinal, e o ganho vem de somar muitas.
6. **O modo só existe para os roteiros do estudo.** A `vm_roteiro_modo` tem as 2.832 linhas da carga inicial (origem estudo-2026-10). 211 dos 6.810 vídeos ficaram sem modo, todos de outubro: o ETL ainda não classificou os roteiros novos. Os territórios vêm do k-means do estudo, que não usa resultado; roteiro novo vai para o centróide mais próximo.
7. **Produção.** Para pontuar texto novo é preciso o embedding dele na hora. A produção só tem o OpenAI: use `modelo_openai.json` (ver a seção do OpenAI acima), e as marcas de hook saem de `docs/estudo-2026-10/src/hooks/feat.mjs`, aplicadas ao 1º parágrafo do roteiro (`segment.mjs`).

## O que eu tentaria em seguida

1. Medir quanto o coeficiente de 7 e de 14 dias erra o final. Se errar pouco, encurtar a regra de 30 dias para a repetição: dá de 1,5 a 3 pontos (ver o item 3 de "O que ajudou").
2. Recalibrar a faixa de cima (isotônica) quando houver 5 ou mais meses. Tentei Platt com um mês só e ficou instável: chegou a inverter a ordem num mês. Tirei.
3. Pesar o kNN pelo tempo (vizinho recente vale mais), para pegar território que saturou.
4. Um GBM pequeno não foi testado, porque a logística passou e é mais simples de levar para a produção.

## Arquivos

- `modelo.json`: a fórmula, o intercepto, e para cada uma das 170 features a definição, a média, o desvio-padrão, o peso e se ela é da parte do texto; mais os limiares (0,80 / 0,76 / 30 dias / k). Basta para pontuar sem retreinar. É o modelo do Gemini.
- `modelo_openai.json`: o mesmo, com o embedding da produção (OpenAI, `public.documents`), os limiares 0,72 / 0,69 e os percentis de onde eles saíram. É o que a Task B usa.
- `resultado.json`: todas as métricas por modelo e por mês, as calibrações, os baselines, outubro, por rede, os pesos e os exemplos. `resultado_gap7.json` é a sensibilidade com a folga de 7 dias. `so_texto` é a nota só com a parte do texto.
- `resultado_openai.json`: tudo isso na rodada OpenAI (só vídeos cujo roteiro tem documento). `resultado_gemini_cobertos.json` é o Gemini nesses mesmos vídeos, para comparar.
- `src/export_documents.ts`: baixa da `public.documents` os vetores dos vídeos do estudo, só leitura, para `data/docs_emb.f32` e `data/docs_ids.json`.
- `src/export_modo.ts`: lê a `vm_roteiro_modo`, só leitura.
- `src/features.mjs`: as features sem vazamento. Com `EMB=openai`, usa o embedding da `documents` e recalcula os limiares.
- `src/modelo.mjs`: a logística (IRLS em JS puro), a validação, as métricas e o `modelo.json`. Tem uma checagem embutida: nota perfeita dá 100% par a par, e a logística recupera um efeito sintético.

Reproduzir. Numa pasta de trabalho fora do git:

1. Copie `docs/estudo-2026-10/src` para `src/` e este `src/` para `src/preditor/`.
2. Copie `docs/estudo-2026-10/dados/clusters.json` para `data/` e ligue `node_modules` ao do Codex.
3. Rode, em ordem:

```
npx tsx --env-file=<Cockpit>/.env.local --env-file=<Codex>/.env.local src/export.ts   # só leitura, ~2 min
node src/segment.mjs
npx tsx --env-file=<Codex>/.env.local src/preditor/export_modo.ts                     # só leitura
node src/preditor/features.mjs            # ~8 s; GAP=7 para a sensibilidade
node src/preditor/modelo.mjs              # ~12 s; grava out/preditor/{resultado,modelo}.json
# variante OpenAI (23/10):
npx tsx --env-file=<Codex>/.env.local src/preditor/export_documents.ts                # só leitura, ~1,5 min
EMB=openai node src/preditor/features.mjs
EMB=openai node src/preditor/modelo.mjs   # grava resultado_openai.json e modelo_openai.json
SO_DOC=1 node src/preditor/modelo.mjs     # Gemini nos mesmos vídeos: resultado_gemini_cobertos.json
```

Base desta rodada (22/10/2026):

- **Export:** 7.667 vídeos VM, 3.020 roteiros, todos com embedding.
- **Usados:** 6.810 vídeos analisáveis de Instagram, TikTok e YouTube, de fevereiro a outubro.
