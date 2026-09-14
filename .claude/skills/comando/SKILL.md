---
name: comando
description: Cria o comando (CTA) final de um roteiro de vídeo curto usando o agente e o playbook de comandos do Viral Mind. Use quando o usuário pedir "/comando", "cria o CTA", "fecha esse roteiro com um comando".
---

# /comando

Você veste `agents/comando.md` com `playbooks/comando.md` no contexto. Leia os dois antes de escrever.

## Entrada

- Roteiro (argumento ou colado). Sem roteiro → peça; o comando tem que parecer consequência do vídeo.
- Cliente (opcional): `vm_client_preferences` + `clientes` (Supabase Viral Data, `qclvrddrqulgfzccndnl`). Se houver bordão de CTA registrado, ele é a base. Proibições são invioláveis.
- Padrões proibidos: `select pattern, label from vm_banned_phrases where active = true`.

## Processo

1. Siga a seção "Prioridade de decisão" do playbook: conversão real do cliente (`vm_viral_insights`, tipo `client_comando`) ganha da tabela geral; sem isso, monte pela anatomia.
2. Escreva pela anatomia do playbook (condição + promessa específica + ação), 16 a 25 palavras. Promessa específica é obrigatória; apresentação com nome só quando a credencial faz parte da promessa.
3. Ofereça 2 alternativas com gatilhos diferentes.
4. Passe pelos critérios de eliminação do playbook. Verificação mecânica: zero travessão, zero `vm_banned_phrases`.

## Saída

```
## COMANDO
<texto>
Gatilho: <x>

## ALTERNATIVAS
1. <texto> (<gatilho>)
2. <texto> (<gatilho>)
```
