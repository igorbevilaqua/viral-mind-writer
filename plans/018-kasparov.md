# 018 — Kasparov: o estrategista com quem se discute

**Tipo:** design spec (a etapa de implementação entra neste mesmo arquivo, como no 015).
**Data:** 2026-08-16. **Release alvo:** 2.0.
**Depende de:** 015 (peça 1) — o classificador de ensino, o roteamento por destinatário e o
`<dialog>` já mergeados. **É a peça 4 de 4** do pacote 2.0.

---

## 1. O problema

Números de produção em 2026-08-16 (projeto Supabase `qclvrddrqulgfzccndnl`), depois da peça 1:

| Métrica | Valor |
|---|---|
| Sessões / roteiros | 44 / 47 |
| **Pares de calibração pendentes / votos** | **94 / 6** |
| Lições extraídas / ativas | 28 / **0** |
| Lições nascidas de ensino em sessão (`origem:'ensino'`) | 0 — a peça 1 acabou de subir |
| Roteiros com `published_url` | 2 de 47 |
| `vm_script_performance` / `vm_outcomes` | 0 / 0 |
| Autópsias de vídeo já pagas (`vm_modelagem_analyses`) | 12 |

A peça 1 abriu o canal de ensino **dentro da sessão**. Sobrou tudo que não é sessão: as 94
comparações de hook que ninguém foi votar, as 28 lições que ninguém foi ativar, e a conversa
sobre um vídeo que não vai virar roteiro nenhum — hoje ela simplesmente não acontece no produto.

**O padrão é o mesmo do 015 §1, um nível acima:** a peça 1 tirou a curadoria do destino
`/ensinar` e a pôs no fluxo da sessão. Mas quem não está numa sessão continua sem porta. E as
duas filas maiores do sistema (94 pares, 28 lições) **não pertencem a sessão nenhuma** — elas
não têm onde ser drenadas.

**Tese desta peça:** um interlocutor. Não uma tela a mais — um lugar onde discutir estratégia, e
onde as filas pendentes entram como assunto, não como formulário.

## 2. Escopo

**Nesta peça:** chat multi-turno persistido; diagnóstico qualitativo de um roteiro aberto; debate
sobre um vídeo (do acervo ou de fora); drenagem conversacional das filas de calibração e de
lições; destilação do que foi acordado pelo classificador da peça 1.

**Fora desta peça:** nota de potencial viral 0-100% (§3.1); busca de métrica automática pelo link
publicado (peça 5); qualquer novo agente de escrita.

**O que esta peça NÃO constrói de novo:** classificador de ensino, roteamento por destinatário,
escrita transacional nas quatro casas, `<dialog>` nativo, validação de regex. Tudo isso é da peça
1 e é consumido como está. **Nenhuma porta nova de gravação.**

## 3. Princípios

1. **Abre com posição, não com pergunta.** Um estrategista que devolve "o que você acha?" não é
   interlocutor, é formulário com outra roupa. Se ele não tem posição, ele não tem função.
2. **Sustenta o que tem lastro; cede o que era palpite — e diz qual dos dois é o caso.** A frase
   "eu estava só achando" é entrega, não fraqueza. É o que separa este agente de um bajulador.
3. **O desfecho padrão de um debate é nenhuma lição.** "Concordamos, nada novo" é legítimo e
   frequente. Sem esta regra, o gosto do sistema vira o que foi dito por último.
4. **A conversa é rascunho; o sistema é a memória.** O que sobrevive vira lição / vocabulário /
   frase banida pelas casas da peça 1. Thread velha é descartável por construção.
5. **Falha silenciosa continua sendo o defeito central.** Ensinar e não ter ensinado é pior que
   não ter a feature (herdado do 015 §3).

### 3.1 A nota de potencial viral foi adiada — de propósito

Decisão do Igor em 2026-08-15: *"hoje o cálculo dificilmente vai representar a realidade e vai ser
difícil de calibrar."* O dado confirma: `vm_outcomes` = 0 e `vm_script_performance` = 0. **Não há
como calibrar peso nenhum.**

O que a nota carregaria era "me diz o que está fraco e por quê" — isso sobrevive sem o número, e
**fica melhor**: diagnóstico em texto é discutível, `73%` não é, e não se treina um sistema
discordando de um percentual.

## 4. Memória: estado do sistema, nunca transcript

O turno N não recebe os turnos 1..N-1. Recebe **o estado do sistema**:

```
playbooks (por referência: slug+version)
lições ativas (roteadas para `dados`, o destinatário que já agrega tudo — 015 §6.2)
preferências do cliente (vocabulário, proibições, tom)
o roteiro aberto, quando existe
o assunto corrente da thread (uma linha, reescrita a cada turno)
```

**Por que não transcript:** custo por turno constante em vez de linear, e — mais importante — o
sistema não pode "lembrar" de algo que não foi gravado numa das quatro casas. Se uma conclusão
importa, ela vira lição. Se não virou lição, ela **deve** ser esquecida: memória de conversa que
sobrevive fora das casas é um segundo repositório de gosto, invisível para os agentes de escrita e
impossível de auditar. É o princípio 4 aplicado literalmente.

**Consequência aceita:** o Kasparov não se lembra do que foi dito há dez turnos. É o preço, e ele
é dito na tela ("o que a gente acordar eu registro; o resto eu esqueço").

## 5. Destilação: o classificador da peça 1, com a assinatura REAL

O Kasparov **não ganha destilador próprio**. Ele chama `classificarEnsinamento`
(`lib/pipeline/classify-teaching.ts:50`). A assinatura em produção hoje:

```ts
classificarEnsinamento(input: {
  texto: string;          // as palavras cruas
  trecho?: string;        // trecho ancorado
  referenciaId?: string;  // o culpado, quando vem de um "por quê"
  clienteNome?: string;
}): Promise<Ensinamento>

interface Ensinamento {
  regra: string;
  casa: "licao" | "vocabulario" | "frase_banida" | "playbook";
  destinatarios: Destinatario[];   // subconjunto dos 8
  dimensao: string;                // rótulo de filtro, não decide destino
  evidencia?: string;
  padrao?: string;                 // só quando casa = frase_banida
  motivo?: string;                 // só quando casa = frase_banida
}
```

**Três consequências duras, e nenhuma delas é hipótese — saem da assinatura acima:**

### 5.1 `texto` é uma string, e num debate quem a escreve é o Kasparov

O classificador recebe **um texto cru**, não uma conversa. Num ensino em sessão, esse texto são as
palavras que o usuário digitou, e `vm_lessons.context_note` as guarda literais — é o que permite
auditar depois se o sistema entendeu ou reescreveu (015 §5).

Num debate de dez turnos **não existe essa string**. Alguém tem que comprimir o acordo em uma
frase, e esse alguém é o Kasparov. Se essa frase for gravada em `context_note` como se fosse fala
do usuário, **a auditoria da peça 1 morre em silêncio**: passa a ser impossível distinguir "ele me
entendeu" de "ele me reescreveu", que é exatamente o que aquele campo existe para responder.

**Requisito:** a síntese do Kasparov vai à tela **como proposta, com as palavras dele**, e o
usuário confirma ou reescreve antes de virar `texto`. O que for gravado em `context_note` é o
texto **pós-confirmação**, e o registro guarda que a origem foi `kasparov`, não digitação direta.
Sem isso a peça 4 envenena a garantia da peça 1.

### 5.2 Não existe campo de direção de vocabulário

`Ensinamento` **não tem** `direcao` nem `termo`. Hoje a direção evitar/preferir é inferida por
heurística de negação sobre a regra (`não|nunca|jamais|evitar|proibir` ⇒ `vocabulario_evitar`),
marcada com `ponytail:` em `lib/actions.ts` (pendência 10 do `2.0-decisoes.md`).

O Kasparov herda essa heurística inteira, e **piora o caso**: numa conversa a regra acordada tende
a ser mais longa e mais ambígua que um ensino de sessão ("prefira X, e nunca Y no mesmo parágrafo"
dispara a negação e vai inteiro para `vocabulario_evitar`).

**Duas saídas, e a escolha é do Igor** (entra na fila de pendências, não é decidida aqui):
- **A)** consertar na peça 4: campo `direcao` + `termo` na tool do classificador, chip na tela. O
  conserto vale para as duas peças de uma vez.
- **B)** conviver: no caminho do Kasparov, oferecer vocabulário só com o termo isolado e a direção
  escolhida por chip na confirmação, sem passar pela heurística.

### 5.3 A gravação exige uma sessão que o Kasparov pode não ter

`gravarEnsinamento` monta `p_session_url = /sessions/${sessionId}` (`lib/actions.ts`, caso
`licao`). Um debate sobre um vídeo aleatório, fora de qualquer sessão, **não tem `sessionId`**.

**Requisito:** `source_url` passa a aceitar a origem do debate (a URL do vídeo discutido, ou
`/kasparov/<thread>`), sem inventar sessão que não existe. É mudança de uma linha na montagem, mas
precisa ser feita de propósito — deixar `undefined` grava lição com procedência falsa.

## 6. Postura e discordância

O Kasparov abre com posição. Quando o usuário discorda, ele classifica **a própria posição** antes
de responder:

| Ele tem atrás de si | Comportamento |
|---|---|
| Playbook, `performance_ratio` ou `vm_outcomes` | **Sustenta**, citando o lastro literalmente |
| Só heurística / leitura própria | **Cede**, e diz: "eu estava só achando" |

Ele **nunca bloqueia** o usuário. Mas a discordância é registrada: quando o usuário vence um
argumento que tinha lastro real, isso é sinal — o lastro pode estar velho ou errado, e é
exatamente o tipo de coisa que precisa virar lição.

**Hoje o lastro é quase sempre inexistente.** Com `vm_outcomes` = 0 e `vm_script_performance` = 0,
a regra nasce com uma perna só: sobram playbook e ratio do corpus. Isso não invalida a regra —
invalida fingir que ela está completa. O Kasparov diz "sustento isto pelo playbook X" ou "estou
achando", e nunca "os dados mostram" enquanto não houver dados.

## 7. Debate sobre vídeo

| Situação | Abertura |
|---|---|
| Vídeo **no acervo** | abre com o **ratio**: "316k views com 1.556 seguidores — 203×" |
| Vídeo **fora do acervo** | transcreve, analisa, e **diz explicitamente que está opinando sem dado** |

Cobertura obrigatória: tema, hook, storytelling, comando, **contrastes, linguagem e apelo
emocional**.

### 7.1 A autópsia já cobre mais da metade — e é reuso, não reescrita

`analyzeModelagem` já produz `compreensao`, `diagnostico.por_camada` e `esqueleto`. As camadas
prontas: **tema**, **hook** (MGC canônico, fator de curiosidade, mecanismo, função),
**storytelling** (código do playbook + beats) e **comando**. `diagnostico.por_camada.leitura` já é
literalmente "por que funciona ou falha", com evidência literal.

**Faltam três:** contrastes, linguagem e apelo emocional.

Hoje a autópsia é usada para **roubar arquitetura**, não para julgar. Reaproveitá-la é mais barato
que escrever um analista novo — e mantém uma única definição de "o que é um bom hook" no sistema.

### 7.2 O que precisa ser destravado, concretamente

```ts
ensureTranscript(attachment: Attachment): Promise<{ text: string; erro: string | null }>
analyzeModelagem(attachment: Attachment, ctx: GenerationContext): Promise<ModelagemResult>
extractLearnings(input: { transcript, sourceUrl?, contextNote?, clientNome? }): Promise<ExtractedLearning[]>
```

- `extractLearnings` (`lib/pipeline/teach.ts:98`) **já está desacoplado de sessão** — entra como
  está.
- `ensureTranscript` (`lib/pipeline/modelagem.ts:267`) exige um `Attachment`, e **cacheia mutando
  `attachment.raw_content`**. Vídeo do acervo volta de graça; vídeo de fora precisa de um
  `Attachment` para existir.
- `analyzeModelagem` (`lib/pipeline/modelagem.ts:281`) exige `Attachment` **e** `GenerationContext`
  inteiro, e cacheia em `vm_modelagem_analyses` **por `attachment_id`**. Um vídeo discutido fora de
  sessão não tem `attachment_id` — então não tem chave de cache, e cada debate sobre o mesmo vídeo
  pagaria a autópsia de novo.

**Requisito:** separar o núcleo da autópsia do par `Attachment`+`GenerationContext`, com chave de
cache pela **URL do vídeo** e não pelo id do anexo. As 12 autópsias já pagas continuam válidas.

## 8. As filas que ele drena

| Fila | Volume | Como entra na conversa |
|---|---|---|
| Pares de calibração | **94** | um par por vez, comparação **cega** (o mecanismo não é revelado, para não enviesar) — `getNextCalibrationPair` já faz a seleção e a rotação de eixos |
| Lições extraídas e nunca ativadas | **28** | uma por vez, com a evidência que a gerou; ativar é `setLearningActive`, que já existe |
| Métricas de publicação faltantes | 45 de 47 | roteiro publicado há +14 dias sem métrica (peça 5) |

Nenhuma dessas filas ganha tela nova: são assunto, entre um turno e outro. **O A/B não é pouco
usado porque é ruim — é pouco usado porque é um destino** (6 votos em 94 pares diz isso sozinho).

O gravador de voto continua sendo o de hoje (`vm_calibration_votes`, com `winner: a|b|skip`).
Nenhuma porta nova.

## 9. Persistência da thread

O único componente sem reuso no sistema inteiro: **chat multi-turno persistido**. O Bob é one-shot
sem memória; não existe chat com estado em lugar nenhum.

Como o contexto do turno é o estado do sistema (§4) e não o histórico, a thread é **registro para
o usuário reler**, não insumo do modelo. Isso rebaixa o requisito de "memória conversacional" para
"lista de mensagens", que é uma tabela e nada mais.

Precedente da casa para dado sem consulta cruzada: coluna `jsonb` antes de tabela nova
(`vm_modelagem_analyses.analysis`; ver também a pendência 7 do `2.0-decisoes.md`). Aqui, porém, há
consulta por thread e ordenação por turno, então **tabela** — a decisão é feita na etapa de
implementação, com a migration numerada na sequência (**0030+**, depois da 0029 da peça 3).

## 10. Interface

Chat de verdade, estilo ChatGPT/Claude: lista de mensagens, campo fixo embaixo, streaming da
resposta. É o único lugar do pacote onde SSE se justifica — resposta de debate é longa, ao
contrário da classificação de ~3s da peça 1 (015 §10).

Toda gravação continua passando pela confirmação da peça 1: o painel "Você disse / Entendi como /
Vai para / Quem recebe / Escopo" é o mesmo componente (`components/teach-dialog.tsx`), aberto a
partir da conversa. **Escopo continua manual** (Cliente | Global): o sistema não pergunta e não
infere (015 §5.2) — e num chat isso significa que a confirmação é uma tela, não uma frase do
Kasparov perguntando.

## 11. Tratamento de erro

| Falha | Tratamento |
|---|---|
| Transcrição do vídeo falha | diz qual vídeo e por quê; oferece colar a transcrição. Nunca opina sobre vídeo que não leu |
| Autópsia falha | segue a conversa **sem** ela, dizendo que está sem a análise estruturada |
| Classificação do acordo falha | a síntese permanece na tela, botão de repetir — o mesmo tratamento do 015 §8 |
| Gravação falha | nada é dado como gravado; a thread guarda a síntese para nova tentativa |
| Debate sem lastro nenhum | resposta explícita de que é opinião. **Nunca "os dados mostram"** sem dado |

## 12. Checagem

Testes, os menores que falham se a lógica quebrar:

1. **Contexto do turno é constante.** Montar o contexto do turno 1 e do turno 20 da mesma thread
   produz a mesma estrutura e não cresce com o número de mensagens. É o teste que impede o
   transcript de voltar por uma porta lateral.
2. **Nenhuma porta nova de gravação.** O módulo do Kasparov não referencia `vm_lessons`,
   `vm_lesson_learnings`, `vm_banned_phrases` nem `vm_client_preferences` — só
   `gravarEnsinamento`. Mesma família do teste "todo destinatário tem call site" da peça 1: impede
   que a falha silenciosa volte por uma porta nova.
3. **Origem preservada.** Lição nascida de debate carrega origem própria e `source_url` real,
   nunca `/sessions/undefined` (§5.3).
4. **Desfecho vazio é válido.** Um debate que termina sem acordo não produz chamada de gravação
   nenhuma (princípio 3).

Não há teste de acerto do julgamento do Kasparov: julgamento de LLM não se testa com `assert`, e o
portão dele é a confirmação humana — igual ao classificador da peça 1 (015 §9).

## 13. Fora de escopo, deliberadamente

- **Nota de potencial viral 0-100%** — adiada até existir `vm_outcomes` (§3.1)
- **Memória conversacional real** — é a decisão de §4, não uma limitação a corrigir depois
- **Busca automática de métrica pelo link publicado** — integração com o coletor/VPS, escopo novo
- **Entrada de voz, anexos na thread, múltiplas threads simultâneas** — nada disso foi pedido
- **Destilador próprio** — o classificador da peça 1 é o único, por decisão

## 14. Riscos conhecidos

1. **A síntese do Kasparov virando "palavras cruas do usuário"** (§5.1). É o risco de maior
   consequência da peça, porque corrompe a auditoria da peça 1 em silêncio. Mitigado pela
   confirmação obrigatória e pelo registro da origem — **não** mitigado se alguém decidir "gravar
   direto quando a confiança for alta".
2. **Bajulação.** Um interlocutor que cede sempre é pior que nenhum: ele transforma o gosto do
   sistema no que foi dito por último. Mitigado pelos princípios 2 e 3, que são regras de prompt —
   ou seja, mitigação fraca. O sinal de que falhou é a taxa de debates que terminam em lição
   subindo para perto de 100%.
3. **Lastro inexistente hoje** (§6). A regra de discordância nasce com uma perna só e só fica de pé
   quando a peça 5 destravar `vm_outcomes`.
4. **Custo do debate sobre vídeo fora do acervo.** Transcrição + autópsia por debate, sem cache
   útil enquanto §7.2 não for feito. Mitigado por chave de cache pela URL.

## 15. Contexto de release

Parte do pacote **2.0**, e a última das quatro peças — herda peças 1, 2 e 3 prontas, o que a
encolhe de "subsistema" para "interface".

`package.json` está em `0.1.0` enquanto a v1.1 shipada veio de env var (`next.config.ts:18` →
`NEXT_PUBLIC_APP_VERSION`); alinhar os dois faz parte do pacote, senão `pipeline_trace.version`
(`lib/pipeline/index.ts`) continua carimbando a versão errada. A mensagem de update
(`codex-updates/state.json`) faz parte do pacote.

Migrations criadas por este plano são aplicadas pelo **operador** via Supabase MCP, como as das
peças 1 a 3.

---

---

# Plano de implementação

> Um subagente por task, TDD. Subagente **não** roda `git add`/`git commit` e **não** aplica migration.

**Goal:** um interlocutor com quem discutir estratégia, que abre com posição, drena as filas
pendentes na conversa e destila o que foi acordado pelas casas da peça 1 — sem nenhuma porta nova
de gravação.

**Arquitetura:** contexto do turno = **estado do sistema**, nunca transcript (§4). A thread é
registro para o usuário reler, não insumo do modelo — o que rebaixa "memória conversacional" para
"lista de mensagens", que é uma tabela e nada mais.

## Global Constraints

- **Custo por turno constante.** Qualquer coisa que faça o contexto crescer com o número de turnos
  quebra o §4. Se uma conclusão importa, ela vira lição; se não virou, deve ser esquecida.
- **Nenhuma porta nova de gravação.** Só `gravarEnsinamento`. Há teste para isso (§12.2).
- **O desfecho padrão de um debate é NENHUMA lição** (§3.3). "Concordamos, nada novo" é legítimo e
  frequente.
- **Nunca "os dados mostram" sem dado** (§6, §11). Com `vm_outcomes` = 0, o lastro hoje é playbook e
  ratio do corpus; o resto é opinião e é dito como tal.
- **A síntese do Kasparov nunca vira `context_note` sem confirmação** (§5.1). É o risco de maior
  consequência da peça.
- Migration **0030**. Gate: `npx tsc --noEmit && npx eslint . && npm run check && npm test`.

---

### Task 1: Migration 0030 — thread e mensagens

**Files:** `supabase/migrations/0030_kasparov.sql`

- [ ] Tabela de thread (id, `user_id`, `client_id` nullable, `titulo`, timestamps) e tabela de
      mensagens (id, `thread_id` FK on delete cascade, `papel`, `conteudo`, `ordem`, `created_at`),
      com índice por `(thread_id, ordem)`. Tabela e não `jsonb` — decisão 17 do Igor: há consulta
      por thread e ordenação por turno.
- [ ] **STOP:** o operador aplica via Supabase MCP.

---

### Task 2: Destravar a autópsia (decisão 18, §7.2)

**Files:** `lib/pipeline/modelagem.ts` · Test: `tests/autopsia-avulsa.test.ts`

- [ ] Separar o núcleo da autópsia do par `Attachment` + `GenerationContext`, com **chave de cache
      pela URL do vídeo** em vez de `attachment_id`. Vídeo discutido fora de sessão não tem
      `attachment_id`, logo não tem chave — e cada debate sobre o mesmo vídeo pagaria de novo.
- [ ] **As 12 autópsias já pagas continuam válidas.** É o teste que prova que o refactor não
      invalidou cache existente.
- [ ] `ensureTranscript` também exige `Attachment` e **cacheia mutando `attachment.raw_content`** —
      tratar junto.

---

### Task 3: Contexto do turno (§4) — o coração da peça

**Files:** `lib/pipeline/kasparov.ts` (novo) · Test: `tests/kasparov-contexto.test.ts`

- [ ] `montarContexto(args): string` — playbooks por **referência** (slug+version), lições ativas
      roteadas para `dados` (o destinatário que já agrega tudo, 015 §6.2), prefs do cliente, roteiro
      aberto quando existe, e o assunto corrente em **uma linha**.
- [ ] **O teste que trava o desenho:** montar o contexto do turno 1 e do turno 20 da mesma thread
      produz a mesma estrutura e **não cresce com o número de mensagens** (§12.1). É ele que impede
      o transcript de voltar por uma porta lateral.

---

### Task 4: A persona e o turno (§3, §6)

**Files:** `agents/kasparov.md` (novo) · `lib/pipeline/kasparov.ts`

- [ ] Persona: **abre com posição, não com pergunta** (§3.1). Um estrategista que devolve "o que
      você acha?" é formulário com outra roupa.
- [ ] **Discordância (§6):** classifica a própria posição antes de responder — sustenta quando tem
      playbook/`performance_ratio`/`vm_outcomes` atrás, **cede quando estava só achando, e diz qual
      dos dois é o caso**. Nunca bloqueia o usuário; a discordância vencida é sinal e é registrada.
- [ ] Streaming (§10): é o único lugar do pacote onde SSE se justifica — resposta de debate é longa,
      ao contrário da classificação de ~3s da peça 1.

---

### Task 5: Debate sobre vídeo (§7)

**Files:** `lib/pipeline/kasparov.ts` · `agents/kasparov.md`

- [ ] Vídeo **no acervo** → abre com o **ratio** ("316k views com 1.556 seguidores — 203×"). Fora do
      acervo → transcreve, analisa e **diz explicitamente que está opinando sem dado**.
- [ ] Reusa a autópsia destravada (Task 2). Ela já cobre tema, hook, storytelling e comando;
      **faltam contrastes, linguagem e apelo emocional** — acrescentar só esses três.

---

### Task 6: As filas (§8)

**Files:** `lib/pipeline/kasparov.ts` · `lib/actions.ts`

- [ ] Calibração: `getNextCalibrationPair` já faz seleção e rotação de eixos; o voto continua indo
      para `vm_calibration_votes`. **Comparação cega** — o mecanismo não é revelado, para não
      enviesar.
- [ ] Lições nunca ativadas: uma por vez, com a evidência que a gerou; ativar é `setLearningActive`,
      que já existe.
- [ ] **Nenhuma fila ganha tela nova.** São assunto entre um turno e outro. O A/B não é pouco usado
      porque é ruim — é pouco usado porque é um destino (6 votos em 94 pares).

---

### Task 7: Destilação (§5) — onde a peça pode envenenar a peça 1

**Files:** `lib/pipeline/kasparov.ts` · `lib/actions.ts` · Test: `tests/kasparov-destilacao.test.ts`

- [ ] Usa `classificarEnsinamento` e `gravarEnsinamento`. **Nada novo.**
- [ ] **§5.1, o requisito duro:** a síntese vai à tela **como proposta, com as palavras do
      Kasparov**, e o usuário confirma ou reescreve antes de virar `texto`. O que for para
      `context_note` é o texto **pós-confirmação**, e o registro guarda que a origem foi `kasparov`.
      Sem isso a auditoria da peça 1 morre em silêncio: deixa de ser possível distinguir "ele me
      entendeu" de "ele me reescreveu".
- [ ] **§5.3:** `gravarEnsinamento` monta `/sessions/${sessionId}`. Debate fora de sessão **não tem
      sessionId** — `source_url` passa a aceitar a origem do debate. Deixar `undefined` grava lição
      com procedência falsa.
- [ ] Testes §12.2 (nenhuma porta nova: o módulo não referencia `vm_lessons`,
      `vm_lesson_learnings`, `vm_banned_phrases` nem `vm_client_preferences`), §12.3 (origem
      preservada, nunca `/sessions/undefined`) e §12.4 (**debate sem acordo não chama gravação
      nenhuma**).

---

### Task 8: Rota e tela (§10)

**Files:** `app/api/kasparov/route.ts` · `app/kasparov/page.tsx` · `components/kasparov-chat.tsx`

- [ ] Rota SSE no molde de `app/api/bob/route.ts`. Chat estilo ChatGPT/Claude: lista de mensagens,
      campo fixo, streaming.
- [ ] A confirmação de gravação **reusa o `teach-dialog` da peça 1** — não é componente novo.
- [ ] Dizer na tela o que o §4 implica: "o que a gente acordar eu registro; o resto eu esqueço".

---

## Ordem, dependências e portões

| Task | Depende de | Portão |
|---|---|---|
| 1 | — | **operador aplica a 0030** |
| 2 | — | as 12 autópsias existentes continuam válidas |
| 3 | — | contexto do turno 20 = contexto do turno 1 |
| 4 | 3 | abre com posição |
| 5 | 2, 4 | fora do acervo, diz que opina sem dado |
| 6 | 4 | voto vai para a tabela que já existe |
| 7 | 4 | **debate sem acordo não grava nada** |
| 8 | 1, 7 | a confirmação é a da peça 1 |

Tasks 1, 2 e 3 são independentes — as candidatas a paralelizar.

---

## Pendências que este spec abre

Registradas em `plans/2.0-decisoes.md`. Nenhuma bloqueia escrever o plano de implementação; a
primeira bloqueia **implementar** a destilação.

1. **§5.2 — direção de vocabulário: consertar (A) ou contornar (B)?** O conserto vale para as duas
   peças; o contorno é local à peça 4.
2. **§9 — a thread é tabela nova?** A recomendação é sim (há consulta por thread e ordem por
   turno), contra o precedente de `jsonb` da casa.
3. **§7.2 — destravar `analyzeModelagem` agora ou aceitar o custo repetido?** Destravar é refactor
   num caminho que hoje funciona; não destravar paga autópsia a cada debate.
