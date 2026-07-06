# Viral Mind v2

Escritório de roteiristas virais movido pelos dados de +6 mil vídeos publicados.

## Como funciona

Pipeline de 3 fases por geração (`lib/pipeline/`):

1. **Coleta** — insights pré-computados do corpus (Viral Data), preferências do cliente, playbooks e busca vetorial de roteiros reais similares. Se houver anexo marcado como *modelagem*, uma chamada desconstrói a estrutura viral e gera o brief de replicação.
2. **Rascunho** — roteirista-chefe (`claude-fable-5`) escreve com tudo isso no contexto, streaming para a UI. Gera roteiro + 3 variações de hook.
3. **Refino** — crítica multi-chapéu (hook, storytelling, comando, ritmo, restrições do cliente) + passe humanizador com lint determinístico anti-clichê de IA (`vm_banned_phrases`, editável no banco).

## Rodar

1. Preencha as 4 chaves em `.env.local` (marcadas com `COLE_AQUI`):
   - `SUPABASE_SERVICE_ROLE_KEY` e `VIRAL_DATA_SERVICE_ROLE_KEY` — a mesma **secret** (`sb_secret_...`) do projeto **Viral Data** → Settings → API Keys
   - `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (OpenAI só para embeddings)
2. Popular os insights do corpus (repete toda segunda via Vercel Cron em produção):
   ```
   npm run etl
   ```
3. `npm run dev`

## Estrutura de dados

- Tudo vive num único projeto Supabase, o **Viral Data** (`qclvrddr...`): as tabelas do app têm prefixo `vm_` e convivem com o corpus (`videos`, `metricas_*`, `clientes`, `documents`). O projeto antigo "Viral Mind" (`eakiimzf...`) está aposentado.
- Clientes do app = tabela `clientes` do corpus (filtrados por `ativo`). Do corpus o pipeline usa `match_documents`, `vm_insights_snapshot()` e `vm_published_scripts()`.
- Flywheel: quando um roteiro gerado for publicado, registre o id dele em `videos.crm_script_id` no Viral Data — o ETL semanal traz a performance de volta para `vm_script_performance`.

## Playbooks

Vivem na tabela `vm_playbooks` (markdown, versionado por linha, editável sem deploy). `style_guide` já tem conteúdo funcional; `hook`, `storytelling` e `comando` são placeholders aguardando os playbooks oficiais — basta inserir uma nova versão com `active = true` (e desativar a anterior).

## Checks

- `npm run check` — self-check do slop-lint
- `npm run build` — build de produção

## Pendências conhecidas

- **Sem autenticação** ainda — não exponha publicamente antes de adicionar (Supabase Auth magic link) ou proteger o deploy.
- Transcrição automática de links (Reels/TikTok/YT) — por ora, cole a transcrição no anexo.
- Backfill de embeddings dos ~5k roteiros sem embedding no corpus (melhora o few-shot).
