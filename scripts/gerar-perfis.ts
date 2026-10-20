// Plano 025: monta o perfil de cada cliente com preferências (vm_client_preferences), sem LLM, a
// partir dos arquivos dos estudos. Por padrão só escreve em docs/perfis-2026-10/<slug>.md para o
// time revisar. --aplicar grava em vm_client_preferences.perfil onde está vazio (exige a 0053),
// --forcar reescreve: só com o Igor, porque apaga edição humana.
//   npx tsx --env-file=.env.local scripts/gerar-perfis.ts [--aplicar [--forcar]]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { appDb } from "../lib/db";
import { NICHO_DO_CLIENTE, lerEstudoCortes, linhasDeHook, montarPerfil, slugCliente, type VideoHook } from "../lib/perfil-cliente";

const APLICAR = process.argv.includes("--aplicar");
const FORCAR = process.argv.includes("--forcar");
const SAIDA = "docs/perfis-2026-10";

const porCliente = JSON.parse(readFileSync("docs/estudo-modos-2026-10/dados/modo_por_cliente.json", "utf8")) as Record<
  string,
  { roteiros: number; modos: Record<string, never> }
>;
// Base do refiltro: só roteiro da casa (vm_script='sim'), sem corte de podcast.
const videos = readFileSync("docs/estudo-hooks-2026-10/dados/refiltro_base_ig_tt_sim.jsonl", "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l) as VideoHook);
const cortes = lerEstudoCortes(readFileSync("docs/estudo-hooks-2026-10/hooks_5_cliente_nicho.md", "utf8"));

const sintese = (nome: string) => {
  const arq = `docs/estudo-2026-10/achados/clientes/${slugCliente(nome)}.md`;
  if (!existsSync(arq)) return "";
  const m = readFileSync(arq, "utf8").match(/## Síntese\n([\s\S]*?)(?=\n## |$)/);
  return m?.[1]?.trim() ?? "";
};

void (async () => {
  const { data: prefs, error } = await appDb.from("vm_client_preferences").select(`client_id, ${APLICAR ? "perfil, " : ""}clientes(nome)`);
  if (error) throw new Error(error.message);
  // alcance vem da 0054 e da triagem (Task 8). Sem ela, o perfil sai sem a parte das correções.
  const { data: licoes, error: eLicoes } = await appDb
    .from("vm_lesson_learnings")
    .select("titulo, descricao, vm_lessons!inner(client_id)")
    .eq("alcance", "cliente");
  if (eLicoes) console.warn(`lições por cliente fora do perfil (${eLicoes.message})`);

  mkdirSync(SAIDA, { recursive: true });
  let gerados = 0;
  let gravados = 0;
  for (const p of (prefs ?? []) as unknown as { client_id: string; perfil?: string | null; clientes: { nome: string } | { nome: string }[] | null }[]) {
    const nome = (Array.isArray(p.clientes) ? p.clientes[0] : p.clientes)?.nome ?? "";
    const estudo = porCliente[p.client_id];
    const doCliente = (licoes ?? []).filter((l) => (Array.isArray(l.vm_lessons) ? l.vm_lessons[0] : l.vm_lessons)?.client_id === p.client_id);
    const hookIg = videos.filter((v) => v.plataforma === "Instagram" && v.cliente_nome === nome).length;
    const perfil = montarPerfil({
      nome,
      roteiros: estudo?.roteiros ?? 0,
      modos: estudo?.modos ?? {},
      hook: { roteiros: hookIg, linhas: linhasDeHook(videos, nome, NICHO_DO_CLIENTE, cortes[nome]) },
      sintese: sintese(nome),
      licoes: doCliente as never,
    });
    if (!perfil) continue;
    writeFileSync(`${SAIDA}/${slugCliente(nome)}.md`, `# ${nome}\n\n${perfil}\n`);
    gerados++;
    console.log(`${nome}: ${perfil.length} caracteres`);
    if (!APLICAR || (p.perfil && !FORCAR)) continue;
    const { error: e2 } = await appDb.from("vm_client_preferences").update({ perfil }).eq("client_id", p.client_id);
    if (e2) throw new Error(`${nome}: ${e2.message}`);
    gravados++;
  }
  console.log(`perfis gerados em ${SAIDA}: ${gerados}${APLICAR ? `, gravados no banco: ${gravados}` : " (sem --aplicar, nada gravado)"}`);
})();
