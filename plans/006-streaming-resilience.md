# Plan 006: Streaming resiliente — heartbeat, disconnect seguro e sessões presas

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything in "STOP conditions" occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat <planned-at>..HEAD -- app/api/generate/route.ts app/api/suggest-themes/route.ts lib/pipeline/index.ts components/session-view.tsx components/home-form.tsx app/sessions/page.tsx`
> ESTE PLANO FOI ESCRITO SOBRE ARQUIVOS COM MUDANÇAS CONCORRENTES PENDENTES
> (session-view.tsx, index.ts). O despachante deve reconciliar os excerpts
> antes de te entregar o plano. Se os excerpts não baterem, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (ciclo de vida do stream)
- **Depends on**: 003 (baseline); mudanças concorrentes em session-view/index.ts commitadas
- **Category**: bug
- **Planned at**: commit `9acaf7f`, 2026-07-08 — **RECONCILIAR ANTES DE DESPACHAR**

## Why this matters

A geração leva 60-180s num SSE. Três defeitos compostos: (1) durante a fase de pesquisa (~60s) **nenhum byte flui** — o proxy LiteSpeed da Hostinger pode derrubar a conexão ociosa e a UI trava sem explicação; (2) quando o cliente desconecta (aba fechada/reload), o `controller.enqueue` do próximo `emit` **lança**, o catch do `runPipeline` marca a sessão como "error" — um simples reload mata uma geração saudável e o trabalho/custo já pago; (3) a sessão fica presa em "generating" para sempre na lista (que nunca se auto-atualiza), sem affordance de retomar. Corrigir os três torna a geração à prova de aba fechada: o servidor termina sozinho e o usuário reabre e encontra o roteiro pronto.

## Current state

(Excerpts a reconciliar no despacho — a estrutura em 9acaf7f:)

- `app/api/generate/route.ts` — `ReadableStream.start()` roda `runPipeline(sessionId, emit, opts)` e fecha; `emit` = `controller.enqueue(encoder.encode("data: ...\n\n"))`. Sem `cancel()`, sem heartbeat. Idêntico em `app/api/suggest-themes/route.ts` com `suggestThemes`.
- `lib/pipeline/index.ts` — `runPipeline` chama `emit(...)` ~10× entre fases; try/catch global marca `status:"error"` e emite `{type:"error"}` no catch.
- `components/session-view.tsx` — `generate()` consome o stream com loop reader/decoder/split("\n\n") inline; `autoStart` só quando `status==="draft"` (via `app/sessions/[id]/page.tsx:61`); nenhum tratamento para chegar numa sessão `status==="generating"`.
- `components/home-form.tsx:~168-184` — mesmo loop SSE duplicado no `suggest()`.
- `app/sessions/page.tsx` — server component `force-dynamic`, badge "Gerando" pulsante, sem refresh.

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `npm ci`           | exit 0   |
| Typecheck | `npx tsc --noEmit` | exit 0   |
| Tests     | `npm test`         | pass     |
| Lint      | `npx eslint .`     | exit 0   |

## Scope

**In scope**:
- `app/api/generate/route.ts`, `app/api/suggest-themes/route.ts`
- `lib/pipeline/index.ts` (apenas: emit safety — nada de lógica de agentes)
- `lib/sse.ts` (criar — consumer client-side compartilhado)
- `components/session-view.tsx`, `components/home-form.tsx` (usar o consumer; UI de sessão em andamento)
- `app/sessions/page.tsx` (+ um client component pequeno para auto-refresh)
- `tests/sse.test.ts` (criar)

**Out of scope**:
- Abortar as chamadas LLM no disconnect (deliberado: a geração DEVE continuar e salvar — é a correção do defeito 2).
- Refatoração maior dos god components (fora de escopo desta série).

## Git workflow

- Branch: `advisor/006-streaming-resilience`
- Commits por passo; PT-BR. NÃO fazer push.

## Steps

### Step 1: emit seguro + heartbeat nas duas rotas

Nas rotas, envolver o controller num estado `closed`:

```ts
const stream = new ReadableStream({
  async start(controller) {
    let closed = false;
    const safeEnqueue = (chunk: string) => {
      if (closed) return;
      try { controller.enqueue(encoder.encode(chunk)); } catch { closed = true; }
    };
    // heartbeat: comentário SSE a cada 15s mantém o proxy acordado nas fases mudas
    const hb = setInterval(() => safeEnqueue(": ping\n\n"), 15_000);
    const emit = (e: unknown) => safeEnqueue(`data: ${JSON.stringify(e)}\n\n`);
    try {
      await runPipeline(sessionId, emit, {...});
    } finally {
      clearInterval(hb);
      if (!closed) { try { controller.close(); } catch {} }
    }
  },
  cancel() { /* cliente desconectou — o pipeline segue e salva; nada a fazer */ },
});
```

Mesmo padrão em suggest-themes. Com isso, disconnect NÃO lança dentro do `runPipeline` → a sessão termina `done` normalmente.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: `lib/sse.ts` — consumer compartilhado

```ts
// Consome um Response SSE (data: json\n\n), ignorando comentários (heartbeat).
export async function consumeSSE(res: Response, onEvent: (e: unknown) => void) {
  if (!res.body) throw new Error("sem stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const p of parts) {
      if (!p.startsWith("data: ")) continue; // ": ping" cai aqui
      onEvent(JSON.parse(p.slice(6)));
    }
  }
}
```

Substituir os dois loops inline (session-view `generate()`, home-form `suggest()`) por `consumeSSE(res, (e) => {...})` mantendo os switches de evento exatamente como estão.

**Verify**: `npx tsc --noEmit` → exit 0; `grep -rn "getReader()" components/` → 0.

### Step 3: sessão em andamento/interrompida no detalhe

Em `session-view.tsx`: quando a página carrega com `session.status === "generating"` e NÃO é autoStart:
- Mostrar um banner "Geração em andamento em outra aba/execução — atualizando…" e um `useEffect` com `setInterval(() => router.refresh(), 8000)` enquanto o status for generating (limpar no unmount).
- Se `created_at` (ou `updated_at` se existir no shape recebido) for mais velho que 10 min, trocar o banner por "Geração interrompida" + botão "Tentar de novo" chamando `generate()` (artifacts cacheados fazem o retry pular pesquisa+narrativas).

A prop `session` já traz `status`; conferir se traz timestamp — se não trouxer, adicionar `created_at` ao select da page e à interface.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 4: auto-refresh da lista

Criar client component pequeno (`components/sessions-auto-refresh.tsx`): recebe `hasActive: boolean`; se true, `setInterval(router.refresh, 15000)`. Renderizar em `app/sessions/page.tsx` com `hasActive = rows.some(r => r.status === "generating")`.

**Verify**: `npx tsc --noEmit` → exit 0; `npx eslint .` → exit 0.

### Step 5: teste do consumer

`tests/sse.test.ts`: montar um `Response` sintético com `ReadableStream` emitindo: evento normal, heartbeat `: ping\n\n` (ignorado), evento quebrado em 2 chunks no meio do JSON (o buffer une), dois eventos num chunk. Assert da sequência recebida por `onEvent`.

**Verify**: `npm test` → passa.

## Test plan

`tests/sse.test.ts` (4 casos acima). O comportamento server-side (heartbeat/cancel) fica verificado por typecheck + smoke manual do operador pós-merge (gerar um roteiro, recarregar a aba no meio, confirmar que a sessão termina `done`).

## Done criteria

- [ ] `npm test`, `npx tsc --noEmit`, `npx eslint .` exit 0
- [ ] `grep -c "ping" app/api/generate/route.ts app/api/suggest-themes/route.ts` → 1 cada
- [ ] `grep -rn "getReader()" components/` → 0 (só em lib/sse.ts)
- [ ] Banner/refresh presentes (grep "Geração interrompida" em session-view)
- [ ] Só arquivos in-scope no diff

## STOP conditions

- Excerpts não batem (drift das mudanças concorrentes não reconciliado).
- O shape de `session` na page não expõe timestamp e adicioná-lo exigir mudanças fora do escopo.
- Qualquer necessidade de mudar assinaturas em `lib/pipeline/agents.ts`.

## Maintenance notes

- **Operador pós-merge + deploy**: teste real na Hostinger — iniciar geração, fechar aba, reabrir em ~3 min: esperado status `done` com roteiro salvo. Isso valida o risco de proxy documentado.
- Se um dia quiser retomar o STREAM (não só o resultado), precisará de um canal pub/sub (ex: Supabase Realtime) — deliberadamente fora deste plano.
