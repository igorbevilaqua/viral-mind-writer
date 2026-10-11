// 4. CONCLUSÃO (parágrafo antes do bloco final): como abre, forma, tamanho, retomada do hook.
// Contra coef, acerto, ret_final, compart, salvamentos, comentarios.
import { salvar } from "./h.mjs";
import { f } from "./feat.mjs";
import { multi, CABM } from "./multi.mjs";

const k = (re) => (r) => re.test(f(r).conc_sem); // conclusão sem acento
const k2 = (re) => (r) => re.test(f(r).conc2_sem);
export const CONC = [
  // aberturas
  ["abre: 'Essa história mostra/prova/ensina'", k(/^(e )?(essa|esta|a) historia (mostra|prova|ensina|revela|deixa|nos)/)],
  ["abre: 'No fim / No final'", k(/^(e |mas )?(no fim|no final|ao final)\b/)],
  ["abre: 'No fundo'", k(/^(e |mas )?no fundo\b/)],
  ["abre: 'A lição'", k(/^(e |mas )?(a (grande |maior |principal )?licao)\b/)],
  ["abre: 'Ou seja'", k(/^ou seja\b/)],
  ["abre: 'E é por isso / Por isso'", k(/^(e )?(e |foi )?por isso\b/)],
  ["abre: 'Isso mostra/prova/significa'", k(/^(e )?(isso|o que isso) (mostra|prova|revela|significa|quer dizer|nos mostra|deixa claro)\b/)],
  ["abre: 'Mais do que'", k(/^(e )?mais do que\b/)],
  ["abre: 'E agora / Agora'", k(/^(e )?agora\b/)],
  ["abre: 'A pergunta (é/que fica)'", k(/^(e )?a (grande |unica )?pergunta\b/)],
  ["abre: 'Então'", k(/^(e )?entao\b/)],
  ["abre: 'Hoje'", k(/^(e )?hoje\b/)],
  ["abre: 'E' (qualquer)", k(/^e\s/)],
  ["abre: 'Mas / Só que'", k(/^(mas|so que|porem)\b/)],
  ["abre: 'Enquanto'", k(/^(e )?enquanto\b/)],
  ["abre: 'Quem'", k(/^(e )?quem\b/)],
  ["abre: 'Se você / Você'", k(/^(e )?(se )?voce\b/)],
  ["abre: 'Imagina'", k(/^(e )?imagin/)],
  ["abre: 'Isso/Esse/Essa' (anafórico)", k(/^(e )?(isso|esse|essa|esses|essas)\b/)],
  ["abre com nome próprio/sujeito da história", (r) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}]+/u.test(f(r).conc_raw.trim()) && !/^(E|Mas|Só|Essa|Esse|Isso|No|Na|A|O|Os|As|Hoje|Então|Agora|Quem|Se|Você|Enquanto|Mais|Ou|Por|Imagina|Isso|Foi|Para|Pra|Com|Em|De|Do|Da|Um|Uma|Nem|Não|Sim|Porque|Quando|Até|Assim|Afinal|Aqui|Ainda|Já|Depois|Antes|Talvez|Pode)\b/u.test(f(r).conc_raw.trim())],
  // forma
  ["forma: aforismo 'Quem X, Y'", k(/(^|[.!?]\s+|\b(e|mas|porque) )quem [^,.?!]{2,60}, [^.?!]{2,90}/)],
  ["forma: antítese na conclusão", (r) => f(r).conc_antitese >= 1],
  ["forma: termina em frase curta (<=8 palavras)", (r) => f(r).conc_ult_palavras <= 8],
  ["forma: termina em frase longa (>=25 palavras)", (r) => f(r).conc_ult_palavras >= 25],
  ["forma: pergunta na conclusão", (r) => /\?/.test(f(r).conc_raw)],
  ["forma: pede opinião ('e você?', 'você faria')", k(/\b(o que voce acha|voce (acha|concorda|faria|teria|compraria|usaria|aceitaria|trocaria|confiaria|pagaria|deixaria)|e voce\?|e pra voce|qual (seria|e) a sua|comenta)\b/)],
  ["forma: projeção de futuro (vai/em breve/futuro)", k(/\b(vai|vao|em breve|futuro|proximos anos|proximas decadas|daqui a|amanha|podera|poderao|devera)\b/)],
  ["forma: 'você/seu/sua' na conclusão", k(/\b(voce|voces|seu|sua|seus|suas|te)\b/)],
  ["forma: sem 'você' na conclusão", (r) => !/\b(voce|voces|seu|sua|seus|suas|te)\b/.test(f(r).conc_sem)],
  ["forma: virada 'mas/só que/porém'", k(/\b(mas|so que|porem|no entanto)\b/)],
  ["forma: número na conclusão", (r) => f(r).conc_tem_numero],
  ["forma: número novo (não citado antes)", (r) => f(r).conc_numero_novo],
  ["forma: palavra de lição (lição/mostra/prova/ensina)", k(/\b(licao|licoes|mostra|prova|ensina|ensinamento|moral)\b/)],
  ["forma: 'Brasil/brasileiro' na conclusão", k(/\b(brasil|brasileir\w*)\b/)],
  ["forma: exclamação", (r) => /!/.test(f(r).conc_raw)],
  ["forma: 'hoje' (estado atual) na conclusão", k(/\bhoje\b/)],
  ["forma: contraste 'enquanto' na conclusão", k(/\benquanto\b/)],
  ["forma: 'ou seja' na conclusão", k(/\bou seja\b/)],
  // retomada do hook
  ["retomada: >=20% das palavras do hook voltam", (r) => f(r).conc_overlap_hook >= 0.2],
  ["retomada: 1-19%", (r) => f(r).conc_overlap_hook > 0 && f(r).conc_overlap_hook < 0.2],
  ["retomada: nenhuma palavra do hook", (r) => f(r).conc_overlap_hook === 0],
  // tamanho
  ["tamanho: <=15 palavras", (r) => f(r).conc_palavras <= 15],
  ["tamanho: 16-25", (r) => f(r).conc_palavras >= 16 && f(r).conc_palavras <= 25],
  ["tamanho: 26-35", (r) => f(r).conc_palavras >= 26 && f(r).conc_palavras <= 35],
  ["tamanho: 36-50", (r) => f(r).conc_palavras >= 36 && f(r).conc_palavras <= 50],
  ["tamanho: >50", (r) => f(r).conc_palavras > 50],
  ["conclusão de 1 frase", (r) => f(r).conc_frases === 1],
  ["conclusão de 3+ frases", (r) => f(r).conc_frases >= 3],
  // penúltimo parágrafo
  ["conclusao2 abre com 'Hoje'", k2(/^(e )?hoje\b/)],
  ["conclusao2 com pergunta", (r) => /\?/.test(f(r).conc2_sem)],
];

if (process.argv[1]?.endsWith("conclusao.mjs")) {
  const out = {};
  console.log(CABM);
  for (const [n, p] of CONC) { const m = multi(n, p); console.log(m.txt); out[n] = m.json; }
  salvar("conclusao.json", out);
}
