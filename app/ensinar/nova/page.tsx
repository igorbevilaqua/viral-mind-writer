import { appDb } from "@/lib/db";
import TeachForm from "@/components/teach-form";

export const dynamic = "force-dynamic";

export default async function NovaLicaoPage() {
  const { data: clients } = await appDb.from("clientes").select("id, nome").eq("ativo", true).order("nome");
  return (
    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-6 py-10">
      <div className="kicker text-gold tracking-[.22em]">ENSINAR</div>
      <h1 className="font-display text-3xl sm:text-[34px] font-medium leading-[1.2] text-ivory mt-2">
        O que a sala deve aprender?
      </h1>
      <p className="text-sm text-white/45 mt-2.5 max-w-xl">
        Cole um vídeo viral ou um roteiro campeão. O Professor extrai os aprendizados, você revisa, e os aprovados
        passam a orientar os agentes nas próximas gerações.
      </p>
      <TeachForm clients={clients ?? []} />
    </div>
  );
}
