// Lista de insights do cliente — materializada semanalmente pelo ETL em vm_viral_insights.
// Rankeada por score (performance + recência + relevância); o mais forte vem destacado no topo.
import type { ClientInsightPayload } from "@/lib/pipeline/types";

export interface InsightRowView {
  insight_type: string;
  payload: ClientInsightPayload & { ordem?: number };
  computed_at?: string | null;
}

const CAT_BADGE: Record<string, { label: string; cls: string }> = {
  client_tema: { label: "Tema", cls: "border-indigo-500/40 bg-indigo-500/[.08] text-indigo-300" },
  client_storytelling: { label: "Storytelling", cls: "border-gold/45 bg-gold/[.08] text-gold" },
  client_hook: { label: "Hook", cls: "border-sky-500/40 bg-sky-500/[.08] text-sky-300" },
  client_comando: { label: "Comando", cls: "border-emerald-500/40 bg-emerald-500/[.08] text-emerald-300" },
};

function relDays(iso?: string | null) {
  if (!iso) return null;
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  return days < 1 ? "hoje" : `há ${days} ${days === 1 ? "dia" : "dias"}`;
}

export default function ClientInsightsList({ insights }: { insights: InsightRowView[] }) {
  const stats = insights
    .filter((i) => i.insight_type !== "client_geral" && i.payload?.titulo)
    .sort((a, b) => (b.payload.score ?? 0) - (a.payload.score ?? 0));
  const gerais = insights
    .filter((i) => i.insight_type === "client_geral" && i.payload?.titulo)
    .sort((a, b) => (a.payload.ordem ?? 0) - (b.payload.ordem ?? 0));
  const computedAt = insights[0]?.computed_at;

  if (!stats.length && !gerais.length) {
    return (
      <p className="text-[13px] text-white/40">
        Ainda sem insights materializados para este cliente — eles são extraídos automaticamente toda segunda-feira pelo
        ETL (ou rode <code className="text-white/60">npm run etl</code>).
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {computedAt && <p className="text-[11px] text-white/30">extraídos {relDays(computedAt)} · atualização automática semanal</p>}

      <div className="space-y-2.5">
        {stats.map((ins, i) => {
          const p = ins.payload;
          const badge = CAT_BADGE[ins.insight_type] ?? { label: ins.insight_type, cls: "border-white/20 text-white/60" };
          const destaque = !!p.destaque;
          return (
            <div
              key={i}
              className={`rounded-[14px] border px-4 py-3.5 ${
                destaque ? "border-gold/60 bg-gold/[.07]" : "border-white/[.08] bg-white/[.02]"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {destaque && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-2.5 py-0.5 text-[10.5px] font-medium text-gold">
                    <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1.5 10 6l4.8.4-3.6 3.2 1.1 4.7L8 11.8l-4.3 2.5 1.1-4.7L1.2 6.4 6 6 8 1.5Z" />
                    </svg>
                    Insight mais forte
                  </span>
                )}
                <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium ${badge.cls}`}>{badge.label}</span>
                <span className="ml-auto font-mono text-[11px] text-white/35" title="score: performance × recência × relevância">
                  {(p.score ?? 0).toFixed(2)}
                </span>
              </div>
              <p className={`mt-2 text-[14px] font-medium ${destaque ? "text-cream" : "text-white/85"}`}>{p.titulo}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">{p.descricao}</p>
            </div>
          );
        })}
      </div>

      {gerais.length > 0 && (
        <div className="rounded-[14px] border border-white/[.08] bg-white/[.02] px-4 py-4">
          <div className="kicker text-gold text-[10px]">BOAS PRÁTICAS PARA OS PRÓXIMOS ROTEIROS</div>
          <div className="mt-3 space-y-3">
            {gerais.map((g, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="font-display text-gold/70 shrink-0">{i + 1}.</span>
                <div>
                  <p className="text-[13.5px] font-medium text-white/85">{g.payload.titulo}</p>
                  <p className="text-[12.5px] leading-relaxed text-white/55 mt-0.5">{g.payload.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
