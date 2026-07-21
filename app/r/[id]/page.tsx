import { notFound } from "next/navigation";
import { appDb } from "@/lib/db";
import PublicScript from "@/components/public-script";

export const dynamic = "force-dynamic";

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
