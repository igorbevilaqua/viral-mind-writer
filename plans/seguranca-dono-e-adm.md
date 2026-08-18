# Autorização: dono nas mutações, adm nas decisões globais

Decisões travadas com o operador em 2026-08-18. Este arquivo é a fonte da verdade da
implementação; onde o código divergir daqui, o código está errado.

## O diagnóstico

São **dois** problemas distintos, e o de "papel de adm" é o menor.

**1. Nenhuma mutação verifica dono.** `writerScope()` (`lib/hub.ts:36`) protege a *leitura*
de `/sessions` e `/sessions/[id]`. Toda escrita aceita `sessionId`/`scriptId` cru do cliente
e age. Como todo acesso é service role (`lib/db.ts`) e a RLS só bloqueia o anon
(`0011_rls_service_role.sql`), não existe segunda barreira: o que não é checado em código
não é checado em lugar nenhum.

Agravante: **o uuid do roteiro é público** — é o mesmo id da URL de compartilhamento
`/r/[id]`. Um link de leitura enviado a um cliente carrega o identificador que permite a
qualquer pessoa logada editar, publicar ou encerrar aquele roteiro.

**2. Sete ações mudam o prompt de todos os clientes** e estão disponíveis a qualquer login.

## Regra 1 — dono (ou adm) em toda mutação

Admin continua passando por tudo: é a mesma semântica já estabelecida em `writerScope`
("adm vê todas as sessões, usuário comum só as próprias"). Não inventar regra nova.

Helper único, server-side, que **lança** (nunca devolve booleano silencioso):

- por sessão: resolve `vm_sessions.user_id`
- por script: resolve `vm_generated_scripts.session_id → vm_sessions.user_id`
- por thread: resolve `vm_kasparov_threads.user_id`

Aplicar em (nomes conforme `lib/actions.ts` no HEAD atual):

| Alvo | Ações |
|---|---|
| sessão | `finalizeSession`, `confirmarPremissa`, `updatePremissa`, `updateSessionClient`, `suggestFragment` |
| script | `updateScript`, `markPublished`, `quickFeedback`, `verificarScript`, `aplicarCorrecao`, `swapHook`, `explicarTrecho` |
| rotas | `POST /api/generate` (sessionId), `POST /api/bob` (sessionId), `POST /api/verificar` (scriptId), `POST /api/kasparov` (threadId) |

`/r/[id]` é leitura pública **por desenho** e não muda: a regra vale para mutação e para
leitura de dado interno (ex.: `explicarTrecho` lê `pipeline_trace`), nunca para a página
de compartilhamento.

Threads do Kasparov ganham o mesmo tratamento de `/sessions/[id]`: `notFound()` na leitura
de thread alheia (`app/kasparov/[id]/page.tsx`), rejeição na escrita
(`app/api/kasparov/route.ts`). O padrão a copiar já existe no repo.

## Regra 2 — adm nas sete decisões globais

| Ação | Por que é global |
|---|---|
| decidir critério de few-shot (fila do Kasparov → `decidirCriterioDb`) | troca ~4 dos 5 exemplos que roteirista e humanizador imitam |
| `promoteHookPlaybook` | troca o manual que todos os agentes leem |
| `dismissHookPlaybook` | `DELETE` irrecuperável de proposta |
| `setLearningActive` | lição ativa entra no prompt de todos |
| `updateLearning` | reescreve o texto de uma lição ativa — é o mesmo poder de `setLearningActive`, por outra porta (acrescentado em 2026-08-18) |
| `addLearning` | nasce `active=true` por default de coluna |
| `saveLesson` | aceita `active` vindo do cliente |
| `gravarEnsinamento` casos `frase_banida` e `playbook` | regex de lint em produção / proposta de playbook |

`gravarEnsinamento` caso `licao` segue aberto: nasce `active:false`, é proposta, e a
curadoria (que vira adm) é o portão.

## Regra 3 — preferências de cliente: adm edita, todos leem

Decisão do operador. **Não** criar modelo de "meus clientes" — não existe vínculo
usuário↔cliente no código e inventá-lo agora é decisão de produto, não de segurança.

- `/settings/clientes` e `/settings/clientes/[id]`: leitura para qualquer login.
- `savePreferences` e `gravarEnsinamento` caso `vocabulario`: adm.
- O editor renderiza em modo leitura para não-adm, sem botão de salvar.

## Fica aberto de propósito

Bullets (`addBullet`, `voteBullet`) e calibração (`submitCalibrationVote`) são commons, com
voto único por pessoa. Criar sessão é de todos.

Fora de escopo desta rodada, registrado para não se perder: cota nas rotas caras
(`/api/verificar` completa, `/api/generate`, `/api/kasparov`, `requestMoreProbes`) e
moderação de bullets — hoje dá para adicionar e votar, nunca remover.

## Como não quebrar o uso normal

A UI também esconde o que o usuário não pode fazer, para ninguém esbarrar em erro; mas a
checagem que vale é a do servidor. Esconder botão não é autorização.
