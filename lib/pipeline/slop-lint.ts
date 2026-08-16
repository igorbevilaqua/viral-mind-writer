import { validarPadrao } from "../regex-safety";
import type { BannedPhrase } from "./types";

export interface LintViolation {
  label: string;
  match: string;
  severity: "block" | "warn";
}

export function slopLint(text: string, phrases: BannedPhrase[]): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const p of phrases) {
    // Mesma validação do caminho de ensino (015 Task 8): além de regex inválida, barra
    // quantificador aninhado e padrão longo demais. Com a peça 1 permitindo cadastrar padrão
    // em sessão, deixar isso só no try/catch era proteger um lado da porta e não o outro.
    const v = validarPadrao(p.pattern);
    if (!v.ok) {
      // Nenhum corte é silencioso: frase banida que para de valer sem ninguém saber é a
      // falha que o pacote combate. As 32 ativas hoje passam; o log é para a 33ª.
      console.error(`slop-lint: padrão "${p.pattern}" ignorado — ${v.motivo}`);
      continue;
    }
    const m = text.match(v.re);
    if (m) violations.push({ label: p.label ?? p.pattern, match: m[0], severity: p.severity });
  }

  // Heurísticas estruturais
  // Travessão é proibido, com UMA exceção: marca de fala de personagem (início de
  // linha ou logo após "dois-pontos "). Qualquer outro travessão é slop — tolerância zero.
  const dashes = slopDashCount(text);
  if (dashes > 0) {
    violations.push({ label: `travessão proibido (${dashes}x)`, match: "—", severity: "block" });
  }

  const consecutiveE = text.match(/(^|[.!?]\s+)E\s+[^.!?]+[.!?]\s+E\s/m);
  if (consecutiveE) {
    violations.push({ label: "frases consecutivas começando com 'E'", match: consecutiveE[0].slice(0, 60), severity: "warn" });
  }

  // EIXO DA ELIPSE (ver comentário em ELLIPSIS_FIGURES): três figuras que omitem
  // material gramatical que um falante seria obrigado a pronunciar. São de FORMA, não de
  // frase — por isso vivem em código e não na banlist do banco (que é por string).
  for (const fig of ELLIPSIS_FIGURES) {
    for (const match of fig.find(text)) {
      violations.push({ label: fig.label, match, severity: "block" });
    }
  }

  return violations;
}

// ── Eixo da elipse ─────────────────────────────────────────────────────────────
// O roteiro é LIDO EM VOZ ALTA. Estas três construções são compressão TIPOGRÁFICA:
// legítimas no texto escrito, porque o olho reconstrói o que falta; impossíveis na fala,
// porque a boca não tem o que dizer. Cada uma omite uma peça diferente:
//   antítese          → omite o MOTIVO      (afirma uma relação sem argumentá-la)
//   pergunta elíptica → omite a ORAÇÃO      (o "?" carrega o trabalho)
//   parataxe          → omite o CONECTIVO   (a vírgula carrega a relação)
// Detectar por regex de FRASE (banlist do banco) não resolve: o modelo muta a superfície
// até a regex parar de casar e preserva a figura — foi assim que
// "não são um ataque de raiva. Aquilo é um plano" passou com lint zerado.

// `\b` do JS é ASCII: depois de "é" ou "não" ele NUNCA casa (letra acentuada não é \w),
// e foi por aí que a primeira versão deste detector não pegou nada. Fim-de-palavra aqui é
// "não vem outra letra em seguida".
const FIM = "(?![a-zà-úA-ZÀ-Ú])";
// Verbos de ligação/estado nas duas metades da antítese.
const COPULA = "é|são|sao|foi|era|eram|está|esta|estão|estao|significa";
// Primeira metade: a negação. Inclui as perífrases que fazem o mesmo trabalho.
const NEG = `n[ãa]o\\s+(?:${COPULA}|se\\s+trata|passa\\s+de)${FIM}`;
// Segunda metade: a assertiva. O pronome interposto ("… . Aquilo é …") é a evasão mais
// comum do detector ingênuo, então entra explicitamente como opcional.
const ASSERT = `(?:(?:e|mas)\\s+sim${FIM}|(?:(?:isso|aquilo|isto|ele|ela|eles|elas)\\s+)?(?:${COPULA})${FIM})`;
// Separador: vírgula/ponto-e-vírgula/dois-pontos OU fim de frase. Aceitar o ponto é o que
// pega a fuga por pontuação ("não é presidente nenhum. É a gente").
const SEP = `(?:[,;:]\\s*|\\.\\s+)`;
// Quantificador lazy: casa o separador MAIS PRÓXIMO, que é a figura mais apertada.
const ANTITESE = new RegExp(`${NEG}[^.!?;:]{1,70}?${SEP}${ASSERT}`, "gi");

// Aberturas legítimas de pergunta curta. Três famílias, todas implicando um verbo na frase:
// interrogativo ("Onde elas caçam?"), sujeito explícito ("Você consegue entender a revolta?")
// e verbo que endereça o espectador ("Sabe o que aconteceu?"). Fora disso, pergunta curta é
// pivô NOMINAL — "O desfecho disso?", "Resultado?", "O problema?" — e é o que acusamos.
// `FIM` no lugar de `\b` pelo mesmo motivo da antítese: "você", "alguém" e "será" terminam em
// letra acentuada, e `\b` do JS é ASCII — com `\b` a lista inteira falhava silenciosamente.
const PERGUNTA_LEGITIMA = new RegExp(
  `^(?:e\\s+)?(?:como|onde|quando|quem|qual|quais|quanto|quantos|quanta|quantas|por\\s?que|porqu[êe]|o\\s+que|cad[êe]|ser[áa]|voc[êe]s?|tu|a\\s+gente|ele|ela|eles|elas|isso|algu[ée]m|ningu[ée]m|nada|tudo|sabe|sabia|adivinha|imagina|lembra|viu|percebe|repara|acredita|consegue|d[áa]|faz|tem)${FIM}`,
  "i"
);

// Conectivos que tornam a relação entre itens DITA em vez de implícita na vírgula.
// A presença de qualquer um deles num trecho enumerado é o que separa a versão ruim
// ("carros na rua, garotos jogando bola, bandidos circulando") da boa
// ("de um lado você vê carros na rua, de outro garoto jogando bola, mas se der bobeira…").
const CONECTIVOS =
  /\b(?:que|porque|mas|então|quando|onde|enquanto|embora|apesar|se|por\s?isso|já\s+que|de\s+um\s+lado|por\s+outro|de\s+outro|ou\s+seja|inclusive|sendo\s+que|de\s+modo\s+que|assim\s+como|ao\s+passo\s+que|logo|portanto|até\s+que|sem\s+que|em\s+vez\s+de|tipo|al[ée]m\s+de|junto\s+com|depois\s+de|antes\s+de|gra[çc]as\s+a)\b/i;

// Segmento curto o bastante pra ser um item de lista, não uma oração desenvolvida.
const SEG_MAX = 35;
const MIN_ITENS = 3;
// Teto da frase acusada por parataxe: acima disso o trecho substituído literalmente ficaria
// grande demais pra o passe cirúrgico devolver uma linha só com segurança.
const FRASE_MAX = 240;

// Item que caracteriza parataxe: sintagma DESCRITIVO curto — 2+ palavras, alguma em minúscula
// ("carros na rua", "garotos jogando bola", "bandidos circulando"). Enumeração de nomes
// próprios ("Argentina, El Salvador, Equador") ou de palavras soltas ("presidente, vice,
// ministros") é lista legítima e fala natural — não é o defeito, e acusá-la mandaria o
// reescritor destruir uma lista correta.
function ehFragmentoSolto(item: string): boolean {
  const limpo = item.replace(/[.!?]+$/, "").trim();
  if (limpo.length > SEG_MAX) return false;
  const palavras = limpo.split(/\s+/);
  if (palavras.length < 2) return false;
  return palavras.some((p) => /^[a-zà-ú]/.test(p));
}

interface EllipsisFigure {
  label: string;
  find: (text: string) => string[];
}

const ELLIPSIS_FIGURES: EllipsisFigure[] = [
  {
    label: "antítese (negação seguida de assertiva) — afirme direto o que É",
    find: (text) => (text.match(ANTITESE) ?? []).map((m) => m.trim()),
  },
  {
    label: "pergunta elíptica usada como transição — diga a transição falando",
    find: (text) => {
      const out: string[] = [];
      // Pergunta que começa depois de fim de frase (ou do início do texto), até o "?".
      for (const m of text.matchAll(/(?:^|[.!?]\s+|\n)([A-ZÀ-Ú][^.!?\n]{0,40}\?)/g)) {
        const q = m[1].trim();
        const palavras = q.replace(/\?$/, "").trim().split(/\s+/).length;
        if (palavras <= 5 && !PERGUNTA_LEGITIMA.test(q)) out.push(q);
      }
      return out;
    },
  },
  {
    label: "enumeração paratática (itens justapostos por vírgula) — amarre com conectivo e verbo",
    find: (text) => {
      const out: string[] = [];
      // Uma frase por vez: a parataxe é um fenômeno intra-frase.
      for (const frase of text.split(/(?<=[.!?])\s+|\n+/)) {
        // A seção FONTES é uma lista de citações ("Veículo, 12/03/2026, https://…") — vírgulas
        // demais por natureza, e mandar uma fonte pro reescritor mutilaria a referência.
        // Header markdown também não é prosa.
        if (/https?:\/\/|\d{1,2}\/\d{1,2}\/\d{2,4}|^#{1,3}\s/.test(frase)) continue;
        const partes = frase.split(/\s*[,;]\s*/);
        if (partes.length < MIN_ITENS + 1) continue; // 1ª parte é a matriz, não item
        // Corrida de itens soltos: começa na 2ª parte (a 1ª carrega o sujeito/verbo).
        const itens = partes.slice(1).filter((p) => p.length > 0);
        if (itens.length < MIN_ITENS) continue;
        if (itens.filter(ehFragmentoSolto).length < MIN_ITENS) continue;
        // ponytail: heurística de precisão — só acusa se NENHUM conectivo aparece na frase
        // inteira. Um "que"/"mas"/"de outro" já significa que a relação foi dita, e a frase
        // sai da mira mesmo que seja longa. Se um dia escapar parataxe COM conectivo
        // decorativo, o passo seguinte é exigir conectivo por item, não no total.
        if (CONECTIVOS.test(frase)) continue;
        const alvo = frase.trim();
        // O `match` é substituído LITERALMENTE pelo passe cirúrgico (humanize.ts), então
        // precisa ser a frase inteira: devolver um prefixo truncado trocaria o começo e
        // deixaria a cauda órfã. Frase absurdamente longa (sem pontuação) sai da mira.
        if (alvo.length > FRASE_MAX) continue;
        out.push(alvo);
      }
      return out;
    },
  },
];

// ── Eco numérico ───────────────────────────────────────────────────────────────
// Defeito RELACIONAL: a mesma quantidade vestindo dois fatos diferentes. O ouvinte não
// distingue, e o segundo número rouba o peso do primeiro.
//
// Mora aqui porque esta é a casa dos detectores, mas é exportada À PARTE e NÃO é chamada
// de dentro de `slopLint()` (016 §12): `slopLint` só roda no humanizador, DEPOIS da
// revisão — pendurar o eco lá entregaria o sinal tarde demais pro revisor, que é quem
// decide. O call site é `index.ts`, sobre o roteiro montado, antes de `critiqueAndRewrite`.
//
// O detector SINALIZA, NÃO JULGA. Três em quatro sinais reais são texto bom (016 §1.1: o
// refrão de "400%", o contraste de "37,5%"). Por isso não devolve `LintViolation`, não tem
// severity e nunca corrige: quem lê a lista e decide é o revisor.
export interface EcoNumerico {
  valor: string;
  frases: string[];
}

// Quantidade = dígito + escala/percentual. Número pelado (ano, idade, contagem) fica fora
// de propósito: é onde mora quase todo falso positivo, e ele não vira eco de quantidade.
// `milh|bilh|trilh` antes de `mil` senão "mil" casa o prefixo de "milhões".
const QUANTIDADE = new RegExp(
  `(\\d[\\d.,]*)\\s*(%|milh(?:ão|ões|ao|oes)|bilh(?:ão|ões|ao|oes)|trilh(?:ão|ões|ao|oes)|mil)${FIM}`,
  "gi"
);

// Seções que são lista de citação ou repetição por construção. Números nelas não são prosa
// do roteiro: acusá-las faria TODO roteiro acusar.
const SECAO_MUDA = /^(fontes|varia[cç][oõ]e?s?_de_hook)/i;
const HEADER = /^#{1,3}\s*(.+)$/;

// Chave de agrupamento. Em pt-BR "." é milhar e "," é decimal, então "37,5" → 37.5 e
// "1.500" → 1500. Percentual e escala vivem em espaços separados: 2 milhões nunca colide
// com 2%.
// ponytail: só agrupa o que veio COM unidade — "2 milhões" e "2.000.000" são grupos
// distintos porque o segundo nem é detectado. Normalizar número pelado é o passo seguinte,
// se algum dia o falso positivo de ano/idade valer o preço.
function chaveDeQuantidade(numero: string, unidade: string): string {
  const n = Number(numero.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n)) return "";
  const u = unidade.toLowerCase();
  if (u === "%") return `%:${n}`;
  const fator = u.startsWith("milh") ? 1e6 : u.startsWith("bilh") ? 1e9 : u.startsWith("trilh") ? 1e12 : 1e3;
  return `n:${n * fator}`;
}

export function ecosNumericos(text: string): EcoNumerico[] {
  try {
    const grupos = new Map<string, EcoNumerico>();
    let mudo = false;
    // Mesma separação de frases do detector de parataxe.
    for (const bruta of text.split(/(?<=[.!?])\s+|\n+/)) {
      const frase = bruta.trim();
      const header = frase.match(HEADER);
      if (header) {
        mudo = SECAO_MUDA.test(header[1].trim());
        continue;
      }
      if (mudo) continue;
      // Mesmo teste de linha da parataxe (slop-lint.ts:146): citação, URL e data
      // dd/mm/aaaa são números por natureza, não eco.
      if (/https?:\/\/|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(frase)) continue;

      for (const m of frase.matchAll(QUANTIDADE)) {
        const chave = chaveDeQuantidade(m[1], m[2]);
        if (!chave) continue;
        // A ÂNCORA É A FRASE INTEIRA, NUNCA O NÚMERO. Se alguém um dia ligar isto no passe
        // cirúrgico, `current.split(match).join(sub)` (humanize.ts:101) substitui TODAS as
        // ocorrências pelo mesmo texto — devolver "60%" trocaria as duas de uma vez, que é
        // exatamente o avesso do conserto de um defeito relacional.
        const g = grupos.get(chave) ?? { valor: m[0].replace(/\s+/g, " "), frases: [] };
        if (!g.frases.includes(frase)) g.frases.push(frase);
        grupos.set(chave, g);
      }
    }
    return [...grupos.values()].filter((g) => g.frases.length > 1);
  } catch {
    return []; // detector com bug nunca derruba a geração (016 §7)
  }
}

export const blockCount = (v: LintViolation[]) => v.filter((x) => x.severity === "block").length;

// Travessão de fala de personagem: início de linha (após espaços) ou logo após ": ".
// É a única forma permitida — ex.: "João disse: —Nunca mais volte aqui."
const DIALOGUE_DASH = /(^[ \t]*|:[ \t]+)—/gm;
// Travessão de slop: em-dash em qualquer lugar, ou en-dash usado como travessão (" – ").
const SLOP_DASH = /—|\s–\s/g;

// Conta só os travessões de slop, ignorando os de fala.
function slopDashCount(text: string): number {
  return (text.replace(DIALOGUE_DASH, "$1 ").match(SLOP_DASH) ?? []).length;
}

// Remove todo travessão de slop (vira vírgula), preservando os de fala de personagem.
// Determinístico: a garantia final de "zero travessão" não depende do LLM obedecer.
export function dedash(text: string): string {
  const KEEP = " __KEEPDASH__ "; // sentinela pra proteger o travessão de fala
  return text
    .replace(DIALOGUE_DASH, (m) => m.replace("—", KEEP))
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s+–\s+/g, ", ")
    .replace(/,\s*,/g, ",")
    .split(KEEP)
    .join("—");
}

// Aplica dedash em toda string dentro de um objeto/array (artefatos aninhados).
export function deepDedash<T>(value: T): T {
  if (typeof value === "string") return dedash(value) as T;
  if (Array.isArray(value)) return value.map(deepDedash) as unknown as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deepDedash(v)])
    ) as T;
  }
  return value;
}
