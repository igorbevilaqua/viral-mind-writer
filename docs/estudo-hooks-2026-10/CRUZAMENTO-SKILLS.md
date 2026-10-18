# Estudo de hooks (Oráculo, 17/10/2026) x skills por modo (plano 025)

Cruzamento feito em 18/10/2026, só leitura, sem query nem LLM. Fontes: skills/*.md, agents/hook.md, docs/estudo-hooks-2026-10/hooks_1..5, docs/estudo-modos-2026-10/.

Ressalva geral: o estudo de hooks mede o vídeo publicado, com o hook transcrito da fala. No IG, 56% da base são cortes de podcast (vm_script='nao'). "Acerto" ali é estar acima do maior entre 10k e 3x a mediana. O estudo de modos mede o roteiro da casa, e "acerto" é o quartil de cima do coeficiente. Antes de virar regra, refiltrar por vm_script='sim'. Retenção e subhook só são robustos no IG.

## Camada comum (agents/hook.md + roteirista)
- Subhook: hook >=71 com queda <=17 pts dá 77,1% de acerto (n=144); com queda maior, 45,5% (n=187). A primeira frase do corpo aprofunda o absurdo, não traz contexto. CONTRADIZ mecanismo l.32 ("1 a 3 linhas de contexto") e demonstração l.34.
- Promessa vazia: 13,5% (n=74). CONTRADIZ hook.md l.32 e o exemplo Nubank. A segunda camada tem que ser concreta e improvável. Subhook causal: 25,1% (n=251).
- "Esse/Essa" depende do nicho: Empreendedorismo 1,65, Ciência 1,53, IA 0,55. CONTRADIZ hook.md l.66-67.
- Primeira pessoa: falha em 15 de 18 clientes (lift 0,50).
- Pergunta: lift 0,67, falha em 11 de 20 clientes. Só funciona colada a um objeto concreto. CONTRADIZ o exemplo "Yopa" em hook.md.
- 2 mecanismos do playbook acertam 21,6%, contra 16,5% com 1 e 10,1% com nenhum. Melhor par: personagem + tensão (38,7%, n=31). Evitar Crença + Negatividade (6,6%).
- Sentimento: Autoridade 0,56, Didatismo 0,77, Admiração 1,42, Escândalo 1,52.
- Anti-padrões novos:
  - lista numerada: 3,8%
  - acusar o espectador: 0%
  - "Imagina...": 2,9%
  - contexto de série: 8%
  - "Se você...": 14,9%

## Por skill
- Panorama: "com o dado maior" CONTRADIZ o achado de que número na abertura é neutro. A proposta é abrir com país ou marca agindo (lift 1,43, vale para 16 de 23 clientes) e usar o número como escala do feito.
- Mecanismo:
  - Desafio de Crença só funciona no IG e com nome próprio.
  - Acrescentar "declarou guerra" (42,6%, n=54; o deck corrigido usa 43,8%, n=48) e Davi x Golias (36,6%, n=93).
- História:
  - Nome desconhecido nunca entra como revelação: caso Sônia Ramos, retenção de 69 para 30.
  - Proibir "de X a império que fatura N bi" (3,9%).
- Demonstração, mecanismo e panorama: com fato recente, usar "acabou de" + marca (45,5%, n=66), o que bate com a âncora notícia (OR 1,61). Em demonstração, abrir com a marca, não com "Esse novo recurso".

## Perfil do cliente (Task 9), não skill
- Pergunta só funciona em Exame, Lerry e Patrick.
- "Você":
  - funciona em Franklin e Lincoln;
  - falha em Pelozato, Germano e Thiago Franco.
- Primeira pessoa só funciona em Waughan, Manoel e Renato Torres.
- Guerra funciona na Izabela e falha no Lincoln.
- Finanças rejeita Superlativo, Revelação e Urgência. Ciência rejeita Negatividade.

## Cruzar hook x modo (SELECT, sem custo de LLM)
rotulos_modo.jsonl.script_id = public.videos.crm_script_id. No IG ficam cerca de 530/400/170/150 vídeos com retenção por modo. Perguntas que mudam o texto das skills:
1. Contexto depois do hook derruba o subhook em mecanismo?
2. "Dado maior" na abertura atrapalha em panorama?
3. Em história, nome conhecido ou desconhecido?
