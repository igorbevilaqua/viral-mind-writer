import BulletsBoard from "@/components/bullets-board";
import { listBullets } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Ranking coletivo das palavras de alta carga emocional. O que passa de score 2 vira a
// PALETA EMOCIONAL do roteirista e do hook (lib/pipeline/agents.ts).
export default async function BulletsPage() {
  const bullets = await listBullets();
  return (
    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-6 py-10">
      <span className="kicker text-gold/70">PALETA EMOCIONAL</span>
      <div className="flex items-baseline gap-3.5 flex-wrap mt-1.5">
        <h1 className="font-display text-3xl sm:text-[34px] font-medium text-ivory">Bullets</h1>
        <span className="text-[13px] text-white/40">
          palavras de alta carga que o time curou por voto — as mais quentes entram no roteiro
        </span>
      </div>
      <BulletsBoard bullets={bullets} />
    </div>
  );
}
