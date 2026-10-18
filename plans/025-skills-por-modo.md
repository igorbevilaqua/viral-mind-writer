# Plano 025: Skills por modo de roteiro (18/10/2026)

> **Para agentes:** execute task a task (superpowers:subagent-driven-development, recomendado, ou superpowers:executing-plans). Os passos usam checkbox (`- [ ]`). Cada task termina com o gate verde e um commit local. **Nunca faça push**: push na main é deploy (AGENTS.md §2).

**Objetivo:** trocar o caminho único de geração por quatro skills de modo (história, mecanismo, demonstração, panorama), cada uma com a própria pesquisa, prova, estrutura, abertura, fecho, revisão, tamanho e exemplos, mais uma camada comum de clareza e precisão e um perfil por cliente.

**Arquitetura:** o esqueleto da sala continua igual (premissa, pesquisa, narrativas, ranking, hook, roteiro, revisão, humanização). Uma skill é um arquivo `skills/<skill>.md` com uma seção por agente; o agente de cada fase recebe só a sua seção, por um bloco único (`skillBlock`). A skill da sessão é escolhida pelo usuário ou sugerida por um agente depois da premissa e antes da pesquisa. Os exemplos de voz passam a vir da mesma skill, a partir dos rótulos de modo dos roteiros da casa (`vm_roteiro_modo`).

**Stack:** Next.js 16, TypeScript, Supabase (projeto Viral Data), Anthropic SDK, vitest.

**Evidência:** `docs/estudo-modos-2026-10/RELATORIO.md` (doc publicado: https://claude.ai/artifact/PjeDkAait2pvta1fQy3Cf2). Livro de códigos dos modos: `docs/estudo-modos-2026-10/codebook.md`. Correções do time por alcance: `docs/estudo-modos-2026-10/achados_correcoes.md`.

## Restrições globais

- Push na main = produção. Commits locais só; release é decisão do Igor.
- Gate antes de cada commit: `npx tsc --noEmit && npx eslint . && npm run check && npm test`.
- Prompts vivem em arquivo (`agents/*.md`, `skills/*.md`), nunca inline no código.
- Nenhum travessão (— ou –) em prompt, skill ou texto entregue.
- Comentário curto em PT-BR dizendo o porquê.
- Chamada com tool usa `toolInput`/`toolArray`; com thinking, `max_tokens` ≥ 4000.
- Migration nova é aplicada pelo operador via Supabase MCP ANTES do deploy do código que a lê.
- Lote que chama a API Anthropic (banco de prova, classificação em massa) gasta o mesmo saldo da produção: estimar custo e confirmar com o Igor antes de rodar; parar tudo se aparecer "credit balance is too low".
- Nenhuma mudança de prompt sobe sem banco de prova (plano 024, P5).
- Não aumentar a banlist; recurso de escrita entra como função, nunca como frase pronta (lição do plano 024, §9).

## O que já está pronto neste branch (`plano-025-skills-modo`)

- `skills/historia.md`, `skills/mecanismo.md`, `skills/demonstracao.md`, `skills/panorama.md`: o conteúdo das quatro skills, oito seções cada (`quando`, `pesquisa`, `narrativas`, `dados`, `hook`, `roteiro`, `revisao`, `comando`), com os números medidos na casa.
- `agents/escolha-skill.md`: o agente que sugere a skill quando o usuário deixa no automático.
- `agents/classificador-modo.md`: o classificador de modo dos roteiros novos da casa (o mesmo procedimento do estudo).
- `docs/estudo-modos-2026-10/`: estudo, rótulos e scripts. `dados/roteiro_modo_seed.jsonl` (2.832 rótulos com cliente), `dados/modo_por_cliente.json` (mix e lift por cliente), `dados/correcoes_rotuladas.json` (156 aprendizados com alcance).

O Igor revisa o texto das skills antes da Task 6 (é o que os agentes vão ler).

## Relação com o plano 024

- A Onda 2 do 024 está no ar (hook primeiro, few-shot da casa, doutrina de clareza, revisor por edição, humanizador cirúrgico). O 025 se apoia nela e não a desfaz.
- O item 2.3 do 024 (storytelling com esqueleto causal) fica resolvido pela seção `narrativas` de cada skill: estruturas que rendem e que evitar, medidas dentro do modo.
- O banco de prova do 024 (`scripts/bancada.ts`, `bancada-placar.ts`, juiz calibrado) é a régua da Task 12.
- 4.1 (ligar roteiro do Codex ao vídeo publicado) e 4.4 (religar a coleta de retenção, parada em 14/09) continuam pendentes e são pré-requisito da medição no mundo (Task 13).

## Decisões em aberto (Igor)

1. ~~Contradição "Agora vem a parte..."~~ **Decidido (Igor, 18/10/2026): pode usar quando houver uma virada forte.** Anúncio vazio continua proibido; anúncio de virada forte é permitido, como já dizem `agents/roteirista.md` l.19 e `agents/humanizador.md` l.9 ("antecipação só se paga quando abre curiosidade real e grande"). Na execução: reescrever a lição ativa 78361ea0 com essa exceção (hoje ela manda cortar sem ressalva) e absorver o 928a9453 como exemplo de virada forte na camada comum, não numa skill só.
2. Conselho e publi ficam sem skill (conselho derruba alcance; publi depende do briefing da oferta). Pautas desses tipos caem na skill mais próxima. **Aprovado (Igor, 18/10/2026).**
3. **Execução (Igor, 18/10/2026):** um agente novo por task, com revisão entre uma e outra.
4. **Banco de prova em duas etapas (Igor, 18/10/2026):** antes do completo, um piloto de ~US$ 30 (8 pautas h*, 2 por modo, braços A e S) sobre uma versão enxuta (Tasks 1, 2 e 6: skill escolhida na mão, seção chega a cada agente). Só se o piloto for bem seguem as demais tasks e o banco completo, que reaproveita as 8 e roda as outras 33 (~US$ 115). Cada rodada paga só com o OK do Igor na hora.
5. **Feito em 18/10/2026 (docs/estudo-hooks-2026-10/REFILTRO.md, aplicado em agents/hook.md e nas seções de hook das skills). Para a Task 9 (perfil do cliente): "de X a império" e nostalgia de marca dependem do nicho/cliente (hooks_5 §2). Antes do piloto:** refiltrar o estudo de hooks (docs/estudo-hooks-2026-10) só com roteiro da casa e por modo, e atualizar camada comum e seções de hook das skills com o que se sustentar.
6. **Candidata, fora da versão enxuta (Igor, 18/10/2026): pesquisa dirigida no meio da geração.** Hoje a pesquisa roda uma vez, antes das narrativas; hook e roteirista não pedem mais material. A ideia: o agente de hook sinaliza "falta fato mais forte para abrir" → uma busca curta e focada com `grokPesquisa` (lib/pipeline/grok-search.ts, a mesma do Bob) → hook refeito. Teto de 1 busca extra por roteiro. Só entra se o piloto mostrar hook fraco por falta de material (e não por outra causa).

---

## Mapa de arquivos

| arquivo | responsabilidade | task |
|---|---|---|
| `lib/skills-catalogo.ts` (novo) | lista das skills, nomes e tipo; puro, serve tela e servidor | 1 |
| `lib/pipeline/skills.ts` (novo) | lê `skills/*.md`, extrai a seção, monta o bloco do agente | 1 |
| `agents/roteirista.md`, `hook.md`, `storytelling.md`, `dados.md`, `pesquisador.md`, `revisao.md`, `comando.md` | camada comum: o que vale em qualquer skill e a precedência da skill | 2 |
| `supabase/migrations/0051_roteiro_modo.sql` … `0054_licao_alcance.sql` (novos) | tabela de modos, skill da sessão, perfil do cliente, alcance da lição | 3 |
| `lib/pipeline/types.ts`, `lib/pipeline/context.ts` | `skill` no contexto, perfil e alcance carregados | 3 |
| `lib/pipeline/modo-roteiro.ts` (novo), `scripts/seed-roteiro-modo.ts` (novo) | rótulos de modo: mix do cliente, modo de cada roteiro, carga inicial | 4 |
| `lib/pipeline/escolher-skill.ts` (novo), `lib/pipeline/index.ts` | sugestão automática da skill e o lugar dela no pipeline | 5 |
| `lib/pipeline/agents.ts`, `lib/pipeline/draft.ts`, `lib/pipeline/piso.ts` | a seção da skill chega a cada agente; tamanho e piso por skill | 6 |
| `lib/pipeline/context.ts`, `lib/pipeline/few-shot.ts` | exemplos de voz da mesma skill | 7 |
| `scripts/triar-licoes.ts` (novo), `lib/pipeline/agents.ts`, `lib/pipeline/destinatarios.ts`, `app/ensinar/[id]/page.tsx`, `components/lesson-view.tsx` | alcance das 156 lições, roteamento por skill | 8 |
| `scripts/gerar-perfis.ts` (novo), `lib/perfil-cliente.ts` (novo), `lib/pipeline/draft.ts`, `lib/actions.ts`, `components/client-prefs-editor.tsx` | perfil do cliente | 9 |
| `lib/actions.ts`, `components/home-form.tsx`, `components/session-view.tsx` | seletor na home, skill na sessão, troca de skill | 10 |
| `lib/pipeline/modo-roteiro.ts`, `lib/etl.ts` | classificação semanal dos roteiros novos da casa | 11 |
| `scripts/bancada.ts`, `scripts/bancada-modo.ts` (novo) | banco de prova com skill e fidelidade de modo | 12 |
| `plans/README.md`, `codex-updates/` | status e mensagem de update | 13 |

---

### Task 1: catálogo e leitura das skills

**Arquivos:**
- Criar: `lib/skills-catalogo.ts`
- Criar: `lib/pipeline/skills.ts`
- Teste: `tests/skills.test.ts`

**Interfaces:**
- Produz: `SKILLS`, `type Skill`, `NOME_SKILL`, `ehSkill(v)` em `lib/skills-catalogo.ts`; `SECOES`, `type SecaoSkill`, `textoDaSkill(s)`, `secaoDaSkill(s, secao)`, `resumoDaSkill(s)`, `skillBlock(ctx, secao)`, `quandoDasSkills()` em `lib/pipeline/skills.ts`.

O catálogo fica fora de `lib/pipeline/skills.ts` porque este lê disco (`node:fs`), e a home é componente de cliente: importar `fs` no bundle do navegador quebra o build. Mesmo desenho de `lib/llm-catalogo.ts`.

- [x] **Passo 1: escrever o teste que falha**

```ts
// tests/skills.test.ts
import { describe, expect, test } from "vitest";
import { ehSkill, SKILLS } from "@/lib/skills-catalogo";
import { quandoDasSkills, secaoDaSkill, SECOES, skillBlock, textoDaSkill } from "@/lib/pipeline/skills";

describe("skills por modo (plano 025)", () => {
  test.each(SKILLS)("%s tem as 8 seções, todas com texto", (s) => {
    for (const secao of SECOES) expect(secaoDaSkill(s, secao).length, `${s}/${secao}`).toBeGreaterThan(80);
  });

  test.each(SKILLS)("%s não tem travessão (regra do produto)", (s) => {
    expect(textoDaSkill(s)).not.toMatch(/[—–]/);
  });

  test("sem skill na sessão, nenhum bloco", () => {
    expect(skillBlock({ skill: null }, "roteiro")).toBe("");
  });

  test("o bloco traz o resumo medido e só a seção pedida", () => {
    const b = skillBlock({ skill: "historia" }, "hook");
    expect(b).toContain("SKILL DO ROTEIRO: HISTÓRIA");
    expect(b).toContain("retenção final");
    expect(b).toContain(secaoDaSkill("historia", "hook").slice(0, 40));
    expect(b).not.toContain(secaoDaSkill("historia", "roteiro").slice(0, 40));
  });

  test("ehSkill aceita só as quatro", () => {
    expect(ehSkill("panorama")).toBe(true);
    expect(ehSkill("conselho")).toBe(false);
    expect(ehSkill(null)).toBe(false);
  });

  test("o quando das quatro vai junto para a escolha automática", () => {
    const q = quandoDasSkills();
    for (const s of SKILLS) expect(q).toContain(`(${s})`);
  });
});
```

- [x] **Passo 2: rodar e ver falhar**

Rodar: `npx vitest run tests/skills.test.ts`
Esperado: FAIL, "Cannot find module '@/lib/skills-catalogo'".

- [x] **Passo 3: implementar**

```ts
// lib/skills-catalogo.ts
// As quatro skills de modo (plano 025). Puro de propósito: a home (componente de cliente) e o
// servidor leem a mesma lista; o texto das skills fica em skills/*.md e só o servidor lê.
// Conselho e publi existem como modo da casa (vm_roteiro_modo), mas não como skill: conselho
// derruba alcance e publi depende do briefing da oferta (docs/estudo-modos-2026-10).
export const SKILLS = ["historia", "mecanismo", "demonstracao", "panorama"] as const;
export type Skill = (typeof SKILLS)[number];

export const NOME_SKILL: Record<Skill, string> = {
  historia: "História",
  mecanismo: "Mecanismo",
  demonstracao: "Demonstração",
  panorama: "Panorama",
};

// Uma linha para o title do seletor: a pessoa reconhece o modo sem abrir o arquivo.
export const DICA_SKILL: Record<Skill, string> = {
  historia: "o que aconteceu com alguém, no tempo; segura até o fim",
  mecanismo: "explica por dentro como um caso, regra ou negócio funciona",
  demonstracao: "mostra uma coisa funcionando; a mais compartilhada",
  panorama: "prova uma tendência com dados de várias fontes; gera comentário",
};

export const ehSkill = (v: unknown): v is Skill => typeof v === "string" && (SKILLS as readonly string[]).includes(v);
```

```ts
// lib/pipeline/skills.ts
import fs from "node:fs";
import path from "node:path";
import { NOME_SKILL, SKILLS, type Skill } from "../skills-catalogo";
import type { GenerationContext } from "./types";

// Cada skill é um arquivo com uma seção "## <secao>" por agente: o agente recebe só a dele.
export const SECOES = ["quando", "pesquisa", "narrativas", "dados", "hook", "roteiro", "revisao", "comando"] as const;
export type SecaoSkill = (typeof SECOES)[number];

const cache = new Map<Skill, string>();
// Lê as quatro na primeira chamada: o deploy da Hostinger apaga a pasta da versão antiga com o
// processo rodando, e a geração no meio morreria no primeiro arquivo ainda não lido (o mesmo
// motivo de agentPrompt, sessão 43495956).
export function textoDaSkill(skill: Skill): string {
  if (!cache.size) for (const s of SKILLS) cache.set(s, fs.readFileSync(path.join(process.cwd(), "skills", `${s}.md`), "utf8"));
  return cache.get(skill) ?? "";
}

const partes = (skill: Skill) => textoDaSkill(skill).split(/\n(?=## )/);

export function secaoDaSkill(skill: Skill, secao: SecaoSkill): string {
  const alvo = partes(skill).find((p) => p.startsWith(`## ${secao}\n`));
  return alvo ? alvo.slice(`## ${secao}\n`.length).trim() : "";
}

// O cabeçalho do arquivo (antes da primeira seção) é o resumo medido: força e fraqueza do modo.
// Vai em todo bloco porque é ele que diz ao agente o que a seção dele precisa compensar.
export function resumoDaSkill(skill: Skill): string {
  return (partes(skill)[0] ?? "").replace(/^# .*\n/, "").trim();
}

export function skillBlock(ctx: Pick<GenerationContext, "skill">, secao: SecaoSkill): string {
  if (!ctx.skill) return "";
  const s = secaoDaSkill(ctx.skill, secao);
  if (!s) return "";
  return `# SKILL DO ROTEIRO: ${NOME_SKILL[ctx.skill].toUpperCase()}\n${resumoDaSkill(ctx.skill)}\n\n## O que esta skill pede de você\n${s}`;
}

// As quatro definições juntas: é a régua do agente que sugere a skill (escolher-skill.ts).
export function quandoDasSkills(): string {
  return SKILLS.map((s) => `## ${NOME_SKILL[s]} (${s})\n${secaoDaSkill(s, "quando")}`).join("\n\n");
}
```

`skillBlock` recebe `Pick<GenerationContext, "skill">`, e o campo `skill` só existe no tipo depois da Task 3. Para esta task compilar sozinha, adicione já em `lib/pipeline/types.ts`, dentro de `GenerationContext`, logo abaixo de `premissaContraintuitivo?`:

```ts
  // Plano 025: a skill de modo desta sessão. null = caminho único (sessão anterior ao 025, ou a
  // escolha automática falhou): nenhum agente recebe bloco de skill.
  skill: import("../skills-catalogo").Skill | null;
  skillOrigem: "escolhida" | "sugerida" | null;
  skillMotivo?: string;
```

e preencha `skill: null, skillOrigem: null` nos três construtores de contexto em `lib/pipeline/context.ts` (`loadContext`, `loadContextAvulso`, `loadContextBancada`; a Task 3 troca o de `loadContext` pela leitura da coluna).

- [x] **Passo 4: rodar e ver passar**

Rodar: `npx vitest run tests/skills.test.ts`
Esperado: PASS (11 testes).

- [x] **Passo 5: gate e commit**

```bash
npx tsc --noEmit && npx eslint . && npm run check && npm test
git add lib/skills-catalogo.ts lib/pipeline/skills.ts lib/pipeline/types.ts lib/pipeline/context.ts tests/skills.test.ts skills/
git commit -F- <<'EOF'
feat(skills): as quatro skills de modo e o bloco que leva cada secao ao seu agente

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 2: camada comum nos prompts dos agentes

O que vale em qualquer skill fica nos `agents/*.md`; o que muda por modo sai deles e passa a viver na skill. Cada prompt ganha uma linha de precedência: quando a SKILL DO ROTEIRO vem no contexto, ela decide o que é do modo.

**Arquivos:**
- Modificar: `agents/roteirista.md`, `agents/hook.md`, `agents/storytelling.md`, `agents/dados.md`, `agents/pesquisador.md`, `agents/revisao.md`, `agents/comando.md`
- Teste: `tests/camada-comum.test.ts`

- [x] **Passo 1: teste que falha**

```ts
// tests/camada-comum.test.ts
import { expect, test } from "vitest";
import { agentPrompt } from "@/lib/pipeline/agents";

test.each(["roteirista", "hook", "storytelling", "dados", "pesquisador", "revisao", "comando"])(
  "%s sabe que a SKILL DO ROTEIRO decide o que é do modo",
  (agente) => expect(agentPrompt(agente)).toContain("SKILL DO ROTEIRO")
);

test("a camada comum do roteirista tem a regra de precisão que resolve as contradições de impacto", () => {
  const p = agentPrompt("roteirista");
  expect(p).toContain("Impacto com lastro");
  expect(p).toContain("O material do usuário entra");
});

test("o tamanho e o orçamento de números deixaram de ser regra única", () => {
  const p = agentPrompt("roteirista");
  expect(p).toContain("o da seção roteiro da SKILL DO ROTEIRO");
  expect(p).not.toMatch(/Tamanho-alvo: o roteiro inteiro falado/);
});
```

- [x] **Passo 2: rodar e ver falhar.** `npx vitest run tests/camada-comum.test.ts` → FAIL.

- [x] **Passo 3: editar os prompts**

`agents/roteirista.md`, logo abaixo do título `## Regras`, inserir a linha:

```markdown
Quando o contexto traz a SKILL DO ROTEIRO, ela decide a prova, o avanço do corpo, o tamanho e o fecho. As regras desta página valem em qualquer skill.
```

Trocar o item que começa por `- Tamanho-alvo: o roteiro inteiro falado` inteiro por:

```markdown
- Tamanho: o da seção roteiro da SKILL DO ROTEIRO. Sem skill no contexto, o roteiro inteiro falado (hook + corpo + comando) fica entre 420 e 500 palavras e o corpo entre 370 e 430. Abaixo de 350 palavras no total qualquer roteiro rende menos.
```

Trocar o item que começa por `- Feche o corpo pelo PLAYBOOK DE CONCLUSÃO` por:

```markdown
- Feche o corpo no caso, nunca numa moral: o fecho de cada modo está na SKILL DO ROTEIRO e vence o PLAYBOOK DE CONCLUSÃO em conflito. Termine no objeto central da história (o produto, o número, o lugar) e retome palavras do hook.
```

No item `**Número só com função**`, trocar a última frase (`Os roteiros da casa que mais viralizam usam menos de 2 números a cada 100 palavras.`) por:

```markdown
O orçamento de números é o da SKILL DO ROTEIRO; sem skill, menos de 2 a cada 100 palavras.
```

Trocar o item `**Um rosto.**` por:

```markdown
- **Um rosto, quando o modo pede.** Em história, mecanismo e demonstração um nome carrega o fio (a pessoa, a empresa, a coisa); em panorama, os exemplos nominais fazem esse papel. Massa de eventos e números sem rosto não emociona.
```

E acrescentar, no fim da seção `## Clareza e fluxo`:

```markdown
- **Impacto com lastro.** Superlativo, alarme e cadeia de causa entram quando o dossiê traz fonte, data e número para eles. Hipótese é dita como hipótese, negócio condicional não vira fechado, linha do tempo não se comprime. O impacto que a fonte não banca vira a afirmação menor que ela banca.
- **O material do usuário entra.** O que o usuário colou ou pediu na pauta (um caso, um dado, uma frase) aparece na narrativa. Cortar o que ele trouxe é o erro que mais gera retrabalho.
```

`agents/hook.md`, no fim de `## Sua posição na sala (importante)`:

```markdown
Quando o contexto traz a SKILL DO ROTEIRO, a abertura do modo diz que tipo de fato estranho vai na primeira frase: o protagonista nomeado em história, o fato absurdo do caso em mecanismo, o efeito da coisa em demonstração, o estado do mundo em panorama. O resto desta página continua valendo.
```

`agents/storytelling.md`, no fim de `## Regras`:

```markdown
- Se receber a SKILL DO ROTEIRO, as candidatas usam as estruturas que ela recomenda, evitam as que ela desaconselha e seguem a forma de beats dela. A diversidade entre candidatas fica dentro do modo.
```

`agents/dados.md`, no fim de `## Regras`:

```markdown
- Se receber a SKILL DO ROTEIRO, os critérios de ranking dela (payoff e estrutura medidos dentro do modo) são evidência primária, ao lado dos insights do cliente.
```

`agents/pesquisador.md`, no fim de `## Regras invioláveis`:

```markdown
- Quando a entrada traz a SKILL DO ROTEIRO, a lista do que buscar dela vem antes das seções padrão do dossiê: é o material que esse modo usa como prova.
```

`agents/revisao.md`, no fim do arquivo:

```markdown
Se o contexto traz a SKILL DO ROTEIRO, o checklist dela soma-se ao eliminatório do playbook. Desvio de modo (a peça virou outro modo) vai na lista de problemas e não se corrige com edição.
```

`agents/comando.md`, no fim de `## Regras`:

```markdown
- Se receber a SKILL DO ROTEIRO, siga o pedido que ela indica para o registro deste roteiro.
```

- [x] **Passo 4: rodar e ver passar.** `npx vitest run tests/camada-comum.test.ts tests/agent-prompt.test.ts` → PASS.

- [x] **Passo 5: gate e commit** (`feat(skills): camada comum nos prompts e precedencia da skill`).

---

### Task 3: migrations, tipos e contexto

**Arquivos:**
- Criar: `supabase/migrations/0051_roteiro_modo.sql`, `0052_skill_da_sessao.sql`, `0053_perfil_cliente.sql`, `0054_licao_alcance.sql`
- Modificar: `lib/pipeline/types.ts`, `lib/pipeline/destinatarios.ts`, `lib/pipeline/context.ts`
- Teste: `tests/contexto-skill.test.ts`

**Interfaces:**
- Produz: `ctx.skill`, `ctx.skillOrigem` lidos de `vm_sessions`; `ClientPrefs.perfil: string | null`; `TaughtPayload.alcance?: string | null`, `TaughtPayload.skills?: string[] | null`.

- [ ] **Passo 1: as migrations**

```sql
-- supabase/migrations/0051_roteiro_modo.sql
-- Plano 025: o modo de cada roteiro escrito pela casa. Carga inicial = estudo de modos de out/2026
-- (2.832 roteiros, kappa 0,91 entre rotuladores); daqui pra frente o ETL classifica os novos.
-- Alimenta os exemplos de voz de cada skill e o mix de modos do cliente.
create table if not exists public.vm_roteiro_modo (
  crm_script_id uuid primary key,
  cliente_id uuid,
  modo text not null check (modo in ('historia','mecanismo','demonstracao','panorama','conselho','publi','misto')),
  ancora text check (ancora in ('noticia','passado','atemporal')),
  registro text check (registro in ('analitico','emotivo')),
  confianca text check (confianca in ('alta','media','baixa')),
  origem text not null default 'estudo-2026-10',
  created_at timestamptz not null default now()
);
create index if not exists vm_roteiro_modo_cliente on public.vm_roteiro_modo (cliente_id, modo);
create index if not exists vm_roteiro_modo_modo on public.vm_roteiro_modo (modo);
comment on table public.vm_roteiro_modo is
  'Modo de cada roteiro VM (crm.scripts.id). Livro de códigos: docs/estudo-modos-2026-10/codebook.md.';
```

```sql
-- supabase/migrations/0052_skill_da_sessao.sql
-- Plano 025: a skill de modo da sessão. NULL é resposta, não buraco: sessão anterior ao 025, ou
-- escolha automática que falhou. Nos dois casos o pipeline segue o caminho único.
alter table public.vm_sessions add column if not exists skill text
  check (skill in ('historia','mecanismo','demonstracao','panorama'));
alter table public.vm_sessions add column if not exists skill_origem text
  check (skill_origem in ('escolhida','sugerida'));
```

```sql
-- supabase/migrations/0053_perfil_cliente.sql
-- Plano 025: o perfil do cliente, um texto que o time lê e edita. Gerado por scripts/gerar-perfis.ts
-- a partir do estudo de modos, do estudo de outubro e das correções do time; entra em todo agente
-- que já recebe as preferências do cliente.
alter table public.vm_client_preferences add column if not exists perfil text;
```

```sql
-- supabase/migrations/0054_licao_alcance.sql
-- Plano 025: a triagem das lições. alcance diz se a regra vale em qualquer roteiro, num modo, num
-- cliente, numa pauta ou num caso só; skills diz em que modos ela vale quando é de modo;
-- absorvida_em diz onde o texto da regra já mora (camada comum, skill, perfil), para o /ensinar
-- não pedir para ativar o que já está no prompt.
alter table public.vm_lesson_learnings add column if not exists alcance text
  check (alcance in ('universal','modo','cliente','pauta','caso'));
alter table public.vm_lesson_learnings add column if not exists skills text[];
alter table public.vm_lesson_learnings add column if not exists absorvida_em text;
```

**STOP:** o código das Tasks 3 a 11 lê essas colunas. Elas são aplicadas no banco (operador, via MCP) antes de qualquer deploy deste branch; aplicar antes não quebra nada da produção atual, porque só acrescenta colunas e uma tabela.

- [ ] **Passo 2: tipos**

Em `lib/pipeline/types.ts`, `ClientPrefs` ganha `perfil: string | null;` depois de `notas_entrevista`. Em `lib/pipeline/destinatarios.ts`, `TaughtPayload` ganha:

```ts
  // Plano 025: triagem da lição. Lição de alcance "modo" só entra nas skills listadas.
  alcance?: string | null;
  skills?: string[] | null;
```

- [ ] **Passo 3: teste que falha**

```ts
// tests/contexto-skill.test.ts
import { expect, test } from "vitest";
import { skillDaSessao } from "@/lib/pipeline/context";

test("coluna inválida ou vazia vira caminho único", () => {
  expect(skillDaSessao({ skill: null, skill_origem: null })).toEqual({ skill: null, skillOrigem: null });
  expect(skillDaSessao({ skill: "conselho", skill_origem: "escolhida" })).toEqual({ skill: null, skillOrigem: null });
});

test("skill válida passa com a origem", () => {
  expect(skillDaSessao({ skill: "historia", skill_origem: "sugerida" })).toEqual({ skill: "historia", skillOrigem: "sugerida" });
});
```

- [ ] **Passo 4: implementar em `lib/pipeline/context.ts`**

```ts
import { ehSkill } from "../skills-catalogo";

// Plano 025: a coluna é confiável só depois do check da 0052; o filtro aqui protege sessão
// gravada por código antigo e qualquer valor fora das quatro.
export function skillDaSessao(s: { skill?: unknown; skill_origem?: unknown }): Pick<GenerationContext, "skill" | "skillOrigem"> {
  if (!ehSkill(s.skill)) return { skill: null, skillOrigem: null };
  return { skill: s.skill, skillOrigem: s.skill_origem === "sugerida" ? "sugerida" : "escolhida" };
}
```

E nos selects:
- `loadContext`: `.select("id, user_id, prompt, client_id, artifacts, premissa, premissa_origem, modelo, skill, skill_origem")`, e no objeto devolvido `...skillDaSessao(session),` no lugar do `skill: null, skillOrigem: null` da Task 1.
- `loadEstadoComum`, preferências: acrescentar `perfil` à lista de colunas de `vm_client_preferences`.
- `loadEstadoComum`, lições: `.select("id, dimensao, destinatarios, titulo, descricao, grupo, alcance, skills, created_at, vm_lessons!inner(client_id)")` e, no `payload`, `alcance: t.alcance ?? null, skills: t.skills ?? null,`.

- [ ] **Passo 5: rodar** `npx vitest run tests/contexto-skill.test.ts` → PASS; gate; commit (`feat(skills): migrations 0051-0054 e skill da sessao no contexto`).

---

### Task 4: rótulos de modo da casa

**Arquivos:**
- Criar: `lib/pipeline/modo-roteiro.ts`, `scripts/seed-roteiro-modo.ts`
- Teste: `tests/modo-roteiro.test.ts`

**Interfaces:**
- Produz: `formatarMix(contagem: Record<string, number>): string`, `mixDoCliente(clientId: string): Promise<Record<string, number>>`, `modosDosRoteiros(crmIds: string[]): Promise<Map<string, string>>`.

- [ ] **Passo 1: teste que falha**

```ts
// tests/modo-roteiro.test.ts
import { expect, test, vi } from "vitest";
vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
});
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {}, crmDb: null }));
import { formatarMix } from "@/lib/pipeline/modo-roteiro";

test("mix em porcentagem, do maior para o menor, sem modo zerado", () => {
  expect(formatarMix({ historia: 81, mecanismo: 11, demonstracao: 4, panorama: 3, conselho: 0 }))
    .toBe("história 82%, mecanismo 11%, demonstração 4%, panorama 3% (99 roteiros)");
});

test("sem roteiro rotulado, nada", () => {
  expect(formatarMix({})).toBe("");
});
```

- [ ] **Passo 2: ver falhar**, depois implementar:

```ts
// lib/pipeline/modo-roteiro.ts
import { appDb } from "../db";

const NOME_MODO: Record<string, string> = {
  historia: "história", mecanismo: "mecanismo", demonstracao: "demonstração",
  panorama: "panorama", conselho: "conselho", publi: "publi", misto: "misto",
};

// "história 82%, mecanismo 11% (99 roteiros)": é o que o agente de escolha lê para desempatar.
export function formatarMix(contagem: Record<string, number>): string {
  const total = Object.values(contagem).reduce((a, b) => a + b, 0);
  if (!total) return "";
  const partes = Object.entries(contagem)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([m, n]) => `${NOME_MODO[m] ?? m} ${Math.round((100 * n) / total)}%`);
  return `${partes.join(", ")} (${total} roteiros)`;
}

// Fail-soft: sem tabela ou com erro, mix vazio. O mix só desempata; nunca derruba a geração.
export async function mixDoCliente(clientId: string): Promise<Record<string, number>> {
  const { data, error } = await appDb.from("vm_roteiro_modo").select("modo").eq("cliente_id", clientId);
  if (error) {
    console.error("mix de modos indisponível, seguindo sem", error.message);
    return {};
  }
  const c: Record<string, number> = {};
  for (const r of data ?? []) c[r.modo as string] = (c[r.modo as string] ?? 0) + 1;
  return c;
}

export async function modosDosRoteiros(crmIds: string[]): Promise<Map<string, string>> {
  if (!crmIds.length) return new Map();
  const { data, error } = await appDb.from("vm_roteiro_modo").select("crm_script_id, modo").in("crm_script_id", crmIds);
  if (error) {
    console.error("modos dos roteiros indisponíveis, seguindo sem", error.message);
    return new Map();
  }
  return new Map((data ?? []).map((r) => [r.crm_script_id as string, r.modo as string]));
}
```

- [ ] **Passo 3: o script de carga**

```ts
// scripts/seed-roteiro-modo.ts
// Plano 025: carrega em vm_roteiro_modo os rótulos do estudo de modos (docs/estudo-modos-2026-10).
// Idempotente (upsert por crm_script_id).
//   npx tsx --env-file=.env.local scripts/seed-roteiro-modo.ts
import { readFileSync } from "node:fs";
import { appDb } from "../lib/db";

const linhas = readFileSync("docs/estudo-modos-2026-10/dados/roteiro_modo_seed.jsonl", "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => ({ ...JSON.parse(l), origem: "estudo-2026-10" }));

void (async () => {
  for (let i = 0; i < linhas.length; i += 500) {
    const { error } = await appDb.from("vm_roteiro_modo").upsert(linhas.slice(i, i + 500), { onConflict: "crm_script_id" });
    if (error) throw new Error(error.message);
  }
  const { count } = await appDb.from("vm_roteiro_modo").select("*", { count: "exact", head: true });
  console.log(`vm_roteiro_modo: ${count} linhas`);
})();
```

- [ ] **Passo 4: rodar o teste** → PASS; gate; commit (`feat(skills): rotulos de modo da casa e mix do cliente`).

- [ ] **Passo 5 (operador, depois da 0051 aplicada):** `npx tsx --env-file=.env.local scripts/seed-roteiro-modo.ts` → esperado `vm_roteiro_modo: 2832 linhas`.

---

### Task 5: a escolha da skill

**Arquivos:**
- Criar: `lib/pipeline/escolher-skill.ts` (o prompt `agents/escolha-skill.md` já existe)
- Modificar: `lib/pipeline/index.ts`, `lib/pipeline/types.ts` (evento e fase)
- Teste: `tests/escolher-skill.test.ts`

**Interfaces:**
- Consome: `quandoDasSkills()` (Task 1), `mixDoCliente`, `formatarMix` (Task 4).
- Produz: `escolherSkill(ctx, compreensao?): Promise<EscolhaSkill | null>`, `lerEscolha(input)`, `interface EscolhaSkill { skill: Skill; motivo: string; alternativa: Skill | null }`; evento `{ type: "skill"; skill: Skill; origem: "escolhida" | "sugerida"; motivo?: string }`; fase `"skill"`.

- [ ] **Passo 1: teste que falha**

```ts
// tests/escolher-skill.test.ts
import { describe, expect, test, vi } from "vitest";

const capturado = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  return { params: null as null | { system: string; messages: { content: string }[] } };
});
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {}, crmDb: null }));
vi.mock("@/lib/llm-config", () => ({ modeloDe: async () => "claude-sonnet-5" }));
vi.mock("@/lib/pipeline/modo-roteiro", async (orig) => ({
  ...(await orig<object>()),
  mixDoCliente: async () => ({ historia: 8, mecanismo: 2 }),
}));
vi.mock("@/lib/anthropic", async (orig) => ({
  ...(await orig<object>()),
  trackedCreate: async (_log: unknown, _fase: string, params: never) => {
    capturado.params = params;
    return { content: [{ type: "tool_use", name: "registrar_skill", input: { skill: "historia", motivo: "a virada do fundador prova a tese", alternativa: "mecanismo" } }] };
  },
}));

import { escolherSkill, lerEscolha } from "@/lib/pipeline/escolher-skill";
import type { GenerationContext } from "@/lib/pipeline/types";

const ctx = { prompt: "a Havaianas", premissa: "a Havaianas virou marca global porque mudou de público", clientId: "c1", clientPrefs: { nome: "Cliente" }, usageLog: {} } as unknown as GenerationContext;

describe("escolha da skill", () => {
  test("lê a escolha e descarta modo que não é skill", () => {
    expect(lerEscolha({ skill: "panorama", motivo: "m", alternativa: null })).toEqual({ skill: "panorama", motivo: "m", alternativa: null });
    expect(lerEscolha({ skill: "conselho", motivo: "m" })).toBeNull();
    expect(lerEscolha({ skill: "historia", motivo: "m", alternativa: "publi" })?.alternativa).toBeNull();
  });

  test("manda as quatro definições, a premissa e o mix só como desempate", async () => {
    const e = await escolherSkill(ctx);
    expect(e).toEqual({ skill: "historia", motivo: "a virada do fundador prova a tese", alternativa: "mecanismo" });
    expect(capturado.params!.system).toContain("QUANDO USAR CADA SKILL");
    expect(capturado.params!.system).toContain("(panorama)");
    expect(capturado.params!.messages[0].content).toContain("a Havaianas virou marca global");
    expect(capturado.params!.messages[0].content).toContain("só desempata");
  });
});
```

- [ ] **Passo 2: ver falhar**, depois implementar:

```ts
// lib/pipeline/escolher-skill.ts
import { trackedCreate } from "../anthropic";
import { modeloDe } from "../llm-config";
import { ehSkill, SKILLS, type Skill } from "../skills-catalogo";
import { agentPrompt, premissaBlock, toolInput } from "./agents";
import { formatarMix, mixDoCliente } from "./modo-roteiro";
import { quandoDasSkills } from "./skills";
import type { GenerationContext } from "./types";

const SKILL_TOOL = {
  name: "registrar_skill",
  description: "Registra a skill de modo em que o roteiro vai ser escrito.",
  input_schema: {
    type: "object" as const,
    properties: {
      skill: { type: "string", enum: [...SKILLS], description: "o modo que prova a premissa" },
      motivo: { type: "string", description: "1 frase para a tela: o que vai provar a premissa" },
      alternativa: { type: ["string", "null"], enum: [...SKILLS, null], description: "o segundo modo que também serviria, ou null" },
    },
    required: ["skill", "motivo", "alternativa"],
  },
};

export interface EscolhaSkill {
  skill: Skill;
  motivo: string;
  alternativa: Skill | null;
}

export function lerEscolha(input: Record<string, unknown>): EscolhaSkill | null {
  if (!ehSkill(input.skill)) return null;
  return {
    skill: input.skill,
    motivo: String(input.motivo ?? "").trim(),
    alternativa: ehSkill(input.alternativa) ? input.alternativa : null,
  };
}

// Roda depois da premissa e antes da pesquisa: é a skill que diz ao pesquisador o que buscar.
// null = caminho único (o pipeline segue como antes do 025), nunca um palpite.
export async function escolherSkill(ctx: GenerationContext, compreensao?: string): Promise<EscolhaSkill | null> {
  const mix = ctx.clientId ? formatarMix(await mixDoCliente(ctx.clientId)) : "";
  const res = await trackedCreate(ctx.usageLog, "skill", {
    model: await modeloDe("premissa"),
    max_tokens: 4000,
    tools: [SKILL_TOOL],
    tool_choice: { type: "tool", name: "registrar_skill" },
    system: `${agentPrompt("escolha-skill")}\n\n# QUANDO USAR CADA SKILL\n${quandoDasSkills()}`,
    messages: [
      {
        role: "user",
        content: `${premissaBlock(ctx)}\n\nTEMA: ${ctx.prompt.trim() || "(sem tema digitado)"}${
          compreensao ? `\n\nMATERIAL MODELADO (autópsia do original):\n${compreensao}` : ""
        }${mix ? `\n\nMIX DO CLIENTE (só desempata): a casa escreve para ${ctx.clientPrefs?.nome ?? "este cliente"} ${mix}.` : ""}\n\nEscolha a skill.`,
      },
    ],
  });
  const tool = res.content.find((b) => b.type === "tool_use");
  return tool?.type === "tool_use" ? lerEscolha(toolInput(tool)) : null;
}
```

- [ ] **Passo 3: evento e fase em `lib/pipeline/types.ts`.** Em `PipelineEvent`, fase: acrescentar `| "skill"` depois de `"premissa"`. Novo membro da união:

```ts
  // Plano 025: a skill da sessão, escolhida pelo usuário ou sugerida pela sala.
  | { type: "skill"; skill: import("../skills-catalogo").Skill; origem: "escolhida" | "sugerida"; motivo?: string }
```

- [ ] **Passo 4: o lugar no pipeline (`lib/pipeline/index.ts`).** Logo depois de `ctx.premissa = premissa;` (fim do bloco da premissa), inserir:

```ts
    // ── SKILL (plano 025): o modo decide o que a pesquisa busca, então vem antes dela. ──
    // Escolhida na criação: já está no ctx. Automática: decidida aqui, uma vez, na primeira geração.
    // Sessão antiga com candidatas cacheadas segue sem skill: trocar o modo no meio exigiria
    // refazer a pesquisa, e essa troca é um botão da tela (trocarSkill), não uma surpresa.
    if (!ctx.skill && !ctx.artifacts?.candidatas?.length) {
      emit({ type: "phase", phase: "skill" });
      const compreensaoModelagem = modelando ? compreensaoBlock((await modelagemP)[0]?.analysis ?? {}) : undefined;
      const escolha = await escolherSkill(ctx, compreensaoModelagem).catch((e) => {
        console.error("escolha da skill falhou, seguindo pelo caminho único", e);
        return null;
      });
      if (escolha) {
        ctx.skill = escolha.skill;
        ctx.skillOrigem = "sugerida";
        ctx.skillMotivo = escolha.motivo;
        await appDb.from("vm_sessions").update({ skill: escolha.skill, skill_origem: "sugerida" }).eq("id", sessionId);
        // Os exemplos de voz foram buscados no loadContext, antes da skill existir.
        ctx.fewShot = (await fetchFewShot(ctx.prompt, ctx.clientId, ctx.skill)).exemplos;
      }
    }
    if (ctx.skill) emit({ type: "skill", skill: ctx.skill, origem: ctx.skillOrigem ?? "escolhida", motivo: ctx.skillMotivo });
```

Imports novos no topo: `import { escolherSkill } from "./escolher-skill";` e `fetchFewShot` de `./context` (a Task 7 exporta e ganha o parâmetro `skill`; até lá, chame `fetchFewShot(ctx.prompt, ctx.clientId)` e exporte a função como está).

No `pipeline_trace` do insert, ao lado de `hook_racional`:

```ts
            // Plano 025: a skill desta geração e por que ela foi escolhida.
            skill: ctx.skill,
            skill_origem: ctx.skillOrigem,
            skill_motivo: ctx.skillMotivo ?? null,
```

- [ ] **Passo 5: rodar** `npx vitest run tests/escolher-skill.test.ts` → PASS; gate; commit (`feat(skills): a sala sugere a skill depois da premissa`).

---

### Task 6: a seção da skill chega a cada agente

**Arquivos:**
- Modificar: `lib/pipeline/agents.ts` (pesquisa, narrativas, ranking, hook, comando), `lib/pipeline/draft.ts` (roteiro, revisão, tamanho), `lib/pipeline/piso.ts`, `lib/pipeline/index.ts` (chamada do piso)
- Teste: `tests/skill-injecao.test.ts`, `tests/piso.test.ts` (acrescentar caso)

**Interfaces:**
- Consome: `skillBlock(ctx, secao)` (Task 1).
- Produz: `tamanhoDoRoteiro(ctx): string` em `draft.ts`; `medirPiso(hook, corpo, skill?)`.

- [ ] **Passo 1: testes que falham**

```ts
// tests/skill-injecao.test.ts
import { describe, expect, test, vi } from "vitest";

const chamadas = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY ??= "test";
  return [] as { fase: string; system: string; user: string }[];
});
vi.mock("@/lib/db", () => ({ appDb: {}, viralData: {}, crmDb: null }));
vi.mock("@/lib/llm-config", () => ({ modeloDe: async () => "claude-sonnet-5" }));
vi.mock("@/lib/anthropic", async (orig) => ({
  ...(await orig<object>()),
  trackedCreate: async (_log: unknown, fase: string, p: { system: unknown; messages: { content: string }[] }) => {
    const system = Array.isArray(p.system) ? p.system.map((b: { text: string }) => b.text).join("\n") : String(p.system);
    chamadas.push({ fase, system, user: p.messages[0].content });
    if (fase === "comando") return { content: [{ type: "text", text: "Segue o perfil." }] };
    return { content: [] }; // sem tool_use: as funções lançam depois de chamar, e o que importa é o que foi enviado
  },
}));

import { montarEntradaPesquisa, proposeNarratives, rankNarratives, designHook, writeComando } from "@/lib/pipeline/agents";
import { buildDynamicSystemBlock, buildReviewDynamicBlock, tamanhoDoRoteiro } from "@/lib/pipeline/draft";
import { secaoDaSkill } from "@/lib/pipeline/skills";
import type { GenerationContext } from "@/lib/pipeline/types";

const ctx = (skill: GenerationContext["skill"]) =>
  ({
    skill, prompt: "tema", premissa: "uma tese qualquer que se sustenta", attachments: [], insights: [], playbooks: {}, bannedPhrases: [],
    fewShot: [], modelagemBriefs: [], modelagemHooks: [], artifacts: { dossie: "d", candidatas: [{ titulo: "t", estrutura: "A2. Herói Improvável", personagem: "p", conflito: "c", mecanismo_emocional: "m", beats: ["b"], gancho_potencial: "g" }], ranking: [], escolhida: 0, orientacao_roteiro: "", orientacao_hook: "" },
    clientPrefs: null, estrategia: "", usageLog: {}, modelo: "claude-opus-5-5", playbookVersions: [],
  }) as unknown as GenerationContext;

const trecho = (s: Parameters<typeof secaoDaSkill>[0], secao: Parameters<typeof secaoDaSkill>[1]) => secaoDaSkill(s, secao).slice(0, 50);

describe("cada agente recebe a sua seção da skill, e só com skill na sessão", () => {
  test("pesquisa", () => {
    expect(montarEntradaPesquisa(ctx("panorama"))).toContain(trecho("panorama", "pesquisa"));
    expect(montarEntradaPesquisa(ctx(null))).not.toContain("SKILL DO ROTEIRO");
  });

  test("roteiro e revisão", () => {
    expect(buildDynamicSystemBlock(ctx("historia"))).toContain(trecho("historia", "roteiro"));
    expect(buildReviewDynamicBlock(ctx("historia"))).toContain(trecho("historia", "revisao"));
    expect(buildDynamicSystemBlock(ctx(null))).not.toContain("SKILL DO ROTEIRO");
  });

  test("tamanho vem da skill; sem skill, a faixa de antes", () => {
    expect(tamanhoDoRoteiro(ctx("demonstracao"))).toContain("SKILL DO ROTEIRO");
    expect(tamanhoDoRoteiro(ctx(null))).toContain("420 e 500");
  });

  test("narrativas, ranking, hook e comando", async () => {
    chamadas.length = 0;
    const c = ctx("mecanismo");
    await proposeNarratives(c, "dossie").catch(() => {});
    await rankNarratives(c, "dossie", c.artifacts!.candidatas).catch(() => {});
    await designHook(c, null, []).catch(() => {});
    await writeComando(c, "corpo");
    const de = (fase: string) => chamadas.find((x) => x.fase === fase)!;
    expect(de("narrativas").system).toContain(trecho("mecanismo", "narrativas"));
    expect(de("ranking").system).toContain(trecho("mecanismo", "dados"));
    expect(de("hook").system).toContain(trecho("mecanismo", "hook"));
    expect(de("comando").system).toContain(trecho("mecanismo", "comando"));
  });
});
```

E em `tests/piso.test.ts`, acrescentar:

```ts
import { medirPiso } from "@/lib/pipeline/piso";

test("demonstração e panorama têm teto de números próprio (estudo de modos)", () => {
  const corpo = Array.from({ length: 30 }, (_, i) => `O motor tem ${i + 1} quilowatts e pesa ${i + 2} quilos, mas roda.`).join(" ");
  const numeros = (r: ReturnType<typeof medirPiso>) => r.violacoes.find((v) => v.includes("números ("));
  expect(numeros(medirPiso(null, corpo))).toContain("teto 1.8");
  expect(numeros(medirPiso(null, corpo, "demonstracao"))).toContain("teto 3.5");
  expect(numeros(medirPiso(null, corpo, "historia"))).toContain("teto 1.8");
});
```

- [ ] **Passo 2: ver falhar** (`npx vitest run tests/skill-injecao.test.ts tests/piso.test.ts`).

- [ ] **Passo 3: implementar**

`lib/pipeline/agents.ts`, importar `import { skillBlock } from "./skills";` e acrescentar um helper ao lado de `premissaBlock`:

```ts
// Plano 025: a seção da skill com a quebra de linha na frente, ou nada. Um helper só para os
// cinco agentes daqui: cinco redações do mesmo `x ? "\n\n" + x : ""` divergem na primeira edição.
const comSkill = (ctx: GenerationContext, secao: Parameters<typeof skillBlock>[1]) => {
  const b = skillBlock(ctx, secao);
  return b ? `\n\n${b}` : "";
};
```

1. `montarEntradaPesquisa`: o template do `return` termina hoje em

```ts
  }\n\n${fontesBlock()}\n\nMonte o dossiê.`;
```

Trocar esse final por (o que o modo usa como prova vem antes da hierarquia de fontes):

```ts
  }${comSkill(ctx, "pesquisa")}\n\n${fontesBlock()}\n\nMonte o dossiê.`;
```

2. `proposeNarratives`, no `system`, depois do bloco do playbook de pauta: acrescentar `${comSkill(ctx, "narrativas")}` no fim do template.

3. `rankNarratives`, no `system`: acrescentar `${comSkill(ctx, "dados")}` no fim do template (depois de `${insights}`).

4. `designHook`, segundo bloco do `system` (fora do trecho cacheado, porque a skill muda por sessão):

```ts
        { type: "text", text: `${agentPrompt("hook")}${comSkill(ctx, "hook")}` },
```

5. `writeComando`, no `system`:

```ts
      system: `${agentPrompt("comando")}\n\n# PLAYBOOK DE COMANDOS\n${ctx.playbooks.comando ?? "(sem playbook)"}${comSkill(ctx, "comando")}`,
```

`lib/pipeline/draft.ts`, importar `skillBlock` e:

1. `buildDynamicSystemBlock`, logo depois de `if (ctx.estrategia) parts.push(ctx.estrategia);`:

```ts
  // Plano 025: a skill vem antes do dossiê pelo mesmo motivo da premissa: é a lente com que
  // tudo abaixo é lido (o que conta como prova, como o corpo avança, onde fecha).
  const skillRoteiro = skillBlock(ctx, "roteiro");
  if (skillRoteiro) parts.push(skillRoteiro);
```

2. `buildReviewDynamicBlock`, logo depois do push da premissa:

```ts
  const skillRevisao = skillBlock(ctx, "revisao");
  if (skillRevisao) parts.push(skillRevisao);
```

3. Nova função exportada e o uso em `generateDraft` (no lugar do texto fixo `Tamanho-alvo: 370 a 430 palavras no corpo...`):

```ts
// Plano 025: com skill, o tamanho é o da seção roteiro dela (os quatro modos têm medianas e
// faixas diferentes na casa). Sem skill, a faixa única de antes.
export function tamanhoDoRoteiro(ctx: Pick<GenerationContext, "skill">): string {
  return ctx.skill
    ? "Tamanho-alvo: o da seção roteiro da SKILL DO ROTEIRO. Corpo abaixo de 250 palavras é eliminado na revisão."
    : "Tamanho-alvo: 370 a 430 palavras no corpo, para o roteiro inteiro (com hook e comando) ficar entre 420 e 500, cerca de 140 a 165 segundos de fala. Corpo abaixo de 250 palavras é eliminado na revisão.";
}
```

e em `generateDraft`, `content: \`${task} ${tamanhoDoRoteiro(ctx)}${...`.

`lib/pipeline/piso.ts`:

```ts
import type { Skill } from "../skills-catalogo";

// Plano 025: o teto de números por skill. Na casa, densidade acima de 2,5 a cada 100 palavras
// AJUDA demonstração (1,39, replica) e não muda panorama; em história acima de 1,8 atrapalha
// (0,90, replica). docs/estudo-modos-2026-10/src/piso_por_modo.mjs.
const PISO_POR_SKILL: Partial<Record<Skill, Partial<typeof PISO>>> = {
  demonstracao: { numerosPor100: 3.5 },
  panorama: { numerosPor100: 3 },
};
```

e em `medirPiso(hook, corpo, skill?: Skill | null)`, usar `const teto = { ...PISO, ...(skill ? PISO_POR_SKILL[skill] : {}) };` no lugar de `PISO` nas comparações de violação (o export `PISO` continua igual para quem já o lê). Em `index.ts`, `medirPiso(hookRes.hook, corpo, ctx.skill)`.

- [ ] **Passo 4: rodar e ver passar**; gate; commit (`feat(skills): cada agente recebe a sua secao da skill; tamanho e piso por skill`).

---

### Task 7: exemplos de voz da mesma skill

**Arquivos:**
- Modificar: `lib/pipeline/context.ts` (`fewShotDaCasa`, `fetchFewShot`, `loadContext`, `loadContextBancada`), `lib/pipeline/few-shot.ts`
- Teste: `tests/few-shot.test.ts` (acrescentar casos)

**Interfaces:**
- Produz: `ordenarPorSkill<T>(itens: T[], modoDe: (t: T) => string | undefined, skill: Skill | null): T[]` em `few-shot.ts`; `export async function fetchFewShot(prompt, clientId, skill: Skill | null = null)`.

- [ ] **Passo 1: teste que falha**

```ts
// em tests/few-shot.test.ts
import { ordenarPorSkill } from "@/lib/pipeline/few-shot";

test("com skill, os roteiros da mesma skill vêm primeiro, na ordem de coeficiente", () => {
  const itens = [{ id: "a", m: "mecanismo" }, { id: "b", m: "historia" }, { id: "c", m: undefined }, { id: "d", m: "historia" }];
  expect(ordenarPorSkill(itens, (x) => x.m, "historia").map((x) => x.id)).toEqual(["b", "d", "a", "c"]);
  expect(ordenarPorSkill(itens, (x) => x.m, null).map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
});
```

- [ ] **Passo 2: ver falhar**, depois implementar em `few-shot.ts`:

```ts
import type { Skill } from "../skills-catalogo";

// Plano 025: exemplo vence regra (024, P3), e o exemplo certo é o do mesmo modo: um roteiro de
// mecanismo ensina a explicar, não a contar uma trajetória. Estável: dentro de cada grupo, a
// ordem de coeficiente que veio do banco se mantém.
export function ordenarPorSkill<T>(itens: T[], modoDe: (t: T) => string | undefined, skill: Skill | null): T[] {
  if (!skill) return itens;
  return [...itens.filter((t) => modoDe(t) === skill), ...itens.filter((t) => modoDe(t) !== skill)];
}
```

Em `context.ts`, `fewShotDaCasa(clientId: string, skill: Skill | null)`:
- depois de montar `porId`, buscar `const modos = await modosDosRoteiros((videos ?? []).map((v) => v.crm_script_id as string | null).filter((x): x is string => !!x));`
- iterar `ordenarPorSkill(topo, (t) => modos.get(porId.get(t.video_id)?.crm_script_id as string), skill)` no lugar de `topo`;
- no `origem`, acrescentar o modo quando existir: `${modos.get(chave) ? \` · ${modos.get(chave)}\` : ""}`.
- Quando `skill` existe e menos de 2 exemplos da casa para este cliente são da skill, completar com roteiros da MESMA skill de outros clientes:

```ts
// Plano 025: cliente que quase não escreve neste modo (Rodrigo Waughan tem 4% de demonstração,
// onde rende 2,04x) ainda precisa de exemplo do modo. Vêm de outros clientes, com a origem dita.
async function fewShotDaSkill(skill: Skill, excluirCliente: string, quantos: number): Promise<ExemploFewShot[]> {
  const desde = new Date(Date.now() - JANELA_DA_CASA_DIAS * 864e5).toISOString();
  const { data: rot } = await appDb.from("vm_roteiro_modo").select("crm_script_id").eq("modo", skill).neq("cliente_id", excluirCliente).neq("confianca", "baixa").limit(400);
  const crmIds = (rot ?? []).map((r) => r.crm_script_id as string);
  if (!crmIds.length) return [];
  const { data: videos } = await viralData.from("videos").select("id, crm_script_id").in("crm_script_id", crmIds);
  const { data: topo } = await viralData.schema("oraculo").from("fato_video")
    .select("video_id, coeficiente_viral, views_total").in("video_id", (videos ?? []).map((v) => v.id))
    .eq("maturando", false).gte("data_publicacao", desde).order("coeficiente_viral", { ascending: false }).limit(20);
  const crmDoVideo = new Map((videos ?? []).map((v) => [v.id, v.crm_script_id as string]));
  const escritos = await textosDoCrm([...new Set((topo ?? []).map((t) => crmDoVideo.get(t.video_id)!).filter(Boolean))]);
  const out: ExemploFewShot[] = [];
  const vistos = new Set<string>();
  for (const t of topo ?? []) {
    const crm = crmDoVideo.get(t.video_id);
    const texto = crm ? escritos.get(crm) : undefined;
    if (!crm || !texto || texto.length < 600 || vistos.has(crm)) continue;
    vistos.add(crm);
    out.push({
      roteiro: texto,
      origem: `roteiro escrito da casa para OUTRO cliente, mesma skill (${skill}): ${Number(t.coeficiente_viral).toFixed(1)}x a média do canal`,
      views: Number(t.views_total) || 0, taxa: null, criterio: "views", escopo: "global",
    });
    if (out.length === quantos) break;
  }
  return out;
}
```

Em `fetchFewShot`, com `skill`: `const casa = await fewShotDaCasa(clientId, skill);` e, se `skill` e menos de 2 de `casa` têm o modo da skill na origem, `casa.splice(1, casa.length - 1, ...(await fewShotDaSkill(skill, clientId, 2)))` antes de devolver (ficam: o melhor do cliente, para a voz, e dois da skill). `loadContext` passa `skillDaSessao(session).skill` (o select de `vm_sessions` precisa vir antes do `Promise.all`; ele já vem); `loadContextBancada(clientId, prompt, skill = null)` repassa.

- [ ] **Passo 3: rodar e ver passar**; gate; commit (`feat(skills): exemplos de voz da mesma skill`).

---

### Task 8: as 156 lições triadas e roteadas por skill

**Arquivos:**
- Criar: `scripts/triar-licoes.ts`
- Modificar: `lib/pipeline/agents.ts` (`licoesPara`), `lib/pipeline/index.ts` (lição nova guarda a skill), `app/ensinar/[id]/page.tsx`, `components/lesson-view.tsx`
- Teste: `tests/licoes-skill.test.ts`

- [ ] **Passo 1: teste que falha**

```ts
// tests/licoes-skill.test.ts
import { expect, test } from "vitest";
import { licoesPara } from "@/lib/pipeline/agents";
import type { GenerationContext } from "@/lib/pipeline/types";

const licao = (id: string, alcance: string | null, skills: string[] | null) => ({
  insight_type: "taught", scope: "global",
  payload: { id, titulo: id, descricao: "d", destinatarios: ["roteirista"], alcance, skills },
});
const ctx = (skill: GenerationContext["skill"]) =>
  ({ skill, insights: [licao("u", "universal", null), licao("h", "modo", ["historia"]), licao("m", "modo", ["mecanismo", "panorama"]), licao("n", null, ["historia"])] }) as unknown as GenerationContext;

test("lição de modo só entra na skill dela; universal e não triada entram sempre", () => {
  expect(licoesPara(ctx("historia"), "roteirista", 10).map((l) => l.id).sort()).toEqual(["h", "n", "u"]);
  expect(licoesPara(ctx("panorama"), "roteirista", 10).map((l) => l.id).sort()).toEqual(["m", "n", "u"]);
  expect(licoesPara(ctx(null), "roteirista", 10).map((l) => l.id).sort()).toEqual(["n", "u"]);
});
```

- [ ] **Passo 2: ver falhar**, depois implementar em `licoesPara`, logo depois do `.filter((p) => (p.destinatarios ?? []).includes(agente))`:

```ts
    // Plano 025: lição de modo só entra na skill dela. Sem skill na sessão (caminho único), ela
    // não entra: é exatamente a regra que brigava com os outros modos. Lição não triada
    // (alcance null) segue valendo para todos, como antes.
    .filter((p) => p.alcance !== "modo" || (!!ctx.skill && (p.skills ?? []).includes(ctx.skill)))
```

Em `index.ts`, no insert de `vm_lesson_learnings` da correção, acrescentar ao objeto de cada lição: `skills: ctx.skill ? [ctx.skill] : null,` (contexto de origem; `alcance` fica null até a triagem humana).

- [ ] **Passo 3: o script de triagem**

```ts
// scripts/triar-licoes.ts
// Plano 025: grava alcance, skills e absorvida_em nas 156 lições a partir da triagem do estudo
// (docs/estudo-modos-2026-10/dados/correcoes_rotuladas.json). Sem --aplicar só mostra o que faria.
//   npx tsx --env-file=.env.local scripts/triar-licoes.ts [--aplicar]
import { readFileSync } from "node:fs";
import { appDb } from "../lib/db";
import { SKILLS } from "../lib/skills-catalogo";

type Triada = { id: string; alcance: string; modos_aplicaveis?: string[] | string };
const { learnings } = JSON.parse(readFileSync("docs/estudo-modos-2026-10/dados/correcoes_rotuladas.json", "utf8")) as { learnings: Triada[] };
const APLICAR = process.argv.includes("--aplicar");

const ONDE: Record<string, (skills: string[]) => string | null> = {
  universal: () => "agents/roteirista.md e agents/revisao.md (camada comum)",
  modo: (s) => (s.length ? s.map((x) => `skills/${x}.md`).join(", ") : null),
  cliente: () => "perfil do cliente",
  pauta: () => null,
  caso: () => null,
};

void (async () => {
  const contagem: Record<string, number> = {};
  for (const l of learnings) {
    const skills = Array.isArray(l.modos_aplicaveis) ? l.modos_aplicaveis.filter((m) => (SKILLS as readonly string[]).includes(m)) : [];
    const linha = { alcance: l.alcance, skills: l.alcance === "modo" ? skills : null, absorvida_em: ONDE[l.alcance]?.(skills) ?? null };
    contagem[l.alcance] = (contagem[l.alcance] ?? 0) + 1;
    if (APLICAR) {
      const { error } = await appDb.from("vm_lesson_learnings").update(linha).eq("id", l.id);
      if (error) throw new Error(`${l.id}: ${error.message}`);
    }
  }
  console.log(APLICAR ? "aplicado:" : "faria:", contagem);
})();
```

Esperado sem `--aplicar`: `faria: { universal: 62, modo: 61, cliente: 17, caso: 10, pauta: 6 }`.

- [ ] **Passo 4: a tela.** Em `app/ensinar/[id]/page.tsx`, acrescentar `alcance, skills, absorvida_em` ao select de `vm_lesson_learnings`. Em `components/lesson-view.tsx`, no tipo de `learnings` acrescentar `alcance: string | null; skills: string[] | null; absorvida_em: string | null;` e, no cabeçalho de cada aprendizado, ao lado da dimensão:

```tsx
{l.absorvida_em && (
  <span className="text-[11px] text-white/40" title="o texto desta regra já está no prompt; ativar duplicaria">
    já no prompt: {l.absorvida_em}
  </span>
)}
{l.alcance === "modo" && !!l.skills?.length && (
  <span className="text-[11px] text-indigo-300/70">só nas skills: {l.skills.join(", ")}</span>
)}
```

- [ ] **Passo 5: rodar** o teste → PASS; gate; commit (`feat(licoes): triagem por alcance e roteamento por skill`).
- [ ] **Passo 6 (operador, depois da 0054):** `npx tsx --env-file=.env.local scripts/triar-licoes.ts --aplicar`.

---

### Task 9: perfil do cliente

**Arquivos:**
- Criar: `lib/perfil-cliente.ts`, `scripts/gerar-perfis.ts`
- Modificar: `lib/pipeline/draft.ts` (`clientPrefsBlock`), `lib/actions.ts` (`savePreferences`), `components/client-prefs-editor.tsx`
- Teste: `tests/perfil-cliente.test.ts`

**Interfaces:**
- Produz: `slugCliente(nome): string`, `leituraDoModo(m): string`, `montarPerfil(entrada): string` em `lib/perfil-cliente.ts`.

- [ ] **Passo 1: teste que falha**

```ts
// tests/perfil-cliente.test.ts
import { expect, test } from "vitest";
import { leituraDoModo, montarPerfil, slugCliente } from "@/lib/perfil-cliente";

test("slug igual ao nome dos arquivos do estudo de outubro", () => {
  expect(slugCliente("Thainá Iansen")).toBe("thaina-iansen");
  expect(slugCliente("Café com Ferri")).toBe("cafe-com-ferri");
});

test("leitura do lift dentro do cliente", () => {
  expect(leituraDoModo({ fatia: 0.036, videos: 15, lift: 2.04, lb: 1.15, ub: 2.88 })).toContain("vale escrever mais");
  expect(leituraDoModo({ fatia: 0.5, videos: 80, lift: 0.6, lb: 0.4, ub: 0.9 })).toContain("evite como padrão");
  expect(leituraDoModo({ fatia: 0.3, videos: 60, lift: 1.1, lb: 0.8, ub: 1.4 })).toContain("sem diferença clara");
  expect(leituraDoModo({ fatia: 0.02, videos: 4, lift: null, lb: null, ub: null })).toContain("poucos vídeos");
});

test("o perfil tem as três partes e pula o que não existe", () => {
  const p = montarPerfil({
    nome: "Rodrigo Waughan",
    roteiros: 139,
    modos: { historia: { fatia: 0.6, videos: 242, lift: 0.95, lb: 0.76, ub: 1.17 }, demonstracao: { fatia: 0.036, videos: 15, lift: 2.04, lb: 1.15, ub: 2.88 } },
    sintese: "- **Funciona para ele:** marca conhecida.",
    licoes: [{ titulo: "CTA para o empresário", descricao: "fala com quem decide" }],
  });
  expect(p).toContain("## Modos");
  expect(p).toContain("demonstração: 4% dos roteiros");
  expect(p).toContain("## O que funciona para ele");
  expect(p).toContain("## O que o time corrigiu");
  expect(montarPerfil({ nome: "X", roteiros: 0, modos: {}, sintese: "", licoes: [] })).toBe("");
});
```

- [ ] **Passo 2: ver falhar**, depois implementar:

```ts
// lib/perfil-cliente.ts
// Plano 025: o perfil do cliente é texto que o time lê e edita (vm_client_preferences.perfil).
// Montado de três fontes medidas: o modo que rende dentro dele (estudo de modos), a síntese do
// estudo de outubro e o que o time corrigiu nos roteiros dele. Puro, para ser testado sem banco.
type ModoCliente = { fatia: number; videos: number; lift: number | null; lb: number | null; ub: number | null };

const NOME: Record<string, string> = { historia: "história", mecanismo: "mecanismo", demonstracao: "demonstração", panorama: "panorama", conselho: "conselho", publi: "publi" };
const x = (n: number) => `${n.toFixed(2).replace(".", ",")}x`;

export const slugCliente = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, "-");

export function leituraDoModo(m: ModoCliente): string {
  if (m.lift == null || m.lb == null || m.ub == null) return "poucos vídeos para medir";
  if (m.lb > 1) return `rende ${x(m.lift)} a média do cliente (diferença significativa): vale escrever mais neste modo`;
  if (m.ub < 1) return `rende ${x(m.lift)} a média do cliente (diferença significativa): evite como padrão`;
  return `rende ${x(m.lift)} a média do cliente (sem diferença clara)`;
}

export function montarPerfil(e: {
  nome: string;
  roteiros: number;
  modos: Record<string, ModoCliente>;
  sintese: string;
  licoes: { titulo: string; descricao: string }[];
}): string {
  const partes: string[] = [];
  const modos = Object.entries(e.modos).filter(([, m]) => m.fatia > 0).sort((a, b) => b[1].fatia - a[1].fatia);
  if (modos.length)
    partes.push(
      `## Modos (estudo de modos, out/2026, ${e.roteiros} roteiros)\n` +
        modos.map(([k, m]) => `- ${NOME[k] ?? k}: ${Math.round(m.fatia * 100)}% dos roteiros, ${leituraDoModo(m)}`).join("\n")
    );
  if (e.sintese.trim()) partes.push(`## O que funciona para ele (estudo de outubro)\n${e.sintese.trim()}`);
  if (e.licoes.length) partes.push(`## O que o time corrigiu nos roteiros dele\n${e.licoes.map((l) => `- ${l.titulo}: ${l.descricao}`).join("\n")}`);
  return partes.join("\n\n");
}
```

```ts
// scripts/gerar-perfis.ts
// Plano 025: preenche vm_client_preferences.perfil onde está vazio (--forcar reescreve: só com o
// Igor, porque apaga edição humana).
//   npx tsx --env-file=.env.local scripts/gerar-perfis.ts [--forcar]
import { existsSync, readFileSync } from "node:fs";
import { appDb } from "../lib/db";
import { montarPerfil, slugCliente } from "../lib/perfil-cliente";

const FORCAR = process.argv.includes("--forcar");
const porCliente = JSON.parse(readFileSync("docs/estudo-modos-2026-10/dados/modo_por_cliente.json", "utf8")) as Record<string, { roteiros: number; modos: Record<string, never> }>;

const sintese = (nome: string) => {
  const arq = `docs/estudo-2026-10/achados/clientes/${slugCliente(nome)}.md`;
  if (!existsSync(arq)) return "";
  const m = readFileSync(arq, "utf8").match(/## Síntese\n([\s\S]*?)(?=\n## |$)/);
  return m?.[1]?.trim() ?? "";
};

void (async () => {
  const { data: prefs, error } = await appDb.from("vm_client_preferences").select("client_id, perfil, clientes(nome)");
  if (error) throw new Error(error.message);
  const { data: licoes } = await appDb
    .from("vm_lesson_learnings")
    .select("titulo, descricao, vm_lessons!inner(client_id)")
    .eq("alcance", "cliente");
  let escritos = 0;
  for (const p of prefs ?? []) {
    if (p.perfil && !FORCAR) continue;
    const nome = (Array.isArray(p.clientes) ? p.clientes[0] : p.clientes)?.nome ?? "";
    const estudo = porCliente[p.client_id as string];
    const doCliente = (licoes ?? []).filter((l) => (Array.isArray(l.vm_lessons) ? l.vm_lessons[0] : l.vm_lessons)?.client_id === p.client_id);
    const perfil = montarPerfil({ nome, roteiros: estudo?.roteiros ?? 0, modos: estudo?.modos ?? {}, sintese: sintese(nome), licoes: doCliente as never });
    if (!perfil) continue;
    const { error: e2 } = await appDb.from("vm_client_preferences").update({ perfil }).eq("client_id", p.client_id);
    if (e2) throw new Error(`${nome}: ${e2.message}`);
    escritos++;
    console.log(`${nome}: ${perfil.length} caracteres`);
  }
  console.log(`perfis escritos: ${escritos}`);
})();
```

- [ ] **Passo 3: o perfil chega aos agentes.** Em `clientPrefsBlock` (`draft.ts`), no fim do template do bloco não modelagem (depois de `Notas da entrevista`):

```ts
${p.perfil ? `\n# PERFIL DO CLIENTE (o que a casa aprendeu com ele; em conflito, a skill decide o modo e o perfil decide tom, território e o que evitar)\n${p.perfil}` : ""}
```

`clientPrefsBlock` já chega ao roteirista, à revisão, ao hook e à premissa; em modelagem o perfil fica de fora de propósito (o cliente vira só veto, `clientModelagemBlock`).

- [ ] **Passo 4: edição.** `savePreferences` ganha `perfil: string` no `form` e `perfil: form.perfil || null` no upsert. `components/client-prefs-editor.tsx` ganha o campo, no mesmo padrão de `notas_entrevista` (estado inicial `perfil: prefs?.perfil ?? ""`, textarea com `rows={12}` e rótulo "PERFIL DO CLIENTE", e a seção de leitura com `<Prose muted>{prefs?.perfil}</Prose>`).

- [ ] **Passo 5: rodar** o teste → PASS; gate; commit (`feat(cliente): perfil do cliente gerado do estudo e editavel`).
- [ ] **Passo 6 (operador, depois da 0053 e da triagem):** `npx tsx --env-file=.env.local scripts/gerar-perfis.ts`.

---

### Task 10: a skill na tela

**Arquivos:**
- Modificar: `lib/actions.ts` (`createSession`, nova `trocarSkill`), `components/home-form.tsx`, `components/session-view.tsx`
- Teste: `tests/acoes-skill.test.ts`

- [ ] **Passo 1: teste que falha** (a regra de gravação mora numa função pura, para o teste não precisar subir `lib/actions.ts` com banco e autenticação)

```ts
// tests/acoes-skill.test.ts
import { expect, test } from "vitest";
import { colunasDaSkill } from "@/lib/skills-catalogo";

test("skill válida é gravada como escolhida; vazia ou fora das quatro vira automática", () => {
  expect(colunasDaSkill("panorama")).toEqual({ skill: "panorama", skill_origem: "escolhida" });
  expect(colunasDaSkill("")).toEqual({ skill: null, skill_origem: null });
  expect(colunasDaSkill("conselho")).toEqual({ skill: null, skill_origem: null });
  expect(colunasDaSkill(undefined)).toEqual({ skill: null, skill_origem: null });
});
```

- [ ] **Passo 2: ver falhar**, depois implementar. Em `lib/skills-catalogo.ts`:

```ts
// As duas colunas de vm_sessions para uma skill vinda da tela. Vazia ou inválida = automática:
// a sala sugere depois da premissa (escolher-skill.ts).
export function colunasDaSkill(v: unknown): { skill: Skill | null; skill_origem: "escolhida" | null } {
  return ehSkill(v) ? { skill: v, skill_origem: "escolhida" } : { skill: null, skill_origem: null };
}
```

Em `lib/actions.ts`, `createSession` recebe `skill?: string | null` e espalha `...colunasDaSkill(input.skill),` no insert de `vm_sessions`. E a ação nova:

```ts
// Plano 025: trocar o modo troca o que a pesquisa busca. O dossiê, as narrativas e o ranking da
// skill anterior não servem; a premissa fica (a tese não muda com o modo). A tela dispara a
// geração em seguida, como no "Conjurar".
export async function trocarSkill(sessionId: string, skill: string) {
  await exigirAcesso({ sessao: sessionId });
  const colunas = colunasDaSkill(skill);
  if (!colunas.skill) throw new Error("skill inválida");
  const { error } = await appDb
    .from("vm_sessions")
    .update({ ...colunas, artifacts: null, status: "draft", error_message: null })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/sessions/${sessionId}`);
}
```

- [ ] **Passo 3: home.** Em `components/home-form.tsx`: `import { DICA_SKILL, NOME_SKILL, SKILLS } from "@/lib/skills-catalogo";`, estado `const [skill, setSkill] = useState("");`, `skill: skill || null` no `createSession`, e ao lado do seletor de cliente, só quando não há material de modelagem (com modelagem, a sala classifica o original):

```tsx
{!temModelagem && (
  <select
    value={skill}
    onChange={(e) => setSkill(e.target.value)}
    title={skill ? DICA_SKILL[skill as keyof typeof DICA_SKILL] : "A sala escolhe o modo depois de definir a premissa"}
    className="rounded-[10px] border border-white/15 bg-white/[.04] px-3.5 py-2 text-[12.5px] text-white/70 outline-none cursor-pointer"
  >
    <option value="" className="bg-neutral-900 text-white">Skill: automática</option>
    {SKILLS.map((s) => (
      <option key={s} value={s} className="bg-neutral-900 text-white">{NOME_SKILL[s]}</option>
    ))}
  </select>
)}
```

- [ ] **Passo 4: sessão.** Em `components/session-view.tsx`:
- `TODAS_AS_FASES`: acrescentar `"skill"` depois de `"premissa"`; `PHASE_LABELS.skill = "Editor escolhendo o modo do roteiro: história, mecanismo, demonstração ou panorama..."`.
- o tipo da sessão ganha `skill: string | null; skill_origem: string | null;` e a página que monta a sessão acrescenta as duas colunas ao select de `vm_sessions`.
- estado `const [skillAtual, setSkillAtual] = useState({ skill: session.skill, origem: session.skill_origem, motivo: "" })`; no leitor de eventos, ao lado do `premissa_pendente`: `if (e.type === "skill") setSkillAtual({ skill: e.skill, origem: e.origem, motivo: e.motivo ?? "" });`.
- logo abaixo da `PremissaBox`, uma linha:

```tsx
{skillAtual.skill && (
  <div className="flex items-center gap-2 text-[12px] text-white/45">
    <span>
      Skill: <b className="text-white/75">{NOME_SKILL[skillAtual.skill as Skill]}</b>
      {skillAtual.origem === "sugerida" ? " (sugerida pela sala)" : ""}
      {skillAtual.motivo ? `: ${skillAtual.motivo}` : ""}
    </span>
    <select
      value=""
      disabled={gerando}
      onChange={async (e) => {
        if (!e.target.value) return;
        await trocarSkill(session.id, e.target.value);
        router.push(`/sessions/${session.id}?start=1`);
      }}
      className="rounded-md border border-white/10 bg-transparent px-2 py-1 text-[11.5px] outline-none cursor-pointer"
      title="Trocar o modo refaz a pesquisa e as narrativas; a premissa fica"
    >
      <option value="">trocar…</option>
      {SKILLS.filter((s) => s !== skillAtual.skill).map((s) => (
        <option key={s} value={s} className="bg-neutral-900">{NOME_SKILL[s]}</option>
      ))}
    </select>
  </div>
)}
```

Use os nomes reais de `gerando`, `router` e `session` do componente (estão no corpo dele); o `?start=1` é o mesmo gatilho que a home usa para disparar a geração.

- [ ] **Passo 5: rodar** o teste → PASS; gate; abrir `npm run dev`, criar sessão com "Skill: História" e com "automática", conferir a linha da skill e a troca (skill `run`); commit (`feat(skills): seletor na home, skill na sessao e troca de skill`).

---

### Task 11: classificação semanal dos roteiros novos da casa

**Arquivos:**
- Modificar: `lib/pipeline/modo-roteiro.ts` (classificador), `lib/etl.ts` (chamada)
- Teste: `tests/modo-roteiro.test.ts` (acrescentar)

**Interfaces:**
- Produz: `lerRotulos(input, idsValidos): Rotulo[]`, `classificarRoteirosNovos(limite = 60): Promise<number>`.

- [ ] **Passo 1: teste que falha**

```ts
import { lerRotulos } from "@/lib/pipeline/modo-roteiro";

test("rótulo fora do vocabulário ou de id desconhecido é descartado", () => {
  const r = lerRotulos(
    { rotulos: [
      { script_id: "a", modo: "historia", ancora: "passado", registro: "emotivo", confianca: "alta" },
      { script_id: "b", modo: "novela", ancora: "passado", registro: "emotivo", confianca: "alta" },
      { script_id: "zz", modo: "panorama", ancora: "noticia", registro: "analitico", confianca: "media" },
    ] },
    new Set(["a", "b"])
  );
  expect(r.map((x) => x.script_id)).toEqual(["a"]);
});
```

- [ ] **Passo 2: ver falhar**, depois implementar (em `modo-roteiro.ts`):

```ts
import { crmDb, viralData } from "../db";
import { trackedCreate } from "../anthropic";
import { modeloDe } from "../llm-config";
import { agentPrompt, toolArray, toolInput } from "./agents";

const MODOS = ["historia", "mecanismo", "demonstracao", "panorama", "conselho", "publi", "misto"];
const VOCAB = { ancora: ["noticia", "passado", "atemporal"], registro: ["analitico", "emotivo"], confianca: ["alta", "media", "baixa"] };
export interface Rotulo { script_id: string; modo: string; ancora: string; registro: string; confianca: string }

export function lerRotulos(input: Record<string, unknown>, idsValidos: Set<string>): Rotulo[] {
  return toolArray<Rotulo>(input, "rotulos").filter(
    (r) => idsValidos.has(r.script_id) && MODOS.includes(r.modo) && VOCAB.ancora.includes(r.ancora) && VOCAB.registro.includes(r.registro) && VOCAB.confianca.includes(r.confianca)
  );
}

// Exportada: o banco de prova (Task 12) classifica as saídas com a mesma ferramenta.
export const ROTULOS_TOOL = {
  name: "registrar_modos",
  description: "Registra o modo, a âncora, o registro e a confiança de cada roteiro.",
  input_schema: {
    type: "object" as const,
    properties: {
      rotulos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            script_id: { type: "string" },
            modo: { type: "string", enum: MODOS },
            ancora: { type: "string", enum: VOCAB.ancora },
            registro: { type: "string", enum: VOCAB.registro },
            confianca: { type: "string", enum: VOCAB.confianca },
          },
          required: ["script_id", "modo", "ancora", "registro", "confianca"],
        },
      },
    },
    required: ["rotulos"],
  },
};

// Plano 025: mantém vm_roteiro_modo em dia para os exemplos de cada skill e o mix do cliente.
// Roteiros VM publicados nos últimos 60 dias e ainda sem rótulo, até `limite` por rodada, em
// lotes de 10 por chamada. Custo medido no estudo: centavos por semana. Fail-soft: sem CRM, sai.
export async function classificarRoteirosNovos(limite = 60): Promise<number> {
  if (!crmDb) return 0;
  const desde = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data: fatos } = await viralData.schema("oraculo").from("fato_video").select("video_id, cliente_id").eq("vm_script", "sim").gte("data_publicacao", desde);
  const clienteDoVideo = new Map((fatos ?? []).map((f) => [f.video_id as string, f.cliente_id as string]));
  const { data: videos } = await viralData.from("videos").select("id, crm_script_id").in("id", [...clienteDoVideo.keys()]).not("crm_script_id", "is", null);
  const clienteDoRoteiro = new Map((videos ?? []).map((v) => [v.crm_script_id as string, clienteDoVideo.get(v.id as string)!]));
  const jaTem = await modosDosRoteiros([...clienteDoRoteiro.keys()]);
  const faltam = [...clienteDoRoteiro.keys()].filter((id) => !jaTem.has(id)).slice(0, limite);
  if (!faltam.length) return 0;
  const { data: scripts } = await crmDb.from("scripts").select("id, title, script_text").in("id", faltam);
  let gravados = 0;
  const lista = (scripts ?? []).filter((s) => (s.script_text ?? "").length > 400);
  for (let i = 0; i < lista.length; i += 10) {
    const lote = lista.slice(i, i + 10);
    const res = await trackedCreate(undefined, "classificacao_modo", {
      model: await modeloDe("aprendizado"),
      max_tokens: 8000,
      tools: [ROTULOS_TOOL],
      tool_choice: { type: "tool", name: "registrar_modos" },
      system: agentPrompt("classificador-modo"),
      messages: [{ role: "user", content: lote.map((s) => `### ${s.id}\ntitulo: ${s.title ?? ""}\n\n${s.script_text}`).join("\n\n---\n\n") }],
    });
    const tool = res.content.find((b) => b.type === "tool_use");
    const rotulos = tool?.type === "tool_use" ? lerRotulos(toolInput(tool), new Set(lote.map((s) => s.id as string))) : [];
    if (!rotulos.length) continue;
    const { error } = await appDb.from("vm_roteiro_modo").upsert(
      rotulos.map((r) => ({ crm_script_id: r.script_id, cliente_id: clienteDoRoteiro.get(r.script_id) ?? null, modo: r.modo, ancora: r.ancora, registro: r.registro, confianca: r.confianca, origem: "etl" })),
      { onConflict: "crm_script_id" }
    );
    if (error) console.error("vm_roteiro_modo: upsert falhou", error.message);
    else gravados += rotulos.length;
  }
  return gravados;
}
```

Em `lib/etl.ts`, dentro de `runWeeklyEtl`, depois de `varrerEdicoes`, num try isolado (o ETL não pode cair por isto):

```ts
    try {
      console.log(`modos classificados: ${await classificarRoteirosNovos()}`);
    } catch (e) {
      console.error("classificação de modo falhou, ETL segue", e);
    }
```

- [ ] **Passo 3: rodar** → PASS; gate; commit (`feat(etl): classifica o modo dos roteiros novos da casa`).

---

### Task 12: banco de prova das skills

**Arquivos:**
- Modificar: `scripts/bancada.ts` (`--skill`)
- Criar: `scripts/bancada-modo.ts`

- [ ] **Passo 1: `--skill` no banco.** Em `scripts/bancada.ts`:

```ts
import { ehSkill, type Skill } from "../lib/skills-catalogo";
import { escolherSkill } from "../lib/pipeline/escolher-skill";
import { fetchFewShot } from "../lib/pipeline/context";

// Plano 025: --skill <historia|mecanismo|demonstracao|panorama|auto|pauta>. "pauta" = a skill do
// roteiro humano da pauta (humano_topo, por vm_roteiro_modo) e automática nas outras; "auto" =
// escolherSkill. Braço com skill NÃO reaproveita --montante: a pesquisa muda com o modo.
const SKILL = arg("skill");
```

Em `rodar`, depois de congelar a premissa (antes de `research`):

```ts
  if (SKILL) {
    let s: Skill | null = ehSkill(SKILL) ? SKILL : null;
    if (SKILL === "pauta" && p.crm_script_id) {
      const { data } = await appDb.from("vm_roteiro_modo").select("modo").eq("crm_script_id", p.crm_script_id).maybeSingle();
      s = ehSkill(data?.modo) ? data.modo : null;
    }
    if (!s && (SKILL === "auto" || SKILL === "pauta")) s = (await escolherSkill(ctx))?.skill ?? null;
    ctx.skill = s;
    ctx.skillOrigem = s ? "escolhida" : null;
    if (s) ctx.fewShot = (await fetchFewShot(prompt, clientId, s)).exemplos;
  }
```

e no objeto de saída, `skill: ctx.skill,`. Se `MONTANTE && SKILL`, abortar com `throw new Error("braço com skill não reaproveita montante")`.

- [ ] **Passo 2: fidelidade de modo.** `scripts/bancada-modo.ts` lê `<runs>/<braco>/*.json`, classifica cada roteiro com o mesmo `agents/classificador-modo.md` (lotes de 10, a ferramenta `registrar_modos` da Task 11, exportada como `ROTULOS_TOOL`) e imprime, por braço: a distribuição de modos e, quando o arquivo tem `skill`, a % de roteiros cujo modo bate com a skill pedida.

```ts
// scripts/bancada-modo.ts
// Plano 025: o roteiro saiu no modo que a skill pediu? Classifica as saídas do banco com o mesmo
// classificador dos roteiros da casa.
//   npx tsx --env-file=.env.local scripts/bancada-modo.ts --runs <dir> --braco S
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { trackedCreate } from "../lib/anthropic";
import { modeloDe } from "../lib/llm-config";
import { agentPrompt, toolInput } from "../lib/pipeline/agents";
import { lerRotulos, ROTULOS_TOOL } from "../lib/pipeline/modo-roteiro";

const arg = (n: string) => process.argv[process.argv.indexOf(`--${n}`) + 1];
const dir = join(arg("runs"), arg("braco"));
const saidas = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

void (async () => {
  const modo = new Map<string, string>();
  for (let i = 0; i < saidas.length; i += 10) {
    const lote = saidas.slice(i, i + 10);
    const res = await trackedCreate(undefined, "classificacao_modo", {
      model: await modeloDe("aprendizado"), max_tokens: 8000, tools: [ROTULOS_TOOL], tool_choice: { type: "tool", name: "registrar_modos" },
      system: agentPrompt("classificador-modo"),
      messages: [{ role: "user", content: lote.map((s) => `### ${s.pauta.id}\n\n${s.hook ?? ""}\n\n${s.roteiro ?? ""}`).join("\n\n---\n\n") }],
    });
    const tool = res.content.find((b) => b.type === "tool_use");
    for (const r of tool?.type === "tool_use" ? lerRotulos(toolInput(tool), new Set(lote.map((s) => s.pauta.id))) : []) modo.set(r.script_id, r.modo);
  }
  const dist: Record<string, number> = {};
  for (const m of modo.values()) dist[m] = (dist[m] ?? 0) + 1;
  const comSkill = saidas.filter((s) => s.skill && modo.has(s.pauta.id));
  const bate = comSkill.filter((s) => modo.get(s.pauta.id) === s.skill).length;
  console.log("modos:", dist);
  if (comSkill.length) console.log(`fidelidade: ${bate}/${comSkill.length} (${Math.round((100 * bate) / comSkill.length)}%)`);
})();
```

- [ ] **Passo 3: gate e commit** (`feat(bancada): braço com skill e fidelidade de modo`).

- [ ] **Passo 4: a rodada (só com o OK do Igor ao custo).**

Custo estimado: ~US$ 1,6 por roteiro × 41 pautas × 2 braços ≈ US$ 130, mais o juiz pareado (Opus) ≈ US$ 15. Passa da recarga típica de US$ 100: combinar a recarga antes.

```bash
# braço A = produção de hoje, de uma worktree limpa de origin/main
npx tsx --env-file=.env.local scripts/bancada.ts --braco A --saida runs/025
# braço S = este branch, skill do humano nas pautas h*, automática nas c*
npx tsx --env-file=.env.local scripts/bancada.ts --braco S --saida runs/025 --skill pauta
npx tsx --env-file=.env.local scripts/bancada-modo.ts --runs runs/025 --braco A
npx tsx --env-file=.env.local scripts/bancada-modo.ts --runs runs/025 --braco S
npx tsx --env-file=.env.local --env-file="<.env do Cockpit>" scripts/bancada-placar.ts --runs runs/025 --a A --b S
```

**Critério para subir:**
- fidelidade do braço S ≥ 80% (o roteiro sai no modo pedido);
- juiz pareado S × A: S vence mais pautas do que perde, e contra o roteiro humano de topo S não perde mais que A;
- piso: S não piora em sigla sem aposto, capital no lugar do país, hook repetido e fórmula repetida;
- custo por roteiro de S até 20% acima de A.

Se uma skill falha (fidelidade ou juiz), o texto dela é ajustado e só as pautas daquela skill rodam de novo (`--so`). Registrar o placar no fim deste plano, seção Andamento.

---

### Task 13: release e medição

- [ ] **Passo 1:** linha do 025 em `plans/README.md` com o status.
- [ ] **Passo 2 (operador, nesta ordem):** aplicar 0051 a 0054; rodar `seed-roteiro-modo.ts`, `triar-licoes.ts --aplicar`, `gerar-perfis.ts`; conferir por SQL (`select count(*) from vm_roteiro_modo` = 2832; `select alcance, count(*) from vm_lesson_learnings group by 1`; perfis não vazios).
- [ ] **Passo 3:** release pelo Igor (commit, push na main, deploy e a mensagem de update da fila em `codex-updates/`), a partir de worktree limpa de origin/main (a pasta main local está desatualizada).
- [ ] **Passo 4: o que medir nas primeiras semanas**, por SQL em `vm_sessions` e `vm_generated_scripts`:
  - % de sessões por skill e por origem (escolhida ou sugerida); quantas trocam de skill depois da sugestão;
  - taxa de reescrita por skill: pedido de ajuste por roteiro e sobreposição gerado × publicado (quando o 024 4.1 ligar roteiro e vídeo);
  - distribuição de modo do que o Codex entrega (classificador da Task 11 sobre `vm_generated_scripts`), contra o mix da casa: a meta é sair dos 46% de mecanismo;
  - quando houver vídeo ligado: coeficiente e compartilhamentos por mil por skill, contra a base humana do mesmo cliente × rede × trimestre (régua do teto, decisão do Igor de 11/10).

---

## Autoavaliação contra o estudo

| item do estudo | task |
|---|---|
| quatro skills (história, mecanismo, demonstração, panorama) | conteúdo pronto + 1, 6 |
| âncora e registro como ajuste dentro da skill | texto das skills (pesquisa, hook, fecho, comando) |
| camada comum (10 regras das correções + cláusula de impacto) | 2 |
| perfil do cliente | 9 |
| tamanho por modo, piso de 350 | skills + 2 + 6 |
| payoff que ganha por modo; estruturas por modo | seções `narrativas` e `dados` + 6 |
| alavanca fraca de cada modo (fecho, compartilhamento) | seções `roteiro`, `dados`, `hook` |
| escolha do usuário com sugestão do sistema | 5, 10 |
| exemplos do mesmo modo | 7 |
| lições: não ativar no caminho único; rotear por modo | 8 |
| rótulos novos da casa (mix e exemplos em dia) | 11 |
| comparar no banco de prova antes de subir | 12 |
| ligar roteiro ao vídeo publicado; retenção | fora do 025 (plano 024 4.1 e 4.4); Task 13 mede quando existir |

## Andamento

| task | estado | nota |
|---|---|---|
| conteúdo das skills e dos dois agentes | rascunho pronto | aguarda leitura do Igor |
| 1 a 13 | a fazer | |
