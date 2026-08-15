const MAX = 200;
// Quantificador aplicado a grupo que já contém quantificador: (a+)+, (a*)*, (a{1,3})+ …
const ANINHADO = /\((?=[^)]*[+*}])[^)]*[+*}][^)]*\)\s*[+*{]/;

export function validarPadrao(p: string): { ok: true; re: RegExp } | { ok: false; motivo: string } {
  if (!p.trim()) return { ok: false, motivo: "padrão vazio" };
  if (p.length > MAX) return { ok: false, motivo: `padrão acima de ${MAX} caracteres` };
  if (ANINHADO.test(p)) return { ok: false, motivo: "quantificador aninhado — risco de backtracking" };
  try {
    return { ok: true, re: new RegExp(p, "giu") };
  } catch (e) {
    return { ok: false, motivo: `regex inválido: ${(e as Error).message}` };
  }
}

// ponytail: entrada limitada ao roteiro aberto (dezenas de KB), por isso sem timeout.
// Se um dia isto rodar sobre corpus, precisa de execução com limite de tempo de verdade.
export function preview(p: string, texto: string): string[] {
  const v = validarPadrao(p);
  if (!v.ok) return [];
  return [...texto.matchAll(v.re)].map((m) => m[0]).slice(0, 20);
}
