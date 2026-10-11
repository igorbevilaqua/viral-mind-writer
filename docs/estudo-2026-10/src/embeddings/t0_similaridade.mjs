// Calibra a similaridade: distribuição do cosseno dentro e entre clientes (limiares 0,80 e 0,76) e validação
// contra o CRM: o cosseno cru acerta mais personagem/tópico em comum que o cosseno com a média do cliente descontada.
import { E3072, N, IDS, truncar, matrizSim, infoRoteiros } from "./base.mjs";
import { ler } from "../lib.mjs";
const D = 768;
const sc = new Map(ler("scripts.json").map(s => [s.script_id, s]));
const pers = IDS.map(id => new Set((sc.get(id).personagens ?? []).map(x => x.toLowerCase())));
const top = IDS.map(id => new Set((sc.get(id).topicos ?? []).map(x => x.toLowerCase())));
console.log("com personagens:", pers.filter(s => s.size).length, "com topicos:", top.filter(s => s.size).length);
const info = infoRoteiros();
function centrar(E, alfa) {
  const mu = {}, cnt = {};
  for (let i = 0; i < N; i++) { const c = info[i].cliente; mu[c] ??= new Float64Array(D); cnt[c] = (cnt[c] ?? 0) + 1; for (let k = 0; k < D; k++) mu[c][k] += E[i*D+k]; }
  const C = new Float32Array(N*D);
  for (let i = 0; i < N; i++) { const c = info[i].cliente; let s = 0; for (let k = 0; k < D; k++) { const v = E[i*D+k] - alfa*mu[c][k]/cnt[c]; C[i*D+k] = v; s += v*v; } const inv = 1/Math.sqrt(s); for (let k = 0; k < D; k++) C[i*D+k] *= inv; }
  return C;
}
const E = truncar(E3072, 3072, D);
const inter = (a, b) => { for (const x of a) if (b.has(x)) return true; return false; };
for (const alfa of [0, 0.5, 0.8, 1]) {
  const S = matrizSim(alfa ? centrar(E, alfa) : E, D);
  for (const modo of ["dentro", "entre"]) {
    const v = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if ((info[i].cliente === info[j].cliente) === (modo === "dentro")) v.push(S[i*N+j]);
    const s = Float32Array.from(v).sort();
    const res = [];
    for (const p of [0.5, 0.97, 0.995]) {
      const t = s[Math.floor(p*(s.length-1))];
      let n = 0, kp = 0, kt = 0, np = 0;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if ((info[i].cliente === info[j].cliente) === (modo === "dentro") && S[i*N+j] >= t && (p < 0.9 ? S[i*N+j] < s[Math.floor(0.55*(s.length-1))] : true)) {
        n++; if (pers[i].size && pers[j].size) { np++; kp += inter(pers[i], pers[j]); } kt += inter(top[i], top[j]);
      }
      res.push(`>=p${p*100}: n=${n} personagem comum ${(100*kp/np).toFixed(1)}% tópico comum ${(100*kt/n).toFixed(1)}%`);
    }
    console.log(`alfa=${alfa} ${modo}: ${res.join(" | ")}`);
  }
}

// limiares usados no resto: p97 dos pares dentro do cliente e p99,5 dos pares entre clientes (cosseno cru)
const S0 = matrizSim(E, D);
for (const modo of ["dentro", "entre"]) {
  const v = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if ((info[i].cliente === info[j].cliente) === (modo === "dentro")) v.push(S0[i * N + j]);
  const s = Float32Array.from(v).sort(), q = (p) => s[Math.floor(p * (s.length - 1))].toFixed(3);
  console.log(`cosseno cru ${modo} do cliente: p50 ${q(0.5)} | p97 ${q(0.97)} | p99,5 ${q(0.995)}`);
}
