// As quatro skills de modo (plano 025). Puro de propósito: a home (componente de cliente) e o
// servidor leem a mesma lista; o texto das skills fica em skills/*.md e só o servidor lê.
// Conselho e publi existem como modo da casa (vm_roteiro_modo), mas não como skill: conselho
// derruba alcance e publi depende do briefing da oferta (docs/estudo-modos-2026-10).
export const SKILLS = ["historia", "mecanismo", "demonstracao", "panorama"] as const;
export type Skill = (typeof SKILLS)[number];

export const NOME_SKILL: Record<Skill, string> = {
  historia: "História",
  mecanismo: "Mecanismo",
  demonstracao: "Demonstração",
  panorama: "Panorama",
};

// Uma linha para o title do seletor: a pessoa reconhece o modo sem abrir o arquivo.
export const DICA_SKILL: Record<Skill, string> = {
  historia: "o que aconteceu com alguém, no tempo; segura até o fim",
  mecanismo: "explica por dentro como um caso, regra ou negócio funciona",
  demonstracao: "mostra uma coisa funcionando; a mais compartilhada",
  panorama: "prova uma tendência com dados de várias fontes; gera comentário",
};

export const ehSkill = (v: unknown): v is Skill => typeof v === "string" && (SKILLS as readonly string[]).includes(v);
