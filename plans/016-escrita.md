# 016 — Escrita: material antes, veredito depois

**Tipo:** design spec (a etapa de implementação entra neste mesmo arquivo, como no 015).
**Data:** 2026-08-15. **Release alvo:** 2.0. **Depende de:** 015 (peça 1) para o rastro e a banlist.
**É a peça 2 de 4** do pacote 2.0.

---

## 1. O problema

Números de produção em 2026-08-15 (projeto Supabase `qclvrddrqulgfzccndnl`):

| Métrica | Valor |
|---|---|
| Roteiros gerados | 47 |
| **Roteiros com `slop_lint_violations > 0`** | **0** (média 0,00 · máximo 0) |
| Frases banidas ativas | 32 (21 `block`, 11 `warn`) |
| Sessões com dossiê | 38 |
| Dossiês contendo ao menos uma URL | 37 de 38 |
| Roteiros com alguma quantidade numérica | 36 |
| **Roteiros com quantidade repetida** | **8 de 36 (22%)** — 11 pares |

**O lint diz zero em todos os 47 roteiros.** Não porque a escrita esteja limpa: porque os detectores
de hoje só enxergam o que foram construídos para enxergar. `slopLint`
(`lib/pipeline/slop-lint.ts:9`) recebe `(text, phrases)` e casa **padrões locais** — uma regex que
bate num ponto do texto. Todo defeito desta peça é **relacional** (a mesma quantidade em dois
lugares) ou **de ausência** (o número que não foi comparado a nada, o estudo que não foi buscado).
Nenhum deles é expressável como "casa aqui". São invisíveis por construção, e o zero é a prova.

### 1.1 O eco numérico existe, e o falso positivo também

Amostragem dos 8 roteiros com quantidade repetida — quatro casos reais, na íntegra:

| Valor | n | O que está acontecendo | Veredicto |
|---|---|---|---|
| `60%` | 2 | "mais de **60%** de quem compra tem entre 18 e 24 anos" · "**60%** dizem que gostariam de ter vivido numa época menos conectada" | ❌ **defeito** — dois fatos diferentes vestindo o mesmo número |
| `400%` | 3 | "alavancagem de até **400%**" · "Com **400%** de alavancagem, uma queda pequena vira um buraco gigante" · "alavancagem de **400%** em cima de hype tem um nome no mercado: pólvora" | ✅ **boa** — refrão que fecha em virada |
| `37,5%` | 2 | "tomou tarifas de até **37,5%**" · "o exportador daqui paga **37,5%** pra entrar nos Estados Unidos e assiste o vizinho pagando 10%" | ✅ **boa** — o retorno existe para armar o contraste com os 10% |
| `2 milhões` | 2 | "entre 500 mil e **2 milhões** de livros" · "**2 milhões** de livros usados e raros somam entre R$ 100 e R$ 300 milhões" | ⚠️ **limítrofe** — conta derivada |

Um defeito claro em quatro. É exatamente o que as decisões previram ("falso positivo é aceitável e
esperado") — mas o número tem consequência de design: **três em cada quatro sinais são texto que não
deve ser tocado.** Um detector que corrija sozinho estraga mais do que conserta. O `400%` perderia o
refrão; o `37,5%` perderia o contraste.

### 1.2 Três ativos existem e só rodam em metade das gerações

`checagemBlock` (`lib/pipeline/agents.ts:303-339`) só é montado quando `research` recebe `adapt`
(`agents.ts:388`), e `adapt` só é verdadeiro quando há modelagem **sem tema digitado**
(`lib/pipeline/index.ts:169-174`). Dentro dele, três coisas boas ficam trancadas:

| Ativo | Linha | O que faz | Roda quando |
|---|---|---|---|
| Seção `## CHECAGEM` | `agents.ts:324` | uma linha por alegação, com fonte | só modelagem sem tema |
| **Comparação em escala humana** | `agents.ts:331` | "R$, salários mínimos, tempo de trabalho, preço de coisas do cotidiano" | só modelagem sem tema |
| **Hierarquia de fontes tier 1/2/3** | `agents.ts:335` | de `lib/pipeline/fontes-autoritativas.json` | só modelagem sem tema |

O senso de grandeza que esta peça quer **já está escrito** (`agents.ts:331`) e não roda na geração
comum. A hierarquia de fontes idem — e, pior, `fontes-autoritativas.json` **nunca é usado para
verificar saída**: é lido só para imprimir domínios no prompt (`agents.ts:305-309`).

### 1.3 A comparação hook × abertura já existe e nunca olhou o hook

`ecoa(a, b)` compara a primeira frase de dois trechos por palavras de conteúdo, com limiares
`MIN_PALAVRAS_EM_COMUM = 4` e `LIMITE_ECO = 0.5`. É consumida por `semEcoDaAbertura`, que descarta
variações de hook que só reescrevem a abertura do corpo.

**Correção importante sobre o estado dela:** a função **não está em produção**. Ela existe apenas no
working tree do Igor, **não commitada** (junto de uma instrução nova em `agents/roteirista.md` e de
três testes em `tests/parse-sections.test.ts`). Uma versão anterior deste spec afirmava que ela
"roda em produção hoje" — errado: a exploração leu o working tree sem conferir se as linhas estavam
commitadas.

Isso não enfraquece o desenho, fortalece: o trabalho já feito **aplica exatamente a arquitetura que
este spec propõe** — instrução a montante (`roteirista.md`: "não abra o corpo com uma segunda
abertura") e barreira determinística a jusante (`semEcoDaAbertura`), com o comentário do próprio
código dizendo "barreira em código, não pedido no prompt". É a §4.2 desta peça, escrita antes dela.

O que continua verdadeiro e é o ponto: mesmo com esse trabalho, **o hook escolhido nunca é comparado
contra a abertura do corpo**. A comparação só filtra *variações*. Ligar no par principal segue sendo
o trabalho desta sub-peça — e fica trivial assim que o WIP for commitado.

### 1.4 O sub-hook não existe

A decisão fala em "comparação posicional de dois trechos curtos e **conhecidos**". Metade é
verdade. O **hook é conhecido**: coluna própria (`supabase/migrations/0001_init.sql:36`), separada do
corpo desde a `0022_hook_fora_do_roteiro.sql`, e `swapHook` (`lib/actions.ts:447-471`) troca o hook
sem tocar no texto do roteiro — prova do isolamento.

O **sub-hook não existe**: nenhum campo, agente, seção, coluna ou prompt o produz. A única ocorrência
da palavra no repo é `retencao_subhook`, uma métrica de retenção legada
(`supabase/migrations/0012_registro_corpus_fns.sql:68`) que nenhum TypeScript lê.

O que existe é a **abertura do corpo**, derivada por posição: `roteiro.split(/\n\s*\n/)[0]` — o que
`semEcoDaAbertura` (`draft.ts:425-429`) já faz. **Esta peça adota "hook × abertura do corpo" como o
par, e abandona o termo sub-hook.** Nomear uma entidade que não existe seria construí-la sem
necessidade.

## 2. Escopo

**Nesta peça:** estudos que corroboram a premissa, com portão de URL; senso de grandeza por
comparação de escala; detector determinístico de eco numérico; comparação hook × abertura; e a ordem
que faz as quatro coisas conviverem.

**Fora desta peça:** verificação factual do roteiro final (peça 3 — inclusive confirmar que a URL de
um estudo **existe**, que aqui não é verificado); Kasparov e chat (peça 4); métrica de publicação
(peça 5).

**O que esta peça consome da peça 1:** `vm_banned_phrases` alimentada pela janela de ensino; o rastro
de proveniência (`pipeline_trace.proveniencia`) como destino dos descartes; o call site de lições no
revisor (`critique.ts`), que a peça 1 cria e esta peça reusa.

## 3. Princípios

Herda os cinco do pacote (`2.0-decisoes.md`). Os que mordem aqui:

1. **Falha silenciosa é o defeito central.** Estudo descartado por falta de URL, eco sinalizado e
   ignorado, comparação de escala oferecida e não usada — tudo vai para o trace e para a tela.
2. **A verdade ou é recuperável, ou não é dita.** Sem URL verificável, o estudo não entra. Não existe
   "segundo pesquisas" sem referência.
3. **Detector determinístico não decide, sinaliza.** Julgamento de repetição é julgamento de escrita.
   Quem decide é o revisor.

E um específico desta peça:

4. **Material antes, veredito depois.** O que adiciona texto entra como *insumo*, antes da escrita.
   O que remove texto entra como *veredito*, depois da escrita. Nada novo entre os dois.

## 4. A tensão, e a ordem que a resolve

### 4.1 O problema

Estudos e senso de grandeza **adicionam** texto. Eco numérico e anti-repetição **removem**. As
decisões registram a tensão: empilhadas como três parágrafos soltos no prompt do roteirista, se
anulam — o roteirista lê "traga estudos e comparações de escala" e "não repita números" na mesma
respiração, e entrega mal as duas. E "recorde histórico" vira a próxima frase batida.

A tentação é resolver com mais prompt: uma seção de prioridades, uma regra de desempate. Isso é
exatamente o que não funciona — o prompt do roteirista (`buildDynamicSystemBlock`, `draft.ts:180-196`)
já carrega premissa, dossiê íntegro, narrativa vencedora, playbook, banlist com motivo, prefs de
cliente e lições. Mais um parágrafo de arbitragem é o parágrafo que ninguém lê.

### 4.2 A resolução

**Adição e remoção não disputam porque não se encontram.** Ficam em lados opostos do roteirista:

```
  pesquisador  ──  1 chamada Grok que JÁ ACONTECE (agents.ts:385)
       │           + ## ESTUDOS + comparações de escala
       │
       ▼           portão determinístico de URL (sem LLM)
    dossiê   ─────────────────  MATERIAL
       │
       ▼
  roteirista  ──  escreve livre. O prompt dele ganha ZERO parágrafo novo.
       │
       ▼
   assembled  (index.ts:263-270)
       │
       ▼           detectores determinísticos (sem LLM):
       │           eco numérico · hook × abertura
       │
  revisor  ─────────────────  VEREDITO   (bloco que já existe, draft.ts:273-282)
       │
       ▼
 humanizador  ──  banlist + retry cirúrgico, INALTERADO
```

**O roteirista não recebe uma instrução a mais.** Ele recebe fatos — números já comparados a uma
escala, estudos já filtrados — e é julgado depois. Um comparativo de escala que chega como
*material* ("R$ 45 bilhões, mais do que o PIB do Acre") é usado ou ignorado conforme couber. O mesmo
comparativo como *instrução* ("sempre traga comparações de escala") produz a frase batida que a
decisão teme.

### 4.3 Dono e momento

| Sub-peça | Dono | Momento | Custo de LLM |
|---|---|---|---|
| Estudos que corroboram | pesquisador | antes da escrita (dossiê) | **zero** — mesma chamada |
| Senso de grandeza | pesquisador | antes da escrita (dossiê) | **zero** — mesma chamada |
| Eco numérico | detector determinístico → **revisor decide** | depois de `assembled`, antes do revisor | **zero** |
| Hook × abertura | `ecoa()`, que já existe → **revisor decide** | idem | **zero** |
| Frases genéricas | banlist + humanizador | fim, como hoje | inalterado |

**A peça inteira não acrescenta uma chamada de LLM.** Estudos e grandeza pegam carona na chamada
Grok que já roda; os detectores são determinísticos; o revisor e o humanizador já existem.

### 4.4 Onde esta peça se afasta das decisões, e por quê

As decisões dizem, sobre o eco numérico: *"entra no `slopLint`, reusando o retry cirúrgico de
`lib/pipeline/humanize.ts` — sem etapa nova"*. E, três linhas abaixo: *"Quem decide diferenciar ou
cortar é o revisor."* **As duas frases não podem ser ambas verdadeiras**, e o código diz qual cai.

`LintViolation` é `{ label, match, severity }` (`slop-lint.ts:3-7`) — **sem offset, sem posição**. O
aplicador do retry faz `current.split(alvo.match).join(substituto)` (`humanize.ts:101`): substitui
**todas** as ocorrências pelo mesmo texto. Para um defeito relacional — cujo problema *é* a mesma
string em N lugares — isso é o avesso do conserto: trocaria as três aparições de `400%` pela mesma
frase nova.

Somando ao dado de §1.1 (três em quatro sinais são texto bom), o retry cirúrgico é a ferramenta
errada duas vezes: erra o alvo e erra o julgamento.

**Decisão desta peça:** o eco numérico **mora em `slop-lint.ts`** (a casa que a decisão indicou) e
**não alimenta o retry cirúrgico**. Ele é `severity: "warn"` — que por construção já não entra na
mira do retry (`humanize.ts:66` filtra `block`) nem no contador salvo (`index.ts:315`) — e sua saída
é entregue ao **revisor**, que é quem a própria decisão nomeia como juiz. "Sem etapa nova" fica
preservado: nenhum estágio é criado, o veredito pega carona no revisor que já roda.

## 5. Material — o que adiciona

### 5.1 Estudos que corroboram a premissa

O pesquisador ganha uma seção no dossiê, no mesmo padrão da `## CHECAGEM` que já existe:

```
## ESTUDOS
- <achado em uma linha> — <instituição/publicação>, <ano> — <URL>
```

Instrução em `agents/pesquisador.md` (hoje 19 linhas, define 6 seções). A busca pega carona na
chamada única de `research` (`agents.ts:385`, `tools: [{ type: "web_search" }]`) — **sem ida e volta
nova**, conforme a decisão.

**Portão determinístico, sem LLM.** A seção é recortada por regex de heading, reusando o padrão de
`checagemSection` (`draft.ts:116-123`), e cada linha passa por:

1. **Tem URL bem-formada?** Não → descartada.
2. **O domínio está em `fontes-autoritativas.json`?** Não → entra rebaixada e marcada, não descartada
   — o JSON tem 14 domínios por tier e não é exaustivo.

Linhas descartadas vão para `proveniencia.estudos_descartados` **com o motivo**. Nenhum corte
silencioso (§3.1).

**O que este portão NÃO faz:** abrir a URL e confirmar que a página existe e diz aquilo. Isso é a
peça 3. Aqui se verifica **forma e procedência**, não conteúdo — e o spec diz isso em voz alta em
vez de deixar o leitor supor que "verificável" significa "verificado". Ver §11.2.

**Risco assumido, registrado nas decisões:** pedir ao Grok um estudo que corrobore a premissa é
confirmação enviesada por construção. O portão de URL reduz a citação inventada, não o viés. O que
mitiga o viés é a premissa já ser derivada antes da pesquisa (`premissa.ts:46-47`,
`index.ts:107-109`) e a `## CHECAGEM` do revisor tratar "contestado" como eliminatório
(`draft.ts:275-281`).

### 5.2 Senso de grandeza

**Não se escreve instrução nova: promove-se a que existe.** `agents.ts:331` já pede "comparações em
ESCALA HUMANA BRASILEIRA (R$, salários mínimos, tempo de trabalho, preço de coisas do cotidiano) que
façam o número ser sentido, não só lido" — trancada no ramo de modelagem sem tema (§1.2).

Move para `agents/pesquisador.md`, que roda nos dois modos. A comparação de escala passa a ser
**default para todo número relevante do dossiê**, como as decisões pedem.

**Superlativo só com fonte.** Comparação de escala é conta sobre número que a pesquisa trouxe —
barata e segura. Superlativo ("o maior", "o primeiro", "o único") é alegação factual, e alegação
factual sem fonte é o que a peça 3 existe para pegar. Aqui, o mínimo: o pesquisador não emite
superlativo sem fonte datada, e o revisor trata superlativo sem fonte como a `## CHECAGEM` já trata
"contestado". Verificação completa é peça 3 — **não duplicar aqui**.

A hierarquia tier 1/2/3 (`agents.ts:335`) é promovida junto, pelo mesmo motivo e no mesmo movimento.

## 6. Veredito — o que remove

### 6.1 Eco numérico

**Detector determinístico**, em `lib/pipeline/slop-lint.ts`. Roda sobre `assembled`
(`index.ts:263-270`), antes de `critiqueAndRewrite` (`index.ts:272`).

Regex de quantidade (o mesmo eixo já validado na consulta de §1.1: dígito + escala/percentual),
normalizada, agrupada por valor. Sinaliza quando o mesmo valor — ou dois valores próximos demais —
aparece em frases diferentes.

**A âncora é a frase, nunca o número.** Precedente no próprio arquivo: o detector de parataxe devolve
a frase inteira, com o comentário em `slop-lint.ts:159-161` explicando exatamente por quê — *"o
`match` é substituído LITERALMENTE pelo passe cirúrgico, então precisa ser a frase inteira"*.
Devolver `"60%"` faria o aplicador trocar as duas ocorrências pelo mesmo texto.

**Guardas obrigatórias**, herdadas do que a parataxe já precisou (`slop-lint.ts:146`):
- pular linhas de `## FONTES`, URLs e datas `dd/mm/aaaa` — senão todo roteiro acusa;
- pular a seção `## VARIACOES_DE_HOOK`, que repete conteúdo por definição.

**A saída vai ao revisor, não ao retry.** No bloco dinâmico da revisão (`draft.ts:273-282`), como
lista de decisão:

```
QUANTIDADES REPETIDAS (o ouvinte não distingue dois fatos com o mesmo número):
- "60%" aparece em 2 frases:
    1. "…mais de 60% de quem compra tem entre 18 e 24 anos."
    2. "…60% dizem que gostariam de ter vivido numa época menos conectada."
  Se forem fatos diferentes, diferencie ou corte um. Se o retorno se paga
  (fecha arco, arma contraste, vira virada), MANTENHA.
```

**A regra não é "não repita".** É **"repetição tem que se pagar"**: o retorno adiciona informação,
virada ou fechamento. O `400%` de §1.1 se paga; o `60%` não. Instruir "não repita" produziria os dois
cortes errados — e é por isso que a instrução ao revisor termina em MANTENHA, não em corte.

O sinal é registrado em `proveniencia.ecos_numericos` com o que o revisor fez, para que a taxa de
falso positivo seja mensurável em vez de estimada.

### 6.2 Hook × abertura do corpo

**Custo próximo de zero: a função existe e está testada** — mas ainda **não commitada** (§1.3). Esta
sub-peça depende de o WIP do eco de abertura entrar na história do repo; enquanto não entrar, o custo
não é zero, é "reescrever o que já está pronto no disco de alguém".

Passa a ser chamada também para o par que nunca foi olhado: **hook escolhido × primeiro bloco do
corpo**, antes da montagem em `index.ts:263-270` (onde o hook é colado na frente do corpo de
propósito, `draft.ts:366-369`).

Ecoou → entra na mesma lista de decisão do revisor. Não descarta, não reescreve: hook e abertura
ecoarem *pode* ser costura deliberada. O revisor decide.

### 6.3 Frases genéricas

**Nada a construir.** `vm_banned_phrases` já existe (32 ativas), já entra no lint
(`context.ts:65` → `slop-lint.ts:15`) e nos prompts com motivo (`draft.ts:63-77`). A peça 1 abre o
canal para alimentá-la em sessão — é ela quem faz o trabalho aqui.

Resíduo semântico (a frase batida que nenhuma regex pega) fica com o revisor, como hoje.

**Uma correção de higiene, herdada da peça 1:** `validarPadrao` (`lib/regex-safety.ts:5`) existe e
**não é usada pelo slop-lint** — `slop-lint.ts:14-18` compila regex do banco com `try/catch` e
`continue`. Com a peça 1 permitindo cadastrar padrão em sessão, a validação passa a valer a pena no
caminho de escrita. Uma linha.

## 7. Tratamento de erro

| Falha | Tratamento |
|---|---|
| `research` falha | já é fail-soft: `catch` devolve `""` e a geração segue (`agents.ts:404-407`). Sem `## ESTUDOS`, o dossiê fica como hoje |
| Seção `## ESTUDOS` ausente ou vazia | não é erro. Nem toda premissa tem estudo. Registrar ausência no trace, não avisar na tela |
| Todos os estudos descartados por falta de URL | registrar no trace **com os textos descartados** — é o sinal de que o Grok está inventando referência, e some se só o contador for salvo |
| Detector de eco lança | `slopLint` inteiro é síncrono e puro; envolver o detector novo em `try/catch` que devolve `[]`, no padrão de `slop-lint.ts:14-18`. Detector com bug nunca derruba geração |
| Eco com dezenas de sinais | teto na lista entregue ao revisor; excedente vai ao trace. Nenhum corte silencioso |
| Hook não separável do corpo | `stripLeadingHook` é fuzzy e pode não cortar (`draft.ts:381`). Nesse caso o "primeiro bloco" é o próprio hook e a comparação daria eco de 100% — detectar identidade e pular, em vez de sinalizar |

## 8. Checagem

`tests/` já existe (vitest). Os menores testes que falham se a lógica quebrar:

1. **Eco numérico detecta e ancora certo** — mesmo valor em duas frases é sinalizado, e o `match`
   devolvido é a **frase inteira**, não o número. É o teste que impede a regressão que quebraria o
   retry cirúrgico se alguém ligar o detector nele.
2. **Guardas do eco** — números em `## FONTES`, datas e `## VARIACOES_DE_HOOK` não acusam. Usar como
   fixture os quatro casos reais de §1.1: `60%` acusa; `400%` e `37,5%` acusam **e devem sair como
   `warn`**, provando que o caminho não os corrige sozinho.
3. **Portão de estudos** — linha sem URL não entra; linha com URL entra; descarte aparece na lista de
   descartados com motivo.
4. **Hook × abertura tem call site** — no espírito do teste "todo destinatário tem consumidor" da
   peça 1: `ecoa` é chamado com o hook principal em algum lugar de `lib/pipeline/`. Sem isso, alguém
   escreve o detector e esquece de ligá-lo, e ele vira o `taughtBlock` de 2026 — construído,
   correto, e nunca chamado.

Não há teste de acerto do julgamento do revisor sobre um eco: é julgamento de escrita, e o portão
dele é o usuário.

## 9. Fora de escopo, deliberadamente

- **Confirmar que a URL do estudo existe e diz aquilo** — peça 3. Aqui: forma e procedência.
- **Corrigir eco numérico automaticamente** — §4.4. Três em quatro sinais são texto bom.
- **Criar a entidade "sub-hook"** — §1.4. Não existe e não precisa existir.
- **Detector de repetição semântica** (mesma ideia, outras palavras) — fica com o revisor. Detector
  determinístico não alcança, e LLM aqui seria etapa nova.
- **UI para os sinais de eco** — o revisor consome; o usuário vê o resultado. Se a taxa de falso
  positivo medida em `proveniencia.ecos_numericos` justificar, vira tela depois.
- **Mudar `LintViolation` para carregar offset** — resolveria a substituição global de
  `humanize.ts:101`, mas é refactor do aplicador com 47 roteiros de histórico e nenhum defeito
  reportado. Registrado como dívida em §11.4.

## 10. Riscos conhecidos

1. **Falso positivo do eco vira ruído.** Medido, não estimado: 3 em 4 na amostra de §1.1. Mitigado
   por `warn` + revisor decide + a instrução terminar em MANTENHA. Se a taxa não cair, o próximo
   passo é apertar o detector (só valores idênticos, distância mínima entre frases), não corrigir
   automático.
2. **Estudo inventado com URL plausível.** O portão valida forma e domínio, não existência. Um link
   morto de domínio tier 1 passa. É risco de marca do cliente, e o spec o deixa explícito em vez de
   dar a impressão de que "verificável" foi verificado. Fecha na peça 3.
3. **Dossiê engorda e o roteirista recebe íntegro** (`draft.ts:187`, sem `slice`). `## ESTUDOS` e mais
   comparações de escala aumentam o bloco não-cacheado. Medir tokens do system dinâmico antes e
   depois; se crescer demais, o corte certo é truncar `## ESTUDOS` (material opcional), nunca a
   `## CHECAGEM` — "truncar a checagem é o mesmo que não checar" (`draft.ts:273-274`).
4. **Substituição global do retry.** `humanize.ts:101` troca todas as ocorrências de um `match`.
   Esta peça o contorna (frase inteira como âncora, `warn` fora da mira), não o conserta. Continua
   valendo para os detectores atuais. Dívida registrada.
5. **Promover instruções do `checagemBlock` muda a geração comum.** Hoje 100% das gerações com tema
   digitado não veem escala nem hierarquia de fontes. Promover é a mudança certa e **é uma mudança
   de comportamento** — diferente da peça 1, aqui não há teste de equivalência possível, porque o
   ponto é justamente mudar. Avaliar em roteiro real antes de considerar fechada.

## 11. Contexto de release

Parte do pacote **2.0**, peça 2 de 4. Depende da peça 1 ter mergeado (banlist alimentada em sessão,
`proveniencia` no trace, call site de lições no revisor). Não cria migration: tudo o que grava vai
para `pipeline_trace.proveniencia`, campo que a peça 1 cria.

O alinhamento de `package.json` / `NEXT_PUBLIC_APP_VERSION` (`next.config.ts:18`) e a mensagem de
update (`codex-updates/state.json`) são do pacote, tratados na peça 1.

---

## 12. Correções ao spec, apuradas em 2026-08-16

Escritas aqui em vez de editar as seções acima, para o registro do que mudou não sumir.

**§1.3 e §6.2 estão desatualizados: o WIP do eco de abertura FOI commitado.** `semEcoDaAbertura`,
`ecoa`, `conteudo` e `primeiraFrase` estão em `lib/pipeline/draft.ts:391-429` desde o commit
`93ade70`, com os testes em `tests/parse-sections.test.ts`. A ressalva de §6.2 ("o custo não é zero,
é reescrever o que já está pronto no disco de alguém") **caducou** — o custo é zero de verdade
agora. `ecoa` continua **não exportada**, e é isso que a Task 4 resolve.

**§5.2 tem um problema que o spec não viu: a hierarquia de fontes NÃO pode ir para
`agents/pesquisador.md`.** A linha `agents.ts:359` interpola a lista de domínios do JSON em tempo de
execução (`${lista("tier_1")}`). A persona é um `.md` lido do disco (`agentPrompt`), sem
interpolação. Mover o texto para lá exigiria **congelar os domínios no markdown**, e aí
`fontes-autoritativas.json` deixaria de ser fonte única — passaria a haver duas listas divergindo em
silêncio. A escala humana (`agents.ts:355`) não tem esse problema: é prosa pura.

**Resolução:** separar as duas promoções por natureza, não empacotá-las juntas.
- **Escala humana** → `agents/pesquisador.md` (prosa, sem interpolação).
- **Hierarquia de fontes** → função `fontesBlock()` em `agents.ts`, montada do JSON e chamada
  **incondicionalmente** em `research`. Sai de dentro do `checagemBlock` para não duplicar no modo
  modelagem.

**§6.1 precisa de uma leitura literal: o detector NÃO entra dentro de `slopLint()`.** Ele *mora* em
`slop-lint.ts` (a casa dos detectores), mas é exportado à parte e chamado de `index.ts` sobre
`assembled`, **antes** de `critiqueAndRewrite`. `slopLint()` só roda dentro de `humanize`
(`humanize.ts`), que acontece **depois** da revisão — pendurar o eco lá dentro entregaria o sinal
tarde demais para o revisor, que é justamente quem a decisão 4 nomeia como juiz.

---

# Plano de implementação

> **Para executores agênticos:** um subagente por task, TDD (escreve o teste, confirma que falha,
> implementa, confirma que passa). Subagente **não** roda `git add` nem `git commit`.

**Goal:** dar ao roteirista material melhor antes de escrever (estudos com URL, números já
comparados a uma escala) e dar ao revisor sinais determinísticos depois (eco numérico, hook ×
abertura) — sem uma chamada de LLM a mais e sem um parágrafo a mais no prompt do roteirista.

**Arquitetura:** adição e remoção em lados opostos do roteirista (§4.2). O que adiciona pega carona
na chamada Grok que já roda; o que remove é determinístico e vai ao revisor como lista de decisão.

**Stack:** Next.js 16, vitest, Grok via `grokClient()`. Sem migration — tudo que grava vai para
`pipeline_trace.proveniencia`, campo que a peça 1 criou.

## Global Constraints

- **Nenhuma chamada de LLM nova.** Se uma task precisar de uma, o desenho está errado.
- **O prompt do roteirista não ganha um parágrafo.** `buildDynamicSystemBlock` fica intocado.
- **Detector determinístico sinaliza, não decide** (§3.3). Toda saída nova é `warn` e vai ao revisor.
- **Nenhum corte é silencioso.** Estudo descartado, eco excedente e sinal cortado por teto vão para
  `pipeline_trace.proveniencia` com o motivo.
- **A âncora de substituição é sempre a frase inteira, nunca o fragmento** (`slop-lint.ts:159-161`).
- Baseline da suíte: **23 arquivos, 248 testes**. Gate: `npx tsc --noEmit && npx eslint . && npm run check && npm test`.

---

### Task 1: Promover escala humana e hierarquia de fontes para toda geração

Hoje as duas só rodam em modelagem sem tema (§1.2) — 100% das gerações com tema digitado nunca
viram nenhuma das duas.

**Files:**
- Modify: `agents/pesquisador.md` (escala humana, prosa)
- Modify: `lib/pipeline/agents.ts` — nova `fontesBlock()`; `checagemBlock` perde a linha de
  hierarquia; `research` passa a montar a entrada por função pura
- Test: `tests/research-input.test.ts`

**Interfaces:**
- Produces: `fontesBlock(): string`; `montarEntradaPesquisa(ctx, adapt?): string` (pura, exportada —
  é ela que o teste lê, para não precisar de rede).

- [ ] **Passo 1: escrever o teste que falha**

O teste que importa é o de **paridade entre os dois modos**: a hierarquia de fontes aparece na
entrada com tema digitado E em modelagem sem tema, e aparece **uma vez só** nos dois casos
(regressão óbvia: duplicar no modo modelagem, onde `checagemBlock` já a tinha).

- [ ] **Passo 2: rodar e confirmar que falha** — hoje a hierarquia some no modo com tema.

- [ ] **Passo 3: extrair `montarEntradaPesquisa`** de dentro de `research` (`agents.ts:390-400`),
      sem mudar o texto montado. É refactor puro; o teste de paridade ainda falha.

- [ ] **Passo 4: criar `fontesBlock()`** lendo `fontes-autoritativas.json`, com o mesmo
      `slice(0, 14)` de hoje, e chamá-la incondicionalmente. **Remover** a linha de hierarquia de
      `checagemBlock` (`agents.ts:359`) — senão duplica no modo modelagem.

- [ ] **Passo 5: mover a escala humana** de `agents.ts:355` para `agents/pesquisador.md`, como item
      da lista "O que entregar". **Remover da origem**, não copiar.

- [ ] **Passo 6: gate + commit**

```
feat(pesquisa): escala humana e hierarquia de fontes em toda geracao
```

**Atenção (§10.5):** isto **muda o comportamento da geração comum** de propósito, e não há teste de
equivalência possível — o ponto é justamente mudar. Avaliar num roteiro real antes de dar por
fechada.

---

### Task 2: Seção `## ESTUDOS` com portão determinístico de URL

**Files:**
- Modify: `agents/pesquisador.md` (a seção nova)
- Create: `lib/pipeline/estudos.ts`
- Test: `tests/estudos.test.ts`

**Interfaces:**
- Produces: `extrairEstudos(dossie: string): { aceitos: Estudo[]; descartados: { linha: string; motivo: string }[] }`
  onde `Estudo = { texto: string; url: string; dominio: string; tier: 1 | 2 | 3 | null }`.

- [ ] **Passo 1: escrever o teste que falha**

Casos mínimos: linha **sem URL** vai para `descartados` **com motivo**; linha com URL entra; domínio
fora do `fontes-autoritativas.json` entra **marcado com `tier: null`, não descartado** (§5.1 — o
JSON tem 14 domínios por tier e não é exaustivo); dossiê sem a seção devolve as duas listas vazias
sem lançar.

- [ ] **Passo 2: rodar e confirmar que falha**

- [ ] **Passo 3: implementar.** O recorte da seção reusa o padrão de `checagemSection`
      (`draft.ts:116-123`), **inclusive o `(?![\s\S])` no lugar de `$`** — com a flag `m` o `$`
      casaria o fim da primeira linha e devolveria só o primeiro estudo. O casamento de domínio é
      por **sufixo** (`sec.gov` casa `data.sec.gov`), como o `_comentario` do JSON já manda.

- [ ] **Passo 4: instrução em `agents/pesquisador.md`** no formato de §5.1, no mesmo padrão da
      `## CHECAGEM` que já existe.

- [ ] **Passo 5: ligar em `index.ts`** — os descartados vão para
      `proveniencia.estudos_descartados` **com os textos**, não só o contador (§7): é o sinal de que
      o Grok está inventando referência, e some se só o número for salvo.

- [ ] **Passo 6: gate + commit**

```
feat(pesquisa): secao ESTUDOS com portao de URL (forma e procedencia, nao conteudo)
```

**O que este portão NÃO faz:** abrir a URL e confirmar que a página existe. Isso é a peça 3. O
comentário no código tem que dizer isso, senão alguém lê "verificável" como "verificado".

---

### Task 3: Detector de eco numérico

**Files:**
- Modify: `lib/pipeline/slop-lint.ts`
- Test: `tests/eco-numerico.test.ts`

**Interfaces:**
- Produces: `ecosNumericos(text: string): EcoNumerico[]` onde
  `EcoNumerico = { valor: string; frases: string[] }`. **Exportada à parte, NÃO chamada de dentro de
  `slopLint()`** (§12): `slopLint` só roda no humanizador, depois da revisão — tarde demais.

- [ ] **Passo 1: escrever o teste que falha, com os quatro casos reais de §1.1 como fixture**

`60%`, `400%`, `37,5%` e `2 milhões` — os textos literais estão na tabela de §1.1. Os quatro
**acusam** (o detector não julga); o que o teste trava é que **nenhum deles sai como `block`** e que
o `match`/frase devolvido é a **frase inteira**, nunca o número. É o teste que impede a regressão
que quebraria o retry cirúrgico se alguém um dia ligar o detector nele.

Guardas, cada uma com seu caso: número em linha de `## FONTES` não acusa; data `dd/mm/aaaa` não
acusa; URL não acusa; `## VARIACOES_DE_HOOK` não acusa (repete conteúdo por definição).

- [ ] **Passo 2: rodar e confirmar que falha**

- [ ] **Passo 3: implementar.** Regex de quantidade (dígito + escala/percentual), valor normalizado
      como chave de agrupamento, frases separadas pelo mesmo `split(/(?<=[.!?])\s+|\n+/)` que a
      parataxe já usa (`slop-lint.ts:142`). As guardas reusam o teste de linha de
      `slop-lint.ts:146`. Envolver em `try/catch` que devolve `[]` (§7): detector com bug nunca
      derruba geração.

- [ ] **Passo 4: rodar e confirmar que passa**

- [ ] **Passo 5: commit**

```
feat(lint): detector deterministico de eco numerico (sinaliza, nao corrige)
```

---

### Task 4: Hook × abertura do corpo

**Files:**
- Modify: `lib/pipeline/draft.ts` (exportar `ecoa`)
- Modify: `lib/pipeline/index.ts` (o call site do par principal)
- Test: `tests/hook-abertura.test.ts`

- [ ] **Passo 1: escrever o teste que falha**

Dois testes. O de comportamento: hook que ecoa a abertura é sinalizado; hook distinto não é; e —
guarda de §7 — **hook idêntico à abertura é PULADO, não sinalizado** (`stripLeadingHook` é fuzzy e
pode não cortar, `draft.ts:381`; nesse caso o "primeiro bloco" é o próprio hook e a comparação daria
eco de 100% por construção).

E o de **call site**, no espírito do "todo destinatário tem consumidor" da peça 1: `ecoa` é chamada
com o hook principal em algum lugar de `lib/pipeline/`. Sem ele, alguém escreve o detector e esquece
de ligá-lo — e ele vira o `taughtBlock` de 2026: construído, correto e nunca chamado.

- [ ] **Passo 2: rodar e confirmar que falha** — `ecoa` não é exportada hoje (`draft.ts:415`).

- [ ] **Passo 3: exportar `ecoa`** e ligar o par principal em `index.ts`, **antes** da montagem do
      `assembled` (`index.ts:263-270`), onde o hook é colado na frente do corpo de propósito.

- [ ] **Passo 4: gate + commit**

```
feat(hook): compara o hook escolhido com a abertura do corpo (o par que nunca foi olhado)
```

---

### Task 5: Entregar os sinais ao revisor

É aqui que a peça deixa de ser detector e vira efeito. Sem esta task, as Tasks 3 e 4 gravam e não
mudam nada — a falha silenciosa que o pacote inteiro combate.

**Files:**
- Modify: `lib/pipeline/draft.ts` (`buildReviewDynamicBlock`)
- Modify: `lib/pipeline/index.ts` (chamar os detectores, passar ao revisor, gravar no trace)
- Test: `tests/sinais-revisor.test.ts`

- [ ] **Passo 1: escrever o teste que falha** — o bloco entregue ao revisor contém as frases do eco
      e **termina em MANTENHA**, não em corte (§6.1). A regra não é "não repita", é "repetição tem
      que se pagar": instruir "não repita" produziria os dois cortes errados de §1.1. Teto na lista
      + excedente contado.

- [ ] **Passo 2: rodar e confirmar que falha**

- [ ] **Passo 3: implementar** o bloco no formato literal de §6.1, dentro de
      `buildReviewDynamicBlock` (que a peça 1 já usa para as lições do revisor).

- [ ] **Passo 4: gravar em `proveniencia.ecos_numericos`** o sinal e o excedente, para que a taxa de
      falso positivo seja **medida e não estimada** (§10.1). É esse número que decide se o detector
      aperta ou afrouxa depois.

- [ ] **Passo 5: gate + commit**

```
feat(revisao): eco numerico e hook x abertura viram lista de decisao do revisor
```

---

### Task 6: Higiene — `validarPadrao` no caminho de escrita do lint

**Files:**
- Modify: `lib/pipeline/slop-lint.ts:12-18`

- [ ] **Passo 1:** trocar o `try/catch` + `continue` por `validarPadrao` (`lib/regex-safety.ts`), que
      a peça 1 criou. Uma linha. Com a peça 1 permitindo cadastrar padrão em sessão, a validação
      passa a valer a pena aqui (§6.3).

- [ ] **Passo 2: gate + commit**

```
fix(lint): regex do banco passa por validarPadrao, como no caminho de ensino
```

---

## Ordem, dependências e portões

| Task | Depende de | Portão |
|---|---|---|
| 1 | — | hierarquia aparece **uma vez** nos dois modos |
| 2 | 1 | descartado carrega motivo e texto |
| 3 | — | os 4 casos de §1.1 acusam, nenhum como `block` |
| 4 | — | hook idêntico à abertura é pulado |
| 5 | **3, 4** | o bloco do revisor termina em MANTENHA |
| 6 | — | suíte verde |

Tasks 1, 3, 4 e 6 são independentes entre si — as candidatas naturais a paralelizar. A 5 é a que dá
efeito às 3 e 4 e não pode ser deixada para depois: sem ela a peça grava e não muda nada.

## Cobertura do spec

| Seção | Task |
|---|---|
| §5.1 estudos + portão de URL | 2 |
| §5.2 senso de grandeza + hierarquia de fontes | 1 |
| §6.1 eco numérico | 3, 5 |
| §6.2 hook × abertura | 4, 5 |
| §6.3 frases genéricas + higiene do `validarPadrao` | 6 (o resto é a peça 1) |
| §7 tratamento de erro | 2 (estudos), 3 (`try/catch`), 4 (identidade), 5 (teto) |
| §8 checagem | 2, 3, 4, 5 |
