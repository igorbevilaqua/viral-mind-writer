// Embeddings dos roteiros: carga, truncagem Matryoshka, similaridade. Tudo em Float32Array.
import { readFileSync } from "node:fs";
import { DATA, ler, carregar } from "../lib.mjs";

export const IDS = ler("emb_ids.json");
export const N = IDS.length;
export const POS = new Map(IDS.map((id, i) => [id, i]));
const buf = readFileSync(DATA + "emb.f32");
export const E3072 = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));

// Primeiras d dimensões, renormalizadas (Matryoshka).
export function truncar(E, D, d) {
  const n = E.length / D, out = new Float32Array(n * d);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = 0; k < d; k++) { const x = E[i * D + k]; out[i * d + k] = x; s += x * x; }
    const inv = 1 / Math.sqrt(s);
    for (let k = 0; k < d; k++) out[i * d + k] *= inv;
  }
  return out;
}

export function dot(A, ia, B, ib, d) {
  let s = 0;
  const a = ia * d, b = ib * d;
  for (let k = 0; k < d; k++) s += A[a + k] * B[b + k];
  return s;
}

// Matriz cheia N x N (31 MB em float32). ponytail: O(N²·d), uns segundos para N=2.809; indexar se N passar de ~20 mil.
export function matrizSim(E, d) {
  const S = new Float32Array(N * N);
  for (let i = 0; i < N; i++) {
    S[i * N + i] = 1;
    for (let j = i + 1; j < N; j++) { const v = dot(E, i, E, j, d); S[i * N + j] = v; S[j * N + i] = v; }
  }
  return S;
}

// RNG reproduzível (mulberry32).
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const dias = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

// Info por roteiro (índice do embedding): cliente, data de postagem, pq médio nas redes analisáveis.
export function infoRoteiros(L = carregar()) {
  const scripts = new Map(ler("scripts.json").map((s) => [s.script_id, s]));
  const pqs = new Map();
  for (const r of L) if (["Instagram", "TikTok", "YouTube"].includes(r.plataforma)) (pqs.get(r.script_id) ?? pqs.set(r.script_id, []).get(r.script_id)).push(r.pq);
  return IDS.map((id, i) => {
    const s = scripts.get(id), p = pqs.get(id);
    return { i, id, cliente: s.cliente, data: s.postado, titulo: s.titulo, modelagem: !!s.modelagem, pqMedio: p ? p.reduce((x, y) => x + y, 0) / p.length : null, nVideos: p?.length ?? 0 };
  });
}

if (process.argv[1]?.endsWith("base.mjs")) {
  let mx = 0;
  for (let i = 0; i < N; i += 97) mx = Math.max(mx, Math.abs(dot(E3072, i, E3072, i, 3072) - 1));
  console.assert(mx < 1e-3, "embeddings deveriam vir normalizados");
  const T = truncar(E3072, 3072, 768);
  console.assert(Math.abs(dot(T, 5, T, 5, 768) - 1) < 1e-5, "truncar renormaliza");
  console.log("ok", N, "roteiros | desvio máx da norma 3072:", mx.toExponential(1));
}
