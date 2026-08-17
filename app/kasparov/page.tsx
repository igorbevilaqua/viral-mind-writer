import { appDb } from "@/lib/db";
import KasparovChat from "@/components/kasparov-chat";

export const dynamic = "force-dynamic";

// A thread nasce na primeira mensagem (a rota cria), então esta página não carrega nada além
// da lista de clientes: o contexto do turno é o estado do sistema, não o histórico (018 §4).
export default async function KasparovPage() {
  const { data: clients } = await appDb.from("clientes").select("id, nome").eq("ativo", true).order("nome");
  return <KasparovChat clients={clients ?? []} />;
}
