# Estratégia de evolução do Codex (22/10/2026)

Junta três investigações desta pasta: o mapa dos fluxos e laços (resumo no fim), DADOS-FLUXOS.md (uso, funil, resultado e custo por fluxo, últimos 120 dias) e ESTADO-DA-ARTE.md (pesquisa 2023-2026). Algumas fontes do estado da arte foram lidas só pelo resumo, como a própria pesquisa avisa.

## Diagnóstico

1. **A escrita já não é o gargalo.**
   - Dos roteiros do Codex que viraram vídeo, 26 de 39 ficaram acima do humano do mesmo cliente × rede × período (p≈0,05).
   - O acerto foi de 29%, contra 16% do humano.
   - Há viés de seleção, porque só vai ao ar o que o time escolheu. Mesmo assim, o Codex não escreve pior que a casa.
2. **O sinal se perde antes e depois da escrita:**
   - **Modelar vídeo** é o fluxo que mais converte: 41% das sessões viram vídeo (50% com cliente), e 85% do texto é mantido. Mas 30% das sessões morrem antes, a maioria na transcrição: crédito do provedor, limite de 136 s, resposta HTML.
   - **O livre** é o fluxo mais usado (43% em outubro) e o que menos converte (13%). Quase todo vem dos administradores, e muitas sessões ficam sem cliente.
   - **Modelar texto** é o único fluxo com sinal ruim nas três réguas: coeficiente 0,85, acerto 7% e o mais reescrito. O resultado está confundido com um usuário e com clientes fracos.
   - **Nenhum preditor real:**
     - a narrativa é escolhida pela nota de um LLM sem calibração;
     - o hook é escolhido por uma regex de placar;
     - o corpo é um só, sem candidatos.
   - **Os laços de aprendizado estão quase todos parados:**
     - 2 de 148 lições ativas;
     - o Kasparov está morto desde 18/08;
     - a calibração de hook tem 6 votos;
     - os bullets estão travados;
     - a retenção entra só por planilha.

     O único laço que funciona é o ranking de mecanismo e estrutura do ETL.
   - **Adoção:** o único roteirista abriu 6 sessões em 4 meses. A casa escreveu cerca de 880 roteiros no período, e o Codex 39. Com tão pouco roteiro publicado, o próprio Codex não gera dado para aprender.
   - **Custo:** desde 15/10 o Grok 4.7 da pesquisa custa cerca de US$ 3,8 por sessão, o dobro da parte Anthropic.
3. **O que a pesquisa diz:**
   - LLM puro prevê mal qual texto vence (38 a 40% num teste de 3 opções em que o acaso dá 33%).
   - Modelo simples no próprio histórico, com embeddings e comparação em pares do mesmo criador, chega a 55 a 65%. Esse é o teto realista.
   - Gerar poucas candidatas e escolher com esse preditor ajuda. Gerar muitas faz o preditor ser "enganado".
   - Para prompts evoluírem com poucos dados de resultado, o método mais adequado é a evolução reflexiva no estilo GEPA: o LLM lê pares vencedor × perdedor e propõe mudanças. Ela precisa de validação temporal, senão decora o teste.
   - Resultado real é o portão lento: decisão por trimestre, nunca por um viral.

**Consequência:** o dado que ensina é o corpus da casa, com 5.510 roteiros com coeficiente e 11 mil vídeos, não os poucos roteiros do Codex. Os roteiros do Codex servem para confirmar devagar.

## Retorno imediato (2 a 3 semanas, sem custo novo de API)

| # | O quê | Por quê | Tamanho |
|---|---|---|---|
| 1 | **Consertar a transcrição da modelagem**: provedor reserva, vídeo longo cortado em vez de recusado, erro legível | É o fluxo que mais converte e perde 30% das sessões antes de gerar | 0,5 a 1 dia |
| 2 | **Preditor da casa v0**: pares do mesmo criador, embeddings já gerados pelo coletor + features medidas (hook, modo, âncora), treino nos roteiros da casa, teste no mês seguinte. Abaixo de 58% não vira portão | Substitui a nota do LLM e a regex na escolha | 1 a 2 dias, zero API |
| 3 | **Usar o preditor onde já há candidatos**: ordenar os 5-6 hooks e as 2-3 narrativas. Registrar candidatas, notas e a escolhida | Ganho direto, sem mudar o fluxo do usuário | 0,5 dia |
| 4 | **Avaliador de pauta** antes da sala: busca vídeos da casa com tema parecido (kNN), mostra como foram e sugere ângulo e referência | O tema pesa mais que a escrita | 1 a 2 dias |
| 5 | **Banco de referências**: guardar a métrica do vídeo de referência (o coletor já raspa IG) e sugerir referência da casa | Referência da casa rende 34% de topo, contra 26% da externa. Hoje 95% das referências são externas, sem métrica | 1 a 2 dias |
| 6 | **Modelagem por cliente**: o perfil diz se o cliente responde a modelagem (Izabela, Rafael e Thiago Franco sim; Pedro, Túlio e Renato Mendes não) e a home recomenda o fluxo | Na casa, a modelagem ajuda muito em uns e atrapalha forte em outros | 0,5 dia, usa o perfil (Task 9) |
| 7 | **Custo do Grok**: comparar 4.3 e 4.7 na pesquisa (o banco de prova já existe) ou cachear | O 4.7 dobrou o custo por sessão | 0,5 dia + ~US$ 10 |

### Limitações temporárias de fluxo (uso)

- **Sem cliente, não gera.** O teste dos administradores vira um "rascunho", fora das estatísticas.
- **Livre pede âncora:** um link de notícia recente ou uma referência. O fluxo de fontes converte mais que o dobro (29% contra 13%) e é o mais barato por vídeo publicado.
- **Modelar texto fica "em observação" por 30 dias:**
  - o fluxo fica disponível, mas com aviso;
  - o estrategista que mais usa revisa os roteiros com a gente;
  - não removemos antes de separar o efeito do usuário e do cliente.
- **Rotina de 15 minutos por semana para um responsável:** uma página no Cockpit com as lições novas, os casamentos duvidosos e as propostas de mudança de skill, para aprovar com um clique. Ela substitui o Kasparov, que ninguém abre.

## Mecanismo confiável de evolução própria

1. **Espinha de dados:**
   - o casamento roteiro → CRM → vídeo, feito no branch;
   - o ETL semanal;
   - os rótulos de modo dos roteiros novos da casa (Task 11);
   - o log de candidatas e notas, do item 3.
2. **A régua:** o preditor, revalidado todo mês no mês mais novo. A acurácia dele fica num painel. Se cair, ele é retreinado e não decide até voltar.
3. **Evolução mensal das skills, no estilo GEPA:**
   - entrada: pares vencedor × perdedor do mês, do mesmo criador e do mesmo modo;
   - um LLM reflete e propõe uma alteração na seção da skill;
   - portão offline: regenerar hooks e roteiros de pautas separadas e exigir melhora no preditor, piso de clareza igual ou melhor e fidelidade de modo;
   - portão humano: a página semanal;
   - custo: cerca de US$ 10 a 30 por mês.
4. **Campeão e desafiante em produção:**
   - a versão nova da skill escreve uma parte das sessões, cerca de 20%, por Thompson sampling, partindo do palpite do preditor;
   - a decisão final sai do resultado real, contra a mediana do criador, por trimestre.
5. **Proteções:**
   - prompt nunca muda sem aprovação;
   - todo número das skills tem uma consulta de origem ("números vivos");
   - juiz LLM só checa regra, não prevê viral (deu 7 a 0 contra o humano);
   - poucas candidatas, para não otimizar contra o preditor.

## Ordem

1. Release do branch 025 + casamento + limpeza da retenção (pronto).
2. Itens 1, 2 e 3 (transcrição, preditor v0, ordenação). Retorno em dias.
3. Itens 4, 5 e 6 e as limitações de fluxo.
4. Mecanismo mensal (pontos 3 e 4), depois de 1 mês de log de candidatas.
5. Task 8 (lições por skill) e Task 11 (rótulos semanais), que alimentam o mecanismo.
