import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appDb } from "@/lib/db";
import PublicScript from "@/components/public-script";

export const dynamic = "force-dynamic";

// Preview de compartilhamento (WhatsApp/OG): título "CODEX · HEADLINE · data",
// descrição começando pelo hook — pra deixar claro do que é o roteiro.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await appDb
    .from("vm_generated_scripts")
    .select("headline, hook, roteiro, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { title: "CODEX · Viral Mind" };

  const dataFmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data.created_at));
  const title = `CODEX · ${data.headline?.trim() || "Roteiro"} · ${dataFmt}`;
  const description = (data.hook?.trim() || data.roteiro.trim()).slice(0, 200);

  return {
    title,
    description,
    openGraph: { title, description, type: "article", siteName: "CODEX - Viral Mind" },
  };
}

// Página pública de leitura de um roteiro. Token = o próprio uuid do script (aleatório).
// Só lê colunas de apresentação; nenhuma server action é embarcada aqui → alterar é impossível.
export default async function PublicScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: script } = await appDb
    .from("vm_generated_scripts")
    .select("headline, hook, roteiro, comando, fontes")
    .eq("id", id)
    .maybeSingle();
  if (!script) notFound();

  return <PublicScript script={script} />;
}
