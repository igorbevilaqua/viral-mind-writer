// Calibra o juiz de teto (plano 024, 1.3) nos pares cegos do estudo de outubro: vencedor e
// perdedor do mesmo cliente, rede e território, com o desfecho real como gabarito.
// Linha de base: leitores LLM acertaram 62% [55% a 68%]. Juiz abaixo disso não decide nada.
//
//   npx tsx --env-file=.env.local scripts/juiz-calibrar.ts [--modelo claude-sonnet-5-5] [--n 60]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { julgarPar, type Julgamento } from "../lib/pipeline/juiz";

const arg = (nome: string) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const MODELO = arg("modelo") ?? "claude-sonnet-5-5";
const N = Number(arg("n") ?? Infinity);
const DIR = "docs/estudo-2026-10/dados";

interface Lado { titulo?: string; hook?: string; subhook?: string; sub2?: string; conclusao2?: string; conclusao?: string; comando?: string; palavras?: number }
interface Par { par_id: string; cliente: string; plataforma: string; A: Lado; B: Lado }

// O estudo guardou o roteiro em partes, não inteiro: o juiz lê as mesmas partes que os leitores leram.
const texto = (l: Lado) =>
  [
    l.titulo && `TÍTULO NA TELA: ${l.titulo}`,
    `HOOK: ${l.hook ?? ""}`,
    `ABERTURA DO CORPO: ${[l.subhook, l.sub2].filter(Boolean).join(" ")}`,
    "[...meio do roteiro omitido...]",
    `FECHO: ${[l.conclusao2, l.conclusao].filter(Boolean).join(" ")}`,
    l.comando && `CTA: ${l.comando}`,
    l.palavras && `(roteiro inteiro: ${l.palavras} palavras)`,
  ]
    .filter(Boolean)
    .join("\n");

function wilson(k: number, n: number): [number, number] {
  if (!n) return [0, 0];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(c - m) / d, (c + m) / d];
}

async function emLotes<T, R>(xs: T[], n: number, f: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < xs.length; i += n) out.push(...(await Promise.all(xs.slice(i, i + n).map(f))));
  return out;
}

void (async () => {
  const gab = JSON.parse(readFileSync(`${DIR}/gabarito_pares.json`, "utf8")) as Record<string, "A" | "B">;
  const excluir = new Set(JSON.parse(readFileSync(`${DIR}/cego/excluir.json`, "utf8")) as string[]);
  const pares = [1, 2, 3]
    .flatMap((i) => JSON.parse(readFileSync(`${DIR}/cego/lote${i}.json`, "utf8")) as Par[])
    .filter((p) => !excluir.has(p.par_id) && gab[p.par_id])
    .slice(0, N);

  const res = await emLotes(pares, 8, async (p) => {
    try {
      return { par: p, j: await julgarPar(texto(p.A), texto(p.B), MODELO) };
    } catch (e) {
      console.error(p.par_id, e instanceof Error ? e.message : e);
      return { par: p, j: { vencedor: "empate", confianca: 0, motivos: [] } as Julgamento };
    }
  });

  const decididos = res.filter((r) => r.j.vencedor !== "empate");
  const acertos = decididos.filter((r) => r.j.vencedor === gab[r.par.par_id]).length;
  const [lo, hi] = wilson(acertos, decididos.length);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  console.log(`modelo ${MODELO} | pares ${res.length} | decididos ${decididos.length} (${pct(decididos.length / res.length)})`);
  console.log(`acerto nos decididos: ${pct(acertos / decididos.length)} [${pct(lo)} a ${pct(hi)}]  (linha de base dos leitores: 62%)`);
  for (const c of [1, 2, 3]) {
    const rs = decididos.filter((r) => r.j.confianca === c);
    if (rs.length) console.log(`  confiança ${c}: ${pct(rs.filter((r) => r.j.vencedor === gab[r.par.par_id]).length / rs.length)} n=${rs.length}`);
  }
  // Empate conta como meio acerto: é a taxa que o banco de prova vai ver de verdade.
  console.log(`acerto contando empate como 1/2: ${pct((acertos + (res.length - decididos.length) / 2) / res.length)}`);

  mkdirSync("docs/escrita-2026-10/bancada", { recursive: true });
  writeFileSync(
    `docs/escrita-2026-10/bancada/calibracao-${MODELO}.json`,
    JSON.stringify(res.map((r) => ({ par: r.par.par_id, gabarito: gab[r.par.par_id], ...r.j })), null, 1)
  );
})();
