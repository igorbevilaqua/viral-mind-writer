# Estado da arte: prever e evoluir roteiros virais (out/2026)

## 1. Prever popularidade
- **LLM só com prompt quase não acerta o vencedor.** Em 17.681 testes A/B da Upworthy (acaso = 33%), o GPT-4 acertou 38 a 40%. Embeddings + regressão linear chegaram a 46% e um Llama-3-8B ajustado a 47%. [LOLA, Marketing Science 2025](https://arxiv.org/abs/2406.02611). Em 2026, embedding + regressão fez 42,8% contra 35,7% de um LLM pequeno ajustado. [2608.11912](https://arxiv.org/abs/2608.11912)
- **O teto é baixo.** As variáveis de linguagem acertam 54% dos pares fora da amostra e 58% nos pares com maior diferença. [Gligorić et al., PLOS ONE 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038272/). Mesmo com tudo (usuário, conteúdo, histórico), os modelos explicam menos da metade da variância, e o limite parece estrutural. [Martin et al. 2016](https://arxiv.org/abs/1602.01013)
- **Em vídeo, a combinação ganha.** Em 13.639 vídeos: rede com embeddings 80%, LLM sem ajuste 82%, os dois juntos 85,5%. [Kayal et al., ACL 2025](https://aclanthology.org/2025.findings-acl.597/). Em pares de posts do mesmo autor: Claude Opus 4 56%, DeepSeek V3 60% (benchmark de fornecedor). [AIMultiple](https://research.aimultiple.com/audience-simulation)
- **O que isso significa:** comparar pares dentro do mesmo criador é a formulação certa. O realista é 55 a 65% de acerto.

## 2. Gerar várias e escolher
- **Palpite do LLM + bandit:** usar o palpite do LLM como ponto de partida do algoritmo (UCB) deu de 5 a 9% mais cliques que um A/B comum quando há pouco tráfego. O ganho cai quando o tráfego cresce. [LOLA](https://arxiv.org/abs/2406.02611). Thompson sampling no Yahoo: +3,7% (simulação). [link](https://arxiv.org/abs/1908.06256)
- **Best-of-N tem curva de Goodhart:** a nota real sobe e depois cai conforme o N cresce. [Gao et al., ICML 2023](https://arxiv.org/abs/2210.10760)
- **Aprender o porquê:** em vez de otimizar clique, o LLM gera hipóteses sobre por que o título vencedor venceu. Os títulos dele foram preferidos 44% das vezes, contra cerca de 30% dos humanos e da IA comum, sem cair no "use 'chocante'". [Yale SOM 2025](https://insights.som.yale.edu/insights/when-ai-learns-the-why-it-becomes-smarter-and-more-responsible)
- Não há experimento de campo publicado do tipo "gera N, ranqueia, publica" em vídeo curto.

## 3. Otimizar prompts sozinho
- **GEPA:** reescreve o prompt lendo os passos da execução e um feedback em texto. Bate o GRPO por 6 pontos com até 35 vezes menos execuções e bate o MIPROv2 por mais de 10 pontos. [ICLR 2026](https://arxiv.org/abs/2507.19457). É o que melhor combina com poucos dados.
- **Os outros:** [MIPROv2](https://arxiv.org/abs/2406.11695) (até +13%), [OPRO](https://arxiv.org/abs/2309.03409) e [TextGrad](https://arxiv.org/abs/2406.07496) supõem uma nota barata e estável, que não é o caso aqui.
- **O risco é decorar o conjunto de teste:** num teste com GEPA, o acerto no treino subiu de 90 para 95% e no teste separado caiu de 95 para 85%. [Willison 2026](https://simonwillison.net/2026/Jul/2/dspy-datasette-agent-prompts/)
- **Previsão de LLM não substitui resultado:** na Upworthy, ela recuperou só 39% do efeito real. [Spotify 2026](https://engineering.atspotify.com/2026/8/when-can-llms-replace-humans-in-a-b-tests/)

## 4. Psicologia com evidência
- **Negatividade:** cada palavra negativa dá em média +2,3% de cliques. Tristeza pesa mais que raiva. [Robertson et al. 2023](https://www.nature.com/articles/s41562-023-01538-4)
- **Emoção de alta excitação:** admiração, raiva e ansiedade são mais compartilhadas que tristeza. [Berger & Milkman 2012](https://journals.sagepub.com/doi/10.1509/jmr.10.0353). Mas a explicação pela excitação física não replicou. [Prowten et al. 2024](https://doi.org/10.1177/09567976241257255)
- **Curiosidade tem ponto ótimo:** numa meta-análise de 8.977 testes, ser concreto ajuda quando o título está vago demais e atrapalha quando ele já está concreto. [Sci Rep 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11704130/). "Eu" e "ele/ela" ajudam (chance cerca de 1,25 vez maior), "nós" atrapalha (cerca de 0,86). [Gligorić](https://pmc.ncbi.nlm.nih.gov/articles/PMC10038272/)
- **Tribo:** cada termo sobre o grupo rival aumenta em 67% a chance de compartilhamento. [Rathje et al., PNAS 2021](https://www.pnas.org/doi/10.1073/pnas.2024292118). Funciona, mas é arriscado para marca.
- **Primeiros segundos:** a maioria dos pulos acontece nos 5 primeiros segundos. [2504.03107](https://arxiv.org/abs/2504.03107). Os números "3 segundos / 63%" que circulam não têm fonte primária.

## 5. Riscos
- **Juiz LLM:** tem viés de posição, de tamanho e de preferir o próprio texto. [Zheng 2023](https://arxiv.org/abs/2306.05685), [Panickssery 2024](https://arxiv.org/abs/2404.13076). Claude julgando Claude contra humano favorece Claude. O conserto é trocar a ordem e controlar o tamanho. [Dubois 2024](https://arxiv.org/abs/2404.04475)
- **Sorte e volta à média:** a mesma música teve sucesso muito diferente em "mundos" paralelos. [Salganik, Science 2006](https://www.science.org/doi/10.1126/science.1121066). O viral de agora tende a voltar à média no próximo vídeo.
- **Ruído da plataforma:** algoritmo, horário e tendência pesam. Com cerca de 40 roteiros publicados, só diferenças grandes aparecem.

## O que eu faria nesse sistema
1. **Preditor simples:** pares do mesmo criador, embeddings + regressão logística nos 11 mil vídeos, com o alvo sendo o coeficiente contra a mediana do canal. Validar no tempo: treina até o mês M e testa no seguinte. Abaixo de 58%, ele não vira portão.
2. **Claude extrai, não julga:** Claude marca as variáveis (emoção, concretude do hook, pessoa do texto, tribo), que entram no modelo simples.
3. **Best-of-N pequeno:** gerar 4 a 6 hooks e 2 a 3 roteiros, ranqueados pelo preditor.
4. **Se usar juiz LLM:** em pares, com a ordem trocada, o tamanho igualado e sem saber se o texto é humano ou do sistema.
5. **Skills no estilo GEPA:** o modelo lê pares vencedor × perdedor do corpus histórico e propõe uma mudança na skill. A mudança só entra se melhorar no teste separado por tempo e não piorar o piso de clareza.
6. **Resultado real como portão lento:** comparar com a mediana do criador e decidir por trimestre, não a cada viral.
7. **Bandit por versão de skill:** Thompson sampling decide qual versão escreve os próximos roteiros, com o palpite do preditor como ponto de partida.
8. **Registrar tudo:** versão, candidatos, notas e qual foi escolhido, para medir depois se o preditor ordena certo.
