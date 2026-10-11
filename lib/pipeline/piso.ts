// Piso de clareza (plano 024, 1.2). Módulo puro: sem banco, sem LLM.
//
// Mede no texto pronto o que gera reclamação e reescrita humana: capital no lugar do país,
// sigla sem explicação, número sem orçamento, falta de virada, "Ou seja" em série, origem
// contada em ordem, hook repetido na abertura e fórmula repetida entre roteiros. Não bloqueia
// nada: vira sinal para o revisor/humanizador e régua do banco de prova.
//
// Os tetos vêm da doutrina do plano 024 (§3) e do estudo de outubro; cada um diz de onde veio.
import { dividirFrases } from "./slop-lint";
import { ehCopiaDoHook } from "./draft";

const contarPalavras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const por100 = (k: number, n: number) => (n ? Math.round((k / n) * 10000) / 100 : 0);

// ── Metonímia de jornal ──────────────────────────────────────────────────────────────────────
// Capital no lugar do país/governo AGINDO: "Washington percebeu", "Pequim decidiu", "responde a
// Pequim", "estatal de Pequim", "na visão de Pequim". Capital como lugar passa: "visita a Pequim",
// "moradores de Pequim", "garoto de Brasília", "o Washington Post".
const CAPITAIS = /\b(Pequim|Washington|Brasília|Planalto|Kremlin|Casa Branca|Moscou|Bruxelas|Downing Street|Itamaraty|Teerã|Tóquio|Nova Délhi)\b/g;
// ponytail: verbo depois (lista + pretérito -ou/-eu/-iu, com um advérbio no meio) ou regência de
// agente antes. Ceiling: "Pequim, que nunca cedeu," escapa; upgrade é um tagger de POS.
const VERBO_DEPOIS = /^\s+(?:(?:finalmente|já|também|agora|logo|ainda|só|nunca|não|então)\s+)?(?:\p{L}+(?:ou|eu|iu)|quer|vai|está|tá|tem|faz|diz|manda|decide|decidiu|responde|reage|pressiona|ameaça|exige|sabe|vê|aposta|controla|percebe|foi|era|deu|viu|agiu|disse)\b/iu;
const AGENTE_ANTES = /(?:\brespondem?\s+(?:a|à)|\bestata(?:l|is)\s+de|\bvisão\s+de|\bplano\s+de|\brecado\s+de|\bresposta\s+de|\bpressão\s+de|\bordem\s+de|\bgoverno\s+de|\bmão\s+de|\binteresse\s+de|\baliados?\s+de|\bdinheiro\s+de)\s*$/i;

export function metonimias(texto: string): string[] {
  const out: string[] = [];
  for (const m of texto.matchAll(CAPITAIS)) {
    const antes = texto.slice(Math.max(0, m.index - 40), m.index);
    const depois = texto.slice(m.index + m[0].length, m.index + m[0].length + 40);
    if (/^\s+Post\b/.test(depois)) continue;
    if (VERBO_DEPOIS.test(depois) || AGENTE_ANTES.test(antes)) out.push(trecho(texto, m.index, m[0].length));
  }
  return out;
}

// ── Sigla sem explicação na primeira menção ──────────────────────────────────────────────────
// Sigla que o brasileiro usa no dia a dia passa sem aposto. O resto precisa do "o que é" colado
// na primeira vez: "a CPFL, distribuidora de luz de São Paulo"; "o Cade, que é o órgão…".
// ponytail: só siglas (2 a 6 maiúsculas). Nome de empresa por extenso ("a Anglo American") não
// é pego: separar empresa desconhecida de pessoa/marca famosa pede lista ou LLM. Upgrade: lista
// de entidades do dossiê (PERSONAGENS já traz o "o que é") cruzada com o texto.
const SIGLAS_CONHECIDAS = new Set([
  "EUA", "PIX", "INSS", "SUS", "CPF", "CNH", "FGTS", "CLT", "MEI", "IPVA", "IPTU", "IR", "ENEM",
  "STF", "PT", "PL", "PSDB", "MDB", "PF", "PM", "ONU", "FBI", "CIA", "NASA", "OTAN", "FIFA", "CBF",
  "NBA", "UFC", "TV", "CEO", "IA", "PIB", "IBGE", "USP", "BC", "CNN", "BBC", "UOL", "SBT", "OK",
  "DJ", "PC", "GPS", "SMS", "WIFI", "HD", "4G", "5G", "ATM", "UTI", "RG", "BYD", "BMW", "IPO",
  "SP", "RJ", "MG", "BR", "USA", "CNPJ", "DNA", "SUV", "VIP", "MBA", "KFC", "MIT", "NFL", "GTA",
]);
// Caixa alta também é ÊNFASE no roteiro humano ("TUDO", "AGORA", "MUITO MAIS"). Sigla de verdade
// quase não tem vogal: menos da metade das letras são vogais e não está numa corrida de caixa alta.
// ponytail: perde siglas vogais como IOF e SESI; aceito, o custo de acusar ênfase é maior.
const VOGAIS = /[AEIOUÁÉÍÓÚÂÊÔÃÕ]/g;
const pareceSigla = (s: string) => (s.match(VOGAIS) ?? []).length / s.length < 0.5;
const SIGLA = /\b[A-Z][A-Z0-9]{1,5}\b/g;
// O aposto logo DEPOIS ("X, que é…", "X, a estatal…", "X (…)") ou a categoria logo ANTES
// ("a estatal X", "o órgão X", "a empresa X").
const CATEGORIA = "(?:empresa|estatal|órgão|banco|agência|fundo|grupo|montadora|distribuidora|operadora|companhia|instituto|partido|fabricante|rede|plataforma|marca|startup|ministério|autarquia|consultoria|gigante|varejista|associação|sindicato|universidade)";
const APOSTO_DEPOIS = new RegExp(`^\\s*(?:\\(|,\\s*(?:que\\s+(?:é|era|são|cuida|faz|controla|reúne|representa)|uma?\\s|os?\\s|as?\\s|${CATEGORIA}|maior|principal|dona))`, "i");
const CATEGORIA_ANTES = new RegExp(`${CATEGORIA}\\s+(?:\\S+\\s+){0,3}$`, "i");

export function siglasSemAposto(texto: string): string[] {
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const m of texto.matchAll(SIGLA)) {
    const s = m[0];
    if (vistas.has(s)) continue; // só a primeira menção precisa explicar
    vistas.add(s);
    if (SIGLAS_CONHECIDAS.has(s) || /^\d/.test(s) || /^[IVXLC]+$/.test(s) || !pareceSigla(s)) continue;
    const depois = texto.slice(m.index + s.length, m.index + s.length + 40);
    const antes = texto.slice(Math.max(0, m.index - 50), m.index);
    if (/^\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}\b/.test(depois) || /\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}\s+$/.test(antes)) continue; // ênfase
    if (/^\$/.test(depois)) continue; // US$
    if (APOSTO_DEPOIS.test(depois) || CATEGORIA_ANTES.test(antes)) continue;
    out.push(s);
  }
  return out;
}

// ── Números ──────────────────────────────────────────────────────────────────────────────────
// Mesma contagem do text-metrics (um "R$ 3.400" ou "2 milhões" é UM número).
const NUMERO = /(?:R\$\s*)?\d+(?:[.,]\d+)*(?:\s*%|\s*(?:mil|milh(?:ão|ões|ao|oes)|bilh(?:ão|ões|ao|oes)|k)(?![a-zà-ú]))?/gi;
// Exato demais para a fala: 3+ dígitos significativos ("25.680", "1,79 bilhão", "46,8"), fora ano.
const ANO = /^(?:19|20)\d{2}$/;
function exato(n: string): boolean {
  const digitos = n.replace(/\D/g, "");
  if (ANO.test(digitos) && !/[.,%]/.test(n)) return false;
  const significativos = digitos.replace(/^0+/, "").replace(/0+$/, "");
  return significativos.length >= 3;
}

// ── Virada, "Ou seja", origem em ordem ──────────────────────────────────────────────────────
const VIRADA = /\b(?:mas|só que|porém|entretanto)\b/gi;
const OU_SEJA = /\bou seja\b/gi;
// Estudo de outubro: 2+ marcadores de biografia em ordem, OR 0,63.
const ORIGEM = /\b(?:nasceu|trabalhava como|no início|percebeu que|foi aí que|foi quando|tudo começou|começou como|ainda jovem|desde criança)\b/gi;

// ── Tetos (plano 024, §3) ────────────────────────────────────────────────────────────────────
export const PISO = {
  numerosPor100: 1.8, // topo da casa: 1,74 (dados-lacuna.md)
  numerosExatos: 1, // um exato como âncora; o resto arredondado
  viradasPor100: 1, // estudo de outubro: sem 1 virada a cada 100 palavras, ret_final 0,61
  ouSeja: 1, // OR 1,30 quando traduz o fato; em série vira tique (Codex: o dobro da casa)
  origem: 2, // 2+ marcadores: OR 0,63
  palavrasMin: 300, // abaixo derruba (OR 0,70)
  palavrasMax: 500, // acima o ganho some
} as const;

export interface RelatorioPiso {
  palavras: number;
  metonimias: string[];
  siglas_sem_aposto: string[];
  numeros: number;
  numeros_por_100: number;
  numeros_exatos: string[];
  viradas_por_100: number;
  ou_seja: number;
  origem: number;
  hook_duplicado: boolean;
  /** Uma linha por regra violada, pronta para o revisor e para o placar do banco. */
  violacoes: string[];
}

/** Mede o roteiro FALADO (hook + corpo). `corpo` é o roteiro sem o hook, como é salvo. */
export function medirPiso(hook: string | null, corpo: string): RelatorioPiso {
  const texto = [hook, corpo].filter(Boolean).join("\n\n");
  const palavras = contarPalavras(texto);
  const nums = texto.match(NUMERO) ?? [];
  const exatos = nums.filter(exato);
  const r: Omit<RelatorioPiso, "violacoes"> = {
    palavras,
    metonimias: metonimias(texto),
    siglas_sem_aposto: siglasSemAposto(texto),
    numeros: nums.length,
    numeros_por_100: por100(nums.length, palavras),
    numeros_exatos: exatos,
    viradas_por_100: por100((texto.match(VIRADA) ?? []).length, palavras),
    ou_seja: (texto.match(OU_SEJA) ?? []).length,
    origem: (texto.match(ORIGEM) ?? []).length,
    hook_duplicado: !!hook && ehCopiaDoHook(hook, corpo.split(/\n\s*\n/)[0] ?? ""),
  };
  const v: string[] = [];
  if (r.metonimias.length) v.push(`capital no lugar do país: ${r.metonimias.join(" | ")}`);
  if (r.siglas_sem_aposto.length) v.push(`sigla sem explicação na primeira menção: ${r.siglas_sem_aposto.join(", ")}`);
  if (r.numeros_por_100 > PISO.numerosPor100) v.push(`${r.numeros} números (${r.numeros_por_100} a cada 100 palavras; teto ${PISO.numerosPor100})`);
  if (exatos.length > PISO.numerosExatos) v.push(`números exatos demais para a fala (arredonde): ${exatos.join(", ")}`);
  if (r.viradas_por_100 < PISO.viradasPor100) v.push(`pouca virada ("mas"): ${r.viradas_por_100} a cada 100 palavras (mínimo ${PISO.viradasPor100})`);
  if (r.ou_seja > PISO.ouSeja) v.push(`"Ou seja" ${r.ou_seja} vezes (máximo ${PISO.ouSeja})`);
  if (r.origem >= PISO.origem) v.push(`origem contada em ordem (${r.origem} marcadores como "nasceu", "foi aí que")`);
  if (r.hook_duplicado) v.push("a abertura do corpo repete o hook");
  if (palavras < PISO.palavrasMin) v.push(`curto demais: ${palavras} palavras (mínimo ${PISO.palavrasMin})`);
  if (palavras > PISO.palavrasMax) v.push(`longo demais: ${palavras} palavras (máximo ${PISO.palavrasMax})`);
  return { ...r, violacoes: v };
}

// ── Fórmula repetida ENTRE roteiros ──────────────────────────────────────────────────────────
// Vício de IA não se pega com banlist (vira sinônimo); pega-se pela repetição, comparada com a
// casa: "Só que" abre frase em 51% dos roteiros humanos de topo, então não é tique; "Ou seja" está
// em 17% dos humanos e em 53% do Codex, e é. Uma abertura de 2 palavras é fórmula quando passa de
// 15% dos roteiros E do dobro da fração humana.
// Snapshot medido em 11/10/2026 sobre 400 roteiros do CRM (topo e base de coeficiente), plano 024.
export const BASE_HUMANA: Record<string, number> = {
  "só que": 0.51, "e o": 0.3, "o que": 0.19, "se você": 0.18, "ou seja": 0.17, "mas o": 0.15,
  "e a": 0.13, "por isso": 0.11, "em a": 0.06, "e quem": 0.05, "enquanto isso": 0.03,
  "eu sou": 0.62, "meu nome": 0.22, // apresentação do bloco final (o Codex a põe no comando)
};
export const PISO_FORMULA = 0.15;

export function aberturasRepetidas(textos: string[], min = 5): { abertura: string; fracao: number; casa: number }[] {
  if (textos.length < min) return [];
  const conta = new Map<string, number>();
  for (const t of textos) {
    const vistas = new Set<string>();
    for (const f of dividirFrases(t)) {
      const ab = f.toLowerCase().match(/\p{L}+/gu)?.slice(0, 2).join(" ");
      if (ab && ab.includes(" ")) vistas.add(ab);
    }
    for (const ab of vistas) conta.set(ab, (conta.get(ab) ?? 0) + 1);
  }
  return [...conta.entries()]
    .map(([abertura, n]) => ({ abertura, fracao: Math.round((n / textos.length) * 100) / 100, casa: BASE_HUMANA[abertura] ?? 0.02 }))
    .filter((x) => x.fracao > PISO_FORMULA && x.fracao > 2 * x.casa)
    .sort((a, b) => b.fracao - a.fracao);
}

function trecho(texto: string, i: number, n: number, pad = 35): string {
  return texto.slice(Math.max(0, i - pad), i + n + pad).replace(/\s+/g, " ").trim();
}

// ── Alvos locais para correção cirúrgica (plano 024, 2.7 e 2.8) ─────────────────────────────
// O que o piso aponta e cabe numa FRASE vira alvo com o trecho exato: capital agindo, sigla sem
// explicação na primeira menção, número exato demais, "Ou seja" repetido. O que é do texto
// inteiro (pouca virada, tamanho) não vira alvo local: vai ao revisor como sinal.
export interface AlvoPiso {
  label: string;
  match: string;
}
export const TETO_ALVOS_PISO = 6;

export function alvosDoPiso(corpo: string): AlvoPiso[] {
  const frases = dividirFrases(corpo);
  const out: AlvoPiso[] = [];
  const add = (label: string, frase: string | undefined) => {
    if (frase && !out.some((a) => a.match === frase)) out.push({ label, match: frase });
  };
  for (const f of frases)
    if (metonimias(f).length) add('capital no lugar do país: diga o país ("a China", "os Estados Unidos", "o governo")', f);
  for (const sigla of siglasSemAposto(corpo))
    add(`"${sigla}" aparece sem dizer o que é: cole a função na primeira menção, ou use só a função`, frases.find((f) => new RegExp(`\\b${sigla}\\b`).test(f)));
  const exatos = frases.filter((f) => (f.match(NUMERO) ?? []).some(exato));
  if (exatos.length > PISO.numerosExatos)
    for (const f of exatos.slice(PISO.numerosExatos)) add("número exato demais para a fala: arredonde (\"mais de 25 mil\", \"quase 2 bilhões\")", f);
  const ouSeja = frases.filter((f) => /^ou seja\b/i.test(f));
  for (const f of ouSeja.slice(PISO.ouSeja)) add('"Ou seja" repetido: diga a consequência direto, sem a muleta', f);
  return out.slice(0, TETO_ALVOS_PISO);
}
