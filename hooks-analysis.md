# Análise de Hooks — Fase 0

Gerado por `scripts/analyze-hooks.ts`. Base: corpus (videos + vm_video_stats).

- Candidatos com hook + stats: **1574** selecionados como alta performance (top quartil por score).
- Hooks classificados nesta rodada: **800** (limite 800).
- Score de performance = 0.55·retenção_hook + 0.45·percentil(views) quando há retenção; senão percentil(views). Boost VM ×1.15.

## Leaderboard de mecanismos
Ordenado por presença no top decil de performance (o sinal mais forte), desempate por retenção mediana.

| # | Mecanismo | n | % no top decil | retenção mediana | views mediana | % VM |
|---|---|---|---|---|---|---|
| 1 | Conflito Declarado | 97 | 14% | 79% | 185.468 | 78% |
| 2 | Contraste Extremo | 462 | 13% | 79% | 127.811 | 81% |
| 3 | Apelo Histórico | 9 | 11% | — | 54.266 | 78% |
| 4 | Revelação Secreta | 211 | 11% | 79% | 143.511 | 73% |
| 5 | Viés de Negatividade | 109 | 10% | 76% | 229.747 | 61% |
| 6 | Viés de Ilegalidade | 33 | 9% | 94% | 106.364 | 88% |
| 7 | Ultra Especificidade | 168 | 9% | 81% | 134.723 | 73% |
| 8 | Desafio de Crença | 73 | 8% | 77% | 203.727 | 53% |
| 9 | Superlativo | 127 | 8% | 81% | 117.723 | 80% |
| 10 | Elemento Controverso | 69 | 7% | 75% | 186.220 | 46% |
| 11 | Apelo à Autoridade | 17 | 6% | 78% | 244.711 | 53% |
| 12 | Ordem Contra-intuitiva | 23 | 4% | — | 106.789 | 74% |
| 13 | Urgência | 48 | 2% | 76% | 269.564 | 40% |
| 14 | Outro | 15 | 0% | — | 215.890 | 20% |
| 15 | Apelo à Maioria | 3 | 0% | — | 718.784 | 33% |
| 16 | Apelo ao Esforço | 1 | 0% | — | 271.155 | 0% |

## Exemplos reais (top performers por mecanismo)

**Conflito Declarado**
  - "O Ratinho venceu o governo e cancelou uma multa de R$ 58 milhões. E a jogada que ele usou, qualquer brasileiro pode repetir." _(VM)_
  - "a China acabou de destruir o chat gpt e quase ninguém percebeu isso porque enquanto você paga cem reais por mês no chat gpt Plus a China liberou o kimiaiai" _(VM)_
  - "o Google matou o Duolingo com essa nova ferramenta secreta e gratuita e se você ainda tá usando o app da corujinha pra aprender um novo idioma você precisa conh" _(VM)_

**Contraste Extremo**
  - "Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica." _(VM)_
  - "O Silvio Santos fez uma jogada genial que evitou qualquer dor de cabeça para sua família após a sua morte." _(VM)_
  - "Coca-Cola gasta milhões no Nordeste, mas existe uma bebida cearense que ela não consegue superar." _(VM)_

**Apelo Histórico**
  - "a contagem regressiva começou a China vai implementar no Brasil os pagamentos com a palma da mão ainda esse ano" _(VM)_
  - "É histórico: a China liberou de graça a tecnologia que pode resolver os maiores problemas da humanidade. Simplesmente o primeiro sistema operacional quântico do" _(VM)_
  - "Eu não sei como muita gente ainda não percebeu o que acabou de acontecer no Brasil. Repara nisso daqui, nunca na história do Brasil um ministro do STF sofreu im"

**Revelação Secreta**
  - "O Silvio Santos fez uma jogada genial que evitou qualquer dor de cabeça para sua família após a sua morte." _(VM)_
  - "O Ratinho venceu o governo e cancelou uma multa de R$ 58 milhões. E a jogada que ele usou, qualquer brasileiro pode repetir." _(VM)_
  - "A China está construindo um verdadeiro país paralelo no nordeste brasileiro e quase ninguém está percebendo isso." _(VM)_

**Viés de Negatividade**
  - "Charlie Brown Júnior cometeu um erro fatal que se tornou hoje um pesadelo para os herdeiros da banda." _(VM)_
  - "numa cidade do interior de Santa Catarina, uma mulher de 38 anos enterrou o marido. Ela ficou sem renda, com filhos pequenos pra criar, com uma única coisa que " _(VM)_
  - "Esses estudantes gaúchos criaram uma solução para um problema que a indústria farmacêutica sempre ignorou." _(VM)_

**Viés de Ilegalidade**
  - "A Larissa Manuela acumulou R milhões de reais, mas não tinha acesso à própria conta bancária. O pior que tudo isso era legal." _(VM)_
  - "R$ 6 bilhões de reais em mercadorias foram usadas para segar imposto bem na frente dos olhos do governo. Tudo isso sem maleta de dinheiro, sem conta no exterior" _(VM)_
  - "O Google liberou cinco ferramentas secretas que dão uma vantagem injusta para quem sabe usar. Elas fazem o trabalho de uma equipe inteira com simples mensagens " _(VM)_

## Formato vs mecanismo — o formato é fator viral ou só enquadramento?
Baseline: no top decil por definição caem ~10% dos hooks. Se um formato tem top-decil share ≈ 10%, ele é **neutro** (não é o driver — o mecanismo é).

| Formato | n | % no top decil | views mediana |
|---|---|---|---|
| Nenhum | 499 | 9% | 135.799 |
| Personagem Central | 261 | 12% | 172.652 |
| Visual | 40 | 10% | 169.564 |

## Combinações de mecanismos que mais co-ocorrem em vencedores

- Contraste Extremo + Ultra Especificidade — 96×
- Contraste Extremo + Revelação Secreta — 90×
- Contraste Extremo + Superlativo — 61×
- Conflito Declarado + Contraste Extremo — 42×
- Contraste Extremo + Viés de Negatividade — 38×
- Contraste Extremo + Desafio de Crença — 19×
- Contraste Extremo + Elemento Controverso — 18×
- Urgência + Viés de Negatividade — 18×
- Revelação Secreta + Ultra Especificidade — 16×
- Desafio de Crença + Revelação Secreta — 16×
- Elemento Controverso + Revelação Secreta — 16×
- Contraste Extremo + Ordem Contra-intuitiva — 15×
- Conflito Declarado + Revelação Secreta — 14×
- Revelação Secreta + Superlativo — 14×
- Revelação Secreta + Viés de Negatividade — 14×

## Palavras mágicas mais frequentes

- ninguém — 69×
- nunca — 17×
- segredo — 7×
- descobriu — 6×
- revelou — 4×
- perturbador — 3×
- escondido — 2×
- urgente — 2×
- oculto — 2×
- proibido — 1×

## Mecanismos dominantes por cliente (amostra)

- `90207e43`: Contraste Extremo (9), Ultra Especificidade (3), Conflito Declarado (2)
- `1c78ff87`: Contraste Extremo (45), Revelação Secreta (32), Ultra Especificidade (24)
- `5d4b5479`: Contraste Extremo (31), Revelação Secreta (11), Ultra Especificidade (9)
- `2b7a90ab`: Contraste Extremo (3), Ultra Especificidade (2), Elemento Controverso (1)
- `efd9363f`: Contraste Extremo (53), Ultra Especificidade (12), Superlativo (10)
- `421ca796`: Contraste Extremo (31), Ultra Especificidade (7), Superlativo (7)
- `4747cfd1`: Contraste Extremo (54), Revelação Secreta (35), Ultra Especificidade (26)
- `220775c1`: Contraste Extremo (82), Conflito Declarado (39), Revelação Secreta (35)
- `22e9a877`: Contraste Extremo (51), Ultra Especificidade (24), Superlativo (13)
- `c7903b1d`: Revelação Secreta (8), Conflito Declarado (8), Contraste Extremo (7)
- `2dc6917a`: Contraste Extremo (16), Revelação Secreta (12), Superlativo (6)
- `4333482d`: Contraste Extremo (14), Ultra Especificidade (11), Superlativo (9)
- `bc02d790`: Contraste Extremo (1), Desafio de Crença (1), Viés de Negatividade (1)
- `8de0a02e`: Contraste Extremo (1), Viés de Negatividade (1)
- `6c5182af`: Contraste Extremo (8), Ordem Contra-intuitiva (2), Viés de Negatividade (2)
- `e0853d4b`: Contraste Extremo (8), Revelação Secreta (4), Conflito Declarado (2)
- `268046b7`: Viés de Negatividade (4), Contraste Extremo (4), Superlativo (3)
- `77049250`: Contraste Extremo (24), Elemento Controverso (13), Superlativo (12)
- `5c2c9cdc`: Desafio de Crença (2), Revelação Secreta (2), Contraste Extremo (1)
- `288ef2cf`: Ultra Especificidade (2), Outro (1), Contraste Extremo (1)

---
_Próximo passo (Fase 1): usar este leaderboard + os fundamentos psicológicos para reescrever `playbooks/hook.md` ordenado por performance, com revisão humana antes de versionar em `vm_playbooks`._
