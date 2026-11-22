# Plano 029: modelagem por essência

Escrito em 22/11/2026 sobre a branch plano-027-modelagem (3d52fe1). Só plano, nada implementado.

Pedido do Igor: um segundo caso de uso do Codex, além do piloto da Izabela. A pessoa cola o vídeo original, a ferramenta extrai a essência, e entrega uma modelagem que não é cópia, não desvia, e fica melhor naquilo que o original já faz. Tudo encaixado na arquitetura cliente x linha editorial x tipo de narrativa.

**Fontes dos números.** Só estas, nada inventado:
- `_insumos/dados-22-11.md` ([dados]) e `_insumos/mapa-codigo.md` ([mapa]).
- `_insumos/028-caso-minimo-e-preditor-semanal.md` ([028]).
- `_insumos/relatorio-tecnico.md` ([técnico]) e `_insumos/relatorio-psicologico.md` ([psico]). Pesquisa pronta, não refeita. Boa parte foi lida só pelo resumo, como os próprios relatórios avisam.
- `plans/027-codex-modelagem.md` ([027]), `agents/leitor.md`, `agents/modelador.md`, `lib/modelagem/*.ts`, `scripts/modelar-prova.ts` e as mensagens de commit da branch ([branch 027]).
- `docs/estrategia-2026-10/ESTRATEGIA.md` ([estratégia]) e `DADOS-FLUXOS.md` ([fluxos]), `plans/025-skills-por-modo.md` ([025]), `skills/*.md`, `supabase/migrations/0051_roteiro_modo.sql`.

Toda meta está marcada como **META**. Todo prazo e custo está marcado como **ESTIMATIVA**. Conta feita por mim está marcada como "conta minha".

---

## 1. Resumo

1. **Essência é uma ficha, não um resumo.** Ela guarda o conteúdo que carrega o vídeo (premissa, emoção e motor, mecanismo do hook, blocos com função, exemplos, afirmações) e cada campo vira uma restrição que o código confere.
2. **A 027 já tem a maior parte da ficha.** O leitor (`agents/leitor.md`, `lib/modelagem/leitura-schema.ts`) extrai quase tudo. Faltam quatro campos, a persistência e a tela.
3. **O fluxo é: link, essência na tela, roteiro e hooks.** A essência aparece primeiro e é editável. Proponho que ela não trave a escrita (ver pergunta 3).
4. **A régua tem dois lados.** Contra a cópia: três camadas (lexical, frase a frase, base da casa). Contra o desvio: peças marcadas que têm de aparecer, blocos na mesma ordem, e sequência de funções comparada por distância de edição.
5. **Melhorar é um cardápio fechado.** Quatro tipos de melhoria, no máximo 3 por vídeo, cada uma apontando para um campo da ficha. Hook: evolução com contraste, superlativo e fato contraintuitivo, sem trocar o mecanismo e sem fato novo.
6. **A unidade que aprende é a "prática".** Cada melhoria e cada alavanca de hook é uma prática com nome, registrada por roteiro. É ela que uma linha editorial de um cliente propõe como teste para a mesma linha em outro cliente.
7. **Menor passo útil:** rodar o banco de prova que a 027 deixou pendente em 10 vídeos, nas duas versões do escritor, e rotular os pares à mão. Não mexe em produção, decide o escritor e dá os primeiros limites da régua.
8. **Aviso sobre a branch.** A ponta desta branch não é o modelador de uma chamada. O commit `30dcaa6` trocou para "mapa, reforço e escrita sem o original". O de uma chamada é o `09ed0ad` [branch 027, 028 furo 3]. Este plano usa isso a favor: o piloto da Izabela fica com a versão de uma chamada, e a modelagem por essência fica com a versão do mapa.

---

## 2. Por que complementa o piloto da Izabela (e não duplica)

| | Piloto da Izabela [028] | Modelagem por essência (este plano) |
|---|---|---|
| Pergunta que responde | A equipe usa? Sai rápido? O texto é mantido? | Por que o original funcionou, e a nossa versão preservou isso? |
| Escritor | Uma chamada, com o original na mão (`09ed0ad`) | A partir da ficha, sem a transcrição (`30dcaa6`) |
| O usuário vê | Roteiro e 4 hooks | A essência primeiro, depois roteiro, hooks e a lista de melhorias |
| Cliente | Um, fixo (Izabela, responsável Bianca) | Qualquer cliente, com a chave cliente x linha x tipo |
| O que deixa de dado | Adoção, tempo, texto mantido | A ficha de cada referência e as práticas aplicadas, que alimentam as skills |
| Régua de cópia e desvio | Portão lexical da 027 | As três camadas mais a fidelidade estrutural |

- As peças comuns são as mesmas e não se refazem: transcrição, portões em código, log em `vm_preditor_sombra`, tela de sessão.
- Os dois juntos formam a comparação que o [028] pediu no furo 3: uma chamada contra mapa, com uso real.
- O piloto mede se a ferramenta é usada. Este caso de uso é o que dá "um ponto de partida para analisar por que o vídeo pode ter funcionado" (briefing, item 2). Sem a ficha, não há o que aprender entre clientes.

---

## 3. O que é "essência", de forma operacional

### 3.1 A ficha

Uma ficha por vídeo de referência. Cada campo tem três colunas: o que guarda, como vira restrição para a escrita, e como se confere.

| campo | o que guarda | restrição na escrita | conferência | existe na 027? |
|---|---|---|---|---|
| `premissa` | a tese em 1 ou 2 frases afirmativas | mesma tese, mesmo ângulo | leitura humana na tela; no banco de prova, releitura cega da versão nova | sim |
| `emocao.predominante` e `emocao.motor` | uma emoção só, e o que no vídeo a produz (vilão, o que está em risco, a virada) | o motor tem de aparecer | no banco de prova, releitura cega e comparação | sim |
| `hook` | texto, promessa e mecanismo (vocabulário fechado de `HOOK_MECHANISMS`) | os hooks novos fazem a mesma promessa com o mesmo mecanismo | mecanismo do hook novo rotulado e comparado | sim |
| `tom` | registro, ritmo, a quem fala | mantido | humano | sim |
| `beats[]` | blocos na ordem: `funcao`, `trecho` literal, `ideia` com palavras novas, `sente`, `fica` | mesma ordem, um parágrafo por bloco, tamanho do bloco com folga de 20% | código: blocos presentes e na ordem | sim, mas `funcao` é texto livre |
| `ativos[]` | cada exemplo forte, afirmação de impacto, número, personagem, comparação, com `destino` (manter ou abrasileirar), `checar` e `por_que` | `manter` fica; fato entra com o valor exato | código: nome e número de todo ativo `manter` aparecem na versão nova | sim, a conferência não |
| `palavras_dificeis[]` | termo e troca simples | autoriza a melhoria "simplificar" | código: o termo trocado some ou ganha aposto | sim |
| `nao_transferivel[]` | venda, autoridade pessoal, bordão | fica de fora | código: blocos `fica = false` não entram | sim |
| `reforcos[]` | de 0 a 2 pedidos de pesquisa com função declarada | só entra se deixa o bloco mais forte | humano | sim |
| **`beats[].rotulo`** | a função em vocabulário fechado | é a sequência que mede a fidelidade estrutural (seção 5.2) | código: distância de edição | **falta** |
| **`forcas[]`** | o que o vídeo faz bem, até 3, cada uma ligada a um bloco ou ativo. Ex.: "explica um mecanismo difícil com um exemplo só" | é o alvo das melhorias: melhorar naquilo que o original já faz | humano, e justifica cada melhoria | **falta** |
| **`oportunidades[]`** | onde o original perde, no cardápio fechado da seção 6: bloco, tipo, evidência | só existe melhoria onde há oportunidade registrada | código: toda melhoria aponta para uma oportunidade | **falta** |
| **`modo`** | o tipo de narrativa do original (história, mecanismo, demonstração, panorama) | define a célula da seção 7 | mesmo livro de códigos de `vm_roteiro_modo` | **falta** |
| **`referencia`** | link, rede, views e coeficiente do vídeo relativo ao canal dele, casa ou externa | não restringe a escrita; é dado para medir | código, na hora da modelagem | **falta** (é a etapa 6 do [028]) |

Vocabulário proposto para `rotulo`, pequeno de propósito: `hook`, `contexto`, `tensao`, `prova`, `exemplo`, `virada`, `payoff`, `fecho`. A autópsia antiga já usava "setup, tensão, virada, prova, payoff" (`lib/pipeline/modelagem.ts`). A pesquisa pede exatamente isso: rotular funções e comparar as sequências, porque cosseno de embedding não mede "mesma estrutura" [técnico 10, StoryAnalogy].

O que a ficha deixa de fora, de propósito:
- **Arco de valência e ativação por bloco** e **lacuna de curiosidade com ponto de fechamento** [psico 6.1]. São bons candidatos, mas são campos para o preditor (ficha de mecanismos, 3.6 do [028]). O campo `sente` já cobre o uso na escrita. Entram quando provarem valor na validação temporal.
- **Comentários do original como sinal do acerto** [psico 1.6, Rocklage 2021]. Ninguém coleta hoje.

### 3.2 Por que a ficha guarda conteúdo

- A autópsia antiga proibia conteúdo no esqueleto, e o roteiro virava outro vídeo: Succession saiu, entraram Entrupy e Journal of Marketing [027, 3.1].
- A pesquisa separa as duas coisas: transfere-se a estrutura de relações, e o que rende diferenciar é o conteúdo de superfície [psico 4.1 e 4.2, Gentner 1983, Berger e Packard 2018]. Mas a modelagem da casa mantém o tema. Então o conteúdo forte fica marcado como ativo, e o que muda é a redação. A pergunta 4 trata do caso em que o tema também muda.
- Explicação de LLM pode ser racionalização [técnico 3, Kayal et al.]. Por isso a ficha é mostrada ao usuário, editável, e nenhum campo dela vira regra de skill sem teste (seção 7.5).

### 3.3 O que da 027 já serve

| peça | onde | estado |
|---|---|---|
| Leitor | `agents/leitor.md`, `lib/modelagem/leitura.ts`, schema estrito em `leitura-schema.ts` | serve como está para a ficha v1. Tem nova tentativa com teto dobrado e checagem de cobertura (beats cobrem 70% ou mais da transcrição) |
| Mapa para o escritor | `montarMapa` em `lib/modelagem/modelar.ts` | serve. Leva `ideia`, `sente` e peças, nunca o `trecho` literal |
| Modelador | `agents/modelador.md` | serve. Já herda premissa, ordem, emoção e peças, e já entrega 4 hooks e a seção MUDANCAS |
| Portões | `lib/modelagem/portoes.ts`, com teste | serve. Tamanho ±20%, até 2 números a mais, frase média até 15% mais longa, nenhuma sequência de 6 palavras igual |
| Banco de prova | `scripts/modelar-prova.ts` | serve. Aceita sessão, link ou arquivo e não grava em banco |
| Transcrição | `lib/transcribe.ts` com o job do Supadata e reel longo | serve. Grava `raw_content` no anexo |

### 3.4 O que falta

1. **Os quatro campos novos** da ficha (`rotulo`, `forcas`, `oportunidades`, `modo`) e o bloco `referencia`.
2. **Nada está ligado ao app.** Não existe `app/modelagem` nem chamada de `modelar()` fora do script. A Task 5 do [027] não foi feita.
3. **A ficha não é guardada.** O [027] previa cache em `vm_modelagem_analyses` com `analysis.versao = 2`. Não está no código.
4. **Os portões só rodam no script.** Falta a reescrita automática quando o portão reprova [027, pendências].
5. **MUDANCAS é texto livre.** Para contar "no máximo 3" e para aprender, precisa de formato fechado (seção 6).
6. **Conferências de desvio em código** (ativos `manter` presentes, fato novo no hook).
7. **Camadas 2 e 3 da cópia** e a fidelidade estrutural (seção 5).
8. **As alavancas de hook do pedido.** Hoje são nome próprio, contraste, crença e urgência. O pedido é contraste, superlativo e fato contraintuitivo (seção 6.3).
9. **O custo por chamada.** O script de prova não registrava na primeira versão [027]. A versão do mapa saiu por US$ 1,48 e 4 minutos na prova de 5 vídeos [branch 027].

---

## 4. Fluxo do usuário, de ponta a ponta

| passo | o que o usuário faz e vê | o que roda | tempo alvo (**META**) |
|---|---|---|---|
| 1. Cola o link | Campo de link, cliente, linha editorial (lista curta do cliente) e direção opcional | Transcrição. Busca da métrica da referência | até 20 s |
| 2. Vê a essência | Um cartão: premissa, emoção e motor, mecanismo do hook, blocos com rótulo, peças marcadas, o que o vídeo faz bem, e até 3 melhorias propostas | 1 chamada do leitor. Ficha gravada | até 60 s desde o link |
| 3. Confirma ou ajusta | Não precisa fazer nada: a escrita já começou. Se editar um campo (premissa, destino de um ativo, desligar uma melhoria), só a escrita roda de novo | Nada novo. A ficha editada fica registrada ao lado da original | 0 s no caminho padrão |
| 4. Recebe o roteiro | Roteiro por bloco, com o original ao lado. Lista de melhorias aplicadas, cada uma com o motivo. Avisos da régua, se houver | 1 chamada do escritor. Portões em código. Uma reescrita se reprovar | até 3 min desde o link |
| 5. Recebe os hooks | 4 hooks: 1 fiel e 3 com alavanca. Ordem pelo preditor, com o rótulo "sugestão em teste" [028, furo 4] | Preditor v0. Log das candidatas | junto com o passo 4 |
| 6. Depois | Verificação factual dos ativos `checar`, correções em lote do [027, 5.1] | `verificarScriptSalvo`, que já existe | depois da entrega |

Sobre os tempos:
- O [027] mirava menos de 3 minutos. O [028] mira mediana de 2 minutos no piloto, com a versão de uma chamada (58 s e 99 s na prova).
- A versão do mapa mediu 4 minutos, com uma busca no Grok de cerca de 60 s e US$ 0,50 (comentário em `lib/modelagem/modelar.ts`). Sem a busca no caminho padrão, fica perto de 3 minutos. **ESTIMATIVA**, não medido.
- Proposta: **reforço por pesquisa sai do caminho padrão** e vira botão ("buscar um dado para este bloco"). O [027] já decidiu que pesquisa não é passo obrigatório.
- Ninguém mediu o tempo do leitor sozinho. Os 60 s do passo 2 são META sem base medida.

Sobre a confirmação:
- O [027] tirou a pausa de premissa porque 9 sessões morreram nela e ela custa metade do tempo.
- O briefing pede "confirma ou ajusta". As duas coisas cabem se a confirmação não travar: a essência aparece, a escrita segue, e editar regera só a escrita (a ficha já está guardada).
- Se o Igor preferir travar, o custo é conhecido: mais sessões abandonadas (pergunta 3).

Aviso por cliente, antes do passo 1:
- A modelagem ajuda muito em uns e atrapalha em outros. Izabela OR 2,06, Rafael Rodrigues 1,98, Thiago Bisewski 1,95. Contra: Túlio 0,22, Renato Mendes 0,37, Lincoln Fracari 0,62 [fluxos].
- A [estratégia] já previa isso no item 6 (modelagem por cliente). A tela mostra o histórico do cliente com modelagem, sem bloquear.

---

## 5. Régua de "nem cópia nem desvio"

Princípio: aceitar quando a fidelidade estrutural é alta E as três camadas de cópia são baixas [técnico, arquitetura D].

### 5.1 Anti-cópia em três camadas

| camada | o que mede | como | limite inicial | estado |
|---|---|---|---|---|
| 1. Lexical | sequência de 6 palavras igual ao original | `copiasLiterais` em `lib/modelagem/portoes.ts` | zero trechos. Reprovou: uma reescrita com o motivo. Reprovou de novo: entrega com aviso [027] | existe, bloqueia |
| 1b. Lexical, fração | parte dos 5-gramas da versão nova que estão no original | a régua de `lib/script-matches.ts` | só registra. Sem limite ainda | novo, só registro |
| 2. Semântica frase a frase | cada frase nova contra cada frase do original | OpenAI `text-embedding-3-small`, que o Codex já usa | nenhuma frase com cosseno acima de 0,90 [psico 6.3] | novo, **só registro** |
| 3. Recuperação na base da casa | o roteiro novo contra `documents` | `match_documents`, que o Codex já chama | 0,72 no mesmo cliente e 0,69 em outro cliente [028, 3.8, do relatório v0] | novo, **só registro** |

Três cuidados que mudam a leitura dessas camadas:

1. **Similaridade do texto inteiro não é sinal de cópia aqui.** A modelagem mantém premissa, ordem e fatos de propósito. O cosseno do roteiro inteiro contra o original vai ser alto por desenho. O exemplo de 0,80 para o texto inteiro [psico 6.3] não se aplica. Só a frase conta.
2. **Frase que carrega fato vai parecer cópia.** Um ativo `manter` com número exato tem pouca margem de redação. A camada 2 trata essas frases em separado: registra, mas com tolerância própria a calibrar.
3. **O 0,90 não é número validado.** É ponto de partida da pesquisa. O embedding da OpenAI espalha mais os cossenos que outros [028, 3.8]. Os 0,72 e 0,69 foram calibrados na casa para roteiro inteiro, com outro fim (achar o mesmo tema). Aqui servem para o caso "a casa já fez este vídeo".

Por que as três: paráfrase engana detector lexical, e a defesa que funciona é recuperar parecidos numa base e comparar com limiar [técnico 9, Krishna et al.]. A prova da 027 mostra o problema dos dois lados: com o original na mão, saíram 3 trechos de 6 palavras num vídeo [027]. Sem o original, a sobreposição literal não caiu [branch 027]. A camada 1 sozinha não resolve.

### 5.2 Fidelidade estrutural (anti-desvio)

Em produção, só o que o código confere sem custo:

| conferência | como | limite inicial |
|---|---|---|
| Blocos | todo bloco `fica = true` tem um parágrafo, na ordem | 100% |
| Peças | nome próprio e número de cada ativo `manter` aparecem na versão nova | 100%. Faltou: reescrita com a lista do que sumiu |
| Tamanho | total ±20% (existe). Por bloco, folga de 20% (hoje só está no prompt) | registra por bloco, bloqueia só no total |
| Peso | até 2 números a mais, frase média até 15% mais longa (existe) | como está |
| Conteúdo novo | número ou nome próprio que não está na ficha nem em reforço confirmado | registra. É o sinal de "inventou" |
| Melhorias | no máximo 3, cada uma ligada a uma oportunidade da ficha | mais de 3: reescrita |

No banco de prova e na calibração, a medida da pesquisa:

- A versão nova é relida às cegas pelo mesmo leitor. Sai a sequência de rótulos dela.
- **Distância de edição entre as duas sequências de rótulos**, dividida pelo tamanho da maior.
- Limite inicial: até 0,2. Num vídeo de 6 blocos, isso tolera 1 troca. **ESTIMATIVA** minha, sem validação. É o que a calibração vai corrigir.
- Na mesma releitura: a premissa bate? A emoção predominante é a mesma? O mecanismo do hook é o mesmo?
- Não usar cosseno de embedding para estrutura: embeddings e LLMs acertam cerca de 30% em analogia entre histórias, contra mais de 85% dos humanos [técnico 10].

Em produção essa releitura não roda no começo. Custa uma chamada a mais por roteiro. Entra só se a calibração mostrar que as conferências em código deixam passar desvio.

### 5.3 Calibração com pares rotulados à mão

- **Quantos:** 30 a 40 pares. A pesquisa diz que dezenas bastam para um ponto de corte inicial [técnico, arquitetura D].
- **Classes:** (a) cópia, (b) paráfrase colada, (c) mesma estrutura com redação própria, que é o alvo, (d) desviou, virou outro vídeo.
- **De onde vêm os pares, sem gerar nada novo além do banco de prova:**
  - as saídas do banco de prova da etapa 1, nas duas versões do escritor;
  - os roteiros que a produção antiga entregou para os mesmos originais. São exemplos reais da classe (d): o do quiet luxury foi de 302 para 530 palavras e de 3 para 15 números [027];
  - roteiros modelados do CRM em que a referência é conhecida. São poucos: o CRM cita a mesma URL em 3 de 9 casos [fluxos].
- **Quem rotula:** Igor e mais uma pessoa do time, em separado. Onde discordarem, o par sai da calibração e vira exemplo de zona cinzenta. Cerca de 1 a 2 horas no total, **ESTIMATIVA** ([028] estimou 1 hora).
- **Como sai o limite:** para cada medida, o ponto que melhor separa (c) de (a) e (b), e (c) de (d). Publicar a tabela de acertos e erros de cada ponto de corte, não só o escolhido.
- **Regra:** antes de calibrar, as camadas 1b, 2 e 3 e a distância de edição só gravam o valor no trace. Não bloqueiam nada [028, 3.8].
- **Recalibrar** quando o texto mantido pelo time (sobreposição Codex para CRM) mostrar o que o time de fato corrige. Não há limite validado de "parece cópia para o público" [psico 7].

---

## 6. "Melhorar no que o original já faz"

### 6.1 O cardápio fechado

Quatro tipos. Nada fora disso é melhoria permitida.

| tipo | o que é | só vale quando a ficha tem | exemplo |
|---|---|---|---|
| `simplificar` | palavra difícil vira palavra simples; termo desconhecido ganha aposto de até seis palavras | item em `palavras_dificeis` | "André Lara Resende, um dos criadores do Plano Real" [`agents/modelador.md`] |
| `didatica` | o bloco diz a mesma coisa em passos mais fáceis de seguir: uma ideia por frase, causa antes do efeito | oportunidade `didatica` num bloco de `contexto` ou `prova` | o mecanismo explicado em dois passos, cada um com a sua consequência |
| `contraste` | bloco que só afirma ganha dois lados que se entendem sem esforço | oportunidade `contraste` num bloco morno | "se o contraste precisa de explicação, ele não é simples" [`agents/modelador.md`] |
| `exemplo` | exemplo distante dá lugar a um daqui, da mesma função e tão forte quanto | ativo com `destino = abrasileirar` | a "feira popular" virou a 25 de Março; Succession ficou [027] |

Regras:
1. **No máximo 3 por vídeo.** O original já funcionou. Mexer em tudo é o caminho para virar outro vídeo [027, 0.5].
2. **Cada melhoria aponta para a ficha:** o bloco, o tipo, e a oportunidade ou o ativo que a justifica. Sem isso, não entra.
3. **Prioridade: o que o vídeo já faz bem.** Se `forcas` diz que a força é ser didático, a primeira melhoria é `didatica` ou `simplificar`. Se a força é o contraste, a primeira é `contraste`. Melhoria que puxa o vídeo para outra força (ex.: encher de dado um vídeo de emoção) fica de fora. Foi o defeito da produção antiga: o original era alarme e indignação, o gerado virou aula [027, 3.5].
4. **Zero melhorias é resposta boa.** O mesmo vale para reforço [`agents/leitor.md`].
5. **Exemplo novo é fato novo.** Só entra se for de conhecimento comum e passar pela verificação pós-entrega, ou se vier de pesquisa confirmada. Exemplo estrangeiro forte fica [027].
6. **O escritor devolve as melhorias em formato fechado:** `{ bloco, tipo, justificativa, campo_da_ficha }`. O código conta e registra. Isso substitui o MUDANCAS livre.

Duas coisas que o modelador faz hoje e que precisam de decisão (pergunta 7):
- **Fechamento com consequência para o espectador.** Hoje é permitido e fora de qualquer contagem.
- **Reforço por pesquisa.** Proposta: quando usado, conta como uma das 3.

Base na pesquisa, curta: o que se repassa é a versão que provoca mais emoção, com a mesma informação [psico 1.5, Heath et al.]. Conteúdo informativo reduz compartilhamento [psico 1.3, Tellis et al.]. As duas apontam para o mesmo lado da regra 3: reforçar o motor, não informar mais.

### 6.2 Hook, versão de partida

A que a 027 já entrega: 4 hooks, 1 fiel e 3 por alavanca, até 30 palavras, nada que o corpo não sustente. Nome citado no hook original nunca se perde. Quem escolhe é o usuário.

### 6.3 Hook, ponto de evolução (acréscimo do Igor)

Três melhorias pontuais, uma por hook, sobre o hook fiel:

| alavanca | o que faz | de onde vem o material | trava |
|---|---|---|---|
| **Contraste** | põe na abertura dois lados que o original deixa implícitos | dois ativos ou dois blocos da ficha | os dois lados existem no vídeo |
| **Superlativo** | dá tamanho: "o maior", "o único", "a primeira vez em vinte anos" | um ativo com `checar = true`, ou reforço `comparar` ou `marcar_raridade` confirmado | superlativo é fato verificável. Sem fonte na ficha, o hook não é gerado |
| **Fato contraintuitivo** | sobe para a abertura o fato do corpo que contraria o que o espectador espera | um ativo do tipo `afirmacao` ou `numero` que está no corpo | o fato é do vídeo, com o valor exato |

Regras:
1. **O mecanismo do hook original é preservado em todos.** A alavanca entra como amplificador sobre o mecanismo, nunca no lugar dele. O hook novo é rotulado com o mesmo vocabulário (`HOOK_MECHANISMS`, que já tem "Contraste Extremo", "Superlativo" e "Desafio de Crença") e o rótulo tem de bater com o da ficha.
2. **A promessa é a mesma.** Não suaviza e não aumenta.
3. **Nunca inventa fato.** Conferência em código: todo número e nome próprio do hook está na ficha ou em reforço confirmado.
4. **Sem material, sem hook.** Se o vídeo não tem um fato contraintuitivo no corpo, saem 3 hooks em vez de 4. Preencher a cota é o que leva a inventar.
5. **Cada hook grava a alavanca**, a posição em que apareceu e se foi o escolhido, em `vm_preditor_sombra`. É o dado que diz, por cliente e linha, qual alavanca o time escolhe e qual rende.

Por que é evolução e não versão de partida:
- **O hook é a maior alavanca do preditor:** de 57,5% para 60,9% com as marcas de hook [028, do relatório v0]. E o time mantém o hook da modelagem: 8 de 10 mantidos no modelar_video [fluxos].
- **Mas a direção do efeito não é garantida.** Superlativos e expressões definidas criam a lacuna [psico 3, Scott 2021], e os gatilhos de título nem sempre vão na direção prevista [psico 3, Banerjee e Urminsky 2025]. Otimizar só "o que funciona" cai em clickbait [técnico 5, Wang, Sudhir e Zhou].
- **Então cada alavanca é uma prática em teste** (seção 7), não uma regra. Entra depois que o log de candidatas existir.

---

## 7. Encaixe na arquitetura: cliente x linha editorial x tipo de narrativa

### 7.1 A chave

| dimensão | o que é | onde já existe | o que falta |
|---|---|---|---|
| **Cliente** | a conta | `vm_sessions.client_id`. Perfil em `vm_client_preferences.perfil` (migração 0053), lido por todo agente que recebe as preferências. Mix de modos por `mixDoCliente` | cliente obrigatório na modelagem. 82 dos 307 roteiros estão sem cliente [dados] |
| **Tipo de narrativa** | o modo do roteiro | `vm_roteiro_modo`: `modo` (história, mecanismo, demonstração, panorama, conselho, publi, misto), `ancora`, `registro`, 2.832 roteiros. Skills em `skills/*.md`, uma seção por agente [025] | roteiro novo não é classificado (Task 11 do [025] pendente). Na modelagem, o modo vem da ficha do original |
| **Linha editorial** | o território de assunto do cliente. Ex.: tecnologia e IA | **não existe no Codex.** O mais próximo: os "territórios do ciclo" que vêm do Cockpit (`lib/pipeline/estrategia.ts`), `tema` em `vm_video_classifications` e as features de território do preditor | uma lista curta e comum à casa, para a mesma linha ser comparável entre clientes (pergunta 1) |

A **célula** é cliente x linha x modo. Cada roteiro modelado grava a célula no `pipeline_trace`.

### 7.2 Três camadas de skill, e uma unidade que aprende

| camada | arquivo ou dado | vale para | quem muda |
|---|---|---|---|
| Skill de modo | `skills/<modo>.md` [025] | um tipo de narrativa, em qualquer cliente | texto só com aprovação do Igor. Números da casa entram sozinhos |
| Perfil do cliente | `vm_client_preferences.perfil` | um cliente, em qualquer modo | o time edita. Hoje é gerado por `scripts/gerar-perfis.ts` |
| Skill de modelagem | `agents/leitor.md` e `agents/modelador.md` | toda modelagem | só com banco de prova |
| **Caderno da célula** (novo) | números por cliente x linha x modo | uma célula | **só números, gerados pelo ETL.** Nenhum texto livre |

A unidade que aprende é a **prática**: uma decisão de escrita com nome, binária e registrada por roteiro. O catálogo inicial sai deste plano, sem inventar nada:
- os 4 tipos de melhoria da seção 6.1;
- as alavancas de hook da 6.3 (e as 4 da versão de partida);
- o destino dos ativos (manter ou abrasileirar);
- com ou sem reforço por pesquisa;
- o mecanismo do hook e o rótulo de cada bloco, que vêm da ficha.

O caderno da célula responde três perguntas com números: quais práticas esta célula usa, qual a taxa de topo com e sem cada uma, e com quantos vídeos. A regra de n é a do plano 020: menos de 10 suprime, de 10 a 29 marca baixa confiança, nenhuma afirmação com menos de 40 roteiros no total ou menos de 20 por cliente [mapa 5.2].

### 7.3 Como as skills se retroalimentam

```
ficha + práticas aplicadas (no roteiro)
   -> roteiro casado com o CRM e com o vídeo (já existe: casarComCrm, vm_script_matches)
   -> resultado maduro: topo no estrato cliente x rede x trimestre (vm_preditor_rotulos)
   -> caderno da célula atualizado no ETL semanal (só números)
   -> o caderno entra na próxima modelagem daquela célula como contexto:
      "nesta célula, hook com superlativo: 9 de 22 no topo; sem: 5 de 24"
   -> prática que se sustenta vira candidata a regra (7.5)
```

Aviso de tamanho, que muda o desenho: **o Codex sozinho não enche célula nenhuma.** São 5 sessões em novembro e 47 roteiros com vídeo confirmado no total [dados]. O dado que ensina é o corpus da casa [estratégia]: 254 a 311 vídeos VM por semana [dados]. Então:

1. **As práticas são rotuladas também nos roteiros da casa**, com a mesma ficha, numa amostra. É a "ficha de mecanismos" do [028, 3.6], com o teto de cerca de 2 mil textos do plano 020 e custo de cerca de US$ 120 (**ESTIMATIVA** do [028]).
2. **O caderno sobe de nível quando a célula é rasa:** célula, depois cliente x linha, depois linha na casa, depois casa. Sempre dizendo de que nível veio o número.
3. **Os roteiros do Codex confirmam devagar.** É a mesma conclusão da [estratégia].

### 7.4 Como uma linha editorial propõe teste a outra (desafiante x campeão)

**De onde nasce a proposta.** Na linha L do cliente A, a prática P tem taxa de topo acima do resto dos roteiros de A na mesma linha, com n suficiente. O cliente B tem a mesma linha L e quase não usa P. O ETL semanal gera a proposta: "testar P na linha L do cliente B".

**Quem ordena as propostas.** O preditor do [028] é o prior: entre as propostas, sobe a que tem maior ganho previsto para B. O preditor nunca decide o resultado. A parte dele que compara textos da mesma sessão está em 57,6%, abaixo do portão de 58% [028, 1.2]. LLM e preditor servem de prior somado a teste, não de juiz [técnico 6, LOLA].

**Quem aprova.** Uma pessoa, na rotina semanal de 15 minutos que a [estratégia] já previu. Aprovada, a proposta vira um teste do ciclo do cliente B. O Cockpit já tem esse lugar: a sala já lê "EM TESTE AGORA" com o critério de cada teste (`lib/pipeline/estrategia.ts`).

**Como roda.**
- Campeão: a modelagem como o cliente B faz hoje. Desafiante: a mesma, com a prática P ligada.
- **O braço é sorteado por sessão**, na criação, e gravado. Não é escolha do usuário. Sem sorteio, o time escolhe, e o resultado mede o gosto do time.
- **Um teste por vez por cliente x linha.** Mais que isso divide um n que já é pequeno.
- Alocação: proponho 50 e 50 enquanto houver um teste só. A [estratégia] fala em cerca de 20% por Thompson sampling. Com um braço e pouco volume, metade e metade chega ao n mais cedo e não precisa de bandit (pergunta 8).

**Quem julga.** O resultado real: topo no estrato cliente x rede x trimestre, comparando os dois braços dentro do cliente B. Decisão por janela longa, o trimestre, como a casa já decidiu [estratégia]. Nunca por um viral.

**Quanto tempo leva, no melhor caso.** A Izabela tem cerca de 6 roteiros modelados por semana (**ESTIMATIVA** do [028]). Em 13 semanas são cerca de 78, uns 39 por braço (conta minha). Isso encosta no mínimo de 40 do plano 020 só se toda modelagem dela passar pelo Codex. Nos outros clientes leva mais de um trimestre. É lento de propósito.

**O que sai do teste.**
- P ganhou em B: entra no caderno da célula de B, como número. P passa a ser o padrão naquela célula.
- P perdeu ou empatou: fica registrado, inclusive o que falhou, para não escolher depois só o que deu certo [028, 3.5].
- Intervalo cruzando o zero é "sem evidência", não "funcionou um pouco" [mapa 5.7].

### 7.5 O que vira regra só depois de validado fora do lote

Três níveis, cada um com a sua prova:

| nível | o que é | prova exigida | quem aprova |
|---|---|---|---|
| Número no caderno | "nesta célula, P tem x de y no topo" | n mínimo do plano 020 | ninguém. Número entra sozinho |
| Padrão da célula | P ligada por padrão naquela célula | ganhou o teste da 7.4 no próprio cliente, na janela longa | quem cuida do cliente |
| **Regra de linha ou de skill** | texto no `skills/<modo>.md`, no perfil ou no `modelador.md` | sustentou-se **fora do lote onde nasceu**: em pelo menos outro cliente da mesma linha E em janela de tempo posterior | **Igor.** E banco de prova antes de subir |

- "Fora do lote" tem dois sentidos, e os dois valem: outro cliente e outro período. É o método de hipótese gerada num lote pequeno e validada em dados separados [técnico 5, Wang, Sudhir e Zhou].
- As travas da casa continuam: prosa só com confirmação, nenhuma ativação automática, nenhuma mudança de prompt sem banco de prova [mapa 5.7].
- O que vale para um cliente só fica no perfil dele. Clientes diferentes têm narrativas diferentes que já deram certo (briefing, item 1), e seguir a estrutura "normal" não se relacionou com popularidade [psico 2.2, Boyd et al.].

---

## 8. Como medir

### 8.1 Critério de sucesso do caso de uso

Ligado às mesmas réguas do [028]. Contagem a partir do dia em que entrar em produção.

**Em 4 semanas (processo, é o que decide):**

| medida | **META** | como mede |
|---|---|---|
| Sessão que gera roteiro | 90% ou mais (hoje 58% no modelar_video [fluxos]) | roteiro salvo por sessão |
| Tempo | essência em até 60 s; roteiro em até 3 min, mediana | timestamps por etapa |
| Essência aceita sem edição | 70% ou mais das sessões | ficha editada x ficha original |
| Cópia | nenhum roteiro entregue com trecho de 6 palavras igual | portão 1 |
| Desvio | 100% dos ativos `manter` presentes; no máximo 3 melhorias | conferências em código |
| Texto mantido pelo time | mediana de 0,70 ou mais (referência: 0,85 com n = 10 [fluxos], 0,77 com n = 25 [027]) | sobreposição de 5-gramas Codex x CRM |
| Roteiro que chega ao CRM | 60% ou mais (hoje 45% [028]) | `crm_script_id` casado |

**Antes de produção (banco de prova):**
- Leitura cega do Igor: a versão por essência ganha da produção antiga em pelo menos 7 de 10, e nenhuma reprova no portão de cópia. É o critério da Task 7 do [027].

**Por trimestre (performance, portão lento):**
- Taxa de topo dos roteiros por essência não fica abaixo da taxa dos modelados do mesmo cliente fora do Codex, no mesmo período. Mesma régua do [028].
- Com 4 semanas não se conclui nada de performance: cerca de 25 vídeos dão um intervalo de 17% a 52% [028, 2.4].

### 8.2 O que se loga

Sem tabela nova no começo. Tudo cabe em `vm_generated_scripts.pipeline_trace.modelagem` (jsonb), em `vm_modelagem_analyses` (a ficha) e em `vm_preditor_sombra` (os hooks).

| o que | campos |
|---|---|
| Célula | cliente, linha editorial, modo do original |
| Referência | link, rede, casa ou externa, views e coeficiente relativo ao canal dela, quando houver |
| Ficha | versão do schema, ficha do leitor, ficha depois da edição do usuário, campos editados |
| Escritor | qual versão (uma chamada ou mapa), modelo, tempo por etapa, custo |
| Práticas | lista de melhorias `{ bloco, tipo, campo_da_ficha }`, reforço usado ou não, destino de cada ativo |
| Hooks | texto, alavanca, mecanismo rotulado, nota do preditor, posição exibida, escolhido (em `vm_preditor_sombra`, que já tem `fase`, `indice`, `texto`, `nota`, `escolhida`, `features`, `versao`) |
| Régua | trechos da camada 1, fração de 5-gramas, maior cosseno de frase e número de frases acima do limite, maior similaridade em `match_documents`, ativos faltando, números e nomes novos, reescritas feitas |
| Teste | id do teste, braço sorteado |
| Destino | casado com o CRM, sobreposição, descartado, publicado (já existe) |

### 8.3 Como separar o efeito da modelagem do efeito do cliente

1. **O alvo já é relativo à conta.** Coeficiente dividido pela mediana do canal, e topo dentro de cliente x rede x trimestre [028, 1.1]. A conta pesa mais que o conteúdo [técnico 1], e a taxa recente do cliente sozinha dá 48,4% par a par [028].
2. **Comparar sempre dentro do cliente.** Três grupos no mesmo cliente, rede e período: modelado por essência no Codex, modelado fora do Codex, original. Efeito agregado por OR estratificado por cliente x rede (Mantel-Haenszel), como o [fluxos] já faz.
3. **Nunca somar clientes sem estratificar.** O efeito da modelagem vai de OR 2,06 a 0,22 conforme o cliente, e caiu de 1,35 para 0,83 entre junho a agosto e setembro a outubro [fluxos]. Resultado sempre por cliente, depois o agregado.
4. **Controlar a referência.** Guardar a métrica do original. Referência da casa rende 34% de topo contra 26% da externa [fluxos], e hoje não se sabe se o modelado performou perto da referência em 46 de 54 casos [fluxos]. Sem isso, um bom resultado pode ser só uma boa referência.
5. **Sorteio para as práticas.** É a única comparação limpa (seção 7.4): mesmo cliente, mesma linha, mesmo período, braço sorteado.
6. **Tratar a seleção.** Só vira vídeo o que o time escolhe, e o time mexe mais no roteiro mais fraco [fluxos]. Analisar por braço sorteado, contando também o que foi descartado. E reportar à parte: taxa de chegada ao CRM por braço.
7. **Separar o efeito do usuário.** Registrar quem abriu a sessão. O modelar_texto ensinou isso: o sinal ruim estava confundido com um usuário e com clientes fracos [estratégia].

---

## 9. Etapas

Esforço em dias de trabalho, tudo **ESTIMATIVA**. "Aprova" é o que precisa do OK do Igor na hora.

### Menor passo útil

| # | etapa | o que entrega | esforço | aprova |
|---|---|---|---|---|
| 1 | **Banco de prova da essência** | 10 originais reais, cada um nas duas versões do escritor (uma chamada `09ed0ad` e mapa `30dcaa6`), sem reforço por pesquisa. O script grava também as medidas das camadas 1b, 2 e 3. Leitura cega do Igor. Rotulagem dos pares (seção 5.3) | 1 dia de código. 1 a 2 horas de leitura do Igor e de mais uma pessoa | **custo de API**: cerca de US$ 20 a 30 (**ESTIMATIVA**, a partir de US$ 1,48 por roteiro na versão do mapa com busca [branch 027]; o custo da versão de uma chamada não foi medido). Escolha dos 10 vídeos |

Por que este é o primeiro:
- O [027] já decidiu que o banco de prova vem primeiro, e a leitura de 8 a 10 provas ficou pendente.
- Não toca produção, banco, nem prompt.
- Uma rodada só responde três coisas: qual escritor a modelagem por essência usa, se a ficha atual do leitor já serve para a tela, e os primeiros limites da régua.
- As mesmas saídas viram os pares rotulados. Não há segunda rodada paga para calibrar.

### Caso de uso no ar

| # | etapa | o que entrega | esforço | aprova |
|---|---|---|---|---|
| 0 | **Decisões e branches** | Respostas da seção 12. Destino das branches locais (etapa 0 do [028]) | 0,5 dia | decisão do Igor; push de branch |
| 2 | **Ficha v2 e conferências em código** | Campos `rotulo`, `forcas`, `oportunidades`, `modo` no schema e no `leitor.md`. Melhorias em formato fechado no `modelador.md`. Conferências novas em `portoes.ts` com teste: ativos `manter`, máximo de 3 melhorias, conteúdo novo. Reescrita automática quando reprova | 2 a 3 dias | mudança de prompt (pede banco de prova, cerca de US$ 10 a 15, **ESTIMATIVA**) |
| 3 | **Fluxo na tela** | Rota de modelagem: link, cartão da essência, roteiro por bloco com o original ao lado, lista de melhorias, 4 hooks. Ficha guardada em `vm_modelagem_analyses`. Log da 8.2. Cliente obrigatório | 3 a 4 dias. Se a rota do piloto do [028] já existir, 1,5 a 2 | merge, deploy. Migração só se `vm_attachments.modo` tiver CHECK (não verificado) |
| 4 | **Régua completa em sombra** | Camadas 2 e 3 e fração de 5-gramas gravadas em toda modelagem. Limites saídos da etapa 1. Bloqueio ligado só depois de conferir os limites em uso real | 2 a 3 dias (é a etapa 10 do [028]) | merge, deploy; ligar o bloqueio |

### Evolução

| # | etapa | o que entrega | esforço | aprova |
|---|---|---|---|---|
| 5 | **Hook: contraste, superlativo, fato contraintuitivo** | As três alavancas no `modelador.md`, a conferência de fato no hook, o log por alavanca | 1 a 2 dias | mudança de prompt, banco de prova |
| 6 | **A chave e a referência** | Linha editorial na sessão. Modo vindo da ficha. Métrica da referência guardada (etapa 6 do [028]) | 2 a 3 dias | lista de linhas; migração se a linha virar coluna; merge, deploy |
| 7 | **Práticas no corpus da casa e caderno da célula** | Ficha numa amostra dos roteiros da casa. Caderno calculado no ETL, só números. Leitura no contexto da modelagem | 3 a 4 dias + cerca de US$ 120 (etapa 8 do [028]) | custo; onde mora a agregação (pergunta 9); o caderno entrar no prompt |
| 8 | **Teste entre clientes** | Gerador de propostas no ETL, sorteio por sessão, lista de propostas para aprovar, leitura por trimestre | 3 a 4 dias | cada proposta; a regra de alocação |

Ordem: 1, 0, 2, 3, 4. Depois 6 (o dado da referência não se recupera depois), 5, 7, 8.

Total até o caso de uso no ar (etapas 0 a 4): 8,5 a 11,5 dias, **ESTIMATIVA**. Evolução: 9 a 13 dias. A etapa 8 só rende depois de pelo menos um trimestre de log.

Dependências do [028]: a etapa 3 daqui divide a rota com a etapa 1 de lá. As etapas 4, 6 e 7 daqui são as etapas 10, 6 e 8 de lá, detalhadas. Não são trabalho em dobro.

---

## 10. Riscos

1. **Adoção.** É o risco maior de qualquer coisa no Codex hoje: 5 sessões em novembro, última em 11/11 [dados]. Este caso de uso tem um passo a mais na tela que o piloto. Se a essência atrasar a entrega ou parecer burocracia, perde para o piloto. Mitigação: a essência não trava, e a etapa 1 mede o tempo antes de construir a tela.
2. **A ficha pode ser uma racionalização bonita.** O LLM explica o acerto de um jeito convincente e errado [técnico 3]. Seguir estrutura não garantiu popularidade [psico 2.2]. Mitigação: o usuário vê e edita; a taxa de edição é medida; nenhum campo vira regra sem a seção 7.5.
3. **O escritor por mapa pode não valer o custo.** Na prova: fatos pararam de mudar, mas 4 minutos, US$ 1,48, e a sobreposição literal não caiu [branch 027]. Se a etapa 1 mostrar que a versão de uma chamada entrega o mesmo, a essência vira só a tela e o log, e o escritor é o do piloto.
4. **Cópia com o original fora da vista.** A `ideia` de cada bloco é escrita pelo leitor olhando o original, e pode carregar a redação dele. É uma explicação possível para a sobreposição não ter caído. Ter o exemplo na frente aumenta a conformidade [psico 4.3, Marsh et al.]. Mitigação: camadas 2 e 3.
5. **Limites sem validação.** O 0,90 por frase e o 0,2 de distância de edição são pontos de partida. Bloquear com eles antes de calibrar criaria reprovação à toa. Por isso só registro.
6. **"Melhoria" que estraga.** O defeito conhecido é a versão sair mais numérica e mais explicada que o original [027]. Didática demais num vídeo de indignação mata o motor. Mitigação: regra 3 da seção 6.1 e o teto de 3.
7. **Hook com superlativo vira clickbait.** Otimizar "o que funciona" leva a isso [técnico 5]. E o que se mede é o hook escolhido pelo time, não o melhor. Mitigação: superlativo só com fato da ficha; alavanca é prática em teste.
8. **Células vazias.** Cliente x linha x modo, com 19 a 23 clientes [dados], dá muito mais células do que o Codex tem roteiros. Sem os rótulos no corpus da casa (etapa 7), o caderno fica sem número por muitos meses.
9. **Teste entre clientes lento e frágil.** Cerca de 39 roteiros por braço por trimestre no melhor cliente (conta minha). Qualquer mudança de escritor, de modelo ou de time no meio contamina. O efeito da modelagem na casa já mudou de sinal entre dois períodos [fluxos].
10. **Linha editorial mal definida.** Se cada cliente tiver nomes próprios para as linhas, nada é comparável. Se a lista for imposta e não bater com o Cockpit, ninguém preenche.
11. **Vínculo roteiro para vídeo.** Depende do casamento por 5-gramas (limiar 0,08) e do coletor [mapa 4.1]. Roteiro muito reescrito não casa. 29 casamentos pendentes [dados].
12. **Fato errado herdado.** O original pode estar errado, e "subiram 300%" já virou "triplicou" na prova [027]. A verificação roda depois da entrega. Um roteiro pode ser copiado para o CRM antes de ela terminar.
13. **Otimizar contra o preditor.** Poucas candidatas, nenhuma geração guiada pela nota [estratégia]. O preditor ordena hooks e propostas, e só.

---

## 11. O que ficou sem verificar

- **As saídas da prova da 027** (`runs/027-prova/`). A pasta não está nesta árvore de trabalho. Os números da prova vêm do [027] e das mensagens de commit, não da leitura dos roteiros.
- **Qual das duas versões do escritor copia menos.** A mensagem do `30dcaa6` diz que a sobreposição literal não caiu, sem número.
- **O tempo e o custo do leitor sozinho**, e o custo da versão de uma chamada.
- **CHECK em `vm_attachments.modo`** e o estado das migrações em produção.
- **Se o Cockpit tem linha editorial como dado.** Só vi os "territórios do ciclo" chegando pela RPC `hub_painel_estrategia_atual`. Não li o Cockpit.
- **Se `vm_modelagem_analyses` aceita a ficha v2 sem migração.** A coluna `analysis` existe [mapa 2.2]; não conferi o tipo.
- **Como buscar views e coeficiente de uma referência externa** na hora da modelagem. A [estratégia] diz que o coletor já raspa Instagram. Não conferi a rota.
- **Quantos roteiros modelados cada cliente escreve por semana.** O número da Izabela é estimativa do [028] a partir de vídeos.
- **A pesquisa.** A maior parte foi lida só pelo resumo. Nenhum trabalho testa "replicar a estrutura de um viral com outro conteúdo" medindo audiência real [técnico 5, psico 7]. Os limites de similaridade propostos não vêm da literatura [psico 6.3].

---

## 12. Perguntas de esclarecimento para o Igor

1. **O que é "linha editorial" na prática?** É o território de assunto do cliente (como os territórios do ciclo no Cockpit), ou outra coisa? Existe uma lista única da casa, ou cada cliente nomeia as suas? Sem lista comum, uma linha de um cliente não tem como propor teste para "a mesma linha" em outro.
2. **"Tipo de narrativa" é o modo das skills (história, mecanismo, demonstração, panorama) ou a estrutura (Davi e Golias, Paradoxo Contraintuitivo, Queda do Gigante)?** Proponho o modo, porque já tem 2.832 roteiros rotulados e uma skill por modo. A estrutura deixaria as células ainda mais vazias.
3. **A confirmação da essência trava a escrita?** Proponho que não: a essência aparece, a escrita segue, editar regera. Travar dá mais controle e custa abandono (9 sessões morreram na pausa de premissa).
4. **A modelagem mantém o assunto do original, ou pode levar a essência para o assunto do cliente?** Hoje mantém (mesma premissa). Se puder trocar o tema, os ativos deixam de ser herdados, a régua de desvio passa a ser só estrutural, e o risco de inventar fato cresce muito. Muda o desenho inteiro.
5. **Qual escritor, se a prova empatar em qualidade?** Uma chamada com o original na mão (cerca de 1 a 2 minutos) ou a partir da ficha (cerca de 3 a 4 minutos e US$ 1,48 com busca)? Qual é o teto de tempo e de custo por roteiro que você aceita?
6. **Quem usa este caso de uso, e em quais clientes primeiro?** O piloto tem a Bianca e a Izabela. Este precisa de um responsável e de dois clientes da mesma linha para o teste entre clientes fazer sentido. Cliente obrigatório, como no piloto?
7. **O que conta nas 3 melhorias?** Fechamento com consequência para o espectador e reforço por pesquisa entram na conta, ficam fora, ou saem do cardápio? E a pesquisa fica desligada por padrão, como proponho?
8. **Superlativo e fato contraintuitivo no hook: só com fato que já está no vídeo, ou também com fato novo confirmado por pesquisa?** A segunda opção rende mais hooks e custa uma busca (cerca de US$ 0,50 e 60 s cada).
9. **Teste entre clientes: você aceita sorteio por sessão, um teste por vez por cliente x linha, e decisão só no trimestre?** Alocação de 50 e 50 (proposta) ou cerca de 20% como na estratégia de outubro? Quem aprova cada proposta: você, ou quem cuida do cliente no Cockpit?
10. **Onde moram as práticas e o caderno da célula?** A regra da casa manda métrica de performance para o Oráculo, e o plano 020 proíbe o Codex de escrever lá. Vale a mesma exceção proposta no [028] (escrita só por RPC), ou o caderno fica no Codex? E você aprova os cerca de US$ 120 para rotular a amostra da casa?
