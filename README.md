# Viral Mind v2

Escritório de roteiristas virais movido pelos dados de +6 mil vídeos publicados.

## Como funciona — sala de agentes

Os papéis vivem em `agents/*.md` (fonte única de verdade, consumida pelo app e pela skill `/goal` do Claude Code). O grafo (`lib/pipeline/index.ts`) é um DAG com 1 negociação:

1. **Pesquisador** (Grok `grok-4.3` + busca em tempo real) monta o dossiê factual do tema. Falha de pesquisa nunca aborta a geração.
2. **Storytelling** (sonnet) propõe 2-3 narrativas candidatas a partir do playbook de 14 estruturas + dossiê.
3. **Dados** (sonnet) rankeia as candidatas pelos padrões do corpus e produz orientações de roteiro e hook — a negociação da sala. A vencedora é automática; o usuário pode trocar na UI (cards de narrativa) e o roteiro é reescrito reaproveitando pesquisa e candidatas (cache em `vm_sessions.artifacts`).
4. **Roteirista-chefe** (`claude-fable-5`) escreve o CORPO executando os beats da vencedora (streaming na UI). Não escreve hook nem CTA.
5. **Hook** e **Comando** (fable, em paralelo) trabalham vendo o roteiro pronto + narrativa + dados: hook principal + 3 variações por mecanismos distintos; CTA com benefício explícito.
6. **Revisão** multi-chapéu (sonnet) + **Humanizador** (fable) com lint determinístico anti-clichê de IA (`vm_banned_phrases`) e travessão proibido (tolerância zero).

Se houver anexo marcado como *modelagem*, a arquitetura dele é desconstruída e injetada como restrição para as narrativas e o roteiro.

## Painel de clientes (`/settings/clientes/<id>`)

Cada cliente tem: **Preferências** (restrições de voz), **Dados** ao vivo do corpus (RPC `vm_client_panel`: média de views 30d, plataformas+seguidores, temas/estruturas/hooks/comandos mais usados) e **Insights** rankeados por `performance × recência × relevância` (RPC `vm_client_insights` + boas práticas via LLM), materializados pelo ETL semanal em `vm_viral_insights` (`insight_type client_*`, o maior score marcado como destaque). Esses insights alimentam a sala de agentes: storytelling/tema → narrativas, hook → hooks, comando (rankeado por seguidores ganhos) → CTA, gerais → roteirista.

## Rodar

1. Preencha as chaves em `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` — URL e **publishable key** (`sb_publishable_...`) do projeto **Viral Data** → Settings → API Keys (usadas pelo login)
   - `SUPABASE_SERVICE_ROLE_KEY` e `VIRAL_DATA_SERVICE_ROLE_KEY` — a mesma **secret** (`sb_secret_...`) do projeto **Viral Data** → Settings → API Keys
   - `VM_ALLOWED_EMAILS` — emails autorizados a logar, separados por vírgula (quem não estiver na lista não recebe magic link nem acessa nada)
   - `ANTHROPIC_API_KEY`, `GROK_API_KEY` (xAI, agente pesquisador), `OPENAI_API_KEY` (opcional, só para embeddings do few-shot)
   - `SUPADATA_API_KEY` (opcional, [supadata.ai](https://supadata.ai)) — transcrição automática de links do Instagram Reels e TikTok no anexo de vídeo. YouTube/Shorts funciona sem chave (legendas públicas); sem a chave, Reels/TikTok pedem para colar a transcrição manualmente.
2. Popular os insights do corpus (repete toda segunda via Vercel Cron em produção):
   ```
   npm run etl
   ```
3. `npm run dev`

## Estrutura de dados

- Tudo vive num único projeto Supabase, o **Viral Data** (`qclvrddr...`): as tabelas do app têm prefixo `vm_` e convivem com o corpus (`videos`, `metricas_*`, `clientes`, `documents`). O projeto antigo "Viral Mind" (`eakiimzf...`) está aposentado.
- Clientes do app = tabela `clientes` do corpus (filtrados por `ativo`). Do corpus o pipeline usa `match_documents`, `vm_insights_snapshot()` e `vm_published_scripts()`.
- Flywheel (fechado): na sessão, marque o roteiro como **publicado** colando o link do vídeo. O ETL semanal casa a URL com o vídeo no corpus (grava `videos.crm_script_id`, retentando até o vídeo entrar), traz a performance de volta para `vm_script_performance` (chips na sessão: views, retenção, seguidores) e gera insights `client_scriptresult` que o agente Dados usa para confirmar/derrubar estruturas e hooks nas próximas gerações.

## Ensinar (`/ensinar`)

Aprendizado supervisionado: cole um link de vídeo viral (transcrição automática) ou um roteiro campeão, e o agente **Professor** (`agents/professor.md`) extrai 4-8 aprendizados por dimensão (hook, storytelling, tema, ritmo, comando, geral) com evidência da transcrição. Você revisa — desmarca, edita ou adiciona — e salva. Cada lição vira uma sessão revisitável (`vm_lessons` + `vm_lesson_learnings`) onde aprendizados podem ser ativados/desativados/editados depois. Os **ativos** são destilados na sala a cada geração: entram no contexto como insights `taught_*` roteados por dimensão ao agente certo (hook → Hook, storytelling/tema → Storytelling, comando → Comando, ritmo/geral → Roteirista, todos → Dados), com precedência declarada sobre os padrões do corpus e orçamento de contexto (máx 3 por especialista, 12 no Dados; por cliente antes de global, mais novos primeiro).

## Playbooks

Vivem na tabela `vm_playbooks` (markdown, versionado por linha, editável sem deploy). `style_guide` já tem conteúdo funcional; `hook`, `storytelling` e `comando` são placeholders aguardando os playbooks oficiais — basta inserir uma nova versão com `active = true` (e desativar a anterior).

## Checks

- `npm run check` — self-check do slop-lint
- `npm run build` — build de produção

## Autenticação

Login por magic link (Supabase Auth) em `/login`; o `middleware.ts` protege todas as páginas e rotas de API (o cron usa `CRON_SECRET` próprio). Só emails em `VM_ALLOWED_EMAILS` conseguem logar — a allowlist é checada no envio do link **e** em toda request.

Setup manual no dashboard do **Viral Data** (Authentication):

1. **Sign In / Providers → Email**: deixe habilitado (magic link já vem junto; "Confirm email" pode ficar como está).
2. **Emails → Templates → Magic Link**: troque o link do template para apontar direto ao app com token hash:
   ```html
   <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Entrar no Viral Mind</a>
   ```
3. **URL Configuration**: defina a Site URL de produção e adicione às **Redirect URLs**: `http://localhost:3000/auth/confirm` e `https://<seu-dominio>/auth/confirm`.

## Pendências conhecidas

- Backfill de embeddings dos ~5,6k roteiros sem embedding no corpus (melhora o few-shot): rodar `npx tsx --env-file=.env.local scripts/backfill-embeddings.ts` (custo ~US$ 0,06; `--dry-run` para só contar; resumível, rodar de novo continua de onde parou).
