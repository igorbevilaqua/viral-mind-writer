"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./logo";

export default function Nav() {
  const pathname = usePathname();
  const linkCls = (active: boolean) =>
    active ? "text-gold font-medium" : "text-white/55 hover:text-white";

  return (
    <nav className="flex items-center gap-5 sm:gap-7 border-b border-white/[.08] px-5 sm:px-8 py-3 text-[13px]">
      <Link href="/" className="flex items-center gap-2.5">
        <Logo />
        <span className="font-cinzel font-semibold text-cream text-[13px] sm:text-sm tracking-[.14em]">
          VIRAL MIND
        </span>
      </Link>
      <Link href="/sessions" className={linkCls(pathname.startsWith("/sessions"))}>
        Sessões
      </Link>
      <Link href="/ensinar" className={linkCls(pathname.startsWith("/ensinar"))}>
        Ensinar
      </Link>
      <Link href="/settings/clientes" className={linkCls(pathname.startsWith("/settings"))}>
        Clientes
      </Link>
      <span className="ml-auto flex items-center gap-5">
        <span className="hidden md:block font-mono text-[11px] text-white/35">
          escritório de roteiristas virais
        </span>
        {pathname !== "/login" && (
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-white/45 hover:text-white cursor-pointer">
              Sair
            </button>
          </form>
        )}
      </span>
    </nav>
  );
}
