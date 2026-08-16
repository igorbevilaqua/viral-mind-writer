import fontesAutoritativas from "./fontes-autoritativas.json";

export interface Estudo {
  texto: string;
  url: string;
  dominio: string;
  tier: 1 | 2 | 3 | null;
}

// ATENÇÃO (016 §5.1, §10.2): este portão verifica FORMA e PROCEDÊNCIA, NÃO CONTEÚDO.
// Ele não abre a URL, não confirma que a página existe e não confirma que ela diz aquilo.
// Um link morto num domínio tier 1 passa por aqui inteiro. "Verificável" NÃO é "verificado" —
// verificar de verdade é a peça 3. Quem ler `tier: 1` como selo de veracidade lê errado.

// o json tem `_comentario` (string) junto dos tiers — só arrays interessam aqui
const TIERS: [1 | 2 | 3, string[]][] = ([1, 2, 3] as const).map((n) => {
  const v = (fontesAutoritativas as Record<string, unknown>)[`tier_${n}`];
  return [n, Array.isArray(v) ? (v as string[]) : []];
});

// Sufixo, não igualdade: `sec.gov` casa `data.sec.gov`, como o `_comentario` do JSON manda.
// A fronteira de ponto evita que `sec.gov` case `notsec.gov`.
function tierDe(dominio: string): 1 | 2 | 3 | null {
  for (const [tier, dominios] of TIERS) {
    if (dominios.some((d) => dominio === d || dominio.endsWith(`.${d}`))) return tier;
  }
  return null;
}

/**
 * Recorta a seção `## ESTUDOS` do dossiê e passa cada linha pelo portão determinístico (sem LLM).
 * Descarta só o que não tem URL bem-formada; domínio fora do JSON entra REBAIXADO (`tier: null`),
 * porque o JSON não é exaustivo e descartar por isso jogaria fora estudo legítimo (016 §5.1).
 * Nenhum corte silencioso: todo descarte sai com o texto e o motivo.
 */
export function extrairEstudos(dossie: string): {
  aceitos: Estudo[];
  descartados: { linha: string; motivo: string }[];
} {
  const aceitos: Estudo[] = [];
  const descartados: { linha: string; motivo: string }[] = [];
  if (!dossie) return { aceitos, descartados };

  // `(?![\s\S])` e não `$`: com a flag `m` o `$` casaria o fim da PRIMEIRA linha e devolveria
  // só o primeiro estudo. Mesmo padrão de `checagemSection` em draft.ts.
  const m = dossie.match(/^#{1,3}\s*ESTUDOS\b[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|(?![\s\S]))/im);
  const corpo = m?.[1]?.trim() ?? "";
  if (!corpo) return { aceitos, descartados };

  for (const bruta of corpo.split("\n")) {
    const linha = bruta.replace(/^\s*[-*•]\s*/, "").trim();
    if (!linha) continue;

    const achado = linha.match(/https?:\/\/[^\s<>"'()[\]]+/);
    if (!achado) {
      descartados.push({ linha, motivo: "sem URL" });
      continue;
    }
    const url = achado[0].replace(/[.,;:—–-]+$/, "");
    let dominio: string;
    try {
      dominio = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      descartados.push({ linha, motivo: "URL malformada" });
      continue;
    }
    if (!dominio.includes(".")) {
      descartados.push({ linha, motivo: "URL malformada" });
      continue;
    }

    const texto = linha.replace(achado[0], "").replace(/[\s—–|,;:-]+$/, "").trim();
    aceitos.push({ texto, url, dominio, tier: tierDe(dominio) });
  }

  return { aceitos, descartados };
}
