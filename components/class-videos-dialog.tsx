"use client";

// Dialog de drill-down compartilhado (painel DADOS + lista de INSIGHTS):
// lista os vídeos (título + link) que compõem um grupo de tema/storytelling/
// hook/comando via getClassVideos (RPC vm_client_class_videos).

import { useRef, useState } from "react";
import { getClassVideos, type ClassVideo } from "@/lib/actions";

export type ClassDim = "tema" | "storytelling" | "hook" | "comando";

export const fmt = (n: number | null | undefined) =>
  n == null
    ? "—"
    : n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
        ? `${Math.round(n / 1000)}k`
        : String(Math.round(n));

export const pretty = (t: string) => {
  const s = t.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function useClassVideosDialog(clientId: string) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [sel, setSel] = useState<{ dim: ClassDim; tipo: string } | null>(null);
  const [videos, setVideos] = useState<ClassVideo[] | null>(null); // null = carregando
  const [erro, setErro] = useState<string | null>(null);

  const open = (dim: ClassDim, tipo: string) => {
    setSel({ dim, tipo });
    setVideos(null);
    setErro(null);
    dialogRef.current?.showModal();
    getClassVideos(clientId, dim, tipo)
      .then(setVideos)
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
  };

  const dialog = (
    /* <dialog> nativo (padrão do client-prefs-editor): Esc e backdrop fecham de graça */
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
  );

  return { open, dialog };
}
