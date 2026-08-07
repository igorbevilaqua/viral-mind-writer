# Playbook de Hooks (v2, destilado dos dados)

> Reescrito a partir da análise empírica de 800 hooks de alta performance do corpus
> (`scripts/analyze-hooks.ts`). Cada mecanismo está ordenado pela presença real no topo
> de performance e anotado com seu fundamento psicológico, exemplos reais e armadilhas.

**Objetivo do hook:** interromper a inércia do scroll nos primeiros segundos e abrir uma
lacuna de curiosidade que só o roteiro fecha. O hook é a promessa exata que o corpo paga.

## Dois eixos (leia antes de classificar ou escrever)

Um erro comum é confundir o **sujeito da frase** com o **mecanismo**. "Esse cara fez X" não
viraliza por ser sobre "esse cara"; viraliza pelo X (um contraste, um segredo, uma
controvérsia). Separe sempre:

- **Eixo 1, MECANISMO DE CURIOSIDADE (o driver):** o que sequestra a atenção. É aqui que
  mora a viralização. Todo hook precisa de pelo menos um. Catálogo abaixo, ordenado por dado.
- **Eixo 2, FORMATO (a embalagem):** como o mecanismo é enquadrado. Não substitui o
  mecanismo, mas potencializa:
  - **Personagem Central:** o hook gira em torno de uma pessoa/personagem ("esse cara",
    "essa mulher", nome próprio). Dado: aparece no top decil 14% das vezes contra 9% da base,
    com views medianas ~30% maiores. Bom default de embalagem, mas só sobre um mecanismo real.
  - **Visual:** depende do que se vê na tela. Neutro na performance (fica na base); use
    quando o impacto for genuinamente visual, não como muleta.

## Os 3 princípios do sequestro de atenção

1. **Curiosidade (gap de informação):** abra uma lacuna que o cérebro *precisa* fechar.
   Ex.: "Trump enviou uma mensagem para o Brasil" vira "O mundo parou após Trump enviar uma
   mensagem de 5 palavras para o Brasil."
2. **Relevância:** deixe claro em segundos que o vídeo entrega algo que importa para *aquela*
   audiência. Inimigos: abstração e complexidade. Prefira simplicidade e concretude.
3. **Impacto:** arregale o olho. Troque o genérico ("nunca desista dos sonhos") pelo concreto
   e desproporcional ("essa mãe desempregada virou bilionária pelo que escreveu num papel").

---

# Mecanismos de curiosidade (ordenados por performance medida)

## Nível 1: espinha dorsal (alto volume + forte no topo)

### Contraste Extremo, o mecanismo base (n=369, 13% no top decil, 79% VM)
Coloca dois fatos opostos frente a frente: antes/depois, expectativa/realidade, nós/eles,
justo/injusto. **Psicologia:** o cérebro processa diferença, não valor absoluto; o contraste
cria dissonância que exige resolução. É o mecanismo mais versátil e combina com quase todos.
- "Coca-Cola gasta milhões no Nordeste, mas existe uma bebida cearense que ela não consegue superar." _(VM)_
- "Esse taxista rodou tanto com o Toyota que travou o software da fábrica." _(VM)_
- Consequência desproporcional: "Uma única frase destruiu a maior empresa do país."

### Revelação Secreta (n=183, 14% no top decil)
Promete conhecimento oculto, proibido ou que "quase ninguém percebeu". **Psicologia:**
informação escassa é sinalizada pelo cérebro como valiosa e elevadora de status (saber o que
os outros não sabem). Casa muito com a palavra mágica "ninguém".
- "A China está construindo um país paralelo no Nordeste e quase ninguém está percebendo." _(VM)_
- "O que os bancos nunca vão assumir que fazem assim que você abre o app."
- "Só 3% dos brasileiros sabem como isso funciona."

### Conflito Declarado (n=74, 14% no top decil, 77% VM)
Anuncia um embate: X contra Y, guerra, "venceu", "destruiu". **Psicologia:** herança tribal,
conflito sinaliza ameaça e lado a tomar, e a atenção dispara automaticamente.
- "O Ratinho venceu o governo e cancelou uma multa de R$ 58 milhões." _(VM)_
- "A guerra entre o Banco Central e os brasileiros que estão ficando milionários."

### Ultra Especificidade (n=154, 8% no top decil)
Números quebrados, detalhes precisos. **Psicologia:** especificidade é lida como prova de
veracidade (a mentira tende ao redondo e vago); o detalhe ancora credibilidade e realismo.
- "Como faturei R$ 12.457,32 em 4 dias usando só o Bloco de Notas."
- "A técnica de 47 segundos que remove qualquer mancha de vinho do sofá."
- Fraco contra forte: "ganhou muito dinheiro" (ruim) / "lucrou 12 milhões" (bom).

### Elemento Controverso (n=119, 8% no top decil)
Figura ou tema que divide opiniões e desperta sentimento. **Psicologia:** emoção (indignação,
admiração) é o combustível do compartilhamento; o polarizador engaja os dois lados.
- "Esse é o cara mais odiado pelos donos de academia, porque a academia tradicional vende o mesmo espaço para centenas ao mesmo tempo." _(VM)_
- Inversão herói/vilão: "O homem mais odiado do Brasil salvou 40 mil empregos."

## Nível 2: sólidos (use com contexto de tema/cliente)

### Superlativo (n=98, 9% no top decil, 82% VM)
O maior, o menor, o mais rico. **Psicologia:** extremos são atalhos de relevância; o cérebro
prioriza o excepcional. Barato e eficiente, mas gasta rápido se usado em tudo.
- "A empresa mais valiosa do mundo emitiu um alerta que ninguém queria ouvir."

### Desafio de Crença (n=80, 9% no top decil)
Ataca uma verdade tida como absoluta. **Psicologia:** dissonância cognitiva; a mente não
tolera a contradição em aberto e precisa assistir para resolver.
- "Trabalhar duro nunca deixou e nem vai deixar ninguém rico."
- "Muito em breve só vai ser gordo quem quiser."

### Viés de Ilegalidade / O Proibido (n=41, 12% no top decil, 83% VM)
Vantagem injusta, algo secreto ou "clandestino". **Psicologia:** o proibido carrega valor
percebido e um leve tabu que prende. Alta adoção VM.
- "A Larissa Manuela acumulou milhões, mas não tinha acesso à própria conta, e tudo era legal." _(VM)_
- "A técnica 'proibida' que os vendedores usam para entrar na sua mente."

### Viés de Negatividade (n=108, 6% no top decil)
O que a pessoa pode perder ou o erro que comete. **Psicologia:** o cérebro pesa perdas mais
que ganhos (aversão à perda) e prioriza ameaças. Views medianas altas, mas modere: cansa e
pode soar alarmista se isolado.
- "O erro fatal que 90% dos investidores cometem antes da crise."
- "Sua saúde está sendo destruída por esse 'alimento saudável' que você come todo dia."

## Nível 3: situacionais

- **Apelo à Autoridade** (n=25, 12%): "Psicólogos estão em choque…", nome de peso. Prova social de especialista. Amostra menor; bom quando a autoridade é genuína e reconhecível.
- **Apelo Histórico** (n=20, 10%): "jamais será esquecido", "está prestes a entrar para a história". Enquadra o momento como marco.
- **Ordem Contra-intuitiva** (n=39, 5%): ordem direta contra o hábito ("Pare de economizar agora"). Prende pela quebra, mas converte menos no topo; use pontualmente.
- **Urgência** (n=92, apenas 4% no top decil, só 46% VM): "última hora", "agora". Anti-padrão de sobreuso: tem muito alcance bruto mas sub-indexa no topo de performance e é pouco adotado nas produções VM. Use como tempero sobre outro mecanismo, nunca como driver único.

## Nível 4: amostra insuficiente (não decidir por eles ainda)
- **Apelo à Maioria** (n=12): "9 em cada 10 médicos…". Prova social numérica; promissor, mas n baixo, tratar como hipótese.
- **Apelo ao Esforço** (n=4): "já li 350 livros e essas são as 10 lições". Dados insuficientes.

---

# Combinações campeãs (co-ocorrência em vencedores)

O par mais forte é sempre um mecanismo base mais um amplificador:
- **Contraste Extremo + Ultra Especificidade** (76x): o contraste com número concreto.
- **Contraste Extremo + Revelação Secreta** (51x): o oposto que "ninguém percebeu".
- **Contraste Extremo + Superlativo** (39x).
- **Urgência + Viés de Negatividade** (30x): quando usar urgência, ancore numa perda.
- **Elemento Controverso + Revelação Secreta** (23x).

Regra prática: **um mecanismo base (Contraste/Revelação/Conflito) mais um amplificador
(Especificidade/Superlativo/Controverso), embalado em Personagem Central quando couber.**

# Palavras mágicas (frequência real nos vencedores)
Muito acima das demais: **"ninguém"** (69x), o motor da Revelação Secreta. Depois: nunca (17),
segredo (7), descobriu (6), revelou (4), perturbador (3), escondido/oculto/urgente/proibido.

# Comprimento

**2 a 4 frases faladas, a maioria com DUAS.** Duas é o formato natural: a primeira arma, a
segunda vira. Quatro é teto absoluto, não meta.

Frase que precisa de vírgula para respirar deve virar duas frases. Quase sempre melhora.

# Simplicidade (o critério que mais reprova hook bom no papel)

O espectador ouve a frase UMA vez, rolando o feed, sem contexto. Palavra que ele precisa
processar é palavra que já custou o vídeo. Complexidade e abstração são os inimigos da
relevância; simplicidade e concretude são os aliados.

Escreva com as palavras que ele usa:
- Fraco: "Diversas corporações brasileiras enfrentam um cenário de insolvência iminente."
- Forte: "A Rede Globo emitiu o alerta. Empresas que você ama estão com os dias contados."
- Fraco: "A relevância da persistência no processo de realização pessoal."
- Forte: "Essa mãe vivia de ajuda do governo. Hoje é bilionária pelo que escreveu num papel."

A complexidade é exceção, legítima em três casos: apresentar um conceito que não tem sinônimo
simples · sustentar a modelagem de um vídeo que funcionou justamente pelo termo · causar
estranheza deliberada (a palavra fora do lugar que faz parar). Fora disso, é defeito.

Teste: uma pessoa comum, ouvindo essa frase uma única vez enquanto rola o feed, entende na
hora? Se você está em dúvida, a resposta é não.

# Anti-padrões (o que evita desclassificação)
- Hook que promete o que o corpo não paga: desclassificado.
- Urgência ou Negatividade como driver único e repetido.
- Abstração/genérico ("a importância de nunca desistir") no lugar do concreto.
- Confundir formato com mecanismo: "esse cara…" sem um mecanismo real por trás é só um sujeito.
- Clichê de IA e travessão: tolerância zero.
- Abertura genérica que serviria a qualquer vídeo: "olá", "e aí pessoal", "você sabia que",
  "nesse vídeo", "hoje vou te mostrar", "presta atenção". Eliminação automática.
- Apresentar o TEMA em vez do IMPACTO.
