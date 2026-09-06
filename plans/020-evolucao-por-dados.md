# Plano 020 — Evolução da escrita do Codex a partir dos dados

Escrito em 05/09/2026 sobre o estado medido no banco no mesmo dia. Implementação por subagentes, um WP por vez, arquivos disjuntos por onda.

## Contexto

O Codex gerou 157 roteiros (158 sessões, 21 clientes, jul→set/2026). O produto promete aprender com o resultado real, e toda a tubulação existe (`vm_script_performance → vm_outcomes → calibracao_dados / attributeLessons / hookMechanismOutcomes / curadores`), mas recebe **2 roteiros** porque depende de alguém colar `published_url` — e ninguém cola. Igor pediu: estudar as sessões contra o que funcionou nos vídeos publicados, tirar lições globais e por cliente (hook, tema, comunicação, estrutura × tema) e evoluir a inteligência do Codex a partir disso.

**Decisões do Igor (05/09):** (1) o **objeto do estudo são os roteiros do Codex** — os publicados medem resultado, os não publicados também são sinal (ele escolhe o que publica); o corpus entra como **régua** do que é "bem sucedido", não como objeto; (2) teto de classificação LLM: **amostra mínima (~2 mil textos)**; (3) **números entram sozinhos** no prompt (rankings, lifts, matriz), **prosa só com confirmação** (proposta de playbook `active:false`; lição por cliente pela fila do Kasparov).

### O que o banco diz hoje (medido)

| Fato | Número | Consequência |
|---|---|---|
| Roteiros com `published_url` | 2/157 | flywheel vazio por falta de entrada, não de código |
| Casamento por texto (`ts_rank` do hook do Codex vs `videos.hook‖roteiro` do mesmo cliente, janela −3/+60d) | ≥0.9: 14 · ≥0.8: 21 · ≥0.7: 30 roteiros (96 vídeos, 4 plataformas, 69 com views) · 0.4–0.6: 26 na zona cinza | 12 pares ≥0.98 conferidos a olho = mesmo roteiro com edição leve. **~20–28% dos roteiros foram publicados** |
| `pipeline_trace.hook_mecanismo` = "Contraste Extremo" | 134/144 (93%) | `rankHookMechanisms` rankeia por **share entre vencedores** (`lib/learning-loop.ts:205`) e `selectHook` pega o topo (`lib/pipeline/hook-mechanisms.ts:105`). Share mede prevalência, não eficácia. O racional gravado confirma: "58% de share, priorizado pelo ranking" |
| Estruturas do Codex | C1 Iconoclasta 34 · E1 Paradoxo 18 · C2 Estratégia Oculta 14 = 42% em 3 de 19 | no Oráculo, essas três estão na base (23–25% no top quartil); A3 Herói Esquecido 45%, B1 Davi e Golias 41%, A2 Herói Improvável 40% — o Codex usou A3/B1/A2 4, 6 e 1 vez |
| `vm_client_insights` (alimenta `client_hook/storytelling/comando`) | lê `videos.analise` legado: 22% de cobertura, vocabulário inconsistente (`gatilho_expectativa`/`gatilho_de_expectativa`/`expectativa`) | insight por cliente é ruído hoje |
| Few-shot | `void clientId` (`lib/pipeline/context.ts:96`) | roteirista imita os 5 mais vistos do corpus inteiro, para qualquer cliente |
| `vm_lesson_learnings` | 89, 0 ativas; `ativada_em` nunca escrita (`lib/actions.ts:325`) | `medirRecorrencia` morta |
| Prévia Codex vs canal (mediana views casados ÷ mediana canal desde jun) | Pelozato 1.56× (n=28) · Fernando 1.18× (14) · Elero 77× (6, um hit) · Cirino 16.9× (2) · Izabela 0.20× (3) · Franklin 0.37× (3) | dado existe; n pequeno; só descrição |

### O atalho que muda o custo: schema `oraculo` (repo irmão Oráculo VM, mesmo Supabase)

Verificado com `service_role` (read-only). **Nunca escrever nesse schema.**

| Objeto | O que dá de graça |
|---|---|
| `oraculo.fato_video` (MV, 11.255) | `coeficiente_viral` = views ÷ mediana móvel 180d do **mesmo canal e mesma origem** (vm/próprio), `classificacao` (acerto ≥1.5 / outlier ≥3), `maturando` (<7d), `categorias` normalizadas (JSON `{"nome"}` resolvido), `vm_script`, `plataforma`, `cliente_id`, `hook`, `comando`, retenção, seguidores ganhos. **É a métrica "mede o vídeo, não a circunstância" pronta** — substitui o `ratio = views/media_views_geral` do ETL |
| `oraculo.playbook_class` (dimensao, chave=texto, categorias[]) | rótulos canônicos já pagos: hook 4.673 · comando 3.636 · storytelling 1.348 (via `fato_roteiro`, CRM) |
| `oraculo.playbook_categorias` (dimensao, slug, nome, descricao) | 18 hooks / 13 comandos / 19 estruturas com **definições neutras** — o system do classificador |

Achado colateral: o classificador do Codex (`scripts/analyze-hooks.ts:176`) manda o playbook **ordenado por performance** no system ("Contraste Extremo, n=369, 58%") e rotula Contraste Extremo em 39% dos hooks; o Oráculo, com definições neutras, 27%. **O colapso começa no classificador, por priming.** Concordância entre os dois na interseção (766 hooks): 52%.

### Métrica e estatística (pré-registro — travar antes de olhar resultado)

- **Primária:** `coeficiente_viral` de `fato_video`, excluindo `maturando`. `top` = quartil superior **dentro do estrato (cliente, plataforma)** → P(top)=0.25 por construção, confusão por audiência/plataforma sai de graça. Estrato primário Instagram; demais à parte.
- **Lift por rótulo** = P(top | rótulo)/0.25, com Wilson (`wilsonLower` existe em `lib/calibration.ts:30`; adicionar `wilsonUpper`). n<10 suprime; 10–29 flag `baixa_confianca` + encolhimento `(k+0.25·20)/(n+20)`; ≥30 publica. Sempre com n e intervalo; **IC cruzando 1 = "sem evidência", escrito assim no prompt**. Multi-label: marginal. Flags `dominancia>0.5` (um cliente domina o rótulo) e `consistencia` (positivo em x/y clientes).
- **Unidade:** vídeo para rótulos; **roteiro** (média dos posts) para Codex vs humano. Dedup do corpus por `md5(roteiro)` no global.
- **Matriz estrutura × tema:** encolhimento aditivo `p* = (k_cel + 15·p_prior)/(n_cel + 15)`, `p_prior = clamp(p_tema + p_estr − 0.25, .05, .95)`. Tema = `fato_video.categorias[1]`, sem LLM.
- **Comunicação:** lista fechada de métricas de texto (abaixo, WP-B); Cliff's delta top vs bottom quartil por cliente (n_top, n_bot ≥15); pool ponderado; vira regra só se |δ|≥0.2, mesmo sinal em ≥2/3 dos clientes **e** replica em holdout temporal (vídeos após a análise).
- **Codex vs humano:** controles = mesmo cliente, mesma plataforma, ±45d, `vm_script='sim'`, ≥8 controles; estatística `P(percentil_roteiro > 0.5)` com Wilson. **Nenhuma afirmação com <40 roteiros no total ou <20 por cliente** — com 15–25 roteiros hoje, o enunciado honesto é "sem evidência de melhor/pior". Viés de seleção (Igor escolhe o que publica) registrado; taxa de publicação (20–28%) vira métrica própria.
- **Parada:** alvo 1.5× na mediana de `coeficiente_viral` dos roteiros Codex pós-corte vs pré, decidido em **60 roteiros maduros ou 16 semanas**, o que vier antes. Sem efeito → parar de investir em seleção de hook/estrutura, manter instrumento e diversidade, levar a próxima rodada para tema/premissa ou edição humana (plano 019).

---

## Fases (ordem e porquê)

**Fase 0 — Instrumento (sem LLM).** Casamento retroativo e semanal Codex→vídeo; métricas de texto. Vem antes porque sem isso a Fase 3 muda a sala e a 4 não mede nada, e porque devolve os 30–45 outcomes que já existem.
**Fase 1 — Rótulos canônicos.** Semear do Oráculo (zero LLM); LLM só na lacuna de storytelling, `vm_script='sim'` + extremos primeiro, ≤2k textos (~US$6–12). Classificador com definições neutras (conserta o priming).
**Fase 2 — O estudo.** Lift por mecanismo/estrutura/gatilho/tema (global + cliente), matriz estrutura×tema, comunicação, Codex vs humanos, onde o Codex erra. Relatório + briefing por cliente. **Igor lê e decide o que da Fase 3 entra.**
**Fase 3 — Evolução.** share→lift + anti-colapso no hook; matriz por dados no storytelling; few-shot por cliente; lições e playbooks como proposta; `ativada_em`.
**Fase 4 — Medir.** ratio do flywheel vira `coeficiente_viral`; insight `codex_vs_canal` semanal; critério de parada.

---

## Work packages

Gate de todo WP: `npx tsc --noEmit && npx eslint . && npm run check && npm test`. Migrations aplicadas pelo **operador** após merge (executores não têm banco). Scripts: `npx tsx --env-file=.env.local scripts/<nome>.ts`. Sem dependência nova. Leitura do schema `oraculo` via `viralData.schema("oraculo")` — nada muda em `lib/db.ts`.

### Onda 1 (paralelo)

#### WP-A — Casamento Codex → vídeos publicados
**Objetivo:** alta confiança entra no flywheel sozinha toda semana; zona cinza vira pendência no Kasparov; N:1 (mesmo roteiro em IG/TT/YT) preservado.

Criar:
- `supabase/migrations/0040_script_matches.sql`: tabela `vm_script_matches(script_id fk cascade, video_id uuid, plataforma text, score real, metodo text default 'tsrank_hook', confirmado boolean /*null=pendente*/, decidido_em, created_at, pk(script_id,video_id))`, índice parcial `where confirmado is null`, RLS sem policy (padrão 0011). Função `vm_match_scripts(p_min real default 0.4)`: a query validada (CTE `s` com `plainto_tsquery('portuguese', coalesce(nullif(hook,''), left(roteiro,400)))`, join `canais.cliente_id → videos.canal_id`, janela `created_at::date −3/+60`, `not coalesce(removido,false)`, `ts_rank(to_tsvector('portuguese', coalesce(hook,'')||' '||left(coalesce(roteiro,''),1500)), q)`, `distinct on (script_id, plataforma)` por maior score, excluindo scripts já decididos).
- `lib/script-matches.ts`: **decisão pela sobreposição de 5-gramas literais** (`sobreposicao(a,b)`, pura), não pelo `ts_rank` — executado em 06/09: `ts_rank` 0.96–0.98 saiu para vídeos diferentes de tema parecido (Federer/Nike, Ceará/Coca Zero) e 0.63 para um verdadeiro (Google IA); a sobreposição separou 36/36 (verdadeiro ≥0.09, falso ≤0.02). `MATCH_AUTO = 0.08`, `MATCH_PENDENTE = 0.02` sobre a sobreposição; a RPC devolve `roteiro_codex/roteiro_video` e a tabela guarda `sobreposicao`. `decidirCasamentos(rows)` (1 vídeo → 1 roteiro pela maior sobreposição — escolhe a versão certa entre v1/v2; `principal` = Instagram se houver, senão maior sobreposição); `casarRoteiros()` — RPC → upsert (auto: `confirmado=true, metodo='tsrank_auto'`; cinza: `null`) → para auto e **só se `published_url is null`**: `update vm_generated_scripts set status='published', published_url=link_video, published_at=data_publicacao`. Best-effort no padrão de `varrerEdicoes` (`lib/etl.ts:290`). `confirmarCasamento(scriptId, videoId, aceito)`.
- `scripts/backfill-matches.ts [--dry-run]`: lista `score · plataforma · hook Codex (80) · hook vídeo (80)`; sem dry-run chama `casarRoteiros()` e `syncScriptPerformance()` (`lib/script-performance.ts:77`).
- `tests/script-matches.test.ts`: vídeo em 2 roteiros fica no maior score; IG principal; 0.79 pendente / 0.80 auto; <0.4 fora.

Alterar:
- `lib/etl.ts` (~l.450, antes do "Flywheel 1/3"): `const casados = await casarRoteiros();` + retorno. 3 linhas.
- `lib/pipeline/kasparov-filas.ts`: `Pendencia` ganha `{tipo:"casamento"; scriptId; videoId; hookCodex; hookVideo; link; score; plataforma; restantes}`; `casamentosPendentesDb(clientId)`; 4ª fila em `proximaPendencia` (l.151); `responder` (l.189): `ativar→confirmar(true)`, `rejeitar→false`, `skip→nada`. `FilasDeps.confirmarCasamento?`.
- `app/api/kasparov/route.ts`: injeta dep; `PENDENCIA_DE_ADM.casamento = true`.
- `components/kasparov-chat.tsx`: ramo `casamento` ao lado de `metrica` (l.~372): dois hooks lado a lado, link, "é este" / "não é" / "agora não".

Reuso: `syncScriptPerformance`, `resolveCorpusVideo`, `maturityGate` (`lib/etl-gate.ts`), padrão da pendência `metrica`.
Verificação: `backfill-matches --dry-run` lista os pares com `ov` e `ts`; **resultado real (06/09): 36 vídeos auto de 14 roteiros, 0 pendentes, 13 `published_url` gravados, `vm_script_performance` 2 → 15.** Roteiros publicados com hook E corpo totalmente reescritos ficam fora por construção (teto documentado no código).
STOP: (1) conferir 10 pares aleatórios 0.8–0.9 a olho; <9/10 → `MATCH_AUTO=0.9` antes de gravar URL. (2) roteiro casando com >4 vídeos → janela larga, não gravar. (3) nunca sobrescrever `published_url` existente.

#### WP-B — Métricas determinísticas de comunicação
Criar:
- `lib/text-metrics.ts` (puro): `PALAVRAS_MAGICAS` (movida de `scripts/analyze-hooks.ts:37`); `textMetrics(roteiro, hook?)` → `{palavras, frases, paragrafos, palavras_por_frase_media, palavras_por_frase_p90, frases_curtas_pct(≤6), palavras_por_paragrafo_media, numeros_por_100_palavras, frases_com_numero_pct, voce_por_100, eu_por_100, nos_por_100, perguntas_por_100_frases, imperativos_por_100_frases, magicas_por_100_palavras, nomes_proprios_por_100, hook_palavras, hook_frases, hook_tem_numero}`. Reusa `dividirFrases` (`lib/pipeline/slop-lint.ts:313`) e `contarFrases` (`hook-mechanisms.ts:57`). **Lista fechada = pré-registro.**
- `scripts/study-text-metrics.ts`: lê `oraculo.fato_video` (paginado) + `videos(id,hook,roteiro)` + `vm_generated_scripts(id,client_id,hook,roteiro,created_at)`; dedup por `md5(roteiro)`; escreve `docs/estudo-2026-09/text-metrics.json` (`{fonte:'corpus'|'codex', ids, cliente_id, plataforma, vm_script, coeficiente_viral, maturando, ...metrics}`). **Não persiste em tabela** — só o estudo lê.
- `tests/text-metrics.test.ts`: texto de 3 parágrafos/8 frases/2 números/1 pergunta com contagens exatas; "R$ 3.400" é 1 frase.
STOP: `frases` divergindo >10% da contagem manual em 5 roteiros → consertar divisor antes.

#### WP-C — Taxonomia canônica: semear do Oráculo + LLM só na lacuna
Criar:
- `supabase/migrations/0041_video_classifications.sql`: `vm_video_classifications(video_id pk, hook_mecanismos text[], hook_formato text, estruturas text[] /*'A1'..'F4'*/, comandos text[], tema text, fonte text /*'oraculo'|'codex-2026-07'|'codex-llm'*/, modelo text, updated_at)`, RLS sem policy. (`vm_hook_classifications` é migrada aqui e dropada na 0042.)
- `lib/pipeline/taxonomia.ts` (puro): `HOOK_SLUG_TO_MEC` (`o_proibido`→"Viés de Ilegalidade"; `esse_cara`→formato "Personagem Central" + mecanismo do 2º slug ou "Outro"; `pergunta_*`→"Outro"), `STORY_SLUG_TO_CODE` (19), `COMANDO_SLUG_TO_NOME` (7 + `pergunta_*`/`comentario_por_recompensa`→"Pergunta"), `ESTRUTURAS = [{code, nome}]` (hoje só no markdown; `extractPlaybookSection` em `draft.ts:93` já usa o código como chave).
- `scripts/seed-classifications-from-oraculo.ts`: `playbook_class` (hook/comando por texto; storytelling via `fato_roteiro.video_id`) + `fato_video.categorias[1]` → upsert `fonte='oraculo'`; depois `vm_hook_classifications` onde não há Oráculo, `fonte='codex-2026-07'`. Imprime concordância na interseção (~52%, vai para o relatório).
- `scripts/classify-corpus.ts --dims storytelling[,hook,comando] [--limit N] [--dry-run] [--vm sim|nao|todos]`: evolução de `analyze-hooks.ts` (paginação `:77-118`, `runPool` `:194`, tool forçada `toolInput/toolArray`, `max_tokens ≥ 4000`, `ANALYST_MODEL`). Fila = 2026, com roteiro, sem rótulo na dimensão, **dedup por `md5(left(roteiro,4000))`**, prioridade `vm_script='sim'` → extremos de `coeficiente_viral` de `'nao'` → meio. **Teto `--limit 2000` por padrão (decisão do Igor).** Lote storytelling 8, hook/comando 20. **System = definições de `oraculo.playbook_categorias.descricao`, nunca o playbook.** Idempotente, `fonte='codex-llm'`.
- `tests/taxonomia.test.ts`: todo slug do Oráculo tem mapa; `esse_cara` vira formato; código casa com `extractPlaybookSection(playbook, "A1. Jornada do Herói")`.

Custo: lacuna de storytelling ~8.2k vídeos ≈ 4.5k textos distintos; com teto de 2k textos → ~250 chamadas × ~7.6k tokens ≈ 1.9M in → **~US$5–10**. Hook/comando: lacuna ~2.4k hooks distintos, ~120 chamadas, <US$1 (opcional).
Verificação: `select fonte, count(*) filter (where cardinality(estruturas)>0) ... group by 1` → estruturas rotuladas ≥3.000 em 2026; share de "Contraste Extremo" no `codex-llm` entre 20–35% (>45% = priming voltou, parar).
STOP: `--dry-run` imprime fila e custo; >US$20 → parar e perguntar. 20 roteiros LLM conferidos a olho; <14/20 plausíveis → revisar definições. Nunca escrever em `oraculo`.

### Onda 2 (após 0040/0041 aplicadas e scripts rodados)

#### WP-D — O estudo
Criar:
- `lib/study-stats.ts` (puro): `lift(rows:{label,top}[], minN)` → `{label,n,k,p,lift,lift_lb,lift_ub,flag}` (Wilson, encolhimento 10–29); `wilsonUpper` em `lib/calibration.ts` ao lado de `wilsonLower`; `cliffsDelta(a,b)`; `quartis`, `topNoEstrato(rows, by:(cliente,plataforma))`; `celulaEncolhida(k,n,p_tema,p_estr,K=15)`.
- `scripts/study-lift.ts [--out docs/estudo-2026-09] [--codex]`: junta `fato_video` (2026, `!maturando`, views>0) × `vm_video_classifications` × `text-metrics.json` × `vm_generated_scripts` + `vm_script_matches`. Emite: (a) lift global por mecanismo/estrutura/gatilho (**gatilho pelo eixo `seguidores_ganhos`**, regra do `agents/dados.md`)/tema; (b) por cliente (≥40 vídeos rotulados; n≥8 com flag); (c) matriz estrutura×tema (`matriz-estrutura-tema.md` + JSON); (d) comunicação: Cliff's delta por métrica, global e por cliente, Codex vs VM vs próprio; (e) **Codex**: distribuição de `hook_mecanismo`/`estrutura`/tema dos 157 vs lift no corpus; casados: `coeficiente_viral` por mecanismo/estrutura (descrição, zero veredicto); percentil vs controles (WP acima); taxa de publicação por cliente; o que os 24 editados mudaram (`vm_edit_observations` já populada pelo ETL); `predicted_score` vs real. Saída: `relatorio.md`, `lift.json`, `briefing-<cliente>.md` (só com n; os demais "sem dado").
- `tests/study-stats.test.ts`: lift com base conhecida; `lift_lb < lift < lift_ub`; delta idênticas=0, disjuntas=±1; encolhimento com n=0 devolve o prior.
STOP: nenhum rótulo com `lift_lb>1` e n≥30 no global → Fase 3(a)/(b) **não muda ranking**, só entra diversidade, e o plano registra "o dado não separa". Concordância Oráculo×Codex de hook <45% → hook só global, com aviso.

#### WP-E — Insights canônicos no ETL: share → lift
Criar `supabase/migrations/0042_client_insights_canonicas.sql`: `create or replace function vm_client_insights` (assinatura idêntica à 0018; só a CTE `class` troca `videos.analise` por `vm_video_classifications`, ramo `tema` intacto); `drop table if exists vm_hook_classifications`. Não mexer em `vm_client_panel`.
Alterar:
- `lib/learning-loop.ts:205` → `rankByLift(rows:{labels[],clienteId,top}[], minSample=30, topK=6)` → `{label,n,top_n,lift,lift_lb}` ordenado por `lift_lb`; `share` sai. `hookMechanismOutcomes`: `minPorMecanismo` 3→10; veredito só com `lift_lb>1` ou `lift_ub<1`. Atualizar `tests/learning-loop.test.ts:109-137`.
- `lib/etl.ts:212-243`: lê `vm_video_classifications` + `fato_video(video_id, cliente_id, plataforma, coeficiente_viral, maturando)`; `top` por estrato; payload `{titulo, total_analisado, base_top:0.25, ranking:[{mecanismo,n,top_n,lift,lift_lb}]}`, mesmo `insight_type`, cliente só com n≥40.
- Apagar `scripts/analyze-hooks.ts` e `MEC_PRETTY` (`etl.ts:211`).
Verificação: `npm run etl`; payload global traz `lift_lb`; `client_storytelling` sobe de 22% para ~60% de cobertura de clientes.

### Onda 3 (após Igor ler `relatorio.md`)

#### WP-F — `selectHook`: lift + anti-colapso
- `lib/pipeline/hook-mechanisms.ts:105`: `selectHook(candidatos, rankScore /*lift_lb*/, opts:{recentes?:string[]; nVariantes?})`. Score = `(lift_lb ?? 0) · 0.6^usos` (`usos` = ocorrências em `recentes`, últimos 5 do cliente). Regra dura: mecanismo em ≥3 dos últimos 5 **não** é principal se existir candidato com `lift_lb ≥ 0.8·top`. Devolve `motivo` ("lift 1,4× (n=212)" / "Contraste Extremo penalizado: 4 dos últimos 5") — nada inventado no racional.
- `lib/pipeline/agents.ts`: `hookMechanismRanking` lê `lift_lb`; `hookMechanismBlock` imprime "lift 1,4× (n=212)" e "cubra os 3 do topo entre os candidatos; a escolha final é do código"; `designHook(ctx, corpo, recentes=[])` passa `opts` e usa `motivo` no racional.
- `lib/pipeline/index.ts:399`: query `hook_mecanismo` dos últimos 5 roteiros do cliente → `recentes`; grava `hook_recentes` no trace. Falha → `[]`, nunca derruba.
- `agents/hook.md`: "(o topo é por lift, não por frequência)".
- `tests/hook-mechanisms.test.ts`: penalidade 0.6^n; regra 3/5 com alternativa; sem alternativa mantém topo; `motivo` preenchido; determinismo.
STOP: `filtrarCandidatos` continua antes da seleção.

#### WP-G — Few-shot por cliente
- `lib/pipeline/context.ts:33-67`: `metricasDosCandidatos` devolve `clienteId` (`canais(cliente_id)`); `match_count` 20→60; `fetchFewShot` remove `void clientId` e passa a `rankFewShot`.
- `lib/pipeline/few-shot.ts:63`: `rankFewShot(candidatos, criterio, clientId?)`: ≥3 do cliente → rankeia dentro deles e completa com globais; `origem` ganha `cliente|global`; trace `fewshot_escopo`.
- `tests/few-shot.test.ts`: 3 do cliente + 10 globais → 3 primeiros do cliente; 2 → fallback global.
STOP: se em >70% das gerações `match_documents(60)` trouxer <3 do cliente, registrar `fewshot_escopo:'global'` e não fingir.

### Onda 4

#### WP-H — Matriz estrutura × tema chega ao storytelling
- `lib/etl.ts`: bloco `estruturaTemaRows()` → `insight_type:"estrutura_tema_lift"`, payload `{temas:[{tema,n,estruturas:[{code,nome,n,lift,lift_lb}]}]}`, células n≥15 (global)/8 (cliente), top 3 por tema. Reusa `rankByLift` + `celulaEncolhida`.
- `lib/pipeline/agents.ts`: `estruturaTemaBlock(ctx)` em `proposeNarratives` (l.~609): "ESTRUTURAS COM MELHOR RESULTADO POR TEMA (lift medido, n)".
- `agents/storytelling.md`: "≥1 candidata usa estrutura com lift>1.2 no tema mais próximo; fugir exige justificativa". `agents/dados.md`: "`estrutura_tema_lift` é evidência primária".
- `scripts/propose-playbook-from-study.ts --slug storytelling|hook`: lê `lift.json`, anexa `## PARTE 2-B — O que os dados dizem (2026-09)` ao playbook ativo, insere `version+1, active:false`. Sem LLM. Promoção humana em `/ensinar` (`playbook-proposals.tsx` já é por slug) ou `scripts/promote-playbook.ts`.
STOP: nenhuma célula `lift_lb>1` n≥15 → não emite insight nem proposta; mantém PARTE 2 manual.

#### WP-I — Lições e consertos de 1 linha
- `lib/actions.ts:325` `setLearningActive`: `ativada_em: active ? now : null`. Liga `medirRecorrencia` (`etl.ts:338`).
- `lib/curator.ts`: extrair `proporLicoes({clientId, sourceTitle, transcript, licoes})` de `runMonthlyCurator` (l.121-142) — `vm_lessons(source_kind:'curador')` + `vm_lesson_learnings(active:false)` via `comDestinatarios`.
- `scripts/propose-lessons-from-study.ts`: por cliente com achado `lift_lb≥1.2, n≥8`, uma lição com **o número** na descrição ("Herói Improvável: 41% no top quartil vs 25%, n=102"), `active:false` → cai em `licoesPendentesDb` e o Kasparov oferece no fluxo (porta da 015). **Nunca `active:true` por script.**
- Fora: call site de `extractFromCluster` é Fase 3 do plano 019.

### Onda 5

#### WP-J — Medir se melhorou
- `lib/etl.ts:483-495`: `ratio` do flywheel = `fato_video.coeficiente_viral` do vídeo casado (lote), fallback no cálculo atual. `vm_outcomes.ratio` e `client_scriptresult` herdam; `maturityGate` intacto.
- Insight global `codex_vs_canal`: `{semanas:[{semana,n,coef_mediano,pct_acerto}], pre, pos, corte:'<data deploy WP-F>'}` — entra no Dados (globais já entram) e no Kasparov via `ctx.insights`.
- `scripts/study-lift.ts --codex` reemite só a seção Codex.

#### WP-K (condicional) — Alvos de comunicação por cliente
Só se WP-D mostrar ≥2 métricas com |δ|≥0.2, n≥30, replicadas em holdout. Então insight `client_comunicacao` + **uma** linha em `clientPrefsBlock` (`draft.ts:157`) com números ("frases de ~9 palavras; os fracos ~14"). Sem dado, não existe.

---

## Ordem de despacho

| Onda | WPs | Dono dos arquivos | Depois |
|---|---|---|---|
| 1 | A · B · C | A: 0040, `lib/script-matches.ts`, `scripts/backfill-matches.ts`, `lib/etl.ts`(+3), `kasparov-filas.ts`, `kasparov-chat.tsx`, `api/kasparov/route.ts` · B: `lib/text-metrics.ts`, `scripts/study-text-metrics.ts` · C: 0041, `lib/pipeline/taxonomia.ts`, `scripts/seed-…`, `scripts/classify-corpus.ts` | operador aplica 0040/0041; `backfill-matches --dry-run` → confere → roda; `seed`; `classify-corpus --dry-run` → aprova custo → roda; `study-text-metrics` |
| 2 | D · E | D: `lib/study-stats.ts`, `scripts/study-lift.ts`, `docs/estudo-2026-09/*` · E: 0042, `lib/learning-loop.ts`, `lib/etl.ts`(ranking), apaga `analyze-hooks.ts` | aplica 0042; `npm run etl`; **Igor lê `relatorio.md` e decide a Fase 3** |
| 3 | F · G | F: `hook-mechanisms.ts`, `agents.ts`, `index.ts`, `agents/hook.md` · G: `context.ts`, `few-shot.ts` | deploy; anotar data = corte da Fase 4 |
| 4 | H · I | H: `lib/etl.ts`(matriz), `agents.ts`, `agents/storytelling.md`, `agents/dados.md`, `scripts/propose-playbook-…` · I: `lib/actions.ts`(1 linha), `lib/curator.ts`, `scripts/propose-lessons-…` | Igor promove/rejeita em `/ensinar`; lições no Kasparov |
| 5 | J (K se houver dado) | `lib/etl.ts`(ratio+`codex_vs_canal`), `study-lift --codex` | semanal; ler em 8 semanas |

`lib/etl.ts` e `lib/pipeline/agents.ts` aparecem em ondas diferentes de propósito. Nunca dois WPs da mesma onda no mesmo arquivo.

## Reuso vs construção

**Reusar:** `oraculo.fato_video` / `playbook_class` / `playbook_categorias` · `ts_rank` validado · `syncScriptPerformance`, `resolveCorpusVideo`, `maturityGate` · filas do Kasparov (`proximaPendencia`/`responder`) · `wilsonLower` · `dividirFrases`/`contarFrases` · `toolInput/toolArray`, `runPool`, paginação de `analyze-hooks.ts` · `HOOK_MECHANISMS/HOOK_FORMATS` · `extractPlaybookSection` · `rankFewShot`/`match_documents` · `vm_playbooks(active:false)` + `playbook-proposals.tsx` + `promote-playbook.ts` · `runMonthlyCurator` · `comDestinatarios` · `vm_replace_insights` · `vm_edit_observations`.

**Não construir:** `pg_trgm`/fuzzystrmatch · casamento por embedding (`documents` é gemini, app é OpenAI — misturar é erro) · tabela de métricas de texto · tela de casamentos ou de estudo (destino não é visitado) · `match_documents_v2` · macro-tema por LLM antes de medir cardinalidade · reclassificar o que o Oráculo rotulou · escrever em `oraculo` · ativação automática de lição/playbook · pesos de lição · alvos de comunicação sem separação medida · Batches API por US$10 · `extractFromCluster` (019).

## Riscos e tratamento

| Risco | Tratamento |
|---|---|
| n pequeno (Codex casado 20–45; células) | `lift_lb`, n mínimos explícitos, tudo abaixo é "hipótese", nunca insight de prompt; Codex casado só descrição |
| confusão por canal/plataforma | `coeficiente_viral` (mediana do mesmo canal e origem) + top quartil dentro do estrato |
| duplicata multi-plataforma | dedup `md5(roteiro)`; `fato_video` já exclui gêmeo FB |
| maturação | `maturando=false` (7d) no corpus; `maturityGate` 14d nos outcomes |
| sobrevivência (Igor escolhe o que publica) | "dos publicados"; controle = humanos VM (também sobreviventes); taxa de publicação é métrica |
| ruído de rótulo (52% concordância) | concordância no relatório; hook por cliente só n≥40; estrutura/tema pesam mais |
| priming do classificador | definições neutras; STOP se Contraste Extremo >45% |
| comparações múltiplas | célula só com `lift_lb>1`; tudo é proposta `active:false`; só a Fase 4 vira regra |
| Simpson | reportar global e cliente; cliente tem precedência (já é a regra) |

## Verificação e parada

- **Após onda 1:** `vm_script_performance` ≥20; pendências no Kasparov; `vm_video_classifications` com estruturas ≥3.000; JSON de métricas gerado.
- **Após onda 2:** `relatorio.md` responde com n e intervalo o que tem `lift_lb>1`; quais clientes têm briefing; se alguma métrica de texto separa. "Nada separa" → Fase 3 encolhe para anti-colapso + few-shot por cliente + lições por cliente.
- **Processo (4 semanas após onda 3):** mecanismo mais usado nos últimos 30 roteiros <50% (hoje 93%); ≥5 estruturas distintas nos últimos 30; `fewshot_escopo='cliente'` em >50%. Share >70% → penalidade não vinculou; olhar `hook_recentes` antes de mexer em prompt.
- **Resultado:** mediana de `coeficiente_viral` pós vs pré, `%acerto` (≥1.5), em **60 roteiros maduros ou 16 semanas**. Sucesso = pós ≥1.15× pré e acerto não cai. Sem efeito com n≥30–60: a alavanca não é seleção de hook/estrutura — manter instrumento e diversidade, parar heurística de seleção, próxima rodada em tema/premissa ou edição humana (019). Não se ajusta limiar até "dar certo".
- **Parada da Fase 1:** rotulado `vm_script='sim'` + extremos e nenhuma célula fecha → não gastar o resto.
