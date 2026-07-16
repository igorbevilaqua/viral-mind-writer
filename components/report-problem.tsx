"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { reportarProblema } from "@/lib/actions";

// "Reportar problema" sempre visível no topo. Amarra ao id da sessão quando a URL é
// /sessions/<id>; fora de uma sessão, reporta um problema geral (sem sessão).
export default function ReportProblem() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const m = pathname.match(/^\/sessions\/([^/]+)/);
  const sessionId = m ? m[1] : null;

  const limparImagem = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImagem(null);
    setPreview(null);
  };

  // Colar print: pega a primeira imagem do clipboard (Ctrl/Cmd+V).
  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (!file) return;
    e.preventDefault();
    if (preview) URL.revokeObjectURL(preview);
    setImagem(file);
    setPreview(URL.createObjectURL(file));
  };

  const enviar = () =>
    startTransition(async () => {
      try {
        setError(null);
        await reportarProblema(sessionId, descricao, imagem);
        setSent(true);
        setDescricao("");
        limparImagem();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });

  return (
    <>
      <button
        onClick={() => {
          setSent(false);
          setError(null);
          dialogRef.current?.showModal();
        }}
        className="inline-flex items-center gap-1.5 text-white/55 hover:text-white cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 4.8v3.6M8 10.8v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        Reportar problema
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="backdrop:bg-black/60 backdrop:backdrop-blur-sm m-auto w-[min(480px,92vw)] rounded-2xl border border-gold/30 bg-[#161410] text-[#ededf0] p-0 shadow-2xl"
      >
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="kicker text-gold">REPORTAR PROBLEMA</span>
            <button
              onClick={() => dialogRef.current?.close()}
              aria-label="Fechar"
              className="ml-auto text-white/40 hover:text-white/80 text-lg leading-none"
            >
              ×
            </button>
          </div>
          {sent ? (
            <p className="text-sm text-emerald-300">Recebido — a equipe vê isso no cockpit. Obrigado!</p>
          ) : (
            <>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                onPaste={onPaste}
                rows={4}
                autoFocus
                placeholder="O que deu errado? Quanto mais detalhe, mais rápido resolvemos. Dica: dê um print (PrtSc) e cole aqui com Ctrl+V."
                className="w-full rounded-[10px] border border-white/[.12] bg-transparent px-3.5 py-2.5 text-[13px] outline-none placeholder:text-white/35 focus:border-gold/40"
              />
              {preview ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="print colado" className="max-h-40 rounded-lg border border-white/15" />
                  <button
                    type="button"
                    onClick={limparImagem}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-xs text-white/80 hover:text-white"
                    aria-label="Remover print"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-white/35">Cole um print com Ctrl+V (opcional).</p>
              )}
              {error && <p className="text-xs text-red-300">{error}</p>}
              <button
                onClick={enviar}
                disabled={pending || !descricao.trim()}
                className="btn-gold rounded-[10px] px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
              >
                {pending ? "Enviando..." : "Enviar"}
              </button>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
