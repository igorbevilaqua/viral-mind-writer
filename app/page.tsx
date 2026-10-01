import { appDb } from "@/lib/db";
import HomeForm from "@/components/home-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: clients } = await appDb.from("clientes").select("id, nome").eq("ativo", true).order("nome");
  return (
    <div
      className="flex-1 flex flex-col items-center px-4 py-12 sm:py-16"
      style={{ background: "radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,163,92,.06), transparent)" }}
    >
      <div className="text-center">
        <div className="kicker text-gold tracking-[.22em]">ESCRITÓRIO DE ROTEIRISTAS VIRAIS</div>
        <h1 className="font-display text-4xl sm:text-[46px] font-medium leading-[1.15] text-ivory mt-3.5">
          O que vamos viralizar hoje?
        </h1>
        <p className="text-sm text-white/45 mt-3">Roteiros embasados em um corpus de 6 mil vídeos publicados.</p>
      </div>
      <HomeForm clients={clients ?? []} />
    </div>
  );
}
