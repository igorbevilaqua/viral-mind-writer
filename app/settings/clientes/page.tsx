import { appDb } from "@/lib/db";
import ClientPrefsEditor from "@/components/client-prefs-editor";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [{ data: clients }, { data: prefs }] = await Promise.all([
    appDb.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
    appDb.from("vm_client_preferences").select("*"),
  ]);

  const prefsByClient = new Map((prefs ?? []).map((p) => [p.client_id, p]));

  return (
    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-6 py-10">
      <div className="flex items-baseline gap-3.5 flex-wrap">
        <h1 className="font-display text-3xl sm:text-[34px] font-medium text-ivory">Preferências de cliente</h1>
        <span className="text-[13px] text-white/40">a voz de cada um, registrada</span>
      </div>
      <p className="text-[13px] text-white/45 mt-2">
        Tudo aqui entra como restrição inviolável nos roteiros gerados para o cliente. Uma linha por item nas listas.
      </p>
      <div className="space-y-2.5 mt-6">
        {(clients ?? []).map((c) => (
          <ClientPrefsEditor key={c.id} client={c} prefs={prefsByClient.get(c.id) ?? null} />
        ))}
        {!clients?.length && <p className="text-white/40 text-sm">Nenhum cliente cadastrado.</p>}
      </div>
    </div>
  );
}
