// Recalcula os achados principais na régua oficial de acerto (classificacao do Oráculo:
// coef > 3 e 10 mil views ou mais), que é a "taxa de acerto" acompanhada no Cockpit.
import { carregar, lift, mantelHaenszel, norm, fmt } from "./lib.mjs";
import { placar } from "./hooks/placar.mjs";
const L = carregar().filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma));
const yCasa = (r) => (r.acerto ? 1 : 0);
const base = L.reduce((s, r) => s + yCasa(r), 0) / L.length;
console.log(`base: taxa de acerto oficial ${fmt.pct(base)} em ${L.length} vídeos (IG ${fmt.pct(L.filter(r=>r.plataforma==="Instagram").reduce((s,r)=>s+yCasa(r),0)/L.filter(r=>r.plataforma==="Instagram").length)}, TT ${fmt.pct(L.filter(r=>r.plataforma==="TikTok").reduce((s,r)=>s+yCasa(r),0)/L.filter(r=>r.plataforma==="TikTok").length)}, YT ${fmt.pct(L.filter(r=>r.plataforma==="YouTube").reduce((s,r)=>s+yCasa(r),0)/L.filter(r=>r.plataforma==="YouTube").length)})`);
// placar do hook
const bins = [["-2 ou menos", (p) => p <= -2], ["-1", (p) => p === -1], ["0", (p) => p === 0], ["+1", (p) => p === 1], ["+2", (p) => p === 2], ["+3 ou mais", (p) => p >= 3]];
console.log("\nplacar do hook | vídeos | % topo do cliente | % acerto oficial");
for (const [nome, f] of bins) {
  const sel = L.filter((r) => r.g?.hook && f(placar(r.g.hook)));
  const top = sel.filter((r) => r.pq >= 0.75).length / sel.length, ac = sel.reduce((s, r) => s + yCasa(r), 0) / sel.length;
  console.log(`${nome} | ${sel.length} | ${fmt.pct(top)} | ${fmt.pct(ac)}`);
}
const ORIGEM = /\b(nasceu em|que nasceu|cresceu em|trabalhava como|no inicio|desde (pequeno|cedo)|percebeu que|foi nesse momento|foi ai que|foi quando|foi entao que|tudo comecou)\b/g;
const feats = [
  ["placar do hook +2 ou mais", (r) => r.g?.hook && placar(r.g.hook) >= 2],
  ["placar do hook negativo", (r) => r.g?.hook && placar(r.g.hook) < 0],
  ["roteiro 450 a 500 palavras", (r) => r.g?.palavras_total >= 450 && r.g?.palavras_total < 500],
  ["roteiro com menos de 300 palavras", (r) => r.g?.palavras_total < 300],
  ["2+ marcadores de origem em ordem", (r) => (norm(r.g?.corpo).match(ORIGEM) ?? []).length >= 2],
  ["payoff disputa com lado", (r) => r.llm?.payoff === "disputa"],
  ["payoff superação", (r) => r.llm?.payoff === "superacao"],
  ["payoff vantagem prática", (r) => r.llm?.payoff === "vantagem"],
  ["território carro chinês", (r) => /carros chineses/i.test(r.cluster?.nome60 ?? "")],
  ["território fundador que vendeu", (r) => /fundadores que venderam/i.test(r.cluster?.nome60 ?? "")],
  ["subhook que puxa o espectador", (r) => r.llm?.funcao_subhook === "puxa_espectador"],
  ["modelado (Tecnologia e IA)", (r) => r.s?.modelagem && r.macro === "Tecnologia, IA e inovação"],
  ["conclusão com 'a lição'", (r) => /\ba licao\b/.test(norm(r.g?.conclusao))],
];
console.log("\ncaracterística | vídeos | % acerto oficial com | sem | OR MH [IC] (cliente x rede)");
for (const [nome, pred] of feats) {
  const sel = L.filter(pred), resto = L.filter((r) => !pred(r));
  const p1 = sel.reduce((s, r) => s + yCasa(r), 0) / sel.length, p0 = resto.reduce((s, r) => s + yCasa(r), 0) / resto.length;
  const mh = mantelHaenszel(L, pred, yCasa);
  console.log(`${nome} | ${sel.length} | ${fmt.pct(p1)} | ${fmt.pct(p0)} | ${fmt.f2(mh.or)} [${fmt.f2(mh.lo)} a ${fmt.f2(mh.hi)}]`);
}
