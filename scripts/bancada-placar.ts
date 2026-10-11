// Placar do banco de prova (plano 024, 1.5): compara dois braços rodados por scripts/bancada.ts.
// Piso (determinístico) dos dois lados, fórmulas repetidas, e o juiz de teto pareado A x B na
// mesma pauta. Nas pautas "humano_topo", cada braço também enfrenta o roteiro humano que
// viralizou (o gabarito): é a distância até o alvo, não só entre versões do Codex.
//
//   npx tsx --env-file=.env.local --env-file=<.env do Cockpit> scripts/bancada-placar.ts \
//     --runs <dir> --a A --b B [--juiz claude-opus-5-5] [--sem-juiz] [--sem-humano]
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { aberturasRepetidas, medirPiso, type RelatorioPiso } from "../lib/pipeline/piso";
import { julgarPar } from "../lib/pipeline/juiz";

const arg = (nome: string) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const RUNS = arg("runs")!;
const A = arg("a") ?? "A";
const B = arg("b") ?? "B";
const JUIZ = arg("juiz") ?? "claude-opus-5-5";
const SEM_JUIZ = process.argv.includes("--sem-juiz");
const SEM_HUMANO = process.argv.includes("--sem-humano");

interface Saida {
  pauta: { id: string; tipo: string; crm_script_id?: string; titulo?: string };
  headline: string | null;
  hook: string | null;
  roteiro: string | null;
  comando: string | null;
  custo_usd: number;
}

const ler = (braco: string) =>
  new Map(
    readdirSync(join(RUNS, braco))
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(RUNS, braco, f), "utf8")) as Saida)
      .map((s) => [s.pauta.id, s])
  );

const falado = (s: Saida) =>
  [s.headline && `TÍTULO NA TELA: ${s.headline}`, s.hook, s.roteiro, s.comando].filter(Boolean).join("\n\n");

function resumoPiso(rs: RelatorioPiso[]) {
  const media = (f: (r: RelatorioPiso) => number) => +(rs.reduce((a, r) => a + f(r), 0) / rs.length).toFixed(2);
  const pct = (f: (r: RelatorioPiso) => boolean) => Math.round((100 * rs.filter(f).length) / rs.length);
  return {
    n: rs.length,
    palavras: media((r) => r.palavras),
    numeros_por_100: media((r) => r.numeros_por_100),
    numeros_exatos: media((r) => r.numeros_exatos.length),
    viradas_por_100: media((r) => r.viradas_por_100),
    ou_seja: media((r) => r.ou_seja),
    metonimia_pct: pct((r) => r.metonimias.length > 0),
    sigla_sem_aposto_pct: pct((r) => r.siglas_sem_aposto.length > 0),
    origem_pct: pct((r) => r.origem >= 2),
    hook_duplicado_pct: pct((r) => r.hook_duplicado),
    violacoes: media((r) => r.violacoes.length),
  };
}

async function humanos(ids: string[]): Promise<Map<string, string>> {
  const crm = createClient(process.env.CRM_SUPABASE_URL!, process.env.CRM_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await crm.from("scripts").select("id, script_text").in("id", ids);
  if (error) throw error;
  const limpar = (t: string) => t.replace(/\([^)]*\)|\[[^\]]*\]|\*/g, " ").replace(/[ \t]+/g, " ");
  return new Map((data ?? []).map((r) => [r.id as string, limpar(r.script_text as string)]));
}

const placarDe = (vs: string[]) => ({
  vitorias: vs.filter((v) => v === "A").length,
  derrotas: vs.filter((v) => v === "B").length,
  empates: vs.filter((v) => v === "empate").length,
});

void (async () => {
  const ra = ler(A), rb = ler(B);
  const comuns = [...ra.keys()].filter((id) => rb.has(id)).sort();
  const pisoA = comuns.map((id) => medirPiso(ra.get(id)!.hook, ra.get(id)!.roteiro ?? ""));
  const pisoB = comuns.map((id) => medirPiso(rb.get(id)!.hook, rb.get(id)!.roteiro ?? ""));
  const rel: Record<string, unknown> = {
    pautas: comuns.length,
    custo_usd: { [A]: +comuns.reduce((s, id) => s + ra.get(id)!.custo_usd, 0).toFixed(2), [B]: +comuns.reduce((s, id) => s + rb.get(id)!.custo_usd, 0).toFixed(2) },
    piso: { [A]: resumoPiso(pisoA), [B]: resumoPiso(pisoB) },
    // Só o que é FALADO de autoria do roteirista (hook + corpo): o título na tela e o comando
    // ("Se você quer...") repetem por formato e poluiriam a contagem de fórmula.
    formulas: {
      [A]: aberturasRepetidas(comuns.map((id) => `${ra.get(id)!.hook ?? ""}\n\n${ra.get(id)!.roteiro ?? ""}`)),
      [B]: aberturasRepetidas(comuns.map((id) => `${rb.get(id)!.hook ?? ""}\n\n${rb.get(id)!.roteiro ?? ""}`)),
    },
  };

  if (!SEM_JUIZ) {
    const duelos = await Promise.all(comuns.map(async (id) => ({ id, j: await julgarPar(falado(ra.get(id)!), falado(rb.get(id)!), JUIZ) })));
    rel.juiz = { modelo: JUIZ, [`${A} contra ${B}`]: placarDe(duelos.map((d) => d.j.vencedor)), duelos };

    if (!SEM_HUMANO) {
      const hum = comuns.filter((id) => ra.get(id)!.pauta.tipo === "humano_topo" && ra.get(id)!.pauta.crm_script_id);
      const textos = await humanos(hum.map((id) => ra.get(id)!.pauta.crm_script_id!));
      const contraHumano = async (r: Map<string, Saida>) =>
        placarDe(
          await Promise.all(
            hum
              .filter((id) => textos.has(r.get(id)!.pauta.crm_script_id!))
              .map(async (id) => (await julgarPar(falado(r.get(id)!), textos.get(r.get(id)!.pauta.crm_script_id!)!, JUIZ)).vencedor)
          )
        );
      rel.contra_humano_de_topo = { [A]: await contraHumano(ra), [B]: await contraHumano(rb) };
    }
  }

  writeFileSync(join(RUNS, `placar-${A}-x-${B}.json`), JSON.stringify(rel, null, 1));
  const { juiz, ...semDuelos } = rel as { juiz?: { duelos: unknown } };
  console.log(JSON.stringify({ ...semDuelos, juiz: juiz && { ...juiz, duelos: undefined } }, null, 1));
})();
