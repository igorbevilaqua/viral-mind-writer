# Relatório: Codex (Viral Mind), branch `plano-028-caso-minimo` (= origin/main, `9c98fd8`)

Levantamento só de leitura: nada editado, nenhum banco acessado. Li direto no código e nos docs as seções 3 e 4; as seções 1, 2 e 5 vieram de levantamentos paralelos que leram o código, e eu não reconferi linha a linha. O que ficou sem confirmação está listado no fim.

---

## 1. Fluxos de geração de roteiro

### 1.0 Como modelos e prompts são resolvidos

**Modelos**
- Catálogo em `lib/llm-catalogo.ts:20-30` (modelos) e `:51-153` (14 funções com padrão).
- `modeloDe(slug)` em `lib/llm-config.ts:68` lê `vm_config_llm` (a linha mais nova por função vence, cache de 30 s, `:30-65`) e cai no padrão do catálogo.
- Troca pelo adm: `trocarModeloLLM` em `lib/actions.ts:1204`, que chama `salvarModelo` em `lib/llm-config.ts:74`.
- Por sessão: `vm_sessions.modelo` só é lido (`lib/pipeline/context.ts:486`). O seletor da home foi removido; as sessões novas usam `modeloDe("escrita")`.
- `ANALYST_MODEL` (env `VM_ANALYST_MODEL`, padrão `claude-sonnet-5`, `lib/anthropic.ts:41`) ainda é usado direto no "Sugerir tema".
- Modelos sem tool forçada (`claude-opus-5-5`, `claude-sonnet-5-5`, `claude-fable-5-1`) têm o `tool_choice` trocado por `auto` (`lib/anthropic.ts:15-29`).

| Função (slug) | Padrão | Onde é usada |
|---|---|---|
| `escrita` | `claude-opus-5-5` | roteirista, hook, humanizador, Bob, rewrite-fragment |
| `premissa` | `claude-sonnet-5` | derivação da premissa e escolha da skill |
| `pesquisa` | `grok-4.7` | dossiê e pesquisa do "Sugerir tema" |
| `busca` | `grok-4.3` | verificação factual e pesquisa do Bob |
| `narrativas` | `claude-sonnet-5` | storytelling e ranking (Dados) |
| `comando` | `claude-sonnet-5` | CTA |
| `critica` | `claude-sonnet-5` | revisão |
| `checagem` | `claude-sonnet-5` | extração e classificação de alegações |
| `modelagem` | `claude-sonnet-5` | autópsia, caçador, classificador de modelagens, "Por quê" |
| `ideador` | `claude-sonnet-5` | declarado, sem call site |
| `calibracao` | `claude-opus-5-5` | probes de hook |
| `carrossel` | `claude-sonnet-5` | leitura de carrossel por visão |
| `aprendizado` | `claude-sonnet-5` | Professor, classificador de ensino, curador, insights do ETL |
| `kasparov` | `claude-sonnet-5` | debate |

Embeddings: OpenAI `text-embedding-3-small` (`lib/pipeline/context.ts:32`, `lib/corpus-embeddings.ts:12`, `lib/preditor/index.ts:161`).

**Prompts**
- `agents/*.md`: lidos do disco por `agentPrompt(name)` (`lib/pipeline/agents.ts:30-38`).
- `skills/*.md` (historia, mecanismo, demonstracao, panorama): lidos por `lib/pipeline/skills.ts:14-16`. Cada arquivo tem uma seção por agente (quando, pesquisa, narrativas, dados, hook, roteiro, revisao, comando); cada agente recebe só a sua (`skillBlock` em `:32`, `comSkill` em `lib/pipeline/agents.ts:475`).
- Playbooks em runtime vêm do banco: `vm_playbooks where active = true` (`lib/pipeline/context.ts:283`). A pasta `playbooks/*.md` é só semente (`scripts/seed-playbooks.ts`).
- Slugs consumidos: `hook`, `subhook`, `conclusao`, `comando`, `style_guide`, `storytelling`, `payoff`, `pauta`, `checklist`. No disco só existem `checklist`, `comando`, `hook`, `storytelling`, `style_guide`.
- Contexto extra em toda geração (`loadEstadoComum`, `lib/pipeline/context.ts:281-431`): `vm_banned_phrases`, `vm_client_preferences`, `vm_viral_insights`, lições ativas, `vm_bullets` e a estratégia do Cockpit (RPC `hub_painel_estrategia_atual`, `lib/pipeline/estrategia.ts:78`).

### 1.1 Tabela-resumo

| Fluxo | Entrada | Pipeline | Prompts | Modelos (padrão) |
|---|---|---|---|---|
| Ideia livre | home → `createSession` (`lib/actions.ts:89`) → `POST /api/generate` | `runPipeline` completo | `agents/` premissa, escolha-skill, pesquisador, storytelling, dados, hook, roteirista, comando, revisao, humanizador, verificador + skills + playbooks do banco | ver 1.2 |
| Modelar | anexo `is_modelagem`, ou `criarSessaoDoRoteiro(id,"modelar")` (`lib/actions.ts:41`) | autópsia → pausa de premissa → mesma sala | autópsia com prompt inline (`lib/pipeline/modelagem.ts:484-520`) | `modelagem` |
| Replicar | idem, `modo: "replicar"` | autópsia → pausa → pula storytelling e ranking | `agents/replicador.md` no lugar do roteirista | `escrita` |
| Skills por modo | seletor na home ou automática; `trocarSkill` (`lib/actions.ts:632`) | fase `skill` entre premissa e pesquisa | `agents/escolha-skill.md` + `skills/*.md` | `premissa` |
| Regenerar, trocar narrativa, ajustar | `POST /api/generate` com `narrativeIndex` ou `feedback` | reusa `vm_sessions.artifacts` | mesmos | mesmos |
| Sugerir tema | `POST /api/suggest-themes` (botão escondido) | dados → caça ∥ pesquisa Grok → síntese | `agents/ideador-pesquisa.md`, `agents/ideador.md`, playbook `pauta` | `grok-4.7` + `ANALYST_MODEL` |
| Avaliador de pauta | não existe | só planejado (plano 026, Task C) | nenhum | nenhum |
| /goal, /hook, /comando, /conclusao | skills do Claude Code em `.claude/skills/` | fora do app | leem `agents/*.md` e playbooks | o modelo do Claude Code |
| Verificar | fase final do pipeline; `verificarScript` (`lib/actions.ts:487`); `POST /api/verificar` | extrair → delta → buscar → classificar | `agents/verificador.md` | `checagem` + `busca` |
| Bob | `POST /api/bob` | até 2 turnos, 1 rodada de pesquisa | `agents/roteirista.md` | escrita + `grok-4.3` |
| Rewrite-fragment | `suggestFragment` (`lib/actions.ts:691`) | 1 chamada | `agents/roteirista.md` | escrita |
| Trocar hook | `swapHook` (`lib/actions.ts:721`) | sem LLM | nenhum | nenhum |
| Por quê | `explicarTrecho` (`lib/actions.ts:703`) | etapa em código + 1 chamada | `agents/proveniencia.md` | `modelagem` |
| Kasparov | `POST /api/kasparov`, `/kasparov` | debate em stream + destilação | `agents/kasparov.md` | `kasparov` |
| Ensinar | `/ensinar/*`, `/api/extract-learnings`, `classificarTexto`, `gravarEnsinamento` | Professor e classificador | `agents/professor.md`, `agents/classificador-ensino.md` | `aprendizado` |
| Calibração de hooks | `/ensinar/calibracao`, cron | geração de probes | inline em `lib/calibration-probe.ts` | `calibracao` |
| Bullets | `/bullets` | sem LLM | nenhum | nenhum |
| Bancada, juiz, piso | scripts offline | mesmo `escreverRoteiro` da produção | juiz com prompt inline | juiz `claude-sonnet-5-5` |

### 1.2 Ideia livre: a sala completa

**Entrada:** `app/page.tsx` + `components/home-form.tsx` (`:265-278`) → `createSession` (`lib/actions.ts:89-144`) → `/sessions/{id}?start=1` → `components/session-view.tsx:2139` faz `POST /api/generate` (`app/api/generate/route.ts:10-29`, SSE) → `runPipeline` (`lib/pipeline/index.ts:43`). Anexos: `reference_script`, `news_link`, `document`, `video_link`, `carousel_link` (`lib/actions.ts:80`).

| # | Fase | Código | Prompt | Modelo |
|---|---|---|---|---|
| 0 | Lock e contexto | RPC `vm_acquire_generation_lock` (`index.ts:89`), `loadContext` (`:102`) | nenhum | embedding do few-shot |
| 1 | Premissa | `index.ts:195-253`; `derivePremissa` (`lib/pipeline/premissa.ts:115-148`) | `agents/premissa.md` | `premissa` |
| 2 | Skill | `index.ts:259-275`; `escolherSkill` (`lib/pipeline/escolher-skill.ts:40-59`) | `agents/escolha-skill.md` + seção `quando` das skills | `premissa` |
| 3 | Pesquisa | `research` (`lib/pipeline/agents.ts:539-554`) | `agents/pesquisador.md` + skill | `grok-4.7` |
| 4 | Narrativas | `proposeNarratives` (`agents.ts:635-689`) | `agents/storytelling.md` + playbooks `storytelling`, `payoff`, `pauta` | `narrativas` |
| 5 | Ranking | `rankNarratives` (`agents.ts:763-779`), `escolherVencedora` (`index.ts:722`) | `agents/dados.md` + insights + estratégia | `narrativas` |
| 6 | Hook | `designHook` (`index.ts:747`, `agents.ts:887-1032`): 5 a 6 candidatos, seleção em código por placar, lift e anti-colapso | `agents/hook.md` + playbooks `hook`, `subhook`, `payoff`, `style_guide` | escrita |
| 7 | Roteiro | `generateDraft` (`lib/pipeline/draft.ts:476-520`), streaming | `agents/roteirista.md` + bloco estático (`draft.ts:58-89`) | escrita |
| 8 | Comando | `writeComando` (`agents.ts:1035-1065`) | `agents/comando.md` + playbook `comando` | `comando` |
| 9 | Sinais em código | `ecosNumericos`, `paragrafosLongos`, `medirPiso` (`index.ts:790-803`) | nenhum | sem LLM |
| 10 | Revisão | `critiqueAndRewrite` (`lib/pipeline/critique.ts:125-165`), edições localizadas | `agents/revisao.md` + playbook `checklist` | `critica` |
| 11 | Humanização | `humanize` (`lib/pipeline/humanize.ts:101-204`), cirúrgica + `dedash` | `agents/humanizador.md` | escrita |
| 12 | Salvar | insert em `vm_generated_scripts` (`index.ts:427-518`); `vm_calibration_pairs` (`:528-533`) | nenhum | nenhum |
| 13 | Preditor sombra | `sombraDoPreditor` (`index.ts:538-559`), depois do `done` | nenhum | embedding |
| 14 | Verificação | `verificarScriptSalvo(id, "delta")` (`index.ts:567-572`) | `agents/verificador.md` | `checagem` + `busca` |
| 15 | Aprendizado da correção | só com `feedback`: `extractFromCorrection` (`index.ts:578-610`) | `agents/professor.md` | `aprendizado` |

**Divergências com o `AGENTS.md` §3:**
- Ele diz "roteiro fable"; o padrão de escrita no código é `claude-opus-5-5`.
- Ele diz "hook ∥ comando (paralelo)"; desde o plano 024 o hook é escrito antes do corpo (`index.ts:745-750`).
- A humanização não reescreve mais o roteiro inteiro (`humanize.ts:124-127`).

**Variações do mesmo endpoint:** regenerar pula premissa até ranking quando `artifacts` já tem candidatas (`index.ts:281`, `:360-365`); trocar narrativa usa `narrativeIndex` (`:377-379`); "ajustar" usa `feedback` (`:391-408`); `updatePremissa` (`lib/actions.ts:647`) preserva o dossiê e descarta as narrativas.

### 1.3 Modelagem a partir de referência: Modelar e Replicar

- **Entrada:** anexo `is_modelagem: true` na home, ou os botões da sessão (`components/session-view.tsx:1219`) que chamam `criarSessaoDoRoteiro` (`lib/actions.ts:41-77`). Com modelagem, a premissa digitada é descartada (`lib/actions.ts:105-106`) e o seletor de skill some (`home-form.tsx:274`).
- **Transcrição** (`ensureTranscript`, `lib/pipeline/modelagem.ts:316-332`): `fetchTranscript` (`lib/transcribe.ts:128-156`) tenta o corpus, depois YouTube, Instagram (Supadata com fallback ScrapeCreators) e TikTok. Carrossel: `lerCarrossel` (`lib/carrossel.ts:79-112`), por visão.
- **Autópsia** (`analyzeModelagem`, `modelagem.ts:581-608`): cache em `vm_modelagem_analyses` (`:462-471`), tool forçada `registrar_modelagem`. O prompt é inline (`:484-520`), o que fere a convenção do `AGENTS.md` §5.
- **Pausa de premissa:** o run 1 grava `status: "aguardando_premissa"` e para (`index.ts:201-216`); `confirmarPremissa` (`lib/actions.ts:611-627`) grava a tese com `premissa_origem: "modelagem"` e dispara o run 2.
- **Modelar:** storytelling e ranking rodam com o brief (`composeBrief`, `lib/pipeline/modelagem-brief.ts:27`). O roteirista não vê o texto original (`draft.ts:494-497`).
- **Replicar:** storytelling e ranking são pulados; a narrativa é montada em código (`narrativaDoOriginal`, `lib/pipeline/replicar.ts:78`; `index.ts:309-338`); prompt `agents/replicador.md` (`draft.ts:516`).
- O link original é gravado em `fontes` (`fontesComProcedencia`, `modelagem.ts:373`).
- **Pool e caçador (plano 014):** `cacarModelagens` (`lib/modelagens/cacar.ts:227`) só é chamado pelo "Sugerir tema" (`lib/pipeline/suggest.ts:204`). Prompts `agents/cacador-modelagens.md` e `agents/classificador-modelagens.md`; busca por ScrapeCreators (`lib/modelagens/buscar.ts:170`); ranking em código (`lib/modelagens/rank.ts:98`).

### 1.4 Skills por modo (plano 025)

- Catálogo: `lib/skills-catalogo.ts:5`. Padrão da home: automática (`:40`).
- Escolhida na home: `vm_sessions.skill` com `skill_origem = "escolhida"` (`lib/actions.ts:108-117`).
- Automática: `escolherSkill` grava `skill_origem = "sugerida"` e refaz o few-shot (`index.ts:259-274`); usa o mix do cliente em `vm_roteiro_modo` como desempate (`lib/pipeline/modo-roteiro.ts:20`).
- Troca na sessão: `trocarSkill` (`lib/actions.ts:632-642`) zera `artifacts`.
- `agents/classificador-modo.md` não roda em produção; só `scripts/bancada-modo.ts:53-63` o chama.

### 1.5 /goal, /hook, /comando, /conclusao

- São skills do Claude Code em `.claude/skills/{goal,hook,comando,conclusao}/SKILL.md`. Não há rota, página nem server action correspondente.
- `/goal` roda a sala à mão lendo `agents/*.md` e os playbooks, e descreve o protocolo antigo (hook depois do corpo, sem premissa, sem skill, sem verificação).
- `/hook` e `/comando` usam o agente e o playbook do disco.
- `/conclusao` declara que não existe agente nem playbook de conclusão e opera com `agents/roteirista.md` + `playbooks/checklist.md`.
- No app, conclusão é só o playbook `conclusao` do banco injetado no roteirista (`draft.ts:80`).

### 1.6 Sugerir tema

- Rota `POST /api/suggest-themes` (`app/api/suggest-themes/route.ts:10-16`), chamada por `components/home-form.tsx:190`.
- O botão está escondido: `MOSTRAR_SUGERIR_TEMA = false` (`home-form.tsx:11`). A rota segue ativa e não chama `barrarNaRota`, ao contrário de generate, bob e verificar.
- Pipeline (`suggestThemes`, `lib/pipeline/suggest.ts:155-310`): dados do cliente e RPC `vm_cross_client_hits`; em paralelo, caça de modelagens e pesquisa Grok (`:220-224`); síntese com `agents/ideador.md` (`:244-249`).
- A função `ideador` aparece na tela de configuração, mas nenhum código chama `modeloDe("ideador")`: trocar o modelo ali não tem efeito.

### 1.7 Avaliador de pauta

Não existe em código. Só aparece em `plans/026-preditor-e-avaliador.md:40` e no comentário de `home-form.tsx:379`.

### 1.8 Verificação factual (plano 017)

- Uma função, três portas (`verificarScriptSalvo`, `lib/pipeline/index.ts:663-715`): fase final da geração (regime `delta`), `verificarScript` (`lib/actions.ts:487`) e `POST /api/verificar`.
- Passos (`verificarRoteiro`, `lib/pipeline/verificar.ts:422`): `extrairAlegacoes` (`:178-193`); filtro delta em código (`lib/pipeline/delta.ts:100`), teto de 20 (`verificar.ts:352`); busca por `grokPesquisa` (`lib/pipeline/grok-search.ts:34-52`); `classificar` (`verificar.ts:234-260`) com `lib/pipeline/fontes-autoritativas.json`.
- Grava `vm_generated_scripts.verificacao`.

### 1.9 Bob, rewrite-fragment, trocar hook, "Por quê"

- **Bob:** `POST /api/bob`, `bobAssist` (`lib/pipeline/bob.ts:38-137`), `agents/roteirista.md`. Não persiste; o usuário aceita via `updateScript` (`lib/actions.ts:433`).
- **Rewrite-fragment:** `rewriteFragment` (`lib/pipeline/rewrite-fragment.ts:10-44`). Não persiste.
- **Trocar hook:** `swapHook` (`lib/actions.ts:721-746`), sem LLM.
- **"Por quê":** `explicar` (`lib/pipeline/explain.ts:144-171`), `agents/proveniencia.md`.

### 1.10 Kasparov

- Páginas `app/kasparov/*`, rota `POST /api/kasparov` (`app/api/kasparov/route.ts:81`).
- Em manutenção: `KASPAROV_EM_MANUTENCAO = true` (`lib/generation.ts:9`).
- `turnoKasparov` (`lib/pipeline/kasparov.ts:115-133`) e `proporDestilacao` (`:214-228`), prompt `agents/kasparov.md`. Grava `vm_kasparov_threads` e `vm_kasparov_messages`.

### 1.11 Ensinar, Professor e curadoria

- **Por vídeo** (`/ensinar/nova`): `/api/transcribe-link` → `/api/extract-learnings` → `extractLearnings` (`lib/pipeline/teach.ts:99`) → `saveLesson` (`lib/actions.ts:295`). Prompt `agents/professor.md`.
- **Em sessão** (plano 015): `classificarTexto` (`lib/actions.ts:833`) → `classificarEnsinamento` (`lib/pipeline/classify-teaching.ts:68-79`), prompt `agents/classificador-ensino.md`; `gravarEnsinamento` (`lib/actions.ts:914`) grava em uma de 4 casas.
- **Ao finalizar:** `finalizeSession` (`lib/actions.ts:200`); nota com 15 caracteres ou mais vira lição `active:false` (`:250`).
- **Curadores no cron** (`app/api/cron/weekly-etl/route.ts:31-45`): `runMonthlyCurator` e `runHookPlaybookCurator` (`lib/curator.ts:47`, `:203`).
- **Calibração de hooks:** `lib/calibration-probe.ts:16-23`, `:86-88`, prompt inline.

### 1.12 Carrossel e bullets

- **Carrossel:** é entrada, não saída (`lerCarrossel`, `lib/carrossel.ts:79`). O catálogo diz "transforma o roteiro pronto em slides de carrossel" (`lib/llm-catalogo.ts:135`), mas não há código que gere carrossel a partir de roteiro.
- **Bullets:** paleta votada pelo time, sem LLM (`lib/actions.ts:1055-1169`); entra no hook e no roteirista via `bulletsBlock` (`lib/pipeline/agents.ts:335`).

### 1.13 Humanização, slop-lint, piso, juiz e bancada

- **Slop-lint** (`lib/pipeline/slop-lint.ts`): determinístico; `slopLint` (`:10`), `anunciosVazios` (`:241`), `ecosNumericos` (`:301`), `paragrafosLongos` (`:440`), `dedash` (`:505`).
- **Piso** (`lib/pipeline/piso.ts`): `medirPiso` (`:133`), `alvosDoPiso` (`:220`).
- **Juiz** (`lib/pipeline/juiz.ts`): par nas duas ordens, prompt inline (`:13-27`), `claude-sonnet-5-5` (`:60`). Só em `scripts/bancada-placar.ts` e `scripts/juiz-calibrar.ts`; não roda em produção.
- **Bancada** (`scripts/bancada.ts`): roda a sala sobre `docs/escrita-2026-10/bancada/pautas.json` sem gravar.

---

## 2. Tabelas do Supabase por fluxo

As `vm_*` vivem no mesmo projeto físico do corpus (`0002_viral_data_consolidation.sql:1-11`), com RLS sem policy: só o service role (`0011`, `0035`).

### 2.1 Mapa fluxo → escrita

| Fluxo | Tabelas gravadas | Onde grava |
|---|---|---|
| Criar sessão | `vm_sessions`, `vm_attachments` | `lib/actions.ts:109-120`, `:124-135` |
| Pipeline principal | `vm_sessions` (debug, lock, premissa, skill, artifacts, status), `vm_generated_scripts`, `vm_calibration_pairs`, `vm_preditor_sombra`, `vm_lessons` + `vm_lesson_learnings` | `lib/pipeline/index.ts:62`, `:89`, `:208`, `:240`, `:270`, `:384`, `:429-518`, `:530`, `:543-559`, `:590-604` |
| Modelar | `vm_attachments.is_modelagem=true`, `vm_modelagem_analyses`, `vm_sessions.status='aguardando_premissa'` | `lib/actions.ts:128`, `lib/pipeline/modelagem.ts:571-576`, `lib/pipeline/index.ts:208`, `lib/actions.ts:615-624` |
| Replicar | `vm_attachments.modo='replicar'` + a mesma autópsia | `lib/actions.ts:131` |
| Carrossel | `vm_attachments.kind='carousel_link'` | `0032_carrossel.sql:8-10` |
| Premissa | `vm_sessions.premissa`, `premissa_origem` | `lib/actions.ts:114`, `:617-622`, `:655-660`; `index.ts:240` |
| Skill por modo | `vm_sessions.skill`, `skill_origem`; cópia em `pipeline_trace` | `lib/actions.ts:117`, `:638`; `index.ts:270`, `:453-455` |
| Sugerir tema | só cache: `vm_modelagem_pool`, `vm_client_preferences.search_queries` | `lib/modelagens/cacar.ts:211`, `lib/modelagens/queries.ts:295` |
| Verificar | `vm_generated_scripts.verificacao` | `index.ts:705-709`, `lib/actions.ts:560` |
| Bob e edição manual | `vm_generated_scripts` (texto, `hook_variants`, `pipeline_trace`) | `lib/actions.ts:466-471`, `:739` |
| Feedback e encerramento | `vm_script_feedback`, lições, `vm_sessions.status='closed'` | `lib/actions.ts:210`, `:257`, `:267`, `:278`, `:424` |
| Marcar publicado ou não usado | `vm_generated_scripts.status`, `published_url`, `published_at` | `lib/actions.ts:387` (`markPublished`), `:403`, `:412` (`markNaoUsado`) |
| Kasparov | `vm_kasparov_threads`, `vm_kasparov_messages`, `vm_fewshot_criterio`, `vm_script_matches` | `app/api/kasparov/route.ts:128`, `:153`, `:179`, `:199`; `lib/script-matches.ts:162` |
| Ensinar | lições (RPC `vm_gravar_ensinamento`), `vm_banned_phrases`, `vm_client_preferences`, `vm_playbooks` | `lib/actions.ts:308`, `:323`, `:341`, `:356`, `:370`, `:942`, `:971`, `:999`, `:1036` |
| Bullets | `vm_bullets`, `vm_bullet_votes`, `vm_banned_phrases` | `lib/actions.ts:1102`, `:1111`, `:1156`, `:1182-1185` |
| Calibração de hook | `vm_calibration_pairs`, `vm_calibration_votes` | `index.ts:530`, `lib/calibration-probe.ts:138`, `lib/actions.ts:796` |
| Preditor sombra | `vm_preditor_sombra` (geração), `vm_preditor_rotulos` (ETL) | `lib/preditor/index.ts:215-228`, `:306-312` |
| ETL semanal | `documents`, `vm_preditor_rotulos`, `vm_script_matches`, `vm_generated_scripts`, `vm_script_performance`, `vm_outcomes`, `vm_edit_observations`, `vm_lesson_learnings.needs_review`, `vm_insight_runs`, `vm_viral_insights` | `lib/etl.ts:622-628`, `:648`, `:770`, `:466`, `:533`, `:870-892` |
| Config de LLM | `vm_config_llm` | `lib/llm-config.ts:79` |

### 2.2 Tabelas e colunas relevantes

**`vm_sessions`** (`0001_init.sql:3-11`)
- Base: `id`, `user_id`, `client_id`, `prompt`, `status`, `error_message`, `created_at`.
- `status`: draft, generating, aguardando_premissa, done, error, closed (texto livre, sem check).
- `artifacts` (`0004:3`), `debug` (`0008:4`), `generation_started_at` (`0010:4`).
- `premissa`, `premissa_origem` (`0024:8`, `:12`).
- `modelo` (`0049:17`): nenhum insert ou update do código grava essa coluna.
- `skill`, `skill_origem` (`0052:3-6`).
- Não existe coluna de "fluxo" (livre, modelar, replicar): o fluxo se deduz de `vm_attachments`.

**`vm_attachments`** (`0001:13-21`)
- `session_id`, `kind`, `is_modelagem`, `url`, `raw_content`, `modo` (`0034:18-19`).
- A referência modelada é a linha com `is_modelagem=true`; a URL fica em `url`.

**`vm_modelagem_analyses`** (`0001:23-29`): `attachment_id`, `video_url` (`0031:13-14`), `analysis`, `replication_brief`.

**`vm_generated_scripts`** (`0001:31-44`)
- `session_id`, `client_id`, `version`, `headline`, `hook`, `hook_variants`, `roteiro`, `comando`, `fontes`, `slop_lint_violations`.
- `status`: generated, approved, published, mais 'descartado' gravado pelo código (`lib/actions.ts:403`). Sem check.
- `published_url`, `published_at` (`0007:5-7`): gravados à mão (`actions.ts:387`), pelo casamento (`lib/script-matches.ts:92-98`, nunca sobrescreve) ou pelo Kasparov.
- `verificacao` (`0029:22`).
- `crm_script_id`, `crm_sobreposicao` (`0055:6-8`): gravados só por `casarComCrm` (`lib/script-matches.ts:374-378`).
- `pipeline_trace` (`index.ts:440-515`): skill, `narrativa_escolhida`, `hook_mecanismo`, `modelagem_briefs`, `few_shot_origens`, `usage`, `predicted_score`, `fingerprint`, `proveniencia`.

**`vm_script_performance`** (`0001:96-106`): `script_id`, `viral_data_video_id`, `views`, `retencao_hook`, `retencao_final`, `compartilhamentos`, `seguidores_ganhos`, `synced_at`. Gravada em `lib/script-performance.ts:102-104`.

**`vm_script_matches`** (`0040_script_matches.sql:16-27`): `script_id`, `video_id`, `plataforma`, `score`, `sobreposicao`, `metodo` (shingle_auto, shingle_pendente, crm_shingle, crm_shingle_pendente, kasparov), `confirmado` (true, false, null = pendente), `decidido_em`.

**`vm_outcomes`** (`0015_outcomes_learning_loop.sql:7-17`): `script_id`, `session_id`, `client_id`, `predicted_score`, `ratio`, `verdict`, `fingerprint`, `matured_at`.

**`vm_preditor_sombra`** (`0056_preditor_sombra.sql:25-38`) e **`vm_preditor_rotulos`** (`0056:10-18`): ver seção 3.

**`vm_roteiro_modo`** (`0051_roteiro_modo.sql:4-13`): `crm_script_id` (PK), `cliente_id`, `modo`, `ancora`, `registro`, `confianca`, `origem`. Único escritor achado: `scripts/seed-roteiro-modo.ts:14`.

**`vm_video_classifications`** (`0041_video_classifications.sql:21-33`): `video_id`, `hook_mecanismos[]`, `estruturas[]`, `comandos[]`, `tema`. Gravada por scripts.

**`vm_lessons`** (`0007:32-41`) e **`vm_lesson_learnings`** (`0007:43-54`), com colunas somadas: `needs_review` (`0015:23`), `destinatarios[]` (`0027:5`), `ativada_em`, `cluster_chave` (`0038:40`, `:48`), `grupo` (`0044:8`), `alcance`, `skills[]`, `absorvida_em` (`0054:5-8`).

**Demais:** `vm_playbooks` (`0001:56-64`), `vm_banned_phrases` (`0001:66-73`), `vm_client_preferences` (`0001:75-85`, + `perfil` em `0053:4`), `vm_viral_insights` (`0001:87-93`), `vm_insight_runs` (`0014:4-8`), `vm_modelagem_pool` (`0025:12-42`), `vm_kasparov_*` (`0030`), `vm_calibration_*` (`0021`), `vm_bullets` (`0033`), `vm_fewshot_criterio` (`0036`), `vm_edit_observations` (`0038`), `vm_config_llm` (`0050`), `vm_licao_vereditos` (`0045`, `0046`).

**Corpus e CRM (de outros apps)**
- `videos`: o Codex só lê. `videos.crm_script_id` é preenchido pelo coletor; a escrita antiga do Codex foi removida em 17/08/2026 (`lib/etl.ts:631-635`).
- `documents`: única tabela do corpus que o Codex grava (`lib/corpus-embeddings.ts:64`, `:155`).
- `metricas_diarias`, `metricas_retencao`, `canais`, `oraculo.fato_video`: só leitura.
- `scripts` do projeto do CRM: só leitura via `crmDb` (`lib/db.ts:19-21`).

### 2.3 Migrations (0001 a 0056)

| Migration | O que faz |
|---|---|
| 0001_init | 10 tabelas base (sessions, attachments, modelagem_analyses, generated_scripts, script_feedback, playbooks, banned_phrases, client_preferences, viral_insights, script_performance) |
| 0002_viral_data_consolidation | `vm_*` passam a viver no projeto Viral Data |
| 0003_headline_fontes | `headline`, `fontes` |
| 0004_session_artifacts | `vm_sessions.artifacts` |
| 0005_client_panel_insights | RPCs `vm_client_panel`, `vm_client_insights` |
| 0006_cross_client_hits | RPC `vm_cross_client_hits` |
| 0007_teach_and_flywheel | `published_url`, `published_at`; `vm_lessons`, `vm_lesson_learnings` |
| 0008_session_debug | `vm_sessions.debug` |
| 0009_replace_insights_fn | RPC `vm_replace_insights` |
| 0010_generation_lock | lock e unicidade de versão |
| 0011_rls_service_role | RLS sem policy |
| 0012_registro_corpus_fns | registra `match_documents` e `vm_insights_snapshot` |
| 0013_video_stats_mv | MV `vm_video_stats` |
| 0014_insight_runs | `vm_insight_runs` |
| 0015_outcomes_learning_loop | `vm_outcomes`; `needs_review` |
| 0016_acquire_lock_fn | RPC `vm_acquire_generation_lock` |
| 0017_vm_script_priority_and_class_videos | hits cruzados priorizam produção VM |
| 0018_regua_views_instagram | régua de views e prioridade Instagram |
| 0019_hub_writer_auth | RPCs do hub |
| 0020_correcao_learning | origem 'correcao' |
| 0020_hook_classifications | `vm_hook_classifications` (segunda 0020; dropada na 0042) |
| 0021_calibration | pares e votos de calibração |
| 0022_hook_fora_do_roteiro | coluna `hook` vira fonte única |
| 0023_banned_phrases_motivo | `motivo` |
| 0024_premissa | `premissa`, `premissa_origem` |
| 0025_modelagem_pool | `vm_modelagem_pool` |
| 0026_cross_client_hits_url | hits devolvem `link_video` |
| 0027_ensino_em_sessao | `destinatarios`, origem 'ensino' |
| 0028_rpc_gravar_ensinamento | RPC transacional |
| 0029_verificacao | `verificacao` |
| 0030_kasparov | threads e mensagens |
| 0031_autopsia_por_url | `video_url` na autópsia |
| 0032_carrossel | kind 'carousel_link' |
| 0033_bullets | bullets e votos |
| 0034_replicar | `vm_attachments.modo` |
| 0035_rls_faltante | RLS em 5 tabelas |
| 0036_fewshot_criterio | `vm_fewshot_criterio` |
| 0037_backfill_destinatarios_orfaos | backfill |
| 0038_edit_observations | `vm_edit_observations` |
| 0039_backfill_script_client | realinha `client_id` do roteiro |
| 0040_script_matches | `vm_script_matches` + RPC `vm_match_scripts` (plano 020) |
| 0041_video_classifications | taxonomia canônica (plano 020) |
| 0042_client_insights_canonicas | insights leem a taxonomia canônica |
| 0043_replace_insights_safeupdate | corrige a RPC |
| 0044_lesson_grupo | `grupo` |
| 0045_licao_vereditos | `vm_licao_vereditos` |
| 0046_veredito_por_regra | PK (grupo, regra) |
| 0047_cross_post_uma_linha | MV refeita |
| 0048_painel_mostra_o_cross_post | não lida |
| 0049_modelo_por_sessao | `vm_sessions.modelo` |
| 0050_config_llm | `vm_config_llm` |
| 0051_roteiro_modo | `vm_roteiro_modo` (plano 025) |
| 0052_skill_da_sessao | `skill`, `skill_origem` |
| 0053_perfil_cliente | `perfil` |
| 0054_licao_alcance | `alcance`, `skills`, `absorvida_em` |
| 0055_roteiro_crm | `crm_script_id`, `crm_sobreposicao` (plano 024, 4.1) |
| 0056_preditor_sombra | `vm_preditor_rotulos`, `vm_preditor_sombra` (plano 026, Task B) |

---

## 3. Estado do preditor (plano 026)

### 3.1 O que está em main

| Task | Estado | Evidência |
|---|---|---|
| A: preditor v0 offline | feita | `docs/preditor-2026-10/` (commits `baaf777`, `0487d23`) |
| B: ordenar candidatos | entrou só em **modo sombra** | `lib/preditor/`, migration 0056 (commit `9c98fd8`) |
| C: avaliador de pauta | não existe | `MOSTRAR_SUGERIR_TEMA = false` (`components/home-form.tsx:11`) |
| D: recalibração mensal | não existe | sem código nem commit |

**Como a sombra funciona**
- `sombraDoPreditor` (`lib/preditor/index.ts:199-235`) é chamada com `void`, depois do `done`, em `lib/pipeline/index.ts:538-559`. Não muda a escolha da sala e nunca lança.
- Fase `hook`: todos os candidatos do agente de hook (`hookRes.todos`), cada um embutido como "Título + hook + roteiro entregue".
- Fase `narrativa`: só quando a sala propôs narrativas nesta rodada; embute título + gancho + beats.
- Com menos de 2 candidatas não roda (`:208`). Timeout de 20 s (`:136`).
- Pontuação (`pontuar`, `:156-193`): um request de embedding OpenAI, `match_documents` com top 40 e limiar 0,3, rótulos de `vm_preditor_rotulos`, fórmula logística de `lib/preditor/modelo.json` (`prever`, `:129-132`).
- Tem teste: `tests/preditor.test.ts` confere que a nota bate com a do modelo offline.

**Onde grava**
- `vm_preditor_sombra` (`0056_preditor_sombra.sql:25-38`): `session_id`, `script_id`, `client_id`, `fase`, `indice`, `texto`, `nota`, `escolhida`, `features` (jsonb), `versao`. Uma linha por candidata.
- `vm_preditor_rotulos` (`0056:10-18`): `video_id`, `script_id` (= `videos.crm_script_id`), `cliente_id`, `plataforma`, `data`, `pq`. Recalculada inteira no ETL semanal por `atualizarRotulos` (`lib/preditor/index.ts:294-315`, chamada em `lib/etl.ts:624`), a partir de `oraculo.fato_video` com `vm_script='sim'`.
- **Ninguém lê `vm_preditor_sombra` ainda.** Não há painel nem script que cruze a nota com o resultado publicado.

### 3.2 Features usadas

O modelo em produção é `lib/preditor/modelo.json`, versão `preditor-v0-2026-10_openai`: 170 features (145 marcas de hook `hk_*` + 25 outras), treino com n = 5547 de 2026-02 a 2026-09, lambda 3000.

| Grupo | Features | Fonte |
|---|---|---|
| Tema (kNN) | `knn20`, `sim_media`, `casa_taxa`, `log_n_casa`, `cli_taxa`, `log_n_cli` | `featuresDoTexto` (`lib/preditor/index.ts:83-104`) |
| Repetição | `rep_acerto`, `rep_acerto_90`, `rep_fraco`, `fora_fraco`, `fora_acerto` | idem |
| Cliente | `cli90`, `cli_tend` | `featuresDoCliente` (`:107-116`) |
| Formato | 7 `modo_*`, 3 `ancora_*` | skill da sessão |
| Território | `terr_c30`, `terr_c60` | ficam na média do treino |
| Hook | 145 `hk_*` | `marcasDoHook` (`lib/preditor/hook.ts`), regex portada do estudo, mais `lib/preditor/proprios.json` |

Limiares (`modelo.json:20-30`): mesmo cliente 0,72; outro cliente 0,69; `topo_pq` 0,69; `fraco_pq` 0,3; k 20/10/10; folga de 30 dias; base 0,26.

**O que muda da produção para o estudo** (`lib/preditor/index.ts:6-13`):
- Vizinhos: top 40 de `documents` agrupados por roteiro, com a similaridade do melhor documento. O estudo usava o centróide e o corpus inteiro.
- Território não pesa (os centróides não vieram para a produção).
- Taxa do cliente junta as três redes, porque a sessão não tem rede.
- Âncora fica fora, porque a sessão não tem.
- O trimestre do rótulo põe outubro a dezembro dentro do Q3, igual ao estudo (`:239-244`), marcado para revisão na Task D.

### 3.3 Métricas de acerto (copiadas de `docs/preditor-2026-10/RELATORIO.md`)

**Veredito: "passou no portão, mas raspando"** (`RELATORIO.md:5`). Portão: 58% par a par.

Rodada Gemini (`RELATORIO.md:7-13`):

| | par a par | AUC | Brier |
|---|---|---|---|
| v0, jul+ago+set juntos (3.157 vídeos, 12.750 pares, 162 grupos) | 60,9% [58,7 a 63,0] | 0,596 | 0,189 |
| julho (957 vídeos, 48 grupos) | 58,0% [54,9 a 60,9] | 0,582 | 0,184 |
| agosto (1.032 vídeos, 55 grupos) | 59,1% [55,2 a 63,0] | 0,562 | 0,187 |
| setembro (1.168 vídeos, 59 grupos) | 64,4% [60,5 a 68,5] | 0,655 | 0,194 |
| outubro parcial, que nenhum estudo viu (573 vídeos, 46 grupos) | 58,2% [53,1 a 63,0] | 0,547 | 0,187 |

Rodada com o embedding da produção, 23/10 (`RELATORIO.md:36-40`), nos mesmos 2.471 vídeos:

| | par a par [IC95] | AUC | Brier | jul / ago / set |
|---|---|---|---|---|
| OpenAI (documents) | 58,7% [56,7 a 61,2] | 0,581 | 0,187 | 57,8 / 58,5 / 63,1 |
| Gemini (CRM) | 58,9% [56,9 a 61,4] | 0,577 | 0,187 | 58,2 / 59,2 / 60,3 |

Só a parte do texto, que é o que ordena candidatas da mesma sessão (`RELATORIO.md:62-67`):

| | par a par [IC95] | jul / ago / set |
|---|---|---|
| OpenAI, 2.471 vídeos | 57,6% [55,7 a 60,1] | 58,2 / 56,0 / 62,6 |
| Gemini, os mesmos vídeos | 57,4% [55,4 a 60,0] | 58,2 / 56,3 / 59,2 |
| Gemini, todos os 3.157 vídeos | 60,1% [57,9 a 61,9] | 58,2 / 56,4 / 64,6 |
| modelo treinado só com o texto, OpenAI | 56,9% [55,2 a 59,6] | 58,2 / 54,6 / 62,0 |

Baselines e variações (`RELATORIO.md:112-123`):

| modelo | par a par jul-set [IC95] | AUC |
|---|---|---|
| v0 | 60,9% [58,7 a 63,0] | 0,596 |
| só o roteiro (tema + repetição + hook) | 59,9% [57,5 a 61,6] | 0,580 |
| sem hook | 57,5% [54,1 a 60,4] | 0,588 |
| baseline: só o kNN da casa | 58,0% [55,8 a 60,3] | 0,567 |
| baseline: só a taxa recente do cliente | 48,4% [45,4 a 51,2] | 0,441 |
| só o território (k=60) | 54,6% [52,0 a 57,6] | 0,549 |
| com o placar do hook do estudo (otimista) | 64,0% [61,3 a 66,7] | 0,638 |

**Leituras do próprio relatório:**
- Serve para ordenar, não para prometer número: "O Brier é 0,189 contra 0,192 de chutar 26% para todo mundo" (`:17`).
- Calibração certa entre 15% e 40% ("92% dos vídeos"); acima disso "prevê 47% e o observado foi 33% [26 a 41], em 154 vídeos" (`:18`). Com OpenAI: "prevê 48% e o observado é 29%" (`:48`).
- "A parte do texto acerta qual foi topo em 57,6% das vezes. Fica meio ponto abaixo do portão" (`:69`).
- A acurácia entre variações do mesmo tema "ainda não foi medida" (`:70`). É isso que a sombra existe para medir.
- O hook é a maior alavanca: "de 57,5% para 60,9%" (`:131`).
- Com folga de 7 dias em vez de 30, o v0 vai "de 60,9% para 62,4%" (`:135`).
- Por rede: "Instagram 61,1%, TikTok 60,5% e YouTube 61,1%" (`:125`).
- Cobertura: "A `documents` parou em 14/09" (`:86`); o commit `ed7385b` religou a ingestão no ETL (`lib/etl.ts:622`, `lib/corpus-embeddings.ts`).
- Erro conhecido: notas altas quase todas "estudante do interior", território que saturou (`:194`).

**Divergência:** `plans/026-preditor-e-avaliador.md:8` ainda fala em embedding Gemini do CRM; a produção usa OpenAI.

---

## 4. Vínculo roteiro → vídeo postado → views e seguidores

### 4.1 A cadeia

1. **Codex → CRM.** O roteiro sai por copiar e colar; nenhum id sobrevive (`docs/ligacao-roteiro-video/INVESTIGACAO.md:8`). `casarComCrm` (`lib/script-matches.ts:258-393`) compara os 5-gramas de hook + roteiro com `scripts.script_text` do CRM, sem filtro de cliente, na janela de 3 dias antes a 60 depois (`casarTextosCrm`, `:207-231`).
   - Sobreposição ≥ 0,08 (`MATCH_AUTO`, `:12`): grava `vm_generated_scripts.crm_script_id` e `crm_sobreposicao` (`:374-378`).
   - Entre 0,02 e 0,08 (`MATCH_PENDENTE`, `:13`): pendente para o Kasparov; não grava `crm_script_id`.
   - Sem `CRM_SUPABASE_URL` e `CRM_SERVICE_ROLE_KEY`, é pulado e devolve o motivo (`:261`).
2. **CRM → vídeo.** Quem liga é o coletor (outro app), em `videos.crm_script_id`, por embedding da transcrição com score ≥ 0,87 (`INVESTIGACAO.md:19`). O Codex lê os vídeos por `crm_script_id` (`script-matches.ts:310-313`) e grava em `vm_script_matches` com `metodo='crm_shingle'` (`:337-367`).
3. **Marcar publicado.** `publicar` (`:92-104`) grava `status='published'`, `published_url`, `published_at`, com Instagram em prioridade (`:382-388`). Nunca sobrescreve URL existente. Também por `markPublished` à mão (`lib/actions.ts:387`) ou "é este" no Kasparov (`confirmarCasamento`, `script-matches.ts:159-173`).
4. **Caminho antigo (plano 020, WP-A).** `casarRoteiros` (`:118-156`) chama a RPC `vm_match_scripts` (`0040_script_matches.sql:40-73`). Roda depois do caminho do CRM (`lib/etl.ts:626-628`).
5. **Views e seguidores.** `syncScriptPerformance` (`lib/script-performance.ts:78-108`) resolve `published_url` → `videos.link_video` (`:28-43`) e grava `vm_script_performance`. Views e compartilhamentos vêm de `metricas_diarias`; retenção e `seguidores_ganhos` vêm de `metricas_retencao` (`:45-66`).
6. **Resultado maduro.** Com 14 dias ou mais (`lib/etl-gate.ts:7`), vira linha em `vm_outcomes` (`lib/etl.ts:770`) e insight `client_scriptresult`. O ratio é o `coeficiente_viral` de `oraculo.fato_video`, com views ÷ média do cliente como fallback.
7. **Codex contra o canal.** Insight global `codex_vs_canal` (`lib/codex-vs-canal.ts`), por roteiro, com critério de parada de 60 roteiros maduros.

### 4.2 Quem dispara

- `runWeeklyEtl` (`lib/etl.ts:564`), pela rota `GET /api/cron/weekly-etl` (`app/api/cron/weekly-etl/route.ts`, protegida por `CRON_SECRET`, pula se já rodou em 24 h).
- `.github/workflows/etl-semanal.yml`: segunda às 09:00, 15:00 e 21:00 UTC, 3 tentativas, avisa quando o JSON traz `erro` ou `pulado`.
- Manual: `scripts/run-etl.ts`, `scripts/backfill-matches.ts` (janela de 365 dias, `--dry-run`), `scripts/backfill-performance.ts`.

### 4.3 Números da investigação (`docs/ligacao-roteiro-video/INVESTIGACAO.md`, 20/10/2026)

- "`vm_script_matches` parou em 21/09 porque a RPC estoura o tempo": 11,7 s contra `statement_timeout=8s` (`:9`).
- Pelo CRM: "56 roteiros do Codex caem em 56 roteiros do CRM, e 42 deles foram postados (120 vídeos)"; "20/20" de acordo com o caminho antigo; "0 falsos positivos" em 10 conferidos (`:10`).
- Funil: "cerca de 25% das sessões viram roteiro no CRM e 19% viram vídeo" (`:54`).
- Performance por roteiro: Codex n = 38, coeficiente mediano 1,67, 55% ≥ 1,5; humano n = 880, 1,25 e 42% (`:65-66`). Pareado por cliente × rede: acima em 23 células e abaixo em 17, "p ≈ 0,4" (`:68`).
- Ressalvas: viés de seleção e n pequeno (`:71-73`).
- `docs/estrategia-2026-10/DADOS-FLUXOS.md` traz outra conta dois dias depois: 39 roteiros, coeficiente mediano 1,49, acerto 29% contra 1,17 e 16% do humano pareado, "26 de 39, com teste do sinal p ≈ 0,05 bilateral". Os dois docs não se reconciliam.

### 4.4 O elo fraco: seguidores e retenção

`docs/ligacao-roteiro-video/RETENCAO.md`:
- "Nenhum coletor grava retenção." `metricas_retencao` só recebe planilha importada à mão no performa-social (`:7`).
- A última planilha nova chegou em 21/09 com dados até 14/09 (`:32`, `:59`).
- "4053 das 6452 linhas são duplicatas" (`:36`).
- Como `seguidores_ganhos` vem dessa mesma tabela, **o vínculo roteiro → seguidores está parado desde meados de setembro**; views e compartilhamentos seguem vivos pelo coletor.
- Caminhos listados: retomar a planilha, Instagram Graph API (não entrega a curva de retenção), TikTok API, higiene do import (`:63-68`). A decisão entre planilha e Graph API ficou com você.

---

## 5. Estratégia e planos: o que já foi decidido

### 5.0 Status

| Plano | Status registrado | Estado no código |
|---|---|---|
| 020 | DONE (`plans/README.md:38`) | idem |
| 021 | sem linha no README | auditoria de 13/09; não registra execução |
| 024 | README diz SPEC (`:40`); o plano diz EM EXECUÇÃO (`plans/024-escrita-viral.md:3`) | README desatualizado; andamento em `024:257-284` |
| 025 | README diz SPEC (`:39`); andamento "a fazer" (`025:1627-1632`) | os dois desatualizados: há commits das Tasks 1 a 7, 9, 10 e do piloto da 12. Tasks 8 e 11 não estão no código |
| 026 | sem linha no README | aprovado em 22/10; A feita, B em sombra, C e D pendentes |

### 5.1 Docs de estratégia (`docs/estrategia-2026-10/`, 22/10/2026)

**`ESTRATEGIA.md`**
- **A escrita já não é o gargalo:** "26 de 39 ficaram acima do humano do mesmo cliente × rede × período (p≈0,05)"; acerto "29%, contra 16% do humano" (`:7-10`).
- **O sinal se perde antes e depois da escrita** (`:11-28`):
  - Modelar vídeo: "41% das sessões viram vídeo", mas "30% das sessões morrem antes", a maioria na transcrição.
  - Livre: o mais usado ("43% em outubro") e o que menos converte ("13%").
  - Nenhum preditor real: narrativa por nota de LLM, hook por regex.
  - Laços parados: "2 de 148 lições ativas", Kasparov "morto desde 18/08", calibração com "6 votos".
  - Custo: Grok 4.7 a "cerca de US$ 3,8 por sessão".
- **Consequência decidida:** o dado que ensina é o corpus da casa ("5.510 roteiros com coeficiente e 11 mil vídeos"); os roteiros do Codex só confirmam devagar (`:36`).
- **Sete itens de retorno imediato** (`:40-48`): consertar a transcrição; preditor v0 ("Abaixo de 58% não vira portão"); ordenar candidatas e registrar; avaliador de pauta; banco de referências ("Referência da casa rende 34% de topo, contra 26% da externa"); modelagem por cliente; custo do Grok.
- **Limitações de fluxo** (`:50-58`): sem cliente não gera; livre pede âncora; modelar texto em observação por 30 dias; rotina de 15 minutos por semana no Cockpit substitui o Kasparov.
- **Mecanismo de evolução** (`:60-81`): espinha de dados; preditor revalidado todo mês; evolução mensal das skills no estilo GEPA com portão offline e portão humano ("cerca de US$ 10 a 30 por mês"); campeão e desafiante com "cerca de 20%" das sessões por Thompson sampling; decisão final por trimestre.
- **Proteções:** prompt nunca muda sem aprovação; juiz LLM só checa regra; poucas candidatas.
- **Ordem** (`:83-89`): release do 025 + casamento ("pronto"); itens 1, 2 e 3; itens 4, 5, 6 e limitações; mecanismo mensal depois de 1 mês de log de candidatas; Tasks 8 e 11 do 025.

**`ESTADO-DA-ARTE.md`:** GPT-4 "38 a 40%" nos testes da Upworthy; realista "55 a 65%" (`:4-7`); best-of-N tem curva de Goodhart (`:11`); "com cerca de 40 roteiros publicados, só diferenças grandes aparecem" (`:29-31`); oito recomendações (`:33-41`).

**`DADOS-FLUXOS.md`** (273 sessões)
- Volume: livre 85 (31%), modelar_video 56 (21%), fontes 55 (20%), replicar 33 (12%), modelar_texto 29 (11%), carrossel 15 (5%) (`:13-18`). "73 sessões (27%) não têm cliente" (`:39`).
- Funil maduro, vídeo por roteiro: livre 13%, fontes 29%, modelar_video 41%, modelar_texto 29%, replicar 16%, carrossel 25%, total 24% (`:74-80`).
- Reescrita Codex → CRM: mediana 0,55; modelar_video 0,85; modelar_texto 0,40 (`:134-140`).
- Custo Anthropic: mediana US$ 1,56 por sessão, 9,43 por publicado (`:161-167`).
- Referências: "95% das referências são reels externos do Instagram", sem métrica; a pergunta "o modelado performou perto da referência?" "não tem resposta para 46 de 54 casos" (`:124`).
- Modelado contra original no corpus: OR do topo 1,07 no todo; a favor Izabela (2,06) e Thiago Franco (3,46); contra Pedro Elero (0,27) e Túlio (0,22) (`:183-194`).

### 5.2 Plano 020: evolução por dados (05/09/2026, DONE)

- **Decisões suas (05/09)** (`plans/020-evolucao-por-dados.md:9`): o objeto do estudo são os roteiros do Codex, com o corpus como régua; teto de classificação por LLM em "amostra mínima (~2 mil textos)"; "números entram sozinhos" no prompt e "prosa só com confirmação".
- **Pré-registro** (`:36-44`): métrica `coeficiente_viral`; topo = quartil superior no estrato cliente × plataforma; "n<10 suprime; 10-29 flag `baixa_confianca`"; "Nenhuma afirmação com <40 roteiros no total ou <20 por cliente"; parada em "60 roteiros maduros ou 16 semanas".
- **Ambíguo:** o alvo aparece como "1.5×" e como "pós ≥1.15× pré" (`:199`), sem reconciliar.
- **Ondas** (`:162-170`): casamento, métricas de texto e taxonomia; estudo de lift; `selectHook` por lift e few-shot por cliente; matriz estrutura × tema; medir (`codex_vs_canal`). WP-K cancelado.
- **Travado:** casamento por 5-gramas, não `ts_rank` (`:69`); nunca escrever no schema `oraculo` (`:26`); sem ativação automática de lição ou playbook (`:178`).

### 5.3 Plano 021: auditoria (13/09/2026)

Diagnóstico e proposta; o arquivo não registra decisão sua nem execução.
- A revisão nunca rodava: "181 de 181 chamadas bateram no teto de `max_tokens`" (`plans/021-plano-de-evolucao.md:15-18`).
- "126 aprendizados extraídos por LLM, 1 ativo" (`:21-23`).
- Calibração: "252 pares colhidos, 6 votos, zero insight emitido" (`:156-161`).
- Flywheel: "16 de 187 roteiros publicados, 15 com métrica, 10 maduros" (`:19-20`).
- Comando medido por seguidores absolutos mede alcance: "corr_abs = 0.804 ; corr_taxa = 0.127 ; n = 1655" (`:328`). Proposta: seguidores por mil views contra a mediana do canal.
- "O dado não separa os mecanismos" de hook (`:388-413`).
- Princípio de ordem (`:1230-1233`): consertar o quebrado, devolver dado honesto às decisões existentes, só depois criar decisões novas.
- Itens resolvidos em planos posteriores: revisão por tool (024), few-shot por coeficiente (024), ingestão de `documents` (`ed7385b`). O resto não tem estado confirmado.

### 5.4 Plano 024: escrita para viralização (11/10/2026)

- **Tese:** piso (clareza, tiques) e teto (potencial viral, decidido na pauta, premissa, payoff e hook) são problemas diferentes (`plans/024-escrita-viral.md:21`).
- **Diagnóstico:** sobreposição Codex × publicado 0,47; "Só 9% dos roteiros gerados foram publicados" (`:19`); estilo de superfície quase não prevê viral ("d de no máximo 0,26") (`:20`).
- **Decisões suas (11/10)** (`:239-245`): playbooks de outubro sobem só depois do A/B, e "ativar é obrigatório"; humanizador vira cirúrgico, não sai; painel humano "não por enquanto"; métrica do teto é "coeficiente viral ou compartilhamentos por mil; melhora em um sem piora no outro".
- **Portão do juiz:** 62% nos 232 pares cegos. Resultado: "Sonnet 5.5 68% [60 a 74] decidindo 73%; Opus 5.5 75% [67 a 82] decidindo 59%" (`:269`).
- **Metas em 8 semanas** (`:203-212`): sobreposição de 0,47 para 0,70; hook reescrito de 41% para < 20%; publicados de 9% para 25%.
- **Banco de prova** (`:286-304`): braço C venceu A por "20 × 0" no juiz, com custo de US$ 1,23 por roteiro contra 1,63.
- **Pendente:** 4.2 ("não usado" após 14 dias), 4.4 (retenção), 2.2 (premissa decide o teto, adiado).
- **Não fazer** (`:247-253`): aumentar a banlist; usar o juiz como portão de teto sem os 62%; perseguir paridade de estilo com o humano.

### 5.5 Plano 025: skills por modo (18/10/2026)

- Quatro skills (história, mecanismo, demonstração, panorama), cada uma com 8 seções (`plans/025-skills-por-modo.md:5-7`, `:28`). Seed de "2.832 rótulos com cliente" (`:31`).
- **Decisões suas (18/10)** (`:44-49`): conselho e publi ficam sem skill; banco de prova em duas etapas (piloto de "~US$ 30", completo de "~US$ 115", cada rodada com OK na hora); pesquisa dirigida no meio da geração fica fora.
- **Critério para subir** (`:1586-1590`): fidelidade ≥ 80%; juiz não perde para A; piso não piora; custo até 20% acima.
- O resultado do piloto não está registrado no plano.
- **Medição pós-release** (`:1601-1605`): "a meta é sair dos 46% de mecanismo".
- **Pendente:** Task 8 (triar as 156 lições) e Task 11 (classificar semanalmente o modo dos roteiros novos).

### 5.6 Plano 026

Ver seção 3. Decisões (`plans/026-preditor-e-avaliador.md:5-9`): prevê topo do próprio cliente, não views absolutas; portão de 58% par a par em mês não visto; custo zero de LLM.

### 5.7 Consolidado: o que está decidido sobre evolução por dados

1. **Régua única:** `coeficiente_viral` do Oráculo, com topo como quartil superior no estrato (cliente × plataforma no 020; cliente × rede × trimestre, base 26%, no 026).
2. **Número entra sozinho, prosa só com aprovação humana.** Nenhuma ativação automática de lição ou playbook.
3. **Nenhuma mudança de prompt sem banco de prova.**
4. **Piso e teto são trilhos separados.**
5. **Juiz LLM só checa regra, não prevê viral.**
6. **Preditor:** portão de 58%; abaixo disso só mostra dados; poucas candidatas.
7. **O dado que ensina é o corpus da casa**, não os roteiros do Codex.
8. **Resultado real é portão lento:** decisão por trimestre, sem ajustar limiar até "dar certo".
9. **Honestidade estatística:** IC cruzando 1 é "sem evidência"; n mínimo explícito.
10. **Descartado:** aumentar a banlist, painel humano por enquanto, remover o humanizador, skill para conselho e publi, casamento por `ts_rank` ou embedding, best-of-N grande.
11. **Próximos passos na ordem decidida:** avaliador de pauta, banco de referências, modelagem por cliente e limitações de fluxo; depois o mecanismo mensal com campeão e desafiante; depois Tasks 8 e 11 do 025.

---

## Não confirmado

- Estado de produção: quais migrations estão aplicadas (o código trata 0015, 0052, 0055 e 0056 como opcionais), o conteúdo de `vm_config_llm` e os playbooks ativos em `vm_playbooks`. Os modelos citados são os padrões do código.
- Se `CRM_SUPABASE_URL` e `CRM_SERVICE_ROLE_KEY` existem na Hostinger; sem elas o casamento pelo CRM é pulado.
- Escritor de `vm_roteiro_modo` além do seed, de `vm_modelagem_pool.usado_em` e de `vm_licao_vereditos`.
- Se `POST /api/kasparov` recusa chamadas durante a manutenção.
- Conteúdo da migration 0048.
- Linhas exatas das escritas dentro de `finalizeSession` e `gravarEnsinamento` (vieram de grep, sem ler os blocos inteiros).
