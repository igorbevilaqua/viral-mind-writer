// Métricas determinísticas de comunicação (plano 020, WP-B). Módulo puro: sem banco, sem LLM.
// A lista de campos é FECHADA — é o pré-registro do estudo. Adicionar métrica depois de olhar
// o resultado é garimpar significância; se precisar de outra, abre-se um novo pré-registro.
import { dividirFrases } from "./pipeline/slop-lint";
import { contarFrases } from "./pipeline/hook-mechanisms";

// Cópia de scripts/analyze-hooks.ts (o script inteiro sai no WP-E; a lista continua aqui).
export const PALAVRAS_MAGICAS = [
  "confessar", "confessou", "revelar", "revelou", "revelação", "perturbador",
  "segredo", "proibido", "clandestino", "chocante", "urgente", "exclusivo",
  "ninguém", "nunca", "descobriu", "escondido", "oculto", "bastidores",
];

export interface TextMetrics {
  palavras: number;
  frases: number;
  paragrafos: number;
  palavras_por_frase_media: number;
  palavras_por_frase_p90: number;
  frases_curtas_pct: number;
  palavras_por_paragrafo_media: number;
  numeros_por_100_palavras: number;
  frases_com_numero_pct: number;
  voce_por_100: number;
  eu_por_100: number;
  nos_por_100: number;
  perguntas_por_100_frases: number;
  imperativos_por_100_frases: number;
  magicas_por_100_palavras: number;
  nomes_proprios_por_100: number;
  hook_palavras: number | null;
  hook_frases: number | null;
  hook_tem_numero: boolean | null;
}

const FRASE_CURTA = 6;

// "R$ 3.400", "37,5%", "2 milhões", "1.2k" contam UM número cada: prefixo de moeda opcional,
// separadores de milhar/decimal colados, sufixo de % ou ordem de grandeza opcional.
const NUMERO = /(?:R\$\s*)?\d+(?:[.,]\d+)*(?:\s*%|\s*(?:mil|milh(?:ão|ões|ao|oes)|bilh(?:ão|ões|ao|oes)|k)(?![a-zà-ú]))?/gi;
// Cópia sem /g para .test(): regex global guarda lastIndex entre chamadas e falha alternado.
const TEM_NUMERO = new RegExp(NUMERO.source, "i");

const VOCE = new Set(["você", "voce", "te", "teu", "tua", "seu", "sua", "vocês", "voces"]);
const EU = new Set(["eu", "meu", "minha", "me", "mim"]);
const NOS = new Set(["nós", "nosso", "nossa"]);

// ponytail: "para" no início também é preposição ("Para você entender..."); aceito o ruído
// porque a métrica é proxy comparativo entre quartis, não veredito por frase.
const IMPERATIVOS = new Set([
  "pare", "para", "esqueça", "esquece", "imagina", "imagine", "pensa", "pense", "olha", "olhe",
  "presta", "preste", "lembra", "lembre", "veja", "vê", "repara", "repare", "segue", "siga",
  "comenta", "comente", "compartilha", "compartilhe", "salva", "salve", "manda", "mande",
  "escuta", "escute", "anota", "anote", "entende", "entenda", "faz", "faça", "tenta", "tente",
  "deixa", "deixe", "aprende", "aprenda", "corre", "cuidado", "calma",
]);

const contarPalavras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const tokens = (t: string) => t.toLowerCase().match(/\p{L}+/gu) ?? [];
const por100 = (k: number, n: number) => (n ? r2((k / n) * 100) : 0);
const r2 = (x: number) => Math.round(x * 100) / 100;

export function textMetrics(roteiro: string, hook?: string | null): TextMetrics {
  const texto = (roteiro ?? "").trim();
  const frases = dividirFrases(texto);
  const paragrafos = texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const palavras = contarPalavras(texto);
  const toks = tokens(texto);

  const ppf = frases.map(contarPalavras).sort((a, b) => a - b);
  const p90 = ppf.length ? ppf[Math.max(0, Math.ceil(0.9 * ppf.length) - 1)] : 0;

  const numeros = texto.match(NUMERO)?.length ?? 0;
  // "a gente" é bigrama, não cabe no Set de tokens; os dois lados são ASCII, \b funciona.
  const aGente = texto.toLowerCase().match(/\ba gente\b/g)?.length ?? 0;
  const nomes = frases.reduce((acc, f) => {
    const ws = f.split(/\s+/).slice(1).map((w) => w.replace(/^[^\p{L}]+/u, ""));
    return acc + ws.filter((w) => /^\p{Lu}\p{Ll}+/u.test(w)).length;
  }, 0);
  const primeira = (f: string) => tokens(f)[0] ?? "";

  const h = hook?.trim() || null;
  return {
    palavras,
    frases: frases.length,
    paragrafos: paragrafos.length,
    palavras_por_frase_media: frases.length ? r2(palavras / frases.length) : 0,
    palavras_por_frase_p90: p90,
    frases_curtas_pct: por100(ppf.filter((n) => n <= FRASE_CURTA).length, frases.length),
    palavras_por_paragrafo_media: paragrafos.length ? r2(palavras / paragrafos.length) : 0,
    numeros_por_100_palavras: por100(numeros, palavras),
    frases_com_numero_pct: por100(frases.filter((f) => TEM_NUMERO.test(f)).length, frases.length),
    voce_por_100: por100(toks.filter((w) => VOCE.has(w)).length, palavras),
    eu_por_100: por100(toks.filter((w) => EU.has(w)).length, palavras),
    nos_por_100: por100(toks.filter((w) => NOS.has(w)).length + aGente, palavras),
    perguntas_por_100_frases: por100(frases.filter((f) => /\?["'”’)\]]*$/.test(f)).length, frases.length),
    imperativos_por_100_frases: por100(frases.filter((f) => IMPERATIVOS.has(primeira(f))).length, frases.length),
    // prefixo, não igualdade: "segredos"/"revelações" contam como no analyze-hooks (includes).
    magicas_por_100_palavras: por100(toks.filter((w) => PALAVRAS_MAGICAS.some((m) => w.startsWith(m))).length, palavras),
    nomes_proprios_por_100: por100(nomes, palavras),
    hook_palavras: h ? contarPalavras(h) : null,
    hook_frases: h ? contarFrases(h) : null,
    hook_tem_numero: h ? /\d/.test(h) : null,
  };
}
