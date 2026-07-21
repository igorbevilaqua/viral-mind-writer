// Aplicação da sugestão do Bob no draft do roteiro — lógica pura (testável).

// Insere `texto` na seleção [start,end]. Guard anti-drift: se o texto em [start,end]
// não é mais o `trecho` esperado (o usuário editou), insere em `start` em vez de
// substituir — nunca corrompe conteúdo que o usuário mexeu.
export function spliceRoteiro(
  roteiro: string,
  sel: { start: number; end: number; trecho: string },
  texto: string
): string {
  const s = Math.min(sel.start, roteiro.length);
  const bate = roteiro.slice(s, sel.end) === sel.trecho;
  const e = bate ? Math.min(sel.end, roteiro.length) : s;
  return roteiro.slice(0, s) + texto + roteiro.slice(e);
}

// Anexa fontes novas ao campo FONTES sem duplicar URLs já presentes.
export function mergeFontes(atual: string, novas: string): string {
  const existentes = new Set(atual.match(/https?:\/\/[^\s)\]]+/g) ?? []);
  const add = novas.split("\n").filter((u) => u && !existentes.has(u));
  if (!add.length) return atual;
  return (atual.trim() ? atual.trimEnd() + "\n" : "") + add.join("\n");
}
