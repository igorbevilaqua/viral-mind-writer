# O que os usuários do Codex ensinaram e reclamaram (snapshot 11/10/2026)

Fonte: Supabase `qclvrddrqulgfzccndnl`, só leitura. Período: 31/07 a 11/10/2026.

## Base analisada

| Fonte | Volume |
|---|---|
| `vm_lessons` | 42 (32 correcao, 3 edicao, 2 sessao, 1 texto, 4 curador). Humanas: 38. 11 clientes. |
| `vm_lesson_learnings` | 148 (**2 ativas**) |
| `vm_script_feedback` | 9 linhas, **1 nota** só ("Roteiro bom, só tinha algumas frases meio picadas e sem conectivo."). Notas: 4, 5, 1, 1, 4. |
| `vm_edit_observations` | 168 (insercao 66, reescrita 44, corte 30, ritmo 18, vocabulario 10). 9 clientes. Período 06/09 a 28/09: **nada depois de 28/09**, embora existam edições de 10/10. |
| Pares pré-humano × final (`pipeline_trace.roteiro_original`/`roteiro_pre_humano` × `roteiro`) | 34 roteiros, 9 clientes. 21 com similaridade < 0,9, 6 com < 0,7, 3 sem mudança. |
| Prevalência | 126 roteiros gerados nos últimos 45 dias |

Autoria aproximada das lições (o script mais próximo, ±15 min): analuisapbl02 14, felipedantasf 10, igor.bevilaqua 4, mmarinho794 3, gabriellagomesdeoliv 3, y.giulia.y 1, sem autor 3. Edições (34 pares): igor 15, felipe 11, analuisa 3, mmarinho 2, gabriella 2.

---

## O que o humano muda quando edita (34 pares)

- **Alonga o texto em vez de cortar.** Total de caracteres 69,6k → 74,9k (+7,6%). Só 10 dos 34 ficaram mais curtos. Ninguém reclama do tamanho.
- **Costura as frases.** Conectivos (porque/mas/então/enquanto/por isso/foi aí) 167 → 187 (+12%). A média de palavras por frase sobe 4,7%. As 18 obs. de `ritmo` são quase todas a mesma coisa: prefixar "Mas", "E", "Porque", "Foi aí que" ou "Não por acaso", ou juntar duas frases curtas ("O mais pesado aplicou um golpe banido. Fraturou a coluna do outro." → "...golpe banido e fraturou a coluna do outro.").
- **Reescreve a abertura.** O 1º parágrafo mudou em 14 dos 34 (41%).
- **Arredonda números e corta blocos de estatística.** Total de números 395 → 383. 12 roteiros perderam números e 8 ganharam. Exemplos: "25.680 brasileiros" → "mais de 25 mil"; "46.188" → "passou de 46 mil e o ano nem acabou". O bloco OpenRouter (4 estatísticas na abertura) foi trocado por uma linha de contraste. A exceção é a checadora (analuisa), que *adiciona* precisão (orçamento 2027: 15 → 18 números, com parênteses técnicos).
- **Explica quem é quem.** "a japonesa Uniqlo" → "uma marca japonesa de roupas baratas chamada Uniqlo"; "a ecnoglutida, um GLP-1 ... pela Sciwind" → "que é tipo um mounjaro"; "Esse é João Gurgel, um brasileiro que..."; "Essa é a Noruega."; "ela" → "a empresa"; "próprias exportações" → "exportações de diesel"; "gadget" → "aparelho"; "farmando aura" → "pico de dopamina"; "manchete" → "notícia".
- **Insere o rosto e a voz.** Das 66 inserções: cerca de 9 perguntas retóricas ou re-hooks orais ("Triste né?", "Adivinha o que o presidente Lula disse?", "Mas calma que a situação piora.", "Lembra o Walkman?"), cerca de 9 frases de moral ou aplicação ("Isso vale direto pro seu negócio..."), 5 perguntas de opinião no fim, 5 CTAs de compartilhar/seguir e cerca de 7 contextualizações ("Caso você não saiba, o Brasil está passando por um boom de corredores de rua.").
- **Corta o andaime de lista e os anúncios vazios.** "Essa foi a primeira peça." / "É a terceira peça." / "Agora olha quem assinou cada papel." / "E o que aconteceu nesses três anos eu conto no próximo vídeo." / "Ou seja, o acesso ao que é americano está encolhendo..."

---

## Temas (qualidade de escrita), do mais ao menos recorrente

Legenda: **L** = lições humanas, **E** = edições observadas/pares, **U/C** = usuários/clientes distintos. "Aprendizado" = existe em `vm_lesson_learnings`. Ativo ou não, e quem recebe.

### 1. Hook fraco, confuso ou sem choque. L=13, U≥5, C≈7
- 5 dessas lições são o usuário **ditando o hook pronto** (GTA, headline 82%, Rolls/BYD, MediaTek, bets): sinal de que o gerado não serviu.
- Citações: "esse hook tá muito confuso. 1 - o que amazon tem a ver com a sky?, 2 - o que a segunda frase dele quer dizer? ta muito solto" · "o hook ificou sem sentido, rever." · "o hook não tá uito apelativo. tem que ser algo mais alarmista" · "o roteiro só fala que o agro tá quebrando lá na metade".
- E: 1º parágrafo reescrito em 14/34.
- Aprendizado: cerca de 20 (grupo `hook-emocional-concreto` com 10, mais `hook-mais-alarmista`, `puxar-colapso-para-hook`, `teste-hook-pessoa-comum`, "Cada frase do hook precisa ter um referente claro"...). **Todos inativos. O agente `hook` recebe 0 lições hoje.**

### 2. Fluxo: frases picadas, sem conectivo, fatos soltos sem causa→consequência. L=4 + a única nota de feedback; U=2 (analuisa, felipe); E=18 obs. ritmo (13 roteiros, 4 clientes) + conectivos +12% nos pares
- Citações: "Muitas frases picadas, poucos conectivos. a relação entre um assunto e outro não é explicado, tudo precisa ser mais mastigado (ex: o que a ferrovia tem a ver com o deserto?)" · "A história está genérica só contando um monte de fatos sem conectar" · "só tinha algumas frases meio picadas e sem conectivo."
- Aprendizado: grupo `ritmo-fluidez-corte` (8), mais `conector-causa-colapso`, `fatos-servem-tese-emocional`, "Explicite a cadeia causal completa, elo por elo", "Conecte cada salto de assunto com uma ponte lógica explícita". **Todos inativos.** A única ativa do grupo é a de antecipação (tema 5), que não fala de conectivo.
- **Contradição grave:** de uma lição de 10/10 (China/infra) o destilador gerou "Sinalize a progressão da narrativa com marcadores de peça/etapa ('essa foi a primeira peça', 'é a terceira peça')" e "Nomeie as peças soltas como uma rede única ('isso tem nome, chama rede')". Essas frases estavam no *transcript da IA*. No mesmo dia, o humano (felipe, roteiro a1a83e86) **cortou exatamente** "Essa foi a primeira peça", "É a terceira peça" e "Isso tem nome. Chama rede". O destilador aprende com a saída do modelo, não com a correção humana. Está inativo, mas é o vício que o dono quer eliminar.

### 3. Clareza: siglas, empresas e nomes sem explicação, jargão, referente solto. L=4; U=2; E=10 obs. vocabulario + cerca de 8 reescritas de "quem é quem"
- Citações: "Ninguem sabe o que é CPFL" · "o que amazon tem a ver com a sky?" · "E o café lá dentro continua exatamente o mesmo de quando ela era vazia. > o que isso significa,?" · "tudo precisa ser mais mastigado".
- Prevalência: 68% dos 126 roteiros recentes têm uma sigla de 3 a 6 maiúsculas. Top: BYD 26, CEO 15, STF 9, ITA 6, ICMS/PGR/IATA/SDC/VIX/PIB 4.
- **Metonímia capital-por-país:** 5/126 (4%), por exemplo "Então a usina que mói a cana responde a Pequim", "E quem decide se ele chega mora em Washington", "Pequim foi assinando um por um". **Corroborado:** o humano trocou "um fio que responde a Pequim" por "responde a China" (10/10).
- Aprendizado: **ativo** "Evite siglas e nomes de empresas/instituições pouco conhecidos... explique rapidamente", que chega a `roteirista`, `revisao` e `storytelling`. **Não chega a `hook`** (onde estava a reclamação Sky/Amazon), nem a `premissa` ou `dados`. Não cobre metonímia de capital. Inativos: `jargao-para-linguagem-acessivel`, `teste-hook-pessoa-comum`, `estabelecer-entidades-antes-vinculo`, `nomear-categoria-marca-estrangeira`.

### 4. Precisão factual (datas, superlativos, prazos, escopo). L=7 (analuisa 6, felipe 1); C=4 (Franklin 3, Fernando 2, Túlio, Renato)
- Citações: "o Brasil foi o primeiro país do mundo a receber a mudança — é factualmente incorreta" · "confirmar se de fato foi o cearense que criou a Embrer, senão o hook está falso" · "a pesquisa foi mal feita, o celular pode chegar a 30 mil" · "'Esse prazo vence em novembro de 2026' está errado".
- Aprendizado: cerca de 30 learnings, o maior volume. Só a lição das bets de 28/09 virou 10, sem grupo. **Todos inativos.**

### 5. Tiques de IA e anúncios vazios. L=1 (felipe); E: alguns cortes pontuais
- Citação: "Esse tipo de frase para antecipação não serve para nada além de enrolar".
- Prevalência (126 recentes): **"Só que" em 72%** (0,87 por roteiro), **"Ou seja" em 56%**, "repara/repare" em 16%, "agora olha/pensa/imagina" em 17%.
- O humano corta pouco nos 34 pares: só que 31→26, ou seja 24→24, agora olha/pensa 15→12, presta atenção 5→3. Cortes notáveis: "Agora repare no detalhe final dessa história.", "Agora presta atenção nessa progressão, porque é ela que prova que ali existe um método.", "Ou seja, o Brasil copiou o texto certo." e "Só que" → "Porque". O humano também **insere** muleta própria ("Mas calma que a situação piora", que bate no padrão banido `mas calma,`). O problema parece ser a fórmula repetida, não a palavra em si.
- Aprendizado: **ativo** "Frases de antecipação genéricas... devem ser cortadas" (`roteirista`, `revisao`). `vm_banned_phrases` (32 ativos) **não tem** "só que", "ou seja", "agora repara/olha" nem "presta atenção". **Corroborado** pela prevalência e por cortes pontuais. A reclamação verbal é rara.

### 6. Emoção, rosto humano, profundidade. L=5 (felipe 4, igor 1)
- Citações: "eu preciso sentir que o impacto é relevante, eu preciso ver contrastes e reviravoltas" · "era bacana se citasse pessoas do bolsa familia que apostam" · "Refaça a narrativa usando Jacob Coxon como personagem principal".
- E: inserções de vítima e família (jiu-jitsu: Willian Masuda) e cerca de 9 perguntas retóricas ou falas diretas ao espectador.
- Aprendizado: "Dê rosto humano ao custo social", "Ancore a narrativa em um personagem nomeado", "Aprofunde emocionalmente cada decisão-chave". Inativos.

### 7. Fechamento, CTA e moral. L=1 (igor, "compartilhem após uma frase de impacto"); E: cerca de 19 inserções no fim (5 perguntas de opinião, 5 CTAs, cerca de 9 morais) e 2 cortes de fecho ("eu conto no próximo vídeo", "pergunta quem assinou os contratos")
- Aprendizado: grupo `fechamento-cta-impacto` (8), mais `cta-*` (3). Inativos. **`comando` recebe 0 lições.**

### 8. Excesso de números e estatística. L=0 de reclamação explícita
- Pedidos no sentido contrário: "mostrar números que comprovem isso" (GTA); "Aprofunde o ângulo com dado agregado" (China).
- E: arredondamento, corte de blocos de estatística na abertura (OpenRouter; telas 5,4/7,6/80%), média de 11,5 números por roteiro. O total cai só 3% nos pares.
- **Corroboração parcial:** aparece nas edições, não nas palavras dos usuários. Os aprendizados se contradizem: `estatistica-imagem-concreta` e `metafora-escala-impacto` contra "Use dados técnicos completos para reforçar o paradoxo" e "Use o número máximo verificado". Todos inativos.

### 9. Hook duplicado como 1º parágrafo do corpo. L=1 indireta (igor 10/08: "O primeiro paragrafo do roteiro está melhor como hook do que o próprio hook. Elimine o hook")
- Prevalência: 6/126 (5%), por exemplo o Embraer, que repete "A terceira maior fabricante de aviões do mundo é brasileira." no hook e no corpo.
- Nos pares: 2 tinham duplicação antes e **0 depois** (o humano remove sempre).
- Aprendizado: "Corte a antecâmara antes do gancho real" e `contraste-com-contexto`. Inativos. **Corroborado**, com frequência baixa.

### 10. Tom e registro. L=4 ("a pegada do roteiro vai ser mais despojada", "ajustar o tom pra algo bem mais em linha com o roteiro referencia", urgência, alarmista)
- E: o humano deixa o texto mais oral ("não eram para quem estava liso", "Aí nos anos 2000, rola o movimento dos pitboys", "Mas me fala, na tua opinião").

Fora de escrita, mas volumoso: **ângulo/tese** (L≈9: "em vez de criar narrativa sobre o segredo oculto, traga sobre os beneficios") e **briefing ignorado** (L≈5: "Tem que citar que a empresa só lançou a versão pro", "adicione essas informações").

---

## Checagem das queixas do dono

| Queixa | Veredito | Evidência |
|---|---|---|
| Metonímia capital (Pequim/Washington) | **Corroborada**, baixa frequência | 5/126 roteiros (4%). Humano trocou "responde a Pequim" → "a China". Sem aprendizado específico. |
| Empresa/sigla sem explicação | **Corroborada**, alta | 4 lições, a CPFL virou o aprendizado ativo. 68% dos roteiros têm sigla. Cerca de 8 reescritas "quem é quem". |
| Excesso de números | **Parcial** | Nenhuma queixa verbal. Edições arredondam e cortam blocos. Usuários também pedem mais dado. |
| Lista sem causa→consequência | **Corroborada**, forte | 4 lições e a única nota de feedback. Conectivos +12% nas edições. Cortes de "primeira/terceira peça". Destilador gerou o oposto (10/10). |
| Tiques ("Só que", "Ou seja", "Agora repara") | **Corroborada** por prevalência | 72% e 56% dos roteiros. Cortes pontuais. Só 1 lição verbal. Fora de `vm_banned_phrases`. |
| Hook repetido no 1º parágrafo | **Corroborada**, baixa | 5% dos roteiros. 2/2 removidos pelo humano. |

---

## Saúde do pipeline de aprendizado

- **Conversão:** 42/42 lições (100%) viraram aprendizado: 148 learnings, 3,5 por lição, até 10 de uma lição só.
- **Ativação:** 2/148 learnings (1,4%). Só 2/42 lições (4,8%) têm algo ativo. As duas são globais, `origem=ensino`. `ativada_em` está NULL nas 148, nunca preenchido.
- **Inalcançáveis:** 11 learnings com `destinatarios = []` (lições de 20/08), que não chegam a agente nenhum mesmo se ativadas. 21 sem `grupo`.
- **Teto de 3 por agente: hoje não aperta, o pipeline está subalimentado.**

| Agente | Ativas hoje (de 3 vagas) | Se tudo fosse ativado: learnings / grupos distintos disputando 3 vagas |
|---|---|---|
| roteirista | 2 | 45 / 34 |
| revisao | 2 | 2 / 2 |
| storytelling | 1 | 56 / 26 |
| hook | **0** | 27 / 19 |
| comando | **0** | 10 / 5 |
| premissa | **0** | 50 / 45 |
| modelagem | **0** | 55 / 25 |
| dados (Kasparov) | **0** | 135 / 80 |

  A ordenação é: escopo do cliente primeiro, depois a recorrência do grupo. Com tudo ativo, `estrutura-paradoxo-contraste` (33 learnings) ganharia vaga em storytelling, modelagem e dados para quase todo cliente.
- **Edição humana quase não vira lição:** 168 obs. e 34 diffs, mas só 3 lições `edicao` (a última em 25/08). `vm_edit_observations` parou em 28/09.
- **O destilador lê a saída do modelo:** o caso "peça/rede" (tema 2) mostra que ele promove a aprendizado o recurso que o humano acabou de cortar.
- **Feedback por nota está morto:** 9 linhas, 1 comentário.
