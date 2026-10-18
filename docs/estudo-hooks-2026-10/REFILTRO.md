# Refiltro do estudo de hooks: só roteiro da casa (vm_script='sim') e por modo

18/10/2026. Só SELECT no Supabase do Oráculo (`qclvrddrqulgfzccndnl`), sem LLM e sem gastar crédito. Scripts, saídas brutas e a base vídeo a vídeo estão em `dados/` (`refiltro_src/`, `refiltro_saida_parte_a.txt`, `refiltro_saida_parte_b.txt`, `refiltro_base_ig_tt_sim.jsonl`).

## Resumo em 6 linhas

1. **A regra do subhook continua de pé.** O estudo original já era quase todo roteiro da casa: 1.147 dos 1.290 vídeos do IG com retenção são `sim`. Hook ≥71 com queda ≤17 acerta **76,9%**, contra **41,0%** com queda >17. O padrão aparece em 9 de 9 clientes.
2. **Também ficam de pé:** "acabou de" (lift ajustado 1,49), "acabou de" + marca, conflito ou choque, "declarou guerra" (1,79; 2,05 sem a Izabela), sub-hook causal (1,38), número neutro e Autoridade como sentimento ruim (0,57).
3. **Enfraquecem e ficam perto do neutro:** abrir com "O/A + Nome" (1,33 vira 1,15), país/região (1,25 vira 1,07), pergunta (0,83 vira 0,89, e em 5 de 8 clientes a pergunta acerta *mais*), primeira pessoa (0,77, mas quase não existe no roteiro), "Esse/Essa" no lado positivo e Admiração.
4. **Inverte: "2 mecanismos do playbook > 1".** No roteiro da casa, 1 MGC acerta 23,5% e 2 acertam 21,7%. Só "nenhum MGC" continua ruim, e isso quase não acontece (n=24).
5. **Os anti-padrões (lista, acusar o espectador, "Imagina", contexto de série, "Se você") são de corte de podcast.** No roteiro da casa somam 53 vídeos no total: não dá para medir, mas também não aparece nada contra a proibição.
6. **Por modo, as hipóteses do CRUZAMENTO não se confirmam.** A queda do subhook em mecanismo é igual à dos outros modos. Contexto logo depois do hook não aumenta a queda. Em panorama, abrir com número não perde para país ou marca. Em história, nome conhecido ou desconhecido dá quase o mesmo resultado.

---

## 0. Base, filtros e como comparar

### Query base (a mesma do estudo original, mais o refiltro)
```sql
select f.video_id, f.cliente_nome, f.plataforma, f.vm_script, f.hook,
       f.retencao_hook, f.retencao_subhook, f.coeficiente_viral, f.classificacao,
       v.crm_script_id
from oraculo.fato_video f
join public.videos v on v.id = f.video_id
where not f.maturando
  and not coalesce(v.removido,false)
  and not coalesce(v.is_repost,false)
  and coalesce(trim(f.hook),'') <> ''
  and f.classificacao is not null
  -- refiltro:
  and f.vm_script = 'sim'
-- retenção: + f.retencao_hook > 0 and f.retencao_subhook is not null and f.cliente_nome is not null
--           and not (f.plataforma='Instagram' and f.cliente_nome='Rodrigo Waughan')
```
Na prática, a extração foi feita por `supabase-js` com a service role do `.env.local` do Oráculo (só `select`, paginado; ver `refiltro_src/export.mjs`). As features e o join foram calculados localmente em Python (`refiltro_src/base.py`). A classificação do playbook vem de `oraculo.playbook_class` (dimensão `hook`, com `chave` = texto exato do hook).

**`vm_script='sim'` é a mesma coisa que ter `crm_script_id`:** 2.655 de 2.655 no IG e 1.915 de 1.915 no TikTok. Dos 2.655 do IG, 2.640 têm rótulo de modo (`rotulos_modo.jsonl`, `script_id` = `crm_script_id`).

| Base | n | Acerto | Clientes |
|---|---|---|---|
| IG, tudo (replica o estudo) | 6.351 | 17,7% | 35 |
| **IG, sim** | **2.655** | **21,6%** | 29 |
| IG com retenção, tudo | 1.288 | 23,7% | 20 |
| **IG com retenção, sim** | **1.146** | 23,7% | 19 |
| TikTok, sim | 1.915 | 20,5% | 24 |
| TikTok com retenção, sim | 251 | 8,0% | 7 |

**Replicação.** Na base inteira, refiz os números originais. Coincidem exatamente: 1.290 vídeos com 23,7% de acerto, o subhook com 77,1% (n=144) e 45,5% (n=187), os MGCs com 10,1/16,5/21,6/19,1%, Esse Cara + Proibido com 38,7% (n=31) e Crença + Negatividade com 6,6% (n=61). Ficam muito perto: "declarou guerra" (43,4%, n=53, contra 42,6%, n=54), "Imagina" (n=33 contra 34), "Se você" (n=94 contra 94), pergunta (1.265 contra 1.258) e abrir em 1ª pessoa (195 contra 193). Então a comparação "original × refiltrado" é justa nesses casos.

**Onde tive de aproximar** (as regex do estudo não estão nos .md):
- **promessa vazia:** `do que (parece|você imagina|pensa)` pega n=38 na base toda, contra 74 no original.
- **acusar o espectador:** pega n=5, contra 23.
- **contexto de série:** pega n=32, contra 50.
- **Davi x Golias:** gigante + pequeno + verbo de disputa pega n=38, contra 93.
- **"de X a império":** `império | fatura N bi/mi | de zero a`.
- **nome como revelação:** `o nome dele é | tem nome | se chama`.

Nesses casos, o número refiltrado deve ser comparado com a coluna "IG tudo" da minha tabela, não com o número do .md.

### Métricas
- **Acerto** = `classificacao='acerto'`.
- **Lift ajustado** = acertos observados ÷ esperados, com o esperado dado pela taxa de acerto de cada cliente na mesma base. Isso corrige o efeito "cliente grande que usa muito a feature".
- **IC90:** bootstrap que reamostra clientes inteiros (500 a 1.000 vezes).
- **Clientes func/neutro/falha:** só entram clientes com ≥8 vídeos com a feature e ≥8 sem. Lift bruto >1,1 conta como "funciona", <0,9 como "falha".
- **Δ hook vs cli** e **Δ queda vs cli:** mediana de (valor do vídeo − mediana do cliente).
- **Δ log10 coef vs cli:** a mesma coisa para o coeficiente viral. É o "ratio", que tira a escala do canal.
- Nenhuma métrica de circunstância (views brutas, seguidores, data) foi usada como desfecho.

---

## 1. Parte A: achados do CRUZAMENTO, original × refiltrado

### 1a. Tabela de vereditos

O "original" é o número do .md. O "refiltrado" é IG `sim`. Para TikTok `sim`, ver a tabela 1c.

| Achado (CRUZAMENTO) | Original | Refiltrado IG sim | Veredito |
|---|---|---|---|
| **Subhook: hook ≥71 e queda ≤17 × >17** | 77,1% (n=144) × 45,5% (n=187) | **76,9% (n=143) × 41,0% (n=173)**; lift aj. 2,50 (IC 2,19–3,15) × 1,48; 9/9 clientes | **Se sustenta (firme)** |
| Promessa vazia ("mais … do que parece/imagina") | 13,5% (n=74) | 16,7% (n=24), aj. 0,67 (IC 0,25–1,17); regex aproximada | Mesma direção, **n insuficiente** |
| Sub-hook causal ("e o motivo / o segredo / a culpa / e o pior") | 25,1% (n=251; ~1,4× a base) | 30,7% (n=127), aj. **1,38** (IC 1,01–1,72); sem Izabela 1,41; clientes 2/0/2 | **Se sustenta** (moderado; depende do modo, ver §2) |
| "Esse/Essa" por nicho | Empreend. 1,65 · Ciência 1,53 · IA 0,55 | Empreend. **0,99** · Ciência 1,17 · IA **0,57** · geral 0,98 | **Enfraquece.** O lado negativo (IA) se sustenta, mas o lado positivo vinha dos cortes de Germano e Cadu Neiva |
| Primeira pessoa (eu/meu/minha) | lift 0,50; falha em 15 de 18 clientes | aj. 0,77 (IC 0,54–1,09), n=109; abrir em 1ª pessoa: n=10 | **Enfraquece.** A direção se mantém, mas no roteiro é rara |
| Pergunta no hook | 0,67; falha em 11 de 20 clientes | aj. 0,89 (IC 0,74–1,04), n=183; clientes **5/2/1**; Δ hook −1,2 | **Enfraquece (quase neutra)**. Em panorama, 0,47 (n=23) |
| 2 MGCs × 1 × 0 | 21,6% × 16,5% × 10,1% | 21,7% (1.501) × **23,5% (293)** × 8,3% (24) | **Inverte** no "2 > 1". "0 MGC é ruim" se sustenta, mas com n=24 |
| Esse Cara + Proibido / Crença + Negatividade | 38,7% (31) / 6,6% (61) | 33,3% (24), aj. 1,87 / 4,8% (21), aj. 0,25 | Mesma direção, n pequeno |
| Sentimentos: Autoridade / Didatismo / Admiração / Escândalo | 0,56 / 0,77 / 1,42 / 1,52 | **0,57** / 0,88 / 1,17 / 1,27 (Indignação 1,34 → 0,96) | Autoridade **se sustenta**. Os outros enfraquecem |
| **"acabou de"** | aj. 1,82 (retenção) / 32,1% | **35,5% × 20,4%**, aj. **1,49** (IC 1,18–1,75); 6/0/2 clientes; sem Izabela 1,41; Δ hook +3 | **Se sustenta (firme)**, mas não em história (§2) |
| "acabou de" + abre com marca | 45,5% (n=66) | 34,0% (n=97), aj. 1,39 (IC 1,11–1,75); na base com retenção, **52,8% (n=36)**, aj. 2,22 | **Se sustenta** |
| Abre com "O/A + Nome" | aj. 1,33 (z 3,1) | aj. 1,15 (IC 1,01–1,28); clientes 12/2/8 | **Enfraquece** |
| Número na abertura é neutro | lift 0,90–0,99 | dígito 0,96 · número na 1ª frase 1,02 · abre com número 0,82 (n=19) | **Se sustenta (neutro)** |
| País/região ("abrir com país agindo", 1,43; 16 de 23 clientes) | 1,43 | aj. **1,07** (IC 0,97–1,17); clientes 13/2/8 | **Enfraquece (quase neutro)**. Ver panorama em §2 |
| Conflito / choque | 1,53 / 1,29 | **1,42** (IC 1,26–1,63) / **1,34** (IC 1,16–1,51) | **Se sustenta** |
| **"declarou guerra / em guerra"** | 42,6% (n=54) | **46,3% (n=41)**, aj. 1,79 (IC 1,32–2,54); 13 clientes; **sem Izabela 2,05 (n=28)** | **Se sustenta (firme)** |
| Davi x Golias | 36,6% (n=93) | 28,6% (n=28), aj. 1,26 (IC 0,56–1,82); regex aproximada | **n insuficiente** |
| "De X a império que fatura N bi" | 3,9% / Case 3,1% × 14,8% | geral 18,4% (n=125), aj. 0,98. Por nicho: Case 9,7% × 16,6%, Ciência 5,6% × 31,5%, IA 0/7, Finanças 1/11; **Empreend. 33% × 18% (n=51)** | **Depende do nicho.** Ruim fora de Empreend./Mkt; neutro no geral |
| Nome como revelação ("o nome dele é…") | −4,3 pts de hook (n=22) | n=19; Δ hook −2, Δ queda +1; acerto 21% (aj. 1,05); em história, 2 de 13 | **n insuficiente** (a retenção vai na mesma direção) |
| Desafio de Crença só com nome próprio | qualitativo | com nome/marca: 24,3% (111), aj. 1,12 × sem: 18,8% (144), aj. 0,98 | Sinal fraco |
| Nostalgia ("antigamente / lembra / sumiu") | aj. 1,35 (n=33, 7 clientes) | 33,9% (n=56), aj. 1,29 (IC 0,99–1,54); 35 dos 56 são de Franklin e Grazino | Sinal concentrado (é perfil de cliente) |
| Lista numerada | 3,8% (26) | n=7 (3 acertos) | **n insuficiente** (não existe no roteiro) |
| Acusar o espectador | 0% (23) | n=2 (0 acertos) | **n insuficiente** |
| "Imagina…" | 2,9% (34) | **0 de 13** (esperado ≈2,8) | Mesma direção, n pequeno |
| Contexto de série | 8% (50) | n=1 | **n insuficiente** (é coisa de corte e de quadro) |
| "Se você…" | 14,9% (94) | 20,0% (n=30), aj. 1,02 | **n insuficiente / neutro** |

### 1b. Tabela completa (IG sim)

Colunas: feature · n (clientes) · acerto com / sem % · lift aj. · IC90 · clientes func/neutro/falha · n com retenção · Δ hook vs cli · Δ queda vs cli · Δ log10 coef vs cli.

| feature | n (cli) | acerto c/s | aj. | IC90 | cli f/n/z | n ret | Δhook | Δqueda | Δlogcoef |
|---|---|---|---|---|---|---|---|---|---|
| acabou_de | 203 (24) | 35,5 / 20,4 | 1,49 | 1,18–1,75 | 6/0/2 | 80 | +3,0 | −0,2 | +0,14 |
| abre_nome (O/A + Maiúscula) | 603 (28) | 25,0 / 20,6 | 1,15 | 1,01–1,28 | 12/2/8 | 255 | +1,0 | 0 | +0,05 |
| combo acabou + nome | 97 (20) | 34,0 / 21,1 | 1,39 | 1,11–1,75 | 2/2/0 | 36 | +6,0 | +0,8 | +0,14 |
| conflito | 286 (29) | 31,1 / 20,4 | 1,42 | 1,26–1,63 | 8/1/6 | 134 | +1,0 | 0 | +0,08 |
| choque | 189 (27) | 32,3 / 20,8 | 1,34 | 1,16–1,51 | 6/0/1 | 101 | +2,0 | −1,0 | +0,14 |
| guerra | 41 (13) | 46,3 / 21,2 | 1,79 | 1,32–2,54 | 1/0/0 | 14 | +7,5 | −1,0 | +0,32 |
| davi_golias (aprox.) | 28 (14) | 28,6 / 21,5 | 1,26 | 0,56–1,82 | – | 15 | +1,0 | 0 | +0,01 |
| pais_regiao | 896 (29) | 24,3 / 20,2 | 1,07 | 0,97–1,17 | 13/2/8 | 325 | +1,0 | 0 | +0,02 |
| marca_grande | 837 (29) | 23,3 / 20,8 | 1,08 | 1,01–1,13 | 12/5/7 | 404 | 0 | −0,5 | 0 |
| abre_esse | 481 (29) | 21,4 / 21,6 | 0,98 | 0,84–1,12 | 11/1/8 | 202 | −1,0 | +1,0 | −0,02 |
| abre_voce | 64 (23) | 15,6 / 21,7 | 0,72 | 0,50–0,95 | 0/0/1 | 29 | −2,0 | +0,5 | −0,03 |
| se_voce | 30 (17) | 20,0 / 21,6 | 1,02 | 0,51–1,40 | – | 11 | 0 | −3,0 | +0,03 |
| pergunta | 183 (27) | 19,7 / 21,7 | 0,89 | 0,74–1,04 | 5/2/1 | 70 | −1,2 | 0 | −0,01 |
| primeira_pessoa | 109 (25) | 16,5 / 21,8 | 0,77 | 0,54–1,09 | 0/0/2 | 35 | −3,0 | −1,0 | −0,05 |
| numero (dígito) | 836 (29) | 20,3 / 22,2 | 0,96 | 0,89–1,05 | 6/4/14 | 386 | 0 | 0 | −0,01 |
| número na 1ª frase | 750 (29) | 21,3 / 21,7 | 1,02 | 0,93–1,10 | 11/6/7 | 345 | 0 | 0 | 0 |
| abre_pais_ou_marca | 664 (28) | 25,2 / 20,4 | 1,15 | 1,00–1,28 | 12/2/9 | 299 | +1,0 | −0,5 | +0,05 |
| ninguem_sabe | 172 (26) | 24,4 / 21,4 | 1,05 | 0,88–1,21 | 3/4/2 | 78 | 0 | −0,5 | 0 |
| nostalgia | 56 (17) | 33,9 / 21,3 | 1,29 | 0,99–1,54 | 2/0/0 | 25 | +1,0 | −1,5 | +0,16 |
| subhook_causal | 127 (27) | 30,7 / 21,1 | 1,38 | 1,01–1,72 | 2/0/2 | 60 | +3,0 | −1,2 | +0,09 |
| promessa_vazia (aprox.) | 24 (13) | 16,7 / 21,6 | 0,67 | 0,25–1,17 | – | 9 | +2,0 | −2,5 | 0 |
| imperio | 125 (22) | 18,4 / 21,7 | 0,98 | 0,58–1,38 | 5/0/2 | 60 | +1,0 | +1,0 | +0,02 |
| nome_revelacao | 19 (11) | 21,1 / 21,6 | 1,05 | 0,47–2,02 | – | 9 | −2,0 | +1,0 | −0,09 |

Sem a Izabela (IG sim), os lifts ajustados ficam assim: acabou de 1,41 · combo 1,40 · conflito 1,43 · guerra 2,05 · país 1,04 · pergunta 0,94 · 1ª pessoa 0,86 · Esse/Essa 1,04 · sub-hook causal 1,41. **Nenhum achado depende da Izabela.**

"Esse/Essa" por cliente (IG sim, n≥10 com a abertura), com e sem a abertura. Piora em três clientes grandes:
- Izabela: 18% contra 36%
- Cirino: 12% contra 35%
- Franklin: 13% contra 29%

Melhora em outros três:
- Germano: 22% contra 13%
- Renato Mendes: 45% contra 28%
- Lincoln: 36% contra 24%

Os casos de Germano e Cadu Neiva que davam o 1,65 em Empreendedorismo eram, na maioria, vídeos `nao`: dos hooks "Esse/Essa" não roteirizados, 39 são de Germano e 29 de Cadu.

### 1c. TikTok sim (n=1.915; retenção só em 251, de 7 clientes)
- **Mesma direção do IG:**
  - acabou de: 1,62 (n=165), positivo em 7 de 7 clientes
  - combo acabou + nome: 1,60
  - conflito: 1,47
  - guerra: 1,90 (n=33)
  - abrir com "Você": 0,47
  - primeira pessoa: 0,78
- **Diferente do IG:**
  - pergunta: 1,17 (n=127)
  - "Esse/Essa": 0,80
  - sub-hook causal: 0,95
- **Subhook:** hook ≥68 com queda ≤17 acerta **47,6% (n=21)**, contra 10,0% (n=50). A direção é a mesma do IG, com n pequeno.

---

## 2. Parte B: por modo (IG sim com rótulo de modo)

### 2a. Retenção e queda por modo

| modo | n IG | acerto | lift aj. do modo | n ret | hook (mediana) | Δ hook vs cli | queda (mediana) | Δ queda vs cli | % hook ≥71 | acerto com hook ≥71 e queda ≤17 (n) | acerto com hook ≥71 e queda >17 (n) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| história | 1.031 | 22,4% | 1,04 | 446 | 64 | 0 | 21 | 0 | 28% | 84% (61) | 32% (66) |
| mecanismo | 732 | 18,7% | 0,97 | 338 | 64 | +0,8 | 21 | 0 | 25% | 74% (42) | 43% (44) |
| demonstração | 477 | **28,9%** | 1,09 | 162 | **68** | 0 | 20 | −0,5 | **40%** | 73% (26) | 50% (38) |
| panorama | 290 | 17,6% | 0,96 | 139 | 63 | 0 | 22 | 0 | 19% | 64% (11) | 53% (15) |

TikTok, hook e queda medianos: história 61/21 (n=136), mecanismo 63/20 (81), demonstração 60/18 (15), panorama 63/17,5 (16).

**Leitura:**
- A queda hook→subhook é **igual em todos os modos** (20 a 22 pontos, Δ 0 contra o cliente).
- Demonstração retém mais no hook porque mostra o objeto, mas, comparado com o próprio cliente, o Δ é 0. Parte disso é que os clientes que fazem demonstração retêm mais.
- **A regra "segure o subhook" vale em todos os modos.** Em história ela é a mais forte: 84% contra 32%.

### 2b. B1: em mecanismo a queda é maior? Contexto logo depois do hook derruba o subhook?

**Queda em mecanismo × outros modos, no mesmo cliente** (13 clientes com ≥5 vídeos de cada lado): mecanismo cai mais em 5, menos em 7 e igual em 1. A mediana das diferenças é **−0,5 ponto**. **Não.**

**Contexto depois do hook.** Usei o texto do roteiro no CRM, com a segmentação do estudo 2026-10 (`segmentos.json`, um parágrafo do roteiro por segmento). O "parágrafo seguinte" é o primeiro parágrafo depois do hook que o hook falado ainda não cobre. Para isso, comparei com `fato_video.hook`: se ≥60% das palavras do parágrafo já estão no hook falado, passo para o próximo.

Considerei contexto quando o parágrafo abre com:
- data: "Em 2001…", "Desde…", "Há N anos";
- origem: "Tudo começou", "No começo do século";
- explicação: "Isso porque", "Para entender", "Basicamente";
- definição: "A X é uma empresa…".

Também conta como contexto quando a primeira frase tem "em/desde + ano". Os exemplos estão no fim de `refiltro_saida_parte_b.txt`.

| modo | parágrafo seguinte | n | queda (mediana) | Δ queda vs cli | acerto | com hook ≥71: n, acerto, % com queda ≤17 |
|---|---|---|---|---|---|---|
| mecanismo | contexto | 92 | 19 | −0,5 | 24% | 29 · 59% · 59% |
| mecanismo | resto | 239 | 21 | 0 | 19% | 57 · 57% · 44% |
| história | contexto | 169 | 21 | 0 | 27% | 44 · 57% · 41% |
| história | resto | 272 | 21 | 0 | 26% | 79 · 58% · 53% |
| todos os modos | contexto | 305 | 20 | 0 | 26% | 87 · 57% · 45% |
| todos os modos | resto | 762 | 21 | 0 | 24% | 211 · 59% · 47% |

Diferença média de queda (contexto − resto), com IC90 por bootstrap de clientes:
- mecanismo: **−1,0 ponto** (IC −1,9 a 0,0)
- todos os modos: −1,2 (IC −3,0 a +0,4)

Em mecanismo, o contexto acerta mais em 4 clientes e menos em 4.

**Resposta:** não há sinal de que contexto logo depois do hook derrube o subhook, nem em mecanismo nem no geral. Se há algo, o contexto cai um ponto a menos.

Ressalvas:
- (a) A classificação "contexto" é por regex: pega bem a abertura por data e por "isso porque", e mal os outros casos.
- (b) O roteiro do CRM pode não ser o que foi gravado e editado.
- (c) Não se sabe em que segundo fica o ponto "subhook".
- (d) O estudo original já tinha mostrado que o texto do hook também não explica a queda.

A queda parece depender da execução (edição, ritmo, voz), não de "contexto sim ou não" no papel.

### 2c. B2: em panorama, abrir com número × abrir com país ou marca agindo

Abertura classificada pela primeira frase do hook, em grupos exclusivos e nesta ordem de prioridade: país, marca/nome, número, outro.

| panorama (IG sim) | n | acerto | lift aj. | clientes | n ret | hook (mediana) | Δ hook vs cli |
|---|---|---|---|---|---|---|---|
| abre com país ("A China…", "O Brasil…") | 52 | 23% | 1,14 | 12 | 23 | 67 | **+4,0** |
| abre com marca/nome | 24 | 17% | 0,90 | 11 | 16 | 56 | −2,0 |
| número/dado na 1ª frase | 51 | 22% | **1,28** | 15 | 23 | 61 | 0 |
| nenhum dos três | 163 | **15%** | **0,81** | 24 | 77 | 62 | −1,0 |

Comparando direto país/marca com número, cada um ganha em 1 cliente (1 neutro, 2 a favor do número). Os números de panorama vêm muito de Fernando Pereira (15 dos 51).

No mesmo modo, por tipo de nome no hook:
- nome **conhecido**: 10% (n=77, aj. 0,62)
- **só lugar**: 26% (n=97, aj. 1,27, IC 1,08–1,48)

**Resposta:** em panorama, o **número na abertura não perde** para país ou marca no acerto (22% contra 21%). O país como sujeito tem o melhor sinal de retenção do hook (+4, com n=23). Marca ou pessoa famosa abrindo panorama vai pior. O que perde de verdade é a abertura sem número e sem sujeito concreto. Com n de 23 a 52 por grupo, é **sinal, não regra**.

### 2d. B3: em história, nome conhecido × desconhecido × sem nome

Aproximação de "conhecido":
1. Extraio os nomes próprios do hook: palavra maiúscula. No começo da frase, ela só conta se a mesma palavra aparece maiúscula no meio de frase em pelo menos 2 hooks da base.
2. Separo os lugares (países, estados, cidades).
3. "Conhecido" é o nome que está na lista de marcas e famosos (Apple, Musk, Silvio Santos, Palmeiras…) **ou** aparece nos hooks de ≥3 clientes diferentes, em qualquer rede.

O erro conhecido é classificar como "desconhecido" um nome famoso que só um cliente citou (Orkut, Latam, MySpace).

| história (IG sim) | n | acerto | lift aj. (IC90) | Δ log coef | n ret | Δ hook vs cli | Δ queda vs cli |
|---|---|---|---|---|---|---|---|
| nome conhecido | 304 | 20% | 1,02 (0,83–1,15) | +0,03 | 137 | 0 | 0 |
| nome desconhecido | 197 | 19% | 0,85 (0,68–1,01) | −0,06 | 86 | 0 | 0 |
| só lugar ("uma avó do interior do Brasil…") | 193 | **30%** | **1,30 (1,07–1,42)** | +0,05 | 59 | +2,0 | +0,5 |
| sem nome | 337 | 22% | 1,02 (0,90–1,07) | 0 | 164 | 0 | +0,5 |

Comparando conhecido com desconhecido dentro do cliente (≥4 de cada lado), o conhecido ganha em 9 clientes, empata em 1 e perde em 3. Nome como revelação em história: 2 acertos em 13, com retenção em só 5 vídeos.

**Resposta:**
- Nome conhecido tem um **sinal fraco** a favor no acerto: 0,85 contra 1,02, vencendo em 9 de 13 clientes.
- **Nenhuma diferença** na retenção do hook e na queda.
- O nome desconhecido não derruba o subhook. O caso Sônia Ramos é anedota: é o nome **entregue como revelação**, e isso tem n=13.
- O melhor grupo em história é o personagem descrito pelo lugar, sem nome.

### 2e. Os achados da parte A mudam de sinal entre modos?

Lift ajustado dentro do modo, com esperado pela taxa do cliente na base IG sim; n entre parênteses. Células com n<10 não têm lift.

| feature | história | mecanismo | demonstração | panorama |
|---|---|---|---|---|
| acabou de | **1,03** (26) | 1,71 (46) | 1,64 (84) | 1,34 (27) |
| abre "O/A + Nome" | 1,11 (128) | 1,20 (219) | 1,24 (159) | 0,96 (73) |
| combo acabou + nome | (9) | 1,98 (21) | 1,47 (47) | 1,56 (10) |
| conflito | 1,31 (105) | 1,58 (53) | 1,56 (70) | 1,44 (41) |
| guerra | (7) | 2,27 (11) | 1,60 (14) | (5) |
| país/região | 1,12 (336) | 0,98 (209) | 1,27 (163) | 0,92 (167) |
| abre "Esse/Essa" | 1,01 (311) | **1,34** (65) | 0,86 (79) | **0,55** (10) |
| pergunta | 1,12 (56) | 0,94 (56) | 0,81 (39) | **0,47** (23) |
| primeira pessoa | 0,73 (30) | 0,91 (25) | 1,49 (22) | 0,00 (16) |
| número na 1ª frase | 1,03 (368) | 1,01 (223) | 1,01 (73) | 1,17 (61) |
| abre país/marca/nome | 1,14 (150) | 1,13 (241) | 1,25 (168) | 1,07 (76) |
| sub-hook causal | **1,79** (44) | **0,95** (48) | 1,44 (16) | 1,67 (14) |
| nostalgia | 1,43 (46) | (3) | (5) | (2) |
| império / fatura N bi | 0,95 (95) | 0,84 (24) | (1) | (3) |

Em demonstração, por nome no hook:
- conhecido: 34% (aj. 1,25)
- sem nome: **19% (aj. 0,73, IC 0,50–0,96)**

Isso apoia "abrir com a marca, não com 'Esse novo recurso'".

**Mudanças de sinal que importam:**
1. **"acabou de" não funciona em história** (1,03). Funciona em mecanismo, demonstração e panorama, que é exatamente o que o CRUZAMENTO propôs.
2. **O sub-hook causal é forte em história (1,79) e neutro em mecanismo (0,95).** Em mecanismo, a promessa "existe um motivo" já é o próprio modo, então ela não diferencia.
3. **"Esse/Essa" só ajuda em mecanismo.** Em demonstração e panorama atrapalha.
4. **A pergunta só é ruim em panorama.**
5. A primeira pessoa positiva em demonstração (n=22) é provavelmente ruído.

---

## 3. O que mudar nas skills e na camada comum

### Firme (n alto, IC fora de 1, vale sem a Izabela e na maioria dos clientes)
1. **`agents/hook.md`, "Duas frases":** manter a forma (fato estranho + promessa). Acrescentar que o objetivo medido é o subhook: queda ≤17 pontos depois de um hook forte acerta 77% (contra 41%) no roteiro da casa e em todos os modos. **Não** vale transformar isso em "proibido contexto depois do hook": o dado não mostra efeito de contexto (§2b). A contradição apontada com `mecanismo.md` l.32 e `demonstracao.md` l.34 **cai**.
2. **`agents/hook.md`, especificidade:** "acabou de" + marca ou nome como sujeito, quando há fato recente. Vale em mecanismo, demonstração e panorama; **não em história** (1,03).
3. **`agents/hook.md`, mecanismos:** conflito com sujeito nomeado ("declarou guerra", humilhou, entrou em pânico) é o vocabulário que mais sobe (guerra 1,79, 2,05 sem a Izabela; conflito 1,42). Evitar Desafio de Crença + Viés de Negatividade (0,25; n=21, mas é a mesma direção do original).
4. **`agents/hook.md`, número:** manter "número exato não separa hook bom de ruim" (0,96 a 1,02).
5. **`agents/hook.md`, sentimento:** o hook não abre por credencial ou autoridade (0,57).

### Sinal (direção consistente, n ou IC fracos): entra como preferência, não como critério de eliminação
6. **`agents/hook.md` l.66-67, "Esse/Essa":** manter o ponto negativo. No roteiro da casa a abertura é neutra no geral (0,98), ruim em IA (0,57) e em 3 clientes grandes. A contradição do CRUZAMENTO **cai**. Exceção possível: `mecanismo.md` (1,34; n=65).
7. **Pergunta:** não eliminar (0,89 e quase neutra; 5 de 8 clientes acertam mais com ela). O exemplo Yopa pode ficar. Em `panorama.md`, evitar abrir com pergunta (0,47; n=23).
8. **Primeira pessoa e "Você" na abertura:** manter "evitar" (0,77 e 0,72). Quase não ocorre no roteiro.
9. **"Combine 2 mecanismos do playbook":** não usar como regra (inverteu: 1 MGC 23,5% contra 2 MGCs 21,7%). Basta um mecanismo bem nomeado, e o critério "nomear qual mecanismo está usando" já cobre isso.
10. **`panorama.md` l.52 ("o dado maior"):** **não trocar** por "país ou marca agindo". Proposta: "a primeira frase traz o dado maior **ou** o país como sujeito agindo. Abertura sem nenhum dos dois cai (15% contra 22%). Marca ou pessoa famosa abrindo panorama rende menos (0,62 a 0,90)".
11. **`historia.md` l.56 (segunda frase):** preferir a promessa causal ("e o motivo…", "e o segredo…", "e a culpada foi…"): 1,79 com n=44. O personagem descrito por lugar e traço ("uma avó do interior…") rende tanto quanto o nome, ou mais (1,30). Não proibir nome desconhecido. Manter "não entregar o nome como revelação" só como regra qualitativa (n=13).
12. **`historia.md`, "de X a império que fatura N bi":** não proibir em geral (0,95 em história; neutro no geral). É ruim em Case, Ciência, IA e Finanças, e bom em Empreend./Mkt (Germano, Cadu Neiva). Vai para o **perfil do cliente**, não para a skill.
13. **`demonstracao.md` l.54:** "abrir com o nome da marca ou do produto, não com 'Esse novo recurso'". O apoio é demonstração sem nome 0,73 contra conhecido 1,25 e "Esse/Essa" 0,86. Com fato recente, "acabou de" (1,64; n=84).
14. **Anti-padrões** (lista numerada, acusar o espectador, "Imagina", contexto de série, "Se você"): podem ficar na lista de eliminação do `hook.md`, porque são baratos e não há nada contra. Mas a evidência vem de cortes de podcast. No roteiro da casa, quase não existem (n de 1 a 30).
15. **Nostalgia** (1,43 em história) e **"Esse/Essa + objeto"** (Germano, Grazino, Rafael) vão para o perfil do cliente, não para a skill.

## Limitações
- Observacional: pauta, cliente, edição e momento da notícia não estão no texto. O lift ajustado por cliente e o bootstrap por cliente reduzem o problema, mas não eliminam.
- As regex são aproximações. Seis definições não puderam ser reproduzidas exatamente (§0).
- A retenção existe para 1.146 vídeos IG `sim` (19 clientes, sem o IG de Rodrigo Waughan). Por modo, os grupos têm de 11 a 61 vídeos na faixa hook ≥71.
- O rótulo de modo vem de LLM (estudo de modos, confiança média ou alta). `publi`, `conselho` e `misto` ficaram de fora (107 vídeos IG).
- O texto do roteiro (B1) vem do cache do estudo 2026-10 (`scripts.json` e `segmentos.json`, exportados do CRM em 17/10), não de uma query nova.
