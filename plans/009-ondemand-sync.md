# Plan 009: Sync de performance sob demanda — flywheel em minutos, não em 7 dias

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything in "STOP conditions" occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat <planned-at>..HEAD -- lib/etl.ts lib/actions.ts components/session-view.tsx`
> Compare excerpts; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (não pode arrastar o rebuild destrutivo de insights para o clique)
- **Depends on**: 005 (etl refatorado), 006/007 (session-view/actions assentados)
- **Category**: direction
- **Planned at**: commit `9acaf7f`, 2026-07-08 — reconciliar SHA no despacho

## Why this matters

O flywheel (roteiro publicado → performance real → sala aprende) só roda **segunda-feira às 9h** via cron. Um roteiro publicado na segunda à tarde espera ~7 dias para: (a) mostrar os chips de views/retenção na sessão, (b) virar insight `client_scriptresult` que confirma/derruba estruturas nas próximas gerações. A UI hoje literalmente pede paciência ("sincroniza toda segunda"). O objetivo declarado do produto é aprender do algoritmo — 7 dias de latência no sinal mais valioso contradiz isso. A lógica per-script já existe autocontida em `lib/etl.ts` (match URL→vídeo + upsert performance); é extração + server action + botão.

## Current state

- `lib/etl.ts` (pós-plano 005): Flywheel 1/3 (linhas ~218-248: casa `published_url` → `videos.crm_script_id` via `platformVideoId` de `@/lib/video-url`, nunca sobrescreve vínculo) e 2/3 (linhas ~250-286: RPC `vm_published_scripts` → upsert `vm_script_performance`). Flywheel 3/3 (insights `client_scriptresult`) fica DENTRO do rebuild semanal — fora deste plano.
- `components/session-view.tsx` — `PublishBox` mostra, quando `perf == null`: "Aguardando métricas — sincroniza toda segunda, quando o vídeo entrar no corpus." com dot pulsante.
- `lib/actions.ts` — server actions com padrão `"use server"`, throws com `error.message`, `revalidatePath`.
- RPC `vm_published_scripts()` retorna TODAS as linhas publicadas casadas (sem filtro por script) — filtrar client-side pelo id é aceitável (dezenas de linhas).

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `npm ci`           | exit 0   |
| Typecheck | `npx tsc --noEmit` | exit 0   |
| Tests     | `npm test`         | pass     |
| Lint      | `npx eslint .`     | exit 0   |

## Scope

**In scope**:
- `lib/flywheel.ts` (criar — lógica per-script extraída)
- `lib/etl.ts` (chamar a função extraída no lugar do bloco inline)
- `lib/actions.ts` (nova action `syncScriptPerformance`)
- `components/session-view.tsx` (botão no PublishBox)

**Out of scope**:
- O rebuild de insights (`vm_replace_insights` / boas práticas / snapshot) — continua SÓ no cron semanal.
- Qualquer mudança no matching além de mover código.

## Git workflow

- Branch: `advisor/009-ondemand-sync` · PT-BR · NÃO fazer push.

## Steps

### Step 1: extrair `lib/flywheel.ts`

```ts
// Flywheel per-script: casa a URL publicada com o vídeo do corpus e puxa a
// performance real. Usado pelo cron semanal (todos) e pelo botão da sessão (um).
export async function syncScriptPerformance(scriptId: string): Promise<
  { linked: boolean; synced: boolean; reason?: string }
>
```

Corpo: buscar o script (status published + published_url), tentar o link (mesma lógica/ordem do etl: já linkado? senão `platformVideoId` + busca em `videos` + update com `is("crm_script_id", null)`), depois `vm_published_scripts` filtrado pelo id → upsert em `vm_script_performance`. Retornar razões legíveis (`"sem vínculo no corpus ainda"`, `"performance sincronizada"`, etc.). O etl.ts passa a iterar chamando esta função (preservando os contadores `linked`/`synced`).

**Verify**: `npx tsc --noEmit` → exit 0; `npm test` → passa.

### Step 2: server action

Em `lib/actions.ts`:

```ts
export async function syncPerformanceNow(scriptId: string): Promise<string> {
  const r = await syncScriptPerformance(scriptId);
  revalidatePath("/sessions");
  return r.reason ?? (r.synced ? "performance sincronizada" : "vídeo ainda não está no corpus — tente mais tarde");
}
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: botão na UI

No `PublishBox` (estado `perf == null`), ao lado do aviso: botão "Sincronizar agora" (mesmo estilo dos botões secundários do arquivo — borda `border-white/15`, hover gold) com `useTransition`; resultado numa linha de texto (`text-xs`) abaixo; erro em `text-red-300`. Ajustar o copy do aviso para: "Sem métricas ainda — o vídeo entra no corpus em até alguns dias após a publicação."

**Verify**: `npx tsc --noEmit` → exit 0; `npx eslint .` → exit 0.

## Test plan

`lib/flywheel.ts` toca DB — sem teste unitário (sem harness de DB). Cobertura indireta: `platformVideoId` já testado (003/005). Smoke do operador: numa sessão com roteiro publicado, clicar "Sincronizar agora" e conferir chips ou razão amigável.

## Done criteria

- [ ] `npm test`, `npx tsc --noEmit`, `npx eslint .` exit 0
- [ ] `lib/etl.ts` sem lógica inline de link/upsert per-script (grep `crm_script_id` em etl.ts → só via flywheel import ou leitura de pubScripts)
- [ ] Botão presente (grep "Sincronizar agora" em session-view.tsx → 1)
- [ ] Rebuild de insights INALTERADO no cron
- [ ] Só arquivos in-scope no diff

## STOP conditions

- Excerpts não batem (drift).
- A extração exigir mudar o SHAPE de retorno do runWeeklyEtl (contadores) — adaptar mantendo compatível; se impossível, reportar.

## Maintenance notes

- O insight `client_scriptresult` do roteiro sincronizado só aparece no PRÓXIMO cron (rebuild semanal) — os chips aparecem na hora. Se quiser insight imediato no futuro, extrair também o passo 3/3 com upsert por script (deliberadamente deferido: o wipe/rebuild é semanal por design).
- Rate: o botão chama 2-3 queries + 1 RPC — sem throttle necessário para uso interno.
