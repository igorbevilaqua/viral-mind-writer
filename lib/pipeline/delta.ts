// lib/pipeline/delta.ts
// Filtro de delta do regime C (§4.2): decide, sem LLM e sem embedding, se uma alegação do roteiro
// é rastreável ao dossiê. Rastreada passa direto; qualquer dúvida vira delta e paga uma busca.
// A direção do erro é deliberada: falso delta custa uma busca, falso `rastreada` deixa passar invenção.
import { norm } from "@/lib/provenance";

// Data numérica antes de número solto, senão "12" comeria "12/03/2024".
//
// `(?!\p{L})` depois da magnitude é o que impede a colisão de fator 1000. Alternância em regex é
// ordenada e sem fronteira de palavra: `mil` casava o prefixo de "milhões", então "2 milhões" virava
// a âncora "2 mil" e uma alegação inflada em 1000× passava como rastreada contra um dossiê que dizia
// "2 mil" — a direção CARA do erro, a mesma que o comentário de `normQ` abaixo existe para evitar.
// O lookahead também mata o inverso, "750 milhas" → "750 mil", âncora que não está no texto.
//
// A ordem (`milh|bilh|trilh` antes de `mil`) é redundante COM o lookahead — a mutação confirma que
// invertê-la sozinha não quebra nada, porque o regex faz backtracking. Fica por consistência com
// slop-lint.ts:194-198, que já carregava esta lição e de onde vêm as variantes sem acento: dois
// guardas baratos num bug de fator 1000, para o dia em que alguém achar um deles redundante.
const MAGNITUDE = "milh(?:ão|ões|ao|oes)|bilh(?:ão|ões|ao|oes)|trilh(?:ão|ões|ao|oes)|mil";
const QUANTIDADE = new RegExp(
  String.raw`\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d+(?:[.,]\d+)*(?:\s*%|\s+(?:${MAGNITUDE})(?!\p{L}))?`,
  "giu",
);
const PALAVRA = /\p{L}[\p{L}\p{N}'’-]*/gu;
const FIM_DE_FRASE = /[.!?;:\n]/;

/**
 * Âncoras factuais de uma alegação: quantidades, datas e nomes próprios.
 * Nome próprio = palavra iniciada por maiúscula **fora de início de frase** — a maiúscula posicional
 * não distingue nome de palavra comum, então ela é descartada. Maiúsculas consecutivas viram uma só
 * âncora ("Banco Central"), que é mais estrito do que exigir as duas palavras soltas.
 *
 * Contar a primeira palavra foi testado contra 19 dossiês reais e REJEITADO: a alegação é um
 * fragmento copiado, então ela abre por preposição/artigo capitalizado ("Em dezembro de 2021…",
 * "Cada unidade custava…") muito mais vezes que por nome. Isso fabricava uma âncora de nome que
 * está em toda linha de todo dossiê, e o portão de duas classes de `ehRastreada` passava a ser
 * satisfeito por lixo — "Em setembro de 2025, ele declarou que a fortuna independe da música"
 * virava rastreada com âncoras [2025, Em]. O portão de duas classes já cobre o caso que a
 * mudança queria pegar ("Hyundai já entrega 750 km" fica com [750] e cai em delta por falta de
 * nome), então a maiúscula posicional continua descartada. O comentário acima estava certo.
 */
export function extrairAncoras(alegacao: string): string[] {
  const texto = alegacao ?? "";
  const ancoras = [...texto.matchAll(QUANTIDADE)].map((m) => m[0].trim());

  let fimAnterior = -1; // -1 = nenhuma palavra antes: a primeira é início de frase.
  let atual: string[] = [];
  const fechar = () => {
    if (atual.length) ancoras.push(atual.join(" "));
    atual = [];
  };
  for (const m of texto.matchAll(PALAVRA)) {
    const inicio = m.index;
    const anteriorEhAdjacente = fimAnterior >= 0 && !/\S/.test(texto.slice(fimAnterior, inicio));
    const inicioDeFrase = fimAnterior < 0 || FIM_DE_FRASE.test(texto.slice(fimAnterior, inicio));
    if (/^\p{Lu}/u.test(m[0]) && !inicioDeFrase) {
      if (!anteriorEhAdjacente) fechar();
      atual.push(m[0]);
    } else {
      fechar();
    }
    fimAnterior = inicio + m[0].length;
  }
  fechar();

  return [...new Set(ancoras.filter((a) => norm(a)))];
}

// `norm` apaga TODA pontuação, e isso colide números que não são o mesmo número: "37,5%" e
// "375" viram o token "375", e "1,5 bilhão" vira "15 bilhão". Marcar essas como rastreadas é
// a direção CARA do erro — deixa passar invenção. O separador decimal vira palavra antes de
// normalizar, aplicado igual nos dois lados. O custo é o inverso: "1.500" deixa de casar com
// "1500", um falso delta que vale uma busca. Direção certa.
const normQ = (s: string) => norm(s.replace(/(\d)[.,](\d)/g, "$1 ponto $2"));

// Quantidade sempre começa por dígito; nome próprio, por letra. Basta isso para separar as duas
// classes sem mudar o retorno de `extrairAncoras`, que é público e testado.
const ehQuantidade = (a: string) => /^\d/.test(a);

/**
 * Rastreada = a alegação tem âncora das DUAS classes (quantidade/data **e** nome próprio) e existe
 * UMA LINHA do dossiê que contém todas elas. Qualquer outra coisa → delta.
 *
 * As duas exigências fecham os dois vazamentos que uma sonda contra dossiês reais mostrou (5 de 10
 * alegações inventadas passavam):
 *
 * 1. **Duas classes.** Com âncora única a barra era trivial. Número escrito por extenso não gera
 *    âncora nenhuma ("um milhão", "metade", "o dobro" — `QUANTIDADE` exige dígito) e sobra só o
 *    nome próprio, que obviamente está no dossiê porque o dossiê é sobre ele: "a Toyota já vendeu
 *    mais de um milhão de carros" passava com [Toyota].
 * 2. **Mesma linha.** Exigir as âncoras espalhadas pelo documento aceitava recombinação: números
 *    certos, sujeito ou causalidade errados ("o robô foi criado porque 20 empregos já tinham sido
 *    cortados na REWE", com 20/Circus/REWE em três linhas diferentes). O dossiê é escrito um fato
 *    por linha (agents/pesquisador.md), então a linha É a unidade de "o dossiê afirma isto" — e é
 *    o que a §14.3 chamava de residual sem conserto.
 *
 * ponytail: janela = linha, não N caracteres. Se o pesquisador passar a escrever parágrafos
 * corridos, trocar por janela deslizante é o próximo passo — não subir o teto de âncoras.
 */
export function ehRastreada(alegacao: string, dossie: string): boolean {
  const ancoras = extrairAncoras(alegacao);
  if (!ancoras.some(ehQuantidade) || !ancoras.some((a) => !ehQuantidade(a))) return false;
  // Espaços nas pontas: casa por token, para "2023" não ser encontrado dentro de "120233".
  return (dossie ?? "")
    .split("\n")
    .some((linha) => {
      const alvo = ` ${normQ(linha)} `;
      return ancoras.every((a) => alvo.includes(` ${normQ(a)} `));
    });
}
