"use client";

import { useState } from "react";

// ponytail: render de leitura duplicado do ScriptCard de propósito — ScriptCard é
// pesado (edição inline, Bob, ações). Aqui é só leitura + copiar; ~60 linhas < risco de refatorar.

interface PublicScriptData {
  headline: string | null;
  hook: string | null;
  roteiro: string;
  comando: string | null;
  fontes: string | null;
}

const fullText = (s: PublicScriptData) =>
  [s.headline, s.roteiro, s.comando, s.fontes ? `FONTES:\n${s.fontes}` : null].filter(Boolean).join("\n\n");

function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-[5px] text-xs text-white/65 hover:border-gold/50 hover:text-cream transition-colors"
    >
      {copied ? "Copiado ✓" : label}
    </button>
  );
}

function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s)\]]+)/g).map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noreferrer" className="text-sky-300/80 underline decoration-sky-300/40 break-all hover:text-sky-200">
            {p}
          </a>
        ) : (
          p
        )
      )}
    </>
  );
}

export default function PublicScript({ script }: { script: PublicScriptData }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-5">
        <span className="font-cinzel font-semibold text-cream text-sm tracking-[.14em]">CODEX · VIRAL MIND</span>
        <span className="text-[11px] text-white/35">roteiro compartilhado — somente leitura</span>
      </div>

      <div
        className="rounded-[18px] border border-gold/30 overflow-hidden"
        style={{ background: "linear-gradient(180deg, rgba(201,163,92,.05), rgba(255,255,255,.02) 120px)" }}
      >
        <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3 border-b border-white/[.07] bg-black/20">
          <span className="kicker text-gold">ROTEIRO COMPLETO</span>
          <CopyBtn text={fullText(script)} label="Copiar tudo" />
        </div>

        {script.headline && (
          <section className="px-5 sm:px-6 pt-5 pb-5 border-b border-white/[.07]">
            <span className="kicker text-white/40">HEADLINE</span>
            <p className="font-cinzel text-base sm:text-lg font-semibold tracking-[.06em] leading-snug text-cream mt-3 uppercase">
              {script.headline}
            </p>
          </section>
        )}

        {script.hook && (
          <section className="px-5 sm:px-6 pt-5 pb-5 border-b border-white/[.07]">
            <span className="kicker text-white/40">HOOK</span>
            <p className="font-display text-xl sm:text-[23px] font-medium leading-[1.4] text-ivory mt-3">
              &ldquo;{script.hook}&rdquo;
            </p>
          </section>
        )}

        <section className="px-5 sm:px-6 pt-5 pb-5">
          <span className="kicker text-white/40">ROTEIRO</span>
          <p className="whitespace-pre-wrap text-[13.5px] leading-[1.75] text-[#ededf0]/80 mt-3">{script.roteiro}</p>
        </section>

        {script.comando && (
          <section className="px-5 sm:px-6 pt-5 pb-5">
            <span className="kicker text-white/40">COMANDO</span>
            <p className="text-[13.5px] leading-relaxed text-[#ededf0]/80 mt-3">&ldquo;{script.comando}&rdquo;</p>
          </section>
        )}

        {script.fontes && (
          <section className="px-5 sm:px-6 pt-4 pb-5 border-t border-white/[.07] bg-black/20">
            <span className="kicker text-white/40">FONTES</span>
            <p className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-white/50 mt-2.5">
              <Linkified text={script.fontes} />
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
