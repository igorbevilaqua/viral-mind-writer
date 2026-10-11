// Tarefa 2a: k-means esférico (k-means++), k=30 e k=60, várias sementes, fica a de maior coesão.
// Grava out/embeddings/kmeans.json e imprime os 8 títulos mais próximos de cada centróide (para nomear à mão).
import { writeFileSync } from "node:fs";
import { OUT } from "../lib.mjs";
import { E3072, N, truncar, dot, rng, infoRoteiros } from "./base.mjs";

const D = 768, SEMENTES = [1, 2, 3, 4, 5, 6], MAX_IT = 100;
const E = truncar(E3072, 3072, D);

function kmeans(k, seed) {
  const r = rng(seed), C = new Float32Array(k * D);
  // k-means++ com distância de cosseno
  const melhor = new Float32Array(N).fill(-2);
  let c0 = Math.floor(r() * N);
  for (let c = 0; c < k; c++) {
    C.set(E.subarray(c0 * D, c0 * D + D), c * D);
    let tot = 0;
    const w = new Float64Array(N);
    for (let i = 0; i < N; i++) { const s = dot(E, i, C, c, D); if (s > melhor[i]) melhor[i] = s; w[i] = (1 - melhor[i]) ** 2; tot += w[i]; }
    let alvo = r() * tot;
    c0 = 0;
    while (c0 < N - 1 && (alvo -= w[c0]) > 0) c0++;
  }
  const a = new Int32Array(N).fill(-1), sim = new Float32Array(N);
  for (let it = 0; it < MAX_IT; it++) {
    let mudou = 0;
    for (let i = 0; i < N; i++) {
      let b = -1, bs = -2;
      for (let c = 0; c < k; c++) { const s = dot(E, i, C, c, D); if (s > bs) { bs = s; b = c; } }
      if (b !== a[i]) { a[i] = b; mudou++; }
      sim[i] = bs;
    }
    C.fill(0);
    const cont = new Int32Array(k);
    for (let i = 0; i < N; i++) { cont[a[i]]++; for (let t = 0; t < D; t++) C[a[i] * D + t] += E[i * D + t]; }
    for (let c = 0; c < k; c++) {
      if (!cont[c]) { // cluster vazio: renasce no ponto pior encaixado
        let p = 0; for (let i = 1; i < N; i++) if (sim[i] < sim[p]) p = i;
        C.set(E.subarray(p * D, p * D + D), c * D); sim[p] = 1; mudou++; continue;
      }
      let s = 0; for (let t = 0; t < D; t++) s += C[c * D + t] ** 2;
      const inv = 1 / Math.sqrt(s); for (let t = 0; t < D; t++) C[c * D + t] *= inv;
    }
    if (!mudou) break;
  }
  for (let i = 0; i < N; i++) sim[i] = dot(E, i, C, a[i], D);
  const coesao = sim.reduce((x, y) => x + y, 0) / N;
  return { k, seed, coesao, a: [...a], sim: [...sim].map((x) => +x.toFixed(4)) };
}

const info = infoRoteiros();
const saida = {};
for (const k of [30, 60]) {
  let best = null;
  for (const s of SEMENTES) {
    const m = kmeans(k, s);
    console.log(`k=${k} semente=${s} coesão=${m.coesao.toFixed(4)}`);
    if (!best || m.coesao > best.coesao) best = m;
  }
  saida[k] = best;
  console.log(`\n=== k=${k}: semente ${best.seed}, coesão ${best.coesao.toFixed(4)} ===`);
  for (let c = 0; c < k; c++) {
    const membros = info.filter((x) => best.a[x.i] === c).sort((x, y) => best.sim[y.i] - best.sim[x.i]);
    const cli = {}; for (const m of membros) cli[m.cliente] = (cli[m.cliente] ?? 0) + 1;
    const top = Object.entries(cli).sort((x, y) => y[1] - x[1]);
    console.log(`\n[${k}:${c}] n=${membros.length} clientes=${top.length} | ${top.slice(0, 3).map(([n, v]) => `${n} ${v}`).join(", ")}`);
    for (const m of membros.slice(0, 8)) console.log(`  - ${m.titulo}`);
  }
}
writeFileSync(OUT + "embeddings/kmeans.json", JSON.stringify({ d: D, k30: saida[30], k60: saida[60] }));
