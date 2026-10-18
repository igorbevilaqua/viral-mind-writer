// Concordância entre dois arquivos de rótulos (gabarito x rotulador): acerto e kappa de Cohen por campo.
// uso: node src/modos/concordancia.mjs <gabarito.jsonl> <outro.jsonl>
import { readFileSync } from "node:fs";
const ler = (f) => new Map(readFileSync(f, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l)).map((r) => [r.script_id, r]));
// os casos de calibragem do livro de códigos dão a resposta: ficam fora da conta
const CALIB = new Set(["2ed33cc8-ead5-4e26-b749-1043ec59ce4f","214cedde-3dad-45cb-88a7-e68c3c586949","87d8ba56-4748-47c7-87e8-2a7b4c9948c4","3a9c1214-0274-4b5a-842a-68611f79775b","4aa6f836-6c99-4153-828a-073a1609d1f7","e9003adc-97c8-4eb0-b7cb-8f777a619053","986a8088-d82b-41f7-9272-a43d831d2257","092331ef-b08e-401c-9809-a9bbbb516f5b","f89ce13b-78f4-4ede-876c-8e1482cf65c6","9edda80d-1075-42a1-9f0d-7360e2ab6b4c","9f4e35fd-55d5-4544-a1da-9f780d97b7cb","1bdc37a4-1fab-4c82-b5b8-ea2414f085ca"]);
export function kappa(pares) {
  const n = pares.length, cats = [...new Set(pares.flat())];
  const po = pares.filter(([a, b]) => a === b).length / n;
  const pe = cats.reduce((s, c) => s + (pares.filter(([a]) => a === c).length / n) * (pares.filter(([, b]) => b === c).length / n), 0);
  return { po, k: pe === 1 ? 1 : (po - pe) / (1 - pe), n };
}
if (process.argv[1].endsWith("concordancia.mjs") && process.argv[2]) {
  const A = ler(process.argv[2]), B = ler(process.argv[3]);
  const ids = [...A.keys()].filter((id) => B.has(id) && !CALIB.has(id));
  console.log(`comparáveis: ${ids.length} (faltam no segundo: ${[...A.keys()].filter((id) => !B.has(id)).length})`);
  for (const campo of ["modo", "ancora", "registro"]) {
    const { po, k } = kappa(ids.map((id) => [A.get(id)[campo], B.get(id)[campo]]));
    console.log(`${campo}: acordo ${(po * 100).toFixed(0)}% | kappa ${k.toFixed(2)}`);
  }
  const conf = {};
  for (const id of ids) { const a = A.get(id).modo, b = B.get(id).modo; if (a !== b) conf[`${a} -> ${b}`] = (conf[`${a} -> ${b}`] ?? 0) + 1; }
  console.log("trocas de modo (gabarito -> outro):", Object.entries(conf).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}: ${v}`).join(" | "));
  const alta = ids.filter((id) => A.get(id).confianca === "alta");
  console.log(`modo nos casos de confiança alta do gabarito: ${(kappa(alta.map((id) => [A.get(id).modo, B.get(id).modo])).po * 100).toFixed(0)}% (n=${alta.length})`);
} else {
  // self-check
  console.assert(kappa([["a","a"],["b","b"]]).k === 1, "kappa perfeito");
  console.assert(Math.abs(kappa([["a","a"],["a","b"],["b","a"],["b","b"]]).k) < 1e-9, "kappa acaso");
  console.log("ok");
}
