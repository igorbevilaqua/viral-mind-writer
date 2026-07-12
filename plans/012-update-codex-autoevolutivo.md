# Plano 012 — Update CODEX Autoevolutivo

Baseline: commit `43a984c` (rebrand CODEX). Consolidação da auditoria de 2026-07-11
feita por 6 especialistas (arquitetura, LLM/tokens, dados/flywheel, autoaprimoramento,
bugs, UX). Este plano ABSORVE os planos TODO 006, 008, 010 e 011 (rebaselined — a
nota de "mudanças concorrentes" do README está obsoleta, tudo commitado).

**Objetivo do update**: (1) roteiros guiados de verdade por padrões de sucesso dos
dados; (2) ciclo de autoaprimoramento fechado (performance real → aprendizado →
próxima geração melhor), com humano só aprovando; (3) zero desperdício de tokens e
pipeline resiliente.

**Processo por onda**: subagentes paralelos em worktrees isolados → gate de
verificação → code review adversarial → merge → próxima onda. WPs da mesma onda
têm arquivos disjuntos. Migrations são aplicadas pelo operador via Supabase MCP
após o merge (executores não têm acesso ao banco).

**Gate padrão (todo WP)**: `npx tsc --noEmit && npx eslint . && npm run check && npm test`

---

## Onda 1 — Fundação (WP-A ∥ WP-B)

### WP-A Resiliência & concorrência (absorve plano 006)
Arquivos: `app/api/generate/route.ts`, `lib/pipeline/index.ts`,
`components/session-view.tsx`, `app/sessions/page.tsx`, migration nova.

1. `emit`/`controller.enqueue` embrulhado em try/catch (no-op após stream fechado):
   desconexão do cliente NÃO mata o pipeline — ele continua até salvar em
   `vm_generated_scripts`. O `emit({type:"error"})` do catch também não pode lançar.
2. Heartbeat SSE `: ping\n\n` a cada 15s (setInterval no route, clear no finally) —
   mitiga idle-timeout do proxy Hostinger nas fases silenciosas (Grok 30-90s).
3. Lock otimista de geração: `update vm_sessions set status='generating',
   generation_started_at=now() where id=? and status<>'generating'`; 0 linhas → 409.
   Migration: coluna `generation_started_at` + `unique (session_id, version)` em
   `vm_generated_scripts` (insert com retry no conflito).
4. Staleness: na leitura, `generating` com `generation_started_at` > 10min → tratar
   como erro recuperável (botão retry); lista de sessões idem (sem pulse infinito).
5. Cliente: sessão com status `generating` ao montar → modo "acompanhando"
   (polling do status a cada ~5s até sair de generating, então refresh dos dados);
   NUNCA renderizar o botão "Conjurar roteiro" enquanto generating.
   `JSON.parse` de eventos SSE com try/catch por linha (ignora evento corrompido).
6. `req.json().catch(() => ({}))` + validação de sessionId UUID em
   `app/api/generate/route.ts` e rota suggest-themes.

### WP-B Segurança & correções pontuais
Arquivos: migration RLS, `lib/actions.ts`, `lib/pipeline/context.ts`,
`lib/pipeline/draft.ts`, `lib/etl.ts` (só o fallback).

1. **RLS (crítico)**: dropar as policies `for all to authenticated using (true)`
   das tabelas `vm_*` (migrations 0001:125 e 0007:59-60). O app acessa tudo via
   service role (`lib/db.ts`) — RLS ligado sem policy = service-role-only.
   VERIFICAR antes: nenhum código usa anon/authenticated key para tabelas vm_
   (grep por createClient com anon key fora do fluxo de auth).
2. `markPublished`: validar com `platformVideoId(url) != null` (não `VIDEO_URL_RE`)
   — URL de perfil hoje entra e o flywheel nunca casa, silenciosamente.
3. `swapHook`: update otimista (`WHERE hook = <hook lido>`) e só substituir
   `blocks[0]` se `blocks[0] === s.hook`, senão prepend. (Se plano 007 já cobriu,
   apenas verificar.)
4. `loadContext`: lançar se `attachments.error || playbooksRes.error ||
   bannedRes.error || insights.error` — hoje falha de query gera roteiro sem
   materiais/banned sem nenhum aviso.
5. `stripTrailingComando` (draft.ts:177): exigir `last.length >= 12` e remover no
   máximo 1 bloco — hoje pode comer blocos finais legítimos curtos.
6. Fallback PGRST202 do ETL: nunca deletar sem ter os rows validados; se insert
   falhar após delete, logar alto e abortar o run (preferir exigir a RPC 0009).

---

## Onda 2 — Inteligência de dados (WP-C ∥ WP-D)

### WP-C ETL & schema inteligente
Arquivos: `lib/etl.ts`, migrations novas, `scripts/` (se preciso).

1. **Materialized view `video_stats`** (video_id, views_total, seguidores,
   retencao_hook, retencao_final): substitui a subquery correlacionada
   `max(views_no_dia)` duplicada em 4 funções (0005:20/117, 0006:41, 0007:17).
   Refresh no início do ETL. As 4 funções passam a dar join nela.
2. **Score de insight** (0005:167-170): mediana (ou média truncada) no lugar de
   `avg(views)`; decaimento com meia-vida 180d e piso 0.3; expor performance e
   recência SEPARADAS no payload.
3. **Retenção como métrica-alvo**: score de hooks = ratio_views ×
   ratio_retencao_hook; eixo comando/fechamento usa retencao_final. Dados já
   existem em `metricas_retencao` — hoje decorativos.
4. **Gate de maturidade**: `client_scriptresult` só é emitido com `published_at`
   ≥ 14 dias; antes disso payload leva `em_observacao: true` e NÃO entra como
   anti-padrão. Anti-padrão = ratio < 0.8 APÓS maturidade.
5. **`client_hook_examples`**: top 5 primeiras-frases literais de roteiros do
   cliente por views (+retencao_hook quando houver) — novo insight por cliente.
6. **`vm_insight_runs`**: 1 linha por run do ETL (run_id, at, rows jsonb) antes do
   replace; retenção 12 runs. Dá histórico/tendência/rollback ao conhecimento.
7. **`match_documents_v2`**: filtro/priorização por performance (metadata->>'views',
   já gravado pelo backfill) + filtro opcional por cliente. Alternativa barata:
   match_count=20 e pós-filtro client-side pelos 5 de mais views (decidir pelo
   menor diff que funcione). (absorve plano 011)
8. Commitar o SQL de `match_documents` e `vm_insights_snapshot` como migration de
   registro (estilo 0002) — hoje só existem no banco (schema drift).

### WP-D Contexto, prompts & tokens (absorve planos 008 e 011-consumo)
Arquivos: `lib/pipeline/agents.ts`, `draft.ts`, `critique.ts`, `humanize.ts`,
`context.ts`, `index.ts`, `lib/anthropic.ts`, `agents/dados.md` (ajuste fino).

1. **Dieta do playbook**: remover `PLAYBOOK DE STORYTELLING` (52KB ≈ 15k tokens)
   de `buildStaticSystemBlock` — fica SÓ no agente storytelling (decisório).
   Opcional: injetar no roteirista apenas a seção da estrutura vencedora.
2. **Insights formatados, nunca JSON dump**: `rankNarratives` (agents.ts:260-262)
   passa a receber blocos formatados por categoria, ordenados por score, cap ~30
   linhas, no padrão do `clientInsightBlock`; payloads globais truncados.
3. **Roteamento de scriptresults por dimensão**: estrutura+ratio →
   proposeNarratives/storytelling; retenção de hook + hooks literais
   (client_hook_examples) → designHook; seguidores/retencao_final → comando.
   Bloco explícito "RESULTADOS REAIS DESTA SALA — repita >1.2x, evite <0.8x
   (maduros)" no Dados.
4. **Few-shot vencedor**: `loadContext` consome match_documents_v2 (WP-C.7) e
   anota origem/views reais de cada exemplo no prompt.
5. **Tiering modelo×effort**: `output_config.effort` em lib/anthropic.ts;
   comando → ANALYST_MODEL + effort low; rewriteFragment → effort low;
   humanize → effort medium; designHook → medium; draft mantém high.
6. **Cache coerente**: bloco estático idêntico como `system[0]` com cache_control
   compartilhado entre roteirista/hook/revisão/humanizador (persona vira system[1]);
   humanize ganha cache_control (retries ~90% de desconto); remover breakpoints
   de prefixos one-shot sem leitura (medir cache_read antes/depois).
7. **Revisão enxuta**: variante do bloco dinâmico p/ critique sem few-shot/refs
   (narrativa vencedora + orientações + restrições + dossiê ~2000 chars).
   NÃO colapsar revisão+humanize nesta rodada (mudança de comportamento — fica
   como candidato pós-medição da telemetria).
8. **Humanize cirúrgico**: retry só quando restarem violações que o dedash/lint
   determinístico não resolve, com instrução de reescrever APENAS os trechos
   listados.
9. **Modelagem ∥ pesquisa**: `Promise.all` em index.ts:35-46 (independentes).
10. **Telemetria de custo**: persistir `usage` (input/output/cache tokens, ms,
    modelo) por fase em `pipeline_trace.usage` — critério de sucesso mensurável
    de tudo acima.

---

## Onda 3 — Ciclo de autoaprimoramento (WP-E, sequencial — toca etl.ts e actions.ts)

Absorve plano 010. Arquivos: `lib/pipeline/index.ts` (1 linha do trace),
`lib/etl.ts`, `lib/actions.ts`, `app/api/extract-learnings` (reuso),
`app/ensinar/*`, migration `vm_outcomes`.

1. **Fingerprint no trace**: `pipeline_trace` grava predicted_score da narrativa
   vencedora + ids das lições taught no contexto + versões de playbooks +
   insight run_id.
2. **`vm_outcomes`**: no ETL, para scripts maduros (≥14d): script_id, predicted,
   ratio real, fingerprint. É a tabela-fonte do aprendizado.
3. **Calibração previsto×real**: passo do ETL emite insight global
   `calibracao_dados` (acurácia/viés do ranking) injetado de volta no prompt do
   agente Dados — o avaliador passa a ser avaliado.
4. **Edição humana → aprendizado** (plano 010): diff da edição inline/
   `edited_version` com rating alto → Professor `extractFromEdit` → lição
   `active:false` no /ensinar (humano aprova). `vm_script_feedback` deixa de ser
   write-only: rating agregado por estrutura/hook_tipo entra no ETL.
5. **Atribuição lição×outcome**: correlacionar lições presentes no fingerprint
   com ratio dos roteiros maduros; lições associadas a flops são MARCADAS para
   revisão humana (nunca desativadas sozinhas).
6. **Curador mensal**: job (cron existente, frequência mensal) que lê winners/
   losers de vm_outcomes + corpus e propõe (a) lições novas `active:false`,
   (b) nova versão de playbook `active:false` via trilho `vm_playbooks.version`.
   Humano aprova/rejeita no /ensinar. Regra de ouro: NENHUM conhecimento entra no
   contexto dos agentes sem suporte estatístico gateado OU aprovação humana.

---

## Onda 4 — UX de confiança (WP-F ∥ WP-G)

### WP-F Sessão transparente
Arquivos: `components/session-view.tsx`, `lib/pipeline/types.ts` (RankingItem).

1. **Evidência no ranking**: RankingItem ganha evidência estruturada (estrutura
   usada N×, média/mediana de views no corpus do cliente, insight que pesou);
   card mostra chips + barra 0-100 do score. Dado vem do WP-D.2/3 (o Dados já
   recebe formatado; devolver junto no tool_use).
2. **Baseline vs real no PublishBox**: "média 30d do cliente: X → este vídeo: Y
   (N.Nx)" — dados de vm_client_panel.
3. **Feedback 1-clique**: 👍/👎 por versão gravando em vm_script_feedback;
   `edited_version` derivado automaticamente do histórico de updateScript (parar
   de pedir para colar); feedback dado permanece visível na sessão encerrada.
4. Slop-lint: listar as frases violadas, não só a contagem.
5. Acessibilidade: BobModal → `<dialog>` nativo (padrão já existe em
   client-prefs-editor), `confirm()` → dialog, `aria-live="polite"` na fase
   corrente do stepper, mínimos 12px/white-55 em texto informativo.
6. Desconstrução da modelagem: renderizar `analysis` como seções (JSON em
   `<details>` secundário).

### WP-G Operação em volume
Arquivos: `app/sessions/page.tsx`, `app/ensinar/page.tsx` (seção nova).

1. Lista de sessões: chips de filtro (cliente, status), badge "publicado" +
   views na linha (join vm_generated_scripts/vm_script_performance), estado
   vazio com CTA.
2. /ensinar: seção "o que a sala aprendeu com você" — lições derivadas de
   edições/outcomes (WP-E) com o mesmo toggle do lesson-view.

---

## Fora de escopo desta rodada (registrar, não fazer)

- Dashboard flywheel completo (previsto×real histórico) — depois de vm_outcomes
  acumular dados.
- CRUD de playbooks/banned phrases — curador (WP-E.6) reduz a urgência.
- Clusterização de embeddings / territórios temáticos — candidato próxima rodada.
- Colapsar revisão+humanização em 1 passada — só após telemetria (WP-D.10) medir.
- Refactor dos god components — mantido adiado (decisão da auditoria anterior).
- Worker/fila fora do request HTTP — WP-A (heartbeat + sobrevive a desconexão +
  checkpoints em artifacts já existentes) cobre o risco real; fila só se a
  telemetria mostrar mortes por deploy frequentes.

## Dependências

- Onda 2 depende da 1 (WP-D toca index.ts após WP-A; WP-C toca etl.ts após WP-B.6).
- WP-E depende de WP-C (gate/outcomes usam score novo) e WP-D (fingerprint no trace).
- WP-F depende de WP-D.2/3 (evidência) e WP-A.5 (modo acompanhando já existe).
- Migrations: aplicadas via Supabase MCP pelo operador na ordem WP-A → WP-B →
  WP-C → WP-E, cada uma após o merge do respectivo WP.
