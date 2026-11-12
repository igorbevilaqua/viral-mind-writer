# 027 — Codex Modelagem (`/modelagem`)

Escrito em 12/11/2026, sobre `origin/main` em 9c98fd8. Nada implementado.

## 1. O pedido

Um mecanismo próprio de modelagem, em `/modelagem`: o usuário cola o link de um vídeo já
validado pelo algoritmo e recebe, rápido, um vídeo novo que **aproveita o que fez o original
viralizar** (tema, narrativa, estrutura, exemplos fortes, afirmações de impacto) e melhora três
coisas:

1. troca palavra difícil por palavra simples;
2. troca exemplo por um que conecta mais com o brasileiro, **quando houver um à altura**
   (exemplo estrangeiro forte fica);
3. reforça a premissa central com pesquisa ou dado.

Sem cara de cópia. A premissa do original é respeitada, e o motor da emoção predominante é
preservado e fortalecido.

## 2. Como a modelagem funciona hoje

Dois modos, escolhidos no anexo da home (`vm_attachments.modo`):

| Etapa | Modelar | Replicar |
|---|---|---|
| Transcrição | `lib/transcribe.ts` (corpus → YouTube → Supadata → ScrapeCreators) | igual |
| Autópsia (`modelagem.ts`) | extrai tese, recompensa, alegações e um **esqueleto livre de conteúdo** | igual |
| Pausa | usuário confirma a premissa (run 1 termina, run 2 recomeça) | igual |
| Pesquisa (Grok) | checa alegações + busca munição nova, sem teto | checa alegações, teto de 2 dados |
| Narrativa | storytelling propõe 3, Dados rankeia, vence uma | montada em código a partir dos beats |
| Escrita | roteirista **sem o texto original**, só o brief | replicador **com** o texto original |
| Hook | placar da casa (`selectHook`) | idem, com o mecanismo do original como pista |
| Depois | revisão → humanização → verificação | igual |

## 3. Crítica, com evidência

Uso (jul–nov/2026): 139 das 289 sessões têm modelagem (48%). 102 Modelar, 37 Replicar.
É a função mais usada do produto.

**3.1 O Modelar joga fora exatamente o que se quer aproveitar.** O schema da autópsia proíbe
conteúdo no esqueleto ("sem tema, nome, número, marca ou frase do original") e o roteirista
recebe a instrução "Você NÃO tem o texto original e não precisa dele". Exemplo forte e afirmação
de impacto são conteúdo: não atravessam. Sessão `b4725097` (quiet luxury): o original tinha
Succession, "o luxo gritou", a bolsa falsa na feira. O roteiro gerado não tem Succession e
trouxe Entrupy, Han/Nunes/Drèze no Journal of Marketing, Berger e Ward, Kering, Sabato De Sarno.
Virou outro vídeo, sobre o mesmo assunto.

**3.2 O Modelar ainda inventa narrativa.** Storytelling propõe três e o ranking escolhe. Na
mesma sessão venceu "a LVMH lucra com os dois", ângulo que o original não tinha. A narrativa
validada pelo algoritmo foi trocada por uma hipótese.

**3.3 O brief chega cortado.** `BRIEF_MAX = 2800` trunca no meio dos beats. Nas duas sessões
abertas o texto para no beat 5 ("clique de…", "[indig…"): loops, escalada, comando e gargalo
nunca chegam ao roteirista do Modelar.

**3.4 A pesquisa incha o roteiro.** "Traga mais fato e número que o original não tinha" sem
teto. É a reclamação do plano 024 (excesso de número) produzida por instrução.

**3.5 A emoção se perde no caminho.** A autópsia descreve a recompensa em abstrato; depois
revisão e humanização puxam tudo para o tom explicativo da casa. Sessão `06c6c811` (Replicar,
Selic): o original era alarme e indignação ("Urgente, urgente", "poder, meu amigo, poder"); o
gerado é uma aula correta sobre câmbio com ANP e coluna do Lauro Jardim.

**3.6 O hook não é o do original.** Passa pelo placar da casa. O time contorna colando o hook
original no campo de direção ("Siga com esse hook: …", Pepsi, McDonald's).

**3.7 Tamanho fixo.** Alvo de 420–500 palavras para qualquer original. O de 300 palavras virou
440; a proporção do vídeo validado é ignorada.

**3.8 Lento e frágil.** Mediana de ~10 min por roteiro (Modelar 10,3; Replicar 8,8), com uma
pausa no meio. 27 das 102 sessões Modelar terminaram sem roteiro (20 erros, 9 paradas na
confirmação de premissa). Erros dominantes: transcrição (limite de 120 s do Supadata, HTML de
gateway, crédito) e carrossel sem crédito.

**3.9 A transcrição do link não é salva.** `ensureTranscript` muta o anexo só em memória; em
sessão com `video_link`, `raw_content` fica nulo. Não dá para comparar original × gerado depois.

**3.10 Exemplo brasileiro não tem dono.** Só acontece se alguém digitar.

Ressalva honesta: nos roteiros casados com o CRM, a sobreposição publicado × gerado é maior com
modelagem (mediana 0,77 Modelar, 0,67 Replicar) que sem (0,55). n = 25 e 6, só sobreviventes.
Lê-se como: quando a modelagem acerta, o time muda pouco. O problema é a taxa de acerto.

## 4. O que aproveitar e o que largar

**Fica (reuso direto):**
- `lib/transcribe.ts` e `lib/carrossel.ts` (com os consertos da Task 1);
- a decisão "a premissa sai do vídeo; texto digitado é direção" (`plans/modelagem-manda-na-premissa.md`);
- "um material só";
- a checagem das alegações do original e a regra "contestado não vira afirmação nossa";
- as cinco travas do `agents/replicador.md` (base do escritor novo);
- `verificarScriptSalvo` pós-entrega, `slop-lint`, `medirPiso`, `fontesComProcedencia`;
- `vm_sessions` / `vm_generated_scripts` e a tela da sessão (Bob, ajustar, compartilhar, CRM);
- `lib/llm-catalogo.ts` para o modelo de cada função.

**Não entra no fluxo novo:**
- esqueleto livre de conteúdo e `composeBrief`;
- storytelling + ranking de narrativas;
- escolha de skill (o modo é o do original);
- pausa de confirmação de premissa (vira edição depois, ver §5);
- placar de hook da casa;
- tamanho fixo;
- cadeia revisão → humanização (entra só se o A/B pedir, Task 6).

O fluxo antigo (Modelar/Replicar na home) continua no ar, intocado, até o A/B decidir.

## 5. Desenho

Quatro passos, três chamadas de modelo. Alvo: menos de 3 minutos, sem pausa.

```
link → transcrição → LEITURA → PESQUISA DIRIGIDA → ESCRITA → portões em código → entrega
                                                                              └→ verificação (depois do done)
```

**Leitura** (1 chamada, substitui a autópsia). Guarda o conteúdo em vez de proibi-lo:
- `premissa`: a tese em 1–2 frases;
- `emocao`: a predominante + `motor` (o que no vídeo a produz: quem é o vilão, o que está em
  risco, qual a virada);
- `hook`: texto do original, a promessa e o mecanismo;
- `beats[]`: trecho do original, função, palavras;
- `ativos[]`: cada exemplo forte, afirmação de impacto e número, com `tipo` e `destino`:
  `manter` | `abrasileirar` (exemplo estrangeiro que não é a força do vídeo) | `checar`;
- `palavras_dificeis[]`;
- `nao_transferivel[]` (CTA de produto, autoridade pessoal, janela de notícia).

**Pesquisa dirigida** (1 chamada Grok, três pedidos fechados, nada de "munição"):
1. checar cada ativo `checar` (confirmado / contestado / não verificável, com fonte);
2. para cada ativo `abrasileirar`, até 2 candidatos brasileiros **com a mesma função**;
3. até 3 reforços da premissa (dado ou estudo), ordenados por força.

**Escrita** (1 chamada, com o texto original na mão). Reescreve beat a beat:
- mesma premissa, mesma ordem, mesma emoção; o motor é nomeado e tem que aparecer;
- ativo `manter` fica (com outras palavras); `abrasileirar` só troca se o candidato for tão
  forte quanto; contestado sai ou é atribuído;
- no máximo 2 reforços novos no roteiro inteiro;
- palavra difícil vira palavra simples;
- nenhuma frase literal;
- tamanho = original ± 15%;
- hook: mesma promessa e mesmo mecanismo do hook original, reescrito. Entrega 3 variações.
- devolve também `mudancas[]`: o que trocou e por quê (palavra, exemplo, dado + fonte).

**Portões em código** (sem modelo): cópia literal (sequência de 6+ palavras iguais ao
original), tamanho fora da faixa, `slop-lint`, piso de clareza. Reprovou → uma reescrita com o
motivo; reprovou de novo → entrega com o aviso na tela.

**Tela `/modelagem`:** um campo de link, cliente (opcional), direção (opcional). Resultado na
tela de sessão que já existe, com um painel a mais: original ao lado, premissa e emoção lidas
(editáveis → regera), e a lista de mudanças.

## 5.1 Correções: marcar tudo, aplicar de uma vez

Pedido do Igor (12/11): ajuste é rotina, e tem dois tipos. O direto ("troca por isto") e o
que é prompt ("preciso de uma pesquisa que confirme isso").

**O que já existe.** O Bob (`lib/pipeline/bob.ts`) já faz os dois: reescreve o trecho
selecionado seguindo uma instrução e decide sozinho se precisa pesquisar no Grok, devolvendo a
fonte. O que o torna lento é o formato: uma correção por vez, cada uma com espera e aceite, e
só dentro do modo de edição. E a caixa "Ajustar o roteiro" regera o roteiro inteiro (~10 min).

**O mecanismo novo é o Bob em lote, sobre marcações:**

1. O usuário lê o roteiro uma vez e vai **marcando**: seleciona o trecho e escreve a nota.
   Sem espera entre uma marca e outra. As marcas ficam listadas ao lado.
2. Cada nota é de um de três tipos, e o usuário não precisa escolher:
   - **texto pronto** (nota entre aspas, ou botão "trocar por"): substituição direta, sem
     modelo, instantânea;
   - **instrução** ("mais simples", "tá morno", "corta pela metade"): o Bob reescreve só o trecho;
   - **pedido de pesquisa** ("acha um dado que confirme", "isso é verdade?", "exemplo
     brasileiro"): o Bob pesquisa e reescreve, e a fonte entra em FONTES.
   Os dois últimos são a mesma chamada: o Bob já decide se pesquisa.
3. Atalhos de um toque na seleção, para as notas mais comuns: **Simplificar**, **Encurtar**,
   **Mais forte**, **Confirmar com fonte**, **Exemplo brasileiro**, **Voltar ao original**
   (este usa o trecho correspondente da leitura, só existe em `/modelagem`).
4. **Aplicar tudo**: as marcas rodam em paralelo. Reescrita simples volta em segundos; a que
   pesquisa, em ~30 s. O resto do roteiro não é tocado.
5. Cada marca volta como antes → depois, com a fonte quando houve pesquisa. Aceitar ou recusar
   uma a uma, ou aceitar tudo. Recusada pode ser refeita ("outra").
6. O aceite grava uma versão nova do roteiro (mesma tabela), e a verificação factual roda só
   nos trechos mexidos.

**Como se constrói (pouco código):** a tela guarda a lista de marcas e chama o `/api/bob` que já
existe, uma vez por marca, em paralelo; aplica os trechos do fim para o começo com
`spliceRoteiro`, para os índices não andarem. No `/modelagem` o Bob ganha no contexto a leitura
do original (premissa, emoção, o trecho original do beat), para corrigir sem sair da linha do
vídeo. Nenhuma tabela nova.

**Fica de fora por ora:** transformar correção em lição automática. As marcas aceitas ficam no
`pipeline_trace` com tipo e nota; quando houver volume, mostram qual regra do escritor está
falhando.

## 6. Tarefas

Cada uma é um commit, com o gate (`npx tsc --noEmit && npx eslint . && npm run check`).

1. **Transcrição confiável e salva.** Gravar `raw_content` no anexo depois de transcrever.
   Vídeo longo: o Supadata responde 202 com `jobId` (transcrição assíncrona) e hoje isso é
   tratado como falha; o plano B (ScrapeCreators) recusa acima de 120 s, e é esse o erro que
   aparece. Conserto: esperar o job do Supadata. Teste: `tests/transcribe-escada.test.ts`.
2. **Leitura.** `lib/modelagem/leitura.ts` + `agents/leitor.md`, schema estrito (reusar
   `estrito()` de `modelagem.ts`). Função nova `leitura` no catálogo de LLM. Cache em
   `vm_modelagem_analyses` com `analysis.versao = 2`. Teste do schema contra a API
   (`scripts/checa-leitura.ts`, no molde de `checa-modelagem-estrita.ts`).
3. **Pesquisa dirigida.** `lib/modelagem/pesquisa.ts` + `agents/pesquisador-modelagem.md`,
   sobre `lib/grok.ts`. Saída estruturada por ativo. Registrar custo no trace.
4. **Escrita + portões.** `lib/modelagem/escrever.ts` + `agents/modelador.md` (parte das cinco
   travas do replicador). `lib/modelagem/portoes.ts` puro, com `tests/modelagem-portoes.test.ts`
   (cópia literal, faixa de tamanho).
5. **Pipeline e rota.** `lib/modelagem/index.ts` (`runModelagem`), chamado por
   `app/api/generate` quando o anexo da sessão tem `modo = 'modelagem'` (`vm_attachments.modo`,
   a mesma coluna de Modelar/Replicar; `resolverModo` já degrada valor desconhecido para o
   fluxo antigo). Conferir a migration 0034: se houver CHECK na coluna, é uma migration de uma
   linha. Não usar `vm_sessions.modelo`: existe, está nula nas 289 sessões e o nome sugere outra
   coisa. Página `app/modelagem/page.tsx` com o formulário; `createSession` ganha o caminho.
   Grava em `vm_generated_scripts` com
   `pipeline_trace.modelagem = { leitura, pesquisa, mudancas, portoes }`.
6. **Painel na sessão.** Original × novo, premissa/emoção editáveis, lista de mudanças.
6b. **Correções em lote (§5.1).** Marcações na tela de sessão, atalhos, "Aplicar tudo" em
   paralelo sobre o `/api/bob`, aceite por marca, versão nova no aceite. `bobAssist` recebe a
   leitura quando a sessão é de modelagem. Vale também para as sessões do fluxo antigo.
7. **Banco de prova antes de divulgar.** 10 originais reais já modelados (os que têm
   transcrição salva + vídeos do corpus), novo × produção, leitura cega do Igor. Critério:
   o novo ganha em pelo menos 7 de 10 e nenhum reprova no portão de cópia. Só então o link
   entra no menu. Custo estimado do lote: ~US$ 30 (10 × produção a 2,27 + 10 × novo a ~0,70).
   Avisar antes de rodar (crédito Anthropic é o mesmo da produção).
8. **Depois do A/B:** decidir se Modelar/Replicar saem da home e se revisão/humanização entram.

## 7. Decisões que assumi (trocar é barato)

- **Sem pausa de premissa.** A leitura aparece junto do roteiro e é editável. Motivo: 9 sessões
  morreram na pausa e ela custa metade do tempo.
- **Convive com o fluxo antigo** até a Task 7.
- **Cliente opcional**, só para voz, restrições e CTA.
- **Tamanho segue o original**, não a régua de 420–500.
- **Carrossel fica fora da v1** (só vídeo).

## 8. Fora de escopo

Busca de modelagens (plano 014), análise visual do vídeo (ritmo de corte, lettering — isso é a
skill `vm-modelar`), modelagem em lote.
