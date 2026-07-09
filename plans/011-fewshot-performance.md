# Plan 011: Few-shot ponderado por performance — imitar vencedores, não só parecidos

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything in "STOP conditions" occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat <planned-at>..HEAD -- lib/pipeline/context.ts`
> Compare excerpts; on mismatch, STOP.

## Status

- **Priority**: P3
- **Effort**: S/M
- **Risk**: MED (mudança de contexto criativo — precisa spot-check de qualidade)
- **Depends on**: 008 (context.ts assentado)
- **Category**: direction
- **Planned at**: commit `9acaf7f`, 2026-07-08 — reconciliar SHA no despacho

## Why this matters

Hoje o few-shot do roteirista vem SÓ de similaridade de embedding com o corpus (`match_documents`) — o gerador imita roteiros *parecidos com o tema*, não roteiros *comprovadamente vencedores*, e nunca os próprios hits da sala. O flywheel já traz performance real (`vm_script_performance`); usar os melhores roteiros publicados DO PRÓPRIO CLIENTE como exemplares de voz/estrutura fecha mais um elo do "aprender com o algoritmo": o que funcionou vira referência ativa da próxima geração.

## Current state

- `lib/pipeline/context.ts:16-33` (pós-008 pode ter cache de embedding — reconciliar):

```ts
async function fetchFewShot(prompt: string, clientId: string | null) {
  const fewShot: { roteiro: string; origem: string }[] = [];
  try {
    const queryEmbedding = await embed(prompt);
    const corpus = await viralData.rpc("match_documents", { query_embedding: queryEmbedding, match_count: 5, match_threshold: 0.3 });
    for (const d of corpus.data ?? []) {
      if (d.content) fewShot.push({ roteiro: d.content, origem: "roteiro publicado (corpus)" });
    }
  } catch (e) { console.error("few-shot search failed, seguindo sem exemplos vetoriais", e); }
  void clientId; // ponytail: filtro de few-shot por cliente entra quando o corpus tiver embeddings por cliente
  return fewShot.slice(0, 6);
}
```

- `vm_generated_scripts` (appDb): `id, client_id, roteiro, hook, status, ...`; `vm_script_performance`: `script_id, views, retencao_hook, retencao_final, seguidores_ganhos, ...` (1:1 por script sincronizado).
- O consumo é `buildDynamicSystemBlock` → "ROTEIROS REAIS DE ALTA PERFORMANCE (imite o REGISTRO e a NATURALIDADE, nunca o conteúdo)" com `f.origem` no título de cada exemplo.
- `lib/format.ts` (pós-005) exporta `fmtNum`.

## Commands you will need

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Install   | `npm ci`           | exit 0   |
| Typecheck | `npx tsc --noEmit` | exit 0   |
| Tests     | `npm test`         | pass     |
| Lint      | `npx eslint lib/`  | exit 0   |

## Scope

**In scope**: `lib/pipeline/context.ts`, `tests/fewshot-blend.test.ts` (se a mistura for extraída pura — recomendado).

**Out of scope**: `match_documents`/RPCs do corpus; `buildDynamicSystemBlock` (o formato de consumo fica igual); qualquer coisa de embedding backfill.

## Git workflow

- Branch: `advisor/011-fewshot-performance` · PT-BR · NÃO fazer push.

## Steps

### Step 1: buscar os hits da sala para o cliente

Em `fetchFewShot`, quando `clientId` não-nulo, ANTES da busca vetorial:

```ts
// Hits da própria sala: roteiros publicados deste cliente com melhor performance real.
// Entram primeiro no few-shot — o que funcionou é referência ativa, não só o que é parecido.
const { data: hits } = await appDb
  .from("vm_script_performance")
  .select("views, vm_generated_scripts!inner(roteiro, client_id)")
  .eq("vm_generated_scripts.client_id", clientId)
  .not("views", "is", null)
  .order("views", { ascending: false })
  .limit(2);
```

(Confirmar a sintaxe do join aninhado supabase-js contra o schema; se o FK reverso não resolver, fazer em 2 queries: top performance → ids → roteiros.) Mapear para `{ roteiro, origem: \`hit da sala (${fmtNum(views)} views)\` }`. `appDb` já é importado no arquivo? — verificar; importar de `../db` se não.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: mistura com teto

Extrair função pura:

```ts
// Mistura: até 2 hits da sala primeiro, corpus por similaridade completa até 6.
export function blendFewShot(hits: FewShotItem[], corpus: FewShotItem[], max = 6): FewShotItem[] {
  const seen = new Set<string>();
  const out: FewShotItem[] = [];
  for (const f of [...hits.slice(0, 2), ...corpus]) {
    const key = f.roteiro.slice(0, 200);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
    if (out.length === max) break;
  }
  return out;
}
```

`fetchFewShot` retorna `blendFewShot(hits, corpusItems)`. Falha na query de hits NUNCA derruba (try/catch com console.error, segue só com corpus — mesmo padrão do arquivo). Remover o `void clientId` e seu comentário ponytail (agora o clientId É usado).

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: teste

`tests/fewshot-blend.test.ts`: hits primeiro; teto 6 respeitado; dedup por prefixo; zero hits → só corpus; corpus vazio → só hits.

**Verify**: `npm test` → passa.

## Test plan

Step 3 + spot-check do operador: gerar para um cliente COM performance sincronizada e conferir no `pipeline_trace.few_shot_origens` que "hit da sala" aparece.

## Done criteria

- [ ] `npm test`, `npx tsc --noEmit`, `npx eslint lib/` exit 0
- [ ] `grep -c "hit da sala" lib/pipeline/context.ts` → 1
- [ ] `grep -n "void clientId" lib/pipeline/context.ts` → 0
- [ ] Só arquivos in-scope no diff

## STOP conditions

- Excerpts não batem (drift).
- O join supabase-js não resolver nem em 2 queries sem mudança de schema.

## Maintenance notes

- Guard contra overfit: máx 2 hits e sempre misturado com corpus por similaridade. Se a voz começar a "ecoar" os mesmos 2 roteiros, reduzir para 1 ou rotacionar por recência.
- Quando o backfill de embeddings do corpus rodar (pendência do README), avaliar filtro por cliente TAMBÉM na busca vetorial.
- Futuro natural: ponderar por `retencao_final`/`seguidores_ganhos` além de views (uma linha no order).
