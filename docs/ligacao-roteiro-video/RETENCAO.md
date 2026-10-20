# Retenção, comentários e salvamentos: por que pararam

Diagnóstico só leitura, 20/10/2026. Banco `qclvrddrqulgfzccndnl` (apenas SELECT), código local do `api-viral-data` e do `performa-social`. Nenhuma chave foi lida ou impressa.

## Resumo

A premissa do plano 024 item 4.4 está errada. **Nenhum coletor grava retenção.** `metricas_retencao` só recebe linhas por **importação manual de planilha (CSV/XLSX)** no dashboard do performa-social, ou por digitação na aba Retenção. Nada quebrou em 14/09. Essa data é apenas o `max(data)` da última planilha que alguém subiu (21/09). Cada cliente parou num dia diferente, conforme o consultor dele deixou de preencher e importar.

## 1. De onde vem a retenção

Quem grava (grep em todos os repos em `~/Projetos`):

| Escritor | Arquivo | Como |
|---|---|---|
| Importação de planilha | `Viral Data/performa-social/src/components/dashboard/ImportRetentionModal.tsx:632` | `supabase.from('metricas_retencao').insert(...)`, a partir de um CSV/XLSX com as colunas `plataforma, headline, link_video, data, data_publicacao, retencao_hook, retencao_subhook, retencao_final, seguidores_ganhos, taxa_nao_seguidores` |
| Digitação manual | `Viral Data/performa-social/src/components/dashboard/RetentionTab.tsx:153` | insert de uma linha, pelo formulário |

- O coletor (`api-viral-data/src`) não tem nenhuma referência a `metricas_retencao`, retenção ou insights.
- Nenhuma edge function grava na tabela. `generate-report`, `generate-embedding` e `analyze-metrics` só leem.
- Não há OCR nem API. Os números vêm do app nativo (insights do Reels, TikTok Studio), passados à mão pelo consultor para a planilha-modelo.
- Existe OAuth do Instagram Graph (`supabase/functions/instagram-auth`, `instagram-oauth-callback`, escopo `instagram_manage_insights`), mas **`instagram_tokens` tem 0 linhas** e `youtube_tokens` também. Só 1 canal do banco está marcado como `tipo_integracao='oficial'` (Igor Beviláqua XP). Os outros 99 são `nao_oficial`, ou seja, scraping.

## 2. O que mudou em 14/09

Nada mudou no sistema. Evidências:

**Os lotes de importação** (`created_at` agrupado por dia, últimos 4):

| Dia do import | Linhas | `data` máx. | Duplicatas exatas |
|---|---|---|---|
| 08/09 16:20 UTC | 672 | 08/09 | 509 |
| 21/09 18:53–21:40 UTC | 1632 | **14/09** | 1406 |
| 20/10 03:12–03:27 UTC (hoje, 00h12 BRT) | 463 | 09/09 | 435 |

- Hoje de madrugada alguém importou de novo (Fernando Pereira, Marcio Grazino, Patrick Diorio). A planilha, porém, terminava em 09/09: das 463 linhas, 435 são cópias exatas de linhas já existentes. Só 28 são novas (TikTok do Fernando, de março a julho). Ou seja, as pessoas ainda importam, mas a planilha não foi atualizada desde meados de setembro.
- Na tabela inteira, 4053 das 6452 linhas são duplicatas, porque cada planilha é cumulativa e é importada de novo do zero. Não há chave única em (video_id, data). As leituras usam "último registro", então o efeito é só ruído.

**Última data com retenção, por cliente** (escalonada, não simultânea):

- 14/09: Rodrigo Waughan (IG+TT), Ricardo Schumacher, Thiago Bisewski
- 08–09/09: Fernando Pereira IG, Marcio Grazino IG, Patrick Diorio
- 01–03/09: Pedro Elero, João Paulo Albuquerque TT
- agosto: Marcos Pelozato (25/08), Drielle Castelani, Izabela Anholett, Leonardo Nogueira, Franklin Tomich
- julho ou antes: Dilson Peres, Thiago Franco, Fernando TT, Rafael Rodrigues (maio), Manoel Victor e Marcelo Germano (abril), Cadu Neiva e Lincoln Fracari (fevereiro)
- Clientes ativos sem nenhuma retenção: o resto da carteira.

Um token expirado derrubaria todos de uma vez, ou cada um no dia em que vencesse. O que aparece é o padrão de trabalho manual que deixou de ser feito.

**Git:** o `performa-social` não teve nenhum commit entre 05/09 e 25/09. O último commit que tocou o import é de 09/07. O coletor teve um único commit em setembro, em 27/09 ("fotografia que o Cockpit lê"), depois da data em questão e sem relação com retenção.

## 3. O coletor está no ar?

- `curl http://82.25.74.56:3000/health` deu timeout de 6 s (exit 28), e a raiz `/` também. A porta 3000 não responde de fora, provavelmente fechada por firewall depois do commit de segurança de 12/07. Não testei mais nada.
- **O processo está vivo**, pelas evidências do banco: `metricas_diarias` teve o último insert hoje às 12:12 UTC, com 4496 linhas nas últimas 24 h. `error_logs` recebeu gravação às 14:39 UTC.
- Ruído em `error_logs`: 10 mil "x-api-key ausente" por semana, que são scanners de bots (`/login`, `/server-status`...). A proteção funciona. Há também 80 erros 503 da RapidAPI no scraper de Facebook e avisos de "protecaoZeros", que não têm relação com retenção.

## 4. Causa e conserto

**Causa:** a retenção depende de um processo humano, em que o consultor copia os números do insights nativo para a planilha e importa no performa-social. O processo parou de ser alimentado cliente a cliente. A última planilha nova chegou em 21/09 (dados até 14/09), e a de hoje veio com dados antigos.

**Conserto, por caminho:**

| Caminho | Quem | Tamanho | Observação |
|---|---|---|---|
| A. Retomar a planilha | Igor e os consultores | Recorrente: cerca de 1 h por cliente por semana | Resolve amanhã, mas é o mesmo processo que já morreu uma vez. |
| B. Instagram Graph API oficial (`instagram_manage_insights`) | Igor: cada cliente precisa autorizar via OAuth (página FB + conta IG Business/Creator) e o app Meta precisa de App Review para esse escopo. Agente: job no coletor que lê os insights de cada Reel. | Médio (M) no código, 2–4 dias. A parte humana (App Review e convencer clientes a conectar) é o gargalo, de semanas. | A Graph API entrega `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time`, `saved`, `reach` e `shares`. **Não entrega a curva de retenção** (hook 3 s / 7 s / final). Daria tempo médio assistido ÷ duração, que é um proxy de retenção, não hook. |
| C. TikTok (Business/Display API) | Igor: app TikTok aprovado + autorização de cada criador | M/G | A curva de retenção por segundo também não sai na API pública. Sai só no TikTok Studio. |
| D. Higiene do import | Agente, com autorização | Pequeno (P), cerca de 1 h | Índice único (video_id, data) com upsert no import. Limpa as 4053 duplicatas e impede novas. Não religa nada. |

**O que depende do Igor:** decidir entre A e B. Se for A, cobrar a planilha do time. Se for B, abrir o App Review na Meta e pedir aos clientes que conectem a conta. O agente consegue fazer o D e o código do B, mas não consegue gerar dado de retenção sozinho.

## 5. Bônus: comentários e salvamentos

**Texto de comentários (`comments`):** 4777 linhas, de 71 vídeos, todas inseridas num único mês (junho/2026, último `created_at` em 12/06). Nenhum código local grava nessa tabela (nem coletor, nem edge function, nem front). Foi uma carga avulsa, provavelmente pelo n8n antigo ou por um script único, e não uma coleta que parou. A causa é a mesma: nunca existiu coleta contínua. Para ligar seria preciso um job no coletor que chame um endpoint de comentários do scraper que já está no `.env` do VPS (ScrapeCreators tem comentários de IG e TT) para os N vídeos mais recentes por canal. O código é P/M (cerca de 1 dia). O custo é de 1 chamada paga por vídeo por coleta: com cerca de 100 canais × cerca de 10 vídeos novos por semana × 1 coleta aos 7 dias, são cerca de 1000 chamadas por semana. É preciso conferir o preço no plano do ScrapeCreators antes.

**Salvamentos do IG:** o coletor nunca grava salvamento de IG, só de TikTok (`collect_count`, presente em 35 mil das 41 mil linhas de TT em 30 dias). Salvamento de IG não é público: sai só pela Graph API com token do dono (`saved` em insights). O único canal com salvamento de IG é o "Igor Beviláqua XP" (`oficial`), com 2121 linhas de 19/01 a 01/10, e parou em 01/10. Não achei no código local quem gravava esses números, e `instagram_tokens` está vazio hoje. O token foi apagado ou o fluxo era externo. Para ligar para todos é o caminho B acima: depende de OAuth por cliente e do App Review da Meta.
