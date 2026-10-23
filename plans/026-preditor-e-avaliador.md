# Plano 026: preditor da casa e avaliador de pauta

Origem: docs/estrategia-2026-10/ESTRATEGIA.md, itens 2, 3 e 4. Aprovado pelo Igor em 22/10/2026.

**Decisões:**
- O preditor diz a chance de o vídeo cair no topo **do próprio cliente**. Topo é o quartil de cima do coeficiente no estrato cliente × rede × trimestre, com base de 26%, a régua de `docs/estudo-2026-10/src/lib.mjs`. Ele não prevê views absolutas.
- **Portão:** acurácia par a par de pelo menos 58% no mês que o modelo não viu, dentro do mesmo cliente × rede, e calibração conferida. Abaixo disso o preditor não decide nada e só mostra os dados.
- Ele custa zero de LLM: usa os embeddings do CRM (gemini-embedding-001, truncados para 768, como no estudo de outubro), métricas medidas e features de código.
- Um agente por task, com revisão entre elas.

## Task A: preditor v0 (offline, só leitura)

Entregável: `docs/preditor-2026-10/` com `RELATORIO.md`, `src/` e `modelo.json` (os pesos, para a produção pontuar sem retreinar).

1. **Base:** regenerar a `data/` do estudo de outubro com `docs/estudo-2026-10/src/export.ts`. Ela é só leitura e não usa LLM. As variáveis vêm por `--env-file`: o Cockpit primeiro, o Codex depois.
2. **Unidade:** o vídeo maduro, com roteiro VM, o cliente, a rede e a data de publicação.
3. **Features, todas só com o que existia ANTES da publicação.** Um vizinho só conta se foi publicado pelo menos 30 dias antes, com métrica madura.
   - **Do tema, por kNN no embedding:**
     - taxa de topo dos k vizinhos mais parecidos da casa;
     - a mesma taxa só entre os vizinhos do próprio cliente;
     - a similaridade média desses vizinhos.
   - **Do território:** a taxa de topo histórica do cluster (`dados/clusters.json`).
   - **De repetição** (achados 6 e 7 do estudo de embeddings):
     - se o tema já foi um acerto ou um fracasso do cliente, e há quantos dias;
     - se ele já falhou em outro cliente.
   - **Do cliente:** a taxa de topo nos últimos 90 dias e a tendência.
   - **Do formato:** o modo (`vm_roteiro_modo`), a âncora e as features de hook do estudo de hooks, quando existirem.
4. **Modelo:** regressão logística ou um GBM pequeno, sem dependência nova se der para evitar. Escolher o mais simples que bater o portão.
5. **Validação temporal:** em janela móvel, treinar até o mês M−1 e testar no mês M, nos últimos 3 meses. Medir:
   - acurácia par a par dentro de cliente × rede × mês;
   - AUC;
   - Brier e a tabela de calibração por faixa;
   - a comparação com dois baselines: a taxa do cliente e só o kNN.
6. **Relatório:** o que passou do portão e o que não passou, o peso de cada feature e exemplos de pautas com nota alta e com nota baixa.

## Task B: ordenar candidatos no Codex (depois do portão)

Pontuar os 5-6 hooks e as 2-3 narrativas que o Codex já gera, e registrar as candidatas, as notas e a escolhida. É preciso o embedding do texto novo na hora da geração, então primeiro confirmar qual chave de embedding o Codex tem.

## Task C: avaliador de pauta (depois do portão)

Antes da sala, buscar vídeos da casa com tema parecido e mostrar quantos são, quantos ficaram no topo, a chance estimada contra a média do cliente, o ângulo que mais rendeu e uma referência da casa. O "Sugerir tema" volta usando isso (`MOSTRAR_SUGERIR_TEMA` em `components/home-form.tsx`).

## Task D: recalibração mensal

Retreinar no mês novo, testar no seguinte e publicar a acurácia num painel. Se cair abaixo do portão, o preditor volta a só mostrar dados.
