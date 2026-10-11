# Plano 024: Evolução da escrita para viralização (11/10/2026)

Status: SPEC. Pedido do Igor depois de uma rodada de reclamações do time sobre roteiros ruins.
Evidência completa em `docs/escrita-2026-10/`:
- `licoes.md`: o que os usuários ensinaram e corrigiram (42 lições, 148 aprendizados, 34 pares antes/depois da edição humana, 168 observações de edição).
- `dados-lacuna.md`: Codex contra roteiros da casa (topo e base de coeficiente viral), inventário de sinais, Codex contra desfecho.
- `estado-atual.md`: o que os estudos de setembro e outubro já provaram, o que os planos 016/020/021 entregaram, playbooks ativos.
- `pesquisa-escrita.md`: pesquisa de escrita (curiosidade, causalidade, emoção, linguagem simples, números, LLM), com fontes e força da evidência.

Este plano não reescreve nenhum desses trabalhos. Ele junta as peças, resolve onde elas brigam e diz a ordem.

---

## 1. Diagnóstico em 12 linhas

1. **O texto do Codex está abaixo do piso de clareza da casa.** Pequim e Washington no lugar do país, siglas e empresas sem explicação (68% dos roteiros têm sigla), 2,9 números a cada 100 palavras contra 1,7 dos melhores roteiros humanos, frases picadas (15,6 palavras de média contra 17,8), fatos empilhados em lista ("primeira peça, segunda peça") colados por "Só que" (72% dos roteiros) e "Ou seja" (o dobro da casa).
2. **O humano reescreve mais da metade do que vai ao ar.** Sobreposição média entre o roteiro do Codex e o vídeo publicado: 0,47. A abertura é reescrita em 41% das edições. Só 9% dos roteiros gerados foram publicados.
3. **Estilo de superfície quase não prevê viralização.** Entre os roteiros humanos, número, tamanho de frase, conectivo, sigla e "você" não separam topo de base (d de no máximo 0,26). Leitores às cegas acertaram o vencedor em 62% dos pares. O que move o resultado é tema/território (11% a 49% de topo dentro do mesmo cliente), payoff (disputa com lado: OR 2,09; orgulho com régua de fora: 2,05), hook (placar +2: 39% de topo; -2: 15%) e nome próprio concreto.
4. **Conclusão central: são dois problemas diferentes.** O piso (clareza, fluxo, tiques) é o que gera reclamação e retrabalho. O teto (potencial viral) se decide antes do texto: pauta, premissa, payoff e hook. Consertar só o texto tira a reclamação mas não faz viralizar. Consertar só a pauta faz viralizar um texto que ninguém publica sem reescrever.
5. **O sistema empurra para o erro.** O pesquisador recebe "priorize números que surpreendem". O style_guide ativo diz "R$ 3.400 em vez de muito dinheiro". O roteirista tem piso de 370 palavras e recebe o dossiê inteiro: quando falta história, sobra dado. O storytelling escolhe uma estrutura pronta de 5 a 7 etapas, e cada etapa vira um bloco de fatos.
6. **Três reescritas completas em série** (roteirista, revisor, humanizador) e cada uma deixa os próprios tiques. O hook duplicado no primeiro parágrafo nasce do humanizador reescrevendo a cópia do hook, que depois não é reconhecida pelo corte exato (`stripLeadingHook`, `draft.ts:546`).
7. **Lista de proibições não resolve vício de IA.** "Agora vem a parte que…" foi banido e virou "Agora repara…", "Só que esse número…". A pesquisa confirma: restrição negativa no prompt gera sinônimo.
8. **O aprendizado está desligado.** 2 de 148 aprendizados ativos. Hook, comando, premissa e dados recebem 0 lições. As observações de edição pararam de ser gravadas em 28/09.
9. **E quando aprende, aprende ao contrário.** O destilador lê o texto do modelo. Em 10/10 ele promoveu a aprendizado "essa foi a primeira peça" e "isso tem nome, chama rede", as mesmas frases que o Felipe cortou naquele dia.
10. **O estudo de outubro está na gaveta.** As 9 versões novas de playbook (hook v4, style_guide v5, payoff v1…) existem no banco com `active=false`. O runtime ainda roda as versões que o estudo desmentiu. O WIP que aplica o estudo aos prompts não está commitado.
11. **Não dá para medir a escrita do Codex hoje.** Não guardamos a versão publicada, não registramos os rejeitados, não ligamos o roteiro do Codex ao `crm.scripts`. A coleta de retenção parou em 14/09.
12. **Não há banco de prova.** Toda mudança de prompt até hoje foi para produção sem comparação controlada (o A/B opus-5-5 contra fable nunca rodou).

---

## 2. Princípios do plano

**P1. Hierarquia de evidência.** Quando duas fontes brigam, vale nesta ordem:
1. dado da casa que replica (estudo de outubro, `dados-lacuna.md`);
2. correção humana repetida (≥ 2 usuários ou clientes);
3. pesquisa forte (`pesquisa-escrita.md`, marcada [Forte]);
4. prática de criador, pesquisa moderada;
5. opinião.

Exemplo: a pesquisa manda falar com o espectador ("você"). Na casa, "você" no hook derruba (OR 0,78) e "você" frequente no corpo derruba a retenção final (0,55). Vale a casa: corpo em 3ª pessoa, "você" só no fim, como consequência.

**P2. Piso e teto são trilhos separados.** Piso = reclamação zero e edição mínima, medido por verificador e pelo diff humano. Teto = coeficiente viral, medido por dado publicado. Uma mudança de piso não precisa provar que aumenta views. Basta não piorar o teto no banco de prova.

**P3. Exemplo vence regra.** Roteiros humanos de topo do mesmo cliente e território ensinam voz melhor que 10 seções "INEGOCIÁVEL". A pesquisa sustenta: imitar estilo só por prompt foi detectado como IA em 97% dos casos.

**P4. Medir depois, não proibir antes.** Vício se detecta no texto pronto (contagem, repetição entre roteiros) e se corrige cirurgicamente. Não se adiciona frase à banlist.

**P5. Nenhuma mudança de prompt sem banco de prova.** Ver a memória "portão novo exige rodada real": teste verde não valida escrita.

**P6. Uma reescrita a menos é melhor que um prompt a mais.** Cada passada completa de LLM adiciona deriva.

---

## 3. A doutrina de escrita (o alvo)

Doutrina = o que o roteiro precisa ser. Cada regra traz a fonte. É daqui que saem o style_guide v6, o checklist e os verificadores.

### 3.1 Atenção (teto, decidido antes do texto)
- **Pauta com território que funciona para o cliente.** Tema pesa mais que fórmula. Usar o território do cliente (estudo de outubro, embeddings) e evitar o que saturou ou falhou. [casa]
- **Payoff declarado na premissa.** Disputa com lado, orgulho com régua de fora, Davi contra Golias nomeado. Evitar superação pura (0,68) e dica ao espectador (0,62), salvo quando o objetivo é salvamento. [casa]
- **Hook com placar +2.** Abrir com nome próprio ("A/O + nome", 1,51), "[Nome] acabou de" (1,96), conflito com os dois lados nomeados (1,96), lugar concreto. Evitar "Esse/Essa" na abertura, "você", hook sem nome próprio, palavra de 13+ letras, ano em algarismo. [casa]
- **A lacuna do hook é específica e se paga dentro do vídeo.** Isca vaga reduz credibilidade. [pesquisa forte]
- **Ponte com o Brasil.** Foi a pista mais confiável na leitura cega (79%). História só estrangeira sem ponte: 0,74. [casa]

### 3.2 Fluxo (piso)
- **Cadeia, não lista.** Cada parágrafo responde à pergunta que o anterior deixou ("por quê?", "e aí, o que isso causou?", "mas e…?"). Teste: trocar dois parágrafos de lugar quebra o texto? Se não quebra, é lista. [lição Felipe/Ana + pesquisa forte (Trabasso 1985) + Parker e Stone]
- **A virada é "mas".** Pelo menos 1 virada a cada 100 palavras (sem isso, retenção final 0,61). "Então/por isso" é neutro. A virada vem do fato que contraria, não de "Só que" como cola. [casa]
- **Não contar origem em ordem cronológica** ("nasceu", "começou", "foi aí que": 2+ marcadores, OR 0,63). Começar pelo conflito e voltar à origem só se ela explicar a virada. [casa]
- **Fechar no caso, não na moral.** "Enquanto todo mundo X, [personagem] Y", eco do hook, estado atual do personagem. Evitar "A lição é", "talvez", "você precisa". [casa]

### 3.3 Clareza (piso)
- **Escrita para o ouvido.** Uma ideia por frase, ordem direta. Frase longa pode ficar se estiver costurada por conectivo; picar não é clarear (o humano junta frases e a frase média sobe nas edições). [pesquisa + edição humana]
- **Nada de metonímia de jornal.** China, não Pequim. Governo americano / Estados Unidos, não Washington. Governo federal, não Planalto/Brasília. [reclamação + edição humana + pesquisa]
- **Todo nome que o público não conhece ganha aposto na primeira menção.** "A State Grid, estatal de energia do governo chinês". Nome próprio é bom (prevê desempenho, d 0,23), nome sem explicação é ruído. Vale também para o hook. [lição ativa CPFL + edição humana + casa]
- **Sigla só se o público usa no dia a dia** (PIX, INSS). Caso contrário: nome por extenso ou função ("o órgão que autoriza compra de empresa"). [lição + pesquisa]
- **Teste de leitura:** listar cada termo que um aluno de 14 anos não saberia explicar. Lista vazia ou cada item com aposto. [pesquisa, como checagem, não como julgamento]

### 3.4 Credibilidade sem densidade (piso)
- **Número só com função.** Cada número cumpre uma de quatro: (a) contraste/comparação, (b) dimensão de algo grande demais para sentir, (c) prova de afirmação surpreendente ou quebra de objeção, (d) autoridade pontual. Sem função, sai. Duas com a mesma função: fica a mais forte. [Felipe + pesquisa (Barrio 2016)]
- **Orçamento:** alvo ≤ 1,8 número a cada 100 palavras (o topo da casa), arredondado ("mais de 25 mil"), um exato como âncora. "Ou seja," / "Pra você ter ideia," traduzem o número (1,30 e 1,25), uma vez por roteiro. [casa + edição humana]
- **Fonte falada antes da afirmação surpreendente** ("segundo o IBGE"). Antecipar a objeção óbvia e responder. Levantar e não responder piora. [pesquisa forte (Allen 1991)]
- **Especificidade que vende é nome, lugar e idade, não número.** [casa]

### 3.5 Emoção (teto e piso)
- **Emoção de alta ativação com alvo concreto:** espanto, indignação contra uma decisão nomeada, ansiedade com saída, orgulho comparado. Tristeza pura derruba a permanência. [pesquisa forte (Berger e Milkman) + casa (payoff)]
- **Rosto humano.** Um personagem nomeado carrega o custo ou a virada. Evitar a massa de eventos. [lição Felipe/Igor + casa (nome próprio)]
- **O que muda para quem assiste**, dito no fim e não no subhook ("Imagina você…" no subhook: 0,50). [casa + pesquisa]

### 3.6 Voz (piso)
- **Sem fórmula repetida.** Nenhuma abertura de frase pode aparecer em mais de 20% dos roteiros das últimas 4 semanas (hoje "Só que" está em 72%). Medido entre roteiros, não proibido por lista. [P4]
- Antítese "não é X, é Y": no máximo 1. Tricolon: no máximo 1. Pergunta elíptica ("O resultado?"): nunca. Pergunta completa: pelo menos 1. [casa]
- **Tamanho:** 450 a 500 palavras faladas no total (OR 1,39). Abaixo de 300 derruba. O piso existe para caber história, não dado: se não há história para 450, a pauta é fraca, e isso é alerta para o usuário, não convite a encher. [casa]

---

## 4. Ondas

Esforço: P (horas), M (1 a 3 dias), G (uma semana ou mais). Cada item termina com critério de aceite.

### Onda 0: consertos e pendências (sem decisão de produto)

**0.1 Hook duplicado no primeiro parágrafo (P). FEITO no branch `escrita-024`.** `stripLeadingHook` passa a cortar também quando o primeiro bloco `ecoa()` o hook (a comparação fuzzy que já existe em `draft.ts:610`). `hookEcoaAbertura` roda também no texto final, depois do humanizador. Aceite: teste com o caso real de 09/10 (`c26b1711`), e 0 ocorrências nos roteiros novos.

**0.2 O WIP do estudo de outubro vira o braço B do A/B (P).** Confirmado com a sessão de origem (estudo de 07/10, sessão 3f14d0f7): o trabalho está terminado e ficou sem commit de propósito, esperando aprovação. Inclui placar do hook em código, `selectHook` por placar, comando por território, prompts dos agentes ajustados e injeção dos playbooks novos quando ativos. Testes (826) e `tsc` passam. Como o Igor quer A/B antes de ativar (decisão 2), ele NÃO sobe direto: o push na main é deploy e mudaria os prompts em produção. Ele entra no banco de prova como braço B contra o código de hoje (1.5 e 2.1). Ao commitar, separar dos arquivos da outra sessão (checagem no Gemini, plano 023: `verificar.ts`, `gemini-search.ts`, `.env.example`, `.gitignore`, `codex-updates/state.json`).

Pendências conhecidas do WIP, registradas pela sessão de origem:
- o humanizador pode reescrever o hook sem recontar o placar (resolve com 2.8);
- o lint `MAX_LONGAS_SEGUIDAS` cobra uma regra que o dado não sustenta (sai em 0.4);
- os agentes não recebem rede nem nicho (5.1);
- as exceções por cliente não estão em `vm_client_preferences` (5.1);
- o ideador não vê o histórico datado que a regra de repetição de 21/90 dias precisa (2.2).

**0.3 Commitar o estudo de outubro (P). FEITO no branch `escrita-024`.** `docs/estudo-2026-10/` está fora do git.

**0.4 Contradições óbvias dos prompts (P). FEITO no branch `escrita-024`.** O que mora no banco (tamanho do checklist v3, travessão do style_guide v4) já está corrigido no checklist v4 e no style_guide v5 do estudo de outubro, então resolve junto com 2.1. No código: FONTES do roteirista alinhado ao formato, revisão sem o marcador antigo e com o hook fora da reescrita, e o teto de frases longas seguidas fora do revisor e do humanizador (continua medido no rastro). Unificar o tamanho (checklist "150 a 430 corpo" contra roteirista "370 a 430 corpo / 420 a 500 total"; ritmo real é 3,07 palavras/s), o formato de FONTES (`roteirista.md:14` contra `WRITER_FORMAT`), o travessão (style_guide permite 1, `dedash` remove todos) e o `revisao.md` que ainda descreve a saída por marcador quando o código usa tool. Remover o lint `MAX_LONGAS_SEGUIDAS` (teto de 3 frases longas seguidas): 90% dos roteiros humanos violam e nenhuma faixa separa resultado.

**0.5 Observações de edição: alarme falso (verificado 11/10).** A varredura (`varrerEdicoes` em `lib/etl.ts`) roda no ETL semanal. A última rodada foi 05/10 e não havia edição nova desde 28/09. As edições de 10 e 11/10 (3 roteiros) entram na rodada de 12/10. O problema real é a latência de até 7 dias entre a edição e a lição, e ele fica para 3.4.

**0.6 Pesquisador para de pedir número por número (P). FEITO no branch `escrita-024`, junto com o "o que é" de cada sigla/empresa pouco conhecida e o país pelo nome.** Em `agents/pesquisador.md`, trocar "Priorize números que surpreendem" por "traga os números que servem à tese, cada um marcado com a função que cumpre (contraste, dimensão, prova, autoridade)". O dossiê continua rico. Quem corta é o roteirista.

### Onda 1: banco de prova (antes de mexer na escrita)

Sem isso, as Ondas 2 e 3 viram opinião.

**1.1 Conjunto de pautas (M).** 40 pautas reais dos 15 clientes que usam o Codex, em duas metades:
- 20 com roteiro humano de topo publicado nos últimos 90 dias (`crm.scripts` + `oraculo.fato_video`, quartil de cima no estrato cliente × rede × trimestre). Usar o título/assunto do humano como pauta e o roteiro humano como gabarito.
- 20 sessões reais do Codex com reclamação ou edição pesada (`licoes.md`), incluindo China/Pequim (Felipe, 10/10), delator do Master, Sky/Amazon, CPFL, bets.

Rodar com `scripts/retry-session.ts` ou um modo seco do `runPipeline` que não grava sessão nova.

**1.2 Verificador de piso determinístico (M).** Um `lib/pipeline/piso.ts` (família `slop-lint`) que devolve contagens por roteiro:
- metonímia (lista fechada: Pequim, Washington, Brasília, Planalto, Kremlin, Casa Branca, Downing Street, Bruxelas… como sujeito);
- entidade sem aposto na primeira menção (nome próprio ou sigla cuja primeira ocorrência não vem seguida de vírgula/"que é"/"empresa", "estatal", "órgão"…, menos uma lista de conhecidos: Brasil, Lula, Apple, PIX…);
- números por 100 palavras e números sem arredondamento;
- viradas "mas" por 100 palavras;
- "Ou seja" > 1;
- hook ecoando a abertura;
- fórmula repetida entre roteiros (inícios de frase de 2 a 3 palavras nas últimas 4 semanas, contra o teto de 20%);
- marcadores de origem em ordem;
- tamanho.

Não bloqueia nada: alimenta o revisor (1.4 e 2.4) e o painel. Aceite: roda sobre os 191 roteiros dos últimos 60 dias e sobre 200 roteiros humanos de topo, e as distribuições batem com `dados-lacuna.md`.

**1.3 Juiz de teto calibrado (M).** Comparação em pares (A contra B, ordem sorteada e invertida) com a doutrina §3.1 e §3.5 como critério. Antes de usar, calibrar nos 232 pares cegos do estudo de outubro (`docs/estudo-2026-10/dados/gabarito_pares.json`). Linha de base: 62%. Se o juiz não passar de 62%, ele só serve para piso e o teto fica com o painel humano e o dado publicado. A pesquisa avisa que juiz LLM é fraco em qualidade criativa e tem viés de posição, tamanho e autopreferência.

**1.4 Painel humano às cegas: ADIADO (decisão do Igor, 11/10).** Sem painel, o sinal humano vem passivo, do que o time já faz: sobreposição entre gerado e publicado, % de hook reescrito e diff de edição (Onda 3 e 4.1). O teto no banco de prova fica com o juiz calibrado (1.3). Se o juiz não passar de 62%, reabrir esta decisão: aí o painel vira a única régua rápida de teto.

**1.5 Placar de base (P).** Rodar 1.2 e 1.3 no Codex de hoje. É o "antes" de tudo que vem depois.

### Onda 2: reestruturar o fluxo de escrita

Cada item passa pelo banco de prova: piso melhor, teto (juiz calibrado) igual ou melhor.

**2.1 Ativar os playbooks de outubro depois do A/B (M).** Decisão do Igor: ativar é obrigatório, o A/B decide como, não se. Se uma versão perder em algum ponto, corrige-se aquele ponto e ativa. Ativar hook v4, style_guide v5, payoff v1, conclusão v1 e subhook v1 contra os atuais, no banco de prova. Depois do A/B, o style_guide v5 vira v6 com a doutrina §3.3 a §3.6: metonímia, aposto, número por função, fórmula repetida. Hoje nenhuma dessas regras existe viva.

**2.2 A premissa decide o teto (M).** O registro da premissa ganha campos obrigatórios: payoff (do playbook payoff v1), protagonista nomeado, antagonista nomeado quando houver, ponte com o Brasil e "o que muda para quem assiste". Gate: sem protagonista nomeado e sem payoff, a sala avisa antes de escrever (mesma lógica de `teseAceitavel`). O Dados passa a escolher a narrativa olhando lift de território e payoff do cliente (pendência 2.5 do plano 021).

**2.3 Storytelling entrega esqueleto causal, não estrutura de catálogo (M).** Em vez de 5 a 7 beats de uma estrutura codificada (A1 Jornada do Herói etc.), cada candidata entrega 4 a 6 batidas, cada uma com a pergunta que ela responde e o elo com a anterior ("mas" ou "por isso"). A candidata que falha no teste de troca (2 batidas permutáveis) é descartada. Estruturas que o dado condena (A1: 0,61; origem em ordem) saem do cardápio. Dieta do playbook de 52 KB (plano 021, item 3.2).

**2.4 Hook primeiro, corpo depois (M).** Hoje o corpo é escrito antes do hook existir e o comando lê só os últimos 1.200 caracteres. Inverter: hook (com placar) → corpo que continua o hook sem repetir → comando com o corpo inteiro. Acaba com a classe de erro "corpo reabre o hook". O agente de hook passa a receber as lições de clareza (a de CPFL não chega nele hoje).

**2.5 Few-shot de topo humano do cliente (M).** Trocar os 5 transcritos de ASR por views absolutas (`few-shot.ts`, `CRITERIO_PADRAO = "views"`) por 3 roteiros ESCRITOS do CRM, do quartil de cima de coeficiente, do mesmo cliente e do território mais próximo (embedding). Texto escrito tem parágrafo e pontuação; ASR não. Fecha a pendência 2.4 do plano 021.

**2.6 Prompt do roteirista: doutrina curta + exemplos (M).** Substituir as 10+ seções "INEGOCIÁVEL" (`draft.ts:172`) por:
- a doutrina §3 em até 15 linhas positivas;
- os 3 exemplos de 2.5;
- o orçamento de números com a função de cada número (a função vem marcada do dossiê, item 0.6).

Medir tokens antes e depois.

**2.7 Revisor com passes verificáveis, não reescrita total (M).** O revisor recebe o relatório do verificador de piso (1.2) e devolve EDIÇÕES localizadas: trecho → substituição → motivo (clareza, número, fluxo, voz), não o documento inteiro. O código aplica as edições. Isso preserva o hook por construção e tira uma fonte de deriva.

**2.8 Humanizador vira cirúrgico (M).** Decisão do Igor: melhorar, não remover. Hoje ele reescreve tudo com opus e foi ele que gerou o hook duplicado. Novo papel: só passes cirúrgicos sobre o que o verificador de piso (1.2) apontou, no mesmo formato de edições localizadas do revisor (2.7), sem tocar o hook. A/B no banco de prova: (a) como está contra (b) cirúrgico. Aceite: (b) com piso melhor e teto igual.

**2.9 Piso não alcançado vira aviso, não silêncio (P).** Se o roteiro final ainda tem metonímia, entidade sem aposto ou hook duplicado, a sala mostra o trecho ao usuário. É a "correção humana" com o problema já apontado.

### Onda 3: o aprendizado aprende com o humano

**3.1 Destilar do diff, não do texto do modelo (M).** `extractFromCorrection` e `extractFromEdit` passam a receber o par (antes, depois) e o pedido do usuário. A lição é o que o HUMANO mudou. Uma frase que o modelo escreveu e o humano cortou vira lição "evite", nunca "faça". Teste de regressão: o caso "primeira peça / chama rede" de 10/10.

**3.2 Lição que repete vira regra de doutrina, não vaga de 3 (M).** Hoje cada agente recebe no máximo 3 lições e quase nenhuma está ativa. Proposta:
- lição que aparece em 2 ou mais usuários ou clientes (grupo de recorrência, que já existe desde 7ee6884) vira candidata;
- a candidata roda no banco de prova (1.5);
- se ganhar, entra no playbook (style_guide/hook/checklist) como regra permanente;
- a vaga de 3 fica para o que é específico do cliente.

Aceite: os temas 1, 2, 3 e 5 de `licoes.md` (hook, fluxo, clareza, tiques) chegam ao prompt como regra, e não como 148 itens inativos.

**3.3 Rotear para quem escreve (P).** Lição de clareza vai também para hook e comando. Os 11 aprendizados sem destinatário recebem destinatário ou saem. `ativada_em` passa a ser gravado.

**3.4 Edição livre gera lição sem pedir (M).** Quando o roteiro publicado difere do gerado (3.5 e 4.1), o diff entra na fila de 3.1 automaticamente. Hoje 168 observações de edição viraram 3 lições.

### Onda 4: medir no mundo

**4.1 Ligar o roteiro do Codex ao roteiro do CRM e ao vídeo (M).** No momento em que o roteiro sai do Codex para o CRM (ou por shingle, que já existe em `vm_script_matches`), gravar `crm_script_id` no `vm_generated_scripts` e guardar o texto publicado. Ver a memória `vmedia-ecossistema-repos` (o casamento certo com vídeo é por `link_video`).

**4.2 Rejeitado também é dado (P).** Roteiro que não foi publicado em 14 dias recebe status "não usado" com motivo opcional (um clique na sala). Hoje 91% somem sem registro.

**4.3 Métricas do plano (P, no painel do Codex).**

| métrica | hoje | meta em 8 semanas |
|---|---|---|
| sobreposição publicado × gerado | 0,47 | 0,70 |
| % roteiros com hook reescrito pelo humano | 41% | < 20% |
| roteiros com metonímia / entidade sem aposto / hook duplicado | 4% / 68% com sigla / 5% | 0 / < 10% / 0 |
| números por 100 palavras | 2,9 | ≤ 1,8 |
| abertura de frase mais repetida entre roteiros | "Só que" em 72% | < 20% |
| % roteiros gerados que são publicados | 9% | 25% |
| juiz pareado: Codex contra humano de topo (só se o juiz passar de 62% na calibração) | a medir (1.5) | ≥ 45% de preferência |
| **teto (decisão do Igor): coeficiente viral OU compartilhamentos por mil** dos publicados contra a base humana do mesmo cliente × rede × trimestre. Vale melhora em um sem piora no outro. Compartilhamento só existe em IG e TT | percentil de coeficiente 0,66 (n=20, enviesado); compartilhamento a medir | manter ou subir com n ≥ 60 |

**4.4 Religar coletas paradas (fora do repo, Viral Data).** Retenção (`metricas_retencao`) parou em 14/09. Texto de comentário parou em junho. Salvamento do IG nunca foi coletado. É o coletor (`Viral Data/api-viral-data`), não o Codex. Sem retenção, o hook e o subhook ficam sem sinal próprio.

### Onda 5: voz por cliente

**5.1 Exceções por cliente e por nicho (M).** O estudo de outubro mostra regras que se invertem: em Tecnologia, nome próprio denso e "Enquanto todo mundo" não valem e 500+ palavras desaba. "Ou seja" se inverte em Anholett, Waughan e Victor. "Você" no hook funciona em 8 clientes quando é de memória ("Você lembra da Kolynos?"). Essas exceções entram no contexto por cliente, ao lado das prefs.

**5.2 Cockpit como fonte de território (P).** A estratégia do Cockpit já chega ao roteirista. Fazer ela chegar também à escolha da pauta e da premissa (2.2), onde ela pesa no teto.

---

## 5. Ordem de despacho

```
Onda 0 (todos em paralelo, 0.2 primeiro)
  └─ Onda 1: 1.1 + 1.2 → 1.3 + 1.4 → 1.5 (placar de base)
       ├─ Onda 2: 2.1 → 2.2 → 2.3 → 2.4 → 2.5 + 2.6 → 2.7 → 2.8 → 2.9   (cada item = uma rodada no banco)
       └─ Onda 3: 3.1 + 3.3 → 3.2 → 3.4   (em paralelo com a Onda 2)
Onda 4: 4.1 + 4.2 + 4.3 já na semana 1 (precisam de tempo para acumular n); 4.4 com o time do coletor
Onda 5: depois de 2.5 (few-shot por cliente) estar no ar
```

Os itens de maior retorno por esforço são 0.1, 0.6, 1.2, 2.4, 2.5 e 3.1.

---

## 6. Decisões do Igor (respondidas em 11/10/2026)

1. **WIP não commitado (0.2):** o Igor não sabia dele. São dois blocos: checagem no Gemini (plano 023, 05/10, outra sessão) e o estudo de outubro aplicado aos prompts (07/10, terminado e aguardando aprovação, confirmado com a sessão de origem). O do estudo vira o braço B do A/B e só sobe depois dele. O da checagem segue o próprio plano 023.
2. **Playbooks de outubro (2.1):** ativar depois do A/B, e ativar é obrigatório.
3. **Humanizador (2.8):** melhorar (vira cirúrgico), não remover.
4. **Painel humano (1.4):** não por enquanto. Teto no banco de prova = juiz calibrado; sinal humano passivo via edição.
5. **Métrica do teto:** coeficiente viral ou compartilhamentos por mil; melhora em um sem piora no outro.

## 7. O que não fazer

- **Não aumentar a banlist** para "Só que", "Ou seja" e "repara". Elas viram sinônimo. A fórmula repetida se mede entre roteiros (§3.6).
- **Não adicionar seção nova ao prompt do roteirista** sem tirar outra. O prompt já é uma parede de regras.
- **Não usar o juiz LLM como portão de teto** sem passar dos 62% nos 232 pares.
- **Não perseguir paridade de estilo com o humano** (frase média, perguntas, siglas). Entre humanos isso não prevê resultado. Só vale o que é piso (reclamação, edição) ou o que replica no dado.
- **Não medir sucesso por roteiro publicado sem controlar a edição.** O percentil 0,66 dos 21 publicados é do texto editado, de pauta escolhida a dedo.
