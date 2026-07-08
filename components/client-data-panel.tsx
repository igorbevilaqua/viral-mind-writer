// Painel de dados do cliente — calculado ao vivo via RPC vm_client_panel (server component).

interface ClassRow {
  tipo: string;
  qtd: number;
  media_views: number | null;
  media_seguidores?: number | null;
}

export interface ClientPanel {
  total_videos: number;
  videos_analisados: number;
  videos_30d: number;
  media_views_30d: number | null;
  media_views_geral: number | null;
  plataformas: { plataforma: string; username: string | null; seguidores: number | null }[];
  top_temas: ClassRow[];
  top_storytelling: ClassRow[];
  top_hook: ClassRow[];
  top_comando: ClassRow[];
}

const fmt = (n: number | null | undefined) =>
  n == null
    ? "—"
    : n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
        ? `${Math.round(n / 1000)}k`
        : String(Math.round(n));

const pretty = (t: string) => {
  const s = t.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[14px] border border-white/[.08] bg-white/[.02] px-4 py-3.5">
      <div className="kicker text-white/40 text-[10px]">{label}</div>
      <div className="font-display text-[26px] leading-tight text-cream mt-1">{value}</div>
      {hint && <div className="text-[11px] text-white/35 mt-0.5">{hint}</div>}
    </div>
  );
}

function ClassList({ label, rows, metric }: { label: string; rows: ClassRow[]; metric?: "seguidores" }) {
  if (!rows.length) return null;
  return (
    <div className="rounded-[14px] border border-white/[.08] bg-white/[.02] px-4 py-3.5">
      <div className="kicker text-gold text-[10px]">{label}</div>
      <div className="mt-2.5 space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline gap-2 text-[12.5px]">
            <span className="text-white/80 truncate">{pretty(r.tipo)}</span>
            <span className="ml-auto shrink-0 font-mono text-[11px] text-white/40">{r.qtd}x</span>
            <span className="shrink-0 font-mono text-[11px] text-gold/80 w-[52px] text-right">
              {metric === "seguidores"
                ? r.media_seguidores != null
                  ? `+${fmt(r.media_seguidores)}`
                  : "—" /* comando sem dado de conversão nunca mostra views */
                : fmt(r.media_views)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientDataPanel({ panel }: { panel: ClientPanel }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile
          label="MÉDIA DE VIEWS · 30 DIAS"
          value={fmt(panel.media_views_30d)}
          hint={`${panel.videos_30d} vídeos publicados`}
        />
        <StatTile label="MÉDIA DE VIEWS · GERAL" value={fmt(panel.media_views_geral)} hint={`${panel.total_videos} vídeos no total`} />
        <StatTile
          label="VÍDEOS CLASSIFICADOS"
          value={String(panel.videos_analisados)}
          hint={`de ${panel.total_videos} (base das análises abaixo)`}
        />
      </div>

      {panel.plataformas.length > 0 && (
        <div className="rounded-[14px] border border-white/[.08] bg-white/[.02] px-4 py-3.5">
          <div className="kicker text-white/40 text-[10px]">MÍDIAS SOCIAIS</div>
          <div className="flex flex-wrap gap-2 mt-2.5">
            {panel.plataformas.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/35 bg-indigo-500/[.07] px-3 py-1.5 text-[12px] text-indigo-200"
              >
                {p.plataforma}
                {p.username && <span className="text-indigo-300/70">@{p.username}</span>}
                {p.seguidores != null && p.seguidores > 0 && (
                  <span className="font-mono text-[11px] text-white/50">{fmt(p.seguidores)}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <ClassList label="TEMAS MAIS USADOS · MÉDIA DE VIEWS" rows={panel.top_temas} />
        <ClassList label="ESTRUTURAS DE STORYTELLING" rows={panel.top_storytelling} />
        <ClassList label="TIPOS DE HOOK" rows={panel.top_hook} />
        <ClassList label="TIPOS DE COMANDO · SEGUIDORES" rows={panel.top_comando} metric="seguidores" />
      </div>

      <p className="text-[11px] text-white/30">
        Views ao vivo do corpus. Classificações de storytelling/hook/comando baseadas nos {panel.videos_analisados} vídeos
        analisados (de {panel.total_videos}); temas cobrem quase todo o acervo.
      </p>
    </div>
  );
}
