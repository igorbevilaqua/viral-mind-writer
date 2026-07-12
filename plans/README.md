# Implementation Plans — Viral Mind

Gerados pela auditoria de 2026-07-08 (skill improve). Baseline: commit `9acaf7f`.
Executar na ordem abaixo salvo dependências. Cada executor: ler o plano inteiro,
honrar os STOP conditions, e o REVISOR atualiza a linha de status.

**⚠️ Nota operacional**: há mudanças concorrentes NÃO COMMITADAS de outra sessão
em `lib/pipeline/agents.ts`, `lib/pipeline/index.ts`, `components/session-view.tsx`,
`components/nav.tsx`, `app/layout.tsx`, `next.config.ts` (+ `lib/version.ts`,
`supabase/migrations/0008_session_debug.sql`). Planos que tocam esses arquivos
(002, 006, 008, e parcialmente 009/010) só despacham DEPOIS desse trabalho ser
commitado e os excerpts reconciliados.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001  | Cron ETL fail-closed | P1 | S | — | DONE (merged 2d169e6) |
| 004  | DX: .env.example, AGENTS.md, CI, higiene | P2 | S | — | DONE (merged 83efd74) |
| 002  | Blindar chamadas LLM restantes (max_tokens + parser único) | P1 | S | concorrentes commitadas ✅ | DONE (merged 14262ca) |
| 003  | Baseline vitest + testes dos parsers | P1 | M | — | DONE (merged ee0fc17, pushed) |
| 005  | Flywheel: ETL atômico (migration 0009) + URL unificada | P1 | M | 002,003 | DONE (merged 1688e28, pushed — ⚠️ migration 0009 pendente de aplicar no banco) |
| 007  | swapHook seguro + autoria user_id | P2 | S | 005 | IN PROGRESS (executor, rebaselined 1688e28) |
| 005  | Flywheel: ETL atômico + URL unificada | P1 | M | 002, 003 | TODO |
| 006  | Streaming resiliente (heartbeat, disconnect, sessões presas) | P1 | M | 003, concorrentes | ABSORVIDO no 012 (WP-A) |
| 007  | swapHook seguro + autoria user_id | P2 | S | 005 | TODO |
| 008  | Eficiência de tokens (effort, cache, paralelização, dieta) | P1 | M | 003, 006, concorrentes | ABSORVIDO no 012 (WP-D) |
| 009  | Sync de performance sob demanda | P2 | M | 005, 006, 007 | TODO |
| 011  | Few-shot ponderado por performance | P3 | S/M | 008 | ABSORVIDO no 012 |
| 010  | Loop supervisionado (edição→Professor→lição) + captura de decisões | P2 | L | 002, 007 | ABSORVIDO no 012 |
| 012  | Update CODEX Autoevolutivo (auditoria 2026-07-11; absorve 006/008/010/011) | P1 | L | — | DONE (ondas 1-4 mergeadas; migrations 0010-0015 aplicadas no banco) |

Status: TODO | IN PROGRESS | DONE | BLOCKED (motivo) | REJECTED (motivo)

## Ondas de despacho (arquivos disjuntos por onda)

- **Onda 1**: 001 ✅, 004 (em execução) — sem interseção com mudanças concorrentes.
- **Onda 2** (após concorrentes commitadas + reconciliação): 003, 002.
- **Onda 3**: 005, 006.
- **Onda 4**: 007, 008.
- **Onda 5**: 009, 011.
- **Onda 6**: 010.

## Dependency notes

- 003 antes de tudo que refatora `lib/` (testes de caracterização protegem os parsers).
- 002 exporta `toolInput`/`toolArray` que o 003 NÃO testa (o teste entra junto do 002, pois `agents.ts` tem mudanças concorrentes).
- 005 depende de 002 (ambos tocam `etl.ts`) e de 003 (atualiza `tests/platform-video-id.test.ts`).
- 007/009/010 tocam `lib/actions.ts` — estritamente sequenciais.
- 008 e 011 tocam `lib/pipeline/context.ts` — 011 só depois do 008.
- Migrations criadas pelos planos (005, 010) são APLICADAS pelo operador via Supabase MCP após o merge — executores não têm acesso ao banco.

## Findings considered and rejected

- Open-redirect em `/auth/confirm`: refutado — redirects hardcoded, sem param honrado.
- Cobertura do middleware sobre server actions/API: refutada como lacuna — tudo coberto exceto `/api/cron` (que virou o plano 001).
- XSS via `Linkified`: refutado — só `https?://` vira anchor e React escapa texto.
- Over-fetch de `pipeline_trace` nas listas: refutado — não é selecionado.
- `tsconfig.tsbuildinfo`/`.zip`/`.rtf` commitados: refutado — já gitignorados.
- Refactor dos god components (`session-view` 893L, `home-form` 471L): adiado deliberadamente — risco alto sem baseline de testes consolidado; reavaliar após ondas 1-4.
- "Pauta do dia" agendada e batch de geração (DIR-05) e histórico por cliente (DIR-06): reconhecidos como direção válida, deixados FORA desta série a pedido de escopo — candidatos à próxima rodada.

## Verificação padrão (gate de todos os planos)

```
npx tsc --noEmit && npx eslint . && npm run check && npm test
```

(`npm test` passa a existir no plano 003; CI do plano 004 roda tudo em PR/push.)
