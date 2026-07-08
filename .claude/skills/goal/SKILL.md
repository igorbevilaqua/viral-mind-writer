---
name: goal
description: Produz um roteiro viral completo rodando a sala de agentes do Viral Mind (pesquisa Grok → narrativas → ranking por dados → roteiro → hook/comando → revisão → humanização). Use quando o usuário pedir /goal <tema do vídeo>.
---

# /goal — Sala de Roteiristas Multiagente

Você vai produzir um roteiro viral executando o MESMO protocolo do app (`lib/pipeline/index.ts`), agente por agente. Os papéis vivem em `agents/*.md` — leia cada um antes de vesti-lo; eles são a fonte única de verdade.

O tema do vídeo é o argumento recebido. Se o usuário indicar um cliente, carregue as preferências dele (tabela `vm_client_preferences` + `clientes`) e trate proibições como invioláveis.

## Insumos (carregar primeiro, em paralelo quando possível)

Projeto Supabase **Viral Data** (`qclvrddrqulgfzccndnl`), via MCP:
- Playbooks: `select slug, content from vm_playbooks where active = true`
- Padrões proibidos: `select pattern, label, severity from vm_banned_phrases where active = true`
- Insights: `select insight_type, scope, payload from vm_viral_insights where scope in ('global', 'client:<id>')`

## Protocolo (executar na ordem; não pule a negociação)

1. **Pesquisador** (`agents/pesquisador.md`) — monte o dossiê com busca em tempo real. Prefira a API do Grok: `curl https://api.x.ai/v1/responses` com `{"model":"grok-4.3","instructions":"<conteúdo de agents/pesquisador.md>","input":"TEMA: ...","tools":[{"type":"web_search"}]}` e a chave `GROK_API_KEY` do `.env.local`. Se indisponível, use WebSearch/firecrawl seguindo o mesmo prompt. Pesquisa falhou = siga com dossiê vazio, nunca aborte.
2. **Storytelling** (`agents/storytelling.md`) — com o playbook `storytelling` no contexto, proponha 2-3 narrativas candidatas (macrogrupos diferentes, beats lastreados no dossiê).
3. **Dados** (`agents/dados.md`) — com os insights no contexto, rankeie as candidatas (score 0-100 + justificativa citando dados) e produza `orientacao_roteiro` e `orientacao_hook`. A de maior score vence.
4. **Apresente ao usuário** as candidatas com scores e a vencedora destacada. Se ele quiser trocar, troque; se não responder ou aprovar, siga com a vencedora.
5. **Roteirista-chefe** (`agents/roteirista.md`) — escreva HEADLINE + CORPO + FONTES executando os beats da vencedora. O corpo NÃO inclui hook nem CTA.
6. **Hook** (`agents/hook.md`) + **Comando** (`agents/comando.md`) — ambos vendo o corpo pronto, a narrativa e as orientações dos dados. Hook principal + 3 variações (mecanismos diferentes); comando com benefício explícito.
7. **Revisão** (`agents/revisao.md`) — monte o roteiro completo e revise com os 6 chapéus + checklist do playbook `checklist`. Corrija o que reprovar.
8. **Humanizador** (`agents/humanizador.md`) — passe final de naturalidade. TRAVESSÃO É PROIBIDO (— e –): zero ocorrências. Nenhum padrão de `vm_banned_phrases` pode sobreviver — verifique mecanicamente (grep) e reescreva até zerar.

## Entrega final

Formato exato:

```
## HEADLINE
## HOOK
## ROTEIRO        (hook incluído no início)
## VARIACOES_DE_HOOK  (3, numeradas)
## COMANDO
## FONTES         (todo dado específico com origem)
```

Antes do roteiro, mostre em 3 linhas: narrativa vencedora (título + estrutura + score) e o racional do hook.
