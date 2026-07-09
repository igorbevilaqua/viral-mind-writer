# Plan 002: Blindar as chamadas LLM restantes (max_tokens + parser double-encode único)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything in "STOP conditions" occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 83efd74..HEAD -- lib/pipeline/agents.ts lib/pipeline/teach.ts lib/pipeline/suggest.ts lib/pipeline/modelagem.ts lib/etl.ts`
> On any change, compare the "Current state" excerpts against live code; on mismatch, STOP.
> (Rebaselined em 83efd74: o commit concorrente 76d9672 mexeu em agents.ts mas os
> helpers `toolInput`/`toolArray` continuam lá — Step 1 segue válido. teach/suggest/etl/modelagem intactos.)

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `83efd74`, 2026-07-09 (rebaselined após commit concorrente 76d9672)

## Why this matters

Hoje (2026-07-08) a geração de roteiros quebrou em produção com "storytelling: nenhuma narrativa válida". Causa raiz: os modelos (`claude-sonnet-5` com thinking adaptativo por padrão; `claude-fable-5` com thinking sempre ligado) gastam parte do `max_tokens` raciocinando — teto apertado trunca o JSON da tool no meio e o resultado chega vazio. Os call sites do pipeline principal já foram corrigidos (commit `9acaf7f`), mas **três call sites da mesma classe continuam expostos**: Ensinar (`teach.ts`, 3000), boas práticas do ETL (`etl.ts`, 1200) e sugestão de temas (`suggest.ts`, 4000). Além disso, o parser anti double-encode (o modelo às vezes serializa o input da tool como string JSON) existe em **três cópias divergentes** — uma correção num lugar não chega nos outros — e `modelagem.ts` não tem guard nenhum (cast direto), o que descarta a modelagem silenciosamente E envenena o cache `vm_modelagem_analyses` com null.

## Current state

- `lib/pipeline/agents.ts:45-70` — helpers `toolInput(block)` e `toolArray<T>(input, key)`, **module-private** (sem `export`). São a implementação canônica:

```ts
function toolInput(block: { input: unknown }): Record<string, unknown> {
  let v: unknown = block.input;
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { v = {}; }
  }
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function toolArray<T>(input: Record<string, unknown>, key: string): T[] {
  let v: unknown = input[key];
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { v = []; }
  }
  if (v && !Array.isArray(v) && typeof v === "object" && Array.isArray((v as Record<string, unknown>)[key])) {
    v = (v as Record<string, unknown>)[key];
  }
  return Array.isArray(v) ? (v as T[]) : [];
}
```

- `lib/pipeline/teach.ts:62` — `max_tokens: 3000` com tool forçada `registrar_aprendizados` (4-8 itens × 4 campos). Linhas 89-101 têm cópia própria do parser (com `?? toolUse.input` de fallback extra).
- `lib/etl.ts:88` — `max_tokens: 1200` com tool forçada `registrar_boas_praticas`. Linhas 108-122 têm outra cópia do parser.
- `lib/pipeline/suggest.ts:147` — `max_tokens: 4000` com tool forçada `registrar_sugestoes` (4-5 sugestões ricas). Linhas ~182-196 têm a terceira cópia.
- `lib/pipeline/modelagem.ts:96` — `const input = toolUse.input as { analysis: unknown; replication_brief: string }` **sem guard nenhum**; em seguida insere no cache `vm_modelagem_analyses` mesmo se vazio.
- Convenções: comentários curtos PT-BR explicando o porquê; nomes existentes mantidos.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm ci`                 | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Lint      | `npx eslint lib/`        | exit 0              |

## Scope

**In scope**:
- `lib/pipeline/agents.ts` (só adicionar `export` aos dois helpers)
- `lib/pipeline/teach.ts`
- `lib/pipeline/suggest.ts`
- `lib/pipeline/modelagem.ts`
- `lib/etl.ts`

**Out of scope**:
- Qualquer outro call site LLM (draft/critique/humanize/hook/comando — já corrigidos).
- `output_config`/effort — isso é o plano 008.
- Criar testes (plano 003 cria o framework e testa estes helpers).

## Git workflow

- Branch: `advisor/002-llm-call-hardening`
- Commits por passo lógico; mensagem estilo `Fix: ...` em português. NÃO fazer push.

## Steps

### Step 1: Exportar os helpers canônicos

Em `lib/pipeline/agents.ts`, adicionar `export` a `toolInput` e `toolArray` (sem mudar implementação).

**Verify**: `grep -n "export function toolInput\|export function toolArray" lib/pipeline/agents.ts` → 2 matches.

### Step 2: teach.ts — teto + parser compartilhado

- `max_tokens: 3000` → `8000` com comentário curto (mesma justificativa dos irmãos: thinking divide o teto).
- Substituir o bloco de parsing das linhas 89-101 por `toolArray<ExtractedLearning>(toolInput(toolUse), "aprendizados")` (import de `./agents`). Manter os throws existentes: se o array vier vazio, lançar `new Error("professor: sem aprendizados estruturados")` com um `console.error` do `stop_reason` + `JSON.stringify(toolUse.input).slice(0, 500)` antes (mesmo padrão de diagnóstico de `proposeNarratives` em agents.ts). Manter o filtro final por `titulo/descricao/dimensao`.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: etl.ts — teto + parser compartilhado

- `max_tokens: 1200` → `4000`.
- Substituir o bloco 108-122 por `toolArray<{titulo: string; descricao: string}>(toolInput(toolUse), "praticas")` + o filtro existente. Import: `import { agentPrompt, toolInput, toolArray } from "./pipeline/agents"` (o arquivo já importa `agentPrompt` de lá).

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 4: suggest.ts — teto + parser compartilhado

- `max_tokens: 4000` → `6000`.
- Substituir o bloco de normalização (~182-196) por `toolArray<ThemeSuggestion>(toolInput(toolUse), "sugestoes")`, mantendo o filtro `!!x?.tema && !!x?.angulo_narrativo && Array.isArray(x?.informacoes_de_apoio)` e o throw "ideador: nenhuma sugestão válida" (com o mesmo console.error de diagnóstico antes do throw).

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 5: modelagem.ts — guard + não envenenar o cache

Substituir o cast direto da linha ~96 por:

```ts
const input = toolInput(toolUse);
const brief = typeof input.replication_brief === "string" ? input.replication_brief.trim() : "";
if (!brief) {
  console.error(`modelagem vazia — stop_reason=${res.stop_reason} input=${JSON.stringify(toolUse.input).slice(0, 500)}`);
  throw new Error("modelagem: modelo não retornou análise estruturada");
}
```

e usar `input.analysis ?? null` + `brief` no insert/retorno dali em diante. O throw é correto aqui: o chamador (`runPipeline`) já trata erro de modelagem via `.filter(Boolean)`? — **verificar**: em `lib/pipeline/index.ts:29-31` o resultado passa por `.filter(Boolean)`, mas um throw dentro do `Promise.all` propaga. Se propagar, envolver a chamada em `analyzeModelagem` com catch no próprio modelagem.ts retornando `""` (e o filter descarta). Escolher a opção que preserva o comportamento "modelagem falhou nunca derruba a geração" — retorno `""` com console.error.

**Verify**: `npx tsc --noEmit` → exit 0; `grep -n "as { analysis" lib/pipeline/modelagem.ts` → nenhuma ocorrência.

### Step 6: Lint final

**Verify**: `npx eslint lib/` → exit 0.

## Test plan

Nenhum teste aqui — o plano 003 cria o vitest e cobre `toolInput`/`toolArray` (por isso o Step 1 os exporta). Não instalar nada.

## Done criteria

- [ ] `npx tsc --noEmit` exit 0
- [ ] `npx eslint lib/` exit 0
- [ ] `grep -rn "JSON.parse" lib/pipeline/teach.ts lib/pipeline/suggest.ts lib/etl.ts | grep -v "toolInput\|toolArray"` → sem parsing local de tool input remanescente (as únicas ocorrências de JSON.parse nesses arquivos devem ter sumido)
- [ ] `grep -n "max_tokens" lib/pipeline/teach.ts lib/etl.ts lib/pipeline/suggest.ts` → 8000 / 4000 / 6000
- [ ] Nenhum arquivo fora do escopo modificado (`git status --short`)

## STOP conditions

- Os excerpts de "Current state" não batem com o código (drift).
- O typecheck acusar que `ExtractedLearning`/`ThemeSuggestion` não são exportados de onde o plano assume — reportar em vez de criar tipos novos.
- Qualquer necessidade de tocar `lib/pipeline/index.ts` além de leitura (fora de escopo).

## Maintenance notes

- Qualquer call site LLM novo com `tool_choice` forçado deve usar `toolInput`/`toolArray` e teto ≥4000 — anotar isso no AGENTS.md (plano 004 o cria).
- O plano 003 adiciona testes de tabela para os 4 formatos de double-encode; se o provider mudar o comportamento, os testes acusam.
