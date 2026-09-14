# Plano 021: Plano de evolução do Codex (auditoria 2026-09-13)

Auditoria READ-ONLY do repositório e do banco (projeto Viral Data, `qclvrddrqulgfzccndnl`),
baseline commit `0d18fd0`. Nenhum arquivo de código foi tocado. Todo número deste documento veio
de `SELECT` no banco, de `gh run` ou de leitura de arquivo com linha citada.

Régua usada em tudo: o Codex existe para produzir roteiro curto com alto potencial de
viralização, decidindo por DADO e melhorando por CICLO (roteiro publicado, performance real,
insight, próximo roteiro melhor). O que não serve a isso é suspeito.

---

## 1. Diagnóstico em 10 linhas

1. A sala de agentes escreve bem e o pipeline é sólido, mas a **fase de revisão nunca produziu
   uma linha**: 181 de 181 chamadas bateram no teto de `max_tokens`, e o roteiro salvo é o
   montado, não o revisado, em 186 de 187 casos.
2. Isso custa 32% dos tokens de saída de cada geração e 82 segundos dos 314 que o usuário espera.
3. O flywheel de performance existe e funciona, mas roda vazio: 16 de 187 roteiros publicados,
   15 com métrica, 10 maduros, 6 com previsto E real. A calibração do agente Dados roda com n=6.
4. O flywheel de ENSINO está pior: 126 aprendizados extraídos por LLM, **1 ativo**. A máquina
   propõe e ninguém ativa, porque a maior fonte (98 de correção) nem aparece na tela que pede
   ativação.
5. Todas as decisões humanas pendentes (ativar lição, confirmar casamento, escolher critério do
   few-shot, votar calibração) foram enfileiradas atrás de UMA porta, o Kasparov, que está morto
   desde 2026-08-18 com 3 conversas e 10 mensagens.
6. O cron do ETL existe e funciona desde 2026-08-17 (GitHub Actions, não `vercel.json`), mas
   **falhou em 2026-09-07** com `curl (28)` e ninguém viu por 7 dias. Não há retry.
7. Existem duas réguas de performance no mesmo sistema: `coeficiente_viral` do Oráculo (views
   sobre a mediana móvel 180d do próprio canal, honesta) alimenta o lift de hook e estrutura;
   os 410 insights `client_*` que os agentes mais leem usam mediana de views do cliente,
   com um multiplicador por views absolutos e um decaimento por idade.
8. O erro que o usuário identificou no comando se confirma com número: `mediana_seguidores`
   absoluta correlaciona 0,80 com views, enquanto seguidores por mil views correlaciona 0,13.
   O ranking de comando de hoje mede alcance, não conversão.
9. Metade do corpus é invisível ao few-shot: 11.805 vídeos têm roteiro, 6.204 estão em
   `documents`. Os 5.601 restantes nunca podem ser exemplo.
10. Nada disso pede reescrita. Pede consertar uma chamada, mudar duas fórmulas de SQL, rodar um
    backfill de US$ 0,06 e tirar três decisões humanas de dentro de um chat que ninguém abre.

---

## 2. Achados

Formato: título, arquivo e linha, evidência, impacto no objetivo central, esforço (P/M/G).

### 2.1 Flywheel e aprendizado

#### F1. A revisão nunca rodou. Nenhuma vez, desde 2026-07-06. (G de impacto, P de esforço)

**Onde**: `lib/pipeline/critique.ts:19` (`max_tokens: 8000`), `critique.ts:48`
(`return { revised: /##\s*ROTEIRO/i.test(revised) ? revised : draft, critica }`),
chamada em `lib/pipeline/index.ts:412`.

**Evidência (banco)**:

```sql
-- 181 de 181 chamadas terminaram exatamente no teto
select count(*) n,
       count(*) filter (where (pipeline_trace->'usage'->'revisao'->>'output_tokens')::int >= 7900) no_teto
from vm_generated_scripts where pipeline_trace->'usage' ? 'revisao';
-- n=181, no_teto=181, média=8000, máximo=8000

-- o texto salvo é o montado, não o revisado
select count(*) filter (where pipeline_trace->>'revised' = pipeline_trace->>'assembled') from vm_generated_scripts;
-- 186 de 187

-- e a crítica por chapéu, que seria parts[0] do split, está vazia
select count(*) filter (where coalesce(length(pipeline_trace->'proveniencia'->>'critica'),0)=0)
from vm_generated_scripts where pipeline_trace ? 'proveniencia';
-- 140 de 140
```

Por semana, sem uma única exceção desde a primeira geração:

| semana | roteiros | output médio da revisão | revised == assembled |
|---|---|---|---|
| 2026-07-06 | 7 | 8000 | 7 |
| 2026-08-17 | 33 | 8000 | 33 |
| 2026-08-24 | 41 | 8000 | 41 |
| 2026-08-31 | 34 | 8000 | 34 |
| 2026-09-07 | 29 | 8000 | 29 |

**Leitura**: `ANALYST_MODEL` é `claude-sonnet-5`, que pensa por padrão, e `trackedCreate` não
recebe `effort` nesta chamada, então o esforço fica em `high`. O thinking consome os 8000 tokens
antes de emitir qualquer bloco de texto. `critica` vazia prova que **não houve bloco de texto
nenhum**, não que o marcador `=====ROTEIRO_REVISADO=====` faltou. O próprio `AGENTS.md §5` diz
"`max_tokens` das chamadas com thinking deve ser ≥ 4000, o thinking consome do mesmo teto"; 8000
não cobre thinking mais a reescrita inteira de um documento de 4,3 KB.

**Impacto**: a revisão é a fase mais cara em saída (1.448.000 tokens de output acumulados, 32% do
total) e a mais lenta (82 s por geração, 14.929 s acumulados, 4h09). O checklist eliminatório
(`vm_playbooks.checklist` v3, 7.443 caracteres) é enviado toda geração e nunca aplicado. O
`buildReviewDynamicBlock` monta CHECAGEM, sinais de eco, ritmo, superlativo e lições de revisão
que nenhum modelo lê até o fim. E a instrução do roteirista em `draft.ts:496`, "fora disso o
roteiro é eliminado na revisão", é um blefe: não existe eliminação.

**Esforço**: P.

#### F2. 125 de 126 aprendizados nunca foram ativados, e a tela esconde a maior fonte (M/P)

**Onde**: `app/ensinar/page.tsx:39` (`const derived = (allLessons ?? []).filter((l) => l.source_kind === "edicao" || l.source_kind === "curador")`).

**Evidência**:

```sql
select l.source_kind, count(distinct l.id) licoes, count(ll.id) aprendizados,
       count(ll.id) filter (where ll.active) ativos
from vm_lessons l left join vm_lesson_learnings ll on ll.lesson_id=l.id group by 1;
```

| source_kind | lições | aprendizados | ativos |
|---|---|---|---|
| correcao | 27 | 98 | **0** |
| edicao | 3 | 22 | 0 |
| curador | 4 | 5 | 0 |
| sessao | 1 | 1 | 1 |

O filtro da linha 39 só manda `edicao` e `curador` para a seção "O QUE A SALA APRENDEU COM VOCÊ",
que é a única com contador de pendências e chamada "Revise e ative". Os 98 aprendizados de
`correcao` (a maior fonte, produzida por `extractFromCorrection` a cada geração com feedback e por
`extractFromNotes` no encerramento) caem na lista comum, misturados com os virais ensinados à mão,
sem contador e sem convite.

**Impacto**: três caminhos de extração supervisionada (`lib/pipeline/teach.ts:186` correção,
`teach.ts:242` notas, `lib/curator.ts` curador mensal) rodam chamadas de sonnet com
`max_tokens: 8000` e entregam ao prompt exatamente **um** aprendizado. O `taughtBlock`, o
roteamento por destinatário, o teto por agente, o `licoes_excedidas` no trace: toda essa máquina
opera sobre uma lição.

**Esforço**: P para o filtro, M para a mudança de fluxo (ver Onda 1).

#### F3. Cinco filas de decisão humana atrás de uma porta morta (G/M)

**Onde**: `lib/pipeline/kasparov-filas.ts:230` (`proximaPendencia`), consumida só por
`app/api/kasparov/route.ts` e `components/kasparov-chat.tsx`.

**Evidência**:

```sql
select t.assunto, t.created_at, count(m.id) msgs from vm_kasparov_threads t
left join vm_kasparov_messages m on m.thread_id=t.id group by 1,2 order by 2;
-- 3 threads, 10 mensagens, a última em 2026-08-18 19:31
```

As cinco filas que só existem ali: `calibracao`, `licao`, `metrica`, `casamento`, `criterio`.
O próprio arquivo admite o problema em `kasparov-filas.ts:6`: "o A/B não é pouco usado porque é
ruim, é pouco usado porque é um destino, e destino não é visitado". A conclusão foi certa e o
remédio foi errado: as filas foram movidas para OUTRO destino.

**Impacto**: nenhuma decisão humana entra no sistema. Direto: F2 (lições), F4 (calibração),
F5 (critério do few-shot), e os casamentos em zona cinza.

**Esforço**: M.

#### F4. Calibração: 252 pares colhidos, 6 votos, zero insight emitido (P para cortar)

**Evidência**: `vm_calibration_pairs` 252 linhas, `vm_calibration_votes` 6.
`lib/calibration.ts:aggregatePreferences` usa `minN = 8`, então nenhum eixo passa.
`select count(*) from vm_viral_insights where insight_type='pref_hook'` devolve **0**.
`lib/pipeline/agents.ts:hookPreferenceBlock` portanto sempre devolve string vazia.

Além disso o harvest roda em toda geração (`lib/pipeline/index.ts:551`) e o `runProbeTopup(6)`
roda em todo cron (`app/api/cron/weekly-etl/route.ts:34`), gerando pares por LLM
(`lib/calibration-probe.ts:20` e `:85`) que ninguém vota.

**Esforço**: P.

#### F5. A decisão views × taxa de compartilhamento nunca foi tomada, e "views" venceu por omissão (M)

**Evidência**: `vm_fewshot_criterio` tem **0 linhas**. `lib/pipeline/context.ts:77-84`
(`criterioFewShot`) devolve `CRITERIO_PADRAO` = `"views"` quando a tabela está vazia.
`lib/pipeline/few-shot.ts:9` fixa esse padrão. A comparação existe pronta
(`resumirComparacao`, `few-shot.ts:300`) e só é oferecida dentro do Kasparov morto.

**Impacto**: o roteirista imita 5 exemplos ordenados por **views absolutos** do corpus inteiro, e
os 2 primeiros viram a referência de voz do humanizador (`lib/pipeline/humanize.ts:93`). Views
absolutos premiam canal grande, não roteiro bom: é exatamente a métrica de circunstância que a
casa rejeitou. E a saída oferecida (taxa de compartilhamento) tem cobertura de dado ruim,
YouTube inteiro sem coleta. Nenhuma das duas é a régua certa (ver D6).

**Esforço**: M.

#### F6. O ETL roda, mas falhou em 2026-09-07 e ninguém viu por sete dias (P)

**Não verificado na premissa recebida, e refutado**: não existe `vercel.json` no repositório.
O cron vive em `.github/workflows/etl-semanal.yml`, criado em 2026-08-17, e ele funciona.

**Evidência** (`gh run list --workflow=etl-semanal.yml`):

| data | gatilho | resultado |
|---|---|---|
| 2026-08-18 00:33 / 00:38 | workflow_dispatch | success |
| 2026-08-24 09:45 | schedule | success |
| 2026-08-31 16:43 | schedule | success |
| 2026-09-07 14:48 | schedule | **failure** |

Log do run 34134964791:
`curl: (28) Failed to connect to codex.viralmindlabs.com port 443 after 135989 ms`.

E o banco confirma: `vm_insight_runs` tem 8 linhas, nenhuma em 2026-09-07. O último run real foi
2026-09-06 18:30 (manual, cinco runs seguidos naquela tarde). Todos os 651 insights de
`vm_viral_insights` carregam `computed_at = 2026-09-06 18:30:36.7773+00`, um batch único, porque
`vm_replace_insights` troca a tabela inteira.

**Impacto**: um blip de rede do host derruba uma semana de flywheel. Não há retry no workflow,
não há segunda tentativa no mesmo dia, e o único alerta é o e-mail do GitHub.

**Esforço**: P.

#### F7. O ciclo fecha, mas com amostra que não decide nada (G/M)

Caminho ponta a ponta, verificado:

| etapa | onde | estado |
|---|---|---|
| roteiro gerado | `lib/pipeline/index.ts:463` insere `vm_generated_scripts` com `pipeline_trace.predicted_score` e `fingerprint` | 187 linhas |
| publicação manual | `lib/actions.ts:370` `markPublished` | 16 com `published_url` |
| casamento por texto | `lib/script-matches.ts:casarRoteiros`, RPC `vm_match_scripts`, 5-gramas | 36 matches, 14 roteiros distintos, todos já publicados |
| performance real | `lib/script-performance.ts:syncScriptPerformance` | 15 linhas em `vm_script_performance` |
| maturação | `lib/etl.ts:672` `maturityGate` | 10 linhas em `vm_outcomes` |
| previsto × real | `lib/learning-loop.ts:computeCalibration` | **6** outcomes com os dois campos |
| volta ao prompt | `agents.ts:formatInsightsForDados`, insight `calibracao_dados` | 15 `client_scriptresult`, 1 `calibracao_dados` |

**O elo mais fino é a publicação**: 16 de 187 (8,5%). O casamento automático por 5-gramas
(WP-A do plano 020) achou 14, todos já marcados. Ou seja, o casamento não está ampliando a
amostra, está confirmando o que já se sabia.

Enquanto isso, a MV `oraculo.fato_video` tem **5.510 vídeos com `vm_script='sim'`** e
`coeficiente_viral` calculado, 5.303 já maduros. O sinal de "roteiro escrito performa assim"
existe em volume 350 vezes maior do que o flywheel do Codex usa.

**Esforço**: M.

#### F8. Lição não guarda autor (P)

`vm_lessons` não tem `user_id` (confirmado em `information_schema`), e `lib/actions.ts:286`
(`saveLesson`) e `lib/pipeline/index.ts:583` inserem sem ele. `vm_calibration_votes` tem
`user_id`, `vm_fewshot_criterio` tem `decidido_por`, `vm_lessons` não. Atribuir depois exige
correlacionar por roteiro regenerado do mesmo cliente na mesma janela.

**Esforço**: P (uma coluna e dois call sites).

#### F9. 47% do corpus é invisível ao few-shot (G de impacto, P de esforço)

**Evidência**:

```sql
select count(*) videos_com_roteiro,
       count(*) filter (where id in (select video_id from documents where video_id is not null)) ja_em_documents
from videos where roteiro is not null and length(roteiro) > 200;
-- 11.805 / 6.204
```

`documents` tem 6.536 linhas, todas com embedding. Faltam **5.601 roteiros**. O
`match_documents` (`lib/pipeline/context.ts:63`) busca 60 candidatos por similaridade dentro
desses 6.204. O script já existe e é resumível: `scripts/backfill-embeddings.ts`. A pendência
está registrada no `README.md` e nunca foi executada. Custo estimado no próprio README: US$ 0,06.

**Esforço**: P.

### 2.2 Decisões por dados versus opinião

Mapa por etapa de `lib/pipeline/index.ts`:

| etapa | o que decide | quem decide | régua |
|---|---|---|---|
| premissa | a tese | LLM (`derivePremissa`) ou usuário | nenhuma |
| pesquisa | fatos do dossiê | Grok | hierarquia de fontes (`fontes-autoritativas.json`), determinística |
| narrativas | 2-3 arquiteturas | LLM (storytelling) | playbook + insights, sem número |
| ranking | `score` 0-100 e `servico_a_premissa` | **LLM (Dados)** | opinião do modelo, com insights no contexto |
| vencedora | qual candidata | **código** (`index.ts:332`) | `servico_a_premissa >= 50` e depois maior `score` |
| roteiro | o texto | LLM (fable) | few-shot por views |
| hook | qual dos 5-6 candidatos | **código** (`selectHook`) | `lift_lb` do mecanismo × 0,6^usos |
| comando | o texto | LLM (sonnet, effort low) | `client_comando` por seguidores absolutos |
| revisão | correções | LLM | **nada, a fase é inerte (F1)** |
| humanização | textura | LLM + `slop-lint` determinístico | `vm_banned_phrases`, funciona (5 violações em 187) |
| verificação | veredicto por alegação | LLM + `delta.ts` determinístico | tiers de fonte |

Duas etapas decidem por dado de verdade (hook e vencedora). Uma decide por dado ruim (comando).
Uma decide por opinião com número inventado (ranking). O resto é prompt.

#### D1. `vm_client_insights` multiplica o score por views ABSOLUTOS do grupo (M)

**Onde**: RPC `public.vm_client_insights`, bloco `rg.regua`:

```sql
select case
  when g.categoria = 'comando' then 1.0
  when g.mediana_views >= 1000000 then 1.3
  when g.mediana_views >= 50000  then 1.0
  else 0.6
end as regua
```

Uma estrutura que rendeu 3x a mediana de um canal pequeno leva 40% de desconto no score porque o
canal é pequeno. Isso é medir a circunstância (tamanho da audiência), exatamente o que a
modelagem da casa rejeita. Afeta os 130 `client_tema`, 109 `client_storytelling` e 104
`client_hook` que chegam ao storytelling e ao hook a cada geração.

#### D2. O mesmo RPC decai por idade (M)

`rec.peso = greatest(0.3, exp(-coalesce(g.recencia_dias, 365) / 260.0))`. Um padrão usado há 18
meses vale 30% de um usado ontem, independentemente de ter funcionado melhor. Contradiz
"perenidade acima de idade". A recência já é informada em texto na descrição
(`lib/etl.ts:descricaoDe`, "último uso há N dias"); multiplicar o score por ela é cobrar duas
vezes.

#### D3. Comando medido por seguidores ABSOLUTOS mede alcance, não conversão (G/M)

**Onde**: mesmo RPC, `perf.ratio` para comando:

```sql
when g.categoria = 'comando'
  then case when g.mediana_seguidores is not null and b.mediana_seg_cliente > 0
            then g.mediana_seguidores / b.mediana_seg_cliente end
```

E `lib/etl.ts:descricaoDe` escreve "+N seguidores por vídeo (Nx a conversão média do cliente)",
chamando de conversão o que é contagem.

**Evidência numérica**, sobre 1.655 vídeos da MV com seguidores e views:

```sql
select corr(seguidores_ganhos::numeric, views_total::numeric) corr_abs,
       corr(seguidores_ganhos::numeric / nullif(views_total,0) * 1000, views_total::numeric) corr_taxa
from oraculo.fato_video where seguidores_ganhos is not null and views_total > 0;
-- corr_abs = 0.804 ; corr_taxa = 0.127 ; n = 1655
```

Seguidores absolutos são praticamente um proxy de views (r = 0,80). Seguidores por mil views são
quase independentes de views (r = 0,13). O ranking de comando de hoje ordena por alcance. A régua
honesta, como o usuário identificou, é seguidores por mil views comparada contra a mediana do
próprio canal, e o dado para isso já está pronto na MV (`seguidores_ganhos`, `views_total`,
`canal_median_views`, e `taxa_nao_seguidores` em 1.703 vídeos).

Esse mesmo raciocínio vale para qualquer dimensão que fica no fim do vídeo. `retencao_final`
já é usada como fator do comando no RPC (`ret.fator`), o que está certo, mas o `perf.ratio`
domina e desfaz o ganho.

#### D4. Duas réguas de performance no mesmo ETL (M)

`lib/etl.ts:266-290` (`liftRankingRows`) usa `oraculo.fato_video.coeficiente_viral`, que é views
sobre a mediana móvel 180 dias do MESMO canal e origem, e estratifica por cliente × plataforma
antes de tirar o quartil. É a régua correta e está documentada no próprio arquivo:
"mede o vídeo, não a circunstância".

`lib/etl.ts:clientInsightRows` chama `vm_client_insights`, que usa mediana de views do cliente
inteiro, sem janela e sem estrato. É a régua errada.

Resultado: 22 `estrutura_lift` e 27 `hook_mechanism_ranking` bem medidos convivem com 410
`client_*` mal medidos, e os `client_*` entram em mais prompts.

#### D5. Insight declarado com n ≥ 2 e sem intervalo de confiança (M)

`vm_client_insights` termina com `where g.amostra >= 2`. Distribuição real dos 410
`client_*` com campo `amostra`:

| amostra | insights |
|---|---|
| 2 | 54 |
| 3 a 4 | 98 |
| 5 a 9 | 83 |
| 10+ | 175 |

152 de 410 (37%) vêm de 4 vídeos ou menos, e chegam ao agente Dados com o rótulo "dados reais,
pré-rankeados por performance+recência, evidência forte ao escolher estruturas"
(`lib/pipeline/agents.ts:601`). O lift usa Wilson (`lib/calibration.ts:wilsonLower`); o
`client_*` não usa nada.

#### D6. Few-shot ordenado por views absolutos do corpus inteiro (M)

`lib/pipeline/few-shot.ts:114` (`ordenar`) e `:139` (`rankFewShot`). A única alternativa
implementada é `taxa_compartilhamento`, e ela está travada atrás de F5. Nenhuma das duas usa
`coeficiente_viral`, que já está disponível por `video_id` na MV e é a régua que a casa aprovou.
Consequência prática: o roteirista imita os roteiros dos maiores canais, e o humanizador copia a
voz dos dois maiores.

#### D7. O anti-colapso funcionou, e já está criando o próximo monopólio (P)

```sql
select pipeline_trace->>'hook_mecanismo' mec,
 count(*) filter (where created_at < '2026-09-06') antes,
 count(*) filter (where created_at >= '2026-09-06') depois
from vm_generated_scripts where pipeline_trace ? 'hook_mecanismo' group by 1;
```

| mecanismo | antes de 06/09 | depois |
|---|---|---|
| Contraste Extremo | 134 | 2 |
| Conflito Declarado | 1 | **15** |
| Urgência | 0 | 5 |
| Elemento Controverso | 0 | 3 |
| Revelação Secreta | 9 | 2 |
| outros 3 | 0 | 3 |

De 93% para 7% em Contraste Extremo: o WP-F entregou. Mas Conflito Declarado já é 50% das 30
gerações seguintes, e o ranking global explica por quê: é o único mecanismo com `lift_lb` acima
de 1,06.

```
Conflito Declarado   n=348  lift 1.32  lift_lb 1.13
Urgência             n=318  lift 1.26  lift_lb 1.06
Contraste Extremo    n=2156 lift 1.07  lift_lb 1.00
Elemento Controverso n=243  lift 1.22  lift_lb 1.00
Apelo à Autoridade   n=175  lift 1.21  lift_lb 0.96
Ultra Especificidade n=993  lift 1.05  lift_lb 0.95
```

Com `base(m)` variando de 0,95 a 1,13 e penalidade `0,6^usos` sobre uma janela de 5, o vencedor
bruto retoma a liderança a cada 2 gerações. A honestidade a registrar: **o dado não separa os
mecanismos**. Um IC inferior de 1,13 sobre uma base de 0,25 é uma vantagem de 13%, e cinco dos
seis mecanismos têm IC cruzando 1.

#### D8. A vencedora é escolhida por um número que o LLM inventa (M)

`lib/pipeline/index.ts:322-338`: filtra por `servico_a_premissa >= SERVICO_PREMISSA_MIN` (50) e
ordena por `score`. Os dois campos vêm do `RANKING_TOOL` preenchido pelo próprio sonnet
(`agents.ts:705-730`). O comentário em `index.ts:31` já é honesto: "número redondo escolhido a
dedo". O `predicted_score` guardado no trace é esse mesmo número, e é ele que a calibração
previsto × real avalia, com n=6.

Existe dado para substituir: `estrutura_lift` (22 insights, lift por estrutura) e
`estrutura_tema_lift` (7 insights, matriz estrutura × tema) já chegam ao storytelling
(`agents.ts:estruturaTemaBlock`), mas nenhum dos dois entra na ESCOLHA. A estrutura da candidata
vem em `n.estrutura` no formato "A1. Jornada do Herói"; casar com o `code` do ranking é uma
linha.

### 2.3 Correções

#### C1. `derivePremissa` vaza a serialização da tool dentro do campo `premissa` (M/P)

**Onde**: `lib/pipeline/premissa.ts:160-166`, guarda em `premissa.ts:46` (`VAZAMENTO_DE_TOOL`),
aborto em `lib/pipeline/index.ts:245`.

**Evidência**: 5 sessões mortas com a mensagem "A premissa desta sessão não é uma tese". As teses
são boas. O campo salvo tem 1.328, 1.262 e 1.439 caracteres, e termina assim:

```
...cap rate acima de 10% comparado ao custo de oportunidade da Selic a 14%,
mostrando que o prêmio de risco ainda compensa"]</o_que_provaria>
</invoke>
```

A guarda está certa e pegou o problema. O que está errado é a reação: a geração inteira é
abortada e o usuário precisa digitar a premissa à mão, quando a tese correta está nos primeiros
200 caracteres do campo. Corte no primeiro marcador de vazamento e reteste resolve 5 de 29 erros.

#### C2. Fail-soft que esconde falha (G)

Três casos, por gravidade:

1. `lib/pipeline/critique.ts:48`: fallback silencioso para o draft. Sem log, sem campo no trace,
   sem sinal na tela. É o que manteve F1 invisível por dois meses. O `pipeline_trace` guarda
   `revised` e `assembled` lado a lado desde sempre: o dado para detectar estava lá.
2. `lib/pipeline/humanize.ts:126`: `if (/##\s*ROTEIRO/i.test(next)) current = next;` sem `else`.
   Aqui está saudável hoje (0 de 187 perdidas, 29 chamadas bateram no teto de 8000 e ainda assim
   emitiram texto), mas é o mesmo padrão.
3. `lib/pipeline/index.ts:566`: a verificação roda depois do `done` dentro de try/catch com
   `console.error`. 52 de 187 roteiros estão sem `verificacao` e a tela diz "não verificado",
   que é honesto. Aceitável.

Regra a instituir: fase que produz artefato e cai no fallback **grava o motivo no
`pipeline_trace`**. Custo zero de LLM, e teria matado F1 na primeira geração.

#### C3. Limite de 120 s da transcrição corta vídeos dentro do alvo do próprio produto (P)

3 sessões mortas com "Video is too long for AI transcription (136s / 150s / 155s). Maximum is 120
seconds". O `draft.ts:496` define o alvo do roteiro como "60 a 180 segundos de fala". Modelar um
vídeo de 150 s é caso de uso central e é impossível hoje.

#### C4. Crédito de terceiros derruba a geração depois da espera (P)

8 de 29 erros: ScrapeCreators 402 (5), Supadata sem crédito (2), ScrapeCreators sem saldo (1).
Mais 4 com "Your credit balance is too low" da Anthropic. Total: 12 de 29 erros (41%) são saldo
externo, descobertos depois que o usuário já esperou.

#### C5. 29 de 186 sessões em erro (15,6%) (M)

```sql
select status, count(*) from vm_sessions group by 1;
-- done 130 | error 29 | closed 20 | aguardando_premissa 7
```

Composição: 11 transcrição/carrossel, 5 vazamento de premissa (C1), 4 crédito Anthropic,
2 autópsia incompleta, 1 storytelling vazio, 1 `Cannot read properties of undefined (reading 'map')`
(2026-07-08, provavelmente já corrigido), 5 outros.

#### C6. `vm_insight_runs` guarda o array inteiro de insights por run (P)

`lib/etl.ts:866`: `appDb.from("vm_insight_runs").insert({ rows })`. Cada linha carrega os 651
insights completos. Um `select *` da tabela de 8 linhas devolveu **2.979.483 caracteres**. Com
retenção de 12 runs, a tabela tende a ~4,5 MB de JSON que ninguém lê (nenhum `select` no
repositório lê `vm_insight_runs.rows`; `context.ts:155` lê só o `id` do run mais recente).

#### C7. Onze chamadas de LLM fora da telemetria (M)

`lib/anthropic.ts` oferece `trackedCreate`/`trackedStream`, e 13 fases são medidas. Estas não:

| arquivo:linha | agente |
|---|---|
| `lib/pipeline/teach.ts:68` | Professor (correção, notas, cluster) |
| `lib/pipeline/bob.ts:85` | Bob, edição inline |
| `lib/pipeline/suggest.ts:234` e `:213` | Ideador (sonnet + Grok) |
| `lib/pipeline/classify-teaching.ts:73` | classificador de ensino |
| `lib/pipeline/rewrite-fragment.ts:15` | reescrita de trecho |
| `lib/pipeline/grok-search.ts:33` | busca da verificação |
| `lib/etl.ts:101` | boas práticas por cliente (26 por run) |
| `lib/curator.ts:107` e `:240` | curador mensal e de playbook |
| `lib/calibration-probe.ts:20` e `:85` | geração de pares de calibração |
| `lib/modelagens/queries.ts:267`, `lib/modelagens/cacar.ts:148` | caça de modelagens |

**Importante para medir custo**: `api_usage` (51.456 linhas) **não serve** para o Codex. O
agrupamento por provider devolve só `scrapecreators` (33.544 chamadas, US$ 63,06) e `gemini`
(transcrição, dissecação, categorização, embedding). Zero linhas da Anthropic, zero do xAI. Essa
tabela é do coletor, o outro app que divide o Supabase. A única telemetria de custo do Codex é
`vm_generated_scripts.pipeline_trace.usage`, e ela cobre 13 das 24 portas de LLM.

### 2.4 Eficiência e desperdício

Custo medido por roteiro, últimos 140 (desde 2026-08-15), somando todas as fases do trace:

```sql
with u as (select id, jsonb_each(pipeline_trace->'usage') kv from vm_generated_scripts where created_at > '2026-08-15')
select count(distinct id), round(sum((((kv).value)->>'input_tokens')::numeric)/count(distinct id)),
       round(sum((((kv).value)->>'output_tokens')::numeric)/count(distinct id)),
       round(sum((((kv).value)->>'cache_creation_input_tokens')::numeric)/count(distinct id)),
       round(sum((((kv).value)->>'ms')::numeric)/1000/count(distinct id)) from u;
```

**85.092 input, 25.155 output, 27.237 de escrita de cache, 314 segundos por roteiro.**

Por fase (acumulado do histórico inteiro):

| fase | modelo | chamadas | input | output | cache read | cache write | s/chamada |
|---|---|---|---|---|---|---|---|
| narrativas | sonnet | 124 | 3.548.315 | 391.711 | 0 | 0 | 40 |
| roteiro | fable | 181 | 2.361.808 | 680.698 | 92.238 | 1.210.583 | 49 |
| **revisão** | sonnet | 181 | 1.977.099 | **1.448.000** | 99.771 | 1.203.050 | **82** |
| humanização | fable | 181 | 1.890.587 | 931.459 | 1.906.127 | 1.188.163 | 64 |
| verificacao_classificacao | sonnet | 113 | 1.644.939 | 305.065 | 0 | 0 | 23 |
| ranking | sonnet | 124 | 1.094.914 | 226.842 | 0 | 0 | 25 |
| hook | fable | 181 | 991.271 | 198.046 | 93.898 | 1.128.909 | 18 |
| verificacao_alegacoes | sonnet | 113 | 394.991 | 56.236 | 0 | 0 | 5 |
| comando | sonnet | 181 | 370.194 | 12.360 | 0 | 0 | 3 |
| premissa | sonnet | 25 | 80.219 | 12.855 | 0 | 0 | 8 |
| modelagem | sonnet | 8 | 79.666 | 21.943 | 0 | 0 | 47 |
| pesquisa | grok-4.3 | 142 | (não expõe) | | | | 24 |

#### E1. A revisão é 32% da saída e 26% do relógio, e a saída é jogada fora (G/P)

Ver F1. 1.448.000 tokens de saída de sonnet, 4h09 acumuladas. Consertar ou cortar devolve 82
segundos por geração ao usuário.

#### E2. `cache_control` em revisão e hook custa mais do que economiza (P)

Escrita de cache custa 1,25x e leitura 0,1x, então o cache só paga quando as leituras passam de
~28% das escritas.

| fase | cache write | cache read | leitura/escrita | veredicto |
|---|---|---|---|---|
| humanização | 1.188.163 | 1.906.127 | 160% | paga, e bem |
| roteiro | 1.210.583 | 92.238 | 7,6% | escreve para a humanização ler, ok no par |
| **revisão** | 1.203.050 | 99.771 | **8,3%** | **prejuízo** |
| **hook** | 1.128.909 | 93.898 | **8,3%** | **prejuízo** |

A revisão usa sonnet, o roteiro e a humanização usam fable: são caches separados, então o
`buildStaticSystemBlock` escrito pela revisão nunca é lido por ninguém dentro da mesma geração.
O hook tem prefixo próprio (as tools entram antes do system). Nos dois casos o `cache_control`
está pagando 25% de prêmio sobre ~6,6k tokens por geração para economizar quase nada.

`lib/pipeline/critique.ts:23` e `lib/pipeline/agents.ts:901`.

#### E3. `narrativas` é a maior conta de input do sistema, 28.616 tokens por chamada (M)

3.548.315 input em 124 chamadas. O `system` carrega `agents/storytelling.md` mais
`vm_playbooks.storytelling` v1, que tem **50.133 caracteres** (~12,5k tokens), sem cache, por
decisão explícita em `agents.ts:641`. A decisão é defensável para uma chamada por sessão, mas
50k caracteres de playbook para propor 2 a 3 candidatas é a maior alavanca de input do pipeline.
O `estruturaTemaBlock` e o `estrutura_lift` já dizem, com número, quais estruturas funcionam por
tema: dá para mandar as seções do playbook das estruturas candidatas em vez do playbook inteiro
(a função `extractPlaybookSection` já existe em `draft.ts:93` e faz exatamente isso para o
roteirista).

#### E4. O playbook de comando viaja três vezes por geração, duas delas para quem não escreve CTA (P)

`buildStaticSystemBlock` (`draft.ts:80`) inclui `# PLAYBOOK DE COMANDO/CTA` (9.379 caracteres) e
é usado por `generateDraft`, `critiqueAndRewrite`, `humanize` e `bob`. O roteirista tem ordem
explícita de não escrever o CTA (`README.md`, item 4) e o humanizador só retextura.
`writeComando` (`agents.ts:1003`) manda o mesmo playbook de novo no seu próprio system.

#### E5. O checklist é enviado para uma fase que não existe (P)

`critique.ts:30` manda `ctx.playbooks.checklist` (7.443 caracteres, v3 ativa) no turno do
usuário. É o único consumidor do slug `checklist` no repositório inteiro. Enquanto F1 não for
resolvido, são ~1,9k tokens por geração para nada.

#### E6. Código e dado sem uso

- `lib/calibration-probe.ts` (147 linhas): 2 chamadas de LLM por cron para alimentar uma fila com
  6 votos em 252 pares.
- `lib/bullets.ts` + `components/bullets-board.tsx` + `app/bullets/page.tsx` + migration 0033:
  ver 3.2.
- `hookPreferenceBlock` (`agents.ts:625`): sempre devolve "" (F4).
- `bulletsBlock` (`agents.ts:646`): sempre devolve "" (3.2).
- `share` no payload de `hook_mechanism_ranking` (`etl.ts:301`): o próprio comentário diz "sai
  quando o WP-F passar a ler lift_lb". O WP-F já passou; `share` continua sendo gravado e
  ninguém lê.
- `hooks-analysis.json` (309 KB) e `Sistema de roteiro multiagente-handoff.zip` (638 KB) na raiz:
  não estão no git (`git ls-files` não os lista), mas estão no diretório de trabalho.

### 2.5 Estrutura

#### S1. `components/session-view.tsx`: 2.713 linhas, 113.908 bytes, 20 componentes (M)

`PremissaBox`, `Stepper`, `NarrativeCards`, `HookVariants`, `PublishBox`, `RewriteBox`,
`ThumbBtns`, `BobInlinePanel`, `BobModal`, `ScriptCard`, `ConfirmDialog`, `ClientPicker`,
`AnalysisSections`, `FeedbackForm` e mais 6 ícones, todos no mesmo arquivo. O plano README já
registrou o adiamento deste refactor ("risco alto sem baseline de testes consolidado"). O
baseline agora existe: 68 arquivos de teste, 794 testes, 1,23 s de execução. A condição foi
satisfeita.

#### S2. `lib/pipeline/` tem 30 arquivos, 3 deles para uma feature morta (P)

`kasparov.ts` (232), `kasparov-filas.ts` (288), `kasparov-video.ts` (301) somam 821 linhas, mais
`app/api/kasparov/route.ts` (217), `components/kasparov-chat.tsx` (507), `app/kasparov/page.tsx`,
`app/kasparov/[id]/page.tsx` e 6 arquivos de teste. Cerca de 1.900 linhas para 10 mensagens.

Fusões defensáveis, por baixa massa e acoplamento alto:
- `estudos.ts` (94) para dentro de `verificar.ts`: os dois julgam procedência, e `procedencia()`
  já é importada de um para o outro.
- `modelagem-brief.ts` (131) para dentro de `modelagem.ts` (562): único consumidor.
- `classify-teaching.ts` (121) e `destinatarios.ts` (69): as duas metades do mesmo roteamento.
- `taxonomia.ts` (114) e `hook-mechanisms.ts` (174): as duas taxonomias canônicas.

#### S3. `lib/pipeline/agents.ts`: 1.031 linhas com dois papéis (M)

Linhas 33 a 480: formatadores de bloco de contexto (`clientInsightBlock`, `taughtBlock`,
`scriptResultBlock`, `hookExamplesBlock`, `hookMechanismBlock`, `estruturaTemaBlock`,
`hookPreferenceBlock`, `bulletsBlock`, `formatInsightsForDados`, `premissaBlock`, `fontesBlock`,
`direcaoBlock`). Linhas 500 a 1031: os quatro agentes (`research`, `proposeNarratives`,
`rankNarratives`, `designHook`, `writeComando`). São dois módulos. O comentário em `agents.ts:472`
("mora aqui porque este módulo está ABAIXO de draft.ts no grafo de imports") mostra que a
separação já foi pensada e adiada por medo de ciclo; um `pipeline/blocos.ts` abaixo dos dois
resolve.

#### S4. Documentação desatualizada em lugar que o modelo lê (P)

- `README.md` e `AGENTS.md` dizem "corpus de ~6.000 vídeos"; `videos` tem **12.580** e
  `oraculo.fato_video` 11.773.
- `agents.ts:742` manda ao agente Dados o cabeçalho literal
  `# INSIGHTS DE PERFORMANCE (dados reais dos +6 mil vídeos)`. Isso está dentro do prompt.
- `README.md` diz que `hook`, `storytelling` e `comando` são "placeholders aguardando os
  playbooks oficiais". Não são: `hook` v3 tem 10.047 caracteres, `comando` v2 tem 9.379,
  `storytelling` v1 tem 50.133, todos ativos.
- `README.md` diz que o comando é escrito por fable; `agents.ts:1004` usa `ANALYST_MODEL`
  (sonnet) com effort low, e o banco confirma `"model":"claude-sonnet-5"` nas 181 chamadas.

### 2.6 UX

#### U1. A premissa pausa a geração e 7 sessões ficaram lá (M)

`lib/pipeline/index.ts:200-212`: com modelagem e sem premissa, a sessão vira
`status = "aguardando_premissa"`, emite `premissa_pendente` e **encerra o run**. O usuário precisa
confirmar e conjurar de novo. `select status, count(*) from vm_sessions` devolve 7 paradas nesse
estado. A pausa tem razão (a tese do original vira a nossa e o humano confirma), mas é uma
interrupção no meio da espera mais longa do produto, e 7 pessoas não voltaram.

#### U2. As decisões que o produto precisa estão escondidas num chat (G)

Ver F3. O roteirista está na sessão, acabou de gerar, e é ali que ele tem contexto para ativar a
lição que nasceu da correção que ele mesmo acabou de pedir. A pergunta chega num destino separado.

#### U3. Erro de saldo de terceiro aparece como falha da sala (P)

C4: 41% dos erros. O usuário conjura, espera, e recebe "Não consegui obter a transcrição do
vídeo: Looks like you're out of credits". O anexo de vídeo poderia ser validado no momento em
que o link é colado, antes de qualquer espera.

#### U4. 314 segundos de espera sem previsão, 82 deles inúteis (M)

O `Stepper` (`session-view.tsx:289`) mostra a fase corrente, e `gravarFase`
(`index.ts:56`) persiste em `vm_sessions.debug` para a segunda aba acompanhar. Bom. Falta o
número: a duração mediana de cada fase já está medida em `pipeline_trace.usage[fase].ms` sobre
187 gerações, e dá para dizer "revisão, ~80s, faltam ~2min".

#### U5. Um item de navegação para uma feature que nunca chegou a um prompt (P)

`components/nav.tsx:54` expõe `/bullets`. Ver 3.2.

#### U6. O que falta na tela para decidir

Depois de gerar, o roteirista vê o roteiro, as variações de hook, o racional do hook e a
verificação. Não vê: quanto custou, quanto tempo levou por fase, qual foi a base de dados que
sustentou a escolha da estrutura (`estrutura_tema_lift` já existe e só chega ao prompt), nem os
resultados reais de roteiros anteriores do mesmo cliente (os 15 `client_scriptresult` também só
vão para o prompt). O "Por quê?" (`explain.ts`) cobre a proveniência do trecho, não a aposta.

### 2.7 Features inúteis ou que atrapalham

Consolidado em §3.

### 2.8 Pré-requisitos

1. **Instrumentar as 11 chamadas fora do trackedCreate** (C7). Sem isso, qualquer afirmação sobre
   custo do Professor, do Ideador, do Bob e do ETL é chute, e o plano de eficiência não pode ser
   medido.
2. **Backfill de embeddings** (F9). Metade do corpus fora da busca contamina todo experimento de
   few-shot.
3. **Gravar o motivo do fallback no trace** (C2). É o que transforma "a revisão não funciona" de
   descoberta de auditoria em alarme automático.
4. **Retry no workflow do ETL** (F6). Sem ETL não há flywheel, e um blip de rede custou uma semana.
5. **Rodada real após cada portão novo**, não teste verde: `scripts/retry-session.ts` já faz o
   A/B appendando versão sem apagar evidência. Portão que rejeita não é validado por teste que
   passa.

---

## 3. Features a cortar

### 3.1 Kasparov (o chat), preservando as filas

**Evidência**: 3 threads, 10 mensagens, última em 2026-08-18. ~1.900 linhas entre
`lib/pipeline/kasparov*.ts`, `app/api/kasparov/`, `app/kasparov/`, `components/kasparov-chat.tsx`
e 6 arquivos de teste.

**O que se perde**: o debate livre sobre um vídeo aleatório, e a destilação de conversa em lição.
Ambos usados 3 vezes em 4 semanas.

**O que NÃO se corta**: `proximaPendencia` e `responder` de `kasparov-filas.ts`. Essa lógica é
boa e é a única implementação das 5 filas. Ela migra para onde o usuário está (Onda 1).

### 3.2 Bullets (paleta emocional)

**Evidência**: `vm_bullets` tem 2 termos ("Desesperado", "Perturbador"), cada um com score 1.
`lib/bullets.ts:12` fixa `SCORE_MINIMO = 2`, então `selecionarBullets` devolve `[]` e
`bulletsBlock` (`agents.ts:646`) devolve string vazia **em toda geração desde a migration 0033**.
A feature tem página própria, item de navegação, tabela, tabela de votos, 4 server actions
(`listBullets`, `addBullet`, `voteBullet`, e `banirTrecho` que compartilha o caminho) e um
arquivo de teste, e nunca colocou uma palavra num prompt.

**O que se perde**: nada mensurável. A intenção (paleta curada pelo time) é boa e pode voltar
como sugestão dentro do editor do roteiro, onde a pessoa já está escolhendo palavra.

### 3.3 Calibração A/B de hooks

**Evidência**: 252 pares, 6 votos, `minN = 8` em `aggregatePreferences`, 0 linhas de `pref_hook`
em `vm_viral_insights`. Custo contínuo: 1 par colhido por geração (`index.ts:551`) e 2 chamadas
de LLM por cron (`runProbeTopup(6)`), para uma fila que nunca será respondida no ritmo atual.

**O que se perde**: o gosto humano como eixo separado da performance. Vale registrar que a ideia
está certa e o formato está errado: 6 votos em 4 semanas é a medida de quanto o time quer
responder A/B fora do fluxo. Se voltar, volta como 1 par por sessão dentro da própria sessão, não
como página nem como fila de chat.

**Manter**: `wilsonLower`/`wilsonUpper` de `lib/calibration.ts`. São usadas pelo lift e pelo
estudo, e não têm nada a ver com o A/B.

### 3.4 O `share` no payload de `hook_mechanism_ranking`

`lib/etl.ts:301`. O comentário do próprio arquivo diz que sai quando o WP-F ler `lift_lb`. Já lê
(`agents.ts:hookMechanismRanking`, `hook-mechanisms.ts:selectHook`). Campo que mede prevalência
guardado ao lado do campo que mede eficácia é convite para alguém ler o errado.

### 3.5 O array completo em `vm_insight_runs.rows`

C6. Guardar o `id`, o `run_at`, a contagem por tipo e as diferenças em relação ao run anterior
resolve o propósito declarado (histórico de runs) sem 4,5 MB de JSON não lido.

### 3.6 A fase de revisão, se o conserto não entregar

Condicional e medido, não ideológico. Ver Onda 1, item 1.4.

---

## 4. Plano de evolução em ondas

Cada item é auto-contido: o quê, onde, critério de pronto.

### Onda 0: Pré-requisitos (nada depende de decisão de produto)

#### 0.1 Backfill de embeddings do corpus

**O quê**: rodar `npx tsx --env-file=.env.local scripts/backfill-embeddings.ts` (resumível,
`--dry-run` conta antes). Custo estimado US$ 0,06.

**Onde**: script existente, nenhuma mudança de código.

**Pronto quando**: `select count(*) from videos where roteiro is not null and length(roteiro) > 200
and id not in (select video_id from documents where video_id is not null)` devolver menos de 200
(hoje: 5.601), e `documents` passar de 11.000 linhas, todas com embedding.

#### 0.2 Telemetria em todas as chamadas de LLM

**O quê**: trocar `anthropic.messages.create(...)` por `trackedCreate(log, "<fase>", ...)` nos 11
call sites listados em C7. Onde não há `ctx.usageLog` (ETL, curador, probe), criar um `UsageLog`
local e persistir o total na tabela que já existe para o contexto (`vm_insight_runs` para o ETL,
`vm_lessons.context_note` não serve; preferir uma coluna `usage jsonb` em `vm_lessons` e
`vm_kasparov_messages`, ou simplesmente logar no retorno da rota).

**Onde**: `lib/pipeline/teach.ts:68`, `bob.ts:85`, `suggest.ts:234`, `classify-teaching.ts:73`,
`rewrite-fragment.ts:15`, `grok-search.ts:33`, `lib/etl.ts:101`, `lib/curator.ts:107` e `:240`,
`lib/calibration-probe.ts:20` e `:85`, `lib/modelagens/queries.ts:267`, `lib/modelagens/cacar.ts:148`.

**Pronto quando**: `grep -rn "anthropic.messages.create" lib app | grep -v lib/anthropic.ts`
devolver vazio, e um relatório simples somar custo por agente fora da geração.

#### 0.3 Fallback deixa de ser silencioso

**O quê**: toda fase que tem guarda de formato grava o que aconteceu. Estrutura mínima no
`pipeline_trace`:

```
fallbacks: { revisao: { motivo: "sem bloco de texto", stop_reason, output_tokens }, ... }
```

**Onde**: `lib/pipeline/critique.ts:48`, `lib/pipeline/humanize.ts:126`,
`lib/pipeline/draft.ts:512` (`grab("CORPO") ?? text.trim()`), `lib/pipeline/index.ts:566`.

**Pronto quando**: uma geração forçada a truncar (baixar `max_tokens` para 500 num script de
teste) produz `pipeline_trace.fallbacks.revisao` preenchido, e um `SELECT` por `fallbacks` lista
as gerações degradadas.

#### 0.4 ETL com retry e segunda janela

**O quê**: no `.github/workflows/etl-semanal.yml`, envolver o `curl` em 3 tentativas com espera
crescente, e adicionar um segundo `schedule` no mesmo dia (ex.: `0 9 * * 1` e `0 15 * * 1`), com
a rota devolvendo cedo se já houve run bem-sucedido nas últimas 12 horas (checagem em
`vm_insight_runs.run_at`).

**Onde**: `.github/workflows/etl-semanal.yml`, `app/api/cron/weekly-etl/route.ts`.

**Pronto quando**: `gh run list --workflow=etl-semanal.yml` mostrar dois runs por segunda, o
segundo terminando em sucesso com corpo `{"skipped":"run recente"}` quando o primeiro deu certo.

#### 0.5 Autor da lição

**O quê**: `alter table vm_lessons add column user_id uuid` e preencher nos dois call sites.

**Onde**: migration nova, `lib/actions.ts:286` (`saveLesson`), `lib/pipeline/index.ts:583`
(lição de correção, o `hubUser` já está em escopo), `lib/actions.ts:191` (`finalizeSession`).

**Pronto quando**: toda lição criada depois do deploy tem `user_id` não nulo, e o `/ensinar`
mostra quem propôs.

### Onda 1: Fechar o flywheel

#### 1.1 Ressuscitar a revisão (o item de maior retorno do plano)

**O quê**: três mudanças na mesma função.

1. `max_tokens` de 8000 para 16000 em `lib/pipeline/critique.ts:19`. O documento revisado tem
   ~4,3 KB (~1,2k tokens) e o thinking do sonnet-5 come o resto; 8000 nunca bastou.
2. Passar `effort: "medium"` como quarto argumento do `trackedCreate`. A revisão corrige contra
   checklist, não inventa. Se `medium` não entregar, subir, medindo.
3. Separar a crítica da reescrita em DUAS saídas estruturadas via tool
   (`registrar_revisao` com `problemas: string[]` e `roteiro_revisado: string`), eliminando o
   `split` por marcador de texto, que é o ponto frágil. `toolInput`/`toolArray` já existem.

**Onde**: `lib/pipeline/critique.ts` inteiro (53 linhas).

**Pronto quando**, e este é um portão que rejeita, então exige rodada real
(`scripts/retry-session.ts`, 5 sessões reais, nova versão appendada):

```sql
select count(*) filter (where pipeline_trace->>'revised' <> pipeline_trace->>'assembled') aplicadas,
       count(*) filter (where coalesce(length(pipeline_trace->'proveniencia'->>'critica'),0) > 0) com_critica
from vm_generated_scripts where created_at > '<data do deploy>';
```

Alvo: `aplicadas` ≥ 4 de 5 e `com_critica` = 5 de 5.

**STOP**: se depois da mudança a revisão aplicar mas PIORAR o roteiro (julgamento humano em 5
pares antes/depois, usando `pipeline_trace.assembled` versus `revised`), a decisão passa a ser
cortar a fase. Nesse caso o ganho é 82 segundos e 32% da saída, e o checklist migra para o
`slop-lint` (determinístico) e para o humanizador.

#### 1.2 Trazer as filas para a sessão

**O quê**: o componente de pendência sai do chat e vira um cartão discreto no fim da sessão, logo
abaixo do roteiro, alimentado por `proximaPendencia(clientId)`. Uma pendência por sessão
concluída, com as mesmas respostas (`a`/`b`/`skip`/`ativar`/`rejeitar`), chamando o mesmo
`responder`. A prioridade muda de sorteio uniforme para: lição nascida DESTA sessão primeiro,
depois casamento, depois métrica, depois critério, depois calibração.

**Onde**: `lib/pipeline/kasparov-filas.ts` (reusar `proximaPendencia`/`responder` sem alterar),
novo `components/pendencia-card.tsx`, montado em `components/session-view.tsx` depois do
`FeedbackForm`. `app/api/kasparov/route.ts` deixa de ser a única porta.

**Pronto quando**: em duas semanas, `select count(*) from vm_lesson_learnings where active` sair
de 1 e `vm_calibration_votes` passar de 6. Se não passar, a hipótese "é porque é destino" estava
errada e o corte de 3.1/3.3 vira definitivo.

#### 1.3 Corrigir a tela que esconde as lições de correção

**O quê**: incluir `correcao` no filtro de derivadas.

**Onde**: `app/ensinar/page.tsx:39`:
`l.source_kind === "edicao" || l.source_kind === "curador"` passa a incluir `"correcao"`.

**Pronto quando**: o contador `pendentes` da seção "O QUE A SALA APRENDEU COM VOCÊ" mostrar 125,
não 27.

#### 1.4 Premissa vazada deixa de matar a geração

**O quê**: em `teseAceitavel`, quando `VAZAMENTO_DE_TOOL` casar, cortar o texto no índice do match
e reavaliar; só falhar se o que sobrou não passar nos outros testes. Registrar o corte no trace.

**Onde**: `lib/pipeline/premissa.ts:44-51` e `lib/pipeline/index.ts:243`.

**Pronto quando**: um teste em `tests/premissa-origem.test.ts` com a string real de 1.328
caracteres (disponível em `vm_sessions.premissa` das 5 sessões que falharam) devolver a tese
limpa, e nenhuma sessão nova falhar com "não é uma tese" em 30 dias.

#### 1.5 Ampliar a amostra do flywheel usando o que o Oráculo já sabe

**O quê**: hoje o ciclo aprende com 10 roteiros maduros. A MV `oraculo.fato_video` tem 5.303
vídeos maduros marcados `vm_script='sim'`, com `coeficiente_viral`, `retencao_hook`,
`retencao_final`, `seguidores_ganhos` e `taxa_nao_seguidores`. Esses não são roteiros do Codex,
mas são roteiros escritos pela casa, e o que se quer aprender (que estrutura, que mecanismo, que
tipo de comando funciona) não depende de quem escreveu.

Concretamente: `client_scriptresult` continua sendo só do Codex (é a autoavaliação da sala), mas
o insight novo `roteiro_escrito_lift` mede, por cliente e global, o lift de cada rótulo dentro do
universo `vm_script='sim'`. A infraestrutura existe inteira: `liftRankingRows` já cruza
`vm_video_classifications` com `fato_video`; basta um filtro adicional e um segundo conjunto de
linhas.

**Onde**: `lib/etl.ts:266-320` (`liftRankingRows`), `lib/pipeline/agents.ts` (novo bloco).

**Pronto quando**: o ETL emitir `roteiro_escrito_lift` com pelo menos 3 rótulos de `lift_lb > 1`
e n ≥ 30 no global, e o agente Dados receber o bloco.

**STOP**: se nenhum rótulo separar (todos com IC cruzando 1), não emitir insight e registrar "o
dado não separa", como o plano 020 fez no WP-D.

### Onda 2: Decisões por dados em cada etapa

#### 2.1 Uma régua só: `coeficiente_viral` em todo lugar

**O quê**: reescrever o RPC `vm_client_insights` para usar `oraculo.fato_video.coeficiente_viral`
no lugar de `mediana_views do grupo / mediana_views do cliente`, mantendo tudo o mais. Isso
elimina de uma vez D1 (a régua por views absolutos deixa de existir, porque o coeficiente já é
normalizado por canal), D2 (o decaimento por idade sai, a recência continua na descrição em
texto) e D4 (as duas réguas viram uma).

**Onde**: migration nova com `create or replace function public.vm_client_insights`. O consumidor
(`lib/etl.ts:clientInsightRows`) não muda: os campos de retorno continuam os mesmos.

**Pronto quando**: nenhum `case when mediana_views >= ...` e nenhum `exp(-recencia_dias/...)` no
corpo do RPC; e uma comparação antes/depois dos 10 maiores `client_storytelling` de 3 clientes
mostrando que os de canal pequeno deixaram de ser penalizados.

**STOP**: `coeficiente_viral` cobre 11.773 dos 12.580 vídeos. Os sem cobertura caem fora do
insight em vez de virar zero, e a `amostra` reflete isso.

#### 2.2 Comando medido por conversão, não por alcance

**O quê**: no mesmo RPC, `perf.ratio` do comando passa a ser

```
(mediana de seguidores_ganhos/views_total * 1000 do grupo)
  / (mediana de seguidores_ganhos/views_total * 1000 do canal)
```

comparando contra a mediana do CANAL, não do cliente (um cliente tem vários canais e plataformas
com taxas de conversão estruturalmente diferentes). `lib/etl.ts:descricaoDe` passa a escrever
"+N seguidores por mil views (Nx a conversão mediana do canal)".

**Onde**: RPC `vm_client_insights`, `lib/etl.ts:66-77`, e o rótulo em `agents.ts:1010`
("pré-rankeados por seguidores ganhos" vira "por conversão em seguidores por mil views").

**Evidência que justifica**: r(seguidores absolutos, views) = 0,80; r(seguidores/1k views, views)
= 0,13; n = 1.655.

**Pronto quando**: o ranking de `client_comando` de pelo menos 2 clientes mudar de ordem, e a
correlação entre o `performance_ratio` publicado e a `media_views` do grupo cair abaixo de 0,3.

**Aplicar o mesmo raciocínio onde couber**: qualquer dimensão avaliada pelo que acontece DEPOIS
do hook deve ser medida contra quem chegou lá, não contra quem viu. A retenção final já é
relativa. O comando não era. Vale revisitar `client_hook` (hoje ponderado por `ret_hook_grupo /
mediana_ret_hook`, o que está correto).

#### 2.3 Corte por confiança, não por n ≥ 2

**O quê**: `vm_client_insights` passa a exigir `wilson_lower(k, n) > base` em vez de
`amostra >= 2`, ou no mínimo `amostra >= 5` com o IC publicado no payload. O payload ganha
`lift_lb` e a descrição diz "sem evidência (IC cruza 1)" quando for o caso, exatamente como
`hookMechanismBlock` já faz (`agents.ts:283`).

**Onde**: RPC `vm_client_insights`, `lib/etl.ts:descricaoDe`, `agents.ts:clientInsightBlock`.

**Pronto quando**: nenhum insight com `amostra < 5` chegar ao prompt, e os que chegam carregarem
o IC. Hoje 152 de 410 sairiam.

#### 2.4 Few-shot ordenado por `coeficiente_viral`

**O quê**: `CriterioFewShot` ganha um terceiro valor, `coeficiente_viral`, e ele vira o padrão.
`metricasDosCandidatos` (`context.ts:35`) já busca por `video_id` em lote; passa a buscar também
`oraculo.fato_video.coeficiente_viral` (a função `fatoPorVideo` de `lib/etl.ts:566` faz
exatamente isso e é reutilizável). Sem dado, cai em views, marcado na origem, como já acontece
hoje com a taxa de compartilhamento.

Isso resolve F5 por dado em vez de por pergunta: a decisão "views ou taxa de compartilhamento"
era entre duas opções ruins. `vm_fewshot_criterio` continua existindo como override humano.

**Onde**: `lib/pipeline/few-shot.ts` (`CriterioFewShot`, `ordenar`, `origemDe`),
`lib/pipeline/context.ts:35` e `:77`.

**Pronto quando**: `pipeline_trace.few_shot_origens` de uma geração nova disser
"entrou por coeficiente viral" em pelo menos 3 dos 5 exemplos, e os testes de
`tests/few-shot.test.ts` cobrirem o terceiro critério e o fallback.

**Depende de**: 0.1 (com metade do corpus fora da busca, trocar o critério de ordenação de 60
candidatos enviesados não mede nada).

#### 2.5 A escolha da vencedora passa a olhar o lift da estrutura

**O quê**: em `lib/pipeline/index.ts:326-338`, o desempate entre candidatas que servem à premissa
deixa de ser só o `score` do LLM e passa a ser `score × lift_lb da estrutura`, quando a estrutura
da candidata casa com um `code` de `estrutura_lift` ou de `estrutura_tema_lift` (cliente antes de
global). Sem casamento, `lift_lb = 1` e o comportamento é o de hoje. O motivo entra no trace, no
mesmo formato do `hook_motivo`.

**Onde**: `lib/pipeline/index.ts:322-345`, função pura nova em `lib/pipeline/hook-mechanisms.ts`
ou num `lib/pipeline/selecao.ts` (a lógica é irmã de `selectHook` e merece o mesmo tratamento:
pura, testável sem banco).

**Pronto quando**: um teste com 3 candidatas e um ranking fixo escolher a segunda quando o lift
da estrutura dela compensa 8 pontos de `score`; e 5 gerações reais gravarem
`narrativa_motivo` no trace.

**STOP**: hoje há 22 `estrutura_lift` e 7 `estrutura_tema_lift`. Se em 10 gerações menos de 3
casarem estrutura com o ranking, o dado não cobre a decisão e o item volta para a gaveta com o
registro "não cobre".

#### 2.6 Anti-colapso mais forte no hook

**O quê**: a janela de `hookRecentes` sobe de 5 para 10 (`index.ts:643`) e a penalidade por uso
deixa de ser fixa: `0.6^usos` vira `0.6^usos` sobre uma janela maior, o que já reduz o
monopólio pela metade. Além disso, quando o topo bruto tem `lift_lb` dentro do IC do segundo
(hoje: 1,13 contra 1,06), tratá-los como empatados e alternar.

**Onde**: `lib/pipeline/index.ts:641-658` (`hookRecentes`),
`lib/pipeline/hook-mechanisms.ts:selectHook`.

**Pronto quando**: em 30 gerações, nenhum mecanismo passar de 35% (hoje Conflito Declarado está
em 50% das 30 pós-corte).

### Onda 3: Eficiência e estrutura

#### 3.1 Tirar `cache_control` de onde ele é prejuízo

**O quê**: remover `cache_control: { type: "ephemeral" }` do bloco 1 da revisão e do hook.

**Onde**: `lib/pipeline/critique.ts:23`, `lib/pipeline/agents.ts:901`.

**Pronto quando**: após 20 gerações novas,
`sum(cache_creation_input_tokens)` das fases `revisao` e `hook` for 0 e o `input_tokens` das
mesmas fases não tiver subido mais de 10%.

**Nota**: manter no roteiro e na humanização. Lá o par escreve e lê no mesmo modelo (fable) e a
razão leitura/escrita é 160% na humanização.

#### 3.2 Dieta do `narrativas`

**O quê**: substituir o playbook de storytelling inteiro (50.133 caracteres) pelas seções das
estruturas candidatas mais o índice das 19 estruturas. `extractPlaybookSection`
(`lib/pipeline/draft.ts:93`) já extrai por heading e é usada pelo roteirista. O agente
storytelling precisa do catálogo para ESCOLHER, então o índice (código e nome, 19 linhas) vai
inteiro e as seções completas vão só das estruturas com `lift_lb > 1` no tema
(`estrutura_tema_lift` já diz quais são, e isso torna a dieta uma decisão por dado, não um corte
cego).

**Onde**: `lib/pipeline/agents.ts:645-653`, novo helper ao lado de `extractPlaybookSection`.

**Pronto quando**: `input_tokens` médio da fase `narrativas` cair de 28.616 para menos de 15.000,
e 5 gerações reais produzirem candidatas com estruturas válidas do catálogo (o campo
`estrutura` tem que continuar casando com um `code` de `lib/pipeline/taxonomia.ts`).

**STOP**: se as candidatas passarem a repetir as mesmas 3 estruturas ou a inventar estrutura fora
do catálogo, reverter. O playbook inteiro é caro, mas é o que dá variedade.

#### 3.3 Playbook de comando fora do bloco estático compartilhado

**O quê**: `buildStaticSystemBlock` (`draft.ts:74-88`) deixa de incluir
`# PLAYBOOK DE COMANDO/CTA` (9.379 caracteres). Quem escreve o CTA já o recebe em
`writeComando` (`agents.ts:1005`).

**Onde**: `lib/pipeline/draft.ts:80-81`.

**Pronto quando**: o roteiro gerado continua sem CTA (já é a regra) e o `input_tokens` das fases
`roteiro`, `revisao` e `humanizacao` cai ~2,3k cada.

**Cuidado**: isso muda o prefixo cacheado. Rodar depois de 3.1 e medir cache read da humanização
na mesma janela.

#### 3.4 `vm_insight_runs` guarda resumo, não o array

**O quê**: `lib/etl.ts:866` passa a inserir `{ total, por_tipo, por_escopo, novos, removidos }`.
A retenção de 12 continua.

**Pronto quando**: `select pg_size_pretty(pg_total_relation_size('vm_insight_runs'))` cair abaixo
de 100 KB.

#### 3.5 Separar `agents.ts` em blocos e agentes

**O quê**: criar `lib/pipeline/blocos.ts` com os formatadores (linhas 33 a 480 de `agents.ts`).
`agents.ts` fica com os 5 agentes. `draft.ts` e `premissa.ts` importam de `blocos.ts`, que não
importa nenhum dos dois, então o ciclo que motivou a mistura deixa de existir.

**Pronto quando**: `npx tsc --noEmit && npx eslint . && npm test` verde, `agents.ts` abaixo de
600 linhas, e nenhum import circular.

#### 3.6 Quebrar `session-view.tsx`

**O quê**: extrair, nesta ordem (do menos acoplado ao mais): ícones, `CopyBtn`/`ShareBtn`,
`ConfirmDialog`, `Stepper`, `PublishBox`, `NarrativeCards`, `FeedbackForm`, `BobModal` +
`BobInlinePanel`. `ScriptCard` e `SessionView` ficam por último.

**Pronto quando**: nenhum arquivo em `components/` acima de 600 linhas, e os 794 testes verdes.

**Por que agora**: a condição registrada no `plans/README.md` ("adiado, risco alto sem baseline
de testes consolidado") foi satisfeita: 68 arquivos, 794 testes, 1,23 s.

#### 3.7 Remoções

Executar §3: Kasparov (chat), Bullets, calibração A/B, `share` do payload. Cada uma com o
migration de `drop table` separado, depois de 30 dias com a feature desligada na navegação.

### Onda 4: UX

#### 4.1 A pendência aparece onde a decisão faz sentido

Já coberto em 1.2. Aqui entra o polimento: a lição nascida da correção que o usuário acabou de
pedir aparece com o texto do pedido dele ao lado, para ele reconhecer o que está ativando.

#### 4.2 Previsão de tempo por fase

**O quê**: o `Stepper` mostra, ao lado da fase corrente, a mediana histórica dela e o restante
estimado. Os números já estão medidos: `pipeline_trace.usage[fase].ms` sobre 187 gerações.
Materializar como um insight global `duracao_fases` no ETL (7 linhas de SQL) e ler no servidor.

**Onde**: `lib/etl.ts` (novo `InsightRow`), `components/session-view.tsx:289` (`Stepper`).

**Pronto quando**: a tela diz "revisão, ~80s, faltam ~2min" e o erro médio da previsão fica
abaixo de 40%.

#### 4.3 Validar o anexo de vídeo na hora de colar

**O quê**: quando o usuário cola um link de vídeo em `home-form`, disparar a resolução da
transcrição imediatamente em vez de esperar o "conjurar". Erro de crédito, duração acima de 120 s
ou plataforma sem suporte aparecem ali, com o campo de colar transcrição já aberto.

**Onde**: `components/home-form.tsx` (o handler do campo `video_link`),
`app/api/transcribe-link/route.ts` (já existe).

**Pronto quando**: nenhuma sessão nova falhar com erro de transcrição depois do "conjurar".
Hoje: 11 de 29 erros.

#### 4.4 Encurtar ou eliminar a pausa da premissa

**O quê**: em vez de encerrar o run e exigir novo "conjurar", manter a conexão aberta e seguir
assim que a confirmação chegar. O `guardEmit` já sobrevive à desconexão do cliente e o lock
otimista já existe. Alternativa mais barata: manter a pausa, mas emitir a tese sugerida junto com
o botão "é isso, continue" e disparar o run 2 automaticamente no clique, sem o usuário precisar
achar o botão de conjurar.

**Onde**: `lib/pipeline/index.ts:200-212`, `lib/actions.ts:580` (`confirmarPremissa`),
`components/session-view.tsx:113` (`PremissaBox`).

**Pronto quando**: `select count(*) from vm_sessions where status='aguardando_premissa'` não
crescer em 30 dias (hoje 7 acumuladas).

#### 4.5 A aposta visível

**O quê**: um bloco recolhido no fim do roteiro com o que a sala apostou e por quê: estrutura
escolhida e o lift dela, mecanismo do hook e o `hook_motivo` (já gravado), escopo do few-shot
(já gravado em `proveniencia.blocos.few_shot.escopo`), e os resultados dos últimos roteiros
publicados do mesmo cliente (`client_scriptresult`, hoje só no prompt). Zero chamada de LLM: é
serialização do que o trace já tem.

**Onde**: `components/session-view.tsx`, lendo `pipeline_trace` que a página já carrega.

**Pronto quando**: o bloco existe e mostra, para uma geração real, a linha
"Conflito Declarado, IC inferior do lift 1,13, n=348" e o motivo do anti-colapso.

#### 4.6 Documentação que o modelo lê deixa de mentir

**O quê**: trocar "+6 mil vídeos" por "+12 mil" em `agents.ts:742` e nos dois markdowns;
corrigir a seção de playbooks do README (não são placeholders); corrigir o modelo do comando
(sonnet, não fable); apagar a linha sobre Vercel Cron do README (o cron é GitHub Actions desde
2026-08-17).

**Onde**: `lib/pipeline/agents.ts:742`, `README.md`, `AGENTS.md`.

---

## 5. Tabela de prioridade

| # | Item | Impacto no objetivo | Esforço | Depende de | Por que nesta posição |
|---|---|---|---|---|---|
| 1 | 1.1 Ressuscitar a revisão | **Máximo** | P | 0.3 | Uma fase inteira do produto não existe. 32% da saída e 82 s por geração pagos por nada, em 187 gerações. Nenhum outro item devolve tanto por tão pouca linha de código. |
| 2 | 0.3 Fallback grava motivo | Alto | P | nenhuma | É a instrumentação que impede o próximo F1. Vem antes de 1.1 para que o conserto seja verificável. |
| 3 | 0.1 Backfill de embeddings | Alto | P | nenhuma | US$ 0,06 dobra o universo de exemplos do roteirista. Qualquer mudança de few-shot (2.4) sem isso mede um corpus pela metade. |
| 4 | 0.4 Retry do ETL | Alto | P | nenhuma | Sem ETL não há flywheel. Um `curl (28)` custou uma semana e ninguém viu. |
| 5 | 1.3 Filtro do /ensinar | Alto | P | nenhuma | Uma linha desbloqueia a visibilidade de 98 dos 125 aprendizados pendentes. |
| 6 | 2.2 Comando por conversão | Alto | M | 0.4 | O erro está medido (r=0,80 contra r=0,13) e o dado está pronto na MV. É a correção de modelagem mais bem sustentada do plano. |
| 7 | 2.1 Uma régua só | Alto | M | 0.4 | Mata D1, D2 e D4 de uma vez, nos 410 insights que mais chegam aos prompts. Depois de 2.2 porque as duas mexem no mesmo RPC e o comando é o caso mais grave. |
| 8 | 1.4 Premissa vazada | Médio | P | nenhuma | 5 de 29 erros, e a tese correta já está no campo. |
| 9 | 1.2 Filas na sessão | **Máximo** se der certo | M | 1.1 | É o teste da hipótese central sobre o aprendizado: 126 lições e 1 ativa é um problema de porta, não de máquina. Depois de 1.1 porque a sessão vai mudar de forma. |
| 10 | 0.2 Telemetria completa | Médio | M | nenhuma | Sem isso, 11 de 24 portas de LLM gastam sem número. `api_usage` não serve: é do coletor. |
| 11 | 3.1 Cache onde paga | Médio | P | nenhuma | Prejuízo medido em duas fases. Barato e isolado. |
| 12 | 2.3 Corte por confiança | Médio | M | 2.1 | 152 de 410 insights vêm de n ≤ 4 e chegam rotulados como "evidência forte". |
| 13 | 2.4 Few-shot por coeficiente | Médio | M | 0.1, 2.1 | Resolve a decisão travada de F5 por dado em vez de por pergunta. |
| 14 | 3.2 Dieta do narrativas | Médio | M | 2.1 | Maior linha de input do sistema (28,6k por chamada). A dieta usa o lift por tema, então depende da régua consertada. |
| 15 | 4.3 Validar vídeo ao colar | Médio | P | nenhuma | 11 de 29 erros, todos descobertos depois da espera. |
| 16 | 2.6 Anti-colapso do hook | Médio | P | nenhuma | O monopólio anterior morreu e outro está nascendo (50% em Conflito Declarado). |
| 17 | 1.5 Lift do universo escrito | Alto se o dado separar | M | 0.4, 2.1 | 5.303 vídeos maduros contra 10 outcomes. Mas é aposta: pode não separar, e o STOP existe. |
| 18 | 2.5 Vencedora por lift | Médio | M | 2.1 | A última etapa que decide por número inventado. Cobertura de dado ainda fina (22 insights). |
| 19 | 4.5 A aposta visível | Médio | P | 1.1 | Zero LLM, só serialização. Dá ao roteirista o que hoje só o prompt vê. |
| 20 | 4.2 Previsão por fase | Baixo | P | 1.1 | Depois de 1.1, porque o número muda. |
| 21 | 3.7 Remoções (Kasparov, Bullets, A/B) | Médio (manutenção) | M | 1.2 | Só depois de 1.2 provar ou refutar a hipótese da porta. Cortar antes é decidir sem dado. |
| 22 | 4.4 Pausa da premissa | Baixo | M | nenhuma | 7 sessões em 2 meses. Real, mas pequeno. |
| 23 | 3.5 Separar agents.ts | Baixo | M | nenhuma | Higiene. Faz depois que as mudanças de conteúdo assentarem, senão é conflito garantido. |
| 24 | 3.6 Quebrar session-view | Baixo | G | 1.2, 4.5 | 2.713 linhas. A condição registrada no README foi satisfeita, mas as Ondas 1 e 4 mexem no arquivo: quebrar antes duplica o trabalho. |
| 25 | 0.5 Autor da lição | Baixo | P | nenhuma | Não muda roteiro nenhum, mas é barato e a atribuição só piora com o tempo. |
| 26 | 3.3 / 3.4 / 4.6 | Baixo | P | 3.1 | Limpeza. |

**Justificativa da ordem em uma frase**: consertar o que está quebrado e invisível (1, 2, 4, 5, 8)
antes de melhorar o que funciona; devolver dado honesto às decisões que já existem (6, 7, 12, 13)
antes de criar decisões novas por dado (17, 18); e só cortar feature (21) depois de testar a
hipótese de que o problema era a porta, não a feature (9).

---

## 6. O que foi verificado e refutado

- **"`vercel.json` com cron num deploy Hostinger, o ETL nunca rodou"**: refutado. Não existe
  `vercel.json`. O cron vive em `.github/workflows/etl-semanal.yml` desde 2026-08-17 e rodou com
  sucesso em 18/08, 24/08 e 31/08. O problema real é outro: falhou em 07/09 por rede e não há
  retry (F6).
- **"`vm_viral_insights` foi todo computado num único batch, logo o ETL roda a mão"**: parcialmente
  refutado. O batch único é consequência de `vm_replace_insights`, que troca a tabela inteira a
  cada run; é o desenho, não sintoma. O sintoma verdadeiro é `vm_insight_runs` sem linha em 07/09.
- **"`api_usage` (51 mil linhas) serve para medir onde o dinheiro vai"**: refutado. Zero linhas da
  Anthropic e do xAI. A tabela é do coletor: `scrapecreators` (33.544 chamadas, US$ 63,06) e
  `gemini` (transcrição, dissecação, categorização, embedding). O custo do Codex está em
  `vm_generated_scripts.pipeline_trace.usage`, e cobre 13 das 24 portas de LLM (C7).
- **`hypotheses` (16 linhas)**: não é feature do Codex. `grep -rn "hypotheses"` no repositório
  devolve zero ocorrências. É tabela do outro app que divide o Supabase. Não cortar daqui.
- **Humanização e slop-lint**: funcionam. 0 de 187 humanizações perdidas pelo guard de formato,
  5 violações de slop-lint acumuladas em 187 roteiros. Não mexer.
- **Anti-colapso do hook (WP-F do plano 020)**: entregou. Contraste Extremo caiu de 93% para 7%.
  O item 2.6 é ajuste fino, não conserto.
- **Casamento por 5-gramas (WP-A do plano 020)**: funciona tecnicamente (36 matches, todos
  confirmados) mas não ampliou a amostra: os 14 roteiros casados já estavam publicados.
- **Suíte de testes**: 68 arquivos, 794 testes, 1,23 s. Saudável. Não é a razão de nenhum achado
  deste plano, e é o que destrava 3.6.
