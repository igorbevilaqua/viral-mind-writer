// 2. RITMO E DISPOSITIVOS DE RETENÇÃO no corpo. Presença e densidade, contra coef (com e sem controle de tamanho),
// acerto e ret_final (IG). Saída: tabela compacta + JSON.
import { carregar, avaliar, porGrupo, fmt, salvar, resumo, linhasCtl, exemplos } from "./h.mjs";
import { f } from "./feat.mjs";
const L = carregar();
const c = (re) => (r) => re.test(f(r).corpo_sem);

export const DISPOSITIVOS = [
  // frases-ponte faladas
  ["ponte: 'olha isso/olha só'", c(/\bolha (isso|so|que|esse|essa|o que)\b/)],
  ["ponte: 'entenda'", c(/\bentenda\b/)],
  ["ponte: 'funciona assim'", c(/\bfunciona assim\b/)],
  ["ponte: 'ou seja'", c(/\bou seja\b/)],
  ["ponte: 'pensa comigo/pensa bem'", c(/\bpens(a|e) (comigo|bem|nisso)\b/)],
  ["ponte: 'imagina'", c(/\bimagin(a|e)\b/)],
  ["ponte: 'e o pior / o pior é que'", c(/\b(e o pior|o pior e que|o pior:|e o mais grave)\b/)],
  ["ponte: 'só que'", c(/\bso que\b/)],
  ["ponte: 'até que'", c(/\bate que\b/)],
  ["ponte: 'foi aí que / foi quando'", c(/\bfoi (ai|entao|quando) que\b|\bfoi quando\b/)],
  ["ponte: 'e é aqui que / é aí que'", c(/\be (aqui|ai|nesse ponto|nessa hora) que\b/)],
  ["ponte: 'o detalhe é que'", c(/\b(o detalhe e que|detalhe:|o detalhe:)/)],
  ["ponte: 'repara / percebe'", c(/\b(repara|percebe|perceba)\b/)],
  ["ponte: 'pra você ter ideia'", c(/\b(so )?(pra|para) (voce|vc) ter (uma )?(ideia|nocao)\b/)],
  ["ponte: 'na prática'", c(/\bna pratica\b/)],
  ["ponte: 'isso significa / quer dizer'", c(/\bisso (significa|quer dizer)\b/)],
  ["ponte: 'sabe o que / sabe por quê'", c(/\bsabe (o que|por que|porque|qual)\b/)],
  // loops abertos e escalada
  ["loop: 'e tem mais / não para por aí / não é só isso'", c(/\b(e tem mais|nao para por ai|nao e so isso|isso nao e (o mais|tudo)|mas nao para|e nao e so)\b/)],
  ["loop: 'o mais impressionante/curioso/louco'", c(/\bo mais (impressionante|curioso|louco|surpreendente|interessante|incrivel|absurdo|bizarro|chocante)\b/)],
  ["loop: 'o que ninguém/pouca gente sabe'", c(/\bo que (ninguem|pouca gente|poucos)\b/)],
  ["loop: 'no final / até o fim'", c(/\b(no final|ate o final|ate o fim)\b/)],
  // cronologia
  ["crono: nenhum ano citado", (r) => f(r).anos === 0],
  ["crono: 1 ano citado", (r) => f(r).anos === 1],
  ["crono: 2-3 anos citados", (r) => f(r).anos >= 2 && f(r).anos <= 3],
  ["crono: 4+ anos citados", (r) => f(r).anos >= 4],
  ["crono: 'anos/meses depois'", c(/\b(anos|meses|dias|decadas|semanas) depois\b/)],
  ["crono: 'tudo começou'", c(/\btudo comec/)],
  ["crono: 'hoje' no corpo", c(/\bhoje\b/)],
  // densidades
  ["viradas (mas/só que/porém) >=1,1 por 100", (r) => f(r).viradas100 >= 1.1],
  ["viradas <=0,4 por 100", (r) => f(r).viradas100 <= 0.4],
  ["'então/por isso/com isso' >=0,5 por 100", (r) => f(r).portanto100 >= 0.5],
  ["'então/por isso' ausente", (r) => f(r).portanto100 === 0],
  ["números >=3,6 por 100", (r) => f(r).numeros100 >= 3.6],
  ["números <=1,2 por 100", (r) => f(r).numeros100 <= 1.2],
  ["nomes próprios >=6,8 por 100", (r) => f(r).nomes100 >= 6.8],
  ["nomes próprios <=3,1 por 100", (r) => f(r).nomes100 <= 3.1],
  ["'você' >=0,6 por 100 no corpo", (r) => f(r).voce100 >= 0.6],
  ["'você' ausente no corpo", (r) => f(r).voce100 === 0],
  ["1ª pessoa (eu/me/meu) no corpo", (r) => f(r).eu100 > 0],
  ["pergunta no corpo (1+)", (r) => f(r).perguntas_corpo >= 1],
  ["citação entre aspas no corpo", (r) => f(r).aspas >= 1],
  ["lista 'primeiro... terceiro'", c(/\bprimeir[oa]\b[\s\S]*\bterceir[oa]\b|\bem primeiro lugar\b/)],
  // ritmo de frase e parágrafo
  ["frase média <=15,5 palavras", (r) => f(r).frase_media <= 15.5],
  ["frase média >=20 palavras", (r) => f(r).frase_media >= 20],
  ["frases curtas (<=6) >=13%", (r) => f(r).frac_curtas >= 0.13],
  ["nenhuma frase curta (<=6)", (r) => f(r).frac_curtas === 0],
  ["parágrafos abrindo com conectivo >=44%", (r) => f(r).frac_para_conectivo >= 0.44],
  ["parágrafos abrindo com conectivo <=23%", (r) => f(r).frac_para_conectivo <= 0.23],
  ["parágrafos abrindo com 'Mas/Só que' >=14%", (r) => f(r).frac_para_mas >= 0.14],
];

const cel = (x) => (x ? `${fmt.f2(x.lift)}` : "-");
function linha(nome, pred) {
  const a = avaliar(nome, pred);
  const k = avaliar(nome, pred, { linhas: linhasCtl() });
  const ac = avaliar(nome, pred, { desfecho: "acerto" });
  const rf = avaliar(nome, pred, { desfecho: "ret_final", plats: ["Instagram"], linhas: linhasCtl() });
  const t = a.todas;
  const txt = `| ${nome} | ${t.n} / ${t.roteiros} | ${fmt.pct(t.p)} vs ${fmt.pct(t.p_sem)} | ${fmt.f2(t.lift)} [${fmt.f2(t.lb)}-${fmt.f2(t.ub)}] | ${fmt.f2(a.mh.or)} | ${fmt.f2(k.mh.or)} [${fmt.f2(k.mh.lo)}-${fmt.f2(k.mh.hi)}] | ${fmt.f2(a.descoberta?.lift)}/${fmt.f2(a.validacao?.lift)} | ${cel(a.Instagram)} ${cel(a.TikTok)} ${cel(a.YouTube)} | ${fmt.f2(ac.todas.lift)} | ${fmt.f2(rf.todas?.lift)} OR ${fmt.f2(rf.mh.or)} (n=${rf.todas?.n}) | ${a.leitura} / ctl: ${k.leitura} |`;
  return { txt, json: { coef: resumo(a), coef_ctl: resumo(k), acerto: resumo(ac), ret_final_ctl: resumo(rf, ["Instagram"]) } };
}
export const CAB = "| característica | vídeos / roteiros | % topo com vs sem | lift [IC] | OR MH | OR MH ctl tamanho [IC] | lift desc/val | IG TT YT | lift acerto | ret_final IG (ctl tam) | leitura / ctl |\n|---|---|---|---|---|---|---|---|---|---|---|";

if (process.argv[1]?.endsWith("ritmo.mjs")) {
  const out = {};
  console.log(CAB);
  for (const [n, p] of DISPOSITIVOS) { const l = linha(n, p); console.log(l.txt); out[n] = l.json; }
  salvar("ritmo.json", out);
}
export { linha };
