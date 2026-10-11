# Estudo 2026-10: padrões de sucesso nos roteiros da Viral Media Labs

Leia este arquivo inteiro antes de começar. Ele vale para todos os subagentes do estudo.

## O pedido do dono (Igor)

Análise profunda dos roteiros que a casa produziu em busca de padrões de sucesso em hooks,
subhooks, storytelling, conclusões, comandos (CTA) e **payoff** (a recompensa que o vídeo entrega:
revolta, novidade, ângulo contraintuitivo, orgulho, oportunidade...). Associações com nicho e
cliente: algumas regras são globais, outras só valem em combinação. Plataformas diferentes
(Instagram, TikTok, YouTube Shorts, Facebook): o que funciona numa nem sempre funciona na outra.
Com as lições, os playbooks do Codex serão corrigidos, evoluídos e criados (hook, storytelling,
comando, checklist, guia de estilo; novos: subhook, conclusão, payoff, plataformas) e sairá um
relatório final com as lições gerais e por cliente.

**A exigência central:** cuidado com classificação abstrata. Prefira informação concreta e
aplicável: estruturas, palavras, tamanhos, posições, tipos de personagem, fórmulas que um
roteirista consiga usar amanhã. Cada achado tem que virar uma instrução do tipo "faça X / evite Y",
com exemplo real.

## O que já se sabe (não repita, avance)

O estudo de setembro (`/Users/igorbevilaqua/Projetos/CODEX - Viral Mind/docs/estudo-2026-09/relatorio.md`)
mediu rótulos ABSTRATOS (16 mecanismos de hook, 19 estruturas narrativas, gatilhos de comando) e 17
métricas de texto (tamanho de frase, pronomes, números). Quase nada separou: só Conflito Declarado
(hook) e B1 Davi e Golias (estrutura) com lift fraco. Conclusão deles: "o que separa está no tema,
na premissa e na execução". Este estudo ataca exatamente isso, com três diferenças:
1. só os roteiros VM (escritos pela casa, `vm_script='sim'`), com o texto ESCRITO do CRM, em parágrafos;
2. cada parte do roteiro medida contra a métrica que ela deveria mover (hook contra retenção nos 3s,
   comando contra seguidores por mil views, conclusão contra compartilhamento...);
3. características concretas e mineração de palavras, com replicação temporal.

Bateria de sanidade já rodada (régua abaixo), para calibrar: roteiro modelado (fontes citam
"Modelagem") OR 1,23 [1,09 a 1,40]; roteiro com menos de 300 palavras OR 0,70; 450+ palavras OR 1,26;
vídeo com menos de 75s OR 0,71; hook com "você" OR 0,78; hook que cita China OR 1,81. Hook com número,
tamanho do hook, presença de "Eu sou" no fim: sem efeito.

## Os dados (pasta `data/`, só leitura)

Rodar tudo a partir de `/private/tmp/claude-501/-Users-igorbevilaqua-Projetos-Painel-VM/3f14d0f7-f38e-4a96-9be6-95572c39fd09/scratchpad/estudo`
com `node src/<sua-pasta>/<arquivo>.mjs` (ESM, Node 24; não há numpy nem Python científico).
`node_modules` aponta para o do Codex (tem `@supabase/supabase-js` e `@anthropic-ai/sdk`).

- `videos.json`: 7.049 vídeos VM (1 roteiro postado em 3 redes = 3 vídeos). Campos: `video_id, script_id, cliente_id, cliente, plataforma, data, duracao (s), hook_video (hook falado, extraído do vídeo), comando_video (CTA falado no vídeo daquela rede), titulo_video, assunto (resumo do vídeo), categorias, sentimentos (rótulos do Gemini), views, coef (coeficiente viral = views ÷ mediana móvel 180d do próprio canal), classificacao, acerto (classificação oficial do Oráculo: coef acima de 3 E 10 mil views ou mais; é a "taxa de acerto" da casa. Atenção: `DESFECHOS.acerto` da lib é outra régua, coef >= 1,5), maturando, ret_hook/ret_sub/ret_final (% de retenção, quase só Instagram), ret_sub_cond (ret_sub/ret_hook), ret_final_cond (ret_final/ret_sub), seguidores, seg_por_mil, comp_por_mil, salv_por_mil, coment_por_mil, curt_por_mil, cls_* (rótulos abstratos do estudo de setembro), p_* (percentis no estrato cliente x plataforma)`.
- `scripts.json`: 2.809 roteiros do CRM. `script_id, cliente, titulo (headline), texto (roteiro escrito, parágrafos por \n), roteirista, entregue, postado, modelagem (bool), modelagem_url, topicos, personagens, plataformas, video_ids`.
- `segmentos.json`: o roteiro escrito já fatiado sem LLM. `hook` (1º parágrafo falado), `subhook` (2º), `sub2` (3º), `corpo` (do 3º até antes da conclusão), `conclusao` (parágrafo antes do bloco final), `conclusao2` (o anterior a esse), `bloco_final` (apresentação + comando escritos), `apresentacao` ("Eu sou..."), `cta_por_plataforma` (23 roteiros têm CTA diferente por rede), `n_paragrafos, palavras_total, palavras_hook, palavras_subhook, palavras_conclusao`.
- `nichos.json`: nichos por cliente (com peso). `panorama.json`: resumo por cliente.
- `emb.f32` + `emb_ids.json`: embeddings gemini-embedding-001 (3072 dimensões, float32, já normalizados L2) dos 2.809 roteiros; linha i é `emb_ids[i]`.

Volume analisável (não maturando, views>0, sem repost): Instagram 2.658, TikTok 1.857, YouTube 1.790,
Facebook 276. Retenção (hook/subhook/final) e seguidores: ~1.300 vídeos do Instagram, ~250 do TikTok.
Compartilhamentos: IG ~1.250, TT ~1.630. Salvamentos: TT ~1.820. YouTube não tem retenção nem
compartilhamento na base. Correlação do percentil do MESMO roteiro entre redes: IG x TT 0,49;
IG x YT 0,35; TT x YT 0,32 (há qualidade de roteiro e há muito efeito de plataforma).

## A régua (use `src/lib.mjs`, não reimplemente)

```js
import { carregar, avaliar, porGrupo, exemplos, minerar, tabela, DESFECHOS, wilson, mantelHaenszel,
         norm, tokens, palavras, frases, ngramas, MACRO_NICHO, OUT, fmt } from "../lib.mjs";
const L = carregar();               // linhas = vídeos analisáveis com .s (roteiro), .g (segmentos), .macro, .nichos, .periodo, .pq
const a = avaliar("nome", (r) => /regex/.test(norm(r.g.hook)), { desfecho: "coef", plats: ["Instagram","TikTok","YouTube"] });
console.log(tabela([a]));
porGrupo("nome", pred, (r) => r.cliente);   // ou r.macro, r.nichos[0]
exemplos(pred, (r) => r.g.hook, { n: 3 });  // roteiros reais de melhor desempenho com a característica
minerar((r) => r.g.hook, { ns: [1,2,3], minRoteiros: 40 });   // n-gramas que replicam
```

- **Desfecho principal `coef`**: vídeo no quartil superior do coeficiente viral dentro do estrato
  cliente x plataforma x trimestre (o trimestre tira o momento da conta). Base ~26%.
- Outros desfechos (todos "quartil superior no estrato cliente x plataforma"): `acerto` (coef>=1,5,
  absoluto), `ret_hook`, `ret_sub`, `ret_final`, `seguidores` (por mil views), `compart`, `salvamentos`, `comentarios`.
- `avaliar` devolve lift com Wilson, odds ratio de Mantel-Haenszel por cliente x plataforma (controla
  cliente), lift na **descoberta** (antes de 01/07/2026) e na **validação** (depois), e por plataforma.
  Leitura automática: "ajuda (replica)", "atrapalha (replica)", "sinal sem replicação", "sem evidência", "amostra pequena".
- Só chame de **regra** o que replica. "Sinal sem replicação" é hipótese. Com muitas comparações
  (mineração de palavras), espere falsos positivos: exija replicação e n>=40 roteiros.
- Separe sempre o que é efeito de cliente/nicho do que é global. `porGrupo` por `r.macro` e por `r.cliente`.
- Uma característica do texto escrito é do roteiro; o vídeo é a unidade de medida. Não some o mesmo
  roteiro em redes diferentes como se fossem roteiros diferentes quando falar em "n de roteiros".

## Regras de trabalho

- Seu código em `src/<sua-pasta>/`, sua saída em `out/<sua-pasta>/`. Não altere `src/lib.mjs` nem `data/*`
  (exceto o arquivo que sua tarefa manda escrever). Precisa de helper novo? Escreva no seu arquivo.
- Banco: nada de escrita. Se precisar de algo que não está na base, leitura via MCP Supabase
  (Viral Data `qclvrddrqulgfzccndnl`, CRM `adtnxhxjgpdqehuxrvzl`), mas a base local deve bastar.
- Economia de tokens: não imprima JSON grande no console; resuma no script e imprima tabelas curtas.
  Não leia roteiros inteiros em massa; leia amostras pequenas e direcionadas.
- Texto em português do Brasil. **Nunca use travessão (— ou –)** em nada que você escrever na saída
  (é regra do produto; use dois-pontos, vírgula ou ponto).
- Playbooks atuais (para conferir o que eles afirmam contra o dado): `/Users/igorbevilaqua/Projetos/CODEX - Viral Mind/playbooks/`
  (`hook.md` v3, `comando.md` v2, `checklist.md` v3, `style_guide.md` v4, `storytelling.md` v1).

## Formato da entrega (`out/<sua-pasta>/achados.md` + `achados.json`)

1. Resumo em 10 linhas: os achados mais fortes, em linguagem de roteirista.
2. Para cada achado: **o que** (concreto), **número** (lift, n, IC, OR MH, descoberta/validação, por
   plataforma), **onde vale** (global, nicho, cliente, plataforma), **exemplos reais** (2 ou 3 textos de
   topo com cliente, rede e coef; quando ajudar, 1 contraexemplo fraco), **instrução para o playbook**
   (frase pronta, "faça / evite", com reescrita de exemplo).
3. O que os playbooks atuais afirmam e o dado confirma, corrige ou desmente (cite a regra).
4. O que NÃO deu para afirmar (amostra, confusão com cliente/época), dito com clareza.
`achados.json`: lista de `{ id, parte (hook|subhook|corpo|conclusao|comando|payoff|plataforma|tema), achado, numeros, escopo, exemplos, instrucao, confianca (alta|media|baixa) }`.
Sua resposta final para quem te chamou: o resumo de 10 linhas e o caminho dos arquivos. Nada mais.
