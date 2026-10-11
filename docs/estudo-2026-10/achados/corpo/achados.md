# Corpo e conclusão: o que separa os roteiros que viralizam

Subestudo do estudo 2026-10. Parte: CORPO (storytelling, ritmo, tamanho) e CONCLUSÃO (parágrafo antes do bloco final).
Base: 6.305 vídeos analisáveis de IG, TT e YT (2.713 roteiros VM). Régua da `lib.mjs`. Código em `src/corpo/`, saídas brutas em `out/corpo/*.txt` e `*.json`.

Como ler os números: **lift** = % de topo com a característica ÷ % de topo geral (IC de Wilson). **OR ctl** = odds ratio de Mantel-Haenszel por cliente x rede x faixa de tamanho do roteiro (para que "texto longo" não se passe por "texto bom"). **OR estrito** = idem + roteirista. **d/v** = lift na descoberta (antes de 01/07/2026) / na validação. "Replica" = IC do lift e do OR fora de 1 e mesmo sinal nas duas metades. "n" é de vídeos; o de roteiros vem junto.

## 1. Resumo em 10 linhas

1. **Tamanho:** o ponto ótimo é **450 a 500 palavras faladas** (OR 1,39, replica, resiste a controle de modelagem e roteirista, 14 de 19 clientes). Abaixo de 300 derruba (OR 0,70). Acima de 500 o ganho some. O teto de 430 do checklist corta exatamente a faixa que mais viraliza.
2. **Ritmo real é 3,07 palavras por segundo:** 450 a 500 palavras dão 147 a 163 s. A conversão do checklist (430 palavras = 180 s) está errada.
3. **Nunca conte a história de origem em ordem** ("nasceu em", "trabalhava como", "no início", "percebeu que", "foi aí que", "tudo começou"): 1 marcador OR 0,80, 2+ OR 0,63, 3+ OR 0,40 (controle estrito, replica). "Foi aí que / foi quando" sozinho: OR 0,78.
4. **Traduza o fato em consequência com "Ou seja,"** abrindo a frase (433 roteiros, OR estrito 1,30, replica, 17 de 20 clientes) e o número em escala com **"Pra você ter ideia,"** + número (OR 1,25).
5. **Encha o corpo de nomes próprios** (pessoas, empresas, cidades: 7 ou mais a cada 100 palavras, OR estrito 1,20), use **uma data âncora** (exatamente 1 ano citado, OR 1,18) e **uma pergunta completa** no corpo (OR 1,21, e comentários sobem).
6. **Para segurar até o fim (Instagram):** saltos de tempo ("Anos depois", OR 1,91) e "Até que" (OR 1,76); parágrafo de até 35 palavras (OR 1,42); pelo menos 1 virada "mas/só que" a cada 100 palavras. "Você" frequente no corpo derruba a retenção final (OR 0,55).
7. **Conclusão que viraliza:** contraste **"Enquanto todo mundo X, [personagem] Y"** (OR 1,44, replica; Negócios e Dinheiro, não Tecnologia) e **eco do hook** (retomar 20% ou mais das palavras do hook, OR 1,28). Tamanho: 16 a 25 palavras; 15 ou menos derruba (OR 0,78).
8. **Conclusão que mata:** hesitação ("pode ser", "talvez", OR 0,63), sermão ("a diferença está em", OR 0,51; "você precisa / presta atenção", OR 0,72). "A lição é..." não move viralização e derruba comentários (OR 0,53); o aforismo "Quem X, Y" derruba retenção final (OR 0,42).
9. **Comentário se compra no fim:** pergunta de escolha ao espectador (OR 1,76), Brasil/país/governo na conclusão (OR 1,66), opinião do narrador em 1ª pessoa (OR 2,61). Custa um pouco de viralização. Compartilhamento e salvamento: nenhuma fórmula de conclusão replicou.
10. **Guia de estilo contra o dado:** antítese e tricolon isolados são neutros (2+ por roteiro pioram); pergunta elíptica ("O resultado?") derruba compartilhamento (OR 0,60); o teto de 1 pergunta retórica e a proibição do "E" no início não se sustentam (0 perguntas derruba comentários; parágrafo abrindo com "E" ajuda compartilhamento e comentários).

## 2. Achados

### 2.1 Tamanho, duração e parágrafo

#### T1. Ponto ótimo: 450 a 500 palavras faladas (a: tamanho ideal por rede e macro nicho)

**O quê.** Palavras faladas totais (hook ao bloco final, sem headline nem notas). Distribuição atual: mediana 386 (IG), p75 426, p90 454. Só 12% dos roteiros chegam a 450.

**Números (coef, 3 redes, MH por cliente x rede):**

| faixa | vídeos | % topo | lift [IC95] | OR MH [IC95] | desc / val | IG / TT / YT | leitura |
|---|---|---|---|---|---|---|---|
| <250 | 398 | 20% | 0,77 [0,63 a 0,93] | 0,67 [0,52 a 0,88] | 0,80 / 0,32 | 0,93 / 0,74 / 0,61 | atrapalha (replica) |
| 250-300 | 578 | 22% | 0,86 [0,74 a 1,00] | 0,79 [0,64 a 0,98] | 0,88 / 0,80 | 0,82 / 0,83 / 0,94 | atrapalha (replica) |
| 300-350 | 1.162 | 24% | 0,94 [0,85 a 1,04] | 0,90 [0,78 a 1,05] | 0,98 / 0,90 | 0,97 / 0,99 / 0,85 | neutro |
| 350-400 | 1.671 | 27% | 1,04 [0,96 a 1,12] | 1,07 [0,94 a 1,22] | 1,03 / 1,04 | 1,06 / 1,10 / 0,94 | neutro |
| 400-450 | 1.812 | 27% | 1,04 [0,97 a 1,12] | 1,09 [0,96 a 1,23] | 1,16 / 0,97 | 0,96 / 1,02 / 1,19 | neutro (YT ajuda) |
| **450-500** | 558 | **32%** | **1,23 [1,09 a 1,38]** | **1,39 [1,15 a 1,69]** | 1,12 / 1,30 | 1,27 / 1,09 / 1,30 | **ajuda (replica)** |
| 500-600 | 113 | 19% | 0,72 [0,48 a 1,04] | 0,65 [0,40 a 1,05] | 0,76 / 0,66 | 0,67 / 0,68 / 0,86 | queda, n pequeno |

Robustez da faixa 450-500: OR 1,45 [1,19 a 1,76] controlando modelagem; OR 1,35 [1,10 a 1,65] controlando roteirista; lift > 1 em 14 de 19 clientes com volume. Abaixo de 300: OR 0,65 controlando modelagem, 0,70 controlando roteirista, lift < 1 em 9 de 11 clientes.

**Por rede (MH dentro da rede):**

| rede | faixa ideal | número | o que evitar |
|---|---|---|---|
| Instagram | **450 a 500** | 450-500: lift 1,27 [1,05 a 1,50], OR 1,48 [1,12 a 1,97], replica. De 350 a 450 é neutro. | <300 (lift 0,82) |
| YouTube | **400 a 500** | 400-450: OR 1,43 [1,13 a 1,82]; 450-500: OR 1,51 [1,06 a 2,16], ambos replicam. Ganho começa em 380 (OR 1,70 para >=380). | <250 (OR 0,50, replica) |
| TikTok | **qualquer coisa de 350 a 500** | nenhuma faixa acima de 300 se destaca; o único degrau é sair de <300 (OR 1,53 para >=300). | <300 |
| Facebook | sem conclusão | 276 vídeos; 450-500 com 12 vídeos. | |

**Por macro nicho (lift; OR MH):**

| macro | ideal | números | nota |
|---|---|---|---|
| Tecnologia, IA e inovação | **420 a 500** | 400-450: 1,17 (OR 1,33); 450-500: 1,35 (OR 1,58); no YT 450-500: 1,65 (OR 2,19) | **500+ desaba: 0,34 (OR 0,27, 34 vídeos)**; <300: 0,79 |
| Dinheiro, economia e geopolítica | **450 a 500** | 450-500: 1,35 (OR 1,64), IG 1,45, TT 1,41; d/v 1,24/1,45 | 400-450 é neutro; 500+ ainda ok (1,10, n=28) |
| Negócios, marcas e cases | **350 a 500 (curva plana)** | 450-500: 1,13 (OR 1,21) no geral, 1,28 no YT; no TT o melhor é 300-400 (1,10, OR 1,28) | <300: 0,87 |
| Entretenimento | sem conclusão | 1 cliente, 78 vídeos | |

**Por cliente (os que mais escrevem curto e o que o dado deles diz):** Izabela Anholett (mediana 317 palavras, 64% abaixo de 350; 420-500 lift 1,50, n=57), Lincoln Fracari (369; 420-500 lift 1,48, n=97; <350 lift 0,65), Rodrigo Waughan (367; 1,39, n=88), Rafael Rodrigues (363; 1,20, n=72; <350 0,77): alongar. Exceções onde o longo não ajudou: Leonardo Nogueira (322; 420-500 lift 0,35, n=22) e Thiago Franco (378; 0,77, n=83). Manoel Victor (275, 83% abaixo de 350) quase não tem roteiro longo para medir. Tabela completa em `out/corpo/extra.txt`.

**Instrução para o playbook (checklist, FORMATO):** "Escreva entre 420 e 500 palavras faladas; mire 450 a 490. Abaixo de 300 elimina. Acima de 500 só se cada parágrafo novo trouxer um fato novo (o ganho some depois de 500, principalmente em Tecnologia)." Reescrita: um roteiro de 330 palavras que termina no fato principal ganha +120 palavras com mais um fato de escala ("Pra você ter ideia, ...") e um contraste na conclusão ("Enquanto todo mundo ..."), não com repetição.

Confiança: **alta** para <300 ruim e 450-500 bom; **média** para a queda acima de 500 (113 vídeos).

#### T2. Duração e ritmo de fala

**O quê.** Mediana de **3,07 palavras por segundo** (de 2,40 em Cadu Neiva a 3,66 em Thiago Franco). 430 palavras = 140 s; 450 = 147 s; 500 = 163 s.

**Números.** Com o número de palavras fixo (MH por cliente x faixa de palavras), vídeo de **150 a 180 s** ainda ajuda no Instagram (lift 1,19, OR 1,43 [1,05 a 1,95], d/v 1,15/1,22) e no **TikTok** (lift 1,26, OR 1,85 [1,25 a 2,74], d/v 1,28/1,25); no YouTube não (OR 0,79). No TikTok, vídeo abaixo de 100 s derruba (OR 0,57 [0,36 a 0,89]) e a faixa 75 a 90 s replica como ruim (lift 0,72, OR 0,61). Sem controle: IG 165-180 s lift 1,31 (OR 1,56, replica).

**Onde vale.** IG e TT. Leitura: no TikTok o que conta é a duração, não a contagem de palavras; fala mais pausada, com respiro e b-roll, rende mais que o mesmo texto corrido.

**Instrução.** "Conte o tempo com 3 palavras por segundo, não 2,4. Para TikTok e Instagram, o corte final deve ficar entre 150 e 180 s; se o texto de 450 palavras sair com menos de 140 s, a locução está corrida."

**Atenção (dado):** em 1.189 dos 1.857 vídeos de TikTok, `duracao` está em milissegundos (unidade mista na base). Todo corte por segundos em TikTok precisa normalizar (`> 1000` vira `/1000`). O item "vídeo < 75 s OR 0,71" da bateria de sanidade foi calculado sem essa correção.

Confiança: **média** (efeito por rede consistente nas duas metades; mecanismo de edição não medido).

#### T3. Parágrafo de até 35 palavras segura o espectador até o fim

**O quê.** O maior parágrafo do roteiro. Hoje 80% dos roteiros têm algum parágrafo acima de 35 palavras (mediana do maior: 42).

**Números.** Todo parágrafo <=35 palavras: ret_final (IG) lift 1,25 [1,06 a 1,46], OR 1,57 [1,18 a 2,09], d/v 1,17/1,45, **replica**; com controle de tamanho OR 1,42 [1,04 a 1,95]. Na viralização: OR ctl 1,20 [1,04 a 1,39] (lift bruto 1,07, sem replicação formal). Algum parágrafo >45 palavras: ret_final lift 0,74, OR 0,60 [0,43 a 0,83], **replica**; acerto OR 0,86. Média de palavras por parágrafo: neutra. Número de parágrafos: 16 a 18 é a melhor faixa (OR ctl 1,26 [1,09 a 1,45], replica); 10 a 12 tende a pior.

**Instrução.** "Teto duro de 35 palavras por parágrafo; acima de 45 é reescrita obrigatória. Para 450 palavras, isso dá 16 a 18 parágrafos."

Confiança: **alta** para retenção final no Instagram; **média** para viralização.

#### T4. Retenção final e tamanho: o efeito mecânico

ret_final (IG) premia texto curto: <250 palavras lift 1,36 (OR 1,74, replica); 350-400 lift 0,80 (OR 0,68, replica); vídeo de 75 a 90 s lift 1,41 (OR 1,87). É mecânico (menos tempo, mais gente chega ao fim) e não vale como meta: a viralização premia o longo. Por isso todos os testes de retenção final deste relatório controlam a faixa de tamanho.

### 2.2 Dispositivos de corpo (b)

Corpo = do 3º parágrafo até antes da conclusão. Todos os testes abaixo usam MH por cliente x rede x faixa de tamanho (OR ctl) e, para os principais, + roteirista (OR estrito).

#### Funcionam (viralização)

**C1. "Ou seja," abrindo a frase para traduzir o fato em consequência ou escala.**
Números: qualquer "ou seja" no corpo: 1.205 vídeos / 520 roteiros / 27 clientes; 30% vs 25% de topo; lift 1,17 [1,07 a 1,27]; OR ctl 1,36 [1,17 a 1,59]; OR estrito 1,39 [1,17 a 1,64]; d/v 1,11/1,20; **replica**; IG OR 1,51, TT 1,22, YT 1,31; acerto também replica (OR 1,20); lift > 1 em 17 de 20 clientes. Abrindo a frase: 433 roteiros, lift 1,17 [1,06 a 1,28], OR estrito 1,30 [1,09 a 1,56], replica. Macro: Negócios 1,28 (OR 1,65), Tecnologia 1,16, Dinheiro 1,05 (neutro).
Exemplos de topo: "Ou seja, o preço do mercado e da sua gasolina pode estar nos próximos dias." (Fernando Pereira, TikTok, coef 3.661); "Ou seja, quase 30% de toda a rede fechou as portas num único anúncio." (Marcos Pelozato, TikTok, coef 1.356); "Ou seja, quem comprou, está gostando e compartilhando com os amigos." (Renato Mendes, TikTok, coef 483). Contraexemplo: "E despesa operacional é dedutível, ou seja, pode ser deduzida da base de cálculo..." (Dilson Peres, TikTok, coef 0,00): "ou seja" para definir jargão não é o mesmo uso.
Instrução: "Depois do fato mais forte do corpo, abra a frase seguinte com 'Ou seja,' e diga o que aquilo muda para o bolso, o país ou o mercado. Não use 'ou seja' para explicar termo técnico." Reescrita: "A rede fechou 300 lojas." vira "A rede fechou 300 lojas. Ou seja, quase 30% de tudo que ela tinha sumiu num único anúncio."
Confiança: **alta**.

**C2. "Pra você ter ideia," + número ou comparação.**
Números: 1.011 vídeos / 415 roteiros; lift 1,13 [1,03 a 1,24]; OR ctl 1,18 [1,01 a 1,39]; estrito 1,13 [0,95 a 1,34]; d/v 1,08/1,18; replica no controle de tamanho; 12 de 19 clientes. Com número na mesma frase: 290 roteiros, lift 1,18 [1,06 a 1,32], OR ctl 1,25 [1,04 a 1,50], replica. Não funciona em Dinheiro (0,95).
Exemplos: "Para você ter noção do tamanho disso: a empresa tinha cerca de mil lojas no Brasil." (Marcos Pelozato, TikTok, coef 1.356); "Para você ter uma ideia do quão grande é o projeto, 2.1 bilhões de pessoas no mundo não têm acesso à água potável." (Rafael Rodrigues, YouTube, coef 867).
Instrução: "Quando o número for grande demais para sentir, ancore: 'Pra você ter ideia, [número] é [comparação que o brasileiro conhece]'."
Confiança: **média**.

**C3. Nomes próprios densos: 7 ou mais a cada 100 palavras do corpo.**
Números: 1.620 vídeos / 673 roteiros; lift 1,12 [1,04 a 1,21]; OR ctl 1,26 [1,10 a 1,45]; estrito 1,20 [1,04 a 1,40]; d/v 1,11/1,13; **replica**; IG OR 1,33, TT 1,31; 14 de 21 clientes. Corpo pobre em nomes (<=3 por 100) derruba a retenção final (OR 0,69, replica). Macro: Dinheiro 1,31 (OR 1,68), Negócios 1,17 (OR 1,41), **Tecnologia 0,96 (não vale)**. Mineração confirma o lado concreto: "de São Paulo", "Bahia", "Minas", "uma cidade", "montadora" estão entre os n-gramas que replicam.
Exemplos: "O BYD King emplacou 1.433 unidades e ficou com 42,6% do segmento, enquanto o Corolla vendeu apenas 855 carros e ficou com 25,4%." (Renato Mendes, TikTok, coef 483); "Com o anúncio, o Grupo MK, empresa brasileira dona da Mondial, comprou a fábrica e, meses depois, conseguiu o direito de usar o nome Aiwa no país." (João Paulo Albuquerque, TikTok, coef 384).
Instrução: "Troque 'uma empresa chinesa', 'um empresário', 'uma cidade do Nordeste' pelo nome: Geely, Luiz Seabra, Caruaru. Cada parágrafo do corpo com pelo menos um nome próprio."
Confiança: **alta** em Negócios e Dinheiro; não aplicar como regra em Tecnologia.

**C4. Uma data âncora (exatamente 1 ano citado no corpo).**
Números: 1.351 vídeos / 580 roteiros; lift 1,11 [1,02 a 1,21]; OR ctl 1,23 [1,07 a 1,42]; estrito 1,18 [1,01 a 1,37]; d/v 1,14/1,08; replica. 2 a 3 anos: 0,98 (OR ctl 0,87); 4+: 1,00; nenhum: 0,95. Mais forte em Tecnologia (1,23, OR 1,47).
Exemplos: "Em 2013, ele comprou um Toyota Etios 1.5 manual em Brasília." (Leonardo Nogueira, Instagram, coef 438); "Só que agora, em fevereiro de 2026, a Changan, uma das maiores montadoras da China, anunciou o Nevo A06..." (Leonardo Nogueira, YouTube, coef 359).
Instrução: "Uma data, no ponto de virada. Linha do tempo com várias datas não ajuda: troque as demais por 'anos depois', 'meses depois'."
Confiança: **média** (curva não monotônica).

**C5. Uma pergunta completa no corpo (com verbo).**
Números: 1.547 vídeos / 658 roteiros; lift 1,09 [1,00 a 1,18]; OR ctl 1,15 [1,00 a 1,31]; estrito 1,21 [1,04 a 1,41]; d/v 1,10/1,08; replica; comentários OR 1,23 [1,07 a 1,41], replica; 18 de 26 clientes.
Exemplos: "Como é que uma das maiores varejistas do país chega nesse ponto?" (Marcos Pelozato, TikTok, coef 1.356); "Sabe aquele uniforme lendário do penta em 2002?" (Rafael Rodrigues, TikTok, coef 630). Contraexemplo: "Por que?" solto (Marcio Grazino, YouTube, coef 0,01).
Instrução: "Faça uma pergunta inteira, com verbo, que o espectador gostaria de fazer naquele ponto. Nunca a pergunta de duas palavras (ver E2)."
Confiança: **média**.

**C6. Enumeração falada: "Primeiro: ... Segundo: ... Terceiro: ..."**
Números: 2 ou mais marcadores ordinais: 123 vídeos / 51 roteiros / 23 clientes; lift 1,42 [1,11 a 1,76]; OR ctl 1,58 [1,08 a 2,32]; estrito 1,50 [1,01 a 2,24]; d/v 1,37/1,47; replica; acerto lift 1,23 (sem replicação formal). Tecnologia 1,78 (OR 2,53), Dinheiro 1,33, Negócios 1,07. Só 1 cliente com volume (Izabela Anholett, 2,07).
Exemplos: "Primeiro... sol e vento sobram no Nordeste. Energia limpa, barata e quase infinita." (Lincoln Fracari, TikTok, coef 291); "Primeiro: empresas de petróleo fora do Oriente Médio viram seus lucros explodirem nesse cenário. Petrobras, Exxon, Shell." (Fernando Pereira, YouTube, coef 125).
Instrução: "Quando o roteiro explica um 'porquê' com várias causas, numere em voz alta."
Confiança: **média** (51 roteiros).

**C7. "Só que tem um detalhe:" como virada (hipótese).**
Números: 159 vídeos / 65 roteiros; lift 1,34 [1,07 a 1,64]; OR ctl 1,46 [1,03 a 2,07]; mas cai com controle de roteirista (estrito 1,16 [0,80 a 1,70]) e derruba comentários (OR 0,58). YT 1,70.
Exemplo: "Só que tinha um detalhe: a autonomia era de 400 quilômetros, enquanto as versões a lítio do mesmo carro chegavam a 630." (Leonardo Nogueira, YouTube, coef 359).
Confiança: **baixa** (pode ser estilo de um roteirista).

#### Funcionam (retenção final, Instagram)

**C8. Saltos de tempo e "Até que".**
Números (ret_final IG, MH por cliente x faixa de tamanho): "anos/meses depois": 164 vídeos; 36% vs 24%; lift 1,39 [1,12 a 1,68]; OR 1,91 [1,30 a 2,83]; d/v 1,27/1,76; **replica**. "Até que": 117 vídeos; lift 1,35 [1,04 a 1,70]; OR 1,76 [1,15 a 2,69]; d/v 1,25/1,64; **replica**. Mineração de ret_final: "nos anos" (como em "nos anos 90") OR 2,47 [1,50 a 4,06], replica. Na viralização são neutros (0,95 e 1,06).
Exemplos (topo de retenção final no estrato): "Anos depois, a Kraft se reestruturou e virou Mondelez International, um dos maiores grupos de alimentos do planeta." (Franklin Tomich, Instagram); "Até que nos anos 90, veio o pesadelo: o Brasil se abriu para o mercado estrangeiro e as gigantes suíças invadiram o país com bilhões de dólares." (Marcelo Germano, Instagram).
Instrução: "Pule o tempo morto com 'Anos depois,' e abra a virada com 'Até que'. É a troca direta para o 'Foi aí que' (C10)."
Confiança: **alta** no Instagram (retenção só existe no IG com volume).

**C9. Viradas: pelo menos 1 "mas/só que/porém" a cada 100 palavras.**
Números: corpo com 0,4 ou menos viradas por 100 palavras (25% dos roteiros): ret_final lift 0,74 [0,58 a 0,93], OR 0,61 [0,43 a 0,86], **replica**; viralização OR estrito 0,85 [0,73 a 0,98]; YT OR 0,66. "Só que" presente: ret_final OR 1,45 [1,09 a 1,91]. Mais viradas além de 1,1 por 100 não somam (neutro).
Instrução: "A cada 2 parágrafos, um 'só que' ou 'mas' que muda a direção. Densidade de 'então / por isso' é neutra: o que segura é o 'mas', não o 'portanto'."
Confiança: **alta** (retenção), **média** (viralização).

#### Não funcionam

**C10. Molde de biografia: a história de origem contada em ordem.**
O quê: marcadores "nasceu em", "que nasceu", "cresceu em", "trabalhava como", "no início", "desde pequeno/cedo", "percebeu que", "foi nesse momento", "foi aí que", "foi quando", "foi então que", "tudo começou". 26% dos roteiros têm pelo menos um.
Números (dose-resposta, OR estrito): 1 marcador: 533 roteiros, lift 0,90, OR 0,80 [0,68 a 0,95], replica. **2+: 168 roteiros, lift 0,75 [0,61 a 0,92], OR 0,63 [0,47 a 0,84], replica, nas 3 redes (IG OR 0,64, TT 0,55, YT 0,55), lift < 1 em 9 de 12 clientes; comentários também caem (OR 0,70, replica).** 3+: 28 roteiros, lift 0,55, OR 0,40 [0,19 a 0,87]. Pior em Tecnologia (0,41) e Dinheiro (0,36); em Negócios, onde o formato é comum, 0,93. Mineração confirma cada peça (OR total, replicando na validação): "foi nesse" 0,34; "ele percebeu" 0,35; "que nasceu" 0,40; "trabalhava" 0,39; "no início" 0,52; "percebeu que" 0,54. "Foi aí que / foi quando / foi então que" sozinho: 408 roteiros, lift 0,87 [0,77 a 0,98], OR estrito 0,78 [0,64 a 0,94], replica, acerto e comentários também caem.
Contraexemplos reais (fundo do ranking): "Só que Naomi percebeu que precisava ir além dos muros da faculdade. / Foi aí que nasceu a Missão Mulher Saudável..." (Rafael Rodrigues, Instagram, coef 0,08); "Tudo começou nos anos 50, quando a grande maioria das bonecas... / Ruth percebeu que a filha Barbara..." (Thainá Iansen, Instagram, coef 0,12); "Foi aí que ele teve uma ideia: criar uma padaria drive-thru." (Rodrigo Waughan, TikTok, coef 0,01).
Instrução: "Não narre fundação em ordem (nasceu, trabalhava, percebeu, foi aí que). Comece pelo resultado ou pelo conflito, pule o passado com 'Anos depois,' e marque a virada com 'Até que' ou 'Só que'." Reescrita (com o material do próprio roteiro da Thainá Iansen): "Tudo começou nos anos 50, quando a maioria das bonecas era bebê. Ruth percebeu que a filha Barbara brincava com bonecas de papel de mulheres adultas." vira "Nos anos 50, toda boneca de loja era bebê. Até que Ruth viu a filha Barbara brincando com bonecas de papel de mulheres adultas."
Confiança: **alta** (dose-resposta, três redes, controle estrito). Conversa com o rótulo A1 Jornada do Herói (seção 2.5).

**C11. "Você" frequente no corpo (Instagram, retenção final).**
Números: 0,6 ou mais "você" a cada 100 palavras do corpo: ret_final lift 0,77 [0,62 a 0,94], OR 0,55 [0,39 a 0,77], d/v 0,87/0,22, **replica**. Viralização neutra (1,01). Na mineração de ret_final, "te" (OR 0,55) e "vai" (0,68) também derrubam.
Contraexemplo: "Aí você vai para o mercado de trabalho com esse medo na mochila." (Rafael Rodrigues, Instagram, coef 1,31, fundo de retenção final).
Instrução: "No corpo, narre em 3ª pessoa: o personagem faz, o país sofre. Guarde o 'você' para o fim (onde ele gera comentário)."
Confiança: **média** (só IG).

**C12. Neutros: não precisam de regra (OR ctl, nenhum separa):** "Olha isso" (1,11), "Funciona assim" (1,06), "Pensa comigo" (1,39, 45 roteiros, sem significância), "Imagina" (0,98), "E o pior" (1,13), "E é aqui que" (1,21, sem significância), "Repara" (1,06), "Isso significa" (0,89), "Sabe o que" (1,35, sem significância), "E tem mais / não para por aí" (1,14), "O mais impressionante" (1,12), "O que ninguém sabe" (0,92), "no final" (0,85), números por 100 palavras (1,02), aspas (1,01), frase média curta (1,07), frases curtas (1,09), parágrafos abrindo com conectivo (1,11), parágrafos abrindo com "Mas" (1,02). Leve negativo sem replicação: "Na prática" (0,84; ret_final 0,70). "Agora me conta" e "Vamos entender" quase não aparecem (2 e 24 roteiros).

### 2.3 Regras de estilo contra o dado (d)

Texto falado inteiro (hook à conclusão). OR ctl = MH por cliente x rede x faixa de tamanho.

| regra (fonte) | o que o dado diz | números | veredito |
|---|---|---|---|
| Nenhuma antítese "não é X, é Y" (checklist COESÃO; guia, elipse 1) | 1 antítese é neutra em tudo. 2+ derrubam a retenção final. Nenhuma antítese: retenção final OR 1,53. 28% dos roteiros têm 1+, 9% têm 2+. | coef: 0 = 1,00; 1 = 0,98; 2+ = 1,00 (OR ctl 1,02). ret_final 2+: lift 0,60, OR 0,51 [0,32 a 0,82], **replica** | **Afrouxar para "no máximo 1"**; viralização não muda |
| Nenhuma pergunta curta como transição, "O resultado?" (checklist; guia, elipse 2) | Neutra ou levemente positiva na viralização, mas **derruba compartilhamento**. | elíptica 1+ (140 roteiros): coef 1,11 (estrito 1,32 [1,00 a 1,75]); compart lift 0,66, OR 0,60 [0,37 a 0,96], **replica**. Pergunta de até 4 palavras: compart OR 0,62 [0,44 a 0,87], replica | **Manter** (pelo compartilhamento) |
| Pergunta retórica, no máximo 1 (guia, elipse 2) | O teto não se sustenta. Zero pergunta derruba comentários; 2+ não prejudicam. | 0 perguntas: comentários OR 0,78 [0,69 a 0,88], replica; coef estrito 0,85. 1: comentários OR 1,25, replica. 2+: coef 1,09, acerto OR 1,20. 3+: coef estrito 1,44 [1,01 a 2,06] | **Trocar por "pelo menos 1 pergunta completa; nunca elíptica"** |
| Nada de tricolon de fechamento "X, Y e Z." (guia) | 1 é neutro (29% dos roteiros). 2+ (6%) tende a piorar. | 1: coef 1,00, compart 1,07. 2+: OR ctl 0,79 [0,60 a 1,03], acerto OR 0,76 [0,59 a 0,97], ret_final 0,77 | **Afrouxar para "no máximo 1"** |
| Não abra frases consecutivas com "E" (guia) | Não prejudica. E parágrafo abrindo com "E" ajuda. | frases seguidas com "E" (157 roteiros): coef 1,12 (estrito 1,24, sem significância). Parágrafos do corpo abrindo com "E" (>=15%, 731 roteiros): OR ctl 1,19 [1,04 a 1,36], estrito 1,25 [1,09 a 1,44]; compart OR 1,34 [1,09 a 1,63], **replica**; comentários OR 1,28 [1,12 a 1,46], **replica** | **Retirar a proibição**; "E" falado como ponte de parágrafo é registro de fala |
| Parágrafo de até 35 palavras (guia) | Confirmado na retenção final (T3). | ret_final OR 1,42 a 1,57, replica; >45 palavras OR 0,60, replica | **Manter e endurecer** (80% dos roteiros violam hoje) |
| No máximo 3 frases longas seguidas (guia) | Sem efeito. 90% dos roteiros violam. | corrida <=3: 1,03; 4-6: 1,00; 7-9: 1,03; 10+: 0,95 | **Sem base no dado**: pode sair ou ficar só como higiene de leitura |
| Máximo 1 travessão (guia) | Não testável: 5 roteiros com travessão. | | Manter (regra do produto) |
| Metáfora genérica de LLM (jornada, mergulho...) | Tendência negativa, amostra pequena. | 44 roteiros: coef 0,84, estrito 0,65 [0,38 a 1,11] | Manter |
| Conectivo falado entre parágrafos / But-Therefore (checklist COESÃO) | O "But" importa (viradas), o "Therefore" não. | viradas <=0,4 por 100: ret_final OR 0,61, replica. "então/por isso": neutro | **Reescrever**: exigir a virada ("mas / só que") a cada 2 parágrafos |
| Especificidade vence adjetivo (guia) | Densidade de números é neutra; o que funciona é especificidade de **nome** e número **traduzido**. | números por 100: 1,02; nomes próprios: OR estrito 1,20; "Ou seja," OR 1,30 | **Corrigir o exemplo**: "nome próprio e número traduzido" |
| Endereçar o espectador ("você vê", "adivinha") (guia) | No corpo, "você" derruba a retenção final; "E adivinha?" é pergunta elíptica. | ret_final OR 0,55 (C11); elíptica: compart OR 0,60 | **Corrigir**: endereçar no fim, narrar o corpo em 3ª pessoa |
| 150 a 430 palavras (checklist FORMATO) | Teto errado. | ver T1 | **Corrigir para 420 a 500** |
| 150 palavras = 60 s, 430 = 180 s (checklist) | Ritmo real 3,07 palavras/s. | 430 = 140 s | **Corrigir** |

Exemplos reais:
- Antítese 2+ (fundo de retenção final): "não foi qualquer IPO, foi um dos maiores da história americana, levantando mais de 20 bilhões de dólares" (Marcos Pelozato, Instagram). Antítese isolada em vídeo de topo: "não era americano nem alemão. Era brasileiro" (Marcio Grazino, TikTok, coef 740).
- Pergunta elíptica: "O resultado? Hoje a LEGO vale bilhões de dólares..." (Rafael Rodrigues, YouTube, coef 0,07); "E adivinha? O custo mais alto de qualquer empresa de tecnologia é a folha de pagamento..." (Izabela Anholett, Instagram, coef 0,10). Reescrita: "E o resultado disso pegou o mercado de surpresa: hoje a LEGO vale bilhões de dólares."
- Parágrafo abrindo com "E": "O preço do barril de petróleo disparou 10%. / E tem muitos especialistas dizendo que esse pode ser o início de uma crise brutal." (Fernando Pereira, TikTok, coef 3.661).

### 2.4 Conclusão (c)

Conclusão = parágrafo antes do bloco final (apresentação + comando). Mediana atual: 26 palavras, 1 frase. 56% das conclusões não retomam nenhuma palavra do hook.

#### Fórmulas que funcionam

| # | fórmula | desfecho que move | números | onde vale |
|---|---|---|---|---|
| F1 | **Contraste "Enquanto todo mundo X, [personagem] Y."** | **viralização** e acerto | abrindo a conclusão: 294 vídeos / 124 roteiros; 31% vs 26%; lift 1,21 [1,02 a 1,43]; OR ctl 1,44 [1,11 a 1,87]; estrito 1,38 [1,04 a 1,82]; d/v 1,02/1,35; **replica**; acerto OR 1,50, replica. YT OR 1,86, TT 1,37, IG 1,25 | **Negócios (1,53, OR 1,95) e Dinheiro (1,16). Em Tecnologia, não (0,70)** |
| F2 | **Eco do hook: a conclusão repete 20% ou mais das palavras de conteúdo do hook** | **viralização** | 708 vídeos / 314 roteiros; lift 1,15 [1,02 a 1,28]; OR ctl 1,28 [1,07 a 1,53]; estrito 1,28 [1,05 a 1,55]; d/v 1,00/1,26; **replica**; TT OR 1,48; 10 de 17 clientes | Dinheiro 1,24, Negócios 1,18, Tecnologia 1,04 |
| F3 | **Revisão de crença: "X nem sempre Y. Às vezes, Z."** | **viralização** | "nem" na conclusão: 89 roteiros; lift 1,40 [1,16 a 1,67]; OR ctl 1,54 [1,14 a 2,09]; estrito 1,69 [1,23 a 2,33]; **replica**, nas 3 redes. "nem sempre": 23 roteiros, lift 1,66, OR ctl 2,72 (sem replicação formal) | geral (Negócios 1,59) |
| F4 | **Escala global no fecho: "o mundo inteiro", "do mundo", "planeta"** | viralização (+ candidato a compartilhamento) | 355 vídeos / 147 roteiros; lift 1,19 [1,01 a 1,38]; OR ctl 1,33 [1,04 a 1,70]; d/v 1,21/1,18; replica. Compart lift 1,25, OR 1,46 [1,02 a 2,09], d/v 1,20/1,35 (lift sem significância) | Negócios 1,47, Tecnologia 1,23; **Dinheiro 0,88** |
| F5 | **Antes x agora: "era X; hoje/agora Y" e fechar no estado atual do personagem** | **retenção final** (+ viralização no YT) | "hoje" na conclusão: ret_final lift 1,49, OR 1,83 [1,04 a 3,24], replica; coef 1,18 (YT OR 1,96). Conclusão que fica no personagem (ele/ela/dele/dela): ret_final OR 1,56 [1,17 a 2,08], replica. "era... hoje/agora": 20 roteiros, lift 1,71, OR ctl 2,57, replica (n pequeno) | IG (retenção), YT (viralização) |
| F6 | **Pergunta de escolha ao espectador: "Se você fosse comprar hoje, iria de X ou de Y?"** | **comentários** (custa viralização) | pergunta na conclusão: comentários lift 1,21, OR 1,35 [1,12 a 1,64], replica. Pede opinião ("você acha / você faria / e você?"): comentários lift 1,40, OR 1,76 [1,21 a 2,58], replica; coef 0,79 (sem significância, sinal negativo) | geral; em Dinheiro a viralização cai mais (0,48) |
| F7 | **Trazer para o Brasil, o país ou o governo** | **comentários** | 796 vídeos / 343 roteiros; comentários lift 1,36 [1,23 a 1,49], OR 1,66 [1,40 a 1,96], replica; compart OR 1,22 (sem significância); coef 1,07 | geral |
| F8 | **Opinião do narrador em 1ª pessoa ("eu quero saber", "eu testei")** | **comentários** | 50 roteiros; comentários lift 1,70, OR 2,61 [1,76 a 3,88], replica. Número novo na conclusão: comentários OR 1,44, replica (coef sobe só em Dinheiro, 1,53) | geral |

Exemplos reais de topo:
- F1: "Enquanto todo mundo gasta rios de dinheiro em propaganda, a Comet faz o próprio cliente virar propaganda: ela vende a sensação de fazer parte de algo raro, e quem participa de algo raro costuma fazer questão de contar para todo mundo." (Pedro Elero, YouTube, coef 1.238); "Enquanto o mundo apostava suas fichas em baterias elétricas, a Geely investiu pesado em tornar o motor a gasolina mais eficiente do que nunca, quebrando um recorde mundial com isso." (Pedro Elero, TikTok, coef 486); "Enquanto todo mundo procura natureza intocada em lugares distantes, Manaus escondeu uma floresta de verdade dentro de um shopping." (Rodrigo Waughan, TikTok, coef 142). Contraexemplo: "Enquanto tentou fugir da própria estranheza, quase desapareceu..." (Marcos Pelozato, TikTok, coef 0,10): o "enquanto" de tempo não é o de contraste com "todo mundo".
- F2: hook "O mundo tem exatamente 40 dias até o petróleo acabar." e conclusão "Neste momento o mundo inteiro está acompanhando de perto o que vai acontecer nas próximas horas." (Fernando Pereira, TikTok, coef 3.661); hook "Esse é o cara mais odiado do mundo pelos donos de academia!" e conclusão "...quando você para de tentar servir todo mundo, pra atingir o cliente certo, o preço sobe." (Renato Torres, Instagram, coef 244).
- F3: "A inovação que muda o mundo nem sempre sai de Harvard ou de Cambridge. Às vezes ela sai de um laboratório público brasileiro que quase ninguém conhecia até ontem." (Marcio Grazino, YouTube, coef 144); "Mas João nos prova que a escassez nem sempre é um limite. Às vezes, ela obriga você a pensar de um jeito que ninguém pensou antes para criar o seu produto." (Rafael Rodrigues, Instagram, coef 438).
- F4: "A barreira que manteve o carro elétrico fora do alcance da maioria nunca foi a tecnologia, foi a dependência de um único material que poucos países controlavam e o mundo inteiro precisava." (Leonardo Nogueira, YouTube, coef 359).
- F5: "O computador era do tamanho de uma sala. Depois coube no bolso. Agora muito em breve vai caber no seu olho." (Izabela Anholett, TikTok, coef 65); "O imiquimod já estava aprovado pelo governo há anos. O problema não era a ciência, era a acessibilidade. Ao mudar de creme caro para sabonete barato, ele agora pode salvar milhões de pessoas..." (Rafael Rodrigues, YouTube, coef 397).
- F6: "E a dúvida que fica é, se você fosse comprar um carro hoje, iria de Chines ou de Japonês?" (Renato Mendes, TikTok, coef 483); "E se você pudesse escolher 1 carro para rodar 1 milhão de km, qual carro seria?" (Leonardo Nogueira, Instagram, coef 438); "Mas o que você acha? É o fim do Xbox ou os caras vão conseguir dar a volta por cima?" (Thiago Franco, TikTok, 19,6 comentários por mil views).
- F7: "Porque uma coisa é fato: a gente é Brasil. E não é uma marca de fora que vai mudar isso." (Rafael Rodrigues, TikTok, coef 630).
- F8: "E agora eu quero saber de você: essa mudança vai melhorar o sistema ou apertar ainda mais as empresas?" (Marcos Pelozato, YouTube, 8,7 comentários por mil).

Tamanho: **16 a 25 palavras** (coef OR ctl 1,12 [1,00 a 1,27]; acerto OR 1,15, replica). **15 ou menos derruba**: 311 roteiros, lift 0,84 [0,73 a 0,96], OR estrito 0,77 [0,63 a 0,95], replica, acerto também; pior em Tecnologia (0,63, OR 0,51); lift < 1 em 12 de 15 clientes. Uma ou três frases: indiferente.

#### Fórmulas que não funcionam

| fórmula | desfecho | números | exemplo real (fundo) |
|---|---|---|---|
| Hesitação: "pode ser", "talvez" | viralização cai | 97 roteiros; 18% vs 26%; lift 0,71 [0,53 a 0,92]; OR estrito 0,65 [0,45 a 0,94]; d/v 0,61/0,78; **replica**; acerto OR 0,58; Dinheiro 0,27 | "Se a resposta for não, talvez seja aí que você está perdendo dinheiro." (Marcio Grazino, YouTube, coef 0,01) |
| Sermão comparativo: "A diferença (entre X e Y) está em..." | viralização cai | 70 roteiros; 15% vs 26%; lift 0,58 [0,39 a 0,83]; OR estrito 0,55 [0,35 a 0,88]; **replica** | "A diferença entre elas e as que dominam quase sempre está na mesma coisa: alguém com coragem de aparecer..." (Café com Ferri, YouTube, coef 0,07) |
| Ordem ao espectador: "você precisa", "presta atenção" | viralização cai | 189 roteiros; lift 0,81 [0,67 a 0,96]; OR estrito 0,65 [0,50 a 0,85]; **replica**; 7 de 9 clientes | "...até quem lidera precisa correr pra não ficar pra trás com os avanços da IA." (Manoel Victor, YouTube, coef 0,04) |
| "A lição é..." / "lição" | comentários caem; viralização neutra | 78 roteiros; coef 0,91 (sem significância); comentários lift 0,59, OR 0,53 [0,34 a 0,81], replica; na mineração "a lição" OR 0,40 (validação 0,18) | "A lição é clara: Quem blinda a sua base, constrói um império inquebrável." (Rodrigo Waughan, YouTube, coef 0,01) |
| Aforismo "Quem X, Y." | retenção final cai | 115 roteiros; coef 0,90 (sem significância); ret_final lift 0,48, OR 0,42 [0,20 a 0,85], **replica** | "Quem controla as regras, controla o mundo..." (Fernando Pereira, Instagram, fundo de retenção final) |
| "Mas sim / e sim" | comentários caem | comentários lift 0,60, OR 0,51 [0,34 a 0,76], replica (viralização 1,22, sem significância) | |
| Abrir com "E agora" / "Agora" | viralização tende a cair | 62 roteiros; lift 0,75, OR ctl 0,66 [0,44 a 1,00]; acerto OR 0,67 | |
| Conclusão de até 15 palavras | viralização cai | ver acima | "A lição é clara: Quem blinda a sua base, constrói um império inquebrável." |

Neutros: abrir com "Essa história mostra" (26 roteiros), "No fim" (1,23, sem significância), "Ou seja", "Por isso", "Então", "Hoje", "Mas", nome próprio; virada "mas/só que" na conclusão (0,97); projeção de futuro "vai/em breve" (1,06); "você" na conclusão (0,97); número na conclusão (1,02); terminar em frase curta de até 8 palavras (0,93).

**Instruções para o playbook novo de conclusão:**
1. "Feche com um contraste: 'Enquanto todo mundo [faz o óbvio], [personagem] [fez o contrário]'. Em Tecnologia prefira o eco do hook."
2. "Repita na conclusão a palavra-chave do hook (o objeto, o número, o lugar): o espectador sente o círculo fechar."
3. "Se a história derruba uma crença: '[Crença] nem sempre [é verdade]. Às vezes, [o achado da história].'"
4. "16 a 25 palavras. Nunca menos de 15."
5. "Proibido na conclusão: 'pode ser', 'talvez', 'a diferença está em', 'você precisa', 'presta atenção', 'a lição é', 'Quem X, Y'." Reescrita: "A lição é clara: quem blinda a sua base, constrói um império inquebrável." vira "Enquanto todo mundo corria atrás de cliente novo, [a empresa da história] blindou quem já comprava, e é por isso que ela ainda está de pé." (molde: troque pelos fatos do próprio roteiro)
6. "Quer comentário? Troque a moral por uma pergunta de escolha com o Brasil dentro: 'Se você fosse [decidir] hoje, iria de X ou de Y?'. Use quando o objetivo do vídeo for conversa; para alcance, prefira 1 a 3."

### 2.5 Estruturas (checagem, rótulos `cls_estrutura` de setembro)

Subconjunto rotulado (3.191 vídeos), MH por cliente x rede x tamanho. Duas replicam:
- **B1 Davi e Golias ajuda**: 159 vídeos; 34% de topo; lift 1,38 [1,10 a 1,69]; OR 1,69 [1,17 a 2,44]; d/v 1,30/1,51; replica. Dinheiro 1,64, Tecnologia 1,52, Negócios 1,17. Confirma (e fortalece) o sinal fraco de setembro.
- **A1 Jornada do Herói atrapalha**: 371 vídeos; 18% de topo; lift 0,75 [0,60 a 0,92]; OR 0,61 [0,45 a 0,84]; d/v 0,78/0,64; replica; em Negócios 0,76 (n=269). É o mesmo fenômeno de C10: o molde concreto que derruba é a biografia em ordem.
- Combinações (hipóteses, sem replicação formal): E1 Paradoxo Contraintuitivo ajuda em Dinheiro (1,85) e Negócios (1,39), atrapalha em Tecnologia (0,51); E2 Inovação e Sacada Genial ajuda em Tecnologia (1,14) e atrapalha em Negócios (0,63 [0,44 a 0,88]); A3 Herói Esquecido ajuda em Negócios (1,85 [1,32 a 2,41], n=52). C1 O Iconoclasta: 0,75 (OR 0,62 [0,41 a 0,93]), sem replicação formal.

## 3. O que os playbooks afirmam e o dado confirma, corrige ou desmente

| playbook / regra | veredito | base |
|---|---|---|
| checklist v3, FORMATO: "entre 150 e 430 palavras" | **corrige**: 420 a 500 (alvo 450-490); <300 elimina | T1 |
| checklist v3, guia: "150 palavras = 60 s; 430 = 180 s" | **desmente**: 3,07 palavras/s | T2 |
| checklist v3, COESÃO: "nenhuma antítese 'não é X, é Y'" | **corrige para no máximo 1**: neutra na viralização; 2+ derrubam retenção final (OR 0,51) | 2.3 |
| checklist v3, COESÃO: "nenhuma pergunta curta como transição" | **confirma** (compartilhamento OR 0,60) | 2.3 |
| checklist v3, COESÃO: "conexão But/Therefore", "conectivo em voz alta" | **corrige**: o "mas/só que" segura (sem ele, ret_final OR 0,61); "então/por isso" e conectivo no início do parágrafo são neutros | C9 |
| guia v4: "parágrafo de até 35 palavras" | **confirma** (ret_final OR 1,42 a 1,57; >45 OR 0,60) | T3 |
| guia v4: "no máximo 3 frases longas seguidas" | **sem efeito** (90% violam, nenhuma faixa separa) | 2.3 |
| guia v4: "nada de tricolon de fechamento" | **corrige para no máximo 1** (2+: acerto OR 0,76) | 2.3 |
| guia v4: "não abra frases consecutivas com E" | **desmente**: neutro; parágrafo abrindo com "E" ajuda compartilhamento (OR 1,34) e comentários (OR 1,28) | 2.3 |
| guia v4: "pergunta retórica, no máximo 1 por roteiro" | **desmente o teto**: 0 perguntas derruba comentários (OR 0,78); pergunta completa no corpo ajuda (OR estrito 1,21) | C5, 2.3 |
| guia v4: "pergunta elíptica proibida" | **confirma** (compartilhamento) | 2.3 |
| guia v4: "especificidade vence adjetivo (R$ 3.400)" | **corrige o foco**: densidade de número é neutra; nome próprio (OR 1,20) e número traduzido com "Ou seja" / "Pra você ter ideia" funcionam | C1 a C3 |
| guia v4: "endereçar o espectador é o registro certo" | **corrige**: no corpo, "você" derruba a retenção final (OR 0,55); endereçar na conclusão gera comentário | C11, F6 |
| guia v4: "metáfora genérica de LLM" | tendência negativa, n pequeno (44 roteiros) | 2.3 |
| guia v4: "máximo 1 travessão" | não testável (5 roteiros) | |
| storytelling v1: A1 Jornada do Herói "Validada" | **desmente**: atrapalha (OR 0,61, replica); biografia em ordem OR estrito 0,63 | 2.5, C10 |
| storytelling v1: B1 Davi e Golias "Validada" | **confirma** (OR 1,69, replica) | 2.5 |
| storytelling v1: passo final "Lição replicável / Lição universal" (A1, A2) | **corrige**: "A lição é..." não move viralização e derruba comentários (OR 0,53); "Quem X, Y" derruba retenção final (OR 0,42); trocar por contraste (F1), eco do hook (F2) ou revisão de crença (F3) | 2.4 |
| storytelling v1, Parte 3: O Iconoclasta no Tier S | **não confirmado**: 0,75 (OR 0,62), sem replicação formal | 2.5 |
| storytelling v1, A2 "Herói Improvável: adversidade com número concreto" | não testado diretamente; A2 sem evidência (1,17, OR 1,39 sem replicação) | 2.5 |

## 4. O que NÃO deu para afirmar

- **Compartilhamento e salvamento:** nenhuma fórmula de conclusão replicou para compartilhamento (IG+TT) nem salvamento (TT). Candidatos: escala global (compart OR 1,46, lift sem significância); na mineração, "inovação", "mundo inteiro", "constrói" (só 30 a 40 roteiros cada). Hipóteses, não regras.
- **Retenção final é só Instagram** (1.317 vídeos com dado; TikTok tem 263). Todo achado de ret_final vale para IG.
- **Facebook** (276 vídeos) e **Entretenimento** (1 cliente, 78 vídeos): sem conclusão.
- **Acima de 500 palavras:** a queda é consistente nas redes, mas são 113 vídeos (cerca de 45 roteiros) e poucos clientes; teto "provável", não regra.
- **Hipóteses com n pequeno ou que caem com controle de roteirista:** "Só que tem um detalhe" (65 roteiros; estrito 1,16), "Entenda" (59 roteiros; quase todo efeito no IG), "nem sempre... às vezes" (23 roteiros), "era... hoje" (20 roteiros), enumeração ordinal (51 roteiros).
- **Data âncora (1 ano):** curva não monotônica (1 ano ajuda, 2 a 3 tendem a piorar, nenhum é neutro); pode ser marcador de outro traço do roteiro.
- **Causalidade:** a escolha de um dispositivo acompanha tema, cliente e roteirista. O controle por cliente x rede x tamanho x roteirista reduz a confusão, não a elimina.
- **Independência:** o mesmo roteiro aparece em até 3 redes; os IC tratam vídeos como independentes e ficam um pouco estreitos. Os n de roteiros estão sempre ao lado.
- **Comparações múltiplas:** cerca de 150 características contra até 6 desfechos. Só chamei de regra o que replica nas duas metades e, nos principais, resiste ao controle estrito; os "sinal sem replicação" (aspas e frases curtas na retenção, "pensa comigo", "sabe o que") podem ser falsos positivos.
- **Dado:** `duracao` do TikTok mistura milissegundos e segundos (1.189 de 1.857 em ms). Corrigido aqui; a bateria de sanidade ("vídeo < 75 s, OR 0,71") e qualquer outro corte por duração em TikTok precisam da mesma correção.
- **Segmentação sem LLM:** em parte dos roteiros a "conclusão" inclui a apresentação ou o comando (quando o bloco final não foi detectado, 56 roteiros), o que contamina um pouco os traços de 1ª pessoa ("eu") na conclusão.
