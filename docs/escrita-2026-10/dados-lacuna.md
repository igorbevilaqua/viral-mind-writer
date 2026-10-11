# Dados e lacuna de escrita: Codex x roteiros da casa

Levantamento de 11/10/2026. Tudo só leitura (SELECT via MCP no Viral Data `qclvrddrqulgfzccndnl`; CRM lido pela ponte `crm.scripts` via postgres_fdw). Sem chave local: as features foram calculadas em SQL (regex do Postgres 17). As queries estão em `feat.sql` e `feat2.sql` nesta mesma pasta; os d de Cohen em `d.py`.

---

## A. Inventário: que sinal diz se a ESCRITA funcionou

| sinal | onde | linhas / cobertura | como juntar | observação |
|---|---|---|---|---|
| views, curtidas, coment., compart., salv. (acumulados) | `public.metricas_diarias` (450 mil linhas) → já agregado em `oraculo.fato_video` (matview, 16.884 vídeos) | todos os vídeos têm views. Salvamentos: **só TikTok** (1.865 de 2.009 VM); IG tem salvamento em 0 de 2.860 VM (não é coletado). Compart.: IG 1.251/2.860 VM, TT 1.666/2.009, YT 0 (YouTube não traz shares nem saves). Comentários (contagem): IG 2.516/2.860, TT 1.542, YT 1.496 | `fato_video.video_id = videos.id` | `views_no_dia` é acumulado (o fato usa max). Por mil views: dá para calcular só onde a métrica existe; em IG, "salvar" não existe na base |
| coeficiente viral + classificação (acerto = ≥3x mediana do canal e ≥10k) | `oraculo.fato_video.coeficiente_viral`, `classificacao`, `maturando` | 100% dos vídeos. VM (`vm_script='sim'`): IG 2.860 (621 acertos), TT 2.009 (400), YT 1.972 (365), FB 339 (83), desde 17/01/2026 | idem | mediana do canal é da janela de 180 dias anteriores, separada por vm_script. É o desfecho padrão da casa |
| retenção hook / subhook / final (%), % não seguidores, seguidores ganhos | `public.metricas_retencao` (5.989 linhas, 1.948 vídeos) → `fato_video.retencao_*` | **IG 1.564 vídeos (1.336 com roteiro CRM)**, **TT 344 (268 com CRM)**, YT e FB zero. Janela 17/01 a 14/09/2026 (parada há 4 semanas). Médias IG: hook 65, subhook 45, final 14; TT: 59 / 39 / 7 | `metricas_retencao.video_id` (pegar a linha mais recente, como o fato faz) | correlação com ln(coef): hook 0,28 IG / 0,44 TT; final 0,18 / 0,25. É o sinal mais "de escrita" que existe (hook e subhook medem as duas primeiras frases), mas cobre cerca de metade do IG VM |
| texto dos comentários | `public.comments` (4.777 linhas) | **71 vídeos, só Instagram**, 06/10/2025 a 12/06/2026, coleta parada | `comments.video_id` | inútil para estatística; serve para leitura qualitativa |
| transcrição do vídeo publicado | `public.videos.roteiro` (16.490 vídeos com >200 caracteres); `public.documents.content` (12.257, = título + assunto + transcrição, com embedding 1536) | ~todo o corpus, inclusive VM e não-VM | `videos.id` / `documents.video_id` | é ASR: pontuação e parágrafos não são confiáveis (mediana de 1 parágrafo; frase média inflada). Números e siglas saem 10% a 30% abaixo do texto escrito (calibrado abaixo) |
| roteiro humano escrito (CRM) com desfecho | `crm.scripts` (foreign, 4.188 roteiros, todos com `script_text`; 2.858 postados, 969 nos últimos 60 dias). Snapshot em `oraculo.crm_scripts_snap` (2.855) e `oraculo.fato_roteiro` (2.855, 1 vídeo por roteiro) | 2.744 roteiros ligam a ≥1 vídeo VM maduro (média 2,5 vídeos/roteiro, várias redes). 895 têm ao menos um acerto | **use `videos.crm_script_id = crm.scripts.id`** (8.028 vídeos ligados); `fato_roteiro` casa por link e só pega 1 vídeo | `script_text` inclui notas de edição entre parênteses (removidas na análise). `script_content_json` em 1.215 |
| rótulos estruturais por roteiro (payoff, promessa do hook, função do subhook, conclusão, protagonista...) | local: `docs/estudo-2026-10/dados/rotulos_llm.json` (2.809 roteiros), `clusters.json` | todos os roteiros 2026 do estudo | `script_id` = `crm.scripts.id` | `data/` (export com embeddings) não existe localmente; não regenerei |
| rótulos do corpus | `vm_video_classifications` (7.702: mecanismo e formato do hook, estruturas, comandos, tema), `oraculo.playbook_class` (21.064) | parcial | `video_id` | |
| roteiros do Codex | `vm_generated_scripts` (231; 191 nos últimos 60 dias, 146 sessões, 15 clientes; 07/07 a 11/10/2026) | hook, roteiro, comando, headline, `pipeline_trace`, `slop_lint_violations` | `client_id = clientes.id` | |
| Codex publicado + desfecho | `published_url` (21), `vm_outcomes` (21, todos com `ratio` e `verdict`; 11 com `predicted_score`), `vm_script_performance` (21, views; retenção só em 5), `vm_script_matches` (50, 49 confirmados por shingle, `sobreposicao` média 0,47) | **21 roteiros**, todos IG como URL principal; 20 com vídeo IG maduro, 14 TT, 9 YT, 1 FB | `vm_script_matches.video_id → fato_video` | `vm_script_performance.compartilhamentos` = 0 em todos (campo não preenchido) |
| sinais humanos sobre o texto do Codex | `vm_edit_observations` (168 edições em ~22 roteiros, 06 a 28/09: inserção 66, reescrita 44, corte 30, ritmo 18, vocabulário 10), `vm_script_feedback` (9 notas, 5 com versão editada), `vm_calibration_votes` (6 votos em 320 pares), `vm_bullet_votes` (2) | pequeno | `script_id` | a única fonte de "o humano mexeu aqui" no texto Codex |
| corpus externo de referência | `vm_modelagem_pool` (1.900: views, likes, shares, comments, caption) | sem transcrição | | não serve para medir texto |

Resumo: o desfecho sólido é coeficiente viral / acerto (todas as redes). Retenção existe para ~1.600 vídeos IG + ~340 TT, parada desde 14/09. Shares por mil: IG e TT. Saves por mil: só TT. Texto de comentário: praticamente não existe.

---

## B. Lacuna medida (features determinísticas)

### Grupos
- **codex**: `vm_generated_scripts` dos últimos 60 dias, última versão por sessão, texto = hook + roteiro + comando (n=146).
- **h_topo / h_base**: roteiros do CRM com vídeo VM maduro. Para cada vídeo, percent_rank do coeficiente no estrato cliente x rede x trimestre (só estratos com ≥10 vídeos); por roteiro, a média dos ranks; quartis por roteiro (n=664 cada). Texto = `script_text` sem parênteses/colchetes.
- **h_acerto / h_sem_acerto**: régua oficial (algum vídeo do roteiro é acerto: 873 x 1.783). Serve de réplica.
- **hmc_topo / hmc_base**: o mesmo topo/base, só nos 15 clientes que o Codex atende (382 / 371).
- **h_ult60d**: roteiros humanos publicados nos últimos 60 dias (826), para tirar o efeito "a casa mudou o estilo no ano".
- **corpus_viral**: transcrição (`videos.roteiro`) de vídeos não-VM com acerto e ≥100k views (362). **transcr_h_topo**: transcrição dos vídeos dos roteiros h_topo (685), para calibrar o efeito do ASR.

### Tabela (médias; "/100p" = por 100 palavras)

| feature | codex | h_topo | h_base | h_ult60d | corpus_viral* | d codex-topo | d topo-base (z) | d acerto-sem (z) | leitura |
|---|---|---|---|---|---|---|---|---|---|
| números (dígitos) /100p | **2,90** | 1,74 | 1,78 | 1,84 | 1,94 (med 1,08) | **+0,96** | -0,04 (-0,7) | -0,05 (-1,1) | só estilo |
| frases por roteiro | **26,6** | 22,3 | 21,6 | 21,6 | n/a | **+0,77** | +0,13 (2,4) | -0,04 | fraco, não replica |
| % frases >25 palavras | **11,3** | 19,1 | 18,8 | 21,6 | n/a | **-0,70** | +0,03 (0,5) | +0,03 | só estilo |
| frase média (palavras) | **15,6** | 17,8 | 17,7 | 18,6 | n/a | **-0,70** | +0,01 | +0,05 | só estilo |
| contraste (mas, só que, porém) /100p | **0,45** | 0,72 | 0,71 | 0,68 | 0,55 | **-0,69** | +0,03 | -0,08 | só estilo |
| "ou seja" /100p | **0,15** | 0,07 | 0,06 | 0,07 | 0,04 | **+0,57** | +0,07 (1,4) | +0,06 (1,4) | densidade é estilo (ver nota) |
| palavras | 408 | 384 | 372 | 391 | 408 | +0,37 | +0,18 (3,2) | -0,03 | fraco, não replica |
| causais (porque, por isso, então, aí, com isso, o resultado) /100p | **0,71** | 0,56 | 0,61 | 0,56 | 0,95 | +0,37 | **-0,11 (-2,0)** | -0,03 | levemente contra; Codex no lado errado |
| parágrafos | 14,7 | 16,1 | 15,6 | 16,3 | n/a | -0,34 | +0,12 (2,3) | +0,09 (2,2) | fraco; é formatação |
| **nomes próprios no meio da frase /100p** | **4,38** | **5,11** | 4,62 | 4,86 | 4,04 | **-0,33** | **+0,23 (4,1)** | **+0,15 (3,5)** | **prediz e replica; Codex abaixo da base** |
| metonímia (Pequim, Washington, Brasília, Planalto, Kremlin, Casa Branca como sujeito) /100p | 0,013 | 0,002 | 0,002 | 0,004 | 0,004 | +0,30 | 0,00 | 0,00 | raro; 6x mais no Codex, sem efeito medível |
| siglas (2+ maiúsculas) /100p | 0,51 | 0,71 | 0,78 | 0,58 | 0,84 | -0,25 | -0,07 (-1,3) | +0,06 | só estilo |
| perguntas /100p | 0,09 | 0,15 | 0,16 | 0,14 | **0,85** | -0,22 | -0,03 | +0,03 | só estilo entre humanos |
| "você"/2ª pessoa /100p | 0,77 | 0,69 | 0,74 | 0,66 | **1,51** | +0,13 | -0,08 (-1,5) | -0,03 | só estilo |
| % fragmentos (<5 palavras) | 3,5 | 3,8 | 3,8 | 2,8 | 11,7 | -0,04 | 0,00 | 0,00 | sem diferença |

\* corpus_viral é transcrição de ASR, outro gênero (fala do próprio cliente, sem roteiro VM). Feature de frase e parágrafo não vale lá (frase média 39 por falta de pontuação, mediana 1 parágrafo). Calibração ASR (transcr_h_topo contra o próprio h_topo escrito): números 1,57 vs 1,74 (-10%), nomes próprios 4,66 vs 5,11 (-9%), siglas 0,51 vs 0,71 (-28%); você, causais, contraste, "ou seja" e perguntas ficam iguais (±0,03).

Mesmos clientes (hmc): o quadro não muda. Codex x hmc_topo: números +0,82, % frases >25 -0,77, contraste -0,65, "ou seja" +0,53, nomes próprios -0,38. hmc_topo x hmc_base: nomes próprios +0,26 (z 3,5), palavras +0,16 (2,2), parágrafos +0,16 (2,2), causais -0,12 (-1,6), resto ~0.

### O que separa o Codex dos melhores roteiros humanos
1. **Números demais**: 2,9 dígitos a cada 100 palavras contra 1,7 (d ≈ 1). Entre humanos, densidade de número não prediz nada (d -0,04). Coincide com o estudo de outubro ("densidade de números é neutra"). Estilo, mas é o traço mais visível do Codex.
2. **Frases mais curtas e mais numerosas**: 15,6 palavras de média e 11% de frases longas contra 17,8 e 19%. Não prediz desempenho entre humanos. Estilo.
3. **Pouco contraste** ("mas", "só que", "porém"): 0,45 contra 0,72. Não prediz. Estilo (mas é o que dá a cadência de virada da casa).
4. **"Ou seja" em dobro**: mediana do Codex 0,22/100p (quase todo roteiro tem), humano 0. O estudo de outubro achou que *abrir uma frase* com "Ou seja," após o fato forte funciona (OR estrito 1,30); aqui a *densidade* não separa topo de base (z 1,4). Leitura: o Codex aprendeu a regra e usa demais; uma vez basta.
5. **Menos nomes próprios** no meio da frase: 4,4 contra 5,1. **É a única feature desta lista que separa topo de base entre humanos e replica na régua oficial de acerto e no recorte dos mesmos clientes** (d 0,15 a 0,26, z 3,5 a 4,1). Coincide com o estudo de outubro (nomes próprios densos, OR 1,20; hook sem nome próprio OR 0,71). Ressalva: nome próprio também marca tema (geopolítica, marcas), não só escrita.
6. Causais: o Codex usa mais (0,71 x 0,56) e, entre humanos, mais causal anda levemente com base (d -0,11, z -2,0, não replica no acerto). Sinal fraco, mas na direção errada para o Codex.

Flag "só estilo" (não preveem desempenho entre humanos em nenhuma das três réguas): números, frase média, % frases longas, contraste, "ou seja" (densidade), siglas, perguntas, você, fragmentos, metonímia. Fazer o Codex parecer humano nesses eixos é questão de voz da casa, não de resultado esperado.

Ressalvas: (a) efeitos entre humanos são pequenos (d ≤ 0,26); nenhuma feature de superfície explica muito do coeficiente. (b) O Codex escreve hook, roteiro e comando separados; o humano escreve corrido com uma frase por linha: parágrafos e contagem de frases têm parte de formatação. (c) Uma parte dos roteiros humanos recentes pode ter nascido no Codex (21 confirmados; o resto não é rastreado); efeito desprezível em 2.744. (d) Quartil por média de ranks do roteiro entre redes; a régua oficial de acerto dá o mesmo quadro.

---

## C. O Codex já foi medido contra desfecho?

Sim, em pequena escala. **21 de 231 roteiros gerados (9%) foram publicados** e todos têm `vm_outcomes` (ratio e veredito) e `vm_script_performance` (views). O match com o vídeo é por shingle (`vm_script_matches`, 49 confirmados automaticamente), com sobreposição média de **0,47**: o texto publicado é o do Codex editado por humano, não o Codex puro.

Comparação com a base humana do mesmo cliente (vídeos VM do mesmo cliente x rede x trimestre, sem os vídeos do Codex; maduros):

| rede | vídeos Codex | percentil médio do coef na base do cliente | no quartil de cima | acertos Codex | taxa de acerto esperada pela base |
|---|---|---|---|---|---|
| Instagram | 20 | 0,66 (mediana 0,58) | 9 de 20 (esperado 5; p=0,04) | 8/20 = 40% (Wilson 22% a 61%) | 15% (p=0,006) |
| TikTok | 14 | 0,77 (mediana 0,83) | 9 de 14 | 8/14 = 57% | 14% |
| YouTube | 9 | 0,59 | 5 de 9 | 2/9 | 12% |
| total | 44 (20 roteiros) | 0,68 | 23 de 44 | 19/44 = 43% | 15% |

Leitura honesta: o resultado é bom, mas **não mede a escrita do Codex**. (1) Seleção: só 9% dos roteiros foram publicados, escolhidos por humano. (2) Edição: menos da metade do texto sobrevive (sobreposição 0,47; 168 edições registradas em `vm_edit_observations`). (3) Pauta: vários vêm de modelagem de vídeo já viral; o tema carrega o resultado. (4) Concentração: Túlio Lichenstein (4 roteiros, todos com ratio de 1,37 ou menos), Renato Mendes (4) e Fernando Pereira (4) somam 12 dos 21; três roteiros (Pedro Elero 89,7, Fernando Pereira 56,9, Marcos Pelozato 22,9) puxam a média. n=20 roteiros. O `predicted_score` do Codex (11 com nota) não acompanha o resultado: a nota mais baixa (45) foi o maior ratio (89,7); notas 78 a 93 deram de 0,33 a 56,9.

O que falta para medir a escrita: guardar a versão publicada (ou o diff) por roteiro, registrar os não publicados como "rejeitado" com motivo, e ligar `vm_generated_scripts` ao `crm.scripts` correspondente (hoje só por shingle). Retenção de hook/subhook para os 21 só existe em 5 (`vm_script_performance`), e a coleta de retenção parou em 14/09.
