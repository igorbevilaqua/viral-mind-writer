# Plan 008: Eficiência de tokens — effort por etapa, prompt cache real, paralelização e dieta de contexto

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything in "STOP conditions" occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat <planned-at>..HEAD -- lib/anthropic.ts lib/pipeline/agents.ts lib/pipeline/draft.ts lib/pipeline/critique.ts lib/pipeline/humanize.ts lib/pipeline/context.ts lib/pipeline/index.ts lib/etl.ts`
> ESTE PLANO TOCA ARQUIVOS COM MUDANÇAS CONCORRENTES PENDENTES (agents.ts,
> index.ts). O despachante reconcilia os excerpts antes do despacho; se os
> excerpts não baterem com o código, STOP.

## Status

- **Priority**: P1 (custo recorrente em cada geração)
- **Effort**: M
- **Risk**: MED (qualidade de output precisa de spot-check pós-mudança)
- **Depends on**: 003 (testes), 006 (index.ts assentado), mudanças concorrentes commitadas
- **Category**: perf
- **Planned at**: commit `9acaf7f`, 2026-07-08 — RECONCILIAR ANTES DE DESPACHAR

## Why this matters — ANÁLISE DE CONSUMO DE TOKENS (medida no código em 2026-07-08)

Uma geração completa faz **7+ chamadas LLM** e o desenho atual desperdiça em quatro frentes:

**1. Thinking em potência máxima em TODAS as chamadas.** Nenhum call site define `output_config.effort`. `claude-sonnet-5` roda thinking adaptativo por padrão e `claude-fable-5` pensa sempre. Resultado: o CTA de UMA frase (`writeComando`) paga o mesmo raciocínio profundo que o roteiro inteiro. Thinking é cobrado como output (US$ 15-50/M) — é o token mais caro do sistema, gasto em etapas estruturalmente simples, e ainda serializa ANTES do output (latência).

**2. Prompt cache write-only.** Medido: `buildStaticSystemBlock` (4 playbooks + guia + frases proibidas) ≈ **68.800 chars ≈ ~17k tokens**, enviado em `generateDraft` E `critiqueAndRewrite` — mas o bloco cacheado começa com a PERSONA (`agentPrompt(...)`, diferente por agente), então o prefixo nunca coincide entre chamadas: paga-se a sobretaxa de escrita (~1.25×) duas vezes e lê-se zero. `humanize` — a ÚNICA chamada repetida (até 3× no retry de lint) com system idêntico — usa string simples **sem cache_control nenhum**. O playbook de storytelling sozinho (~52k chars ≈ 13k tokens) também vai inteiro no `proposeNarratives`.

**3. Contexto redundante/sem teto.** O dossiê do Grok (2-4k tokens) vai íntegro em 3 chamadas (narrativas, draft, critique) + fatiado no rank. Os 6 roteiros few-shot (~4-6k tokens) vão no draft E na critique — o revisor não precisa imitar voz. `rankNarratives` injeta **TODOS os insights** com `JSON.stringify` sem teto (global + cliente + scriptresult + taught — cresce a cada ETL). ETL manda stats com `JSON.stringify(stats, null, 1)` (pretty-print paga tokens de indentação).

**4. Serialização desnecessária.** `analyzeModelagem` (chamada LLM) roda ANTES da pesquisa Grok (~60s) começar, sem dependência entre elas. `loadContext` faz 2 queries seriais fora do `Promise.all`. O embedding do few-shot é recomputado a cada geração/regeneração do MESMO prompt.

**Estimativa combinada por geração**: ~35-45k tokens de input evitáveis (cache read a 0.1× em ~17k×1 + fatias redundantes) + 3-8k de thinking evitável nas etapas leves + ~5-15s de latência (paralelização + menos thinking). No ETL semanal: 26 clientes × thinking desnecessário na síntese de boas práticas.

## Current state

(Reconciliar excerpts no despacho. Estrutura em 9acaf7f:)

- `lib/anthropic.ts` — client bare + `WRITER_MODEL`/`ANALYST_MODEL`.
- Call sites e tetos: `agents.ts` proposeNarratives(8000)/rankNarratives(6000)/designHook(4000)/writeComando(2000); `draft.ts` generateDraft(8000, stream, system em 2 blocos com cache_control no 1º=persona+static); `critique.ts` (8000, mesma estrutura); `humanize.ts` (8000, system STRING sem cache, loop ≤3); `suggest.ts` (6000); `modelagem.ts` (8000); `etl.ts` (4000); `teach.ts` (8000).
- `draft.ts:41-57` — `buildStaticSystemBlock(ctx)`: playbooks hook+storytelling+comando+style_guide+banned. `draft.ts:59-119` — `buildDynamicSystemBlock(ctx)`: dossiê+narrativa+orientação+insights+taught+prefs+fewShot(6)+modelagem+refs.
- `context.ts:16-33` — `fetchFewShot` com `embed(prompt)` OpenAI por chamada; `context.ts:70-99` — queries de insights e taught FORA do Promise.all inicial.
- `index.ts:26-38` — modelagem `await`ada antes de `research()`.
- `agents.ts` rankNarratives: `ctx.insights.map(i => JSON.stringify(i.payload)).join(...)` sem teto.
- SDK: `@anthropic-ai/sdk@^0.109.1` — `output_config: { effort }` é GA; se o typecheck rejeitar o campo, atualizar o SDK (`npm i @anthropic-ai/sdk@latest`) é permitido DENTRO deste plano.

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `npm ci`           | exit 0   |
| Typecheck | `npx tsc --noEmit` | exit 0   |
| Tests     | `npm test`         | pass     |
| Lint      | `npx eslint lib/`  | exit 0   |

## Scope

**In scope**: `lib/anthropic.ts`, `lib/pipeline/{agents,draft,critique,humanize,context,index}.ts`, `lib/etl.ts`, `lib/pipeline/teach.ts`, `lib/pipeline/suggest.ts`, `package.json`+lockfile (somente se precisar atualizar o SDK), `tests/` (novos).

**Out of scope**: `agents/*.md` e playbooks (conteúdo dos prompts); qualquer mudança de MODELO (writer/analyst ficam); componentes.

## Git workflow

- Branch: `advisor/008-token-efficiency` · commits por passo · PT-BR · NÃO fazer push.

## Steps

### Step 1: mapa de effort por etapa

Adicionar `output_config: { effort: "<nível>" }` por call site (justificativa em comentário de 1 linha):

| Call site | Effort | Racional |
|---|---|---|
| `writeComando` | `low` | 1 frase de CTA com playbook e exemplos |
| `rankNarratives` | `medium` | scoring estruturado sobre dados prontos |
| `designHook` | `medium` | criativo mas curto e ancorado no corpo |
| `generateBoasPraticas` (etl) | `low` | síntese de 2-4 bullets sobre stats |
| `suggestThemes` síntese | `medium` | cruzamento estruturado |
| `extractLearnings` (teach) | `medium` | extração dimensionada |
| `analyzeModelagem` | `medium` | desconstrução estruturada |
| `proposeNarratives` | (default high) | criativo, coração da qualidade |
| `generateDraft`/`critique`/`humanize` | (default high) | qualidade de escrita |

**Verify**: `npx tsc --noEmit` → exit 0 (se falhar no campo, atualizar SDK e re-rodar).

### Step 2: prompt cache com prefixo compartilhado

- `draft.ts` e `critique.ts`: reordenar o system para `[{static compartilhado, cache_control}, {persona + dinâmico}]` — o bloco 1 vira SÓ `buildStaticSystemBlock(ctx)` (idêntico entre os dois call sites → 2ª chamada lê o cache da 1ª dentro do TTL de 5min), persona (`agentPrompt(...)`) desce para o início do bloco 2.
- `humanize.ts`: system vira array `[{text: agentPrompt("humanizador")+style_guide+voiceRefs, cache_control}]` — retries 2-3 leem o cache.
- `proposeNarratives`: separar `[{playbook storytelling, cache_control}, {persona+resto}]` — playbook igual entre gerações dentro do TTL.

**Verify**: `npx tsc --noEmit` → exit 0; `grep -c "cache_control" lib/pipeline/humanize.ts` → ≥1.

### Step 3: dieta de contexto

- `rankNarratives`: limitar insights a top 40 por score (`[...ctx.insights].sort((a,b)=>(b.payload?.score??0)-(a.payload?.score??0)).slice(0,40)`) e serializar compacto (sem null,1).
- `critique.ts`: chamar `buildDynamicSystemBlock(ctx, { fewShot: false })` — adicionar o param opcional `opts?: { fewShot?: boolean }` na função (default true) que pula o bloco de exemplos.
- `etl.ts`: `JSON.stringify(stats)` (sem pretty-print).

**Verify**: `npx tsc --noEmit` → exit 0; `npm test` → passa.

### Step 4: paralelização

- `index.ts`: `const [modelagemBriefs, dossie] = await Promise.all([modelagens.length ? Promise.all(modelagens.map(...)) : [], needResearch ? research(ctx) : ""])` — preservar exatamente os emits de fase existentes (emitir "modelagem" e "pesquisa" antes do Promise.all).
- `context.ts`: mover as queries de `vm_viral_insights` e `vm_lesson_learnings` para dentro do `Promise.all` principal (elas só dependem de `session.client_id`, disponível antes).

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 5: cache do embedding few-shot

Em `context.ts`, memoizar por prompt num Map module-level:

```ts
// ponytail: cache em memória por processo — Hostinger roda processo longo; regen do
// mesmo prompt não repaga o embedding. Se escalar horizontal, mover para a sessão.
const embedCache = new Map<string, number[]>();
```

Consultar antes de chamar a OpenAI; limitar a 200 entradas (delete do primeiro key ao passar).

**Verify**: `npx tsc --noEmit` → exit 0.

## Test plan

- `tests/dynamic-block.test.ts`: `buildDynamicSystemBlock(ctx, {fewShot:false})` não contém "ROTEIROS REAIS DE ALTA PERFORMANCE"; com default contém (montar ctx mínimo fake).
- Testes existentes seguem verdes.
- **Spot-check de qualidade (operador, pós-merge)**: gerar 1 roteiro de tema conhecido e comparar subjetivamente hook/CTA com uma geração anterior — effort medium/low não deve degradar visivelmente essas etapas.

## Done criteria

- [ ] `npm test`, `npx tsc --noEmit`, `npx eslint lib/` exit 0
- [ ] `grep -rn "output_config" lib/ | wc -l` → ≥ 7
- [ ] `grep -c "cache_control" lib/pipeline/critique.ts lib/pipeline/draft.ts lib/pipeline/humanize.ts` → ≥1 cada
- [ ] `grep -n "null, 1" lib/etl.ts` → 0
- [ ] Só arquivos in-scope no diff

## STOP conditions

- Excerpts não batem (mudanças concorrentes não reconciliadas) — STOP imediato.
- SDK atualizado ainda rejeitar `output_config.effort` no typecheck.
- Reordenar os blocos de system exigir mudar a ASSINATURA de `buildStaticSystemBlock`/`buildDynamicSystemBlock` além do param opcional descrito.

## Maintenance notes

- Monitorar `usage.cache_read_input_tokens` nos logs após deploy — se zerado entre draft→critique, algo no prefixo diverge (auditar byte a byte).
- Se os playbooks mudarem com frequência > TTL de 5min, considerar `ttl: "1h"` no bloco estático (write 2× — só compensa com ≥3 leituras).
- Effort é ajustável por etapa — se o CTA degradar, subir `writeComando` para medium é 1 palavra.
