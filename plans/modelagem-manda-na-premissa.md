# Modelagem manda na premissa; prompt vira direção

Decisões travadas com o operador em 2026-08-18. Fonte da verdade da implementação.
**Isto inverte deliberadamente uma decisão anterior** que está defendida em comentários no
código (`modelagem.ts:171-173`, `index.ts:173-175`). Esses comentários precisam ser
reescritos, não deixados contradizendo o comportamento novo — comentário que mente é pior
que comentário ausente.

## Motivação

Duas coisas quebradas, encontradas na sessão real `84c425ad-80f3-42a3-b76c-0e4612858601`:
`vm_sessions.premissa` gravada literalmente como a string `<UNKNOWN>`, e o roteiro inteiro
escrito servindo a ela sob o cabeçalho "PREMISSA (o fio condutor — INEGOCIÁVEL)".

E uma divergência de produto: hoje, digitar prompt **desliga** a extração de tese da
modelagem (o campo `compreensao` é deletado do schema da tool). O operador quer o oposto.

## Regra 1 — toda sessão tem premissa declarável, ou para

Hoje `if (extraida)` (`index.ts:183`) **não tem `else`**: autópsia sem tese escorrega para
`derivePremissa`, que roda com prompt vazio e zero materiais (o anexo de modelagem é
excluído por `!a.is_modelagem`, `premissa.ts:74`) e o modelo, forçado por `tool_choice`,
inventa um placeholder.

- Falha de autópsia em sessão com modelagem **para o fluxo com mensagem clara** ("não
  consegui extrair a tese do vídeo"), em vez de degradar em silêncio. A regra "modelagem que
  falha nunca derruba a geração" deixa de valer quando a modelagem é a fonte da premissa —
  ela é o trabalho, não um enfeite.
- **Nunca** chamar `derivePremissa` sem insumo. Sem tema e sem materiais, não há o que
  derivar; pedir ao modelo que preencha o campo é fabricar premissa.
- **Guarda de sanidade** como última linha, antes de congelar a premissa: rejeitar vazio,
  placeholder (`<...>`, `unknown`, `n/a`, `desconhecid*`) e texto curto demais para ser tese.
  Função pura, testada. Não é a correção principal — é o cinto, e existe porque a próxima
  fabricação vai ter outro formato.

## Regra 2 — com modelagem marcada, a premissa sai do vídeo

`adaptation` deixa de depender de o prompt estar vazio. **Qualquer material marcado como
modelagem (Modelar ou Replicar) faz a premissa vir do vídeo.**

- `comTema` **morre como conceito**: o `delete props.compreensao` (`modelagem.ts:174`) sai.
  A autópsia sempre extrai `compreensao.argumento_central`, porque é dela que a tese vem.
- A missão da autópsia para de dizer "escrever sobre outro tema" (`modelagem.ts:447`).
  O assunto é o do próprio vídeo; o prompt não é assunto novo.
- A pausa `aguardando_premissa` + `artifacts.premissa_sugerida` passa a valer para **toda**
  sessão com modelagem sem premissa digitada. O mecanismo já existe e já sobrevive a reload
  (`session-view.tsx`, `confirmarPremissa`) — reusar, não reinventar.
- **Cache de autópsia:** as análises gravadas antes desta mudança foram pagas com
  `comTema=true` e não têm `compreensao`. O `exigeTese` de `filtroDeAutopsia`
  (`modelagem.ts:411`) já rejeita cache sem tese — confirmar que continua rejeitando, para
  que sessão nova não seja servida com análise velha e mutilada.

**Com modelagem marcada, não existe premissa digitada.** O campo de premissa **some do
formulário** (some, não fica desabilitado: campo cinza pede explicação, campo ausente não
levanta a pergunta). A premissa é extraída do vídeo, ponto — não há dois donos da tese.

Onde isso é garantido, com cuidado para não quebrar o run 2:

- **Na criação** (`createSession`, `lib/actions.ts`): com qualquer anexo `is_modelagem`, a
  premissa digitada é ignorada e `premissa_origem` fica null. É aqui que a regra mora,
  porque é o único momento em que "premissa digitada pelo usuário" existe. UI não é
  invariante — a checagem tem que estar no servidor também.
- **NÃO** transformar isso em "ignorar `ctx.premissa` quando há modelagem" dentro do
  pipeline. Depois da confirmação, `confirmarPremissa` grava `premissa` com origem
  `modelagem`, e no run 2 essa premissa **tem** que vencer. Confundir os dois casos faz a
  sessão entrar em laço infinito de confirmação.
- Editar a premissa **depois** de extraída continua valendo (é a caixa de confirmação, e o
  `updatePremissa`). O que deixa de existir é declará-la antes de o vídeo ser lido.

Resultado da precedência: `confirmada da modelagem > extraída da modelagem > digitada
(só quando não há modelagem) > derivada`.

## Regra 3 — com modelagem, o prompt é direção, nunca tema

Hoje `ctx.prompt` vira a palavra "TEMA" em seis agentes (`premissa.ts:92`, `agents.ts:461`,
`:579`, `:703`, `draft.ts:462`, `modelagem.ts:447`). Com modelagem marcada, ele passa a ser
**complementar**: direcionamento, palpite, sugestão de pesquisa, informação extra, sugestão
de hook, sugestão de comando.

O canal já existe e está escrito com as palavras certas — `ORIENTAÇÃO DE ÂNGULO DO USUÁRIO
(recorte DENTRO da mesma tese — não é tema novo e não autoriza trocar de assunto)`
(`agents.ts:457-460`, `draft.ts:430-435`), hoje atrás de `replicar`/`adapt`. Generalizar para
toda modelagem e **distribuir para quem sabe usar cada tipo de direção**:

| Agente | O que a direção significa lá |
|---|---|
| pesquisador | sugestão de pesquisa, informação extra a confirmar |
| roteirista | recorte, ênfase, "cite o exemplo X", "seja mais crítico" |
| hook | sugestão de hook |
| comando | sugestão de comando |

Travas do bloco, em todos eles: é **sugestão, não ordem**; não autoriza trocar de assunto;
não revoga a premissa nem a arquitetura; e o agente pode ignorá-la se ela conflitar com o
que ele tem de mais forte — dizendo no rastro que ignorou.

Sem modelagem, nada muda: prompt continua sendo tema.

**Não criar campo novo no banco.** O significado do `prompt` passa a depender de haver
modelagem, que é exatamente a distinção que o operador descreveu. A UI é que precisa dizer
isso: com modelagem marcada, o rótulo e o placeholder do campo mudam de "tema" para
"direções (opcional)".

## Regra 4 — no máximo 1 material como modelagem ou replicagem

"Ambos ditam a linha central do conteúdo", então dois é contradição, não riqueza.

- Hoje Modelar aceita N sem teto: todas são analisadas e pagas, os briefs são concatenados
  (`draft.ts:272`) sob uma instrução escrita no singular, e só `modelagens[0]` participa de
  tese e pesquisa. Silencioso.
- Passa a valer o padrão que **Replicar já tem**: fica o primeiro, os demais vão ao rastro
  (`anexoReplicar`/`ignoradosNoReplicar`, `index.ts:115-117`, `:273`). Generalizar.
- A UI impede marcar um segundo (o Replicar já é exclusivo — estender a Modelar), e o
  pipeline garante de novo, porque UI não é autorização nem invariante.
- Anexo excedente **não vira lixo silencioso**: continua valendo como material de referência
  comum, e o descarte da condição de modelagem é registrado.

## O que checar no fim

A incoerência que existe hoje precisa desaparecer: o bloco `# MATERIAL MODELADO — MESMA TESE,
VERSÃO MELHOR` (`draft.ts:263-272`) manda "sustente a mesma premissa" apontando para uma tese
que o roteirista nunca recebeu, porque `compreensao` havia sido deletada. Com a Regra 2 a tese
passa a existir de verdade — confirmar que ela chega ao roteirista.
