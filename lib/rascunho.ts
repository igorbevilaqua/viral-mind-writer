// ── Rascunho local do roteiro ────────────────────────────────────────────────────────────────
// O texto digitado só existia no estado do React até o Salvar dar certo, e qualquer coisa que
// derrubasse a página no meio (erro na action, F5, deploy trocando o build ao lado) levava o
// trabalho embora. Agora ele é escrito no navegador a cada tecla e só é apagado quando o servidor
// confirma — ou quando o usuário desiste na mão.
// ponytail: localStorage e não IndexedDB nem servidor. É um roteiro de alguns KB por aba; a hora
// de trocar é quando o rascunho precisar seguir o usuário para outro navegador.
export interface Rascunho {
  headline: string;
  hook: string;
  roteiro: string;
  comando: string;
  fontes: string;
}

const chaveRascunho = (scriptId: string) => `vm.rascunho.${scriptId}`;

// A leitura é a string CRUA de propósito: é ela o snapshot estável que o useSyncExternalStore
// exige (parsear aqui devolveria um objeto novo a cada checagem e giraria render sem parar).
export function rascunhoCru(scriptId: string): string | null {
  try {
    return localStorage.getItem(chaveRascunho(scriptId));
  } catch {
    return null; // aba privada, quota, storage bloqueado: nada disso pode derrubar a tela
  }
}

export function parseRascunho(cru: string | null): Rascunho | null {
  if (!cru) return null;
  try {
    const r = JSON.parse(cru) as Partial<Rascunho>;
    if (typeof r?.roteiro !== "string") return null;
    return {
      headline: r.headline ?? "",
      hook: r.hook ?? "",
      roteiro: r.roteiro,
      comando: r.comando ?? "",
      fontes: r.fontes ?? "",
    };
  } catch {
    return null;
  }
}

// localStorage não avisa a própria aba, então as escritas daqui notificam na mão.
const ouvintesDeRascunho = new Set<() => void>();

export function assinarRascunho(f: () => void): () => void {
  ouvintesDeRascunho.add(f);
  // 'storage' cobre a MESMA sessão aberta em outra aba mexendo no mesmo roteiro.
  window.addEventListener("storage", f);
  return () => {
    ouvintesDeRascunho.delete(f);
    window.removeEventListener("storage", f);
  };
}

// Não notifica de propósito: isto roda a cada tecla, e a faixa de "Retomar" só é lida FORA do
// modo edição. Avisar aqui custaria um render por caractere para ninguém ver.
export function gravarRascunho(scriptId: string, r: Rascunho): void {
  try {
    localStorage.setItem(chaveRascunho(scriptId), JSON.stringify(r));
  } catch {
    /* sem storage: a edição segue, só não sobrevive a um reload */
  }
}

export function apagarRascunho(scriptId: string): void {
  try {
    localStorage.removeItem(chaveRascunho(scriptId));
  } catch {
    /* idem */
  }
  ouvintesDeRascunho.forEach((f) => f());
}

// Autosave: 2,5s depois da última tecla. Curto o suficiente para ninguém perder um parágrafo,
// longo o suficiente para não gravar a cada letra.
// ponytail: intervalo fixo, sem backoff. Se o banco reclamar do volume, o passo é subir este
// número — não construir fila de escrita.
export const AUTOSAVE_MS = 2500;

/** A assinatura do conteúdo, e a única coisa que decide se há o que gravar. */
export function assinaturaDoRascunho(r: Rascunho): string {
  return JSON.stringify([r.headline, r.hook, r.roteiro, r.comando, r.fontes]);
}

/**
 * Se o autosave deve disparar agora. Pura para poder ser testada — é a regra que evita as três
 * gravações erradas: a que repete o que o servidor já tem, a que atropela um Salvar em voo, e a
 * que escreve num roteiro que a tela nem deixa editar (sessão fechada, versão antiga).
 */
export function precisaAutosalvar(e: {
  editando: boolean;
  bloqueado: boolean;
  salvandoAgora: boolean;
  assinatura: string;
  ultimaSalva: string;
}): boolean {
  if (!e.editando || e.bloqueado || e.salvandoAgora) return false;
  return e.assinatura !== e.ultimaSalva;
}

/**
 * A mensagem que a tela mostra quando o Salvar falha. O caso mais comum não é bug de dados: é
 * deploy no meio da edição — a página carregada conhece uma Server Action que o servidor novo já
 * não tem, e o Next responde com erro de "deployment". Aí a instrução certa é recarregar, e a
 * primeira coisa a dizer é que o texto NÃO foi perdido.
 */
export function recadoDeFalhaAoSalvar(msg: string): string {
  const versao = /server action|deployment|unexpected response|failed to fetch|network/i.test(msg);
  return versao
    ? "O app foi atualizado enquanto você editava, então este salvamento não chegou. Seu texto está guardado neste navegador: recarregue a página e clique em Retomar."
    : `Não consegui salvar: ${msg}. Seu texto continua aqui e guardado neste navegador — tente de novo.`;
}
