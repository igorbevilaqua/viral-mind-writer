# Plan 004: Fundação de DX — .env.example, AGENTS.md, CI e higiene do repo

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything in "STOP conditions" occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 9acaf7f..HEAD -- .gitignore README.md`
> On mismatch with "Current state", STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `9acaf7f`, 2026-07-08

## Why this matters

O repo tem 7+ env vars obrigatórias não óbvias (duas "identidades" Supabase que apontam para o MESMO projeto, três provedores LLM), zero CI (os gates `tsc`/`eslint`/`check` só rodam quando alguém lembra), nenhum guia para agentes (que executam a maioria das mudanças aqui), e artefatos de handoff commitados que confundem (mockups HTML, jpeg). Cada item é barato e destrava trabalho futuro — inclusive os outros planos desta série.

## Current state

- Sem `.env.example`, sem `AGENTS.md`/`CLAUDE.md`, sem `.github/`.
- Env vars usadas (verificado no código): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (middleware.ts), `SUPABASE_SERVICE_ROLE_KEY`, `VIRAL_DATA_URL`, `VIRAL_DATA_SERVICE_ROLE_KEY` (lib/db.ts), `ANTHROPIC_API_KEY` (implícita, lib/anthropic.ts), `GROK_API_KEY` (lib/grok.ts), `OPENAI_API_KEY` (opcional, lib/pipeline/context.ts), `SUPADATA_API_KEY` (opcional, transcribe-link), `VM_ALLOWED_EMAILS` (lib/allowed-emails.ts), `CRON_SECRET` (cron route), `VM_WRITER_MODEL`/`VM_ANALYST_MODEL` (opcionais, lib/anthropic.ts).
- Artefatos rastreados sem papel no build: `clientes-preferencias.html` (49KB, raiz) e a pasta `sistema-de-roteiro-multiagente/` (mockups HTML, `project/support.js`, um `.jpeg`, `.thumbnail`) — MAS os `.md` de planejamento dentro dela (`PLANO.md`, `PLANO-ENSINAR.md`, `README.md`) têm valor histórico e ficam.
- Scripts npm existentes: `dev`, `build`, `start`, `lint` (= `eslint`), `etl`, `check` (= slop-lint self-check). Node em produção: 22.
- **Fato crítico para o AGENTS.md**: push na `main` = deploy automático em produção (Hostinger builda a cada push, ~5s depois). Commits locais são seguros; push publica.
- Arquitetura (para o AGENTS.md): app Next.js 16 App Router; pipeline multi-agente em `lib/pipeline/` (pesquisa Grok → narrativas → ranking → roteiro fable → hook∥comando → revisão → humanização+slop-lint); prompts dos agentes em `agents/*.md` (fonte única); dois clients Supabase em `lib/db.ts` (`appDb` tabelas `vm_*`, `viralData` corpus read-mostly — mesmo projeto físico); ETL semanal `lib/etl.ts` (flywheel de performance); auth por magic link + allowlist no `middleware.ts`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm ci`                 | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Lint      | `npx eslint .`           | exit 0              |
| Slop check| `npm run check`          | exit 0              |

## Scope

**In scope**:
- `.env.example` (criar)
- `AGENTS.md` (criar)
- `.github/workflows/ci.yml` (criar)
- `.gitignore` (append)
- Untrack: `clientes-preferencias.html`, `sistema-de-roteiro-multiagente/project/**` (via `git rm --cached`; arquivos permanecem no disco)

**Out of scope**:
- `README.md` (já bom), qualquer código-fonte, os `.md` de planejamento em `sistema-de-roteiro-multiagente/` (ficam rastreados).

## Git workflow

- Branch: `advisor/004-dx-foundation`
- Commits por passo; estilo `Chore: ...`/`Docs: ...` PT-BR. NÃO fazer push.

## Steps

### Step 1: `.env.example`

Criar com TODAS as chaves acima (valores vazios), agrupadas com comentários: `# Supabase (projeto "Viral Data" — app e corpus no mesmo projeto)`, `# LLMs`, `# Acesso`, `# Opcionais`. Uma linha de comentário por chave dizendo onde é usada.

**Verify**: `grep -c "=" .env.example` → ≥ 13; `grep -rn "sb_secret\|sk-ant\|xai-" .env.example` → nenhuma ocorrência (nenhum valor real).

### Step 2: `AGENTS.md`

Criar na raiz com as seções (conteúdo a partir dos fatos em "Current state" — escrever em PT-BR, conciso):
1. **O que é** (1 parágrafo: escritório de roteiristas virais, corpus 6k vídeos).
2. **⚠️ Deploy**: push na main = produção na hora. Commits locais seguros. Nunca fazer push sem instrução explícita do usuário.
3. **Arquitetura** (o mapa de "Current state": pipeline, agents/*.md, dois clients DB, ETL/flywheel, auth).
4. **Gate de verificação**: `npx tsc --noEmit && npx eslint . && npm run check` (+ `npm test` quando existir — plano 003).
5. **Convenções**: comentários curtos PT-BR explicando porquês; chamadas LLM com tool forçada usam `toolInput`/`toolArray` de `lib/pipeline/agents.ts` e `max_tokens` ≥ 4000 (thinking divide o teto); prompts de agentes vivem em `agents/*.md`, nunca inline.
6. **Env**: apontar para `.env.example`.

**Verify**: `test -f AGENTS.md && grep -c "push" AGENTS.md` → ≥ 1.

### Step 3: CI

`.github/workflows/ci.yml`: on `push` (branch main) e `pull_request`; Node 22 + cache npm; steps: `npm ci`, `npx tsc --noEmit`, `npx eslint .`, `npm run check`, `npm test --if-present`. Nome do job: `verify`.

**Verify**: arquivo existe; `npx tsc --noEmit` continua exit 0 (CI não afeta, sanity).

### Step 4: Higiene

- `git rm --cached clientes-preferencias.html`
- `git rm -r --cached "sistema-de-roteiro-multiagente/project"`
- Append no `.gitignore`: `clientes-preferencias.html` e `sistema-de-roteiro-multiagente/project/`

**Verify**: `git ls-files | grep -c "clientes-preferencias\|sistema-de-roteiro-multiagente/project"` → 0; `ls clientes-preferencias.html` → arquivo ainda existe no disco.

## Test plan

Nada de testes de código aqui. A "verificação" é o próprio CI existir e os greps acima.

## Done criteria

- [ ] `.env.example`, `AGENTS.md`, `.github/workflows/ci.yml` existem
- [ ] Nenhum valor de segredo em nenhum arquivo novo (grep do Step 1)
- [ ] Artefatos untracked mas presentes no disco
- [ ] `npx tsc --noEmit` e `npx eslint .` exit 0
- [ ] Só arquivos do escopo em `git status --short`

## STOP conditions

- Qualquer `.env*` real aparecer rastreado no git (não deveria — reportar imediatamente sem copiar conteúdo).
- `sistema-de-roteiro-multiagente/project` não existir (drift).

## Maintenance notes

- Quando o plano 003 (vitest) mergear, o `npm test --if-present` do CI passa a rodar os testes automaticamente — nada a fazer.
- O AGENTS.md deve ganhar uma linha quando os planos 005/008 mudarem convenções (helpers de vídeo-URL, effort por etapa).
