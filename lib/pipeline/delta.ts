// lib/pipeline/delta.ts
// Filtro de delta do regime C (§4.2): decide, sem LLM e sem embedding, se uma alegação do roteiro
// é rastreável ao dossiê. Rastreada passa direto; qualquer dúvida vira delta e paga uma busca.
// A direção do erro é deliberada: falso delta custa uma busca, falso `rastreada` deixa passar invenção.
import { norm } from "@/lib/provenance";

// Data numérica antes de número solto, senão "12" comeria "12/03/2024".
const MAGNITUDE = "mil|milh(?:ão|ões)|bilh(?:ão|ões)|trilh(?:ão|ões)";
const QUANTIDADE = new RegExp(
  String.raw`\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d+(?:[.,]\d+)*(?:\s*%|\s+(?:${MAGNITUDE}))?`,
  "giu",
);
const PALAVRA = /\p{L}[\p{L}\p{N}'’-]*/gu;
const FIM_DE_FRASE = /[.!?;:\n]/;

/**
 * Âncoras factuais de uma alegação: quantidades, datas e nomes próprios.
 * Nome próprio = palavra iniciada por maiúscula **fora de início de frase** — a maiúscula posicional
 * não distingue nome de palavra comum, então ela é descartada. Maiúsculas consecutivas viram uma só
 * âncora ("Banco Central"), que é mais estrito do que exigir as duas palavras soltas.
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

/**
 * Rastreada = tem ao menos uma âncora e **todas** aparecem no dossiê normalizado.
 * Sem âncora, sem dossiê ou com uma âncora faltando → delta.
 */
export function ehRastreada(alegacao: string, dossie: string): boolean {
  const ancoras = extrairAncoras(alegacao);
  if (!ancoras.length) return false;
  // Espaços nas pontas: casa por token, para "2023" não ser encontrado dentro de "120233".
  const alvo = ` ${normQ(dossie ?? "")} `;
  return ancoras.every((a) => alvo.includes(` ${normQ(a)} `));
}
