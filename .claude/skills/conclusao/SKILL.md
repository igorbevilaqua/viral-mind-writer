---
name: conclusao
description: Escreve ou reescreve a conclusão (payoff final) de um roteiro de vídeo curto — o último beat que fecha o loop aberto pelo hook, antes do comando. Use quando o usuário pedir "/conclusao", "fecha esse roteiro", "o final tá fraco", "melhora a conclusão".
---

# /conclusao

Não existe agente nem playbook de conclusão ainda; esta skill opera com as regras do `agents/roteirista.md` (leia antes) e do `playbooks/checklist.md`. Quando o playbook de conclusões existir, ele passa a mandar.

## O que é a conclusão

O último beat do corpo. É onde o payoff se completa: a lacuna que o hook abriu fecha AQUI, e só aqui. Não é resumo, não é moral da história, não é o comando (o CTA vem depois e é de outra skill).

## Entrada

- Roteiro completo, com hook (argumento ou colado). Sem hook → peça; a conclusão paga a promessa do hook, precisa saber qual é.
- Padrões proibidos: `select pattern, label from vm_banned_phrases where active = true` (Supabase Viral Data, `qclvrddrqulgfzccndnl`).

## Processo

1. Identifique em 1 frase a promessa do hook e a pergunta implícita que o espectador carrega até o fim.
2. Verifique se o roteiro atual responde essa pergunta na última frase. Se responde antes, o final é anticlímax: proponha mover ou reforçar.
3. Escreva a conclusão: 2 a 5 frases faladas, fato ou virada concreta (nome, número, cena), sem anunciar ("e a lição é", "no final das contas"), sem repetir o hook.
4. Verificação mecânica: zero travessão, zero `vm_banned_phrases`, não reabre loop novo.

## Saída

```
## PROMESSA DO HOOK
<1 frase>

## CONCLUSAO
<texto>

## POR QUE FECHA
<1 frase: qual pergunta responde e por que só agora>
```
