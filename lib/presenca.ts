import { SEM_NOME } from "./usuarios";

// Normalização do estado do Supabase Presence. Fica fora do componente porque é aqui que mora
// o erro silencioso: a mesma pessoa com 3 abas apareceria 3 vezes, e um payload torto
// (aba antiga, campo faltando) viraria "undefined" na tela em vez de sumir.

export type Pessoa = { userId: string; nome: string; editando: boolean };

/**
 * Estado bruto do Presence (chave por conexão → uma entrada por aba) → pessoas únicas.
 *
 * Dedupe por `userId`: 3 abas da mesma pessoa é uma pessoa. `editando` é o OU das abas — se
 * qualquer aba dela está no editor, ela está editando. Entrada sem `userId` é descartada:
 * presença é cosmética, mas lixo na tela não. `excluir` tira você mesmo da lista.
 */
export function pessoasPresentes(
  estado: Record<string, unknown[]> | null | undefined,
  excluir?: string | null
): Pessoa[] {
  const por = new Map<string, Pessoa>();
  for (const metas of Object.values(estado ?? {})) {
    for (const meta of metas ?? []) {
      const m = (meta ?? {}) as { userId?: unknown; nome?: unknown; editando?: unknown };
      const userId = typeof m.userId === "string" ? m.userId.trim() : "";
      if (!userId || userId === excluir) continue;
      const nome = typeof m.nome === "string" && m.nome.trim() ? m.nome.trim() : SEM_NOME;
      const antes = por.get(userId);
      por.set(userId, {
        userId,
        nome: antes?.nome ?? nome,
        editando: !!antes?.editando || m.editando === true,
      });
    }
  }
  // Ordem estável por nome: sem isso a lista dança a cada sync do canal.
  return [...por.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
