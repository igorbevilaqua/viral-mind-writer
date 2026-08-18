// Nome de exibição de uma pessoa. Não existe cadastro de nome em lugar nenhum: nenhuma conta
// de `auth.users` tem name/full_name no metadata e o schema `hub` só guarda (user_id, app, papel).
// O email é o único identificador que existe — então o nome é derivado dele.

/** Rótulo neutro. Melhor que UUID cru, string vazia ou "undefined" na tela. */
export const SEM_NOME = "Usuário";

/**
 * `igor.bevilaqua@gmail.com` → "Igor Bevilaqua".
 *
 * Ponto e underscore no local-part viram espaço e cada palavra é capitalizada. Entrada
 * malformada (sem `@`, vazia, só domínio) nunca devolve string vazia: cai no rótulo neutro.
 */
export function nomeDeEmail(email: string | null | undefined): string {
  const local = (email ?? "").trim().split("@")[0] ?? "";
  const nome = local
    .split(/[._]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
  return nome.trim() || SEM_NOME;
}
