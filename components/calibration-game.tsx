"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submitCalibrationVote, requestMoreProbes, type CalibPairView } from "@/lib/actions";

// Calibração de hooks: comparação CEGA A vs B. Atalhos K/Z = A, L/X = B, espaço = pular.
// Gamificado: contador + streak. O sinal agregado (Wilson) alimenta a geração.
export default function CalibrationGame({ inicial }: { inicial: CalibPairView | null }) {
  const [par, setPar] = useState<CalibPairView | null>(inicial);
  const [contagem, setContagem] = useState(0);
  const [streak, setStreak] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [flash, setFlash] = useState<"a" | "b" | null>(null);
  const pediuProbes = useRef(false);

  // fila baixando → pede aprofundamentos em background (uma vez), sem travar o swipe
  useEffect(() => {
    if (par && par.restantes <= 3 && !pediuProbes.current) {
      pediuProbes.current = true;
      void requestMoreProbes();
    }
  }, [par]);

  const votar = useCallback(
    async (winner: "a" | "b" | "skip") => {
      if (ocupado || !par) return;
      setOcupado(true);
      if (winner !== "skip") setFlash(winner);
      try {
        const proximo = await submitCalibrationVote(par.id, winner, null);
        if (winner !== "skip") {
          setContagem((c) => c + 1);
          setStreak((s) => s + 1);
        } else setStreak(0);
        setPar(proximo);
      } finally {
        setOcupado(false);
        setTimeout(() => setFlash(null), 180);
      }
    },
    [ocupado, par]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "k" || k === "z") { e.preventDefault(); votar("a"); }
      else if (k === "l" || k === "x") { e.preventDefault(); votar("b"); }
      else if (k === " " || k === "s") { e.preventDefault(); votar("skip"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [votar]);

  if (!par) {
    return (
      <div className="mt-10 rounded-[16px] border border-white/10 bg-white/[.02] px-6 py-12 text-center">
        <p className="text-ivory text-lg font-display">Tudo calibrado por aqui 🎉</p>
        <p className="mt-2 text-[13px] text-white/50">
          Você votou em tudo que estava na fila. Gere mais roteiros (cada geração enfileira um par novo) e volte depois.
        </p>
        {contagem > 0 && <p className="mt-4 text-[13px] text-gold/80">{contagem} calibrações nesta sessão.</p>}
      </div>
    );
  }

  // render helper (não é componente — chamado direto, sem estado próprio)
  const card = (lado: "a" | "b", texto: string, teclas: string) => (
    <button
      onClick={() => votar(lado)}
      disabled={ocupado}
      className={`group flex-1 text-left rounded-[16px] border px-5 py-5 transition-all disabled:opacity-60 ${
        flash === lado ? "border-gold bg-gold/[.12]" : "border-white/12 bg-white/[.03] hover:border-gold/50 hover:bg-white/[.05]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[.18em] text-white/40">Opção {lado.toUpperCase()}</span>
        <span className="rounded-md border border-white/15 px-2 py-[2px] font-mono text-[11px] text-white/55">{teclas}</span>
      </div>
      <p className="mt-3 text-[15px] leading-snug text-[#ededf0]">{texto}</p>
    </button>
  );

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 text-[13px]">
        <span className="rounded-full border border-gold/30 px-3 py-1 text-gold/85">{contagem} calibrados</span>
        {streak >= 3 && <span className="rounded-full border border-amber-500/40 bg-amber-500/[.08] px-3 py-1 text-amber-300">🔥 {streak} seguidos</span>}
        <span className="ml-auto text-white/40">{par.restantes} na fila</span>
      </div>

      <p className="mt-6 text-center text-[15px] text-ivory font-display">Qual hook prende mais a atenção?</p>

      <div className="mt-5 flex flex-col sm:flex-row gap-4">
        {card("a", par.a, "K / Z")}
        {card("b", par.b, "L / X")}
      </div>

      <div className="mt-5 flex items-center justify-center">
        <button
          onClick={() => votar("skip")}
          disabled={ocupado}
          className="rounded-[10px] border border-white/12 px-4 py-2 text-[12.5px] text-white/55 hover:border-white/25 hover:text-white/75 disabled:opacity-60"
        >
          Pular (espaço) — não sei dizer
        </button>
      </div>
    </div>
  );
}
