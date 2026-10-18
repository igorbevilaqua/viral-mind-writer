# Hooks × retenção nos primeiros segundos

Viral Media Labs · base Oráculo (Supabase `qclvrddrqulgfzccndnl`) · extraído em 17/10/2026 · só SELECT

> **Como ler este documento.** Todo número abaixo saiu de uma query real. A análise é **observacional**: mostra o que anda junto com retenção alta, não o que a causa. O cliente, o tema, a edição, a voz e o momento da notícia também mexem na retenção, e nenhum deles está no texto do hook. Sempre que deu, comparei cada vídeo com a média **do próprio cliente**, para tirar o efeito "esse cliente sempre retém mais".

---

## 0. Base e o que os campos significam

### Filtros
`oraculo.fato_video` + `public.videos`, com retenção preenchida, sem `maturando`, sem `removido`, sem `is_repost`, com hook preenchido e com `cliente_nome`.

| Plataforma | Vídeos | Clientes | Taxa de acerto | Views medianas | Período |
|---|---|---|---|---|---|
| Instagram | 1.290 | 20 | 23,7% | 9.058 | 19/01 a 14/09/2026 |
| TikTok | 325 | 7 | 7,1% | 611 | fev a set/2026 |

Facebook e YouTube não têm retenção nenhuma na base.

### O que concluí sobre a escala
- **São percentuais de 0 a 100, sempre inteiros.** Instagram e TikTok usam a mesma escala: mediana do hook 64 no IG e 61 no TikTok.
- **`retencao_hook`** é a % da audiência que ainda está assistindo no fim do hook (o primeiro ponto do gráfico de retenção). **`retencao_subhook`** é o segundo ponto, alguns segundos depois. **`retencao_final`** é a % que chega ao fim. Nenhuma migration ou comentário de coluna diz em que segundo exato fica cada ponto. O código só trata os três como o "funil de 3 pontos" (`fn_retencao_diagnostico`, migration 0031). Tratei o hook como "os primeiros ~3 s", mas isso é uma inferência, não está documentado.
- O subhook fica abaixo do hook em praticamente 100% dos casos: só 1 vídeo do IG válido tem subhook > hook. A queda mediana hook→subhook é de **21 pontos** no IG e **20** no TikTok.
- **Anomalia que exclui:** todo o **Instagram do Rodrigo Waughan** (161 vídeos, mediana do hook = 106, 101 vídeos acima de 100%). A escala não bate com o resto e provavelmente o dado foi registrado errado. O **TikTok** dele está normal (mediana 60,5) e ficou na base. Também ficaram de fora os vídeos com hook = 0.
- `public.metricas_retencao` guarda 5.989 snapshots de 1.948 vídeos. Entre snapshots do mesmo vídeo, a amplitude mediana do hook é **0**, ou seja, a métrica é estável e o `fato_video` usa o último snapshot.
- **O cliente explica 28% da variância da retenção do hook no IG** (13% no TikTok). Por isso as comparações "vs. cliente" abaixo são mais confiáveis que as brutas.

---

## 1. Distribuição da retenção

| | p10 | p25 | **Mediana** | **p75** | p90 |
|---|---|---|---|---|---|
| IG · hook | 45 | 55 | **64** | **71** | 76 |
| IG · subhook | 24 | 32 | **42** | **51** | 59 |
| IG · final | – | 5 | 10 | 17 | 24 |
| TikTok · hook | 45 | 52 | **61** | **68** | 72 |
| TikTok · subhook | 25 | 31 | **39** | **47** | 53 |
| TikTok · final | – | 3 | 4 | 7 | 12 |

**Retenção alta = quartil de cima:** hook **≥ 71 no IG** e **≥ 68 no TikTok**; subhook **≥ 51 no IG** e **≥ 47 no TikTok**.

A taxa de não-seguidores tem mediana de 58% no IG (p75 de 77%) e de 87% no TikTok (p75 de 92%).

---

## 2. A retenção do hook prevê acerto? Sim, e muito

### Instagram, por quartil de `retencao_hook` (n ≈ 322 por quartil)

| Quartil | Faixa | Taxa de acerto | % ≥100k views | Views medianas | Coef. viral mediano | Não-seguidores (mediana) |
|---|---|---|---|---|---|---|
| Q1 | 3–55 | **3,1%** | 1,9% | 3.096 | 0,67 | 48% |
| Q2 | 55–64 | 8,7% | 3,7% | 6.703 | 0,94 | 53% |
| Q3 | 64–71 | 23,0% | 10,2% | 14.297 | 1,30 | 64% |
| Q4 | 71–100 | **60,2%** | 46,0% | **77.747** | **4,81** | **79%** |

**Mesmo comparando cada vídeo com os do próprio cliente** (quartil calculado dentro de cada cliente), o quartil de cima tem **60,6%** de acerto e o de baixo, **4,9%**. Ou seja, o efeito não vem de "cliente bom retém mais".

**Na prática:** no IG, sair do quartil de baixo para o de cima no hook multiplica a taxa de acerto por **cerca de 19** (3,1% → 60,2%). Os ~7 pontos entre a mediana (64) e o p75 (71) separam uma taxa de 23% de uma de 60%.

### TikTok (n ≈ 81 por quartil; os acertos são poucos, então a leitura é frágil)
Q1 1,2% · Q2 2,5% · Q3 3,7% · **Q4 21,0%**. As views medianas vão de 491 a 1.347 e os não-seguidores, de 85% a 93%.

### Retenção do subhook e taxa de não-seguidores
| IG, por quartil | Q1 | Q2 | Q3 | Q4 |
|---|---|---|---|---|
| Subhook → acerto | 2,2% | 8,4% | 25,2% | **59,3%** |
| Não-seguidores → acerto | 7,5% | 8,7% | 25,2% | **57,1%** |
| Queda hook→subhook (Q1 = menor queda) → acerto | **41,0%** | 25,8% | 16,1% | 12,1% |

As correlações no IG são: hook × log(views) = 0,59 · subhook × log(views) = 0,54 · hook × não-seguidores = 0,48 · hook × subhook = 0,78.

**Cuidado com a causalidade.** O algoritmo distribui mais o que retém, mas a audiência fria, que chega quando o vídeo já está distribuindo, também muda a retenção medida. A relação existe e é forte. O sentido da seta é "provavelmente nos dois sentidos".

---

## 3. A passagem hook → subhook

### A combinação que mais separa (IG)

| Grupo | n | Acerto | Esperado pelo cliente | Lift ajustado | Views medianas |
|---|---|---|---|---|---|
| **Hook ≥71 e queda ≤17** | 144 | **77,1%** | 30,6% | **2,52×** | **172.882** |
| Hook ≥71 e queda >17 | 187 | 45,5% | 27,7% | 1,64× | 40.389 |
| Hook <71 e queda ≤17 | 204 | 16,7% | 21,1% | 0,79× | 5.497 |
| Hook <71 e queda >17 | 752 | 10,1% | 22,2% | 0,45× | 6.097 |

**Um hook forte que perde a audiência no subhook acerta 45%. Se a audiência fica no subhook, acerta 77%.** Mas a queda pequena com hook fraco não salva o vídeo (16,7%).

**O que o texto do hook diz sobre a queda: quase nada.** Em todas as features textuais da seção 4, a queda mediana fica entre 18 e 23 pontos (a da base é 21). A queda parece depender do que vem logo depois do hook (subhook, edição, ritmo), não das palavras do hook. Esse é um achado honesto e útil para a aula: **o subhook precisa ser roteirizado à parte.**

### Hooks que mantiveram a audiência (IG/TikTok, hook ≥ 60, ≥ 5k views, menor queda)

| Hook | Cliente | Hook→Sub | Views | Link |
|---|---|---|---|---|
| "Essa marca de tênis manda uma faca de verdade dentro da caixa e pede para você destruir o produto que acabou de comprar." | Pedro Elero | 82→74 (−8) | 432.403 | [IG](https://www.instagram.com/reel/DcBhRCHD9Gk) |
| "Antigamente, ter uma Monarque era o sonho de todo brasileiro, só que por causa de uma das piores decisões da história, hoje você nem se lembra mais dela." | Marcio Grazino | 82→72 (−10) | 405.265 | [IG](https://www.instagram.com/reel/DY1-5KPxvUX) |
| "Quem vem de curso ensinando isso aqui vai querer me processar por causa desse vídeo." | Izabela Anholett | 67→57 (−10) | 146.807 | [IG](https://www.instagram.com/reel/DYmQvXKBxPZ) |
| "A nike veste a seleção há quase trinta anos e ainda não sabe como o brasil se chama." | Marcio Grazino | 68→57 (−11) | 997.340 | [TikTok](https://www.tiktok.com/@marcio.grazino/video/7622350170839092501) |
| "O Elon Musk acabou de ser humilhado pela China com o que ela acabou de liberar para o mundo." | Izabela Anholett | 81→70 (−11) | 869.253 | [IG](https://www.instagram.com/reel/DYrpwcbhHwR) |
| "Antigamente, você tinha vergonha de usar Olympikus na escola. Hoje em dia, ela humilha a Nike e a Adidas no Brasil." | Marcio Grazino | 75→64 (−11) | 648.733 | [IG](https://www.instagram.com/reel/DWBOY0QjSv4) |
| "A Kopenhagen foi vendida por 4,5 bilhões de reais, mas quem ficou com esse dinheiro não foi a família que criou a marca, foi um fundo americano. E o pior, esse fundo nunca produziu uma grama sequer de chocolate." | Franklin Tomich | 75→64 (−11) | 167.477 | [IG](https://www.instagram.com/reel/DZlIRExNwMk) |
| "Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica." | Leonardo Nogueira | 79→67 (−12) | 6.192.964 | [IG](https://www.instagram.com/reel/DYo3ldvOFHW) |
| "O Mc Donald's não vende mais sorvete, ele está mentindo para você!" | Dilson Peres | 75→63 (−12) | 1.266.588 | [IG](https://www.instagram.com/reel/DU6lPDvDf9N) |
| "A Uber acabou de cancelar uma conta de 33 milhões de reais com o governo e quase ninguém ficou sabendo." | Dilson Peres | 81→69 (−12) | 397.495 | [IG](https://www.instagram.com/reel/DXsRvdXjUfE) |

**O que esses hooks têm em comum (leitura qualitativa):**
1. Um objeto ou personagem concreto e familiar (tênis, Monarque, Nike, Toyota, McDonald's, Uber).
2. Um absurdo ou uma inversão que ainda não foi explicado (faca na caixa, "ainda não sabe como o Brasil se chama", "travou o software").
3. **A explicação fica para depois.** O hook cria a pergunta e não entrega a resposta.

### Hooks fortes que perderam a audiência (IG, hook ≥ 65, maior queda)

| Hook | Cliente | Hook→Sub | Link |
|---|---|---|---|
| "Uma avó de 64 anos criou a maior rede de franquia de bolos do Brasil e vendeu tudo por 200 milhões de reais. **Essa avó tem nome: Sônia Ramos.**" | Franklin Tomich | 69→30 (−39) | [IG](https://www.instagram.com/reel/Da80qqmtllt) |
| "Elon Musk está destruindo as fábricas da Tesla para criar uma nova raça de robôs." | Thiago Franco | 71→35 (−36) | [IG](https://www.instagram.com/reel/DVRXUZYEYIE) |
| "Este cara transformou a pior nota da faculdade em um império que fatura 5 bilhões por ano." | Rafael Rodrigues | 68→32 (−36) | [IG](https://www.instagram.com/reel/DVrq6QVD44D) |
| "colocou famosos para apanhar e faturou milhões de reais, **o nome dele é Mamá Britto**" | Thiago Franco | 67→35 (−32) | [IG](https://www.instagram.com/reel/DWcWfj5jcj_) |
| "O Google entrou em pânico por causa dessa inteligência artificial, que responde melhor que ele e é grátis." | Izabela Anholett | 76→44 (−32) | [IG](https://www.instagram.com/reel/DUnWCOYDPEq) |

Aqui o padrão é outro. Ou o próprio hook já **entrega a resposta** (dá o nome, dá o desfecho), ou o hook segue a fórmula genérica "esse cara foi de X a império de Y", que promete uma história de superação e não um mistério.

---

## 4. Features do texto do hook

O lift bruto é a taxa de acerto do grupo ÷ a taxa da base (IG 23,7%; TikTok 7,1%). O **lift ajustado** é o número de acertos observados ÷ o número esperado, dada a taxa de acerto de cada cliente. Ele protege contra "um cliente forte que usa muito aquela feature". O z aproximado vem de uma binomial contra o esperado e **ignora o agrupamento por cliente**: trate |z| < 2 como "não dá para distinguir de acaso". Só aparecem grupos com n ≥ 30.

### Instagram (base: mediana do hook 64; acerto 23,7%)

| Feature | n | Clientes | Mediana do hook (com / sem) | Δ hook vs. cliente (mediana) | Acerto (com / sem) | Lift bruto | **Lift ajustado** | z≈ |
|---|---|---|---|---|---|---|---|---|
| **"acabou de / acaba de"** | 104 | 15 | **70** / 63 | **+3,0** | **44,2%** / 21,9% | 1,86 | **1,82** | **+4,7** |
| **Abre com "O/A + Nome" (marca/pessoa)** ¹ | 272 | 17 | – | +1,6 (média) | 32,4% | – | **1,33** | **+3,1** |
| Abre com nome próprio (heurística ampla) ¹ | 415 | 19 | 66 / 63 | +1,5 | 27,0% / 22,2% | 1,14 | – | – |
| **Choque** (assustador, humilhou, pesadelo, mentindo, pânico, fatal, revolta…) | 206 | 18 | **68** / 63 | **+2,8** | **31,1%** / 22,3% | 1,31 | **1,29** | **+2,3** |
| Tempo (acabou de/hoje/agora/ontem) | 245 | 19 | 65 / 63 | +1,0 | 29,0% / 22,5% | 1,22 | 1,24 | +2,1 |
| Nostalgia (antigamente/lembra/sumiu) | 33 | **7** | 67 / 64 | −1,0 | 42,4% / 23,2% | 1,79 | 1,35 | +1,4 |
| Nome próprio no meio da frase | 865 | 20 | 64 / 62 | +0,5 | 26,2% / 18,6% | 1,11 | 1,09 | – |
| Começa com Esse/Essa/Este/Esta | 244 | 19 | 63 / 64 | −1,0 | 25,0% / 23,4% | 1,05 | 0,96 | – |
| …"Esse cara/homem/mulher…" | 57 | 14 | 64 / 64 | +1,0 | 26,3% | 1,11 | – | – |
| Contém dígito | 438 | 19 | 64 / 64 | 0,0 | 21,9% / 24,6% | 0,92 | 0,90 | – |
| Começa com número/cifra | <30 | – | – | – | – | – | – | – |
| Dinheiro (R$, reais, dólares, milhões, bilhões) ² | 361 | 18 | 63 / 64 | +0,5 | 22,7% / 24,1% | 0,96 | 0,99 | – |
| Negação (não/nunca/ninguém/nada/nem) | 440 | 19 | 64 / 64 | 0,0 | 22,3% / 24,5% | 0,94 | 0,96 | – |
| Contraste (mas/enquanto/porém/só que/até que) | 335 | 18 | 65 / 63 | 0,0 | 21,2% / 24,6% | 0,89 | 0,91 | – |
| Segredo/"ninguém sabe"/verdade | 139 | 19 | 65 / 64 | +0,5 | 21,6% / 24,0% | 0,91 | 0,94 | – |
| Superlativo (maior/mais/único/primeiro/melhor/pior) | 492 | 20 | 64 / 64 | 0,0 | 20,1% / 25,9% | 0,85 | 0,86 | −1,8 |
| Superlativo sem "mais" | 249 | 20 | 64 / 64 | 0,0 | 21,3% / 24,3% | 0,90 | – | – |
| Usa "você/vc" | 236 | 19 | 63,5 / 64 | −1,3 | 19,5% / 24,7% | 0,82 | 0,88 | −1,0 |
| Usa 2ª pessoa ampla (você/seu/sua/te) | 408 | 19 | 64 / 64 | 0,0 | 21,3% / 24,8% | 0,90 | – | – |
| **Pergunta (?)** | 92 | 17 | **62** / 64 | −1,5 | 18,5% / 24,1% | 0,78 | 0,85 | −0,8 |
| **Primeira pessoa (eu/meu/minha)** | 56 | 14 | **59** / 64 | **−3,5** | 16,1% / 24,1% | 0,68 | 0,80 | −0,8 |
| Menciona IA | 160 | 10 | 64 / 64 | −2,0 | 19,4% / 24,3% | 0,82 | 0,79 | −1,5 |
| Menciona governo/lei/justiça | 115 | 14 | 64 / 64 | 0,0 | 17,4% / 24,3% | 0,73 | 0,73 | −1,6 |
| Mais de uma frase | 696 | 20 | 64 / 63 | +0,5 | 22,3% / 25,4% | 0,94 | – | – |
| 2ª frase abre novo loop ("E o motivo…", "E o pior…", "E o segredo…") | 77 | 15 | – | +2,7 (média) | 27,3% | – | 1,17 | +0,8 |
| **Combo: "acabou de" + abre com marca/nome** | 66 | 14 | – | +4,2 (média) | **45,5%** | – | **1,82** | – |

¹ "O/A + Nome" é estrito: regex `^(O|A|Os|As) + Maiúscula`. A heurística ampla aceita qualquer primeira palavra em maiúscula que não esteja numa lista de palavras comuns de abertura. As duas são aproximações.
² Inclui "milionário". Sem essa palavra, n = 295 e o lift ajustado é 0,99, o mesmo resultado.

**Tamanho (IG):**

| Palavras | n | Mediana do hook | Acerto | Lift |
|---|---|---|---|---|
| ≤10 | 56 | 62 | 23,2% | 0,98 |
| 11–15 | 170 | 62,5 | 27,1% | 1,14 |
| 16–20 | 298 | 63 | 25,8% | 1,09 |
| 21–30 | 500 | 64 | 24,0% | 1,01 |
| >30 | 266 | 64 | **18,8%** | 0,79 (ajustado 0,89) |

Por caracteres, de <70 a ≥160, a mediana do hook fica em 62–64 em todas as faixas. **O comprimento não mexe na retenção do hook** (correlação 0,02). Acima de 30 palavras, a taxa de acerto cai um pouco, mas não dá para separar isso do acaso.

### TikTok (n = 325, só 7 clientes, 23 acertos no total, então **tudo aqui é anedótico**)
- Choque: n = 38, acerto 13,2% contra 6,3% (lift 1,86), mas a mediana do hook ficou mais baixa (55,5 contra 61).
- Pergunta: n = 36, mediana do hook **53,5** contra 61 e acerto 5,6% (lift 0,79). É a mesma direção do IG.
- "Tempo": n = 47, +3 pontos de hook vs. o cliente, mas sem efeito no acerto (0,90).
- As outras features ficam entre 0,77 e 1,22 de lift, sem padrão claro.
- **O mesmo roteiro em IG e TikTok** (68 pares do mesmo cliente com o mesmo hook) tem correlação de **0,32** no hook e de 0,39 no subhook, e o IG retém em média 5,8 pontos a mais. O texto carrega parte da retenção, mas a plataforma e a execução pesam tanto quanto.

---

## 5. Top hooks

### 5a. Top 20 por `retencao_hook` (views ≥ 20k, IG + TikTok; todos os 20 são do IG)

| # | Hook | Cliente | Hook | Sub | Views | Link |
|---|---|---|---|---|---|---|
| 1 | O Ratinho venceu o governo e cancelou uma multa de 58 milhões de reais. E a jogada que ele usou qualquer brasileiro pode repetir. | Dilson Peres | 85 | 67 | 554.003 | [IG](https://www.instagram.com/reel/DYxphfYtVma) |
| 2 | Jovem cria IA que simula jutsu do Naruto. Esse cara criou uma IA que reconhece se você fez o rasengan certo. E agora a geração inteira que imitava o Naruto no espelho, pode descobrir se o jutsu funcionaria de verdade. | Patrick Diorio | 85 | 71 | 412.692 | [IG](https://www.instagram.com/reel/DcKNGwYuTIK) |
| 3 | Um brasileiro de 23 anos jogou fora uma vaga para estudar de graça em uma das melhores faculdades do mundo e voltou ao Brasil para criar uma IA. Menos de três anos depois, ele vale mais de 5 bilhões de reais. | Izabela Anholett | 85 | 61 | 203.737 | [IG](https://www.instagram.com/reel/DaAYmA5h5HG) |
| 4 | O governo chinês declarou guerra ao dono do Instagram por causa de uma IA de 2 bilhões de dólares e proibiu seus fundadores de deixar o país. | Izabela Anholett | 84 | 70 | 463.084 | [IG](https://www.instagram.com/reel/DZFKODih104) |
| 5 | Você não percebeu, mas o São Paulo deu uma aula. Não de futebol, mas de gestão e liderança. | Rafael Rodrigues | 84 | 72 | 234.940 | [IG](https://www.instagram.com/reel/DVzP5yVjxRA) |
| 6 | Essa brasileira ganhou um prêmio do Google ao fazer de graça o que muitos cursinhos cobram mais de mil reais por mês. E ela fez isso em 48 horas. | Rafael Rodrigues | 84 | 68 | 218.219 | [IG](https://www.instagram.com/reel/DX46fHqv7w7) |
| 7 | O Palmeiras acabou de mandar uma promessa para jogar com o Messi. E é por isso que cada vez mais Barcelona e Real Madrid invejam o maior clube do Brasil. | Pedro Elero | 84 | 61 | 150.093 | [IG](https://www.instagram.com/reel/DcmRAR0DFEz) |
| 8 | Uma gambiarra insana de um brasileiro virou uma economia de 13 milhões de litros de água. | Marcio Grazino | 83 | 68 | 865.497 | [IG](https://www.instagram.com/reel/DbRQlG7xhNs) |
| 9 | Esse cearense resolveu um problema que os maiores médicos do mundo não conseguiram. | Rafael Rodrigues | 83 | 68 | 60.922 | [IG](https://www.instagram.com/reel/DW2XqA_DCo5) |
| 10 | E quando todo mundo achou que a guerra acabou, o governo brasileiro ligou um alerta de pânico com a atitude do Trump. | Fernando Pereira | 82 | 70 | 613.002 | [IG](https://www.instagram.com/reel/DXPntylEZ0k) |
| 11 | Essa marca de tênis manda uma faca de verdade dentro da caixa e pede para você destruir o produto que acabou de comprar. | Pedro Elero | 82 | 74 | 432.403 | [IG](https://www.instagram.com/reel/DcBhRCHD9Gk) |
| 12 | Antigamente, ter uma Monarque era o sonho de todo brasileiro, só que por causa de uma das piores decisões da história, hoje você nem se lembra mais dela. | Marcio Grazino | 82 | 72 | 405.265 | [IG](https://www.instagram.com/reel/DY1-5KPxvUX) |
| 13 | A Honda, uma das montadoras mais conservadoras do mercado, tomou uma das decisões mais ousadas da sua história ao tirar de linha um dos carros mais amados que o Brasil já viu, e o motivo pode te surpreender. | Leonardo Nogueira | 82 | 65 | 342.439 | [IG](https://www.instagram.com/reel/DXOyr8JjkwH) |
| 14 | O Palmeiras acaba de tomar uma atitude que deixou muita gente revoltada, mas que você não pode ignorar. | Pedro Elero | 82 | 70 | 171.823 | [IG](https://www.instagram.com/reel/DbeNjTKCCxZ) |
| 15 | Uma banca de frutas na beira da estrada virou um negócio de R$ 170 milhões. E o segredo não estava na comida, estava no banheiro. | Marcos Pelozato | 82 | 64 | 80.911 | [IG](https://www.instagram.com/reel/Da1CQOdhW2y) |
| 16 | A indústria brasileira declarou guerra contra a China. O motivo? O botijão de gás que fica ali na sua cozinha. | Fernando Pereira | 82 | 67 | 52.498 | [IG](https://www.instagram.com/reel/DcL4m2tB8CN) |
| 17 | Você se lembra do Ping Pong? O chiclete que fazia bola com figurinha dentro, simplesmente sumiu. E a culpada foi uma decisão corporativa que quase ninguém conhece. | Franklin Tomich | 81 | 67 | 1.158.776 | [IG](https://www.instagram.com/reel/DaY1yoxuPZ8) |
| 18 | A chinesa dona da Volvo comprou alguma das maiores empresas do mundo e agora chegou no Brasil. E a estratégia por trás disso é sensacional. | Franklin Tomich | 81 | 66 | 990.828 | [IG](https://www.instagram.com/reel/DY-krjmNG2R) |
| 19 | O Elon Musk acabou de ser humilhado pela China com o que ela acabou de liberar para o mundo. | Izabela Anholett | 81 | 70 | 869.253 | [IG](https://www.instagram.com/reel/DYrpwcbhHwR) |
| 20 | A empresa mais valiosa do mundo acabou de emitir que ninguém queria ouvir. *(texto como está na base)* | Fernando Pereira | 81 | 65 | 843.605 | [IG](https://www.instagram.com/reel/DVzCXslj2aC) |

Todos os 20 são "acerto". Os empates em 81 foram desempatados por views.

### 5b. Top 20 por `retencao_subhook` (views ≥ 20k)

| # | Hook (resumido quando já aparece em 5a) | Cliente | Sub | Hook | Views | Link |
|---|---|---|---|---|---|---|
| 1 | Essa marca de tênis manda uma faca de verdade dentro da caixa… | Pedro Elero | 74 | 82 | 432.403 | [IG](https://www.instagram.com/reel/DcBhRCHD9Gk) |
| 2 | Antigamente, ter uma Monarque era o sonho de todo brasileiro… | Marcio Grazino | 72 | 82 | 405.265 | [IG](https://www.instagram.com/reel/DY1-5KPxvUX) |
| 3 | Você não percebeu, mas o São Paulo deu uma aula… | Rafael Rodrigues | 72 | 84 | 234.940 | [IG](https://www.instagram.com/reel/DVzP5yVjxRA) |
| 4 | Jovem cria IA que simula jutsu do Naruto… | Patrick Diorio | 71 | 85 | 412.692 | [IG](https://www.instagram.com/reel/DcKNGwYuTIK) |
| 5 | O Elon Musk acabou de ser humilhado pela China… | Izabela Anholett | 70 | 81 | 869.253 | [IG](https://www.instagram.com/reel/DYrpwcbhHwR) |
| 6 | E quando todo mundo achou que a guerra acabou… Trump. | Fernando Pereira | 70 | 82 | 613.002 | [IG](https://www.instagram.com/reel/DXPntylEZ0k) |
| 7 | O governo chinês declarou guerra ao dono do Instagram… | Izabela Anholett | 70 | 84 | 463.084 | [IG](https://www.instagram.com/reel/DZFKODih104) |
| 8 | O Palmeiras acaba de tomar uma atitude que deixou muita gente revoltada… | Pedro Elero | 70 | 82 | 171.823 | [IG](https://www.instagram.com/reel/DbeNjTKCCxZ) |
| 9 | A Uber acabou de cancelar uma conta de 33 milhões de reais com o governo e quase ninguém ficou sabendo. | Dilson Peres | 69 | 81 | 397.495 | [IG](https://www.instagram.com/reel/DXsRvdXjUfE) |
| 10 | 2 anos de casamento, 1 filho de 3 meses. Tenho ctz que não vou encontrar nada no cel dela... | Fernando Pereira | 69 | 80 | 58.536 | [IG](https://www.instagram.com/reel/DYNu7wNuNN8) |
| 11 | Uma gambiarra insana de um brasileiro… 13 milhões de litros de água. | Marcio Grazino | 68 | 83 | 865.497 | [IG](https://www.instagram.com/reel/DbRQlG7xhNs) |
| 12 | Esse homem foi o engenheiro mais temido do mundo, não pelo seu caráter, mas pela sua inteligência. Ele simplesmente cobrou 10 mil dólares do Henry Ford para fazer uma pequena marquinha de giz numa máquina. | Leonardo Nogueira | 68 | 80 | 487.060 | [IG](https://www.instagram.com/reel/DXmNlq7DxBk) |
| 13 | Dubai, Estados Unidos e o resto do mundo estão de olho no Brasil. E o motivo é a nossa engenharia. | Marcio Grazino | 68 | 80 | 455.644 | [IG](https://www.instagram.com/reel/DaoJaVkR5--) |
| 14 | Essa brasileira ganhou um prêmio do Google… | Rafael Rodrigues | 68 | 84 | 218.219 | [IG](https://www.instagram.com/reel/DX46fHqv7w7) |
| 15 | Esse cearense resolveu um problema que os maiores médicos do mundo não conseguiram. | Rafael Rodrigues | 68 | 83 | 60.922 | [IG](https://www.instagram.com/reel/DW2XqA_DCo5) |
| 16 | Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica. | Leonardo Nogueira | 67 | 79 | 6.192.964 | [IG](https://www.instagram.com/reel/DYo3ldvOFHW) |
| 17 | Você se lembra do Ping Pong?… | Franklin Tomich | 67 | 81 | 1.158.776 | [IG](https://www.instagram.com/reel/DaY1yoxuPZ8) |
| 18 | O Ratinho venceu o governo e cancelou uma multa de 58 milhões… | Dilson Peres | 67 | 85 | 554.003 | [IG](https://www.instagram.com/reel/DYxphfYtVma) |
| 19 | Uma menina de 8 anos resolveu com garrafas de refrigerante um problema que cientistas não conseguiram resolver, mas que atinge milhões de famílias pobres. | Marcio Grazino | 67 | 81 | 426.656 | [IG](https://www.instagram.com/reel/DcmZY88x-ZO) |
| 20 | A Nike passou vergonha ao esquecer o mais importante sobre o Brasil. Nós somos brasileiros. | Rafael Rodrigues | 67 | 81 | 323.376 | [IG](https://www.instagram.com/reel/DWchpM_j7ac) |

Destaque: o hook **#10** está num vídeo de **18 s** (o único curto dos tops). Ele funciona por *in medias res* (começar no meio da ação): dá o contexto em números e já arma a tensão.

### 5c. TikTok: top 10 por hook (views ≥ 5k), para referência

| Hook | Cliente | Hook | Sub | Views | Link |
|---|---|---|---|---|---|
| Ela levou 10 anos pra construir essa empresa e um único dia pra descobrir que poderia ser destruída por causa da Nestlé. | João Paulo Albuquerque | 80 | 61 | 289.908 | [TT](https://www.tiktok.com/@jp_albuquerque_/video/7656832526211730704) |
| Essa americana começou misturando vinagre com suco na cozinha de casa e terminou vendendo a sua marca para a PepsiCo por 1.95 bilhão de dólares. | João Paulo Albuquerque | 78 | 58 | 9.303 | [TT](https://www.tiktok.com/@jp_albuquerque_/video/7670562737004547345) |
| o Palmeiras acabou de fechar o semestre devendo 124 milhões de reais. Mas isso não foi um erro, foi uma das estratégias da presidente que quase ninguém sacou. | Pedro Elero | 78 | 50 | 5.273 | [TT](https://www.tiktok.com/@pedro_elero/video/7675847402351250695) |
| Esse garoto de 17 anos registrou um site com o próprio nome, mas acabou fazendo a Microsoft entrar em pânico. | Rodrigo Waughan | 77 | 61 | 30.857 | [TT](https://www.tiktok.com/@.rodrigowaughan/video/7667903199734435079) |
| Trump tentou matar essa empresa, cortando toda a tecnologia dela. Só que isso causou um prejuízo de 33 bilhões de dólares para os próprios americanos. | João Paulo Albuquerque | 77 | 62 | 30.254 | [TT](https://www.tiktok.com/@jp_albuquerque_/video/7670195867558612242) |
| A empresa mais valiosa do mundo acabou de emitir um alerta que ninguém queria ouvir. | Fernando Pereira | 76 | 60 | 420.204 | [TT](https://www.tiktok.com/@fernandopereira.finance/video/7616466575205436692) |
| A Sony matou essa empresa. Só que uma marca brasileira transformou esse nome enterrado em um negócio que já projeta faturar bilhões. | João Paulo Albuquerque | 76 | 58 | 177.634 | [TT](https://www.tiktok.com/@jp_albuquerque_/video/7663512188782415111) |
| O Palmeiras acaba de tomar uma atitude que deixou muita gente revoltada, mas que você não pode ignorar. | Pedro Elero | 76 | 61 | 151.313 | [TT](https://www.tiktok.com/@pedro_elero/video/7668803322534432016) |

---

## 6. A duração do vídeo afeta a retenção do hook? Quase nada

| IG, duração | n | Mediana do hook | Δ hook vs. cliente | Mediana do subhook | Mediana do final | Acerto |
|---|---|---|---|---|---|---|
| <30 s | 8 | 57 | −4,7 | 40 | 31 | 12,5% |
| 30–59 s | 37 | 62 | −2,3 | 42 | 16 | 27,0% |
| 60–89 s | 206 | 61 | −2,7 | 40 | 12 | 22,3% |
| 90–119 s | 420 | 64 | +0,5 | 42 | 10 | 25,2% |
| 120–149 s | 436 | 65 | +1,0 | 44 | 8 | 23,6% |
| 150 s+ | 178 | 64 | 0,0 | 41 | 8 | 21,9% |

A correlação entre duração e hook no IG é de **0,04**. A duração só move a **retenção final**, que cai de 31 para 8, como era de se esperar. Os vídeos de 60–89 s retêm ~3 pontos a menos no hook que a média do cliente, mas isso pode ser formato ou cliente, não duração. No TikTok, 188 vídeos têm a duração gravada em milissegundos. Depois de converter, todos ficam acima de 60 s, e a faixa de 150 s+ tem o hook um pouco mais baixo (57 contra 61–63), com 5 clientes e efeito pequeno. **Conclusão: a duração não é alavanca dos primeiros segundos.**

---

## 7. Regras práticas para os primeiros 3 segundos

Cada regra vem com a força da evidência. "Forte" quer dizer efeito grande e z ≥ 3 depois de ajustar por cliente. "Moderada" quer dizer z entre 2 e 3. "Hipótese" quer dizer que a direção é consistente, mas n ou z são baixos.

### Regra 1 · O hook decide o vídeo, e a diferença está em poucos pontos *(forte)*
No IG, o quartil de cima do hook (≥ 71) acerta **60%** e o de baixo acerta **3%**, mesmo comparando dentro de cada cliente. A meta concreta é passar de **71 no IG e de 68 no TikTok**.
- "O Ratinho venceu o governo e cancelou uma multa de 58 milhões de reais. E a jogada que ele usou qualquer brasileiro pode repetir." 85 → 554k. [IG](https://www.instagram.com/reel/DYxphfYtVma)
- "Uma gambiarra insana de um brasileiro virou uma economia de 13 milhões de litros de água." 83 → 865k. [IG](https://www.instagram.com/reel/DbRQlG7xhNs)

### Regra 2 · "Acabou de": transforme o assunto em notícia que está acontecendo agora *(forte)*
Com "acabou de/acaba de" no hook (n = 104, 15 clientes): a mediana do hook vai a **70 contra 63**, e a taxa de acerto, a **44% contra 24% esperado** (**1,82×**, z ≈ 4,7). Isso também pode refletir a escolha de pauta quente (um efeito do tema, não da expressão).
- "O Elon Musk acabou de ser humilhado pela China com o que ela acabou de liberar para o mundo." 81/70 → 869k. [IG](https://www.instagram.com/reel/DYrpwcbhHwR)
- "A Uber acabou de cancelar uma conta de 33 milhões de reais com o governo e quase ninguém ficou sabendo." 81/69 → 397k. [IG](https://www.instagram.com/reel/DXsRvdXjUfE)

### Regra 3 · A primeira palavra é um nome que o público já conhece (marca ou pessoa) *(forte/moderada)*
Hooks que abrem com "O/A + Nome" (n = 272, 17 clientes) acertam **32,4% contra 24,3% esperado** (**1,33×**, z ≈ 3,1), com +1,6 ponto de hook. Somado a "acabou de" (n = 66), chega a **45,5%** de acerto.
- "O Mc Donald's não vende mais sorvete, ele está mentindo para você!" 75/63 → 1,27 mi. [IG](https://www.instagram.com/reel/DU6lPDvDf9N)
- "O Palmeiras acaba de tomar uma atitude que deixou muita gente revoltada, mas que você não pode ignorar." 82/70 no IG [link](https://www.instagram.com/reel/DbeNjTKCCxZ) e 76/61 no TikTok [link](https://www.tiktok.com/@pedro_elero/video/7668803322534432016)

### Regra 4 · Conflito com um vilão claro: alguém humilhou, mentiu, entrou em pânico ou declarou guerra *(moderada)*
O vocabulário de choque (n = 206, 18 clientes) aparece com mediana do hook de **68 contra 63** e acerto de **31% contra 24% esperado** (1,29×, z ≈ 2,3). O verbo de conflito funciona melhor com um sujeito nomeado (regra 3) do que sozinho.
- "O governo chinês declarou guerra ao dono do Instagram por causa de uma IA de 2 bilhões de dólares e proibiu seus fundadores de deixar o país." 84/70 → 463k. [IG](https://www.instagram.com/reel/DZFKODih104)
- "A Nike passou vergonha ao esquecer o mais importante sobre o Brasil. Nós somos brasileiros." 81/67 → 323k. [IG](https://www.instagram.com/reel/DWchpM_j7ac)

### Regra 5 · Abra a pergunta e não responda: segure o nome, o motivo, o desfecho *(hipótese com bons exemplos)*
Uma segunda frase que abre um novo mistério ("E o motivo…", "E o segredo…", "E a culpada…", n = 77) tem +2,7 pontos de hook vs. o cliente e lift de 1,17, que **não é significativo** (z ≈ 0,8). Os hooks que entregam o nome ("o nome dele é…", "tem nome:…", n = 22, abaixo do corte de 30) ficam −4,3 pontos abaixo do cliente. O caso mais claro da base é este par:
- ✅ "Uma banca de frutas na beira da estrada virou um negócio de R$ 170 milhões. **E o segredo não estava na comida, estava no banheiro.**" 82/64. [IG](https://www.instagram.com/reel/Da1CQOdhW2y)
- ❌ "Uma avó de 64 anos criou a maior rede de franquia de bolos do Brasil e vendeu tudo por 200 milhões de reais. **Essa avó tem nome: Sônia Ramos.**" 69 → **30** no subhook, a maior queda da base entre hooks ≥ 65. [IG](https://www.instagram.com/reel/Da80qqmtllt)
- ✅ "Você se lembra do Ping Pong? O chiclete que fazia bola com figurinha dentro, simplesmente sumiu. E a culpada foi uma decisão corporativa que quase ninguém conhece." 81/67 → 1,16 mi. [IG](https://www.instagram.com/reel/DaY1yoxuPZ8)

### Regra 6 · Roteirize o subhook: um bom hook vale 45%, um bom hook com bom subhook vale 77% *(forte)*
Hook ≥ 71 com queda ≤ 17 pontos: **77,1%** de acerto (n = 144, 2,52× o esperado, 173k views medianas). O mesmo hook com queda > 17: **45,5%** (n = 187). As features de texto do hook **não** explicam a queda, então o ganho está no que vem nos segundos seguintes. Os casos de queda pequena entregam uma **segunda camada concreta** (o absurdo se aprofunda) e não uma promessa genérica.
- "Essa marca de tênis manda uma faca de verdade dentro da caixa e pede para você destruir o produto que acabou de comprar." 82 → 74 (−8) → 432k. [IG](https://www.instagram.com/reel/DcBhRCHD9Gk)
- Para contrastar: "Elon Musk está destruindo as fábricas da Tesla para criar uma nova raça de robôs." 71 → **35** (−36). Hook bom, subhook não segurou. [IG](https://www.instagram.com/reel/DVRXUZYEYIE)

### Regra 7 · Evite abrir com pergunta genérica, com "eu" ou com um tema abstrato sem personagem *(hipótese, a mesma direção em IG e TikTok)*
Pergunta: hook de 62 contra 64 no IG e de **53,5 contra 61 no TikTok**, lift ajustado de 0,85. Primeira pessoa: **−3,5 pontos** vs. o cliente, lift de 0,80. Tema IA/governo sem protagonista: 0,79 e 0,73. Nenhum desses chega a z = 2, então a recomendação é "evitar por padrão", não "proibido". A pergunta funciona quando vem colada num objeto concreto (Ping Pong 81, "O motivo? O botijão de gás…" 82).
- ❌ "O fim dos programadores? Essa startup brasileira faturou três milhões de dólares em apenas dois dias." Hook **32**. [IG](https://www.instagram.com/reel/DWd3vbcDOI5)
- ❌ "Empreendedor do digital não faz o próprio tráfego, empreendedor que faz o próprio tráfego, comete um dos maiores erros. E eu posso provar." Hook **32**. [IG](https://www.instagram.com/reel/DVELWR1kdBr)
- ✅ No mesmo tema de IA, com personagem e conflito: "O governo chinês declarou guerra ao dono do Instagram…" 84. [IG](https://www.instagram.com/reel/DZFKODih104)

### O que NÃO mexe na retenção do hook (vale dizer na aula)
- **Tamanho do hook**, de 10 a 30 palavras: a mediana fica em 62–64 em todas as faixas. Acima de 30 palavras a taxa de acerto cai (18,8%), sem significância.
- **Número, cifra ou dinheiro** no texto: lift de 0,90 a 0,99. O número sozinho não segura ninguém. No top 20 o número aparece como prova do absurdo ("13 milhões de litros"), não como gancho.
- **"Esse/Essa…"** como abertura: lift de 0,96. É neutro.
- **Superlativos** ("maior", "mais", "único"): 0,86. Viraram ruído.
- **Duração do vídeo**: correlação de 0,04 com o hook.
- **Nostalgia de marca** ("Antigamente… sumiu", n = 33, 7 clientes): 42% de acerto e +8 pontos de não-seguidores, mas n é pequeno, o lift ajustado é 1,35 (z ≈ 1,4) e os 5 melhores exemplos vêm de só 2 clientes (Franklin Tomich e Marcio Grazino). É uma **hipótese promissora para testar**, ainda não é uma regra. Exemplos: Monarque 82/72 [IG](https://www.instagram.com/reel/DY1-5KPxvUX) e Olympikus 75/64 [IG](https://www.instagram.com/reel/DWBOY0QjSv4).

---

## Limitações
1. **Correlação, não causa.** Pauta, cliente, edição, voz e o timing da notícia não estão no texto do hook. O mesmo roteiro em IG e TikTok tem correlação de só 0,32 no hook, o que prova que a execução pesa.
2. As features são **regex sobre o texto transcrito**, não sobre o que aparece na tela. Nome próprio e "choque" são aproximações.
3. Os z ignoram o agrupamento por cliente, então são otimistas. Só "acabou de", "abre com nome" e o combo hook+subhook ficam de pé com folga.
4. **TikTok:** 325 vídeos, 7 clientes, 23 acertos. Serve como direção, não como prova.
5. Não há definição documentada do segundo exato do "hook" e do "subhook". Dados do IG do Rodrigo Waughan foram excluídos por escala inconsistente (hook mediano de 106%).
