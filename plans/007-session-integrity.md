# Plan 007: Integridade da sessão — swapHook seguro + autoria (user_id)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything in "STOP conditions" occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat <planned-at>..HEAD -- lib/actions.ts lib/supabase/server.ts`
> Compare "Current state" excerpts; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 005 (toca lib/actions.ts antes)
- **Category**: bug
- **Planned at**: commit `9acaf7f`, 2026-07-08 — reconciliar SHA no despacho

## Why this matters

(1) `swapHook` troca o hook do roteiro assumindo que o primeiro bloco `\n\n` do texto é exatamente o valor da coluna `hook` — mas revisão e humanização reescrevem o texto livremente, então o bloco 0 pode divergir da coluna. Hoje o swap guarda a **coluna** `hook` no slot da variação (não o que foi de fato removido do texto), tornando o "desfazer" incoerente e podendo corromper o corpo. (2) O schema tem `user_id` em `vm_sessions` e `vm_script_feedback` desde o init — e nada preenche. Com múltiplos emails na allowlist, ninguém sabe quem criou/avaliou o quê; preencher agora é barato e destrava filtros/atribuição futuros.

## Current state

- `lib/actions.ts:178-201` — `swapHook`:
```ts
const blocks = (s.roteiro as string).split("\n\n");
blocks[0] = novo;
variants[variantIndex] = s.hook;   // ← guarda a COLUNA, não o bloco removido
```
- `lib/actions.ts:13-38` — `createSession` insere `{ prompt, client_id }` sem `user_id`; `lib/actions.ts:64-82` — `finalizeSession` insere feedback sem `user_id`.
- `lib/supabase/server.ts` — exporta `createClient()` async (anon key + cookies) para AUTH; dados continuam via `appDb` service-role:
```ts
export async function createClient() { ... createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: {...} }) }
```
- Migration `0001_init.sql:5,49` — `user_id uuid references auth.users(id)` em vm_sessions e vm_script_feedback.
- Server actions rodam atrás do middleware (usuário sempre autenticado e allowlisted).

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `npm ci`           | exit 0   |
| Typecheck | `npx tsc --noEmit` | exit 0   |
| Tests     | `npm test`         | pass     |
| Lint      | `npx eslint lib/`  | exit 0   |

## Scope

**In scope**:
- `lib/actions.ts`
- `tests/swap-hook.test.ts` (criar — a lógica pura extraída)

**Out de scope**:
- UI (chips de autoria, filtro "minhas sessões") — captura de dado primeiro, UI depois.
- `lib/supabase/server.ts`, `middleware.ts`, migrations.

## Git workflow

- Branch: `advisor/007-session-integrity`
- Commits por passo; PT-BR. NÃO fazer push.

## Steps

### Step 1: extrair e corrigir a lógica do swap

Em `lib/actions.ts`, extrair função pura exportada (testável):

```ts
// Troca o hook no texto do roteiro. O roteiro começa com o hook por construção,
// mas revisão/humanização podem tê-lo reescrito — prioriza casar a coluna `hook`
// no início do texto; senão, troca o primeiro bloco. Retorna também o texto
// efetivamente removido (é ELE que vira a variação, para o desfazer ser coerente).
export function swapHookInRoteiro(roteiro: string, hookAtual: string, novo: string): { roteiro: string; removido: string } {
  const atual = hookAtual.trim();
  if (atual && roteiro.startsWith(atual)) {
    return { roteiro: novo + roteiro.slice(atual.length), removido: atual };
  }
  const blocks = roteiro.split("\n\n");
  const removido = blocks[0];
  blocks[0] = novo;
  return { roteiro: blocks.join("\n\n"), removido };
}
```

`swapHook` passa a usar: `variants[variantIndex] = removido` (não `s.hook`), `hook: novo`, `roteiro` do retorno.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: testes

`tests/swap-hook.test.ts`: (a) roteiro começa exatamente com o hook → splice preciso, removido == hook; (b) hook divergiu (humanizador mudou uma palavra) → cai no bloco 0, removido == bloco 0 real; (c) swap + swap de volta restaura o roteiro original (round-trip no caso a); (d) hook vazio → bloco 0.

**Verify**: `npm test` → passa.

### Step 3: autoria

Em `createSession` e `finalizeSession`, resolver o usuário e gravar:

```ts
import { createClient } from "./supabase/server";
// ...
const supa = await createClient();
const { data: { user } } = await supa.auth.getUser();
// insert: { ..., user_id: user?.id ?? null }
```

(`?? null` porque o middleware garante auth, mas a coluna é nullable — sem throw novo.)

**Verify**: `npx tsc --noEmit` → exit 0; `grep -c "user_id" lib/actions.ts` → ≥ 2.

## Test plan

Já no Step 2 (4 casos). Autoria não tem teste unitário (depende de cookies) — verificação por typecheck + smoke do operador.

## Done criteria

- [ ] `npm test`, `npx tsc --noEmit`, `npx eslint lib/` exit 0
- [ ] `grep -n "variants\[variantIndex\] = s.hook" lib/actions.ts` → 0 ocorrências
- [ ] `createSession` e `finalizeSession` gravam `user_id`
- [ ] Só arquivos in-scope no diff

## STOP conditions

- Excerpts não batem (drift).
- `createClient` de `lib/supabase/server.ts` tiver assinatura diferente da documentada.
- Importar `next/headers` em `lib/actions.ts` causar erro de build (contexto server actions deve suportar — se não suportar, reportar).

## Maintenance notes

- Próximo passo natural (fora deste plano): filtro "minhas sessões" na lista comparando `user_id` com o usuário logado, e chip de autoria (exige mapear uuid→email).
- O plano 010 (learning loop) usará o `user_id` do feedback para atribuir aprendizados extraídos.
