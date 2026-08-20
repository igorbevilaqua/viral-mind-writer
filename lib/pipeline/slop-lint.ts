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

// ── Ritmo de frase e tamanho de parágrafo ──────────────────────────────────────
// Medido em 66 roteiros gerados (459 parágrafos, 1.596 frases): 51,1 palavras por parágrafo em
// média, o maior com 126, e 59,5% acima de 45. Frase curta o roteirista JÁ usa (18,3% com ≤6
// palavras, desvio 9,0) — o que falta é DISTRIBUIÇÃO: 45 dos 66 roteiros têm um trecho de 4+
// frases longas seguidas sem nada quebrando a inércia, e o pior tem 14 seguidas.
//
// Por isso a regra é TETO DE INÉRCIA e não cadência: alternar curta/longa 1-para-1 produz
// metrônomo, que é o outro extremo do defeito. E por isso mora aqui e não no prompt do
// roteirista: o sintoma é contável, a escolha de QUAL frase encurtar é julgamento e continua
// do modelo (plans/ritmo-e-paragrafo.md).

// A regra das "3 linhas" do operador, convertida em palavras. Hoje 59,5% dos parágrafos
// estouram até 45, então este teto é deliberadamente mais apertado que o estado atual.
export const PARAGRAFO_MAX_PALAVRAS = 35;
// A média das sequências hoje é 2,3, então 3 corta a cauda ruim sem brigar com o que já está
// bom. A maior sequência medida é 14.
export const MAX_LONGAS_SEGUIDAS = 3;
// Corte usado na medição das sequências — mantido igual para o número seguir comparável.
export const FRASE_LONGA = 12;

const contarPalavras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

// Títulos: o ponto deles vem SEMPRE seguido de nome próprio em maiúscula ("o Sr. Silva"), então
// nunca fecha frase. Abreviação terminal ("etc.", "obs.") não precisa de lista: ela só fecha
// frase quando o que vem depois começa em maiúscula, e é exatamente o que a regra abaixo testa.
const TITULOS = /\b(sr|sra|srs|sras|dr|dra|drs|profa?|exm[oa]|st[oa])\.$/i;
// Candidato a fim de frase: pontuação final (reticências incluídas) + fechamento opcional de
// citação + espaço. Sem o espaço obrigatório, "R$ 3.400" e "1.5 milhão" viravam duas frases.
const CANDIDATO_FIM = /([.!?…]+["'”’)\]]*)([ \t]*\n+[ \t]*|[ \t]+)/g;
const INICIO_DE_FRASE = /^[A-ZÀ-Ú0-9"“«(]/;

interface FraseComPos {
  texto: string;
  inicio: number;
}

function frasesComPos(texto: string): FraseComPos[] {
  const out: FraseComPos[] = [];
  let inicio = 0;
  for (const m of texto.matchAll(CANDIDATO_FIM)) {
    const fimDaFrase = m.index + m[1].length;
    const bruta = texto.slice(inicio, fimDaFrase);
    // Quebra de linha fecha frase sempre (linha de lista, header, parágrafo). Dentro da linha,
    // só fecha se a próxima frase começa como frase e o ponto não é de título.
    const corta =
      m[2].includes("\n") || (!TITULOS.test(bruta) && INICIO_DE_FRASE.test(texto.slice(m.index + m[0].length)));
    if (!corta) continue;
    const frase = bruta.trim();
    if (frase) out.push({ texto: frase, inicio: inicio + bruta.indexOf(frase) });
    inicio = m.index + m[0].length;
  }
  const resto = texto.slice(inicio);
  const frase = resto.trim();
  if (frase) out.push({ texto: frase, inicio: inicio + resto.indexOf(frase) });
  return out;
}

/** Divide em frases aguentando português real: "Sr. Silva", "R$ 3.400", "1.5 milhão", "parou... e voltou". */
export const dividirFrases = (texto: string): string[] => frasesComPos(texto).map((f) => f.texto);

interface Bloco {
  texto: string;
  inicio: number;
  secao: string;
}

// Um bloco = corrida de linhas não vazias (o roteiro é armazenado com parágrafo separado por
// linha em branco — confirmado em 40 roteiros de vm_generated_scripts, 100% com "\n\n").
const BLOCO = /[^\n]+(?:\n[ \t]*\S[^\n]*)*/g;
const HEADER_LINHA = /^#{1,3}[ \t]*([^\n]*)(?:\n|$)/;

// Só a PROSA entra na conta. FONTES é lista de citação e VARIACOES_DE_HOOK é lista numerada
// (uma linha por variação, sem linha em branco entre elas): medidas como parágrafo, as duas
// acusariam em todo roteiro. Mesma guarda de `ecosNumericos`.
function blocosDeProsa(texto: string): Bloco[] {
  const out: Bloco[] = [];
  let secao = "";
  let mudo = false;
  for (const m of texto.matchAll(BLOCO)) {
    let corpo = m[0];
    let inicio = m.index;
    // O header vem colado no primeiro parágrafo da seção ("## ROTEIRO\n<hook>"), não em bloco
    // próprio — daí ele ser descascado aqui em vez de virar um bloco descartado.
    const h = corpo.match(HEADER_LINHA);
    if (h) {
      secao = h[1].trim();
      mudo = SECAO_MUDA.test(secao);
      inicio += h[0].length;
      corpo = corpo.slice(h[0].length);
    }
    if (mudo || !corpo.trim()) continue;
    if (/https?:\/\//.test(corpo)) continue; // citação com link não é prosa do roteiro
    out.push({ texto: corpo, inicio, secao });
  }
  return out;
}

export interface ParagrafoLongo {
  /** Trecho VERBATIM — é ele que o passe cirúrgico substitui literalmente. */
  texto: string;
  palavras: number;
}

/** Parágrafos de prosa acima de `PARAGRAFO_MAX_PALAVRAS`, com a contagem de cada um. */
export function paragrafosLongos(texto: string): ParagrafoLongo[] {
  try {
    return blocosDeProsa(texto)
      .map((b) => ({ texto: b.texto.trim(), palavras: contarPalavras(b.texto) }))
      .filter((p) => p.palavras > PARAGRAFO_MAX_PALAVRAS);
  } catch {
    return []; // detector com bug nunca derruba a geração (016 §7)
  }
}

export interface SequenciaLonga {
  /** Trecho VERBATIM da sequência inteira — é ele que o passe cirúrgico substitui. */
  texto: string;
  /** Índice da primeira frase longa na contagem de frases de prosa do roteiro. */
  inicio: number;
  /** Quantas frases longas seguidas. */
  tamanho: number;
}

/** Corridas de mais de `MAX_LONGAS_SEGUIDAS` frases longas sem nenhuma curta quebrando a inércia. */
export function sequenciasLongas(texto: string): SequenciaLonga[] {
  try {
    // A inércia é do OUVINTE, e ele não ouve quebra de parágrafo: sequência que atravessa dois
    // parágrafos continua sendo sequência. Já a quebra de SEÇÃO corta, senão a corrida poderia
    // engolir o header "## COMANDO" no trecho e a substituição destruiria o formato.
    const frases = blocosDeProsa(texto).flatMap((b) =>
      frasesComPos(b.texto).map((f) => ({
        inicio: b.inicio + f.inicio,
        fim: b.inicio + f.inicio + f.texto.length,
        secao: b.secao,
        longa: contarPalavras(f.texto) >= FRASE_LONGA,
      }))
    );
    const out: SequenciaLonga[] = [];
    for (let i = 0; i < frases.length; i++) {
      if (!frases[i].longa) continue;
      let j = i;
      while (j + 1 < frases.length && frases[j + 1].longa && frases[j + 1].secao === frases[i].secao) j++;
      const tamanho = j - i + 1;
      if (tamanho > MAX_LONGAS_SEGUIDAS) {
        out.push({ texto: texto.slice(frases[i].inicio, frases[j].fim), inicio: i, tamanho });
      }
      i = j;
    }
    return out;
  } catch {
    return [];
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
