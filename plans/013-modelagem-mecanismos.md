# Plano 013 — Modelagem: de cópia para superação do original

**Problema relatado**: o roteiro gerado a partir de um vídeo modelado sai como uma
reescrita do original. **Objetivo**: extrair o *porquê* daquele vídeo ter funcionado
(mecanismos transferíveis) e usar a inteligência de dados da casa para escrever um
roteiro NOVO, capaz de igualar ou superar o original.

Baseline: `lib/pipeline/{modelagem,draft,index,agents}.ts` no estado atual (branch `main`).

## Decisões travadas com o usuário

1. **Sem tema digitado → mesmo tema, ângulo novo.** Não é adaptação fiel.
2. **Os dados escolhem o ângulo; o usuário troca depois** — reusa `rankNarratives` e
   os cards de narrativa que já existem. Sem etapa bloqueante na UI.
3. **Pesquisa passa a checar E enriquecer**: verificar as alegações do vídeo e trazer
   munição nova — dados contraintuitivos, gatilhos emocionais, comparações que
   simplifiquem/ampliem a compreensão (escala humana BR).
4. **Modelagem client-aware**: vê o que já performou para o cliente E os vetos /
   preferências registradas. Prioridade: mais resultado, sem fake news.

---

## 1. Diagnóstico — a cópia tem 3 causas nomeáveis

| # | Onde | O que acontece |
|---|------|----------------|
| R1 | `lib/pipeline/draft.ts:203-204` | O modo adaptação injeta `transcript.slice(0,12000)` na mensagem do roteirista **junto com** *"Mantenha o mesmo tema e os argumentos do original"*. O escritor tem o original na frente e ordem de preservá-lo. |
| R2 | `lib/pipeline/modelagem.ts:39-60` | O schema extrai **conteúdo**, não mecanismo: `beats.resumo` (o que o beat diz), `argumentos` (os argumentos do original), `hook.texto`. O brief herda o conteúdo. |
| R3 | `lib/pipeline/modelagem.ts:180-184` | Sem tema, o prompt pede um brief para *"preservar tema, argumentos e a ARQUITETURA"*. **O brief já é uma ordem de cópia.** |

Agravantes estruturais confirmados no código:

- **Não existe etapa de ângulo.** Em modo adaptação (`index.ts:70`) o pipeline pula
  `proposeNarratives` **e** `rankNarratives`; a única "narrativa" é a arquitetura do
  próprio vídeo (`agents.ts:558`). Não há de onde vir originalidade.
- **Não existe pesquisa.** Modo adaptação pula `research` (`index.ts:87`) — o roteiro
  depende 100% do que o vídeo alegou. Se o vídeo mentiu, publicamos a mentira.
- **A modelagem é cega ao cliente.** `analyzeModelagem` usa exatamente 3 coisas do
  `ctx`: `playbooks.hook`, `playbooks.storytelling` e `prompt`
  (`modelagem.ts:163-168,180`). Ignora `clientPrefs`, `insights`, `taught`,
  `scriptResult`, `bannedPhrases`, `fewShot`. E o brief que sai daí vira **arquitetura
  obrigatória** para narrativas (`agents.ts:383`), roteirista (`draft.ts:139`), hook
  (`agents.ts:558`) e item **eliminatório** da revisão (`draft.ts:168`) — tudo isso
  construído sem saber para quem estamos escrevendo.
- **Custo invisível:** a modelagem chama `anthropic.messages.create` direto
  (`modelagem.ts:170`), não `trackedCreate` — não entra em `pipeline_trace.usage`.
- **Não existe checagem de fatos em lugar nenhum.** Os 6 chapéus da revisão
  (`agents/revisao.md:7-12`) são todos de ofício, nenhum factual.
  `playbooks/checklist.md:132-143` **já tem** a seção PRECISÃO FACTUAL ("um único dado
  sem fonte = eliminação automática", "ausência de fake news") e ela já chega ao
  revisor (`critique.ts:24`) — mas o revisor **não tem como saber** o que foi
  verificado, então a regra é inaplicável. A seção FONTES é string livre do LLM, salva
  sem nenhuma validação de URL.
- **`lib/pipeline/fontes-autoritativas.json` é código morto** desde o commit inicial:
  define tier_1/tier_2/tier_3 "para o fact-check (Fase 2)" e **não tem um único
  consumidor** no repo. A Fase 2 nunca foi feita.

## 2. Análise crítica do prompt ANALISTA PIRÂMIDE

**Aproveitar:** a lógica de **gargalo** (invertida: a camada fraca do original é onde
a nossa versão ganha dele), a **ETAPA 3 — 3 ângulos com pergunta nova e emoções
dominantes distintas** (é a peça que resolve o problema; está no fim do prompt como
sobremesa e precisa ser o prato principal), a exigência de **evidência literal** e a
leitura de **TIMING como multiplicador externo**.

**Não usar como está:**

1. **Cegueira de transcrição** — ~35% dos critérios exigem vídeo ("para o polegar em
   ≤1.5s", corte, frame, saliência visual). Só temos transcrição. O modelo pontuaria
   isso inventado, com cara de dado.
2. **Nota subjetiva competindo com métrica real** — `lookupCorpus` (`modelagem.ts:79`)
   já traz `retencao_hook`/`retencao_final`/`views`. Um "hook 7/10" opinado vale menos
   que retenção medida. Regra: métrica existe → usa métrica; não existe → estimativa
   declarada.
3. **As 15 potencializações são desperdício aqui** — otimizam um vídeo que nunca vamos
   publicar, custam ~2-3k tokens de saída e ninguém a jusante consome. Fica só o
   gargalo, em 1 linha.
4. **Formato humano** (pirâmide ASCII, emoji, `<auto_auditoria>`,
   `<filtro_brasileiro_obrigatorio>`) ≈ 1,5-2k tokens de imposto por chamada — e o
   filtro BR **duplica** o `style_guide` já injetado em `buildStaticSystemBlock`. No
   pipeline: tool forçada, JSON, prosa zero.
5. **Falta o corte que decide tudo: transferível × não-transferível** — o que viaja
   para outro tema/rosto/semana vs. o que era circunstância (trend, celebridade,
   notícia quente). O prompt tangencia via TIMING e não força.
6. **Falta baseline de outlier** — 1M de views numa conta de 10M seguidores é
   fracasso. O prompt pede a média dos últimos 10 vídeos *ao humano*; o corpus pode
   calcular.

**Onde ele serve inteiro:** como ferramenta *humana* de estudo (uma tela `/analisar`),
não dentro da geração. Dois consumidores, dois prompts.

## 3. Arquitetura nova

**Hoje (modo adaptação):**
```
transcrição → modelagem(conteúdo) → brief-cópia ─┐
transcrição (12k chars) ─────────────────────────┴→ roteirista → cópia
```

**Depois:**
```
                 ┌→ modelagem client-aware → esqueleto + 3 ângulos + alegações
transcrição ─────┤                                    │
                 └→ pesquisa (checar + enriquecer) ────┤
                                                       ↓
                                   Dados rankeia os 3 ângulos (cards na UI)
                                                       ↓
                        roteirista: ângulo vencedor + esqueleto + dossiê
                                    (NUNCA a transcrição original)
```

Modelagem e pesquisa continuam **em paralelo** (ambas recebem a transcrição) — sem
custo de latência serializada.

---

## WP-1 — Extração de mecanismos, client-aware (`lib/pipeline/modelagem.ts`)

Uma única chamada (a mesma de hoje). Tool renomeada `registrar_modelagem`:

```
diagnostico:
  gargalo: "tema|hook|narrativa|comando"
  onde_superamos: string              // 1 frase: como a nossa versão explora esse gargalo
  por_camada: [{camada, evidencia (frase literal), leitura}] × 4   // nota 0-10 SÓ sem métrica real
esqueleto:                            // TRANSFERÍVEL, livre de conteúdo
  estrutura_narrativa: <código+nome do playbook>
  hook: {tipo, mecanismo, funcao}     // sem `texto` — texto é conteúdo
  beats: [{ordem, funcao, mecanismo_de_atencao, emocao, seg}]
  loops_abertos: [{o_que_fica_pendente, fecha_em_qual_beat}]
  escalada, comando: {tipo, gatilho, posicao}
nao_transferivel: [string]            // trend, celebridade, rosto conhecido, janela de notícia
timing: {classe: "breaking|trending|ciclico|perene", contribuicao_pct}
alegacoes: [{afirmacao, tipo: "dado|opiniao|causalidade"}]   // insumo da checagem, não do roteiro
angulos: [{pergunta_nova, emocao_dominante, amplificador_br, hook_pronto,
           arco, porque_supera, compativel_com_cliente}] × 3   // emoções obrigatoriamente distintas
```

Removidos: `beats.resumo`, `argumentos`, `elementos_virais`, `hook.texto`.

**Regra dura no prompt:** *"É PROIBIDO citar no esqueleto qualquer tema, nome, número,
marca ou frase do original. Se um campo só puder ser preenchido citando o conteúdo,
você não extraiu o mecanismo — extraia de novo."*

**`replication_brief` passa a ser composto em código** a partir do JSON —
determinístico, ≤1200 chars, impossível vazar frase do original, e poupa a prosa de
saída. O tipo `modelagemBriefs: string[]` **não muda**, logo `context.ts`, `types.ts`,
`agents.ts:383`, `draft.ts:139` e `buildReviewDynamicBlock` seguem intactos.

**Client-aware** — injetar no prompt da modelagem, reusando os helpers existentes de
`lib/pipeline/agents.ts` (não escrever nada novo):
- `clientPrefsBlock`-equivalente (proibições, vocabulário vetado, tom) → **veto**:
  ângulo incompatível é descartado antes de nascer;
- `clientInsightBlock(ctx, ["tema","storytelling","hook"], 5)` (`agents.ts:25`) e
  `scriptResultBlock(ctx, "estrutura")` (`agents.ts:157`) → viabilidade;
- `taughtBlock(ctx, ["storytelling","tema"])` (`agents.ts:38`) → curadoria humana, com
  precedência declarada sobre heurística (mesma regra de `agents/dados.md:19`).

O campo `compativel_com_cliente` obriga o modelo a se posicionar por ângulo.

A classificação continua ancorada no vocabulário real: o playbook de storytelling tem
**19 estruturas** em 6 famílias (A1…F4, `playbooks/storytelling.md`, ~52 KB) e a
modelagem já recebe o índice condensado via `playbookIndex` (`modelagem.ts:163`).
(O README diz que esses playbooks são placeholders — está desatualizado.)

**Cache:** a validade em `modelagem.ts:159` testa `analysis.estrutura_narrativa` →
passa a testar `analysis.esqueleto` (linhas antigas re-analisam uma vez —
comportamento já previsto). Chave por `attachment_id` continua correta: anexo pertence
a uma sessão, que pertence a um cliente.

**Telemetria:** trocar `anthropic.messages.create` (`modelagem.ts:170`) por
`trackedCreate` — o custo da modelagem passa a aparecer em `pipeline_trace.usage`.

## WP-2 — Pesquisa que checa e enriquece (`lib/pipeline/agents.ts` `research`, `index.ts`)

Modo adaptação passa a **rodar** `research` (hoje pulado em `index.ts:87`), recebendo
a transcrição em vez do tema, com missão dupla:

1. **Checar** cada item de `alegacoes`: `confirmado | contestado | nao_verificavel`,
   com link e tier da fonte. O que não confirmar **não pode virar afirmação nossa** —
   no máximo "segundo o vídeo original".
2. **Enriquecer**: dados contraintuitivos que o vídeo não usou, gatilhos emocionais, e
   **comparações de escala humana BR** (R$, salário mínimo, tempo de trabalho,
   cotidiano) que simplifiquem ou ampliem a compreensão.

É aqui que a nossa versão **fica factualmente superior** ao original — ângulo novo
sozinho não supera ninguém.

**Reusar o que já existe, não escrever de novo:**
- `agents/pesquisador.md:5-12` já pede "4. ÂNGULOS CONTRAINTUITIVOS" e "6. FONTES
  (URL + data)". A missão de enriquecimento é uma extensão do prompt existente, não um
  agente novo.
- **`lib/pipeline/fontes-autoritativas.json`** (hoje órfão) passa a ser injetado como
  hierarquia de confiabilidade da checagem — era exatamente para isso que foi escrito.
- A saída do `research` hoje é string crua sem schema (`agents.ts:316`). Para o modo
  adaptação ela precisa carregar o **status por alegação** de forma legível pelo
  revisor — o mínimo é uma seção `## CHECAGEM` com uma linha por alegação; sem parser
  novo, só convenção de formato.

## WP-3 — Ângulos viram narrativas candidatas (`lib/pipeline/index.ts`)

No modo adaptação: pular `proposeNarratives` (os ângulos já são as candidatas) e
**rodar `rankNarratives`**. Mapeamento para `NarrativaCandidata` (`types.ts`):

| ângulo | candidata |
|---|---|
| conceito | `titulo` |
| `esqueleto.estrutura_narrativa` | `estrutura` |
| derivado do arco | `personagem`, `conflito` |
| `emocao_dominante` | `mecanismo_emocional` |
| beats do esqueleto (`funcao` + `mecanismo_de_atencao`) | `beats` |
| `hook_pronto` | `gancho_potencial` |
| `porque_supera` | `porque_funciona` |

Ganhos de graça: a escolha passa a ser **decidida pelos dados** (o agente Dados já é
client-aware, `agents.ts:472`); os cards de narrativa, o score, a justificativa e o
botão **"Reescrever com esta narrativa"** (`session-view.tsx:311-318`) funcionam sem UI
nova; e o stepper para de mentir — hoje ele marca *Pesquisa* e *Narrativas* como
concluídas sem terem rodado (`session-view.tsx:46`).

## WP-4 — Roteirista deixa de ver o original (`lib/pipeline/draft.ts:203-204`)

```
- "Mantenha o mesmo tema e os argumentos do original" + transcript.slice(0,12000)
+ ângulo vencedor + esqueleto + dossiê (checado e enriquecido)
+ "Você NÃO tem acesso ao texto original — e não precisa."
```

Some o vetor principal da cópia e ~3,5k tokens de entrada. O roteirista não fica sem
substância porque agora existe dossiê no modo adaptação (WP-2).

**Revisão ganha a informação que falta, não uma regra nova.** O revisor já recebe
`playbooks/checklist.md` com a seção PRECISÃO FACTUAL eliminatória (`critique.ts:24`);
o que falta é ele saber o que foi verificado. `buildReviewDynamicBlock`
(`draft.ts:166`) passa a injetar a seção `## CHECAGEM` do dossiê — hoje ele recebe o
dossiê truncado em 2000 chars com o rótulo solto "confira fatos citados"
(`draft.ts:180`), o que é inútil porque o corte pode comer justamente a checagem. Com
isso, "alegação `contestado`/`nao_verificavel` afirmada como fato" vira falha
eliminatória que o revisor **consegue** aplicar.

## WP-5 — UX (mudanças pequenas, alto retorno)

1. **`components/home-form.tsx:396`** — a legenda do anexo modelado diz *"serão
   desconstruídos e replicados **no seu tema**"* mesmo com o campo de tema vazio,
   quando não existe tema nenhum. Com prompt vazio, trocar para: *"Sem tema: vamos
   manter o assunto do vídeo e atacar por um ângulo novo."* É a única sinalização hoje
   inexistente do modo adaptação.
2. **`components/session-view.tsx:1539-1560`** — o `<details>` "Desconstrução da
   modelagem" ganha, do JSON novo, duas seções que respondem direto à queixa: **"o que
   vamos reaproveitar"** (esqueleto) e **"o que NÃO vamos copiar"**
   (`nao_transferivel`). O renderer genérico `AnalysisSections`
   (`session-view.tsx:1755-1801`) já cobre — é só o schema mudar.
3. **`NarrativeCards`** (`session-view.tsx:214-325`) — exibir `gancho_potencial` (o
   `hook_pronto` do ângulo) no card. Hoje não aparece, e é o que faz o usuário escolher
   um ângulo em 2 segundos.

Sem etapa bloqueante e sem toggle novo — decisão 2 do usuário.

---

## Risco adjacente descoberto (decidir se entra)

O humanizador reescreve o texto inteiro, **inclusive a seção FONTES**
(`humanize.ts:44-60`), com `max_tokens: 8000` e nenhuma guarda de preservação de URL; a
substituição cirúrgica usa `split(alvo).join(...)` global (`humanize.ts:94`), que pode
atingir texto dentro de uma URL. Ou seja: hoje um link correto pode ser alterado depois
de ter sido verificado. Bug pré-existente, não regressão deste plano — mas colide de
frente com a prioridade "sem fake news". Correção mínima: manter FONTES fora da
humanização (ela não é texto falado) ou reancorar as URLs originais após o passo.
**Não incluído nos WPs acima.**

## Custo (honesto)

- Modelagem: **~neutra**. Sai a prosa do `replication_brief` e os `resumo`/`argumentos`
  (~600-900 tokens de saída); entram os 3 ângulos (~600) e o bloco de cliente (~500-800
  de entrada).
- Roteirista em adaptação: **−3,5k tokens de entrada**.
- Brief composto (≤1200 chars) contra prosa livre de 2-3k chars, injetado em **3
  lugares** → economia ×3.
- **Adaptação passa a pagar pesquisa (Grok) + ranking (sonnet)**: +1 chamada cada.

Saldo: o modo adaptação fica **mais caro** — hoje ele é barato e ruim. Passa a custar
como uma geração normal, que é o que ele deveria ter sido desde o início. Os demais
modos ficam levemente mais baratos.

## Ordem de execução

1. **WP-1** (`modelagem.ts` isolado) — dá para ler o brief novo e julgar sozinho.
2. **WP-4** (`draft.ts` isolado) — mata a cópia. Depende do esqueleto do WP-1.
3. **WP-2** + **WP-3** (`index.ts`, `agents.ts`) — mesma onda, tocam os mesmos arquivos.
4. **WP-5** (UI) — depois do schema estabilizado.

Gate padrão do repo: `npx tsc --noEmit && npx eslint . && npm run check && npm test`.

## Verificação

- **Teste automatizado (obrigatório, sem LLM):** em `tests/`, sobre a função que compõe
  o `replication_brief`: dado um `analysis` com tema, nomes, marcas e números plantados
  nas `alegacoes`, o brief composto **não pode conter nenhum deles**. É a asserção que
  trava a regressão de cópia.
- **Teste manual end-to-end:** colar o mesmo vídeo que gerou a queixa, sem tema.
  Esperado: 3 cards de ângulo com emoções distintas, dossiê presente, e um roteiro cujo
  hook e argumento central **não** existem na transcrição original.
- **Comparação A/B:** rodar o mesmo vídeo antes/depois e diffar hook + primeiro
  parágrafo contra a transcrição.

## Fora do escopo (deliberado)

- **Baseline de outlier** (views ÷ mediana do autor no corpus) em `lookupCorpus` — só
  depois de confirmar que `videos` tem chave de autor utilizável.
- **Tela `/analisar`** com o prompt Pirâmide completo para estudo humano.
- **Modo "versão fiel"** (adaptação PT-BR sem reinvenção) — o usuário escolheu ângulo
  novo como padrão; adicionar quando alguém pedir.
