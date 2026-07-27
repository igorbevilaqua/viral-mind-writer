import Link from "next/link";
import { getNextCalibrationPair } from "@/lib/actions";
import CalibrationGame from "@/components/calibration-game";

export const dynamic = "force-dynamic";

export default async function CalibracaoPage() {
  // modo "geral": serve qualquer par pendente; a atribuição usa o cliente do próprio par
  const inicial = await getNextCalibrationPair(null);

  return (
    <div className="max-w-[720px] mx-auto w-full px-4 sm:px-6 py-10">
      <div className="flex items-baseline gap-3 flex-wrap">
        <Link href="/ensinar" className="text-[13px] text-white/45 hover:text-white/70">← Ensinar</Link>
      </div>
      <h1 className="mt-3 font-display text-3xl sm:text-[32px] font-medium text-ivory">Calibração de hooks</h1>
      <p className="mt-1.5 text-[13px] text-white/50">
        Escolha o hook mais forte em cada par. Suas escolhas viram preferência do time e passam a orientar o agente de
        hook e o Bob — a performance real dos vídeos ainda tem a palavra final.
      </p>
      <CalibrationGame inicial={inicial} />
    </div>
  );
}
