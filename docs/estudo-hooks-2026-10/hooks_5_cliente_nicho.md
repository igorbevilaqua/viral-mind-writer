# Hooks × cliente × nicho: o mesmo hook funciona em qualquer canal?

**Pergunta do dono:** "alguns tipos de hook podem funcionar mais para alguns clientes do que para outros, ou para alguns nichos do que para outros?"

**Resposta curta:** sim, e dá para separar em três grupos.
1. **Regra geral (funciona em quase todo canal):** "acabou de" (notícia agora), abrir com marca ou pessoa conhecida ("O/A + Nome"), citar país ou região (China, Brasil, EUA...) e conflito ou choque.
2. **Depende do nicho (interação real):** pergunta, abrir com "Você", abrir com "Esse/Essa", "fatura N bilhões / virou império" e número.
3. **Quase sempre ruim:** primeira pessoa (eu/meu/minha). A exceção são poucos canais em que o apresentador é o personagem.

Fonte: `oraculo.fato_video` + `public.videos` (Supabase Viral Data). Janela de 17/10/2025 a 17/10/2026. Ficaram de fora vídeos maturando, removidos, reposts e com hook vazio. Instagram: **6.062 vídeos de 33 clientes** em 6 nichos. Todos os números abaixo saíram de queries reais.

---

## 0. Método (o que o slide precisa dizer em 1 minuto)

- **Acerto** = `classificacao` igual a 'acerto' ou 'outlier', ou seja, acima do limiar do próprio canal (o maior entre 10k e 3x a mediana). Como cada canal é medido contra si mesmo, um canal pequeno e um canal grande ficam comparáveis.
- **Lift** = taxa de acerto *com* o tipo de hook ÷ taxa de acerto *sem* o tipo, dentro do mesmo grupo. Lift 2,0 significa que o hook acerta o dobro.
- **Lift ajustado por cliente** (o da matriz): mede o acerto observado contra o esperado pela taxa-base de cada cliente. Sem esse ajuste, um tipo usado muito por um cliente que já acerta muito pareceria bom só por causa desse cliente.
- **Tipos de hook** (regex sobre `lower(hook)`). Os tipos não são exclusivos: um hook pode ser "acabou de" e "conflito" ao mesmo tempo.

| tipo | regra |
|---|---|
| acabou_de | `acabou de` / `acaba de` |
| abre_nome | começa com "O/A/Os/As" + palavra com maiúscula (marca ou pessoa conhecida) |
| conflito | guerra, humilh, destru, matou, pânico, mentindo, vergonha, assustador, golpe |
| pergunta | contém "?" |
| abre_voce | começa com "Você" |
| primeira_pessoa | eu/meu/minha/meus/minhas |
| ninguem_sabe | quase ninguém / ninguém sabe / você nunca |
| nostalgia | antigamente / lembra / sumiu |
| abre_esse | começa com Esse/Essa/Este/Esta |
| pais_regiao | china, brasil(eiro), nordeste, japão, eua, estados unidos |
| jornada | "virou um império", "fatura … bilhões/milhões", "de zero/nada/camelô… a" (regex aproximado) |
| numero | contém dígito |

- **Nichos.** `cliente_nicho` traz 3 rótulos automáticos por cliente, e quase todos repetem NEGÓCIOS/MARKETING. Por isso agrupei os clientes à mão em 6 nichos legíveis, pela categoria de conteúdo dominante (`fato_video.categorias`) e pelo nicho de peso 1:

| nicho | clientes (IG) | vídeos | taxa de acerto base |
|---|---|---|---|
| 1. IA/Tecnologia | Izabela Anholett, Leonardo Cirino, João Felipe Marques, Manoel Victor (93 vídeos de IA), Patrick Diorio, Mariana Moreno, Thiago Bisewski | 861 | 18,7% |
| 2. Finanças/Impostos | Dilson Peres, Ricardo Schumacher, Fernando Pereira, Lerry Granville, Túlio Lichenstein | 733 | 14,5% |
| 3. Sociedade/Política/Geopolítica | Lincoln Fracari, Café com Ferri, Igor Bevilaqua | 763 | 24,2% |
| 4. Ciência/Inovação BR/Saúde | Rafael Rodrigues, Marcio Grazino, Leonardo Martins, Leonardo Nogueira, Drielle Castelani | 687 | 24,6% |
| 5. Case/História de empresa | Franklin Tomich, Rodrigo Waughan, João Paulo Albuquerque, Renato Torres, Renato Mendes | 850 | 14,4% |
| 6. Empreendedorismo/Marketing/Comportamento | Marcos Pelozato, Marcelo Germano, Thiago Franco, Cadu Neiva, Pedro Elero, Exame (3º e 4º slot), Thainá Iansen | 2.168 | 16,0% |

Carros (Leonardo Nogueira, Thiago Bisewski) e futebol (Pedro Elero) não têm volume para formar um nicho próprio no IG. Por isso entraram em Ciência/Inovação, IA e Empreendedorismo, respectivamente.

---

## 1. Matriz tipo de hook × nicho (Instagram)

Cada célula mostra o **lift ajustado por cliente** e, entre parênteses, o nº de vídeos com aquele tipo. Só entram células com n≥15. 🟩 ≥1,3 · 🟥 ≤0,75.

| tipo | IA/Tec | Finanças | Sociedade/Geo | Ciência/Inov | Case/Hist. empresa | Empreend./Mkt |
|---|---|---|---|---|---|---|
| acabou_de | 🟩 1,56 (121) | 🟩 2,72 (31) | 🟩 1,60 (40) | 1,03 (23) | 🟩 2,40 (27) | 🟩 2,11 (68) |
| conflito | 🟩 1,63 (106) | 🟩 2,49 (48) | **0,87 (33)** | 🟩 1,77 (49) | 🟩 1,32 (50) | 🟩 1,48 (75) |
| pais_regiao | 🟩 1,57 (131) | 1,26 (177) | 🟩 1,35 (288) | 🟩 1,30 (203) | 🟩 1,33 (165) | 🟩 1,45 (359) |
| abre_nome | 🟩 1,60 (206) | 🟩 1,89 (109) | 1,23 (110) | **0,88 (66)** | 1,16 (112) | 🟩 1,65 (184) |
| ninguem_sabe | 1,05 (41) | 🟩 1,43 (39) | 1,02 (21) | 1,13 (26) | 1,01 (22) | 🟩 1,80 (70) |
| nostalgia | – | – | – | 🟩 1,32 (20) | 1,21 (29) | 0,91 (37) |
| abre_esse | 🟥 **0,55 (108)** | 1,01 (30) | 1,00 (40) | 🟩 **1,53 (142)** | 1,06 (110) | 🟩 **1,65 (220)** |
| numero | 1,08 (172) | 0,93 (205) | 1,28 (167) | 0,94 (189) | 0,89 (249) | 🟩 1,34 (651) |
| jornada | – | – | – | – | 🟥 **0,25 (32)** | 🟩 **1,41 (65)** |
| pergunta | 🟥 0,74 (126) | 1,11 (125) | 1,09 (197) | 🟥 **0,16 (50)** | 1,15 (163) | 🟥 **0,63 (525)** |
| abre_voce | 🟥 0,70 (21) | 🟩 1,45 (16) | 🟩 **1,43 (39)** | 🟥 0,42 (19) | 1,22 (57) | 🟥 **0,32 (93)** |
| primeira_pessoa | 🟥 0,70 (96) | 🟥 0,36 (143) | 0,78 (143) | 🟥 0,27 (62) | 1,06 (117) | 🟥 0,63 (457) |

### Interações reais (o tipo funciona num nicho e falha em outro)

Taxas brutas de acerto, *com* vs. *sem* o tipo, dentro do nicho:

| tipo | onde funciona | onde falha | se repete no TikTok/YouTube? |
|---|---|---|---|
| **Abrir com "Você"** | Sociedade 33,3% vs 23,8%; Case 19,3% vs 14,0% | Empreend./Mkt **5,4% vs 16,4%** (n=93); Ciência 10,5% vs 25,0% | **Sim.** Case: TT 2,19 / YT 1,39. Empreend.: TT 0,00 / YT 0,20 |
| **Pergunta "?"** | Case 17,8% vs 13,5%; Finanças 15,2% vs 14,3% | Ciência **4,0% vs 26,2%** (n=50); Empreend. 10,7% vs 17,7% (n=525) | **Sim** para Ciência (TT 0,35). Finanças TT 1,48 |
| **Abrir com "Esse/Essa"** | Ciência 33,8% vs 22,2%; Empreend. 25,9% vs 14,8% | IA/Tec **12,0% vs 19,7%** (n=108) | **Sim.** IA: TT 0,29 / YT 0,91. Empreend.: YT 2,01 |
| **Conflito/choque** | Finanças 27,1% vs 13,6%; Ciência 42,9% vs 23,2%; IA 34,0% vs 16,6% | Sociedade/Geo 21,2% vs 24,4% | **Não.** Sociedade TT 1,83 / YT 1,64. A falha é do Lincoln no IG (ver seção 2) |
| **"Fatura N bi / virou império"** | Empreend. 21,5% vs 15,8% | Case **3,1% vs 14,8%** (n=32) | Instável (Case TT 1,36 / YT 0,00). Tratar como sinal fraco |
| **Abrir com Nome** | Finanças 26,6% vs 12,3%; IA 29,6% vs 15,3% | Ciência 22,7% vs 24,8% | Ciência YT 1,55, então não se repete |

Exemplos literais das interações:

- **"Você" funciona em Case:** Franklin Tomich, "Você é dono de empresa e um dia pretende vender o seu negócio? Então fica até o final, pois tem uma surpresa pra você." (273k views, coef 729) https://www.instagram.com/reel/DW4XTgRDt0a
- **"Você" funciona em Sociedade:** Lincoln Fracari, "você acha que o povo chinês não liga de viver numa ditadura" (176k, coef 21,5) https://www.instagram.com/reel/DWh5MfIjdcw
- **"Você" falha em Empreend./Mkt:** Thiago Franco, "Você aumentou o orçamento do seu mercado ads e as vendas não acompanharam. E a culpa não é do algoritmo, é do seu anúncio." (2,6k, coef 0,12) https://www.instagram.com/reel/DYNY4qQJFNO
- **"Você" falha em Empreend./Mkt:** Marcelo Germano, "Você combina 10 coisas por dia na sua empresa e anota zero." (3,2k, coef 0,20) https://www.instagram.com/reel/DYVdB-Nha7Q
- **"Esse/Essa" funciona em Ciência/Inovação:** Leonardo Nogueira, "Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica." (6,2M, coef 438) https://www.instagram.com/reel/DYo3ldvOFHW
- **"Esse/Essa" funciona em Empreend.:** Cadu Neiva, "essa estratégia assustadora fez esse empresário multiplicar 10x sua fortuna." (2,5M, coef 740) https://www.instagram.com/reel/DWuSVeFEdwk
- **"Esse/Essa" falha em IA/Tec:** Leonardo Cirino, "Esse novo modo do Spotify é sensacional. Agora, a IA vai virar o seu maior aliado na hora do treino." (4,7k, coef 0,18) https://www.instagram.com/reel/DbwgqcVtkkc
- **Pergunta falha em Ciência/Saúde:** Drielle Castelani, "Quarta-feira, dia de Paciente Oculto. Na semana passada, eu tive uma aula com as secretárias…" (2,7k, coef 0,3) https://www.instagram.com/reel/DWCaYg4Agb7
- **Pergunta falha em Ciência/Saúde:** Marcio Grazino, "Venezuela, a maior oportunidade ou a maior armadilha para os investidores nos próximos anos?" (841, coef 0,38) https://www.instagram.com/reel/DT3j3U8Ecip
- **Pergunta funciona em Finanças:** Lerry Granville, "30 mil reais guardado, eles conseguem já entrar nisso aí e começar a arrematar leilão?" (419k, coef 68,7) https://www.instagram.com/reel/DYXwGCShhwx
- **"Fatura N bi" falha em Case:** Rodrigo Waughan, "A Havan fatura hoje 18 bilhões de reais fazendo o oposto da concorrência, mas existe um erro silencioso que pode estar engolindo esse império por dentro." (1,5k, coef 0,48) https://www.instagram.com/reel/DW3nD5SiDcG
- **"Fatura N bi" falha em Case:** João Paulo Albuquerque, "Esse inventor foi roubado, perdeu tudo e morreu completamente pobre, mas transformaram a ruína desse homem em um negócio que fatura 18,9 bilhões de dólares." (1,3k, coef 0,5) https://www.instagram.com/reel/DbJJ4NIFdvN
- **"Fatura N mi" funciona em Empreend.:** Marcelo Germano, "Como que um homem embaixo dessa árvore com 10 filhos para sustentar e um tacho de melado de cana construiu uma empresa que fatura 463 milhões de reais?…" (190k, coef 15,6) https://www.instagram.com/reel/DZTSLgLhiq9

### Retenção do hook (`retencao_hook`, mediana com vs sem o tipo)

A cobertura de retenção é parcial: Sociedade/Geo quase não tem dado, e o IG do Rodrigo Waughan foi excluído porque está em escala errada. Entram só células com ≥15 vídeos com retenção.

| nicho | tipo | retenção com (n) | sem | leitura |
|---|---|---|---|---|
| IA/Tec | acabou_de | **71,5** (54) | 63 | segura mais E acerta mais |
| IA/Tec | conflito | 69 (60) | 63 | idem |
| IA/Tec | pais_regiao | 70 (47) | 63 | idem |
| IA/Tec | abre_nome | 69 (89) | 63 | idem |
| IA/Tec | abre_esse | 63 (57) | 64 | não segura, e acerta menos |
| IA/Tec | pergunta | 61 (36) | 64 | não segura, e acerta menos |
| Finanças | abre_nome | 68 (61) | 63 | segura mais |
| Finanças | conflito | 68 (29) | 64 | segura mais |
| Finanças | primeira_pessoa | 59 (20) | 64 | perde gente logo no início |
| Ciência | conflito | 71 (25) | 67 | segura mais |
| Ciência | pais_regiao | 69,5 (84) | 67 | leve ganho |
| Case | pais_regiao | 69 (37) | 65 | segura mais |
| Empreend. | **pergunta** | **64** (16) | 57 | **segura mais, mas acerta menos** (0,63): prende quem já é seguidor e não distribui |
| Empreend. | abre_esse | 53 (49) | 58 | retém menos, mas acerta mais (1,65): a retenção não explica o acerto aqui |

---

## 2. Tipo de hook × cliente (Instagram, clientes com ≥60 vídeos)

Aqui o lift é calculado dentro do próprio cliente, só com tipos que têm ≥10 vídeos. Para cada cliente aparecem o melhor e o pior tipo, um exemplo vencedor (maior coeficiente viral dentro do melhor tipo) e um perdedor (menor coeficiente dentro do pior tipo).

| cliente (taxa base) | melhor tipo (n, taxa, lift) | exemplo vencedor | pior tipo (n, taxa, lift) | exemplo perdedor |
|---|---|---|---|---|
| **Izabela Anholett** (30%) | pais_regiao (40, 55%, 2,10). Também: acabou_de 1,97 e conflito 1,69 | "A contagem regressiva começou. A China vai implementar no Brasil os pagamentos com a palma da mão, ainda esse ano." 3,5M https://www.instagram.com/reel/DZcVckKByOp | primeira_pessoa (32, 16%, 0,48) | "Se eu pudesse te dar um único alerta sobre IA, depois de mais de 15 anos trabalhando com tecnologia…" 24k, coef 0,32 https://www.instagram.com/reel/DdMCzUuh_UO |
| **Lincoln Fracari** (23%) | pais_regiao (227, 31%, 1,71) | "A China tá silenciosamente construindo um império no Nordeste brasileiro…" 3,4M, coef 450 https://www.instagram.com/reel/DVt98MUka1u | conflito (25, 16%, 0,67) | "A China humilhou o mundo todo com um caminhão…" 11k, coef 0,51 https://www.instagram.com/reel/Dczck8Sv8DC |
| **Fernando Pereira** (10%) | acabou_de (18, 39%, 4,67). Conflito 3,29 | "O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar." 3,2M, coef 544 https://www.instagram.com/reel/DVbunyzDvij | primeira_pessoa (55, 4%, 0,30) | "2026 chegou e minha missão nesse vídeo é te convencer a não cometer o erro de 2025…" 1,3k https://www.instagram.com/reel/DTdAbntDg7u |
| **Marcelo Germano** (15%) | abre_esse (80, 34%, 3,09) | "Essa fábrica de balas tem o melhor chocolate do Brasil…" 2,5M, coef 138 https://www.instagram.com/reel/DVmZmdRDn7q | abre_voce (19, 0%, 0,00) | "Você combina 10 coisas por dia na sua empresa e anota zero." 3,2k https://www.instagram.com/reel/DYVdB-Nha7Q |
| **Marcos Pelozato** (18%) | pais_regiao (110, 24%, 1,43) | "Ela era a dançarina mais desejada do Brasil. Ele, um cantor no começo… Xanddy e Carla Perez seguem juntos…" 4,4M, coef 479 https://www.instagram.com/reel/DcqJw8tOFPK | abre_voce (41, 5%, 0,26) | "Você que é empresário me responde uma pergunta agora rápida em três segundos…" 2,5k https://www.instagram.com/reel/DdeQHl_u3Xn |
| **Thiago Franco** (11%) | acabou_de (11, 45%, 4,74). abre_nome 2,56 (n43) | "O Mercado Livre acabou de receber o maior galpão da América Latina…" 259k https://www.instagram.com/reel/DYK0FpWJas6 | primeira_pessoa (74, 1%, 0,11). Também abre_voce 0/10 | "Você aumentou o orçamento do seu mercado ads…" 2,6k https://www.instagram.com/reel/DYNY4qQJFNO |
| **Cadu Neiva** (24%) | ninguem_sabe (14, 57%, 2,50) | "Albert Einstein veio ao Brasil, ignorou presidentes… para almoçar com o médico baiano e provavelmente você nunca ouviu falar dele." 1,1M, coef 28,6 https://www.instagram.com/reel/DZ_SlDPJs9T | pergunta (53, 15%, 0,58) | "que melhoraram algum ponto específico para melhorar?" 119 views https://www.instagram.com/reel/DZm5ZQARzaG |
| **Pedro Elero** (10%) | acabou_de (11, 55%, 8,07). abre_nome 7,23 (n24) | "Essa marca de tênis manda uma faca de verdade dentro da caixa e pede para você destruir o produto que acabou de comprar." 432k, coef 225 https://www.instagram.com/reel/DcBhRCHD9Gk | pergunta (36, 3%, 0,23) | "Porque tanta gente tá falando de um time que nem carne serve?…" 1,2k https://www.instagram.com/reel/DTLE7uVAFB4 |
| **Exame 4º slot** (14%) | pergunta (30, 27%, 5,47) | "Por que a Red Bull tem metade do tamanho do Monster e custa mais caro e mesmo assim vende quase o dobro?" 1,3M, coef 152 https://www.instagram.com/reel/DXKzC4Ah4eU | numero (17, 6%, 0,35) | "A FÓRMULA 1 A RECEITA NÃO PRECISOU CARROS…" 3,5k https://www.instagram.com/reel/DVRpGsJkeXk |
| **Rafael Rodrigues** (23%) | pais_regiao (85, 36%, 1,98). abre_esse 1,81 | "O Elon Musk brasileiro existe e ele mora no interior do Paraná." 849k, coef 157 https://www.instagram.com/reel/DYuweeQpNYN | primeira_pessoa (37, 0%, 0,00). Pergunta 0,15 | "O laboratório de Alagoas está usando moscas pra desenvolver um tratamento contra o Alzheimer. Deixa eu te contar essa história." 2k https://www.instagram.com/reel/Dd9vd2Zv0cG |
| **Marcio Grazino** (30%) | nostalgia (11, 45%, 1,60). abre_esse 1,48 | "Antigamente, você tinha vergonha de usar Olympikus na escola. Hoje em dia, ela humilha a Nike e a Adidas no Brasil." 649k, coef 101 https://www.instagram.com/reel/DWBOY0QjSv4 | pergunta (10, 0%, 0,00). abre_nome 0,35 | "Venezuela, a maior oportunidade ou a maior armadilha…?" 841 https://www.instagram.com/reel/DT3j3U8Ecip |
| **Drielle Castelani** (16%) | pais_regiao (27, 19%, 1,18) | "Uma cirurgia brasileira salvou mais de 8.000 pessoas… é triste o motivo de você nunca ter ouvido falar nela." 129k, coef 50,5 https://www.instagram.com/reel/DajCYYMJpvN | numero (26, 12%, 0,65) | "Olá, você ligou para a Central de Apoio ao Médico Frustrado. Para reclamar do convênio, digite 1…" 1,6k https://www.instagram.com/reel/DV_xthkBoj2 |
| **Leonardo Cirino** (31%) | numero (13, 69%, 2,64). abre_nome 1,90 (n46) | "O HB20 e o Onix serão destruídos por esse novo lançamento da BYD, que faz 71 quilômetros por litro." 4,1M, coef 180 https://www.instagram.com/reel/DdkDHUgBnEm | abre_esse (17, 12%, 0,34) | "Esse novo modo do Spotify é sensacional…" 4,7k https://www.instagram.com/reel/DbwgqcVtkkc |
| **João Felipe Marques** (10%) | conflito (13, 23%, 3,00) | "Essa IA recebeu a ordem explícita de não cometer crimes, mas cometeu. Depois, sentiu remorso e votou pela própria destruição…" 510k, coef 299 https://www.instagram.com/reel/DZPs8ZuBt9M | pais_regiao (16, 0%, 0,00) | "A tecnologia está manipulando o mercado financeiro… previu a crise imobiliária dos Estados Unidos em 2008." 371 https://www.instagram.com/reel/DVMyYqwIOWO |
| **Manoel Victor** (5%) | primeira_pessoa (19, 11%, 2,38) | "Eu com certeza nunca vi algo tão legal aqui em Santa Catarina." 32k, coef 17 https://www.instagram.com/reel/DY7c4_IskJB | conflito (10, 0%, 0,00) | "A maior empresa de beleza do mundo está usando IA pra manipular moléculas… absolutamente assustadores." 648 https://www.instagram.com/reel/DXZQWa2lRf6 |
| **Patrick Diorio** (7%) | pergunta (12, 25%, 5,44) | "Preciso saber programar bem para conseguir a primeira vaga?" 216k, coef 209 https://www.instagram.com/reel/DQMk333kbwg | abre_esse (12, 0%, 0,00) | "Essa ferramenta secreta está roubando dados de milhões de pessoas…" 427 https://www.instagram.com/reel/DbtoUcCh6Cf |
| **Dilson Peres** (27%) | abre_nome (38, 45%, 2,24) | "O Mc Donald's não vende mais sorvete, ele está mentindo para você!" 1,3M, coef 89 https://www.instagram.com/reel/DU6lPDvDf9N | pais_regiao (27, 19%, 0,63) | "As maiores petroleiras presentes no Brasil estão tentando derrubar um tributo…" 8k https://www.instagram.com/reel/DbtvKFrhEWM |
| **Ricardo Schumacher** (11%) | abre_nome (26, 19%, 2,18) | "O Ratinho agora virou paraguaio. Só que tem um detalhe nessa história que pode custar caro…" 216k, coef 88 https://www.instagram.com/reel/DcWWuA5RP53 | primeira_pessoa (11, 0%, 0,00) | "\"Eu prefiro não mexer nisso aí... Vai que a Receita Federal me audita.\"…" 525 https://www.instagram.com/reel/DeSsUltgBcy |
| **Lerry Granville** (16%) | pergunta (52, 21%, 1,55) | "30 mil reais guardado, eles conseguem já entrar nisso aí e começar a arrematar leilão?" 419k https://www.instagram.com/reel/DYXwGCShhwx | primeira_pessoa (64, 9%, 0,42) | "Meu apartamento foi leiloado. Achei injusto. Depois entendi que era justiça." 17k, coef 0,10 https://www.instagram.com/reel/DSF-_EaEQxt |
| **Túlio Lichenstein** (8%) | pergunta (10, 10%, 1,30) | "Milhões de brasileiros finalmente conquistaram acesso à sala VIP do aeroporto. Então, por que, justo agora, os bancos…?" 46k https://www.instagram.com/reel/Ddw7fQshC0r | numero (24, 4%, 0,40) | "Eu estudei as 100 páginas do plano do Caiado para salvar o Brasil…" 525 https://www.instagram.com/reel/Dd9qhzDPFef |
| **Franklin Tomich** (25%) | abre_nome (34, 38%, 1,72). Também abre_voce 1,47 e nostalgia 1,33 | "A Estrela, a Bombril, as Americanas e a Polishop, todas elas pediram recuperação judicial…" 187k, coef 401 https://www.instagram.com/reel/DYvEahZtxVE | primeira_pessoa (18, 11%, 0,42) | "Como Augusto Cury acabou com o dinheiro preso em um banco… e eu vou te explicar o mecanismo…" 12k https://www.instagram.com/reel/DdueY-5hxEV |
| **Renato Mendes** (20%) | acabou_de (15, 53%, 3,47). conflito 2,75 | "A Geely acabou de fazer história. Ela resolveu o maior problema dos carros elétricos." 154k, coef 72 https://www.instagram.com/reel/DczWe-bOaQg | primeira_pessoa (21, 10%, 0,44) | "acho que quando você pensa numa grande corporação, o primeiro aspecto que eu acho…" 1,1k https://www.instagram.com/reel/DdljVgPR1Z0 |
| **Renato Torres** (14%) | primeira_pessoa (20, 20%, 1,51) | "Eu nunca tive que escolher entre meus filhos e meu trabalho…" 77k, coef 19 https://www.instagram.com/reel/Dbb6XglR9NP | abre_nome (16, 6%, 0,40) | "A Meta oficializou o fechamento de toda a estrutura que ela tinha do Metaverso…" 2k https://www.instagram.com/reel/DWHMxB9EdO5 |
| **Rodrigo Waughan** (6%) | primeira_pessoa (52, 10%, 1,97) | "eu não acredito que ninguém pensou nisso antes essa marca de carvão brasileira viralizou lá fora por causa da sua embalagem" 530k, coef 175 https://www.instagram.com/reel/DVlNhOaCB6m | jornada (13, 0%). abre_nome 0/34, abre_voce 0/21 | "A Havan fatura hoje 18 bilhões de reais fazendo o oposto da concorrência…" 1,5k https://www.instagram.com/reel/DW3nD5SiDcG |
| **João Paulo Albuquerque** (14%) | abre_esse (19, 11%, 0,72). Nenhum tipo passou de 1 | "Esse país nunca plantou um único pé de café na vida, mas achou um jeito de fazer você pagar cinco vezes mais…" 77k, coef 33 https://www.instagram.com/reel/DdTx4BQAXzk | numero (32, 3%, 0,15) | "Duas irmãs vendendo pretzels criaram um império de 1,3 bilhão de reais." 1,8k https://www.instagram.com/reel/DP7HczFkX48 |
| **Café com Ferri** (25%) | pergunta (70, 24%, 0,95). Nenhum tipo passou de 1 | "a única maneira de mudar de vida é mudando de ambiente?…" 4,6M, coef 88 https://www.instagram.com/reel/DYSIvUclThT | abre_nome (10, 10%, 0,39) | "O Véio da Havan transformou uma loja de tecidos em um império de mais de R$ 200 bilhões…" 20k https://www.instagram.com/reel/DbHA9bYprjy |

### Assinaturas (estilo que só funciona num canal específico)

1. **"Guerra/humilha": funciona na Izabela e falha no Lincoln.** Taxa de acerto com guerra/humilh vs. sem, no IG:
   - Izabela 43% vs 29% (n=21)
   - Fernando Pereira 28% vs 9% (n=25)
   - Renato Mendes 60% vs 16% (n=10), Marcio Grazino 60% vs 28% (n=10), Leonardo Cirino 50% vs 29% (n=10)
   - **Lincoln Fracari: 7% vs 24% (n=14)**
   - Marcos Pelozato 0% vs 18% (n=5), Rodrigo Waughan 0% vs 6% (n=6)

   Para a Izabela, "guerra" vira metáfora de briga entre gigantes de tecnologia: "A Apple acabou de declarar guerra ao Mark Zuckerberg…" (1,8M) https://www.instagram.com/reel/DYjr8VwBC53 ; "O dono do Instagram acabou de declarar guerra à Apple…" (3,2M) https://www.instagram.com/reel/Dd4cgRKzhhw. No canal do Lincoln, que já é de geopolítica, a mesma palavra soa como exagero: "A China humilhou o mundo todo com um caminhão…" (11k, coef 0,51).
2. **"Você" só funciona no Franklin Tomich** (lift 1,47, n=23), que fala com o dono de empresa que pensa em vender o negócio. Em Marcos Pelozato (0,26), Marcelo Germano (0/19) e Thiago Franco (0/10), o "Você" soa como anúncio ou aula.
3. **Nostalgia de marca ("Você se lembra… sumiu") é do Franklin e do Grazino.** Exemplos: "Você se lembra do Ping Pong? O chiclete que fazia bola com figurinha dentro, simplesmente sumiu…" (1,2M) https://www.instagram.com/reel/DaY1yoxuPZ8 ; "Se você se lembra da Colinus… o culpado disso foi o governo." (399k) https://www.instagram.com/reel/DZGckVRO-lq
4. **Primeira pessoa só funciona com apresentador-personagem:** Rodrigo Waughan 1,97, Manoel Victor 2,38, Renato Torres 1,51. Nos três canais a taxa-base é baixa (5% a 14%) e o n é pequeno. Nos outros 15 clientes com dado, a primeira pessoa fica abaixo de 1.
5. **Pergunta de "mistério de marca" funciona na Exame** (5,47, n=30: "Por que a Red Bull…?"). No Lerry (1,55) a pergunta repete a dúvida real do público ("30 mil reais… dá para arrematar leilão?"). Fora desses formatos a pergunta fica abaixo de 0,9 em 11 dos 20 clientes.
6. **"Esse/Essa + objeto surpreendente" é do Marcelo Germano** (3,09, n=80) e do Rafael Rodrigues (1,81). Nos canais de IA a mesma abertura soa como review de ferramenta e falha: Cirino 0,34, Izabela 0,59, Patrick 0/12.
7. **Café com Ferri e João Paulo Albuquerque não têm nenhum tipo com lift acima de 1.** No Café com Ferri (cortes de podcast) quem faz o acerto é o tema e a fala espontânea, e o texto do hook explica pouco.

---

## 3. Universais vs. específicos (contagem de clientes)

São 26 clientes IG com ≥60 vídeos, e cada tipo só conta para o cliente se ele tem ≥10 vídeos com o tipo. Lift >1,1 conta como "funciona", <0,9 como "falha".

| tipo | clientes avaliados | funciona | neutro | falha | lift mediano | taxa geral com vs sem | veredito |
|---|---|---|---|---|---|---|---|
| acabou_de | 9 | 6 | 1 | 2 | **1,97** | 34,0% vs 16,9% | **Universal** (6/6 nichos no IG e no TT; 5/5 com volume no YT) |
| conflito | 14 | 9 | 1 | 4 | 1,53 | 27,9% vs 17,2% | Quase universal. Exceção: Lincoln/Sociedade no IG |
| pais_regiao | 23 | 16 | 1 | 6 | 1,43 | 24,9% vs 15,8% | **Universal** (positivo em 6/6 nichos no IG e no YT) |
| abre_nome | 21 | 15 | 1 | 5 | 1,40 | 25,3% vs 16,7% | Quase universal. Fraco em Ciência e em canais de opinião (Café com Ferri, Renato Torres) |
| ninguem_sabe | 9 | 6 | 2 | 1 | 1,36 | 26,2% vs 17,5% | Positivo, mas forte só em Empreend. e Finanças |
| nostalgia | 3 | 2 | 0 | 1 | 1,33 | 23,4% vs 17,7% | Específico (Case e Ciência; falha em Empreend., e no TikTok em geral) |
| abre_esse | 19 | 9 | 3 | 7 | 1,03 | 22,5% vs 17,2% | **Depende do nicho** (bom em Ciência e Empreend., ruim em IA) |
| numero | 26 | 12 | 5 | 9 | 1,03 | 19,6% vs 17,1% | Neutro. O número sozinho não decide nada |
| jornada | 5 | 2 | 0 | 3 | 0,75 | 13,9% vs 17,9% | Específico e instável |
| pergunta | 20 | 6 | 3 | 11 | **0,67** | 15,0% vs 18,5% | Ruim por padrão; funciona só em formatos específicos |
| primeira_pessoa | 18 | 3 | 0 | **15** | **0,50** | 12,0% vs 19,0% | **Universal negativo** (TT 0,60, YT 0,76) |
| abre_voce | 6 | 2 | 0 | 4 | 0,13 | 15,9% vs 17,9% | Específico (Case e Sociedade sim, Empreend. não) |

**Lift ajustado por plataforma** (todos os nichos juntos):

| tipo | IG (nichos com lift >1) | TikTok | YouTube |
|---|---|---|---|
| acabou_de | 6/6 | 1,81 | 1,27 |
| pais_regiao | 6/6 | 1,37 | 1,32 |
| abre_nome | 5/6 | 1,43 | 1,41 |
| conflito | 5/6 | 1,65 | 1,40 |
| ninguem_sabe | 6/6 (fraco) | 1,03 | 1,49 |
| pergunta | 3/6 | 0,95 | 0,89 |
| primeira_pessoa | 1/6 | 0,60 | 0,76 |
| abre_voce | 3/6 | 0,41 | 0,59 |
| jornada | 1/2 | 0,63 | 0,33 |

### Cruzamento com o playbook (`playbook_class`, 80% dos hooks IG classificados: 4.863 de 6.062)

Lift ajustado por cliente das categorias oficiais (n≥15):

| categoria playbook | IA | Fin | Soc | Ciência | Case | Empreend. | total |
|---|---|---|---|---|---|---|---|
| Esse Cara | 1,03 | 1,70 | 1,52 | 1,57 | 0,93 | 1,63 | **1,43** |
| Elemento Controverso | 0,81 | 1,39 | 1,51 | 1,71 | 1,66 | 1,51 | **1,43** |
| Conflito Declarado | 1,53 | 2,09 | **0,71** | – | 1,15 | 1,81 | 1,43 |
| Urgência | 1,24 | **0,66** | 0,96 | – | – | **2,35** | 1,36 |
| Contraste Extremo | 1,32 | 0,91 | 1,11 | 1,22 | 0,91 | 1,52 | 1,24 |
| Revelação Secreta | 1,09 | **0,61** | 1,16 | **0,54** | 0,97 | 1,40 | 0,99 |
| Superlativo | 1,28 | **0,40** | 1,12 | 0,98 | 1,05 | 1,36 | 1,10 |
| Ultra Especificidade | 1,03 | 1,44 | 1,27 | 0,63 | 0,83 | 1,35 | 1,14 |
| Viés de Negatividade | 0,80 | 0,75 | 0,71 | **0,39** | 0,74 | 1,24 | 0,87 |
| Pergunta Direta | 0,65 | 0,00 | 1,16 | – | 1,01 | 0,50 | 0,72 |
| Apelo à Autoridade | 0,60 | 0,53 | 1,16 | 1,38 | – | 0,67 | 0,85 |

O playbook confirma o que a regex mostrou: "Conflito Declarado" falha só em Sociedade/Geo. Ele também acrescenta três leituras. Em Finanças, Superlativo (0,40), Revelação Secreta (0,61) e Urgência (0,66) falham, porque o público de dinheiro desconfia de promessa. Em Ciência, Viés de Negatividade (0,39) e Revelação Secreta (0,54) falham, porque a audiência quer a descoberta e não o medo. Empreendedorismo é o nicho que mais aceita gatilho emocional: Urgência 2,35 e Viés de Negatividade 1,24.

---

## 4. Interpretação (por que faz sentido, com cuidado)

**O que o hook precisa resolver em 1 segundo é diferente em cada nicho.**

- **IA/Tecnologia** é um nicho de *novidade*. O público quer saber o que mudou hoje e quem brigou com quem. Por isso "acabou de", "A Apple / A Samsung…" e "guerra entre gigantes" puxam retenção (69 a 71,5 contra 63) e acerto. "Esse novo recurso…" soa como review de ferramenta, coisa que o feed tem de sobra, e a pergunta soa como aula.
- **Finanças/Impostos** depende de *autoridade + fato externo*. Um nome conhecido (McDonald's, Ratinho) ou uma notícia de choque (Irã, Trump) dá ao especialista um gancho que não é ele mesmo. A primeira pessoa ("Meu apartamento…", "minha missão nesse vídeo…") e as promessas (superlativo, segredo) disparam o alarme de "vendedor de curso". Esse público é cético.
- **Sociedade/Geopolítica** é um nicho de *opinião e identidade*. O "Você acha que…" convida o espectador a se posicionar, e por isso funciona aqui. Como conflito já é o tema-base do canal, a palavra "humilhou/guerra" deixa de diferenciar e parece exagero (no IG; no TT e no YT isso não se repete, então é mais assinatura do Lincoln no IG do que regra do nicho).
- **Ciência/Inovação BR** vive do *objeto surpreendente*. "Esse taxista…", "Esse equipamento…" e "O Elon Musk brasileiro…" mostram a coisa. A pergunta (4% contra 26%) e a primeira pessoa ("Deixa eu te contar essa história") adiam a revelação. Os perdedores costumam ser vídeos de bastidor ou palestra ("Na última quarta-feira, eu participei de um painel…"), então parte do efeito vem do **formato do vídeo**, e não só da frase.
- **Case/História de empresa** é um nicho de *memória e de falar com o dono do negócio*. Funcionam a nostalgia de marca ("Você se lembra do Ping Pong?") e o "Você é dono de empresa…". O "fatura 18 bilhões / virou império" já virou clichê do nicho: todo canal de case usa, e o número grande deixou de surpreender (3% contra 15% no IG).
- **Empreendedorismo/Marketing** é um nicho de *personagem + resultado*. Funcionam "Esse empresário…", "Essa estratégia…" e "quase ninguém sacou". O "Você + sua empresa" (5% contra 16%) soa como anúncio de mentoria, que é exatamente o que esse público aprendeu a pular.

**Cuidados para dizer em aula:**
- Isto é correlação e não causa. O tipo de hook anda junto com o tema, o formato (corte de podcast vs. notícia narrada) e a fase do canal. O lift ajustado por cliente tira o efeito "cliente bom usa mais X", mas não tira o efeito do tema.
- Os tipos se sobrepõem (vários hooks são "acabou de" + conflito + nome ao mesmo tempo) e a regex é aproximada. "Jornada", em especial, tem resultado instável entre plataformas.
- Muitas células têm n entre 15 e 30, e lifts acima de 4 com n de 10 a 20 (Pedro Elero, Patrick Diorio, Fernando "acabou de") são indício, não lei. As interações mais sólidas são as que se repetem em 2 ou mais plataformas: **"Você" (Case sim, Empreend. não), "Esse/Essa" (IA não, Ciência e Empreend. sim) e pergunta (Ciência não).**
- A retenção do hook cobre só parte dos vídeos. Sociedade praticamente não tem dado, e o IG do Rodrigo Waughan foi excluído (escala errada).

---

## 5. Tabela-guia: "Para o nicho X, priorize A e B, evite C" (Instagram)

| nicho | priorize | evite | exemplo para copiar | exemplo do que não fazer |
|---|---|---|---|---|
| **IA/Tecnologia** | **"acabou de"** (1,56; TT 2,01) + **marca no início / briga de gigantes** (abre_nome 1,60; conflito 1,63; país 1,57) | "Esse/Essa novo recurso…" (0,55; TT 0,29), pergunta (0,74), primeira pessoa (0,70) | Izabela Anholett: "A Apple acabou de declarar guerra ao Mark Zuckerberg E o seu próximo iPhone não vai estar no seu bolso Mas sim no seu rosto" (1,8M) https://www.instagram.com/reel/DYjr8VwBC53 · Izabela: "A Samsung lançou um par de óculos que é o começo do fim da era do celular." (9,4M) https://www.instagram.com/reel/DbvGvW2hRek | Leonardo Cirino: "Esse novo modo do Spotify é sensacional…" (4,7k) https://www.instagram.com/reel/DbwgqcVtkkc |
| **Finanças/Impostos** | **notícia de choque** (acabou_de 2,72; conflito 2,49) + **nome famoso** (1,89) + "quase ninguém percebeu" (1,43) | primeira pessoa (0,36), superlativo/segredo/urgência no playbook (0,40 a 0,66) | Fernando Pereira: "O mundo tem exatamente 40 dias até o petróleo acabar. E a culpa é de um pedaço de mar que o Irã acabou de sequestrar." (3,2M) https://www.instagram.com/reel/DVbunyzDvij · Dilson Peres: "O Mc Donald's não vende mais sorvete, ele está mentindo para você!" (1,3M) https://www.instagram.com/reel/DU6lPDvDf9N | Lerry Granville: "Meu apartamento foi leiloado. Achei injusto…" (coef 0,10) https://www.instagram.com/reel/DSF-_EaEQxt |
| **Sociedade/Política/Geo** | **país/região** (1,35; Lincoln 1,71) + **"acabou de"** (1,60) + **"Você acha que…"** (1,43) | "humilhou / guerra" no IG (0,87; Lincoln 7% contra 24%), primeira pessoa (0,78) | Lincoln Fracari: "A China tá silenciosamente construindo um império no Nordeste brasileiro…" (3,4M) https://www.instagram.com/reel/DVt98MUka1u · Lincoln: "O Neymar acabou de aceitar uma proposta de uma máquina infinita de dinheiro, a China…" (1,2M) https://www.instagram.com/reel/DWFP4uYRPbD | Lincoln: "A China humilhou o mundo todo com um caminhão…" (11k) https://www.instagram.com/reel/Dczck8Sv8DC |
| **Ciência/Inovação BR/Saúde** | **"Esse/Essa + objeto"** (1,53) + **conflito com marca** (1,77) + **Brasil/região** (1,30) + nostalgia (1,32) | **pergunta** (0,16; TT 0,35), primeira pessoa (0,27), "Você…" (0,42), viés de negatividade (0,39) | Leonardo Nogueira: "Esse taxista rodou tanto com seu Toyota que ele simplesmente travou o software da fábrica." (6,2M) https://www.instagram.com/reel/DYo3ldvOFHW · Marcio Grazino: "Antigamente, você tinha vergonha de usar Olympikus na escola. Hoje em dia, ela humilha a Nike e a Adidas no Brasil." (649k) https://www.instagram.com/reel/DWBOY0QjSv4 | Rafael Rodrigues: "O laboratório de Alagoas está usando moscas… Deixa eu te contar essa história." (2k) https://www.instagram.com/reel/Dd9vd2Zv0cG |
| **Case/História de empresa** | **"acabou de"** (2,40) + **nostalgia de marca** (1,21; raw 27,6% vs 13,9%) + **"Você é dono de…"** (1,22; TT 2,19) + país (1,33) | **"fatura N bilhões / virou império"** (0,25; YT 0,00), número solto (0,89; YT 0,60) | Franklin Tomich: "Você se lembra do Ping Pong? O chiclete que fazia bola com figurinha dentro, simplesmente sumiu…" (1,2M) https://www.instagram.com/reel/DaY1yoxuPZ8 · Franklin: "Você é dono de empresa e um dia pretende vender o seu negócio?…" (coef 729) https://www.instagram.com/reel/DW4XTgRDt0a | Rodrigo Waughan: "A Havan fatura hoje 18 bilhões de reais…" (1,5k) https://www.instagram.com/reel/DW3nD5SiDcG · João Paulo: "Duas irmãs vendendo pretzels criaram um império de 1,3 bilhão de reais." (1,8k) https://www.instagram.com/reel/DP7HczFkX48 |
| **Empreendedorismo/Marketing** | **"acabou de"** (2,11) + **"Esse/Essa + personagem"** (1,65) + **"quase ninguém sacou"** (1,80) + marca no início (1,65) | **"Você + sua empresa"** (0,32; TT 0,00; YT 0,20), pergunta (0,63), primeira pessoa (0,63) | Cadu Neiva: "essa estratégia assustadora fez esse empresário multiplicar 10x sua fortuna." (2,5M, coef 740) https://www.instagram.com/reel/DWuSVeFEdwk · Marcelo Germano: "Essa fábrica de balas tem o melhor chocolate do Brasil…" (2,5M) https://www.instagram.com/reel/DVmZmdRDn7q · Exame: "Por que restaurante chiques com valor exorbitante no cardápio e quase ninguém pede…" (763k) https://www.instagram.com/reel/DUEnzsykS12 | Marcos Pelozato: "Você que é empresário me responde uma pergunta agora rápida em três segundos…" (2,5k) https://www.instagram.com/reel/DdeQHl_u3Xn · Thiago Franco: "Você aumentou o orçamento do seu mercado ads…" (2,6k) https://www.instagram.com/reel/DYNY4qQJFNO |

**Regra de bolso para a aula:** comece com o que mudou no mundo (acabou de / marca / país), e não com você ("eu") nem com o espectador ("você"). A exceção, com "Você", é quando o público-alvo é exatamente quem está assistindo: Franklin falando com o dono que quer vender a empresa, Lincoln perguntando a opinião.
