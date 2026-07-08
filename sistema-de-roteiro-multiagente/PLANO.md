# Reforma: Sala de Roteiristas Multiagente

> **STATUS: IMPLEMENTADO E VERIFICADO** (07/07/2026) — e2e real: 3 candidatas de
> macrogrupos distintos, ranking por dados, roteiro 322 palavras, hook + 3 variantes,
> comando com benefício, fontes, 0 travessões, 0 slop, artifacts cacheados.
> Correções sobre o plano original: (1) roteirista escreve só o CORPO (hook do
> especialista não fica obsoleto); (2) agente Dados = 1 chamada (ranking+orientações);
> (3) guardas anti-truncamento na revisão/humanização (reescrita sem formato não
> substitui o roteiro); (4) travessão: tolerância zero no lint; (5) Live Search da xAI
> foi descontinuada → usar `/v1/responses` + `tools:[{type:"web_search"}]`.

Objetivo: transformar o pipeline linear atual (um escritor com tudo no colo) numa
**sala de agentes especialistas que raciocinam separados e negociam** antes do roteiro
final. A lógica vira uma skill `/goal` que o fable5 executa; o app Next.js continua a UI.

## Princípio de arquitetura (a decisão que evita over-engineering)

**Prompt de cada agente = dado (arquivo markdown). Fiação do grafo = código simples.**

- Cada agente é um arquivo em `agents/*.md` (papel, entradas, saída esperada, playbook que lê).
- O grafo tem 6 nós fixos — é escrito como `await`s sequenciais/paralelos em
  `lib/pipeline/orchestrator.ts`, **não** um motor genérico de DAG (YAGNI até haver ~10 agentes).
- Adicionar agente futuro = novo arquivo `agents/x.md` + uma linha no grafo. Sem engine.
- **Fonte única de verdade**: os `agents/*.md` são consumidos por DOIS executores:
  - **App** (`orchestrator.ts`): roda o grafo em TS, agentes = chamadas fable5/sonnet + Grok API.
  - **`/goal`** (`.claude/skills/goal/`): fable5 roda o mesmo protocolo no Claude Code,
    usando as ferramentas nativas (Supabase MCP, WebSearch/firecrawl) no lugar das chamadas de API.

## O grafo (DAG com 1 negociação)

```
tema + cliente + anexos
      │
      ├──▶ [1 Pesquisador/Grok] ─┐  (paralelo)
      └──▶ [2 Dados: carga corpus]┘
                    │  dossiê + padrões de sucesso
                    ▼
        [3 Storytelling] propõe 2-3 narrativas candidatas
                    │
                    ▼
        [2 Dados] pontua/rankeia as narrativas    ◀── ÚNICA NEGOCIAÇÃO
                    │      (por potencial viral, base histórica)
                    ▼
        escolhe narrativa vencedora  (automático; usuário pode sobrescrever na UI)
                    │
     (se anexo modelagem: injeta arquitetura-modelo aqui — reusa modelagem.ts)
                    ▼
        [4 Roteirista-chefe] escreve o roteiro   ◀── narrativa+pesquisa+dados+estilo+prefs
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     [5 Hook]             [6 Comando]
   vê roteiro final +
   narrativa + dados
   de hook vencedor
          └─────────┬─────────┘
                    ▼
        [7 Revisão multi-chapéu]  (opcional: 1 volta ao roteirista se reprovar)
                    ▼
        [8 Humanizador] SEM travessões + slop-lint determinístico
                    ▼
               roteiro final
```

Resolve a tensão do hook que você levantou: a narrativa vencedora é escolhida **primeiro**
(já com potencial de atenção/views em mente, pontuado pelos dados); o roteiro é escrito
sobre ela; o hook é projetado **depois**, vendo o roteiro pronto + a narrativa + o que os
dados dizem sobre hooks que ganham. Feedback opcional e limitado: se o Hook achar que a
abertura do roteiro não sustenta um hook forte, pede **um** ajuste de 1 linha no primeiro beat.

## Roster de agentes

| # | Agente | Lê / usa | Entrega | Modelo | Estado |
|---|--------|----------|---------|--------|--------|
| 1 | Pesquisador | Grok API (busca em tempo real X/web) | dossiê: fatos, números, eventos recentes, tensões, ângulos, fontes datadas | grok-4.3 (xAI) | **novo** |
| 2 | Dados | corpus (`match_documents`), `vm_viral_insights`, `vm_script_performance`, few-shot | (a) padrões de sucesso; (b) ranking das narrativas c/ justificativa; (c) dicas de hook/estrutura por cliente | sonnet-5 | **novo** (hoje é só um blob no contexto) |
| 3 | Storytelling | `playbooks/storytelling.md` (14 estruturas) + dossiê | 2-3 narrativas candidatas {estrutura, personagem, conflito, mecanismo emocional, beats, porquê} | sonnet-5 | **novo** |
| 4 | Roteirista-chefe | narrativa vencedora + tudo acima + `style_guide` + prefs | roteiro completo (corpo) | fable-5 | reusa `draft.ts` |
| 5 | Hook | roteiro final + narrativa + dados de hook + `playbooks/hook.md` | hook + 3 variações | fable-5 | **novo** (hoje é extraído) |
| 6 | Comando | roteiro + `playbooks/comando.md` + prefs | CTA com benefício explícito | fable-5 | **novo** (hoje é extraído) |
| 7 | Revisão | `playbooks/checklist.md` + todos os playbooks | reprova/aprova por chapéu; devolve correções | sonnet-5 | reusa `critique.ts` |
| 8 | Humanizador | `style_guide` + refs de voz + `vm_banned_phrases` | texto natural, sem travessões | fable-5 | reusa `humanize.ts` |

## O que reaproveita vs. novo

**Reusa quase intacto:** `context.ts` (carga de dados vira insumo do agente Dados),
`modelagem.ts`, `humanize.ts`, `slop-lint.ts`, schema `vm_*`, `pipeline_trace`, o streaming SSE.

**Novo:**
- `lib/grok.ts` — cliente xAI. Reusa o SDK `openai` já instalado:
  `new OpenAI({ baseURL: "https://api.x.ai/v1", apiKey: process.env.GROK_API_KEY })`,
  modelo `grok-4.3` (env `VM_RESEARCH_MODEL`) com Live Search. Sem dependência nova.
  (Confirmar o parâmetro exato de busca da xAI no build.)
- `agents/*.md` — 8 papéis (fonte única de verdade).
- `lib/pipeline/orchestrator.ts` — o grafo acima, substitui `index.ts`. Emite eventos por agente.
- `.claude/skills/goal/SKILL.md` — a skill `/goal <tema>` que roda o mesmo protocolo no Claude Code.
- Tipos de contrato entre agentes em `types.ts` (Dossie, NarrativaCandidata[], RankingDados, ...).

**Aposenta:** a fase única `rascunho` que fazia tudo; a extração de hook/comando por regex do texto.

## UX — a sala visível

O stepper de fases vira um **painel de agentes** que acende conforme cada um trabalha.
Peça central e novo momento de UX: **o card de narrativas**.

- **Pesquisa** — dossiê recolhível com fontes datadas.
- **Narrativas candidatas** — 2-3 cards lado a lado; a vencedora destacada, mostrando o
  **score dos dados e o porquê**. Usuário pode clicar em outra narrativa pra sobrescrever a
  escolha (human-in-the-loop opcional; se não tocar, segue automático). É aqui que a "conversa"
  entre Storytelling e Dados fica transparente e sob controle.
- **Roteiro** — streaming ao vivo, como hoje.
- **Hook + variações**, **Comando**, **notas de revisão**, **final humanizado** — seções como hoje.

Input principal continua a caixa de tema + cliente + materiais de apoio (já existem).

## Passos de implementação (ordem)

1. `XAI_API_KEY` no `.env.local` + `lib/grok.ts` + smoke test de 1 chamada.
2. `agents/*.md` — escrever os 8 papéis (extrair do que já está espalhado em `draft.ts`/`critique.ts`).
3. `types.ts` — contratos estruturados entre agentes (structured output / tool calls por agente).
4. `orchestrator.ts` — montar o grafo reusando `context.ts`/`modelagem.ts`/`humanize.ts`.
   Emitir evento por agente + ponto de pausa opcional na escolha de narrativa.
5. UI — `session-view.tsx`: painel de agentes + card de narrativas com override.
6. `.claude/skills/goal/SKILL.md` — espelhar o protocolo usando Supabase MCP + WebSearch.
7. Flywheel: gravar narrativa escolhida + trace completo em `pipeline_trace` (já existe a coluna).

## Pendências herdadas que este plano NÃO resolve (ficam pra depois)

- Autenticação (README já marca).
- Transcrição automática de links.
- Backfill de embeddings do corpus (melhora o agente Dados).
