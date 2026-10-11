import { carregar, avaliar, tabela, norm } from "./lib.mjs";
const L = carregar();
const t = (r) => norm(r.g?.subhook);
const A = [
  avaliar("roteiro modelado (fontes cita modelagem)", (r) => r.s?.modelagem),
  avaliar("hook escrito <= 15 palavras", (r) => r.g?.palavras_hook <= 15),
  avaliar("hook escrito >= 30 palavras", (r) => r.g?.palavras_hook >= 30),
  avaliar("roteiro < 300 palavras", (r) => r.g?.palavras_total < 300),
  avaliar("roteiro >= 450 palavras", (r) => r.g?.palavras_total >= 450),
  avaliar("vídeo < 75s", (r) => r.duracao != null && r.duracao < 75),
  avaliar("vídeo >= 120s", (r) => r.duracao != null && r.duracao >= 120),
  avaliar("subhook abre com 'só que' ou 'mas'", (r) => /^(so que|mas)\b/.test(t(r))),
  avaliar("subhook abre com 'e '", (r) => /^e\b/.test(t(r))),
  avaliar("comando falado com 'nao perder'", (r) => /nao perder/.test(norm(r.comando_video))),
  avaliar("bloco final com apresentação 'eu sou'", (r) => !!r.g?.apresentacao),
  avaliar("hook com 'voce'", (r) => /\bvoce\b/.test(norm(r.g?.hook))),
  avaliar("hook com 'brasil' ou 'brasileir'", (r) => /brasil/.test(norm(r.g?.hook))),
  avaliar("hook com 'china'", (r) => /china|chines/.test(norm(r.g?.hook))),
];
console.log(tabela(A));
for (const d of ["ret_hook","ret_sub","ret_final","seguidores","compart"]) {
  const a = avaliar("vídeo >= 120s", (r) => r.duracao >= 120, { desfecho: d, plats: ["Instagram"] });
  console.log(d, JSON.stringify({ n: a.todas?.n, lift: a.todas?.lift?.toFixed(2), lb: a.todas?.lb?.toFixed(2), ub: a.todas?.ub?.toFixed(2) }));
}
