// lib/provenance.ts
export type Etapa = "roteirista" | "revisao" | "humanizacao" | "pos_save";

// Normaliza para comparar por conteúdo, não por formatação: minúsculas, acentos preservados,
// pontuação e espaço colapsados. Basta para pertencimento de sentença.
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();

export function atribuirEtapa(
  trecho: string,
  snaps: { assembled?: string; revised?: string; final?: string },
): Etapa {
  const alvo = norm(trecho);
  if (!alvo) return "pos_save";
  const contem = (s?: string) => !!s && norm(s).includes(alvo);
  if (contem(snaps.assembled)) return "roteirista";
  if (contem(snaps.revised)) return "revisao";
  if (contem(snaps.final)) return "humanizacao";
  return "pos_save";
}
