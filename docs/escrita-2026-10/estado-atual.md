# Estado atual: o que já existe sobre qualidade de escrita no Codex (11/10/2026)

Síntese só de leitura. Repo: `/Users/igorbevilaqua/Projetos/CODEX - Viral Mind`. Banco: `qclvrddrqulgfzccndnl`.
Objetivo: não duplicar trabalho no plano novo de escrita para viralização.

Régua do estudo de outubro (vale para todos os números abaixo): "topo" = quartil de cima do coeficiente viral dentro de cliente x rede x trimestre (base 26%). OR = Mantel-Haenszel por cliente x rede (no corpo, também por faixa de tamanho; "estrito" = + roteirista). "Replica" = IC do lift e do OR fora de 1 e mesmo sinal antes e depois de 01/07/2026. Base: 2.809 roteiros VM do CRM (texto escrito, em parágrafos), 6.305 vídeos IG/TT/YT. Retenção (3s, subhook, final) só tem volume no Instagram.

---

## 1. Estudo 2026-10 (`docs/estudo-2026-10/`, NÃO commitado: está como `??` no git)

### 1.1 Corpo, ritmo, tamanho, estilo (`achados/corpo/achados.md`)

Replicam (regra):
- **Tamanho: 450 a 500 palavras faladas** OR 1,39 [1,15 a 1,69]; resiste a modelagem (1,45) e roteirista (1,35); 14 de 19 clientes. **<300 palavras** OR 0,70 (<250: 0,67). 500+ cai (0,65, só 113 vídeos, teto provável). Por rede: IG 450 a 500 (OR 1,48); YT 400 a 500 (ganho a partir de 380); TT qualquer coisa de 350 a 500 (só sair de <300 importa). Tecnologia: 500+ desaba (OR 0,27, 34 vídeos). Hoje a mediana da casa é 386 e só 12% chegam a 450.
- **Ritmo de fala real 3,07 palavras/s** (450 = 147 s). A conversão do checklist (430 = 180 s) está errada. Duração com palavras fixas: 150 a 180 s ajuda IG (OR 1,43) e TT (OR 1,85); TT <100 s derruba (0,57).
- **Parágrafo de até 35 palavras**: ret_final IG OR 1,57 (1,42 com controle de tamanho), replica; algum parágrafo >45: ret_final OR 0,60, replica. Viralização: OR ctl 1,20 sem replicação formal. 16 a 18 parágrafos: OR 1,26, replica. 80% dos roteiros da casa violam o teto.
- **Biografia/origem em ordem derruba** ("nasceu em", "trabalhava como", "no início", "percebeu que", "foi aí que", "tudo começou"): 1 marcador OR estrito 0,80; **2+ OR 0,63** (3 redes, 9 de 12 clientes); 3+ OR 0,40. "Foi aí que / foi quando" sozinho OR 0,78. Mesmo fenômeno do rótulo A1 Jornada do Herói (OR 0,61, replica).
- **"Ou seja," traduzindo fato em consequência** (bolso, país, mercado): OR ctl 1,36, estrito 1,39; abrindo a frase, estrito 1,30; 17 de 20 clientes; IG 1,51. Não vale quando usado para definir jargão. Neutro em Dinheiro (1,05).
- **"Pra você ter ideia," + número/comparação**: OR ctl 1,25 com número na frase (replica); não funciona em Dinheiro.
- **Nomes próprios densos no corpo** (7+ por 100 palavras): OR estrito 1,20, replica, 14 de 21 clientes; corpo pobre (<=3/100) derruba ret_final (0,69). Vale em Dinheiro (1,68) e Negócios (1,41); **não em Tecnologia (0,96)**.
- **Exatamente 1 ano citado no corpo** (data âncora): OR estrito 1,18; 2 a 3 anos: 0,87; curva não monotônica (média confiança).
- **Uma pergunta completa (com verbo) no corpo**: OR estrito 1,21, comentários 1,23. Zero perguntas derruba comentários (0,78). 3+ perguntas: estrito 1,44.
- **Enumeração "Primeiro: ... Segundo: ..."** para várias causas: OR 1,58 (só 51 roteiros; média confiança).
- **Retenção final IG**: "Anos/meses depois" OR 1,91 e "Até que" OR 1,76 (substitutos do "foi aí que"); pelo menos 1 virada "mas/só que" a cada 100 palavras (sem isso ret_final 0,61; viralização estrito 0,85). "Então/por isso" (o "Therefore") é neutro: o que segura é o "mas".
- **"Você" frequente no corpo** (0,6+/100 palavras): ret_final IG OR 0,55, replica (viralização neutra). Narrar o corpo em 3ª pessoa; "você" no fim.

Regras do guia de estilo v4 contra o dado (tabela 2.3):
- Antítese "não é X, é Y": 1 é neutra; 2+ derruba ret_final (0,51). Afrouxar para "no máximo 1".
- Pergunta elíptica ("O resultado?"): derruba compartilhamento (OR 0,60). Manter proibição.
- Teto de 1 pergunta retórica: desmentido (trocar por "pelo menos 1 completa, nunca elíptica").
- Tricolon: 1 neutro, 2+ acerto 0,76. Afrouxar para "no máximo 1".
- "Não abra frases seguidas com E": desmentido; parágrafo abrindo com "E" ajuda compartilhamento (1,34) e comentários (1,28).
- "No máximo 3 frases longas seguidas": **sem efeito** (90% violam; nenhuma faixa separa). Ver item 3.4: está implementado em código.
- **Densidade de números por 100 palavras: neutra (1,02)**. "Especificidade" que separa é nome próprio e número traduzido, não número.
- Frase média curta, frases curtas, aspas, conectivo no início do parágrafo: neutros.

Conclusão (parágrafo antes do bloco final):
- **"Enquanto todo mundo X, [personagem] Y"** OR ctl 1,44, replica (acerto 1,50). Negócios (OR 1,95) e Dinheiro; **não Tecnologia (0,70)**.
- **Eco do hook** (20%+ das palavras de conteúdo do hook): OR 1,28, replica (TT 1,48).
- **"X nem sempre Y. Às vezes, Z."** ("nem" na conclusão): OR estrito 1,69, replica, 3 redes (89 roteiros).
- **Escala global no fecho** ("o mundo inteiro"): OR 1,33, replica; não em Dinheiro.
- **Antes x agora / fechar no estado atual do personagem**: ret_final OR 1,83; "fica no personagem" ret_final 1,56.
- Tamanho: 16 a 25 palavras; **<=15 derruba** (OR estrito 0,77, replica, 12 de 15 clientes).
- Derrubam: hesitação "pode ser/talvez" (estrito 0,65); "a diferença está em" (0,55); "você precisa / presta atenção" (0,65); "A lição é" (comentários 0,53); aforismo "Quem X, Y" (ret_final 0,42); "mas sim/e sim" (comentários 0,51).
- Comentário se compra no fim (custa alcance): pergunta de escolha (comentários 1,76), Brasil/governo (1,66), opinião do narrador em 1ª pessoa (2,61).
- Compartilhamento e salvamento: **nenhuma fórmula de conclusão replicou**.

Estruturas (rótulos de setembro): B1 Davi e Golias ajuda (OR 1,69, replica); A1 Jornada do Herói atrapalha (0,61, replica).

### 1.2 Hook e subhook (`achados/hooks/achados.md`)

Replicam (global, 3 redes salvo nota):
- **Abrir com "A/O + nome próprio"**: OR 1,51 [1,32 a 1,72]; ret_hook 1,83; 16 de 22 clientes. Nome sem artigo: 1,75.
- **Hook sem nenhum nome próprio**: OR 0,71 (32% da casa; 23 de 28 clientes).
- **"Acabou de"**: OR 1,87; "[Nome] acabou de": OR 1,96, ret_hook 3,64, 11 de 11 clientes. Ano em algarismo no hook: 0,51.
- **Conflito com os dois lados nomeados**: OR 1,96. Proibição/cancelamento por autoridade: 2,34 (29 roteiros). "Mas/enquanto" sozinhos: neutros.
- **Lugar concreto**: estrangeiro 1,63; China 1,81; marca chinesa 2,21; região do Brasil 1,85 (IG e TT; YT 1,01). "O Brasil..." na abertura: 0,72.
- **Famoso como sujeito**: 1,42. **Idade do personagem**: 1,46. **"tá"**: 1,93 (50 roteiros).
- **Derrubam**: abertura "Esse/Essa" 0,75 (ret_hook 0,63); "Esse cara" 0,63; "você" 0,78; "te" 0,59; IA sem sujeito nomeado 0,45; "empresa/marca" genérico 0,71; "nunca" 0,59; "pode/podem" 0,74; "bilionário" 0,66; "bilhão" 0,44; "vida/sonho" 0,42; palavra de 13+ letras 0,60; "!" (ret_hook 0,43).
- **Não separam**: número (redondo ou quebrado), dinheiro (só ajuda no YT), superlativo, "segredo", "quase ninguém", pergunta, tamanho do hook. "A especificidade que vende é de nome, lugar e idade, não de número."
- **Placar do hook** (+1 por bom, -1 por ruim): +2 = 39% topo (acerto 52%); -2 ou pior = 15% (31%). 40% dos hooks da casa estão no negativo. Por cliente: placar <= -1 derruba em 23 de 26 clientes.
- Instagram: hook de até 12 palavras perde os 3s (0,53); 2 frases 1,40. Tamanho não move viralização em rede nenhuma.
- **Subhook**: "Isso porque [nome] [fez]" depois de hook de 1 frase (1,51, mas concentrado em Izabela); "Essa é a [Nome]." (1,61, frágil); coletivo "eles" agindo (1,43). Evitar: abrir com cena "No Brasil, cerca de..." (0,66), biografia "fundada em" (0,69), "apenas/somente" (0,64). Subhook até 15 palavras depois de hook com nome: 1,29.

### 1.3 Payoff (`achados/payoff/achados.md`, rótulos LLM de 2.809 roteiros)

- **Disputa com lado** (dois nomes em guerra, texto toma partido): OR 2,09, replica, 3 redes e 3 nichos; só 3% da produção.
- **Orgulho com régua de fora** (Brasil x estrangeiro: 2,05; com gigante/rival: 2,45); orgulho "só Brasil" neutro (1,17). IG e TT, não YT.
- **Davi com Golias nomeado**: 1,89; herói sem antagonista: 1,08 (neutro).
- **Superação pura atrapalha**: 0,68 (3 redes); superação + porquê + lição de moral: 0,57. Tecnologia 0,44.
- **Vantagem/dica ao espectador**: alcance 0,62; salvamento TT 5,84. Hook que promete ensinar: 0,57.
- Cada payoff move uma métrica: comentário (revolta 2,70, nostalgia 2,27, orgulho 2,12); compartilhamento (orgulho 1,71, futuro 1,70, inspiração 1,58); queda do gigante derruba compartilhamento (0,42) e salvamento (0,14).
- Subhook que puxa o espectador ("Imagina você..."): 0,50, 26 clientes, 4 redes. Subhook que eleva a aposta com novo dado: 1,24.
- Antagonista rival 1,43 e gigante 1,37 ajudam; "problema" abstrato (crise, doença) 0,80. História só estrangeira sem ponte com o Brasil: 0,74.
- Fechamento por função: frase-síntese do caso, ret_final IG 2,07; consequência para o espectador, compartilhamento 1,42; pergunta, comentário 1,63; **lição de moral é o fecho de 46% dos vídeos e derruba comentário (0,68)**.
- Por nicho: queda do gigante e alerta funcionam em Dinheiro; revolta em Negócios.

### 1.4 Tema/território e pauta (`achados/embeddings/achados.md`)

- O tema pesa mais que a fórmula: dentro do mesmo cliente o território leva o topo de 11% a 49%.
- Funcionam em vários clientes: carro chinês humilhando montadora tradicional (OR 2,96, 4 de 4 clientes, não saturou); dinheiro do clube de futebol (3,24); estudante que resolve com lixo/centavos o que a indústria não resolveu (1,74, mas saturando).
- Evitar: fundador que vendeu a empresa por milhões (0,43, 8 de 8 clientes), biografia de marca global "o segredo da Starbucks" (0,61), marca feia que virou desejo (0,36), Pré-MBA (0,66).
- Repetição: continuação de um acerto em até 21 dias (OR 2,62, 32 roteiros); repetir tema de fracasso do cliente (0,69) ou que falhou em outro cliente (0,77) atrapalha; novidade por si não ajuda.
- Modelagem: OR 1,64 em Tecnologia/IA (1,90 após julho); fora de Tecnologia virou 0,74 após julho. Ganho vem da forma (ret_final 1,52), não do tema.

### 1.5 Plataformas (`achados/plataformas/achados.md`)

- Mesmo arquivo nas 3 redes (97 a 100% dos pares com a mesma duração); não há adaptação real na base para medir.
- Global nas 3: China no hook, carro chinês, disputa. Atrapalha nas 3 (e no FB): subhook que puxa o espectador; fundador que vendeu.
- YouTube: moeda no hook ajuda (1,49; IG 0,75, TT 0,72), aceita história estrangeira e queda de gigante; duração ótima 120 a 149 s. IG/TT: 150 a 179 s; TT pune <90 s.
- IG/TT pagam orgulho e estudante inventor, YT não.

### 1.6 Comando (`achados/comando/achados.md`)

- O texto do CTA explica no máximo 15% da variação de conversão: ajuste fino.
- Pedir comentário junto do seguir derruba seguidores (OR 0,22); prometer o território do canal (1,51) e não o assunto do vídeo (repetir hook/tema: 0,61 a 0,72). "Todo dia eu te mostro [território]": 1,64. "Eu sou [Nome]": neutro. O v2 (16 a 25 palavras, condicional, "para não perder") não se confirma.

### 1.7 Por cliente (`achados/clientes/achados.md`)

- Valem em quase todos: placar do hook, lugar estrangeiro, conflito nomeado, sem nome próprio (negativo), pauta só estrangeira, conclusão de sermão. Superação, dica e subhook "você" nunca invertem.
- Invertem em alguns: "você" no hook (inverte em 8; o "você" que funciona é de memória/ignorância: "Você lembra da Kolynos?"); modelagem (inverte em quem modela quase tudo: Elero, Mendes, Iansen, Lichenstein); contraste/eco na conclusão (inverte em Rafael Rodrigues e no resto de Tecnologia); "Ou seja" (inverte em Anholett, Waughan, Victor); 450 a 500 palavras (inverte em Franco e Peres).
- Fogem da regra: Marcelo Germano, Leonardo Nogueira, Lincoln Fracari (China em 90% dos hooks), Marcos Pelozato, Rodrigo Waughan ("foi aí que" marca virada de estratégia nele).

### 1.8 Leitura cega (`achados/cego/apuracao.json`)

232 pares vencedor x perdedor (mesmo cliente, rede e território), lidos às cegas em 3 lotes (leitores LLM com códigos de pista). 
- **Acerto geral 62% [55% a 68%]**: ler o texto prevê o vencedor só um pouco acima do acaso. Confiança 1 e 2: 60%; confiança 3: 9 de 9.
- Parte decisiva apontada: hook em 181 de 232 (acerto 62%); conclusão 3; subhook 7. O leitor decide quase sempre pelo hook.
- Pistas com melhor acerto: T_BRASIL 79% (n=43), H_CONTRASTE 71% (42), S_ENTRA_NA_HISTORIA 69% (36), H_NUMERO_CONCRETO 66% (62), H_NOME_CONHECIDO 65% (68). Pistas que enganam (acerto <=50%): H_VOCE 50%, H_SIMPLES 48%, F_MAIS_CURTO 46%, H_PROMESSA 45%, T_UTILIDADE 42%. Por rede: IG 65%, TT 59%, YT 33% (n=6).
- Leitura: intuição de leitor sobre "mais simples / mais curto / promete" não acerta; ponte com o Brasil é a pista mais confiável.

### 1.9 O que ficou inconclusivo no estudo de outubro

- Compartilhamento e salvamento: nenhuma fórmula de conclusão replicou.
- Retenção só no Instagram; Facebook (276 vídeos) e Entretenimento (1 cliente) sem conclusão.
- Acima de 500 palavras: queda com 113 vídeos (provável, não regra).
- Hipóteses com n pequeno ou que caem com controle de roteirista: "Só que tem um detalhe" (estrito 1,16), "nem sempre... às vezes" (23 roteiros), "era... hoje" (20), enumeração ordinal (51), "Isso porque" (some sem Izabela), "Essa é a [Nome]" (some sem Fernando), "problema" e "e o motivo" no hook (frágeis por cliente), proibição (29 roteiros).
- Dois payoffs juntos: não testável (payoff2 preenchido em 92%). Rótulo de payoff concorda 78% entre duas rodadas.
- Data âncora: curva não monotônica.
- Causalidade: tudo observacional; o hook anda junto com a premissa ("acabou de" só cabe em fato recente).
- Neutros que não precisam de regra: "Olha isso", "Funciona assim", "Imagina", "E o pior", "Isso significa", "O mais impressionante", densidade de números, aspas, frase média curta.

---

## 2. Estudo 2026-09 (`docs/estudo-2026-09/relatorio.md`)

- Mediu rótulos abstratos (16 mecanismos de hook, 19 estruturas, 8 gatilhos de comando, temas) e 17 métricas de texto, só no Instagram como estrato primário, sobre ~9,6 mil vídeos (corpus inteiro, não só VM, transcrição sem parágrafo).
- Só dois rótulos com IC inferior > 1: Conflito Declarado (hook, lift 1,35, n=130) e B1 Davi e Golias (estrutura, 1,25). Comando: nenhum. Tema: Ciência e Inovação 1,37.
- Comunicação: **nenhuma métrica de texto passou |δ| >= 0,2** (palavras, frase média, números, pronomes, perguntas, nomes próprios, tamanho do hook). Maior: palavras δ 0,14. Conclusão: "o que separa está no tema, na premissa e na execução". WP-K (alvos de comunicação por cliente) cancelado por STOP.
- Codex vs humanos VM (descrição de estilo, não mérito): Codex escrevia mais curto (345 x 385 palavras), frase mais curta (14,8 x 17,3), **o dobro de números** (2,87 x 1,40 por 100 palavras; 29% x 19% das frases com número), quase zero "eu", hook mais longo e com número. 93% dos hooks do Codex eram Contraste Extremo (lift 1,04, sem evidência).
- Codex vs canal: 10 roteiros casados, sem evidência de melhor/pior.

---

## 3. Planos e status (git log + código)

Atenção: há um **WIP não commitado** no working tree (ver 3.6) que já aplica parte do estudo de outubro aos prompts.

### 3.1 `plans/016-escrita.md` (peça 2 da 2.0, "material antes, veredito depois")
Propôs: seção ESTUDOS com portão de URL; senso de grandeza (escala humana só para número grande demais para ser sentido) e hierarquia de fontes em toda geração; detector determinístico de eco numérico (sinaliza, revisor decide, instrução termina em MANTENHA); comparação hook x abertura do corpo; abandonou o termo "sub-hook" (decidiu que não existe como entidade, só "abertura do corpo").
Status: **IMPLEMENTADO** (o README ainda diz SPEC, mas os commits existem): d8a1278 (escala humana + fontes), 3f4c83f (ESTUDOS), f65c7a7 (eco numérico), 1606af1 (hook x abertura), 78cbd9f (sinais ao revisor), 089b6c9; ajuste 65c1ad9 (comparação de escala só quando o número não é sentido). Release 2.0 (16/08).

### 3.2 `plans/ritmo-e-paragrafo.md` (19/08)
Propôs: teto de parágrafo 35 palavras e teto de inércia (máx. 3 frases de 12+ palavras seguidas), medidos em código (família slop-lint), corrigidos pelo humanizador em passe cirúrgico, revisor recebe como sinal com direito a MANTENHA, doutrina no style_guide.
Status: **IMPLEMENTADO** em 51f9a3e (slop-lint, humanize, draft, style_guide v4 ativo no banco). Nota do estudo de outubro: o teto de parágrafo é confirmado (ret_final); o teto de frases longas seguidas **não tem efeito no dado**.

### 3.3 `plans/020-evolucao-por-dados.md` (05/09)
Propôs: casamento Codex→vídeo publicado, rótulos canônicos do Oráculo, estudo de lift (virou o relatório de setembro), ranking de hook por lift em vez de share + anti-colapso, few-shot por cliente, matriz estrutura x tema no storytelling, lições por cliente do estudo, coeficiente_viral no flywheel e insight codex_vs_canal.
Status: **DONE** (ondas 1 a 5 mergeadas em 06/09: 166115f, 893a308, 68a78be, e45f90e, 6b19c54, 859546b, a00956b, 3343596, f45d4b2, 658b3f3). WP-K cancelado por STOP. Medição de resultado aberta: decisão em 60 roteiros maduros ou 16 semanas (corte ~06/09 → ~27/12).

### 3.4 `plans/021-plano-de-evolucao.md` (auditoria 13/09)
Foco em flywheel/infra, não em texto. Itens que tocam escrita: 1.1 ressuscitar a revisão (181 de 181 chamadas batiam no teto de tokens), 2.2 comando por conversão (seguidores/mil), 2.4 few-shot por coeficiente_viral, 2.5 vencedora por lift de estrutura, 2.6 anti-colapso mais forte (monopólio migrando para Conflito Declarado).
Status:
- FEITO: 1.1 revisão (a669dc1, saída por tool, preservarHook impede o revisor de mexer no hook), 0.3 fallback com motivo, 0.4 retry do ETL, 1.3 /ensinar mostra lições de correção (a669dc1); lições agrupadas por recorrência e testadas contra o acervo (7ee6884, vereditos: "abrir com número" lift 1,06, "personagem nomeado na abertura" 1,06, "segunda pessoa na abertura" 0,89 CONTRARIA, "conectivo causal" não separa).
- PENDENTE (no código): 2.1 régua única nos `client_*`, 2.2 comando ainda ranqueado por seguidores absolutos na 0042, 2.4 few-shot ainda por `views` (`lib/pipeline/few-shot.ts` CRITERIO_PADRAO = "views"), 2.5, 2.6, ondas 3 e 4. Não verifiquei 0.1 (backfill de embeddings).
- Fora do plano, relevantes: 9026b8e detector de anúncio vazio (22 de 22, 0 falsos positivos); 8c6a66f writer padrão vira claude-opus-5-5 (A/B de qualidade de escrita **não feito**).

### 3.5 `plans/README.md`
Tabela de status desatualizada: 016/017 aparecem como SPEC mas foram implementados; 021 não está na tabela.

### 3.6 WIP não commitado (working tree, NÃO está em produção)
Arquivos: `agents/{hook,comando,roteirista,storytelling,revisao,dados,replicador}.md`, `lib/pipeline/{agents,draft,hook-mechanisms,suggest}.ts`, `tests/hook-mechanisms.test.ts`. Aplica o estudo de outubro:
- `placarHook()` em `hook-mechanisms.ts` (listas fixas de lugar/famoso/marca, embate, proibição; os mesmos +1/-1 do estudo) e `selectHook` passa a ordenar por placar antes do lift do mecanismo.
- hook.md: abre com nome, meta placar +2, especificidade = nome/lugar/idade/"acabou de" ("número exato não separa").
- roteirista.md: corpo 370 a 430 palavras (total 420 a 500, 3 palavras/s); primeira frase do corpo pelo PLAYBOOK DE SUBHOOK; fecho pelo PLAYBOOK DE CONCLUSÃO, terminando no objeto central para o hook ecoar.
- storytelling/dados/revisao: o fim "fecha a lacuna no próprio caso" em vez de "consequência para o espectador".
- comando: território do canal, um pedido só.
- Injeta os playbooks `subhook`, `conclusao`, `payoff`, `pauta` nos prompts **se houver versão ativa** (hoje não há; ver item 4).

---

## 4. Playbooks: proposto x repo x banco

Runtime: `lib/pipeline/context.ts:146` carrega `vm_playbooks` com `active = true`, um por slug (o repo `playbooks/` é só semente).

| slug | ATIVO no banco (runtime) | proposta do estudo 2026-10 no banco | repo `playbooks/` |
|---|---|---|---|
| hook | **v3** (07/08) | v4 inativa (08/10) | v3 ("v2 destilado") |
| comando | **v2** (14/09) | v3 inativa | v2 |
| checklist | **v3** (07/08) | v4 inativa | v3 |
| style_guide | **v4** (19/08) | v5 inativa | v4 |
| storytelling | **v1** (03/07) | v3 inativa (v2 de 06/09, matriz do plano 020, também inativa) | v1 |
| subhook | nenhuma | v1 inativa | não existe |
| conclusao | nenhuma | v1 inativa | não existe |
| payoff | nenhuma | v1 inativa | não existe |
| pauta | nenhuma | v1 inativa | não existe |
| plataformas | n/a | só `docs/estudo-2026-10/playbooks/plataformas.md` (referência do time, não vai ao banco) | não existe |

**Nenhuma versão do estudo de outubro foi ativada.** O README do estudo manda ativar no /ensinar e depois copiar para `playbooks/`. Hoje o runtime ainda diz, por exemplo: hook "2 a 4 frases, a maioria com duas" e especificidade = "número exato"; checklist "150 a 430 palavras" e "430 = 180 s"; style_guide "não abra frases consecutivas com E", "no máximo 1 pergunta retórica", "nada de tricolon", "endereçar o espectador é o registro certo", "R$ 3.400 em vez de muito dinheiro" (todos corrigidos ou desmentidos pelo estudo).

Lições: só **2 de 148** `vm_lesson_learnings` estão ativas (ver item 5).

---

## 5. Os prompts vivos (HEAD + banco ativo) já têm regra para...

**Explicar nomes na primeira menção?** Parcial, só como lição.
- Lição ATIVA (destinatários roteirista, revisao, storytelling): "Evite siglas e nomes de empresas/instituições pouco conhecidos do público geral sem explicar o que são; se usar, explique rapidamente o que significa no mesmo trecho."
- Nada nos `agents/*.md` nem no style_guide v4. Inativas no banco: "Cada frase do hook precisa ter um referente claro, nunca um pronome solto", "Nomeie o personagem-alvo desde o início".
- Tensão com o dado: o estudo manda encher o corpo de nomes próprios (7+/100 palavras) e abrir o hook pelo nome; explicar quem é o nome não foi medido.

**Evitar metonímia?** **Não existe** em prompt, playbook, lição ou banlist (grep por meton/sinédoque/apelido: zero). O mais próximo é a regra de elipse do style_guide v4 ("a fala não tolera omissão: a boca precisa dizer a peça que falta").

**Limitar números?** **Não.** O vivo empurra para mais número:
- style_guide v4: "Especificidade vence adjetivo: 'R$ 3.400 por mês' em vez de 'muito dinheiro'."
- hook v3 (ativo) / agents/hook.md HEAD: "nome próprio > categoria · número exato > 'muito'"; eliminatório "ganhou muito no lugar de lucrou 12 milhões".
- pesquisador.md: "Priorize números que surpreendem"; freio só na comparação de escala ("Isto NÃO é para todo número. O teste é um só: o ouvinte consegue sentir esse número sozinho?").
- Freio indireto: detector de eco numérico (016) sinaliza número repetido para o revisor.
- Dado: setembro mediu o Codex com o dobro de números da casa (2,87 x 1,40 por 100 palavras); outubro: densidade de número neutra, número no hook neutro, moeda no hook ruim no IG/TT. A proposta style_guide v5 (inativa) troca por "Especificidade de nome vence número" e "Traduza o número" ("Ou seja," / "Pra você ter ideia,").

**Fluxo causal?** **Sim**, é o ponto mais coberto:
- checklist v3 COESÃO: "Os parágrafos possuem conexão lógica entre si, seguindo estrutura de causa e consequência"; "cada item está amarrado ao anterior por conectivo dito em voz alta, nunca só pela vírgula"; guia But/Therefore ("Cada bloco deve responder: 'e então?' ou 'mas por que?'").
- style_guide v4, parataxe proibida: "O que salva não é o tamanho da frase, é o conectivo: que, porque, mas, quando, enquanto, se, por isso, de um lado / de outro, ou seja." e "a RELAÇÃO entre as ideias tem que ser dita... subordine, não fatie".
- storytelling.md: beats "atenção → desenvolvimento → consequência DA PREMISSA".
- Inativas no banco (não chegam ao prompt): "Explicite a cadeia causal completa, elo por elo", "Explicite o mecanismo entre a causa e o resultado", "Conecte cada salto de assunto com uma ponte lógica explícita", "Costure frases picadas com conectivos".
- Dado: "então/por isso" neutro; o que segura é a virada "mas/só que" (ret_final) e "Ou seja," como consequência (OR 1,30). Teste do acervo (7ee6884): "conectivo causal não separa".

**Emoção?** **Sim, genérica**:
- storytelling.md: "O que o espectador vai sentir ao final? (o mecanismo emocional que o fará compartilhar)"; campo `mecanismo_emocional` em cada candidata; roteirista recebe "mecanismo emocional já decidido".
- checklist v3 INFOTENIMENTO (eliminatório): "O roteiro ativa pelo menos uma emoção identificável e nomeável" + "entrega valor informativo real além do impacto emocional".
- Inativas: "Não liste fatos desconectados: cada fato precisa servir a uma tese emocional", "Dê rosto humano ao custo social, não só o número agregado".
- Nada liga emoção a métrica. O playbook payoff v1 (inativo) é quem faz isso (disputa/orgulho com régua para alcance; revolta/nostalgia para comentário; vantagem para salvamento).

---

## 6. Lacunas que nenhum trabalho anterior cobre (para o plano novo não repetir o resto)

- Ativar (ou não) as 9 versões propostas de outubro e commitar/decidir o WIP do item 3.6: é o passo pendente mais barato; o plano novo não deve reescrever esses playbooks do zero.
- Metonímia, explicação de nome na primeira menção e limite/tradução de número: sem regra viva (só 1 lição sobre siglas) e sem medição no estudo (nomes foram medidos por densidade, não por explicação).
- A/B de escrita opus-5-5 x fable: não feito.
- Medição do plano 020 (Codex vs canal) ainda sem n.
- Compartilhamento/salvamento: o estudo não achou fórmula de texto que replique; só payoff (orgulho, futuro, inspiração; vantagem para salvamento).
- Leitura cega: 62% de acerto mostra que o sinal legível no texto é fraco e concentrado no hook e na ponte com o Brasil.
