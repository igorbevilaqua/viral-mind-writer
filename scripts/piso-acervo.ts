// Plano 024, 1.2: roda o verificador de piso sobre o acervo real e imprime a distribuição.
// Codex (últimos 60 dias, última versão por sessão) contra roteiros humanos da casa (CRM) de
// topo e de base de coeficiente viral. Só leitura.
//   npx tsx --env-file=.env.local --env-file=<.env.local do Cockpit> scripts/piso-acervo.ts <ids.json>
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { appDb } from "../lib/db";
import { aberturasRepetidas, medirPiso, type RelatorioPiso } from "../lib/pipeline/piso";

const limpar = (t: string) => t.replace(/\([^)]*\)|\[[^\]]*\]|\*/g, " ").replace(/[ \t]+/g, " ");

async function codex(): Promise<{ hook: string | null; corpo: string }[]> {
  const desde = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data, error } = await appDb
    .from("vm_generated_scripts")
    .select("session_id, version, hook, roteiro")
    .gte("created_at", desde)
    .order("version", { ascending: false });
  if (error) throw error;
  const porSessao = new Map<string, { hook: string | null; corpo: string }>();
  for (const s of data ?? []) {
    if (!porSessao.has(s.session_id) && (s.roteiro ?? "").length > 200)
      porSessao.set(s.session_id, { hook: s.hook, corpo: s.roteiro });
  }
  return [...porSessao.values()];
}

// Humanos: ids do quartil de cima/baixo do coeficiente (média do percent_rank no estrato cliente
// x rede x trimestre, a régua do estudo de outubro) num JSON {"1": [...], "4": [...]}; o texto
// vem do CRM, só leitura. Precisa de CRM_SUPABASE_URL/CRM_SERVICE_ROLE_KEY (o .env do Cockpit).
const crm = createClient(process.env.CRM_SUPABASE_URL!, process.env.CRM_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const IDS = JSON.parse(readFileSync(process.argv[2], "utf8")) as Record<"1" | "4", string[]>;

async function humanos(quartil: 1 | 4, n: number): Promise<{ hook: null; corpo: string }[]> {
  const ids = IDS[quartil].slice(0, n);
  const out: { hook: null; corpo: string }[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const { data, error } = await crm.from("scripts").select("script_text").in("id", ids.slice(i, i + 50));
    if (error) throw error;
    for (const r of data ?? []) if ((r.script_text ?? "").length > 200) out.push({ hook: null, corpo: limpar(r.script_text) });
  }
  return out;
}

function resumo(nome: string, rs: RelatorioPiso[]) {
  const media = (f: (r: RelatorioPiso) => number) => (rs.reduce((a, r) => a + f(r), 0) / rs.length).toFixed(2);
  const pct = (f: (r: RelatorioPiso) => boolean) => `${Math.round((100 * rs.filter(f).length) / rs.length)}%`;
  console.log(
    [
      nome.padEnd(10),
      `n=${rs.length}`,
      `palavras ${media((r) => r.palavras)}`,
      `num/100 ${media((r) => r.numeros_por_100)}`,
      `exatos ${media((r) => r.numeros_exatos.length)}`,
      `viradas/100 ${media((r) => r.viradas_por_100)}`,
      `ou_seja ${media((r) => r.ou_seja)}`,
      `metonímia ${pct((r) => r.metonimias.length > 0)}`,
      `sigla_sem_aposto ${pct((r) => r.siglas_sem_aposto.length > 0)}`,
      `origem2+ ${pct((r) => r.origem >= 2)}`,
      `hook_dup ${pct((r) => r.hook_duplicado)}`,
      `violações ${media((r) => r.violacoes.length)}`,
    ].join(" | ")
  );
}

void (async () => {
  const c = await codex();
  const topo = await humanos(4, 200);
  const base = await humanos(1, 200);
  resumo("codex", c.map((x) => medirPiso(x.hook, x.corpo)));
  resumo("h_topo", topo.map((x) => medirPiso(null, x.corpo)));
  resumo("h_base", base.map((x) => medirPiso(null, x.corpo)));
  console.log("\nfórmulas (acima de 15% dos roteiros e do dobro da casa):");
  console.log("codex ", aberturasRepetidas(c.map((x) => `${x.hook ?? ""}\n\n${x.corpo}`)).slice(0, 8));
  console.log("h_topo", aberturasRepetidas(topo.map((x) => x.corpo)).slice(0, 8));
})();
