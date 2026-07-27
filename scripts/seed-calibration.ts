// Cold-start da calibração (Fatia 1): pares MESMO TEMA, mecanismos diferentes. Pega um
// hook real de alta performance e gera uma alternativa do MESMO assunto com outro
// mecanismo (dois hooks reais nunca são do mesmo tema). Assim a comparação é sobre o
// mecanismo, não sobre o assunto. Custo: 1 chamada de LLM por par (one-time).
// Rodar: npx tsx --env-file=.env.local scripts/seed-calibration.ts [--por-cliente N] [--max M]
import { appDb, viralData } from "../lib/db";
import { dedash } from "../lib/pipeline/slop-lint";
import { generateMechanismAlternative } from "../lib/calibration-probe";
import type { CalibOption } from "../lib/calibration";

const nIdx = process.argv.indexOf("--por-cliente");
const POR_CLIENTE = nIdx >= 0 ? Number(process.argv[nIdx + 1]) : 3;
const mIdx = process.argv.indexOf("--max");
const MAX = mIdx >= 0 ? Number(process.argv[mIdx + 1]) : 60;

const opt = (hook: string, mecanismo: string): CalibOption => {
  const texto = dedash(hook);
  return { texto, mecanismo, atributos: { comprimento: texto.length > 120 ? "longo" : "curto" } };
};

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

  // seeds: os melhores hooks reais por cliente (dedupe por texto), até POR_CLIENTE cada
  const porCliente = new Map<string, { hook: string; mec: string; views: number }[]>();
  for (const c of cls) {
    const hook = hookById.get(c.video_id);
    const meta = cliByVideo.get(c.video_id);
    const mec = Array.isArray(c.mecanismos) ? (c.mecanismos as string[])[0] : null;
    if (!hook || !meta?.cliente || !mec || mec === "Outro") continue;
    porCliente.set(meta.cliente, [...(porCliente.get(meta.cliente) ?? []), { hook, mec, views: meta.views }]);
  }
  const seeds: { hook: string; mec: string; clientId: string }[] = [];
  for (const [cliente, lista] of porCliente) {
    const vistos = new Set<string>();
    const top = lista.sort((a, b) => b.views - a.views).filter((x) => !vistos.has(x.hook) && vistos.add(x.hook)).slice(0, POR_CLIENTE);
    for (const s of top) seeds.push({ hook: s.hook, mec: s.mec, clientId: cliente });
  }
  const alvo = seeds.slice(0, MAX); // cap global (seeds já vêm intercalados por cliente)

  // gera a alternativa MESMO TEMA (LLM), com pool de concorrência
  type Par = { dimension: string; client_id: string; axis: string; option_a: CalibOption; option_b: CalibOption; source: string };
  const pares: Par[] = [];
  let idx = 0, feitos = 0;
  async function worker() {
    for (;;) {
      const i = idx++;
      if (i >= alvo.length) return;
      const s = alvo[i];
      try {
        const alt = await generateMechanismAlternative(dedash(s.hook), s.mec);
        if (alt) pares.push({ dimension: "hook", client_id: s.clientId, axis: "mecanismo", option_a: opt(s.hook, s.mec), option_b: opt(alt.variante, alt.mecanismo), source: "corpus" });
      } catch (e) {
        console.error("alternativa falhou, pulando", e);
      }
      if (++feitos % 10 === 0) console.log(`gerados ${feitos}/${alvo.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, alvo.length) }, worker));

  // idempotente: limpa os corpus antigos (regeneráveis) antes de inserir
  await appDb.from("vm_calibration_pairs").delete().eq("source", "corpus").eq("dimension", "hook");
  for (let i = 0; i < pares.length; i += 500) {
    const { error: insErr } = await appDb.from("vm_calibration_pairs").insert(pares.slice(i, i + 500));
    if (insErr) throw new Error(`insert pairs: ${insErr.message}`);
  }
  console.log(`${pares.length} pares de corpus (mesmo tema, mecanismos diferentes) criados de ${alvo.length} hooks-semente`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
