# Ritmo de frase e tamanho de parágrafo

Decisões travadas com o operador em 2026-08-19. Fonte da verdade da implementação.

## O estado medido (66 roteiros gerados, 459 parágrafos, 1.596 frases)

| Métrica | Hoje |
|---|---|
| palavras por parágrafo (média) | **51,1** |
| maior parágrafo | **126 palavras** |
| parágrafos acima de 45 palavras | **59,5%** |
| palavras por frase (média / desvio) | 14,7 / 9,0 |
| frases curtas (≤6 palavras) | 18,3% |
| frases longas (≥18 palavras) | 31,9% |
| **maior sequência sem frase curta** | **14 frases** |
| roteiros com sequência de 4+ frases longas | **45 de 66 (68%)** |

Leitura: **a mistura de comprimentos já existe** (desvio 9,0, 18% de curtas). O que falta é
**distribuição** — dois terços dos roteiros têm pelo menos um trecho de 4+ frases longas sem
nada quebrando a inércia. Logo a instrução certa não é "use frases curtas" (ele já usa), é
"não fique N frases sem uma".

Parágrafo é outra história: **não existe regra nenhuma** para o roteirista hoje. A regra
existe na casa, no lugar errado — `agents/kasparov.md` tem "parágrafo curto, até três linhas"
para as respostas de chat dele.

## Por que os exemplos não ensinam isso

O few-shot vem do corpus, e `videos.roteiro` é **transcrição de áudio**: 66-70 palavras por
"frase", zero quebra de parágrafo. O bloco que manda "imite o REGISTRO e a NATURALIDADE"
carrega, portanto, sinal de ritmo **nulo**. Ritmo por imitação nunca poderia funcionar aqui —
não insistir nesse caminho.

## Quem é responsável

**Medição: código determinístico**, na família do `slop-lint`. O sintoma é contável ("este
parágrafo tem 126 palavras", "estas 14 frases não têm quebra"); a escolha de *qual* frase
encurtar é julgamento e continua do modelo.

**Correção: o humanizador.** O prompt dele já diz "mude apenas a textura do texto" — ritmo e
quebra de parágrafo SÃO textura. E ele já tem a máquina: recebe violações determinísticas e
faz retentativas cirúrgicas só nos trechos marcados. Reusar esse laço, não criar outro.

**NÃO o roteirista.** Ele já recebe "frases curtas, ritmo de fala" no guia de estilo e não
entrega o espaçamento. Numa passada só, carregando premissa + estrutura + prova + cliente +
proibições, ritmo perde a competição para argumento — e deve perder.

**Revisor: recebe os números como SINAL, com escapatória.** Mesmo padrão de `ecosNumericos`
(`draft.ts`), cujo bloco termina em MANTENHA de propósito. Sequência longa às vezes se paga
(está construindo contexto para uma virada). Regra rígida aqui produz roteiro picado, que é o
outro extremo do defeito.

**Doutrina: `playbooks/style_guide.md`** — versionado, curado por humano, já injetado no bloco
estático. É onde a doutrina de escrita mora.

## Os dois limites (constantes ajustáveis, não verdade)

- `PARAGRAFO_MAX_PALAVRAS = 35` — a regra das "3 linhas" do operador, convertida. Hoje 59,5%
  estouram isso.
- `MAX_LONGAS_SEGUIDAS = 3` — a média das sequências hoje é 2,3, então 3 corta a cauda ruim
  sem brigar com o que já está bom. A maior sequência atual é 14.
- `FRASE_LONGA = 12+ palavras` foi o corte usado na medição das sequências; manter o mesmo
  para o número continuar comparável.

Deixar os três como constantes nomeadas e comentadas com a medição de origem. **Depois de
rodar, medir de novo e ajustar em cima de dado, não de gosto** — é o mesmo princípio que
governa o resto do produto.

## O que NÃO fazer

- Não alternar 1-para-1. O operador foi explícito: o alvo é dinamismo, não metrônomo. A regra
  é de teto de inércia, não de cadência fixa.
- Não transformar em item eliminatório do revisor. É sinal com direito a MANTENHA.
- Não mexer no few-shot para tentar ensinar ritmo (ver acima).
