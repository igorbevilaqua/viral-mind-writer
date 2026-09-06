# Estudo 2026-09 — o que os dados sustentam sobre hook, estrutura, comando, tema e comunicação

Gerado em 2026-09-06T18:30:57.490Z por `scripts/study-lift.ts` (plano 020, WP-D). Todo número deste arquivo está em `lift.json`.

## 0. Base e regras aplicadas

| fonte | n |
|---|---|
| `oraculo.fato_video` (MV) | 11327 |
| analisáveis (ano 2026, não maturando, views>0, com cliente e plataforma) | 9657 |
| `vm_video_classifications` | 7702 |
| rotulados em hook e em estrato com n≥8 (IG) | 5229 (2619) |
| rotulados em estrutura e em estrato com n≥8 (IG) | 3238 (1701) |
| rotulados em comando e em estrato com n≥8 (IG) | 1212 (1043) |
| rotulados em tema e em estrato com n≥8 (IG) | 6674 (3258) |
| `text-metrics.json` corpus / Codex | 10299 / 158 |
| `vm_generated_scripts` | 158 |
| `vm_script_matches` confirmados (posts / roteiros) | 36 / 14 |

Regras do pré-registro (plano 020) aplicadas sem exceção:

- Métrica primária `coeficiente_viral` (views ÷ mediana móvel 180d do mesmo canal e origem). `maturando=true` e views nulas/0 excluídos.
- `top` = quartil superior **dentro do estrato (cliente, plataforma)**, calculado sobre o conjunto rotulado na dimensão, estratos com n≥8. P(top)=0,25 por construção. Estrato primário Instagram; demais plataformas em tabela à parte (mesmo roteiro em IG/TT/YT são vídeos de estratos diferentes — não se somam).
- Lift = P(top | rótulo) / 0,25, Wilson 95%. n<10 suprimido; 10–29 encolhido `(k+0,25·20)/(n+20)` com flag `baixa_confianca`; ≥30 publica. IC cruzando 1 = **sem evidência**. Multi-rótulo marginal.
- Comando medido no eixo `seguidores_ganhos` (regra de `agents/dados.md`), não em coeficiente.
- `dominancia` = maior fatia de um cliente no rótulo (>50% em negrito); `consistencia` = clientes (n≥8 no rótulo) com P(top)>0,25 / clientes avaliados.
- Matriz estrutura × tema: encolhimento aditivo K=15 para `clamp(p_tema+p_estr−0,25, .05, .95)`; só células n≥15 são lidas.
- Comunicação: Cliff's delta top vs bottom quartil (mesmo estrato); por cliente só com n_top,n_bot≥15; pool ponderado por n. Vira regra só com |δ|≥0,2, mesmo sinal em ≥2/3 dos clientes **e** replicação em holdout temporal — o holdout ainda não existe (é o que se publica a partir de agora).
- Codex vs humanos: controles do mesmo cliente e plataforma, ±45d, `vm_script='sim'`, ≥8 controles; nenhuma afirmação com <40 roteiros.

Viés de seleção do rótulo: o classificador LLM priorizou `vm_script='sim'` e extremos. Se o quartil fosse calculado na população inteira, a fração de top entre os rotulados seria hook 26%, estrutura 25%, comando 30%, tema 25% — por isso o quartil é recalculado dentro do conjunto rotulado.

Concordância de hook Oráculo × classificador antigo do Codex (`vm_hook_classifications`), na interseção: **não medida nesta rodada** (a tabela já tinha sido dropada pela 0042 quando o script rodou). O seed do WP-C registrou 52% em 766 hooks (número do plano 020, não desta execução) — acima de 45%, mas perto: hook por cliente só com n≥40 e aviso de ruído. Estruturas rotuladas: 1367 via Oráculo + 2006 via LLM; hook: 6029 Oráculo + 83 Codex-07; comando: 6448.

## 1. Lift global por rótulo

### 1.1 Instagram (estrato primário)

#### Mecanismo de hook (coeficiente_viral) — Instagram

| rótulo | n | k | lift [IC95] | flag | leitura | dominância | consistência |
|---|---|---|---|---|---|---|---|
| Contraste Extremo | 953 | 247 | 1.04 [0.93–1.15] | ok | sem evidência | 11% | 12/22 |
| Outro | 529 | 110 | 0.83 [0.70–0.98] | ok | lift<1 | 22% | 5/15 |
| Revelação Secreta | 426 | 105 | 0.99 [0.83–1.16] | ok | sem evidência | 12% | 7/18 |
| Ultra Especificidade | 423 | 107 | 1.01 [0.86–1.19] | ok | sem evidência | 12% | 7/17 |
| Desafio de Crença | 402 | 92 | 0.92 [0.76–1.09] | ok | sem evidência | 11% | 7/19 |
| Superlativo | 323 | 89 | 1.10 [0.92–1.31] | ok | sem evidência | 12% | 8/12 |
| Viés de Negatividade | 296 | 70 | 0.95 [0.77–1.15] | ok | sem evidência | 14% | 6/15 |
| Conflito Declarado | 130 | 44 | 1.35 [1.05–1.69] | ok | lift>1 | 19% | 4/5 |
| Urgência | 113 | 32 | 1.13 [0.83–1.49] | ok | sem evidência | 19% | 5/5 |
| Elemento Controverso | 102 | 32 | 1.25 [0.93–1.64] | ok | sem evidência | 13% | 1/4 |
| Apelo à Autoridade | 86 | 20 | 0.93 [0.62–1.33] | ok | sem evidência | 20% | 1/3 |
| Viés de Ilegalidade | 59 | 14 | 0.95 [0.59–1.44] | ok | sem evidência | 22% | 0/2 |
| Apelo Histórico | 44 | 11 | 1.00 [0.58–1.58] | ok | sem evidência | 14% | 0/0 |
| Ordem Contra-intuitiva | 35 | 8 | 0.91 [0.48–1.56] | ok | sem evidência | 14% | 0/0 |
| Apelo ao Esforço | 24 | 5 | 0.91 [0.51–1.48] | baixa_confianca | sem evidência | 21% | 0/0 |
| Apelo à Maioria | 23 | 4 | 0.84 [0.46–1.41] | baixa_confianca | sem evidência | 17% | 0/0 |

Suprimidos (n<10): nenhum.

#### Estrutura narrativa (coeficiente_viral) — Instagram

| rótulo | n | k | lift [IC95] | flag | leitura | dominância | consistência |
|---|---|---|---|---|---|---|---|
| E2 Inovação & Sacada Genial | 433 | 114 | 1.05 [0.90–1.23] | ok | sem evidência | 13% | 8/15 |
| C2 Estratégia Oculta | 399 | 94 | 0.94 [0.79–1.12] | ok | sem evidência | 14% | 5/18 |
| A1 Jornada do Herói | 397 | 90 | 0.91 [0.75–1.08] | ok | sem evidência | 18% | 3/14 |
| E1 Paradoxo Contraintuitivo | 308 | 83 | 1.08 [0.89–1.29] | ok | sem evidência | 10% | 10/20 |
| A2 Herói Improvável | 208 | 59 | 1.14 [0.91–1.39] | ok | sem evidência | 28% | 4/6 |
| B1 Davi e Golias | 195 | 61 | 1.25 [1.01–1.52] | ok | lift>1 | 15% | 6/10 |
| D1 Urgência & Alerta | 191 | 46 | 0.96 [0.74–1.23] | ok | sem evidência | 21% | 5/9 |
| C1 O Iconoclasta | 174 | 40 | 0.92 [0.69–1.19] | ok | sem evidência | 12% | 5/9 |
| D2 Evento Global | 133 | 37 | 1.11 [0.84–1.44] | ok | sem evidência | 35% | 1/4 |
| C3 Investigação & Escândalo | 131 | 28 | 0.85 [0.61–1.17] | ok | sem evidência | 17% | 3/8 |
| B3 Queda do Gigante | 130 | 29 | 0.89 [0.64–1.21] | ok | sem evidência | 19% | 3/5 |
| D3 Efeito Dominó | 115 | 32 | 1.11 [0.82–1.47] | ok | sem evidência | 26% | 2/3 |
| F1 Erro Fatal | 90 | 13 | 0.58 [0.35–0.93] | ok | lift<1 | 19% | 1/5 |
| A3 Herói Esquecido | 74 | 21 | 1.14 [0.78–1.58] | ok | sem evidência | 23% | 3/5 |
| F2 Dois Mundos | 67 | 18 | 1.07 [0.71–1.54] | ok | sem evidência | 24% | 1/4 |
| E3 Narrativa Filosófica | 45 | 8 | 0.71 [0.37–1.25] | ok | sem evidência | 16% | 0/0 |
| B2 Conflito Imprevisível | 34 | 7 | 0.82 [0.41–1.47] | ok | sem evidência | 21% | 0/0 |
| F3 O Profeta Ignorado | 18 | 4 | 0.95 [0.52–1.57] | baixa_confianca | sem evidência | 39% | 0/0 |
| F4 Transformação de Identidade | 15 | 3 | 0.91 [0.48–1.56] | baixa_confianca | sem evidência | 13% | 0/0 |

Suprimidos (n<10): nenhum.

#### Gatilho de comando (eixo: seguidores_ganhos) — Instagram

| rótulo | n | k | lift [IC95] | flag | leitura | dominância | consistência |
|---|---|---|---|---|---|---|---|
| Gatilho de Benefício Percebido | 758 | 176 | 0.93 [0.81–1.05] | ok | sem evidência | 16% | 4/14 |
| Gatilho de Expectativa | 328 | 93 | 1.13 [0.95–1.34] | ok | sem evidência | 22% | 9/10 |
| Gatilho de Autoridade | 205 | 47 | 0.92 [0.71–1.17] | ok | sem evidência | 14% | 4/10 |
| Gatilho da Comunicação | 81 | 19 | 0.94 [0.62–1.35] | ok | sem evidência | 28% | 2/5 |
| Gatilho de Exclusividade | 42 | 15 | 1.43 [0.92–2.03] | ok | sem evidência | 33% | 1/1 |
| Gatilho do Propósito/Altruísmo | 20 | 7 | 1.20 [0.72–1.82] | baixa_confianca | sem evidência | 25% | 0/0 |
| Gatilho do Inimigo em Comum | 13 | 3 | 0.97 [0.51–1.64] | baixa_confianca | sem evidência | 39% | 0/0 |

Suprimidos (n<10): Pergunta (6).

#### Tema (coeficiente_viral) — 15 maiores por n — Instagram

| rótulo | n | k | lift [IC95] | flag | leitura | dominância | consistência |
|---|---|---|---|---|---|---|---|
| CASE EMPRESARIAL | 334 | 90 | 1.08 [0.90–1.28] | ok | sem evidência | 13% | 8/13 |
| MARKETING | 263 | 56 | 0.85 [0.67–1.06] | ok | sem evidência | 31% | 2/7 |
| ECONOMIA | 208 | 47 | 0.90 [0.70–1.15] | ok | sem evidência | 26% | 3/9 |
| EDUCAÇÃO | 192 | 33 | 0.69 [0.50–0.93] | ok | lift<1 | 29% | 3/7 |
| INTELIGÊNCIA ARTIFICIAL | 178 | 35 | 0.79 [0.58–1.04] | ok | sem evidência | 34% | 0/5 |
| HISTÓRIA DE EMPRESA/EMPRESÁRIO | 152 | 41 | 1.08 [0.82–1.38] | ok | sem evidência | 28% | 5/7 |
| BRANDING | 129 | 27 | 0.84 [0.59–1.15] | ok | sem evidência | 15% | 3/7 |
| NEGÓCIOS | 102 | 21 | 0.82 [0.56–1.18] | ok | sem evidência | 28% | 2/4 |
| CIÊNCIA E INOVAÇÃO | 99 | 34 | 1.37 [1.03–1.76] | ok | lift>1 | 30% | 3/4 |
| ENTRETENIMENTO | 87 | 24 | 1.10 [0.77–1.51] | ok | sem evidência | 32% | 2/4 |
| E-COMMERCE | 80 | 20 | 1.00 [0.67–1.42] | ok | sem evidência | **85%** (Thiago Franco) | 0/1 |
| DIREITO | 80 | 21 | 1.05 [0.71–1.47] | ok | sem evidência | 39% | 0/3 |
| INOVAÇÃO | 68 | 23 | 1.35 [0.95–1.83] | ok | sem evidência | 21% | 3/4 |
| CURIOSIDADES | 66 | 17 | 1.03 [0.67–1.50] | ok | sem evidência | 38% | 0/2 |
| ESPORTES | 60 | 18 | 1.20 [0.80–1.70] | ok | sem evidência | 30% | 1/2 |

Suprimidos (n<10): nenhum.

### 1.2 Demais plataformas (TikTok, YouTube, Facebook — top dentro de cada estrato, agregados)

#### Mecanismo de hook (coeficiente_viral) — outras plataformas

| rótulo | n | k | lift [IC95] | flag | leitura | dominância | consistência |
|---|---|---|---|---|---|---|---|
| Contraste Extremo | 1127 | 310 | 1.10 [1.00–1.21] | ok | sem evidência | 13% | 11/18 |
| Revelação Secreta | 538 | 122 | 0.91 [0.77–1.06] | ok | sem evidência | 17% | 3/13 |
| Ultra Especificidade | 495 | 136 | 1.10 [0.95–1.26] | ok | sem evidência | 14% | 7/14 |
| Desafio de Crença | 391 | 79 | 0.81 [0.66–0.98] | ok | lift<1 | 14% | 5/13 |
| Superlativo | 375 | 90 | 0.96 [0.80–1.14] | ok | sem evidência | 13% | 4/11 |
| Viés de Negatividade | 342 | 68 | 0.80 [0.64–0.98] | ok | lift<1 | 19% | 2/12 |
| Outro | 239 | 35 | 0.59 [0.43–0.79] | ok | lift<1 | 20% | 1/10 |
| Conflito Declarado | 193 | 60 | 1.24 [1.00–1.52] | ok | sem evidência | 25% | 4/6 |
| Urgência | 154 | 53 | 1.38 [1.09–1.69] | ok | lift>1 | 25% | 4/6 |
| Elemento Controverso | 116 | 39 | 1.34 [1.03–1.71] | ok | lift>1 | 19% | 3/6 |
| Viés de Ilegalidade | 93 | 29 | 1.25 [0.91–1.65] | ok | sem evidência | 33% | 1/2 |
| Apelo à Autoridade | 78 | 27 | 1.39 [1.00–1.83] | ok | sem evidência | 36% | 2/2 |
| Apelo Histórico | 60 | 11 | 0.73 [0.42–1.20] | ok | sem evidência | 15% | 0/1 |
| Ordem Contra-intuitiva | 24 | 3 | 0.73 [0.38–1.28] | baixa_confianca | sem evidência | 25% | 0/0 |
| Apelo à Maioria | 23 | 1 | 0.56 [0.26–1.09] | baixa_confianca | sem evidência | 39% | 0/1 |
| Apelo ao Esforço | 21 | 2 | 0.68 [0.34–1.25] | baixa_confianca | sem evidência | 33% | 0/0 |

Suprimidos (n<10): nenhum.

#### Estrutura narrativa (coeficiente_viral) — outras plataformas

| rótulo | n | k | lift [IC95] | flag | leitura | dominância | consistência |
|---|---|---|---|---|---|---|---|
| E2 Inovação & Sacada Genial | 518 | 127 | 0.98 [0.84–1.14] | ok | sem evidência | 24% | 5/13 |
| C2 Estratégia Oculta | 353 | 87 | 0.99 [0.82–1.18] | ok | sem evidência | 18% | 6/15 |
| A1 Jornada do Herói | 277 | 66 | 0.95 [0.77–1.17] | ok | sem evidência | 13% | 6/13 |
| E1 Paradoxo Contraintuitivo | 239 | 55 | 0.92 [0.72–1.15] | ok | sem evidência | 17% | 4/12 |
| A2 Herói Improvável | 236 | 58 | 0.98 [0.78–1.22] | ok | sem evidência | 38% | 4/7 |
| C1 O Iconoclasta | 217 | 49 | 0.90 [0.70–1.14] | ok | sem evidência | 15% | 5/10 |
| D1 Urgência & Alerta | 197 | 44 | 0.89 [0.68–1.15] | ok | sem evidência | 35% | 3/7 |
| B1 Davi e Golias | 190 | 52 | 1.09 [0.86–1.36] | ok | sem evidência | 17% | 6/9 |
| C3 Investigação & Escândalo | 169 | 32 | 0.76 [0.55–1.02] | ok | sem evidência | 23% | 0/8 |
| D2 Evento Global | 159 | 42 | 1.06 [0.81–1.35] | ok | sem evidência | 29% | 2/5 |
| B3 Queda do Gigante | 148 | 38 | 1.03 [0.77–1.33] | ok | sem evidência | 16% | 2/6 |
| F1 Erro Fatal | 100 | 21 | 0.84 [0.57–1.20] | ok | sem evidência | 21% | 1/5 |
| A3 Herói Esquecido | 95 | 18 | 0.76 [0.49–1.12] | ok | sem evidência | 33% | 0/3 |
| D3 Efeito Dominó | 68 | 13 | 0.77 [0.46–1.20] | ok | sem evidência | 28% | 1/3 |
| F2 Dois Mundos | 50 | 10 | 0.80 [0.45–1.32] | ok | sem evidência | **58%** (Lincoln Fracari) | 0/1 |
| B2 Conflito Imprevisível | 44 | 15 | 1.36 [0.88–1.95] | ok | sem evidência | 32% | 1/1 |
| E3 Narrativa Filosófica | 24 | 5 | 0.91 [0.51–1.48] | baixa_confianca | sem evidência | 25% | 0/0 |
| F4 Transformação de Identidade | 20 | 3 | 0.80 [0.42–1.39] | baixa_confianca | sem evidência | 20% | 0/0 |
| F3 O Profeta Ignorado | 17 | 5 | 1.08 [0.62–1.72] | baixa_confianca | sem evidência | 47% | 0/1 |

Suprimidos (n<10): nenhum.

#### Gatilho de comando (eixo: seguidores_ganhos) — outras plataformas

| rótulo | n | k | lift [IC95] | flag | leitura | dominância | consistência |
|---|---|---|---|---|---|---|---|
| Gatilho de Benefício Percebido | 121 | 30 | 0.99 [0.72–1.33] | ok | sem evidência | **78%** (Rodrigo Waughan) | 2/3 |
| Gatilho de Autoridade | 63 | 18 | 1.14 [0.76–1.63] | ok | sem evidência | **81%** (Rodrigo Waughan) | 1/2 |
| Gatilho de Expectativa | 53 | 15 | 1.13 [0.72–1.66] | ok | sem evidência | **89%** (Rodrigo Waughan) | 1/1 |
| Gatilho da Comunicação | 13 | 7 | 1.46 [0.89–2.13] | baixa_confianca | sem evidência | **77%** (Rodrigo Waughan) | 1/1 |

Suprimidos (n<10): Gatilho de Exclusividade (4), Gatilho do Propósito/Altruísmo (1).

#### Tema (coeficiente_viral) — 15 maiores por n — outras plataformas

| rótulo | n | k | lift [IC95] | flag | leitura | dominância | consistência |
|---|---|---|---|---|---|---|---|
| CASE EMPRESARIAL | 425 | 84 | 0.79 [0.65–0.95] | ok | lift<1 | 16% | 4/14 |
| ECONOMIA | 236 | 68 | 1.15 [0.94–1.40] | ok | sem evidência | 30% | 5/9 |
| EDUCAÇÃO | 189 | 24 | 0.51 [0.35–0.73] | ok | lift<1 | 49% | 0/7 |
| BRANDING | 163 | 24 | 0.59 [0.40–0.84] | ok | lift<1 | 20% | 1/7 |
| MARKETING | 159 | 45 | 1.13 [0.88–1.43] | ok | sem evidência | 28% | 3/6 |
| CIÊNCIA E INOVAÇÃO | 157 | 42 | 1.07 [0.82–1.37] | ok | sem evidência | 36% | 3/4 |
| INTELIGÊNCIA ARTIFICIAL | 145 | 36 | 0.99 [0.74–1.30] | ok | sem evidência | **68%** (Izabela Anholett) | 1/3 |
| HISTÓRIA DE EMPRESA/EMPRESÁRIO | 133 | 32 | 0.96 [0.70–1.28] | ok | sem evidência | 15% | 2/7 |
| E-COMMERCE | 119 | 23 | 0.77 [0.53–1.09] | ok | sem evidência | **87%** (Thiago Franco) | 0/1 |
| INOVAÇÃO | 92 | 35 | 1.52 [1.15–1.93] | ok | lift>1 | 34% | 3/3 |
| CHINA | 76 | 21 | 1.10 [0.75–1.54] | ok | sem evidência | **84%** (Lincoln Fracari) | 0/1 |
| NEGÓCIOS | 76 | 12 | 0.63 [0.37–1.02] | ok | sem evidência | 36% | 1/4 |
| DICAS DE USO DE IA | 69 | 22 | 1.27 [0.88–1.74] | ok | sem evidência | **83%** (Izabela Anholett) | 1/2 |
| DIREITO | 66 | 10 | 0.61 [0.34–1.03] | ok | sem evidência | 41% | 0/2 |
| CARREIRA | 62 | 17 | 1.10 [0.71–1.58] | ok | sem evidência | 27% | 1/3 |

Suprimidos (n<10): nenhum.

## 2. Por cliente

Clientes com ≥40 vídeos rotulados (qualquer dimensão) têm briefing próprio em `briefing-<cliente>.md`; rótulos com n≥8 aparecem com flag. Todas as plataformas entram (o estrato continua por plataforma).

| cliente | vídeos rotulados | hook | estrutura | comando | tema | briefing |
|---|---|---|---|---|---|---|
| Lincoln Fracari | 754 | 634 | 248 | 9 | 754 | briefing-lincoln-fracari.md |
| Izabela Anholett | 635 | 506 | 372 | 166 | 635 | briefing-izabela-anholett.md |
| Rodrigo Waughan | 555 | 444 | 202 | 238 | 554 | briefing-rodrigo-waughan.md |
| Rafael Rodrigues | 484 | 355 | 316 | 79 | 484 | briefing-rafael-rodrigues.md |
| Thiago Franco | 474 | 422 | 242 | 144 | 474 | briefing-thiago-franco.md |
| Marcelo Germano | 401 | 379 | 120 | 43 | 400 | briefing-marcelo-germano.md |
| Marcos Pelozato | 342 | 236 | 140 | 38 | 342 | briefing-marcos-pelozato.md |
| Cadu Neiva | 339 | 249 | 108 | 0 | 338 | briefing-cadu-neiva.md |
| Fernando Pereira | 333 | 282 | 204 | 111 | 333 | briefing-fernando-pereira.md |
| Marcio Grazino | 322 | 249 | 232 | 69 | 322 | briefing-marcio-grazino.md |
| Dilson Peres | 290 | 264 | 169 | 72 | 290 | briefing-dilson-peres.md |
| Manoel Victor | 283 | 266 | 143 | 87 | 283 | briefing-manoel-victor.md |
| Franklin Tomich | 247 | 174 | 129 | 24 | 240 | briefing-franklin-tomich.md |
| Renato Torres | 193 | 131 | 79 | 0 | 193 | briefing-renato-torres.md |
| Pedro Elero | 150 | 90 | 86 | 17 | 150 | briefing-pedro-elero.md |
| Leonardo Cirino | 116 | 64 | 69 | 0 | 114 | briefing-leonardo-cirino.md |
| Drielle Castelani | 103 | 78 | 76 | 41 | 103 | briefing-drielle-castelani.md |
| João Paulo Albuquerque | 88 | 30 | 67 | 25 | 88 | briefing-joao-paulo-albuquerque.md |
| João Felipe Marques | 85 | 67 | 51 | 0 | 85 | briefing-joao-felipe-marques.md |
| Leonardo Nogueira | 82 | 68 | 63 | 29 | 82 | briefing-leonardo-nogueira.md |
| Lerry Granville | 74 | 72 | 0 | 0 | 74 | briefing-lerry-granville.md |
| Ricardo Schumacher | 72 | 41 | 42 | 12 | 72 | briefing-ricardo-schumacher.md |
| Caio Lima | 65 | 58 | 0 | 0 | 58 | briefing-caio-lima.md |
| Renato Mendes | 57 | 0 | 32 | 0 | 57 | briefing-renato-mendes.md |
| Patrick Diorio | 44 | 18 | 29 | 8 | 44 | briefing-patrick-diorio.md |
| Café com Ferri | 42 | 0 | 8 | 0 | 42 | briefing-cafe-com-ferri.md |
| Igor Bevilaqua | 39 | 39 | 0 | 0 | 39 | sem dado |
| José Securato | 13 | 13 | 0 | 0 | 13 | sem dado |
| Túlio Lichenstein | 11 | 0 | 11 | 0 | 11 | sem dado |
| Leonardo Martins | 4 | 0 | 0 | 0 | 0 | sem dado |
| Thainá Iansen | 3 | 0 | 0 | 0 | 0 | sem dado |

Sem dado (5): Igor Bevilaqua (39), José Securato (13), Túlio Lichenstein (11), Leonardo Martins (4), Thainá Iansen (3).

## 3. Matriz estrutura × tema

Arquivo completo: `matriz-estrutura-tema.md` (3238 vídeos com estrutura e tema; 15 temas). Células n≥15 com Wilson inferior do p bruto acima de 0,25: C2 Estratégia Oculta × BRASIL: 43% encolhido (bruto 56%, n=18, k=10); A2 Herói Improvável × INOVAÇÃO: 40% encolhido (bruto 44%, n=25, k=11); A2 Herói Improvável × CIÊNCIA E INOVAÇÃO: 36% encolhido (bruto 38%, n=66, k=25); D1 Urgência & Alerta × E-COMMERCE: 36% encolhido (bruto 46%, n=26, k=12).

| estrutura | tema | n | k | p bruto | p encolhido | prior |
|---|---|---|---|---|---|---|
| C2 Estratégia Oculta | BRASIL | 18 | 10 | 56% | 43% | 27% |
| A2 Herói Improvável | INOVAÇÃO | 25 | 11 | 44% | 40% | 33% |
| B1 Davi e Golias | CIÊNCIA E INOVAÇÃO | 31 | 12 | 39% | 37% | 33% |
| A2 Herói Improvável | CIÊNCIA E INOVAÇÃO | 66 | 25 | 38% | 36% | 30% |
| D1 Urgência & Alerta | E-COMMERCE | 26 | 12 | 46% | 36% | 19% |
| B1 Davi e Golias | ECONOMIA | 16 | 7 | 44% | 36% | 28% |
| B1 Davi e Golias | INOVAÇÃO | 17 | 6 | 35% | 36% | 36% |
| E2 Inovação & Sacada Genial | CHINA | 23 | 9 | 39% | 35% | 29% |
| A1 Jornada do Herói | CIÊNCIA E INOVAÇÃO | 28 | 11 | 39% | 35% | 27% |
| B1 Davi e Golias | BRANDING | 32 | 12 | 38% | 35% | 28% |
| E1 Paradoxo Contraintuitivo | CHINA | 19 | 7 | 37% | 34% | 29% |
| E2 Inovação & Sacada Genial | INOVAÇÃO | 89 | 30 | 34% | 33% | 32% |
| D2 Evento Global | CHINA | 27 | 9 | 33% | 33% | 31% |
| B3 Queda do Gigante | E-COMMERCE | 22 | 9 | 41% | 32% | 20% |
| F3 O Profeta Ignorado | CIÊNCIA E INOVAÇÃO | 15 | 5 | 33% | 31% | 30% |
| E2 Inovação & Sacada Genial | CIÊNCIA E INOVAÇÃO | 95 | 30 | 32% | 31% | 29% |
| D2 Evento Global | BRASIL | 16 | 5 | 31% | 31% | 30% |
| E2 Inovação & Sacada Genial | DICAS DE USO DE IA | 37 | 12 | 32% | 30% | 25% |
| D1 Urgência & Alerta | INTELIGÊNCIA ARTIFICIAL | 28 | 9 | 32% | 30% | 25% |
| A2 Herói Improvável | HISTÓRIA DE EMPRESA/EMPRESÁRIO | 90 | 27 | 30% | 29% | 25% |
| D2 Evento Global | INTELIGÊNCIA ARTIFICIAL | 17 | 5 | 29% | 29% | 29% |
| C2 Estratégia Oculta | CASE EMPRESARIAL | 229 | 66 | 29% | 29% | 24% |
| F2 Dois Mundos | CHINA | 21 | 6 | 29% | 28% | 28% |
| D2 Evento Global | ECONOMIA | 70 | 20 | 29% | 28% | 25% |
| B1 Davi e Golias | CASE EMPRESARIAL | 72 | 20 | 28% | 28% | 29% |
| C3 Investigação & Escândalo | INTELIGÊNCIA ARTIFICIAL | 15 | 5 | 33% | 28% | 22% |
| E2 Inovação & Sacada Genial | ESTRATÉGIA DE NEGÓCIO | 19 | 6 | 32% | 28% | 22% |
| E2 Inovação & Sacada Genial | HISTÓRIA DE EMPRESA/EMPRESÁRIO | 36 | 10 | 28% | 27% | 24% |
| C1 O Iconoclasta | ECONOMIA | 27 | 8 | 30% | 27% | 21% |
| E2 Inovação & Sacada Genial | INTELIGÊNCIA ARTIFICIAL | 35 | 9 | 26% | 26% | 27% |
| A3 Herói Esquecido | CIÊNCIA E INOVAÇÃO | 35 | 9 | 26% | 26% | 27% |
| E1 Paradoxo Contraintuitivo | BRANDING | 73 | 19 | 26% | 26% | 24% |
| B1 Davi e Golias | EDUCAÇÃO | 29 | 8 | 28% | 26% | 21% |
| C2 Estratégia Oculta | ESTRATÉGIA DE NEGÓCIO | 17 | 5 | 29% | 26% | 21% |
| A2 Herói Improvável | CASE EMPRESARIAL | 48 | 12 | 25% | 25% | 26% |
| E2 Inovação & Sacada Genial | BRASIL | 18 | 4 | 22% | 25% | 28% |
| A1 Jornada do Herói | CARREIRA | 15 | 4 | 27% | 25% | 23% |
| D2 Evento Global | E-COMMERCE | 15 | 4 | 27% | 25% | 23% |
| C2 Estratégia Oculta | ECONOMIA | 35 | 9 | 26% | 25% | 22% |
| E1 Paradoxo Contraintuitivo | EDUCAÇÃO | 16 | 5 | 31% | 25% | 17% |
| A1 Jornada do Herói | BRANDING | 72 | 18 | 25% | 25% | 22% |
| E1 Paradoxo Contraintuitivo | CARREIRA | 25 | 6 | 24% | 24% | 25% |
| A3 Herói Esquecido | HISTÓRIA DE EMPRESA/EMPRESÁRIO | 19 | 5 | 26% | 24% | 22% |
| C2 Estratégia Oculta | BRANDING | 100 | 24 | 24% | 24% | 23% |
| D1 Urgência & Alerta | CARREIRA | 29 | 7 | 24% | 24% | 23% |
| D3 Efeito Dominó | ECONOMIA | 46 | 11 | 24% | 24% | 23% |
| D3 Efeito Dominó | E-COMMERCE | 32 | 8 | 25% | 24% | 20% |
| A1 Jornada do Herói | HISTÓRIA DE EMPRESA/EMPRESÁRIO | 161 | 38 | 24% | 23% | 22% |
| E1 Paradoxo Contraintuitivo | ECONOMIA | 26 | 6 | 23% | 23% | 24% |
| B3 Queda do Gigante | HISTÓRIA DE EMPRESA/EMPRESÁRIO | 30 | 7 | 23% | 23% | 23% |
| F1 Erro Fatal | CASE EMPRESARIAL | 62 | 15 | 24% | 23% | 18% |
| C1 O Iconoclasta | BRANDING | 30 | 7 | 23% | 23% | 22% |
| C1 O Iconoclasta | CARREIRA | 22 | 5 | 23% | 23% | 23% |
| E1 Paradoxo Contraintuitivo | HISTÓRIA DE EMPRESA/EMPRESÁRIO | 23 | 5 | 22% | 22% | 24% |
| D1 Urgência & Alerta | ECONOMIA | 53 | 12 | 23% | 22% | 22% |
| E2 Inovação & Sacada Genial | CASE EMPRESARIAL | 176 | 39 | 22% | 22% | 25% |
| A1 Jornada do Herói | CASE EMPRESARIAL | 153 | 34 | 22% | 22% | 23% |
| B3 Queda do Gigante | CASE EMPRESARIAL | 82 | 18 | 22% | 22% | 24% |
| E1 Paradoxo Contraintuitivo | CASE EMPRESARIAL | 128 | 28 | 22% | 22% | 25% |
| C1 O Iconoclasta | CASE EMPRESARIAL | 59 | 13 | 22% | 22% | 22% |
| B3 Queda do Gigante | ECONOMIA | 23 | 5 | 22% | 22% | 22% |
| E2 Inovação & Sacada Genial | BRANDING | 76 | 16 | 21% | 22% | 24% |
| C2 Estratégia Oculta | HISTÓRIA DE EMPRESA/EMPRESÁRIO | 38 | 8 | 21% | 21% | 22% |
| A1 Jornada do Herói | ESTRATÉGIA DE NEGÓCIO | 28 | 6 | 21% | 21% | 20% |
| E1 Paradoxo Contraintuitivo | E-COMMERCE | 24 | 5 | 21% | 21% | 21% |
| C1 O Iconoclasta | EDUCAÇÃO | 20 | 5 | 25% | 21% | 15% |
| A2 Herói Improvável | BRANDING | 18 | 3 | 17% | 21% | 25% |
| B1 Davi e Golias | E-COMMERCE | 19 | 3 | 16% | 20% | 25% |
| C1 O Iconoclasta | CHINA | 26 | 4 | 15% | 20% | 27% |
| B1 Davi e Golias | HISTÓRIA DE EMPRESA/EMPRESÁRIO | 22 | 3 | 14% | 19% | 28% |
| A1 Jornada do Herói | E-COMMERCE | 26 | 5 | 19% | 19% | 19% |
| A2 Herói Improvável | AGRONEGÓCIO | 22 | 4 | 18% | 17% | 16% |
| D1 Urgência & Alerta | CASE EMPRESARIAL | 17 | 2 | 12% | 17% | 23% |
| C2 Estratégia Oculta | E-COMMERCE | 44 | 7 | 16% | 17% | 20% |
| E2 Inovação & Sacada Genial | EDUCAÇÃO | 48 | 8 | 17% | 17% | 17% |
| F1 Erro Fatal | HISTÓRIA DE EMPRESA/EMPRESÁRIO | 18 | 3 | 17% | 17% | 16% |
| E2 Inovação & Sacada Genial | AGRONEGÓCIO | 31 | 5 | 16% | 16% | 15% |
| E2 Inovação & Sacada Genial | E-COMMERCE | 25 | 3 | 12% | 15% | 21% |
| C3 Investigação & Escândalo | CASE EMPRESARIAL | 50 | 7 | 14% | 15% | 20% |
| A1 Jornada do Herói | EDUCAÇÃO | 34 | 5 | 15% | 15% | 15% |
| F1 Erro Fatal | BRANDING | 16 | 2 | 13% | 15% | 17% |
| A2 Herói Improvável | EDUCAÇÃO | 58 | 7 | 12% | 13% | 18% |
| A3 Herói Esquecido | EDUCAÇÃO | 22 | 2 | 9% | 12% | 15% |
| C3 Investigação & Escândalo | ECONOMIA | 21 | 1 | 5% | 10% | 18% |
| C2 Estratégia Oculta | AGRONEGÓCIO | 15 | 1 | 7% | 10% | 14% |

## 4. Comunicação (métricas de texto pré-registradas)

Corpus: 10299 textos (dedup por md5 do roteiro, feito no WP-B), 10290 em estratos com n≥8; top 2540 vs bottom 2540. Sem filtro de ano aqui: o JSON do WP-B não traz data (o corpus é 90% de 2026). `paragrafos` e `palavras_por_paragrafo_media` excluídas do corpus: a transcrição não tem quebra de parágrafo (`paragrafos=1`), só valem para o Codex.

### 4.1 Cliff's delta top vs bottom (δ>0 = a métrica é maior nos vídeos do quartil superior)

| métrica | mediana top | mediana bottom | δ global | δ pool ponderado (clientes) | mesmo sinal | leitura |
|---|---|---|---|---|---|---|
| palavras | 365.00 | 321.00 | 0.14 | 0.15 (28) | 20/28 | abaixo de 0,2 — não separa |
| frases | 21.00 | 19.00 | 0.10 | 0.09 (28) | 19/28 | abaixo de 0,2 — não separa |
| palavras_por_frase_media | 16.27 | 16.47 | -0.01 | -0.01 (28) | 17/28 | abaixo de 0,2 — não separa |
| palavras_por_frase_p90 | 27.00 | 28.00 | -0.02 | -0.02 (28) | 17/28 | abaixo de 0,2 — não separa |
| frases_curtas_pct | 10.00 | 10.00 | -0.01 | -0.01 (28) | 15/28 | abaixo de 0,2 — não separa |
| numeros_por_100_palavras | 1.17 | 0.97 | 0.07 | 0.06 (28) | 18/28 | abaixo de 0,2 — não separa |
| frases_com_numero_pct | 15.38 | 12.50 | 0.07 | 0.06 (28) | 15/28 | abaixo de 0,2 — não separa |
| voce_por_100 | 1.26 | 1.35 | -0.05 | -0.05 (28) | 15/28 | abaixo de 0,2 — não separa |
| eu_por_100 | 0.70 | 0.77 | -0.07 | -0.08 (28) | 18/28 | abaixo de 0,2 — não separa |
| nos_por_100 | 0.00 | 0.00 | -0.02 | -0.02 (28) | 17/28 | abaixo de 0,2 — não separa |
| perguntas_por_100_frases | 3.23 | 3.33 | -0.03 | -0.03 (28) | 14/28 | abaixo de 0,2 — não separa |
| imperativos_por_100_frases | 0.00 | 0.00 | 0.03 | 0.03 (28) | 17/28 | abaixo de 0,2 — não separa |
| magicas_por_100_palavras | 0.00 | 0.00 | 0.00 | 0.00 (28) | 17/28 | abaixo de 0,2 — não separa |
| nomes_proprios_por_100 | 3.87 | 3.34 | 0.10 | 0.09 (28) | 20/28 | abaixo de 0,2 — não separa |
| hook_palavras | 23.00 | 24.00 | 0.01 | 0.01 (28) | 14/28 | abaixo de 0,2 — não separa |
| hook_frases | 2.00 | 2.00 | 0.02 | 0.02 (28) | 16/28 | abaixo de 0,2 — não separa |
| hook_tem_numero | 0.00 | 0.00 | 0.02 | 0.02 (28) | 15/28 | abaixo de 0,2 — não separa |

Métricas com |δ global|≥0,2: **nenhuma**. Métricas que cumprem os dois primeiros critérios de regra (|δ pool|≥0,2 e mesmo sinal em ≥2/3 dos clientes): **nenhuma**. Holdout temporal: ainda não existe.

Por cliente (só n_top,n_bot≥15), δ por métrica:

| métrica | Marcos Pelozato (216/216) | Marcio Grazino (96/96) | Lincoln Fracari (252/252) | Ricardo Schumacher (25/25) | Lerry Granville (31/31) | Thiago Franco (152/152) | Marcelo Germano (144/144) | Leonardo Cirino (43/43) | Thainá Iansen (25/25) | Rafael Rodrigues (137/137) | Pedro Elero (56/56) | Rodrigo Waughan (174/174) | Izabela Anholett (187/187) | Patrick Diorio (25/25) | Fernando Pereira (109/109) | Renato Torres (104/104) | Manoel Victor (95/95) | Café com Ferri (54/54) | Cadu Neiva (187/187) | Dilson Peres (95/95) | João Paulo Albuquerque (34/34) | Franklin Tomich (73/73) | Leonardo Nogueira (23/23) | Renato Mendes (31/31) | João Felipe Marques (40/40) | Igor Bevilaqua (36/36) | Caio Lima (28/28) | Drielle Castelani (44/44) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| palavras | -0.04 | 0.11 | 0.30 | 0.36 | 0.07 | 0.22 | 0.48 | 0.10 | 0.25 | 0.42 | 0.26 | -0.12 | 0.36 | -0.02 | 0.15 | 0.00 | -0.00 | -0.08 | 0.15 | 0.02 | -0.07 | -0.14 | 0.17 | 0.23 | 0.15 | 0.07 | -0.21 | 0.28 |
| frases | -0.07 | 0.03 | 0.29 | 0.32 | 0.15 | -0.02 | 0.39 | -0.01 | 0.34 | 0.25 | 0.19 | -0.27 | 0.15 | -0.04 | 0.14 | 0.02 | 0.07 | 0.04 | 0.14 | 0.03 | -0.15 | -0.00 | 0.08 | 0.25 | 0.23 | -0.10 | -0.28 | 0.26 |
| palavras_por_frase_media | 0.06 | 0.08 | -0.01 | 0.29 | -0.16 | 0.18 | -0.15 | 0.03 | -0.07 | -0.03 | 0.03 | 0.12 | 0.10 | -0.03 | -0.08 | -0.06 | -0.11 | -0.29 | -0.07 | -0.08 | 0.14 | -0.28 | -0.10 | -0.32 | -0.11 | 0.10 | 0.21 | -0.06 |
| palavras_por_frase_p90 | -0.00 | 0.05 | -0.04 | 0.13 | -0.13 | 0.10 | -0.18 | 0.14 | -0.07 | 0.03 | -0.05 | 0.11 | 0.14 | 0.02 | -0.18 | -0.01 | -0.11 | -0.28 | -0.11 | -0.03 | 0.14 | -0.27 | -0.15 | -0.21 | -0.05 | 0.07 | 0.25 | -0.08 |
| frases_curtas_pct | -0.11 | -0.01 | 0.04 | -0.01 | 0.10 | -0.17 | 0.06 | -0.12 | -0.24 | -0.08 | 0.05 | -0.09 | -0.05 | 0.02 | -0.04 | 0.29 | 0.10 | 0.16 | -0.01 | 0.02 | 0.08 | 0.10 | -0.02 | -0.02 | 0.09 | -0.04 | -0.25 | 0.13 |
| numeros_por_100_palavras | 0.04 | -0.07 | 0.28 | 0.39 | 0.11 | 0.03 | 0.28 | 0.43 | 0.07 | 0.05 | 0.16 | -0.10 | 0.06 | -0.37 | 0.03 | -0.13 | 0.07 | -0.14 | 0.08 | 0.01 | -0.19 | -0.04 | 0.17 | 0.34 | 0.35 | -0.14 | -0.19 | -0.05 |
| frases_com_numero_pct | 0.05 | -0.10 | 0.23 | 0.36 | 0.09 | 0.13 | 0.23 | 0.39 | -0.01 | 0.18 | 0.15 | -0.03 | 0.11 | -0.37 | -0.06 | -0.10 | 0.04 | -0.18 | 0.05 | -0.02 | -0.23 | -0.18 | 0.28 | 0.28 | 0.28 | -0.20 | -0.14 | -0.01 |
| voce_por_100 | -0.15 | -0.12 | -0.21 | 0.16 | -0.25 | -0.16 | -0.15 | 0.07 | -0.22 | 0.11 | 0.18 | 0.02 | 0.00 | -0.13 | -0.02 | 0.10 | -0.04 | -0.15 | 0.06 | 0.06 | 0.07 | 0.08 | -0.18 | 0.13 | 0.25 | -0.20 | -0.33 | -0.39 |
| eu_por_100 | -0.07 | 0.04 | -0.15 | -0.05 | -0.34 | -0.05 | -0.20 | -0.09 | 0.04 | -0.27 | 0.10 | -0.12 | -0.10 | 0.02 | -0.12 | 0.28 | 0.04 | -0.03 | -0.19 | 0.08 | 0.08 | 0.21 | 0.19 | -0.31 | -0.19 | -0.31 | -0.02 | -0.14 |
| nos_por_100 | -0.10 | 0.32 | -0.02 | -0.21 | 0.17 | -0.06 | -0.21 | -0.14 | 0.10 | -0.04 | 0.00 | 0.05 | 0.13 | -0.04 | -0.07 | -0.00 | -0.03 | -0.17 | -0.14 | 0.04 | 0.03 | 0.05 | -0.02 | -0.45 | -0.00 | 0.18 | -0.09 | 0.09 |
| perguntas_por_100_frases | -0.10 | -0.03 | -0.06 | -0.21 | 0.01 | -0.24 | -0.06 | -0.03 | -0.40 | 0.04 | -0.10 | -0.18 | 0.03 | -0.03 | 0.08 | 0.26 | 0.03 | 0.07 | -0.11 | 0.04 | 0.05 | 0.18 | 0.05 | -0.07 | 0.09 | -0.10 | 0.17 | 0.12 |
| imperativos_por_100_frases | -0.01 | 0.18 | 0.12 | 0.25 | 0.07 | 0.02 | 0.06 | -0.01 | -0.01 | -0.11 | 0.28 | -0.02 | -0.00 | 0.15 | -0.02 | -0.05 | 0.01 | 0.02 | 0.00 | -0.02 | -0.03 | 0.05 | 0.03 | 0.22 | -0.05 | 0.16 | 0.12 | 0.09 |
| magicas_por_100_palavras | -0.14 | 0.09 | 0.05 | 0.10 | 0.04 | 0.09 | 0.18 | 0.06 | 0.25 | 0.06 | 0.20 | -0.12 | -0.13 | -0.22 | -0.11 | -0.21 | 0.08 | -0.23 | 0.08 | 0.09 | -0.14 | -0.06 | 0.16 | -0.01 | 0.11 | -0.06 | 0.11 | 0.21 |
| nomes_proprios_por_100 | -0.11 | 0.07 | 0.21 | 0.33 | -0.12 | 0.29 | 0.28 | 0.04 | 0.47 | -0.07 | 0.19 | -0.13 | 0.10 | -0.21 | 0.16 | -0.01 | 0.06 | 0.15 | 0.16 | 0.02 | -0.04 | 0.03 | -0.02 | 0.30 | 0.29 | 0.14 | 0.14 | 0.25 |
| hook_palavras | 0.09 | 0.10 | 0.09 | -0.17 | -0.21 | -0.09 | 0.22 | 0.22 | -0.07 | -0.23 | 0.13 | -0.08 | 0.09 | 0.09 | 0.09 | -0.05 | -0.08 | -0.11 | 0.02 | -0.07 | -0.06 | -0.08 | 0.23 | -0.19 | 0.13 | -0.42 | 0.23 | 0.01 |
| hook_frases | 0.03 | 0.02 | 0.06 | -0.08 | -0.10 | -0.07 | 0.19 | 0.12 | -0.09 | -0.14 | 0.07 | -0.01 | -0.04 | 0.26 | 0.16 | 0.08 | 0.08 | -0.05 | -0.05 | 0.08 | -0.07 | 0.01 | 0.09 | 0.01 | -0.10 | -0.30 | 0.02 | 0.10 |
| hook_tem_numero | 0.14 | -0.03 | 0.10 | 0.04 | 0.02 | 0.02 | 0.17 | 0.30 | -0.04 | 0.02 | 0.02 | -0.00 | -0.10 | 0.00 | 0.03 | -0.10 | 0.08 | 0.00 | -0.01 | -0.07 | -0.16 | -0.13 | 0.13 | 0.04 | 0.24 | -0.09 | -0.06 | 0.03 |

### 4.2 Codex (158) vs humanos VM (`vm_script='sim'`) vs próprio (`'nao'`)

| métrica | mediana Codex | mediana VM | mediana próprio | δ Codex−VM | δ Codex−próprio |
|---|---|---|---|---|---|
| palavras | 345.00 | 385.00 | 236.00 | -0.32 | 0.36 |
| frases | 24.00 | 22.00 | 15.00 | 0.16 | 0.38 |
| palavras_por_frase_media | 14.83 | 17.25 | 14.89 | -0.44 | -0.02 |
| palavras_por_frase_p90 | 25.00 | 28.00 | 26.00 | -0.32 | -0.11 |
| frases_curtas_pct | 11.76 | 6.25 | 15.91 | 0.33 | -0.15 |
| numeros_por_100_palavras | 2.87 | 1.40 | 0.63 | 0.57 | 0.68 |
| frases_com_numero_pct | 29.03 | 19.23 | 7.69 | 0.36 | 0.61 |
| voce_por_100 | 0.73 | 1.05 | 1.78 | -0.27 | -0.43 |
| eu_por_100 | 0.00 | 0.67 | 0.92 | -0.93 | -0.73 |
| nos_por_100 | 0.00 | 0.00 | 0.00 | -0.06 | -0.35 |
| perguntas_por_100_frases | 0.00 | 0.00 | 7.69 | -0.03 | -0.47 |
| imperativos_por_100_frases | 0.00 | 0.00 | 0.00 | -0.04 | 0.07 |
| magicas_por_100_palavras | 0.00 | 0.24 | 0.00 | -0.11 | 0.14 |
| nomes_proprios_por_100 | 3.78 | 4.27 | 2.42 | -0.06 | 0.34 |
| hook_palavras | 26.00 | 23.00 | 23.00 | 0.24 | 0.19 |
| hook_frases | 2.00 | 1.00 | 2.00 | 0.38 | 0.23 |
| hook_tem_numero | 1.00 | 0.00 | 0.00 | 0.22 | 0.28 |
| paragrafos (só Codex) | 11.00 | – | – | – | – |
| palavras_por_paragrafo_media (só Codex) | 28.21 | – | – | – | – |

n: Codex 158, VM 5090, próprio 5204. Isto descreve como o Codex escreve diferente; não diz se isso é bom — a seção 4.1 é que mede o que separa top de bottom.

## 5. Codex: onde ele está concentrado e o que aconteceu com o que foi publicado

Roteiros: **158** (`vm_generated_scripts`); com `hook_mecanismo` no trace: 145; com estrutura escolhida: 156.

### 5.1 Mecanismo de hook: Codex vs corpus

| rótulo | Codex n | Codex % | prevalência corpus IG | lift corpus IG [IC95] |
|---|---|---|---|---|
| Contraste Extremo | 135 | 93% | 36% | 1.04 [0.93–1.15] · ok · sem evidência |
| Revelação Secreta | 9 | 6% | 16% | 0.99 [0.83–1.16] · ok · sem evidência |
| Conflito Declarado | 1 | 1% | 5% | 1.35 [1.05–1.69] · ok · lift>1 |

Mecanismos com lift_lb>1 no corpus IG que o Codex usou ≤3 vezes: Conflito Declarado (1.35 [1.05–1.69], n=130, Codex 1×).

### 5.2 Estrutura narrativa: Codex vs corpus

| rótulo | Codex n | Codex % | prevalência corpus IG | lift corpus IG [IC95] |
|---|---|---|---|---|
| C1 O Iconoclasta | 36 | 23% | 10% | 0.92 [0.69–1.19] · ok · sem evidência |
| C2 Estratégia Oculta | 20 | 13% | 23% | 0.94 [0.79–1.12] · ok · sem evidência |
| E1 Paradoxo Contraintuitivo | 19 | 12% | 18% | 1.08 [0.89–1.29] · ok · sem evidência |
| D3 Efeito Dominó | 12 | 8% | 7% | 1.11 [0.82–1.47] · ok · sem evidência |
| B1 Davi e Golias | 10 | 6% | 11% | 1.25 [1.01–1.52] · ok · lift>1 |
| C3 Investigação & Escândalo | 10 | 6% | 8% | 0.85 [0.61–1.17] · ok · sem evidência |
| A1 Jornada do Herói | 8 | 5% | 23% | 0.91 [0.75–1.08] · ok · sem evidência |
| B2 Conflito Imprevisível | 7 | 4% | 2% | 0.82 [0.41–1.47] · ok · sem evidência |
| F2 Dois Mundos | 7 | 4% | 4% | 1.07 [0.71–1.54] · ok · sem evidência |
| D1 Urgência & Alerta | 7 | 4% | 11% | 0.96 [0.74–1.23] · ok · sem evidência |
| F1 Erro Fatal | 6 | 4% | 5% | 0.58 [0.35–0.93] · ok · lift<1 |
| A3 Herói Esquecido | 4 | 3% | 4% | 1.14 [0.78–1.58] · ok · sem evidência |
| E2 Inovação & Sacada Genial | 3 | 2% | 25% | 1.05 [0.90–1.23] · ok · sem evidência |
| B3 Queda do Gigante | 2 | 1% | 8% | 0.89 [0.64–1.21] · ok · sem evidência |
| D2 Evento Global | 2 | 1% | 8% | 1.11 [0.84–1.44] · ok · sem evidência |
| E3 Narrativa Filosófica | 2 | 1% | 3% | 0.71 [0.37–1.25] · ok · sem evidência |
| A2 Herói Improvável | 1 | 1% | 12% | 1.14 [0.91–1.39] · ok · sem evidência |

Estruturas com lift_lb>1 no corpus IG que o Codex usou ≤3 vezes: nenhuma.

### 5.3 Taxa de publicação (casamento confirmado em `vm_script_matches`)

**14/158 roteiros** (9%) casaram com vídeo publicado; 36 posts em 4 plataformas. Viés de seleção registrado: quem escolhe o que publica é o cliente/Igor, então "publicado" já é um filtro. Roteiros publicados com hook e corpo reescritos ficam fora por construção (teto do WP-A).

| cliente | roteiros | casados | taxa |
|---|---|---|---|
| sem cliente | 27 | 0 | 0% |
| Franklin Tomich | 22 | 0 | 0% |
| Fernando Pereira | 18 | 3 | 17% |
| Túlio Lichenstein | 18 | 2 | 11% |
| Ricardo Schumacher | 14 | 0 | 0% |
| Marcos Pelozato | 9 | 1 | 11% |
| Pedro Elero | 7 | 1 | 14% |
| Izabela Anholett | 7 | 1 | 14% |
| João Paulo Albuquerque | 6 | 1 | 17% |
| Renato Mendes | 5 | 2 | 40% |
| Lincoln Fracari | 4 | 0 | 0% |
| Patrick Diorio | 4 | 1 | 25% |
| Leonardo Cirino | 4 | 1 | 25% |
| Marcio Grazino | 2 | 0 | 0% |
| Igor Bevilaqua | 2 | 0 | 0% |
| Café com Ferri | 2 | 0 | 0% |
| Drielle Castelani | 1 | 0 | 0% |
| Marcelo Germano | 1 | 0 | 0% |
| Dilson Peres | 1 | 0 | 0% |
| Thiago Franco | 1 | 0 | 0% |
| Rodrigo Waughan | 1 | 0 | 0% |
| Rafael Rodrigues | 1 | 0 | 0% |
| Thainá Iansen | 1 | 1 | 100% |

### 5.4 Os roteiros casados: coeficiente_viral, classificação e percentil vs controles

Controles = vídeos do mesmo cliente e plataforma, ±45 dias, `vm_script='sim'`, não maturando, fora dos casados; percentil só com ≥8 controles; percentil do roteiro = média dos seus posts. Dos 36 posts, 31 estão em `fato_video` (5 ausentes — vídeo sem métrica na MV) e 7 ainda maturando.

| cliente | hook Codex | estrutura | predicted | posts (plataforma: coef · classif · pct vs n ctrl) | coef mediano | pct roteiro |
|---|---|---|---|---|---|---|
| Fernando Pereira | Revelação Secreta | D3 | 93 | Facebook: fora da MV<br>TikTok: 129.06 · outlier · 100% vs 37<br>Instagram: 5.85 · normal · 93% vs 45 | 129.06 | 97% |
| Pedro Elero | Contraste Extremo | C2 | 45 | Instagram: 89.66 · outlier · 98% vs 45<br>TikTok: 435.53 · outlier · 98% vs 45<br>YouTube: 1.12 · normal · 36% vs 42 | 89.66 | 77% |
| Fernando Pereira | Revelação Secreta | D3 | 83 | TikTok: 1.28 · normal · 65% vs 40<br>Facebook: fora da MV<br>Instagram: 56.91 · outlier · 100% vs 48 | 56.91 | 83% |
| Leonardo Cirino | Contraste Extremo | C2 | – | Facebook: fora da MV<br>Instagram: 25.76 · outlier · 100% vs 31 | 25.76 | 100% |
| Marcos Pelozato | Contraste Extremo | D1 | – | TikTok: 1330.74 · outlier · 100% vs 61<br>Instagram: 23.52 · outlier · 100% vs 66<br>YouTube: 11.71 · outlier · 83% vs 35 | 23.52 | 94% |
| Thainá Iansen | Contraste Extremo | E1 | – | TikTok: 10.20 · normal · sem pct (1 ctrl)<br>YouTube: 2.51 · normal · sem pct (1 ctrl)<br>Facebook: fora da MV<br>Instagram: 30.78 · normal · sem pct (6 ctrl) | 10.20 | – |
| Fernando Pereira | Revelação Secreta | D3 | 88 | Facebook: fora da MV<br>TikTok: 2.52 · normal · 69% vs 32<br>Instagram: 1.64 · normal · 80% vs 41 | 2.52 | 75% |
| Túlio Lichenstein | Contraste Extremo | E1 | – | Instagram: 1.31 · normal · 61% vs 18 | 1.31 | 61% |
| João Paulo Albuquerque | Contraste Extremo | C1 | 82 | Instagram: 0.84 · normal · 39% vs 38<br>TikTok: 1.14 · normal · 46% vs 37<br>YouTube: 0.38 · normal · 15% vs 26 | 0.84 | 34% |
| Izabela Anholett | Contraste Extremo | C2 | – | Facebook: 0.72 · normal · 52% vs 42<br>Instagram: 1.16 · normal · 31% vs 48<br>TikTok: 0.51 · normal · 20% vs 47 | 0.72 | 35% |
| Patrick Diorio | Contraste Extremo | C1 | – | Instagram: 0.63 · normal · 31% vs 52 | 0.63 | 31% |
| Túlio Lichenstein | Contraste Extremo | C1 | 78 | Instagram: 2.64 · normal · maturando · sem pct (0 ctrl) | – | – |
| Renato Mendes | Contraste Extremo | E1 | – | TikTok: 92.66 · normal · maturando · sem pct (0 ctrl)<br>Instagram: 25.39 · normal · maturando · sem pct (0 ctrl)<br>YouTube: 0.87 · normal · maturando · sem pct (0 ctrl) | – | – |
| Renato Mendes | Contraste Extremo | A1 | – | TikTok: 1.93 · normal · maturando · sem pct (0 ctrl)<br>Instagram: 1.31 · normal · maturando · sem pct (0 ctrl)<br>YouTube: 0.61 · normal · maturando · sem pct (0 ctrl) | – | – |

**Codex vs humanos VM:** 10 roteiros com percentil; 7 acima da mediana dos controles → P(pct_roteiro>0.5) = 0.70 [Wilson 0.40–0.89]; percentil mediano 77%. Com 10 roteiros (pré-registro exige ≥40 no total e ≥20 por cliente) o enunciado é **"sem evidência de melhor/pior"**. Isto é descrição, não veredito.

### 5.5 `predicted_score` vs coeficiente real (só descrição)

`predicted_score` existe em 105 roteiros (quartis 78/85/88). Pares (predicted, coef mediano real) entre os casados: 93→129.06, 88→2.52, 83→56.91, 82→0.84, 45→89.66. A faixa de predicted é estreita e n é pequeno; não há leitura estatística a fazer.

### 5.6 Os roteiros editados por humano

25 roteiros com `edicao_humana`; `changedRatio` (fração da massa de palavras alterada, `lib/learning-loop.ts`) entre `roteiro_original` e `roteiro`: quartis 0.11 / 0.19 / 0.33; 2 com ≥50% alterado, 6 com <10%. Editados que casaram com vídeo publicado: 4/25 (vs 14/158 no total).

| cliente | changedRatio | casado |
|---|---|---|
| sem cliente | 0.52 | não |
| Lincoln Fracari | 0.51 | não |
| Lincoln Fracari | 0.44 | não |
| Fernando Pereira | 0.38 | sim |
| Pedro Elero | 0.36 | sim |
| Túlio Lichenstein | 0.34 | não |
| sem cliente | 0.33 | não |
| Renato Mendes | 0.29 | sim |
| João Paulo Albuquerque | 0.26 | não |
| Marcos Pelozato | 0.23 | não |
| sem cliente | 0.23 | não |
| Túlio Lichenstein | 0.21 | não |
| João Paulo Albuquerque | 0.19 | não |
| Patrick Diorio | 0.18 | não |
| sem cliente | 0.18 | não |
| Marcio Grazino | 0.17 | não |
| João Paulo Albuquerque | 0.14 | sim |
| João Paulo Albuquerque | 0.13 | não |
| sem cliente | 0.11 | não |
| Pedro Elero | 0.07 | não |
| Túlio Lichenstein | 0.06 | não |
| Pedro Elero | 0.05 | não |
| sem cliente | 0.04 | não |
| Patrick Diorio | 0.02 | não |
| Marcos Pelozato | 0.01 | não |

`vm_script_feedback`: 8 linhas, 5 com rating (4, 5, 1, 1, 4). Sem massa para análise.

### 5.7 Codex vs canal (Fase 4, corte 2026-09-06)

Unidade = roteiro (mediana dos posts maduros em `coeficiente_viral`; `maturando` fora); acerto = coef ≥ 1.5, o mesmo limiar da `classificacao='acerto'` da MV. Pré/pós pelo `created_at` do roteiro. Semana = segunda-feira ISO.

| semana | roteiros maduros | posts | coef mediano | % acerto |
|---|---|---|---|---|
| 2026-07-27 | 2 | 5 | 59.38 | 100% |
| 2026-08-03 | 4 | 7 | 1.08 | 25% |
| 2026-08-10 | 2 | 5 | 12.8 | 100% |
| 2026-08-17 | 1 | 3 | 0.72 | 0% |
| 2026-08-24 | 2 | 4 | 17.98 | 100% |

| período | roteiros maduros | posts | coef mediano | % acerto | gerados | top mecanismo (share) | estruturas distintas | few-shot cliente |
|---|---|---|---|---|---|---|---|---|
| pré | 11 | 24 | 10.2 | 64% | 157 | Contraste Extremo (93%) | 17 | – |
| pós | 0 | 0 | – | – | 1 | Contraste Extremo (100%) | 1 | – |

Processo (últimos 30 roteiros, casados ou não): Contraste Extremo 100%, 13 estruturas distintas, few-shot por cliente –.

**Veredito (regra fixa: n<30 = sem dado; pós ≥1.15× pré e acerto não cai = melhorou; ≤0.87× = piorou):** sem dado suficiente (n=0 de 60).

## 6. Conclusões

1. **Ranking por lift no Instagram.** Rótulos com lift_lb>1 e n≥30 — hook: Conflito Declarado 1.35 [1.05–1.69] n=130, consistência 4/5. Estrutura: B1 Davi e Golias 1.25 [1.01–1.52] n=195, consistência 6/10. Comando (seguidores): nenhum. Tema: CIÊNCIA E INOVAÇÃO 1.37 [1.03–1.76] n=99, consistência 3/4. Rótulos com lift_ub<1 e n≥30 — hook: Outro 0.83 [0.70–0.98] n=529; estrutura: F1 Erro Fatal 0.58 [0.35–0.93] n=90; comando: nenhum; tema: EDUCAÇÃO 0.69 [0.50–0.93] n=192. O que NÃO permite dizer: causalidade (o rótulo acompanha tema, cliente e época) e nada por cliente sem o n do briefing.

2. **Contraste Extremo.** No corpus IG: 1.04 [0.93–1.15], n=953, sem evidência; prevalência 36%. No Codex: 135/145 (93%). O dado não sustenta a concentração: o mecanismo mais usado pelo Codex não tem lift>1 confirmado. Não permite dizer que outro mecanismo daria resultado melhor no Codex — mede-se prevalência e lift no corpus, não experimento.

3. **Estruturas do Codex.** Top 3 (C1 O Iconoclasta 36, C2 Estratégia Oculta 20, E1 Paradoxo Contraintuitivo 19) = 48% dos 156; seus lifts no corpus IG: C1 0.92 [0.69–1.19], n=174, sem evidência; C2 0.94 [0.79–1.12], n=399, sem evidência; E1 1.08 [0.89–1.29], n=308, sem evidência. Estruturas com lift_lb>1 pouco usadas: nenhuma. Não permite dizer que trocar a estrutura muda o resultado de um roteiro específico: a estrutura é escolhida por tema e premissa.

4. **Matriz estrutura × tema.** 4 células n≥15 com Wilson inferior acima da base (C2×BRASIL 43%, A2×INOVAÇÃO 40%, A2×CIÊNCIA E INOVAÇÃO 36%, D1×E-COMMERCE 36%). Bases pequenas (n 15–60): são hipóteses para a PARTE 2-B, não regra.

5. **Comunicação.** 0 métrica(s) com |δ global|≥0,2 (nenhuma); 0 cumprem o critério de consistência entre clientes. Maior |δ| global: palavras 0.14 (mesmo sinal em 20/28 clientes) — a direção existe, a magnitude fica abaixo do limiar pré-registrado. Nenhuma métrica de texto separa top de bottom no corpus no tamanho exigido: comprimento de frase, números, pronomes e perguntas não distinguem quem viraliza — o que separa está no tema/premissa/execução, não na forma medida. Codex vs VM (4.2) descreve diferença de estilo, não mérito.

6. **Codex vs humanos VM.** 10 roteiros com percentil, P(pct>0,5)=0.70 [0.40–0.89]. **Sem evidência de melhor/pior.** Taxa de publicação 14/158 (9%) é a métrica que existe. Não permite ranking de clientes nem de mecanismos pelo resultado dos casados.

7. **Edição humana.** 25 editados, changedRatio mediano 0.19; 4 deles publicados. Não permite dizer que edição melhora resultado (n).

## 7. Recomendações para a Fase 3 (por WP) e STOPs

- **STOP "nenhum rótulo com lift_lb>1 e n≥30 no global" (hook/estrutura/comando):** não disparou, mas por margem mínima — hook: Conflito Declarado 1.35 [1.05–1.69] n=130, consistência 4/5; estrutura: B1 Davi e Golias 1.25 [1.01–1.52] n=195, consistência 6/10; comando: nenhum. Foram testados 16 mecanismos, 19 estruturas e 8 gatilhos; a 95% espera-se ~1.1 falso positivo unilateral entre eles. Um rótulo por dimensão com lb entre 1,01 e 1,05 é evidência fraca: entra no ranking, não vira regra.
- **STOP "concordância de hook <45%":** não medido.
- **STOP WP-H "nenhuma célula lift_lb>1 n≥15":** não disparou (4 células) — insight `estrutura_tema_lift` e proposta `active:false` podem ser emitidos só para essas células.
- **STOP WP-K "≥2 métricas |δ|≥0,2 replicadas":** **DISPAROU** — WP-K não existe; nenhum alvo de comunicação no prompt.

- **WP-F (selectHook: lift + anti-colapso):** rankScore = lift_lb coloca Conflito Declarado (lb 1.05, n=130) no topo e Contraste Extremo (lb 0.93) no meio do pelotão — mas com um único mecanismo acima de 1 o anti-colapso é a parte que importa, senão o Codex troca 93% de Contraste Extremo por 93% de outro. Contraste Extremo em 93% dos roteiros é o alvo de processo (<50% em 4 semanas). Nas outras plataformas o topo é outro (Urgência e Elemento Controverso, seção 1.2) — o ranking é do estrato Instagram, como pré-registrado.
- **WP-G (few-shot por cliente):** independente do lift; entra. A tabela por cliente mostra n suficiente para few-shot local em 26 clientes.
- **WP-H (matriz no storytelling):** só as 4 células listadas na seção 3, como proposta `active:false`.
- **WP-I (lições por cliente, lift_lb≥1,2 n≥8):** candidatas nos briefings: Lincoln Fracari: GEOPOLÍTICA 1.85 [1.28–2.45] n=41, ok; Izabela Anholett: Conflito Declarado 1.84 [1.40–2.29] n=74, ok; Izabela Anholett: INOVAÇÃO 2.31 [1.73–2.84] n=45, ok; Marcelo Germano: Revelação Secreta 2.17 [1.53–2.78] n=35, ok; Fernando Pereira: Urgência 1.80 [1.23–2.41] n=40, ok. Sempre `active:false`.
- **WP-J (medir):** o percentil vs controles (5.4) é a estatística; hoje 10 roteiros. Critério de parada: 60 roteiros maduros ou 16 semanas.

Divergências entre o plano e o dado medido aqui estão registradas nas seções 0 (viés de seleção do rótulo), 3 e 4 — nada foi ajustado para "dar certo".
