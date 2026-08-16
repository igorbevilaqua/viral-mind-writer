# 017 — Verificação factual: checar o que o roteirista inventou

**Tipo:** design spec (a etapa de implementação entra neste mesmo arquivo, como no 015).
**Data:** 2026-08-15. **Release alvo:** 2.0. **Depende de:** 015 (peça 1) para o rastro e o `<dialog>`.
**É a peça 3 de 4** do pacote 2.0.

---

## 1. O problema

Números de produção em 2026-08-15 (projeto Supabase `qclvrddrqulgfzccndnl`):

| Métrica | Valor |
|---|---|
| Roteiros gerados | 47 |
| Roteiros com a seção `## FONTES` preenchida | **47** (43 com URL) |
| **Roteiros cujo texto final foi verificado** | **0** |
| Sessões | 44 |
| Sessões cujo dossiê tem `## CHECAGEM` | **10 (23%)** |
| Sessões com modelagem / com tema digitado | 14 / 28 |
| Autópsias de vídeo modelado | 12 |

**Todo roteiro cita fonte. Nenhuma citação foi conferida.** Os 47 roteiros saem com seção `## FONTES`,
43 deles com URL — formato ditado por prompt (`draft.ts:25-35`), sem uma linha de código que valide o
link, confira o veículo ou case a citação com o dossiê.

### 1.1 A checagem que existe está errada em três eixos ao mesmo tempo

Existe verificação hoje. Ela erra o **objeto**, o **momento** e a **frequência**:

| Eixo | O que acontece | Linha |
|---|---|---|
| **Objeto** | verifica as alegações do **vídeo modelado**, não as nossas. `alegacoes` sai de `compreensao`, a autópsia do vídeo alheio | `modelagem.ts:40-45` |
| **Momento** | roda **antes** de roteirista, revisor e humanizador escreverem. Verifica o insumo, não o produto | `index.ts:169-174` |
| **Frequência** | só quando há modelagem **sem tema digitado** — 10 dossiês em 44 sessões | `agents.ts:388`, `draft.ts:113` |

E há um quarto, mais silencioso: **com tema digitado, `compreensao` é deletada do schema**
(`modelagem.ts:161`), então `alegacoes` nem chega a ser gerada. Nas 28 sessões com tema, a palavra
"checagem" não existe em lugar nenhum do fluxo.

O que sobra como controle factual do roteiro final é `critiqueAndRewrite` (`critique.ts:10-43`), que
recebe a checagem em texto e o dossiê truncado a 2000 chars (`draft.ts:282`) e confia no julgamento
do modelo. Não é determinístico, não é auditável, e não sabe o que é nosso e o que é do vídeo.

### 1.2 Nada liga o roteiro ao dossiê

Não existe **nenhum** mecanismo comparando o texto do roteiro com o dossiê. Sem substring, sem regex,
sem embedding. Embeddings existem (`context.ts:10-14`, `text-embedding-3-small`) e servem só para
buscar few-shot do corpus a partir de `ctx.prompt` — nunca tocam o dossiê.

`checagemSection` (`draft.ts:116-123`) é a única função que abre o dossiê, e ela **recorta uma seção
dele próprio**; não confronta nada. As linhas `[confirmado|contestado|nao_verificavel]`
(`agents.ts:325`) nunca são parseadas em campos: são string opaca do começo ao fim.

**Consequência para esta peça:** "alegação rastreável ao dossiê" não é uma consulta que existe. É a
primeira coisa a construir.

## 2. Escopo

**Nesta peça:** extração das alegações do roteiro **final**; filtro de delta contra o dossiê;
verificação com busca web das que sobram; veredicto estruturado por alegação; correção cirúrgica do
que é impreciso e o dado certo é conhecido; tabela de resultado; botão de varredura completa.

**Fora desta peça:** Kasparov e chat (peça 4); métrica de publicação (peça 5); verificar o dossiê
contra a realidade — aqui o dossiê é tratado como já verificado (§11.1).

**O que consome da peça 1:** o padrão de `<dialog>` com hook `{open, dialog}`; `pipeline_trace` como
lugar de rastro; a primitiva de pertencimento normalizado de `lib/provenance.ts`.

**O que consome da peça 2:** `fontes-autoritativas.json` promovido a portão (016 §5.1), aqui reusado
como hierarquia única de fontes (§6.2).

## 3. Princípios

Herda os cinco do pacote. Os que mordem aqui:

1. **A verdade ou é recuperável, ou não é dita.** Veredicto sem fonte não é veredicto. `nao_verificavel`
   é resposta válida e esperada — nunca inventar confirmação.
2. **Falha silenciosa é o defeito central.** Alegação que não coube no teto, busca que falhou,
   correção que não aplicou: tudo vai para a tabela e para o rastro.
3. **O custo é o eixo de desenho.** Verificar cada fato com busca web em toda geração × toda
   regeração × toda versão é o maior custo do pacote. O regime existe para que o custo cresça com o
   quanto o roteirista inventou — que é o sinal certo.

## 4. Regime C — verificar só o delta

### 4.1 A regra

Alegação do roteiro final **rastreável ao dossiê** passa direto: a pesquisa já trouxe fonte para ela.
Alegação **não rastreável** é o que o roteirista produziu sozinho — e é precisamente onde a invenção
mora. Só ela é verificada.

O custo cresce com a invenção. Um roteiro fiel ao dossiê é quase de graça; um roteiro que inventou
muito paga caro, e deve pagar.

### 4.2 Como se decide "rastreável", sem LLM e sem embedding

Determinístico, reusando a primitiva que a peça 1 já construiu. `lib/provenance.ts` normaliza texto
(minúsculas, acentos preservados, pontuação e espaço colapsados) e testa pertencimento por
`includes` — é assim que `atribuirEtapa` resolve trecho → etapa.

Aqui o alvo é o dossiê em vez dos snapshots, e a unidade é mais fina que a frase:

1. Extrair da alegação suas **âncoras factuais**: quantidades (`45 bilhões`, `37,5%`), datas, e nomes
   próprios (maiúscula fora de início de frase).
2. Alegação **sem nenhuma âncora** → não é verificável por este caminho; entra no delta.
3. Alegação cujas âncoras **todas** aparecem no dossiê normalizado → `rastreada`, passa direto.
4. Qualquer âncora ausente → **delta**.

É deliberadamente conservador na direção certa: na dúvida, verifica. Um falso "delta" custa uma
busca; um falso "rastreada" deixa passar invenção, que é o defeito que a peça existe para matar.

**Sem tema digitado o dossiê é o de sempre; sem dossiê (6 sessões de 44) todas as alegações caem no
delta** — e é o comportamento certo: roteiro sem pesquisa é roteiro inteiramente por conta do modelo.

### 4.3 Varredura completa

O botão no fim da página da sessão **pula o passo 3**: toda alegação vira delta. É o que o usuário
aciona quando está inseguro, e é também a única forma de auditar o próprio dossiê pelo produto.

## 5. O pipeline de verificação

Cinco passos. **Custo: 1 + N + 1 chamadas**, onde N é o tamanho do delta.

| # | Passo | Como | Custo |
|---|---|---|---|
| 1 | Extrair alegações do roteiro final | `ANALYST_MODEL`, tool forçada `registrar_alegacoes`, sobre `hook + roteiro + comando` salvos | 1 chamada |
| 2 | Filtro de delta | determinístico (§4.2) | **zero** |
| 3 | Buscar cada alegação do delta | `grokPesquisa(query)` — `bob.ts:56-67`, já devolve `{ texto, fontes }` com URLs reais extraídas de `annotations.url_citation` (`bob.ts:37-54`) | N chamadas, paralelas |
| 4 | Classificar | `ANALYST_MODEL`, tool forçada `registrar_verificacao`, recebendo delta + resultados de busca | 1 chamada |
| 5 | Agir sobre o veredicto | §7 | zero ou 1 escrita |

**O passo 3 é a razão de a peça ser viável.** `grokPesquisa` já existe, já faz busca web e **já
extrai URL de citação** — o único lugar do sistema que devolve fonte estruturada em vez de prosa. O
Fact-Checker exige "pesquise na web para CADA fato"; sem esse helper, seria infra nova.

**Não existe busca web pelo SDK da Anthropic** neste projeto. O padrão é *Anthropic decide → Grok
executa* (`bob.ts:24-33`, tool `pesquisar_web`), com teto de 2 turnos (`bob.ts:127`) — desenhado para
uma pergunta, não para N. Daí a separação em passo 3 (busca, em paralelo) e passo 4 (julgamento, em
lote), em vez de um loop de tool-use.

## 6. O agente

### 6.1 Base

O prompt base está literal em `2.0-decisoes.md`, Apêndice A ("Fact-Checker v2.0", fornecido pelo Igor
em 2026-08-15). Vira `agents/verificador.md`, carregado por `agentPrompt` (`agents.ts:22`).

**Adaptações obrigatórias, já registradas nas decisões:**

1. **Remover `<inicializacao>`** — resquício de chat ("Aguarde o roteiro… Cola o roteiro").
2. **Remover "responda SEMPRE direto no chat, nunca crie artefato"** — a saída é tool call.
3. **Trocar `<formato_de_saida>` markdown pelo tool call** (§6.3). A tabela de emojis é renderização,
   não contrato de modelo.

**Uma quarta adaptação que o spec acrescenta:**

4. **Remover a hierarquia de fontes embutida no prompt** ("Folha, Estadão, Reuters, BBC, Bloomberg") e
   passar a injetar `lib/pipeline/fontes-autoritativas.json`, como `agents.ts:335` já faz para o
   pesquisador. Duas listas de fontes autoritativas em dois arquivos divergem no primeiro dia em que
   alguém edita uma. Uma fonte de verdade, dois consumidores.

O resto do prompt entra **inalterado** — a hierarquia de 4 níveis, a atenção a cronologia,
causalidade, superlativo e status atual, e as regras de arredondamento honesto vs. distorcido são o
valor do documento e já estão calibradas.

### 6.2 O que o agente recebe

Por rodada: as alegações do delta, e para cada uma o resultado da busca (`texto` + `fontes` do
`grokPesquisa`). Mais a hierarquia de fontes. **Não recebe o roteiro inteiro** — recebe alegação e
evidência. Julgamento de fato não precisa de contexto narrativo, e mandar o roteiro inteiro convida o
modelo a opinar sobre qualidade, que o próprio prompt proíbe ("você não reescreve, não opina sobre
qualidade").

### 6.3 A tool

`registrar_verificacao`, forçada, no padrão canônico do projeto (`tool_choice: {type:"tool", …}` +
`toolInput` + `toolArray`, `agents.ts:259-287`). Um registro por alegação:

```
{ alegacao,          // como aparece no roteiro
  trecho_literal,    // âncora para a correção — texto EXATO do roteiro
  veredicto: 'confirmado' | 'impreciso' | 'falso' | 'nao_verificavel',
  fonte: { url, veiculo, ano } | null,
  correcao: string | null,   // só quando impreciso E o dado certo é conhecido
  explicacao }
```

**`trecho_literal` é o campo que faz a peça agir em vez de só reclamar.** Ele precisa ser
substituível literalmente no roteiro — a mesma lição que a peça 2 aprendeu com o detector de
parataxe (`slop-lint.ts:159-161`). Se o modelo devolver paráfrase, a correção não aplica: validar
com `includes` antes de oferecer o botão, e rebaixar para aviso quando não casar.

`max_tokens` com folga (o padrão do projeto é 8000 para tool grande, com o comentário em
`modelagem.ts:325-327` sobre thinking dividir o teto e truncar o `tool_use`).

## 7. Ação sobre o veredicto

| Veredicto | Ação |
|---|---|
| ✅ `confirmado` | nada. Registra fonte na tabela |
| ⚠️ `impreciso` **com** `correcao` | **correção cirúrgica** (§7.1) |
| ⚠️ `impreciso` **sem** `correcao` | vira aviso — não há o que aplicar |
| ❌ `falso` | **aviso**. O usuário decide. Um ❌ costuma derrubar a frase, às vezes o argumento |
| 🔍 `nao_verificavel` | **aviso**, com a recomendação de checar em fonte primária |

### 7.1 A correção cirúrgica não precisa de LLM

As decisões dizem "reusa o retry do `humanize.ts`". Literalmente não dá: a substituição de
`humanize.ts:101` é inline dentro do loop, não exportada, e acoplada ao parse da resposta do modelo
(`humanize.ts:97`). E `rewriteFragment` (`rewrite-fragment.ts:10-13`) **sempre** chama LLM e não
escreve no banco.

Mas aqui isso é sorte, não obstáculo: **quando a verificação já achou o dado certo, os dois lados são
conhecidos.** Não há o que gerar. A correção é `split(trecho_literal).join(correcao)` sobre o campo,
seguido de `updateScript` (`actions.ts:302-346`) — que já aplica `dedash`, já preserva o texto
original em `pipeline_trace.roteiro_original` e já revalida.

**A propriedade que quebrou a peça 2 é benigna aqui.** `split/join` troca **todas** as ocorrências.
Para repetição estilística isso é o avesso do conserto (016 §4.4); para um número errado é
exatamente o certo — `45 bilhões` errado é errado em toda aparição.

### 7.2 A armadilha do `edicao_humana`

**`updateScript` marca `edicao_humana: true` e grava `roteiro_original` na primeira edição**
(`actions.ts:314-332`). Esse par é o gatilho do aprendizado: `extractFromEdit` extrai lição quando há
rating ≥4 **e** edição substantiva.

Se a correção factual passar por esse caminho sem distinção, **o Professor aprende com uma correção
de máquina como se fosse gosto do usuário** — e a lição extraída seria algo como "prefira 4,5 bilhões
a 45 bilhões", que não é regra de escrita nenhuma. Uma lição envenenada, ativa, entregue a todos os
agentes pelo roteamento da peça 1.

**Requisito duro:** a escrita da verificação preserva `roteiro_original` (é uma alteração do texto e
precisa ser revertível) e **não marca `edicao_humana`**. Marca `correcao_factual: true` no trace, que
é o que a peça 4 vai querer ler e o que `extractFromEdit` deve ignorar.

Isto é uma mudança em `updateScript` ou um caminho de escrita irmão — decidir na implementação, mas
**não é opcional**.

## 8. Onde roda

**Depois do save, como fase própria.** O roteiro é inserido (`index.ts:303-331`), o usuário já pode
lê-lo, e a verificação emite sua própria fase no stream. Se falhar, o roteiro está intacto e salvo —
fail-soft por construção, sem `try/catch` defensivo em volta de nada crítico.

A infra existe e é reutilizável: `app/api/bob/route.ts` é o molde de operação sob demanda com stream
(valida payload → `guardEmit` → emite `phase`/`done`/`error`), e `guardEmit` (`lib/generation.ts:22-32`)
garante que cliente desconectado não aborta o trabalho no servidor.

**Tetos operacionais, que são reais:**

- `app/api/generate/route.ts:2` tem `maxDuration = 300`; `bob` tem 120. N buscas em paralelo cabem,
  N sequenciais não. **Paralelizar o passo 3 é requisito, não otimização.**
- O heartbeat `: ping` a cada 15s (`generate/route.ts:18-24`) existe por causa do idle-timeout do
  proxy da Hostinger. Uma fase longa e silenciosa derruba a conexão — a verificação emite progresso.
- Teto de alegações por rodada. Excedente **não** some: vai para a tabela como "não verificada nesta
  rodada", com o botão de varredura completa para drenar.

O botão de varredura completa é uma rota própria no mesmo molde, sem passar pela geração.

## 9. Persistência

**Nenhuma tabela guarda resultado de análise sobre um roteiro hoje.** `vm_modelagem_analyses` é do
anexo, `vm_hook_classifications` é do corpus e só um script CLI escreve nela. E `pipeline_trace` é
escrito uma vez no insert; nada faz update parcial exceto `updateScript`.

**Decisão: uma coluna, não uma tabela.** `vm_generated_scripts.verificacao jsonb`, migration **0029**
(0027 e 0028 são da peça 1):

```
{ at, regime: 'delta' | 'completa', dossie_presente: bool,
  total_alegacoes, rastreadas, verificadas, excedentes,
  itens: [ { alegacao, trecho_literal, veredicto, fonte, correcao, explicacao, aplicada } ] }
```

Justificativa: é um registro por roteiro, sobrescrito a cada rodada, sem histórico pedido e sem
consulta cruzada. Tabela com FK seria estrutura para uma consulta que ninguém vai fazer. Precedente
direto: `vm_modelagem_analyses.analysis jsonb` (`0001_init.sql:23-29`) guarda uma análise estruturada
inteira e é renderizada por `AnalysisSections` (`session-view.tsx:2028-2085`).

Se um dia houver necessidade de série histórica de verificações, promover a tabela é migration
simples. O contrário — nascer com tabela e nunca consultar — é custo que não volta.

## 10. Interface

**Um `<dialog>` nativo com pseudo-tabela.** O projeto não tem shadcn/Radix e **não tem `<table>` em
lugar nenhum** — zero ocorrências em `components/` e `app/`.

O padrão a copiar é `components/class-videos-dialog.tsx`: hook `useClassVideosDialog` devolvendo
`{ open, dialog }` (`:26-112`), `videos === null` como estado de carregando (`:29`), header fixo +
`<div className="flex-1 overflow-y-auto">` (`:68`), e "linhas" em `div.flex` com colunas alinhadas por
`truncate` / `ml-auto` / largura fixa em `font-mono` (`:78-103`). É o mesmo padrão que a peça 1 usa no
`teach-dialog`.

Cada linha: veredicto (emoji + cor), alegação truncada, fonte como link, e — quando `veredicto ===
'impreciso'` e há `correcao` — o botão de aplicar, com o antes e o depois visíveis.

**Entrada:** selo no card do roteiro com a contagem por veredicto, abrindo o dialog. E o botão de
varredura completa no fim da página, junto de "Gerar nova versão" (`session-view.tsx:1988-1997`).

O rótulo do botão diz o que custa: **"Verificar tudo"**, não "verificar" — a varredura completa é a
operação cara, e a diferença para a automática precisa estar na tela.

## 11. Tratamento de erro

| Falha | Tratamento |
|---|---|
| `grokPesquisa` falha numa alegação | aquela alegação vira `nao_verificavel` com o motivo "busca falhou", **não** `confirmado`. As outras seguem |
| Extração de alegações falha | verificação não roda. Selo mostra "não verificado", nunca "verificado, 0 problemas" |
| `trecho_literal` não casa no roteiro | veredicto vale, botão de correção **não** é oferecido. Registrar o descasamento — é sinal de que o modelo parafraseou |
| Correção aplicada e roteiro mudou no meio | `updateScript` é patch por campo inteiro, sem guarda otimista. Reler antes de aplicar; se mudou, refazer o `split/join` sobre o texto novo ou abortar com aviso |
| Delta vazio (tudo rastreado) | resultado legítimo e bom. Selo diz "nada fora do dossiê", com o botão de varredura completa ao lado |
| Sem dossiê (6 sessões de 44) | tudo é delta. Avisar na tela que a rodada é integral por ausência de pesquisa |
| Estouro do teto por rodada | excedente listado como "não verificada", nunca omitido |

## 12. Checagem

Testes menores que falham se a lógica quebrar:

1. **Filtro de delta** — alegação cujas âncoras estão todas no dossiê é `rastreada`; âncora ausente
   cai no delta; alegação sem âncora nenhuma cai no delta; dossiê ausente joga tudo no delta.
   É o teste que protege o eixo de custo da peça inteira.
2. **Âncoras** — quantidade, data e nome próprio são extraídos; palavra comum não vira âncora.
3. **Correção cirúrgica** — `trecho_literal` presente troca todas as ocorrências; ausente não aplica
   e não lança.
4. **`edicao_humana` intocado** — aplicar correção factual **não** marca `edicao_humana`. É o teste
   que impede a lição envenenada de §7.2, e o mais importante da peça.
5. **Schema da tool** — enum de `veredicto` fechado nos quatro valores.

Não há teste de acerto do verificador: julgamento factual não se testa com `assert`, e o portão dele
é a fonte citada, visível na tabela.

## 13. Fora de escopo, deliberadamente

- **Verificar o dossiê.** Alegação rastreada passa direto por decisão de regime. Se o dossiê errar, o
  erro passa — e o botão de varredura completa é a válvula.
- **Bloquear a geração por veredicto.** ❌ é aviso; o usuário decide. Nada trava.
- **Verificar em toda regeração automaticamente.** Roda por versão salva. Regerar três vezes não paga
  três verificações completas sem o usuário pedir.
- **Histórico de verificações.** Uma coluna sobrescrita (§9). Promover a tabela quando alguém quiser a
  série.
- **Reescrever a frase de um ❌.** Isso é o Bob, que já existe.

## 14. Riscos conhecidos

1. **O dossiê como verdade herdada.** Regime C confia que o que veio da pesquisa está certo. Um erro
   do Grok atravessa o roteiro inteiro sem ser tocado. Mitigado só pela varredura completa, que é
   manual. É o preço explícito do regime, e a peça 2 (§5.1) reduz a superfície ao exigir URL nos
   estudos.
2. **Custo cego.** O Grok **não expõe usage compatível** — `recordUsage` grava só duração
   (`anthropic.ts:30`, `agents.ts:409-411`). A peça mais cara do pacote é a que menos sabe informar o
   próprio custo. Mitigação mínima: contar chamadas e somar duração, e usar `trackedCreate`
   (`anthropic.ts:79-89`) nas duas chamadas Anthropic. Hoje **nenhuma operação sob demanda contabiliza
   custo** — `rewriteFragment` e `bobAssist` chamam o SDK cru.
3. **Falso `rastreada`.** O filtro por âncoras é sintático: uma alegação pode reusar os números do
   dossiê e inverter a causalidade — "X caiu 40% **por causa de** Y" onde o dossiê só diz "X caiu 40%".
   Causalidade não tem âncora. Mitigado parcialmente por o prompt do verificador já tratar
   causalidade como eixo de atenção; residual real, e o motivo de a varredura completa existir.
4. **Paráfrase do `trecho_literal`.** Modelo que reescreve em vez de copiar mata a correção
   cirúrgica. Mitigado por validação com `includes` e rebaixamento para aviso — o veredicto sobrevive,
   só a ação automática cai.
5. **Latência da fase.** N buscas em paralelo dentro de `maxDuration`. Se o delta for grande, o teto
   corta e o excedente vira pendência visível — nunca silêncio.

## 15. Contexto de release

Parte do pacote **2.0**, peça 3 de 4. Depende da peça 1 (padrão de dialog, rastro) e conversa com a
peça 2 (`fontes-autoritativas.json` como hierarquia única).

Cria a migration **0029** (`vm_generated_scripts.verificacao jsonb`), aplicada pelo operador via
Supabase MCP após o merge, como as das peças anteriores.

O alinhamento de `package.json` / `NEXT_PUBLIC_APP_VERSION` (`next.config.ts:18`) e a mensagem de
update (`codex-updates/state.json`) são do pacote, tratados na peça 1.

---

## 16. Correções ao spec, apuradas em 2026-08-16

Registradas aqui em vez de editar as seções acima, para o que mudou não sumir.

### 16.1 §7.2 está incompleto, e é o erro mais caro do spec

O §7.2 manda marcar `correcao_factual` em vez de `edicao_humana`. **Isso não basta, porque o portão
do Professor não lê `edicao_humana`.** Ele lê `roteiro_original`:

```ts
// lib/actions.ts, finalizeSession
const editada = form.edited_version.trim() || (trace.roteiro_original ? script!.roteiro : "");
```

E o próprio §7.2 exige preservar `roteiro_original` (a correção precisa ser revertível). Ou seja:
seguir o spec ao pé da letra **grava `correcao_factual`, não grava `edicao_humana`, e o Professor
aprende assim mesmo** — a lição envenenada continua nascendo, agora com um rótulo tranquilizador
no trace.

**O conserto é no portão:** `finalizeSession` passa a decidir por `trace.edicao_humana`, não por
`trace.roteiro_original`. É seguro para os 47 roteiros existentes: `updateScript` sempre gravou os
dois **no mesmo objeto literal**, então todo roteiro que tem `roteiro_original` hoje também tem
`edicao_humana`. Nenhum comportamento legado muda.

### 16.2 A peça 2 já entregou metade da adaptação 4 do §6.1

`fontesBlock()` existe em `lib/pipeline/agents.ts` desde o commit `d8a1278` (peça 2, Task 1), já
monta a hierarquia a partir de `fontes-autoritativas.json` e já é chamada em toda pesquisa. A
adaptação 4 ("remover a hierarquia embutida no prompt e injetar o JSON") vira **reuso de uma linha**,
não trabalho novo. O `agents.ts:335` que o §6.1 cita como precedente virou essa função.

### 16.3 Duas primitivas necessárias são module-private

- `grokPesquisa` (`lib/pipeline/bob.ts:56`) — o §5 chama de "a razão de a peça ser viável", e ela
  **não é exportada**. Precisa sair de `bob.ts`.
- `norm` (`lib/provenance.ts:6`) — o §4.2 manda reusar a normalização da peça 1, e ela também é
  privada. Precisa ser exportada para o filtro de delta usar a MESMA função, e não uma cópia que
  diverge no primeiro acento.

---

# Plano de implementação

> **Para executores agênticos:** um subagente por task, TDD. Subagente **não** roda `git add` nem
> `git commit`, e **não** aplica migration.

**Goal:** verificar o que o roteirista inventou — as alegações do roteiro final que não são
rastreáveis ao dossiê — com fonte citada, veredicto estruturado e correção cirúrgica quando o dado
certo é conhecido.

**Arquitetura:** regime C (§4). Filtro determinístico de delta antes de qualquer busca, para o custo
crescer com a invenção e não com o tamanho do roteiro. Busca em paralelo, julgamento em lote.

**Stack:** Next.js 16, vitest, `grokPesquisa` para busca web, `ANALYST_MODEL` para extração e
julgamento.

## Global Constraints

- **Custo cresce com a invenção, não com o roteiro.** Qualquer atalho que verifique tudo por padrão
  quebra o eixo de desenho da peça.
- **`nao_verificavel` é resposta válida e esperada.** Nunca inventar confirmação, nunca cair para
  `confirmado` quando a busca falha.
- **Nenhum corte silencioso.** Teto, busca falha, `trecho_literal` que não casa: tudo vai para a
  tabela e para a coluna.
- **Correção factual nunca alimenta o Professor** (§7.2 + §16.1). É o requisito mais duro da peça.
- **Paralelizar o passo 3 é requisito, não otimização** (§8): `maxDuration` é 300 na geração e 120
  no molde do Bob; N buscas sequenciais não cabem.
- Migration **0029**. Baseline da suíte: **28 arquivos, 286 testes**.
- Gate: `npx tsc --noEmit && npx eslint . && npm run check && npm test`.

---

### Task 1: O portão do Professor (§7.2 + §16.1)

**A task mais importante da peça, e a única que conserta um defeito que já existe.** Vem primeiro
porque tudo que escreve no roteiro depende dela estar certa.

**Files:** `lib/actions.ts` · Test: `tests/correcao-factual.test.ts`

- [ ] **Passo 1: escrever o teste que falha.** Correção factual **não** marca `edicao_humana`; marca
      `correcao_factual`; **preserva `roteiro_original`** (a correção é revertível); e o par
      original→corrigido **não** vira insumo de `extractFromEdit`. Extraia a decisão do portão para
      uma função pura (ex. `houveEdicaoHumana(trace)`) para poder testar sem banco.
- [ ] **Passo 2: rodar e confirmar que falha.**
- [ ] **Passo 3:** `updateScript(scriptId, patch, origem: "humano" | "correcao_factual" = "humano")`.
      O default cobre todos os call sites atuais — nenhum quebra.
- [ ] **Passo 4: consertar o portão.** `finalizeSession` decide por `trace.edicao_humana`, não por
      `trace.roteiro_original` (§16.1). Comentar o porquê no código: sem isso alguém "simplifica" de
      volta em seis meses.
- [ ] **Passo 5: gate + commit.**

---

### Task 2: Âncoras e filtro de delta (§4.2)

O coração do regime C. Determinístico, **zero LLM**.

**Files:** `lib/provenance.ts` (exportar `norm`) · `lib/pipeline/delta.ts` (novo) ·
Test: `tests/delta.test.ts`

**Interfaces:** `extrairAncoras(alegacao: string): string[]`;
`ehRastreada(alegacao: string, dossie: string): boolean`.

- [ ] **Passo 1: escrever o teste que falha** (§12.1 e §12.2). Âncoras: quantidade, data e nome
      próprio entram; palavra comum **não**. Delta: todas as âncoras no dossiê → `rastreada`; uma
      âncora ausente → delta; **alegação sem âncora nenhuma → delta**; dossiê vazio → tudo delta.
- [ ] **Passo 2: rodar e confirmar que falha.**
- [ ] **Passo 3: implementar.** Reusar `norm` de `lib/provenance.ts` — **a mesma função, não uma
      cópia**, senão as duas divergem no primeiro acento. Nome próprio = maiúscula **fora de início
      de frase**.
- [ ] **Passo 4: gate + commit.**

**Direção do erro (§4.2):** conservador para o lado de verificar demais. Falso delta custa uma busca;
falso `rastreada` deixa passar invenção, que é o defeito que a peça existe para matar.

---

### Task 3: O verificador — persona e as duas tools (§5.1, §5.4, §6)

**Files:** `agents/verificador.md` (novo) · `lib/pipeline/verificar.ts` (novo) ·
Test: `tests/verificar.test.ts`

- [ ] **Passo 1: portar o prompt do Apêndice A** de `plans/2.0-decisoes.md`, com as quatro
      adaptações do §6.1: remover `<inicializacao>`; remover "responda no chat, nunca crie
      artefato"; trocar o `<formato_de_saida>` markdown pelo tool call; e **remover a hierarquia de
      fontes embutida**, injetando `fontesBlock()` — que a peça 2 já criou (§16.2). O resto entra
      **inalterado**: cronologia, causalidade, superlativo, status atual e as regras de
      arredondamento são o valor do documento e já estão calibradas.
- [ ] **Passo 2: teste de contrato** (§12.5): enum de `veredicto` fechado em
      `confirmado|impreciso|falso|nao_verificavel`.
- [ ] **Passo 3: implementar as duas chamadas.** `registrar_alegacoes` sobre `hook + roteiro +
      comando` salvos; `registrar_verificacao` recebendo delta + resultado de busca. `trackedCreate`
      nas duas (§14.2 — hoje **nenhuma** operação sob demanda contabiliza custo). `max_tokens` com
      folga: thinking divide o teto e trunca o `tool_use`.
- [ ] **Passo 4:** o agente **não recebe o roteiro inteiro** (§6.2) — recebe alegação e evidência.
      Mandar o roteiro convida o modelo a opinar sobre qualidade, que o próprio prompt proíbe.
- [ ] **Passo 5: gate + commit.**

---

### Task 4: Busca em paralelo (§5 passo 3, §8, §11)

**Files:** `lib/pipeline/bob.ts` (exportar `grokPesquisa`) · `lib/pipeline/verificar.ts` ·
Test: `tests/verificar-busca.test.ts`

- [ ] **Passo 1:** exportar `grokPesquisa` (§16.3). É o único ponto do sistema que devolve **fonte
      estruturada** (`annotations.url_citation`) em vez de prosa — sem ele, isto seria infra nova.
- [ ] **Passo 2: paralelizar com teto.** Requisito, não otimização (§8). Excedente vira "não
      verificada nesta rodada", **listada**, nunca omitida.
- [ ] **Passo 3: teste do fail-soft por alegação** (§11): busca que falha vira `nao_verificavel` com
      o motivo, **nunca `confirmado`**, e as outras alegações seguem. É o teste que impede a peça de
      mentir "verificado" quando não verificou.
- [ ] **Passo 4: gate + commit.**

---

### Task 5: Correção cirúrgica (§7.1)

**Files:** `lib/actions.ts` · Test: `tests/correcao-cirurgica.test.ts`

- [ ] **Passo 1: escrever o teste** (§12.3): `trecho_literal` presente troca **todas** as
      ocorrências; ausente **não aplica e não lança**.
- [ ] **Passo 2: implementar** `split(trecho_literal).join(correcao)` + `updateScript(..., "correcao_factual")`.
      **Zero LLM**: quando a verificação já achou o dado certo, os dois lados são conhecidos e não há
      o que gerar.
- [ ] **Passo 3: validar com `includes` ANTES de oferecer o botão** (§11). Paráfrase do modelo mata a
      correção; nesse caso o veredicto sobrevive e só a ação automática cai. Registrar o
      descasamento — é sinal de que o modelo parafraseou.
- [ ] **Passo 4: reler o roteiro antes de aplicar** (§11): `updateScript` é patch por campo inteiro,
      sem guarda otimista. Se mudou no meio, refazer o `split/join` sobre o texto novo ou abortar com
      aviso.
- [ ] **Passo 5: gate + commit.**

**Nota (§7.1):** a substituição global que quebra a peça 2 é **benigna aqui** — um número errado é
errado em toda aparição.

---

### Task 6: Migration 0029 e persistência (§9)

**Files:** `supabase/migrations/0029_verificacao.sql` (novo) · `lib/pipeline/verificar.ts`

- [ ] **Passo 1: escrever o `.sql`.** `alter table vm_generated_scripts add column verificacao jsonb;`
      Coluna, não tabela — decisão 7 do `2.0-decisoes.md`.
- [ ] **Passo 2: gravar o registro** no formato do §9 (`at`, `regime`, `dossie_presente`, contagens,
      `itens[]`).
- [ ] **Passo 3: commit.**

> **STOP — a migration 0029 é aplicada pelo operador via Supabase MCP.** O código que lê a coluna não
> funciona antes disso. Avisar e parar.

---

### Task 7: Onde roda (§8)

**Files:** `app/api/verificar/route.ts` (novo) · `lib/pipeline/index.ts`

- [ ] **Passo 1:** rodar **depois do save**, como fase própria. Se falhar, o roteiro está intacto e
      salvo — fail-soft por construção.
- [ ] **Passo 2: rota de varredura completa** no molde de `app/api/bob/route.ts` (valida payload →
      `guardEmit` → emite `phase`/`done`/`error`). O regime `completa` **pula o filtro de delta**
      (§4.3): toda alegação é verificada.
- [ ] **Passo 3: emitir progresso.** O heartbeat de 15s existe por causa do idle-timeout do proxy da
      Hostinger — fase longa e silenciosa derruba a conexão.
- [ ] **Passo 4: gate + commit.**

---

### Task 8: Interface (§10)

**Files:** `components/verificacao-dialog.tsx` (novo) · `components/session-view.tsx`

- [ ] **Passo 1:** `<dialog>` nativo com pseudo-tabela. O projeto **não tem `<table>` em lugar
      nenhum** — copiar `components/class-videos-dialog.tsx` (linhas em `div.flex`, `truncate`,
      `ml-auto`), o mesmo padrão do `teach-dialog` da peça 1.
- [ ] **Passo 2:** cada linha com veredicto (emoji + cor), alegação truncada, fonte como link e —
      só quando `impreciso` **com** `correcao` — o botão de aplicar, com **antes e depois visíveis**.
- [ ] **Passo 3: entradas.** Selo no card do roteiro com a contagem por veredicto; botão
      **"Verificar tudo"** no fim da página. O rótulo diz o que custa: a varredura completa é a
      operação cara, e a diferença para a automática precisa estar na tela.
- [ ] **Passo 4:** estados honestos (§11): "não verificado" nunca vira "verificado, 0 problemas";
      delta vazio diz "nada fora do dossiê"; sem dossiê avisa que a rodada é integral.
- [ ] **Passo 5: gate + commit.**

---

## Ordem, dependências e portões

| Task | Depende de | Portão |
|---|---|---|
| 1 | — | correção factual não alimenta o Professor |
| 2 | — | alegação sem âncora cai no delta |
| 3 | 2 | enum de veredicto fechado |
| 4 | 3 | busca falha vira `nao_verificavel`, nunca `confirmado` |
| 5 | 1 | `trecho_literal` ausente não aplica e não lança |
| 6 | 3 | **operador aplica a 0029** |
| 7 | 4, 6 | roteiro intacto quando a verificação falha |
| 8 | 7 | selo não mente sobre o que não foi verificado |

Tasks 1 e 2 são independentes entre si e de todo o resto — as candidatas a paralelizar.

## Cobertura do spec

| Seção | Task |
|---|---|
| §4.2 filtro de delta · §4.3 varredura completa | 2, 7 |
| §5 pipeline de 5 passos | 3, 4 |
| §6 agente, adaptações e tool | 3 |
| §7.1 correção cirúrgica | 5 |
| §7.2 + §16.1 armadilha do `edicao_humana` | **1** |
| §8 onde roda, tetos, heartbeat | 4, 7 |
| §9 persistência | 6 |
| §10 interface | 8 |
| §11 tratamento de erro | 4, 5, 8 |
| §12 checagem | 1, 2, 3, 5 |
