import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appDb } from "@/lib/db";
import { tituloPublico } from "@/lib/format";
import PublicScript from "@/components/public-script";

export const dynamic = "force-dynamic";

// O nome do cliente, quando a sessão tem um. Duas idas ao banco em vez de um embed do PostgREST,
// pelo mesmo motivo de lib/autorizacao.ts: join implícito que quebre em produção levaria a página
// pública inteira com ele, e aqui o nome é enfeite — a falta dele não pode custar o roteiro.
async function nomeDoCliente(clientId: string | null): Promise<string | null> {
  if (!clientId) return null;
  const { data } = await appDb.from("clientes").select("nome").eq("id", clientId).maybeSingle();
  return (data?.nome as string | undefined)?.trim() || null;
}

// Preview de compartilhamento (WhatsApp/OG): título "CODEX · CLIENTE · HEADLINE · data",
// descrição começando pelo hook — pra deixar claro de quem e do que é o roteiro.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await appDb
    .from("vm_generated_scripts")
    .select("headline, hook, roteiro, created_at, client_id")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { title: "CODEX · Viral Mind" };

  const dataFmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data.created_at));
  const title = tituloPublico({ cliente: await nomeDoCliente(data.client_id), headline: data.headline, data: dataFmt });
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
    .select("headline, hook, roteiro, comando, fontes, client_id")
    .eq("id", id)
    .maybeSingle();
  if (!script) notFound();

  return <PublicScript script={script} cliente={await nomeDoCliente(script.client_id)} />;
}
