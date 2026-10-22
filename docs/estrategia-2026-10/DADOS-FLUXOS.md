# Dados por fluxo de uso do Codex (22/10/2026)

Só leitura. SELECT no banco principal (`qclvrddrqulgfzccndnl`) e no CRM, cálculo local em node, nada gravado, nenhuma chamada de LLM. Reaproveita o casamento Codex → CRM → vídeo de 20/10 (`docs/ligacao-roteiro-video/INVESTIGACAO.md`, limiar 0,08, 56 roteiros casados, 42 postados). Scripts e saídas: `/private/tmp/claude-501/-Users-igorbevilaqua-Projetos-Codex/780c57e9-7704-49dc-8d41-54e0babe5422/scratchpad/fluxos/` (`pull.mjs` puxa, `analyze.mjs` e `extra.mjs` calculam, `out.json` guarda tudo).

**Janela:** todas as 273 sessões de `vm_sessions` (a primeira é de 07/07, então os 120 dias cobrem tudo). O funil usa as sessões até 20/10, quando o casamento rodou, e uma versão "madura" só com as sessões até 20/09.

## Como o fluxo de cada sessão foi definido

Não existe coluna "modo" na sessão. O fluxo sai de `vm_attachments`, porque `kind`, `is_modelagem` e `modo` (migration 0034) dizem o que entrou na sessão. A coluna `vm_sessions.skill` (0052) ainda não existe em produção, e `vm_generated_scripts.crm_script_id` (0055) também não.

| fluxo | regra (na ordem) | sessões | subtipos |
|---|---|---|---|
| carrossel | algum anexo `carousel_link` | 15 (5%) | 9 com o carrossel como modelagem |
| replicar | anexo `is_modelagem` com `modo='replicar'` | 33 (12%) | 17 de vídeo, 16 de texto |
| modelar_video | anexo `video_link` com `is_modelagem` (modo nulo = modelar) | 56 (21%) | 54 só o vídeo, 2 com notícia |
| modelar_texto | anexo `reference_script` com `is_modelagem` (inclui "usar este roteiro como modelo", `lib/actions.ts:74`) | 29 (11%) | 24 só o roteiro, 5 com notícia |
| fontes | tem anexo, nenhum marcado como modelagem | 55 (20%) | 34 notícia, 11 roteiro de referência, 10 vídeo ou mistura |
| livre | nenhum anexo, só o prompt | 85 (31%) | — |

**Papel:** vem de `hub.permissoes`. São 6 contas: 2 "adm/supervisor" (`writer:adm`), 2 "estrategista" (`painel:estrategista`), 1 "roteirista" e 1 só com Oráculo, além de 9 sessões de julho sem `user_id`. Os nomes ficaram anonimizados como U1 a U7.

## 1. Volume

### Por usuário

| usuário | papel | total | livre | fontes | modelar_video | modelar_texto | replicar | carrossel |
|---|---|---|---|---|---|---|---|---|
| U3 | adm/supervisor | 83 | 31 | 13 | 19 | 1 | 16 | 3 |
| U1 | estrategista | 80 | 13 | 28 | 1 | 23 | 12 | 3 |
| U5 | adm/supervisor | 68 | 31 | 4 | 25 | 3 | 4 | 1 |
| U2 | estrategista | 26 | 0 | 8 | 10 | 1 | 1 | 6 |
| U4 | sem usuário | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| U6 | roteirista | 6 | 0 | 2 | 1 | 1 | 0 | 2 |
| U7 | só Oráculo | 1 | 1 | 0 | 0 | 0 | 0 | 0 |

- Os 2 adm geram 55% das sessões, e quase todo o "livre" e o "modelar_video" sai deles.
- O estrategista U1 é praticamente o único usuário de modelar_texto (23 de 29) e o maior usuário de fontes.
- O único roteirista abriu 6 sessões em 4 meses.
- **73 sessões (27%) não têm cliente**, e 71 delas são dos adm. Isso inclui 29 das 56 de modelar_video. Parte é teste, mas parte vira vídeo: 10 dos publicados não tinham `client_id`.

### Por cliente (com cliente)

| cliente | total | livre | fontes | modelar_video | modelar_texto | replicar | carrossel |
|---|---|---|---|---|---|---|---|
| Fernando Pereira | 33 | 14 | 10 | 3 | 4 | 2 | 0 |
| Túlio Lichenstein | 31 | 10 | 6 | 1 | 7 | 5 | 2 |
| Franklin Tomich | 28 | 5 | 11 | 0 | 3 | 6 | 3 |
| Renato Mendes | 19 | 2 | 0 | 9 | 0 | 6 | 2 |
| Ricardo Schumacher | 15 | 4 | 4 | 0 | 5 | 2 | 0 |
| Lincoln Fracari / Marcos Pelozato | 10 cada | | | | | | |
| outros 18 clientes | 1 a 7 cada | | | | | | |

Izabela Anholett, a cliente em que a modelagem da casa mais rende, tem 6 sessões, e nenhuma delas é de modelagem.

### Tendência

| mês | sessões | livre | fontes | modelar_video | modelar_texto | replicar | carrossel |
|---|---|---|---|---|---|---|---|
| jul | 22 | 73% | 9% | 18% | 0% | 0% | 0% |
| ago | 106 | 18% | 30% | 26% | 12% | 8% | 6% |
| set | 76 | 26% | 18% | 9% | 16% | 18% | 12% |
| out (até 22) | 69 | 43% | 10% | 25% | 6% | 16% | 0% |

Por semana (de 06/07 a 19/10): 8, 2, 2, 12, 12, 11, **38, 40, 34, 27**, **1** (semana de 14/09), 13, 9, 13, **40** (semana de 12/10, com 22 livres), 11. O pico de uso foi do fim de agosto ao começo de setembro. A semana de 14/09 praticamente zerou. Em outubro o volume voltou, puxado pelo livre e pelos adm.

## 2. Funil por fluxo

O funil vai de sessão a roteiro gerado, depois a roteiro no CRM (casado por 5-gramas, ≥0,08) e por fim a vídeo publicado (`posted_at` no CRM ou vídeo com `crm_script_id`).

### Maduro: sessões até 20/09

| fluxo | sessões | com roteiro | no CRM | vídeo | roteiro/sessão | CRM/roteiro | **vídeo/roteiro** |
|---|---|---|---|---|---|---|---|
| livre | 50 | 45 | 8 | 6 | 90% | 18% | **13%** |
| fontes | 45 | 41 | 16 | 12 | 91% | 39% | **29%** |
| modelar_video | 38 | 22 | 10 | 9 | **58%** | 45% | **41%** |
| modelar_texto | 19 | 17 | 7 | 5 | 89% | 41% | 29% |
| replicar | 21 | 19 | 5 | 3 | 90% | 26% | 16% |
| carrossel | 14 | 8 | 2 | 2 | 57% | 25% | 25% |
| **total** | 187 | 152 | 48 | 37 | 81% | 32% | 24% |

Só sessões com cliente, até 20/09, vídeo/roteiro: livre 18% (6/34), fontes 28% (11/39), **modelar_video 50% (7/14)**, modelar_texto 31% (5/16), replicar 18% (3/17), carrossel 14% (1/7).

Com todas as sessões até 20/10 (inclui as que ainda podem ser gravadas), vídeo/roteiro fica assim: livre 9%, fontes 28%, modelar_video 27%, modelar_texto 25%, replicar 13%, carrossel 22%. O total é 19%.

- **modelar_video é o fluxo que mais converte depois que o roteiro sai, e o que mais quebra antes.** 17 das 56 sessões não geraram roteiro. Das 17, cerca de 10 falharam na transcrição do vídeo: crédito do provedor acabou (2), resposta HTML (2), vídeo "longo demais" com 136 e 155 s, link não reconhecido, Supadata vazio. Outras 4 pararam esperando a confirmação da premissa e 2 não conseguiram extrair a tese.
- **Livre gera muito e converte pouco** (13%). Quase tudo vem dos adm (34 de 50 até 20/09), muitos sem cliente.
- **Por papel** (até 20/09): adm 29% vídeo/roteiro (24/82), estrategista 17% (10/58), roteirista 3/4.
- Quase todas as sessões ficam numa única versão de roteiro: mediana 1, média de 1,07 (replicar) a 1,44 (carrossel).

## 3. Resultado dos que viraram vídeo

A base é `oraculo.fato_video`, só vídeos maduros. O grupo humano de cada vídeo do Codex são os vídeos com `vm_script='sim'`, do mesmo cliente e da mesma rede, publicados até 30 dias antes ou depois, cujo roteiro do CRM **não** casou com o Codex (mínimo de 3; todos os 103 tiveram). "Acerto" é o `classificacao='acerto'` oficial (coeficiente acima de 3 e pelo menos 10 mil views). "Viral+" é alcance viral ou ultraviral.

| fluxo | vídeos | roteiros | coef mediano | coef ≥1,5 | acerto | viral+ | coef humano pareado | vídeos acima do humano | razão mediana | acerto humano | viral+ humano |
|---|---|---|---|---|---|---|---|---|---|---|---|
| livre | 22 | 7 | 2,23 | 64% | 32% | 23% | 1,35 | 77% | 1,61 | 22% | 11% |
| fontes | 34 | 14 | 1,40 | 47% | 32% | 15% | 1,11 | 59% | 1,29 | 13% | 5% |
| modelar_video | 22 | 8 | 1,59 | 55% | 36% | 27% | 1,21 | 73% | 1,58 | 15% | 6% |
| modelar_texto | 15 | 6 | **0,85** | 27% | **7%** | 7% | 1,06 | **33%** | **0,84** | 16% | 7% |
| replicar | 8 | 3 | 1,96 | 50% | 25% | 13% | 1,22 | 63% | 1,32 | 15% | 7% |
| carrossel | 2 | 1 | 5,13 | 50% | 50% | 50% | 0,88 | 50% | 8,05 | 9% | 3% |
| **total** | 103 | 39 | 1,49 | 50% | 29% | 18% | 1,17 | 62% | 1,36 | 16% | 7% |

Na unidade roteiro (o coeficiente mediano do roteiro contra a mediana humana pareada), o Codex fica acima em: livre 5/7, fontes 8/14, modelar_video 6/8, modelar_texto 3/6, replicar 3/3, carrossel 1/1. No total, **26 de 39**, com teste do sinal p ≈ 0,05 bilateral.

Agrupando, quem partiu de referência (vídeo, texto ou replicar; 17 roteiros) tem coeficiente 1,35 e 24% de acerto. Quem partiu sem referência (22 roteiros) tem 1,59 e 33%. A diferença é toda do modelar_texto.

**Leitura honesta:**
- O n é de 3 a 14 roteiros por fluxo, e um único roteiro move a mediana (ROT-2853 com coeficiente 200, ROT-3065 com 35).
- Há viés de seleção: só vira vídeo o que o time escolheu.
- O único fluxo com sinal consistente para baixo é o modelar_texto: 5 dos 6 roteiros são de clientes em que a casa também vai mal (Túlio, JPA, Rafael, Lincoln), e quase todos saem do mesmo estrategista. Não dá para separar fluxo, usuário e cliente.

## 4. Modelagem: de onde vem a referência

| fluxo | referências com URL | da casa | da casa, mesmo cliente | externas (IG / TT / YT) | sem id reconhecível |
|---|---|---|---|---|---|
| modelar_video | 54 | 4 | 0 | 46 (43 / 3 / 0) | 4 |
| replicar | 17 | 0 | 0 | 16 (15 / 1 / 0) | 1 |
| carrossel | 9 | 0 | 0 | 9 (9 / 0 / 0) | 0 |

Usei a mesma regra de `lookupCorpus()` (`lib/pipeline/modelagem.ts:230`): o id da plataforma em `videos.link_video` ou em `plataform_id`.

- **95% das referências são reels externos do Instagram. Para essas, o banco não tem nenhuma métrica:** o Codex não guarda views nem coeficiente do vídeo de referência. Por isso a pergunta "o modelado performou perto da referência?" **não tem resposta para 46 de 54 casos.**
- As 4 referências da casa são todas de outro cliente: coeficiente mediano 2,78, 536 mil views. Dois desses roteiros foram publicados. Um ficou muito acima da referência: Patrick, referência com coeficiente 6,5 e resultado 200. O outro ficou muito abaixo: referência 2,8, resultado 1,06 com 2,3 mil views.
- Dos 9 roteiros modelados publicados, o CRM cita a mesma URL de referência em "Modelagem:" em 3. Nos outros, o time trocou ou omitiu a fonte.

## 5. Quanto o time reescreve

Foram usados os 56 casados. "Codex→CRM" é a fração dos 5-gramas do Codex que sobrevivem no texto do CRM. "CRM vindo do Codex" é a fração do texto publicado que veio do Codex. O hook é a fração dos 3-gramas do hook do Codex presentes nas primeiras ~60 palavras do CRM: ≥0,6 conta como mantido, de 0,2 a 0,6 como ajustado, abaixo de 0,2 como trocado.

| fluxo | n | Codex→CRM mediano | CRM vindo do Codex | quase igual (≥0,5) | reescrita média (0,15–0,5) | matéria-prima (<0,15) | hook mantido / ajustado / trocado |
|---|---|---|---|---|---|---|---|
| livre | 10 | 0,73 | 0,70 | 7 | 2 | 1 | 6 / 0 / 4 |
| fontes | 18 | 0,42 | 0,41 | 8 | 6 | 4 | 5 / 5 / 8 |
| modelar_video | 10 | **0,85** | 0,81 | 8 | 2 | 0 | **8** / 0 / 2 |
| modelar_texto | 9 | **0,40** | 0,36 | 2 | 6 | 1 | 2 / 4 / 3 |
| replicar | 6 | 0,67 | 0,62 | 3 | 2 | 1 | 3 / 1 / 2 |
| carrossel | 3 | 0,72 | 0,70 | 2 | 1 | 0 | 1 / 0 / 2 |
| **total** | 56 | 0,55 | 0,51 | 30 | 19 | 7 | 25 / 10 / 21 |

- O texto publicado é cerca de 7% mais longo que o do Codex (mediana de 424 contra 396 palavras).
- O que foi publicado foi menos mexido do que o que ficou parado no CRM: 0,72 contra 0,36.
- Resultado dos publicados por grau de reescrita:

| grau de reescrita | roteiros | coef mediano | acerto | acima do humano |
|---|---|---|---|---|
| quase igual | 25 | 1,66 | 38% | 68% |
| reescrita média | 12 | 1,30 | 19% | 54% |
| matéria-prima | 5 | 1,07 | 12% | 53% |

- Por hook: mantido tem coeficiente 1,60 e 35% de acerto (20 roteiros); trocado, 1,32 e 20% (17).
- Isso não prova que mexer piora. O time mexe mais justamente no roteiro mais fraco.

## 6. Custo por sessão

A fonte é `vm_generated_scripts.pipeline_trace.usage`, somado em todas as versões da sessão, com preço de `PRECO_POR_MTOK` (`lib/llm-catalogo.ts:191`). O Grok entra pelo `usd` que a xAI devolve. `api_usage` é do coletor e não traz custo do Codex.

| fluxo | sessões com custo | Anthropic mediana | Anthropic média | total Anthropic | publicados | Anthropic por publicado | Grok 4.7 mediano por sessão (desde 15/10, n) |
|---|---|---|---|---|---|---|---|
| livre | 57 | 1,69 | 1,91 | 108,92 | 7 | **15,56** | 4,77 (2) |
| fontes | 51 | 1,52 | 1,73 | 88,01 | 14 | **6,29** | 4,21 (3) |
| modelar_video | 39 | 1,67 | 2,18 | 85,08 | 9 | 9,45 | 3,73 (9) |
| modelar_texto | 24 | 1,53 | 1,83 | 43,98 | 6 | 7,33 | 6,31 (1) |
| replicar | 30 | 1,50 | 1,69 | 50,83 | 4 | 12,71 | 2,55 (2) |
| carrossel | 9 | 1,73 | 2,13 | 19,13 | 2 | 9,56 | — |
| **total** | 210 | **1,56** | 1,89 | **395,95** | 42 | **9,43** | **3,82 (17)** |

Valores em US$.

- **O custo por roteiro é quase igual entre fluxos.** O que muda é a conversão, e é isso que faz o livre custar 2,5 vezes mais por vídeo publicado do que o fontes.
- **Fases Anthropic** (mediana por roteiro onde a fase rodou): humanização 0,45, roteiro 0,43, hook 0,20, revisão 0,12, narrativas 0,09, verificação 0,07. A autópsia de modelagem é cerca de 0,06 (Sonnet, ~12 mil tokens de entrada e 3 mil de saída, pelo `hub.atividades`). Modelar não encarece a sessão.
- **O Grok passou a ser a maior linha de custo.** Desde 15/10 (Grok 4.7, com `usd` registrado), pesquisa sai a ~US$ 0,79 e busca da verificação a ~US$ 2,83 por sessão: **cerca de US$ 3,8 por sessão, o dobro da parte Anthropic.**
- Antes de 13/10 o Grok 4.3 gravava zero tokens, então o custo dele **não está medido**. O total por mês subiu de US$ 132 (agosto) para 181 (outubro, ainda incompleto) só na parte medida.
- As 42 sessões sem roteiro também gastaram, mas esse custo não fica no trace.

## 7. Corpus da casa: modelado contra original

Base: roteiros do CRM fora do Codex (exclui os 56 casados). "Modelado" é `sources` citando "Modelagem", a marca do CRM. Vídeos maduros desde 24/06, em células cliente × rede com pelo menos 8 vídeos. "Topo" é o quartil superior do coeficiente dentro de cliente × rede. O OR é de Mantel-Haenszel, estratificado por cliente × rede.

| recorte | modelado (vídeos · topo · acerto · coef) | original | OR do topo |
|---|---|---|---|
| todos | 1.845 · 26% · 21% · 1,16 | 2.161 · 24% · 18% · 1,01 | 1,07 |
| jun–ago | 953 · 25% · 21% · 1,15 | 1.273 · 23% · 16% · 0,97 | **1,35** |
| set–out | 892 · 27% · 20% · 1,17 | 888 · 26% · 21% · 1,08 | **0,83** |
| Instagram / TikTok / YouTube | | | 1,09 / 0,93 / 1,17 |

**Por cliente** (≥40 vídeos; topo modelado contra topo original, e OR):

- **A favor de modelar:** Izabela Anholett **31% contra 18%, OR 2,06** (55% modelado; o estudo de outubro deu 32% contra 14% e OR 2,95, numa janela maior). Também Thiago Franco 50% contra 22% (3,46), Dilson Peres 38% contra 23% (2,03), Rafael Rodrigues 36% contra 22% (1,98), Thiago Bisewski 1,95, Marcos Pelozato 1,63, Franklin Tomich 1,62 e Rodrigo Waughan 1,61.
- **Contra modelar:** Pedro Elero **19% contra 48%, OR 0,27** (81% modelado), Túlio Lichenstein 11% contra 36% (0,22), Renato Mendes 18% contra 38% (0,37, 73% modelado), Cadu Neiva 0,53 e Lincoln Fracari 0,62 (69% modelado).
- **Origem da referência nos modelados da casa:** externa no Instagram em 1.536 vídeos (26% de topo), da própria casa em 113 vídeos de 49 roteiros (**34% de topo**), TikTok em 41 (34%) e sem link reconhecível em 145 (18%).
- **O Codex publicado na mesma régua tem 37% de topo**: modelar_video 45%, livre 41%, fontes 38%, replicar 38% e **modelar_texto 13%**.
- **Participação da modelagem:** 44% dos roteiros da casa no período são modelados (728 de 1.659). No Codex, 43% das sessões partem de referência (118 de 273).

Esse resultado bate com o estudo de outubro (`docs/estudo-2026-10/achados/embeddings/achados.md`, Achado 5). Modelar ajudava até agosto e deixou de ajudar em setembro e outubro. O efeito depende do cliente: é forte em tecnologia e IA (Izabela) e negativo justamente nos clientes que modelam quase toda a pauta (Pedro, Renato Mendes, Túlio, Lincoln).

## Lacunas

- O casamento é de 20/10, então sessões depois disso não têm desfecho.
- Ninguém guarda a métrica do vídeo de referência externo.
- O custo do Grok 4.3 (até 13/10) e o das sessões que falharam não está medido.
- O papel do usuário é o papel de hoje, não o da época da sessão.
