// Cold-start da calibração (Fatia 1): cria pares de hooks REAIS do corpus (mesmo
// cliente, mecanismos diferentes) a partir de vm_hook_classifications. Custo zero,
// dá o que calibrar no dia 1 antes de o harvest da geração acumular.
// Rodar: npx tsx --env-file=.env.local scripts/seed-calibration.ts [--por-cliente N]
import { appDb, viralData } from "../lib/db";
import type { CalibOption } from "../lib/calibration";

const nIdx = process.argv.indexOf("--por-cliente");
const POR_CLIENTE = nIdx >= 0 ? Number(process.argv[nIdx + 1]) : 6;

const opt = (hook: string, mecanismo: string): CalibOption => ({
  texto: hook,
  mecanismo,
  atributos: { comprimento: hook.length > 120 ? "longo" : "curto" },
});

async function main() {
  const { data: cls, error } = await appDb.from("vm_hook_classifications").select("video_id, mecanismos");
  if (error) throw new Error(`vm_hook_classifications: ${error.message} (aplicar migration 0020)`);
  if (!cls?.length) throw new Error("sem classificações — rode analyze-hooks.ts --persist antes");

  // hook + cliente + views de cada vídeo classificado
  const ids = cls.map((c) => c.video_id);
  const hookById = new Map<string, string>();
  const cliByVideo = new Map<string, { cliente: string | null; views: number }>();
  // lotes pequenos: .in() vira query string; 800 UUIDs numa GET estoura o limite de URL
  for (let i = 0; i < ids.length; i += 150) {
    const slice = ids.slice(i, i + 150);
    const [vids, stats] = await Promise.all([
      viralData.from("videos").select("id, hook").in("id", slice),
      viralData.from("vm_video_stats").select("video_id, cliente_id, views_total").in("video_id", slice),
    ]);
    if (vids.error) throw new Error(`videos: ${vids.error.message}`);
    if (stats.error) throw new Error(`vm_video_stats: ${stats.error.message}`);
    for (const v of vids.data ?? []) if (v.hook) hookById.set(v.id, v.hook.trim());
    for (const s of stats.data ?? []) cliByVideo.set(s.video_id, { cliente: s.cliente_id ?? null, views: Number(s.views_total) || 0 });
  }

  // por cliente: melhor hook (por views) de cada mecanismo
  const porCliente = new Map<string, Map<string, { hook: string; views: number }>>();
  for (const c of cls) {
    const hook = hookById.get(c.video_id);
    const meta = cliByVideo.get(c.video_id);
    const mec = Array.isArray(c.mecanismos) ? (c.mecanismos as string[])[0] : null;
    if (!hook || !meta?.cliente || !mec || mec === "Outro") continue;
    const byMec = porCliente.get(meta.cliente) ?? new Map();
    const cur = byMec.get(mec);
    if (!cur || meta.views > cur.views) byMec.set(mec, { hook, views: meta.views });
    porCliente.set(meta.cliente, byMec);
  }

  const pares: { dimension: string; client_id: string; axis: string; option_a: CalibOption; option_b: CalibOption; source: string }[] = [];
  for (const [cliente, byMec] of porCliente) {
    const mecs = [...byMec.entries()].sort((a, b) => b[1].views - a[1].views); // mecanismos por views do melhor hook
    for (let i = 0; i + 1 < mecs.length && pares.length < 10_000; i += 2) {
      if (pares.filter((p) => p.client_id === cliente).length >= POR_CLIENTE) break;
      const [ma, a] = mecs[i];
      const [mb, b] = mecs[i + 1];
      pares.push({ dimension: "hook", client_id: cliente, axis: "mecanismo", option_a: opt(a.hook, ma), option_b: opt(b.hook, mb), source: "corpus" });
    }
  }

  // idempotente: limpa os corpus antigos (regeneráveis) antes de inserir
  await appDb.from("vm_calibration_pairs").delete().eq("source", "corpus").eq("dimension", "hook");
  for (let i = 0; i < pares.length; i += 500) {
    const { error: insErr } = await appDb.from("vm_calibration_pairs").insert(pares.slice(i, i + 500));
    if (insErr) throw new Error(`insert pairs: ${insErr.message}`);
  }
  console.log(`${pares.length} pares de corpus criados (${porCliente.size} clientes, até ${POR_CLIENTE}/cliente)`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
