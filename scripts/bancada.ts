// Banco de prova da escrita (plano 024, 1.1). Roda o MESMO caminho de runPipeline (premissa,
// pesquisa, narrativas, ranking, roteirista, finalizarRoteiro) sobre as pautas fixas, sem
// sessão e sem gravar nada no banco. Cada braço é o código do worktree em que o script roda,
// mais os playbooks pedidos em CODEX_BANCADA_PLAYBOOKS.
//
// Saída: <saida>/<braco>/<pauta>.json, um por pauta, com o roteiro e o custo. O piso e o juiz
// rodam depois, em scripts/bancada-placar.ts: assim o braço A (produção) não precisa do verificador.
// Pauta que já tem arquivo é pulada (retomar uma rodada é rodar de novo).
//
// --montante <dir> reaproveita premissa, dossiê, narrativas e ranking de outra rodada: o
// braço passa a diferir só da escrita para baixo, e o custo cai pela metade. Só vale quando
// o braço NÃO muda pesquisa, storytelling nem ranking.
// --com-hook reaproveita também o hook da rodada montante (sem as variações): o braço difere
// só do corpo para baixo. Só vale quando o braço NÃO muda o agente nem o playbook de hook.
//
//   npx tsx --env-file=.env.local scripts/bancada.ts --braco A --saida <dir> [--so h1,c3] [--n 5] [--montante <dir>/A]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { appDb } from "../lib/db";
import { loadContextBancada } from "../lib/pipeline/context";
import { derivePremissa, teseAceitavel } from "../lib/pipeline/premissa";
import { research, proposeNarratives, rankNarratives } from "../lib/pipeline/agents";
import { escolherVencedora, escreverRoteiro } from "../lib/pipeline/index";
import { deepDedash } from "../lib/pipeline/slop-lint";
import { PRECO_POR_MTOK } from "../lib/llm-catalogo";
import type { SessionArtifacts } from "../lib/pipeline/types";
import type { UsageLog } from "../lib/anthropic";

const arg = (nome: string) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const BRACO = arg("braco") ?? "A";
const SAIDA = arg("saida") ?? "bancada";
const MONTANTE = arg("montante");
const COM_HOOK = process.argv.includes("--com-hook");
const SO = arg("so")?.split(",");
const N = Number(arg("n") ?? Infinity);
const PAUTAS = arg("pautas") ?? "docs/escrita-2026-10/bancada/pautas.json";
// hookRecentes compara session_id com este valor: um uuid que não existe deixa o anti-colapso
// enxergar as últimas gerações reais do cliente, como em produção.
const SESSAO_FANTASMA = "00000000-0000-0000-0000-000000000000";

interface Pauta {
  id: string;
  tipo: "humano_topo" | "codex_reclamado";
  client_id: string | null;
  prompt?: string;
  sessao?: string;
  crm_script_id?: string;
  titulo?: string;
}

async function resolver(p: Pauta): Promise<{ clientId: string; prompt: string }> {
  if (p.prompt && p.client_id) return { clientId: p.client_id, prompt: p.prompt };
  const { data, error } = await appDb.from("vm_sessions").select("prompt, client_id").eq("id", p.sessao!).single();
  if (error || !data) throw new Error(`pauta ${p.id}: sessão ${p.sessao} não encontrada`);
  return { clientId: (p.client_id ?? data.client_id) as string, prompt: data.prompt as string };
}

function custo(log: UsageLog): number {
  let total = 0;
  for (const f of Object.values(log)) {
    const preco = PRECO_POR_MTOK[f.model];
    if (!preco) continue; // Grok não expõe usage
    total +=
      (f.input_tokens * preco.entrada +
        f.output_tokens * preco.saida +
        f.cache_creation_input_tokens * preco.cacheEscrita +
        f.cache_read_input_tokens * preco.cacheLeitura) /
      1_000_000;
  }
  return Math.round(total * 100) / 100;
}

async function rodar(p: Pauta) {
  const { clientId, prompt } = await resolver(p);
  const ctx = await loadContextBancada(clientId, prompt);

  let artifacts: SessionArtifacts;
  let hookPronto: Parameters<typeof escreverRoteiro>[5];
  const reuso = MONTANTE ? join(MONTANTE, `${p.id}.json`) : null;
  if (reuso && existsSync(reuso)) {
    const anterior = JSON.parse(readFileSync(reuso, "utf8"));
    ctx.premissa = anterior.premissa;
    ctx.premissaOrigem = "derivada";
    ctx.premissaProvas = anterior.artifacts.premissa_provas;
    ctx.premissaContraintuitivo = anterior.artifacts.premissa_contraintuitivo;
    artifacts = anterior.artifacts;
    if (COM_HOOK)
      hookPronto = {
        hook: anterior.hook, variantes: [], racional: "", motivo: "reuso do banco de prova",
        mecanismo: anterior.hook_mecanismo, formato: "Nenhum", mecanismosVariantes: [], candidatos: [], descartados: [],
      };
  } else {
    const derivada = await derivePremissa(ctx);
    if (!teseAceitavel(derivada.premissa)) throw new Error(`premissa não é tese: ${derivada.premissa}`);
    ctx.premissa = derivada.premissa;
    ctx.premissaOrigem = "derivada";
    ctx.premissaProvas = derivada.o_que_provaria;
    ctx.premissaContraintuitivo = derivada.angulo_contraintuitivo;
    const dossie = await research(ctx);
    const candidatas = await proposeNarratives(ctx, dossie);
    const rank = await rankNarratives(ctx, dossie, candidatas);
    artifacts = deepDedash({
      dossie,
      candidatas,
      ranking: rank.ranking,
      escolhida: escolherVencedora(rank.ranking.filter((r) => candidatas[r.indice])),
      orientacao_roteiro: rank.orientacao_roteiro,
      orientacao_hook: rank.orientacao_hook,
      premissa_provas: ctx.premissaProvas,
      premissa_contraintuitivo: ctx.premissaContraintuitivo,
    });
  }
  ctx.artifacts = artifacts;

  const r = await escreverRoteiro(ctx, SESSAO_FANTASMA, artifacts, () => {}, undefined, hookPronto);
  const s = r.sections;
  return {
    pauta: p,
    braco: BRACO,
    playbooks: ctx.playbookVersions,
    premissa: ctx.premissa,
    artifacts,
    headline: s.headline,
    hook: s.hook,
    roteiro: s.roteiro,
    comando: s.comando,
    fontes: s.fontes,
    fallbacks: { revisao: r.fbRevisao, humanizacao: r.fbHumanizacao },
    hook_mecanismo: r.hookRes.mecanismo,
    custo_usd: custo(ctx.usageLog ?? {}),
    usage: ctx.usageLog,
  };
}

void (async () => {
  const pautas = (JSON.parse(readFileSync(PAUTAS, "utf8")).pautas as Pauta[])
    .filter((p) => !SO || SO.includes(p.id))
    .slice(0, N);
  const dir = join(SAIDA, BRACO);
  mkdirSync(dir, { recursive: true });
  let gasto = 0;
  for (const p of pautas) {
    const arq = join(dir, `${p.id}.json`);
    if (existsSync(arq)) continue;
    const t0 = Date.now();
    try {
      const out = await rodar(p);
      writeFileSync(arq, JSON.stringify(out, null, 1));
      gasto += out.custo_usd;
      console.log(`${p.id} ok ${Math.round((Date.now() - t0) / 1000)}s US$ ${out.custo_usd} | total US$ ${gasto.toFixed(2)}`);
    } catch (e) {
      console.error(`${p.id} FALHOU: ${e instanceof Error ? e.message : e}`);
    }
  }
})();
