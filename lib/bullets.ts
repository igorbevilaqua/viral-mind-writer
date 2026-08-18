// BULLETS — paleta emocional curada pelo time (migration 0033). Lógica pura: normalização,
// validação e a seleção do que chega ao prompt. Sem I/O de propósito — as actions e o
// pipeline importam daqui, e o teste (tests/bullets.test.ts) não precisa de banco.
import { validarPadrao } from "./regex-safety";

export interface Bullet {
  termo: string;
  score: number;
}

// Um bullet sugerido por uma pessoa só não entra no prompt: 2 = alguém além do criador
// (que já nasce com o próprio +1) concordou.
export const SCORE_MINIMO = 2;
// Teto de termos no bloco. Lista longa vira dicionário e o modelo passa a garimpar palavra
// forte em vez de escrever — o oposto do que a paleta existe para fazer.
export const TETO_BULLETS = 15;

export const MAX_CHARS = 40;
export const MAX_PALAVRAS = 3;

/** lowercase + trim + espaços colapsados — a chave de dedupe (vm_bullets.termo_norm). */
export const normalizarTermo = (t: string) => t.trim().replace(/\s+/g, " ").toLowerCase();

/** Motivo da recusa, ou null se o termo serve. É palavra/expressão, não frase. */
export function validarTermo(termo: string): string | null {
  const limpo = termo.trim().replace(/\s+/g, " ");
  if (limpo.length < 2) return "curto demais (mínimo 2 caracteres)";
  if (limpo.length > MAX_CHARS) return `longo demais (máximo ${MAX_CHARS} caracteres)`;
  if (limpo.split(" ").length > MAX_PALAVRAS) return `no máximo ${MAX_PALAVRAS} palavras`;
  return null;
}

/**
 * Os termos que chegam ao prompt: score >= 2, os 15 melhores, e nada que contradiga um veto
 * do cliente ou uma frase banida — o time votar numa palavra não revoga a proibição de quem
 * paga o roteiro.
 */
export function selecionarBullets(
  bullets: Bullet[],
  filtros: { vetados?: string[]; bannedPhrases?: { pattern: string; label?: string | null }[] } = {}
): string[] {
  const vetados = (filtros.vetados ?? []).map(normalizarTermo).filter(Boolean);
  // Padrão inválido é ignorado (mesma postura do slop-lint): filtro quebrado não pode
  // esvaziar a paleta inteira.
  const banidos = (filtros.bannedPhrases ?? [])
    .map((b) => validarPadrao(b.pattern))
    .filter((v): v is { ok: true; re: RegExp } => v.ok)
    .map((v) => v.re);

  return bullets
    .filter((b) => b.score >= SCORE_MINIMO)
    .sort((a, b) => b.score - a.score)
    .filter((b) => {
      const norm = normalizarTermo(b.termo);
      if (vetados.some((v) => norm.includes(v))) return false;
      // `g` deixa lastIndex vivo entre chamadas; reset por termo evita falso negativo.
      return !banidos.some((re) => {
        re.lastIndex = 0;
        return re.test(b.termo);
      });
    })
    .slice(0, TETO_BULLETS)
    .map((b) => b.termo);
}
