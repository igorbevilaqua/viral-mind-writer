# Plan 005: Integridade do flywheel — ETL atômico + URL de vídeo unificada

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything in "STOP conditions" occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat <planned-at>..HEAD -- lib/etl.ts lib/actions.ts app/api/transcribe-link/route.ts components/home-form.tsx tests/platform-video-id.test.ts`
> Compare "Current state" excerpts against live code; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (toca o caminho de escrita do ETL)
- **Depends on**: 002 (etl.ts), 003 (testes)
- **Category**: bug
- **Planned at**: commit `9acaf7f`, 2026-07-08 — **ATENÇÃO: reconciliar o SHA no despacho; planos 002/003 terão mergeado antes**

## Why this matters

Dois defeitos corroem o flywheel (o coração do "aprender com o algoritmo"): (1) o ETL semanal **apaga TODOS os insights e só depois insere** — um insert falho deixa o painel e a sala de agentes sem dados por uma semana; há também uma janela de zero insights a cada run. (2) A regex que casa a URL publicada com o vídeo do corpus (`platformVideoId`) cobre MENOS formatos que a validação do `markPublished` e que o `YT_ID` do transcribe (`/live/`, `/embed/`, `watch?...&v=`): o usuário publica, o app aceita, e o vínculo **nunca acontece, silenciosamente** — a performance real jamais volta. Além disso a lógica de URL vive em 4 cópias divergentes.

## Current state

- `lib/etl.ts:334-336`:
```ts
await appDb.from("vm_viral_insights").delete().neq("scope", ""); // snapshot completo substitui o anterior
const ins = await appDb.from("vm_viral_insights").insert(rows);
if (ins.error) throw new Error(`insert insights: ${ins.error.message}`);
```
- `lib/etl.ts:341-348` — `platformVideoId` (exportada pelo plano 003; testes em `tests/platform-video-id.test.ts`): YouTube só `(?:v=|shorts\/|youtu\.be\/)`.
- `app/api/transcribe-link/route.ts:8-9` — `YT_ID = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/` (o superset correto para YouTube).
- `lib/actions.ts:163` — `const VIDEO_URL = /youtube\.com|youtu\.be|instagram\.com|tiktok\.com/i;` usada em `markPublished`.
- `components/home-form.tsx:18` — mesma `VIDEO_URL` duplicada (client component; usada para auto-transcrição de anexo).
- `lib/etl.ts:24-25` — `fmtNum` duplicada com `components/session-view.tsx` (session-view fica FORA de escopo aqui — tem mudanças concorrentes).
- `supabase/migrations/` — numeração vigente: verificar o maior `NNNN_*.sql` existente e usar o próximo número livre.
- RPC via supabase-js: `appDb.rpc("nome", { args })`; função ausente retorna error code `PGRST202`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm ci`                 | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Tests     | `npm test`               | all pass            |
| Lint      | `npx eslint .`           | exit 0              |

## Scope

**In scope**:
- `lib/video-url.ts` (criar)
- `lib/format.ts` (criar — `fmtNum` movida de etl.ts)
- `lib/etl.ts`
- `lib/actions.ts` (só a linha do `VIDEO_URL`)
- `components/home-form.tsx` (só a linha do `VIDEO_URL`)
- `app/api/transcribe-link/route.ts` (só trocar `YT_ID` local pelo helper)
- `supabase/migrations/<próximo>_replace_insights_fn.sql` (criar)
- `tests/platform-video-id.test.ts` (atualizar import + estender casos)

**Out of scope**:
- `components/session-view.tsx` (mudanças concorrentes — a dedup do fmtNum de lá fica para depois; anotar em maintenance).
- Aplicar a migration no banco (o executor NÃO tem acesso ao Supabase; é passo do operador).
- Qualquer mudança na lógica de matching além dos padrões de URL.

## Git workflow

- Branch: `advisor/005-flywheel-integrity`
- Commits por passo; estilo `Fix:`/`Refactor:` PT-BR. NÃO fazer push.

## Steps

### Step 1: `lib/video-url.ts`

```ts
// Fonte única de padrões de URL de vídeo (validação + extração de id por plataforma).
export const VIDEO_URL_RE = /youtube\.com|youtu\.be|instagram\.com|tiktok\.com/i;

const YT = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/;
const IG = /instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/;
const TT = /tiktok\.com\/.*video\/(\d+)/;

export function platformVideoId(url: string): string | null {
  const m = url.match(YT) ?? url.match(IG) ?? url.match(TT);
  return m?.[1] ?? null;
}

export const youtubeId = (url: string) => url.match(YT)?.[1] ?? null;
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Migrar consumidores

- `lib/etl.ts`: remover `platformVideoId` local; importar de `@/lib/video-url`. Mover `fmtNum` para `lib/format.ts` (`export const fmtNum = ...`) e importar em etl.ts.
- `lib/actions.ts` e `components/home-form.tsx`: trocar a const local por `import { VIDEO_URL_RE } from "@/lib/video-url"` (renomear usos).
- `app/api/transcribe-link/route.ts`: trocar `YT_ID` local por `youtubeId()` do helper (o uso extrai o id — adaptar o call site mantendo o comportamento).
- `tests/platform-video-id.test.ts`: import de `@/lib/video-url`; ADICIONAR casos `youtube.com/live/<11>`, `youtube.com/embed/<11>`, `watch?foo=bar&v=<11>`.

**Verify**: `npm test` → todos passam (incl. os 3 novos); `grep -rn "instagram.com/(?:reels" lib/ app/ components/ | wc -l` → 1 (só no helper).

### Step 3: Migration da troca atômica

Criar `supabase/migrations/<próximo>_replace_insights_fn.sql`:

```sql
-- Substitui o snapshot de insights em UMA transação: nunca deixa a tabela vazia se o insert falhar.
create or replace function vm_replace_insights(_rows jsonb)
returns integer
language plpgsql
security definer
as $$
declare n integer;
begin
  delete from vm_viral_insights;
  insert into vm_viral_insights (scope, insight_type, payload)
  select r->>'scope', r->>'insight_type', r->'payload'
  from jsonb_array_elements(_rows) as r;
  get diagnostics n = row_count;
  return n;
end;
$$;
```

Conferir contra `supabase/migrations/0001_init.sql` as colunas reais de `vm_viral_insights` (esperado: `scope`, `insight_type`, `payload` + defaults) — se houver colunas NOT NULL extras sem default, STOP.

**Verify**: arquivo criado; SQL sintaticamente plausível (sem ferramenta local de validação — anotar em NOTES).

### Step 4: etl.ts usa a RPC com fallback

Substituir as linhas do delete+insert por:

```ts
// Troca atômica via RPC; se a function ainda não foi aplicada no banco (PGRST202),
// cai no caminho antigo (não-atômico) com aviso — rollout seguro.
const rpc = await appDb.rpc("vm_replace_insights", { _rows: rows });
if (rpc.error) {
  if (rpc.error.code !== "PGRST202") throw new Error(`vm_replace_insights: ${rpc.error.message}`);
  console.warn("vm_replace_insights ausente — aplicar migration; usando caminho não-atômico");
  await appDb.from("vm_viral_insights").delete().neq("scope", "");
  const ins = await appDb.from("vm_viral_insights").insert(rows);
  if (ins.error) throw new Error(`insert insights: ${ins.error.message}`);
}
```

**Verify**: `npx tsc --noEmit` → exit 0; `npm test` → passa.

## Test plan

- `tests/platform-video-id.test.ts` estendido (live/embed/watch&v) — já no Step 2.
- `tests/format.test.ts` (criar, 4 asserts): `fmtNum(999)="999"`, `fmtNum(1500)="2k"` (Math.round), `fmtNum(1_200_000)="1.2M"`, `fmtNum(0)="0"`.

## Done criteria

- [ ] `npm test` exit 0 (incl. novos casos)
- [ ] `npx tsc --noEmit` + `npx eslint .` exit 0
- [ ] `grep -c "platformVideoId" lib/etl.ts` → só o import/uso, sem definição local
- [ ] Migration criada; etl.ts com RPC + fallback PGRST202
- [ ] Só arquivos in-scope no diff

## STOP conditions

- Colunas de `vm_viral_insights` na migration 0001 não baterem com (scope, insight_type, payload).
- O call site de `YT_ID` no transcribe usar grupos além do [1] (adaptar exigiria mudança de comportamento — reportar).
- Testes existentes quebrarem por mudança de padrão (significa regressão de comportamento — reportar, não ajustar o teste).

## Maintenance notes

- **Operador (pós-merge)**: aplicar a migration no Supabase (via MCP `apply_migration` ou dashboard). Até lá o ETL usa o fallback não-atômico com warning — comportamento atual, sem regressão.
- Dedup do `fmtNum` em `session-view.tsx` fica para quando as mudanças concorrentes assentarem (uma linha: trocar a const local pelo import).
- Se uma nova plataforma entrar (ex: Kwai), adicionar padrão SÓ em `lib/video-url.ts` + caso de teste.
