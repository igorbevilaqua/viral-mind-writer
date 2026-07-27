import { runWeeklyEtl } from "@/lib/etl";
import { runMonthlyCurator, runHookPlaybookCurator, type CuratorResult, type HookCuratorResult } from "@/lib/curator";
import { runProbeTopup } from "@/lib/calibration-probe";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // fail-closed: sem secret configurado, a rota não roda (é pública no middleware)
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const result = await runWeeklyEtl();
  // WP-E.6: curador mensal pega carona no cron semanal (roda no máx 1x/30 dias).
  // Melhor esforço — falha do curador nunca derruba o resultado do ETL.
  let curador: CuratorResult;
  try {
    curador = await runMonthlyCurator();
  } catch (e) {
    curador = { ran: false, proposed: 0, reason: e instanceof Error ? e.message : String(e) };
  }
  // Fase 4: curador do playbook de hook (mesma carona no cron, também 1x/30 dias, best-effort)
  let hookPlaybook: HookCuratorResult;
  try {
    hookPlaybook = await runHookPlaybookCurator();
  } catch (e) {
    hookPlaybook = { ran: false, proposed: 0, reason: e instanceof Error ? e.message : String(e) };
  }
  // Fatia 2: aprofundamento de calibração (baseline semanal; a UI também topa sob demanda)
  let probes = 0;
  try {
    probes = await runProbeTopup(6);
  } catch (e) {
    console.error("topup de probes no cron falhou", e);
  }
  return Response.json({ ...result, curador, hookPlaybook, calibrationProbes: probes });
}
