# Design Brief — Viral Mind Writer (UI)

Descrição para o Claude Code desenvolver o design das telas. Baseado em scan completo do código em 2026-07-03.

## O produto

"Escritório de roteiristas virais": ferramenta interna de equipe que gera roteiros de vídeo curto otimizados para viralização, embasada em corpus de +6 mil vídeos publicados. Pipeline de 3 fases (coleta → rascunho → refino) com streaming em tempo real. Flywheel: roteiros publicados voltam como dados de performance via ETL semanal.

## Stack e restrições técnicas

- Next.js 16 (App Router) + React 19 + TypeScript.
- **Tailwind CSS v4** — tema definido via `@theme inline` em `app/globals.css`. **Não existe** `tailwind.config`.
- **Sem biblioteca de UI** (sem shadcn, Radix, lucide, cva, clsx). Ícones hoje são emojis. Se o design precisar de primitivos, considerar introduzir shadcn/ui — decisão em aberto.
- Fontes: Geist Sans (corpo) e Geist Mono, via `next/font/google` em `app/layout.tsx`.
- Sem autenticação ainda. `lang="pt-BR"` — toda a UI é em português.

## Identidade visual atual (a evoluir, não descartar)

- **Dark-only**: fundo `#0b0b0f`, texto `#ededf0`. Não há modo claro.
- Superfícies: `bg-white/5` e `bg-white/[0.03]`; bordas `border-white/10` a `/20`; texto secundário `text-white/40`–`/70`; raios `rounded-lg` a `rounded-2xl`.
- Acentos semânticos já em uso: **âmbar** = modelagem/avisos, **índigo** = cliente, **esmeralda** = sucesso, **vermelho** = erro. Botão primário = `bg-white text-black`.
- Sem logo/assets de marca — "logo" é o emoji 🧠 + wordmark "Viral Mind". `public/` só tem SVGs default do Next.
- Layout: containers centralizados `max-w-2xl`/`max-w-3xl`.
- Nav global fixo no topo (em `app/layout.tsx`): 🧠 Viral Mind · Sessões · Configurações.

## Telas existentes (redesenhar/polir)

1. **Home `/`** (`app/page.tsx` + `components/home-form.tsx`) — criação de roteiro. Textarea de prompt ("O que vamos viralizar hoje?"), select de cliente, anexos de 4 tipos (roteiro de referência 📝, notícia 📰, documento 📄, vídeo 🎬) com toggle "⚡ Modelagem", URL opcional e conteúdo. Submete → cria sessão → redireciona.
2. **Sessões `/sessions`** (`app/sessions/page.tsx`) — lista as últimas 100 sessões: data, cliente, status (rascunho/gerando/concluída/erro), prompt truncado. Cada item linka pro detalhe.
3. **Detalhe da sessão `/sessions/[id]`** (`components/session-view.tsx`) — tela mais rica. Streaming SSE com fases (coleta → modelagem → rascunho → crítica → humanização → salvando), texto ao vivo em `<pre>` com auto-scroll, abas de versões (v1, v2…), card do roteiro (Hook / Roteiro / Variações de hook / Comando), botão copiar, botão "Gerar nova versão", aviso de violações de slop-lint, e formulário de feedback (estrelas 1–5, notas, versão editada).
   - **Problema conhecido:** a desconstrução da modelagem exibe JSON cru (`JSON.stringify(analysis)`) dentro de um `<details>` — precisa de apresentação real (cards/seções legíveis do brief de replicação).
4. **Preferências de cliente `/settings/clientes`** (`components/client-prefs-editor.tsx`) — `<details>` por cliente: proibições, tom de voz, vocabulários (evitar/preferir), temas, notas de entrevista. Listas em texto multi-linha.

## Telas ausentes (schema já suporta, UI não existe)

Prioridade sugerida:

1. **Aprovar/Publicar roteiro** — `vm_generated_scripts.status` tem `generated|approved|published` mas não há UI de transição. Ao publicar, capturar o `crm_script_id` (id do vídeo no Viral Data) para fechar o flywheel. Provavelmente ações no card do roteiro no detalhe da sessão.
2. **Dashboard de performance (flywheel)** — `vm_script_performance` (views, retenção de hook, retenção final, compartilhamentos, seguidores ganhos) e `vm_viral_insights` (top hooks, elementos vencedores, pacing, regras de retenção) existem no banco e nenhuma tela os mostra. É a tela de maior valor novo.
3. **Gestão de playbooks** — `vm_playbooks` (slug: hook/storytelling/comando/style_guide, markdown versionado, flag active). Hoje editado direto no banco.
4. **Gestão de frases banidas (slop-lint)** — `vm_banned_phrases` (regex, label, severity block/warn, active).
5. **Clientes** — só há edição de preferências; não há criação/listagem CRUD de `clients`.
6. **Login** — sem autenticação ainda (pendência conhecida).

## Lacunas de polimento transversais

- Nenhum componente atômico reutilizável (Button/Input/Card) — cada tela repete classes Tailwind. Extrair primitivos ao redesenhar.
- Sem loading states/skeletons de rota, sem 404/página de erro custom.
- Responsividade não foi pensada — layout centralizado simples; validar mobile.
- Estados vazios (sem sessões, sem clientes, sem anexos) não têm tratamento visual.

## Dados por tela (referência rápida)

| Tabela | Campos relevantes para UI |
|---|---|
| `vm_sessions` | prompt, status, error_message, cliente, created_at |
| `vm_attachments` | kind, is_modelagem, url, raw_content |
| `vm_modelagem_analyses` | analysis (jsonb), replication_brief (texto) |
| `vm_generated_scripts` | version, hook, hook_variants, roteiro, comando, slop_lint_violations, status |
| `vm_script_feedback` | rating 1–5, notes, edited_version |
| `vm_script_performance` | views, retencao_hook, retencao_final, compartilhamentos, seguidores_ganhos |
| `vm_viral_insights` | insight_type, payload (jsonb) |
| `vm_playbooks` | slug, version, content (md), active |
| `vm_banned_phrases` | pattern (regex), label, severity, active |
| `vm_client_preferences` | proibicoes[], tom_de_voz, temas[], vocabularios[], notas_entrevista |

## Direção de design sugerida

- Manter o dark elegante atual (quase-preto + white/alpha) como base; formalizar em tokens no `@theme` do `globals.css` (cores semânticas: surface, border, muted, accent-modelagem, success, danger).
- Substituir emojis por ícones consistentes (ex.: lucide) se um design system for introduzido.
- A tela de streaming é o coração do produto — o design deve tornar as fases do pipeline visíveis e satisfatórias de acompanhar (stepper de fases, texto ao vivo, transição suave para o roteiro final).
- O roteiro final é o artefato de valor: o card Hook/Roteiro/Variações/Comando merece hierarquia tipográfica forte e ação de copiar por seção.
