// Prevalência de cada característica: falado LLM (ff) x transcrição (ft) x escrito (fe). Validação da extração.
import { L } from "./feat.mjs";
const pc = (x) => `${Math.round(x * 100)}%`;
const R = L.filter((r) => !r.fe.vazio);
console.log(`base: ${R.length} vídeos com bloco escrito | transcrição sem bloco detectado: ${pc(R.filter((r) => r.ft.vazio).length / R.length)} | comando_video vazio: ${pc(R.filter((r) => r.ff.vazio).length / R.length)}`);
const ks = ["cond", "prom", "prom_esp", "cond_prom_esp", "mais_como_esse", "exclusiv", "freq", "urg", "nao_perder", "apres", "credencial", "generico", "pergunta", "v_comenta", "v_compart", "engaj", "o_historias", "o_estrategias", "o_beneficio_pessoal"];
console.log("caract | LLM | transcrição | escrito | transc&escrito | só transc | só escrito");
for (const k of ks) {
  const n = R.length, f = R.filter((r) => r.ff[k]).length, t = R.filter((r) => r.ft[k]).length, e = R.filter((r) => r.fe[k]).length, te = R.filter((r) => r.ft[k] && r.fe[k]).length;
  console.log(`${k} | ${pc(f / n)} | ${pc(t / n)} | ${pc(e / n)} | ${pc(te / n)} | ${pc((t - te) / n)} | ${pc((e - te) / n)}`);
}
for (const p of ["Instagram", "TikTok", "YouTube"]) {
  const S = R.filter((r) => r.plataforma === p);
  console.log(p, `apres: LLM ${pc(S.filter((r) => r.ff.apres).length / S.length)} transc ${pc(S.filter((r) => r.ft.apres).length / S.length)} escrito ${pc(S.filter((r) => r.fe.apres).length / S.length)} | genérico LLM ${pc(S.filter((r) => r.ff.generico).length / S.length)} transc ${pc(S.filter((r) => r.ft.generico).length / S.length)}`);
}
const fx = {};
for (const r of R) fx[r.ft.faixa] = (fx[r.ft.faixa] ?? 0) + 1;
console.log("faixa transcrição:", JSON.stringify(fx));
// amostra para conferir a olho
let s = Number(process.argv[2] ?? 5);
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < Number(process.argv[3] ?? 6); i++) {
  const r = R[Math.floor(rnd() * R.length)];
  console.log(`\n[${r.cliente} | ${r.plataforma}]\n  TX : ${r.falado_tx.slice(0, 330)}\n  LLM: ${(r.comando_video ?? "").slice(0, 200)}`);
}
