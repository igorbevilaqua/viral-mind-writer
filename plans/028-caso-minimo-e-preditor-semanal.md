# Plano 028: caso mínimo (modelar para a Izabela) e preditor conferido toda semana

Escrito em 22/11/2026 sobre origin/main 9c98fd8. Só plano, nada implementado.

Pedido do Igor: o MENOR caso de uso do Codex com maior chance de resultado útil, e um mecanismo que se retroalimenta e se calibra para prever o potencial de viralização com os dados semanais (roteiros + views + seguidores).

**Fontes dos números.** Só estas, nada inventado:
- `docs/caso-minimo-2026-11/dados-22-11.md`: leitura do banco em 22/11/2026 (citado como [dados]).
- `docs/caso-minimo-2026-11/mapa-codigo.md`: mapa do código (citado como [survey]).
- `plans/026-preditor-e-avaliador.md`, `docs/preditor-2026-10/RELATORIO.md` ([relatório v0]), `docs/estrategia-2026-10/ESTRATEGIA.md` ([estratégia]) e `DADOS-FLUXOS.md` ([fluxos]).
- Relatórios de pesquisa técnico ([técnico]) e psicológico ([psico]) de 22/11/2026, fora do repo: pesquisa pronta, não refeita. Boa parte foi lida só pelo resumo, como os próprios relatórios avisam.
- Branches locais `plano-025-skills-modo` e `plano-027-modelagem`, lidas com `git log` e `git show` ([branch 025], [branch 027]). Não estão em main.

Toda meta está marcada como **META**. Todo prazo e custo está marcado como **ESTIMATIVA**. Conta feita por mim a partir dos dados está marcada como "conta minha".

---

## 1. Diagnóstico

1. **O uso do Codex despencou.** Sessões por semana: 40 (12/10), 16, 6, 4, 1, 0 (16/11). Novembro tem 5 sessões de 3 usuários. Última sessão: 11/11 [dados].
2. **O laço dos roteiros do próprio Codex é fino demais para treinar.** 307 roteiros, 47 com vídeo confirmado no total, 0 de novembro. Por mês de criação (roteiros / com vídeo): ago 106/28, set 88/12, out 84/5, nov 8/0 [dados].
3. **O preditor em sombra ainda não mediu nada.** 17 gerações de 12 sessões, nenhuma com vídeo casado. A escolha da sala coincidiu com o primeiro do preditor em 7 de 17 nos hooks e 2 de 9 nas narrativas [dados].
4. **A casa produz o dado que o Codex não produz.** 254 a 311 vídeos VM por semana nas semanas maduras, de 19 a 23 clientes. 8.055 vídeos rotulados em `vm_preditor_rotulos` [dados].
5. **Seguidores ganhos cobrem pouco e a cobertura cai.** Vídeos VM com `seguidores_ganhos` por semana: 76 de 300 (25%) em 07/09, 39 de 296 (13%) em 02/11, 19 de 257 (7%) em 09/11 (percentuais: conta minha sobre [dados]). A origem é uma planilha importada à mão, parada desde meados de setembro [survey 4.4].
6. **Consequência para o alvo.** O alvo principal é o topo do coeficiente no estrato cliente x rede x trimestre, a régua do plano 026. Seguidores entra como alvo secundário só onde existe.

### 1.1 O alvo já é "desempenho contra o esperado da conta"

- A pesquisa diz que a conta pesa mais que o conteúdo. No vencedor do SMP Challenge 2025, as features do usuário ficam no topo da importância. Tirar os embeddings de vídeo piora o erro de 0,1754 para 0,1818, e os de texto para 0,1810 [técnico 1, Ye et al. 2025]. O previsor tem de medir o roteiro como desvio do normal da conta.
- O v0 já faz isso, por dois caminhos:
  - o coeficiente viral divide as views pela mediana móvel de 180 dias do canal [relatório v0];
  - o rótulo é o quartil de cima desse coeficiente dentro de cliente x rede x trimestre, com base de 26% [026].
- O dado da casa confirma o risco de errar esse desenho. A taxa recente do cliente sozinha dá 48,4% par a par, abaixo do chute, porque é volta à média [relatório v0].
- **Faixas e ranking, nunca views absolutas.** Os melhores modelos explicam menos da metade da variância do tamanho de cascatas [técnico 2, Martin et al. 2016]. Na casa: Brier 0,187 contra 0,188 de chutar a taxa de base, e acima de 40% o v0 prevê 48% e o observado é 29% [relatório v0]. Por isso a tela mostra faixa, com teto "40% ou mais".
- Nenhum produto de mercado prova previsão de views. No melhor caso, provam ordenação relativa [técnico 3].

### 1.2 Onde o v0 está hoje

| medida | par a par | fonte |
|---|---|---|
| v0 Gemini, jul a set | 60,9% [58,7 a 63,0] | [relatório v0] |
| v0 OpenAI (o da produção), mesmos 2.471 vídeos | 58,7% [56,7 a 61,2] | [relatório v0] |
| só a parte do texto, OpenAI (o que ordena candidatas da mesma sessão) | 57,6% [55,7 a 60,1] | [relatório v0] |
| outubro parcial, mês que nenhum estudo viu | 58,2% [53,1 a 63,0] | [relatório v0] |
| baseline: só o kNN da casa | 58,0% [55,8 a 60,3] | [relatório v0] |
| baseline: só a taxa recente do cliente | 48,4% [45,4 a 51,2] | [relatório v0] |

- O portão é 58%. O v0 passa raspando. A parte do texto sozinha fica meio ponto abaixo.
- Na [branch 025], a conferência mensal (Task D) mediu setembro pelo caminho da produção: 68,9% no mês inteiro e 67,2% na metade que o modelo não viu. O próprio texto avisa que a comparação não é limpa e que o teste de verdade é outubro, na medição de 05/12. Esse número não está em main.

---

## 2. Caso de uso mínimo: "Modelar vídeo validado" para a Izabela Anholett

### 2.1 Por que este fluxo

- É a função mais usada: 139 das 289 sessões têm modelagem (102 Modelar, 37 Replicar) [dados, branch 027].
- É o fluxo que mais converte depois que o roteiro sai: 41% dos roteiros viram vídeo, 50% nas sessões com cliente (7 de 14) [fluxos].
- É o texto menos mexido: 0,85 de sobreposição Codex para CRM (n = 10) [fluxos].
- É o que mais quebra antes: só 58% das sessões geram roteiro [fluxos]. 27 das 102 sessões Modelar terminaram sem roteiro, e a mediana é de cerca de 10 minutos por roteiro [branch 027].

### 2.2 Por que esta cliente

- Ativa e com o maior volume da casa: 227 vídeos VM em 8 semanas, 77 acertos [dados].
- É onde a modelagem da casa mais rende: 31% de topo no modelado contra 18% no original, OR 2,06. 55% dos roteiros dela já são modelados [fluxos].
- O Codex quase não foi usado nela: 6 sessões, nenhuma de modelagem [fluxos]. O espaço é todo novo.
- **Plano B de cliente**, se a equipe da Izabela não adotar em 2 semanas:
  - Thiago Bisewski: 169 vídeos, 102 com seguidores (o único com o alvo secundário em boa parte), OR 1,95 a favor de modelar [dados, fluxos];
  - Rafael Rodrigues: 155 vídeos, 36% contra 22% de topo, OR 1,98 [dados, fluxos].
- **Fora do plano:** Pedro Elero e Marcos Pelozato cancelaram em 22/11. Nada se planeja para eles. Os vídeos deles continuam no treino e na conferência [dados].

### 2.3 O que o piloto entrega

1. **Modelador de uma chamada (plano 027).** Escritor com o original na mão. Portões em código: tamanho ±20%, até 2 números a mais, frase média até 15% mais longa, nenhuma sequência de 6 palavras igual. 4 hooks (1 fiel e 3 com alavancas). No máximo 3 melhorias por vídeo. Cerca de 1 a 2 minutos por roteiro contra cerca de 10 hoje. Na prova da branch: 58 s e 99 s [branch 027].
2. **Os 4 hooks ordenados pelo preditor v0.** Mostra faixa, nunca número com decimal, com teto "40% ou mais". Quem escolhe é o usuário.
3. **Log de candidatas, nota e escolhida.** Reusa `vm_preditor_sombra` (já tem `fase`, `indice`, `texto`, `nota`, `escolhida`, `features`, `versao`) [survey 3.1]. Nenhuma tabela nova no Codex.
4. **Cliente obrigatório e fixo no piloto.** Sem cliente a sessão não casa nem treina: 82 dos 307 roteiros estão sem cliente [dados].

### 2.4 Critério de sucesso em 4 semanas

A contagem começa no dia em que o piloto entra em produção.

| medida | hoje | **META** em 4 semanas | como mede |
|---|---|---|---|
| Adoção | 0 modelagens da Izabela no Codex [fluxos] | 4 ou mais modelagens por semana usadas pela equipe dela, a partir da semana 2 | sessões com anexo `vm_attachments.is_modelagem = true` e cliente Izabela |
| Sessão que gera roteiro | 58% no modelar_video [fluxos] | 90% ou mais | roteiro salvo por sessão |
| Tempo por roteiro | cerca de 10 min [branch 027] | mediana de até 2 min, do link ao roteiro | timestamps da sessão |
| Texto mantido | 0,85 (n = 10) [fluxos] e 0,77 (n = 25) [branch 027], só sobreviventes | mediana de 0,70 ou mais | sobreposição de 5-gramas Codex x CRM, a régua de `lib/script-matches.ts` |
| Roteiro que chega ao CRM | 45% no modelar_video [fluxos] | 60% ou mais | `crm_script_id` casado (limiar 0,08) |
| Roteiro que vira vídeo | 41%, 50% com cliente [fluxos] | 50% ou mais, lido na semana 6 | `vm_script_matches` confirmado |
| Performance (portão lento) | modelados da Izabela: 31% de topo [fluxos] | não ficar abaixo da taxa dos modelados dela no mesmo período | topo no estrato, vídeos do Codex contra modelados da Izabela fora do Codex |

- **De onde sai a meta de adoção.** A Izabela posta cerca de 28 vídeos por semana (227 em 8). Com cerca de 2,5 vídeos por roteiro na casa (7.667 vídeos para 3.020 roteiros [relatório v0]), são cerca de 11 roteiros por semana, uns 6 modelados. A meta de 4 é dois terços disso. Conta minha, ESTIMATIVA.
- **A performance não prova nada em 4 semanas.** Com a meta batida, são uns 16 roteiros e algo como 25 vídeos, e o vídeo só matura 14 dias depois de postado [survey 4.1]. Com 8 topos em 25, o intervalo de 95% vai de 17% a 52% (Wilson, conta minha). Isso não separa 31% de nada. A leitura de performance é por trimestre, como a casa já decidiu [estratégia]. Em 4 semanas ela só serve de alarme.
- **O que decide o piloto em 4 semanas** são as quatro primeiras linhas: adoção, sessão que gera roteiro, tempo e texto mantido.
- **Regra de parada.** Menos de 2 modelagens por semana nas semanas 1 e 2: trocar para o plano B de cliente ou parar. Não esticar.

---

## 3. Mecanismo: previsão congelada de todo roteiro da casa

### 3.1 A ideia

O preditor não depende do uso do Codex para se conferir.

1. **Todo roteiro do CRM recebe a nota do v0 quando é entregue, antes de postar.** A nota fica gravada com a versão do modelo e nunca é reescrita.
2. **Depois que o vídeo matura, o ETL semanal cruza a previsão com `vm_preditor_rotulos`** e publica a acurácia da semana.
3. **Volume:** cerca de 250 a 300 previsões conferidas por semana, com o Codex usado ou não [dados].

**O que muda em relação à Task D da [branch 025].** Lá a nota é calculada depois, com o modelo e o corpus de hoje, e o hook sai da transcrição do vídeo. Aqui a nota é do texto do CRM, feita antes do resultado existir. É a única medida sem vazamento possível. O código de métricas da Task D (`metricas()`, `parAPar`, `auc`, `calibracao` em `lib/preditor/medir.ts`) é reusado inteiro.

### 3.2 Onde mora

Regra da casa: métrica nova de performance pertence ao Oráculo. Então:

- **Tabela de previsões e painel no schema `oraculo`.** A migração é do repo do Oráculo.
- **O Codex só consome**, com uma exceção que precisa de decisão (ver furo 1 na seção 6): quem pontua é o código do preditor, que vive no Codex e precisa de embedding OpenAI e de `match_documents`.

Esboço (o desenho final é do Oráculo):

| objeto | conteúdo |
|---|---|
| `oraculo.previsao_roteiro` | `crm_script_id`, `cliente_id`, `versao_modelo`, `nota`, `faixa`, `features` (jsonb), `base_cliente_90d`, `base_knn`, `hash_texto`, `pontuado_em`, `ja_postado` (bool). Chave: roteiro + versão. Só insert |
| `oraculo.previsao_acuracia` | uma linha por semana, versão e modelo comparado: n, grupos, pares, par a par com IC, AUC, Brier, Brier da base, calibração por faixa (jsonb) |
| RPC de escrita | `oraculo.fn_registrar_previsao(...)`, insert-only, com `comment on function` |
| RPC de leitura | `oraculo.fn_previsao_acuracia(p_inicio, p_fim)` para o painel e para o Codex |

- `ja_postado = true` marca roteiro pontuado depois de ir ao ar. Ele fica fora da métrica limpa.
- A leitura do CRM dentro do banco já existe: schema `crm.*` por FDW, só leitura de `scripts` (skill ecossistema-vml).

### 3.3 O que a conferência semanal publica

- **Par a par** dentro de cliente x rede x semana, com IC95 por bootstrap de grupos.
- **AUC, Brier e Brier da base.**
- **Calibração por faixa**, nas faixas que a tela mostra.
- **Contra dois baselines, na mesma tabela:** a taxa do cliente nos últimos 90 dias e o kNN sozinho.
- **Alvo secundário, só onde existe:** seguidores por mil views contra a mediana do canal, nos clientes com cobertura (hoje Thiago Bisewski com 102 de 169 e Rodrigo Waughan com 62 de 119 [dados]). Seguidores absolutos medem alcance: correlação de 0,804 com views, contra 0,127 da taxa [survey 5.3, plano 021].

### 3.4 Recalibração mensal e portão

- É a Task D do 026, que existe na [branch 025] (`lib/preditor/medir.ts`, workflow no dia 5).
- **Portão de 58% par a par.** Abaixo disso, ou com o limite de baixo do IC abaixo de 50%, o preditor volta a só mostrar dados: sem ordenar, sem faixa.
- **Decisão sobre janela de 4 semanas, não sobre uma semana.** O IC mensal já é de ±3 a 4 pontos com cerca de mil vídeos [relatório v0]. Com 250 a 300 vídeos, uma semana sozinha oscila demais para decidir (ver furo 2).
- Retreino só depois da conferência, e a versão nova entra como nova `versao_modelo`. As previsões antigas não mudam.

### 3.5 Baseline primeiro, modelo depois

**Baseline (fazer primeiro):**
1. Regra de duas peças: taxa do cliente + kNN da casa. Publicada toda semana ao lado do v0.
2. v0 como está (`preditor-v0-2026-10_openai`), congelado.

**Regra para qualquer feature ou modelo novo:** só entra se bater o baseline na validação temporal (treino até M-1, teste em M, nos 3 últimos meses). Critério proposto: ganho de 1 ponto ou mais no par a par do conjunto, sem piorar em 2 dos 3 meses. Cada tentativa fica registrada, inclusive as que falharam, para não escolher a que deu certo por sorte.

**Features novas candidatas, nesta ordem:**

| # | feature | de onde vem | estado |
|---|---|---|---|
| 1 | Métrica da referência modelada: views e coeficiente do vídeo original relativo ao canal dele | coletor, na hora da modelagem | ninguém guarda hoje. Sem resposta em 46 de 54 casos [fluxos] |
| 2 | Modelagem ou original | CRM (`sources` com "Modelagem") e `vm_attachments` | a marca existe em texto livre. O CRM não tem campo estruturado [dados] |
| 3 | Origem da referência: casa x externa | id do vídeo em `videos.link_video` | 34% x 26% de topo [fluxos] |
| 4 | Estrutura CODEX / modo | `vm_roteiro_modo` (2.832 roteiros) | parou no seed. Roteiro novo não é classificado (Task 11 do 025 pendente) [survey] |
| 5 | Marcas de hook | já no v0 (145 marcas) | a maior alavanca: de 57,5% para 60,9% [relatório v0] |
| 6 | Tema por kNN | já no v0 | o melhor sinal sozinho: 58,0% [relatório v0] |

As linhas 5 e 6 já estão no v0. As linhas 1 a 4 são a evolução, depois do baseline medido.

### 3.6 Ficha de mecanismos por bloco (evolução)

- **O quê.** Um LLM preenche uma ficha fechada por bloco do roteiro: hook, contexto, tensão ou virada, payoff, CTA. Campos com vocabulário controlado, em JSON, para dar para regredir [técnico, arquitetura B].
- **O que já existe e entra na ficha, sem refazer:**
  - `vm_roteiro_modo`: modo, âncora e registro de 2.832 roteiros;
  - as marcas de hook do estudo de hooks (as 145 do v0);
  - o esqueleto da autópsia da modelagem, e os `beats[]` com função da leitura do 027;
  - `vm_video_classifications` (`hook_mecanismos`, `estruturas`, `comandos`, `tema`) [survey 2.2].
- **Campos novos candidatos, da pesquisa:** lacuna que o hook abre e onde fecha [psico 3, Loewenstein 1994]; valência e ativação por bloco e número de viradas [psico 2.2, Berger, Kim e Meyer 2021]; segunda pessoa [psico 1.4, Cheng e Li 2023]; tipo de prova.
- **Hipóteses validadas fora do lote.** O LLM lê um lote pequeno de pares topo x não topo do mesmo cliente e rede e propõe hipóteses de mecanismo. Cada hipótese é testada em dados separados no tempo, que o LLM não viu. Só a que se mantém vira candidata [técnico 5, Wang, Sudhir e Zhou, Yale 2025]. O mesmo trabalho mostra que otimizar só "o que funciona" cai em clickbait.
- **Duas travas da casa continuam valendo:**
  - só entra no preditor a feature que melhorar o par a par na validação temporal (regra da 3.5);
  - hipótese validada só vira texto de prompt com aprovação do Igor [survey 5.7].
- **Aviso da própria pesquisa:** explicação de LLM pode ser racionalização [técnico 3], e seguir a estrutura normativa não se relacionou com popularidade [psico 2.2, Boyd et al. 2020]. A ficha é hipótese até passar no teste.
- **Custo, ESTIMATIVA:** perto do da autópsia, cerca de US$ 0,06 por roteiro [fluxos]. Uma amostra de 2 mil roteiros para a validação sai por cerca de US$ 120. O teto de cerca de 2 mil textos é decisão do Igor no plano 020 [survey 5.2].

### 3.7 LLM zero-shot como feature, não como juiz (evolução)

- **O que a pesquisa mostra.** LLM zero-shot chegou a 82% contra 80% de uma rede supervisionada, e o ensemble dos dois a 85,5%, em outra tarefa (prever hit a partir do vídeo em texto) [técnico 3, Kayal et al., Findings ACL 2025]. O ganho está em somar, não em trocar.
- **O que a casa já sabe.** O juiz LLM perdeu de 7 a 0 para o humano [estratégia]. No Upworthy, LLM puro é ruim para escolher a variante, e só funciona como prior somado a outro método [técnico 6, LOLA, Marketing Science 2025].
- **Então:** a nota zero-shot ("acima ou abaixo do normal desta conta") entra como UMA feature a mais no ensemble com o v0. Ela nunca decide sozinha e nunca aparece na tela.
- **Teste:** a mesma validação temporal da 3.5. Não melhorou o par a par, sai.
- **Custo, ESTIMATIVA:** US$ 0,01 a 0,03 por roteiro (uma chamada curta, uma fração da autópsia). Com 150 a 190 roteiros criados por semana no CRM (584 a 767 por mês [dados]), dá US$ 2 a 6 por semana.

### 3.8 Trava anti-cópia em camadas e fidelidade estrutural

Paráfrase engana detector lexical. A defesa que funciona é recuperar textos parecidos numa base e comparar com limiar [técnico 9, Krishna et al., NeurIPS 2023].

| camada | o que mede | como | estado |
|---|---|---|---|
| 1. Lexical | nenhuma sequência de 6 palavras igual ao original | portão em código do 027 (`lib/modelagem/portoes.ts`) | **baseline**, existe na [branch 027] |
| 2. Semântica frase a frase | cada frase do novo contra cada frase do original | OpenAI `text-embedding-3-small`, que o Codex já usa | evolução |
| 3. Recuperação na base da casa | o roteiro novo contra `documents` | `match_documents`, que o Codex já chama | evolução |

- **Camada 2:** o limite precisa ser calibrado. O ponto de partida de cosseno 0,90 por frase é sugestão da pesquisa, não número validado [psico 6.3]. O OpenAI espalha mais os cossenos que outros modelos [relatório v0].
- **Camada 3:** os limiares de roteiro inteiro já foram calibrados na casa para este embedding: 0,72 no mesmo cliente e 0,69 em outro cliente [relatório v0]. Servem de ponto de partida. Ela também pega o caso "a casa já fez este vídeo".
- **Fidelidade estrutural:** comparar a SEQUÊNCIA de rótulos de blocos do original e do novo (hook, contexto, virada, payoff, CTA, com o mecanismo de cada um), por distância de edição. Não usar cosseno de embedding: em analogia entre histórias, embeddings e LLMs vão mal, cerca de 30% contra mais de 85% dos humanos [técnico 10, StoryAnalogy, EMNLP 2023]. Os rótulos saem da ficha da 3.6.
- **Aceite:** fidelidade estrutural alta E as três camadas de cópia baixas.
- **Calibração:** algumas dezenas de pares rotulados à mão (cópia, paráfrase, mesma estrutura com outro conteúdo) [técnico, arquitetura D].
- **Antes de calibrar, as camadas 2 e 3 só gravam o valor no trace. Não bloqueiam nada.**

---

## 4. Etapas

Esforço em dias de trabalho, tudo **ESTIMATIVA**. "Aprova" é o que precisa do OK do Igor na hora.

### Baseline (fazer primeiro)

| # | etapa | o que entrega | esforço | aprova |
|---|---|---|---|---|
| 0 | **Destino das branches locais** | Decidir e executar: (a) `plano-025-skills-modo`: Tasks C e D do 026, conserto da transcrição e "release 2.7", 5 commits; (b) `plano-027-modelagem`: 3 commits e 2 arquivos sem commit; (c) qual versão do modelador vai para o piloto (ver furo 3). As duas branches mexem em `lib/transcribe.ts` e `lib/pipeline/modelagem.ts`: entra a 025 primeiro, a 027 por cima. Enviar as duas ao GitHub para não perder trabalho | 0,5 a 1 dia | push das branches, merge, release 2.7, deploy |
| 1 | **Piloto de modelagem** | Rota de modelagem com a chamada única, portões e 4 hooks (Tasks 5 do 027). Ordem dos hooks pelo v0 com faixa. Log em `vm_preditor_sombra`, com a posição em que cada hook apareceu. Cliente obrigatório | 3 a 4 dias | merge, deploy. Migração só se `vm_attachments.modo` ou `vm_preditor_sombra.fase` tiverem CHECK |
| 2 | **Combinar o piloto com a equipe da Izabela** | Um responsável nomeado, combinado de uso (as modelagens dela passam pelo Codex por 4 semanas), canal de retorno | 0,5 dia, do Igor | decisão do Igor |
| 3 | **Previsão congelada** | Migração no Oráculo (tabela + 2 RPCs). Passo no ETL que pontua os roteiros novos do CRM. Carga inicial dos roteiros ainda não postados | 2 a 3 dias | migração no Oráculo, exceção de escrita (furo 1), merge, deploy |
| 4 | **Conferência semanal e painel** | Passo no ETL que cruza previsão com rótulo e grava `previsao_acuracia`, com os dois baselines. Painel no Oráculo. O Codex lê pela RPC | 2 a 3 dias | merge e deploy nos dois repos |
| 5 | **Recalibração mensal com portão** | Task D ligada (vem na etapa 0). Regra dos 58% aplicada à tela: abaixo, some a ordem e a faixa | 0,5 a 1 dia | deploy |

Total do baseline: 9 a 13 dias, ESTIMATIVA. O piloto (etapas 0 a 2) e o mecanismo (3 a 5) não dependem um do outro e podem andar em paralelo.

### Evolução (só depois de o baseline estar medido)

"Medido" quer dizer: 4 semanas de previsão congelada conferida e a leitura do piloto feita.

| # | etapa | o que entrega | esforço | aprova |
|---|---|---|---|---|
| 6 | **Features da referência** (3.5, linhas 1 a 3) | Guardar views e coeficiente da referência na hora da modelagem. Marcar modelagem x original e casa x externa. Testar na validação temporal | 2 a 3 dias | migração, merge, deploy |
| 7 | **Rótulo de modo dos roteiros novos** (3.5, linha 4) | Task 11 do 025: classificar toda semana | 1 a 2 dias | custo de LLM, merge, deploy |
| 8 | **Ficha de mecanismos** (3.6) | Schema da ficha, preenchimento na amostra, hipóteses testadas fora do lote, features candidatas na validação temporal | 3 a 4 dias + cerca de US$ 120 | custo, e qualquer texto que vá para prompt |
| 9 | **LLM zero-shot como feature** (3.7) | Nota zero-shot na amostra histórica, teste no ensemble | 1 a 2 dias + US$ 2 a 6 por semana se entrar | custo, merge, deploy |
| 10 | **Anti-cópia camadas 2 e 3 + fidelidade estrutural** (3.8) | Medição em sombra, pares rotulados à mão, limiares, só então bloqueio | 2 a 3 dias | merge, deploy. Os pares rotulados pedem cerca de 1 hora de alguém do time |

Ordem sugerida da evolução: 6, 10 em sombra, 8, 9, 7. A etapa 6 vem primeiro porque é o dado que ninguém guarda e não dá para recuperar depois.

---

## 5. Riscos

1. **Adoção, o maior.** O Codex só gera dado se for usado, e o uso está em zero na última semana. Os 2 administradores fizeram 55% das sessões, e o único roteirista abriu 6 em 4 meses [fluxos]. Sem um responsável na equipe da Izabela, o piloto não acontece. Mitigação: etapa 2, regra de parada na semana 2, e o mecanismo da seção 3 não depende disso.
2. **Seleção.** Só vira vídeo o que o time escolhe, e o time mexe mais no roteiro mais fraco [fluxos]. Vale para o piloto e para os 4 hooks: só o escolhido vai ao ar, então a ordem dos hooks nunca é conferida dentro da mesma sessão.
3. **n pequeno.** 4 semanas de piloto dão algo como 25 vídeos. Nenhuma conclusão de performance sai daí.
4. **Cobertura de seguidores.** 7% a 25% dos vídeos, caindo, e 10 de 227 na Izabela [dados]. O alvo secundário só existe em dois clientes. Depende de uma decisão antiga, ainda aberta: planilha ou Graph API [survey 4.4].
5. **Vínculo roteiro para vídeo.** Depende de dois elos fora do controle do plano: o casamento por 5-gramas (limiar 0,08) e o coletor, que liga o vídeo ao roteiro do CRM por embedding (0,87) [survey 4.1]. Há 29 casamentos pendentes [dados]. Roteiro muito reescrito não casa.
6. **`documents` e embedding com lacunas.** A tabela ficou parada de 14/09 até o conserto do commit `ed7385b` [relatório v0]. O kNN só enxerga o que está lá. A conferência semanal deve publicar quantos roteiros ficaram sem vizinho.
7. **O preditor ordena, não promete.** Margem de 1 a 3 pontos sobre o portão, Brier quase igual ao da base. Mostrar faixa cria expectativa de promessa. Se a equipe ler "30 a 40%" como garantia, perde a confiança no primeiro erro.
8. **Volta ao roteiro numérico ou à cópia.** O modelador escreve com o original na mão. A prova já pegou 3 trechos de 6 palavras num vídeo [branch 027]. A pesquisa avisa que ter o exemplo na frente aumenta a conformidade [psico 4.3, Marsh et al. 1996]. Mitigação: portões em código agora, camadas 2 e 3 depois.
9. **Efeito da modelagem pode ter mudado.** Na casa toda, o OR do modelado caiu de 1,35 (jun a ago) para 0,83 (set e out) [fluxos]. O 2,06 da Izabela é da janela inteira. Não foi medido só no período recente.
10. **Otimizar contra o preditor.** Poucas candidatas, e nenhuma geração guiada pela nota [estratégia].

---

## 6. Furos que achei na direção (a essência fica)

1. **"A tabela fica no Oráculo, o Codex só consome" bate em duas coisas.** O plano 020 travou "nunca escrever no schema `oraculo`" [survey 5.2]. E quem sabe pontuar é o código do Codex. Proposta: a tabela e as RPCs são do Oráculo, e o ETL do Codex escreve só pela RPC `fn_registrar_previsao`, insert-only. É uma exceção explícita à trava do 020 e precisa do OK do Igor. A alternativa, levar o pontuador para o Oráculo, duplica o preditor.
2. **250 a 300 previsões por semana não dão uma acurácia semanal confiável.** São cerca de 60 grupos (20 clientes x 3 redes) com 4 ou 5 vídeos cada (conta minha). Publicar por semana, decidir pela janela de 4 semanas. Além disso, o rótulo de topo é por trimestre: dentro do trimestre ele ainda se mexe. A conferência semanal usa o rótulo provisório e é refeita no fecho do trimestre.
3. **A ponta da [branch 027] não é o modelador de uma chamada.** O último commit (`30dcaa6`, 12/11 à noite) trocou para "mapa, reforço e escrita sem o original". A própria mensagem diz: os fatos pararam de mudar, mas ficou mais lento (4 min), mais caro (US$ 1,48) e a sobreposição literal não caiu. A versão de uma chamada, a da direção deste plano, é a do commit `09ed0ad`. Recomendo o piloto com a de uma chamada (mais rápida, e a cópia fica por conta dos portões) e a do mapa guardada como segundo braço. Decidir na etapa 0.
4. **Faixa por hook vai sair quase sempre igual.** Os 4 hooks são do mesmo tema, mesmo cliente e mesma rede. Só as marcas de hook mudam a nota, e 92% dos vídeos caem entre 15% e 40% [relatório v0]. A parte do texto sozinha está em 57,6%, abaixo do portão. Proposta: mostrar a ordem, UMA faixa para o roteiro, e o rótulo "sugestão em teste" na ordem dos hooks.
5. **Ordenar pela nota contamina a medida da escolha.** Se o primeiro da lista é sempre o do preditor, "a escolha coincidiu com o preditor" passa a medir posição. Proposta barata: gravar a posição exibida e embaralhar a ordem em 1 a cada 4 sessões.
6. **"Quando é entregue" não tem campo confirmado no CRM.** Não verifiquei qual coluna marca a entrega. Se o ETL for só semanal, parte dos roteiros será pontuada depois de postar. Proposta: pontuar todo dia os roteiros criados ou editados, e marcar `ja_postado` para tirar esses da métrica limpa.
7. **A modelagem do CRM não é estruturada.** A feature "modelagem ou original" para a casa toda depende de texto livre em `sources`. Dentro do Codex ela é limpa. Para a casa, é ruído até o CRM ganhar o campo, que é outro sistema.

---

## 7. O que ficou sem verificar

- **Os 2 arquivos sem commit da `plano-027-modelagem`.** Não consegui ler o estado da pasta de trabalho dela. Não sei o que há neles.
- **Se a branch 025 e a 027 mesclam sem conflito.** Só vi que tocam os mesmos arquivos.
- **Campo de entrega no CRM** e a latência real entre criar e postar.
- **CHECK em `vm_attachments.modo` e em `vm_preditor_sombra.fase`.**
- **Estado de produção:** migrations aplicadas, `vm_config_llm`, e se `CRM_SUPABASE_URL` e `CRM_SERVICE_ROLE_KEY` existem na Hostinger. Sem elas o casamento pelo CRM é pulado [survey].
- **Se `oraculo` aceita escrita do service role do Codex** e se está nos schemas expostos.
- **Quem é a equipe da Izabela no Codex** (quais das 6 contas) e se ela topa.
- **Quantos roteiros a Izabela escreve por semana.** Os 11 são estimativa a partir de vídeos.
- **O OR da modelagem na Izabela só em set, out e nov.**
- **A medição de outubro da Task D.** Sai em 05/12 se a branch 025 estiver em produção até lá.
- **A pesquisa.** A maior parte foi lida só pelo resumo. Os números de Kayal, LOLA, Krishna e StoryAnalogy são de outras tarefas e outros idiomas. Nenhum trabalho testa "replicar a estrutura de um viral com outro tema" medindo audiência real [técnico 5, psico 7].
- **O custo por chamada do modelador.** O script de prova não registrou [branch 027]. Os custos de LLM deste plano são estimativas por comparação com a autópsia.
