// Plano 027: o que se mede em código entre o original e a nossa versão. Sem modelo.
//
// A régua é o próprio original, não um número da casa: ele já foi validado pelo algoritmo, então
// "não ficou mais difícil de digerir que ele" é o teste. O Codex antigo saía mais numérico e mais
// complexo que o vídeo modelado, e ninguém media isso.

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const palavras = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * Números no texto. ponytail: conta dígito e as grandezas por extenso (mil, milhões...); "dois"
 * e "três" ficam de fora de propósito, porque contam coisa e não pesam como dado.
 */
export function contarNumeros(s: string): number {
  return (s.match(/\d[\d.,]*|\b(?:mil|milh(?:ão|ões)|bilh(?:ão|ões)|trilh(?:ão|ões))\b/gi) ?? []).length;
}

export function palavrasPorFrase(s: string): number {
  const frases = s.split(/[.!?]+/).filter((f) => f.trim());
  return frases.length ? palavras(s) / frases.length : 0;
}

/** Trechos de `n`+ palavras seguidas que a nossa versão repete do original (sem acento/pontuação). */
export function copiasLiterais(original: string, novo: string, n = 6): string[] {
  const o = norm(original);
  const gramas = new Set<string>();
  for (let i = 0; i + n <= o.length; i++) gramas.add(o.slice(i, i + n).join(" "));
  const v = norm(novo);
  const achados: string[] = [];
  for (let i = 0; i + n <= v.length; i++) {
    if (!gramas.has(v.slice(i, i + n).join(" "))) continue;
    // estende enquanto a janela seguinte também bate: um trecho copiado vira UM achado
    let fim = i + n;
    while (fim < v.length && gramas.has(v.slice(fim - n + 1, fim + 1).join(" "))) fim++;
    achados.push(v.slice(i, fim).join(" "));
    i = fim - 1;
  }
  return achados;
}

export interface Medida {
  palavras: number;
  numeros: number;
  palavrasPorFrase: number;
}

export const medir = (s: string): Medida => ({
  palavras: palavras(s),
  numeros: contarNumeros(s),
  palavrasPorFrase: Math.round(palavrasPorFrase(s) * 10) / 10,
});

// Folgas escolhidas a dedo (12/11/2026), a calibrar no banco de prova:
// tamanho ±20%, até 2 números a mais que o original, frase média até 15% mais longa.
export function portoes(original: string, novo: string): string[] {
  const o = medir(original);
  const v = medir(novo);
  const copias = copiasLiterais(original, novo);
  return [
    (v.palavras > o.palavras * 1.2 || v.palavras < o.palavras * 0.8) &&
      `tamanho: ${v.palavras} palavras contra ${o.palavras} do original (faixa de 20%)`,
    v.numeros > o.numeros + 2 && `números demais: ${v.numeros} contra ${o.numeros} do original`,
    v.palavrasPorFrase > o.palavrasPorFrase * 1.15 &&
      `frases mais longas que as do original: ${v.palavrasPorFrase} palavras por frase contra ${o.palavrasPorFrase}`,
    copias.length > 0 && `cópia literal: ${copias.map((c) => `"${c}"`).join("; ")}`,
  ].filter((s): s is string => Boolean(s));
}
