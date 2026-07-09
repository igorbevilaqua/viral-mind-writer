import { runWeeklyEtl } from "@/lib/etl";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // fail-closed: sem secret configurado, a rota não roda (é pública no middleware)
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const result = await runWeeklyEtl();
  return Response.json(result);
}
