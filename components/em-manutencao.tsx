import Link from "next/link";
import { RECADO_MANUTENCAO } from "@/lib/generation";

/** A tela que responde no lugar de uma área desligada. Server component: não custa JS. */
export default function EmManutencao({ area }: { area: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
      <svg width="34" height="34" viewBox="0 0 16 16" fill="none" className="text-gold/70">
        <path d="M8 1.8 14.6 13.4H1.4L8 1.8Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M8 6.2v3.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="11.3" r=".75" fill="currentColor" />
      </svg>
      <h1 className="font-display text-[26px] text-ivory mt-5">{area} em manutenção</h1>
      <p className="text-[14px] text-white/45 mt-2.5 max-w-sm leading-relaxed">{RECADO_MANUTENCAO}</p>
      <Link
        href="/"
        className="mt-7 rounded-[10px] border border-gold/35 bg-gold/[.06] px-4 py-2.5 text-[13px] text-gold hover:bg-gold/[.12] transition-colors"
      >
        Voltar para o Criar
      </Link>
    </div>
  );
}
