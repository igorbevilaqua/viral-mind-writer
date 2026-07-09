# Plan 010: Fechar o loop supervisionado — edições e decisões viram aprendizado

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything in "STOP conditions" occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat <planned-at>..HEAD -- lib/actions.ts lib/pipeline/teach.ts components/home-form.tsx app/ensinar/page.tsx supabase/migrations`
> Compare excerpts; on mismatch, STOP.

## Status

- **Priority**: P2 (a lacuna nº 1 da missão do produto)
- **Effort**: L
- **Risk**: MED (novo caminho LLM no finalize; curadoria evita poluir o contexto)
- **Depends on**: 002 (teach.ts endurecido), 007 (actions assentado + user_id)
- **Category**: direction
- **Planned at**: commit `9acaf7f`, 2026-07-08 — reconciliar SHA no despacho

## Why this matters

O produto PROMETE na própria UI que a versão editada do roteiro é "o insumo mais valioso para o sistema aprender" — e hoje **nada lê `vm_script_feedback`**. O sinal supervisionado mais forte que existe (o que um humano mudou num roteiro da sala) é descartado. Os trilhos de consumo JÁ existem: o agente Professor extrai aprendizados dimensionados e o `taughtBlock` injeta os ativos na sala com precedência e orçamento. Este plano liga a ponta solta: edição → diff → Professor → lição revisável no /ensinar (curadoria humana = gate contra poluição). De quebra, captura duas decisões que hoje evaporam: qual sugestão de tema virou sessão (origem) e qual variação de hook o humano escolheu.

## Current state

- `lib/actions.ts:64-82` — `finalizeSession` insere rating/notes/`edited_version` em `vm_script_feedback` e fecha a sessão. Nada mais consome a tabela (verificado por grep no repo inteiro).
- `lib/pipeline/teach.ts` — `extractLearnings({ transcript, sourceUrl?, contextNote?, clientNome? })` → Professor → `ExtractedLearning[]` (dimensao/titulo/descricao/evidencia). Pós-plano 002: usa `toolInput`/`toolArray`, max_tokens 8000.
- `lib/actions.ts:95-126` — `saveLesson(...)` cria `vm_lessons` + `vm_lesson_learnings`; `source_kind` gravado como `"video_link" | "texto"`; **sem check constraint no schema** (verificado na migration 0001 — só attachments.kind e rating têm check).
- `/ensinar` lista lições (`app/ensinar/page.tsx`) e cada lição tem view própria com toggles de ativo.
- `components/home-form.tsx` — `applyTheme(s)` preenche o textarea com o tema; `createSession` não recebe nenhuma marca de origem. `lib/actions.ts:13-38` — `createSession` insere `{prompt, client_id, user_id}`.
- `lib/actions.ts` — `swapHook` (pós-007: usa `swapHookInRoteiro`, grava `removido` na variação).
- `vm_sessions` NÃO tem coluna de origem (migration 0001). `vm_generated_scripts.pipeline_trace` é jsonb livre.

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `npm ci`           | exit 0   |
| Typecheck | `npx tsc --noEmit` | exit 0   |
| Tests     | `npm test`         | pass     |
| Lint      | `npx eslint .`     | exit 0   |

## Scope

**In scope**:
- `lib/pipeline/teach.ts` (nova função `extractFromEdit`)
- `lib/actions.ts` (`finalizeSession` + `createSession` origem + `swapHook` trace)
- `components/home-form.tsx` (passar origem da sugestão)
- `supabase/migrations/<próximo>_session_origin.sql` (criar — coluna `origin jsonb` em vm_sessions)
- `app/sessions/[id]/page.tsx` SOMENTE se necessário para propagar tipo (verificar)
- `tests/` (novo teste do prompt-builder puro, se extraído)

**Out of scope**:
- Few-shot ponderado por performance (plano 011).
- Dashboards/agregações de slop-lint (deferido — só captura aqui).
- Mudar o formato de `taughtBlock`/roteamento (já funciona).

## Git workflow

- Branch: `advisor/010-learning-loop` · PT-BR · NÃO fazer push.

## Steps

### Step 1: `extractFromEdit` no teach.ts

Nova função reutilizando o Professor:

```ts
// Aprende com a edição humana: recebe o roteiro da sala e a versão editada,
// extrai o QUE mudou como aprendizados dimensionados (mesmo formato do Ensinar).
export async function extractFromEdit(input: {
  original: string;
  editada: string;
  clientNome?: string;
  notes?: string;
}): Promise<ExtractedLearning[]>
```

Implementação: mesma chamada do `extractLearnings` (mesmo tool schema/system), mas com user content próprio:

```
Um roteirista humano EDITOU um roteiro produzido pela sala antes de usar.
As diferenças entre as versões são decisões editoriais deliberadas — extraia
o que a sala deveria aprender delas (o que o humano cortou, reforçou, reescreveu e POR QUÊ, quando inferível).
${notes ? `Observações do roteirista: ${notes}` : ""}

=== VERSÃO DA SALA ===
${original.slice(0, 15_000)}

=== VERSÃO EDITADA (final humano) ===
${editada.slice(0, 15_000)}

Extraia os aprendizados (só das DIFERENÇAS; ignore o que ficou igual).
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: finalizeSession fecha o loop

Após inserir o feedback, se `edited_version` não-vazio e diferente do roteiro:

```ts
// Loop supervisionado: edição vira lição pendente de revisão no /ensinar.
// Falha aqui NUNCA bloqueia o encerramento da sessão.
try {
  const { data: script } = await appDb.from("vm_generated_scripts")
    .select("roteiro, client_id").eq("id", scriptId).single();
  if (script && form.edited_version.trim() && form.edited_version.trim() !== script.roteiro.trim()) {
    const learnings = await extractFromEdit({ original: script.roteiro, editada: form.edited_version, notes: form.notes || undefined });
    if (learnings.length) {
      // active: false — entra DESATIVADO; humano revisa e ativa no /ensinar (gate de curadoria)
      await appDb.from("vm_lessons").insert({ client_id: script.client_id, source_kind: "feedback", source_title: "Edição de roteiro (feedback de sessão)", transcript: form.edited_version, context_note: form.notes || null })
        .select("id").single()
        .then(({ data: lesson }) => lesson && appDb.from("vm_lesson_learnings").insert(
          learnings.map((l) => ({ ...l, evidencia: l.evidencia ?? null, origem: "extraido", active: false, lesson_id: lesson.id }))
        ));
    }
  }
} catch (e) { console.error("loop de aprendizado da edição falhou, feedback salvo mesmo assim", e); }
```

(Adaptar à forma real do insert de saveLesson; o ponto inegociável: try/catch envolvendo TUDO + `active: false`.)

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: origem da sessão (sugestão → resultado)

- Migration `<próximo>_session_origin.sql`: `alter table vm_sessions add column if not exists origin jsonb;` (comentário: origem da pauta — ex: sugestão do ideador).
- `createSession`: aceitar `origin?: { kind: "suggestion"; tema: string; reaproveitado_de?: unknown } | null` e gravar.
- `home-form.tsx`: guardar num `useRef` a sugestão aplicada em `applyTheme` (limpar se o usuário zerar o prompt); `submit()` passa `origin` quando o prompt atual ainda contém `s.tema`.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 4: rastro do swap de hook

No `swapHook`, após o update, gravar no `pipeline_trace` do script (merge jsonb client-side: select trace → append em `trace.hook_swaps = [...(trace.hook_swaps ?? []), { de: removido.slice(0,120), para: novo.slice(0,120), at: new Date().toISOString() }]` → update). Best-effort com try/catch (rastro nunca quebra o swap).

**Verify**: `npx tsc --noEmit` → exit 0; `npm test` → passa (testes do swap seguem verdes).

## Test plan

- Se o prompt-builder do Step 1 for extraído como função pura (recomendado: `buildEditPrompt(original, editada, notes?)`), testar: contém as duas versões truncadas, contém notes quando presente.
- Smoke do operador (pós-merge): finalizar uma sessão com edição colada → conferir lição nova em /ensinar com aprendizados desativados; ativar um e gerar novo roteiro do mesmo cliente → aprendizado aparece via taughtBlock.

## Done criteria

- [ ] `npm test`, `npx tsc --noEmit`, `npx eslint .` exit 0
- [ ] `grep -c "extractFromEdit" lib/actions.ts lib/pipeline/teach.ts` → ≥1 cada
- [ ] `grep -n "active: false" lib/actions.ts` → presente no caminho do feedback
- [ ] Migration de origin criada; `createSession` grava origin
- [ ] `grep -c "hook_swaps" lib/actions.ts` → ≥1
- [ ] Só arquivos in-scope no diff

## STOP conditions

- Excerpts não batem (drift).
- `vm_lessons.source_kind` tiver check constraint que rejeite "feedback" (verificar migrations TODAS antes do Step 2; se houver, criar migration relaxando e reportar em NOTES).
- `finalizeSession` ganhar latência > 30s no caminho feliz por causa da extração — se o typecheck/estrutura indicar que não há como manter o try/catch não-bloqueante dentro do action, reportar (não usar fire-and-forget sem await em serverless — o processo pode morrer; na Hostinger processo é longo, então await simples com try/catch é o desenho certo).

## Maintenance notes

- **Operador**: aplicar a migration de `origin` no Supabase antes do deploy desta mudança (o insert com coluna inexistente falha).
- A UI do /ensinar mostrará as lições "feedback" na lista existente; um filtro por source_kind é melhoria futura barata.
- Análise futura (deliberadamente deferida): agregação de `hook_swaps` + `origin` × performance → "qual mecanismo de hook os humanos preferem", "sugestões aceitas performam melhor?". Os dados passam a existir a partir daqui.
- Quando houver confiança na qualidade, `active: false` pode virar um toggle "auto-ativar aprendizados de edição" — decisão de produto, não técnica.
