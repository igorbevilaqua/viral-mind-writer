// Amostra pequena e direcionada de comandos falados x bloco final escrito.
// uso: node src/comando/amostra.mjs [n] [plataforma] [seed]
import { carregar } from "../lib.mjs";
const L = carregar();
const [n = 12, plat = "Instagram", seed = 7] = process.argv.slice(2);
let s = Number(seed);
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const R = L.filter((r) => r.plataforma === plat && r.comando_video && r.g?.bloco_final);
for (let i = 0; i < Number(n); i++) {
  const r = R[Math.floor(rnd() * R.length)];
  console.log(`\n[${r.cliente} | ${r.plataforma} | p_seg=${r.p_seg ?? "-"} | coef=${r.coef}]`);
  console.log("  FALADO :", r.comando_video.slice(0, 400));
  console.log("  ESCRITO:", r.g.bloco_final.replace(/\n/g, " / ").slice(0, 400));
  if (r.g.apresentacao) console.log("  APRES  :", r.g.apresentacao.slice(0, 200));
}
