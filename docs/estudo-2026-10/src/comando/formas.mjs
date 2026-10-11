// Formas concretas do comando: como a promessa é feita, como termina, sobre o quê, verbo de ação.
// uso: node src/comando/formas.mjs [ft|fe]
import { writeFileSync } from "node:fs";
import { OUT, norm, frases } from "../lib.mjs";
import { L, OBJ } from "./feat.mjs";
import { medir, linhaSeg, cabSeg, linhaOutros, cabOutros } from "./medir.mjs";
const k = process.argv[2] ?? "ft";
const txt = (r) => norm(k === "ft" ? r.falado_tx : [r.g?.bloco_final].join(" "));
const raw = (r) => (k === "ft" ? r.falado_tx : r.g?.bloco_final ?? "");
const has = (rx) => (r) => rx.test(txt(r));
const fim = (r) => txt(r).split(" ").slice(-9).join(" ");
const C = [
  // como a promessa é feita
  ["promessa em 1a pessoa: \"eu te mostro / revelo / trago / analiso\"", has(/\b(eu )?(te )?(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho|destrincho|desvendo|traduzo)\b/)],
  ["\"todo dia / todos os dias\" + 1a pessoa (\"todo dia eu te mostro\")", has(/\btodos? (os )?dias?\b.{0,25}\b(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho|posto)\b|\b(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho)\b.{0,15}\btodos? (os )?dias?\b/)],
  ["\"todo dia / todos os dias\" sem 1a pessoa", (r) => /\btodos? (os )?dias?\b/.test(txt(r)) && !/\b(mostro|revelo|trago|analiso|ensino|explico|conto|compartilho|posto)\b/.test(txt(r))],
  ["\"aqui você aprende / fica sabendo / entende\"", has(/\baqui (voce|vc) (aprende|fica|entende|descobre|conhece|ve|encontra|recebe|vai)\b/)],
  ["\"se você quer entender / saber / conhecer\"", has(/\bse (voce|vc) (quer|quiser) (entender|saber|conhecer|descobrir|ver)\b/)],
  ["\"se você quer aprender\"", has(/\bse (voce|vc) (quer|quiser) aprender\b/)],
  ["\"se você quer continuar recebendo / aprendendo\"", has(/\bse (voce|vc) (quer|quiser) continuar\b/)],
  ["\"se você gosta de / curte\" (preferência)", has(/\bse (voce|vc) (gosta|curte|curtiu|gostou|ama)\b/)],
  ["\"se você é (apaixonado, empresário...)\" (identidade)", has(/\bse (voce|vc) (e|for) (apaixonad|empresari|empreendedor|dono|investidor|lider|gestor|profissional|curios|fa |do tipo|uma pessoa|alguem|daqueles)/)],
  ["\"se você valoriza / acredita / faz parte\" (valor)", has(/\bse (voce|vc) (valoriza|acredita|faz parte|concorda)\b/)],
  ["benefício pessoal (\"seu dinheiro\", \"pra você investir\")", (r) => OBJ.beneficio_pessoal.test(txt(r))],
  // exclusividade fina
  ["\"antes de todo mundo / da maioria\"", has(/\bantes (de todo mundo|da maioria|de todos|que todo mundo|dos outros)\b/)],
  ["\"antes de virar manchete / chegar aqui / acontecer\"", has(/\bantes (de|que) (vir|cheg|acontec|explod|sa[ii]r|ser |se torn|todo|a maioria)/)],
  ["\"em primeira mão / sair na frente / à frente\"", has(/\bprimeira mao\b|\bsair na frente\b|\ba frente\b|\bna frente\b/)],
  ["\"o que está mudando o mundo / planeta\"", has(/\b(estao|esta|vao|vai|que) (mudando|transformando|revolucionando|dominando|moldando|redefinindo) (o|a|os|as|nosso|nossa)? ?(mundo|planeta|futuro|jogo|mercado|brasil|vida|economia|forma)/)],
  ["\"histórias\" no comando", (r) => OBJ.historias.test(txt(r))],
  ["\"estratégias\" no comando", (r) => OBJ.estrategias.test(txt(r))],
  ["\"bastidores / por trás / segredos\"", (r) => OBJ.bastidores.test(txt(r))],
  ["tecnologia / IA / inovação", (r) => OBJ.tecnologia_ia.test(txt(r))],
  ["\"novidades / notícias / bem informado\"", (r) => OBJ.novidades.test(txt(r))],
  ["impostos / tributário", (r) => OBJ.impostos.test(txt(r))],
  ["dinheiro / investimento / patrimônio", (r) => OBJ.dinheiro.test(txt(r))],
  ["negócios / empresas / marcas", (r) => OBJ.negocios.test(txt(r))],
  ["China / geopolítica", (r) => OBJ.mundo_geo.test(txt(r))],
  ["carreira / liderança", (r) => OBJ.carreira.test(txt(r))],
  // ação e fecho
  ["\"me segue\"", has(/\bme segue\b/)],
  ["\"segue o meu perfil\" / \"segue meu perfil\"", has(/\bsegue (o )?meu perfil\b/)],
  ["\"segue esse perfil\"", has(/\bsegue (esse|este) perfil\b/)],
  ["\"segue aqui\"", has(/\bsegue aqui\b/)],
  ["\"já segue\"", has(/\bja (me )?segue\b/)],
  ["termina em \"agora\"", (r) => /\bagora$/.test(txt(r))],
  ["termina em \"para não perder o próximo vídeo\"", (r) => /nao perder (o|a) proxim[oa] (video|conteudo|historia|parte|post)$/.test(fim(r))],
  ["termina em \"para mais conteúdos/vídeos como esse\"", (r) => /(conteudos?|videos?|historias?) (como|igual a|iguais a) (esse|este|essa|esta|esses|estes)$/.test(fim(r))],
  ["termina em \"pra não ficar de fora / para trás\"", has(/\bnao (ficar|fique) (de fora|para tras|pra tras)\b/)],
  ["termina com promessa (\"que eu te mostro como\")", (r) => /\bque eu te (mostro|ensino|conto|explico)( como| tudo)?$/.test(fim(r))],
  ["fecho \"porque eu te mostro / porque aqui...\" (razão depois da ação)", has(/\bsegue\b.{0,30}\b(porque|pois|que) (eu|aqui)\b/)],
  ["\"o meu perfil\" sem promessa (só nome + ação)", (r) => !/\b(mostro|revelo|trago|analiso|ensino|explico|conto|entender|saber|conhecer|aprender|receber|acompanhar)\b/.test(txt(r)) && /\bsegu/.test(txt(r))],
  ["bloco com 1 frase", (r) => frases(raw(r)).length === 1],
  ["bloco com 2 frases", (r) => frases(raw(r)).length === 2],
  ["bloco com 3+ frases", (r) => frases(raw(r)).length >= 3],
];
const os = C.map(([n, p]) => medir(n, (r) => !!raw(r) && p(r)));
const md = `# Formas do comando (texto: ${k === "ft" ? "transcrição" : "escrito"})\n\n${cabSeg}\n${os.map(linhaSeg).join("\n")}\n\n${cabOutros}\n${os.map(linhaOutros).join("\n")}\n`;
writeFileSync(OUT + `comando/formas_${k}.md`, md);
console.log(md);
