import Link from "next/link";
import { appDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

export default async function EnsinarPage() {
  const [{ data: lessons }, { data: learnings }] = await Promise.all([
    appDb
      .from("vm_lessons")
      .select("id, source_title, source_url, transcript, created_at, clientes(nome)")
      .order("created_at", { ascending: false })
      .limit(100),
    appDb.from("vm_lesson_learnings").select("lesson_id, active"),
  ]);

  const counts = new Map<string, { total: number; ativos: number }>();
  for (const l of learnings ?? []) {
    const c = counts.get(l.lesson_id) ?? { total: 0, ativos: 0 };
    c.total += 1;
    if (l.active) c.ativos += 1;
    counts.set(l.lesson_id, c);
  }

  return (
    <div className="max-w-[860px] mx-auto w-full px-4 sm:px-6 py-10">
      <div className="flex items-baseline gap-3.5 flex-wrap">
        <h1 className="font-display text-3xl sm:text-[34px] font-medium text-ivory">Ensinar</h1>
        <span className="text-[13px] text-white/40">
          aprendizados de virais analisados — os ativos influenciam a sala de agentes
        </span>
        <Link
          href="/ensinar/nova"
          className="btn-gold ml-auto inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="#161410" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Ensinar novo viral
        </Link>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        {(lessons ?? []).map((l) => {
          const client = Array.isArray(l.clientes) ? l.clientes[0] : l.clientes;
          const c = counts.get(l.id) ?? { total: 0, ativos: 0 };
          const titulo = l.source_title || l.transcript.slice(0, 90);
          return (
            <Link
              key={l.id}
              href={`/ensinar/${l.id}`}
              className="flex items-center gap-3 sm:gap-4 rounded-[14px] border border-white/[.08] bg-white/[.02] px-4 sm:px-5 py-3.5 hover:border-gold/40 transition-colors"
            >
              <span className="shrink-0 text-gold/70">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2 1.5 5 8 8l6.5-3L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  <path d="M4 6.5V11c0 .8 1.8 2 4 2s4-1.2 4-2V6.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </span>
              <span className="flex-1 min-w-0 truncate text-[13.5px] text-[#ededf0]/85">{titulo}</span>
              <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-[3px] text-[11px] text-white/55">
                {c.ativos}/{c.total} ativos
              </span>
              <span
                className={`hidden sm:inline-block shrink-0 rounded-full border px-2.5 py-[3px] text-[11.5px] ${
                  client
                    ? "border-indigo-500/35 text-indigo-300"
                    : "border-gold/30 text-gold/80"
                }`}
              >
                {client?.nome ?? "Global"}
              </span>
              <span className="hidden sm:block w-[60px] shrink-0 text-right font-mono text-[11.5px] text-white/35">
                {fmtWhen(l.created_at)}
              </span>
            </Link>
          );
        })}
        {!lessons?.length && (
          <p className="text-white/40 text-sm">
            Nenhuma lição ainda. Ensine o sistema com um vídeo viral ou roteiro campeão — os aprendizados aprovados
            passam a orientar os agentes nas próximas gerações.
          </p>
        )}
      </div>
    </div>
  );
}
