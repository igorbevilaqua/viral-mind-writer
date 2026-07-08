# Plano: Máquina de Aprendizado de Acertos (Flywheel + Menu Ensinar)

> **STATUS: IMPLEMENTADO E VERIFICADO** (08/07/2026) — migração 0007 aplicada; smoke test
> real do Professor (7 aprendizados, vocabulário dos playbooks); query de destilação
> validada (join `vm_lessons!inner` + filtro `active` + escopo global/cliente);
> `vm_published_scripts()` nova assinatura testada no banco; build e slop-lint OK.
> Desvio do plano: nenhum estrutural. O ETL completo não foi executado nesta sessão
> (bloqueado pelo modo de permissão) — rodar `npm run etl` valida o passo 9/10 ao vivo.

## Decisões de arquitetura (resumo executivo)

| # | Decisão | Justificativa (1 linha) |
|---|---------|------------------------|
| D1 | Aprendizados ensinados vivem em tabelas próprias (`vm_lessons` + `vm_lesson_learnings`), **não** em `vm_viral_insights` | `runWeeklyEtl` faz `delete().neq("scope","")` (snapshot completo, `lib/etl.ts:218`) — taught rows seriam apagados toda segunda; e evitar dual-write (linha viva + trilha de auditoria) mantém 1 fonte de verdade editável. |
| D2 | Sessões de ensino **não** entram em `vm_sessions` com `kind` | `vm_sessions` é carregada por `loadContext`, `runPipeline` e pela lista de sessões — um `kind` forçaria filtro em ~6 call sites e colunas semi-nulas; a lição tem ciclo de vida próprio (transcrever→extrair→revisar→salvar) e relação 1:N com aprendizados. Item "Ensinar" na nav = o "paralelo" pedido. |
| D3 | Injeção nos agentes: `loadContext` mescla os aprendizados ativos em `ctx.insights` como pseudo-insights `insight_type: taught_<dimensao>` | O agente Dados (`rankNarratives`) despeja `ctx.insights` inteiro no prompt — taught entra de graça; e um helper `taughtBlock` (irmão de `clientInsightBlock`) roteia por dimensão para Hook/Storytelling/Comando/Roteirista sem mudar `GenerationContext`. |
| D4 | Sem decaimento automático para taught; flag `active` gerenciada pelo usuário | Insights do corpus se renovam toda semana com decaimento no score (RPC 0005); taught é curadoria humana deliberada e pequena — a página da lição é o painel de gestão. |
| D5 | Sem dedup algorítmico taught × corpus; conflito resolvido por **precedência declarada no prompt** ("ensinado prevalece") | A UI de revisão É o dedup (usuário desmarca); dedup semântico automático é engine genérica que o PLANO.md proíbe. |
| D6 | Orçamento de contexto: máx **3 taught por dimensão** por prompt de especialista, máx **12 taught no total** no agente Dados, mais novos primeiro (client-scoped antes de global) | Limite fixo em código, sem config. |
| D7 | Frente A: publicação registrada no app (`vm_generated_scripts.published_url`) e o **ETL** casa a URL com `videos.link_video`/`plataform_id` e grava `videos.crm_script_id` | O vídeo pode ainda não existir no corpus quando o usuário marca (ingestão tem lag) — o ETL retenta semanalmente; app e corpus estão no MESMO projeto (`qclvrddr`), então o ETL escreve direto. |
| D8 | Performance que volta vira insight `client_scriptresult` gerado pelo ETL a cada run (join `vm_script_performance` × `pipeline_trace`) | Regenerado toda semana junto do snapshot (o wipe do ETL não é problema); o Dados já recebe todos os insights — só precisa da regra no `agents/dados.md`. |
| D9 | Sem peso extra no few-shot para roteiros publicados | O roteiro publicado entra no corpus (`videos.roteiro`/`documents`) pela ingestão normal e o `match_documents` o encontra; peso explícito é otimização especulativa (adicionar se um dia a performance sincronizada tiver volume). |
| D10 | Extração de aprendizados = 1 chamada `anthropic.messages.create` com tool forçada, prompt em `agents/professor.md` | Mesmo padrão de `proposeNarratives`/`rankNarratives` (`lib/pipeline/agents.ts`), fonte única em markdown como manda o PLANO.md. |

---

## Passo 1 — Migração `supabase/migrations/0007_teach_and_flywheel.sql`

```sql
-- Frente A: publicação declarada no app
alter table vm_generated_scripts
  add column published_url text,
  add column published_at timestamptz;
-- status já aceita 'published' (0001: generated|approved|published)

-- vm_published_scripts passa a devolver seguidores ganhos (eixo de conversão do Comando)
create or replace function vm_published_scripts()
returns table(crm_script_id uuid, video_id uuid, views bigint,
              retencao_hook numeric, retencao_final numeric,
              compartilhamentos bigint, seguidores_ganhos bigint)
language sql stable as $$
  select v.crm_script_id, v.id,
    coalesce(sum(m.views_no_dia),0)::bigint,
    (select r.retencao_hook from metricas_retencao r where r.video_id = v.id order by r.data desc limit 1)::numeric,
    (select r.retencao_final from metricas_retencao r where r.video_id = v.id order by r.data desc limit 1)::numeric,
    coalesce(sum(m.compartilhamentos_no_dia),0)::bigint,
    (select nullif(regexp_replace(r.seguidores_ganhos, '[^0-9-]', '', 'g'), '')::bigint
       from metricas_retencao r where r.video_id = v.id order by r.data desc limit 1)
  from videos v
  left join metricas_diarias m on m.video_id = v.id
  where v.crm_script_id is not null
  group by v.id;
$$;

-- Frente B: sessões de ensino (trilha de auditoria) + aprendizados destilados
create table vm_lessons (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clientes(id),        -- null = aprendizado global
  source_kind text not null check (source_kind in ('video_link','texto')),
  source_url text,
  source_title text,
  transcript text not null,                      -- transcrição obtida ou roteiro colado
  context_note text,                             -- nota do usuário: por que este vídeo importa
  created_at timestamptz not null default now()
);

create table vm_lesson_learnings (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references vm_lessons(id) on delete cascade,
  dimensao text not null check (dimensao in ('hook','storytelling','tema','ritmo','comando','geral')),
  titulo text not null,
  descricao text not null,
  evidencia text,                                -- trecho da transcrição que sustenta
  origem text not null default 'extraido' check (origem in ('extraido','manual')),
  active boolean not null default true,          -- desmarcado na revisão ou desativado depois = false
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on vm_lesson_learnings (active, dimensao);

-- RLS igual às demais vm_* (authenticated full access)
alter table vm_lessons enable row level security;
alter table vm_lesson_learnings enable row level security;
create policy "authenticated full access" on vm_lessons for all to authenticated using (true) with check (true);
create policy "authenticated full access" on vm_lesson_learnings for all to authenticated using (true) with check (true);
```

Notas: aprendizados rejeitados na revisão **são persistidos** com `active=false` — trilha de auditoria completa e reativáveis depois. Escopo do aprendizado deriva de `vm_lessons.client_id` via join (sem coluna duplicada).

---

## Frente B — Menu "Ensinar"

### Passo 2 — `agents/professor.md` (novo, prompt do extrator)

Esboço do conteúdo:

```markdown
# Agente Professor (extração de aprendizados)

Você é o analista de virais da agência. Você recebe a transcrição de um vídeo
comprovadamente viral (ou um roteiro campeão) e extrai POR QUE ele funcionou,
em aprendizados GENERALIZÁVEIS que a sala de roteiristas aplicará nos próximos vídeos.

## Dimensões (cada aprendizado pertence a exatamente uma)
- hook — mecanismo de captura de atenção nos primeiros segundos
- storytelling — estrutura narrativa, arco, mecanismo emocional (nomeie a estrutura do playbook quando casar)
- tema — enquadramento/ângulo do assunto que gerou relevância
- ritmo — pacing, densidade de informação, comprimento de frases, loops abertos
- comando — CTA e mecânica de conversão
- geral — o que não couber acima

## Regras
- 4 a 8 aprendizados. Qualidade > quantidade: só o que é regra replicável.
- Cada aprendizado é uma REGRA aplicável a roteiros futuros, nunca uma descrição do vídeo.
- `titulo`: curto, imperativo. `descricao`: 1-3 frases explicando o MECANISMO (por que funciona).
- `evidencia`: trecho literal da transcrição que sustenta o aprendizado.
- Use o vocabulário dos playbooks fornecidos (nomes de estruturas e mecanismos de hook).
- Não invente contexto que a transcrição não mostra; se o usuário deu uma nota de contexto, considere-a.
- DOIS EIXOS: viralização (tema/hook/storytelling/ritmo → views) vs conversão (comando → seguidores). Não misture.
```

### Passo 3 — `lib/pipeline/teach.ts` (novo)

Responsabilidade: extração LLM, padrão idêntico a `proposeNarratives`.

```ts
export type Dimensao = "hook" | "storytelling" | "tema" | "ritmo" | "comando" | "geral";
export interface ExtractedLearning {
  dimensao: Dimensao; titulo: string; descricao: string; evidencia?: string;
}

const APRENDIZADOS_TOOL = {
  name: "registrar_aprendizados",
  input_schema: { /* array 4-8 itens {dimensao(enum), titulo, descricao, evidencia?} required menos evidencia */ },
};

export async function extractLearnings(input: {
  transcript: string; sourceUrl?: string; contextNote?: string; clientNome?: string;
}): Promise<ExtractedLearning[]>
```

- Chamada: `anthropic.messages.create` com `ANALYST_MODEL`, `tool_choice: { type: "tool", name: "registrar_aprendizados" }`.
- `system`: `agentPrompt("professor")` + playbooks `hook`/`storytelling`/`comando` ativos (buscar via `appDb.from("vm_playbooks")` — mesmo shape do `loadContext`), com `cache_control: ephemeral`.
- `user`: `TRANSCRIÇÃO DO VÍDEO VIRAL:\n${transcript.slice(0, 30_000)}` + nota de contexto + cliente opcional.
- Normalizar double-encode do tool input (copiar o padrão de `suggest.ts:183-196` — o modelo às vezes serializa como string JSON).

### Passo 4 — `app/api/extract-learnings/route.ts` (novo)

Stateless: `POST { transcript, sourceUrl?, contextNote?, clientNome? }` → `{ learnings: ExtractedLearning[] }`. `maxDuration = 120`. Erro → `{ error }` 422. (Sem SSE: 1 chamada só, sem fases — mais simples que o padrão do `/api/generate`.)

### Passo 5 — Server actions em `lib/actions.ts` (alterar; sem arquivo novo)

```ts
export async function saveLesson(input: {
  clientId: string | null;
  sourceKind: "video_link" | "texto";
  sourceUrl: string | null; sourceTitle: string | null;
  transcript: string; contextNote: string | null;
  learnings: { dimensao: Dimensao; titulo: string; descricao: string;
               evidencia: string | null; origem: "extraido" | "manual"; active: boolean }[];
}): Promise<string>  // insere vm_lessons + vm_lesson_learnings (aprovados active=true, desmarcados active=false), revalidatePath("/ensinar"), retorna lessonId

export async function setLearningActive(id: string, active: boolean)      // toggle pós-salvamento
export async function updateLearning(id: string, patch: { titulo?: string; descricao?: string; dimensao?: Dimensao })
export async function addLearning(lessonId: string, l: { dimensao; titulo; descricao })  // origem 'manual'
export async function markPublished(scriptId: string, url: string)       // Frente A (Passo 8)
```

### Passo 6 — UX das telas de Ensinar

**`components/nav.tsx`** — adicionar entre Sessões e Clientes:
```tsx
<Link href="/ensinar" className={linkCls(pathname.startsWith("/ensinar"))}>Ensinar</Link>
```

**`app/ensinar/page.tsx`** (nova, server component) — lista de lições, espelhando o layout de `app/sessions/page.tsx` (mesmas classes de card/linha): título = `source_title ?? primeiro trecho do transcript`, chips de cliente (ou "Global"), contagem `N aprendizados ativos / M`, data, botão dourado "Ensinar novo viral" → `/ensinar/nova`. Query: `vm_lessons` + count de learnings (2 queries, agrupar em memória).

**`app/ensinar/nova/page.tsx`** (nova) — renderiza `components/teach-form.tsx` (client), recebendo `clients` (mesma query do home). Wizard em 3 estados locais (sem persistir nada até o final — 1 write só):

1. **Fonte**: toggle "Link de vídeo" | "Roteiro em texto"; campo URL (ao colar URL válida, chama `POST /api/transcribe-link` — **reusar a rota como está**, padrão de uso idêntico ao `transcribeLink` de `home-form.tsx`, preenchendo `transcript` e `source_title`) ou textarea para colar o texto; select de cliente opcional (default "Global — vale para todos"); textarea opcional "Contexto: por que este vídeo importa / o que observar". Botão "Extrair aprendizados" → `POST /api/extract-learnings`, com estado de loading ("Professor analisando o viral...").
2. **Revisão** (o coração da tela): lista agrupada por dimensão (ordem: hook, storytelling, tema, ritmo, comando, geral; badges com as cores já usadas — gold para hook etc.). Cada item: checkbox (marcado = aprovado), `titulo` e `descricao` editáveis inline (input + textarea), `evidencia` em `<details>` colapsável. Botão "+ Adicionar aprendizado" abre linha vazia (dimensão via select, `origem: manual`). Transcrição completa num `<details>` no rodapé.
3. **Salvar**: botão dourado "Salvar aprendizados" → `saveLesson` → `router.push('/ensinar/'+id)`. Texto auxiliar: "Aprovados passam a influenciar a sala de agentes imediatamente; desmarcados ficam guardados na lição."

**`app/ensinar/[id]/page.tsx`** + **`components/lesson-view.tsx`** (novas) — a lição revisitável: cabeçalho (fonte com link, cliente, data, nota de contexto), aprendizados agrupados por dimensão com **toggle ativo/inativo** (`setLearningActive`), edição inline (`updateLearning`), "+ Adicionar" (`addLearning`), transcrição colapsável. Itens inativos aparecem esmaecidos com strike — é aqui que o usuário "vê e gerencia o que o sistema sabe". Rejeitados na revisão original também aparecem (inativos), reativáveis.

### Passo 7 — A DESTILAÇÃO (mecânica exata)

**7a. `lib/pipeline/context.ts`** — no `Promise.all` do `loadContext`, adicionar a query:

```ts
appDb
  .from("vm_lesson_learnings")
  .select("dimensao, titulo, descricao, created_at, vm_lessons!inner(client_id)")
  .eq("active", true)
  .or(`client_id.is.null${session.client_id ? `,client_id.eq.${session.client_id}` : ""}`,
      { foreignTable: "vm_lessons" })
  .order("created_at", { ascending: false })
```

Depois de montar `insights`, mesclar (cap total de 12 — D6, client-scoped primeiro):

```ts
const taught = (taughtRes.data ?? [])
  .sort((a, b) => Number(!!b.vm_lessons?.client_id) - Number(!!a.vm_lessons?.client_id))
  .slice(0, 12)
  .map((t) => ({
    insight_type: `taught_${t.dimensao}`,
    scope: t.vm_lessons?.client_id ? `client:${t.vm_lessons.client_id}` : "global",
    payload: { titulo: t.titulo, descricao: t.descricao },
  }));
return { ..., insights: [...(insights ?? []), ...taught], ... };
```

`GenerationContext` **não muda** — zero alteração de tipo, zero mudança em quem já consome `ctx.insights`.

**7b. `lib/pipeline/agents.ts`** — helper novo ao lado de `clientInsightBlock`:

```ts
// Aprendizados ensinados pelo usuário (curadoria humana): roteados por dimensão, máx 3 por prompt.
export function taughtBlock(ctx: GenerationContext, dimensoes: string[], n = 3): string {
  const rows = ctx.insights
    .filter((i) => dimensoes.some((d) => i.insight_type === `taught_${d}`))
    .slice(0, n)
    .map((i) => i.payload as { titulo: string; descricao: string });
  if (!rows.length) return "";
  return rows.map((r) => `- ${r.titulo} — ${r.descricao}`).join("\n");
}
```

Roteamento por agente (o rótulo da seção carrega a regra de precedência — D5):

| Agente | Onde injetar | Dimensões |
|---|---|---|
| **Storytelling** (`proposeNarratives`) | novo bloco no user message, ao lado de `dadosCliente`: `APRENDIZADOS ENSINADOS PELO TIME (curadoria humana de virais analisados — se conflitar com heurística, isto prevalece):` | `["storytelling","tema"]` |
| **Dados** (`rankNarratives`) | automático — taught já está em `ctx.insights` que é despejado inteiro; só a regra no `agents/dados.md` (7c) | todas |
| **Hook** (`designHook`) | bloco `APRENDIZADOS DE HOOK ENSINADOS PELO TIME (prevalecem sobre padrões do corpus em conflito):` junto do `clientInsightBlock(ctx, ["hook"])` | `["hook"]` |
| **Comando** (`writeComando`) | bloco análogo junto do bloco de comandos convertidos | `["comando"]` |
| **Roteirista** (`draft.ts` → `buildDynamicSystemBlock`) | novo `parts.push` ao lado de BOAS PRÁTICAS: `# APRENDIZADOS ENSINADOS PELO TIME (ritmo e regras gerais — curadoria humana, cumpra)` | `["ritmo","geral"]` |

**7c. `agents/dados.md`** — acrescentar duas regras (texto pronto):

```
- Insights `taught_*` são APRENDIZADOS ENSINADOS PELO TIME a partir de virais analisados
  manualmente (curadoria humana). Em conflito com padrões estatísticos do corpus, o ensinado
  prevalece — cite quando um taught_* sustentar ou derrubar um score.
- Insights `client_scriptresult` são ROTEIROS GERADOS POR ESTA SALA que foram publicados,
  com performance REAL medida. É o feedback mais direto que existe: estruturas/hooks com
  performance_ratio > 1 são padrões confirmados desta sala; < 1 são anti-padrões a evitar.
```

---

## Frente A — Fechar o flywheel

### Passo 8 — UX de "marcar como publicado" (`components/session-view.tsx` + `app/sessions/[id]/page.tsx`)

- `page.tsx`: incluir `status, published_url, published_at` no select de `vm_generated_scripts` e buscar `vm_script_performance` para os ids dos scripts; passar ambos ao `SessionView`.
- `session-view.tsx`: novo componente `PublishBox` renderizado no card do script (visível também com sessão `closed` — publicação acontece depois do encerramento):
  - Se não publicado: campo "Link do vídeo publicado" + botão "Marcar como publicado" → `markPublished(scriptId, url)`.
  - Se publicado sem performance: badge âmbar "Publicado · aguardando métricas (sincroniza toda segunda)" + URL linkada.
  - Se `vm_script_performance` existe: chips de resultado — views, retenção hook/final, compartilhamentos, seguidores — no estilo dos chips existentes. **É o fechamento visível do loop.**
- `lib/actions.ts` → `markPublished`: valida URL (mesmo regex `VIDEO_URL` de plataformas), `update vm_generated_scripts set status='published', published_url, published_at=now()`, `revalidatePath`.

### Passo 9 — ETL: vínculo automático script → vídeo do corpus (`lib/etl.ts`)

Novo passo **antes** do sync de performance (para casar e sincronizar no mesmo run):

```ts
// Flywheel 1/3: casa roteiros marcados como publicados com o vídeo no corpus.
// O vídeo pode entrar no corpus semanas depois — retenta a cada run até casar.
const { data: pubScripts } = await appDb.from("vm_generated_scripts")
  .select("id, published_url").eq("status", "published").not("published_url", "is", null);
const { data: linked } = await viralData.from("videos")
  .select("crm_script_id").in("crm_script_id", ids);
// para os não-linkados: extrair id da plataforma da URL
//   YT: /(?:v=|shorts\/|youtu\.be\/)([\w-]{11})/  (mesmo regex do transcribe-link)
//   IG: /instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/
//   TikTok: /video\/(\d+)/
// match: videos.link_video ilike %<pid>% OR plataform_id = <pid>
// achou → update videos set crm_script_id = <script_id> where id = <video_id> and crm_script_id is null
```

E no sync existente, mapear o novo campo `seguidores_ganhos` do RPC para a coluna já existente em `vm_script_performance`.

### Passo 10 — ETL: performance vira insight que o Dados consome (`lib/etl.ts`)

Após o upsert de `vm_script_performance`, gerar linhas `client_scriptresult` e empurrá-las no MESMO array `rows` (antes do `insert` — o wipe semanal as regenera, D8):

```ts
// Flywheel 3/3: resultado real dos roteiros da sala vira insight do agente Dados.
// join: vm_script_performance × vm_generated_scripts (headline, hook, client_id,
//        pipeline_trace->narrativa_escolhida->estrutura, pipeline_trace->hook_racional)
// ratio: views / media_views_geral do cliente (via RPC vm_client_panel já existente,
//        1 chamada por cliente com script publicado — hoje são poucos)
rows.push({
  scope: `client:${clientId}`,
  insight_type: "client_scriptresult",
  payload: {
    titulo: `Roteiro publicado: "${headline}"`,
    descricao: `${fmtNum(views)} views (${ratio}x a média do cliente) · estrutura: ${estrutura} · retenção hook ${retencao_hook}% · ${fmtNum(seguidores)} seguidores`,
    estrutura, hook, views, performance_ratio: ratio,
    retencao_hook, retencao_final, seguidores_ganhos, score: ratio,  // score = ratio p/ ordenação
  },
});
```

Consumo: `rankNarratives` recebe automaticamente (despeja `ctx.insights`); a regra de interpretação já foi adicionada em `agents/dados.md` (7c). Usar exatamente `client_scriptresult` faz `clientInsightBlock(ctx, ["scriptresult"])` funcionar de graça se algum dia um especialista quiser — mas por ora só o Dados consome (trade-off: o Dados é quem rankeia e orienta; espalhar resultado bruto para todos os agentes gasta contexto sem ganho claro).

---

## Passo 11 — Ordem de execução e verificação

1. Migração 0007 (aplicar no `qclvrddr` via MCP `apply_migration`, arquivo no repo como registro — padrão das 0004-0006).
2. `agents/professor.md` + `lib/pipeline/teach.ts` + `app/api/extract-learnings/route.ts` — smoke test: colar transcrição conhecida, conferir 4-8 aprendizados com dimensões válidas.
3. Actions (`saveLesson` etc.) + telas `/ensinar` (nav, lista, nova, [id]).
4. Destilação: `context.ts` merge + `taughtBlock` + injeções (agents.ts, draft.ts) + `agents/dados.md`. Verificar: criar lição global com aprendizado de hook marcante, gerar roteiro e conferir no `pipeline_trace`/comportamento que o hook seguiu o ensinado.
5. Frente A: `markPublished` + `PublishBox` + `page.tsx`.
6. ETL (link + seguidores + `client_scriptresult`): rodar `npm run etl` manualmente com 1 script publicado de teste e conferir `videos.crm_script_id`, `vm_script_performance` e a linha `client_scriptresult` em `vm_viral_insights`.
7. `npm run check` + `npm run build`; atualizar README (seção flywheel deixa de ser manual; nova seção Ensinar).

## Riscos/atenções para o implementador

- `.or(..., { foreignTable })` do supabase-js exige `!inner` no embed — testar a query do 7a isolada primeiro.
- ETL roda com service role; `videos` update é write no corpus — restringir o update a `where crm_script_id is null` (nunca sobrescrever vínculo existente).
- `pipeline_trace.narrativa_escolhida.estrutura` pode não existir em scripts antigos — payload tolera null.
- Contrato da rota `/api/transcribe-link` (já implementada): `POST {url} → {title?, text} | {error}`.

## Arquivos críticos

- `lib/pipeline/context.ts` (merge dos taught em ctx.insights — coração da destilação)
- `lib/pipeline/agents.ts` (taughtBlock + injeção por dimensão nos agentes)
- `lib/etl.ts` (vínculo URL→vídeo, seguidores, client_scriptresult)
- `lib/actions.ts` (saveLesson/setLearningActive/markPublished)
- `components/session-view.tsx` (PublishBox + chips de performance)
