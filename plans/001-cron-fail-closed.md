# Plan 001: Fechar o cron ETL quando CRON_SECRET não está configurado

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 9acaf7f..HEAD -- app/api/cron/weekly-etl/route.ts`
> If the file changed since this plan was written, compare the "Current state"
> excerpt against the live code before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `9acaf7f`, 2026-07-08

## Why this matters

`GET /api/cron/weekly-etl` dispara o ETL semanal: apaga TODOS os insights (`vm_viral_insights`) e refaz com dezenas de chamadas pagas a Claude/Grok. A rota está em `PUBLIC_PATHS` do middleware (por design — o cron externo não tem sessão), e a checagem de auth é **fail-open**: se `CRON_SECRET` não estiver definido no ambiente, a comparação é pulada e qualquer anônimo executa a operação destrutiva e cara. Deploy é na Hostinger via env vars manuais — um esquecimento de env var não pode significar rota aberta.

## Current state

- `app/api/cron/weekly-etl/route.ts` — arquivo inteiro (13 linhas):

```ts
import { runWeeklyEtl } from "@/lib/etl";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const result = await runWeeklyEtl();
  return Response.json(result);
}
```

- `middleware.ts:6` — `const PUBLIC_PATHS = ["/login", "/auth", "/api/cron"];` (não mexer; o design é o secret proteger a rota).
- Convenção do repo: comentários curtos em português; código terso.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm ci`                 | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Lint      | `npx eslint app/api/cron/weekly-etl/route.ts` | exit 0 |

## Scope

**In scope** (the only file you should modify):
- `app/api/cron/weekly-etl/route.ts`

**Out of scope**:
- `middleware.ts` — o `/api/cron` em PUBLIC_PATHS é intencional.
- `lib/etl.ts` — a atomicidade do ETL é o plano 005, não este.

## Git workflow

- Branch: `advisor/001-cron-fail-closed`
- Um commit; mensagem estilo do repo (`git log`): prefixo `Fix:` + descrição curta em português.
- NÃO fazer push.

## Steps

### Step 1: Tornar a checagem fail-closed

Substituir o `if` por uma forma que rejeita quando o secret está ausente OU não bate:

```ts
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // fail-closed: sem secret configurado, a rota não roda (é pública no middleware)
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const result = await runWeeklyEtl();
  return Response.json(result);
}
```

**Verify**: `npx tsc --noEmit` → exit 0; `npx eslint app/api/cron/weekly-etl/route.ts` → exit 0.

### Step 2: Confirmar que o padrão fail-open sumiu

**Verify**: `grep -n "process.env.CRON_SECRET &&" app/api/cron/weekly-etl/route.ts` → nenhuma ocorrência (exit 1).

## Test plan

Sem framework de teste neste momento (chega no plano 003). A verificação é o grep do Step 2 + typecheck. Não criar testes aqui.

## Done criteria

- [ ] `npx tsc --noEmit` exit 0
- [ ] `npx eslint app/api/cron/weekly-etl/route.ts` exit 0
- [ ] `grep -c "fail-closed" app/api/cron/weekly-etl/route.ts` retorna 1
- [ ] `git status --short` mostra apenas `app/api/cron/weekly-etl/route.ts` modificado

## STOP conditions

- O arquivo atual não bate com o excerpt em "Current state".
- Typecheck falha por qualquer motivo não introduzido por você.

## Maintenance notes

- **Operador (pós-merge)**: confirmar no hPanel da Hostinger que `CRON_SECRET` está definido em produção — após este plano, cron sem secret passa a falhar com 401 (comportamento desejado, mas o job semanal para de rodar até configurar). Rotacionar o valor se houver suspeita de que a rota ficou aberta em algum período.
- Se um dia houver mais rotas de cron, extrair a checagem para um helper único.
