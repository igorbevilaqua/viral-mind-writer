// Características concretas por roteiro (corpo, estilo, conclusão). Calculadas uma vez por script_id.
import { carregar, palavras, frases, tokens } from "./h.mjs";

export const sa = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); // sem acento, com pontuação
const low = (s) => (s ?? "").toLowerCase();
const conta = (s, re) => (s.match(re) ?? []).length;
const por100 = (k, w) => (w ? (100 * k) / w : 0);
// fronteira de palavra que entende acento (o \b do JS não entende)
const B = "(?<![\\p{L}\\p{N}])", E = "(?![\\p{L}\\p{N}])";
const rx = (s, f = "giu") => new RegExp(s.replaceAll("\\b<", B).replaceAll("\\b>", E), f);

// Antítese "não é X, é Y" (e variantes com ponto, plural, "e sim", "mas sim"). Texto com acento.
const ANTITESE = rx("\\b<não\\b> (?:é|são|foi|era|está|estão|eram|seria)\\b> [^.!?;\\n]{1,60}?[,.;:]\\s*(?:e sim |mas sim |mas |e )?(?:é|são|foi|era|está|estão|eram|seria)\\b>");
const ANTITESE_SOBRE = rx("\\b<não\\b> (?:é|foi|era) (?:sobre|só|apenas|por)\\b> [^.!?\\n]{1,60}?[,.]\\s*(?:é|foi|era)\\b>");
// Pergunta elíptica curta: "O resultado?", "E o problema?", "Resultado?", "O motivo?" (sem verbo, até 3 palavras)
const ELIPTICA = /^(e )?((o|a|os|as) )?[\p{L}]+( [\p{L}]+)?\?$/iu;
const INTERROG = /^(e )?(como|por que|porque|por qu[eê]|quem|qual|quais|quanto|quantos|quantas|onde|quando|o que|sab|ser[aá]|j[aá] pensou|voc[eê]|isso|faz|tem|d[aá]|vale|pode)\b/i;
const CONECTIVO_INICIO = /^(mas|só que|so que|e|então|entao|porque|por isso|até que|ate que|foi aí|foi ai|foi quando|foi então|depois|enquanto|quando|ou seja|com isso|no entanto|porém|porem|além disso|alem disso|aí|ai|agora|resultado|só|so|isso|daí|dai|desde|anos depois|meses depois|hoje|nesse|naquele|naquela|nessa|no mesmo|na mesma|pouco depois|logo|assim|a partir|por causa|graças|gracas)\b/i;
const STOP = new Set("que para com uma por mais como mas dos das nos nas pelo pela isso esse essa este esta ele ela eles elas seu sua seus suas voce voces quando onde porque entao ainda tambem muito muita muitos muitas todo toda todos todas depois antes sobre entre sem ser foi sao era tem ter tinha hoje aqui agora mesmo cada outro outra outros outras qual quais quem nao sim ate pra pelos pelas num numa isso aquilo essa esses essas estes estas desde apenas assim".split(" "));
const conteudo = (s) => new Set(tokens(s).filter((t) => t.length >= 4 && !STOP.has(t) && !/^\d+$/.test(t)));
const NUM = /\d+(?:[.,]\d+)*|\b(mil|milh[aãoõ]\w*|bilh\w*|trilh\w*)\b/giu;
const numerosDe = (s) => new Set(((s ?? "").match(/\d+(?:[.,]\d+)*/g) ?? []).map((x) => x.replace(/[.,]/g, "")));

// tricolon de fechamento: parágrafo que termina com "A, B e C."
// itens curtos: 1º até 6 palavras (pode carregar o verbo), 2º e 3º até 4 palavras
const TRI = /([^,.;:!?]{1,45}),\s+([^,.;:!?]{1,30}),?\s+e\s+([^,.;:!?]{1,30})[.!…]?\s*$/iu;
const TRICOLON = { test: (s) => { const m = (s ?? "").trim().match(TRI); if (!m) return false; const w = (x) => x.trim().split(/\s+/).length; return w(m[1]) <= 6 && w(m[2]) <= 4 && w(m[3]) <= 4; } };

function feats(r) {
  const g = r.g;
  const corpo = g.corpo ?? "", cs = sa(corpo), cw = palavras(corpo) || 1;
  const cparas = corpo.split("\n").filter(Boolean);
  const falado = [g.hook, g.subhook, corpo, g.conclusao].filter(Boolean).join("\n");
  const fs = sa(falado), fw = palavras(falado) || 1;
  const fparas = falado.split("\n").filter(Boolean);
  const sents = fparas.flatMap((p) => frases(p));
  const csents = cparas.flatMap((p) => frases(p));
  const conc = g.conclusao ?? "", ks = sa(conc), kw = palavras(conc);
  const conc2 = g.conclusao2 ?? "";
  const hook = g.hook ?? "";

  // nomes próprios no corpo: maiúscula fora do início de frase
  let nomes = 0;
  for (const s of csents) { const t = s.split(/\s+/).slice(1); nomes += t.filter((x) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}]{1,}/u.test(x)).length; }
  // corrida de frases longas (>=12 palavras) seguidas
  let run = 0, maxRun = 0;
  for (const s of sents) { if (palavras(s) >= 12) { run++; maxRun = Math.max(maxRun, run); } else run = 0; }
  // frases consecutivas começando com "E"
  let eSeguidas = 0;
  for (let i = 1; i < sents.length; i++) if (/^E\s/.test(sents[i]) && /^E\s/.test(sents[i - 1])) eSeguidas++;
  const perguntas = sents.filter((s) => /\?\s*$/.test(s) || /\?/.test(s));
  const elipticas = sents.filter((s) => ELIPTICA.test(s.trim()) && palavras(s) <= 3 && !INTERROG.test(s.trim()));
  const curtasQ = sents.filter((s) => /\?\s*$/.test(s) && palavras(s) <= 4);
  const tricolons = fparas.filter((p) => { const ult = frases(p).pop() ?? ""; return TRICOLON.test(ult) && !/\?/.test(ult); });

  // conclusão
  const hookC = conteudo(hook), concC = conteudo(conc);
  const inter = [...concC].filter((t) => hookC.has(t)).length;
  const numsAntes = numerosDe([hook, g.subhook, corpo].join(" "));
  const numsConc = [...numerosDe(conc)];
  const kSents = frases(conc);
  const ultK = kSents[kSents.length - 1] ?? "";

  return {
    // tamanho do corpo
    corpo_palavras: cw, corpo_paras: cparas.length,
    // densidades no corpo (por 100 palavras)
    viradas100: por100(conta(cs, /\b(mas|so que|porem|entretanto|no entanto|contudo|todavia)\b/g), cw),
    portanto100: por100(conta(cs, /\b(entao|por isso|com isso|resultado|consequencia|por causa disso|foi assim que|e assim)\b/g), cw),
    numeros100: por100(conta(corpo, NUM), cw),
    anos: conta(corpo, /\b(1[5-9]|20)\d\d\b/g),
    voce100: por100(conta(cs, /\bvoces?\b/g), cw),
    eu100: por100(conta(cs, /\b(eu|me|meu|minha|comigo)\b/g), cw),
    nomes100: por100(nomes, cw),
    perguntas_corpo: conta(corpo, /\?/g),
    aspas: conta(corpo, /["“][^"”\n]{8,}["”]/g),
    frase_media: csents.length ? cw / csents.length : 0,
    frac_longas: csents.length ? csents.filter((s) => palavras(s) >= 12).length / csents.length : 0,
    frac_curtas: csents.length ? csents.filter((s) => palavras(s) <= 6).length / csents.length : 0,
    max_run_longas: maxRun,
    frac_para_conectivo: cparas.length ? cparas.filter((p) => CONECTIVO_INICIO.test(p.trim())).length / cparas.length : 0,
    frac_para_mas: cparas.length ? cparas.filter((p) => /^(mas|só que|so que|porém|porem)\b/i.test(p.trim())).length / cparas.length : 0,
    frac_para_e: cparas.length ? cparas.filter((p) => /^e\s/i.test(p.trim())).length / cparas.length : 0,
    // estilo (texto falado inteiro, sem bloco final)
    antitese: conta(falado, ANTITESE) + conta(falado, ANTITESE_SOBRE),
    perguntas: perguntas.length,
    elipticas: elipticas.length,
    curtasQ: curtasQ.length,
    tricolon: tricolons.length,
    e_seguidas: eSeguidas,
    travessao: conta(falado, /[—–]/g),
    metafora_llm: conta(fs, /\b(jornada|mergulh\w*|divisor de aguas|abre portas|chave que abre|virada de chave)\b/g),
    // conclusão
    conc_palavras: kw, conc_frases: kSents.length, conc_ult_palavras: palavras(ultK),
    conc_overlap_hook: hookC.size ? inter / hookC.size : 0,
    conc_numero_novo: numsConc.some((n) => !numsAntes.has(n)),
    conc_tem_numero: numsConc.length > 0,
    conc_sem: ks, conc_raw: conc, conc2_sem: sa(conc2), ultK_sem: sa(ultK),
    conc_antitese: conta(conc, ANTITESE) + conta(conc, ANTITESE_SOBRE),
    // textos para regex de presença
    corpo_sem: cs, falado_sem: fs,
  };
}

let _F = null;
export function F() {
  if (_F) return _F;
  _F = new Map();
  for (const r of carregar()) if (!_F.has(r.script_id)) _F.set(r.script_id, feats(r));
  return _F;
}
export const f = (r) => F().get(r.script_id);

// self-check rápido das regex mais frágeis
if (process.argv[1]?.endsWith("feat.mjs")) {
  const t = (re, s) => { re.lastIndex = 0; return re.test(s); };
  console.assert(t(ANTITESE, "Não é um presidente descontrolado, é estratégia."), "antitese 1");
  console.assert(t(ANTITESE, "Não são um ataque de raiva. Aquilo é um plano.") === false, "antitese 2 (pronome no meio fica de fora: limite conhecido)");
  console.assert(t(ANTITESE, "Não foi sorte. Foi estratégia."), "antitese 3");
  console.assert(!t(ANTITESE, "Não é fácil, e ninguém esperava."), "antitese falso positivo (e = and)");
  console.assert(ELIPTICA.test("O resultado?") && ELIPTICA.test("E o problema?") && !INTERROG.test("O resultado?"), "eliptica");
  console.assert(INTERROG.test("Como isso é possível?"), "interrog");
  console.assert(TRICOLON.test("Ele perdeu a casa, o carro e a família."), "tricolon");
  const Fm = F(); console.log("ok, roteiros com features:", Fm.size);
}
