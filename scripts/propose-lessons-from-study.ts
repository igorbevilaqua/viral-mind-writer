// Plano 020, WP-I: transforma os achados por cliente do estudo (lift.json, gerado por
// scripts/study-lift.ts) em lições PROPOSTAS — vm_lessons(source_kind:'curador') +
// vm_lesson_learnings(active:false). Nunca ativa: a lição cai em `licoesPendentesDb` e o
// Kasparov oferece na conversa; ativar é decisão humana no /ensinar.
//
// Corte pré-registrado (relatório §7): lift_lb ≥ 1,2 e n ≥ 8, só em hook/estrutura/tema.
// A descrição carrega o número — o que separa "regra" de "achismo" é o dado que a sustenta.
//
// Rodar da raiz do projeto:
//   npx tsx --env-file=.env.local scripts/propose-lessons-from-study.ts --dry-run
//   npx tsx --env-file=.env.local scripts/propose-lessons-from-study.ts [--in docs/estudo-2026-09/lift.json]
import { readFileSync } from "node:fs";
import { appDb } from "../lib/db";
import { proporLicoes } from "../lib/curator";
import { ESTRUTURAS } from "../lib/pipeline/taxonomia";
import type { LiftResult } from "../lib/study-stats";
import type { Dimensao } from "../lib/pipeline/teach";

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const DRY_RUN = process.argv.includes("--dry-run");
const IN = arg("--in") ?? "docs/estudo-2026-09/lift.json";
const SOURCE_TITLE = "Estudo 2026-09 (plano 020)";
const MIN_LIFT_LB = 1.2;
const MIN_N = 8;

// comando fica fora: o plano só pede hook/estrutura/tema para lição por cliente.
const DIMENSAO_DA_DIM: Record<string, Dimensao> = { hook: "hook", estrutura: "storytelling", tema: "tema" };
const NOME_ESTR = new Map(ESTRUTURAS.map((e) => [e.code, `${e.code} ${e.nome}`]));
const nome = (dim: string, label: string) => (dim === "estrutura" ? NOME_ESTR.get(label) ?? label : label);
const f2 = (x: number) => x.toFixed(2).replace(".", ",");
const pct = (x: number) => `${Math.round(x * 100)}%`;

interface ClienteLift {
  cliente_id: string;
  nome: string;
  dims: Record<string, LiftResult[]>;
}

function licoesDoCliente(c: ClienteLift) {
  return Object.entries(c.dims).flatMap(([dim, rows]) => {
    const dimensao = DIMENSAO_DA_DIM[dim];
    if (!dimensao) return [];
    return rows
      .filter((r) => r.lift_lb >= MIN_LIFT_LB && r.n >= MIN_N)
      .map((r) => ({
        dimensao,
        titulo: `${nome(dim, r.label)} funciona para ${c.nome}`,
        descricao: `${nome(dim, r.label)}: ${pct(r.p)} dos vídeos no top quartil vs 25% da base (lift ${f2(r.lift)}, IC inferior ${f2(
          r.lift_lb
        )}, n=${r.n}; estudo 2026-09, quartil por plataforma dentro do cliente).`,
        // a linha do lift.json que sustenta, no formato das tabelas do briefing-<cliente>.md
        evidencia: `lift.json clientes[${c.nome}].dims.${dim}: ${r.label} | n=${r.n} | k=${r.k} | ${r.lift.toFixed(2)} [${r.lift_lb.toFixed(2)}–${r.lift_ub.toFixed(2)}] | ${r.flag}`,
      }));
  });
}

async function main() {
  const lift = JSON.parse(readFileSync(IN, "utf8")) as { gerado_em: string; clientes: ClienteLift[] };
  const propostas = lift.clientes.map((c) => ({ c, licoes: licoesDoCliente(c) })).filter((p) => p.licoes.length);
  console.log(`${IN} (gerado em ${lift.gerado_em}) — corte lift_lb≥${MIN_LIFT_LB} n≥${MIN_N}: ${propostas.length} cliente(s)\n`);

  let gravadas = 0;
  for (const { c, licoes } of propostas) {
    // Idempotente: só o que ainda não existe para (cliente, source_title), por título.
    const { data: existentes, error } = await appDb
      .from("vm_lessons")
      .select("vm_lesson_learnings(titulo)")
      .eq("source_title", SOURCE_TITLE)
      .eq("client_id", c.cliente_id);
    if (error) throw new Error(`vm_lessons: ${error.message}`);
    const jaTem = new Set(
      (existentes ?? []).flatMap((l) => (l.vm_lesson_learnings as { titulo: string }[] | null) ?? []).map((x) => x.titulo)
    );
    const novas = licoes.filter((l) => !jaTem.has(l.titulo));

    console.log(`## ${c.nome} (${c.cliente_id})`);
    for (const l of licoes) console.log(`  ${jaTem.has(l.titulo) ? "= já existe" : "+ nova"} [${l.dimensao}] ${l.titulo}\n      ${l.descricao}\n      evidência: ${l.evidencia}`);
    if (!novas.length || DRY_RUN) continue;

    const r = await proporLicoes({
      clientId: c.cliente_id,
      sourceTitle: SOURCE_TITLE,
      transcript: novas.map((l) => l.evidencia).join("\n"),
      licoes: novas,
    });
    if (r.reason) throw new Error(`${c.nome}: ${r.reason}`);
    gravadas += r.proposed;
  }
  console.log(DRY_RUN ? "\n--dry-run: nada gravado." : `\n${gravadas} lição(ões) gravada(s) como active:false.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
