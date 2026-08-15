# 015 — Ensino em sessão: explicar, mudar, ensinar

**Tipo:** design spec (a etapa de implementação entra neste mesmo arquivo).
**Data:** 2026-08-15. **Release alvo:** 2.0. **Depende de:** nada.
**É a peça 1 de 4** do pacote 2.0 — e a que carrega a espinha compartilhada pelas outras três.

---

## 1. O problema

O ciclo de aprendizado do CODEX está inteiramente construído e **nunca girou uma volta**.
Números de produção em 2026-08-15 (projeto Supabase `qclvrddrqulgfzccndnl`):

| Métrica | Valor |
|---|---|
| Sessões / roteiros gerados | 44 / 47 (26 só em agosto — o sistema está em uso real) |
| Insights do ETL | 467 |
| Lições extraídas | 28 (14 `edicao`, 14 `correcao`, última em 2026-08-14) |
| **Lições ativas** | **0** |
| Lições criadas via `/ensinar/nova` | 0 — o formulário nunca foi usado |
| Propostas do curador | 0 |
| Pares de calibração pendentes / votos | 94 / 6 |
| Roteiros com `published_url` | 2 de 47 |
| Linhas em `vm_script_performance` | 0 |
| `vm_outcomes` | 0 |

O Professor funciona: extraiu 28 lições, a última ontem. Todas nascem `active:false` e nenhuma
jamais foi ativada. `taughtBlock` (`lib/pipeline/agents.ts:46`) retorna string vazia para todo
agente, em toda geração, desde sempre.

**O padrão, lendo as linhas juntas:** todo mecanismo automático funciona (467 insights, 28 lições
extraídas, 32 frases banidas semeadas). Todo portão que exige ir a algum lugar está em ~0%
(ativação 0/28, ensino manual 0, calibração 6/94, métrica 0/47).

`/ensinar` e `/ensinar/calibracao` são **destinos**, e destino não é visitado.

**Tese da 2.0:** tirar a curadoria dos destinos e colocar no fluxo.

Hoje só se ensina corrigindo — `extractFromEdit` (rating ≥4 + edição substantiva),
`extractFromCorrection` (RewriteBox), `extractFromNotes` (observação no encerramento). Não existe
canal para ensinar declarativamente ("manchete é uma palavra difícil"), e nada do que se ensina
vale na próxima geração.

## 2. Escopo

**Nesta peça:** canal de ensino declarativo com efeito imediato; classificação automática do
destino do ensinamento; roteamento por destinatário; rastro de proveniência; janela única de
explicar / mudar / ensinar.

**Fora desta peça** (peças 2-4 da 2.0, specs próprios): detectores de escrita e busca de estudos
(peça 2); verificação factual do roteiro final (peça 3); Kasparov, chat multi-turno e fila de
pendências conversacional (peça 4).

**Contratos que as outras peças consomem desta:** o classificador de ensino (§5), o roteamento por
destinatário (§6) e o rastro de proveniência (§4). São construídos aqui com um consumidor real
validando a forma, em vez de como camada abstrata sem uso.

## 3. Princípios

1. **Gosto se ensina, estrutura se codifica.** Não codificar regra de escrita que o usuário
   conseguiria ensinar caso a caso.
2. **Falha silenciosa é o defeito central.** A moeda desta peça é confiança. Ensinar e não ter
   ensinado é pior que não ter a feature. Todo corte, teto ou descarte é registrado e visível.
3. **A verdade ou é recuperável, ou não é dita.** Explicação de decisão sai do rastro. Quando o
   rastro não determina nada, a resposta é "não determinado" — nunca uma justificativa plausível
   inventada na hora.

## 4. Rastro de proveniência

### 4.1 O que passa a ser gravado

Sem tabela nova. Um campo em `vm_generated_scripts.pipeline_trace`:

```
proveniencia: {
  blocos: {
    roteirista: { premissa, narrativa_id, playbook_ref, licoes: [{id, titulo}],
                  vocabulario: [...], prefs_cliente: [...] },
    hook:       { licoes: [...], mecanismos_ranking, prefs_calibracao },
    revisao:    { checklist_ref, licoes: [...] },
    comando:    { licoes: [...] },
  },
  critica: string,            // parts[0] de lib/pipeline/critique.ts:40 — hoje descartado
  hooks_descartados: [...],   // filtrarCandidatos (agents.ts:780) hoje só faz console.warn
  bob: [{ trecho, instrucao, pesquisou, at }],
}
```

**Regra de tamanho — obrigatória:** conteúdo estático entra por referência, nunca por cópia.
Playbook já tem `slug+version` em `fingerprint.playbook_slugs_versions`; lição entra como
`{id, titulo}`, nunca texto integral; dossiê e transcrição não entram. Só o volátil daquela run vai
literal. Mantém o trace na casa dos KB.

**Custo de escrita: zero chamadas de LLM.** É serialização de objetos que `buildDynamicSystemBlock`
(`lib/pipeline/draft.ts:196`) e as montagens irmãs já produzem em memória e descartam. `critica` e
`hooks_descartados` são conteúdo que o sistema já paga para gerar e joga fora.

### 4.2 Trecho → etapa (determinístico)

```
frase ∈ assembled             → roteirista escreveu
frase ∈ revised, ∉ assembled  → revisor reescreveu    → causa em `critica`
frase ∈ final,   ∉ revised    → humanizador           → causa em `slop_lint_violations`
frase ∉ nenhum                → pós-save: Bob (log `bob`) ou edição humana (`roteiro_original`)
```

Comparação por **pertencimento de sentença**, não algoritmo de diff nem dependência nova. Sentença é
a granularidade da seleção humana.

`assembled`, `revised` e `final` **já existem** em `pipeline_trace` hoje, então a atribuição de etapa
funciona **retroativamente** nos 47 roteiros já gravados. Apenas `blocos`, `critica`,
`hooks_descartados` e `bob` valem dali para frente.

### 4.3 Etapa → resposta

Uma chamada, `ANALYST_MODEL` com effort baixo. Entrada: `{ trecho, etapa, blocos daquela etapa,
critica ou violação conforme a etapa, log do Bob }`. Saída por tool forçada:

```
{ etapa,
  causa: 'licao' | 'playbook' | 'vocabulario' | 'premissa' | 'narrativa'
       | 'violacao' | 'instrucao_sua' | 'nao_determinado',
  referencia: { tipo, id } | null,
  explicacao: string }
```

Duas restrições duras no prompt: **citar apenas o que está no trace**, e **`nao_determinado` é
resposta válida e esperada** — é o caso mais comum para frase que o roteirista escreveu e ninguém
tocou. O roteirista escreve em streaming, sem raciocínio por frase; só se afirma causa quando a
regra está no bloco e o texto obedece a ela.

`referencia.id` é o campo que faz a peça funcionar: é ele que transforma "veio da lição X" em um
botão que abre a lição X para correção.

## 5. Classificador de ensino

Novo agente: `agents/classificador-ensino.md`, tool forçada `registrar_ensinamento`.

**Entrada:** texto cru do usuário + trecho ancorado (opcional) + `referencia.id` do culpado
(opcional, quando vem de um "por quê").

**Saída:**

```
{ regra,          // imperativa, replicável
  casa: 'licao' | 'vocabulario' | 'frase_banida' | 'playbook',
  destinatarios: string[],   // subconjunto de: hook, roteirista, revisao, comando,
                             //                 premissa, storytelling, dados
  dimensao,       // rótulo de filtro em /ensinar; NÃO decide destino.
                  // Permanece restrito ao CHECK atual (hook|storytelling|tema|ritmo|comando|geral):
                  // o classificador escolhe o mais próximo. Como virou só rótulo, imprecisão aqui
                  // é inofensiva — não há migration do enum nesta peça.
  evidencia?,     // o trecho, quando ancorado
  padrao?,        // regex, quando casa = frase_banida
  motivo? }       // quando casa = frase_banida
```

**As palavras cruas do usuário são gravadas sempre, literais** (`vm_lessons.context_note`). Sem isso
não há como auditar interpretação depois — se só a regra interpretada for salva, não se distingue
"ele me entendeu" de "ele me reescreveu".

### 5.1 O que cada casa significa

| Casa | Grava em | Regra |
|---|---|---|
| `licao` | `vm_lessons` + `vm_lesson_learnings` | `origem:'ensino'`, `source_kind:'sessao'`, **`active:true`** |
| `vocabulario` | `vm_client_preferences.vocabulario_evitar` / `vocabulario_usar` | é por cliente por definição; se o escopo for Global, **cai em `frase_banida` com `severity:'warn'`** |
| `frase_banida` | `vm_banned_phrases` | classificador propõe `padrao`, `label`, `motivo`; `severity` default `warn` |
| `playbook` | **proposta**, nunca escrita direta | reusa `components/playbook-proposals.tsx` |

**Regex vai com preview obrigatório.** Regex gerado por LLM entrando num lint de produção é onde se
estraga texto bom em silêncio. A confirmação mostra o padrão e **o que ele casa no roteiro aberto
naquele momento**.

**Playbook nunca é escrito direto.** É documento versionado que todos os agentes leem; um
ensinamento de sessão não reescreve manual. Vira proposta com ativação explícita.

### 5.2 Escopo

Seletor manual **Cliente | Global**. O sistema não pergunta e não infere.

## 6. Roteamento por destinatário

### 6.1 Por que trocar

`vm_lesson_learnings.dimensao` é um CHECK com 6 valores (`hook|storytelling|tema|ritmo|comando|geral`).
O vocabulário de análise em uso é maior (contrastes, linguagem, apelo emocional). Uma lição sobre
apelo emocional em hooks seria arquivada como `geral` — e `geral` só é entregue a roteirista,
premissa e dados. **Nunca chegaria ao agente de hook.** Lição ensinada, confirmada, ativa, e
invisível para o agente que precisava dela: falha silenciosa, exatamente o defeito que a peça
combate.

A pergunta "quem precisa saber disto?" é mais respondível que "que dimensão é esta?", e não exige
migration a cada palavra nova do vocabulário.

### 6.2 Migration

```sql
alter table vm_lesson_learnings add column destinatarios text[] not null default '{}';

update vm_lesson_learnings set destinatarios = case dimensao
  when 'hook'         then '{hook,dados}'
  when 'storytelling' then '{storytelling,dados}'
  when 'tema'         then '{storytelling,premissa,dados}'
  when 'ritmo'        then '{roteirista,dados}'
  when 'comando'      then '{comando,dados}'
  when 'geral'        then '{roteirista,premissa,dados}'
end;

create index on vm_lesson_learnings using gin (destinatarios);

-- origem ganha 'ensino'; vm_lessons.source_kind ganha 'sessao'; vm_lessons.transcript vira nullable
```

O backfill reproduz exatamente o mapa vigente (`agents.ts:46` + call sites em `agents.ts:485,757,839`,
`draft.ts:214`, `premissa.ts:65`, `agents.ts:136`). As 28 lições existentes atravessam sem mudança de
comportamento: a migration não altera nada em produção, apenas destrava o que vem depois.

`transcript` vira nullable porque um ensinamento declarativo em sessão não tem transcrição.

### 6.3 Carregamento e teto

`lib/pipeline/context.ts:112` **perde o `.slice(0, 12)`**. Carrega todas as lições ativas elegíveis
(global, ou do cliente da sessão; em `modoModelagem` só as globais, como hoje).

`taughtBlock(ctx, agente, n)` passa a filtrar por `destinatarios` contém agente, em vez de lista de
dimensões.

**`revisao` precisa ganhar call site, senão é no-op silencioso.** Hoje o revisor não recebe lição
nenhuma — `critique.ts` só vê o `checklist`. Se o classificador puder emitir `revisao` como
destinatário sem que `critiqueAndRewrite` (`lib/pipeline/critique.ts:10`) chame `taughtBlock`,
ensinar o revisor grava e não produz efeito: exatamente a falha que esta peça combate. Portanto
**adicionar a chamada em `critique.ts` faz parte deste plano**.

Ganho colateral: o revisor passa a ser ensinável pela primeira vez. Os sete destinatários válidos
são `hook`, `roteirista`, `revisao`, `comando`, `premissa`, `storytelling`, `dados` — e todos, após
esta mudança, têm call site real. O humanizador fica de fora de propósito: o trabalho dele é
mecânico (slop-lint), não de julgamento.

Teto passa a ser **por destinatário (8)**, não global (12). Com 0 lições ativas hoje ele não vincula
tão cedo. Quando vincular, o excedente é gravado em
`proveniencia.blocos.<agente>.licoes_excedidas` e exibido em `/ensinar`.

**Não se constrói UI de gestão de fila nesta peça** — constrói-se quando o teto deixar de ser
teórico. O requisito aqui é apenas que o corte nunca seja silencioso.

### 6.4 Duas classes de lição

- Confirmada pelo usuário na sessão → **`active:true`** direto. A confirmação é a curadoria.
- Extraída por máquina (`edicao`, `correcao`) → continua `active:false` e continua em `/ensinar`.

As 28 lições existentes **não são ativadas por esta migration** — ninguém as confirmou. Ficam como
fila a ser drenada conversacionalmente na peça 4, junto dos 94 pares de calibração.

## 7. Interface

### 7.1 O gesto

O popover flutuante de seleção (`components/session-view.tsx:1295` em leitura, `:1226` em edição)
deixa de ter um verbo e passa a ter três: **Por quê? · Mudar · Ensinar**.

Três botões, não um menu: a seleção já custou um gesto. Os `onMouseDown`/`onTouchStart` com
`preventDefault()` que impedem a seleção de colapsar permanecem inalterados.

**Entrada sem seleção:** botão "Ensinar" no header sticky do `ScriptCard`
(`session-view.tsx:914`), ao lado de Editar / Copiar. É o caminho de ensinamentos que não são sobre
trecho nenhum. Entrada global fora da sessão fica para a peça 4.

Um único `<dialog>` nativo com três modos, no padrão `useClassVideosDialog`
(`components/class-videos-dialog.tsx:26`, hook `{open, dialog}`), porque é chamado de três pontos.
O projeto não usa shadcn/Radix — `<dialog>` nativo é o padrão existente
(`client-prefs-editor.tsx:103`, `report-problem.tsx:72`, `session-view.tsx:1372`).

### 7.2 Modo "Por quê"

Exibe o selo da etapa ("o revisor reescreveu isto"), a explicação, e a referência como chip
clicável ("lição: abrir com número concreto").

Duas ações: **Ensinar algo sobre isto** (troca para o modo Ensinar já carregado com a referência) e,
quando há culpado, **Corrigir esta lição** (edita título/descrição ou desativa, inline).

Quando `causa = nao_determinado`, diz literalmente: "Nada no prompt determinou esta frase. Foi
escolha do roteirista." E oferece Ensinar do mesmo jeito.

### 7.3 Modo "Mudar"

O Bob de hoje, inalterado (`BobModal` em `session-view.tsx:1331`, `BobInlinePanel` em `:732`).

### 7.4 Modo "Ensinar"

Texto cru → classificação (~3s, spinner; **sem SSE** — chamada curta com saída estruturada) →
painel de confirmação:

```
Você disse:      "manchete é uma palavra difícil"          ← literal, sempre visível
Entendi como:    [Evitar "manchete"; usar "notícia"…]      ← editável
Vai para:        (vocabulário) (frase banida) (lição) (playbook)
Quem recebe:     [roteirista ×] [revisor ×] [+ hook]
Escopo:          ( ) Cliente   (•) Global
Casa 3 trechos no roteiro aberto:                          ← só quando casa = frase_banida
   "…a manchete dizia…"   "…manchete de jornal…"   "…virou manchete…"
```

A confirmação é **sempre** exibida, não apenas quando o sistema está inseguro. Confiança
auto-declarada de LLM é ruim e mede a coisa errada; e o objetivo é treino, não só captura de erro.
Como a classificação já ocorreu, exibi-la não custa chamada adicional.

Mostrar as palavras cruas ao lado da interpretação é o mecanismo pelo qual o usuário verifica se foi
compreendido.

Exibir os destinatários é o que torna a falha de roteamento não-silenciosa.

Botão: **"Confirmar — vale da próxima geração"**. Não "aplicado". Se houver geração em curso, a
lição não entra nela, e a tela não pode sugerir que entra.

## 8. Tratamento de erro

| Falha | Tratamento |
|---|---|
| Classificação falha ou tool não retorna | erro na tela; **o texto cru permanece no campo**; botão de repetir. Nunca descartar o que o usuário digitou |
| Escrita parcial (`vm_lessons` grava, `vm_lesson_learnings` falha) | **RPC transacional `vm_gravar_ensinamento`** faz as duas em uma transação. Lição órfã significa "acreditei que ensinei e não ensinei" — o defeito que a peça existe para matar |
| Regex inválido | validar com `new RegExp()` antes do preview; se lançar, cair para match literal e avisar na tela |
| Regex catastrófico | limite de tamanho + rejeitar quantificador aninhado; preview roda apenas contra o roteiro aberto (entrada limitada). *ponytail: teto conhecido — se o lint um dia rodar sobre corpus, precisa de timeout real* |
| "Por quê" sobre roteiro anterior à 2.0 | a etapa ainda resolve (os 3 snapshots existem), mas não há `blocos`. Responder: "sei que o revisor reescreveu isto, mas este roteiro é anterior ao registro de proveniência." **Não inventar causa** |
| Ensino durante geração em curso | não afeta a run em andamento; o rótulo do botão já comunica isso |

## 9. Checagem

`tests/` já existe (vitest, `tests/parse-sections.test.ts`). Três testes, os menores que falham se a
lógica quebrar:

1. **Mapa de backfill** — toda dimensão produz destinatários não-vazios, e o mapa novo entrega a
   cada agente exatamente o que `taughtBlock` entregava antes da migration. É o teste que garante
   que a migration não muda comportamento.
2. **Atribuição de etapa** — frase presente em cada snapshot resolve para a etapa correta; frase
   ausente dos três resolve para pós-save.
3. **Segurança do regex** — padrão inválido e padrão catastrófico não derrubam o preview nem a
   geração.
4. **Todo destinatário tem consumidor** — o conjunto de destinatários que o classificador pode
   emitir é igual ao conjunto de agentes que efetivamente chamam `taughtBlock`. Sem este teste,
   alguém adiciona um destinatário no futuro sem ligar o call site, e ensinar para ele grava sem
   efeito. É o teste que impede a falha silenciosa de voltar por uma porta nova.

O classificador não ganha teste de acerto: julgamento de LLM não se testa com `assert`, e o portão
dele é a confirmação humana na tela.

## 10. Fora de escopo, deliberadamente

- UI de gestão de fila de lições — quando o teto vincular; hoje são 0 ativas
- Entrada de ensino global fora da sessão — vem com o Kasparov (peça 4)
- Streaming da classificação — chamada de ~3s não justifica SSE
- Teste de acerto do classificador — o portão é humano
- Ativação automática das 28 lições existentes — ninguém as confirmou; drenagem conversacional na
  peça 4

## 11. Riscos conhecidos

1. **Saturação do teto.** Com ensino fácil e imediato, o teto por destinatário pode começar a
   vincular. Mitigado por registro do excedente no trace e exibição em `/ensinar`; não mitigado por
   política de despejo, que é trabalho futuro.
2. **Classificação errada de casa.** O usuário corrige na confirmação. O risco residual é o usuário
   confirmar no automático — mitigado apenas parcialmente, exibindo palavras cruas ao lado da
   interpretação.
3. **Crescimento do `pipeline_trace`.** Mitigado pela regra de referência-em-vez-de-cópia (§4.1). Se
   o trace crescer além de dezenas de KB por roteiro, a causa será violação dessa regra.

## 12. Contexto de release

Parte do pacote **2.0**. `package.json` está em `0.1.0` enquanto a v1.1 shipada veio de env var
(`next.config.ts:18` → `NEXT_PUBLIC_APP_VERSION`); alinhar os dois, senão `pipeline_trace.version`
(`lib/pipeline/index.ts:401`) continua carimbando a versão errada — e é o campo que diz qual código
gerou qual roteiro. A mensagem de update (`codex-updates/state.json`) faz parte do pacote.

Migrations criadas por este plano são aplicadas pelo operador via Supabase MCP após o merge, como as
dos planos 005 e 010.
