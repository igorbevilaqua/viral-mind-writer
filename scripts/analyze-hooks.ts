// Fase 0 do plano de evolução do agente de Hook: análise empírica dos hooks
// de alta performance do corpus, reclassificados contra a taxonomia CANÔNICA do
// playbook (playbooks/hook.md) — porque a classificação existente (videos.analise->hook)
// é ad-hoc e parcial e não casa com o vocabulário do playbook.
//
// 100% read-only sobre o corpus: só lê, nunca escreve no banco. A saída são dois
// arquivos locais (relatório .md + leaderboard .json) para revisão humana e para
// alimentar a Fase 1 (reescrita do playbook) e a Fase 2 (insight hook_mechanism_ranking).
//
// Rodar da raiz do projeto:
//   npx tsx --env-file=.env.local scripts/analyze-hooks.ts [--dry-run] [--limit N] [--out PREFIXO]
//   --dry-run  só seleciona e imprime estatísticas; NÃO chama a LLM nem escreve arquivos
//   --limit N  classifica no máximo N hooks (default 800; prioriza os de maior performance)
//   --out P    prefixo dos arquivos de saída (default "hooks-analysis" → .md e .json)
//   --persist  além dos arquivos, faz upsert das classificações em vm_hook_classifications
//              (Fase 2: alimenta o insight hook_mechanism_ranking do ETL)
import { promises as fs } from "node:fs";
import path from "node:path";
import { appDb, viralData } from "../lib/db";
import { anthropic, ANALYST_MODEL } from "../lib/anthropic";
import { toolInput, toolArray } from "../lib/pipeline/agents";
import { HOOK_MECHANISMS, HOOK_FORMATS, type HookMechanism, type HookFormat } from "../lib/pipeline/hook-mechanisms";

// ── Taxonomia em DOIS EIXOS (fonte única em lib/pipeline/hook-mechanisms.ts) ──
// Eixo 1: MECANISMO DE CURIOSIDADE — o que realmente sequestra a atenção (o driver).
// Eixo 2: FORMATO — o enquadramento que carrega o mecanismo (não é driver por si).
// "Esse Cara"/"Visual" saíram do eixo de mecanismo: dizer "esse cara" é só o sujeito da
// frase; o viral está no mecanismo que vem depois. O classificador acha o mecanismo real
// e, à parte, marca o formato.
const MECANISMOS = HOOK_MECHANISMS;
type Mecanismo = HookMechanism;
const FORMATOS = HOOK_FORMATS;
type Formato = HookFormat;

// Palavras mágicas: match determinístico em JS (mais barato e reprodutível que LLM).
// Semente vinda do playbook; expanda a lista quando novos padrões aparecerem.
const PALAVRAS_MAGICAS = [
  "confessar", "confessou", "revelar", "revelou", "revelação", "perturbador",
  "segredo", "proibido", "clandestino", "chocante", "urgente", "exclusivo",
  "ninguém", "nunca", "descobriu", "escondido", "oculto", "bastidores",
];

// ── Args ──────────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
const limitIdx = process.argv.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : 800;
if (!Number.isFinite(LIMIT) || LIMIT <= 0) throw new Error("--limit precisa de um número positivo");
const outIdx = process.argv.indexOf("--out");
const OUT = outIdx >= 0 ? process.argv[outIdx + 1] : "hooks-analysis";
const PERSIST = process.argv.includes("--persist");

// Pesos do score de performance (calibração explícita — ajuste com dado, não achismo).
// retenção do hook é o sinal PRIMÁRIO (mede o efeito do próprio hook) mas é esparso
// (~17% dos vídeos); views é quase universal mas com cauda longa → usamos percentil.
const W_RET = 0.55; // peso da retenção quando existe
const W_VIEWS = 0.45; // peso das views (percentil) quando há retenção
const VM_BOOST = 1.15; // produção nossa (is_vm_script) pesa mais — decisão do usuário
const TOP_QUANTILE = 0.75; // "alta performance" = top quartil por score
const BATCH = 20; // hooks por chamada de LLM
const CONCURRENCY = 5;

interface Candidato {
  id: string;
  hook: string;
  is_vm: boolean;
  cliente_id: string | null;
  views: number;
  retencao: number | null;
  categorias: string[];
  perf?: number;
  mecanismos?: Mecanismo[];
  formato?: Formato;
  magicas?: string[];
}

// ── Coleta (paginada) ───────────────────────────────────────────────────────
async function fetchStats(): Promise<Map<string, { views: number; retencao: number | null; cliente_id: string | null }>> {
  const m = new Map<string, { views: number; retencao: number | null; cliente_id: string | null }>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await viralData
      .from("vm_video_stats")
      .select("video_id, views_total, retencao_hook, cliente_id")
      .range(from, from + 999);
    if (error) throw new Error(`vm_video_stats: ${error.message}`);
    for (const r of data ?? [])
      m.set(r.video_id, {
        views: Number(r.views_total) || 0,
        retencao: r.retencao_hook == null ? null : Number(r.retencao_hook),
        cliente_id: r.cliente_id ?? null,
      });
    if (!data || data.length < 1000) return m;
  }
}

async function fetchVideos(): Promise<{ id: string; hook: string; is_vm: boolean; categorias: string[] }[]> {
  const out: { id: string; hook: string; is_vm: boolean; categorias: string[] }[] = [];
  let lastId = "";
  for (;;) {
    let q = viralData
      .from("videos")
      .select("id, hook, is_vm_script, categorias, removido")
      .not("hook", "is", null)
      .order("id")
      .limit(1000);
    if (lastId) q = q.gt("id", lastId);
    const { data, error } = await q;
    if (error) throw new Error(`videos: ${error.message}`);
    if (!data?.length) return out;
    lastId = data[data.length - 1].id;
    for (const v of data) {
      if (v.removido) continue;
      const hook = (v.hook ?? "").trim();
      if (hook.length < 10) continue; // lixo / vazio
      out.push({ id: v.id, hook, is_vm: !!v.is_vm_script, categorias: Array.isArray(v.categorias) ? v.categorias : [] });
    }
    if (data.length < 1000) return out;
  }
}

// percentil (0-1) de cada valor dentro do vetor — robusto à cauda longa das views.
function percentileRanks(values: number[]): Map<number, number> {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const rank = new Map<number, number>();
  sorted.forEach((v, i) => rank.set(v, sorted.length === 1 ? 1 : i / (sorted.length - 1)));
  return rank;
}

function median(nums: number[]): number | null {
  const a = nums.filter((n) => Number.isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

// ── Classificação via LLM (forced tool, enum = taxonomia canônica) ───────────
const CLASSIFY_TOOL = {
  name: "classificar_hooks",
  description: "Classifica cada hook: mecanismo(s) de curiosidade (o driver) + formato (o enquadramento).",
  input_schema: {
    type: "object" as const,
    properties: {
      itens: {
        type: "array",
        items: {
          type: "object",
          properties: {
            indice: { type: "number", description: "o índice recebido no lote" },
            mecanismos: {
              type: "array",
              minItems: 1,
              maxItems: 2,
              items: { type: "string", enum: MECANISMOS as unknown as string[] },
              description: "o(s) MECANISMO(S) DE CURIOSIDADE que fazem o hook funcionar; no máximo 2, o principal primeiro. NÃO classifique pelo sujeito da frase — classifique pelo que gera a curiosidade.",
            },
            formato: {
              type: "string",
              enum: FORMATOS as unknown as string[],
              description: "'Personagem Central' se o hook gira em torno de uma pessoa/personagem (ex: 'esse cara', 'essa mulher', nome próprio); 'Visual' se depende do que se vê; senão 'Nenhum'. Formato NÃO substitui o mecanismo.",
            },
          },
          required: ["indice", "mecanismos", "formato"],
        },
      },
    },
    required: ["itens"],
  },
};

async function classifyBatch(playbook: string, batch: Candidato[]): Promise<void> {
  const lista = batch.map((c, i) => `[${i}] ${c.hook.replace(/\s+/g, " ").slice(0, 300)}`).join("\n");
  const res = await anthropic.messages.create({
    model: ANALYST_MODEL,
    max_tokens: 4000,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: "classificar_hooks" },
    system: `Você é analista de hooks virais. Para cada hook identifique o MECANISMO DE CURIOSIDADE que o faz funcionar (o que sequestra a atenção), usando EXATAMENTE o vocabulário do playbook abaixo — 1, no máximo 2, o dominante primeiro; se nenhum casar, "Outro". IMPORTANTE: não classifique pelo sujeito gramatical. Um hook que começa com "esse cara" é PERSONAGEM CENTRAL no eixo FORMATO, mas o mecanismo é o que vem depois (um contraste, uma revelação, uma controvérsia...). Marque o formato à parte.\n\n# PLAYBOOK DE HOOKS\n${playbook}`,
    messages: [{ role: "user", content: `Classifique os hooks (o índice é o número entre colchetes):\n\n${lista}` }],
  });
  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return; // lote sem saída → fica sem classificação
  const itens = toolArray<{ indice: number; mecanismos: string[]; formato: string }>(toolInput(toolUse), "itens");
  for (const it of itens) {
    const c = batch[it.indice];
    if (!c) continue;
    const mecs = (Array.isArray(it.mecanismos) ? it.mecanismos : []).filter((m): m is Mecanismo =>
      (MECANISMOS as readonly string[]).includes(m)
    );
    c.mecanismos = mecs.length ? mecs.slice(0, 2) : ["Outro"];
    c.formato = (FORMATOS as readonly string[]).includes(it.formato) ? (it.formato as Formato) : "Nenhum";
  }
}

// pool de concorrência simples
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

// ── Agregação ────────────────────────────────────────────────────────────────
interface MecStats {
  mecanismo: Mecanismo;
  n: number;
  vm_share: number;
  ret_mediana: number | null;
  views_mediana: number | null;
  top_decil_share: number; // fração dos hooks deste mecanismo que estão no top 10% por perf
}

function aggregate(classificados: Candidato[]): {
  ranking: MecStats[];
  formatos: { formato: Formato; n: number; top_decil_share: number; views_mediana: number | null }[];
  coocorrencias: { par: string; n: number }[];
  magicas: { palavra: string; n: number }[];
  porCliente: Record<string, { cliente_id: string; top: string[] }>;
} {
  const perfCut = (() => {
    const perfs = classificados.map((c) => c.perf ?? 0).sort((a, b) => b - a);
    return perfs[Math.floor(perfs.length * 0.1)] ?? Infinity; // limiar do top decil
  })();

  const byMec = new Map<Mecanismo, Candidato[]>();
  for (const c of classificados) for (const m of c.mecanismos ?? []) byMec.set(m, [...(byMec.get(m) ?? []), c]);

  const ranking: MecStats[] = [...byMec.entries()]
    .map(([mecanismo, cs]) => ({
      mecanismo,
      n: cs.length,
      vm_share: cs.filter((c) => c.is_vm).length / cs.length,
      ret_mediana: median(cs.map((c) => c.retencao).filter((r): r is number => r != null)),
      views_mediana: median(cs.map((c) => c.views)),
      top_decil_share: cs.filter((c) => (c.perf ?? 0) >= perfCut).length / cs.length,
    }))
    .sort((a, b) => b.top_decil_share - a.top_decil_share || (b.ret_mediana ?? 0) - (a.ret_mediana ?? 0));

  // FORMATO: o teste da dúvida "Esse Cara". Se 'Personagem Central' tiver top-decil
  // share ~igual ao baseline, o formato é NEUTRO — não é o fator viral, só o enquadramento.
  const byFmt = new Map<Formato, Candidato[]>();
  for (const c of classificados) byFmt.set(c.formato ?? "Nenhum", [...(byFmt.get(c.formato ?? "Nenhum") ?? []), c]);
  const formatos = [...byFmt.entries()]
    .map(([formato, cs]) => ({
      formato,
      n: cs.length,
      top_decil_share: cs.filter((c) => (c.perf ?? 0) >= perfCut).length / cs.length,
      views_mediana: median(cs.map((c) => c.views)),
    }))
    .sort((a, b) => b.n - a.n);

  // co-ocorrência de pares de mecanismos no mesmo hook
  const pares = new Map<string, number>();
  for (const c of classificados) {
    const ms = [...new Set(c.mecanismos ?? [])].sort();
    for (let i = 0; i < ms.length; i++)
      for (let j = i + 1; j < ms.length; j++) {
        const k = `${ms[i]} + ${ms[j]}`;
        pares.set(k, (pares.get(k) ?? 0) + 1);
      }
  }
  const coocorrencias = [...pares.entries()].map(([par, n]) => ({ par, n })).sort((a, b) => b.n - a.n).slice(0, 15);

  // palavras mágicas (top decil vs geral)
  const magCount = new Map<string, number>();
  for (const c of classificados) for (const p of c.magicas ?? []) magCount.set(p, (magCount.get(p) ?? 0) + 1);
  const magicas = [...magCount.entries()].map(([palavra, n]) => ({ palavra, n })).sort((a, b) => b.n - a.n);

  // top mecanismos por cliente
  const porCliente: Record<string, { cliente_id: string; top: string[] }> = {};
  const cliMec = new Map<string, Map<Mecanismo, number>>();
  for (const c of classificados) {
    if (!c.cliente_id) continue;
    const mm = cliMec.get(c.cliente_id) ?? new Map<Mecanismo, number>();
    for (const m of c.mecanismos ?? []) mm.set(m, (mm.get(m) ?? 0) + 1);
    cliMec.set(c.cliente_id, mm);
  }
  for (const [cliente_id, mm] of cliMec) {
    const top = [...mm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m, n]) => `${m} (${n})`);
    porCliente[cliente_id] = { cliente_id, top };
  }

  return { ranking, formatos, coocorrencias, magicas, porCliente };
}

// ── Relatório ────────────────────────────────────────────────────────────────
function renderReport(sel: Candidato[], classificados: Candidato[], agg: ReturnType<typeof aggregate>): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const num = (x: number | null) => (x == null ? "—" : Math.round(x).toLocaleString("pt-BR"));
  const linhas = agg.ranking
    .map(
      (r, i) =>
        `| ${i + 1} | ${r.mecanismo} | ${r.n} | ${pct(r.top_decil_share)} | ${r.ret_mediana == null ? "—" : `${Math.round(r.ret_mediana)}%`} | ${num(r.views_mediana)} | ${pct(r.vm_share)} |`
    )
    .join("\n");
  const exemplos = agg.ranking
    .slice(0, 6)
    .map((r) => {
      const top = classificados
        .filter((c) => (c.mecanismos ?? []).includes(r.mecanismo))
        .sort((a, b) => (b.perf ?? 0) - (a.perf ?? 0))
        .slice(0, 3)
        .map((c) => `  - "${c.hook.replace(/\s+/g, " ").slice(0, 160)}"${c.is_vm ? " _(VM)_" : ""}`)
        .join("\n");
      return `**${r.mecanismo}**\n${top}`;
    })
    .join("\n\n");

  return `# Análise de Hooks — Fase 0

Gerado por \`scripts/analyze-hooks.ts\`. Base: corpus (videos + vm_video_stats).

- Candidatos com hook + stats: **${sel.length}** selecionados como alta performance (top quartil por score).
- Hooks classificados nesta rodada: **${classificados.length}** (limite ${LIMIT}).
- Score de performance = ${W_RET}·retenção_hook + ${W_VIEWS}·percentil(views) quando há retenção; senão percentil(views). Boost VM ×${VM_BOOST}.

## Leaderboard de mecanismos
Ordenado por presença no top decil de performance (o sinal mais forte), desempate por retenção mediana.

| # | Mecanismo | n | % no top decil | retenção mediana | views mediana | % VM |
|---|---|---|---|---|---|---|
${linhas}

## Exemplos reais (top performers por mecanismo)

${exemplos}

## Formato vs mecanismo — o formato é fator viral ou só enquadramento?
Baseline: no top decil por definição caem ~10% dos hooks. Se um formato tem top-decil share ≈ 10%, ele é **neutro** (não é o driver — o mecanismo é).

| Formato | n | % no top decil | views mediana |
|---|---|---|---|
${agg.formatos.map((f) => `| ${f.formato} | ${f.n} | ${pct(f.top_decil_share)} | ${num(f.views_mediana)} |`).join("\n")}

## Combinações de mecanismos que mais co-ocorrem em vencedores

${agg.coocorrencias.map((c) => `- ${c.par} — ${c.n}×`).join("\n") || "_(nenhuma)_"}

## Palavras mágicas mais frequentes

${agg.magicas.map((m) => `- ${m.palavra} — ${m.n}×`).join("\n") || "_(nenhuma)_"}

## Mecanismos dominantes por cliente (amostra)

${Object.values(agg.porCliente).slice(0, 20).map((c) => `- \`${c.cliente_id.slice(0, 8)}\`: ${c.top.join(", ")}`).join("\n") || "_(sem cliente)_"}

---
_Próximo passo (Fase 1): usar este leaderboard + os fundamentos psicológicos para reescrever \`playbooks/hook.md\` ordenado por performance, com revisão humana antes de versionar em \`vm_playbooks\`._
`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const playbook = await fs.readFile(path.join(process.cwd(), "playbooks", "hook.md"), "utf8");

  console.log("carregando corpus...");
  const [stats, videos] = await Promise.all([fetchStats(), fetchVideos()]);

  // junta em JS (evita depender de embedding de FK no PostgREST entre relação e MV)
  const candidatos: Candidato[] = [];
  for (const v of videos) {
    const s = stats.get(v.id);
    if (!s) continue; // sem stats = sem sinal de performance
    candidatos.push({
      id: v.id, hook: v.hook, is_vm: v.is_vm, cliente_id: s.cliente_id,
      views: s.views, retencao: s.retencao, categorias: v.categorias,
    });
  }

  // score de performance. Ambos os sinais entram como PERCENTIL (0-1): robusto à
  // cauda longa das views e ao fato de retencao_hook não ser um % limpo 0-100
  // (o corpus tem valores >100, ex. replays) — normalizar por escala fixa distorceria.
  const viewsRank = percentileRanks(candidatos.map((c) => c.views));
  const retRank = percentileRanks(candidatos.filter((c) => c.retencao != null).map((c) => c.retencao as number));
  for (const c of candidatos) {
    const vr = viewsRank.get(c.views) ?? 0;
    const base = c.retencao != null ? W_RET * (retRank.get(c.retencao) ?? 0) + W_VIEWS * vr : vr;
    c.perf = base * (c.is_vm ? VM_BOOST : 1);
    c.magicas = PALAVRAS_MAGICAS.filter((p) => c.hook.toLowerCase().includes(p));
  }

  // seleção: top quartil por perf
  const sorted = [...candidatos].sort((a, b) => (b.perf ?? 0) - (a.perf ?? 0));
  const cut = Math.floor(sorted.length * (1 - TOP_QUANTILE));
  const selecionados = sorted.slice(0, cut);

  console.log(
    `corpus: ${candidatos.length} candidatos (com hook+stats) · ${candidatos.filter((c) => c.retencao != null).length} com retenção · ${candidatos.filter((c) => c.is_vm).length} VM`
  );
  console.log(`alta performance (top ${Math.round(TOP_QUANTILE * 100)}%): ${selecionados.length} · classificando até ${LIMIT}`);

  if (DRY_RUN) {
    const p90 = sorted[Math.floor(sorted.length * 0.1)]?.perf ?? 0;
    console.log(`[dry-run] perf do top decil ≥ ${p90.toFixed(3)}. Nenhuma chamada de LLM, nenhum arquivo escrito.`);
    console.log("[dry-run] amostra dos 5 melhores hooks:");
    for (const c of sorted.slice(0, 5))
      console.log(`  perf ${c.perf?.toFixed(3)} · views ${c.views} · ret ${c.retencao ?? "—"} · ${c.is_vm ? "VM · " : ""}"${c.hook.slice(0, 90)}"`);
    return;
  }

  // classifica os N melhores (prioriza os de maior performance)
  const paraClassificar = selecionados.slice(0, LIMIT);
  const lotes: Candidato[][] = [];
  for (let i = 0; i < paraClassificar.length; i += BATCH) lotes.push(paraClassificar.slice(i, i + BATCH));
  let feitos = 0;
  await runPool(lotes, CONCURRENCY, async (lote) => {
    await classifyBatch(playbook, lote);
    feitos += lote.length;
    console.log(`classificados ${feitos}/${paraClassificar.length}`);
  });

  const classificados = paraClassificar.filter((c) => c.mecanismos?.length);
  const agg = aggregate(classificados);

  if (PERSIST) {
    // upsert em lotes (video_id PK → re-rodar atualiza a classificação)
    const linhas = classificados.map((c) => ({
      video_id: c.id, mecanismos: c.mecanismos, formato: c.formato ?? "Nenhum", updated_at: new Date().toISOString(),
    }));
    for (let i = 0; i < linhas.length; i += 500) {
      const { error } = await appDb.from("vm_hook_classifications").upsert(linhas.slice(i, i + 500), { onConflict: "video_id" });
      if (error) throw new Error(`upsert vm_hook_classifications: ${error.message}`);
    }
    console.log(`persistidas ${linhas.length} classificações em vm_hook_classifications`);
  }

  const mdPath = path.join(process.cwd(), `${OUT}.md`);
  const jsonPath = path.join(process.cwd(), `${OUT}.json`);
  await fs.writeFile(mdPath, renderReport(selecionados, classificados, agg), "utf8");
  await fs.writeFile(
    jsonPath,
    JSON.stringify(
      {
        gerado_em: new Date().toISOString(),
        pesos: { W_RET, W_VIEWS, VM_BOOST, TOP_QUANTILE },
        selecionados: selecionados.length,
        classificados: classificados.length,
        ranking: agg.ranking,
        formatos: agg.formatos,
        coocorrencias: agg.coocorrencias,
        magicas: agg.magicas,
        por_cliente: agg.porCliente,
        // per-hook labels persistidos — permite re-fatiar sem re-rodar a LLM
        hooks: classificados.map((c) => ({
          hook: c.hook, mecanismos: c.mecanismos, formato: c.formato,
          perf: Number((c.perf ?? 0).toFixed(3)), is_vm: c.is_vm, views: c.views, retencao: c.retencao,
        })),
      },
      null,
      2
    ),
    "utf8"
  );
  console.log(`\nrelatório: ${mdPath}\nleaderboard: ${jsonPath}`);
}

main().catch((e) => {
  console.error("analyze-hooks falhou:", e);
  process.exit(1);
});
