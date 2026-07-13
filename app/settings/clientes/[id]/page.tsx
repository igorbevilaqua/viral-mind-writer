import Link from "next/link";
import { notFound } from "next/navigation";
import { appDb, viralData } from "@/lib/db";
import ClientPrefsEditor from "@/components/client-prefs-editor";
import ClientDataPanel, { type ClientPanel } from "@/components/client-data-panel";
import ClientInsightsList, { type InsightRowView } from "@/components/client-insights-list";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: cliente }, { data: prefs }, panelRes, { data: insights }] = await Promise.all([
    appDb.from("clientes").select("id, nome").eq("id", id).maybeSingle(),
    appDb.from("vm_client_preferences").select("*").eq("client_id", id).maybeSingle(),
    viralData.rpc("vm_client_panel", { p_cliente_id: id }),
    appDb
      .from("vm_viral_insights")
      .select("insight_type, payload, computed_at")
      .eq("scope", `client:${id}`)
      .like("insight_type", "client_%"),
  ]);
  if (!cliente) notFound();

  const panel = (panelRes.data ?? null) as ClientPanel | null;

  return (
    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-6 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Link href="/settings/clientes" className="hover:text-white/70">
            Clientes
          </Link>
          <span className="text-white/25">/</span>
          <span className="text-white/60">{cliente.nome}</span>
        </div>
        <h1 className="font-display text-3xl sm:text-[34px] font-medium text-ivory mt-3">{cliente.nome}</h1>
      </div>

      <section>
        <div className="flex items-baseline gap-2.5 mb-3">
          <span className="kicker text-white/45">PREFERÊNCIAS</span>
          <span className="text-xs text-white/30">restrições invioláveis nos roteiros</span>
        </div>
        <ClientPrefsEditor client={cliente} prefs={prefs ?? null} />
      </section>

      <section>
        <div className="flex items-baseline gap-2.5 mb-3">
          <span className="kicker text-white/45">DADOS</span>
          <span className="text-xs text-white/30">ao vivo, direto do corpus</span>
        </div>
        {panel ? <ClientDataPanel panel={panel} clientId={id} /> : <p className="text-[13px] text-white/40">Sem dados no corpus para este cliente.</p>}
      </section>

      <section>
        <div className="flex items-baseline gap-2.5 mb-3">
          <span className="kicker text-white/45">INSIGHTS</span>
          <span className="text-xs text-white/30">o que está funcionando · alimenta o gerador de roteiros</span>
        </div>
        <ClientInsightsList insights={(insights ?? []) as InsightRowView[]} />
      </section>
    </div>
  );
}
