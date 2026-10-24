// Plano 026, Task D: a medição mensal do preditor (lib/preditor/medir.ts). Só leitura, custo zero.
// Chamada pelo .github/workflows/preditor-mensal.yml no dia 5; ?mes=AAAA-MM mede outro mês.
import { medirMes } from "@/lib/preditor/medir";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // fail-closed: sem secret configurado, a rota não roda (é pública no middleware)
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const mes = new URL(req.url).searchParams.get("mes");
  if (mes && !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return Response.json({ erro: "mes precisa ser AAAA-MM" }, { status: 400 });
  return Response.json(await medirMes(mes ?? undefined));
}
