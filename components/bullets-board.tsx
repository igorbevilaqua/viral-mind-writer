"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBullet, voteBullet, type BulletView } from "@/lib/actions";
import { SCORE_MINIMO } from "@/lib/bullets";

// Temperatura: frio → quente derivado do score. A escala satura em ~8 porque o score é
// pequeno por natureza (um voto por pessoa) — acima disso a cor não diria mais nada.
function temperatura(score: number): string {
  const t = Math.max(0, Math.min(1, (score + 2) / 10));
  return `hsl(${Math.round(212 - t * 200)} ${Math.round(45 + t * 35)}% ${Math.round(46 + t * 10)}%)`;
}

function Seta({ up }: { up?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d={up ? "M6 2.5 10.5 9h-9L6 2.5Z" : "M6 9.5 1.5 3h9L6 9.5Z"} />
    </svg>
  );
}

export default function BulletsBoard({ bullets }: { bullets: BulletView[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [termo, setTermo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  // Update otimista: a seta acende no clique, sem esperar o round-trip. useOptimistic
  // (e não estado próprio) porque ele volta sozinho ao dado do servidor quando a transição
  // termina — nada de override antigo mascarando o voto de outra pessoa.
  const [otimista, votarOtimista] = useOptimistic(bullets, (atual: BulletView[], v: { id: string; valor: 1 | -1 }) =>
    atual.map((b) => {
      if (b.id !== v.id) return b;
      const novo = b.meuVoto === v.valor ? 0 : v.valor; // mesmo sentido de novo = tira o voto
      return { ...b, meuVoto: novo, score: b.score - b.meuVoto + novo };
    })
  );

  const votar = (b: BulletView, valor: 1 | -1) => {
    startTransition(async () => {
      votarOtimista({ id: b.id, valor });
      await voteBullet(b.id, valor);
      router.refresh();
    });
  };

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault();
    const t = termo;
    setErro(null);
    startTransition(async () => {
      const r = await addBullet(t);
      if (r.erro) return setErro(r.erro);
      setTermo("");
      router.refresh();
    });
  };

  const lista = [...otimista].sort((a, b) => b.score - a.score || a.termo.localeCompare(b.termo));

  return (
    <>
      <form onSubmit={adicionar} className="mt-7 flex items-center gap-2 flex-wrap">
        <input
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setErro(null);
          }}
          placeholder="Perturbador, Manipulado, Desesperado…"
          className="flex-1 min-w-[200px] rounded-[10px] border border-white/12 bg-black/25 px-3.5 py-2.5 text-[13.5px] text-cream placeholder:text-white/25 focus:border-gold/45 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!termo.trim()}
          className="btn-gold rounded-[10px] px-4 py-2.5 text-[13px] font-semibold disabled:opacity-40"
        >
          Adicionar
        </button>
        {erro && <span className="w-full text-[12px] text-red-400/90">{erro}</span>}
      </form>

      <ul className="mt-6 divide-y divide-white/[.06] border-y border-white/[.06]">
        {lista.map((b) => {
          const { score, meuVoto } = b;
          return (
            <li key={b.id} className="flex items-center gap-3 py-2.5">
              <span className="flex flex-col leading-none">
                <button
                  type="button"
                  aria-label={`votar a favor de ${b.termo}`}
                  onClick={() => votar(b, 1)}
                  className={meuVoto === 1 ? "text-gold" : "text-white/25 hover:text-white/60"}
                >
                  <Seta up />
                </button>
                <button
                  type="button"
                  aria-label={`votar contra ${b.termo}`}
                  onClick={() => votar(b, -1)}
                  className={meuVoto === -1 ? "text-gold" : "text-white/25 hover:text-white/60"}
                >
                  <Seta />
                </button>
              </span>
              <span className="w-7 shrink-0 text-right font-mono text-[12.5px] text-white/60 tabular-nums">{score}</span>
              <span className="text-[14px] text-[#ededf0]/85">{b.termo}</span>
              {score < SCORE_MINIMO && (
                <span className="text-[11px] text-white/25">precisa de {SCORE_MINIMO - score} voto(s) pra entrar</span>
              )}
              <span
                className="ml-auto h-1.5 w-14 sm:w-24 shrink-0 rounded-full"
                title={`temperatura: score ${score}`}
                style={{ background: `linear-gradient(90deg, transparent, ${temperatura(score)})` }}
              />
            </li>
          );
        })}
        {!lista.length && (
          <li className="py-6 text-[13px] text-white/35">
            Nenhum bullet ainda. Adicione acima, ou favorite um trecho de roteiro pela estrela na sessão.
          </li>
        )}
      </ul>
    </>
  );
}
