// Gera a versão cega dos pares (A/B em ordem aleatória, sem desfecho) em lotes para os leitores,
// e guarda o gabarito à parte. Uso: node src/cego/cegar.mjs <n_lotes>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const pares = JSON.parse(readFileSync("data/pares.json", "utf8"));
const nLotes = Number(process.argv[2] ?? 3);
mkdirSync("data/cego", { recursive: true });
// semente fixa: o sorteio de A/B é reproduzível
let seed = 20261007;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const lado = (x) => ({ titulo: x.titulo, hook: x.hook, subhook: x.subhook, sub2: x.sub2, conclusao2: x.conclusao2, conclusao: x.conclusao, comando: x.comando_video || x.bloco_final, palavras: x.palavras_total, duracao_s: x.duracao ? Math.round(x.duracao) : null });
const gabarito = {};
const cegos = pares.map((p) => {
  const vencedorEhA = rnd() < 0.5;
  gabarito[p.par_id] = vencedorEhA ? "A" : "B";
  return { par_id: p.par_id, cliente: p.cliente, plataforma: p.plataforma, A: lado(vencedorEhA ? p.vencedor : p.perdedor), B: lado(vencedorEhA ? p.perdedor : p.vencedor) };
});
// embaralha e distribui em lotes equilibrados por cliente
cegos.sort(() => rnd() - 0.5);
const lotes = Array.from({ length: nLotes }, () => []);
cegos.forEach((c, i) => lotes[i % nLotes].push(c));
lotes.forEach((l, i) => writeFileSync(`data/cego/lote${i + 1}.json`, JSON.stringify(l, null, 1)));
writeFileSync("data/gabarito_pares.json", JSON.stringify(gabarito));
console.log("pares:", cegos.length, "| lotes:", lotes.map((l) => l.length).join(", "), "| A vence em", Object.values(gabarito).filter((x) => x === "A").length);
