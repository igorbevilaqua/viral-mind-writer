// Tarefa 1: truncar para 768 dimensões preserva os 10 vizinhos mais próximos?
import { E3072, N, truncar, dot, rng } from "./base.mjs";

const K = 10, AMOSTRA = 200;
const r = rng(42);
const alvo = new Set();
while (alvo.size < AMOSTRA) alvo.add(Math.floor(r() * N));

function vizinhos(E, d, i) {
  const sims = new Float32Array(N);
  for (let j = 0; j < N; j++) sims[j] = j === i ? -9 : dot(E, i, E, j, d);
  return [...sims.keys()].sort((a, b) => sims[b] - sims[a]).slice(0, K);
}

const ref = new Map([...alvo].map((i) => [i, new Set(vizinhos(E3072, 3072, i))]));
for (const d of [256, 512, 768, 1536]) {
  const T = truncar(E3072, 3072, d);
  let soma = 0, min = 1;
  for (const i of alvo) {
    const ov = vizinhos(T, d, i).filter((j) => ref.get(i).has(j)).length / K;
    soma += ov; min = Math.min(min, ov);
  }
  console.log(`d=${d}: sobreposição média dos 10 vizinhos com a versão 3072 = ${(100 * soma / AMOSTRA).toFixed(1)}% (pior roteiro ${(100 * min).toFixed(0)}%)`);
}
