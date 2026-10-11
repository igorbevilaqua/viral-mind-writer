import { carregar } from "./lib.mjs";
import { placar } from "./hooks/placar.mjs";
const L = carregar().filter((r) => ["Instagram", "TikTok", "YouTube"].includes(r.plataforma) && r.g?.hook);
const bins = [["-2 ou menos", (p) => p <= -2], ["-1", (p) => p === -1], ["0", (p) => p === 0], ["+1", (p) => p === 1], ["+2", (p) => p === 2], ["+3 ou mais", (p) => p >= 3]];
console.log(JSON.stringify(bins.map(([b, f]) => { const s = L.filter((r) => f(placar(r.g.hook))); return { placar: b, videos: s.length, acertos: s.filter((r) => r.acerto).length }; })));
console.log(JSON.stringify({ videos: L.length, acertos: L.filter((r) => r.acerto).length }));
