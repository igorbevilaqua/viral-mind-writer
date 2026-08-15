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
  when 'storytelling' then '{storytelling,modelagem,dados}'
  when 'tema'         then '{storytelling,modelagem,premissa,dados}'
  when 'ritmo'        then '{roteirista,dados}'
  when 'comando'      then '{comando,dados}'
  when 'geral'        then '{roteirista,premissa,dados}'
end;

create index on vm_lesson_learnings using gin (destinatarios);

-- origem ganha 'ensino'; vm_lessons.source_kind ganha 'sessao'; vm_lessons.transcript vira nullable
```

O backfill reproduz exatamente o mapa vigente. Os **sete call sites** de `taughtBlock` hoje:
`draft.ts:202` (`ritmo,geral`), `agents.ts:485` (`storytelling,tema`), `agents.ts:757`
(`hook`), `agents.ts:839` (`comando`), `premissa.ts:65` (`tema,geral`), **`modelagem.ts:245`
(`storytelling,tema`)** e `formatInsightsForDados` (`agents.ts:136`, agrupa **todo** `taught_*` —
por isso `dados` aparece em todas as linhas do backfill).

As 28 lições existentes atravessam sem mudança de comportamento: a migration não altera nada em
produção, apenas destrava o que vem depois.

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

Ganho colateral: o revisor passa a ser ensinável pela primeira vez. Os **oito** destinatários
válidos são `hook`, `roteirista`, `revisao`, `comando`, `premissa`, `storytelling`, `modelagem` e
`dados` — e todos, após esta mudança, têm call site real. O humanizador fica de fora de propósito:
o trabalho dele é mecânico (slop-lint), não de julgamento.

**`critiqueAndRewrite` muda de assinatura.** Hoje (`critique.ts:38-42`) faz
`text.split(/=====ROTEIRO_REVISADO=====/)`, usa `parts[1]` e **nunca lê `parts[0]`** — que é a
crítica por chapéu. Passa a retornar `{ revised, critica }`. A guarda de fail-soft existente
(reescrita truncada devolve o `draft`) permanece; nesse caminho `critica` vai junto mesmo assim,
porque ela explica por que a revisão falhou.

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

---
---

# Plano de implementação

> **Para executores agênticos:** use `superpowers:subagent-driven-development` (recomendado) ou
> `superpowers:executing-plans`. Os passos usam checkbox (`- [ ]`) para rastreio.

**Goal:** dar ao usuário um canal de ensino declarativo com efeito imediato, e a capacidade de
perguntar por que um trecho do roteiro está como está — recebendo a verdade do rastro, não uma
explicação inventada.

**Arquitetura:** rastro de proveniência serializado de graça a partir do que o pipeline já monta em
memória; roteamento de lições por destinatário em vez de por taxonomia; um classificador que decide
em qual das quatro casas o ensinamento é gravado; uma janela única com três verbos sobre a seleção.

**Stack:** Next.js 16 App Router, React 19, Tailwind v4 puro (sem shadcn/Radix — `<dialog>` nativo),
Supabase, `@anthropic-ai/sdk`, vitest.

## Global Constraints

- **Conteúdo estático no trace entra por referência, nunca por cópia** (§4.1). Lição = `{id, titulo}`.
  Playbook = `slug+version`. Dossiê e transcrição não entram.
- **`nao_determinado` é resposta válida e esperada** do agente de proveniência. Nunca inventar causa.
- **Toda escrita de ensinamento passa por confirmação humana** antes de gravar.
- **Nenhum corte é silencioso.** Teto, descarte ou excedente vai para o trace e para a tela.
- Migration número **0027** (a última existente é `0026_cross_client_hits_url.sql`).
- Testes: `vitest`. Rodar tudo com `npm test`; um arquivo com `npx vitest run <caminho>`.
- Migrations são aplicadas pelo **operador** via Supabase MCP após o merge — o executor não tem
  acesso ao banco.
- Projeto Supabase: `qclvrddrqulgfzccndnl`.

---

### Task 1: Mapa de destinatários + migration 0027

**Files:**
- Create: `lib/pipeline/destinatarios.ts`
- Create: `supabase/migrations/0027_ensino_em_sessao.sql`
- Test: `tests/destinatarios.test.ts`

**Interfaces:**
- Produces: `DESTINATARIOS` (readonly tuple dos 8 agentes), `type Destinatario`,
  `DIMENSAO_DESTINATARIOS: Record<string, Destinatario[]>`, `LEGACY_DIMENSOES: Record<Destinatario, string[]>`.

- [ ] **Passo 1: escrever o teste que falha**

```ts
// tests/destinatarios.test.ts
import { describe, expect, test } from "vitest";
import { DESTINATARIOS, DIMENSAO_DESTINATARIOS, LEGACY_DIMENSOES } from "@/lib/pipeline/destinatarios";

describe("mapa de destinatários", () => {
  test("todo destinatário do backfill é um destinatário válido", () => {
    for (const alvos of Object.values(DIMENSAO_DESTINATARIOS))
      for (const a of alvos) expect(DESTINATARIOS).toContain(a);
  });

  test("toda dimensão produz destinatários não-vazios", () => {
    for (const [dim, alvos] of Object.entries(DIMENSAO_DESTINATARIOS))
      expect(alvos.length, `dimensão ${dim} ficou sem destinatário`).toBeGreaterThan(0);
  });

  // O teste que garante que a migration NÃO muda comportamento: para cada agente, o conjunto de
  // dimensões que ele passa a receber via destinatarios é idêntico ao que taughtBlock lhe entregava.
  test("equivalência com o roteamento legado", () => {
    for (const agente of DESTINATARIOS) {
      const viaNovo = Object.entries(DIMENSAO_DESTINATARIOS)
        .filter(([, alvos]) => alvos.includes(agente))
        .map(([dim]) => dim)
        .sort();
      expect(viaNovo, `roteamento mudou para ${agente}`).toEqual([...LEGACY_DIMENSOES[agente]].sort());
    }
  });
});
```

- [ ] **Passo 2: rodar e confirmar que falha**

Run: `npx vitest run tests/destinatarios.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/pipeline/destinatarios"`

- [ ] **Passo 3: implementar o mapa**

```ts
// lib/pipeline/destinatarios.ts
// Fonte única de verdade do roteamento de lições. O backfill da migration 0027 replica
// DIMENSAO_DESTINATARIOS — se um mudar, o outro muda junto.

export const DESTINATARIOS = [
  "hook", "roteirista", "revisao", "comando",
  "premissa", "storytelling", "modelagem", "dados",
] as const;

export type Destinatario = (typeof DESTINATARIOS)[number];

// `dados` (formatInsightsForDados, agents.ts:136) agrupa TODO taught_* — por isso aparece em
// todas as linhas. `revisao` não aparece: hoje o revisor não recebe lição nenhuma (Task 3 liga
// o call site; lições só chegam nele quando alguém ensinar explicitamente para o revisor).
export const DIMENSAO_DESTINATARIOS: Record<string, Destinatario[]> = {
  hook:         ["hook", "dados"],
  storytelling: ["storytelling", "modelagem", "dados"],
  tema:         ["storytelling", "modelagem", "premissa", "dados"],
  ritmo:        ["roteirista", "dados"],
  comando:      ["comando", "dados"],
  geral:        ["roteirista", "premissa", "dados"],
};

// O que cada agente recebia ANTES da 0027. Existe só para o teste de equivalência.
// draft.ts:202 · agents.ts:485 · agents.ts:757 · agents.ts:839 · premissa.ts:65 · modelagem.ts:245
export const LEGACY_DIMENSOES: Record<Destinatario, string[]> = {
  hook:         ["hook"],
  roteirista:   ["ritmo", "geral"],
  revisao:      [],
  comando:      ["comando"],
  premissa:     ["tema", "geral"],
  storytelling: ["storytelling", "tema"],
  modelagem:    ["storytelling", "tema"],
  dados:        ["hook", "storytelling", "tema", "ritmo", "comando", "geral"],
};
```

- [ ] **Passo 4: rodar e confirmar que passa**

Run: `npx vitest run tests/destinatarios.test.ts`
Expected: PASS (3 testes)

- [ ] **Passo 5: escrever a migration**

```sql
-- supabase/migrations/0027_ensino_em_sessao.sql
-- Peça 1 da 2.0. Roteamento de lições por destinatário + ensino declarativo em sessão.
-- O backfill replica DIMENSAO_DESTINATARIOS de lib/pipeline/destinatarios.ts.

alter table vm_lesson_learnings add column destinatarios text[] not null default '{}';

update vm_lesson_learnings set destinatarios = case dimensao
  when 'hook'         then '{hook,dados}'
  when 'storytelling' then '{storytelling,modelagem,dados}'
  when 'tema'         then '{storytelling,modelagem,premissa,dados}'
  when 'ritmo'        then '{roteirista,dados}'
  when 'comando'      then '{comando,dados}'
  when 'geral'        then '{roteirista,premissa,dados}'
end;

create index vm_lesson_learnings_destinatarios_idx
  on vm_lesson_learnings using gin (destinatarios);

-- origem ganha 'ensino'
alter table vm_lesson_learnings drop constraint if exists vm_lesson_learnings_origem_check;
alter table vm_lesson_learnings add constraint vm_lesson_learnings_origem_check
  check (origem in ('extraido','manual','edicao','curador','correcao','ensino'));

-- vm_lessons: source_kind ganha 'sessao'; transcript vira nullable (ensino declarativo não tem)
alter table vm_lessons drop constraint if exists vm_lessons_source_kind_check;
alter table vm_lessons add constraint vm_lessons_source_kind_check
  check (source_kind in ('video_link','texto','edicao','curador','correcao','sessao'));
alter table vm_lessons alter column transcript drop not null;
```

- [ ] **Passo 6: commit**

```bash
git add lib/pipeline/destinatarios.ts supabase/migrations/0027_ensino_em_sessao.sql tests/destinatarios.test.ts
git commit -m "feat(licoes): mapa de destinatarios + migration 0027 (backfill preserva comportamento)"
```

**STOP:** a migration 0027 precisa ser aplicada pelo operador via Supabase MCP antes da Task 2 ir a
produção. O código da Task 2 lê `destinatarios`; sem a coluna, a query quebra.

---

### Task 2: Roteamento por destinatário em `context.ts` e `taughtBlock`

**Files:**
- Modify: `lib/pipeline/context.ts:112-141`
- Modify: `lib/pipeline/agents.ts:46` (assinatura), `:485`, `:757`, `:839`
- Modify: `lib/pipeline/draft.ts:202`, `lib/pipeline/premissa.ts:65`, `lib/pipeline/modelagem.ts:245`
- Test: `tests/taught-block.test.ts`

**Interfaces:**
- Consumes: `Destinatario`, `DESTINATARIOS` da Task 1.
- Produces: `taughtBlock(ctx: GenerationContext, agente: Destinatario, n?: number): string`.
  Pseudo-insight passa a carregar `destinatarios` no payload.

- [ ] **Passo 1: escrever o teste que falha**

```ts
// tests/taught-block.test.ts
import { describe, expect, test } from "vitest";
import { taughtBlock } from "@/lib/pipeline/agents";
import { DESTINATARIOS } from "@/lib/pipeline/destinatarios";

const ctx = (licoes: { titulo: string; destinatarios: string[] }[]) =>
  ({ insights: licoes.map((l) => ({
      insight_type: "taught",
      payload: { titulo: l.titulo, descricao: "d", destinatarios: l.destinatarios },
    })) } as never);

describe("taughtBlock por destinatário", () => {
  test("entrega só ao destinatário listado", () => {
    const c = ctx([
      { titulo: "A", destinatarios: ["hook"] },
      { titulo: "B", destinatarios: ["roteirista"] },
    ]);
    expect(taughtBlock(c, "hook")).toContain("A");
    expect(taughtBlock(c, "hook")).not.toContain("B");
  });

  test("sem lição para o agente devolve string vazia", () => {
    expect(taughtBlock(ctx([{ titulo: "A", destinatarios: ["hook"] }]), "comando")).toBe("");
  });

  test("respeita o teto por destinatário", () => {
    const muitas = Array.from({ length: 12 }, (_, i) => ({ titulo: `L${i}`, destinatarios: ["hook"] }));
    expect(taughtBlock(ctx(muitas), "hook", 8).split("\n")).toHaveLength(8);
  });

  // Invariante que impede a falha silenciosa de voltar por uma porta nova.
  test("todo destinatário válido tem call site real", async () => {
    const fs = await import("node:fs");
    const fontes = ["lib/pipeline/agents.ts", "lib/pipeline/draft.ts", "lib/pipeline/premissa.ts",
                    "lib/pipeline/modelagem.ts", "lib/pipeline/critique.ts"]
      .map((f) => fs.readFileSync(f, "utf8")).join("\n");
    for (const a of DESTINATARIOS) {
      if (a === "dados") continue; // dados consome via formatInsightsForDados, não taughtBlock
      expect(fontes, `destinatário "${a}" não tem call site de taughtBlock`)
        .toMatch(new RegExp(`taughtBlock\\([^)]*["']${a}["']`));
    }
  });
});
```

- [ ] **Passo 2: rodar e confirmar que falha**

Run: `npx vitest run tests/taught-block.test.ts`
Expected: FAIL — `taughtBlock` ainda espera `string[]` de dimensões; e `revisao` ainda não tem call site.

- [ ] **Passo 3: trocar o carregamento em `context.ts`**

Substituir o bloco de `lib/pipeline/context.ts:112-141`. Muda três coisas: seleciona
`destinatarios`, **remove o `.slice(0, 12)`**, e o pseudo-insight passa a carregar os destinatários
em vez de codificá-los no `insight_type`.

```ts
const { data } = await appDb
  .from("vm_lesson_learnings")
  .select("id, dimensao, destinatarios, titulo, descricao, created_at, vm_lessons!inner(client_id)")
  .eq("active", true)
  .order("created_at", { ascending: false });

const rows = (data ?? [])
  .map((t) => ({ ...t, lessonClient: (t.vm_lessons as { client_id: string | null })?.client_id ?? null }))
  .filter((t) => t.lessonClient === null || (!modoModelagem && t.lessonClient === session.client_id))
  .sort((a, b) => Number(!!b.lessonClient) - Number(!!a.lessonClient));
  // sem .slice(): o teto agora é por destinatário, aplicado em taughtBlock

lessonIds.push(...rows.map((t) => t.id));
taught.push(...rows.map((t) => ({
  insight_type: "taught",
  payload: { titulo: t.titulo, descricao: t.descricao, destinatarios: t.destinatarios ?? [] },
})));
```

- [ ] **Passo 4: trocar a assinatura de `taughtBlock` (`agents.ts:46`)**

```ts
import { type Destinatario } from "./destinatarios";

export function taughtBlock(ctx: GenerationContext, agente: Destinatario, n = 8): string {
  const rows = ctx.insights
    .filter((i) => i.insight_type === "taught")
    .map((i) => i.payload as { titulo: string; descricao: string; destinatarios?: string[] })
    .filter((p) => (p.destinatarios ?? []).includes(agente));
  const usadas = rows.slice(0, n);
  if (!usadas.length) return "";
  // Excedente vai ao trace (Task 4). Nenhum corte é silencioso.
  if (rows.length > n) ctx.licoesExcedidas = { ...(ctx.licoesExcedidas ?? {}), [agente]: rows.length - n };
  return usadas.map((r) => `- ${r.titulo} — ${r.descricao}`).join("\n");
}
```

Adicionar `licoesExcedidas?: Record<string, number>` ao tipo `GenerationContext`.

- [ ] **Passo 5: atualizar os call sites**

| Arquivo:linha | De | Para |
|---|---|---|
| `draft.ts:202` | `taughtBlock(ctx, ["ritmo","geral"])` | `taughtBlock(ctx, "roteirista")` |
| `agents.ts:485` | `taughtBlock(ctx, ["storytelling","tema"])` | `taughtBlock(ctx, "storytelling")` |
| `agents.ts:757` | `taughtBlock(ctx, ["hook"])` (2×) | `taughtBlock(ctx, "hook")` |
| `agents.ts:839` | `taughtBlock(ctx, ["comando"])` (2×) | `taughtBlock(ctx, "comando")` |
| `premissa.ts:65` | `taughtBlock(ctx, ["tema","geral"])` | `taughtBlock(ctx, "premissa")` |
| `modelagem.ts:245` | `taughtBlock(ctx, ["storytelling","tema"])` | `taughtBlock(ctx, "modelagem")` |

`formatInsightsForDados` (`agents.ts:136`) hoje agrupa por `taught_<dim>`; passa a filtrar
`insight_type === "taught"` e agrupar por `payload.dimensao`. Como recebe todas, nada muda no
resultado.

- [ ] **Passo 6: rodar toda a suíte**

Run: `npm test`
Expected: o teste "todo destinatário válido tem call site real" ainda FALHA em `revisao` — é a Task 3.
Todos os outros PASSAM.

- [ ] **Passo 7: commit**

```bash
git add lib/pipeline/ tests/taught-block.test.ts
git commit -m "feat(licoes): roteamento por destinatario, teto por agente, sem slice global"
```

---

### Task 3: Revisor recebe lições e devolve a crítica

**Files:**
- Modify: `lib/pipeline/critique.ts:10-42`
- Modify: `lib/pipeline/index.ts` (chamador de `critiqueAndRewrite`)

**Interfaces:**
- Produces: `critiqueAndRewrite(...): Promise<{ revised: string; critica: string }>`.

- [ ] **Passo 1: mudar o retorno e injetar as lições**

Em `critique.ts`, o split já existe e `parts[0]` já está calculado — só nunca foi lido:

```ts
const parts = text.split(/=====\s*ROTEIRO_REVISADO\s*=====/i);
const revised = (parts[1] ?? "").trim();
const critica = (parts[0] ?? "").trim();   // a crítica por chapéu; hoje descartada
// Guarda fail-soft preservada: reescrita truncada devolve o draft, mas a crítica vai junto —
// ela explica por que a revisão falhou.
return { revised: /##\s*ROTEIRO/i.test(revised) ? revised : draft, critica };
```

E no bloco dinâmico do revisor (`buildReviewDynamicBlock`), adicionar:

```ts
const ensinado = taughtBlock(ctx, "revisao");
// ...
ensinado
  ? `APRENDIZADOS ENSINADOS PELO TIME PARA A REVISÃO (curadoria humana — prevalecem sobre padrões do corpus em conflito):\n${ensinado}\n\n`
  : ""
```

- [ ] **Passo 2: atualizar o chamador em `index.ts`**

```ts
const { revised, critica } = await critiqueAndRewrite(/* args de hoje */);
// `critica` é consumida pela Task 4 (proveniencia.critica)
```

- [ ] **Passo 3: rodar a suíte**

Run: `npm test`
Expected: PASS — inclusive "todo destinatário válido tem call site real", que agora acha `revisao`.

- [ ] **Passo 4: commit**

```bash
git add lib/pipeline/critique.ts lib/pipeline/index.ts
git commit -m "feat(revisao): revisor recebe licoes e devolve a critica (parts[0] deixa de ser descartado)"
```

---

### Task 4: Serializar `proveniencia` no `pipeline_trace`

**Files:**
- Modify: `lib/pipeline/index.ts:316-341` (montagem do `pipeline_trace`)
- Modify: `lib/pipeline/draft.ts`, `agents.ts` — devolver os blocos montados junto do resultado

**Interfaces:**
- Produces: `pipeline_trace.proveniencia` conforme §4.1.

- [ ] **Passo 1: acumular os blocos no contexto**

Cada agente que monta bloco dinâmico registra o que usou. Adicionar ao `GenerationContext`:

```ts
blocos?: Record<string, unknown>;
```

E em cada montagem (ex. `buildDynamicSystemBlock` em `draft.ts:196`), antes de retornar:

```ts
ctx.blocos = { ...(ctx.blocos ?? {}), roteirista: {
  premissa: ctx.premissa?.premissa ?? null,
  narrativa_id: vencedora?.indice ?? null,
  playbook_ref: ctx.playbookVersions ?? [],       // referência, nunca o texto
  licoes: licoesUsadas.map((l) => ({ id: l.id, titulo: l.titulo })),
  vocabulario: ctx.prefs?.vocabulario_evitar ?? [],
  prefs_cliente: ctx.prefs?.proibicoes ?? [],
} };
```

**Regra dura (Global Constraint):** referência, nunca cópia. Playbook entra como `slug+version`;
lição como `{id, titulo}`; dossiê e transcrição não entram.

- [ ] **Passo 2: escrever no trace**

Em `index.ts:316`, dentro do objeto `pipeline_trace`:

```ts
proveniencia: {
  blocos: ctx.blocos ?? {},
  critica,                                   // da Task 3
  hooks_descartados: hookRes.descartados ?? [],  // hoje só console.warn em agents.ts:780
  bob: [],                                   // preenchido pós-save pelas edições do Bob
  licoes_excedidas: ctx.licoesExcedidas ?? {},
},
```

Em `filtrarCandidatos` (`agents.ts:780`), trocar o `console.warn` por acumular os descartados no
retorno.

- [ ] **Passo 3: verificar tamanho numa geração real**

Run: `npm run dev`, gerar um roteiro, e conferir:

```sql
select pg_column_size(pipeline_trace) as bytes,
       pg_column_size(pipeline_trace->'proveniencia') as prov_bytes
from vm_generated_scripts order by created_at desc limit 1;
```

Expected: `prov_bytes` na casa de **poucos KB**. Se passar de ~50KB, a regra de referência foi
violada em algum bloco — achar e corrigir antes de seguir.

- [ ] **Passo 4: commit**

```bash
git add lib/pipeline/
git commit -m "feat(trace): serializa proveniencia (blocos, critica, hooks descartados, excedente)"
```

---

### Task 5: Atribuição de etapa por pertencimento de sentença

**Files:**
- Create: `lib/provenance.ts`
- Test: `tests/provenance.test.ts`

**Interfaces:**
- Produces: `type Etapa = "roteirista" | "revisao" | "humanizacao" | "pos_save"`;
  `atribuirEtapa(trecho: string, snaps: { assembled?: string; revised?: string; final?: string }): Etapa`.

- [ ] **Passo 1: escrever o teste que falha**

```ts
// tests/provenance.test.ts
import { describe, expect, test } from "vitest";
import { atribuirEtapa } from "@/lib/provenance";

const snaps = {
  assembled: "A empresa perdeu um bilhão. O mercado reagiu mal.",
  revised:   "A empresa perdeu um bilhão. O mercado entrou em pânico.",
  final:     "A empresa perdeu um bilhão. O mercado surtou.",
};

describe("atribuirEtapa", () => {
  test("frase presente no assembled → roteirista", () => {
    expect(atribuirEtapa("A empresa perdeu um bilhão.", snaps)).toBe("roteirista");
  });
  test("frase que aparece no revised → revisor", () => {
    expect(atribuirEtapa("O mercado entrou em pânico.", snaps)).toBe("revisao");
  });
  test("frase que só aparece no final → humanizador", () => {
    expect(atribuirEtapa("O mercado surtou.", snaps)).toBe("humanizacao");
  });
  test("frase ausente dos três → pos_save", () => {
    expect(atribuirEtapa("Isto foi você que escreveu.", snaps)).toBe("pos_save");
  });
  test("tolera pontuação e espaço diferentes", () => {
    expect(atribuirEtapa("  a empresa perdeu um bilhão  ", snaps)).toBe("roteirista");
  });
  test("snapshots ausentes (roteiro antigo) não quebram", () => {
    expect(atribuirEtapa("qualquer coisa", {})).toBe("pos_save");
  });
});
```

- [ ] **Passo 2: rodar e confirmar que falha**

Run: `npx vitest run tests/provenance.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/provenance"`

- [ ] **Passo 3: implementar**

```ts
// lib/provenance.ts
export type Etapa = "roteirista" | "revisao" | "humanizacao" | "pos_save";

// Normaliza para comparar por conteúdo, não por formatação: minúsculas, acentos preservados,
// pontuação e espaço colapsados. Basta para pertencimento de sentença.
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();

export function atribuirEtapa(
  trecho: string,
  snaps: { assembled?: string; revised?: string; final?: string },
): Etapa {
  const alvo = norm(trecho);
  if (!alvo) return "pos_save";
  const contem = (s?: string) => !!s && norm(s).includes(alvo);
  if (contem(snaps.assembled)) return "roteirista";
  if (contem(snaps.revised)) return "revisao";
  if (contem(snaps.final)) return "humanizacao";
  return "pos_save";
}
```

- [ ] **Passo 4: rodar e confirmar que passa**

Run: `npx vitest run tests/provenance.test.ts`
Expected: PASS (6 testes)

- [ ] **Passo 5: commit**

```bash
git add lib/provenance.ts tests/provenance.test.ts
git commit -m "feat(proveniencia): atribuicao de etapa por pertencimento de sentenca"
```

---

### Task 6: Agente "por quê"

**Files:**
- Create: `agents/proveniencia.md`
- Create: `lib/pipeline/explain.ts`
- Modify: `lib/actions.ts` (server action `explicarTrecho`)

**Interfaces:**
- Consumes: `atribuirEtapa` (Task 5), `pipeline_trace.proveniencia` (Task 4).
- Produces: `explicarTrecho(scriptId: string, trecho: string): Promise<Explicacao>` onde
  `Explicacao = { etapa: Etapa; causa: Causa; referencia: { tipo: string; id: string } | null; explicacao: string }`
  e `Causa = "licao"|"playbook"|"vocabulario"|"premissa"|"narrativa"|"violacao"|"instrucao_sua"|"nao_determinado"`.

- [ ] **Passo 1: escrever a persona**

`agents/proveniencia.md` — regras não-negociáveis, em prosa imperativa:
1. Você recebe um trecho, a etapa que o produziu e **exatamente** o que aquela etapa via.
2. Cite **apenas** o que está nos dados recebidos. Nunca infira uma causa plausível.
3. Se nada nos dados determina o trecho, responda `causa: "nao_determinado"` e diga que foi escolha
   do agente. **Isso é resposta certa e comum**, não falha sua.
4. Quando a causa for uma lição, devolva o `id` dela em `referencia`.
5. Uma a três frases. Sem elogio ao texto, sem sugestão de melhoria.

- [ ] **Passo 2: implementar a chamada**

`lib/pipeline/explain.ts`: `ANALYST_MODEL`, effort baixo, tool forçada `registrar_explicacao` com o
schema de `Explicacao` (enum de `causa` fechado). Entrada montada conforme a etapa:

| Etapa | O que vai no user content |
|---|---|
| `roteirista` | `proveniencia.blocos.roteirista` |
| `revisao` | `proveniencia.critica` + `blocos.revisao` |
| `humanizacao` | `slop_lint_violations` que casam com o trecho |
| `pos_save` | `proveniencia.bob` + flag de `roteiro_original` |

Roteiro anterior à 2.0 (sem `proveniencia`): **não chamar o modelo.** Devolver direto
`{ etapa, causa: "nao_determinado", referencia: null, explicacao: "Sei que <etapa> produziu este trecho, mas este roteiro é anterior ao registro de proveniência." }`.
Economiza a chamada e é a resposta honesta.

- [ ] **Passo 3: server action**

```ts
// lib/actions.ts
export async function explicarTrecho(scriptId: string, trecho: string): Promise<Explicacao> {
  const { data } = await appDb.from("vm_generated_scripts")
    .select("pipeline_trace, slop_lint_violations").eq("id", scriptId).single();
  const t = data?.pipeline_trace as PipelineTrace | null;
  const etapa = atribuirEtapa(trecho, { assembled: t?.assembled, revised: t?.revised, final: t?.final });
  return explicar({ trecho, etapa, trace: t, violations: data?.slop_lint_violations });
}
```

- [ ] **Passo 4: verificar contra um roteiro real**

Rodar a action contra um dos 47 roteiros existentes. Expected: `etapa` resolve corretamente
(os 3 snapshots existem) e `causa` é `nao_determinado` com a mensagem de roteiro antigo.

- [ ] **Passo 5: commit**

```bash
git add agents/proveniencia.md lib/pipeline/explain.ts lib/actions.ts
git commit -m "feat(proveniencia): agente que explica um trecho a partir do rastro"
```

---

### Task 7: Classificador de ensino

**Files:**
- Create: `agents/classificador-ensino.md`
- Create: `lib/pipeline/classify-teaching.ts`
- Test: `tests/classify-teaching.test.ts` (só o schema/validação, não o julgamento)

**Interfaces:**
- Produces: `classificarEnsinamento(input: { texto: string; trecho?: string; referenciaId?: string; clienteNome?: string }): Promise<Ensinamento>`
  onde `Ensinamento = { regra: string; casa: "licao"|"vocabulario"|"frase_banida"|"playbook"; destinatarios: Destinatario[]; dimensao: string; evidencia?: string; padrao?: string; motivo?: string }`.

- [ ] **Passo 1: escrever a persona**

`agents/classificador-ensino.md`. Pontos obrigatórios:
- Escolher a casa pela **mecânica**, não pelo tema: regra verificável por regex → `frase_banida`;
  palavra a evitar/preferir para um cliente → `vocabulario`; princípio de escrita → `licao`;
  mudança de doutrina que vale para todo roteiro → `playbook`.
- `destinatarios` sai da pergunta **"quem precisa saber disto para agir diferente?"**, nunca do tema.
  Enum fechado nos 8 de `DESTINATARIOS`.
- `dimensao` é só rótulo de filtro; escolher o mais próximo entre os 6 do CHECK
  (`hook|storytelling|tema|ritmo|comando|geral`). Imprecisão aqui é inofensiva.
- `padrao` só quando `casa = frase_banida`: regex JS, sem quantificador aninhado, sem lookbehind.
- Regra em **imperativo replicável**, nunca descrição do caso.

- [ ] **Passo 2: implementar com tool forçada**

`ANALYST_MODEL`, tool `registrar_ensinamento`, `destinatarios` com `enum` = `DESTINATARIOS`,
`casa` e `dimensao` com enum fechado. Seguir o padrão de `lib/pipeline/teach.ts:47` (`runProfessor`).

- [ ] **Passo 3: teste de contrato**

```ts
// tests/classify-teaching.test.ts
import { describe, expect, test } from "vitest";
import { ENSINAMENTO_TOOL } from "@/lib/pipeline/classify-teaching";
import { DESTINATARIOS } from "@/lib/pipeline/destinatarios";

describe("schema do classificador", () => {
  test("enum de destinatarios espelha DESTINATARIOS", () => {
    expect(ENSINAMENTO_TOOL.input_schema.properties.destinatarios.items.enum)
      .toEqual([...DESTINATARIOS]);
  });
  test("casa tem exatamente as quatro casas", () => {
    expect(ENSINAMENTO_TOOL.input_schema.properties.casa.enum)
      .toEqual(["licao", "vocabulario", "frase_banida", "playbook"]);
  });
});
```

Run: `npx vitest run tests/classify-teaching.test.ts` → PASS

Não há teste de acerto do classificador: julgamento de LLM não se testa com `assert`, e o portão é
a confirmação humana.

- [ ] **Passo 4: commit**

```bash
git add agents/classificador-ensino.md lib/pipeline/classify-teaching.ts tests/classify-teaching.test.ts
git commit -m "feat(ensino): classificador de ensinamento (casa + destinatarios + escopo)"
```

---

### Task 8: Segurança de regex

**Files:**
- Create: `lib/regex-safety.ts`
- Test: `tests/regex-safety.test.ts`

**Interfaces:**
- Produces: `validarPadrao(p: string): { ok: true; re: RegExp } | { ok: false; motivo: string }`;
  `preview(p: string, texto: string): string[]`.

- [ ] **Passo 1: escrever o teste que falha**

```ts
// tests/regex-safety.test.ts
import { describe, expect, test } from "vitest";
import { preview, validarPadrao } from "@/lib/regex-safety";

describe("validarPadrao", () => {
  test("padrão válido compila", () => {
    const r = validarPadrao("manchete");
    expect(r.ok).toBe(true);
  });
  test("padrão inválido não lança, devolve motivo", () => {
    const r = validarPadrao("([a-z");
    expect(r.ok).toBe(false);
    expect(r).toHaveProperty("motivo");
  });
  test("quantificador aninhado é rejeitado", () => {
    expect(validarPadrao("(a+)+b").ok).toBe(false);
  });
  test("padrão longo demais é rejeitado", () => {
    expect(validarPadrao("a".repeat(300)).ok).toBe(false);
  });
});

describe("preview", () => {
  test("devolve os trechos que casam", () => {
    expect(preview("manchete", "A manchete dizia. Virou manchete.")).toHaveLength(2);
  });
  test("padrão inválido devolve lista vazia, não lança", () => {
    expect(() => preview("([a-z", "texto")).not.toThrow();
    expect(preview("([a-z", "texto")).toEqual([]);
  });
});
```

- [ ] **Passo 2: rodar e confirmar que falha**

Run: `npx vitest run tests/regex-safety.test.ts` → FAIL (módulo inexistente)

- [ ] **Passo 3: implementar**

```ts
// lib/regex-safety.ts
const MAX = 200;
// Quantificador aplicado a grupo que já contém quantificador: (a+)+, (a*)*, (a{1,3})+ …
const ANINHADO = /\((?=[^)]*[+*}])[^)]*[+*}][^)]*\)\s*[+*{]/;

export function validarPadrao(p: string): { ok: true; re: RegExp } | { ok: false; motivo: string } {
  if (!p.trim()) return { ok: false, motivo: "padrão vazio" };
  if (p.length > MAX) return { ok: false, motivo: `padrão acima de ${MAX} caracteres` };
  if (ANINHADO.test(p)) return { ok: false, motivo: "quantificador aninhado — risco de backtracking" };
  try {
    return { ok: true, re: new RegExp(p, "giu") };
  } catch (e) {
    return { ok: false, motivo: `regex inválido: ${(e as Error).message}` };
  }
}

// ponytail: entrada limitada ao roteiro aberto (dezenas de KB), por isso sem timeout.
// Se um dia isto rodar sobre corpus, precisa de execução com limite de tempo de verdade.
export function preview(p: string, texto: string): string[] {
  const v = validarPadrao(p);
  if (!v.ok) return [];
  return [...texto.matchAll(v.re)].map((m) => m[0]).slice(0, 20);
}
```

- [ ] **Passo 4: rodar e confirmar que passa**

Run: `npx vitest run tests/regex-safety.test.ts` → PASS (6 testes)

- [ ] **Passo 5: commit**

```bash
git add lib/regex-safety.ts tests/regex-safety.test.ts
git commit -m "feat(ensino): validacao e preview seguro de regex de frase banida"
```

---

### Task 9: Escrita transacional nas quatro casas

**Files:**
- Create: `supabase/migrations/0028_rpc_gravar_ensinamento.sql`
- Modify: `lib/actions.ts` (server action `gravarEnsinamento`)

**Interfaces:**
- Consumes: `Ensinamento` (Task 7), `validarPadrao` (Task 8).
- Produces: `gravarEnsinamento(e: Ensinamento & { textoCru: string; escopo: "cliente"|"global"; sessionId: string; clientId: string | null }): Promise<{ ok: boolean; id?: string; erro?: string }>`.

- [ ] **Passo 1: escrever a RPC transacional**

```sql
-- supabase/migrations/0028_rpc_gravar_ensinamento.sql
-- Lição órfã (vm_lessons grava, vm_lesson_learnings falha) significaria "acreditei que ensinei
-- e não ensinei" — o defeito que a peça 015 existe para matar. Daí a transação.
create or replace function vm_gravar_ensinamento(
  p_client_id uuid, p_session_url text, p_texto_cru text,
  p_titulo text, p_descricao text, p_dimensao text, p_destinatarios text[], p_evidencia text
) returns uuid language plpgsql as $$
declare v_lesson_id uuid; v_learning_id uuid;
begin
  insert into vm_lessons (client_id, source_kind, source_url, transcript, context_note)
  values (p_client_id, 'sessao', p_session_url, null, p_texto_cru)
  returning id into v_lesson_id;

  insert into vm_lesson_learnings
    (lesson_id, dimensao, destinatarios, titulo, descricao, evidencia, origem, active)
  values (v_lesson_id, p_dimensao, p_destinatarios, p_titulo, p_descricao, p_evidencia, 'ensino', true)
  returning id into v_learning_id;

  return v_learning_id;
end; $$;
```

- [ ] **Passo 2: implementar o despacho por casa**

```ts
// lib/actions.ts
export async function gravarEnsinamento(e: EnsinamentoConfirmado) {
  // Escopo global + vocabulário: vm_client_preferences é por cliente por definição.
  // Cai em frase banida com severity warn. (spec §5.1)
  const casa = e.casa === "vocabulario" && e.escopo === "global" ? "frase_banida" : e.casa;

  switch (casa) {
    case "licao": {
      const { data, error } = await appDb.rpc("vm_gravar_ensinamento", {
        p_client_id: e.escopo === "cliente" ? e.clientId : null,
        p_session_url: `/sessions/${e.sessionId}`,
        p_texto_cru: e.textoCru, p_titulo: e.regra, p_descricao: e.regra,
        p_dimensao: e.dimensao, p_destinatarios: e.destinatarios, p_evidencia: e.evidencia ?? null,
      });
      return error ? { ok: false, erro: error.message } : { ok: true, id: data as string };
    }
    case "frase_banida": {
      const v = validarPadrao(e.padrao ?? "");
      if (!v.ok) return { ok: false, erro: v.motivo };
      const { error } = await appDb.from("vm_banned_phrases")
        .insert({ padrao: e.padrao, label: e.regra, motivo: e.motivo ?? e.textoCru, severity: "warn" });
      return error ? { ok: false, erro: error.message } : { ok: true };
    }
    case "vocabulario":  /* append em vm_client_preferences.vocabulario_evitar|usar */
    case "playbook":     /* cria proposta — NUNCA escreve o playbook direto (spec §5.1) */
  }
}
```

- [ ] **Passo 3: verificar que a transação reverte**

Chamar a RPC com `p_dimensao` inválido (viola o CHECK). Expected: **zero** linhas novas em
`vm_lessons` — a transação reverteu. Confirmar com:

```sql
select count(*) from vm_lessons where source_kind = 'sessao';
```

- [ ] **Passo 4: commit**

```bash
git add supabase/migrations/0028_rpc_gravar_ensinamento.sql lib/actions.ts
git commit -m "feat(ensino): escrita transacional nas quatro casas"
```

---

### Task 10: Dialog de três modos

**Files:**
- Create: `components/teach-dialog.tsx`

**Interfaces:**
- Produces: `useTeachDialog(args): { abrir: (modo: "porque"|"mudar"|"ensinar", trecho?: string) => void; dialog: ReactNode }`.

- [ ] **Passo 1: copiar o padrão existente**

Base: `components/class-videos-dialog.tsx:26` (hook `{open, dialog}` — é chamado de três pontos, por
isso o hook e não um componente solto). Casca do `<dialog>` idêntica ao padrão do projeto:

```tsx
<dialog ref={dialogRef} onClose={onClose}
  onClick={(e) => { if (e.target === dialogRef.current) dialogRef.current.close(); }}
  className="backdrop:bg-black/60 backdrop:backdrop-blur-sm m-auto w-[min(560px,92vw)]
             max-h-[85dvh] overflow-y-auto rounded-2xl border border-gold/30
             bg-[#161410] text-[#ededf0] p-0 shadow-2xl">
```

- [ ] **Passo 2: modo "porque"**

Chama `explicarTrecho`. Renderiza selo da etapa, `explicacao`, e `referencia` como chip clicável.
Dois botões: **Ensinar algo sobre isto** (troca para o modo `ensinar` carregando `referenciaId`) e,
quando `referencia?.tipo === "licao"`, **Corrigir esta lição** (edita título/descrição via
`updateLearning` ou desativa via `setLearningActive` — **as duas actions já existem**, usadas por
`components/lesson-view.tsx:20`).

Quando `causa === "nao_determinado"`, o texto é literal: *"Nada no prompt determinou esta frase. Foi
escolha do roteirista."* — e o botão Ensinar continua ali.

- [ ] **Passo 3: modo "mudar"**

Delega ao `BobModal` de hoje (`session-view.tsx:1331`). Sem mudança de comportamento.

- [ ] **Passo 4: modo "ensinar"**

Textarea → `classificarEnsinamento` (spinner, ~3s, **sem SSE**) → painel de confirmação com,
nesta ordem: **texto cru literal** (não editável), **regra** (textarea editável), **casa** (chips
selecionáveis), **destinatários** (chips com toggle), **escopo** (radio Cliente | Global) e —
apenas quando `casa === "frase_banida"` — o padrão mais o resultado de `preview(padrao, roteiroAberto)`.

Botão: `Confirmar — vale da próxima geração`.

Em erro de classificação: mensagem na tela, **o texto cru permanece no textarea**, botão de repetir.

- [ ] **Passo 5: verificar no navegador**

Run: `npm run dev`. Abrir uma sessão, selecionar texto, percorrer os três modos. Conferir Esc e
clique no backdrop fechando (vêm de graça no `<dialog>` nativo).

- [ ] **Passo 6: commit**

```bash
git add components/teach-dialog.tsx
git commit -m "feat(ui): dialog de tres modos (porque, mudar, ensinar)"
```

---

### Task 11: Ligar na tela da sessão

**Files:**
- Modify: `components/session-view.tsx:1226-1238` (popover em edição), `:1295-1313` (popover em leitura), `:914` (header do `ScriptCard`)

- [ ] **Passo 1: trocar um verbo por três**

Nos dois popovers flutuantes, "Chame o Bob" vira **Por quê? · Mudar · Ensinar**, cada um chamando
`abrir(modo, trechoSelecionado)`.

**Não mexer** nos `onMouseDown`/`onTouchStart` com `preventDefault()` — são eles que impedem a
seleção de colapsar no toque. Regressão aqui quebra o gesto no celular.

- [ ] **Passo 2: entrada sem seleção**

Botão **Ensinar** no header sticky do `ScriptCard`, ao lado de Editar / Copiar. Chama
`abrir("ensinar")` sem trecho.

- [ ] **Passo 3: verificar os dois modos e o mobile**

Run: `npm run dev`. Testar seleção em modo leitura e em modo edição; testar em viewport de celular
(o popover é `position: fixed` ancorado na seleção — confirmar que os três botões cabem).

- [ ] **Passo 4: rodar a suíte inteira e commitar**

```bash
npm test
git add components/session-view.tsx
git commit -m "feat(ui): tres verbos na selecao + entrada de ensino no header"
```

---

## Ordem, dependências e portões

| Task | Depende de | Portão |
|---|---|---|
| 1 | — | **operador aplica a migration 0027 antes da Task 2 subir** |
| 2 | 1 | teste de call site ainda falha em `revisao` — esperado |
| 3 | 2 | suíte inteira passa |
| 4 | 3 | `prov_bytes` em poucos KB |
| 5 | — | pode ir em paralelo com 1-4 |
| 6 | 4, 5 | resposta honesta em roteiro antigo |
| 7 | 1 | — |
| 8 | — | pode ir em paralelo |
| 9 | 7, 8 | **operador aplica a 0028**; transação reverte |
| 10 | 6, 7, 8, 9 | — |
| 11 | 10 | gesto de seleção intacto no mobile |

Tasks 5, 7 e 8 não dependem umas das outras nem de 2-4 — são as candidatas naturais a paralelizar.

## Cobertura do spec

| Seção | Task |
|---|---|
| §4.1 gravar proveniência | 3, 4 |
| §4.2 trecho → etapa | 5 |
| §4.3 etapa → resposta | 6 |
| §5 classificador | 7 |
| §5.1 quatro casas + preview de regex | 8, 9 |
| §5.2 escopo manual | 9, 10 |
| §6.2 migration + backfill | 1 |
| §6.3 roteamento, teto, call site do revisor | 2, 3 |
| §6.4 duas classes de lição | 9 (`active:true` só em `origem:'ensino'`) |
| §7 interface | 10, 11 |
| §8 tratamento de erro | 6 (roteiro antigo), 8 (regex), 9 (transação), 10 (texto preservado) |
| §9 checagem | 1, 2, 5, 7, 8 |
