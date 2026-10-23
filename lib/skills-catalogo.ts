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

// O "i" ao lado do seletor (components/skill-info.tsx): quando usar e uma pauta de exemplo.
// Resumo da seção "quando" de cada skills/*.md, para quem nunca viu as skills.
export const DICA_SKILL: Record<Skill, { quando: string; exemplo: string }> = {
  historia: {
    quando: "Conta o que aconteceu com alguém: trajetória, decisão, virada, queda. É a que mais segura o espectador até o fim.",
    exemplo: "Como um taxista de Recife virou dono de 40 carros",
  },
  mecanismo: {
    quando: "Explica por dentro a regra, a conta ou a estratégia por trás de um fato que parece absurdo.",
    exemplo: "Por que a passagem fica mais cara quando você pesquisa de novo",
  },
  demonstracao: {
    quando: "Mostra uma coisa funcionando: o que faz, por que funciona, o que muda. É a mais compartilhada.",
    exemplo: "O carregador que enche a bateria do carro em 5 minutos",
  },
  panorama: {
    quando: "Prova uma tendência, um mercado ou um país com dados de várias fontes. Os casos entram como exemplos.",
    exemplo: "O Brasil está ficando sem jovens, e os números mostram onde",
  },
};

export const ehSkill = (v: unknown): v is Skill => typeof v === "string" && (SKILLS as readonly string[]).includes(v);

// O que o seletor da home traz marcado. "" = automática (a sala sugere depois da premissa).
// Decisão final do Igor no release: trocar aqui por uma das SKILLS, se for o caso.
export const SKILL_PADRAO_HOME: Skill | "" = "";

// As duas colunas de vm_sessions para uma skill vinda da tela. Vazia ou inválida = automática:
// a sala sugere depois da premissa (escolher-skill.ts).
export function colunasDaSkill(v: unknown): { skill: Skill | null; skill_origem: "escolhida" | null } {
  return ehSkill(v) ? { skill: v, skill_origem: "escolhida" } : { skill: null, skill_origem: null };
}
