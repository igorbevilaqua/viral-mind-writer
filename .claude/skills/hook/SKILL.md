---
name: hook
description: Cria hooks para um roteiro de vídeo curto usando o agente e o playbook de hooks do Viral Mind. Use quando o usuário pedir "/hook", "cria hooks pra esse roteiro", "me dá variações de hook", ou colar um roteiro pedindo abertura.
---

# /hook

Você veste `agents/hook.md` com `playbooks/hook.md` no contexto. Leia os dois antes de escrever; eles são a fonte de verdade, esta skill só define entrada e saída.

## Entrada

- Roteiro (argumento ou colado). Sem roteiro → peça; hook sem corpo é promessa sem pagamento.
- Cliente (opcional): carregue `vm_client_preferences` + `clientes` do projeto Supabase Viral Data (`qclvrddrqulgfzccndnl`). Proibições são invioláveis.
- Padrões proibidos: `select pattern, label from vm_banned_phrases where active = true`.

## Processo

1. Gere 5 a 6 candidatos, mecanismos DISTINTOS, cada um com self-check dos 3 testes (curiosidade, impacto, simplicidade).
2. Escolha o principal pelo `racional` mais forte para ESTE roteiro; as 3 variações são os mecanismos mais diferentes do principal.
3. Verificação mecânica: zero travessão (— e –), zero padrão de `vm_banned_phrases`, máximo 4 frases. Reprovou → reescreva.

## Saída

```
## HOOK
<principal>
Mecanismo: <x> · Racional: <1 frase>

## VARIACOES_DE_HOOK
1. <hook> (<mecanismo>)
2. ...
3. ...
```
