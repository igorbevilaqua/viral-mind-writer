# Transcrição do "modelar vídeo": diagnóstico (23/10/2026)

Item 1 de `docs/estrategia-2026-10/ESTRATEGIA.md`.

## Base

Sessões dos últimos 120 dias com anexo `video_link` marcado como modelagem (Modelar e Replicar): **75**. Geraram roteiro: **55**. Morreram antes do roteiro: **20**.

Fontes: `vm_sessions` (status, error_message), `vm_generated_scripts` e `hub.atividades` (evento `erro`, que guarda cada tentativa, não só a última). Só leitura.

## Onde as 20 morreram

| causa | sessões | modo | já corrigido antes? |
|---|---|---|---|
| **Transcrição** | **10** | | |
| vídeo com mais de 120 s recusado (136, 150, 155 s) | 3 | 2 Modelar, 1 Replicar | não, corrigido agora |
| HTML no lugar de JSON (Supadata) | 2 | Modelar | sim, 17/08 (`13ab013`) |
| link ruim: texto da tela colado junto do link (1), link de perfil (1) | 2 | Modelar | não, corrigido agora |
| crédito do ScrapeCreators acabou | 1 | Modelar | a mensagem sim (`9e91d90`), o crédito não |
| Supadata respondeu sem texto (link /p/) | 1 | Modelar | parcial, ver abaixo |
| falha sem motivo gravado (30/07, antes de `761229d`) | 1 | Modelar | sim |
| **Parou esperando a confirmação da premissa** | **6** | 5 Modelar, 1 Replicar | só diagnóstico |
| **Não extraiu a tese** | **2** | Modelar | provavelmente sim (`86d864d`, `d3453bd`) |
| autópsia voltou incompleta duas vezes | 1 | Modelar | sim (`d3453bd`, 21/09) |
| crédito da Anthropic acabou (depois da transcrição) | 1 | Replicar | fora do escopo |

Mais 5 sessões bateram em erro de transcrição e só geraram roteiro depois de nova tentativa ou de colar o texto (vídeo de 403 s, crédito ScrapeCreators, "Internal Server Error" e ScrapeCreators vazio).

## O que está por trás

1. **O Supadata falha calado.** Desde 17/08 todo erro de reel que chegou à tela é do ScrapeCreators, o plano B. Ou seja: o Supadata caiu antes em todos eles, e o motivo dele nunca foi gravado. O plano B recusa vídeo com mais de 120 s e cobra crédito, então "vídeo longo" e "sem crédito" são sintomas do Supadata fora.
2. **Vídeo longo não tinha saída.** Nenhuma fonte cobria reel acima de 2 minutos.
3. **Link fora do formato.** O código só aceitava `instagram.com/reel|p|tv/<id>` exato. Texto colado em volta e perfil na frente quebravam.
4. **Premissa:** as 6 sessões têm a tese sugerida gravada (208 a 325 caracteres) e ninguém confirmou. 4 eram sem cliente (testes dos adm). Uma pausou 4 vezes: a pessoa conjurou de novo em vez de confirmar, o que sugere que a caixa de confirmação não está óbvia. Duas delas tinham passado antes por "sem crédito".
5. **Tese:** os 2 casos são de 19/08, o dia em que entrou a nova tentativa da autópsia. Desde a tool estrita (21/09) não houve nenhum.

## O que mudou no código

- **Vídeo longo:** novo plano C para reel. Pega o arquivo do vídeo pelo post do ScrapeCreators (1 crédito) e transcreve com o Whisper da OpenAI. Até 3 minutos ou 24 MB vai inteiro. Acima disso usa só o começo, e a autópsia gravada leva o aviso "TRANSCRIÇÃO PARCIAL", que a sessão mostra na caixa "Desconstrução do material".
- **Supadata:** vídeo que o Supadata devolve como job assíncrono (`jobId`) agora é esperado por até 90 s, em vez de virar "sem transcrição".
- **Erro:** quando todas as fontes falham, a tela recebe uma frase curta (sem créditos, chave inválida ou tente de novo) e o detalhe de cada fonte vai para `vm_sessions.debug.detail` e para o evento `erro` do hub, campo `detalhe`.
- **Link:** acha o link no meio do texto, tira `?igsh=`, `?utm_` e o perfil da frente, troca `/reels/` por `/reel/`, segue link curto (`vm.tiktok.com`, `tiktok.com/t/`, `instagram.com/share/`). Link de perfil recebe uma mensagem própria, sem gastar chamada paga.

Teste real (3 chamadas): reel de 155 s transcrito inteiro em 27 s. Reel de 403 s transcrito nos primeiros ~158 s em 39 s. Custo total aproximado: US$ 0,04 de OpenAI e uns 4 créditos de ScrapeCreators.

## Decisões do dono

1. **Conferir `SUPADATA_API_KEY` na Hostinger.** No `.env.local` ela está vazia. Se na produção também estiver vazia ou vencida, é por isso que todo reel cai no plano B.
2. **Conferir `OPENAI_API_KEY` na Hostinger.** O plano C só roda com ela. Sem ela, vídeo longo continua recusado, agora com mensagem clara.
3. **Alternativa paga ao Whisper:** o ScrapeCreators aceita `allow_long_transcription=true` por 10 créditos a cada minuto. Não liguei.
4. **TikTok só tem o Supadata.** Se o Supadata estiver fora, TikTok não transcreve (3 de 46 referências).
