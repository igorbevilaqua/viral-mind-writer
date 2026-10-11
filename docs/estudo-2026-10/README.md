# Estudo 2026-10: padrões de sucesso nos roteiros da casa

Os 2.809 roteiros VM do CRM publicados em 2026 (7.049 vídeos), medidos contra o resultado por parte do roteiro (hook, subhook, corpo, conclusão, comando), payoff, território de tema e plataforma. Relatório para o time: doc "Estudo de roteiros VM, outubro 2026" (claude.ai, privado até ser compartilhado).

- `playbooks/`: as versões propostas (hook v4, subhook v1, conclusao v1, payoff v1, pauta v1, comando v3, storytelling v3, checklist v4, style_guide v5) e `plataformas.md` (referência para o time). As nove primeiras estão em `vm_playbooks` com `active=false`: ative no /ensinar. Depois de ativar, copie o arquivo para `playbooks/<slug>.md` (o `seed-playbooks.ts` cria versão ATIVA; não rode para propor).
- `achados/<frente>/achados.md`: o resultado de cada frente (hooks, corpo, comando, embeddings, payoff, plataformas, clientes) com números, exemplos e o que não deu para afirmar; `achados/cego/`: a leitura cega de 232 pares.
- `src/`: o código. `lib.mjs` é a régua comum (estrato cliente x rede x trimestre, Mantel-Haenszel, replicação antes/depois de 01/07/2026). `export.ts` regenera a base (`data/`, fora do git: ~63 MB, inclui os embeddings do CRM).
- `dados/`: o que custou API ou é caro de refazer: `rotulos_llm.json` (payoff e estrutura por roteiro, US$ 6,38), `clusters.json` (territórios), os pares cegos e o gabarito.

Reproduzir: numa pasta com `src/`, `data/` e um link para `node_modules` do Codex, rode `npx tsx --env-file=<.env.local do Codex> --env-file=<.env.local do Cockpit> src/export.ts`, depois `node src/segment.mjs`, e cada frente com `node src/<frente>/<arquivo>.mjs`.

Régua: "topo" = quartil de cima do coeficiente viral no estrato cliente x rede x trimestre (base 26%). "Acerto" oficial = classificação do Oráculo, coeficiente acima de 3 com 10 mil views ou mais (base 20%). A duração do TikTok vem em milissegundos em parte da base (a lib corrige).
