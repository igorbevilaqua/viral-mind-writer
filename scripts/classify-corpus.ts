// Plano 020, WP-C: LLM só na LACUNA da taxonomia canônica — o que o Oráculo não rotulou.
// Evolução de scripts/analyze-hooks.ts (paginação, runPool, tool forçada), com a correção que
// motivou o plano: o system é o CATÁLOGO DE DEFINIÇÕES NEUTRAS de oraculo.playbook_categorias,
// nunca o playbook ordenado por performance (era ele que fazia o classificador rotular
// "Contraste Extremo" em 39% dos hooks — priming).
//
//   npx tsx --env-file=.env.local scripts/classify-corpus.ts --dims storytelling[,hook,comando]
//       [--limit N] [--dry-run] [--vm sim|nao|todos]
//   --dims    dimensões a classificar (default storytelling)
//   --limit   teto de TEXTOS DISTINTOS por dimensão (default 2000 — decisão do Igor)
//   --dry-run imprime fila e custo estimado; não chama a LLM nem grava
//   --vm      restringe a fila por fato_video.vm_script (default todos)
//
// Fila = vídeos de 2026 em oraculo.fato_video com o texto da dimensão (roteiro / hook /
// comando) e sem rótulo nela (fonte_<dim> is null em vm_video_classifications), deduplicados
// por md5 do texto — quem compartilha o texto recebe o mesmo rótulo, uma linha por video_id.
// Prioridade: vm_script='sim' → extremos de coeficiente_viral dos demais → meio → sem coeficiente.
// Idempotente: texto avaliado (mesmo "sem padrão") ganha fonte_<dim>='codex-llm' e sai da fila.
import { createHash } from "node:crypto";
import { anthropic, ANALYST_MODEL } from "../lib/anthropic";
import { appDb, viralData } from "../lib/db";
import { toolArray, toolInput } from "../lib/pipeline/agents";
import { mapearOraculo, slugConhecido, type Dimensao } from "../lib/pipeline/taxonomia";

// ── Args ─────────────────────────────────────────────────────────────────────
const arg = (nome: string) => { const i = process.argv.indexOf(nome); return i >= 0 ? process.argv[i + 1] : undefined; };
const DIMS = (arg("--dims") ?? "storytelling").split(",").map((d) => d.trim()) as Dimensao[];
for (const d of DIMS) if (!["storytelling", "hook", "comando"].includes(d)) throw new Error(`--dims: dimensão inválida "${d}"`);
const LIMIT = Number(arg("--limit") ?? 2000);
if (!Number.isFinite(LIMIT) || LIMIT <= 0) throw new Error("--limit precisa de um número positivo");
const DRY_RUN = process.argv.includes("--dry-run");
const VM = arg("--vm") ?? "todos";
if (!["sim", "nao", "todos"].includes(VM)) throw new Error("--vm: sim|nao|todos");

const CONCURRENCY = 4;
const ROTEIRO_CORTE = 4000; // mesmo corte do Oráculo: a estrutura se define no arco inicial
// api_pricing não existe neste repo nem no do Oráculo → constante (Sonnet, US$/MTok).
const PRECO_IN = 3, PRECO_OUT = 15;

const CFG: Record<Dimensao, { lote: number; oQue: string; coluna: string; fonteCol: "fonte_hook" | "fonte_estruturas" | "fonte_comandos" }> = {
  storytelling: { lote: 8, oQue: "ROTEIROS completos de vídeos curtos, identificando a ESTRUTURA NARRATIVA dominante", coluna: "estruturas", fonteCol: "fonte_estruturas" },
  hook: { lote: 20, oQue: "HOOKS (frases de abertura) de vídeos curtos, identificando o mecanismo que gera a curiosidade", coluna: "hook_mecanismos", fonteCol: "fonte_hook" },
  comando: { lote: 20, oQue: "COMANDOS (a chamada à ação no fim do roteiro), identificando o gatilho usado", coluna: "comandos", fonteCol: "fonte_comandos" },
};

const oraculo = viralData.schema("oraculo");
const PAGE = 1000;

// Paginação por range (mesma de seed-classifications-from-oraculo.ts; scripts não importam scripts).
async function paginado<T>(
  nome: string,
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(`${nome}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

// pool de concorrência simples (copiado de analyze-hooks.ts)
async function runPool<T>(items: T[], n: number, fn: (item: T, i: number) => Promise<void>): Promise<void> {
  let idx = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    for (;;) {
      const i = idx++;
      if (i >= items.length) return;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

interface FatoVideo {
  video_id: string; vm_script: string | null; coeficiente_viral: number | null;
  hook: string | null; comando: string | null; categorias: string[] | null;
}
interface Categoria { dimensao: Dimensao; slug: string; nome: string; descricao: string }
interface Grupo { chave: string; texto: string; videos: FatoVideo[]; prioridade: [number, number] }

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

// ── Fila por dimensão ────────────────────────────────────────────────────────
function montarFila(dim: Dimensao, videos: FatoVideo[], roteiros: Map<string, string>, rotulados: Set<string>): Grupo[] {
  const textoDe = (v: FatoVideo) =>
    dim === "storytelling" ? (roteiros.get(v.video_id) ?? "").trim().slice(0, ROTEIRO_CORTE)
    : dim === "hook" ? (v.hook ?? "").trim() : (v.comando ?? "").trim();

  const cand = videos.filter((v) => {
    if (rotulados.has(v.video_id)) return false;
    if (VM === "sim" && v.vm_script !== "sim") return false;
    if (VM === "nao" && v.vm_script !== "nao") return false;
    return textoDe(v).length >= 20; // menos que isso não é hook nem roteiro
  });

  // percentil do coeficiente entre os candidatos não-VM: |pct − 0,5| grande = extremo
  const coefs = [...new Set(cand.filter((v) => v.vm_script !== "sim" && v.coeficiente_viral != null).map((v) => Number(v.coeficiente_viral)))].sort((a, b) => a - b);
  const pct = new Map(coefs.map((c, i) => [c, coefs.length === 1 ? 0.5 : i / (coefs.length - 1)]));

  const grupos = new Map<string, Grupo>();
  for (const v of cand) {
    const texto = textoDe(v);
    const chave = md5(texto);
    const g = grupos.get(chave) ?? { chave, texto, videos: [], prioridade: [2, 0] };
    g.videos.push(v);
    // prioridade = [tier asc, extremidade desc]; o grupo herda o melhor dos seus vídeos
    const p: [number, number] = v.vm_script === "sim" ? [0, 1]
      : v.coeficiente_viral != null ? [1, Math.abs((pct.get(Number(v.coeficiente_viral)) ?? 0.5) - 0.5)]
      : [2, 0];
    if (p[0] < g.prioridade[0] || (p[0] === g.prioridade[0] && p[1] > g.prioridade[1])) g.prioridade = p;
    grupos.set(chave, g);
  }
  return [...grupos.values()].sort((a, b) => a.prioridade[0] - b.prioridade[0] || b.prioridade[1] - a.prioridade[1] || a.chave.localeCompare(b.chave));
}

// ── Classificação (tool forçada, enum = slugs do catálogo) ───────────────────
function montarSystem(dim: Dimensao, cats: Categoria[]): string {
  // ordem alfabética pelo nome: nenhuma categoria chega "primeiro" por performance
  const catalogo = [...cats].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((c) => `- ${c.slug}: ${c.nome}: ${c.descricao}`).join("\n");
  return `Você classifica ${CFG[dim].oQue}. Use SOMENTE as definições abaixo — não a frequência com que imagina que cada categoria ocorre.

Categorias (responda com o slug):
${catalogo}

Regras:
- Cada item recebe de 0 a 3 slugs, em ordem de dominância (o principal primeiro).
- Só atribua uma categoria se o texto casar com a definição; item sem padrão claro recebe lista vazia.`;
}

function ferramenta(slugs: string[]) {
  return {
    name: "classificar",
    description: "Devolve, para cada item do lote, os slugs das categorias que casam com a definição.",
    input_schema: {
      type: "object" as const,
      properties: {
        itens: {
          type: "array",
          items: {
            type: "object",
            properties: {
              indice: { type: "number", description: "o índice recebido no lote" },
              categorias: { type: "array", maxItems: 3, items: { type: "string", enum: slugs }, description: "0 a 3 slugs, o dominante primeiro; vazio se nenhum casa" },
            },
            required: ["indice", "categorias"],
          },
        },
      },
      required: ["itens"],
    },
  };
}

async function classificarLote(dim: Dimensao, system: string, slugs: string[], lote: Grupo[]): Promise<Map<string, string[]>> {
  const lista = lote.map((g, i) => `[${i}] ${g.texto.replace(/\s+/g, " ")}`).join("\n\n");
  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 4000,
    tools: [ferramenta(slugs)],
    tool_choice: { type: "tool", name: "classificar" },
    system,
    messages: [{ role: "user", content: `Classifique (o índice é o número entre colchetes):\n\n${lista}` }],
  });
  const toolUse = res.content.find((b) => b.type === "tool_use");
  const out = new Map<string, string[]>();
  if (!toolUse || toolUse.type !== "tool_use") return out;
  const valido = new Set(slugs);
  for (const it of toolArray<{ indice: number; categorias: string[] }>(toolInput(toolUse), "itens")) {
    const g = lote[it.indice];
    if (!g) continue;
    out.set(g.chave, (Array.isArray(it.categorias) ? it.categorias : []).filter((s) => valido.has(s)).slice(0, 3));
  }
  return out;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`dims ${DIMS.join(",")} · limit ${LIMIT} · vm ${VM} · modelo ${ANALYST_MODEL}${DRY_RUN ? " · DRY-RUN" : ""}`);

  const { data: catData, error: catErr } = await oraculo.from("playbook_categorias").select("dimensao, slug, nome, descricao");
  if (catErr) throw new Error(`playbook_categorias: ${catErr.message}`);
  const catalogo = (catData ?? []) as Categoria[];

  console.log("carregando fato_video 2026 + classificações existentes...");
  const [videos, existentes] = await Promise.all([
    paginado<FatoVideo>("fato_video", (a, b) =>
      oraculo.from("fato_video").select("video_id, vm_script, coeficiente_viral, hook, comando, categorias")
        .gte("data_publicacao", "2026-01-01").order("video_id").range(a, b)
    ),
    paginado<{ video_id: string; fonte_hook: string | null; fonte_estruturas: string | null; fonte_comandos: string | null }>(
      "vm_video_classifications",
      (a, b) => appDb.from("vm_video_classifications").select("video_id, fonte_hook, fonte_estruturas, fonte_comandos").order("video_id").range(a, b)
    ),
  ]);
  const roteiros = new Map<string, string>();
  if (DIMS.includes("storytelling")) {
    const rows = await paginado<{ id: string; roteiro: string | null }>("videos", (a, b) =>
      viralData.from("videos").select("id, roteiro").gte("data_publicacao", "2026-01-01").not("roteiro", "is", null).order("id").range(a, b)
    );
    for (const r of rows) if (r.roteiro) roteiros.set(r.id, r.roteiro);
  }
  console.log(`  ${videos.length} vídeos de 2026 · ${existentes.length} já em vm_video_classifications · ${roteiros.size} roteiros`);

  let custoTotal = 0;
  for (const dim of DIMS) {
    const cfg = CFG[dim];
    const cats = catalogo.filter((c) => c.dimensao === dim && slugConhecido(dim, c.slug));
    const semMapa = catalogo.filter((c) => c.dimensao === dim && !slugConhecido(dim, c.slug)).map((c) => c.slug);
    if (!cats.length) throw new Error(`playbook_categorias sem categorias para '${dim}'`);
    if (semMapa.length) console.log(`  [${dim}] slugs do catálogo SEM mapa em taxonomia.ts (fora do enum): ${semMapa.join(", ")}`);
    const slugs = cats.map((c) => c.slug);
    const system = montarSystem(dim, cats);

    const rotulados = new Set(existentes.filter((e) => e[cfg.fonteCol]).map((e) => e.video_id));
    const fila = montarFila(dim, videos, roteiros, rotulados);
    const escolhidos = fila.slice(0, LIMIT);
    const lotes: Grupo[][] = [];
    for (let i = 0; i < escolhidos.length; i += cfg.lote) lotes.push(escolhidos.slice(i, i + cfg.lote));

    // estimativa: tokens ≈ chars/3,5; saída ~40 tokens por item
    const charsIn = lotes.length * system.length + escolhidos.reduce((s, g) => s + g.texto.length + 40, 0);
    const tokIn = charsIn / 3.5, tokOut = escolhidos.length * 40;
    const custo = (tokIn / 1e6) * PRECO_IN + (tokOut / 1e6) * PRECO_OUT;
    custoTotal += custo;
    const nVideos = escolhidos.reduce((s, g) => s + g.videos.length, 0);
    console.log(
      `\n[${dim}] fila: ${fila.length} textos distintos (${fila.reduce((s, g) => s + g.videos.length, 0)} vídeos) · ` +
      `vm=sim ${fila.filter((g) => g.prioridade[0] === 0).length} · extremos/meio ${fila.filter((g) => g.prioridade[0] === 1).length} · sem coef ${fila.filter((g) => g.prioridade[0] === 2).length}`
    );
    console.log(`[${dim}] a classificar: ${escolhidos.length} textos (${nVideos} vídeos) em ${lotes.length} chamadas · ~${Math.round(tokIn / 1000)}k tok in, ~${Math.round(tokOut / 1000)}k out · ≈ US$ ${custo.toFixed(2)}`);
    if (DRY_RUN || !lotes.length) continue;

    let feitos = 0, gravadas = 0, falhas = 0;
    const agora = new Date().toISOString();
    await runPool(lotes, CONCURRENCY, async (lote) => {
      let resultado: Map<string, string[]>;
      try {
        resultado = await classificarLote(dim, system, slugs, lote);
      } catch (e) {
        // lote que falhou fica na fila para a próxima rodada; não derruba as demais
        falhas++;
        console.warn(`[${dim}] lote falhou: ${e instanceof Error ? e.message : e}`);
        return;
      }
      const linhas: Record<string, unknown>[] = [];
      for (const g of lote) {
        const cats = resultado.get(g.chave);
        if (!cats) continue; // índice que o modelo não devolveu → volta na próxima rodada
        const r = mapearOraculo(dim, cats);
        for (const v of g.videos) {
          const linha: Record<string, unknown> = {
            video_id: v.video_id, tema: v.categorias?.[0] ?? null,
            fonte: "codex-llm", modelo: ANALYST_MODEL, [cfg.fonteCol]: "codex-llm", updated_at: agora,
          };
          if (dim === "hook") { linha.hook_mecanismos = r.hook_mecanismos; linha.hook_formato = r.hook_formato ?? null; }
          else linha[cfg.coluna] = dim === "storytelling" ? r.estruturas : r.comandos;
          linhas.push(linha);
        }
      }
      if (linhas.length) {
        const { error } = await appDb.from("vm_video_classifications").upsert(linhas, { onConflict: "video_id" });
        if (error) throw new Error(`upsert vm_video_classifications: ${error.message}`);
        gravadas += linhas.length;
      }
      feitos += lote.length;
      console.log(`[${dim}] ${feitos}/${escolhidos.length} textos · ${gravadas} linhas gravadas`);
    });
    console.log(`[${dim}] concluído: ${gravadas} linhas · ${falhas} lotes falharam`);
  }
  console.log(`\ncusto estimado total ≈ US$ ${custoTotal.toFixed(2)}${custoTotal > 20 ? "  ⚠ acima de US$20: confirmar antes de rodar (STOP do plano)" : ""}`);
}

main().catch((e) => {
  console.error("classify-corpus falhou:", e);
  process.exit(1);
});
