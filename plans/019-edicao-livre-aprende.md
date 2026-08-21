# 019 — A edição livre vira o motor de aprendizado

Status: proposta, nada implementado. Escrito em 21/08/2026, depois do conserto de
`comDestinatarios` (commit 95a67d2) que fez lição de máquina voltar a chegar ao prompt.

## O problema

O usuário edita muito à mão. Hoje isso quase não ensina nada:

- `updateScript` (`lib/actions.ts:408`) só preserva `pipeline_trace.roteiro_original` via
  `marcarOrigemEdicao` (`lib/learning-loop.ts:44`). Não extrai.
- A extração só roda em `finalizeSession` sob três condições cumulativas: Finalizar +
  `rating >= 4` + `isSubstantiveEdit` (>10% do roteiro inteiro).
- Estado medido em produção (`plans/015` §1): **28 lições extraídas, 0 ativas**. 2 roteiros
  publicados de 47. 0 linhas em `vm_script_performance`. 0 em `vm_outcomes`.

### O sinal que se perde

O par (texto da sala → texto humano) está persistido. O que se perde é **onde**, **de que
tipo** e **quantas vezes**.

1. **Onde.** `extractFromEdit` (`lib/pipeline/teach.ts:117`) manda os dois roteiros inteiros
   (~15k chars cada) e pede "extraia só das DIFERENÇAS". Está pagando um LLM para fazer um
   diff, que é determinístico e grátis. A precisão morre aí.
2. **Quantas vezes.** Nenhuma tabela registra edição individual. Uma edição é anedota; a
   mesma edição três vezes é regra. Essa é a dimensão que separa o generalizável do
   circunstancial de forma barata, e ela não existe.
3. **O porquê.** Nunca capturado na edição livre (o botão Ensinar captura em `context_note`).

### Os cinco tipos

| Tipo | Detecção determinística | Generaliza? | Destino |
|---|---|---|---|
| Troca de palavra | diff de 1-3 tokens, resto do parágrafo intacto | **Altíssimo** | `vm_client_preferences.vocabulario_*` — **não precisa virar lição** |
| Corte | parágrafo some sem par | Só por repetição | lição `ritmo`/`comando` |
| Ritmo/estilo | `paragrafosLongos`/`sequenciasLongas` mudam, multiset de palavras quase não | Já é do humanizador | métrica, não lição |
| Correção factual | mudança toca âncora (`extrairAncoras`, `lib/pipeline/delta.ts:42`) | **Nunca** | descartar antes do LLM |
| Reescrita estrutural | parágrafo substituído, similaridade baixa | Quase nunca | só em cluster com N alto |

**O separador circunstancial × geral é contagem, não julgamento de LLM.** Nenhuma edição
isolada vira nada que entre em prompt.

### Duas contaminações que hoje envenenam a extração

**(a) Correção factual antes da edição humana.** `aplicarCorrecao` (`lib/actions.ts:484`)
chama `updateScript(..., "correcao_factual")`, que grava `roteiro_original = T0`. Se depois o
humano edita, `marcarOrigemEdicao` preserva `T0` e liga `edicao_humana`. O `finalizeSession`
calcula o diff `T0 → T2` — **incluindo a correção da máquina**. É exatamente a lição
envenenada que o comentário de `houveEdicaoHumana` (`learning-loop.ts:54-63`) diz prevenir: o
portão pega o caso puro-máquina, não a mistura.

**(b) O Bob inline.** `bobInline` insere a sugestão no `draft` e o autosave grava com
`origem: "humano"`. Texto escrito pela máquina vira o lado humano do par: **a sala aprende com
a própria escrita**, sem alarme nenhum.

### Os portões atuais estão invertidos

- `rating >= 4` corta o melhor sinal. Roteiro nota 2 muito editado é onde a sala mais errou.
- `>10% do roteiro inteiro` descarta a troca de palavra (1 palavra em 3.000 chars = 0,3%) —
  justamente o tipo que **mais** generaliza.
- Depende de Finalizar, que o usuário não faz.

---

## Fase 1 — A edição vira observação estruturada (SEGURA)

Nada entra em prompt. Registro determinístico: quais parágrafos mudaram, de que tipo, e o par
literal antes→depois. Zero LLM.

- **Novo** `lib/edit-diff.ts` (puro, testável como `learning-loop.ts`, **sem dependência
  nova**): `parearParagrafos` (LCS sobre parágrafos usando `changedRatio` como distância,
  ~40 linhas), `classificarMudanca` (ordem importa: `factual` primeiro via `extrairAncoras`,
  depois `vocabulario`, depois `ritmo`, resto é `reescrita`), `termosTrocados`.
- **Nova migration** `0038_edit_observations.sql`: `vm_edit_observations (id, script_id,
  client_id, tipo, antes, depois, termo_de, termo_para, created_at)`. RLS sem policy (padrão
  da 0011). Índice em `(client_id, tipo, termo_de, termo_para)`.
- **`lib/etl.ts`** (`runWeeklyEtl`): varre scripts com `edicao_humana = true` sem observação e
  popula. Best-effort, padrão dos outros blocos.
- **Conserto da contaminação (a)**, ~3 linhas em `marcarOrigemEdicao`: gravar também
  `roteiro_pre_humano` — o texto no instante da PRIMEIRA edição humana, independente de já
  haver `roteiro_original` de máquina. `roteiro_original` fica intocado (é o que `explain.ts`
  e o revert leem). Consumidores de aprendizado passam a ler `roteiro_pre_humano ??
  roteiro_original`.

**Gatilho: o ETL semanal, não a sessão.** Custo zero no request, e o diff sobre o estado final
é melhor que sobre estados intermediários do autosave.

**Por que vem antes:** é o instrumento de medição das fases seguintes. Se a varredura sobre os
47 roteiros existentes devolver 80% `reescrita`, o pareamento está grosso e você ajusta antes
de gastar um token. Se devolver dezenas de `vocabulario` repetidos, a Fase 2 está justificada
com dado em vez de palpite.

**Verificação:** `select tipo, count(*) from vm_edit_observations group by 1`, e ler 20 pares
à mão conferindo o rótulo.

## Fase 2 — Vocabulário: o caminho que não passa por lição (SEGURA)

Cluster de N≥3 observações `vocabulario` com o mesmo par (de→para) no mesmo cliente vira uma
pergunta de 1 clique, e a resposta cai em `vm_client_preferences`, **não** em
`vm_lesson_learnings`.

Reuso integral: `gravarEnsinamento` caso `"vocabulario"` já faz o read-modify-write, já exige
`direcao`, já rebaixa escopo global para `frase_banida`. `teach-dialog` já é o painel.

Código novo = **a entrada**: ao sair do modo edição em `ScriptCard`, se há cluster maduro, uma
linha discreta ("Você trocou *manchete* por *título* pela 3ª vez. Vira regra deste cliente?")
que abre o `useTeachDialog` pré-preenchido.

**Por que antes da Fase 3:** mesmo mecanismo (contar → perguntar → gravar) com o destino mais
estreito e reversível que existe. Heurística de cluster ruim aqui custa "o cliente X ganhou
uma palavra proibida boba", não "todos os roteiros de todos os clientes mudaram".

**Verificação:** os arrays de vocabulário saem do vazio e — o teste de verdade — o mesmo par
de→para **para de aparecer** em observações novas.

## Fase 3 — A pergunta no fluxo substitui a fila que ninguém drena (ARRISCADA)

Cluster N≥3 do mesmo tipo → **uma** chamada de Professor sobre o cluster (3-8 pares curtos,
não dois roteiros de 15k) → proposta → confirmação humana no fluxo → `active: true` pela porta
que já existe (RPC `vm_gravar_ensinamento`).

- `lib/pipeline/teach.ts`: nova `extractFromCluster`, reusando `runProfessor` com
  `minItems = 1`. Mais barata **e** mais precisa que `extractFromEdit`.
- **Remover** o ramo `rating>=4 && isSubstantiveEdit` de `finalizeSession`. Manter
  `extractFromNotes`: observação escrita é um *porquê declarado*, o sinal mais confiável do
  produto, e não tem nada a ver com diff.

**Sobre `active:false` vs `active:true`.** O botão Ensinar nasce ativo porque o humano
escreveu a regra com as próprias palavras. Edição livre não tem frase nenhuma: a regra é
inferida por LLM. Os dois não têm o mesmo status epistêmico. O desenho certo não é mudar o
default — é mudar **onde a confirmação acontece**. `plans/015` §1 já diagnosticou: "/ensinar é
destino, e destino não é visitado" (0/28). A confirmação tem que acontecer na sessão, com o
trecho na frente do usuário.

**Recusado, com motivo:**
- *Peso menor no prompt*: `taughtBlock` formata `- titulo: descricao`, sem noção de peso.
  Inventar peso num sistema onde nenhuma lição jamais esteve num prompt é calibrar no vácuo.
- *Entrar depois de N confirmações*: o N já está lá, é o do cluster, aplicado **antes** de
  perguntar, de graça. Um segundo N é o mesmo portão duas vezes.
- *Tela de gestão da fila*: a fila existir é o defeito. Não se constrói tela para ela.

**Mitigações do risco (todas já no código ou triviais):** cluster N≥3 · `factual` descartado no
diff antes do Professor ver · `roteiro_pre_humano` garante lado esquerdo limpo · escopo
cliente como default · humano edita o texto da regra no dialog · **marcar os ranges aceitos do
Bob** (`proveniencia.bob` já é campo previsto em `explain.ts:43` e ninguém escreve) e
descartar parágrafos que casem — sem isso a sala aprende com ela mesma.

**Verificação:** lições ativas saem de 0, e `licoes_excedidas` começa a aparecer no trace — é
o sinal honesto de que o teto `n=3` passou a vincular.

## Fase 4 — Limpar os portões velhos (SEGURA, é deleção)

Sai o `rating>=4`, sai a dependência de Finalizar, sai `extractFromEdit` inteira (a função cuja
premissa é "peça ao LLM que faça um diff"). `isSubstantiveEdit` perde o call site;
`changedRatio` continua, agora como distância de pareamento.

Por último porque deletar antes da Fase 3 rodando deixa buraco.

**Aparte de 1 linha, sem fase própria:** `app/ensinar/page.tsx:41` filtra `derived` por
`source_kind === "edicao" || "curador"` — as lições `"correcao"` (14 das 28) caem na lista
genérica e não contam no badge de pendentes.

## Fase 5 — Retroalimentação: o que dá e o que não dá

**Não construir nada em cima de performance.** `attributeLessons` + `needs_review` já estão
completos e ligados (`lib/etl.ts:449-465`, migration 0015). Com 0 linhas em
`vm_script_performance`, ligar mais fio ali é trabalho sem entrada de dados. O gargalo é
operacional (publicar e casar URL), não de código.

**O que dá, e é melhor:** o sinal disponível hoje, em volume, é a própria edição. Se a lição
funcionou, o humano para de fazer aquela edição. Depois de ativar uma lição, conte observações
do mesmo cluster em roteiros gerados após o `updated_at` dela. Recorrência zero = funcionou.
Mesma taxa = não está chegando ao prompt (checar `licoes_excedidas`) ou não funciona → marcar
`needs_review = true`, a mesma coluna, com o princípio já escrito no código ("só liga a flag —
desligar é decisão humana"). Custo: uma query no ETL semanal.

**Critério de parada honesto:** se depois de 4 semanas nenhum cluster cair, o problema não é a
curadoria — é que as lições não descrevem nada replicável, e a conclusão certa é matar a
extração por edição e ficar só com o botão Ensinar.

---

## Reuso vs construção

**Reusar:** `changedRatio` · `marcarOrigemEdicao` · `houveEdicaoHumana` · `comDestinatarios` ·
`extrairAncoras` · `paragrafosLongos`/`sequenciasLongas` · `runProfessor` ·
`classificarEnsinamento` · `gravarEnsinamento` + RPC `vm_gravar_ensinamento` ·
`teach-dialog`/`useTeachDialog` · `casaFinal`/`precisaDirecao` · `proximaPendencia`/`responder`
· `attributeLessons` + `needs_review` · `clientPrefsBlock` + `vocabulario_*` · `runWeeklyEtl`.

**Construir:** `lib/edit-diff.ts` (3 funções puras) · `vm_edit_observations` · a varredura no
ETL · a query de cluster · uma linha de UI no `ScriptCard`.

**Não construir:** biblioteca de diff · pesos de lição · tela de gestão de fila · extração no
autosave · qualquer coisa nova em cima de `vm_outcomes`.
