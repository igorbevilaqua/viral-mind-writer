# Plano 014 — Modelagens externas: sugestão com performance já validada

**Objetivo**: o botão "Sugerir tema" passa a entregar, junto de cada tema, um **vídeo
externo real que já performou** — pronto para virar modelagem em um clique. Hoje a
sugestão só reaproveita hits de outros clientes do próprio corpus
(`vm_cross_client_hits`), o que limita o repertório ao que a casa já produziu.

Baseline: `b229a96` (main). Depende do plano 013 (mergeado em `68e6411`) —
reusa o enum `timing.classe` já existente em `lib/pipeline/modelagem.ts:151`.

## Decisões travadas com o usuário

1. **Pool global**, compartilhado entre clientes; a personalização acontece na consulta.
2. **Idade não penaliza sozinha** — o que penaliza é dependência de contexto
   (`timing.classe`). Perene antigo rankeia acima de efêmero recente.
3. **Reaproveitamento agressivo**: vídeo já descoberto nunca é re-analisado.
4. Integra a sugestão de temas que já existe — **sem tela nova**.

---

## 0. Estado — onde retomar

Atualizado em 2026-08-13. Baseline `b229a96`, nada commitado ainda.

| | Estado |
|---|---|
| Fase 0 (validação com API real) | ✅ **feita** — 18 créditos, veredito aprovado (§3b) |
| `SCRAPECREATORS_API_KEY` no `.env.local` | ✅ presente. ⚠️ **conta temporária** do usuário, free tier, **66 créditos**. Trocar pela conta do coletor antes de subir |
| Fixture com as 371 respostas reais | ✅ `tests/fixtures/modelagens-fase0.json` |
| WP-1 (`lib/modelagens/buscar.ts`) | ✅ escrito e **exercitado contra a API real** (12 créditos, nicho tributário) |
| WP-3 (`lib/modelagens/rank.ts`) + teste | ✅ escrito, 12 testes offline sobre a fixture |
| WP-4 — arquivo `0025_modelagem_pool.sql` | ✅ escrito |
| WP-4 — migration **aplicada no banco** | ✅ **aplicada** em 2026-08-13 (24 colunas no pool, RLS on / 0 policies, 4 índices, +2 colunas em `vm_client_preferences`) |
| WP-2 (`lib/modelagens/queries.ts` + `agents/cacador-modelagens.md`) | ✅ escrito, 12 testes offline em `tests/queries-modelagens.test.ts`, **caminho de IO exercitado de verdade** em Caio Lima e Café com Ferri (10 queries cada, 2 chamadas Sonnet) |
| WP-5 (`lib/modelagens/cacar.ts` + fase `caca` no `suggest.ts`) | ✅ escrito, 5 testes em `tests/associar-modelagens.test.ts`; upsert do pool validado contra o banco (sem crédito) |
| WP-6 (card + botão "usar com modelagem") | ✅ escrito |
| `0026_cross_client_hits_url.sql` (URL do hit interno) | ⏳ escrita, **não aplicada** — sem ela o hit interno só não ganha botão |
| Caça ponta a ponta com a API real | ❌ **nunca rodou** — exige crédito ScrapeCreators (ver §0.1) |

Nada em `lib/modelagens/` é importado por `app/`, `components/` ou `lib/` ainda: até o
WP-5 o pacote é código morto em produção, e o deploy não depende da migration.

## 0.1 O que falta para liberar (não é código)

1. **Trocar a `SCRAPECREATORS_API_KEY` pela conta do coletor** (`.env.local` + painel
   Hostinger). A conta temporária tem 66 créditos e o WP-5 gasta ~20 por clique em pool
   frio: **3 cliques e a caça morre em silêncio** no meio de uma sugestão. O `buscar.ts`
   loga abaixo de 2.000 justamente para isso não passar batido.
2. **Aplicar a `0026`** — só então o hit interno ganha o botão de modelagem.
3. **Primeiro clique real em "Sugerir tema"** com a chave nova: é o único teste que a
   fixture não substitui, porque exercita busca paga + classificação em lote + upsert no
   pool na mesma requisição, dentro dos 120s da rota. Rodar em 1 cliente e conferir no
   banco (`select count(*) from vm_modelagem_pool`) antes de liberar para o time.
4. **Armadilha #12 ainda em aberto**: transcrição de vídeo em ES/EN nunca foi exercitada.
   Verificar uma vez, manualmente, ao escolher a primeira modelagem estrangeira.

A fixture torna WP-3 desenvolvível **sem gastar um crédito sequer**: são as respostas
reais já normalizadas, incluindo os 137 itens de YouTube sem autor/data/duração (o
achado que tirou a plataforma do v1) e os pares `views`/`views_alt` do Instagram que
divergem 2,2×.

## 1. O que já existe (não construir de novo)

| Peça | Onde | Uso aqui |
|---|---|---|
| Conta + chave ScrapeCreators | `api-viral-data/src/services/scrapecreators/client.ts:9` | mesma chave, copiada para o Codex |
| Pipeline URL → modelagem completa | `lib/pipeline/modelagem.ts`, `modelagem-brief.ts` | consome o candidato escolhido, **intacto** |
| Classificação de perenidade | `modelagem.ts:151` — enum `breaking\|trending\|ciclico\|perene` | mesmo vocabulário, agora aplicado antes da escolha |
| Transcrição IG/TikTok/YT | `lib/transcribe.ts:26,74` (innertube + Supadata) | só quando o usuário escolhe |
| Cache de análise | `vm_modelagem_analyses` por `attachment_id` | inalterado |
| Sugestão de temas com SSE | `lib/pipeline/suggest.ts:94`, `app/api/suggest-themes/route.ts` | ganha uma fase |
| Seed de nicho do cliente | `suggest.ts:130-137` (`nicho`) | vira semente das queries |
| pgvector no mesmo banco | extensão `vector` já instalada (tabela `documents`) | embedding do pool |

**Nada disso é reescrito.** O plano adiciona descoberta + ranking; o resto é encanamento.

## 2. Credenciais — nenhuma conta nova

| Item | Ação |
|---|---|
| `SCRAPECREATORS_API_KEY` | **copiar** do `.env` do `api-viral-data` para `.env.local` + painel Hostinger. Mesma conta, mesma chave. |
| Créditos | endpoints de busca custam **1 crédito**. Conferir saldo; US$ 47 = 25k créditos ≈ 800 buscas completas. Créditos não expiram. |
| Supabase | já temos service role no projeto (`qclvrddrqulgfzccndnl`). |
| OpenAI (embeddings) | já configurado (`context.ts:9`). |

Documentar em `.env.example` (o arquivo está desatualizado — ver §8).

## 3. Arquitetura

```
suggest-themes (SSE)
  ├─ dados     (já existe: prefs, insights, cross-client hits)
  ├─ pesquisa  (já existe: Grok)         ─┐  paralelo
  └─ caça      (NOVO)                    ─┘
       ├─ 1. pool local por embedding      → grátis
       ├─ 2. ScrapeCreators, TikTok + IG   → 1 crédito/chamada
       ├─ 3. filtro + ranking em código    → grátis
       ├─ 4. classificação em lote (1 call) → ~40 finalistas, cacheada p/ sempre
       │      timing · janela_sazonal · idioma · aplicabilidade_br
       └─ 5. upsert no pool
  └─ sintese   (já existe) — cada sugestão pode carregar `modelagem_sugerida`
```

**Nada é transcrito durante a busca.** Transcrição e autópsia só acontecem quando o
usuário clica "usar como modelagem" — e aí é o fluxo que já existe. É a maior economia
do plano: descobre 600, transcreve 1.

---

## 3b. Fase 0 — executada em 2026-08-13 (18 buscas, 18 créditos)

3 nichos reais (`gestão/empresas`, `geopolítica/economia`, `leilão/imobiliário`) × 2
queries × 3 plataformas. **371 vídeos brutos → 365 após dedup → 27 candidatos.**

### Veredito: o dado presta

O conteúdo que volta é concreto e modelável — *"Empresas brasileiras que faliram"*,
*"Como comprar imóvel de leilão da Caixa"*, *"O Grupo Ita: 69 anos viraram pó em 5
meses"*. O risco antecipado de o nicho de negócios devolver só coach genérico
**não se materializou**. Rendimento: ~1,5 candidato útil por crédito.

### O ranking por ratio se provou, e a diferença é grande

| ordenação | 1º colocado |
|---|---|
| por views | @intrigamentes — 9,4M views, **763k seguidores** = 12,4× |
| **por ratio** | @larissasantos.leiloes — 316k views, **1.556 seguidores** = **202,9×** |

Um vídeo com 1.556 seguidores fazendo 316k views é um outlier extremo: o mérito está
inteiro no vídeo, zero na audiência herdada. Ordenar por views o enterraria por volta da
20ª posição. É a validação empírica da decisão central do plano.

O cap de 2 por autor também se provou necessário: @mayra.ribeiro03 ocupava 3 das 12
primeiras posições sozinha.

### Idade confirma o desenho de perenidade

Mediana 133 dias, máximo 1.023, cinco candidatos com mais de um ano. Os **dois mais
antigos** (1.004d e 1.023d) são ambos do tema "empresas brasileiras que faliram" — perene
puro, ainda performando. Um decay linear por idade descartaria justamente os melhores
exemplos atemporais.

### YouTube sai do v1

`shorts[]` devolve **apenas 6 campos**: `type, id, url, title, viewCountText,
viewCountInt`. Sem canal, sem data, sem duração, sem inscritos — não dá para calcular
ratio, nem decay, nem cap por autor. E o array `videos[]` (que tem metadado completo)
trouxe **0 itens ≤180s**: Shorts não aparecem lá.

Enriquecer custaria 1 crédito por vídeo — 61 créditos contra 1 da busca. Inviável.
**TikTok + Instagram entregam tudo que o ranking precisa**; YouTube volta quando/se o
endpoint expuser metadado, ou via YouTube Data API (que o coletor já usa).

### Rendimento e perdas por plataforma

| | itens | c/ seguidores | c/ data | c/ duração | em PT |
|---|---|---|---|---|---|
| TikTok | 175 | 174 | 175 | 175 | **99** |
| Instagram | 53 | 53 | 53 | 53 | **18** |
| YouTube | 137 | 0 | 0 | 0 | 75 |

Dois pontos de atenção:

1. **Idioma NÃO é filtro** — decisão do usuário, confirmada pelo dado. Uma boa ideia em
   espanhol ou inglês se traduz; o que não se traduz é *contexto local estrangeiro*.
   Removendo o corte por idioma, os candidatos vão de **27 para 50** com os mesmos 18
   créditos (+85%). E os dois casos recuperados mostram por que o eixo certo não é
   idioma:

   | recuperado | veredito |
   |---|---|
   | *"¿Cómo cayó Blockbuster? El día que rechazaron a Netflix"* — 1M views, 15,8× | **universal**, serve inteiro para o nicho de cases de empresas |
   | *"¿A qué se debe el aumento del dólar en Venezuela"* — 215k views, 23,8× | **local estrangeiro**, não transfere |

   Vira campo de classificação (§WP-4), não filtro de regex.
2. **Instagram rende ~1/3 do TikTok** (9 itens/busca contra 30). Vale menos crédito por
   rodada.

### Rodada de validação 2 — nicho tributário, 12 créditos (2026-08-13)

6 queries do nicho do Ricardo Schumacher (tributário/sucessório), TikTok + IG, através do
`buscar.ts` real. **228 brutos → 20 aprovados**, e **16 dos 20 são do nicho** — a taxa de
acerto se sustenta fora dos 3 nichos da Fase 0.

Mas a assimetria entre plataformas é maior do que "o IG rende menos": **os 4 únicos
ruídos do resultado eram todos do Instagram** — um meme do Verstappen, feijão
ultraprocessado, casas abandonadas em Portugal e um ator coreano com pendência fiscal. O
TikTok não trouxe **um único** item fora do nicho em 180 candidatos. Ou seja, o IG rende
1/3 do volume **e** com relevância pior, gastando o mesmo crédito. Antes de subir, medir
se ele merece metade do orçamento por rodada — ou se vira 1 página de IG a cada 3 de
TikTok.

Vale registrar o contraste que fecha a tese do plano: o 1º colocado é `@oviedo.adv` com
**203,7×** a própria audiência (2.759 seguidores, 562k views) num vídeo de **1.179 dias**.
Ordenado por views ele perderia para `@kimkataguiri` (12,7M views) — que é conteúdo
político de votação, `breaking` puro, e cujo decay o mata em duas semanas.

`video_view_count` × `video_play_count` divergiram **2,2×** no mesmo reel (105k × 233k) —
a armadilha #3 é real e grande. Adotado `video_play_count`, alinhado à semântica do
`play_count` do TikTok.

## WP-1 — Cliente de busca (`lib/modelagens/buscar.ts`, arquivo novo)

Três adapters para um tipo só. `fetch` puro com `x-api-key` — sem dependência nova.

```ts
interface Candidato {
  plataforma: "tiktok" | "instagram" | "youtube";
  plataform_id: string;          // chave de dedup
  url: string;
  autor_handle: string;
  autor_seguidores: number | null;
  caption: string;
  duracao_seg: number;
  data_publicacao: string;
  views: number; likes: number; shares: number; comments: number;
  som_id: string | null;         // sinal de trend (TikTok)
}
```

| Plataforma | Endpoint | Params | Observação |
|---|---|---|---|
| TikTok | `/v1/tiktok/search/keyword` | **`query`** (não `keyword`), `cursor` | itens em `search_item_list[].aweme_info`. Métricas completas |
| Instagram | `/v2/instagram/reels/search` | `query`, `date_posted`, `page` (1-11) | itens em `reels[]`, **planos** — ver quadro abaixo |
| ~~YouTube~~ | — | — | **fora do v1** — ver §Fase 0 |

**Campos reais, verificados contra resposta de produção em 2026-08-13.** Estes nomes
custaram crédito para descobrir: o adapter do Instagram foi escrito pela documentação e
devolveu **0 itens com HTTP 200** — 50 reels pagos e descartados em silêncio, sem
exceção, sem log. Não reescrever de memória.

| | TikTok (`aweme_info`) | Instagram (`reels[]`) |
|---|---|---|
| id | `aweme_id` | `id` |
| id curto | — | **`shortcode`** (não `code`) |
| url | montar `@handle/video/{id}` | **`url`, já pronta** |
| autor | `author.unique_id` | **`owner.username`** (não `user`) |
| seguidores | `author.follower_count` | **`owner.follower_count`** |
| legenda | `desc` | `caption` (string pura) |
| duração | `video.duration` — **MILISSEGUNDOS** (36500 = 36,5s) | `video_duration` — **segundos** float |
| data | `create_time` — unix (s) | **`taken_at` — ISO 8601 string**, não unix |
| views | `statistics.play_count` | `video_play_count` |
| engajamento | `statistics.{digg,share,comment}_count` | `like_count`, `comment_count` (sem shares) |
| som | `music.id_str` | — |

As duas unidades de duração divergem **no mesmo pacote de dados**: converter só o TikTok.
E `taken_at` em ISO passado por `new Date(ts * 1000)` não dá erro — dá o ano 58.000.

**Não passar `type=shorts` no YouTube**: o parâmetro zera o resultado. Os Shorts já vêm
no array `shorts[]` por padrão. Irrelevante no v1, registrado para quando o YouTube voltar.

Regras:
- `Promise.allSettled` — uma query que falha não derruba a busca.
- Dedup por `(plataforma, plataform_id)` **dentro da rodada também** — a doc do TikTok
  avisa que o endpoint repete resultados.
- Ler `credits_remaining` da resposta e logar; alerta abaixo de 2.000.
- Concorrência limitada (8 simultâneas). Não replicar Bottleneck — `Promise.all` em
  lotes resolve.

## WP-2 — Queries derivadas do cliente (cacheadas)

Gerar query a cada busca é desperdício: o nicho de um cliente muda em meses, não em
minutos.

Migration `0025`: duas colunas em `vm_client_preferences`.

```sql
alter table vm_client_preferences
  add column search_queries text[] not null default '{}',
  add column search_queries_em timestamptz;
```

### A semente tem duas camadas — preferências NÃO bastam

Decisão do usuário (2026-08-13). A medição no banco corrigiu **quem** é o caso difícil:
Pedro Elero e Ricardo Schumacher *têm* linha em `vm_client_preferences`, com
`temas_preferidos` cheio (5 e 6 temas) — não são eles. Quem não tem são **6 dos 30
clientes ativos**, e 4 deles são pior que o previsto:

| cliente | vídeos | linhas em `vm_video_stats` | prefs |
|---|---|---|---|
| Igor Bevilaqua | 135 | 102 | ✗ |
| Caio Lima | 79 | 72 | ✗ |
| Café com Ferri | 132 | **0** | ✗ |
| Renato Mendes | 69 | **0** | ✗ |
| Túlio Lichenstein | 22 | **0** | ✗ |
| Leonardo Martins | 4 | **0** | ✗ |

Ou seja: Caio Lima e Igor Bevilaqua são o teste de "corpus sozinho gera query utilizável";
Café com Ferri é o caso que o plano não previu — corpus com título e categoria mas **sem
uma linha de métrica**, onde `performance_ratio` não existe para vídeo nenhum e a camada 1
tem que degradar para título + categoria sem quebrar. Derivar query só de preferência
entrega query vazia justamente para quem mais precisa. **O corpus não é fallback de
emergência, é fonte de primeira classe**, e as duas camadas se somam:

1. **Corpus do próprio cliente, com peso maior no que performou acima da média DELE.**
   Não inventar métrica: `performance_ratio` já é exatamente isso — "Nx a média do
   cliente" (`lib/etl.ts:53-55`, alimentado por `vm_video_stats`). Baseline por cliente,
   não global, senão canal pequeno nunca aparece. O que ele já postou **e** funcionou é o
   sinal mais forte do que ele deve modelar em seguida.
2. **Preferências declaradas** — `temas_preferidos` + insights `client_tema`, que é o que
   `nicho` já usa hoje (`suggest.ts:128-134`).

Sem prefs, o corpus sozinho tem que produzir query utilizável — isso é requisito, não
otimização. O caminho inverso (cliente novo, sem corpus) existe mas é o caso raro.

Uma chamada barata (ANALYST_MODEL, tool forçada) expande a semente em **8-10 buscas em
linguagem natural**, não hashtags:

> nutrição → `"o que comer no café da manhã"`, `"mito da proteína"`, `"jejum
> intermitente funciona"`, `"ultraprocessado"`, …

Regenera se `search_queries_em` tem mais de 7 dias ou `updated_at` das prefs é mais
recente. Prompt em `agents/cacador-modelagens.md` (convenção AGENTS.md §5).

### Duas sujeiras do corpus que a semente tem que filtrar (medidas, não supostas)

1. **Título do corpus é lixo com frequência, e justo no topo.** Os três vídeos mais vistos
   do Caio Lima se chamam `TODO` (2,8M views), `not_found` (760k) e `TE DÁ` (40k) — sem
   filtro, a primeira busca gerada seria por "not_found". Aplicado o mesmo critério que o
   `vm_cross_client_hits` já usa no SQL (`length >= 15` + prefixos-lixo), e nesse cliente a
   semente passa a se apoiar mais em `categorias` do que em título.
2. **`categorias` convive em duas formas na mesma base, às vezes no mesmo cliente**: rótulo
   puro (`"NEGÓCIOS"`) e JSON em string (`{"rank":1,"nome":"MARKETING"}`). Mesma extração
   do `substring` de 0013/0018, agora também em TS. Sem ela, o tema recorrente do cliente
   viraria a palavra `rank`.

E um detalhe de cache que se autossabota: escrever `search_queries` numa linha **nova** faz
`updated_at` (o `now()` do banco) nascer alguns ms depois de `search_queries_em` (o
`new Date()` do app), então a regra "prefs mais recentes que o cache" invalidaria o cache
que acabou de ser escrito e cada busca pagaria uma chamada de LLM. Daí a margem de 60s na
comparação (`precisaRegenerar`, com teste próprio).

## WP-3 — Ranking (`lib/modelagens/rank.ts`, função pura)

Sem LLM, sem I/O — é o arquivo testável do plano.

```
ratio      = views / max(seguidores, 1000)          // clamp: conta nova não vira ∞
p          = percentil(ratio) DENTRO da plataforma  // ver armadilha #1
decay      = 0.5 ^ (idade_dias / meia_vida)
score      = p * decay
```

`meia_vida` por `timing.classe` — reusa o enum do plano 013:

| classe | meia-vida | efeito |
|---|---|---|
| `breaking` | 15 d | morre rápido, como deve |
| `trending` | 45 d | |
| `ciclico` | 180 d | **+ boost** se o mês atual bate com `janela_sazonal` |
| `perene` | 3650 d | idade praticamente não pesa |

Cortes antes do ranking:
- `views >= piso` — **configurável por plataforma** (default 100k; views de TikTok, IG
  e YouTube não são a mesma moeda).
- `duracao_seg <= 180`.
- `ratio >= 3` — o vídeo estourou a própria audiência.
- `aplicabilidade_br != "local_estrangeiro"` — **não** filtro de idioma (§3b.1).
- `plataform_id` já em `videos` (corpus) → descarta, o cliente já viu.
- `usado_em` não vazio para este cliente → descarta.
- **máx. 2 por autor** no resultado final — senão um perfil bom domina os 15 cards.

## WP-4 — Pool (`0025_modelagem_pool.sql`)

```sql
create table vm_modelagem_pool (
  id uuid primary key default gen_random_uuid(),
  plataforma text not null,
  plataform_id text not null,
  url text not null,
  autor_handle text,
  autor_seguidores int,
  caption text,
  duracao_seg int,
  data_publicacao timestamptz,
  views bigint, likes bigint, shares bigint, comments bigint,
  som_id text,
  timing_classe text,              -- breaking|trending|ciclico|perene  (lazy)
  janela_sazonal text,             -- ex.: 'dezembro'                    (lazy)
  idioma text,                     -- informativo, NÃO filtro            (lazy)
  aplicabilidade_br text,          -- universal|adaptavel|local_estrangeiro (lazy)
  embedding vector(1536),          -- OpenAI, sobre a caption            (lazy)
  descoberto_por text[] not null default '{}',
  usado_em uuid[] not null default '{}',
  removido_em timestamptz,
  primeira_coleta timestamptz not null default now(),
  ultima_coleta timestamptz not null default now(),
  unique (plataforma, plataform_id)
);
create index on vm_modelagem_pool (timing_classe, views desc);
create index on vm_modelagem_pool using hnsw (embedding vector_cosine_ops);
alter table vm_modelagem_pool enable row level security;  -- ver armadilha #7
```

Campos `lazy` só são preenchidos para quem passou o filtro — não se embeda 600 vídeos
para mostrar 15.

**Classificação em lote — uma chamada só**: com os ~40 finalistas (caption + hashtags +
som + data), tool forçada, retornando por vídeo:

```
{ plataform_id, timing_classe, janela_sazonal, idioma, aplicabilidade_br }
```

`aplicabilidade_br` responde *"um brasileiro modelaria isso?"*, não *"está em
português?"*:

| valor | significado | exemplo real da Fase 0 |
|---|---|---|
| `universal` | transfere inteiro, só traduzir | queda da Blockbuster, Nokia, comportamento humano |
| `adaptavel` | precisa trocar o referente por um equivalente BR | imposto americano → reforma tributária |
| `local_estrangeiro` | não transfere | dólar na Venezuela, político local, benefício de outro país |

É o mesmo eixo do `nao_transferivel` que o plano 013 já extrai na autópsia
(`modelagem.ts:142`) — trend e celebridade não transferem no *tempo*, contexto
estrangeiro não transfere no *espaço*. Vocabulário consistente de propósito.

Custa poucos milhares de tokens, é **uma chamada** (a mesma que já classificaria timing)
e **fica cacheada para sempre** — nem a classe temporal nem a aplicabilidade de um vídeo
mudam. Na segunda vez que o vídeo aparece, é grátis.

## WP-5 — Integração no `suggest.ts`

- Fase nova `caca`, **em paralelo com `pesquisa`** (que já existe e já é
  fail-soft) — não soma latência. `SUGGEST_MESSAGES` em `components/home-form.tsx:29`
  ganha a copy correspondente.
- Falha na caça **nunca aborta** a sugestão — mesmo try/catch de `suggest.ts:152`.
- `ThemeSuggestion` (`suggest.ts:11`) ganha:
  ```ts
  modelagem_sugerida?: {
    url: string; plataforma: string; autor: string;
    views: number; ratio: number; timing_classe: string;
  } | null;
  ```
- O schema da tool (`suggest.ts:41`) recebe os candidatos e o Ideador **associa** cada
  tema ao candidato mais aderente (ou a nenhum). Não é o LLM que rankeia — ele só casa.
- **Corrigir de graça**: `reaproveitado_de` (`suggest.ts:23`) não carrega a URL do vídeo
  de origem, só título e views. Adicionar `url` — o hit interno também vira modelagem
  em um clique. É uma linha e melhora o produto sozinho.

## WP-6 — UI (`components/home-form.tsx:294-315`)

O card de sugestão já existe. Ganha, quando há `modelagem_sugerida`, uma linha
`@autor · 340k views · 12× a audiência · perene` e um segundo botão **"usar com
modelagem"**, que aplica o tema **e** cria o anexo `is_modelagem: true` com a URL.

Daí em diante é o pipeline de sempre. Zero código novo a jusante.

---

## 4. Armadilhas — bugs que passariam despercebidos

1. **Views não são a mesma moeda.** TikTok conta view quase no scroll, YouTube exige
   ~30s. Ranking global por valor absoluto entrega um resultado enviesado pró-TikTok e
   ninguém percebe. **Rankear por percentil dentro da plataforma** e intercalar.
2. **YouTube não devolve quase nada.** Confirmado na Fase 0: `shorts[]` traz só
   `id, url, title, viewCount` — sem canal, data, duração ou inscritos. Por isso saiu
   do v1. Se voltar, é por enriquecimento pago (1 crédito/vídeo) ou pela YouTube Data
   API que o coletor já usa.
3. **`video_play_count` ≠ `video_view_count`** no Instagram (plays contam replay).
   Escolher um e usar sempre o mesmo, ou o `ratio` fica incomparável entre plataformas.
4. **TikTok repete resultados** — documentado. Dedup dentro da rodada, não só no upsert.
5. **Instagram `page` ≥ 12 retorna 400.** Parar em 11.
6. **Clique duplo = crédito dobrado.** Lock por cliente, no padrão de
   `vm_acquire_generation_lock` (`0016_*.sql:4`) que já existe.
7. **RLS.** O Radar Viral (`/Users/igorbevilaqua/Projetos/Radar`) lê o **mesmo banco**
   com anon key. Tabela nova sem RLS = pool exposto. Habilitar e liberar só service role.
8. **Embeddings de modelos diferentes não são comparáveis.** `documents` no corpus usa
   `gemini-embedding-001`; o Codex usa `text-embedding-3-small` (`context.ts:9`). Ambos
   1536 dims, então **o Postgres aceita o join e devolve lixo silenciosamente**. Nunca
   cruzar os dois espaços.
9. **Migration não versionada.** `radar_bolhas`/`mv_radar_videos` existem só no banco,
   sem SQL no repo. Não repetir: tudo em `supabase/migrations/`.
10. **Links mortos.** Vídeo apagado continua no pool. Campo `removido_em`, marcado na
    recoleta (mesmo padrão de `videos.removido_em`).
11. **Créditos acabando em silêncio.** A resposta traz `credits_remaining` — logar.
12. **Transcrição em outro idioma.** Com conteúdo estrangeiro liberado, `ensureTranscript`
    (`transcribe.ts`) e a autópsia passam a receber transcrição em ES/EN pela primeira
    vez. Em tese é o comportamento desejado — o plano 013 extrai **mecanismo** e proíbe
    citar conteúdo do original (`modelagem.ts:340`), então mecanismo em português a
    partir de fala em espanhol é exatamente o esperado. Mas nunca foi exercitado.
    **Verificar uma vez, manualmente, antes de liberar.**
13. **`maxDuration`.** `/api/suggest-themes` está em 120s (`route.ts`). A caça precisa
    caber; por isso roda em paralelo com a pesquisa e não transcreve nada.

## 5. Custo

| Item | Custo |
|---|---|
| 10 queries × 2 plataformas (TikTok + IG) | 20 créditos ≈ **US$ 0,04** |
| Geração de queries | 1 chamada / semana / cliente |
| Classificação de timing | 1 chamada por busca, só nos novos |
| Transcrição + autópsia | **inalterado** — só no vídeo escolhido |
| Pool aquecido | buscas seguintes no mesmo nicho: **quase grátis** |

O crédito de busca é irrelevante. O custo real é token de análise, e o plano só paga
por vídeo que o usuário efetivamente escolheu.

## 6. Verificação

- **Teste automatizado (obrigatório, sem LLM)** em `tests/rank-modelagens.test.ts`,
  sobre a função pura do WP-3, alimentado por `tests/fixtures/modelagens-fase0.json`
  (371 respostas reais da Fase 0 — sem rede, sem crédito):
  - um `perene` de 700 dias com ratio alto rankeia **acima** de um `breaking` de 10 dias
    com views maiores — é a asserção que trava a regressão principal do plano;
  - autor com 0 seguidores não produz `Infinity`;
  - nenhum autor aparece mais de 2× no resultado;
  - vídeo cujo `plataform_id` está no corpus é descartado.
- **Manual**: rodar "Sugerir tema" em 3 clientes de nichos distintos e conferir se os
  vídeos sugeridos abrem, são em PT e fazem sentido para o cliente.
- **Segunda rodada no mesmo cliente**: deve consumir **zero** ou poucos créditos
  (pool quente) e não repetir vídeo já usado.
- Gate padrão: `npx tsc --noEmit && npx eslint . && npm run check && npm test`.

## 7. Ordem de execução

1. **WP-4** (migration) — o operador aplica via Supabase MCP; executores não têm banco.
2. **WP-1** + **WP-3** — arquivos novos e isolados, testáveis sem UI. Aqui dá para ver
   resultado real antes de mexer em qualquer coisa que já funciona.
3. **WP-2** — depende da migration.
4. **WP-5** — toca `suggest.ts`; só depois de 1-3 estáveis.
5. **WP-6** — UI, por último.

**Fase 0 (antes de tudo)**: script descartável em `scripts/` disparando as buscas reais
em 2-3 nichos de clientes atuais (~50 créditos). Responde a única pergunta que o papel
não responde — *o resultado presta?* — e calibra piso de views e meia-vidas com dado
real. Se não prestar, o plano morre aqui, de graça.

## 8. Sugestões ao operador (fora do código)

1. **Curar uma lista de contas de referência por nicho.** É o maior ganho de recall do
   sistema e não custa código: vídeo sem hashtag nenhuma continua no perfil de quem
   postou, e o coletor já sabe varrer perfil
   (`api-viral-data/src/services/tiktok/scraper.ts:28`). Busca por keyword descobre
   contas novas; varredura de perfil garante que nada bom se perca. 10-20 contas por
   nicho já mudam o jogo.
2. **Agrupar clientes por nicho.** 20 clientes costumam ser ~6 nichos. Buscar por nicho
   em vez de por cliente corta o custo em ~3×, e o pool global já assume isso.
3. **`.env.example` está mentindo** — documenta `VM_ALLOWED_EMAILS` apontando para
   `lib/allowed-emails.ts`, arquivo que não existe mais (o auth passa por `middleware.ts`
   + RPCs `hub_*`, migration `0019`). Corrigir junto ao adicionar a chave nova.
4. **Pendências de segurança em aberto** no coletor (`Viral Data/PENDENCIAS.md:11,18,65`):
   Redis exposto sem senha na internet, coletor sem `API_KEY`, e `.env` versionados com
   chaves. Este plano **não depende** disso (a busca roda no Codex, não no coletor), mas
   a chave que vamos copiar é uma das que precisam ser rotacionadas.

## 9. Fora do escopo (deliberado)

- **Curva de views como juiz de perenidade.** É o sinal mais confiável — perene tem
  cauda longa, efêmero tem pico e morte — mas exige duas medições espaçadas do mesmo
  vídeo. O pool passa a acumular isso sozinho a partir do dia 1; vira o plano 015 quando
  houver ~60 dias de histórico. Até lá, classificação por LLM resolve.
- **Varredura de perfis de contas de referência** — depende da curadoria humana da
  sugestão §8.1. Plano próprio.
- **Pré-aquecimento noturno do pool por cron** — só faz sentido depois de medir a taxa
  real de acerto das buscas.
- **Cache de inscritos do YouTube** — otimização, não bloqueio.
- **Busca deliberada em inglês/espanhol.** Com idioma deixando de ser filtro, abre-se a
  opção de rodar as mesmas queries traduzidas — o acervo em inglês de cases de empresas,
  curiosidades e história é ordens de grandeza maior que o brasileiro, e é justamente o
  material `universal`. Dobra o custo em créditos por rodada, então só depois de medir a
  taxa de `universal` nas buscas em PT.
- Filtro de views por plataforma exposto na UI. Começa em constante no código.
