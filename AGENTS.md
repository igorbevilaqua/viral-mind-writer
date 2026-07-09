# AGENTS.md

## 1. O que é

Viral Mind é um escritório de roteiristas virais movido por um corpus de ~6.000 vídeos.
Uma sala de agentes de IA (pesquisa → narrativas → ranking → roteiro → revisão → humanização)
produz roteiros a partir de dados reais de performance, não de achismo.

## 2. ⚠️ Deploy: push na main = produção na hora

Push na branch `main` dispara deploy automático na Hostinger (~5s depois do push).
Commits locais são seguros e reversíveis. **Nunca faça `git push` sem instrução explícita
do usuário nesse momento** — mesmo que o usuário tenha pedido push antes em outra tarefa.

## 3. Arquitetura

- App Next.js 16 (App Router).
- Pipeline multi-agente em `lib/pipeline/`: pesquisa Grok → narrativas sonnet → ranking
  sonnet → roteiro fable (streaming) → hook ∥ comando fable (paralelo) → revisão sonnet →
  humanização fable + slop-lint determinístico.
- Prompts dos agentes vivem em `agents/*.md` — fonte única de verdade, nunca inline no código.
- Dois clients Supabase em `lib/db.ts`, apontando para o **mesmo projeto físico** ("Viral Data"):
  `appDb` (tabelas `vm_*`, dados do produto) e `viralData` (corpus read-mostly de 6k vídeos).
- ETL semanal em `lib/etl.ts`: flywheel — roteiro publicado → performance real → insights que
  realimentam a sala via `crm_script_id`.
- Auth por magic link + allowlist (`VM_ALLOWED_EMAILS`) em `middleware.ts`.

## 4. Gate de verificação

Rode sempre antes de considerar uma mudança pronta:

```
npx tsc --noEmit && npx eslint . && npm run check
```

Quando existir `npm test`, incluir também. CI (`.github/workflows/ci.yml`) roda o mesmo gate
em todo push/PR.

## 5. Convenções

- Comentários curtos em PT-BR explicando o *porquê*, não o *o quê*.
- Chamadas LLM com tool forçada usam `toolInput`/`toolArray` de `lib/pipeline/agents.ts`.
- `max_tokens` das chamadas com thinking deve ser ≥ 4000 — o thinking consome do mesmo teto.
- Prompts de agentes ficam em `agents/*.md`, nunca inline no código.

## 6. Env

Ver `.env.example` na raiz para a lista completa de variáveis e onde cada uma é usada.
