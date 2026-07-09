# Plan 003: Baseline de verificação — vitest + testes dos parsers puros

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything in "STOP conditions" occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 83efd74..HEAD -- lib/pipeline/draft.ts lib/pipeline/slop-lint.ts lib/etl.ts package.json`
> On any change, compare "Current state" excerpts against live code; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `83efd74`, 2026-07-09 (rebaselined após commit concorrente 76d9672)

## Why this matters

O repo tem ZERO testes. O caminho do dinheiro é um pipeline de 6+ chamadas LLM cujo resultado passa por parsers frágeis (regex de seções, split de variações, lint determinístico, regex de URL do flywheel) — a costura entre output não-determinístico do modelo e tudo que é persistido. Hoje uma regressão nesses parsers degrada silenciosamente (roteiro vira dump bruto, variações somem, flywheel nunca casa o vídeo). Este plano cria o harness e cobre as funções puras — rápido, determinístico, sem rede — destravando os refactors dos planos seguintes.

## Current state

- `package.json` scripts: `dev`, `build`, `start`, `lint`, `etl`, `check`. Sem test runner. devDeps incluem `tsx`, `typescript@^5`, `@types/node@^20`.
- `lib/pipeline/draft.ts:169-188` — `parseSections(text)`: extrai por regex `##\s*HEADER\s*\n([\s\S]*?)(?=\n##\s|$)` os campos headline/hook/roteiro/hookVariants/comando/fontes. Comportamentos-chave: roteiro tem fallback para `text.trim()` inteiro quando `## ROTEIRO` falta; variações aceitam header `VARIACOES_DE_HOOK` ou `VARIAÇÕES_DE_HOOK`; split por `/\n\d+\.\s*/` com strip de `^\d+\.\s*`.
- `lib/pipeline/slop-lint.ts` (38 linhas) — `slopLint(text, phrases)`: casa cada `BannedPhrase.pattern` como regex `gi` (regex inválida é pulada); heurísticas: travessão `—` ou ` – ` (severity block, com contagem no label); frases consecutivas começando com "E" (warn). `blockCount(v)` conta blocks.
- `lib/etl.ts:341-348` — `platformVideoId(url)`: **module-private** (sem export). Padrões atuais: `(?:v=|shorts\/|youtu\.be\/)([\w-]{11})`, `instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)`, `tiktok\.com\/.*video\/(\d+)`. (Sabidamente NÃO cobre `/live/` e `/embed/` — o plano 005 estende; aqui só caracterizamos o comportamento atual.)
- `BannedPhrase` type em `lib/pipeline/types.ts`: `{ pattern: string; label: string | null; severity: "block" | "warn" }` — verificar o shape exato no arquivo antes de usar.
- Convenções: TS estrito, imports com alias `@/` (tsconfig paths).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm ci`                 | exit 0              |
| Add dep   | `npm install -D vitest`  | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Tests     | `npm test`               | all pass            |
| Lint      | `npx eslint .`           | exit 0              |

## Scope

**In scope**:
- `package.json` (devDep `vitest` + script `"test": "vitest run"`)
- `vitest.config.ts` (criar — environment node, include `tests/**/*.test.ts`, alias `@/` espelhando o tsconfig)
- `tests/parse-sections.test.ts` (criar)
- `tests/slop-lint.test.ts` (criar)
- `tests/platform-video-id.test.ts` (criar)
- `lib/etl.ts` (SOMENTE adicionar `export` à function `platformVideoId` — nada mais)

**Out of scope**:
- `lib/pipeline/agents.ts` (toolInput/toolArray são testados no plano 002 — o arquivo tem mudanças concorrentes em andamento).
- Qualquer teste com rede/DB/LLM. Qualquer mudança de comportamento nos parsers.

## Git workflow

- Branch: `advisor/003-test-baseline`
- Commits por passo; estilo `Chore: ...`/`Test: ...` PT-BR. NÃO fazer push.

## Steps

### Step 1: Instalar vitest e configurar

`npm install -D vitest`; adicionar `"test": "vitest run"` aos scripts; criar `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

**Verify**: `npm test` → "no test files found" ou exit 0 (ainda sem testes).

### Step 2: `tests/parse-sections.test.ts`

Table-driven sobre `parseSections` de `@/lib/pipeline/draft`. Casos obrigatórios:
1. Documento completo com os 6 headers → cada campo extraído e trimado; 3 variações numeradas viram array de 3 sem prefixo numérico.
2. Sem `## ROTEIRO` → `roteiro` = texto inteiro trimado (fallback).
3. Header acentuado `## VARIAÇÕES_DE_HOOK` → variações extraídas.
4. Sem seção de variações → `hookVariants` = `[]`.
5. Headers com espaço extra (`##  HOOK`) → ainda casa (o regex tem `\s*`) — se NÃO casar, ajustar a expectativa ao comportamento real e anotar em NOTES (caracterização, não correção).

**Verify**: `npm test` → todos passam.

### Step 3: `tests/slop-lint.test.ts`

Casos: pattern simples casa (label + match + severity preservados); pattern com regex inválida é pulado sem throw; `—` em qualquer lugar → violação block com contagem; ` – ` (en-dash espaçado) → block; duas frases seguidas começando com "E " → warn; texto limpo → `[]`; `blockCount` conta só blocks.

**Verify**: `npm test` → todos passam.

### Step 4: exportar e testar `platformVideoId`

Adicionar `export` na function em `lib/etl.ts` (só isso). `tests/platform-video-id.test.ts` cobrindo: `youtube.com/watch?v=<11>`, `youtu.be/<11>`, `youtube.com/shorts/<11>`, `instagram.com/reel/<id>` e `/reels/` e `/p/`, `tiktok.com/@user/video/<digits>`, URL não reconhecida → `null`. NÃO testar `/live/`//`/embed/` (comportamento atual não cobre; plano 005 estende e atualizará este arquivo).

**Verify**: `npm test` → todos passam; `npx tsc --noEmit` → exit 0.

### Step 5: gate completo

**Verify**: `npx tsc --noEmit && npx eslint . && npm test` → exit 0.

## Test plan

Este plano É o test plan. Total esperado: ~18-25 asserts em 3 arquivos.

## Done criteria

- [ ] `npm test` exit 0 com 3 arquivos de teste passando
- [ ] `npx tsc --noEmit` e `npx eslint .` exit 0
- [ ] `git diff --stat` toca apenas os arquivos in-scope
- [ ] Nenhum teste importa `lib/db`, `lib/anthropic`, `lib/grok` (grep nos tests → 0)

## STOP conditions

- `parseSections` ou `slopLint` não exportados como descrito (drift).
- Instalar vitest puxar mudanças no lockfile que quebrem `npm ci` (reportar).
- Qualquer teste exigir mock de rede para passar — o design está errado, reportar.

## Maintenance notes

- Plano 002 adiciona `tests/tool-parse.test.ts` (toolInput/toolArray) quando as mudanças concorrentes em agents.ts assentarem.
- Plano 005 move `platformVideoId` para `lib/video-url.ts` e ESTENDE os padrões (live/embed) — atualizará o import e os casos deste teste.
- CI (plano 004) já roda `npm test --if-present` — ao mergear ambos, o teste entra no gate automaticamente.
