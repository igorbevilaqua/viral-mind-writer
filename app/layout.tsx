import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cinzel, Cormorant_Garamond } from "next/font/google";
import Nav, { MobileTabs } from "@/components/nav";
import { BUILD_TAG } from "@/lib/version";
import { writerScope } from "@/lib/hub";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "600"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: `CODEX - Viral Mind · ${BUILD_TAG}`,
  description: "Escritório de roteiristas virais",
};

// viewportFit=cover + safe-area nas barras: no iPhone o app usa a tela toda sem
// esbarrar no notch/indicador. themeColor pinta a barra do navegador de preto.
export const viewport: Viewport = {
  themeColor: "#0b0b0f",
  colorScheme: "dark",
  viewportFit: "cover",
};

// Async por causa da engrenagem: só o adm a vê, e quem é adm só o servidor sabe. Todas as
// páginas já são force-dynamic, então isto não troca nada de estático por dinâmico.
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAdmin } = await writerScope();
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav admin={isAdmin} />
        <main className="flex-1 flex flex-col">{children}</main>
        <MobileTabs />
      </body>
    </html>
  );
}
