"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./logo";
import ReportProblem from "./report-problem";
import { BUILD_TAG } from "@/lib/version";

// Destinos principais — mesma fonte de verdade pro topo (desktop) e pra barra
// inferior (celular, alcance do polegar). No topo do celular só cabe a marca +
// ações; os 4 links em linha estouravam a largura e criavam scroll horizontal.
const DESTINOS = [
  {
    href: "/",
    label: "Criar",
    exact: true,
    icon: (
      <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
        <path d="M11 2.5 13.5 5M9.5 4 3 10.5 2.5 13.5 5.5 13 12 6.5 9.5 4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/sessions",
    label: "Sessões",
    icon: (
      <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
        <path d="M4 2h6l3 3v9H4V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M6.5 8h4M6.5 10.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/kasparov",
    label: "Kasparov",
    icon: (
      <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
        <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h7A2.5 2.5 0 0 1 14 5.5v3A2.5 2.5 0 0 1 11.5 11H6l-3 2.5V11h-.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M6 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/ensinar",
    label: "Ensinar",
    icon: (
      <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
        <path d="M8 2 1.5 5 8 8l6.5-3L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M4 6.5V11c0 .8 1.8 2 4 2s4-1.2 4-2V6.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    href: "/settings/clientes",
    label: "Clientes",
    match: "/settings",
    icon: (
      <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="2.6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2.8 14c.5-2.7 2.6-4.2 5.2-4.2s4.7 1.5 5.2 4.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

function useAtivo() {
  const pathname = usePathname();
  return (d: (typeof DESTINOS)[number]) =>
    "exact" in d && d.exact ? pathname === d.href : pathname.startsWith("match" in d ? d.match : d.href);
}

export default function Nav() {
  const pathname = usePathname();
  const ativo = useAtivo();
  // Rota pública de leitura não mostra a navegação interna do app.
  if (pathname.startsWith("/r/")) return null;

  return (
    <nav className="sticky top-0 z-30 h-[52px] flex items-center gap-5 sm:gap-7 border-b border-white/[.08] bg-[#0b0b0f]/95 backdrop-blur-sm px-4 sm:px-8 text-[13px]">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <Logo />
        <span className="font-cinzel font-semibold text-cream text-[11.5px] sm:text-sm tracking-[.14em] whitespace-nowrap">
          CODEX - VIRAL MIND
        </span>
      </Link>
      <span className="hidden sm:flex items-center gap-7">
        {DESTINOS.filter((d) => d.href !== "/").map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className={ativo(d) ? "text-gold font-medium" : "text-white/55 hover:text-white"}
          >
            {d.label}
          </Link>
        ))}
      </span>
      <span className="ml-auto flex items-center gap-4 sm:gap-5">
        <span className="hidden md:block font-mono text-[11px] text-white/35">
          escritório de roteiristas virais
        </span>
        <span className="hidden sm:block font-mono text-[10px] text-white/25" title="versão do sistema · git">
          {BUILD_TAG}
        </span>
        {pathname !== "/login" && <ReportProblem />}
        {pathname !== "/login" && (
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              aria-label="Sair"
              className="text-white/45 hover:text-white cursor-pointer p-1 -m-1"
            >
              <span className="hidden sm:inline">Sair</span>
              <svg className="sm:hidden" width="17" height="17" viewBox="0 0 16 16" fill="none">
                <path d="M6 2.5H3.5v11H6M9.5 5.5 12.5 8l-3 2.5M12.5 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        )}
      </span>
    </nav>
  );
}

// Barra de abas do celular. Fica DEPOIS do <main> no layout e usa `sticky bottom-0`:
// em fluxo ela reserva o próprio espaço (nada de padding mágico no main) e continua
// colada no rodapé da viewport enquanto a página rola.
export function MobileTabs() {
  const pathname = usePathname();
  const ativo = useAtivo();
  if (pathname.startsWith("/r/") || pathname === "/login") return null;

  return (
    <nav className="sm:hidden sticky bottom-0 z-30 grid grid-cols-5 border-t border-white/[.08] bg-[#0b0b0f]/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      {DESTINOS.map((d) => {
        const on = ativo(d);
        return (
          <Link
            key={d.href}
            href={d.href}
            aria-current={on ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[54px] ${
              on ? "text-gold" : "text-white/45"
            }`}
          >
            {d.icon}
            <span className="text-[10.5px] leading-none">{d.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
