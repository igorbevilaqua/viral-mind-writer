"use client";

// Painel de dados do cliente — calculado ao vivo via RPC vm_client_panel.
// Cada linha de classificação é clicável: abre um <dialog> com os vídeos
// (título + link) que compõem aquele grupo (RPC vm_client_class_videos).

import { useRef, useState } from "react";
import { getClassVideos, type ClassVideo } from "@/lib/actions";

type Dim = "tema" | "storytelling" | "hook" | "comando";

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

function ClassList({
  label,
  rows,
  metric,
  onPick,
}: {
  label: string;
  rows: ClassRow[];
  metric?: "seguidores";
  onPick: (row: ClassRow) => void;
}) {
  if (!rows.length) return null;
  return (
    <div className="rounded-[14px] border border-white/[.08] bg-white/[.02] px-4 py-3.5">
      <div className="kicker text-gold text-[10px]">{label}</div>
      <div className="mt-2.5 space-y-0.5">
        {rows.map((r, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(r)}
            title="Ver vídeos deste grupo"
            className="w-full cursor-pointer flex items-baseline gap-2 text-[12.5px] rounded-md px-1.5 py-0.5 -mx-1.5 hover:bg-white/[.05] transition-colors text-left"
          >
            <span className="text-white/80 truncate underline decoration-dotted decoration-white/25 underline-offset-2">
              {pretty(r.tipo)}
            </span>
            <span className="ml-auto shrink-0 font-mono text-[11px] text-white/40">{r.qtd}x</span>
            <span className="shrink-0 font-mono text-[11px] text-gold/80 w-[52px] text-right">
              {metric === "seguidores"
                ? r.media_seguidores != null
                  ? `+${fmt(r.media_seguidores)}`
                  : "—" /* comando sem dado de conversão nunca mostra views */
                : fmt(r.media_views)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ClientDataPanel({ panel, clientId }: { panel: ClientPanel; clientId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [sel, setSel] = useState<{ dim: Dim; tipo: string } | null>(null);
  const [videos, setVideos] = useState<ClassVideo[] | null>(null); // null = carregando
  const [erro, setErro] = useState<string | null>(null);

  const pick = (dim: Dim) => (row: ClassRow) => {
    setSel({ dim, tipo: row.tipo });
    setVideos(null);
    setErro(null);
    dialogRef.current?.showModal();
    getClassVideos(clientId, dim, row.tipo)
      .then(setVideos)
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
  };

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
        <ClassList label="TEMAS MAIS USADOS · MÉDIA DE VIEWS" rows={panel.top_temas} onPick={pick("tema")} />
        <ClassList label="ESTRUTURAS DE STORYTELLING" rows={panel.top_storytelling} onPick={pick("storytelling")} />
        <ClassList label="TIPOS DE HOOK" rows={panel.top_hook} onPick={pick("hook")} />
        <ClassList label="TIPOS DE COMANDO · SEGUIDORES" rows={panel.top_comando} metric="seguidores" onPick={pick("comando")} />
      </div>

      <p className="text-[11px] text-white/30">
        Views ao vivo do corpus. Classificações de storytelling/hook/comando baseadas nos {panel.videos_analisados} vídeos
        analisados (de {panel.total_videos}); temas cobrem quase todo o acervo. Clique em qualquer item para ver os vídeos.
      </p>

      {/* <dialog> nativo (padrão do client-prefs-editor): Esc e backdrop fecham de graça */}
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="backdrop:bg-black/70 backdrop:backdrop-blur-sm m-auto w-[min(680px,95vw)] max-h-[80vh] open:flex flex-col rounded-[20px] border border-gold/30 bg-[#141416] text-[#ededf0] p-0"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[.08] bg-gradient-to-b from-gold/[.06] to-transparent">
          <div className="min-w-0">
            <div className="kicker text-gold text-[10px]">EXEMPLOS · {sel?.dim.toUpperCase()}</div>
            <div className="text-[15px] font-medium truncate">{sel ? pretty(sel.tipo) : ""}</div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="ml-auto shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[.06]"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {erro ? (
            <p className="text-[13px] text-red-300">{erro}</p>
          ) : videos === null ? (
            <p className="text-[13px] text-white/40 animate-pulse">Buscando vídeos…</p>
          ) : videos.length === 0 ? (
            <p className="text-[13px] text-white/40">Nenhum vídeo encontrado para este grupo.</p>
          ) : (
            <div className="space-y-1">
              {videos.map((v, i) => (
                <div key={i} className="flex items-baseline gap-2.5 text-[13px] rounded-md px-2 py-1.5 -mx-2 hover:bg-white/[.04]">
                  <span className="min-w-0 truncate">
                    {v.link_video ? (
                      <a
                        href={v.link_video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/85 hover:text-gold underline decoration-white/20 underline-offset-2"
                      >
                        {v.titulo ?? v.link_video}
                      </a>
                    ) : (
                      <span className="text-white/70">{v.titulo ?? "(sem título)"}</span>
                    )}
                  </span>
                  {v.vm_script && (
                    <span className="shrink-0 rounded-full border border-gold/40 bg-gold/[.08] px-1.5 py-px font-mono text-[9px] text-gold">
                      VM
                    </span>
                  )}
                  {v.plataforma && <span className="shrink-0 text-[10.5px] text-white/35">{v.plataforma}</span>}
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-white/40">
                    {v.data_publicacao ? new Date(v.data_publicacao + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-gold/80 w-[52px] text-right">{fmt(v.views)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
