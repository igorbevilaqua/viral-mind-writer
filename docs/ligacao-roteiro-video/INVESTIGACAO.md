# Ligação roteiro do Codex → roteiro do CRM → vídeo (plano 024, item 4.1)

Investigação de 20/10/2026. Só leitura: SELECT no banco principal (`qclvrddrqulgfzccndnl`) e no CRM (`adtnxhxjgpdqehuxrvzl`), casamento rodado localmente em node, nada gravado. Scripts da prova em
`/private/tmp/claude-501/-Users-igorbevilaqua-Projetos-Codex/780c57e9-7704-49dc-8d41-54e0babe5422/scratchpad/lig/` (`probe.mjs`, `join.mjs`, `perf.mjs`, `manual.mjs`, `falta.mjs`).

## Resumo

1. Não existe trilha Codex → CRM. O roteiro sai pelo botão "Copiar tudo" (`components/session-view.tsx:1551`) e é colado à mão no CRM. Nenhum id sobrevive.
2. **`vm_script_matches` parou em 21/09 porque a RPC estoura o tempo.** `vm_match_scripts()` leva 11,7 s (EXPLAIN ANALYZE de hoje). O `authenticator` do PostgREST tem `statement_timeout=8s`. `casarRoteiros()` pega o erro, imprime um `console.warn` e devolve zero. O ETL roda toda segunda (último: 19/10), mas não casa nada desde 21/09. É essa a causa do "último publicado: 11/09". Os 2 publicados de 12/10 tiveram o link colado à mão.
3. **Casar pelo CRM funciona e acha o dobro.** Usei a mesma régua de 5-gramas de `lib/script-matches.ts`, com o mesmo limiar de 0,08. Resultado: **56 roteiros do Codex caem em 56 roteiros do CRM, e 42 deles foram postados (120 vídeos)**. O casamento direto só confirmou 20. Bate 20/20 com `vm_script_matches`, sem nenhuma divergência. Na checagem manual de 10 casos da faixa arriscada (0,08 a 0,29): **0 falsos positivos**.
4. Os roteiros do Codex que foram publicados performam acima dos humanos dos mesmos clientes no mesmo período: coeficiente mediano por roteiro **1,67 contra 1,25**, e **55% contra 42%** com coeficiente ≥ 1,5. O sinal é positivo, mas não conclusivo: n = 38 e há viés de seleção.
5. Proposta: uma função nova no ETL, `casarComCrm()`, com cerca de 60 linhas em `lib/script-matches.ts`, mais uma migration de 3 linhas e um teste. Ela grava em `vm_script_matches` (que já existe). Com isso, flywheel, Kasparov e `codex_vs_canal` passam a recebê-la sem mudar mais nada.

---

## 1. Como o roteiro sai do Codex hoje

- **Codex → CRM: cópia manual.** Não há API, botão "enviar" nem webhook. `grep` por crm/codex no repo do CRM (`viral-crm-v2-supabase`) não acha integração nenhuma. No Codex, o único cliente do CRM é `crmDb` (`lib/db.ts:19`), que só *lê* `scripts.script_text` para o few-shot (`lib/pipeline/context.ts:113`). **No `.env.local` do Codex não há `CRM_SUPABASE_URL`/`CRM_SERVICE_ROLE_KEY`.** Antes de depender do CRM no ETL, confirmar que essas duas variáveis existem na Hostinger.
- **CRM → vídeo: o coletor.** `api-viral-data/src/services/crm/crmMatcher.ts` gera um embedding Gemini da transcrição de cada vídeo novo e consulta `match_documents` no CRM (top 5, filtro por cliente, janela de −2 a +90 dias). Com score ≥ 0,87 marca `vm_script='sim'` e grava `videos.crm_script_id`; com ≥ 0,80, `verificar`. Ele também preenche `scripts.posted_at` e `video_link` no CRM. Confere: dos 56 roteiros do CRM casados, os 42 com `posted_at` são exatamente os 42 que têm vídeo com `crm_script_id` no banco principal.
- **`vm_script_matches`** (migration 0040, plano 020 WP-A) casa roteiro do Codex com **vídeo** direto, pela transcrição. Não passa pelo CRM. `vm_match_scripts()` gera os candidatos com `ts_rank` do hook, para o mesmo cliente via `canais`, na janela de −3 a +60 dias. Quem decide é `decidirCasamentos()`: sobreposição de 5-gramas ≥ 0,08 é automático, entre 0,02 e 0,08 vai para o Kasparov. O ETL semanal preenche a tabela (`lib/etl.ts:616`). Dados: 50 linhas (49 confirmadas, 1 pendente), de 06/09 a **21/09**, cobrindo 20 roteiros.
- **Por que parou:** a RPC refaz `to_tsvector` de todo vídeo de cada canal do cliente para cada roteiro ainda não decidido (hoje 254, porque roteiro que não casou nunca sai da busca). O corpus cresceu e a consulta passou de 8 s. O `catch` silencioso foi feito de propósito ("best-effort"), mas acabou escondendo a quebra durante 4 semanas.
- **Por que, mesmo funcionando, ele perde metade:** dos 22 publicados (via CRM) que ele não pegou, 10 são roteiros do Codex **sem `client_id`** (78 dos 277 roteiros não têm cliente, e a RPC faz join por `canais.cliente_id`). 4 foram gerados depois que a RPC passou a estourar. 8 não casaram por outro motivo: candidato abaixo de `ts_rank` 0,4, ou vídeo sem transcrição na hora. 3 dos 22 foram usados para **outro cliente** (gerado para o Renato, postado no Túlio, por exemplo), e um join por cliente nunca acharia esses.

## 2. Casamento retroativo Codex → CRM (prova)

**Amostra:** os 277 roteiros do Codex (266 deles dos últimos 90 dias, ou seja, quase tudo) contra 2.462 roteiros do CRM criados desde 25/06. Janela: o roteiro do CRM foi criado entre 3 dias antes e 60 dias depois do roteiro do Codex. **Sem filtro de cliente**: o texto decide.

**Métrica:** fração dos 5-gramas do Codex (hook + roteiro) presentes no `script_text` do CRM. É a `sobreposicao()` de `lib/script-matches.ts`, sem mudança. Um roteiro do CRM pertence a um único roteiro do Codex (a versão com maior sobreposição).

| melhor sobreposição | roteiros Codex | mesmo cliente | outro cliente | sem cliente no Codex |
|---|---|---|---|---|
| < 0,02 | 184 | 42 | 76 | 66 |
| 0,02–0,05 | 16 | 15 | 1 | 0 |
| 0,05–0,08 | 9 | 9 | 0 | 0 |
| 0,08–0,15 | 11 | 9 | 2 | 0 |
| 0,15–0,30 | 14 | 11 | 3 | 0 |
| 0,30–0,50 | 11 | 9 | 1 | 1 |
| ≥ 0,50 | 32 | 18 | 2 | 12 |

Com o limiar de 0,08 (o `MATCH_AUTO` atual), depois da deduplicação: **56 roteiros do Codex, de 56 sessões diferentes, viram 56 roteiros do CRM. 42 foram postados (120 vídeos no banco principal) e 14 estão no CRM sem post** (12 `enviado_cliente`, 2 `estoque_naousados`).

| limiar | casados | postados | concordam com `vm_script_matches` | divergem |
|---|---|---|---|---|
| 0,08 | 56 | 42 | 20 de 20 | 0 |
| 0,15 | 49 | 37 | 17 (perde 3 verdadeiros) | 0 |
| 0,30 | 41 | 31 | 15 (perde 5 verdadeiros) | 0 |

Subir o limiar só perde verdadeiros. Não aparece falso positivo para filtrar.

**Checagem manual de 10 casos**, os mais baixos acima de 0,08 (0,088 a 0,290), excluindo os já confirmados. Li o início dos dois textos e os 5-gramas em comum. **10 de 10 são o mesmo roteiro**, reescrito pelo humano. Os trechos em comum são frases inteiras, como "existe caminho jurídico para reorganizar dívidas inclusive com condições muito melhores", "na Kahal Zur Israel", "86 bilhões de dólares vendendo [carne]" e "anthonela xavier e marina costa". Em todos, o segundo melhor candidato fica entre 0,000 e 0,050: o vencedor é inequívoco.

**Zona cinza (0,02 a 0,08):** também li os 10 casos de 0,04 a 0,08. Todos têm a mesma pauta e frases copiadas do Codex, com o texto refeito, e o segundo candidato ≤ 0,017. São verdadeiros do tipo "o Codex serviu de matéria-prima". Esse é exatamente o sinal que o item 3.4 quer (diff de edição pesada). Proposta: mandar para o Kasparov como pendente, como já se faz hoje.

**Funil por mês** (roteiros / sessões / no CRM / postados): jul 21/19/2/2 · ago 106/88/37/28 · set 88/60/14/10 · out 62/57/3/2. No total, cerca de 25% das sessões viram roteiro no CRM e 19% viram vídeo. Outubro está baixo também por latência: o roteiro ainda não foi gravado.

## 3. Performance: Codex publicado × humano, mesmo cliente × rede × período

Fonte: `oraculo.fato_video`, apenas vídeos maduros (`maturando=false`), de 31/07 a 18/10, nos 15 clientes que tiveram roteiro do Codex postado. "Humano" é um vídeo com `crm_script_id` e `vm_script='sim'` cujo roteiro do CRM **não** casou com o Codex. "Acerto" é `classificacao='acerto'` (coeficiente ≥ 1,5).

| unidade | grupo | n | coef mediano | % acerto | % viral+ | views medianas | retenção do hook mediana |
|---|---|---|---|---|---|---|---|
| vídeo | Codex | 100 | 1,50 | 30% | 19% | 4.491 | 65,5% (n=14) |
| vídeo | humano (CRM) | 2.159 | 1,20 | 21% | 11% | 5.398 | 67% (n=234) |
| vídeo | sem roteiro do CRM | 1.924 | 1,15 | 11% | 3% | 2.975 | — |
| roteiro (mediana dos posts) | Codex | 38 | **1,67** | **55%** ≥ 1,5 | — | 19.700 (soma das redes) | — |
| roteiro | humano (CRM) | 880 | **1,25** | **42%** ≥ 1,5 | — | 13.500 | — |

Pareado por cliente × rede, nas 40 células com pelo menos 1 vídeo do Codex: o Codex fica acima da mediana humana em **23 e abaixo em 17**. O teste do sinal não é significativo (p ≈ 0,4). Os maiores acertos: ROT-2853 Naruto (coef 194), ROT-2784 Palmeiras (90), ROT-2744 Argentina/Lula (69), ROT-3298 Nike (38), ROT-3065 "Brasil sufocando empresas" (35; 1,58 M views), ROT-3277 Apple (33). As perdas se concentram em Rafael Rodrigues, Pedro Elero no YouTube e Lincoln Fracari.

Ressalvas:
- **Seleção.** Só vira vídeo o roteiro que o time escolheu e reescreveu. A comparação mede "Codex escolhido e editado" contra "humano", e não diz que o Codex sozinho escreve melhor.
- **n pequeno**, e o coeficiente tem cauda longa: as medianas de célula com n de 1 a 6 oscilam muito.
- Retenção existe para poucos vídeos (14 do Codex), então não dá para comparar.

## 4. Proposta mínima, automática, daqui para frente

**Onde:** no Codex, `lib/script-matches.ts`, chamado no ETL semanal ao lado de `casarRoteiros()` (`lib/etl.ts:616`). O coletor e o CRM não mudam: o coletor já liga CRM → vídeo em `videos.crm_script_id`, e só falta o Codex ligar Codex → CRM. Roda dentro do `.github/workflows/etl-semanal.yml` que já existe.

**Migration 0055 (3 linhas; 0051-0054 já eram do plano 025):**
```sql
alter table vm_generated_scripts add column if not exists crm_script_id uuid, add column if not exists crm_sobreposicao real;
create index if not exists vm_generated_scripts_crm_idx on vm_generated_scripts (crm_script_id);
```
Não precisa de tabela nova: o vídeo continua em `vm_script_matches`, com `metodo='crm_shingle'`. O texto publicado não precisa ser copiado, porque se lê do CRM por `crm_script_id` quando necessário (o diff do 3.4 e o few-shot já fazem isso).

**`casarComCrm()` (~60 linhas, reaproveitando `sobreposicao`, `MATCH_AUTO`/`MATCH_PENDENTE` e `publicar`):**
1. Roteiros do Codex dos últimos 75 dias com `crm_script_id` nulo.
2. `crmDb.from("scripts").select("id, script_text, created_at")` na janela (cerca de 2,5 mil linhas, paginado **com `.order("id")`**: sem ordem a paginação do PostgREST duplica e perde linhas, como aconteceu nesta prova).
3. Melhor candidato por roteiro e dedupe por roteiro do CRM, como em `decidirCasamentos`. Com ≥ 0,08, gravar `crm_script_id`/`crm_sobreposicao`. Com 0,02 a 0,08, gravar como pendente.
4. `viralData.from("videos").select("id, link_video, data_publicacao, canal_id").in("crm_script_id", ids)` → upsert em `vm_script_matches` (`confirmado` = true se auto, null se pendente; o Kasparov já lê null) → `publicar()` com o link do Instagram.

Custo de CPU: 277 × 2.462 comparações de conjuntos levaram menos de 1 s localmente. Não há RPC pesada.

**Junto, conserto de 1 linha na RPC antiga:** limitar `s` a `g.created_at > now() - interval '75 days'` (roteiro mais velho já não cabe na janela de +60 dias). Ou aposentar `vm_match_scripts`, já que o caminho via CRM cobre 20 de 20 dos casamentos dela e acha mais 22. E trocar o `console.warn` por um campo no resultado do ETL (`casamento_erro`), que aparece no Summary do GitHub Actions. Sem isso, a próxima quebra também passa despercebida.

**Brinde para o 4.2:** um roteiro sem `crm_script_id` depois de 14 dias é "não usado" sem ninguém clicar em nada (hoje são cerca de 75% das sessões).

**Esforço:** P/M, meio dia. Migration (3 linhas), função (~60), chamada no ETL (2), teste puro em `tests/script-matches.test.ts` (~20, usando os pares desta prova como fixture), backfill rodando o mesmo código uma vez (o `scripts/backfill-matches.ts` já existe; acrescentar a chamada). Pré-requisito: as variáveis `CRM_*` configuradas em produção.
