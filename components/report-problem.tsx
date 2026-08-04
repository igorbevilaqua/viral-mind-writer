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

  const usarImagem = (file: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setImagem(file);
    setPreview(URL.createObjectURL(file));
  };

  // Colar print: pega a primeira imagem do clipboard (Ctrl/Cmd+V).
  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (!file) return;
    e.preventDefault();
    usarImagem(file);
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
        aria-label="Reportar problema"
        className="inline-flex items-center gap-1.5 text-white/55 hover:text-white cursor-pointer p-1 -m-1"
      >
        <svg className="w-[17px] h-[17px] sm:w-3 sm:h-3" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 4.8v3.6M8 10.8v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Reportar problema</span>
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="backdrop:bg-black/60 backdrop:backdrop-blur-sm m-auto w-[min(480px,92vw)] max-h-[85dvh] overflow-y-auto rounded-2xl border border-gold/30 bg-[#161410] text-[#ededf0] p-0 shadow-2xl"
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
            <p className="text-sm text-emerald-300">Recebido! A equipe vê isso no cockpit. Obrigado!</p>
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
                // No celular não existe PrtSc/Ctrl+V: o print vem da galeria ou da câmera.
                <label className="inline-flex items-center gap-2 cursor-pointer rounded-[10px] border border-white/[.14] px-3.5 py-2 text-[12.5px] text-white/60 hover:border-gold/40 hover:text-white/85 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) usarImagem(f);
                    }}
                  />
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="8" cy="8.5" r="2.2" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5.5 4l1-1.5h3l1 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                  Anexar print <span className="hidden sm:inline text-white/35">(ou cole com Ctrl+V)</span>
                </label>
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
